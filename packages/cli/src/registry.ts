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
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

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
 * Identity comes from `.git/HEAD` plus the well-known operation sentinels; dirtiness comes from
 * the deterministic `git status` read above. When `.git` exists but dirtiness cannot be proven,
 * the observation is reported as `UNKNOWN` and no engine verdict is fabricated from it — the
 * caller blocks mutation instead.
 */
export function observeRepository(targetRef: string): RepositoryObservation {
  const absolute = resolve(targetRef);
  const gitDirectory = resolve(absolute, ".git");
  if (!existsSync(gitDirectory)) {
    // No repository: the state is known to be "absent", not unknown.
    return { input: {}, observationLimits: ["NO_LOCAL_GIT_DIRECTORY"], dirtiness: "NOT_APPLICABLE" };
  }
  let head = "";
  let branch = "";
  try {
    const contents = readFileSync(resolve(gitDirectory, "HEAD"), "utf8").trim();
    if (contents.startsWith("ref:")) {
      const refName = contents.slice(4).trim();
      branch = refName.replace(/^refs\/heads\//, "");
      const refFile = resolve(gitDirectory, refName);
      head = existsSync(refFile) ? readFileSync(refFile, "utf8").trim() : "";
    } else {
      head = contents;
      branch = "DETACHED";
    }
  } catch {
    return { input: {}, observationLimits: ["HEAD_UNREADABLE", "WORKING_TREE_NOT_OBSERVED"], dirtiness: "UNKNOWN" };
  }
  const operation = GIT_OPERATION_SENTINELS.find(([sentinel]) => existsSync(resolve(gitDirectory, sentinel)))?.[1];
  const evidence = observeRepositoryDirtiness(absolute);
  if (evidence.observation !== "OBSERVED") {
    return {
      input: { repo: absolute, head, branch, ...(operation === undefined ? {} : { operation }) },
      observationLimits: ["WORKING_TREE_NOT_OBSERVED", `DIRTINESS_UNKNOWN${evidence.detail === undefined ? "" : `:${evidence.detail}`}`],
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
    observationLimits: [],
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
  for (const [relativePath, kind] of CANONICAL_CANDIDATES) {
    const physical = resolve(absolute, relativePath);
    if (!existsSync(physical)) continue;
    try {
      sources.push({ id: relativePath, kind, value: createHash("sha256").update(readFileSync(physical)).digest("hex") });
    } catch {
      // An unreadable candidate is simply not observed; it never fabricates a value.
    }
  }
  return Object.freeze(sources);
}

function artifactPathFor(targetRoot: string, verb: MutationVerb): string {
  return resolve(targetRoot, GEF_STATE_DIRECTORY, `${verb}-state.json`);
}

export interface RecordedArtifact {
  readonly ref: string;
  readonly present: boolean;
  readonly fingerprint: string;
  readonly recordedObservationFingerprint: string | null;
  readonly schemaVersionSupported: boolean;
}

/**
 * Read the previously recorded governed artifact, if any, without mutating anything.
 *
 * The document's schema version is enforced on read: an unsupported major version is reported
 * as such and never interpreted optimistically.
 */
export function readRecordedArtifact(targetRef: string, verb: MutationVerb): RecordedArtifact {
  const physical = artifactPathFor(resolve(targetRef), verb);
  const ref = `${GEF_STATE_DIRECTORY}/${verb}-state.json`;
  if (!existsSync(physical)) return { ref, present: false, fingerprint: "ABSENT", recordedObservationFingerprint: null, schemaVersionSupported: true };
  let body: Buffer;
  try {
    body = readFileSync(physical);
  } catch {
    return { ref, present: true, fingerprint: "UNREADABLE", recordedObservationFingerprint: null, schemaVersionSupported: false };
  }
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
  readonly readable: boolean;
  /** Values declared by the source. Reported as declared; never re-interpreted as approval. */
  readonly production: Readonly<Record<string, unknown>> | null;
  /** The V1.1 development overlay, kept distinguishable from the production truth. */
  readonly development: Readonly<Record<string, unknown>> | null;
  readonly observationLimits: readonly string[];
}

function readBoundedFile(path: string): Buffer | undefined {
  try {
    return readFileSync(path);
  } catch {
    return undefined;
  }
}

/** Read the target's declared governance state without mutating or reinterpreting it. */
export function observeGovernance(targetRef: string): GovernanceObservation {
  const absolute = resolve(targetRef);
  const source = ".engineering/CHECKPOINT.json";
  const physical = resolve(absolute, source);
  if (!existsSync(physical)) {
    return { source, present: false, readable: false, production: null, development: null, observationLimits: ["GOVERNANCE_SOURCE_ABSENT"] };
  }
  const body = readBoundedFile(physical);
  if (body === undefined) {
    return { source, present: true, readable: false, production: null, development: null, observationLimits: ["GOVERNANCE_SOURCE_UNREADABLE"] };
  }
  try {
    const parsed = JSON.parse(body.toString("utf8")) as Record<string, unknown>;
    const production: Record<string, unknown> = {};
    for (const key of ["status", "phase", "stopState", "completedThroughModule", "mainProductionDenominatorWeight", "earnedProductionWeight", "overallCompletionPercent", "nextLegalStage"]) {
      if (key in parsed) production[key] = parsed[key];
    }
    const overlay = parsed["v11"];
    return {
      source,
      present: true,
      readable: true,
      production: Object.freeze(production),
      development: overlay !== null && typeof overlay === "object" ? Object.freeze(overlay as Record<string, unknown>) : null,
      observationLimits: [],
    };
  } catch {
    return { source, present: true, readable: false, production: null, development: null, observationLimits: ["GOVERNANCE_SOURCE_NOT_PARSEABLE"] };
  }
}

/** Bounded listing of the governance sources present in the target. */
export function observeGovernanceFiles(targetRef: string): readonly string[] {
  const absolute = resolve(targetRef);
  return Object.freeze(GOVERNANCE_SOURCES.filter((relativePath) => existsSync(resolve(absolute, relativePath))));
}

interface DocumentationEntry {
  readonly id: string;
  readonly source: string;
  readonly version: unknown;
  readonly digest: string;
}

/** Documentation manifest entries: present files only, with their real content digest. */
export function observeDocumentation(targetRef: string): readonly DocumentationEntry[] {
  const absolute = resolve(targetRef);
  const entries: DocumentationEntry[] = [];
  for (const relativePath of GOVERNANCE_SOURCES) {
    const body = readBoundedFile(resolve(absolute, relativePath));
    if (body === undefined) continue;
    entries.push({ id: relativePath, source: relativePath, version: null, digest: createHash("sha256").update(body).digest("hex") });
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
  const manifest = readBoundedFile(resolve(targetRef, "package.json"));
  const lock = readBoundedFile(resolve(targetRef, "package-lock.json"));
  const dependency = engines.dependencySecurity({
    ...(manifest === undefined ? {} : { manifestDigest: createHash("sha256").update(manifest).digest("hex") }),
    ...(lock === undefined ? {} : { lockDigest: createHash("sha256").update(lock).digest("hex") }),
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
    governance: { source: governance.source, present: governance.present, readable: governance.readable, observationLimits: governance.observationLimits },
    integrity: engines.integritySnapshot({ findings, observations, dependencies: dependency.digest, capabilities: capabilities.digest }),
    observationLimits: repository.observationLimits,
  };
  return { body: Object.freeze(body), digest: fingerprint(body) };
}

function statusComposition(engines: Engines, targetRef: string, observation: TargetObservation, repository: RepositoryObservation, repositoryVerdict: RepositoryStateResult | null, governance: GovernanceObservation, drift: DriftResult, recorded: RecordedArtifact): DiagnosisComposition {
  const governanceFiles = observeGovernanceFiles(targetRef);
  const productionState = governance.production === null ? undefined : governance.production["status"];
  const declaredProgress = governance.production === null ? undefined : governance.production["overallCompletionPercent"];
  const evidenceRefs = governance.present ? [governance.source, ...governanceFiles.filter((file) => file !== governance.source)] : [...governanceFiles];

  const operator = engines.operatorStatus({
    // The declared governance state is reported when the target declares one; otherwise the
    // observed repository verdict is used; otherwise the state is explicitly unobserved.
    state: typeof productionState === "string" ? productionState : repositoryVerdict === null ? "UNOBSERVED" : repositoryVerdict.state,
    // Progress is only reported when the target actually declares it. It is never estimated.
    progress: typeof declaredProgress === "number" ? declaredProgress : null,
    evidence: evidenceRefs,
    stale: drift.changed,
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
    release: {
      source: governance.source,
      present: governance.present,
      readable: governance.readable,
      production: governance.production,
      development: governance.development,
    },
    operator,
    documentation,
    navigation,
    drift,
    // The drift engine compares two observations; it is not told whether a governed baseline was
    // ever recorded. The projection states that explicitly, so the absence of governed state is
    // never read as drift of governed state.
    driftBaseline: { state: recorded.present ? "RECORDED" : "ABSENT", ref: recorded.present ? recorded.ref : null },
    observationLimits: recorded.present ? [] : ["drift.baseline.absent"],
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
  const drift = engines.detectDrift(
    { observation: recorded.recordedObservationFingerprint ?? "NO_RECORDED_STATE" },
    { observation: observation.stateFingerprint },
    { authorized: false },
  );

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
