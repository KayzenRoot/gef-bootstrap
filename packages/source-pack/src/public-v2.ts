import {
  buildSourcePack as buildCore,
  evaluateApplicability as evaluateCoreApplicability,
  evaluateRequirements as evaluateCoreRequirements,
  resolveExactTemplate,
  computeDriftShockwave,
  evaluateIntegrity
} from './public.js';
import type {
  ApplicabilityState, AuthorityDomain, AuthorityResolutionProof, ConditionWitness,
  OperationOptions, Predicate, RequirementResolution, RequirementRule, Result,
  SourceEntryInput, SourcePackSnapshot
} from './public.js';

export type * from './public.js';
export { resolveExactTemplate, computeDriftShockwave, evaluateIntegrity };

export interface GovernedSourceEntryInput extends SourceEntryInput {
  aliasAdmission?: Readonly<{ admitted: true; decisionId: string; targetClass: string }>;
  bindingValid?: boolean;
}

export interface IntegritySpineNode { id: string; digest: string; dependencies: readonly string[]; }
export interface HardenedSourcePackSnapshot extends SourcePackSnapshot { integritySpine: readonly IntegritySpineNode[]; }
export type GovernedFact = unknown | Readonly<{ conflict: true; values?: readonly unknown[] }>;

function canonical(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const obj = value as Record<string, unknown>;
  return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k) + ':' + canonical(obj[k])).join(',') + '}';
}
function sha(options: OperationOptions, value: unknown): Result<string> {
  try {
    if (options.digest?.algorithm !== 'sha256' || typeof options.digest.digest !== 'function') return { ok:false, diagnostics:[{code:'DIGEST_CAPABILITY_INVALID',message:'Injected SHA-256 digest capability is required'}] };
    const out = options.digest.digest(canonical(value));
    if (!/^[a-fA-F0-9]{64}$/.test(out)) return { ok:false, diagnostics:[{code:'DIGEST_RESULT_INVALID',message:'Digest capability must return 64 hex characters'}] };
    return { ok:true, value:`sha256:${out.toLowerCase()}` };
  } catch { return { ok:false, diagnostics:[{code:'DIGEST_CAPABILITY_FAILURE',message:'Digest capability failed'}] }; }
}
function freeze<T>(value:T):T { if (value && typeof value === 'object') { Object.freeze(value); for (const v of Object.values(value as Record<string,unknown>)) freeze(v); } return value; }
function isConflict(value: unknown): value is Readonly<{ conflict:true; values?:readonly unknown[] }> {
  return !!value && typeof value === 'object' && (value as {conflict?:unknown}).conflict === true;
}

export function evaluateApplicability(predicate: Predicate, facts: Readonly<Record<string, GovernedFact>>): ConditionWitness {
  const referenced = new Set<string>();
  const collect = (p: Predicate): void => { if (p.op === 'FACT_EQ') referenced.add(p.fact); else if (p.op === 'NOT') collect(p.item); else p.items.forEach(collect); };
  collect(predicate);
  const conflictFacts = [...referenced].filter(key => isConflict(facts[key])).sort();
  if (conflictFacts.length) return freeze({ state:'CONTRADICTORY', facts: conflictFacts.map(key => ({key,value:facts[key]})) });
  return evaluateCoreApplicability(predicate, facts);
}

export function evaluateRequirements(rules: readonly RequirementRule[], entries: readonly GovernedSourceEntryInput[]): readonly RequirementResolution[] {
  const base = evaluateCoreRequirements(rules, entries);
  return freeze(base.map(r => {
    if (r.state === 'RESOLVED_ACTIVE' && r.entryIds.some(id => entries.find(e => e.id === id)?.bindingValid === false)) return { ...r, state:'INVALID_BINDING' as const };
    return r;
  }));
}

export function resolveAuthority(entries: readonly GovernedSourceEntryInput[], semanticKey: string, domain: AuthorityDomain): Result<AuthorityResolutionProof> {
  const candidates = entries.filter(e => e.semanticKey === semanticKey && e.domain === domain).sort((a,b)=>a.id.localeCompare(b.id));
  const considered: {id:string;excluded?:string}[] = [];
  const active: GovernedSourceEntryInput[] = [];
  for (const e of candidates) {
    let excluded: string | undefined;
    if (e.kind === 'DORMANT') excluded = 'DORMANT_NON_AUTHORITY';
    else if (e.kind === 'ALIAS' && e.aliasAdmission?.admitted !== true) excluded = 'ALIAS_NOT_ADMITTED';
    else if (e.bindingValid === false) excluded = 'INVALID_BINDING';
    else if (e.lifecycle === 'SUPERSEDED') excluded = 'SUPERSEDED';
    else if (e.applicability && e.applicability !== 'ACTIVE') excluded = `APPLICABILITY_${e.applicability}`;
    else if (e.canonicality === 'DERIVED') excluded = 'DERIVED_NON_CANONICAL';
    considered.push(excluded ? {id:e.id,excluded}:{id:e.id});
    if (!excluded) active.push(e);
  }
  if (!active.length) return {ok:false,diagnostics:[{code:'AUTHORITY_NOT_FOUND',message:'No active authority candidate',subject:semanticKey}]};
  const superseded = new Set(active.flatMap(e=>[...(e.supersedes??[])]));
  const finalists = active.filter(e=>!superseded.has(e.id));
  if (finalists.length !== 1) return {ok:false,diagnostics:[{code:'AUTHORITY_CONFLICT',message:'Authority resolution is ambiguous or conflicting',subject:semanticKey}]};
  return {ok:true,value:freeze({semanticKey,domain,considered,selected:finalists[0]!.id,governingRules:['D-0021','D-0055']})};
}

export class AuthorityNeighborhoodCache {
  #map = new Map<string, Readonly<AuthorityResolutionProof>>();
  get(key:string): Readonly<AuthorityResolutionProof> | undefined { return this.#map.get(key); }
  set(key:string, value:AuthorityResolutionProof): void { this.#map.set(key, freeze(structuredClone(value))); }
  invalidate(keys:readonly string[]): void { for (const key of keys) this.#map.delete(key); }
  clear(): void { this.#map.clear(); }
  get size():number { return this.#map.size; }
}

export function buildSourcePack(input: { projectId:string; entries:readonly GovernedSourceEntryInput[]; requirements?:readonly RequirementRule[]; constitutionEntryIds?:readonly string[] }, options:OperationOptions): Result<HardenedSourcePackSnapshot> {
  for (const entry of input.entries) {
    if (entry.kind === 'ALIAS' && entry.aliasAdmission?.admitted !== true) return {ok:false,diagnostics:[{code:'ALIAS_NOT_ADMITTED',message:'Alias requires explicit prior M13 admission',subject:entry.id}]};
    if (entry.kind === 'DORMANT' && entry.applicability === 'ACTIVE') return {ok:false,diagnostics:[{code:'DORMANT_ACTIVE_AUTHORITY_FORBIDDEN',message:'Dormant source pointers cannot be active authority',subject:entry.id}]};
  }
  const core = buildCore({projectId:input.projectId,entries:input.entries,requirements:[],constitutionEntryIds:input.constitutionEntryIds},options);
  if (!core.ok) return core;
  const requirementResolutions = evaluateRequirements(input.requirements??[],input.entries);
  const spine: IntegritySpineNode[] = [];
  for (const entry of [...input.entries].sort((a,b)=>a.id.localeCompare(b.id))) {
    const d = sha(options,{id:entry.id,fingerprint:entry.fingerprint,dependencies:[...(entry.dependencies??[])].sort()}); if (!d.ok) return d;
    spine.push({id:entry.id,digest:d.value,dependencies:[...(entry.dependencies??[])].sort()});
  }
  const semantic = sha(options,{coreSemanticIdentity:core.value.semanticIdentity,requirementResolutions,integritySpine:spine}); if(!semantic.ok)return semantic;
  const epoch = sha(options,{semanticIdentity:semantic.value,constitutionFingerprint:core.value.constitutionFingerprint}); if(!epoch.ok)return epoch;
  const unresolved = requirementResolutions.filter(r=>!['RESOLVED_ACTIVE','RESOLVED_NOT_APPLICABLE'].includes(r.state)).map(r=>`${r.classId}:${r.state}`).sort();
  return {ok:true,value:freeze({...core.value,requirementResolutions,semanticIdentity:semantic.value,integrityEpoch:epoch.value,integritySpine:spine,receiptSeed:{projectId:input.projectId,semanticIdentity:semantic.value,unresolved}})};
}
