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
import { lstat, mkdir, open, readFile, realpath, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export const PRIVATE_DIRECTORY = ".gef-private";
/**
 * Ownership marker written inside every directory this invocation creates.
 *
 * `dev:ino` alone is not a reliable ownership proof: on Linux a removed directory or file can have
 * its inode number reused immediately by a replacement, so a token comparison can pass for an
 * object this invocation did not create. The marker carries a random token that a replacement
 * cannot reproduce, which makes the ownership proof independent of inode reuse.
 */
export const OWNER_MARKER = ".gef-owner";
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
  /** The ownership marker this invocation wrote, when it created the directory. */
  readonly marker?: OwnedFile;
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

/**
 * A journal file claimed exclusively by this invocation.
 *
 * The open handle keeps the original inode allocated, which is what makes replacement detection
 * reliable: an unlinked-but-open inode cannot be reused, so the path entry can only still match the
 * handle while it really refers to this file.
 */
export interface OwnedJournal {
  readonly file: OwnedFile;
  /** Writes the body to the owned file, refusing when the path no longer refers to it. */
  write(body: string): Promise<WriteReport>;
  close(): Promise<void>;
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
  claimJournalFile(transactionId: string): Promise<OwnedJournal>;
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
  /** Path -> ownership record, kept only for directories this invocation created. */
  const created = new Map<string, { identity: string; marker: OwnedFile }>();

  /** Write the ownership marker into a directory this invocation just created. */
  const writeMarker = async (directory: string): Promise<OwnedFile> => {
    const path = join(directory, OWNER_MARKER);
    const token = randomBytes(16).toString("hex");
    await writeFile(path, token, { flag: "wx" });
    const owned = await captureOwnedFile(path, fingerprintOf(token));
    if (owned === undefined) throw new PrivateAuthorityError("UNAVAILABLE", `ownership marker could not be recorded in ${directory}`);
    return owned;
  };

  /** Verify that a directory still carries the ownership marker this invocation wrote. */
  const markerIntact = async (marker: OwnedFile): Promise<boolean> => {
    const identity = await identityOf(marker.path);
    if (identity === undefined || identity.symbolicLink || identity.directory || identity.token !== marker.identity) return false;
    return (await contentFingerprint(marker.path)) === marker.fingerprint;
  };

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
      created.set(current, { identity: recheck.token, marker: await writeMarker(current) });
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
      // The directory must still be the exact object this invocation created. The identity token
      // catches alias and ordinary-directory replacement, and the marker catches a replacement that
      // reused the same inode number, which Linux does readily.
      if (identity === undefined || identity.symbolicLink || identity.token !== recorded.identity) return;
      if (!(await markerIntact(recorded.marker))) return;
      await rm(recorded.marker.path, { force: true }).catch(() => undefined);
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
      // revalidates each recorded identity and marker so a swapped ancestor is never removed.
      await pruneCreatedAncestors(owned.path);
      return { removed: false, refusals: [] };
    }
    if (directoryIdentity.symbolicLink || directoryIdentity.token !== owned.identity) {
      return { removed: false, refusals: ["DIRECTORY_IDENTITY_CHANGED"] };
    }
    if (owned.marker === undefined || !(await markerIntact(owned.marker))) {
      // The identity matched but the ownership marker did not: the inode number was reused by a
      // replacement, or the marker was removed. Nothing is deleted.
      return { removed: false, refusals: ["DIRECTORY_OWNERSHIP_LOST"] };
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
    await rm(owned.marker.path, { force: true }).catch(() => undefined);
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
        const marker = await writeMarker(candidate);
        created.set(candidate, { identity: identity.token, marker });
        return { path: candidate, identity: identity.token, owned: true, marker };
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
      const record = created.get(path);
      return record === undefined
        ? { path, identity: identity.token, owned: false }
        : { path, identity: identity.token, owned: true, marker: record.marker };
    },

    async claimJournalFile(transactionId: string): Promise<OwnedJournal> {
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
      const info = await handle.stat();
      const file: OwnedFile = { path, identity: `${String(info.dev)}:${String(info.ino)}`, fingerprint: "" };
      return {
        file,
        async write(body: string): Promise<WriteReport> {
          // The open handle keeps this inode allocated, so the path entry can only still match the
          // handle while it really refers to this file. A replacement therefore cannot reuse the
          // inode number and is always detected.
          const entry = await identityOf(file.path);
          const descriptor = await handle.stat().catch(() => undefined);
          if (descriptor === undefined) return { ok: false, detail: "HANDLE_LOST" };
          const descriptorToken = `${String(descriptor.dev)}:${String(descriptor.ino)}`;
          if (entry === undefined || entry.symbolicLink || entry.token !== descriptorToken) {
            return { ok: false, detail: "IDENTITY_CHANGED" };
          }
          try {
            await handle.truncate(0);
            await handle.write(body, 0, "utf8");
          } catch (cause: unknown) {
            return { ok: false, detail: `WRITE_FAILED:${errorCode(cause) || "UNKNOWN"}` };
          }
          return { ok: true };
        },
        async close(): Promise<void> {
          await handle.close().catch(() => undefined);
        },
      };
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
