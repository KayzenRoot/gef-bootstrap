import type { AdoptionIntentCapsule, AdoptionIntentInput, AdoptionSafetyEnvelope, AdoptionState, BootstrapSeedGraph, GovernanceDomainState, GovernanceMaturity, GovernanceMaturityVector, KernelEvaluation, NewProjectAssessment, NewProjectSignals, OperationOptions, Result, SeedNode } from './types.js';
import { cancelled, compareCodePoint, deepFreeze, DEFAULT_MAX_DEPTH, DEFAULT_MAX_EDGES, DEFAULT_MAX_NODES, fail, safeLimit, sha, uniqueSorted, validId } from './utils.js';

const TRANSITIONS: Readonly<Record<AdoptionState, readonly AdoptionState[]>> = {
  UNASSESSED: ['OBSERVED','BLOCKED'], OBSERVED: ['MODE_PROPOSED','BLOCKED'], MODE_PROPOSED: ['MODE_ADMITTED','BLOCKED'], MODE_ADMITTED: ['PARTIAL_GOVERNANCE','GOVERNED','MIGRATION_IN_PROGRESS','BLOCKED'], PARTIAL_GOVERNANCE: ['PARTIAL_GOVERNANCE','GOVERNED','MIGRATION_IN_PROGRESS','BLOCKED','ROLLED_BACK'], GOVERNED: ['PARTIAL_GOVERNANCE','MIGRATION_IN_PROGRESS','BLOCKED'], MIGRATION_IN_PROGRESS: ['PARTIAL_GOVERNANCE','GOVERNED','BLOCKED','ROLLED_BACK'], BLOCKED: ['OBSERVED','ROLLED_BACK'], ROLLED_BACK: ['OBSERVED']
};

export function createAdoptionIntentCapsule(input: AdoptionIntentInput, options: OperationOptions): Result<AdoptionIntentCapsule> {
  if (!validId(input.projectId)) return fail('PROJECT_ID_INVALID','Invalid project identity');
  if (!input.mode) return fail('ADOPTION_MODE_MISSING','Explicit adoption mode is required');
  if (!input.sourcePackIdentity || !input.profileIdentity || !input.profileDigest || !input.policyVersion) return fail('ADOPTION_BINDING_MISSING','Source Pack, profile and policy bindings are required');
  if (input.mode === 'BROWNFIELD_GOVERNED_MIGRATION' && !input.decisionRef) return fail('REQUIRED_DECISION_MISSING','Governed migration requires an explicit decision reference');
  const requested = uniqueSorted(input.requestedDomains); if (!requested.ok) return requested;
  const excluded = uniqueSorted(input.excludedDomains ?? []); if (!excluded.ok) return excluded;
  const overlap = requested.value.find(v => excluded.value.includes(v));
  if (overlap) return fail('ADOPTION_DOMAIN_CONFLICT','A domain cannot be both requested and excluded',overlap);
  const normalized = { ...input, requestedDomains: requested.value, excludedDomains: excluded.value };
  const identity = sha(options, normalized); if (!identity.ok) return identity;
  return { ok:true, value:deepFreeze({ ...normalized, semanticIdentity:identity.value }) };
}

export function validateAdoptionTransition(from: AdoptionState, to: AdoptionState): Result<Readonly<{from:AdoptionState;to:AdoptionState}>> {
  if (!(TRANSITIONS[from] ?? []).includes(to)) return fail('UNSUPPORTED_GOVERNANCE_TRANSITION',`Transition ${from} -> ${to} is not admitted`);
  return { ok:true, value:deepFreeze({from,to}) };
}

export function buildGovernanceMaturityVector(projectId:string, states:readonly GovernanceDomainState[], options:OperationOptions): Result<GovernanceMaturityVector> {
  if (!validId(projectId)) return fail('PROJECT_ID_INVALID','Invalid project identity');
  const sorted = [...states].map(s => ({...s,evidenceRefs:[...(s.evidenceRefs??[])].sort(compareCodePoint)})).sort((a,b)=>compareCodePoint(a.domain,b.domain));
  for (let i=1;i<sorted.length;i++) if (sorted[i]!.domain === sorted[i-1]!.domain) return fail('DUPLICATE_GOVERNANCE_DOMAIN','Duplicate governance domain',sorted[i]!.domain);
  const identity = sha(options,{projectId,domains:sorted}); if(!identity.ok)return identity;
  return {ok:true,value:deepFreeze({projectId,domains:sorted,semanticIdentity:identity.value})};
}

export function validateAdoptionSafetyEnvelope(envelope:AdoptionSafetyEnvelope):Result<Readonly<AdoptionSafetyEnvelope>> {
  const allowed = new Set(envelope.allowedMutationSurfaces);
  const conflict = envelope.forbiddenSurfaces.find(v=>allowed.has(v));
  if(conflict)return fail('MUTATION_SURFACE_CONFLICT','Surface is both allowed and forbidden',conflict);
  if(!envelope.rollbackOwner) return fail('ROLLBACK_OWNER_MISSING','Rollback owner is required');
  return {ok:true,value:deepFreeze({...envelope,allowedMutationSurfaces:[...envelope.allowedMutationSurfaces].sort(compareCodePoint),forbiddenSurfaces:[...envelope.forbiddenSurfaces].sort(compareCodePoint),reversibleOperations:[...envelope.reversibleOperations].sort(compareCodePoint),preconditions:[...envelope.preconditions].sort(compareCodePoint),requiredChecks:[...envelope.requiredChecks].sort(compareCodePoint),abortConditions:[...envelope.abortConditions].sort(compareCodePoint)})};
}

export function assessNewProject(signals:NewProjectSignals):NewProjectAssessment {
  return signals.explicitNewProjectIntent && !signals.conflictingCanonicalSystem && !signals.retainedHistory && !signals.existingReleaseEvidence && !signals.remoteProjectEvidence ? 'TRUE_NEW' : 'NEWNESS_UNCERTAIN';
}

export function buildBootstrapSeedGraph(nodes:readonly SeedNode[], options:OperationOptions):Result<BootstrapSeedGraph> {
  const c=cancelled(options); if(c)return c;
  if(nodes.length>safeLimit(options.maxNodes,DEFAULT_MAX_NODES))return fail('NODE_BUDGET_EXCEEDED','Bootstrap Seed Graph node budget exceeded');
  const byId=new Map<string,SeedNode>();
  let edges=0;
  for(const node of nodes){
    if(!validId(node.id))return fail('SEED_NODE_ID_INVALID','Invalid seed node id',node.id);
    if(byId.has(node.id))return fail('DUPLICATE_SEED_NODE','Duplicate seed node',node.id);
    byId.set(node.id,node); edges+=node.dependencies?.length??0;
    if(edges>safeLimit(options.maxEdges,DEFAULT_MAX_EDGES))return fail('EDGE_BUDGET_EXCEEDED','Bootstrap Seed Graph edge budget exceeded');
    if(node.creationMode==='CREATE_SKELETON_REQUIRING_DECISION' && !(node.decisionRefs?.length)) { /* visible incompleteness is valid */ }
  }
  for(const node of nodes) for(const dep of node.dependencies??[]) if(!byId.has(dep)) return fail('SEED_DEPENDENCY_NOT_FOUND','Seed dependency not found',dep);
  const visiting=new Set<string>(),done=new Set<string>(),order:string[]=[];
  const walk=(id:string,depth:number):Result<void>=>{
    if(options.cancellation?.isCancelled())return fail('CANCELLED','Operation cancelled');
    if(depth>safeLimit(options.maxDepth,DEFAULT_MAX_DEPTH))return fail('DEPTH_BUDGET_EXCEEDED','Seed graph depth budget exceeded',id);
    if(visiting.has(id))return fail('SEED_GRAPH_CYCLE','Bootstrap Seed Graph cycle detected',id);
    if(done.has(id))return {ok:true,value:undefined};
    visiting.add(id);
    const deps=[...(byId.get(id)?.dependencies??[])].sort(compareCodePoint);
    for(const dep of deps){const r=walk(dep,depth+1);if(!r.ok)return r;}
    visiting.delete(id);done.add(id);order.push(id);return {ok:true,value:undefined};
  };
  for(const id of [...byId.keys()].sort(compareCodePoint)){const r=walk(id,0);if(!r.ok)return r;}
  const normalized=[...nodes].map(n=>({...n,dependencies:[...(n.dependencies??[])].sort(compareCodePoint),decisionRefs:[...(n.decisionRefs??[])].sort(compareCodePoint)})).sort((a,b)=>compareCodePoint(a.id,b.id));
  return {ok:true,value:deepFreeze({nodes:normalized,order})};
}

const MGK_REQUIRED=['PROJECT_IDENTITY','CONSTITUTION_GOVERNANCE','CURRENT_CHECKPOINT','DECISIONS','SCOPE','COMPLETION_DEFINITION','EXECUTION_GOVERNANCE'] as const;
export function evaluateMinimalGovernanceKernel(classes:readonly string[]):KernelEvaluation {
  const have=new Set(classes); const missing=MGK_REQUIRED.filter(v=>!have.has(v));
  return deepFreeze({complete:missing.length===0,missing:[...missing]});
}

const MATURITY_ORDER:Readonly<Record<GovernanceMaturity,number>>={UNOBSERVED:0,OBSERVED:1,MAPPED:2,GOVERNED_PARTIAL:3,GOVERNED_CANONICAL:4,DRIFTED:-1,BLOCKED:-2};
export function maturitySatisfies(actual:GovernanceMaturity,minimum:GovernanceMaturity):boolean { return MATURITY_ORDER[actual]>=MATURITY_ORDER[minimum] && MATURITY_ORDER[actual]>=0; }
