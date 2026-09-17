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
import { resolve } from "node:path";

import type { GefError, HandlerOutcome } from "@gef-bootstrap/contracts";
import { CommandRegistry, createGefError } from "@gef-bootstrap/kernel";
import type { CommandRegistration, ExecutionContext } from "@gef-bootstrap/kernel";

import { CLI_CONTRACT_VERSION } from "./parser.js";
import { buildStateDocument, requireSupportedSchemaVersion, UnsupportedDocumentVersionError } from "./schemas.js";
import { applyGovernedCreate } from "./transaction.js";

// ---------------------------------------------------------------------------
// Engine boundary
// ---------------------------------------------------------------------------

/**
 * Declared resolution order per engine. The packaged layout is tried first so an installed
 * CLI is self-contained; the source-workspace layout is the fallback. Both are explicit and
 * reproducible — no discovery, no search, no globbing.
 */
const ENGINE_SOURCES = {
  maintenance: ["../vendor/engines/m48-m54-maintenance/src/index.mjs", "../../m48-m54-maintenance/src/index.mjs"],
  governance: ["../vendor/engines/area-h-governance/index.mjs", "../../area-h-governance/index.mjs"],
  safety: ["../vendor/engines/security-reliability-integrations/src/index.js", "../../security-reliability-integrations/src/index.js"],
} as const satisfies Record<string, readonly string[]>;

export type EngineKey = keyof typeof ENGINE_SOURCES;

export class EngineUnavailableError extends Error {
  readonly engine: string;
  readonly attempts: readonly string[];
  readonly detail: string;
  constructor(engine: string, attempts: readonly string[], detail: string) {
    super(`Engine unavailable: ${engine} (${detail}); tried ${attempts.join(", ")}`);
    this.name = "EngineUnavailableError";
    this.engine = engine;
    this.attempts = attempts;
    this.detail = detail;
  }
}

const REQUIRED_SYMBOLS: Readonly<Record<EngineKey, readonly string[]>> = Object.freeze({
  maintenance: ["installPlan", "helpIndex"],
  governance: ["repositoryState", "githubBootstrap"],
  safety: ["safetyDecision", "detectDrift", "resolveCanonical", "backupManifest", "recoveryPlan"],
});

async function loadEngine(key: EngineKey): Promise<Record<string, unknown>> {
  const candidates = ENGINE_SOURCES[key];
  const required = REQUIRED_SYMBOLS[key];
  const failures: string[] = [];
  for (const specifier of candidates) {
    let loaded: unknown;
    try {
      loaded = await import(specifier);
    } catch (cause: unknown) {
      failures.push(`${specifier}: ${cause instanceof Error ? cause.message : String(cause)}`);
      continue;
    }
    if (loaded === null || typeof loaded !== "object") {
      failures.push(`${specifier}: MODULE_SHAPE_INVALID`);
      continue;
    }
    const module = loaded as Record<string, unknown>;
    const missing = required.filter((symbol) => typeof module[symbol] !== "function");
    if (missing.length > 0) {
      failures.push(`${specifier}: MISSING_SYMBOLS ${missing.join(",")}`);
      continue;
    }
    return module;
  }
  throw new EngineUnavailableError(key, candidates, failures.join(" | "));
}

// --- verified engine surface (signatures mirror the sources at the WO-002 base) ---

export interface InstallPlanInput {
  readonly platform: string;
  readonly target: string;
  readonly version: string;
  readonly current?: string | null;
  readonly elevated?: boolean;
}

export type InstallPlanResult =
  | { readonly state: "UNSUPPORTED" }
  | {
      readonly state: "READY";
      readonly platform: string;
      readonly target: string;
      readonly version: string;
      readonly current: string | null;
      readonly elevated: boolean;
      readonly phases: readonly string[];
      readonly digest: string;
    };

export interface HelpCommandDescriptor {
  readonly id: string;
  readonly summary: string;
  readonly schema?: string | null;
}

export interface HelpEntry {
  readonly id: string;
  readonly summary: string;
  readonly schema: string | null;
}

export interface RepositoryStateInput {
  readonly repo?: string;
  readonly head?: string;
  readonly branch?: string;
  readonly modified?: readonly string[];
  readonly staged?: readonly string[];
  readonly untracked?: readonly string[];
  readonly conflicted?: readonly string[];
  readonly operation?: string;
}

export type RepositoryStateResult =
  | { readonly state: "BLOCKED"; readonly reason: string }
  | { readonly state: "CLEAN" | "DIRTY" | "BLOCKED"; readonly dirty: boolean; readonly conflict: boolean; readonly digest: string };

export interface GithubBootstrapInput {
  readonly labels?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly templates?: Readonly<Record<string, unknown>>;
}

export interface GithubBootstrapResult {
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly labels: readonly string[];
  readonly templates: Readonly<Record<string, unknown>>;
  readonly labelsToAdd: readonly string[];
  readonly preservedUnknown: readonly string[];
  readonly idempotencyKey: string;
}

export interface CanonicalSourceInput {
  readonly id: string;
  readonly kind: string;
  readonly value: unknown;
}

export interface CanonicalResolutionResult {
  readonly selected: CanonicalSourceInput | null;
  readonly conflict: boolean;
  readonly state: "CONFLICT" | "READY" | "UNKNOWN";
  readonly digest: string;
}

export interface DriftResult {
  readonly before: string;
  readonly after: string;
  readonly changed: boolean;
  readonly class: "NONE" | "EXPECTED" | "UNEXPECTED";
  readonly digest: string;
}

export interface SafetyDecisionResult {
  readonly classification: string;
  readonly confirmation: string;
  readonly requested: string;
  readonly restricted: boolean;
  readonly minimum: readonly string[];
  readonly state: "READY" | "BLOCKED";
  readonly digest: string;
}

export interface BackupManifestResult {
  readonly items: readonly { readonly id: string; readonly digest: string }[];
  readonly verified: boolean;
  readonly digest: string;
}

export interface RecoveryPlanResult {
  readonly last: string;
  readonly action: string;
  readonly maxAttempts: number;
  readonly state: "READY" | "BLOCKED";
  readonly digest: string;
}

export interface Engines {
  readonly installPlan: (input: InstallPlanInput) => InstallPlanResult;
  readonly helpIndex: (commands: readonly HelpCommandDescriptor[]) => readonly HelpEntry[];
  readonly repositoryState: (input?: RepositoryStateInput) => RepositoryStateResult;
  readonly githubBootstrap: (current: GithubBootstrapInput, desired: GithubBootstrapInput) => GithubBootstrapResult;
  readonly safetyDecision: (input: {
    readonly classification?: string;
    readonly blastRadius?: string;
    readonly requested?: string;
    readonly restricted?: boolean;
    readonly capabilities?: readonly string[];
  }) => SafetyDecisionResult;
  readonly detectDrift: (before: unknown, after: unknown, options?: { readonly authorized?: boolean }) => DriftResult;
  readonly resolveCanonical: (sources?: readonly CanonicalSourceInput[]) => CanonicalResolutionResult;
  readonly backupManifest: (entries: readonly { readonly id: string; readonly digest: string }[]) => BackupManifestResult;
  readonly recoveryPlan: (input?: {
    readonly journal?: readonly { readonly state: string }[];
    readonly candidateMatches?: boolean;
    readonly corrupt?: boolean;
    readonly maxAttempts?: number;
  }) => RecoveryPlanResult;
}

export async function loadEngines(): Promise<Engines> {
  const [maintenance, governance, safety] = await Promise.all([loadEngine("maintenance"), loadEngine("governance"), loadEngine("safety")]);
  return Object.freeze({
    installPlan: maintenance["installPlan"] as Engines["installPlan"],
    helpIndex: maintenance["helpIndex"] as Engines["helpIndex"],
    repositoryState: governance["repositoryState"] as Engines["repositoryState"],
    githubBootstrap: governance["githubBootstrap"] as Engines["githubBootstrap"],
    safetyDecision: safety["safetyDecision"] as Engines["safetyDecision"],
    detectDrift: safety["detectDrift"] as Engines["detectDrift"],
    resolveCanonical: safety["resolveCanonical"] as Engines["resolveCanonical"],
    backupManifest: safety["backupManifest"] as Engines["backupManifest"],
    recoveryPlan: safety["recoveryPlan"] as Engines["recoveryPlan"],
  });
}

// ---------------------------------------------------------------------------
// Command input
// ---------------------------------------------------------------------------

export type CliVerb = "init" | "adopt";

export interface CliCommandInput {
  readonly verb: CliVerb;
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

export interface RepositoryObservation {
  readonly input: RepositoryStateInput;
  readonly observationLimits: readonly string[];
}

/**
 * Observe the target's local Git identity without invoking a subprocess and without
 * repository rediscovery: `.git/HEAD` plus the well-known operation sentinels.
 *
 * Working-tree dirtiness is not derivable from these files, so it is reported as an explicit
 * observation limit rather than being asserted as clean. The verdict itself always comes from
 * the engine (`repositoryState`).
 */
export function observeRepository(targetRef: string): RepositoryObservation {
  const absolute = resolve(targetRef);
  const gitDirectory = resolve(absolute, ".git");
  if (!existsSync(gitDirectory)) {
    return { input: {}, observationLimits: ["WORKING_TREE_NOT_OBSERVED", "NO_LOCAL_GIT_DIRECTORY"] };
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
    return { input: {}, observationLimits: ["WORKING_TREE_NOT_OBSERVED", "HEAD_UNREADABLE"] };
  }
  const operation = GIT_OPERATION_SENTINELS.find(([sentinel]) => existsSync(resolve(gitDirectory, sentinel)))?.[1];
  return {
    input: { repo: absolute, head, branch, ...(operation === undefined ? {} : { operation }) },
    observationLimits: ["WORKING_TREE_DIRTINESS_NOT_OBSERVED"],
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

function artifactPathFor(targetRoot: string, verb: CliVerb): string {
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
export function readRecordedArtifact(targetRef: string, verb: CliVerb): RecordedArtifact {
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

function initComposition(engines: Engines, observation: TargetObservation, repository: RepositoryObservation, repositoryVerdict: RepositoryStateResult, canonical: CanonicalResolutionResult, drift: DriftResult, productVersion: string): Readonly<Record<string, unknown>> {
  return {
    verb: "init",
    observation,
    repository: { verdict: repositoryVerdict, observationLimits: repository.observationLimits },
    install: engines.installPlan({ platform: process.platform, target: observation.targetRef, version: productVersion, current: null }),
    governance: { observationSource: "NOT_OBSERVED", ...engines.githubBootstrap({}, { labels: [...GEF_GOVERNANCE_LABELS] }) },
    canonical,
    drift,
  };
}

function adoptComposition(engines: Engines, observation: TargetObservation, repository: RepositoryObservation, repositoryVerdict: RepositoryStateResult, canonical: CanonicalResolutionResult, drift: DriftResult, productVersion: string): Readonly<Record<string, unknown>> {
  return {
    verb: "adopt",
    observation,
    repository: { verdict: repositoryVerdict, observationLimits: repository.observationLimits },
    install: engines.installPlan({ platform: process.platform, target: observation.targetRef, version: productVersion, current: null }),
    canonical,
    drift,
    backup: engines.backupManifest([{ id: "target-observation", digest: observation.stateFingerprint }]),
    recovery: engines.recoveryPlan({ journal: [], candidateMatches: true, corrupt: false }),
  };
}

function composeFor(engines: Engines, verb: CliVerb, targetRef: string, productVersion: string) {
  const observation = observeTarget(targetRef);
  const repository = observeRepository(targetRef);
  const repositoryVerdict: RepositoryStateResult = engines.repositoryState(repository.input);
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

async function planHandler(verb: CliVerb, input: CliCommandInput, context: ExecutionContext): Promise<HandlerOutcome<unknown>> {
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

async function applyHandler(verb: CliVerb, input: CliCommandInput, context: ExecutionContext): Promise<HandlerOutcome<unknown>> {
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
// Registration
// ---------------------------------------------------------------------------

export const CLI_COMMAND_IDS: readonly string[] = Object.freeze(["gef.init.plan", "gef.init.run", "gef.adopt.preview", "gef.adopt.apply"]);

/** Help inventory passed to `helpIndex`; the engine owns ordering and projection. */
export const HELP_INVENTORY: readonly HelpCommandDescriptor[] = Object.freeze([
  { id: "gef.adopt.preview", summary: "preview brownfield adoption (safe, read-only)", schema: null },
  { id: "gef.adopt.apply", summary: "run the governed adoption path", schema: null },
  { id: "gef.init.plan", summary: "plan project initialization (safe, read-only)", schema: null },
  { id: "gef.init.run", summary: "run the governed initialization path", schema: null },
]);

const MUTATION_SECURITY_CLASS = "filesystem-mutation";

export function cliRegistrations(): readonly CommandRegistration[] {
  const registrations: readonly CommandRegistration<CliCommandInput, unknown>[] = [
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
  return Object.freeze(registrations as readonly CommandRegistration[]);
}

export function buildRegistry(): CommandRegistry {
  return new CommandRegistry(cliRegistrations());
}

export { GEF_STATE_DIRECTORY, RECEIPTS_DIRECTORY, GEF_GOVERNANCE_LABELS };
