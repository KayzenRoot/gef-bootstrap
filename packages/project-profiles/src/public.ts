import {
  BUILTIN_PROFILES,
  DEFAULT_PROFILE_BUDGETS,
  PROFILE_CONTRACT_VERSION,
  PROFILE_SCHEMA_VERSION,
  PYTHON_SEMANTICS,
  TYPESCRIPT_NODE_SEMANTICS,
  WEB_APP_SEMANTICS,
  builtinRegistry as builtinRegistryCore,
  composeProfile as composeCore,
  createProfileRegistry as createRegistryCore,
  projectProfileBindings as projectCore,
  selectProfile as selectCore,
  validateProfile,
} from "./index.js";
import type { ComposedProfileSnapshot, M07ProfileBindingCandidate, OperationOptions, ProfileResult, ProfileSnapshot, ProjectProfile, SelectedProfileSnapshot, SelectionRequest } from "./index.js";

export { BUILTIN_PROFILES, DEFAULT_PROFILE_BUDGETS, PROFILE_CONTRACT_VERSION, PROFILE_SCHEMA_VERSION, PYTHON_SEMANTICS, TYPESCRIPT_NODE_SEMANTICS, WEB_APP_SEMANTICS, validateProfile };
export type * from "./index.js";

const issuedComposedSnapshots = new WeakSet<object>();

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
function issue<T extends object>(result: ProfileResult<T>): ProfileResult<T> {
  if (result.ok) issuedComposedSnapshots.add(result.value);
  return result;
}

export function createProfileRegistry(additional: readonly ProjectProfile[] = [], options?: OperationOptions): ProfileResult<ReadonlyMap<string,ProfileSnapshot>> {
  return createRegistryCore(additional, options);
}
export function builtinRegistry(options?:OperationOptions):ProfileResult<ReadonlyMap<string,ProfileSnapshot>> {
  return builtinRegistryCore(options);
}
export function composeProfile(snapshot: unknown, registry: unknown, options?: OperationOptions): ProfileResult<ComposedProfileSnapshot> {
  const safeSnapshot=verifiedSnapshot(snapshot,options); if(!safeSnapshot.ok)return safeSnapshot;
  const safeRegistry=verifiedRegistry(registry,options); if(!safeRegistry.ok)return safeRegistry;
  return issue(composeCore(safeSnapshot.value,safeRegistry.value,options));
}
export function selectProfile(request: SelectionRequest, registry: unknown, options?: OperationOptions): ProfileResult<SelectedProfileSnapshot> {
  const safeRegistry=verifiedRegistry(registry,options); if(!safeRegistry.ok)return safeRegistry;
  return issue(selectCore(request,safeRegistry.value,options));
}
export function projectProfileBindings(snapshot: unknown, bindingId: unknown): ProfileResult<readonly M07ProfileBindingCandidate[]> {
  if (!record(snapshot) || !issuedComposedSnapshots.has(snapshot) || typeof bindingId !== "string") return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","projection requires a profile snapshot issued by this public API");
  return projectCore(snapshot as unknown as ComposedProfileSnapshot,bindingId);
}
