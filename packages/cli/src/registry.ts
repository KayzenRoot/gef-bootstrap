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

import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { accessSync, closeSync, constants, fstatSync, lstatSync, openSync, readSync, readdirSync, realpathSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";

import type { GefError, HandlerOutcome } from "@gef-bootstrap/contracts";
import { CommandRegistry, createGefError } from "@gef-bootstrap/kernel";
import type { CommandRegistration, ExecutionContext } from "@gef-bootstrap/kernel";
import { ToolObservationSession } from "@gef-bootstrap/preflight/toolchain";
// Type-only: the frozen contract shapes come from the package root and are erased at compile time,
// so importing them costs the packaged CLI no runtime dependency beyond the toolchain module.
import type { MutablePreflightCounters, ToolDescriptor, ToolObservation, ToolObservationPort, ToolPresenceStatus, ToolProbeResult, ToolProbeSpec, ToolResolutionResult } from "@gef-bootstrap/preflight";

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

// ---------------------------------------------------------------------------
// Git toolchain authority (M04-S04 TOOL-06/TOOL-16, SEC-05)
// ---------------------------------------------------------------------------
//
// The Git executable is never selected by ambient PATH. `GBS-M04-S04` TOOL-06 admits only an
// approved logical tool or an explicitly admitted trusted path, and TOOL-16 states that files
// inside the target repository are not trusted executable sources. Resolution therefore walks a
// fixed, code-declared list of system-owned locations and takes the first that exists, is a
// regular executable file, and can be given a stable identity. The observation target and the
// caller's PATH are never consulted, so a repository-supplied or PATH-prepended `git` cannot run
// merely because an operator asked for a read-only diagnostic.
//
// The frozen preflight toolchain contract is reused directly: the descriptor, resolution result,
// probe spec and `ToolObservationSession` all come from `@gef-bootstrap/preflight/toolchain`.
// ---------------------------------------------------------------------------
// Git executable trust policy (M04-S04 TOOL-06/TOOL-16, SEC-05; audit H11)
// ---------------------------------------------------------------------------
//
// H10 bound the executable to a closed list of lexical locations. A lexical list is not a trust
// policy on its own: an admitted *path string* can be a symlink, junction or reparse alias whose
// physical target is somewhere else entirely. H11 therefore admits a candidate only when the
// **physical executable actually reached** satisfies an explicit, declared policy:
//
//   1. the requested reference is one of the policy's declared candidate paths (lexical admission);
//   2. the physical target (`realpath`) is inside one of the policy's approved physical roots,
//      compared after resolving the root too, so a root that is itself an alias is normalized
//      consistently;
//   3. the physical target is a regular file the current process may execute;
//   4. on platforms that expose POSIX permission bits, the physical target is not writable by group
//      or others. Where the platform exposes no such primitive the admission records that the
//      permission proof is unavailable rather than claiming it passed.
//
// Alias behaviour is therefore explicit: **aliases are permitted, but only when the final physical
// target passes the physical-root and permission policy**. A candidate whose physical target escapes
// that policy is refused even though its path string is admitted.
//
// Neither the lexical list nor the roots are derived from the environment, and no ambient value can
// add, reorder or redirect them.

/** One approved physical root and the reason this platform trusts it. */
export interface ApprovedExecutableRoot {
  readonly root: string;
  readonly rationale: string;
}

/** The declared executable trust policy. The `policyRef` names it in descriptors and in evidence. */
export interface GitExecutableTrustPolicy {
  readonly policyRef: string;
  readonly roots: readonly ApprovedExecutableRoot[];
  readonly candidates: readonly string[];
  /** Explicit alias behaviour: a link-like candidate is admitted only via its physical target. */
  readonly aliasBehaviour: "PHYSICAL_TARGET_MUST_PASS_ROOT_AND_PERMISSION_POLICY";
  /**
   * The declared write-authority requirement enforced on the executable and on the path components
   * whose replacement could redirect execution.
   *
   * `MACHINE_NON_REPLACEABLE` is the high-assurance default: the current process must be unable to
   * modify the executable or replace it through an ancestor directory. `USER_MANAGED_DECLARED` is
   * an explicitly weaker decision an operator makes for a user-managed tool location; it still
   * refuses group/other-writable targets but accepts that the owner may replace them. The weaker
   * one is never reachable by default.
   */
  readonly writeAuthority: "MACHINE_NON_REPLACEABLE" | "USER_MANAGED_DECLARED";
}

export const GIT_TRUST_POLICY_REF = "gef.cli.git-executable-policy.v3";

/** The explicitly weaker policy for operator-declared, user-managed tool locations. */
export const GIT_USER_MANAGED_POLICY_REF = "gef.cli.git-executable-policy.user-managed.v1";

/** POSIX permission bits that would let a non-owner modify the executable. */
const GROUP_OR_OTHER_WRITE_BITS = 0o022;

function defaultRoots(): readonly ApprovedExecutableRoot[] {
  return process.platform === "win32"
    ? [
        { root: "C:\\Program Files\\Git", rationale: "machine-wide Git for Windows install; writing there requires administrator privilege" },
        { root: "C:\\Program Files (x86)\\Git", rationale: "machine-wide 32-bit Git for Windows install; administrator-only write" },
      ]
    : [
        { root: "/usr/bin", rationale: "distribution package manager target; root-owned and not group/other writable" },
        { root: "/bin", rationale: "traditional distribution location; normalized to its physical root before comparison" },
        { root: "/usr/local/bin", rationale: "administrator-managed local prefix; admitted because the physical target must still prove non-group/other-writable" },
        { root: "/opt/homebrew/bin", rationale: "macOS Homebrew prefix, owned by the installing account; non-group/other-writable proof still required" },
        { root: "/opt/local/bin", rationale: "macOS MacPorts prefix, same proof requirement" },
      ];
}

function candidatesFor(roots: readonly ApprovedExecutableRoot[]): readonly string[] {
  const candidates: string[] = [];
  for (const entry of roots) {
    if (process.platform === "win32") {
      candidates.push(`${entry.root}\\cmd\\git.exe`, `${entry.root}\\bin\\git.exe`);
    } else {
      candidates.push(`${entry.root}/git`);
    }
  }
  return Object.freeze(candidates);
}

/** The frozen default policy for this platform. */
export const DEFAULT_GIT_TRUST_POLICY: GitExecutableTrustPolicy = Object.freeze({
  policyRef: GIT_TRUST_POLICY_REF,
  roots: Object.freeze(defaultRoots()),
  candidates: candidatesFor(Object.freeze(defaultRoots())),
  aliasBehaviour: "PHYSICAL_TARGET_MUST_PASS_ROOT_AND_PERMISSION_POLICY",
  writeAuthority: "MACHINE_NON_REPLACEABLE",
});

/**
 * The explicitly weaker policy for operator-declared, user-managed tool locations.
 *
 * A user-managed Git (a package manager prefix owned by the installing account, a per-user
 * install) is replaceable by that account by construction, so it can never satisfy the machine
 * policy. Admitting it is a separate trust decision with its own policy reference: still inside a
 * declared root, still a regular executable, still not group/other writable — but explicitly not
 * equivalent to a machine-trusted default. It is only reachable by injecting it deliberately.
 */
export const USER_MANAGED_GIT_TRUST_POLICY: GitExecutableTrustPolicy = Object.freeze({
  policyRef: GIT_USER_MANAGED_POLICY_REF,
  roots: Object.freeze(defaultRoots()),
  candidates: candidatesFor(Object.freeze(defaultRoots())),
  aliasBehaviour: "PHYSICAL_TARGET_MUST_PASS_ROOT_AND_PERMISSION_POLICY",
  writeAuthority: "USER_MANAGED_DECLARED",
});

/** Build a user-managed policy over explicit roots, for embeddings and tests. */
export function userManagedGitTrustPolicy(roots: readonly ApprovedExecutableRoot[]): GitExecutableTrustPolicy {
  const frozen = Object.freeze([...roots]);
  return Object.freeze({
    policyRef: GIT_USER_MANAGED_POLICY_REF,
    roots: frozen,
    candidates: candidatesFor(frozen),
    aliasBehaviour: "PHYSICAL_TARGET_MUST_PASS_ROOT_AND_PERMISSION_POLICY",
    writeAuthority: "USER_MANAGED_DECLARED",
  });
}

/** The candidate paths of the frozen default policy, in deterministic precedence order. */
export const GIT_APPROVED_EXECUTABLES: readonly string[] = DEFAULT_GIT_TRUST_POLICY.candidates;

/** Frozen tool identity for the Git executable. */
export const GIT_TOOL_ID = "git";

/** Compatibility alias for the declared policy reference. */
export const GIT_EXECUTABLE_POLICY_REF = GIT_TRUST_POLICY_REF;

/** The policy's version probe contract: bounded, shell-free, argv-only. */
export const GIT_VERSION_PROBE_TIMEOUT_MS = 5_000;
export const GIT_VERSION_PROBE_MAX_OUTPUT_BYTES = 64 * 1024;

/**
 * The only environment a Git probe receives.
 *
 * Keys are admitted individually and each one is here for a stated runtime reason; nothing else is
 * forwarded, so `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`,
 * `GIT_ALTERNATE_OBJECT_DIRECTORIES`, `GIT_NAMESPACE`, `GIT_CEILING_DIRECTORIES`, `GIT_COMMON_DIR`,
 * `GIT_CONFIG*`, `GIT_TRACE*` and hook/process redirection variables cannot reach the child at all.
 * That is an allowlist rather than a denylist: an unanticipated Git-control variable is excluded by
 * construction. `PATH` is admitted for the child's own runtime portability and is explicitly **not**
 * used to choose the executable — resolution happens against approved locations only.
 */
const GIT_PROBE_ENVIRONMENT_KEYS: readonly string[] = Object.freeze([
  "PATH",
  "HOME",
  "USERPROFILE",
  "SystemRoot",
  "WINDIR",
  "PATHEXT",
  "TEMP",
  "TMP",
  "TMPDIR",
]);

/** Build the minimal child environment for a Git probe. */
export function gitProbeEnvironment(): Readonly<Record<string, string>> {
  const environment: Record<string, string> = { GIT_OPTIONAL_LOCKS: "0" };
  for (const key of GIT_PROBE_ENVIRONMENT_KEYS) {
    const value = process.env[key];
    if (typeof value === "string" && value.length > 0) environment[key] = value;
  }
  return Object.freeze(environment);
}

/** How a platform could prove the executable's ownership/permission trust property. */
export type PermissionProof = "POSIX_MODE_NO_GROUP_OR_OTHER_WRITE" | "UNAVAILABLE_ON_PLATFORM";

/**
 * How the policy established that no path component can be used to replace the executable.
 *
 *  means every directory from the approved root to the executable was
 * checked with the platform's own effective-write primitive.  means the
 * platform exposes no non-mutating directory-write check: the executable's own ACL denial is then
 * the whole basis, and that weaker basis is reported rather than silently treated as equivalent.
 */
export type DirectoryProof = "EFFECTIVE_WRITE_PER_COMPONENT" | "UNAVAILABLE_ON_PLATFORM";

/** The CLI's own richer view of one trust inspection, of which the frozen port sees a projection. */
export interface PhysicalTrustInspection {
  readonly status: ToolPresenceStatus;
  readonly executable?: string;
  readonly physicalPath?: string;
  readonly executableIdentity?: string;
  readonly reasonCode?: string;
  readonly aliasTraversed: boolean;
  readonly permissionProof: PermissionProof;
  /** How the policy established that this process cannot replace the executable through its path. */
  readonly directoryProof: DirectoryProof;
}

/** The descriptor for one admitted Git location, under the declared policy. */
export function gitToolDescriptor(executable: string, policy: GitExecutableTrustPolicy = DEFAULT_GIT_TRUST_POLICY): ToolDescriptor {
  return Object.freeze({
    toolId: GIT_TOOL_ID,
    source: "BUILTIN",
    resolution: { kind: "TRUSTED_PATH", executable, policyRef: policy.policyRef } as const,
    versionProbe: { argv: Object.freeze(["--version"]), timeoutMs: GIT_VERSION_PROBE_TIMEOUT_MS, maxOutputBytes: GIT_VERSION_PROBE_MAX_OUTPUT_BYTES },
  });
}

function normalizedForPlatform(value: string): string {
  return process.platform === "win32" ? value.toLowerCase() : value;
}

function withinRoot(root: string, candidate: string): boolean {
  const normalizedRoot = normalizedForPlatform(root);
  const normalizedCandidate = normalizedForPlatform(candidate);
  if (normalizedCandidate === normalizedRoot) return true;
  return normalizedCandidate.startsWith(normalizedRoot.endsWith(sep) ? normalizedRoot : `${normalizedRoot}${sep}`);
}

/**
 * Inspect one declared candidate under the policy: lexical admission, then physical trust.
 *
 * Deterministic refusals, each with its own code: `gef.cli.git.path_not_absolute`,
 * `gef.cli.git.path_not_admitted` (lexical), `gef.cli.git.executable_absent`,
 * `gef.cli.git.executable_unresolvable`, `gef.cli.git.physical_path_not_admitted` (the physical
 * target escapes every approved root), `gef.cli.git.executable_not_regular`,
 * `gef.cli.git.executable_not_executable` and `gef.cli.git.physical_path_writable_by_others`.
 */
export function inspectAdmittedExecutable(executable: string, policy: GitExecutableTrustPolicy = DEFAULT_GIT_TRUST_POLICY): PhysicalTrustInspection {
  const unavailable = (reasonCode: string, aliasTraversed = false): PhysicalTrustInspection => ({ status: "UNAVAILABLE", reasonCode, aliasTraversed, permissionProof: permissionProofSupport(), directoryProof: directoryProofSupport() });
  if (!isAbsolute(executable) || executable.length === 0) return unavailable("gef.cli.git.path_not_absolute");
  const normalized = normalizedForPlatform(executable);
  if (!policy.candidates.map(normalizedForPlatform).includes(normalized)) return unavailable("gef.cli.git.path_not_admitted");

  let linkStats: ReturnType<typeof lstatSync>;
  try {
    linkStats = lstatSync(executable);
  } catch {
    return { status: "ABSENT", reasonCode: "gef.cli.git.executable_absent", aliasTraversed: false, permissionProof: permissionProofSupport(), directoryProof: directoryProofSupport() };
  }
  const aliasTraversed = linkStats.isSymbolicLink();

  // Physical target first: this is what the policy actually authorizes.
  let physical: string;
  try {
    physical = realpathSync.native(executable);
  } catch {
    return unavailable("gef.cli.git.executable_unresolvable", aliasTraversed);
  }
  const approvedRoots: string[] = [];
  for (const entry of policy.roots) {
    try {
      approvedRoots.push(realpathSync.native(entry.root));
    } catch {
      // A root that does not exist on this platform cannot authorize anything.
    }
  }
  if (!approvedRoots.some((root) => withinRoot(root, physical))) return unavailable("gef.cli.git.physical_path_not_admitted", aliasTraversed);

  let stats: ReturnType<typeof statSync>;
  try {
    stats = statSync(physical);
  } catch {
    return unavailable("gef.cli.git.executable_unresolvable", aliasTraversed);
  }
  if (!stats.isFile()) return unavailable("gef.cli.git.executable_not_regular", aliasTraversed);
  try {
    accessSync(physical, constants.X_OK);
  } catch {
    return unavailable("gef.cli.git.executable_not_executable", aliasTraversed);
  }

  const permissionProof = permissionProofSupport();
  if (permissionProof === "POSIX_MODE_NO_GROUP_OR_OTHER_WRITE" && (stats.mode & GROUP_OR_OTHER_WRITE_BITS) !== 0) {
    return unavailable("gef.cli.git.physical_path_writable_by_others", aliasTraversed);
  }

  // Write authority (audit H14). An executable the current process can modify is replaceable after
  // admission, so containment and permission bits alone are not trust.
  if (policy.writeAuthority === "MACHINE_NON_REPLACEABLE") {
    // The executable itself: an OS-enforced write attempt. Opening for writing is refused by the
    // ACL/permission model when this process may not modify the file, and succeeds when it may.
    if (canOpenForWriting(physical)) return unavailable("gef.cli.git.physical_path_writable_by_process", aliasTraversed);
    // Then every component whose replacement could redirect execution. A denied write-open on the
    // file does not prove the caller cannot rename or replace it through a directory, so the whole
    // chain that makes the declared root non-replaceable must be proven (final H14).
    const blocked = replacementAuthority(physical);
    if (blocked !== null) return unavailable(`gef.cli.git.${blocked}`, aliasTraversed);
  }

  const identity = createHash("sha256").update(`${physical}|${String(stats.dev)}|${String(stats.ino)}|${String(stats.size)}|${String(stats.mtimeMs)}`).digest("hex");
  return { status: "FOUND", executable, physicalPath: physical, executableIdentity: identity, aliasTraversed, permissionProof, directoryProof: directoryProofSupport() };
}

/**
 * Whether this process can open `path` for writing.
 *
 * This is the effective write-authority primitive: an open for writing is evaluated by the operating
 * system's own permission model, so it answers "can this process modify this object" rather than
 * "does the mode look a certain way". No byte is ever written — the handle is closed immediately.
 * On Windows this is the strongest available proof, because POSIX mode bits do not exist and Node
 * exposes no ACL API; `EPERM`/`EACCES` there means the ACL denies this process write access.
 */
function canOpenForWriting(path: string): boolean {
  try {
    const descriptor = openSync(path, "r+");
    closeSync(descriptor);
    return true;
  } catch (cause: unknown) {
    const code = (cause as { readonly code?: unknown }).code;
    // A file the platform refuses to open for writing at all (for example a read-only attribute) is
    // equally non-writable for this process.
    if (code === "EPERM" || code === "EACCES" || code === "EROFS") return false;
    // Any other failure is not evidence of non-writability, so it must not be read as one.
    return true;
  }
}

/**
 * The first component in the replacement-authority chain this process can replace, or  when
 * the chain is fully proven non-replaceable.
 *
 * Replacing a path entry is controlled by the directory that holds it, so the proof does not stop
 * at the declared root: a non-writable root can still be renamed or replaced when its own parent is
 * caller-writable. On POSIX the chain therefore runs from the executable's directory upward through
 * the declared root and every ancestor, and terminates at the filesystem root — which has no parent
 * and needs no further proof. Every link must deny this process effective write authority.
 *
 * On Windows the runtime exposes no non-mutating effective directory-write or ACL primitive, so the
 * chain cannot be proven there at all. Rather than substituting an assumption for a proof, the
 * caller receives  and the high-assurance policy returns
 * UNAVAILABLE.  therefore never coexists with .
 */
function replacementAuthority(physical: string): string | null {
  // Replacement authority on Windows is governed by two rights that are independent of generic
  // write access: DELETE on the target object and FILE_DELETE_CHILD on the containing directory. A
  // denied write-open proves neither. This was verified against the platform: a read-only file whose
  // r+ open is refused can still be renamed, so the write-open probe is not evidence of
  // non-replaceability and must not be treated as such.
  //
  // The supported runtime exposes no way to request DELETE or FILE_DELETE_CHILD access, so no
  // OS-enforced probe for them exists, and Node exposes no security-descriptor API. A narrowed
  // effective-rights oracle would need a native binding or a P/Invoke evaluator, which is an
  // architecture and packaging decision above this Work Order. Until such an oracle exists, the
  // high-assurance policy fails closed here rather than inferring trust from a path or from a
  // failed generic write: no Windows candidate is admitted by MACHINE_NON_REPLACEABLE.
  if (process.platform === "win32") return "replacement_rights_proof_unavailable";
  // POSIX: replacement of a path entry is controlled by the directory that holds it, so the chain
  // runs from the executable upward through every ancestor and terminates at the filesystem root —
  // which has no parent and needs no further proof.
  const fsRoot = parse(physical).root;
  const chain: string[] = [];
  let current = dirname(physical);
  while (true) {
    chain.push(current);
    if (normalizedForPlatform(current) === normalizedForPlatform(fsRoot)) break;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  for (const component of chain) {
    if (canAccessForWriting(component)) return "physical_path_parent_replaceable_by_process";
  }
  return null;
}

/** POSIX effective-write check for a directory: whether this process may modify its entries. */
function canAccessForWriting(component: string): boolean {
  try {
    accessSync(component, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** Whether this platform can prove the ownership/permission property deterministically. */
function permissionProofSupport(): PermissionProof {
  return process.platform === "win32" ? "UNAVAILABLE_ON_PLATFORM" : "POSIX_MODE_NO_GROUP_OR_OTHER_WRITE";
}

/** Whether this platform can check directory replacement authority without mutating anything. */
function directoryProofSupport(): DirectoryProof {
  // On POSIX the component chain is proven with the effective-write bit. On Windows neither DELETE
  // nor FILE_DELETE_CHILD can be evaluated, so the chain is not proven there at all — and because
  // the high-assurance policy refuses to admit a Windows candidate without it, this value never
  // accompanies FOUND.
  return process.platform === "win32" ? "UNAVAILABLE_ON_PLATFORM" : "EFFECTIVE_WRITE_PER_COMPONENT";
}

/**
 * The frozen port contract allows a port to answer synchronously or asynchronously. This CLI port
 * answers synchronously, which lets the read-only probes stay synchronous — the WO-002 transaction
 * path calls them from synchronous composition code — so the narrower type is declared here and is
 * structurally assignable to the frozen `ToolObservationPort`.
 *
 * `probe` is the **only** place a Git process is launched. It re-inspects the executable under the
 * same policy immediately before spawning and refuses if the physical target or its identity no
 * longer matches what the policy admitted (audit H12), so a replacement between resolution and
 * execution cannot produce evidence that disagrees with the process that actually ran.
 */
export interface SyncToolObservationPort {
  readonly policy: GitExecutableTrustPolicy;
  resolve(descriptor: ToolDescriptor): ToolResolutionResult;
  probe(spec: ToolProbeSpec): ToolProbeResult;
  /** Frozen-session counter object for this port instance. */
  readonly counters: MutablePreflightCounters;
  /** Reason the most recent probe was refused before execution, if it was. */
  lastSpawnRefusal(): string | null;
  /** The identity verified for an executable by this port instance, if any. */
  verifiedIdentity(executable: string): string | null;
  /** The physical path and permission proof recorded for an executable, if any. */
  verifiedPhysical(executable: string): { readonly physicalPath: string; readonly permissionProof: PermissionProof; readonly aliasTraversed: boolean } | null;
}

/** Create a fresh port instance with its own verification memory. */
export function createCliToolObservationPort(policy: GitExecutableTrustPolicy = DEFAULT_GIT_TRUST_POLICY): SyncToolObservationPort {
  const verified = new Map<string, { readonly identity: string; readonly physicalPath: string; readonly permissionProof: PermissionProof; readonly aliasTraversed: boolean }>();
  let lastRefusal: string | null = null;

  const inspect = (executable: string): PhysicalTrustInspection => inspectAdmittedExecutable(executable, policy);

  const port: SyncToolObservationPort = {
    policy,
    counters: createMutableToolCounters(),
    resolve(descriptor: ToolDescriptor): ToolResolutionResult {
      const resolution = descriptor.resolution;
      if (resolution.kind !== "TRUSTED_PATH" || resolution.policyRef !== policy.policyRef) {
        return { status: "UNAVAILABLE", reasonCode: "gef.cli.git.untrusted_resolution_kind" };
      }
      const inspection = inspect(resolution.executable);
      if (inspection.status === "FOUND" && inspection.executableIdentity !== undefined && inspection.physicalPath !== undefined) {
        verified.set(resolution.executable, {
          identity: inspection.executableIdentity,
          physicalPath: inspection.physicalPath,
          permissionProof: inspection.permissionProof,
          aliasTraversed: inspection.aliasTraversed,
        });
        return { status: "FOUND", executable: inspection.executable as string, executableIdentity: inspection.executableIdentity };
      }
      verified.delete(resolution.executable);
      return {
        status: inspection.status,
        ...(inspection.reasonCode === undefined ? {} : { reasonCode: inspection.reasonCode }),
      };
    },
    probe(spec: ToolProbeSpec): ToolProbeResult {
      const expected = verified.get(spec.executable);
      if (expected === undefined) {
        lastRefusal = "gef.cli.git.probe_before_resolution";
        return { status: "FAILED", stdout: "", stderr: "" };
      }
      // Execution-time revalidation: the exact same policy, immediately before the launch.
      const current = inspect(spec.executable);
      if (current.status !== "FOUND" || current.executableIdentity !== expected.identity || current.physicalPath !== expected.physicalPath) {
        lastRefusal = current.reasonCode ?? "gef.cli.git.identity_changed_before_spawn";
        verified.delete(spec.executable);
        return { status: "FAILED", stdout: "", stderr: "" };
      }
      // The probe environment is the port's minimal allowlist plus whatever the spec declares, so a
      // caller can never widen it by accident.
      const result = spawnSync(current.physicalPath ?? spec.executable, [...spec.argv], {
        encoding: "utf8",
        timeout: spec.timeoutMs,
        maxBuffer: spec.maxOutputBytes,
        env: { ...gitProbeEnvironment(), ...spec.env },
      });
      if (result.error !== undefined) {
        const timedOut = (result.error as { readonly code?: unknown }).code === "ETIMEDOUT";
        return { status: timedOut ? "TIMED_OUT" : "FAILED", stdout: "", stderr: "" };
      }
      return {
        status: "SUCCEEDED",
        ...(typeof result.status === "number" ? { exitCode: result.status } : {}),
        stdout: String(result.stdout ?? ""),
        stderr: String(result.stderr ?? ""),
      };
    },
    lastSpawnRefusal(): string | null {
      return lastRefusal;
    },
    verifiedIdentity(executable: string): string | null {
      return verified.get(executable)?.identity ?? null;
    },
    verifiedPhysical(executable: string): { readonly physicalPath: string; readonly permissionProof: PermissionProof; readonly aliasTraversed: boolean } | null {
      const record = verified.get(executable);
      return record === undefined ? null : { physicalPath: record.physicalPath, permissionProof: record.permissionProof, aliasTraversed: record.aliasTraversed };
    },
  };
  return Object.freeze(port);
}

/** Counters required by the frozen session; the CLI reports no counter evidence. */
function createMutableToolCounters(): MutablePreflightCounters {
  return { environmentReads: new Map(), gitReads: new Map(), providerReads: 0, toolResolutions: new Map(), toolProbes: new Map(), cacheHits: 0, skippedByPrerequisite: 0 };
}

export interface ResolvedGitTool {
  readonly executable: string;
  readonly identity: string;
  readonly physicalPath: string;
  readonly permissionProof: PermissionProof;
  readonly aliasTraversed: boolean;
  readonly descriptor: ToolDescriptor;
}

/** One CLI invocation's Git tool snapshot, together with the port that verified it. */
export interface GitToolInvocation {
  readonly port: SyncToolObservationPort;
  readonly policy: GitExecutableTrustPolicy;
  readonly tool: ResolvedGitTool | null;
}

/**
 * Resolve Git through an explicit port.
 *
 * This is the frozen contract's own injection point (M04-S04 TOOL-03: tool discovery crosses an
 * injectable typed port). The built-in model is the CLI port over the declared policy; an embedding
 * or a test may supply a different port or policy without any environment variable being able to
 * influence which executable is trusted.
 */
export function resolveGitToolWith(port: SyncToolObservationPort): ResolvedGitTool | null {
  for (const candidate of port.policy.candidates) {
    if (candidate.length === 0) continue;
    const descriptor = gitToolDescriptor(candidate, port.policy);
    let resolution: ToolResolutionResult;
    try {
      resolution = port.resolve(descriptor);
    } catch {
      // A port that cannot answer is a resolution failure, never a reason to try elsewhere.
      return null;
    }
    if (resolution.status === "FOUND" && resolution.executable !== undefined && resolution.executableIdentity !== undefined) {
      const physical = port.verifiedPhysical(resolution.executable);
      if (physical === null) return null;
      return {
        executable: resolution.executable,
        identity: resolution.executableIdentity,
        physicalPath: physical.physicalPath,
        permissionProof: physical.permissionProof,
        aliasTraversed: physical.aliasTraversed,
        descriptor,
      };
    }
  }
  return null;
}

/**
 * The Git tool snapshot for the invocation currently in progress.
 *
 * M04-S04 TOOL-13 permits reuse inside one invocation and TOOL-14 forbids making cross-run caches
 * authoritative, so the snapshot is bound to the **asynchronous execution context** rather than to
 * module-global mutable state. `runCli` is asynchronous: with a global "active invocation" two
 * overlapping invocations could interleave — one installing its scope, the other replacing it — and
 * a probe could then observe another invocation's policy, port or executable. A stack would not fix
 * that either, because concurrent promises do not complete in nesting order.
 *
 * `AsyncLocalStorage` gives every invocation, and every nested invocation inside it, its own store,
 * which follows the asynchronous chain instead of a global slot. A probe taken outside any
 * invocation resolves for that call alone and never observes another invocation's state, so an
 * executable changed between two logical `runCli` calls is re-resolved rather than trusted.
 */
const gitInvocationContext = new AsyncLocalStorage<GitToolInvocation>();

/** Create one invocation's Git authority: its own policy, its own port, its own resolved tool. */
export function createGitToolInvocation(policy: GitExecutableTrustPolicy = DEFAULT_GIT_TRUST_POLICY): GitToolInvocation {
  const port = createCliToolObservationPort(policy);
  return Object.freeze({ port, policy, tool: resolveGitToolWith(port) });
}

/**
 * Run `body` with its own Git invocation authority.
 *
 * Nested calls get their own store, and sibling calls started from the same context cannot see each
 * other's. The binding follows the asynchronous chain, so it survives `await` and does not depend on
 * completion order.
 */
export function withGitToolInvocation<T>(policy: GitExecutableTrustPolicy, body: () => T): T {
  return gitInvocationContext.run(createGitToolInvocation(policy), body);
}

/**
 * The port and the tool it resolved, bound together for this call.
 *
 * Inside an invocation this is the invocation's snapshot. Outside one, a port is created for this
 * call alone and discarded with the resolution it made — the two are always returned together so a
 * probe can never consult a different port from the one that verified the executable, and nothing
 * is reused across calls (M04-S04 TOOL-14).
 */
function gitScope(): { readonly port: SyncToolObservationPort; readonly tool: ResolvedGitTool | null } {
  const active = gitInvocationContext.getStore();
  if (active !== undefined) return { port: active.port, tool: active.tool };
  // Outside any invocation: a fresh, isolated context for this call alone. It can never observe
  // another invocation's policy, port, tool or refusal state.
  const port = createCliToolObservationPort();
  return { port, tool: resolveGitToolWith(port) };
}

/** The Git tool for this call: the active invocation's snapshot, or a fresh single-call resolution. */
export function gitTool(): ResolvedGitTool | null {
  return gitScope().tool;
}

/** The port bound to this call's resolution. */
export function gitPort(): SyncToolObservationPort {
  return gitScope().port;
}

export interface GitProbeOutcome {
  readonly ok: boolean;
  readonly result: ToolProbeResult | null;
  /** Identity verified for the executable, filled only when a process actually ran. */
  readonly identity: string | null;
  /** Deterministic reason the probe did not run, when it did not. */
  readonly reason: string | null;
}

/**
 * Run one Git probe through the bound port.
 *
 * This is the only way the CLI launches a Git process. The port revalidates the physical target and
 * identity under the same trust policy immediately before the launch and refuses without spawning
 * when either has changed, so a replacement between resolution and execution cannot produce
 * evidence that disagrees with the process that ran.
 */
export function runGitProbe(argv: readonly string[], bounds: { readonly timeoutMs: number; readonly maxOutputBytes: number }): GitProbeOutcome {
  const { port, tool } = gitScope();
  if (tool === null) return { ok: false, result: null, identity: null, reason: "GIT_TOOL_UNAVAILABLE" };
  const result = port.probe({
    executable: tool.executable,
    argv: Object.freeze([...argv]),
    timeoutMs: bounds.timeoutMs,
    maxOutputBytes: bounds.maxOutputBytes,
    env: Object.freeze({}),
  });
  if (result.status !== "SUCCEEDED") {
    return { ok: false, result, identity: null, reason: port.lastSpawnRefusal() ?? `GIT_PROBE_${result.status}` };
  }
  return { ok: true, result, identity: port.verifiedIdentity(tool.executable) ?? tool.identity, reason: null };
}

/**
 * Frozen-session tool observation for the resolved Git, or the gap that prevented one.
 *
 * The observation is produced by the same invocation-bound port that performed the version probe, so
 * the identity reported is the identity of the executable that actually answered — never a value
 * captured earlier and never a cross-invocation cache.
 */
export async function observeGitTool(policy: GitExecutableTrustPolicy = gitInvocationContext.getStore()?.policy ?? DEFAULT_GIT_TRUST_POLICY): Promise<{ readonly observation: ToolObservation; readonly tool: ResolvedGitTool | null }> {
  const { port, tool } = gitScope();
  const session = new ToolObservationSession(port, createMutableToolCounters());
  if (tool === null) {
    const fallback = port.policy.candidates.find((candidate) => candidate.length > 0) ?? "git";
    const observation = await session.observe({ descriptor: gitToolDescriptor(fallback, port.policy), requireVersion: false });
    return { observation, tool: null };
  }
  const observed = await session.observe({
    descriptor: tool.descriptor,
    requireVersion: true,
    parseVersion: parseGitVersion,
    parseVersionRef: GIT_VERSION_PARSER_REF,
  });
  // Report an identity only when a probe actually succeeded through a verified executable. If the
  // resolution or the probe was refused, no identity is claimed at all — reporting the snapshot's
  // earlier identity here would make the evidence disagree with the process that ran (H12).
  const verifiedIdentity = observed.presence === "FOUND" && observed.probeStatus === "SUCCEEDED" ? port.verifiedIdentity(tool.executable) : null;
  return { observation: Object.freeze({ ...observed, ...(verifiedIdentity === null ? {} : { executableIdentity: verifiedIdentity }) }), tool };
}

/** Declared parser identity for the Git version token (M04-S04 TOOL-05/TOOL-09). */
export const GIT_VERSION_PARSER_REF = "gef.cli.git-version-parser.v1";

/**
 * Narrow Git version parser.
 *
 * `git --version` answers `git version <token>`, where the token may carry a vendor suffix such as
 * `2.55.0.windows.3`. Only that token is extracted; the rest of the output is ignored rather than
 * propagated, and an unrecognised shape yields no version at all. Whether a version is supported is
 * M51-owned and is never decided here.
 */
export function parseGitVersion(stdout: string, stderr: string): string | null {
  const match = /^git version ([0-9][0-9A-Za-z._+-]{0,63})(?:\s|$)/.exec(`${stdout}\n${stderr}`.trim());
  return match?.[1] ?? null;
}


const GIT_STATUS_TIMEOUT_MS = 10_000;
const GIT_STATUS_MAX_BUFFER = 8 * 1024 * 1024;

/**
 * Command-scoped Git overrides that keep the dirtiness probe side-effect free.
 *
 * Both entries are global options and therefore precede the subcommand:
 *
 * - `-c core.fsmonitor=false` — command-line configuration outranks system, global, local and
 *   worktree configuration, so a target repository cannot make this probe execute a
 *   repository-selected FSMonitor hook or start the built-in daemon merely because the operator
 *   ran a read-only diagnostic. The override is process-local: no user or repository Git
 *   configuration is read into GEF state, rewritten or persisted.
 * - `--no-optional-locks` — `git status` refreshes the index by default and may write the
 *   refreshed index as an optimization. Optional locks are disabled so the S0 probe cannot mutate
 *   the repository it is only meant to observe.
 *
 * Neither override changes what is reported: dirtiness still comes from `--porcelain` output, and
 * `GIT_OPTIONAL_LOCKS=0` in the probe environment is the deterministic second binding of the same
 * guarantee, so the protection does not depend on argument precedence alone.
 */
const GIT_STATUS_SAFETY_ARGV: readonly string[] = Object.freeze(["-c", "core.fsmonitor=false", "--no-optional-locks"]);

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
 * `git status --porcelain -z` is invoked with an argv array (no shell string is ever built), a
 * bounded timeout and a bounded output buffer, against the target repository only — no broad
 * rediscovery. The probe runs with repository-controlled optional locks and FSMonitor disabled, so
 * observing a hostile or merely refreshable repository cannot write its index or execute a
 * repository-selected process. A git binary that is missing, fails or times out yields `UNKNOWN`,
 * never an assumed clean tree.
 */
export function observeRepositoryDirtiness(targetRef: string): DirtinessEvidence {
  const modified: string[] = [];
  const staged: string[] = [];
  const untracked: string[] = [];
  const conflicted: string[] = [];
  // The probe runs the resolved approved executable through the same port that verified it, or it
  // does not run at all: an unresolved tool is `UNKNOWN`, never a fallback to whatever `git` the
  // ambient PATH would offer. The port revalidates the physical target and identity immediately
  // before the launch and refuses without spawning if either changed.
  const outcome = runGitProbe([...GIT_STATUS_SAFETY_ARGV, "-C", resolve(targetRef), "status", "--porcelain", "-z", "--untracked-files=normal"], { timeoutMs: GIT_STATUS_TIMEOUT_MS, maxOutputBytes: GIT_STATUS_MAX_BUFFER });
  if (!outcome.ok || outcome.result === null) {
    // A refusal before execution is reported by its own code, so an identity change is never
    // presented as an ordinary process failure.
    return { observation: "UNKNOWN", modified, staged, untracked, conflicted, detail: outcome.reason ?? "GIT_PROBE_REFUSED" };
  }
  const result = outcome.result;
  if (result.exitCode !== 0) {
    const detail = result.stderr.trim() || `exit ${String(result.exitCode)}`;
    return { observation: "UNKNOWN", modified, staged, untracked, conflicted, detail };
  }
  const entries = result.stdout.split("\0").filter((entry) => entry.length > 0);
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

/**
 * Bounded presence probe for the Git toolchain.
 *
 * The executable is the one the approved resolution established; a missing or unusable admitted
 * Git is a finding, not an assumption, and is never substituted by an ambient `git`.
 */
export function gitBinaryAvailable(): boolean {
  const outcome = runGitProbe(["--version"], { timeoutMs: GIT_PROBE_TIMEOUT_MS, maxOutputBytes: GIT_VERSION_PROBE_MAX_OUTPUT_BYTES });
  return outcome.ok && outcome.result !== null && outcome.result.exitCode === 0;
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

function doctorComposition(engines: Engines, targetRef: string, observation: TargetObservation, repository: RepositoryObservation, governance: GovernanceObservation, gitEvidence: ToolObservation | null): DiagnosisComposition {
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
    // Frozen M04-S04 tool evidence: logical tool id, normalized presence/version/compatibility and
    // gaps. No absolute executable path, no PATH contents and no raw probe output (TOOL-18).
    toolchain: {
      git:
        gitEvidence === null
          ? { toolId: GIT_TOOL_ID, presence: "UNAVAILABLE", probeStatus: "NOT_REQUIRED", compatibility: "NOT_CHECKED", gaps: ["gef.cli.git.evidence_unavailable"] }
          : {
              toolId: gitEvidence.toolId,
              presence: gitEvidence.presence,
              ...(gitEvidence.executableIdentity === undefined ? {} : { executableIdentity: gitEvidence.executableIdentity }),
              ...(gitEvidence.observedVersion === undefined ? {} : { observedVersion: gitEvidence.observedVersion }),
              probeStatus: gitEvidence.probeStatus,
              compatibility: gitEvidence.compatibility,
              gaps: gitEvidence.gaps.map((entry) => entry.code),
            },
    },
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
      ? doctorComposition(engines, targetRef, observation, repository, governance, (await observeGitTool()).observation)
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
