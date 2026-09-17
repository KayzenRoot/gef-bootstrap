/**
 * Bounded V1.1 CLI command registrations and engine delegation.
 *
 * The CLI is transport only. Every handler composes verified V1 engines and returns their
 * payload; no business policy is implemented here.
 *
 * The V1 domain engines are untyped `.mjs`/`.js` modules. They are reached through the
 * loader below, which imports them lazily and verifies the expected exports are callable
 * before use. A missing or malformed engine fails closed as a CAPABILITY error instead of
 * throwing or silently degrading.
 *
 * Constraint C5: colliding exports are bound by explicit module ownership. `compatibility`,
 * `redactSecrets` and the path-containment helpers are never consumed through a shared
 * barrel, and `digest` is never imported from any engine — node:crypto is used directly.
 * Constraint C3: the implemented package layout at the base is used as-is.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";

import type { GefError, HandlerOutcome } from "@gef-bootstrap/contracts";
import { CommandRegistry, authorizeFilesystemPath, createGefError } from "@gef-bootstrap/kernel";
import type { CommandRegistration, ExecutionContext } from "@gef-bootstrap/kernel";

import { CLI_CONTRACT_VERSION } from "./parser.js";

// ---------------------------------------------------------------------------
// Engine boundary
// ---------------------------------------------------------------------------

const ENGINE_MAINTENANCE = "../../m48-m54-maintenance/src/index.mjs";
const ENGINE_GOVERNANCE = "../../area-h-governance/index.mjs";
const ENGINE_SAFETY = "../../security-reliability-integrations/src/index.js";

export class EngineUnavailableError extends Error {
  readonly specifier: string;
  readonly detail: string;
  constructor(specifier: string, detail: string) {
    super(`Engine unavailable: ${specifier} (${detail})`);
    this.name = "EngineUnavailableError";
    this.specifier = specifier;
    this.detail = detail;
  }
}

async function loadEngine(specifier: string, required: readonly string[]): Promise<Record<string, unknown>> {
  let loaded: unknown;
  try {
    loaded = await import(specifier);
  } catch (cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new EngineUnavailableError(specifier, `MODULE_LOAD_FAILED: ${detail}`);
  }
  if (loaded === null || typeof loaded !== "object") throw new EngineUnavailableError(specifier, "MODULE_SHAPE_INVALID");
  const module = loaded as Record<string, unknown>;
  const missing = required.filter((symbol) => typeof module[symbol] !== "function");
  if (missing.length > 0) throw new EngineUnavailableError(specifier, `MISSING_SYMBOLS: ${missing.join(",")}`);
  return module;
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

export interface SafetyDecisionResult {
  readonly classification: string;
  readonly confirmation: string;
  readonly requested: string;
  readonly restricted: boolean;
  readonly minimum: readonly string[];
  readonly state: "READY" | "BLOCKED";
  readonly digest: string;
}

export interface RestrictedPathResult {
  readonly path: string;
  readonly escape: boolean;
  readonly sensitive: boolean;
  readonly state: "ALLOWED" | "RESTRICTED";
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

export interface DriftResult {
  readonly before: string;
  readonly after: string;
  readonly changed: boolean;
  readonly class: string;
  readonly digest: string;
}

export interface Engines {
  readonly installPlan: (input: InstallPlanInput) => InstallPlanResult;
  readonly githubBootstrap: (current: GithubBootstrapInput, desired: GithubBootstrapInput) => GithubBootstrapResult;
  readonly safetyDecision: (input: {
    readonly classification?: string;
    readonly blastRadius?: string;
    readonly requested?: string;
    readonly restricted?: boolean;
    readonly capabilities?: readonly string[];
  }) => SafetyDecisionResult;
  readonly normalizeRestrictedPath: (path: string) => RestrictedPathResult;
  readonly backupManifest: (entries: readonly { readonly id: string; readonly digest: string }[]) => BackupManifestResult;
  readonly recoveryPlan: (input?: {
    readonly journal?: readonly { readonly state: string }[];
    readonly candidateMatches?: boolean;
    readonly corrupt?: boolean;
    readonly maxAttempts?: number;
  }) => RecoveryPlanResult;
  readonly detectDrift: (before: unknown, after: unknown, options?: { readonly authorized?: boolean }) => DriftResult;
}

export async function loadEngines(): Promise<Engines> {
  const [maintenance, governance, safety] = await Promise.all([
    loadEngine(ENGINE_MAINTENANCE, ["installPlan"]),
    loadEngine(ENGINE_GOVERNANCE, ["githubBootstrap"]),
    loadEngine(ENGINE_SAFETY, ["safetyDecision", "normalizeRestrictedPath", "backupManifest", "recoveryPlan", "detectDrift"]),
  ]);
  return Object.freeze({
    installPlan: maintenance["installPlan"] as Engines["installPlan"],
    githubBootstrap: governance["githubBootstrap"] as Engines["githubBootstrap"],
    safetyDecision: safety["safetyDecision"] as Engines["safetyDecision"],
    normalizeRestrictedPath: safety["normalizeRestrictedPath"] as Engines["normalizeRestrictedPath"],
    backupManifest: safety["backupManifest"] as Engines["backupManifest"],
    recoveryPlan: safety["recoveryPlan"] as Engines["recoveryPlan"],
    detectDrift: safety["detectDrift"] as Engines["detectDrift"],
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
// Target observation (read-only, bounded, no repository rediscovery)
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

// ---------------------------------------------------------------------------
// Governed artifact persistence
// ---------------------------------------------------------------------------

const GEF_STATE_DIRECTORY = ".gef";
const GEF_GOVERNANCE_LABELS: readonly string[] = Object.freeze(["gef-managed", "governed"]);

export interface FilesystemRootDescriptorInput {
  readonly rootRef: string;
  readonly rootKind: string;
  readonly physicalRoot: string;
  readonly pathFlavor: "POSIX" | "WINDOWS";
  readonly caseSemantics: "SENSITIVE" | "INSENSITIVE";
  readonly allowedOperations: readonly ("READ" | "CREATE")[];
  readonly policyRef: string;
  readonly pathSemanticsRef: string;
}

export function rootDescriptorFor(targetRef: string): FilesystemRootDescriptorInput {
  const windows = sep === "\\";
  return {
    rootRef: `target:${targetRef}`,
    rootKind: "project-directory",
    physicalRoot: resolve(targetRef),
    pathFlavor: windows ? "WINDOWS" : "POSIX",
    caseSemantics: windows ? "INSENSITIVE" : "SENSITIVE",
    allowedOperations: Object.freeze(["READ", "CREATE"] as const),
    policyRef: "gef.cli.target.policy",
    pathSemanticsRef: "gef.cli.target.path-semantics",
  };
}

export class ArtifactAlreadyPresentError extends Error {
  constructor(readonly artifactRef: string) {
    super(`Governed artifact already present: ${artifactRef}`);
    this.name = "ArtifactAlreadyPresentError";
  }
}

export interface ApplyRequest {
  readonly verb: CliVerb;
  readonly targetRef: string;
  readonly artifactName: string;
  readonly commandId: string;
  readonly runId: string;
  readonly productVersion: string;
  readonly planDigest: string;
}

export interface ApplyReceipt {
  readonly artifactRef: string;
  readonly artifactFingerprint: string;
  readonly beforeFingerprint: string;
  readonly afterFingerprint: string;
  readonly driftClass: string;
  readonly createdExclusively: boolean;
}

/**
 * Persist the governed state artifact for an apply run.
 *
 * Preservation-first: the artifact is created exclusively (`wx`), so an existing path fails
 * closed and nothing user-owned is overwritten. Every path is admitted by the kernel
 * filesystem authority before any write, which denies traversal and root mutation.
 */
export function persistGovernedArtifact(engines: Engines, request: ApplyRequest): ApplyReceipt {
  const artifactRef = `${GEF_STATE_DIRECTORY}/${request.artifactName}`;
  const authorized = authorizeFilesystemPath({
    root: rootDescriptorFor(request.targetRef),
    relativePath: artifactRef,
    operation: "CREATE",
  });
  if (!authorized.ok) throw authorized.error;

  const physicalTarget = authorized.value.physicalTarget;
  const before = observeTarget(request.targetRef).stateFingerprint;

  const artifact = {
    schemaVersion: 1,
    kind: `gef.${request.verb}.state`,
    verb: request.verb,
    commandId: request.commandId,
    contractVersion: CLI_CONTRACT_VERSION,
    productVersion: request.productVersion,
    runId: request.runId,
    planDigest: request.planDigest,
  };
  const body = `${JSON.stringify(artifact, null, 2)}\n`;

  mkdirSync(dirname(physicalTarget), { recursive: true });
  try {
    writeFileSync(physicalTarget, body, { flag: "wx" });
  } catch (cause: unknown) {
    const code = cause !== null && typeof cause === "object" && "code" in cause ? String((cause as { readonly code: unknown }).code) : "UNKNOWN";
    if (code === "EEXIST") throw new ArtifactAlreadyPresentError(artifactRef);
    throw cause;
  }

  const after = observeTarget(request.targetRef).stateFingerprint;
  const drift = engines.detectDrift({ stateFingerprint: before }, { stateFingerprint: after }, { authorized: true });
  return {
    artifactRef,
    artifactFingerprint: createHash("sha256").update(body).digest("hex"),
    beforeFingerprint: before,
    afterFingerprint: after,
    driftClass: drift.class,
    createdExclusively: true,
  };
}

// ---------------------------------------------------------------------------
// Failure projections
// ---------------------------------------------------------------------------

function engineFailure(error: unknown, commandId: string, runId: string): GefError {
  const detail = error instanceof EngineUnavailableError ? error.detail : error instanceof Error ? error.message : String(error);
  const specifier = error instanceof EngineUnavailableError ? error.specifier : "unknown";
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
    metadata: { specifier, detail },
    remediations: [{ actionId: "gef.cli.verify_installation" }],
  });
}

function artifactPresentFailure(artifactRef: string, commandId: string, runId: string): GefError {
  return createGefError({
    id: `cli-artifact-${commandId}`,
    category: "PRECONDITION",
    reason: "artifact_present",
    severity: "ERROR",
    summary: "Governed artifact already exists; existing content is never overwritten",
    retryability: "NEVER",
    recoverability: "NONE_REQUIRED",
    terminal: "BLOCKED",
    commandId,
    runId,
    metadata: { artifactRef },
  });
}

function mutationFailure(error: GefError, commandId: string, runId: string): GefError {
  return createGefError({
    id: error.id,
    category: error.category,
    reason: "mutation_refused",
    severity: "ERROR",
    summary: error.summary,
    retryability: "NEVER",
    recoverability: "NONE_REQUIRED",
    terminal: "BLOCKED",
    commandId,
    runId,
    metadata: { cause: error.reasonCode },
  });
}

// ---------------------------------------------------------------------------
// Compositions
// ---------------------------------------------------------------------------

function initComposition(engines: Engines, observation: TargetObservation, productVersion: string): Readonly<Record<string, unknown>> {
  return {
    verb: "init",
    observation,
    install: engines.installPlan({ platform: process.platform, target: observation.targetRef, version: productVersion, current: null }),
    safety: engines.safetyDecision({ classification: "MUTATING", blastRadius: "known", requested: "AUTO", restricted: false }),
    governance: { observationSource: "NOT_OBSERVED", ...engines.githubBootstrap({}, { labels: [...GEF_GOVERNANCE_LABELS] }) },
  };
}

function adoptComposition(engines: Engines, observation: TargetObservation, productVersion: string): Readonly<Record<string, unknown>> {
  return {
    verb: "adopt",
    observation,
    admission: engines.normalizeRestrictedPath(observation.targetRef),
    install: engines.installPlan({ platform: process.platform, target: observation.targetRef, version: productVersion, current: null }),
    backup: engines.backupManifest([{ id: "target-observation", digest: observation.stateFingerprint }]),
    recovery: engines.recoveryPlan({ journal: [], candidateMatches: true, corrupt: false }),
  };
}

function resolveTargetRequested(input: CliCommandInput, context: ExecutionContext): string {
  return context.target?.targetRef ?? input.targetRef ?? context.ports.environment?.values["GEF_TARGET"] ?? process.cwd();
}

async function runComposition(
  kind: "plan" | "apply",
  verb: CliVerb,
  input: CliCommandInput,
  context: ExecutionContext,
): Promise<HandlerOutcome<unknown>> {
  const commandId = kind === "plan" ? (verb === "init" ? "gef.init.plan" : "gef.adopt.preview") : verb === "init" ? "gef.init.run" : "gef.adopt.apply";
  let engines: Engines;
  try {
    engines = await loadEngines();
  } catch (error: unknown) {
    return { ok: false, error: engineFailure(error, commandId, context.runId) };
  }

  const targetRef = resolveTargetRequested(input, context);
  const observation = observeTarget(targetRef);
  const body = verb === "init" ? initComposition(engines, observation, context.identity.productVersion) : adoptComposition(engines, observation, context.identity.productVersion);
  const digest = fingerprint(body);
  const key = verb === "init" ? "plan" : "preview";

  if (kind === "plan") {
    return { ok: true, value: { commandId, effect: "NONE", [key]: body, [`${key}Digest`]: digest } };
  }

  try {
    const receipt = persistGovernedArtifact(engines, {
      verb,
      targetRef,
      artifactName: verb === "init" ? "init-state.json" : "adopt-state.json",
      commandId,
      runId: context.runId,
      productVersion: context.identity.productVersion,
      planDigest: digest,
    });
    return { ok: true, value: { commandId, effect: "CONFIRMED", [key]: body, [`${key}Digest`]: digest, receipt } };
  } catch (error: unknown) {
    if (error instanceof ArtifactAlreadyPresentError) return { ok: false, error: artifactPresentFailure(error.artifactRef, commandId, context.runId) };
    if (isGefError(error)) return { ok: false, error: mutationFailure(error, commandId, context.runId) };
    return { ok: false, error: engineFailure(error, commandId, context.runId) };
  }
}

function isGefError(value: unknown): value is GefError {
  return value !== null && typeof value === "object" && "schemaVersion" in value && "category" in value && "reasonCode" in value;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export const CLI_COMMAND_IDS: readonly string[] = Object.freeze(["gef.init.plan", "gef.init.run", "gef.adopt.preview", "gef.adopt.apply"]);

const MUTATION_SECURITY_CLASS = "filesystem-mutation";

/** The four admitted registrations, exported for introspection tests and for main. */
export function cliRegistrations(): readonly CommandRegistration[] {
  const registrations: readonly CommandRegistration<CliCommandInput, unknown>[] = [
    {
      commandId: "gef.init.plan",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "m48-m54-maintenance",
      mutation: false,
      requiresTarget: false,
      validateInput: validateCliInput,
      handler: (input, context) => runComposition("plan", "init", input, context),
    },
    {
      commandId: "gef.init.run",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "m48-m54-maintenance",
      mutation: true,
      requiresTarget: true,
      securityClass: MUTATION_SECURITY_CLASS,
      validateInput: validateCliInput,
      handler: (input, context) => runComposition("apply", "init", input, context),
    },
    {
      commandId: "gef.adopt.preview",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "security-reliability-integrations",
      mutation: false,
      requiresTarget: false,
      validateInput: validateCliInput,
      handler: (input, context) => runComposition("plan", "adopt", input, context),
    },
    {
      commandId: "gef.adopt.apply",
      contractVersion: CLI_CONTRACT_VERSION,
      owner: "security-reliability-integrations",
      mutation: true,
      requiresTarget: true,
      securityClass: MUTATION_SECURITY_CLASS,
      validateInput: validateCliInput,
      handler: (input, context) => runComposition("apply", "adopt", input, context),
    },
  ];
  return Object.freeze(registrations as readonly CommandRegistration[]);
}

export function buildRegistry(): CommandRegistry {
  return new CommandRegistry(cliRegistrations());
}
