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
 *     once resolved, so a user-controlled alias cannot redirect a private effect outside the target;
 *   - directories are created level by level with non-recursive `mkdir`, so the invocation knows
 *     exactly which levels it created;
 *   - **ownership is recorded at creation time and never inferred at removal time**: a directory or
 *     file carries the identity token it had when this invocation created it, and every removal
 *     revalidates that token before touching the entry;
 *   - a pre-existing directory or file is never claimed, never removed and never overwritten, even
 *     when it is empty;
 *   - removal is non-recursive, so a directory containing anything this invocation did not put
 *     there is left in place rather than deleted.
 *
 * Identity is `dev:ino`, so an *ordinary* directory swapped in at the same path is detected exactly
 * like a symlink or reparse point replacement: the token differs and the entry is left untouched.
 */

import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";
import { lstat, mkdir, open, readFile, realpath, rm, rmdir } from "node:fs/promises";
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
  | "ALREADY_PRESENT"
  | "IDENTITY_CHANGED"
  | "NOT_EMPTY"
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

/** A directory whose creation-time identity this invocation recorded. */
export interface OwnedDirectory {
  readonly path: string;
  /** `dev:ino` observed immediately after creation. */
  readonly identity: string;
  /** True only when this invocation created the directory; a pre-existing directory is never owned. */
  readonly owned: boolean;
}

/** A file whose creation-time identity and content fingerprint this invocation recorded. */
export interface OwnedFile {
  readonly path: string;
  readonly identity: string;
  readonly fingerprint: string;
}

export interface RemovalReport {
  readonly removed: boolean;
  readonly refusals: readonly string[];
}

export interface WriteReport {
  readonly ok: boolean;
  readonly detail?: string;
}

export interface PrivateArea {
  /** Absolute target root this authority is bound to. */
  readonly targetRoot: string;
  /** Proves containment and alias-freedom for the segments without creating anything. */
  assertContainment(segments: readonly string[]): Promise<void>;
  /** Creates an invocation-owned probe directory under `<private>/probes`. */
  createOwnedProbeDirectory(): Promise<OwnedDirectory>;
  /** Claims the staging directory for a transaction, recording whether this invocation created it. */
  claimStagingDirectory(transactionId: string): Promise<OwnedDirectory>;
  /** Exclusively creates the journal file for a transaction. Fails closed if the path exists. */
  claimJournalFile(transactionId: string): Promise<OwnedFile>;
  /** Rewrites an owned file through an identity-verified handle. Never follows a replacement. */
  writeOwnedFile(owned: OwnedFile, body: string): Promise<WriteReport>;
  /** Records ownership of a file this invocation just created. */
  captureOwnedFile(path: string, fingerprint: string): Promise<OwnedFile | undefined>;
  /** Removes an owned directory and its owned files after revalidating every identity. */
  releaseOwnedDirectory(owned: OwnedDirectory, files: readonly OwnedFile[]): Promise<RemovalReport>;
}

export function safeSegment(identifier: string): string {
  return identifier.replace(/[^A-Za-z0-9._-]/g, "_");
}

export function fingerprintOf(body: string | Uint8Array): string {
  return createHash("sha256").update(body).digest("hex");
}

async function contentFingerprint(path: string): Promise<string | undefined> {
  try {
    return fingerprintOf(await readFile(path));
  } catch {
    return undefined;
  }
}

export function createPrivateArea(targetRoot: string): PrivateArea {
  const root = resolve(targetRoot);
  let realRootCache: string | undefined;
  /** Path -> identity token, recorded only for directories this invocation created. */
  const created = new Map<string, string>();

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
      if (identity.symbolicLink) throw new PrivateAuthorityError("ALIAS_ANCESTOR", `${current} is a symlink or reparse point`);
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

  /** Create the chain level by level, recording the identity of exactly the levels we created. */
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
      } catch (cause: unknown) {
        if (errorCode(cause) !== "EEXIST") throw cause;
      }
      const recheck = await identityOf(current);
      if (recheck === undefined || recheck.symbolicLink || !recheck.directory) {
        throw new PrivateAuthorityError("ALIAS_ANCESTOR", `${current} appeared as an alias or non-directory`);
      }
      created.set(current, recheck.token);
    }
    await assertContainment(segments);
    return current;
  };

  /** Remove the parent chain of a path while it is still the exact directory we created. */
  const pruneCreatedAncestors = async (from: string): Promise<void> => {
    let current = dirname(from);
    for (;;) {
      const recorded = created.get(current);
      if (recorded === undefined) return;
      const identity = await identityOf(current);
      // The directory must still be the exact object this invocation created. A token mismatch
      // means an ordinary-directory or alias replacement, so it is left untouched.
      if (identity === undefined || identity.symbolicLink || identity.token !== recorded) return;
      try {
        await rmdir(current);
      } catch {
        return;
      }
      created.delete(current);
      const parent = dirname(current);
      if (parent === current || !isLexicallyContained(root, current)) return;
      current = parent;
    }
  };

  const captureOwnedFile = async (path: string, fingerprint: string): Promise<OwnedFile | undefined> => {
    const identity = await identityOf(path);
    if (identity === undefined || identity.symbolicLink || identity.directory) return undefined;
    return { path, identity: identity.token, fingerprint };
  };

  const releaseOwnedDirectory = async (owned: OwnedDirectory, files: readonly OwnedFile[]): Promise<RemovalReport> => {
    const refusals: string[] = [];
    if (!owned.owned) {
      // A directory this invocation did not create is never removed, even when empty.
      return { removed: false, refusals: ["PREEXISTING_DIRECTORY"] };
    }
    const directoryIdentity = await identityOf(owned.path);
    if (directoryIdentity === undefined) {
      // The directory is already gone; its created ancestors are still pruned, and the prune
      // revalidates each recorded identity so a swapped ancestor is never removed.
      await pruneCreatedAncestors(owned.path);
      return { removed: false, refusals: [] };
    }
    if (directoryIdentity.symbolicLink || directoryIdentity.token !== owned.identity) {
      return { removed: false, refusals: ["DIRECTORY_IDENTITY_CHANGED"] };
    }
    for (const file of files) {
      const identity = await identityOf(file.path);
      if (identity === undefined) continue;
      if (identity.symbolicLink || identity.directory || identity.token !== file.identity) {
        refusals.push(`FILE_IDENTITY_CHANGED:${file.path}`);
        continue;
      }
      if (file.fingerprint.length > 0) {
        const observed = await contentFingerprint(file.path);
        if (observed !== file.fingerprint) {
          refusals.push(`FILE_CONTENT_CHANGED:${file.path}`);
          continue;
        }
      }
      await rm(file.path, { force: true }).catch(() => {
        refusals.push(`FILE_REMOVE_FAILED:${file.path}`);
      });
    }
    try {
      await rmdir(owned.path);
    } catch {
      return { removed: false, refusals: [...refusals, "DIRECTORY_NOT_EMPTY"] };
    }
    created.delete(owned.path);
    await pruneCreatedAncestors(owned.path);
    return { removed: true, refusals };
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
        const identity = await identityOf(candidate);
        if (identity === undefined || identity.symbolicLink || !identity.directory) {
          throw new PrivateAuthorityError("UNAVAILABLE", "probe identity could not be recorded");
        }
        created.set(candidate, identity.token);
        return { path: candidate, identity: identity.token, owned: true };
      }
      throw new PrivateAuthorityError("UNAVAILABLE", "exhausted probe identity attempts");
    },

    async claimStagingDirectory(transactionId: string): Promise<OwnedDirectory> {
      const path = join(root, PRIVATE_DIRECTORY, safeSegment(transactionId));
      const existing = await identityOf(path);
      if (existing !== undefined) {
        // A pre-existing staging path is usable, but never owned and therefore never removable.
        if (existing.symbolicLink) throw new PrivateAuthorityError("ALIAS_ANCESTOR", `${path} is a symlink or reparse point`);
        if (!existing.directory) throw new PrivateAuthorityError("NOT_A_DIRECTORY", `${path} is not a directory`);
        return { path, identity: existing.token, owned: false };
      }
      await ensureChain([PRIVATE_DIRECTORY, safeSegment(transactionId)]);
      const identity = await identityOf(path);
      if (identity === undefined || identity.symbolicLink || !identity.directory) {
        throw new PrivateAuthorityError("UNAVAILABLE", "staging identity could not be recorded");
      }
      return { path, identity: identity.token, owned: created.has(path) };
    },

    async claimJournalFile(transactionId: string): Promise<OwnedFile> {
      const journalRoot = await ensureChain([PRIVATE_DIRECTORY, JOURNAL_SUBDIRECTORY]);
      const path = join(journalRoot, `${safeSegment(transactionId)}.json`);
      let handle;
      try {
        // Exclusive creation: an existing file, including a symlink to one, fails closed without a
        // byte being changed.
        handle = await open(path, "wx");
      } catch (cause: unknown) {
        const code = errorCode(cause);
        if (code === "EEXIST") throw new PrivateAuthorityError("ALREADY_PRESENT", `journal file already exists at ${path}`);
        throw new PrivateAuthorityError("UNAVAILABLE", `journal file could not be created: ${code || "UNKNOWN"}`);
      }
      try {
        const info = await handle.stat();
        return { path, identity: `${String(info.dev)}:${String(info.ino)}`, fingerprint: "" };
      } finally {
        await handle.close();
      }
    },

    async writeOwnedFile(owned: OwnedFile, body: string): Promise<WriteReport> {
      let handle;
      try {
        // `r+` never creates, and the handle is bound to an inode, so a path swapped after the open
        // cannot redirect the write that follows.
        handle = await open(owned.path, "r+");
      } catch (cause: unknown) {
        return { ok: false, detail: `OPEN_FAILED:${errorCode(cause) || "UNKNOWN"}` };
      }
      try {
        const before = await handle.stat();
        if (`${String(before.dev)}:${String(before.ino)}` !== owned.identity) {
          return { ok: false, detail: "IDENTITY_CHANGED" };
        }
        await handle.truncate(0);
        await handle.write(body, 0, "utf8");
        const after = await handle.stat();
        if (`${String(after.dev)}:${String(after.ino)}` !== owned.identity) {
          return { ok: false, detail: "IDENTITY_CHANGED_AFTER_WRITE" };
        }
        return { ok: true };
      } catch (cause: unknown) {
        return { ok: false, detail: `WRITE_FAILED:${errorCode(cause) || "UNKNOWN"}` };
      } finally {
        await handle.close().catch(() => undefined);
      }
    },

    captureOwnedFile,
    releaseOwnedDirectory,
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
