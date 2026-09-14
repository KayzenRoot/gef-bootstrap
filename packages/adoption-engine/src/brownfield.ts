import type { AdoptionDependency, AdoptionSlice, CompatibilityBridgeContract, DriftClass, DriftResolution, EquivalenceState, GovernanceMaturity, LegacyCompatibilityMembrane, LegacyDebtQuarantine, LegacyDebtRecord, NormalizationBudget, NormalizationFrontier, NormalizationState, NormalizationUsage, OperationOptions, ProgressiveGovernanceEnvelope, Result, ReversibilityIndex, TruthPair } from './types.js';
import { cancelled, canonical, compareCodePoint, deepFreeze, DEFAULT_MAX_DEPTH, DEFAULT_MAX_EDGES, DEFAULT_MAX_NODES, fail, safeLimit, sha, validId } from './utils.js';

const DRIFT_CLASSES=new Set<DriftClass>(['DRIFT_NONE','DOCUMENTATION_DRIFT','IMPLEMENTATION_DRIFT','TEST_DRIFT','GOVERNANCE_DRIFT','ARCHITECTURAL_DRIFT','INTENT_UNKNOWN','CONFLICTING_INTENT','LEGACY_ACCEPTED']);
const NORMALIZATION_STATES=new Set<NormalizationState>(['LEGACY_UNMAPPED','LEGACY_MAPPED','DUAL_BOUND','GEF_CANONICAL_WITH_LEGACY_READ','GEF_CANONICAL','BLOCKED']);

export function reconcileBrownfieldTruth(input:{domain:string;observedTruth:unknown;normativeTruth?:unknown;bindingEvidence:readonly string[];driftClass?:DriftClass;confidence?:number;resolutionState?:'ALIGNED'|'UNRESOLVED'|'LEGACY_ACCEPTED'|'BLOCKED'|'RESOLUTION_ADMITTED';resolutionRef?:string;legacyAcceptanceRef?:string}):Result<TruthPair> {
  if(!input.domain)return fail('BROWNFIELD_DOMAIN_MISSING','Brownfield truth domain is required');
  if(input.bindingEvidence.length===0)return fail('BROWNFIELD_EVIDENCE_MISSING','Brownfield truth requires explicit binding evidence',input.domain);
  if(input.confidence!==undefined&&(!Number.isFinite(input.confidence)||input.confidence<0||input.confidence>1))return fail('BROWNFIELD_CONFIDENCE_INVALID','Descriptive confidence must be between 0 and 1',input.domain);
  let drift:DriftClass;
  if(input.legacyAcceptanceRef) drift='LEGACY_ACCEPTED';
  else if(input.normativeTruth===undefined) drift='INTENT_UNKNOWN';
  else {
    let equivalent=false;
    try{equivalent=canonical(input.observedTruth)===canonical(input.normativeTruth);}catch{return fail('BROWNFIELD_VALUE_UNSUPPORTED','Observed or normative truth cannot be canonically compared',input.domain);}
    if(equivalent) drift='DRIFT_NONE';
    else if(!input.driftClass)return fail('BROWNFIELD_DRIFT_CLASS_REQUIRED','Non-equivalent observed and normative truth requires an explicit drift class',input.domain);
    else drift=input.driftClass;
  }
  if(!DRIFT_CLASSES.has(drift))return fail('DRIFT_CLASS_UNSUPPORTED','Unsupported drift class',input.domain);
  const resolutionState=input.resolutionState??(drift==='DRIFT_NONE'?'ALIGNED':drift==='LEGACY_ACCEPTED'?'LEGACY_ACCEPTED':'UNRESOLVED');
  if(!['ALIGNED','UNRESOLVED','LEGACY_ACCEPTED','BLOCKED','RESOLUTION_ADMITTED'].includes(resolutionState))return fail('TRUTH_RESOLUTION_STATE_UNSUPPORTED','Unsupported TruthPair resolution state',input.domain);
  if(resolutionState==='RESOLUTION_ADMITTED'&&!input.resolutionRef)return fail('TRUTH_RESOLUTION_REF_REQUIRED','Admitted truth resolution requires an explicit reference',input.domain);
  if(resolutionState==='ALIGNED'&&drift!=='DRIFT_NONE')return fail('TRUTH_RESOLUTION_CONFLICT','Only DRIFT_NONE may be marked ALIGNED',input.domain);
  const bindingEvidence=[...input.bindingEvidence].sort(compareCodePoint);
  return {ok:true,value:deepFreeze({domain:input.domain,observedTruth:input.observedTruth,...(input.normativeTruth===undefined?{}:{normativeTruth:input.normativeTruth}),bindingEvidence,driftClass:drift,...(input.confidence===undefined?{}:{confidence:input.confidence}),resolutionState,...(input.resolutionRef?{resolutionRef:input.resolutionRef}:{}),...(input.legacyAcceptanceRef?{legacyAcceptanceRef:input.legacyAcceptanceRef}:{})})};
}

export function validateLegacyCompatibilityMembrane(m:LegacyCompatibilityMembrane):Result<Readonly<LegacyCompatibilityMembrane>> {
  if(!m.id||!m.legacySourceIdentity||!m.semanticClass||!m.sourceFingerprint||!m.owner)return fail('LEGACY_MAPPING_INVALID','Legacy Compatibility Membrane is incomplete',m.id);
  if(!['ALIAS','PROJECTION','ADAPTER','LEGACY_ACCEPTANCE'].includes(m.mappingType))return fail('LEGACY_MAPPING_TYPE_UNSUPPORTED','Unsupported legacy mapping type',m.id);
  if(m.lossy&&!m.approvalRef)return fail('LOSSY_MAPPING_UNAPPROVED','Lossy legacy mapping requires explicit approval',m.id);
  if(m.mappingType==='ALIAS'&&!m.admissionRef)return fail('LEGACY_ALIAS_ADMISSION_REQUIRED','Legacy aliases require an explicit admission reference',m.id);
  if(m.mutationPermission!==undefined&&m.mutationPermission!=='NONE')return fail('LEGACY_MAPPING_MUTATION_FORBIDDEN','M13 legacy membranes cannot grant mutation authority',m.id);
  return {ok:true,value:deepFreeze({...m,mutationPermission:'NONE'})};
}

export function validateCompatibilityBridge(b:CompatibilityBridgeContract):Result<Readonly<CompatibilityBridgeContract>> {
  if(!b.id||!b.sourceIdentity||!b.targetSemanticClass||!b.mappingVersion||!b.invalidationFingerprint||!b.owner||!b.reviewTrigger)return fail('COMPATIBILITY_BRIDGE_INVALID','Compatibility Bridge Contract is incomplete',b.id);
  if(!['READ_ONLY','BIDIRECTIONAL_PLANNED','MIGRATION_ONLY'].includes(b.direction))return fail('BRIDGE_DIRECTION_UNSUPPORTED','Unsupported compatibility bridge direction',b.id);
  if(b.lossy&&!b.approvalRef)return fail('LOSSY_MAPPING_UNAPPROVED','Lossy compatibility bridge requires explicit approval',b.id);
  return {ok:true,value:deepFreeze({...b})};
}

export function validateLegacyBindingFreshness(input:{kind:'MEMBRANE'|'BRIDGE';id:string;expectedFingerprint:string;currentFingerprint:string}):Result<Readonly<typeof input>> {
  if(!input.id||!input.expectedFingerprint||!input.currentFingerprint)return fail('LEGACY_BINDING_FINGERPRINT_MISSING','Legacy binding freshness requires explicit identity and fingerprints',input.id);
  if(input.kind!=='MEMBRANE'&&input.kind!=='BRIDGE')return fail('LEGACY_BINDING_KIND_UNSUPPORTED','Unsupported legacy binding kind',input.id);
  if(input.expectedFingerprint!==input.currentFingerprint)return fail(input.kind==='MEMBRANE'?'LEGACY_ALIAS_STALE':'COMPATIBILITY_BRIDGE_STALE','Legacy binding fingerprint is stale',input.id);
  return {ok:true,value:deepFreeze({...input})};
}

export function validateDriftResolution(action:DriftResolution,decisionRef?:string):Result<Readonly<{action:DriftResolution;decisionRef?:string}>> {
  const allowed:readonly DriftResolution[]=['ACCEPT_OBSERVED_AS_NORMATIVE','UPDATE_NORMATIVE_TO_APPROVED_INTENT','MIGRATE_IMPLEMENTATION_TO_NORMATIVE','MAP_WITH_ALIAS','LEGACY_ACCEPT_WITH_EXPIRY_OR_REVIEW_TRIGGER','DEFER_QUARANTINED','BLOCK'];
  if(!allowed.includes(action))return fail('DRIFT_RESOLUTION_UNSUPPORTED','Unsupported drift resolution');
  const changesIntent=action==='ACCEPT_OBSERVED_AS_NORMATIVE'||action==='UPDATE_NORMATIVE_TO_APPROVED_INTENT'||action==='MIGRATE_IMPLEMENTATION_TO_NORMATIVE';
  if(changesIntent&&!decisionRef)return fail('DRIFT_RESOLUTION_DECISION_REQUIRED','This drift resolution requires explicit decision authority');
  return {ok:true,value:deepFreeze(decisionRef?{action,decisionRef}:{action})};
}

export function planAdoptionSlice(input:{targets:readonly string[];dependencies:readonly AdoptionDependency[];governedDomains:readonly string[];blockedDomains?:readonly string[];requiredMappings?:readonly string[];unresolvedBlockers?:readonly string[];optionalCleanup?:readonly string[];postAdoptionMaturityDelta?:readonly {domain:string;from:GovernanceMaturity;to:GovernanceMaturity}[];safetyEnvelopeIdentity:string},options:OperationOptions):Result<AdoptionSlice> {
  const c=cancelled(options);if(c)return c;
  if(!input.safetyEnvelopeIdentity)return fail('ADOPTION_SLICE_SAFETY_BINDING_MISSING','Adoption slice requires an explicit safety-envelope identity');
  const map=new Map<string,readonly string[]>();let edges=0;const graphNodes=new Set<string>(input.targets);
  for(const d of input.dependencies){if(map.has(d.domain))return fail('DUPLICATE_ADOPTION_DOMAIN','Duplicate adoption dependency domain',d.domain);const deps=[...(d.dependsOn??[])].sort(compareCodePoint);map.set(d.domain,deps);graphNodes.add(d.domain);for(const dep of deps)graphNodes.add(dep);edges+=deps.length;}
  if(graphNodes.size>safeLimit(options.maxNodes,DEFAULT_MAX_NODES))return fail('NODE_BUDGET_EXCEEDED','Adoption slice node budget exceeded');
  if(edges>safeLimit(options.maxEdges,DEFAULT_MAX_EDGES))return fail('EDGE_BUDGET_EXCEEDED','Adoption slice edge budget exceeded');
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
  const maturityDelta=[...(input.postAdoptionMaturityDelta??[])].sort((a,b)=>compareCodePoint(a.domain,b.domain));
  for(let i=1;i<maturityDelta.length;i++)if(maturityDelta[i]!.domain===maturityDelta[i-1]!.domain)return fail('DUPLICATE_MATURITY_DELTA','Duplicate post-adoption maturity delta',maturityDelta[i]!.domain);
  const blockers=[...new Set([...(input.unresolvedBlockers??[]),...blockedRequired.map(domain=>`BLOCKED_DOMAIN:${domain}`)])].sort(compareCodePoint);
  return {ok:true,value:deepFreeze({targetDomains:[...input.targets].sort(compareCodePoint),requiredDomains:[...required].sort(compareCodePoint),requiredMappings:[...(input.requiredMappings??[])].sort(compareCodePoint),unresolvedBlockers:blockers,blockedDomains:blockedRequired,optionalCleanup:[...(input.optionalCleanup??[])].sort(compareCodePoint),postAdoptionMaturityDelta:maturityDelta,safetyEnvelopeIdentity:input.safetyEnvelopeIdentity})};
}

export function buildProgressiveGovernanceEnvelope(input:{projectId:string;slice:AdoptionSlice;governedDomains:readonly string[];safetyEnvelopeIdentity:string;requiredChecks:readonly string[];rollbackPlanRef:string},options:OperationOptions):Result<ProgressiveGovernanceEnvelope> {
  if(!validId(input.projectId))return fail('PROJECT_ID_INVALID','Invalid project identity');
  if(!input.safetyEnvelopeIdentity||!input.rollbackPlanRef)return fail('PROGRESSIVE_ENVELOPE_BINDING_MISSING','Safety envelope identity and rollback plan are required');
  if(input.safetyEnvelopeIdentity!==input.slice.safetyEnvelopeIdentity)return fail('PROGRESSIVE_ENVELOPE_SAFETY_MISMATCH','Progressive Governance Envelope must preserve the adoption-slice safety binding');
  const normalized={projectId:input.projectId,targetDomains:[...new Set(input.slice.targetDomains)].sort(compareCodePoint),requiredDomains:[...new Set(input.slice.requiredDomains)].sort(compareCodePoint),governedDomains:[...new Set(input.governedDomains)].sort(compareCodePoint),blockedDomains:[...new Set(input.slice.blockedDomains)].sort(compareCodePoint),requiredChecks:[...new Set(input.requiredChecks)].sort(compareCodePoint),safetyEnvelopeIdentity:input.safetyEnvelopeIdentity,rollbackPlanRef:input.rollbackPlanRef};
  const identity=sha(options,normalized);if(!identity.ok)return identity;
  return {ok:true,value:deepFreeze({...normalized,semanticIdentity:identity.value})};
}

export function createLegacyDebtRecord(record:LegacyDebtRecord):Result<Readonly<LegacyDebtRecord>> {
  if(!record.id||!record.domain||!record.sourceBinding||!record.reason||!record.invalidationCondition)return fail('LEGACY_DEBT_INVALID','Legacy debt record is incomplete',record.id);
  if(!DRIFT_CLASSES.has(record.driftClass))return fail('DRIFT_CLASS_UNSUPPORTED','Unsupported drift class',record.id);
  if(!['LOW','MEDIUM','HIGH','CRITICAL'].includes(record.severity))return fail('DEBT_SEVERITY_UNSUPPORTED','Unsupported legacy debt severity',record.id);
  return {ok:true,value:deepFreeze({...record,affectedCapabilities:[...record.affectedCapabilities].sort(compareCodePoint)})};
}

export function buildLegacyDebtQuarantine(projectId:string,records:readonly LegacyDebtRecord[],options:OperationOptions):Result<LegacyDebtQuarantine> {
  if(!validId(projectId))return fail('PROJECT_ID_INVALID','Invalid project identity');
  const normalized:LegacyDebtRecord[]=[];const ids=new Set<string>();
  for(const record of records){if(ids.has(record.id))return fail('DUPLICATE_LEGACY_DEBT','Duplicate legacy debt record',record.id);ids.add(record.id);const validated=createLegacyDebtRecord(record);if(!validated.ok)return validated;normalized.push(validated.value);}
  normalized.sort((a,b)=>compareCodePoint(a.id,b.id));const identity=sha(options,{projectId,records:normalized});if(!identity.ok)return identity;
  return {ok:true,value:deepFreeze({projectId,records:normalized,semanticIdentity:identity.value})};
}

const NORMALIZATION_TRANSITIONS:Readonly<Record<NormalizationState,readonly NormalizationState[]>>={
  LEGACY_UNMAPPED:['LEGACY_MAPPED','BLOCKED'],LEGACY_MAPPED:['DUAL_BOUND','BLOCKED'],DUAL_BOUND:['GEF_CANONICAL_WITH_LEGACY_READ','GEF_CANONICAL','BLOCKED'],GEF_CANONICAL_WITH_LEGACY_READ:['GEF_CANONICAL','DUAL_BOUND','BLOCKED'],GEF_CANONICAL:['DUAL_BOUND','BLOCKED'],BLOCKED:['LEGACY_MAPPED','DUAL_BOUND']
};
export function validateNormalizationTransition(from:NormalizationState,to:NormalizationState):Result<Readonly<{from:NormalizationState;to:NormalizationState}>> {
  if(!NORMALIZATION_STATES.has(from)||!NORMALIZATION_STATES.has(to))return fail('NORMALIZATION_STATE_UNSUPPORTED','Unsupported normalization state');
  if(!(NORMALIZATION_TRANSITIONS[from]??[]).includes(to))return fail('NORMALIZATION_FRONTIER_INVALID',`Transition ${from} -> ${to} is not admitted`);
  return {ok:true,value:deepFreeze({from,to})};
}

export function buildNormalizationFrontier(projectId:string,domains:readonly {domain:string;state:NormalizationState}[]):Result<NormalizationFrontier> {
  if(!validId(projectId))return fail('PROJECT_ID_INVALID','Invalid project identity');
  for(const d of domains){if(!d.domain)return fail('NORMALIZATION_DOMAIN_INVALID','Normalization domain is required');if(!NORMALIZATION_STATES.has(d.state))return fail('NORMALIZATION_STATE_UNSUPPORTED','Unsupported normalization state',d.domain);}
  const sorted=[...domains].sort((a,b)=>compareCodePoint(a.domain,b.domain));
  for(let i=1;i<sorted.length;i++)if(sorted[i]!.domain===sorted[i-1]!.domain)return fail('DUPLICATE_NORMALIZATION_DOMAIN','Duplicate normalization domain',sorted[i]!.domain);
  return {ok:true,value:deepFreeze({projectId,domains:sorted})};
}

export function probeSemanticEquivalence(left:Readonly<Record<string,unknown>>,right:Readonly<Record<string,unknown>>,fields:readonly string[],supported=true):EquivalenceState {
  if(!supported)return 'UNSUPPORTED_MAPPING';
  for(const field of fields)if(!Object.prototype.hasOwnProperty.call(left,field)||!Object.prototype.hasOwnProperty.call(right,field))return 'INDETERMINATE';
  try{return fields.every(field=>canonical(left[field])===canonical(right[field]))?'EQUIVALENT':'NON_EQUIVALENT';}catch{return 'INDETERMINATE';}
}

export function enforceNormalizationBudget(usage:NormalizationUsage,budget:NormalizationBudget):Result<Readonly<NormalizationUsage>> {
  const values=[usage.domains,usage.mappings,usage.migrations,usage.dependencyExpansion,budget.maxDomains,budget.maxMappings,budget.maxMigrations,budget.maxDependencyExpansion];
  if(values.some(v=>!Number.isInteger(v)||v<0))return fail('NORMALIZATION_BUDGET_INVALID','Normalization budget and usage must use non-negative integers');
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

export function evaluateDestructivePromotion(reversibility:ReversibilityIndex,migrationRollbackEvidence=false):Result<Readonly<{admitted:true;reversibility:ReversibilityIndex}>> {
  if(!['REVERSIBLE_BY_DELETE','REVERSIBLE_BY_ALIAS_RESTORE','REVERSIBLE_BY_TRANSACTION_ROLLBACK','REQUIRES_MIGRATION_ROLLBACK','IRREVERSIBILITY_UNKNOWN'].includes(reversibility))return fail('REVERSIBILITY_INDEX_UNSUPPORTED','Unsupported reversibility index');
  if(reversibility==='IRREVERSIBILITY_UNKNOWN')return fail('IRREVERSIBILITY_BLOCKS_PROMOTION','Unknown irreversibility blocks destructive promotion');
  if(reversibility==='REQUIRES_MIGRATION_ROLLBACK'&&!migrationRollbackEvidence)return fail('MIGRATION_ROLLBACK_EVIDENCE_REQUIRED','Migration rollback evidence is required for destructive promotion');
  return {ok:true,value:deepFreeze({admitted:true,reversibility})};
}
