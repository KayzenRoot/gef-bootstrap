/**
 * Bounded V1.1 CLI command registrations and engine delegation.
 *
 * The CLI is transport only. Every handler composes verified V1 engines and returns their
 * payload; no business policy is implemented here.
 *
 * Delegation map (frozen by `.engineering/releases/V1.1-CLI-DISTRIBUTION-ARCHITECTURE.md`):
 *   gef init   -> installPlan, repositoryState, githubBootstrap, detectDrift, resolveCanonical
 *   gef adopt  -> detectDrift, resolveCanonical, backupManifest, recoveryPlan, installPlan
 *   both       -> the kernel transaction engine for every managed filesystem effect
 *
 * The V1 domain engines are untyped `.mjs`/`.js` modules. They are reached through the loader
 * below, which resolves a declared candidate order and verifies the expected exports are
 * callable before use. A missing or malformed engine fails closed as a CAPABILITY error.
 *
 * Constraint C5: colliding exports are bound by explicit module ownership. `compatibility`,
 * `redactSecrets` and the path-containment helpers are never consumed, and `digest` is never
 * imported from an engine — node:crypto is used directly.
 * Constraint C3: the implemented package layout at the base is used as-is.
 */

import { createHash } from "node:crypto";
import { closeSync, fstatSync, lstatSync, openSync, readSync, readdirSync, realpathSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import type { GefError, HandlerOutcome } from "@gef-bootstrap/contracts";
import { CommandRegistry, createGefError } from "@gef-bootstrap/kernel";
import type { CommandRegistration, ExecutionContext } from "@gef-bootstrap/kernel";

import { CLI_CONTRACT_VERSION } from "./parser.js";
import { buildStateDocument, requireSupportedSchemaVersion, UnsupportedDocumentVersionError } from "./schemas.js";
import { applyGovernedCreate } from "./transaction.js";

// The verified engine boundary lives in its own module so the command registry and the
// transaction driver can both use it without a circular import.
export * from "./engines.js";
import { EngineUnavailableError, loadEngines } from "./engines.js";
import type {
  CanonicalResolutionResult,
  CanonicalSourceInput,
  DriftResult,
  Engines,
  HelpCommandDescriptor,
  RepositoryStateInput,
  RepositoryStateResult,
} from "./engines.js";
// ---------------------------------------------------------------------------
// Command input
// ---------------------------------------------------------------------------

/** Re-exported from the parser so one vocabulary describes every admitted verb. */
export type { CliVerb } from "./parser.js";
export type MutationVerb = "init" | "adopt";
export type DiagnosisVerb = "doctor" | "status";

export interface CliCommandInput {
  readonly verb: MutationVerb;
  readonly apply: boolean;
  readonly targetRef?: string;
}

function validateCliInput(input: unknown): { readonly ok: true; readonly value: CliCommandInput } | { readonly ok: false; readonly reason: string } {
  if (input === null || typeof input !== "object") return { ok: false, reason: "input_must_be_object" };
  const record = input as Record<string, unknown>;
  const verb = record["verb"];
  if (verb !== "init" && verb !== "adopt") return { ok: false, reason: "verb_must_be_init_or_adopt" };
  const apply = record["apply"];
  if (typeof apply !== "boolean") return { ok: false, reason: "apply_must_be_boolean" };
  const targetRef = record["targetRef"];
  if (targetRef !== undefined && typeof targetRef !== "string") return { ok: false, reason: "targetRef_must_be_string" };
  return { ok: true, value: { verb, apply, ...(targetRef === undefined ? {} : { targetRef }) } };
}


// ---------------------------------------------------------------------------
// Diagnostic input (read-only commands)
// ---------------------------------------------------------------------------

export interface DiagnosisInput {
  readonly verb: DiagnosisVerb;
  readonly targetRef?: string;
}

function validateDiagnosisInput(input: unknown): { readonly ok: true; readonly value: DiagnosisInput } | { readonly ok: false; readonly reason: string } {
  if (input === null || typeof input !== "object") return { ok: false, reason: "input_must_be_object" };
  const record = input as Record<string, unknown>;
  const verb = record["verb"];
  if (verb !== "doctor" && verb !== "status") return { ok: false, reason: "verb_must_be_doctor_or_status" };
  // A mutation intent must never be expressible against a read-only command.
  if ("apply" in record) return { ok: false, reason: "apply_not_admitted" };
  const targetRef = record["targetRef"];
  if (targetRef !== undefined && typeof targetRef !== "string") return { ok: false, reason: "targetRef_must_be_string" };
  return { ok: true, value: { verb, ...(targetRef === undefined ? {} : { targetRef }) } };
}

// ---------------------------------------------------------------------------
// Observation (read-only, bounded, no repository rediscovery)
// ---------------------------------------------------------------------------

export interface TargetObservation {
  readonly targetRef: string;
  readonly exists: boolean;
  readonly isDirectory: boolean;
  readonly entryCount: number;
  readonly hasGefDirectory: boolean;
  readonly entries: readonly string[];
  readonly stateFingerprint: string;
}

export function fingerprint(value: unknown): string {
  const canonical = JSON.stringify(value, (_key, nested: unknown) => {
    if (nested === null || typeof nested !== "object" || Array.isArray(nested)) return nested;
    return Object.fromEntries(Object.entries(nested as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  });
  return createHash("sha256").update(canonical).digest("hex");
}

const OBSERVATION_ENTRY_LIMIT = 64;
const GEF_STATE_DIRECTORY = ".gef";
const RECEIPTS_DIRECTORY = "receipts";
const GEF_GOVERNANCE_LABELS: readonly string[] = Object.freeze(["gef-managed", "governed"]);

// ---------------------------------------------------------------------------
// S0 contained read helper
// ---------------------------------------------------------------------------
//
// Every read-only file the CLI consumes is untrusted input crossing the filesystem boundary
// (SECURITY.md trust boundaries, T2 path traversal/symlink escape, T12 denial/resource
// exhaustion). There is exactly one policy for those reads, implemented here and used by every
// S0 reader: bind the approved root, refuse lexical escape, refuse link-like path components,
// prove physical containment, require a regular file, and read no more than the admitted budget.
//
// Node on Windows reports symlinks *and* directory junctions as symbolic links through `lstat`,
// which is the strongest portable non-following observation available. A reparse redirect that
// `lstat` does not surface is still caught by the physical-containment proof below, so an alias
// whose destination leaves the approved root is refused rather than read.

/** Maximum bytes a single diagnostic file may contribute. */
export const DIAGNOSTIC_FILE_MAX_BYTES = 1024 * 1024;

/** Maximum number of diagnostic source files one command may consider. */
export const DIAGNOSTIC_SOURCE_MAX_FILES = 64;

/**
 * Byte budget for Git metadata (`.git/HEAD` and its symbolic-ref target).
 *
 * A Git ref file is a path or a hash, so a few hundred bytes is already generous; the budget is
 * deliberately far below the general diagnostic budget because these files are read before any
 * subprocess bound applies (SECURITY.md resource safety, T12).
 */
export const GIT_METADATA_MAX_BYTES = 4096;

export type DiagnosticReadStatus = "OK" | "ABSENT" | "UNREADABLE" | "ALIAS_REFUSED" | "NOT_REGULAR" | "OVER_BUDGET";

export interface DiagnosticReadOutcome {
  readonly status: DiagnosticReadStatus;
  /** The requested relative reference, as it appears in output. */
  readonly ref: string;
  /** Admitted content, present only when `status` is `OK`. */
  readonly bytes: Buffer | null;
  /** Deterministic observation-limit code, `null` only when `status` is `OK`. */
  readonly limit: string | null;
}

function readRefusal(status: Exclude<DiagnosticReadStatus, "OK">, ref: string, code: string): DiagnosticReadOutcome {
  return { status, ref, bytes: null, limit: `${code}:${ref}` };
}

/** True when `candidate` is the same path as, or lexically contained by, `root`. */
function isContained(root: string, candidate: string): boolean {
  if (candidate === root) return true;
  return candidate.startsWith(root.endsWith(sep) ? root : `${root}${sep}`);
}

type ContainedRefusalStatus = "ABSENT" | "UNREADABLE" | "ALIAS_REFUSED" | "NOT_REGULAR";

type ContainedWalk =
  | { readonly ok: true; readonly root: string; readonly candidate: string; readonly identity: string; readonly isFile: boolean; readonly isDirectory: boolean; readonly limit: null }
  | { readonly ok: false; readonly status: ContainedRefusalStatus; readonly code: string; readonly limit: string };

/**
 * Resolve one reference inside the approved target root without following any link.
 *
 * This is the single containment primitive. Every S0 consumer — content reads and mere existence
 * probes alike — goes through it, so there is exactly one containment policy rather than one per
 * caller:
 *
 * 1. bind the approved root and reject an empty, NUL-containing or absolute reference;
 * 2. reject lexical escape, so `..` traversal never leaves the root whatever the filesystem would
 *    do afterwards;
 * 3. inspect **every** component from the root to the final path with `lstat`, a non-following
 *    primitive, refusing any link-like component (symlink, junction or reparse point as reported
 *    by Node) regardless of where it would lead;
 * 4. require every ancestor to be a directory and the final path to be a file or a directory.
 *
 * Node on Windows reports symlinks *and* directory junctions as symbolic links through `lstat`,
 * which is the strongest portable non-following observation available.
 */
function walkContained(targetRoot: string, requestedRef: string): ContainedWalk {
  if (requestedRef.length === 0 || requestedRef.includes("\0") || isAbsolute(requestedRef)) {
    return { ok: false, status: "ALIAS_REFUSED", code: "DIAGNOSTIC_PATH_ESCAPE", limit: `DIAGNOSTIC_PATH_ESCAPE:${requestedRef}` };
  }
  const root = resolve(targetRoot);
  const candidate = resolve(root, requestedRef);
  const refuse = (status: ContainedRefusalStatus, code: string): ContainedWalk => ({ ok: false, status, code, limit: `${code}:${requestedRef}` });
  if (!isContained(root, candidate)) return refuse("ALIAS_REFUSED", "DIAGNOSTIC_PATH_ESCAPE");
  if (candidate === root) return refuse("NOT_REGULAR", "DIAGNOSTIC_NOT_REGULAR");

  const parts = relative(root, candidate).split(sep).filter((part) => part.length > 0);
  let current = root;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (part === undefined) continue;
    current = join(current, part);
    let stats: ReturnType<typeof lstatSync>;
    try {
      stats = lstatSync(current);
    } catch (cause: unknown) {
      const code = (cause as { readonly code?: unknown }).code;
      if (code === "ENOENT" || code === "ENOTDIR") return refuse("ABSENT", "DIAGNOSTIC_PATH_ABSENT");
      return refuse("UNREADABLE", "DIAGNOSTIC_PATH_UNREADABLE");
    }
    if (stats.isSymbolicLink()) return refuse("ALIAS_REFUSED", "DIAGNOSTIC_ALIAS_REFUSED");
    const isFinal = index === parts.length - 1;
    if (isFinal) {
      if (!stats.isFile() && !stats.isDirectory()) return refuse("NOT_REGULAR", "DIAGNOSTIC_NOT_REGULAR");
      return { ok: true, root, candidate, identity: `${String(stats.dev)}:${String(stats.ino)}`, isFile: stats.isFile(), isDirectory: stats.isDirectory(), limit: null };
    }
    if (!stats.isDirectory()) return refuse("NOT_REGULAR", "DIAGNOSTIC_NOT_REGULAR");
  }
  return refuse("NOT_REGULAR", "DIAGNOSTIC_NOT_REGULAR");
}

/**
 * Classify one contained path without following any link.
 *
 * Used for existence probes over untrusted metadata (Git operation sentinels), so those probes
 * share the containment policy instead of falling back to a link-following `existsSync`.
 */
export function containedEntryKind(targetRoot: string, requestedRef: string): "ABSENT" | "FILE" | "DIRECTORY" | "ALIAS_REFUSED" | "UNREADABLE" | "NOT_REGULAR" {
  const walked = walkContained(targetRoot, requestedRef);
  if (!walked.ok) return walked.status;
  if (walked.isFile) return "FILE";
  if (walked.isDirectory) return "DIRECTORY";
  return "NOT_REGULAR";
}

/**
 * Read one file inside the approved target root, or refuse with a structured reason.
 *
 * The refusal is never silent and never degrades into "absent": a caller can distinguish an
 * absent path from an unreadable one, from an alias that was refused, from a link-like or
 * otherwise non-regular target, and from content over the admitted budget.
 */
export function readContainedDiagnosticFile(targetRoot: string, requestedRef: string, budget: number = DIAGNOSTIC_FILE_MAX_BYTES): DiagnosticReadOutcome {
  const ref = requestedRef;
  const walked = walkContained(targetRoot, requestedRef);
  if (!walked.ok) return readRefusal(walked.status, ref, walked.code);
  if (!walked.isFile) return readRefusal("NOT_REGULAR", ref, "DIAGNOSTIC_NOT_REGULAR");
  const { root, candidate, identity: finalIdentity } = walked;

  // Physical containment: whatever the final path actually resolves to must still be inside the
  // resolved root. This catches a redirect that the non-following walk above did not surface,
  // including a reparse form Node does not report as a symbolic link.
  try {
    const physicalRoot = realpathSync.native(root);
    const physicalCandidate = realpathSync.native(candidate);
    if (!isContained(physicalRoot, physicalCandidate)) return readRefusal("ALIAS_REFUSED", ref, "DIAGNOSTIC_ALIAS_REFUSED");
  } catch {
    return readRefusal("UNREADABLE", ref, "DIAGNOSTIC_PATH_UNREADABLE");
  }

  let descriptor: number;
  try {
    descriptor = openSync(candidate, "r");
  } catch {
    return readRefusal("UNREADABLE", ref, "DIAGNOSTIC_PATH_UNREADABLE");
  }
  try {
    const opened = fstatSync(descriptor);
    // The opened file must be the exact object the non-following walk inspected: this closes the
    // window between the walk and the open.
    if (`${String(opened.dev)}:${String(opened.ino)}` !== finalIdentity) return readRefusal("ALIAS_REFUSED", ref, "DIAGNOSTIC_ALIAS_REFUSED");
    if (!opened.isFile()) return readRefusal("NOT_REGULAR", ref, "DIAGNOSTIC_NOT_REGULAR");
    // The size gate comes before any read: an over-budget file is never read and never truncated
    // into apparently valid evidence.
    if (opened.size > budget) return readRefusal("OVER_BUDGET", ref, "DIAGNOSTIC_FILE_OVER_BUDGET");
    const bytes = Buffer.alloc(opened.size);
    let filled = 0;
    while (filled < opened.size) {
      const read = readSync(descriptor, bytes, filled, opened.size - filled, filled);
      // A short read means the file changed size under us; truncated content is refused rather
      // than accepted as evidence.
      if (read <= 0) return readRefusal("UNREADABLE", ref, "DIAGNOSTIC_PATH_UNREADABLE");
      filled += read;
    }
    return { status: "OK", ref, bytes, limit: null };
  } catch {
    return readRefusal("UNREADABLE", ref, "DIAGNOSTIC_PATH_UNREADABLE");
  } finally {
    try {
      closeSync(descriptor);
    } catch {
      // The descriptor is already unusable; nothing further can be done and no content was
      // produced from it.
    }
  }
}

/** The observation-limit codes of every refused read, in input order. */
export function diagnosticReadLimits(outcomes: readonly DiagnosticReadOutcome[]): readonly string[] {
  return Object.freeze(outcomes.filter((outcome) => outcome.limit !== null).map((outcome) => outcome.limit as string));
}

/**
 * Read one Git metadata file (`.git/HEAD` or a symbolic-ref target).
 *
 * This is a thin specialization, not a second policy: the reference is resolved and read by the
 * same containment primitive as every other S0 read, with the Git metadata budget substituted.
 * Git metadata is read before any subprocess bound applies, which is why it carries the tighter
 * budget.
 */
export function readGitMetadata(targetRoot: string, relativeRef: string): DiagnosticReadOutcome {
  return readContainedDiagnosticFile(targetRoot, relativeRef, GIT_METADATA_MAX_BYTES);
}

export function observeTarget(targetRef: string): TargetObservation {
  const absolute = resolve(targetRef);
  let entries: string[] = [];
  let exists = false;
  let isDirectory = false;
  try {
    const stats = statSync(absolute);
    exists = true;
    isDirectory = stats.isDirectory();
    if (isDirectory) entries = readdirSync(absolute).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).slice(0, OBSERVATION_ENTRY_LIMIT);
  } catch {
    exists = false;
    isDirectory = false;
  }
  const base = { targetRef: absolute, exists, isDirectory, entryCount: entries.length, hasGefDirectory: entries.includes(GEF_STATE_DIRECTORY), entries };
  return { ...base, stateFingerprint: fingerprint(base) };
}

const GIT_OPERATION_SENTINELS: readonly (readonly [string, string])[] = Object.freeze([
  ["MERGE_HEAD", "MERGE"],
  ["CHERRY_PICK_HEAD", "CHERRY_PICK"],
  ["REVERT_HEAD", "REVERT"],
  ["rebase-merge", "REBASE"],
  ["rebase-apply", "REBASE"],
  ["BISECT_LOG", "BISECT"],
]);

export type DirtinessObservation = "OBSERVED" | "UNKNOWN" | "NOT_APPLICABLE";

export interface RepositoryObservation {
  readonly input: RepositoryStateInput;
  readonly observationLimits: readonly string[];
  readonly dirtiness: DirtinessObservation;
}

/** Git porcelain v1 unmerged (conflicted) status codes. */
const CONFLICT_CODES = new Set(["DD", "AU", "UD", "UA", "DU", "AA", "UU"]);

const GIT_STATUS_TIMEOUT_MS = 10_000;

interface DirtinessEvidence {
  readonly observation: DirtinessObservation;
  readonly modified: readonly string[];
  readonly staged: readonly string[];
  readonly untracked: readonly string[];
  readonly conflicted: readonly string[];
  readonly detail?: string;
}

/**
 * Read deterministic working-tree dirtiness for the target repository.
 *
 * `git status --porcelain -z` is invoked with an argv array (no shell string is ever built) and
 * a bounded timeout, against the target repository only — no broad rediscovery. A git binary
 * that is missing, fails or times out yields `UNKNOWN`, never an assumed clean tree.
 */
export function observeRepositoryDirtiness(targetRef: string): DirtinessEvidence {
  const modified: string[] = [];
  const staged: string[] = [];
  const untracked: string[] = [];
  const conflicted: string[] = [];
  let result: ReturnType<typeof spawnSync>;
  try {
    result = spawnSync("git", ["-C", resolve(targetRef), "status", "--porcelain", "-z", "--untracked-files=normal"], {
      encoding: "utf8",
      timeout: GIT_STATUS_TIMEOUT_MS,
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch (cause: unknown) {
    return { observation: "UNKNOWN", modified, staged, untracked, conflicted, detail: cause instanceof Error ? cause.message : String(cause) };
  }
  if (result.error !== undefined || result.status !== 0) {
    const detail = result.error?.message ?? (String(result.stderr ?? "").trim() || `exit ${String(result.status)}`);
    return { observation: "UNKNOWN", modified, staged, untracked, conflicted, detail };
  }
  const entries = String(result.stdout ?? "").split("\0").filter((entry) => entry.length > 0);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry === undefined || entry.length < 4) continue;
    const code = entry.slice(0, 2);
    const path = entry.slice(3);
    if (code === "??") {
      untracked.push(path);
      continue;
    }
    if (CONFLICT_CODES.has(code)) {
      conflicted.push(path);
      // A rename entry carries a second NUL-terminated path.
      if (code.startsWith("R") || code.startsWith("C")) index += 1;
      continue;
    }
    if (code.startsWith("R") || code.startsWith("C")) index += 1;
    if (code[0] !== " " && code[0] !== "?") staged.push(path);
    if (code[1] !== " " && code[1] !== "?") modified.push(path);
  }
  return { observation: "OBSERVED", modified, staged, untracked, conflicted };
}

/**
 * Observe the target's local Git identity and working-tree state.
 *
 * Git metadata is untrusted input like any other S0 read: `.git`, `.git/HEAD` and any symbolic-ref
 * target are bound to the approved project root, reached through the shared containment policy and
 * read under an explicit byte budget. A `.git` that is a link-like or otherwise unsupported
 * indirection form yields `UNKNOWN` — never a usable identity and never an assumed clean tree.
 * Identity comes from `.git/HEAD` plus the well-known operation sentinels; dirtiness comes from the
 * deterministic, argv-based, timeout- and output-bounded `git status` read above. When `.git`
 * exists but dirtiness cannot be proven, the observation is reported as `UNKNOWN` and no engine
 * verdict is fabricated from it — the caller blocks mutation instead.
 */
export function observeRepository(targetRef: string): RepositoryObservation {
  const absolute = resolve(targetRef);
  // `.git` is classified without following any link, so a symlinked/junctioned Git directory is a
  // refusal rather than a redirect to somewhere else on the filesystem.
  const gitKind = containedEntryKind(absolute, ".git");
  if (gitKind === "ABSENT") {
    // No repository: the state is known to be "absent", not unknown.
    return { input: {}, observationLimits: ["NO_LOCAL_GIT_DIRECTORY"], dirtiness: "NOT_APPLICABLE" };
  }
  if (gitKind === "ALIAS_REFUSED" || gitKind === "UNREADABLE") {
    return {
      input: {},
      observationLimits: [`DIAGNOSTIC_ALIAS_REFUSED:.git`, "GIT_DIRECTORY_ALIAS_REFUSED", "WORKING_TREE_NOT_OBSERVED"],
      dirtiness: "UNKNOWN",
    };
  }
  if (gitKind !== "DIRECTORY") {
    // A gitfile (`gitdir:` worktree/submodule indirection) or any other non-directory form is not
    // interpreted here, and its target is not read: the state is unavailable, not clean.
    return { input: {}, observationLimits: ["GIT_DIRECTORY_NOT_A_DIRECTORY", "WORKING_TREE_NOT_OBSERVED"], dirtiness: "UNKNOWN" };
  }

  let head = "";
  let branch = "";
  let headLimit: string | null = null;
  const headOutcome = readGitMetadata(absolute, ".git/HEAD");
  if (headOutcome.status !== "OK" || headOutcome.bytes === null) {
    if (headOutcome.status === "ABSENT") {
      return { input: {}, observationLimits: ["HEAD_UNREADABLE", "WORKING_TREE_NOT_OBSERVED"], dirtiness: "UNKNOWN" };
    }
    // Over-budget or refused metadata is unavailable, and its content is never interpreted.
    return {
      input: {},
      observationLimits: [headOutcome.limit ?? "HEAD_UNREADABLE", "WORKING_TREE_NOT_OBSERVED"],
      dirtiness: "UNKNOWN",
    };
  }
  const contents = headOutcome.bytes.toString("utf8").trim();
  if (contents.startsWith("ref:")) {
    // The ref name is attacker-controlled file content. It is accepted only in the exact shape a
    // real symbolic ref has, so `HEAD` cannot name a path outside the Git directory, and the
    // referenced file is then read through the same contained and bounded policy.
    const refName = contents.slice(4).trim();
    if (!/^refs\/[A-Za-z0-9._/-]+$/.test(refName) || refName.includes("..") || refName.includes("//")) {
      headLimit = "GIT_HEAD_REF_UNUSABLE";
    } else {
      branch = refName.replace(/^refs\/heads\//, "");
      const refOutcome = readGitMetadata(absolute, `.git/${refName}`);
      if (refOutcome.status === "ABSENT") {
        head = "";
      } else if (refOutcome.status !== "OK" || refOutcome.bytes === null) {
        // A symbolic ref pointing at an alias, an escape or oversized content is refused rather
        // than followed; the ref name is still reported, the value is not.
        headLimit = refOutcome.limit ?? "GIT_REF_UNREADABLE";
      } else {
        head = refOutcome.bytes.toString("utf8").trim();
      }
    }
  } else if (/^[0-9a-f]{40}([0-9a-f]{24})?$/i.test(contents)) {
    head = contents;
    branch = "DETACHED";
  } else {
    // Anything else is not a Git identity, so it is never propagated as one.
    headLimit = "GIT_HEAD_UNUSABLE";
  }

  const headLimits: readonly string[] = headLimit === null ? [] : [headLimit];
  const operation = GIT_OPERATION_SENTINELS.find(([sentinel]) => containedEntryKind(absolute, `.git/${sentinel}`) !== "ABSENT")?.[1];
  const evidence = observeRepositoryDirtiness(absolute);
  if (evidence.observation !== "OBSERVED") {
    return {
      input: { repo: absolute, head, branch, ...(operation === undefined ? {} : { operation }) },
      observationLimits: ["WORKING_TREE_NOT_OBSERVED", `DIRTINESS_UNKNOWN${evidence.detail === undefined ? "" : `:${evidence.detail}`}`, ...headLimits],
      dirtiness: "UNKNOWN",
    };
  }
  return {
    input: {
      repo: absolute,
      head,
      branch,
      modified: evidence.modified,
      staged: evidence.staged,
      untracked: evidence.untracked,
      conflicted: evidence.conflicted,
      ...(operation === undefined ? {} : { operation }),
    },
    observationLimits: [...headLimits],
    dirtiness: "OBSERVED",
  };
}

/** Canonical-source candidates detected in the target, for `resolveCanonical`. */
const CANONICAL_CANDIDATES: readonly (readonly [string, string])[] = Object.freeze([
  [".engineering/CHECKPOINT.json", "checkpoint"],
  [".gef/current.json", "checkpoint"],
  ["checkpoint.json", "checkpoint"],
  [".engineering/SCOPE.md", "scope"],
  [".engineering/DEFINITION-OF-DONE.md", "dod"],
  [".engineering/ARCHITECTURE.md", "architecture"],
  ["AGENTS.md", "other"],
]);

export function observeCanonicalSources(targetRef: string): readonly CanonicalSourceInput[] {
  const absolute = resolve(targetRef);
  const sources: CanonicalSourceInput[] = [];
  for (const [relativePath, kind] of CANONICAL_CANDIDATES.slice(0, DIAGNOSTIC_SOURCE_MAX_FILES)) {
    // The shared S0 read policy applies here too: a candidate that is absent, out of budget or
    // reached through a link-like path is simply not observed. It never fabricates a value, and
    // no candidate is ever read through an alias.
    const outcome = readContainedDiagnosticFile(absolute, relativePath);
    if (outcome.status !== "OK" || outcome.bytes === null) continue;
    sources.push({ id: relativePath, kind, value: createHash("sha256").update(outcome.bytes).digest("hex") });
  }
  return Object.freeze(sources);
}

export interface RecordedArtifact {
  readonly ref: string;
  readonly present: boolean;
  readonly fingerprint: string;
  readonly recordedObservationFingerprint: string | null;
  readonly schemaVersionSupported: boolean;
  /** Set when the path was present but refused by the contained-read policy. */
  readonly refusal?: string;
}

/**
 * Read the previously recorded governed artifact, if any, without mutating anything.
 *
 * The document's schema version is enforced on read: an unsupported major version is reported
 * as such and never interpreted optimistically.
 */
export function readRecordedArtifact(targetRef: string, verb: MutationVerb): RecordedArtifact {
  const ref = `${GEF_STATE_DIRECTORY}/${verb}-state.json`;
  // The recorded baseline is untrusted filesystem input like any other S0 read: it is reached
  // through the shared contained-read policy, so a linked or escaping `.gef` path is refused
  // rather than followed.
  const outcome = readContainedDiagnosticFile(resolve(targetRef), ref);
  const absent = { ref, present: false, fingerprint: "ABSENT", recordedObservationFingerprint: null, schemaVersionSupported: true } as const;
  if (outcome.status === "ABSENT") return absent;
  if (outcome.status !== "OK" || outcome.bytes === null) {
    // Present but not admissible as evidence: the path exists in some form but was refused.
    return { ref, present: true, fingerprint: "UNREADABLE", recordedObservationFingerprint: null, schemaVersionSupported: false, ...(outcome.limit === null ? {} : { refusal: outcome.limit }) };
  }
  const body = outcome.bytes;
  const artifactFingerprint = createHash("sha256").update(body).digest("hex");
  try {
    const parsed: unknown = JSON.parse(body.toString("utf8"));
    requireSupportedSchemaVersion(parsed);
    const recorded = (parsed as { readonly observationFingerprint?: unknown }).observationFingerprint;
    return {
      ref,
      present: true,
      fingerprint: artifactFingerprint,
      recordedObservationFingerprint: typeof recorded === "string" ? recorded : null,
      schemaVersionSupported: true,
    };
  } catch (cause: unknown) {
    void cause;
    return { ref, present: true, fingerprint: artifactFingerprint, recordedObservationFingerprint: null, schemaVersionSupported: false };
  }
}

// ---------------------------------------------------------------------------
// Compositions
// ---------------------------------------------------------------------------

function initComposition(engines: Engines, observation: TargetObservation, repository: RepositoryObservation, repositoryVerdict: RepositoryStateResult | null, canonical: CanonicalResolutionResult, drift: DriftResult, productVersion: string): Readonly<Record<string, unknown>> {
  return {
    verb: "init",
    observation,
    repository: { verdict: repositoryVerdict, dirtiness: repository.dirtiness, observationLimits: repository.observationLimits },
    install: engines.installPlan({ platform: process.platform, target: observation.targetRef, version: productVersion, current: null }),
    governance: { observationSource: "NOT_OBSERVED", ...engines.githubBootstrap({}, { labels: [...GEF_GOVERNANCE_LABELS] }) },
    canonical,
    drift,
  };
}

function adoptComposition(engines: Engines, observation: TargetObservation, repository: RepositoryObservation, repositoryVerdict: RepositoryStateResult | null, canonical: CanonicalResolutionResult, drift: DriftResult, productVersion: string): Readonly<Record<string, unknown>> {
  return {
    verb: "adopt",
    observation,
    repository: { verdict: repositoryVerdict, dirtiness: repository.dirtiness, observationLimits: repository.observationLimits },
    install: engines.installPlan({ platform: process.platform, target: observation.targetRef, version: productVersion, current: null }),
    canonical,
    drift,
    backup: engines.backupManifest([{ id: "target-observation", digest: observation.stateFingerprint }]),
    recovery: engines.recoveryPlan({ journal: [], candidateMatches: true, corrupt: false }),
  };
}

function composeFor(engines: Engines, verb: MutationVerb, targetRef: string, productVersion: string) {
  const observation = observeTarget(targetRef);
  const repository = observeRepository(targetRef);
  // A verdict is derived only from an observation that actually saw the working tree. While the
  // dirtiness is unknown, no verdict is claimed, so unknown evidence can never be presented as a
  // clean precondition.
  const repositoryVerdict: RepositoryStateResult | null = repository.dirtiness === "UNKNOWN" ? null : engines.repositoryState(repository.input);
  const canonical = engines.resolveCanonical([...observeCanonicalSources(targetRef)]);
  const recorded = readRecordedArtifact(targetRef, verb);
  const drift = engines.detectDrift(
    { observation: recorded.recordedObservationFingerprint ?? "NO_RECORDED_STATE" },
    { observation: observation.stateFingerprint },
    { authorized: false },
  );
  const body = verb === "init"
    ? initComposition(engines, observation, repository, repositoryVerdict, canonical, drift, productVersion)
    : adoptComposition(engines, observation, repository, repositoryVerdict, canonical, drift, productVersion);
  return { body, digest: fingerprint(body), observation, repository: { ...repository, verdict: repositoryVerdict }, canonical, drift, recorded };
}


// ---------------------------------------------------------------------------
// Read-only diagnostic probes
// ---------------------------------------------------------------------------
//
// Doctor and status observe; they never mutate. Every probe below is a bounded read: a bounded
// subprocess, a bounded file read, or a directory listing. Nothing here creates, writes or removes
// a path, and nothing here touches the `.gef` / `.gef-private` transaction substrate.

const GIT_PROBE_TIMEOUT_MS = 5_000;

/** Bounded probe for the Git binary itself. A missing binary is a finding, not an assumption. */
export function gitBinaryAvailable(): boolean {
  try {
    const result = spawnSync("git", ["--version"], { encoding: "utf8", timeout: GIT_PROBE_TIMEOUT_MS, maxBuffer: 64 * 1024 });
    return result.error === undefined && result.status === 0;
  } catch {
    return false;
  }
}

/** Governance sources the diagnostic surface is willing to read, in a deterministic order. */
const GOVERNANCE_SOURCES: readonly string[] = Object.freeze([
  ".engineering/CHECKPOINT.json",
  ".engineering/CHECKPOINT.md",
  ".engineering/SCOPE.md",
  ".engineering/DEFINITION-OF-DONE.md",
  "AGENTS.md",
  "README.md",
  "CHANGELOG.md",
  "SECURITY.md",
  "LICENSE",
  "docs/INSTALLATION.md",
  "docs/QUICKSTART.md",
]);

export interface GovernanceObservation {
  readonly source: string;
  readonly present: boolean;
  /** The source existed and its bytes were admitted by the contained-read policy. */
  readonly readable: boolean;
  /** The admitted content passed the checkpoint validation gate and may carry semantic authority. */
  readonly valid: boolean;
  /** Values declared by the source. Reported as declared; never re-interpreted as approval. */
  readonly production: Readonly<Record<string, unknown>> | null;
  /** The V1.1 development overlay, kept distinguishable from the production truth. */
  readonly development: Readonly<Record<string, unknown>> | null;
  readonly observationLimits: readonly string[];
}

/**
 * Governance checkpoint schema versions this build can interpret.
 *
 * This is deliberately narrow: it validates only the checkpoint fields `gef status` consumes and
 * does not introduce a product-wide checkpoint schema (WO-003 architecture rule 5). A checkpoint
 * declaring any other version is reported as present-but-invalid, never promoted into semantics.
 */
export const SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS: readonly number[] = Object.freeze([2]);

/** Projected production fields and the shape each must have before it carries any meaning. */
const CHECKPOINT_FIELD_SHAPES: readonly (readonly [string, "string" | "finiteNumber"])[] = Object.freeze([
  ["status", "string"],
  ["phase", "string"],
  ["stopState", "string"],
  ["completedThroughModule", "string"],
  ["mainProductionDenominatorWeight", "finiteNumber"],
  ["earnedProductionWeight", "finiteNumber"],
  ["overallCompletionPercent", "finiteNumber"],
  ["nextLegalStage", "string"],
]);

interface CheckpointValidation {
  readonly valid: boolean;
  readonly limit: string | null;
  readonly production: Readonly<Record<string, unknown>> | null;
  readonly development: Readonly<Record<string, unknown>> | null;
}

/**
 * Validate a parsed checkpoint before any of its fields become status semantics.
 *
 * Trust boundary: `.engineering/CHECKPOINT.json` is untrusted filesystem input. Parseable JSON is
 * not the same thing as a valid checkpoint, so presence, readability and validity are reported
 * separately and an invalid document yields no production or development value at all (SEC-09
 * schema/version discipline; a local file is never treated as trusted merely because it parses).
 */
export function validateGovernanceCheckpoint(parsed: unknown): CheckpointValidation {
  const invalid = (limit: string): CheckpointValidation => ({ valid: false, limit, production: null, development: null });
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return invalid("GOVERNANCE_CHECKPOINT_NOT_OBJECT");
  const record = parsed as Record<string, unknown>;

  const version = record["schemaVersion"];
  if (typeof version !== "number" || !Number.isInteger(version)) return invalid(`GOVERNANCE_CHECKPOINT_SCHEMA_UNSUPPORTED:${String(version)}`);
  if (!SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS.includes(version)) return invalid(`GOVERNANCE_CHECKPOINT_SCHEMA_UNSUPPORTED:${String(version)}`);

  const production: Record<string, unknown> = {};
  for (const [key, shape] of CHECKPOINT_FIELD_SHAPES) {
    if (!(key in record)) continue;
    const value = record[key];
    if (shape === "string") {
      if (typeof value !== "string") return invalid(`GOVERNANCE_CHECKPOINT_FIELD_TYPE_INVALID:${key}`);
    } else {
      if (typeof value !== "number" || !Number.isFinite(value)) return invalid(`GOVERNANCE_CHECKPOINT_FIELD_TYPE_INVALID:${key}`);
    }
    production[key] = value;
  }

  // Progress is a bounded percentage; a number outside that range is not a completion claim.
  const progress = production["overallCompletionPercent"];
  if (typeof progress === "number" && (progress < 0 || progress > 100)) return invalid(`GOVERNANCE_CHECKPOINT_PROGRESS_OUT_OF_RANGE:${String(progress)}`);

  const overlay = record["v11"];
  if (overlay !== undefined && overlay !== null && (typeof overlay !== "object" || Array.isArray(overlay))) return invalid("GOVERNANCE_CHECKPOINT_OVERLAY_INVALID");

  return {
    valid: true,
    limit: null,
    production: Object.freeze(production),
    development: overlay === undefined || overlay === null ? null : Object.freeze(overlay as Record<string, unknown>),
  };
}

/**
 * Read the target's declared governance state without mutating or reinterpreting it.
 *
 * The bytes are admitted by the shared S0 contained-read policy (H1/H2) and then passed through
 * the checkpoint validation gate (H4) before any field becomes semantics.
 */
export function observeGovernance(targetRef: string, budget: number = DIAGNOSTIC_FILE_MAX_BYTES): GovernanceObservation {
  const absolute = resolve(targetRef);
  const source = ".engineering/CHECKPOINT.json";
  const outcome = readContainedDiagnosticFile(absolute, source, budget);
  const base = { source, production: null, development: null } as const;
  if (outcome.status === "ABSENT") return { ...base, present: false, readable: false, valid: false, observationLimits: ["GOVERNANCE_SOURCE_ABSENT"] };
  if (outcome.status !== "OK" || outcome.bytes === null) {
    return { ...base, present: true, readable: false, valid: false, observationLimits: [outcome.limit ?? "GOVERNANCE_SOURCE_UNREADABLE"] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(outcome.bytes.toString("utf8"));
  } catch {
    // The bytes were admissible but yielded no interpretable document, so it is reported as
    // unreadable rather than as a valid-but-empty source.
    return { ...base, present: true, readable: false, valid: false, observationLimits: ["GOVERNANCE_SOURCE_NOT_PARSEABLE"] };
  }
  const validation = validateGovernanceCheckpoint(parsed);
  if (!validation.valid) {
    return { ...base, present: true, readable: true, valid: false, observationLimits: [validation.limit ?? "GOVERNANCE_CHECKPOINT_INVALID"] };
  }
  return {
    source,
    present: true,
    readable: true,
    valid: true,
    production: validation.production,
    development: validation.development,
    observationLimits: [],
  };
}

/**
 * Bounded listing of the governance sources present in the target.
 *
 * A path is listed only when it is an admissible regular file *inside* the approved root: a
 * link-like or escaping path is not "present" for diagnostic purposes.
 */
export function observeGovernanceFiles(targetRef: string, budget: number = DIAGNOSTIC_FILE_MAX_BYTES): readonly string[] {
  const absolute = resolve(targetRef);
  const outcomes = GOVERNANCE_SOURCES.slice(0, DIAGNOSTIC_SOURCE_MAX_FILES).map((relativePath) => readContainedDiagnosticFile(absolute, relativePath, budget));
  return Object.freeze(outcomes.filter((outcome) => outcome.status === "OK").map((outcome) => outcome.ref));
}

/** Observation-limit codes from the governance-source listing, including the source-count bound. */
export function observeGovernanceFileLimits(targetRef: string, budget: number = DIAGNOSTIC_FILE_MAX_BYTES): readonly string[] {
  const absolute = resolve(targetRef);
  const considered = GOVERNANCE_SOURCES.slice(0, DIAGNOSTIC_SOURCE_MAX_FILES);
  const outcomes = considered.map((relativePath) => readContainedDiagnosticFile(absolute, relativePath, budget));
  const limits = diagnosticReadLimits(outcomes.filter((outcome) => outcome.status !== "ABSENT"));
  const truncated = GOVERNANCE_SOURCES.length > considered.length ? [`DIAGNOSTIC_SOURCE_COUNT_TRUNCATED:${String(considered.length)}`] : [];
  return Object.freeze([...limits, ...truncated]);
}

interface DocumentationEntry {
  readonly id: string;
  readonly source: string;
  readonly version: unknown;
  readonly digest: string;
}

/**
 * Documentation manifest entries: admissible regular files only, with their real content digest.
 *
 * A refused or over-budget source contributes no entry, so it can never enter the manifest as
 * valid evidence.
 */
export function observeDocumentation(targetRef: string, budget: number = DIAGNOSTIC_FILE_MAX_BYTES): readonly DocumentationEntry[] {
  const absolute = resolve(targetRef);
  const entries: DocumentationEntry[] = [];
  for (const relativePath of GOVERNANCE_SOURCES.slice(0, DIAGNOSTIC_SOURCE_MAX_FILES)) {
    const outcome = readContainedDiagnosticFile(absolute, relativePath, budget);
    if (outcome.status !== "OK" || outcome.bytes === null) continue;
    entries.push({ id: relativePath, source: relativePath, version: null, digest: createHash("sha256").update(outcome.bytes).digest("hex") });
  }
  return Object.freeze(entries);
}

// ---------------------------------------------------------------------------
// Failure projections
// ---------------------------------------------------------------------------

function engineFailure(error: unknown, commandId: string, runId: string): GefError {
  const detail = error instanceof EngineUnavailableError ? error.detail : error instanceof Error ? error.message : String(error);
  const engine = error instanceof EngineUnavailableError ? error.engine : "unknown";
  return createGefError({
    id: `cli-engine-${commandId}`,
    category: "CAPABILITY",
    reason: "engine_unavailable",
    severity: "ERROR",
    summary: "A required CLI engine is unavailable",
    retryability: "MANUAL_ONLY",
    recoverability: "NONE_REQUIRED",
    terminal: "BLOCKED",
    commandId,
    runId,
    metadata: { engine, detail },
    remediations: [{ actionId: "gef.cli.verify_installation" }],
  });
}

function transactionFailure(error: GefError, commandId: string, runId: string): GefError {
  return createGefError({
    id: error.id,
    category: error.category,
    reason: "mutation_refused",
    severity: error.severity,
    summary: error.summary,
    retryability: error.retryability,
    recoverability: error.recoverability,
    terminal: "BLOCKED",
    commandId,
    runId,
    metadata: { ...error.metadata, transactionReason: error.reasonCode },
  });
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function resolveTargetRequested(input: CliCommandInput, context: ExecutionContext): string {
  return context.target?.targetRef ?? input.targetRef ?? context.ports.environment?.values["GEF_TARGET"] ?? process.cwd();
}

async function planHandler(verb: MutationVerb, input: CliCommandInput, context: ExecutionContext): Promise<HandlerOutcome<unknown>> {
  const commandId = verb === "init" ? "gef.init.plan" : "gef.adopt.preview";
  let engines: Engines;
  try {
    engines = await loadEngines();
  } catch (error: unknown) {
    return { ok: false, error: engineFailure(error, commandId, context.runId) };
  }
  const targetRef = resolveTargetRequested(input, context);
  const composed = composeFor(engines, verb, targetRef, context.identity.productVersion);
  const key = verb === "init" ? "plan" : "preview";
  return { ok: true, value: { commandId, effect: "NONE", [key]: composed.body, [`${key}Digest`]: composed.digest } };
}

async function applyHandler(verb: MutationVerb, input: CliCommandInput, context: ExecutionContext): Promise<HandlerOutcome<unknown>> {
  const commandId = verb === "init" ? "gef.init.run" : "gef.adopt.apply";
  let engines: Engines;
  try {
    engines = await loadEngines();
  } catch (error: unknown) {
    return { ok: false, error: engineFailure(error, commandId, context.runId) };
  }
  const targetRef = context.target?.targetRef ?? resolveTargetRequested(input, context);
  const composed = composeFor(engines, verb, targetRef, context.identity.productVersion);

  // A repository in a conflicted operation is a precondition block: the CLI refuses to add
  // managed state while the target repository is mid-operation.
  // Required repository evidence that was not obtained must not become an optimistic
  // precondition: apply fails closed before any transaction-visible effect.
  if (composed.repository.dirtiness === "UNKNOWN") {
    return {
      ok: false,
      error: createGefError({
        id: `cli-repository-unknown-${commandId}`,
        category: "PRECONDITION",
        reason: "repository_state_unknown",
        severity: "ERROR",
        summary: "Target repository working-tree state could not be observed",
        retryability: "SAFE_WITH_BACKOFF",
        recoverability: "NONE_REQUIRED",
        terminal: "BLOCKED",
        commandId,
        runId: context.runId,
        metadata: { observationLimits: [...composed.repository.observationLimits] },
      }),
    };
  }

  const operation = composed.repository.input["operation"];
  if (operation !== undefined) {
    return {
      ok: false,
      error: createGefError({
        id: `cli-repository-${commandId}`,
        category: "PRECONDITION",
        reason: "repository_operation_in_progress",
        severity: "ERROR",
        summary: "Target repository has a Git operation in progress",
        retryability: "SAFE_WITH_BACKOFF",
        recoverability: "NONE_REQUIRED",
        terminal: "BLOCKED",
        commandId,
        runId: context.runId,
        metadata: { operation },
      }),
    };
  }

  const artifactName = verb === "init" ? "init-state.json" : "adopt-state.json";
  const document = buildStateDocument({
    verb,
    commandId,
    contractVersion: CLI_CONTRACT_VERSION,
    productVersion: context.identity.productVersion,
    runId: context.runId,
    planDigest: composed.digest,
    observationFingerprint: composed.observation.stateFingerprint,
    transaction: { planDigest: composed.digest, outcome: "APPLIED" },
  });
  const content = `${JSON.stringify(document, null, 2)}
`;

  // The managed effect is applied by the kernel transaction engine; the CLI never writes the
  // artifact itself. A refusal here (existing target, stale target, safety gap) is projected
  // as a blocked mutation, and nothing user-owned is overwritten.
  const applied = await applyGovernedCreate({
    targetRoot: targetRef,
    relativePath: `${GEF_STATE_DIRECTORY}/${artifactName}`,
    content,
    contentFingerprint: createHash("sha256").update(content).digest("hex"),
    runId: context.runId,
    transactionId: `${context.runId}:${verb}`,
    policyRef: `cli:${verb}:managed-write:v1`,
    moduleOwner: verb === "init" ? "m48-m54-maintenance" : "security-reliability-integrations",
    commandId,
    purpose: verb === "init" ? "STATE_INIT" : "STATE_ADOPT",
  });
  if (!applied.ok) {
    const error = applied.error ?? createGefError({
      id: `cli-tx-${commandId}`,
      category: "EXECUTION",
      reason: "transaction_failed",
      severity: "ERROR",
      summary: "The governed filesystem transaction did not apply",
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
      commandId,
      runId: context.runId,
      metadata: { outcome: applied.outcome },
    });
    return { ok: false, error: transactionFailure(error, commandId, context.runId) };
  }

  const key = verb === "init" ? "plan" : "preview";
  return {
    ok: true,
    value: {
      commandId,
      effect: "CONFIRMED",
      [key]: composed.body,
      [`${key}Digest`]: composed.digest,
      document,
      artifactRef: `${GEF_STATE_DIRECTORY}/${artifactName}`,
      transaction: {
        outcome: applied.outcome,
        planDigest: applied.planDigest,
        receiptDigest: applied.receiptDigest,
        postFingerprint: applied.postFingerprint,
      },
    },
  };
}


// ---------------------------------------------------------------------------
// Diagnosis compositions (read-only)
// ---------------------------------------------------------------------------

/**
 * Doctor observations.
 *
 * Only what was actually measured is reported. An observation that could not be taken is either
 * omitted (not applicable) or passed as `false` (measured and failing); it is never passed as
 * `true` on assumption, so the engine can never be handed a fabricated healthy input.
 */
function doctorObservations(targetRef: string, repository: RepositoryObservation): Readonly<Record<string, unknown>> {
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  const observations: Record<string, unknown> = {
    "toolchain.node": Number.isFinite(nodeMajor) && nodeMajor >= 22,
    "toolchain.platform": ["win32", "linux", "darwin"].includes(process.platform),
    "toolchain.git": gitBinaryAvailable(),
  };
  if (repository.dirtiness === "UNKNOWN") observations["repository.observable"] = false;
  else if (repository.dirtiness === "OBSERVED") observations["repository.observable"] = true;
  // With no repository at all the question is not applicable, so it is reported as nothing rather
  // than as a passing check.
  return Object.freeze(observations);
}

export interface DiagnosisComposition {
  readonly body: Readonly<Record<string, unknown>>;
  readonly digest: string;
}

function doctorComposition(engines: Engines, targetRef: string, observation: TargetObservation, repository: RepositoryObservation, governance: GovernanceObservation): DiagnosisComposition {
  const observations = doctorObservations(targetRef, repository);
  const findings = engines.doctor(observations);
  // Remediation is guidance only: the owning engine fixes the posture, and the CLI does not
  // upgrade it into an action.
  const remediation = findings.filter((finding) => finding.state !== "HEALTHY").map((finding) => engines.repairSuggestion(finding.id));

  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  // Package manifests are diagnostic sources like any other: admitted by the contained-read
  // policy, and a refused or over-budget manifest contributes no digest rather than partial
  // evidence.
  const manifestOutcome = readContainedDiagnosticFile(targetRef, "package.json");
  const lockOutcome = readContainedDiagnosticFile(targetRef, "package-lock.json");
  const dependency = engines.dependencySecurity({
    ...(manifestOutcome.status === "OK" && manifestOutcome.bytes !== null ? { manifestDigest: createHash("sha256").update(manifestOutcome.bytes).digest("hex") } : {}),
    ...(lockOutcome.status === "OK" && lockOutcome.bytes !== null ? { lockDigest: createHash("sha256").update(lockOutcome.bytes).digest("hex") } : {}),
    // The CLI has not independently verified a dependency audit, so provenance stays unverified and
    // the owning engine reports REVIEW rather than PASS.
    provenance: "unverified",
  });
  // No provider access is attempted, so provider security evidence is absent and the engine
  // reports REVIEW. It is never reported as PASS by omission.
  const github = engines.githubSecurity({});

  const invariants = [
    engines.invariantResult("platform.supported", observations["toolchain.platform"] === true, true),
    engines.invariantResult("toolchain.nodeMajor", Number.isFinite(nodeMajor) && nodeMajor >= 22, true),
    engines.invariantResult("toolchain.git", observations["toolchain.git"] === true, true),
  ];

  const capabilities = engines.capabilityEnvelope([
    { capability: "toolchain.git", verified: observations["toolchain.git"] === true },
    { capability: "toolchain.node", verified: observations["toolchain.node"] === true },
    { capability: "toolchain.platform", verified: observations["toolchain.platform"] === true },
    ...(repository.dirtiness === "NOT_APPLICABLE" ? [] : [{ capability: "repository.observable", verified: repository.dirtiness === "OBSERVED" }]),
  ]);

  const safety = engines.safetyDecision({ classification: "NONE", blastRadius: "known", requested: "AUTO", restricted: false });
  const body = {
    verb: "doctor",
    readOnly: true,
    target: { targetRef: observation.targetRef, exists: observation.exists, isDirectory: observation.isDirectory },
    findings,
    remediation,
    invariants,
    security: { dependency, github, safety },
    capabilities,
    governance: { source: governance.source, present: governance.present, readable: governance.readable, valid: governance.valid, observationLimits: governance.observationLimits },
    integrity: engines.integritySnapshot({ findings, observations, dependencies: dependency.digest, capabilities: capabilities.digest }),
    observationLimits: [
      ...repository.observationLimits,
      ...diagnosticReadLimits([manifestOutcome, lockOutcome].filter((outcome) => outcome.status !== "ABSENT")),
      ...observeGovernanceFileLimits(targetRef),
    ],
  };
  return { body: Object.freeze(body), digest: fingerprint(body) };
}

/**
 * A recorded baseline may only be compared when it exists, was admitted as a supported document,
 * and actually carries an observation fingerprint. Anything else is not a baseline.
 */
export function recordedBaselineSupported(recorded: RecordedArtifact): boolean {
  return recorded.present && recorded.schemaVersionSupported && (recorded.recordedObservationFingerprint ?? "").length > 0;
}

type DriftBaselineState = "RECORDED" | "ABSENT" | "UNSUPPORTED";

function statusComposition(engines: Engines, targetRef: string, observation: TargetObservation, repository: RepositoryObservation, repositoryVerdict: RepositoryStateResult | null, governance: GovernanceObservation, drift: DriftResult | null, recorded: RecordedArtifact): DiagnosisComposition {
  const governanceFiles = observeGovernanceFiles(targetRef);
  const fileLimits = observeGovernanceFileLimits(targetRef);
  // Only a validated checkpoint may carry semantic authority: an invalid or unsupported document
  // contributes no state and no progress to the operator projection (H4).
  const productionState = governance.valid && governance.production !== null ? governance.production["status"] : undefined;
  const declaredProgress = governance.valid && governance.production !== null ? governance.production["overallCompletionPercent"] : undefined;
  const evidenceRefs = governance.present ? [governance.source, ...governanceFiles.filter((file) => file !== governance.source)] : [...governanceFiles];

  // `operatorStatus` coerces `stale` to a boolean, so "unknown" cannot be expressed through it.
  // When no supported baseline exists there is nothing to be fresh against, so the conservative
  // value is kept and the reason is emitted as explicit limit evidence.
  const baselineSupported = recordedBaselineSupported(recorded);
  const baselineState: DriftBaselineState = baselineSupported ? "RECORDED" : recorded.present ? "UNSUPPORTED" : "ABSENT";
  const baselineLimits: readonly string[] = baselineState === "RECORDED" ? [] : baselineState === "ABSENT" ? ["drift.baseline.absent", "operator.stale.unknown_conservative"] : ["drift.baseline.unsupported", "operator.stale.unknown_conservative"];

  const operator = engines.operatorStatus({
    // The declared governance state is reported when the target declares a validated one;
    // otherwise the observed repository verdict is used; otherwise the state is explicitly
    // unobserved.
    state: typeof productionState === "string" ? productionState : repositoryVerdict === null ? "UNOBSERVED" : repositoryVerdict.state,
    // Progress is only reported when the target declares a validated one. It is never estimated.
    progress: typeof declaredProgress === "number" ? declaredProgress : null,
    evidence: evidenceRefs,
    stale: drift === null ? true : drift.changed,
    optional: false,
  });
  const documentation = engines.documentationManifest(observeDocumentation(targetRef));
  const navigation = engines.navigationPlan(governanceFiles);

  const body = {
    verb: "status",
    readOnly: true,
    target: { targetRef: observation.targetRef, exists: observation.exists, isDirectory: observation.isDirectory },
    repository: { verdict: repositoryVerdict, dirtiness: repository.dirtiness, observationLimits: repository.observationLimits },
    // Production truth and the development overlay are reported separately and never merged.
    // Presence, readability and validated semantic authority are three distinct facts.
    release: {
      source: governance.source,
      present: governance.present,
      readable: governance.readable,
      valid: governance.valid,
      production: governance.production,
      development: governance.development,
    },
    operator,
    documentation,
    navigation,
    // The drift engine verdict is reported verbatim, and only when a supported baseline exists.
    // Without one there is no authoritative comparison, so drift is unavailable rather than a
    // fabricated change event.
    drift,
    driftBaseline: { state: baselineState, ref: recorded.present ? recorded.ref : null },
    observationLimits: [...baselineLimits, ...governance.observationLimits, ...fileLimits],
    integrity: engines.integritySnapshot({ operator, documentation: documentation.digest, navigation: navigation.digest, repository: repository.dirtiness }),
  };
  return { body: Object.freeze(body), digest: fingerprint(body) };
}

function diagnosisEnginesFailure(error: unknown, commandId: string, runId: string): GefError {
  const detail = error instanceof EngineUnavailableError ? error.detail : error instanceof Error ? error.message : String(error);
  const engine = error instanceof EngineUnavailableError ? error.engine : "unknown";
  return createGefError({
    id: `cli-engine-${commandId}`,
    category: "CAPABILITY",
    reason: "engine_unavailable",
    severity: "ERROR",
    summary: "A required diagnostic engine is unavailable",
    retryability: "MANUAL_ONLY",
    recoverability: "NONE_REQUIRED",
    terminal: "BLOCKED",
    commandId,
    runId,
    metadata: { engine, detail },
    remediations: [{ actionId: "gef.cli.verify_installation" }],
  });
}

async function diagnosisHandler(verb: DiagnosisVerb, input: DiagnosisInput, context: ExecutionContext): Promise<HandlerOutcome<unknown>> {
  const commandId = verb === "doctor" ? "gef.doctor.run" : "gef.status.show";
  let engines: Engines;
  try {
    engines = await loadEngines();
  } catch (error: unknown) {
    return { ok: false, error: diagnosisEnginesFailure(error, commandId, context.runId) };
  }

  const targetRef = context.target?.targetRef ?? input.targetRef ?? context.ports.environment?.values["GEF_TARGET"] ?? process.cwd();
  const observation = observeTarget(targetRef);
  const repository = observeRepository(targetRef);
  const repositoryVerdict: RepositoryStateResult | null = repository.dirtiness === "UNKNOWN" ? null : engines.repositoryState(repository.input);
  const governance = observeGovernance(targetRef);
  // Either managed path can have recorded the baseline, and status is verb-agnostic: it reports
  // whichever governed artifact exists instead of assuming `init`.
  const recordedInit = readRecordedArtifact(targetRef, "init");
  const recorded = recordedInit.present ? recordedInit : readRecordedArtifact(targetRef, "adopt");
  // Drift is a comparison, so it is only computed when a supported recorded baseline actually
  // exists. Comparing against a sentinel would manufacture a change event that no evidence
  // supports.
  const drift =
    recordedBaselineSupported(recorded) && recorded.recordedObservationFingerprint !== null
      ? engines.detectDrift({ observation: recorded.recordedObservationFingerprint }, { observation: observation.stateFingerprint }, { authorized: false })
      : null;

  const composition =
    verb === "doctor"
      ? doctorComposition(engines, targetRef, observation, repository, governance)
      : statusComposition(engines, targetRef, observation, repository, repositoryVerdict, governance, drift, recorded);

  return { ok: true, value: { commandId, effect: "NONE", [verb]: composition.body, [`${verb}Digest`]: composition.digest } };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export const CLI_COMMAND_IDS: readonly string[] = Object.freeze([
  "gef.init.plan",
  "gef.init.run",
  "gef.adopt.preview",
  "gef.adopt.apply",
  "gef.doctor.run",
  "gef.status.show",
]);

/** Help inventory passed to `helpIndex`; the engine owns ordering and projection. */
export const HELP_INVENTORY: readonly HelpCommandDescriptor[] = Object.freeze([
  { id: "gef.adopt.preview", summary: "preview brownfield adoption (safe, read-only)", schema: null },
  { id: "gef.adopt.apply", summary: "run the governed adoption path", schema: null },
  { id: "gef.init.plan", summary: "plan project initialization (safe, read-only)", schema: null },
  { id: "gef.init.run", summary: "run the governed initialization path", schema: null },
  { id: "gef.doctor.run", summary: "run read-only environment, repository and integrity diagnostics", schema: null },
  { id: "gef.status.show", summary: "show observed governed project and repository status", schema: null },
]);

const MUTATION_SECURITY_CLASS = "filesystem-mutation";

export function cliRegistrations(): readonly CommandRegistration[] {
  const mutationRegistrations: readonly CommandRegistration<CliCommandInput, unknown>[] = [
    {
      commandId: "gef.init.plan",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "m48-m54-maintenance",
      mutation: false,
      requiresTarget: false,
      validateInput: validateCliInput,
      handler: (input, context) => planHandler("init", input, context),
    },
    {
      commandId: "gef.init.run",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "m48-m54-maintenance",
      mutation: true,
      requiresTarget: true,
      securityClass: MUTATION_SECURITY_CLASS,
      validateInput: validateCliInput,
      handler: (input, context) => applyHandler("init", input, context),
    },
    {
      commandId: "gef.adopt.preview",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "security-reliability-integrations",
      mutation: false,
      requiresTarget: false,
      validateInput: validateCliInput,
      handler: (input, context) => planHandler("adopt", input, context),
    },
    {
      commandId: "gef.adopt.apply",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "security-reliability-integrations",
      mutation: true,
      requiresTarget: true,
      securityClass: MUTATION_SECURITY_CLASS,
      validateInput: validateCliInput,
      handler: (input, context) => applyHandler("adopt", input, context),
    },
  ];
  const diagnosisRegistrations: readonly CommandRegistration<DiagnosisInput, unknown>[] = [
    {
      commandId: "gef.doctor.run",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "m48-m54-maintenance+security-reliability-integrations",
      mutation: false,
      requiresTarget: false,
      validateInput: validateDiagnosisInput,
      handler: (input, context) => diagnosisHandler("doctor", input, context),
    },
    {
      commandId: "gef.status.show",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "m41-m47-platform+m55-m61-quality+m62-m63-final",
      mutation: false,
      requiresTarget: false,
      validateInput: validateDiagnosisInput,
      handler: (input, context) => diagnosisHandler("status", input, context),
    },
  ];
  const registrations: readonly CommandRegistration[] = [
    ...(mutationRegistrations as readonly CommandRegistration[]),
    ...(diagnosisRegistrations as readonly CommandRegistration[]),
  ];
  return Object.freeze(registrations);
}

export function buildRegistry(): CommandRegistry {
  return new CommandRegistry(cliRegistrations());
}

export { GEF_STATE_DIRECTORY, RECEIPTS_DIRECTORY, GEF_GOVERNANCE_LABELS };
