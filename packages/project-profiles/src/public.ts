import {
  BUILTIN_PROFILES,
  DEFAULT_PROFILE_BUDGETS,
  PROFILE_CONTRACT_VERSION,
  PROFILE_SCHEMA_VERSION,
  PYTHON_SEMANTICS,
  TYPESCRIPT_NODE_SEMANTICS,
  WEB_APP_SEMANTICS,
  builtinRegistry,
  composeProfile as composeCore,
  createProfileRegistry,
  projectProfileBindings as projectCore,
  selectProfile as selectCore,
  validateProfile,
} from "./index.js";
import type { ComposedProfileSnapshot, M07ProfileBindingCandidate, OperationOptions, ProfileResult, ProfileSnapshot, SelectedProfileSnapshot, SelectionRequest } from "./index.js";

export { BUILTIN_PROFILES, DEFAULT_PROFILE_BUDGETS, PROFILE_CONTRACT_VERSION, PROFILE_SCHEMA_VERSION, PYTHON_SEMANTICS, TYPESCRIPT_NODE_SEMANTICS, WEB_APP_SEMANTICS, builtinRegistry, createProfileRegistry, validateProfile };
export type * from "./index.js";

function fail<T>(code: string, message: string): ProfileResult<T> { return { ok:false, error:Object.freeze({code,message}) }; }
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }

function verifiedSnapshot(value: unknown, options?: OperationOptions): ProfileResult<ProfileSnapshot> {
  if (!record(value) || !("profile" in value) || typeof value.nativeProfileSemanticDigest !== "string") return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile snapshot shape is invalid");
  const validated = validateProfile(value.profile, options);
  if (!validated.ok) return validated;
  if (validated.value.nativeProfileSemanticDigest !== value.nativeProfileSemanticDigest) return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile snapshot digest mismatch");
  return validated;
}
function verifiedRegistry(value: unknown, options?: OperationOptions): ProfileResult<ReadonlyMap<string,ProfileSnapshot>> {
  if (!(value instanceof Map)) return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile registry must be a Map");
  const clean = new Map<string,ProfileSnapshot>();
  for (const [key, raw] of value.entries()) {
    if (typeof key !== "string") return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile registry key is invalid");
    const verified = verifiedSnapshot(raw, options); if (!verified.ok) return verified;
    if (verified.value.profile.profileId !== key) return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile registry key/id mismatch");
    clean.set(key, verified.value);
  }
  return {ok:true,value:clean};
}

export function composeProfile(snapshot: unknown, registry: unknown, options?: OperationOptions): ProfileResult<ComposedProfileSnapshot> {
  const safeSnapshot=verifiedSnapshot(snapshot,options); if(!safeSnapshot.ok)return safeSnapshot;
  const safeRegistry=verifiedRegistry(registry,options); if(!safeRegistry.ok)return safeRegistry;
  return composeCore(safeSnapshot.value,safeRegistry.value,options);
}
export function selectProfile(request: SelectionRequest, registry: unknown, options?: OperationOptions): ProfileResult<SelectedProfileSnapshot> {
  const safeRegistry=verifiedRegistry(registry,options); if(!safeRegistry.ok)return safeRegistry;
  return selectCore(request,safeRegistry.value,options);
}
export function projectProfileBindings(snapshot: unknown, bindingId: unknown): ProfileResult<readonly M07ProfileBindingCandidate[]> {
  if (!record(snapshot) || !Array.isArray(snapshot.effectiveTemplateBindings) || typeof bindingId !== "string") return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","composed snapshot shape is invalid");
  if (!snapshot.effectiveTemplateBindings.every((x)=>record(x) && typeof x.bindingId === "string" && typeof x.templateId === "string" && typeof x.templateVersion === "string")) return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","composed snapshot bindings are invalid");
  return projectCore(snapshot as unknown as ComposedProfileSnapshot,bindingId);
}
