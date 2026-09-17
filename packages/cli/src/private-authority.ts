/**
 * Private filesystem authority.
 *
 * The CLI keeps its transaction substrate — capability probes, staging and the transaction
 * journal — in a reserved private area under the target root. That area is *not* protected by the
 * kernel traversal chain, which only covers the final admitted artifact, so this module makes the
 * private area safe on its own terms:
 *
 *   - every private path is proven lexically contained under the admitted target root;
 *   - every existing ancestor between the root and the candidate is proven not to be a
 *     symlink/reparse point, and the deepest existing ancestor is proven *physically* contained
 *     once resolved, so a user-controlled alias cannot redirect a private effect outside the
 *     target;
 *   - directories are created level by level with non-recursive `mkdir`, so the invocation knows
 *     exactly which levels it created;
 *   - removal revalidates the recorded identity at the destructive point, so a path swapped to an
 *     alias after ownership was established is never followed;
 *   - removal is non-recursive, so a directory that contains anything this invocation did not put
 *     there is left in place rather than deleted.
 */

import { randomBytes } from "node:crypto";
import { lstat, mkdir, realpath, rm, rmdir } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export const PRIVATE_DIRECTORY = ".gef-private";
export const PROBE_DIRECTORY = "probes";
export const JOURNAL_SUBDIRECTORY = "journal";

const MAX_ALIAS_DEPTH = 64;
const PROBE_ATTEMPTS = 8;

export type PrivateAuthorityReason =
  | "NOT_CONTAINED"
  | "ALIAS_ANCESTOR"
  | "PHYSICAL_ESCAPE"
  | "NOT_A_DIRECTORY"
  | "IDENTITY_CHANGED"
  | "UNAVAILABLE";

export class PrivateAuthorityError extends Error {
  readonly reason: PrivateAuthorityReason;
  constructor(reason: PrivateAuthorityReason, detail: string) {
    super(`Private authority refused (${reason}): ${detail}`);
    this.name = "PrivateAuthorityError";
    this.reason = reason;
  }
}

interface EntryIdentity {
  readonly token: string;
  readonly symbolicLink: boolean;
  readonly directory: boolean;
}

function errorCode(cause: unknown): string {
  return cause !== null && typeof cause === "object" && "code" in cause ? String((cause as { readonly code: unknown }).code) : "";
}

async function identityOf(path: string): Promise<EntryIdentity | undefined> {
  try {
    const info = await lstat(path);
    return { token: `${String(info.dev)}:${String(info.ino)}`, symbolicLink: info.isSymbolicLink(), directory: info.isDirectory() };
  } catch (cause: unknown) {
    if (errorCode(cause) === "ENOENT") return undefined;
    throw cause;
  }
}

/** Lexically contained: the candidate is strictly inside the root, with no `..` escape. */
export function isLexicallyContained(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel.length > 0 && !rel.startsWith("..") && !isAbsolute(rel);
}

/** Flip the case of the basename. Returns the input unchanged when it has no cased letter. */
function flipBasename(path: string): string {
  const parent = dirname(path);
  const base = path.slice(parent.length + 1);
  let flipped = "";
  for (const character of base) {
    const lower = character.toLowerCase();
    const upper = character.toUpperCase();
    flipped += character === lower && lower !== upper ? upper : lower;
  }
  return flipped === base ? path : join(parent, flipped);
}

export interface OwnedDirectory {
  readonly path: string;
  readonly identity: string;
}

export interface PrivateArea {
  /** Absolute target root this authority is bound to. */
  readonly targetRoot: string;
  /** Proves containment and alias-freedom for the segments without creating anything. */
  assertContainment(segments: readonly string[]): Promise<void>;
  /** Creates an invocation-owned probe directory under `<private>/probes`. */
  createOwnedProbeDirectory(): Promise<OwnedDirectory>;
  /** Ensures and returns the staging directory for a transaction. */
  ensureStagingDirectory(transactionId: string): Promise<string>;
  /** Ensures and returns the journal file path for a transaction. */
  ensureJournalFile(transactionId: string): Promise<string>;
  /** Removes an owned directory after revalidating its identity; never follows an alias. */
  releaseOwnedDirectory(owned: OwnedDirectory, files: readonly string[]): Promise<boolean>;
  /** Removes a staging directory (and the named files inside it) after revalidating identity. */
  releaseStagingDirectory(transactionId: string, files: readonly string[]): Promise<boolean>;
}

export function safeSegment(identifier: string): string {
  return identifier.replace(/[^A-Za-z0-9._-]/g, "_");
}

export function createPrivateArea(targetRoot: string): PrivateArea {
  const root = resolve(targetRoot);
  let realRootCache: string | undefined;
  const created = new Set<string>();

  const realRoot = async (): Promise<string> => {
    if (realRootCache !== undefined) return realRootCache;
    try {
      realRootCache = await realpath(root);
    } catch (cause: unknown) {
      if (errorCode(cause) === "ENOENT") throw new PrivateAuthorityError("UNAVAILABLE", "target root does not exist");
      throw cause;
    }
    return realRootCache;
  };

  /**
   * Walk the path from the root down, rejecting any existing symlink/reparse ancestor, then prove
   * the deepest existing ancestor is physically inside the resolved root.
   */
  const assertContainment = async (segments: readonly string[]): Promise<void> => {
    const candidate = resolve(root, ...segments);
    if (!isLexicallyContained(root, candidate)) {
      throw new PrivateAuthorityError("NOT_CONTAINED", `${candidate} escapes ${root}`);
    }
    const baseline = await realRoot();
    let current = root;
    let deepestExisting = root;
    for (let index = 0; index < segments.length && index < MAX_ALIAS_DEPTH; index += 1) {
      const segment = segments[index];
      if (segment === undefined) break;
      current = join(current, segment);
      const identity = await identityOf(current);
      if (identity === undefined) break;
      if (identity.symbolicLink) {
        throw new PrivateAuthorityError("ALIAS_ANCESTOR", `${current} is a symlink or reparse point`);
      }
      deepestExisting = current;
    }
    let realDeepest: string;
    try {
      realDeepest = await realpath(deepestExisting);
    } catch (cause: unknown) {
      throw new PrivateAuthorityError("UNAVAILABLE", `cannot resolve ${deepestExisting}: ${errorCode(cause) || "UNKNOWN"}`);
    }
    if (realDeepest !== baseline && !isLexicallyContained(baseline, realDeepest)) {
      throw new PrivateAuthorityError("PHYSICAL_ESCAPE", `${realDeepest} resolves outside ${baseline}`);
    }
  };

  /** Create the chain level by level, recording exactly which levels this invocation created. */
  const ensureChain = async (segments: readonly string[]): Promise<string> => {
    await assertContainment(segments);
    let current = root;
    for (const segment of segments) {
      current = join(current, segment);
      const identity = await identityOf(current);
      if (identity !== undefined) {
        if (identity.symbolicLink) throw new PrivateAuthorityError("ALIAS_ANCESTOR", `${current} is a symlink or reparse point`);
        // An occupied name in the reserved private namespace is a conflict, not something to write
        // through: the invocation refuses rather than degrading silently.
        if (!identity.directory) throw new PrivateAuthorityError("NOT_A_DIRECTORY", `${current} is not a directory`);
        continue;
      }
      try {
        await mkdir(current);
        created.add(current);
      } catch (cause: unknown) {
        // A concurrent creator is acceptable only if the result is a real directory we can re-check.
        if (errorCode(cause) !== "EEXIST") throw cause;
        const recheck = await identityOf(current);
        if (recheck === undefined || recheck.symbolicLink) throw new PrivateAuthorityError("ALIAS_ANCESTOR", `${current} appeared as an alias`);
      }
    }
    await assertContainment(segments);
    return current;
  };

  /** Remove the parent chain of a path while it is empty and this invocation created it. */
  const pruneCreatedAncestors = async (from: string): Promise<void> => {
    let current = dirname(from);
    while (created.has(current)) {
      try {
        await rmdir(current);
      } catch {
        // Not empty, or no longer removable: leave it rather than deleting foreign content.
        break;
      }
      created.delete(current);
      const parent = dirname(current);
      if (parent === current || !isLexicallyContained(root, current)) break;
      current = parent;
    }
  };

  const removeOwned = async (directory: OwnedDirectory, files: readonly string[]): Promise<boolean> => {
    const current = await identityOf(directory.path);
    if (current === undefined) return true;
    // Identity revalidation at the destructive point: a path swapped to an alias after ownership
    // was established must never be followed or removed.
    if (current.symbolicLink || current.token !== directory.identity) return false;
    for (const file of files) {
      const entry = await identityOf(join(directory.path, file));
      if (entry === undefined) continue;
      if (entry.symbolicLink) continue;
      await rm(join(directory.path, file), { force: true }).catch(() => undefined);
    }
    try {
      await rmdir(directory.path);
    } catch {
      return false;
    }
    created.delete(directory.path);
    await pruneCreatedAncestors(directory.path);
    return true;
  };

  return {
    targetRoot: root,
    assertContainment,

    async createOwnedProbeDirectory(): Promise<OwnedDirectory> {
      const probesRoot = await ensureChain([PRIVATE_DIRECTORY, PROBE_DIRECTORY]);
      for (let attempt = 0; attempt < PROBE_ATTEMPTS; attempt += 1) {
        const candidate = join(probesRoot, `probe-${randomBytes(12).toString("hex")}`);
        try {
          await mkdir(candidate);
        } catch (cause: unknown) {
          if (errorCode(cause) === "EEXIST") continue;
          throw new PrivateAuthorityError("UNAVAILABLE", `probe identity unavailable: ${errorCode(cause) || "UNKNOWN"}`);
        }
        created.add(candidate);
        const identity = await identityOf(candidate);
        if (identity === undefined || identity.symbolicLink) throw new PrivateAuthorityError("UNAVAILABLE", "probe identity could not be recorded");
        return { path: candidate, identity: identity.token };
      }
      throw new PrivateAuthorityError("UNAVAILABLE", "exhausted probe identity attempts");
    },

    async ensureStagingDirectory(transactionId: string): Promise<string> {
      return ensureChain([PRIVATE_DIRECTORY, safeSegment(transactionId)]);
    },

    async ensureJournalFile(transactionId: string): Promise<string> {
      const journalRoot = await ensureChain([PRIVATE_DIRECTORY, JOURNAL_SUBDIRECTORY]);
      return join(journalRoot, `${safeSegment(transactionId)}.json`);
    },

    releaseOwnedDirectory: removeOwned,

    async releaseStagingDirectory(transactionId: string, files: readonly string[]): Promise<boolean> {
      const path = join(root, PRIVATE_DIRECTORY, safeSegment(transactionId));
      const identity = await identityOf(path);
      if (identity === undefined) return true;
      if (identity.symbolicLink) return false;
      return removeOwned({ path, identity: identity.token }, files);
    },
  };
}

/**
 * Read-only case-semantics measurement.
 *
 * Compares the identity of an existing path with the identity of its case-flipped sibling. Nothing
 * is created, so the measurement cannot produce a project-visible effect — which matters because it
 * runs before the transaction authorization gate. Ambiguity fails closed as `UNKNOWN`.
 */
export async function measureCaseSemantics(targetRoot: string): Promise<"SENSITIVE" | "INSENSITIVE" | "UNKNOWN"> {
  let current = resolve(targetRoot);
  for (let depth = 0; depth < MAX_ALIAS_DEPTH; depth += 1) {
    const flipped = flipBasename(current);
    if (flipped !== current) {
      const original = await identityOf(current);
      let alternative: EntryIdentity | undefined;
      try {
        alternative = await identityOf(flipped);
      } catch {
        return "UNKNOWN";
      }
      if (original !== undefined && alternative === undefined) return "SENSITIVE";
      if (original !== undefined && alternative !== undefined) {
        return original.token === alternative.token ? "INSENSITIVE" : "UNKNOWN";
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return "UNKNOWN";
}
