export const PROFILE_SCHEMA_VERSION = 1 as const;
export const PROFILE_CONTRACT_VERSION = "1" as const;
export const DEFAULT_PROFILE_BUDGETS = Object.freeze({ maxProfiles: 64, maxDepth: 16, maxTemplateBindings: 256, maxVariableBindings: 2048, maxStringBytes: 65536 });

export type ScalarType = "STRING" | "BOOLEAN" | "INTEGER" | "ENUM";
export type ScalarValue = string | boolean | number;
export type ProfileKind = "GENERIC" | "TYPESCRIPT_NODE" | "PYTHON" | "WEB_APP";
export type SelectionMode = "EXPLICIT_PROFILE" | "DEFAULT_GENERIC";

export interface ProfileVariableBinding { readonly variableId: string; readonly valueType: ScalarType; readonly value: ScalarValue; }
export interface ProfileTemplateBinding { readonly bindingId: string; readonly templateId: string; readonly templateVersion: string; readonly templateSemanticDigest?: string; readonly variableBindings?: readonly ProfileVariableBinding[]; }
export interface ParentProfileReference { readonly profileId: string; readonly profileVersion: string; readonly profileSemanticDigest: string; }
export interface TypeScriptNodeSemantics { readonly language: "TYPESCRIPT"; readonly runtimeFamily: "NODE"; readonly runtimeChannel: "SUPPORTED_LTS"; readonly moduleSemantics: "MODERN_ESM"; readonly typecheckMode: "STRICT"; readonly packageManagerPolicy: "EXPLICIT_OR_ADOPTION_OWNED"; readonly frameworkPolicy: "UNSPECIFIED"; readonly applicationShape: "UNSPECIFIED"; }
export interface PythonSemantics { readonly language: "PYTHON"; readonly runtimeFamily: "CPYTHON_COMPATIBLE"; readonly runtimeChannel: "SUPPORTED_STABLE"; readonly environmentPolicy: "EXPLICIT_OR_ADOPTION_OWNED"; readonly packageManagerPolicy: "EXPLICIT_OR_ADOPTION_OWNED"; readonly buildBackendPolicy: "EXPLICIT_OR_TEMPLATE_OWNED"; readonly frameworkPolicy: "UNSPECIFIED"; readonly applicationShape: "UNSPECIFIED"; }
export interface WebAppSemantics { readonly applicationFamily: "WEB_APP"; readonly renderingModel: "UNSPECIFIED" | "CLIENT" | "SERVER" | "HYBRID" | "STATIC"; readonly apiModel: "UNSPECIFIED" | "NONE" | "INTERNAL" | "EXTERNAL" | "MIXED"; readonly clientLanguageProfile?: string; readonly serverLanguageProfile?: string; readonly frameworkPolicy: "EXPLICIT_OR_TEMPLATE_OWNED"; readonly bundlerPolicy: "EXPLICIT_OR_TEMPLATE_OWNED"; readonly deploymentPolicy: "UNSPECIFIED"; }
export type ProfileSemantics = TypeScriptNodeSemantics | PythonSemantics | WebAppSemantics;

export interface ProjectProfile {
  readonly schemaVersion: number;
  readonly profileContractVersion: string;
  readonly profileId: string;
  readonly profileVersion: string;
  readonly profileKind: ProfileKind;
  readonly semantics?: ProfileSemantics;
  readonly displayMetadata?: Readonly<Record<string, unknown>>;
  readonly templateBindings?: readonly ProfileTemplateBinding[];
  readonly parentProfile?: ParentProfileReference;
  readonly extensions?: Readonly<Record<string, unknown>>;
}
export interface ProfileError { readonly code: string; readonly message: string; }
export type ProfileResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: ProfileError };
export interface ProfileBudgets { readonly maxProfiles: number; readonly maxDepth: number; readonly maxTemplateBindings: number; readonly maxVariableBindings: number; readonly maxStringBytes: number; }
export interface OperationOptions { readonly signal?: AbortSignal; readonly budgets?: Partial<ProfileBudgets>; }
export interface ProfileSnapshot { readonly profile: ProjectProfile; readonly nativeProfileSemanticDigest: string; }
export interface ComposedProfileSnapshot extends ProfileSnapshot { readonly composedProfileSemanticDigest: string; readonly effectiveTemplateBindings: readonly ProfileTemplateBinding[]; readonly parentChain: readonly ParentProfileReference[]; }
export interface SelectionRequest { readonly mode: SelectionMode; readonly profileId?: string; readonly expectedProfileVersion?: string; readonly expectedProfileDigest?: string; }
export interface SelectedProfileSnapshot extends ProfileSnapshot { readonly selectionMode: SelectionMode; readonly composedProfileSemanticDigest: string; readonly effectiveTemplateBindings: readonly ProfileTemplateBinding[]; readonly parentChain: readonly ParentProfileReference[]; }
export interface M07ProfileBindingCandidate { readonly variableId: string; readonly valueType: ScalarType; readonly value: ScalarValue; }

const PROFILE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const VARIABLE_ID = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const DIGEST = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const PRODUCT_IDS = new Set(["generic", "typescript-node", "python", "web-app"]);
const PROFILE_KEYS = new Set(["schemaVersion","profileContractVersion","profileId","profileVersion","profileKind","semantics","displayMetadata","templateBindings","parentProfile","extensions"]);
const BINDING_KEYS = new Set(["bindingId","templateId","templateVersion","templateSemanticDigest","variableBindings"]);
const VARIABLE_KEYS = new Set(["variableId","valueType","value"]);
const PARENT_KEYS = new Set(["profileId","profileVersion","profileSemanticDigest"]);

function fail<T>(code: string, message: string): ProfileResult<T> { return { ok: false, error: Object.freeze({ code, message }) }; }
function ok<T>(value: T): ProfileResult<T> { return { ok: true, value }; }
function plain(value: unknown): value is Record<string, unknown> { if (value === null || typeof value !== "object" || Array.isArray(value)) return false; const p = Object.getPrototypeOf(value); return p === Object.prototype || p === null; }
function keysExact(obj: Record<string, unknown>, allowed: ReadonlySet<string>): boolean { return Object.keys(obj).every((k) => allowed.has(k) && k !== "__proto__" && k !== "constructor" && k !== "prototype"); }
function bytes(value: string): number { return new TextEncoder().encode(value).byteLength; }
function budgets(options?: OperationOptions): ProfileBudgets { return { ...DEFAULT_PROFILE_BUDGETS, ...(options?.budgets ?? {}) }; }
function cancelled(options?: OperationOptions): boolean { return options?.signal?.aborted === true; }
function validId(value: unknown): value is string { return typeof value === "string" && value.length <= 64 && PROFILE_ID.test(value); }
function validSemver(value: unknown): value is string { return typeof value === "string" && value.length <= 128 && SEMVER.test(value); }
function validDigest(value: unknown): value is string { return typeof value === "string" && DIGEST.test(value); }
function deepFreeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v); } return value; }

function canonical(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") { if (!Number.isSafeInteger(value)) throw new Error("non-canonical number"); return Object.is(value, -0) ? "0" : String(value); }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (!plain(value)) throw new Error("non-canonical object");
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
}
function digestText(text: string): string { let h = 0xcbf29ce484222325n; const prime = 0x100000001b3n; for (const b of new TextEncoder().encode(text)) { h ^= BigInt(b); h = BigInt.asUintN(64, h * prime); } return `fnv1a64-v1:${h.toString(16).padStart(16,"0")}`; }

function semanticShape(profile: ProjectProfile): Record<string, unknown> {
  const bindings = [...(profile.templateBindings ?? [])].map((b) => ({ bindingId:b.bindingId, templateId:b.templateId, templateVersion:b.templateVersion, ...(b.templateSemanticDigest === undefined ? {} : {templateSemanticDigest:b.templateSemanticDigest}), variableBindings:[...(b.variableBindings ?? [])].map((v)=>({variableId:v.variableId,valueType:v.valueType,value:v.value})).sort((a,b)=>a.variableId.localeCompare(b.variableId)) })).sort((a,b)=>a.bindingId.localeCompare(b.bindingId));
  return { schemaVersion:profile.schemaVersion, profileContractVersion:profile.profileContractVersion, profileId:profile.profileId, profileVersion:profile.profileVersion, profileKind:profile.profileKind, ...(profile.semantics === undefined ? {} : {semantics:profile.semantics}), templateBindings:bindings, ...(profile.parentProfile === undefined ? {} : {parentProfile:profile.parentProfile}) };
}
export function profileSemanticDigest(profile: ProjectProfile): string { return digestText(canonical(semanticShape(profile))); }

function validateScalar(type: unknown, value: unknown, limit: number): boolean {
  if (type === "STRING" || type === "ENUM") return typeof value === "string" && !value.includes("\0") && bytes(value) <= limit;
  if (type === "BOOLEAN") return typeof value === "boolean";
  if (type === "INTEGER") return typeof value === "number" && Number.isSafeInteger(value);
  return false;
}
function validateTemplateBinding(input: unknown, b: ProfileBudgets): ProfileResult<ProfileTemplateBinding> {
  if (!plain(input) || !keysExact(input,BINDING_KEYS)) return fail("PROFILE_TEMPLATE_BINDING_INVALID","template binding shape is invalid");
  if (!validId(input.bindingId) || !validId(input.templateId) || !validSemver(input.templateVersion)) return fail("PROFILE_TEMPLATE_BINDING_INVALID","template binding identity is invalid");
  if (input.templateSemanticDigest !== undefined && !validDigest(input.templateSemanticDigest)) return fail("PROFILE_TEMPLATE_BINDING_INVALID","template digest is invalid");
  if (input.variableBindings !== undefined && !Array.isArray(input.variableBindings)) return fail("PROFILE_VARIABLE_BINDING_INVALID","variable bindings must be an array");
  const vars: ProfileVariableBinding[] = [];
  const seen = new Set<string>();
  for (const raw of (input.variableBindings ?? []) as unknown[]) {
    if (vars.length >= b.maxVariableBindings) return fail("PROFILE_BUDGET_EXCEEDED","variable binding budget exceeded");
    if (!plain(raw) || !keysExact(raw,VARIABLE_KEYS) || typeof raw.variableId !== "string" || !VARIABLE_ID.test(raw.variableId) || raw.variableId.length > 128) return fail("PROFILE_VARIABLE_BINDING_INVALID","variable binding identity is invalid");
    if (seen.has(raw.variableId)) return fail("PROFILE_VARIABLE_BINDING_INVALID","duplicate variable binding");
    seen.add(raw.variableId);
    if (!validateScalar(raw.valueType, raw.value, b.maxStringBytes)) return fail("PROFILE_VARIABLE_TYPE_MISMATCH","variable binding type/value is invalid");
    vars.push({ variableId:raw.variableId, valueType:raw.valueType as ScalarType, value:raw.value as ScalarValue });
  }
  return ok(deepFreeze({ bindingId:input.bindingId, templateId:input.templateId, templateVersion:input.templateVersion, ...(input.templateSemanticDigest === undefined ? {} : {templateSemanticDigest:input.templateSemanticDigest}), ...(vars.length===0?{}:{variableBindings:vars}) }));
}
function validateSemantics(kind: ProfileKind, value: unknown): boolean {
  if (kind === "GENERIC") return value === undefined;
  if (!plain(value)) return false;
  if (kind === "TYPESCRIPT_NODE") return canonical(value) === canonical(TYPESCRIPT_NODE_SEMANTICS);
  if (kind === "PYTHON") return canonical(value) === canonical(PYTHON_SEMANTICS);
  if (kind === "WEB_APP") {
    const allowed = new Set(["applicationFamily","renderingModel","apiModel","clientLanguageProfile","serverLanguageProfile","frameworkPolicy","bundlerPolicy","deploymentPolicy"]);
    if (!keysExact(value,allowed) || value.applicationFamily !== "WEB_APP" || !["UNSPECIFIED","CLIENT","SERVER","HYBRID","STATIC"].includes(String(value.renderingModel)) || !["UNSPECIFIED","NONE","INTERNAL","EXTERNAL","MIXED"].includes(String(value.apiModel)) || value.frameworkPolicy !== "EXPLICIT_OR_TEMPLATE_OWNED" || value.bundlerPolicy !== "EXPLICIT_OR_TEMPLATE_OWNED" || value.deploymentPolicy !== "UNSPECIFIED") return false;
    for (const k of ["clientLanguageProfile","serverLanguageProfile"] as const) if (value[k] !== undefined && !validId(value[k])) return false;
    return true;
  }
  return false;
}
export function validateProfile(input: unknown, options?: OperationOptions): ProfileResult<ProfileSnapshot> {
  if (cancelled(options)) return fail("PROFILE_CANCELLED","operation cancelled");
  const b = budgets(options);
  if (!plain(input) || !keysExact(input,PROFILE_KEYS)) return fail("PROFILE_SCHEMA_INVALID","profile shape contains invalid or unknown core fields");
  if (input.schemaVersion !== PROFILE_SCHEMA_VERSION || input.profileContractVersion !== PROFILE_CONTRACT_VERSION) return fail("PROFILE_CONTRACT_UNSUPPORTED","profile schema or contract version is unsupported");
  if (!validId(input.profileId) || !validSemver(input.profileVersion) || !["GENERIC","TYPESCRIPT_NODE","PYTHON","WEB_APP"].includes(String(input.profileKind))) return fail("PROFILE_ID_INVALID","profile identity/version/kind is invalid");
  const kind = input.profileKind as ProfileKind;
  if (!validateSemantics(kind,input.semantics)) return fail("PROFILE_KIND_UNSUPPORTED","profile specialized semantics are invalid");
  if (input.templateBindings !== undefined && !Array.isArray(input.templateBindings)) return fail("PROFILE_SCHEMA_INVALID","templateBindings must be an array");
  const tbs: ProfileTemplateBinding[] = []; const bindingIds = new Set<string>();
  for (const raw of (input.templateBindings ?? []) as unknown[]) { if (cancelled(options)) return fail("PROFILE_CANCELLED","operation cancelled"); if (tbs.length >= b.maxTemplateBindings) return fail("PROFILE_BUDGET_EXCEEDED","template binding budget exceeded"); const r=validateTemplateBinding(raw,b); if(!r.ok)return r; if(bindingIds.has(r.value.bindingId)) return fail("PROFILE_DUPLICATE_BINDING","duplicate template binding id"); bindingIds.add(r.value.bindingId); tbs.push(r.value); }
  let parent: ParentProfileReference | undefined;
  if (input.parentProfile !== undefined) { if(!plain(input.parentProfile)||!keysExact(input.parentProfile,PARENT_KEYS)||!validId(input.parentProfile.profileId)||!validSemver(input.parentProfile.profileVersion)||!validDigest(input.parentProfile.profileSemanticDigest)) return fail("PROFILE_PARENT_REFERENCE_INVALID","parent reference is invalid"); parent={profileId:input.parentProfile.profileId,profileVersion:input.parentProfile.profileVersion,profileSemanticDigest:input.parentProfile.profileSemanticDigest}; }
  const profile: ProjectProfile = { schemaVersion:1, profileContractVersion:"1", profileId:input.profileId, profileVersion:input.profileVersion, profileKind:kind, ...(input.semantics===undefined?{}:{semantics:input.semantics as ProfileSemantics}), ...(input.displayMetadata===undefined?{}:{displayMetadata:input.displayMetadata as Readonly<Record<string,unknown>>}), ...(tbs.length===0?{}:{templateBindings:tbs}), ...(parent===undefined?{}:{parentProfile:parent}), ...(input.extensions===undefined?{}:{extensions:input.extensions as Readonly<Record<string,unknown>>}) };
  try { const frozen=deepFreeze(profile); return ok(deepFreeze({profile:frozen,nativeProfileSemanticDigest:profileSemanticDigest(frozen)})); } catch { return fail("PROFILE_SCHEMA_INVALID","profile contains non-canonical semantic data"); }
}

export const TYPESCRIPT_NODE_SEMANTICS: TypeScriptNodeSemantics = deepFreeze({language:"TYPESCRIPT",runtimeFamily:"NODE",runtimeChannel:"SUPPORTED_LTS",moduleSemantics:"MODERN_ESM",typecheckMode:"STRICT",packageManagerPolicy:"EXPLICIT_OR_ADOPTION_OWNED",frameworkPolicy:"UNSPECIFIED",applicationShape:"UNSPECIFIED"});
export const PYTHON_SEMANTICS: PythonSemantics = deepFreeze({language:"PYTHON",runtimeFamily:"CPYTHON_COMPATIBLE",runtimeChannel:"SUPPORTED_STABLE",environmentPolicy:"EXPLICIT_OR_ADOPTION_OWNED",packageManagerPolicy:"EXPLICIT_OR_ADOPTION_OWNED",buildBackendPolicy:"EXPLICIT_OR_TEMPLATE_OWNED",frameworkPolicy:"UNSPECIFIED",applicationShape:"UNSPECIFIED"});
export const WEB_APP_SEMANTICS: WebAppSemantics = deepFreeze({applicationFamily:"WEB_APP",renderingModel:"UNSPECIFIED",apiModel:"UNSPECIFIED",frameworkPolicy:"EXPLICIT_OR_TEMPLATE_OWNED",bundlerPolicy:"EXPLICIT_OR_TEMPLATE_OWNED",deploymentPolicy:"UNSPECIFIED"});

function builtin(profileId:string, profileKind:ProfileKind, semantics?:ProfileSemantics): ProjectProfile { return deepFreeze({schemaVersion:1,profileContractVersion:"1",profileId,profileVersion:"1.0.0",profileKind,...(semantics===undefined?{}:{semantics})}); }
export const BUILTIN_PROFILES = deepFreeze({ generic:builtin("generic","GENERIC"), "typescript-node":builtin("typescript-node","TYPESCRIPT_NODE",TYPESCRIPT_NODE_SEMANTICS), python:builtin("python","PYTHON",PYTHON_SEMANTICS), "web-app":builtin("web-app","WEB_APP",WEB_APP_SEMANTICS) } as const);

export function createProfileRegistry(additional: readonly ProjectProfile[] = [], options?: OperationOptions): ProfileResult<ReadonlyMap<string, ProfileSnapshot>> {
  const b=budgets(options); if(additional.length+4>b.maxProfiles)return fail("PROFILE_BUDGET_EXCEEDED","profile count budget exceeded"); const map=new Map<string,ProfileSnapshot>();
  for(const p of Object.values(BUILTIN_PROFILES)){const r=validateProfile(p,options);if(!r.ok)return r;map.set(p.profileId,r.value);}
  for(const p of additional){if(PRODUCT_IDS.has(p.profileId))return fail("PROFILE_AMBIGUOUS","product-owned profile cannot be shadowed");if(map.has(p.profileId))return fail("PROFILE_AMBIGUOUS","duplicate profile identity");const r=validateProfile(p,options);if(!r.ok)return r;map.set(p.profileId,r.value);}
  return ok(map);
}

function bindingSemantic(binding:ProfileTemplateBinding):string{return canonical({bindingId:binding.bindingId,templateId:binding.templateId,templateVersion:binding.templateVersion,...(binding.templateSemanticDigest===undefined?{}:{templateSemanticDigest:binding.templateSemanticDigest}),variableBindings:[...(binding.variableBindings??[])].map(v=>({variableId:v.variableId,valueType:v.valueType,value:v.value})).sort((a,b)=>a.variableId.localeCompare(b.variableId))});}
function sameTemplate(a:ProfileTemplateBinding,b:ProfileTemplateBinding):boolean{return a.templateId===b.templateId&&a.templateVersion===b.templateVersion&&(a.templateSemanticDigest??"")===(b.templateSemanticDigest??"");}

export function composeProfile(snapshot: ProfileSnapshot, registry: ReadonlyMap<string,ProfileSnapshot>, options?: OperationOptions): ProfileResult<ComposedProfileSnapshot> {
  const b=budgets(options); const visiting=new Set<string>();
  const visit=(cur:ProfileSnapshot,depth:number):ProfileResult<ComposedProfileSnapshot>=>{ if(cancelled(options))return fail("PROFILE_INHERITANCE_CANCELLED","operation cancelled"); if(depth>b.maxDepth)return fail("PROFILE_INHERITANCE_DEPTH_EXCEEDED","inheritance depth exceeded"); const key=`${cur.profile.profileId}@${cur.nativeProfileSemanticDigest}`; if(visiting.has(key))return fail("PROFILE_INHERITANCE_CYCLE","inheritance cycle detected"); visiting.add(key);
    let inherited:ProfileTemplateBinding[]=[]; let chain:ParentProfileReference[]=[]; let parentComposedDigest=""; const ref=cur.profile.parentProfile;
    if(ref){const parent=registry.get(ref.profileId);if(!parent)return fail("PROFILE_PARENT_NOT_FOUND","parent profile not found");if(parent.profile.profileVersion!==ref.profileVersion||parent.nativeProfileSemanticDigest!==ref.profileSemanticDigest)return fail("PROFILE_PARENT_EXPECTATION_MISMATCH","parent profile expectation mismatch");const pr=visit(parent,depth+1);if(!pr.ok)return pr;inherited=[...pr.value.effectiveTemplateBindings];chain=[...pr.value.parentChain,ref];parentComposedDigest=pr.value.composedProfileSemanticDigest;}
    const byId=new Map(inherited.map(x=>[x.bindingId,x])); for(const child of cur.profile.templateBindings??[]){const sameId=byId.get(child.bindingId);if(sameId){if(bindingSemantic(sameId)!==bindingSemantic(child))return fail("PROFILE_INHERITANCE_BINDING_CONFLICT","binding id conflict");continue;} const alias=[...byId.values()].find(x=>sameTemplate(x,child));if(alias){if(bindingSemantic({...alias,bindingId:child.bindingId})!==bindingSemantic(child))return fail("PROFILE_INHERITANCE_BINDING_CONFLICT","same-template binding conflict");continue;}byId.set(child.bindingId,child);}
    const effective=[...byId.values()].sort((a,b)=>a.bindingId.localeCompare(b.bindingId));if(effective.length>b.maxTemplateBindings)return fail("PROFILE_INHERITANCE_BUDGET_EXCEEDED","aggregate template binding budget exceeded"); const composed=digestText(canonical({native:cur.nativeProfileSemanticDigest,parent:ref?{id:ref.profileId,version:ref.profileVersion,digest:ref.profileSemanticDigest,composed:parentComposedDigest}:null,bindings:effective.map(bindingSemantic)})); visiting.delete(key); return ok(deepFreeze({profile:cur.profile,nativeProfileSemanticDigest:cur.nativeProfileSemanticDigest,composedProfileSemanticDigest:composed,effectiveTemplateBindings:effective,parentChain:chain}));};
  return visit(snapshot,0);
}

export function selectProfile(request: SelectionRequest, registry: ReadonlyMap<string,ProfileSnapshot>, options?: OperationOptions): ProfileResult<SelectedProfileSnapshot> {
  if(cancelled(options))return fail("PROFILE_CANCELLED","operation cancelled"); let id:string; if(request.mode==="DEFAULT_GENERIC"){if(request.profileId!==undefined)return fail("PROFILE_SCHEMA_INVALID","default generic request cannot carry profileId");id="generic";}else if(request.mode==="EXPLICIT_PROFILE"){if(!validId(request.profileId))return fail("PROFILE_ID_INVALID","explicit profile id is invalid");id=request.profileId;}else return fail("PROFILE_SCHEMA_INVALID","selection mode is invalid"); const snap=registry.get(id);if(!snap)return fail("PROFILE_NOT_FOUND","requested profile not found");if(request.expectedProfileVersion!==undefined&&request.expectedProfileVersion!==snap.profile.profileVersion)return fail("PROFILE_EXPECTATION_MISMATCH","profile version expectation mismatch");if(request.expectedProfileDigest!==undefined&&request.expectedProfileDigest!==snap.nativeProfileSemanticDigest)return fail("PROFILE_EXPECTATION_MISMATCH","profile digest expectation mismatch");const cr=composeProfile(snap,registry,options);if(!cr.ok)return cr;return ok(deepFreeze({...cr.value,selectionMode:request.mode}));
}

export function projectProfileBindings(snapshot: ComposedProfileSnapshot | SelectedProfileSnapshot, bindingId: string): ProfileResult<readonly M07ProfileBindingCandidate[]> { const b=snapshot.effectiveTemplateBindings.find(x=>x.bindingId===bindingId);if(!b)return fail("PROFILE_TEMPLATE_BINDING_INVALID","binding id not present in composed profile");return ok(deepFreeze([...(b.variableBindings??[])].map(v=>({variableId:v.variableId,valueType:v.valueType,value:v.value})))); }

export function builtinRegistry(options?:OperationOptions):ProfileResult<ReadonlyMap<string,ProfileSnapshot>> { return createProfileRegistry([],options); }
