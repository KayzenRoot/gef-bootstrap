import { incrementCounter, stablePreflightStringify } from "./canonical.js";
import type {
  EnvironmentFact,
  EnvironmentObservation,
  EnvironmentObservationPort,
  EnvironmentObservationRequest,
  MutablePreflightCounters,
  ObservedValue,
  PreflightGap,
  RuntimeObservation,
} from "./types.js";

const SAFE_ENV_KEY = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;
const KNOWN_PLATFORMS = new Set(["win32", "linux", "darwin"]);
const SAFE_ATOM = /^[A-Za-z0-9._+\-]{1,128}$/;

interface NodeProcessLike {
  readonly platform: string;
  readonly arch: string;
  readonly versions: { readonly node: string };
  readonly env: Readonly<Record<string, string | undefined>>;
  cwd(): string;
}

function currentNodeProcess(): NodeProcessLike {
  const candidate = (globalThis as unknown as { readonly process?: NodeProcessLike }).process;
  if (!candidate) throw new Error("gef.preflight.environment.node_process_unavailable");
  return candidate;
}

function malformed<T>(reasonCode: string): ObservedValue<T> { return { status: "MALFORMED", reasonCode }; }
function unavailable<T>(reasonCode: string): ObservedValue<T> { return { status: "UNAVAILABLE", reasonCode }; }
function observed<T>(value: T): ObservedValue<T> { return { status: "OBSERVED", value }; }

function gapFor(name: string, value: ObservedValue<unknown>): PreflightGap | null {
  if (value.status === "OBSERVED" || value.status === "NOT_PRESENT") return null;
  return { code: value.reasonCode ?? `gef.preflight.environment.${name.toLowerCase()}_${value.status.toLowerCase()}`, owner: "M04", blocking: false };
}

function validateAtom(value: unknown, reasonCode: string): ObservedValue<string> {
  if (typeof value !== "string" || !SAFE_ATOM.test(value)) return malformed(reasonCode);
  return observed(value);
}

function validatePlatform(value: unknown): ObservedValue<string> {
  if (typeof value !== "string" || !SAFE_ATOM.test(value)) return malformed("gef.preflight.environment.platform_malformed");
  return KNOWN_PLATFORMS.has(value) ? observed(value) : { status: "UNKNOWN", value, reasonCode: "gef.preflight.environment.platform_unknown" };
}

function validateRuntime(value: unknown): ObservedValue<RuntimeObservation> {
  if (!value || typeof value !== "object") return malformed("gef.preflight.environment.runtime_malformed");
  const candidate = value as Partial<RuntimeObservation>;
  if (typeof candidate.family !== "string" || !SAFE_ATOM.test(candidate.family) || typeof candidate.version !== "string" || candidate.version.length === 0 || candidate.version.length > 128 || /[\u0000-\u001f\u007f]/.test(candidate.version)) {
    return malformed("gef.preflight.environment.runtime_malformed");
  }
  return observed({ family: candidate.family, version: candidate.version });
}

function validateWorkingDirectory(value: unknown): ObservedValue<string> {
  if (typeof value !== "string" || value.length === 0 || value.length > 4096 || /[\u0000\r\n]/.test(value)) return malformed("gef.preflight.environment.cwd_malformed");
  return observed(value);
}

export function createNodeEnvironmentPort(): EnvironmentObservationPort {
  return Object.freeze({
    platform: () => currentNodeProcess().platform,
    architecture: () => currentNodeProcess().arch,
    runtime: () => ({ family: "node", version: currentNodeProcess().versions.node }),
    workingDirectory: () => currentNodeProcess().cwd(),
    readEnvironment: (key: string) => currentNodeProcess().env[key],
  });
}

export class EnvironmentObservationSession {
  readonly #port: EnvironmentObservationPort;
  readonly #counters: MutablePreflightCounters;
  readonly #factCache = new Map<EnvironmentFact, ObservedValue<unknown>>();
  readonly #envCache = new Map<string, ObservedValue<string>>();

  constructor(port: EnvironmentObservationPort, counters: MutablePreflightCounters) {
    this.#port = port;
    this.#counters = counters;
  }

  #readFact(fact: EnvironmentFact): ObservedValue<unknown> {
    const cached = this.#factCache.get(fact);
    if (cached) { this.#counters.cacheHits += 1; return cached; }
    incrementCounter(this.#counters.environmentReads, fact);
    let value: ObservedValue<unknown>;
    try {
      if (fact === "platform") value = validatePlatform(this.#port.platform());
      else if (fact === "architecture") value = validateAtom(this.#port.architecture(), "gef.preflight.environment.architecture_malformed");
      else if (fact === "runtime") value = validateRuntime(this.#port.runtime());
      else value = validateWorkingDirectory(this.#port.workingDirectory());
    } catch {
      value = unavailable(`gef.preflight.environment.${fact}_unavailable`);
    }
    this.#factCache.set(fact, value);
    return value;
  }

  #readEnvironment(key: string, allowed: ReadonlySet<string>): ObservedValue<string> {
    if (!SAFE_ENV_KEY.test(key)) return malformed("gef.preflight.environment.key_malformed");
    if (!allowed.has(key)) return { status: "POLICY_REDACTED", reasonCode: "gef.preflight.environment.key_not_allowlisted" };
    const cached = this.#envCache.get(key);
    if (cached) { this.#counters.cacheHits += 1; return cached; }
    incrementCounter(this.#counters.environmentReads, `env:${key}`);
    let result: ObservedValue<string>;
    try {
      const value = this.#port.readEnvironment(key);
      result = value === undefined
        ? { status: "NOT_PRESENT", reasonCode: "gef.preflight.environment.key_not_present" }
        : value.length <= 8192 && !/[\u0000]/.test(value)
          ? observed(value)
          : malformed("gef.preflight.environment.value_malformed");
    } catch {
      result = unavailable("gef.preflight.environment.key_unavailable");
    }
    this.#envCache.set(key, result);
    return result;
  }

  observe(request: EnvironmentObservationRequest): EnvironmentObservation {
    const requestedFacts = [...new Set(request.facts ?? [])].sort() as EnvironmentFact[];
    const allowed = new Set(request.allowedEnvironmentKeys ?? []);
    const requestedKeys = [...new Set(request.environmentKeys ?? [])].sort();
    const gaps: PreflightGap[] = [];
    const result: {
      schemaVersion: 1;
      platform?: ObservedValue<string>;
      architecture?: ObservedValue<string>;
      runtime?: ObservedValue<RuntimeObservation>;
      workingDirectory?: ObservedValue<string>;
      requestedEnvironment: Record<string, ObservedValue<string>>;
      gaps: PreflightGap[];
    } = { schemaVersion: 1, requestedEnvironment: {}, gaps };

    for (const fact of requestedFacts) {
      const value = this.#readFact(fact);
      if (fact === "platform") result.platform = value as ObservedValue<string>;
      else if (fact === "architecture") result.architecture = value as ObservedValue<string>;
      else if (fact === "runtime") result.runtime = value as ObservedValue<RuntimeObservation>;
      else result.workingDirectory = value as ObservedValue<string>;
      const factGap = gapFor(fact, value);
      if (factGap) gaps.push(factGap);
    }

    for (const key of requestedKeys) {
      const value = this.#readEnvironment(key, allowed);
      result.requestedEnvironment[key] = value;
      const envGap = gapFor(`env_${key}`, value);
      if (envGap) gaps.push(envGap);
    }

    return Object.freeze({ ...result, requestedEnvironment: Object.freeze({ ...result.requestedEnvironment }), gaps: Object.freeze([...gaps]) });
  }

  invalidate(input: { readonly facts?: readonly EnvironmentFact[]; readonly environmentKeys?: readonly string[] } = {}): void {
    for (const fact of input.facts ?? []) this.#factCache.delete(fact);
    for (const key of input.environmentKeys ?? []) this.#envCache.delete(key);
  }

  cacheKey(request: EnvironmentObservationRequest): string { return stablePreflightStringify(request); }
}

export function compactEnvironmentEvidence(observation: EnvironmentObservation): Readonly<Record<string, unknown>> {
  return Object.freeze({
    schemaVersion: observation.schemaVersion,
    ...(observation.platform ? { platform: observation.platform } : {}),
    ...(observation.architecture ? { architecture: observation.architecture } : {}),
    ...(observation.runtime ? { runtime: observation.runtime } : {}),
    requestedEnvironment: Object.freeze(Object.fromEntries(Object.entries(observation.requestedEnvironment).map(([key, value]) => [key, { status: value.status, ...(value.reasonCode ? { reasonCode: value.reasonCode } : {}) }]))),
    gaps: observation.gaps,
  });
}
