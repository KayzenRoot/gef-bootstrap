import type { RepositoryIdentityProjection, RepositoryRemoteLocator } from "./types.js";

const SAFE_STABLE_ID = /^[A-Za-z0-9._:-]{1,256}$/;
const SAFE_LOCAL_BINDING_ID = /^[A-Za-z0-9._:-]{1,256}$/;
const SAFE_PROVIDER_HINT = /^[A-Za-z0-9._:-]{1,128}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function isCanonicalEndpointHost(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 260 || value !== value.toLowerCase()) return false;
  if (/[\s\\/@?#]/.test(value) || value.includes("..")) return false;
  const ipv6 = /^(\[[0-9a-f:.]+\])(?::(\d{1,5}))?$/.exec(value);
  const named = /^([^:]+)(?::(\d{1,5}))?$/.exec(value);
  const match = ipv6 ?? named;
  if (!match) return false;
  const port = match[2];
  if (port !== undefined) {
    const numeric = Number(port);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 65535) return false;
  }
  return true;
}

function canonicalLocator(value: unknown): RepositoryRemoteLocator {
  if (!isRecord(value) || !hasOnlyKeys(value, ["transportIndependentHost", "normalizedRepositoryPath", "providerHint"])) throw new Error("gef.identity.repository_projection_invalid");
  const host = value.transportIndependentHost;
  const path = value.normalizedRepositoryPath;
  const providerHint = value.providerHint;
  if (!isCanonicalEndpointHost(host)) throw new Error("gef.identity.repository_projection_invalid");
  if (typeof path !== "string" || path.length === 0 || path.length > 1024 || path.startsWith("/") || path.endsWith("/") || path.endsWith(".git") || /[\u0000-\u001f\u007f?#]/.test(path)) throw new Error("gef.identity.repository_projection_invalid");
  if (path.split("/").some((segment) => segment.length === 0 || segment === "." || segment === "..")) throw new Error("gef.identity.repository_projection_invalid");
  if (providerHint !== undefined && (typeof providerHint !== "string" || !SAFE_PROVIDER_HINT.test(providerHint))) throw new Error("gef.identity.repository_projection_invalid");
  return { transportIndependentHost: host, normalizedRepositoryPath: path };
}

export function canonicalizeRepositoryIdentityProjection(value: unknown, requireMaterial = false): RepositoryIdentityProjection {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.normalizationVersion !== 1 || typeof value.state !== "string") throw new Error("gef.identity.repository_projection_invalid");

  if (value.state === "RESOLVED_REMOTE_BOUND") {
    if (!hasOnlyKeys(value, ["schemaVersion", "state", "bindingKind", "normalizedLocator", "stableProviderId", "normalizationVersion"]) || value.bindingKind !== "REMOTE") throw new Error("gef.identity.repository_projection_invalid");
    const normalizedLocator = canonicalLocator(value.normalizedLocator);
    if (value.stableProviderId !== undefined && (typeof value.stableProviderId !== "string" || !SAFE_STABLE_ID.test(value.stableProviderId))) throw new Error("gef.identity.repository_projection_invalid");
    return {
      schemaVersion: 1,
      state: "RESOLVED_REMOTE_BOUND",
      bindingKind: "REMOTE",
      normalizedLocator,
      ...(typeof value.stableProviderId === "string" ? { stableProviderId: value.stableProviderId } : {}),
      normalizationVersion: 1,
    };
  }

  if (value.state === "RESOLVED_LOCAL_ONLY") {
    if (!hasOnlyKeys(value, ["schemaVersion", "state", "bindingKind", "localBindingId", "normalizationVersion"]) || value.bindingKind !== "LOCAL") throw new Error("gef.identity.repository_projection_invalid");
    if (value.localBindingId !== undefined && (typeof value.localBindingId !== "string" || !SAFE_LOCAL_BINDING_ID.test(value.localBindingId))) throw new Error("gef.identity.repository_projection_invalid");
    if (requireMaterial && typeof value.localBindingId !== "string") throw new Error("gef.identity.repository_transition_target_not_materialized");
    return {
      schemaVersion: 1,
      state: "RESOLVED_LOCAL_ONLY",
      bindingKind: "LOCAL",
      ...(typeof value.localBindingId === "string" ? { localBindingId: value.localBindingId } : {}),
      normalizationVersion: 1,
    };
  }

  if (value.state === "UNRESOLVED_NO_REPOSITORY" || value.state === "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES" || value.state === "INVALID_OR_UNSAFE_REMOTE") {
    if (requireMaterial || !hasOnlyKeys(value, ["schemaVersion", "state", "normalizationVersion"])) throw new Error(requireMaterial ? "gef.identity.repository_transition_target_not_materialized" : "gef.identity.repository_projection_invalid");
    return { schemaVersion: 1, state: value.state, normalizationVersion: 1 };
  }

  throw new Error("gef.identity.repository_projection_invalid");
}

export function isCanonicalRepositoryIdentityProjection(value: unknown, requireMaterial = false): value is RepositoryIdentityProjection {
  try {
    canonicalizeRepositoryIdentityProjection(value, requireMaterial);
    return true;
  } catch {
    return false;
  }
}
