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
