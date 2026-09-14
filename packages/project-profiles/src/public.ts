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
  validateProfile as validateCore,
} from "./index.js";
import type { ComposedProfileSnapshot, M07ProfileBindingCandidate, OperationOptions, ProfileBudgets, ProfileResult, ProfileSnapshot, ProjectProfile, SelectedProfileSnapshot, SelectionRequest } from "./index.js";

export { BUILTIN_PROFILES, DEFAULT_PROFILE_BUDGETS, PROFILE_CONTRACT_VERSION, PROFILE_SCHEMA_VERSION, PYTHON_SEMANTICS, TYPESCRIPT_NODE_SEMANTICS, WEB_APP_SEMANTICS };
export type * from "./index.js";

const issuedComposedSnapshots = new WeakSet<object>();
const REQUEST_KEYS = new Set(["mode","profileId","expectedProfileVersion","expectedProfileDigest"]);
const PRODUCT_IDS = new Set(Object.keys(BUILTIN_PROFILES));

function fail<T>(code: string, message: string): ProfileResult<T> { return { ok:false, error:Object.freeze({code,message}) }; }
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function ownKeysOnly(value: Record<string,unknown>, allowed: ReadonlySet<string>): boolean { return Object.keys(value).every((key)=>allowed.has(key) && key!=="__proto__" && key!=="constructor" && key!=="prototype"); }
function capped(value: unknown, fallback: number): number { return value === undefined ? fallback : (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? Math.min(value,fallback) : 0); }
function safeOptions(options?: OperationOptions): OperationOptions {
  const raw=options?.budgets as Partial<ProfileBudgets>|undefined;
  return { ...(options?.signal===undefined?{}:{signal:options.signal}), budgets:{ maxProfiles:capped(raw?.maxProfiles,DEFAULT_PROFILE_BUDGETS.maxProfiles), maxDepth:capped(raw?.maxDepth,DEFAULT_PROFILE_BUDGETS.maxDepth), maxTemplateBindings:capped(raw?.maxTemplateBindings,DEFAULT_PROFILE_BUDGETS.maxTemplateBindings), maxVariableBindings:capped(raw?.maxVariableBindings,DEFAULT_PROFILE_BUDGETS.maxVariableBindings), maxStringBytes:capped(raw?.maxStringBytes,DEFAULT_PROFILE_BUDGETS.maxStringBytes) } };
}
function inertBounded(value: unknown, limits: ProfileBudgets): boolean {
  if (value === undefined) return true;
  const stack:Array<{value:unknown,depth:number}>=[{value,depth:0}]; const seen=new WeakSet<object>(); let nodes=0; let stringBytes=0;
  while(stack.length){const cur=stack.pop()!;nodes++;if(nodes>limits.maxVariableBindings||cur.depth>limits.maxDepth)return false;const v=cur.value;if(typeof v==="string"){stringBytes+=new TextEncoder().encode(v).byteLength;if(stringBytes>limits.maxStringBytes)return false;continue;}if(v===null||typeof v==="boolean"||(typeof v==="number"&&Number.isFinite(v)))continue;if(typeof v!=="object")return false;if(seen.has(v as object))return false;seen.add(v as object);if(Array.isArray(v)){for(const item of v)stack.push({value:item,depth:cur.depth+1});continue;}if(!record(v))return false;for(const [k,item] of Object.entries(v)){if(k==="__proto__"||k==="constructor"||k==="prototype")return false;stringBytes+=new TextEncoder().encode(k).byteLength;if(stringBytes>limits.maxStringBytes)return false;stack.push({value:item,depth:cur.depth+1});}}
  return true;
}
function variableCount(input: unknown): number {
  if(!record(input)||!Array.isArray(input.templateBindings))return 0;let count=0;for(const b of input.templateBindings){if(record(b)&&Array.isArray(b.variableBindings))count+=b.variableBindings.length;}return count;
}

export function validateProfile(input: unknown, options?: OperationOptions): ProfileResult<ProfileSnapshot> {
  const safe=safeOptions(options); const limits={...DEFAULT_PROFILE_BUDGETS,...safe.budgets} as ProfileBudgets;
  if(record(input)){if(!inertBounded(input.displayMetadata,limits)||!inertBounded(input.extensions,limits))return fail("PROFILE_BUDGET_EXCEEDED","inert metadata/extension budget exceeded");if(variableCount(input)>limits.maxVariableBindings)return fail("PROFILE_BUDGET_EXCEEDED","aggregate variable binding budget exceeded");}
  try{return validateCore(input,safe);}catch{return fail("PROFILE_SCHEMA_INVALID","profile validation rejected malformed runtime input");}
}
function verifiedSnapshot(value: unknown, options?: OperationOptions): ProfileResult<ProfileSnapshot> {
  if (!record(value) || !("profile" in value) || typeof value.nativeProfileSemanticDigest !== "string") return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile snapshot shape is invalid");
  const validated = validateProfile(value.profile, options); if (!validated.ok) return validated;
  if (validated.value.nativeProfileSemanticDigest !== value.nativeProfileSemanticDigest) return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile snapshot digest mismatch");
  return validated;
}
function verifiedRegistry(value: unknown, options?: OperationOptions): ProfileResult<ReadonlyMap<string,ProfileSnapshot>> {
  if (!(value instanceof Map)) return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile registry must be a Map");
  const limits={...DEFAULT_PROFILE_BUDGETS,...safeOptions(options).budgets} as ProfileBudgets;if(value.size>limits.maxProfiles)return fail("PROFILE_BUDGET_EXCEEDED","profile registry budget exceeded");
  const clean = new Map<string,ProfileSnapshot>();
  for (const [key, raw] of value.entries()) {
    if(typeof key!=="string")return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile registry key is invalid");
    const verified=verifiedSnapshot(raw,options);if(!verified.ok)return verified;
    if(verified.value.profile.profileId!==key)return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile registry key/id mismatch");
    if(PRODUCT_IDS.has(key)){
      const official=validateProfile(BUILTIN_PROFILES[key as keyof typeof BUILTIN_PROFILES],options);if(!official.ok)return official;
      if(official.value.nativeProfileSemanticDigest!==verified.value.nativeProfileSemanticDigest)return fail("PROFILE_AMBIGUOUS","product-owned profile was shadowed or mutated");
    }
    clean.set(key,verified.value);
  }
  return {ok:true,value:clean};
}
function issue<T extends object>(result: ProfileResult<T>): ProfileResult<T> { if(result.ok)issuedComposedSnapshots.add(result.value);return result; }
function preflightChain(snapshot: ProfileSnapshot, registry: ReadonlyMap<string,ProfileSnapshot>, options?:OperationOptions): ProfileResult<true> {
  const safe=safeOptions(options);const limits={...DEFAULT_PROFILE_BUDGETS,...safe.budgets} as ProfileBudgets;const seen=new Set<string>();let cur:ProfileSnapshot|undefined=snapshot;let depth=0;let totalBindings=0;let totalVars=0;
  while(cur){if(safe.signal?.aborted)return fail("PROFILE_INHERITANCE_CANCELLED","operation cancelled");const id=cur.profile.profileId;if(seen.has(id))return fail("PROFILE_INHERITANCE_CYCLE","inheritance cycle detected");seen.add(id);if(depth>limits.maxDepth)return fail("PROFILE_INHERITANCE_DEPTH_EXCEEDED","inheritance depth exceeded");totalBindings+=(cur.profile.templateBindings??[]).length;totalVars+=variableCount(cur.profile);if(totalBindings>limits.maxTemplateBindings||totalVars>limits.maxVariableBindings)return fail("PROFILE_INHERITANCE_BUDGET_EXCEEDED","aggregate inheritance budget exceeded");const ref=cur.profile.parentProfile;if(!ref)break;const parent=registry.get(ref.profileId);if(!parent)return fail("PROFILE_PARENT_NOT_FOUND","parent profile not found");cur=parent;depth++;}
  return {ok:true,value:true};
}

export function createProfileRegistry(additional: readonly unknown[] = [], options?: OperationOptions): ProfileResult<ReadonlyMap<string,ProfileSnapshot>> {
  if(!Array.isArray(additional))return fail("PROFILE_SCHEMA_INVALID","additional profiles must be an array");const clean:ProjectProfile[]=[];for(const raw of additional){const validated=validateProfile(raw,options);if(!validated.ok)return validated;clean.push(validated.value.profile);}try{return createRegistryCore(clean,safeOptions(options));}catch{return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile registry creation failed safely");}
}
export function builtinRegistry(options?:OperationOptions):ProfileResult<ReadonlyMap<string,ProfileSnapshot>> { try{return builtinRegistryCore(safeOptions(options));}catch{return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","built-in registry creation failed safely");} }
export function composeProfile(snapshot: unknown, registry: unknown, options?: OperationOptions): ProfileResult<ComposedProfileSnapshot> {
  const safeSnapshot=verifiedSnapshot(snapshot,options);if(!safeSnapshot.ok)return safeSnapshot;const safeRegistry=verifiedRegistry(registry,options);if(!safeRegistry.ok)return safeRegistry;const chain=preflightChain(safeSnapshot.value,safeRegistry.value,options);if(!chain.ok)return chain;try{return issue(composeCore(safeSnapshot.value,safeRegistry.value,safeOptions(options)));}catch{return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile composition failed safely");}
}
export function selectProfile(request: unknown, registry: unknown, options?: OperationOptions): ProfileResult<SelectedProfileSnapshot> {
  if(!record(request)||!ownKeysOnly(request,REQUEST_KEYS)||!(request.mode==="DEFAULT_GENERIC"||request.mode==="EXPLICIT_PROFILE"))return fail("PROFILE_SCHEMA_INVALID","selection request shape is invalid");const safeRegistry=verifiedRegistry(registry,options);if(!safeRegistry.ok)return safeRegistry;const id=request.mode==="DEFAULT_GENERIC"?"generic":request.profileId;if(typeof id!=="string")return fail("PROFILE_ID_INVALID","explicit profile id is invalid");const initial=safeRegistry.value.get(id);if(initial){const chain=preflightChain(initial,safeRegistry.value,options);if(!chain.ok)return chain;}try{return issue(selectCore(request as unknown as SelectionRequest,safeRegistry.value,safeOptions(options)));}catch{return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile selection failed safely");}
}
export function projectProfileBindings(snapshot: unknown, bindingId: unknown): ProfileResult<readonly M07ProfileBindingCandidate[]> {
  if(!record(snapshot)||!issuedComposedSnapshots.has(snapshot)||typeof bindingId!=="string")return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","projection requires a profile snapshot issued by this public API");try{return projectCore(snapshot as unknown as ComposedProfileSnapshot,bindingId);}catch{return fail("PROFILE_INTERNAL_CONTRACT_VIOLATION","profile projection failed safely");}
}
