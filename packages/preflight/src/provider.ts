import { canonicalizeRepositoryIdentityProjection, repositoryLocatorEqual } from "@gef-bootstrap/project-identity";
import { stablePreflightStringify } from "./canonical.js";
import type {
  AuthenticationStatus,
  HostedProfileObservation,
  HostedProfilePort,
  HostedProfileRequest,
  HostedRepositoryResult,
  MutablePreflightCounters,
  PreflightGap,
  ProviderCapabilityResult,
  ProviderCapabilityStatus,
} from "./types.js";

const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SAFE_REASON = /^[A-Za-z0-9._:-]{1,256}$/;
const AUTHENTICATION_STATUSES = new Set<AuthenticationStatus>(["NOT_REQUIRED", "AVAILABLE", "MISSING", "EXPIRED_OR_REJECTED", "UNAVAILABLE", "UNKNOWN"]);
const CAPABILITY_STATUSES = new Set<ProviderCapabilityStatus>(["AVAILABLE", "MISSING_PERMISSION", "NOT_SUPPORTED", "NOT_OBSERVABLE_WITHOUT_ATTEMPT", "AUTH_REQUIRED", "PROVIDER_UNAVAILABLE", "UNKNOWN"]);
const VISIBILITIES = new Set(["public", "private", "internal"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function gap(code: string, blocking: boolean): PreflightGap {
  return { code, owner: "M30", blocking };
}

function canonicalExpectedHost(value: string): string | null {
  try {
    const projection = canonicalizeRepositoryIdentityProjection({
      schemaVersion: 1,
      state: "RESOLVED_REMOTE_BOUND",
      bindingKind: "REMOTE",
      normalizedLocator: { transportIndependentHost: value.toLowerCase(), normalizedRepositoryPath: "gef/host-validation" },
      normalizationVersion: 1,
    }, true);
    return projection.normalizedLocator?.transportIndependentHost ?? null;
  } catch {
    return null;
  }
}

function normalizeProviderResult(value: unknown): HostedRepositoryResult | null {
  if (!isRecord(value)) return null;
  const stableRepositoryId = value.stableRepositoryId;
  let projection;
  try {
    projection = canonicalizeRepositoryIdentityProjection({
      schemaVersion: 1,
      state: "RESOLVED_REMOTE_BOUND",
      bindingKind: "REMOTE",
      normalizedLocator: value.locator,
      ...(stableRepositoryId !== undefined ? { stableProviderId: stableRepositoryId } : {}),
      normalizationVersion: 1,
    }, true);
  } catch {
    return null;
  }
  if (!projection.normalizedLocator) return null;

  const authenticationStatus = value.authenticationStatus;
  if (typeof authenticationStatus !== "string" || !AUTHENTICATION_STATUSES.has(authenticationStatus as AuthenticationStatus)) return null;
  const rawCapabilities = value.capabilities;
  if (!Array.isArray(rawCapabilities) || rawCapabilities.length > 128) return null;
  const capabilities: ProviderCapabilityResult[] = [];
  for (const raw of rawCapabilities) {
    if (!isRecord(raw) || typeof raw.capability !== "string" || !SAFE_ID.test(raw.capability) || typeof raw.status !== "string" || !CAPABILITY_STATUSES.has(raw.status as ProviderCapabilityStatus)) return null;
    if (raw.reasonCode !== undefined && (typeof raw.reasonCode !== "string" || !SAFE_REASON.test(raw.reasonCode))) return null;
    capabilities.push({
      capability: raw.capability,
      status: raw.status as ProviderCapabilityStatus,
      ...(typeof raw.reasonCode === "string" ? { reasonCode: raw.reasonCode } : {}),
    });
  }

  const visibility = value.visibility;
  if (visibility !== undefined && (typeof visibility !== "string" || !VISIBILITIES.has(visibility))) return null;
  if (value.archived !== undefined && typeof value.archived !== "boolean") return null;
  if (value.fork !== undefined && typeof value.fork !== "boolean") return null;
  if (value.defaultBranch !== undefined && (typeof value.defaultBranch !== "string" || value.defaultBranch.length === 0 || value.defaultBranch.length > 256 || /[\u0000\r\n]/.test(value.defaultBranch))) return null;

  return {
    locator: projection.normalizedLocator,
    ...(projection.stableProviderId ? { stableRepositoryId: projection.stableProviderId } : {}),
    ...(typeof visibility === "string" ? { visibility: visibility as "public" | "private" | "internal" } : {}),
    ...(typeof value.archived === "boolean" ? { archived: value.archived } : {}),
    ...(typeof value.fork === "boolean" ? { fork: value.fork } : {}),
    ...(typeof value.defaultBranch === "string" ? { defaultBranch: value.defaultBranch } : {}),
    authenticationStatus: authenticationStatus as AuthenticationStatus,
    capabilities,
  };
}

function requestedCapabilities(result: HostedRepositoryResult, requested: readonly string[]): readonly ProviderCapabilityResult[] {
  const byName = new Map(result.capabilities.map((item) => [item.capability, item]));
  return requested.map((capability) => byName.get(capability) ?? { capability, status: "UNKNOWN", reasonCode: "gef.preflight.provider.capability_unreported" });
}

function providerReadiness(result: HostedRepositoryResult, capabilities: readonly ProviderCapabilityResult[], required: boolean): { readiness: HostedProfileObservation["readiness"]; gaps: PreflightGap[] } {
  const gaps: PreflightGap[] = [];
  if (result.authenticationStatus === "MISSING" || result.authenticationStatus === "EXPIRED_OR_REJECTED") {
    gaps.push(gap("gef.preflight.provider.auth_required", required));
    return { readiness: required ? "BLOCKED_AUTH" : "READY_WITH_GAPS", gaps };
  }
  if (result.authenticationStatus === "UNAVAILABLE" || result.authenticationStatus === "UNKNOWN") {
    gaps.push(gap("gef.preflight.provider.auth_unavailable", required));
    return { readiness: required ? "BLOCKED_PROVIDER" : "READY_WITH_GAPS", gaps };
  }

  for (const item of capabilities) {
    if (item.status === "AVAILABLE") continue;
    const code = item.reasonCode ?? `gef.preflight.provider.capability_${item.status.toLowerCase()}`;
    gaps.push(gap(code, required));
  }
  if (required && capabilities.some((item) => item.status === "MISSING_PERMISSION" || item.status === "AUTH_REQUIRED")) return { readiness: "BLOCKED_PERMISSION", gaps };
  if (required && capabilities.some((item) => item.status === "PROVIDER_UNAVAILABLE" || item.status === "UNKNOWN" || item.status === "NOT_SUPPORTED" || item.status === "NOT_OBSERVABLE_WITHOUT_ATTEMPT")) return { readiness: "BLOCKED_PROVIDER", gaps };
  return { readiness: gaps.length > 0 ? "READY_WITH_GAPS" : "READY", gaps };
}

export class HostedProfileObservationSession {
  readonly #port: HostedProfilePort;
  readonly #counters: MutablePreflightCounters;
  readonly #cache = new Map<string, HostedProfileObservation>();

  constructor(port: HostedProfilePort, counters: MutablePreflightCounters) {
    this.#port = port;
    this.#counters = counters;
  }

  async observe(request: HostedProfileRequest): Promise<HostedProfileObservation> {
    const required = request.required ?? true;
    if (!SAFE_ID.test(request.profileId)) return { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_PROVIDER", gaps: [gap("gef.preflight.provider.profile_invalid", required)] };
    const expectedHost = canonicalExpectedHost(request.expectedHost);
    if (!expectedHost) return { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_PROVIDER", gaps: [gap("gef.preflight.provider.host_invalid", required)] };
    const capabilities = [...new Set(request.capabilities ?? [])].sort();
    if (capabilities.length > 128 || capabilities.some((capability) => !SAFE_ID.test(capability))) {
      return { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_PROVIDER", gaps: [gap("gef.preflight.provider.capability_request_invalid", required)] };
    }

    const projection = request.repository.projection;
    if (projection.state === "RESOLVED_LOCAL_ONLY" || projection.state === "UNRESOLVED_NO_REPOSITORY") {
      if (!required) return { schemaVersion: 1, profileId: request.profileId, readiness: "NOT_REQUIRED", gaps: [] };
      return { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_IDENTITY", gaps: [gap("gef.preflight.provider.remote_repository_required", true)] };
    }
    if (projection.state !== "RESOLVED_REMOTE_BOUND" || projection.bindingKind !== "REMOTE" || !projection.normalizedLocator) {
      return { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_IDENTITY", gaps: [gap("gef.preflight.provider.repository_binding_ambiguous", true)] };
    }
    if (projection.normalizedLocator.transportIndependentHost !== expectedHost) {
      return { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_IDENTITY", gaps: [gap("gef.preflight.provider.host_mismatch", true)] };
    }

    const cacheKey = stablePreflightStringify({ profileId: request.profileId, expectedHost, locator: projection.normalizedLocator, capabilities, required });
    const cached = this.#cache.get(cacheKey);
    if (cached) { this.#counters.cacheHits += 1; return cached; }

    this.#counters.providerReads += 1;
    let observed: HostedRepositoryResult;
    try {
      const rawObserved: unknown = await this.#port.observeRepository({ profileId: request.profileId, host: expectedHost, locator: projection.normalizedLocator, capabilities });
      const normalized = normalizeProviderResult(rawObserved);
      if (!normalized) throw new Error("gef.preflight.provider.result_invalid");
      observed = normalized;
    } catch {
      const unavailable: HostedProfileObservation = {
        schemaVersion: 1,
        profileId: request.profileId,
        readiness: required ? "BLOCKED_PROVIDER" : "READY_WITH_GAPS",
        gaps: [gap("gef.preflight.provider.unavailable_or_invalid", required)],
      };
      this.#cache.set(cacheKey, unavailable);
      return unavailable;
    }

    if (!repositoryLocatorEqual(projection.normalizedLocator, observed.locator)) {
      const mismatch: HostedProfileObservation = { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_IDENTITY", gaps: [gap("gef.preflight.provider.repository_mismatch", true)] };
      this.#cache.set(cacheKey, mismatch);
      return mismatch;
    }
    if (projection.stableProviderId !== undefined && observed.stableRepositoryId !== undefined && projection.stableProviderId !== observed.stableRepositoryId) {
      const conflict: HostedProfileObservation = { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_IDENTITY", gaps: [gap("gef.preflight.provider.stable_id_conflict", true)] };
      this.#cache.set(cacheKey, conflict);
      return conflict;
    }

    const scopedCapabilities = requestedCapabilities(observed, capabilities);
    const decision = providerReadiness(observed, scopedCapabilities, required);
    const normalizedRepository: HostedRepositoryResult = {
      locator: observed.locator,
      ...(observed.stableRepositoryId ? { stableRepositoryId: observed.stableRepositoryId } : {}),
      ...(observed.visibility ? { visibility: observed.visibility } : {}),
      ...(observed.archived !== undefined ? { archived: observed.archived } : {}),
      ...(observed.fork !== undefined ? { fork: observed.fork } : {}),
      ...(observed.defaultBranch ? { defaultBranch: observed.defaultBranch } : {}),
      authenticationStatus: observed.authenticationStatus,
      capabilities: scopedCapabilities,
    };
    const value: HostedProfileObservation = { schemaVersion: 1, profileId: request.profileId, readiness: decision.readiness, repository: normalizedRepository, gaps: decision.gaps };
    this.#cache.set(cacheKey, value);
    return value;
  }

  invalidate(): void { this.#cache.clear(); }
}

export function compactHostedEvidence(observation: HostedProfileObservation): Readonly<Record<string, unknown>> {
  return Object.freeze({
    schemaVersion: 1,
    profileId: observation.profileId,
    readiness: observation.readiness,
    ...(observation.repository ? {
      repository: {
        locator: observation.repository.locator,
        ...(observation.repository.stableRepositoryId ? { stableRepositoryId: observation.repository.stableRepositoryId } : {}),
        authenticationStatus: observation.repository.authenticationStatus,
        capabilities: observation.repository.capabilities,
      },
    } : {}),
    gaps: observation.gaps,
  });
}
