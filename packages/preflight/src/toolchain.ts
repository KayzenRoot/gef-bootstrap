import { incrementCounter, stablePreflightStringify } from "./canonical.js";
import type {
  MutablePreflightCounters,
  PreflightGap,
  ToolDescriptor,
  ToolObservation,
  ToolObservationPort,
  ToolObservationRequest,
  ToolProbeResult,
  ToolProbeSpec,
  ToolResolutionResult,
} from "./types.js";

const SAFE_TOOL_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SAFE_PATH_NAME = /^[A-Za-z0-9._+\-]{1,128}$/;
const SAFE_POLICY_REF = /^[A-Za-z0-9._:/\-]{1,256}$/;
const DEFAULT_VERSION_PARSER_REF = "m04.default-version-parser.v1";
const TOOL_PROBE_STATUSES = new Set(["SUCCEEDED", "FAILED", "TIMED_OUT", "CANCELLED"]);
const TOOL_RESOLUTION_STATUSES = new Set(["FOUND", "ABSENT", "AMBIGUOUS", "UNAVAILABLE"]);

function gap(code: string, blocking: boolean): PreflightGap { return { code, owner: "M38", blocking }; }

function validateDescriptor(descriptor: ToolDescriptor): string | null {
  if (!SAFE_TOOL_ID.test(descriptor.toolId)) return "gef.preflight.tool.id_invalid";
  if (descriptor.resolution.kind === "PATH_NAME") {
    if (!SAFE_PATH_NAME.test(descriptor.resolution.executable)) return "gef.preflight.tool.path_name_invalid";
  } else {
    if (descriptor.resolution.executable.length === 0 || descriptor.resolution.executable.length > 4096 || /[\u0000\r\n]/.test(descriptor.resolution.executable)) return "gef.preflight.tool.trusted_path_invalid";
    if (!SAFE_POLICY_REF.test(descriptor.resolution.policyRef)) return "gef.preflight.tool.policy_ref_invalid";
  }
  const probe = descriptor.versionProbe;
  if (probe) {
    if (probe.argv.length > 32 || probe.argv.some((arg) => typeof arg !== "string" || arg.length > 4096 || /[\u0000\r\n]/.test(arg))) return "gef.preflight.tool.probe_argv_invalid";
  }
  return null;
}

function defaultVersionParser(stdout: string, stderr: string): string | null {
  const text = `${stdout}\n${stderr}`.trim();
  const match = /(?:^|\s)v?(\d+\.\d+(?:\.\d+)?(?:[-+][A-Za-z0-9._-]+)?)(?:\s|$)/.exec(text);
  return match?.[1] ?? null;
}

function boundedText(value: string, max: number): boolean {
  return value.length <= max && !/[\u0000]/.test(value);
}

function normalizeResolution(value: unknown): ToolResolutionResult | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ToolResolutionResult>;
  if (typeof candidate.status !== "string" || !TOOL_RESOLUTION_STATUSES.has(candidate.status)) return null;
  if (candidate.executable !== undefined && (typeof candidate.executable !== "string" || candidate.executable.length === 0 || candidate.executable.length > 4096 || /[\u0000\r\n]/.test(candidate.executable))) return null;
  if (candidate.executableIdentity !== undefined && (typeof candidate.executableIdentity !== "string" || candidate.executableIdentity.length === 0 || candidate.executableIdentity.length > 256 || /[\u0000\r\n]/.test(candidate.executableIdentity))) return null;
  if (candidate.reasonCode !== undefined && (typeof candidate.reasonCode !== "string" || !SAFE_POLICY_REF.test(candidate.reasonCode))) return null;
  return {
    status: candidate.status,
    ...(typeof candidate.executableIdentity === "string" ? { executableIdentity: candidate.executableIdentity } : {}),
    ...(typeof candidate.executable === "string" ? { executable: candidate.executable } : {}),
    ...(typeof candidate.reasonCode === "string" ? { reasonCode: candidate.reasonCode } : {}),
  };
}

function normalizeProbeResult(value: unknown): ToolProbeResult | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ToolProbeResult>;
  if (typeof candidate.status !== "string" || !TOOL_PROBE_STATUSES.has(candidate.status)) return null;
  if (typeof candidate.stdout !== "string" || typeof candidate.stderr !== "string") return null;
  if (candidate.exitCode !== undefined && (!Number.isInteger(candidate.exitCode) || candidate.exitCode < 0 || candidate.exitCode > 255)) return null;
  return {
    status: candidate.status as ToolProbeResult["status"],
    ...(typeof candidate.exitCode === "number" ? { exitCode: candidate.exitCode } : {}),
    stdout: candidate.stdout,
    stderr: candidate.stderr,
  };
}

export class ToolObservationSession {
  readonly #port: ToolObservationPort;
  readonly #counters: MutablePreflightCounters;
  readonly #resolutionCache = new Map<string, ToolResolutionResult>();
  readonly #probeCache = new Map<string, ToolProbeResult>();

  constructor(port: ToolObservationPort, counters: MutablePreflightCounters) {
    this.#port = port;
    this.#counters = counters;
  }

  async #resolve(descriptor: ToolDescriptor): Promise<ToolResolutionResult> {
    const key = stablePreflightStringify(descriptor);
    const cached = this.#resolutionCache.get(key);
    if (cached) { this.#counters.cacheHits += 1; return cached; }
    incrementCounter(this.#counters.toolResolutions, descriptor.toolId);
    try {
      const normalized = normalizeResolution(await this.#port.resolve(descriptor));
      const result = normalized ?? { status: "UNAVAILABLE", reasonCode: "gef.preflight.tool.resolve_result_invalid" };
      this.#resolutionCache.set(key, result);
      return result;
    } catch {
      const unavailable: ToolResolutionResult = { status: "UNAVAILABLE", reasonCode: "gef.preflight.tool.resolve_unavailable" };
      this.#resolutionCache.set(key, unavailable);
      return unavailable;
    }
  }

  async #probe(toolId: string, spec: ToolProbeSpec): Promise<ToolProbeResult> {
    const key = stablePreflightStringify({ toolId, executable: spec.executable, argv: spec.argv, timeoutMs: spec.timeoutMs, maxOutputBytes: spec.maxOutputBytes, env: spec.env });
    const cached = this.#probeCache.get(key);
    if (cached) { this.#counters.cacheHits += 1; return cached; }
    incrementCounter(this.#counters.toolProbes, toolId);
    let result: ToolProbeResult;
    try {
      result = normalizeProbeResult(await this.#port.probe(spec)) ?? { status: "FAILED", stdout: "", stderr: "" };
    } catch {
      result = { status: "FAILED", stdout: "", stderr: "" };
    }
    this.#probeCache.set(key, result);
    return result;
  }

  async observe(request: ToolObservationRequest): Promise<ToolObservation> {
    const required = request.required ?? true;
    const descriptorError = validateDescriptor(request.descriptor);
    if (descriptorError) {
      return { schemaVersion: 1, toolId: request.descriptor.toolId, presence: "AMBIGUOUS", probeStatus: "NOT_REQUIRED", compatibility: "NOT_CHECKED", gaps: [gap(descriptorError, required)] };
    }
    if (request.parseVersion && (!request.parseVersionRef || !SAFE_POLICY_REF.test(request.parseVersionRef))) {
      return { schemaVersion: 1, toolId: request.descriptor.toolId, presence: "AMBIGUOUS", probeStatus: "UNOBSERVABLE", compatibility: "UNKNOWN", gaps: [gap("gef.preflight.tool.version_parser_ref_invalid", required)] };
    }
    if (request.compatibility && !SAFE_POLICY_REF.test(request.compatibility.policyRef)) {
      return { schemaVersion: 1, toolId: request.descriptor.toolId, presence: "AMBIGUOUS", probeStatus: "UNOBSERVABLE", compatibility: "UNKNOWN", gaps: [{ code: "gef.preflight.tool.compatibility_policy_ref_invalid", owner: "M51", blocking: required }] };
    }

    const resolution = await this.#resolve(request.descriptor);
    if (resolution.status !== "FOUND" || !resolution.executable) {
      const code = resolution.reasonCode ?? `gef.preflight.tool.${resolution.status.toLowerCase()}`;
      return { schemaVersion: 1, toolId: request.descriptor.toolId, presence: resolution.status, ...(resolution.executableIdentity ? { executableIdentity: resolution.executableIdentity } : {}), probeStatus: "NOT_REQUIRED", compatibility: "NOT_CHECKED", gaps: [gap(code, required)] };
    }

    if (!request.requireVersion) {
      return { schemaVersion: 1, toolId: request.descriptor.toolId, presence: "FOUND", ...(resolution.executableIdentity ? { executableIdentity: resolution.executableIdentity } : {}), probeStatus: "NOT_REQUIRED", compatibility: "NOT_CHECKED", gaps: [] };
    }

    const probeContract = request.descriptor.versionProbe;
    if (!probeContract || probeContract.timeoutMs < 1 || probeContract.timeoutMs > 120_000 || probeContract.maxOutputBytes < 1 || probeContract.maxOutputBytes > 1_048_576) {
      return { schemaVersion: 1, toolId: request.descriptor.toolId, presence: "FOUND", ...(resolution.executableIdentity ? { executableIdentity: resolution.executableIdentity } : {}), probeStatus: "UNOBSERVABLE", compatibility: "UNKNOWN", gaps: [gap("gef.preflight.tool.version_probe_unavailable", required)] };
    }

    const spec: ToolProbeSpec = {
      executable: resolution.executable,
      argv: Object.freeze([...probeContract.argv]),
      timeoutMs: probeContract.timeoutMs,
      maxOutputBytes: probeContract.maxOutputBytes,
      env: Object.freeze({}),
      ...(request.signal ? { signal: request.signal } : {}),
    };
    const probe = await this.#probe(request.descriptor.toolId, spec);
    const parserRef: string = request.parseVersion ? request.parseVersionRef! : DEFAULT_VERSION_PARSER_REF;
    if (probe.status !== "SUCCEEDED") {
      const code = `gef.preflight.tool.probe_${probe.status.toLowerCase()}`;
      return { schemaVersion: 1, toolId: request.descriptor.toolId, presence: "FOUND", ...(resolution.executableIdentity ? { executableIdentity: resolution.executableIdentity } : {}), versionParserRef: parserRef, probeStatus: probe.status, compatibility: "UNKNOWN", gaps: [gap(code, required)] };
    }
    if (probe.exitCode !== 0 || !boundedText(probe.stdout, probeContract.maxOutputBytes) || !boundedText(probe.stderr, probeContract.maxOutputBytes)) {
      return { schemaVersion: 1, toolId: request.descriptor.toolId, presence: "FOUND", ...(resolution.executableIdentity ? { executableIdentity: resolution.executableIdentity } : {}), versionParserRef: parserRef, probeStatus: "FAILED", compatibility: "UNKNOWN", gaps: [gap("gef.preflight.tool.probe_output_invalid", required)] };
    }

    const parser = request.parseVersion ?? defaultVersionParser;
    let version: string | null;
    try {
      version = parser(probe.stdout, probe.stderr);
    } catch {
      version = null;
    }
    if (!version || version.length > 128 || /[\u0000-\u001f\u007f]/.test(version)) {
      return { schemaVersion: 1, toolId: request.descriptor.toolId, presence: "FOUND", ...(resolution.executableIdentity ? { executableIdentity: resolution.executableIdentity } : {}), versionParserRef: parserRef, probeStatus: "SUCCEEDED", compatibility: "UNKNOWN", gaps: [gap("gef.preflight.tool.version_unparseable", required)] };
    }

    let compatibility = "NOT_CHECKED" as ToolObservation["compatibility"];
    const gaps: PreflightGap[] = [];
    if (request.compatibility) {
      try {
        compatibility = request.compatibility.classify(request.descriptor.toolId, version);
      } catch {
        compatibility = "UNKNOWN";
      }
      if (compatibility === "INCOMPATIBLE") gaps.push({ code: "gef.preflight.tool.version_incompatible", owner: "M51", blocking: required });
      else if (compatibility === "UNKNOWN") gaps.push({ code: "gef.preflight.tool.compatibility_unknown", owner: "M51", blocking: required });
    }

    return {
      schemaVersion: 1,
      toolId: request.descriptor.toolId,
      presence: "FOUND",
      ...(resolution.executableIdentity ? { executableIdentity: resolution.executableIdentity } : {}),
      observedVersion: version,
      versionParserRef: parserRef,
      probeStatus: "SUCCEEDED",
      compatibility,
      ...(request.compatibility ? { compatibilityPolicyRef: request.compatibility.policyRef } : {}),
      gaps,
    };
  }

  invalidate(toolId?: string): void {
    if (!toolId) { this.#resolutionCache.clear(); this.#probeCache.clear(); return; }
    for (const [key] of this.#resolutionCache) if (key.includes(`\"toolId\":\"${toolId}\"`)) this.#resolutionCache.delete(key);
    for (const [key] of this.#probeCache) if (key.includes(`\"toolId\":\"${toolId}\"`)) this.#probeCache.delete(key);
  }
}

export function compactToolEvidence(observation: ToolObservation): Readonly<Record<string, unknown>> {
  return Object.freeze({
    schemaVersion: 1,
    toolId: observation.toolId,
    presence: observation.presence,
    ...(observation.observedVersion ? { observedVersion: observation.observedVersion } : {}),
    ...(observation.versionParserRef ? { versionParserRef: observation.versionParserRef } : {}),
    probeStatus: observation.probeStatus,
    compatibility: observation.compatibility,
    ...(observation.compatibilityPolicyRef ? { compatibilityPolicyRef: observation.compatibilityPolicyRef } : {}),
    gaps: observation.gaps,
  });
}
