import { canonicalizeRepositoryIdentityProjection } from "./projection.js";
import type { PersistedRepositoryBinding, PersistedRepositoryBindingParseResult, RepositoryIdentityProjection } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function invalidBinding(): PersistedRepositoryBindingParseResult {
  return {
    ok: false,
    diagnostic: {
      code: "gef.identity.persisted_repository_binding_invalid",
      summary: "Persisted repository binding is malformed or non-canonical.",
      severity: "ERROR",
    },
  };
}

function projectionToBinding(projection: RepositoryIdentityProjection): PersistedRepositoryBinding | null {
  if (projection.bindingKind === "LOCAL" && projection.localBindingId) {
    return { bindingKind: "LOCAL", localBindingId: projection.localBindingId };
  }
  if (projection.bindingKind === "REMOTE" && projection.normalizedLocator) {
    return {
      bindingKind: "REMOTE",
      normalizedLocator: projection.normalizedLocator,
      ...(projection.stableProviderId ? { stableProviderId: projection.stableProviderId } : {}),
    };
  }
  return null;
}

export function parsePersistedRepositoryBinding(value: unknown): PersistedRepositoryBindingParseResult {
  if (!isRecord(value) || typeof value.bindingKind !== "string") return invalidBinding();

  let projectionInput: unknown;
  if (value.bindingKind === "LOCAL") {
    if (!hasOnlyKeys(value, ["bindingKind", "localBindingId"])) return invalidBinding();
    projectionInput = {
      schemaVersion: 1,
      state: "RESOLVED_LOCAL_ONLY",
      bindingKind: "LOCAL",
      localBindingId: value.localBindingId,
      normalizationVersion: 1,
    };
  } else if (value.bindingKind === "REMOTE") {
    if (!hasOnlyKeys(value, ["bindingKind", "normalizedLocator", "stableProviderId"])) return invalidBinding();
    projectionInput = {
      schemaVersion: 1,
      state: "RESOLVED_REMOTE_BOUND",
      bindingKind: "REMOTE",
      normalizedLocator: value.normalizedLocator,
      ...(value.stableProviderId !== undefined ? { stableProviderId: value.stableProviderId } : {}),
      normalizationVersion: 1,
    };
  } else {
    return invalidBinding();
  }

  try {
    const projection = canonicalizeRepositoryIdentityProjection(projectionInput, true);
    const binding = projectionToBinding(projection);
    return binding ? { ok: true, value: binding } : invalidBinding();
  } catch {
    return invalidBinding();
  }
}
