/**
 * Verified engine boundary.
 *
 * The V1 domain engines are untyped `.mjs`/`.js` modules. They are reached through the loader
 * below, which resolves a declared candidate order and verifies the expected exports are callable
 * before use. A missing or malformed engine fails closed as a CAPABILITY error.
 *
 * This module is deliberately dependency-free within the CLI package so both the command
 * registry and the transaction driver can use it without a circular import.
 *
 * Constraint C5: colliding exports are bound by explicit module ownership. `compatibility`,
 * `redactSecrets` and the path-containment helpers are never consumed, and `digest` is never
 * imported from an engine.
 * Constraint C3: the implemented package layout at the base is used as-is.
 */

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
  platform: ["../vendor/engines/m41-m47-platform/src/index.mjs", "../../m41-m47-platform/src/index.mjs"],
  quality: ["../vendor/engines/m55-m61-quality/src/index.mjs", "../../m55-m61-quality/src/index.mjs"],
  final: ["../vendor/engines/m62-m63-final/src/index.mjs", "../../m62-m63-final/src/index.mjs"],
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
  maintenance: ["installPlan", "helpIndex", "doctor", "repairSuggestion", "invariantResult"],
  governance: ["repositoryState", "githubBootstrap"],
  safety: [
    "safetyDecision",
    "detectDrift",
    "resolveCanonical",
    "backupManifest",
    "recoveryPlan",
    "dependencySecurity",
    "githubSecurity",
    "integritySnapshot",
    "capabilityEnvelope",
  ],
  platform: ["operatorStatus"],
  quality: ["documentationManifest"],
  final: ["navigationPlan"],
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


// --- diagnostics and status surfaces (signatures mirror the sources at the WO-003 base) ---

export type DoctorFindingState = "HEALTHY" | "FINDING" | "UNKNOWN";

export interface DoctorFindingResult {
  readonly id: string;
  readonly state: DoctorFindingState;
}

export interface RepairSuggestionResult {
  readonly finding: string;
  readonly risk: string;
  readonly automatic: boolean;
  readonly previewRequired: boolean;
}

export interface InvariantResultValue {
  readonly name: string;
  readonly pass: boolean;
  readonly actual: unknown;
  readonly expected: unknown;
}

export interface DependencySecurityInput {
  readonly manifestDigest?: string;
  readonly lockDigest?: string;
  readonly auditCritical?: number;
  readonly provenance?: string;
}

export interface DependencySecurityResult {
  readonly manifestDigest: string | null;
  readonly lockDigest: string | null;
  readonly auditCritical: number;
  readonly provenance: string;
  readonly state: "UNKNOWN" | "BLOCKED" | "REVIEW" | "PASS";
  readonly digest: string;
}

export interface GithubSecurityInput {
  readonly immutableRef?: boolean;
  readonly untrustedFork?: boolean;
  readonly writePermission?: boolean;
}

export interface GithubSecurityResult {
  readonly immutableRef: boolean;
  readonly untrustedFork: boolean;
  readonly writePermission: boolean;
  readonly state: "BLOCKED" | "REVIEW" | "PASS";
  readonly digest: string;
}

export interface IntegritySnapshotResult {
  readonly root: string;
  readonly schema: number;
  readonly digest: string;
}

export interface CapabilityObservation {
  readonly capability?: string;
  readonly verified?: boolean;
}

export interface CapabilityEnvelopeResult {
  readonly capabilities: readonly string[];
  readonly unknown: readonly string[];
  readonly state: "DEGRADED" | "COMPATIBLE";
  readonly digest: string;
}

export interface OperatorStatusInput {
  readonly state: string;
  readonly progress: unknown;
  readonly evidence?: readonly string[];
  readonly stale?: boolean;
  readonly optional?: boolean;
}

export interface OperatorStatusResult {
  readonly state: string;
  readonly progress: unknown;
  readonly evidence: readonly string[];
  readonly stale: boolean;
  readonly optional: boolean;
}

export interface DocumentationManifestEntry {
  readonly id: string;
  readonly source: string;
  readonly version: unknown;
  readonly digest?: string;
}

export interface DocumentationManifestResult {
  readonly entries: readonly { readonly id: string; readonly source: string; readonly version: unknown; readonly digest: string }[];
  readonly digest: string;
}

export interface NavigationPlanResult {
  readonly files: readonly string[];
  readonly ioBudget: number;
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
  readonly doctor: (observations: Readonly<Record<string, unknown>>) => readonly DoctorFindingResult[];
  readonly repairSuggestion: (finding: string) => RepairSuggestionResult;
  readonly invariantResult: (name: string, actual: unknown, expected: unknown) => InvariantResultValue;
  readonly dependencySecurity: (input?: DependencySecurityInput) => DependencySecurityResult;
  readonly githubSecurity: (input?: GithubSecurityInput) => GithubSecurityResult;
  readonly integritySnapshot: (value: unknown) => IntegritySnapshotResult;
  readonly capabilityEnvelope: (observations?: readonly CapabilityObservation[]) => CapabilityEnvelopeResult;
  readonly operatorStatus: (input: OperatorStatusInput) => OperatorStatusResult;
  readonly documentationManifest: (entries?: readonly DocumentationManifestEntry[]) => DocumentationManifestResult;
  readonly navigationPlan: (files?: readonly string[]) => NavigationPlanResult;
}

export async function loadEngines(): Promise<Engines> {
  const [maintenance, governance, safety, platform, quality, final] = await Promise.all([
    loadEngine("maintenance"),
    loadEngine("governance"),
    loadEngine("safety"),
    loadEngine("platform"),
    loadEngine("quality"),
    loadEngine("final"),
  ]);
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
    doctor: maintenance["doctor"] as Engines["doctor"],
    repairSuggestion: maintenance["repairSuggestion"] as Engines["repairSuggestion"],
    invariantResult: maintenance["invariantResult"] as Engines["invariantResult"],
    dependencySecurity: safety["dependencySecurity"] as Engines["dependencySecurity"],
    githubSecurity: safety["githubSecurity"] as Engines["githubSecurity"],
    integritySnapshot: safety["integritySnapshot"] as Engines["integritySnapshot"],
    capabilityEnvelope: safety["capabilityEnvelope"] as Engines["capabilityEnvelope"],
    operatorStatus: platform["operatorStatus"] as Engines["operatorStatus"],
    documentationManifest: quality["documentationManifest"] as Engines["documentationManifest"],
    navigationPlan: final["navigationPlan"] as Engines["navigationPlan"],
  });
}
