import type { AdoptionDependency, AdoptionSlice, CompatibilityBridgeContract, DriftClass, DriftResolution, EquivalenceState, LegacyCompatibilityMembrane, LegacyDebtRecord, NormalizationBudget, NormalizationFrontier, NormalizationState, NormalizationUsage, OperationOptions, Result, ReversibilityIndex, TruthPair } from './types.js';
import { cancelled, compareCodePoint, deepFreeze, DEFAULT_MAX_DEPTH, fail, safeLimit } from './utils.js';

export function reconcileBrownfieldTruth(input:{domain:string;observed:unknown;normative?:unknown;driftClass?:DriftClass;evidenceRefs?:readonly string[];legacyAcceptanceRef?:string}):TruthPair {
  let drift:DriftClass;
  if(input.legacyAcceptanceRef) drift='LEGACY_ACCEPTED';
  else if(input.normative===undefined) drift='INTENT_UNKNOWN';
  else if(input.driftClass) drift=input.driftClass;
  else drift=JSON.stringify(input.observed)===JSON.stringify(input.normative)?'DRIFT_NONE':'CONFLICTING_INTENT';
  return deepFreeze({domain:input.domain,observed:input.observed,...(input.normative===undefined?{}:{normative:input.normative}),driftClass:drift,evidenceRefs:[...(input.evidenceRefs??[])].sort(compareCodePoint),...(input.legacyAcceptanceRef?{legacyAcceptanceRef:input.legacyAcceptanceRef}:{})});
}

export function validateLegacyCompatibilityMembrane(m:LegacyCompatibilityMembrane):Result<Readonly<LegacyCompatibilityMembrane>> {
  if(!m.id||!m.legacySourceIdentity||!m.semanticClass||!m.sourceFingerprint||!m.owner)return fail('LEGACY_MAPPING_INVALID','Legacy Compatibility Membrane is incomplete',m.id);
  if(m.lossy&&!m.approvalRef)return fail('LOSSY_MAPPING_UNAPPROVED','Lossy legacy mapping requires explicit approval',m.id);
  return {ok:true,value:deepFreeze({...m})};
}

export function validateCompatibilityBridge(b:CompatibilityBridgeContract):Result<Readonly<CompatibilityBridgeContract>> {
  if(!b.id||!b.sourceIdentity||!b.targetSemanticClass||!b.mappingVersion||!b.invalidationFingerprint||!b.owner)return fail('COMPATIBILITY_BRIDGE_INVALID','Compatibility Bridge Contract is incomplete',b.id);
  if(b.lossy&&!b.approvalRef)return fail('LOSSY_MAPPING_UNAPPROVED','Lossy compatibility bridge requires explicit approval',b.id);
  return {ok:true,value:deepFreeze({...b})};
}

export function validateDriftResolution(action:DriftResolution,decisionRef?:string):Result<Readonly<{action:DriftResolution;decisionRef?:string}>> {
  const changesIntent=action==='ACCEPT_OBSERVED_AS_NORMATIVE'||action==='UPDATE_NORMATIVE_TO_APPROVED_INTENT'||action==='MIGRATE_IMPLEMENTATION_TO_NORMATIVE';
  if(changesIntent&&!decisionRef)return fail('DRIFT_RESOLUTION_DECISION_REQUIRED','This drift resolution requires explicit decision authority');
  return {ok:true,value:deepFreeze(decisionRef?{action,decisionRef}:{action})};
}

export function planAdoptionSlice(input:{targets:readonly string[];dependencies:readonly AdoptionDependency[];governedDomains:readonly string[];blockedDomains?:readonly string[];optionalCleanup?:readonly string[]},options:OperationOptions):Result<AdoptionSlice> {
  const c=cancelled(options);if(c)return c;
  const map=new Map(input.dependencies.map(d=>[d.domain,[...(d.dependsOn??[])].sort(compareCodePoint)]));
  const required=new Set<string>(),visiting=new Set<string>();
  const blocked=new Set(input.blockedDomains??[]);const governed=new Set(input.governedDomains);
  const walk=(domain:string,depth:number):Result<void>=>{
    if(options.cancellation?.isCancelled())return fail('CANCELLED','Operation cancelled');
    if(depth>safeLimit(options.maxDepth,DEFAULT_MAX_DEPTH))return fail('DEPTH_BUDGET_EXCEEDED','Adoption slice depth budget exceeded',domain);
    if(visiting.has(domain))return fail('ADOPTION_DEPENDENCY_CYCLE','Adoption dependency cycle detected',domain);
    if(required.has(domain)||governed.has(domain))return {ok:true,value:undefined};
    visiting.add(domain);required.add(domain);
    for(const dep of map.get(domain)??[]){const r=walk(dep,depth+1);if(!r.ok)return r;}
    visiting.delete(domain);return {ok:true,value:undefined};
  };
  for(const target of [...input.targets].sort(compareCodePoint)){const r=walk(target,0);if(!r.ok)return r;}
  const blockedRequired=[...required].filter(d=>blocked.has(d)).sort(compareCodePoint);
  return {ok:true,value:deepFreeze({targetDomains:[...input.targets].sort(compareCodePoint),requiredDomains:[...required].sort(compareCodePoint),blockedDomains:blockedRequired,optionalCleanup:[...(input.optionalCleanup??[])].sort(compareCodePoint)})};
}

export function createLegacyDebtRecord(record:LegacyDebtRecord):Result<Readonly<LegacyDebtRecord>> {
  if(!record.id||!record.domain||!record.sourceBinding||!record.reason)return fail('LEGACY_DEBT_INVALID','Legacy debt record is incomplete',record.id);
  return {ok:true,value:deepFreeze({...record,affectedCapabilities:[...record.affectedCapabilities].sort(compareCodePoint)})};
}

const NORMALIZATION_TRANSITIONS:Readonly<Record<NormalizationState,readonly NormalizationState[]>>={
  LEGACY_UNMAPPED:['LEGACY_MAPPED','BLOCKED'],LEGACY_MAPPED:['DUAL_BOUND','BLOCKED'],DUAL_BOUND:['GEF_CANONICAL_WITH_LEGACY_READ','GEF_CANONICAL','BLOCKED'],GEF_CANONICAL_WITH_LEGACY_READ:['GEF_CANONICAL','DUAL_BOUND','BLOCKED'],GEF_CANONICAL:['DUAL_BOUND','BLOCKED'],BLOCKED:['LEGACY_MAPPED','DUAL_BOUND']
};
export function validateNormalizationTransition(from:NormalizationState,to:NormalizationState):Result<Readonly<{from:NormalizationState;to:NormalizationState}>> {
  if(!(NORMALIZATION_TRANSITIONS[from]??[]).includes(to))return fail('NORMALIZATION_FRONTIER_INVALID',`Transition ${from} -> ${to} is not admitted`);
  return {ok:true,value:deepFreeze({from,to})};
}

export function buildNormalizationFrontier(projectId:string,domains:readonly {domain:string;state:NormalizationState}[]):Result<NormalizationFrontier> {
  const sorted=[...domains].sort((a,b)=>compareCodePoint(a.domain,b.domain));
  for(let i=1;i<sorted.length;i++)if(sorted[i]!.domain===sorted[i-1]!.domain)return fail('DUPLICATE_NORMALIZATION_DOMAIN','Duplicate normalization domain',sorted[i]!.domain);
  return {ok:true,value:deepFreeze({projectId,domains:sorted})};
}

export function probeSemanticEquivalence(left:Readonly<Record<string,unknown>>,right:Readonly<Record<string,unknown>>,fields:readonly string[],supported=true):EquivalenceState {
  if(!supported)return 'UNSUPPORTED_MAPPING';
  for(const field of fields)if(!Object.prototype.hasOwnProperty.call(left,field)||!Object.prototype.hasOwnProperty.call(right,field))return 'INDETERMINATE';
  return fields.every(field=>JSON.stringify(left[field])===JSON.stringify(right[field]))?'EQUIVALENT':'NON_EQUIVALENT';
}

export function enforceNormalizationBudget(usage:NormalizationUsage,budget:NormalizationBudget):Result<Readonly<NormalizationUsage>> {
  if(usage.domains>budget.maxDomains||usage.mappings>budget.maxMappings||usage.migrations>budget.maxMigrations||usage.dependencyExpansion>budget.maxDependencyExpansion)return fail('NORMALIZATION_BUDGET_EXCEEDED','Progressive normalization budget exceeded');
  return {ok:true,value:deepFreeze({...usage})};
}

export function classifyReversibility(mechanism:'DELETE_GENERATED'|'ALIAS_RESTORE'|'TRANSACTION_ROLLBACK'|'MIGRATION_ROLLBACK'|'UNKNOWN'):ReversibilityIndex {
  if(mechanism==='DELETE_GENERATED')return 'REVERSIBLE_BY_DELETE';
  if(mechanism==='ALIAS_RESTORE')return 'REVERSIBLE_BY_ALIAS_RESTORE';
  if(mechanism==='TRANSACTION_ROLLBACK')return 'REVERSIBLE_BY_TRANSACTION_ROLLBACK';
  if(mechanism==='MIGRATION_ROLLBACK')return 'REQUIRES_MIGRATION_ROLLBACK';
  return 'IRREVERSIBILITY_UNKNOWN';
}
