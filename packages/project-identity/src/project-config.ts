import type { PersistedRepositoryBinding, PersistedRepositoryBindingParseResult, RepositoryRemoteLocator } from "./types.js";

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

function parseCanonicalLocator(value: unknown): RepositoryRemoteLocator | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["transportIndependentHost", "normalizedRepositoryPath", "providerHint"])) return null;
  const host = value.transportIndependentHost;
  const path = value.normalizedRepositoryPath;
  const providerHint = value.providerHint;
  if (typeof host !== "string" || host.length === 0 || host.length > 253 || host !== host.toLowerCase() || /[\s\\/@?#]/.test(host) || host.includes("..")) return null;
  if (typeof path !== "string" || path.length === 0 || path.length > 1024 || path.startsWith("/") || path.endsWith("/") || path.endsWith(".git") || /[\u0000-\u001f\u007f?#]/.test(path)) return null;
  if (path.split("/").some((segment) => segment.length === 0 || segment === "." || segment === "..")) return null;
  if (providerHint !== undefined && (typeof providerHint !== "string" || !SAFE_PROVIDER_HINT.test(providerHint))) return null;
  return {
    transportIndependentHost: host,
    normalizedRepositoryPath: path,
    ...(typeof providerHint === "string" ? { providerHint } : {}),
  };
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

export function parsePersistedRepositoryBinding(value: unknown): PersistedRepositoryBindingParseResult {
  if (!isRecord(value) || typeof value.bindingKind !== "string") return invalidBinding();
  if (value.bindingKind === "LOCAL") {
    if (!hasOnlyKeys(value, ["bindingKind", "localBindingId"]) || typeof value.localBindingId !== "string" || !SAFE_LOCAL_BINDING_ID.test(value.localBindingId)) return invalidBinding();
    return { ok: true, value: { bindingKind: "LOCAL", localBindingId: value.localBindingId } };
  }
  if (value.bindingKind === "REMOTE") {
    if (!hasOnlyKeys(value, ["bindingKind", "normalizedLocator", "stableProviderId"])) return invalidBinding();
    const normalizedLocator = parseCanonicalLocator(value.normalizedLocator);
    if (!normalizedLocator) return invalidBinding();
    if (value.stableProviderId !== undefined && (typeof value.stableProviderId !== "string" || !SAFE_STABLE_ID.test(value.stableProviderId))) return invalidBinding();
    const binding: PersistedRepositoryBinding = {
      bindingKind: "REMOTE",
      normalizedLocator,
      ...(typeof value.stableProviderId === "string" ? { stableProviderId: value.stableProviderId } : {}),
    };
    return { ok: true, value: binding };
  }
  return invalidBinding();
}
