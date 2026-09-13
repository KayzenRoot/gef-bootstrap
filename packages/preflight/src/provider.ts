import { repositoryLocatorEqual } from "@gef-bootstrap/project-identity";
import { stablePreflightStringify } from "./canonical.js";
import type {
  HostedProfileObservation,
  HostedProfilePort,
  HostedProfileRequest,
  HostedRepositoryResult,
  MutablePreflightCounters,
  PreflightGap,
  ProviderCapabilityResult,
} from "./types.js";

function gap(code: string, blocking: boolean): PreflightGap {
  return { code, owner: "M30", blocking };
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
    const projection = request.repository.projection;
    const required = request.required ?? true;
    if (projection.state === "RESOLVED_LOCAL_ONLY" || projection.state === "UNRESOLVED_NO_REPOSITORY") {
      if (!required) return { schemaVersion: 1, profileId: request.profileId, readiness: "NOT_REQUIRED", gaps: [] };
      return { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_IDENTITY", gaps: [gap("gef.preflight.provider.remote_repository_required", true)] };
    }
    if (projection.state !== "RESOLVED_REMOTE_BOUND" || projection.bindingKind !== "REMOTE" || !projection.normalizedLocator) {
      return { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_IDENTITY", gaps: [gap("gef.preflight.provider.repository_binding_ambiguous", true)] };
    }

    const expectedHost = request.expectedHost.toLowerCase();
    if (projection.normalizedLocator.transportIndependentHost !== expectedHost) {
      return { schemaVersion: 1, profileId: request.profileId, readiness: "BLOCKED_IDENTITY", gaps: [gap("gef.preflight.provider.host_mismatch", true)] };
    }

    const capabilities = [...new Set(request.capabilities ?? [])].sort();
    const cacheKey = stablePreflightStringify({ profileId: request.profileId, expectedHost, locator: projection.normalizedLocator, capabilities, required });
    const cached = this.#cache.get(cacheKey);
    if (cached) { this.#counters.cacheHits += 1; return cached; }

    this.#counters.providerReads += 1;
    let observed: HostedRepositoryResult;
    try {
      observed = await this.#port.observeRepository({ profileId: request.profileId, host: expectedHost, locator: projection.normalizedLocator, capabilities });
    } catch {
      const unavailable: HostedProfileObservation = {
        schemaVersion: 1,
        profileId: request.profileId,
        readiness: required ? "BLOCKED_PROVIDER" : "READY_WITH_GAPS",
        gaps: [gap("gef.preflight.provider.unavailable", required)],
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
