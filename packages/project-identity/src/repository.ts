import type {
  PersistedRepositoryBinding,
  RemoteObservation,
  RepositoryIdentityProjection,
  RepositoryRemoteLocator,
  RepositoryResolution,
  RepositoryResolutionInput,
} from "./types.js";

const SAFE_STABLE_ID = /^[A-Za-z0-9._:-]{1,256}$/;
const SAFE_LOCAL_BINDING_ID = /^[A-Za-z0-9._:-]{1,256}$/;

function hostLooksUnsafe(host: string): boolean {
  return host.length === 0 || host.length > 253 || /[\s\\/@?#]/.test(host) || host.includes("..");
}

function normalizeRepositoryPath(rawPath: string): string | null {
  let path = rawPath.replace(/^\/+/, "").replace(/\/+$/, "");
  if (path.endsWith(".git")) path = path.slice(0, -4);
  if (path.length === 0 || path.length > 1024 || /[\u0000-\u001f\u007f?#]/.test(path)) return null;
  const segments = path.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) return null;
  return segments.join("/");
}

export function normalizeRemoteLocator(observation: RemoteObservation): RepositoryRemoteLocator | null {
  const raw = observation.url.trim();
  if (raw.length === 0 || raw.length > 4096 || /[\u0000-\u001f\u007f]/.test(raw)) return null;

  let host: string;
  let path: string;
  if (raw.includes("://") && !/^https:\/\//i.test(raw) && !/^ssh:\/\//i.test(raw)) return null;
  if (/^https:\/\//i.test(raw) || /^ssh:\/\//i.test(raw)) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return null;
    }
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "https:" && protocol !== "ssh:") return null;
    host = parsed.hostname.toLowerCase();
    path = parsed.pathname;
  } else {
    const scp = /^(?:[^@\s/:]+@)?([^\s/:]+):(.+)$/.exec(raw);
    if (!scp || scp[1] === undefined || scp[2] === undefined) return null;
    host = scp[1].toLowerCase();
    path = scp[2].split(/[?#]/, 1)[0] ?? "";
  }

  if (hostLooksUnsafe(host)) return null;
  const normalizedRepositoryPath = normalizeRepositoryPath(path);
  if (!normalizedRepositoryPath) return null;
  return {
    transportIndependentHost: host,
    normalizedRepositoryPath,
    ...(observation.providerHint ? { providerHint: observation.providerHint } : {}),
  };
}

function normalizedStableProviderId(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return SAFE_STABLE_ID.test(value) ? value : undefined;
}

export function canonicalRepositoryProjection(projection: RepositoryIdentityProjection): RepositoryIdentityProjection {
  if (!projection.normalizedLocator?.providerHint) return projection;
  const { providerHint: _providerHint, ...locator } = projection.normalizedLocator;
  return { ...projection, normalizedLocator: locator };
}

export function repositoryLocatorEqual(a: RepositoryRemoteLocator | undefined, b: RepositoryRemoteLocator | undefined): boolean {
  if (!a || !b) return false;
  return a.transportIndependentHost === b.transportIndependentHost && a.normalizedRepositoryPath === b.normalizedRepositoryPath;
}

export function repositoryIdentityEqual(a: RepositoryIdentityProjection | undefined, b: RepositoryIdentityProjection | undefined): boolean {
  if (!a || !b) return false;
  if (a.state !== b.state || a.bindingKind !== b.bindingKind) return false;
  if (a.bindingKind === "LOCAL") return Boolean(a.localBindingId && b.localBindingId && a.localBindingId === b.localBindingId);
  if (a.bindingKind === "REMOTE") {
    if (a.stableProviderId !== undefined && b.stableProviderId !== undefined) return a.stableProviderId === b.stableProviderId;
    return repositoryLocatorEqual(a.normalizedLocator, b.normalizedLocator);
  }
  return a.state === "UNRESOLVED_NO_REPOSITORY";
}

function persistedRemoteMatches(binding: Extract<PersistedRepositoryBinding, { bindingKind: "REMOTE" }>, candidate: RepositoryIdentityProjection): boolean {
  if (candidate.bindingKind !== "REMOTE") return false;
  if (binding.stableProviderId !== undefined && candidate.stableProviderId !== undefined) return binding.stableProviderId === candidate.stableProviderId;
  return repositoryLocatorEqual(binding.normalizedLocator, candidate.normalizedLocator);
}

function remoteCandidateKey(projection: RepositoryIdentityProjection): string {
  if (projection.stableProviderId) return `stable:${projection.stableProviderId}`;
  const locator = projection.normalizedLocator;
  return locator ? `locator:${locator.transportIndependentHost}/${locator.normalizedRepositoryPath}` : "invalid";
}

export function resolveRepositoryIdentity(input: RepositoryResolutionInput): RepositoryResolution {
  if (!input.repositoryPresent) {
    return {
      projection: { schemaVersion: 1, state: "UNRESOLVED_NO_REPOSITORY", normalizationVersion: 1 },
      canonicalBindingPersisted: false,
      candidateCount: 0,
      diagnostics: [],
    };
  }

  const remotes = input.remotes ?? [];
  if (remotes.length === 0) {
    if (input.persistedBinding?.bindingKind === "LOCAL" && SAFE_LOCAL_BINDING_ID.test(input.persistedBinding.localBindingId)) {
      return {
        projection: { schemaVersion: 1, state: "RESOLVED_LOCAL_ONLY", bindingKind: "LOCAL", localBindingId: input.persistedBinding.localBindingId, normalizationVersion: 1 },
        canonicalBindingPersisted: true,
        candidateCount: 0,
        diagnostics: [],
      };
    }
    return {
      projection: { schemaVersion: 1, state: "RESOLVED_LOCAL_ONLY", bindingKind: "LOCAL", normalizationVersion: 1 },
      canonicalBindingPersisted: false,
      candidateCount: 0,
      diagnostics: [{ code: "gef.identity.local_binding_required", summary: "Local-only repository requires a persisted repositoryBindingId before repository-bound use.", severity: "WARNING" }],
    };
  }

  const candidates = new Map<string, RepositoryIdentityProjection>();
  for (const remote of remotes) {
    const locator = normalizeRemoteLocator(remote);
    const trustedId = normalizedStableProviderId(remote.trustedStableProviderId);
    if (!locator || (remote.trustedStableProviderId !== undefined && trustedId === undefined)) {
      return {
        projection: { schemaVersion: 1, state: "INVALID_OR_UNSAFE_REMOTE", normalizationVersion: 1 },
        canonicalBindingPersisted: false,
        candidateCount: 0,
        diagnostics: [{ code: "gef.identity.remote_invalid_or_unsafe", summary: "A repository remote could not be normalized safely.", severity: "ERROR" }],
      };
    }
    const projection: RepositoryIdentityProjection = {
      schemaVersion: 1,
      state: "RESOLVED_REMOTE_BOUND",
      bindingKind: "REMOTE",
      normalizedLocator: locator,
      ...(trustedId ? { stableProviderId: trustedId } : {}),
      normalizationVersion: 1,
    };
    const key = remoteCandidateKey(projection);
    const previous = candidates.get(key);
    if (previous && !repositoryIdentityEqual(previous, projection)) {
      return {
        projection: { schemaVersion: 1, state: "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES", normalizationVersion: 1 },
        canonicalBindingPersisted: false,
        candidateCount: candidates.size + 1,
        diagnostics: [{ code: "gef.identity.provider_binding_conflict", summary: "Trusted provider identity maps to conflicting repository locators.", severity: "ERROR" }],
      };
    }
    candidates.set(key, projection);
  }

  const unique = [...candidates.values()];
  const persisted = input.persistedBinding;
  if (persisted?.bindingKind === "REMOTE") {
    const matches = unique.filter((candidate) => persistedRemoteMatches(persisted, candidate));
    if (matches.length === 1) {
      const selected = matches[0];
      if (!selected) throw new Error("gef.identity.internal_missing_candidate");
      const stableId = persisted.stableProviderId ?? selected.stableProviderId;
      return {
        projection: { ...selected, ...(stableId ? { stableProviderId: stableId } : {}) },
        canonicalBindingPersisted: true,
        candidateCount: unique.length,
        diagnostics: [],
      };
    }
    return {
      projection: { schemaVersion: 1, state: "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES", normalizationVersion: 1 },
      canonicalBindingPersisted: false,
      candidateCount: unique.length,
      diagnostics: [{ code: "gef.identity.persisted_remote_mismatch", summary: "Persisted repository binding does not match observed remote candidates.", severity: "ERROR" }],
    };
  }

  if (persisted?.bindingKind === "LOCAL") {
    return {
      projection: { schemaVersion: 1, state: "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES", normalizationVersion: 1 },
      canonicalBindingPersisted: false,
      candidateCount: unique.length,
      diagnostics: [{ code: "gef.identity.binding_kind_conflict", summary: "Persisted local binding conflicts with observed remote repository state.", severity: "ERROR" }],
    };
  }

  if (unique.length === 1) {
    const selected = unique[0];
    if (!selected) throw new Error("gef.identity.internal_missing_candidate");
    return {
      projection: selected,
      canonicalBindingPersisted: false,
      candidateCount: 1,
      diagnostics: [{ code: "gef.identity.remote_binding_materialization_required", summary: "Single safe remote candidate must be explicitly persisted before canonical repository-bound use.", severity: "WARNING" }],
    };
  }

  return {
    projection: { schemaVersion: 1, state: "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES", normalizationVersion: 1 },
    canonicalBindingPersisted: false,
    candidateCount: unique.length,
    diagnostics: [{ code: "gef.identity.multiple_remote_candidates", summary: "Multiple repository candidates require explicit governed binding.", severity: "ERROR" }],
  };
}

export function repositoryResolutionSatisfiesBound(resolution: RepositoryResolution): boolean {
  if (!resolution.canonicalBindingPersisted) return false;
  const projection = resolution.projection;
  if (projection.state === "RESOLVED_REMOTE_BOUND") return projection.bindingKind === "REMOTE" && projection.normalizedLocator !== undefined;
  if (projection.state === "RESOLVED_LOCAL_ONLY") return projection.bindingKind === "LOCAL" && Boolean(projection.localBindingId);
  return false;
}
