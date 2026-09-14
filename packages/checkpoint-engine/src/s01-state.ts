import type { AuthorityBindingRef, AuthoritySnapshotIndex, CanonicalContinuationCapsule, CanonicalContinuationCapsuleInput, CheckpointStateVector, ContinuationInvariant, ContinuationInvariantSet, OperationOptions, Result } from './types.js';
import { bounded, cancelled, compareCodePoint, deepFreeze, fail, sha, sortedUnique, validId } from './utils.js';

const SHA256=/^sha256:[0-9a-f]{64}$/;
function refsIn(input:CanonicalContinuationCapsuleInput){return input.authorityBindings.length+input.admittedWorkOrderIds.length+input.evidenceRefs.length+input.blockers.length+input.requiredCapabilities.length+input.claims.reduce((n,c)=>n+c.dependencyKeys.length+c.authorityBindingIds.length+c.evidenceRefs.length,0);}

export function buildCheckpointStateVector(input:CanonicalContinuationCapsuleInput):CheckpointStateVector{
  const domains=sortedUnique([...input.claims.map(c=>c.domain),...input.authorityBindings.map(b=>b.domain)]);
  const entries=domains.map(domain=>{
    const claims=input.claims.filter(c=>c.domain===domain);
    const maturity=claims.length===0?0:Math.min(...claims.map(c=>c.maturity));
    const rank:Record<string,number>={QUARANTINED:5,STALE:4,BLOCKED:3,ACTIVE:2,PLANNED:1,DONE:0};
    const status=claims.length===0?'PLANNED':[...claims].sort((a,b)=>(rank[b.status]??0)-(rank[a.status]??0)||compareCodePoint(a.claimId,b.claimId))[0]!.status;
    return{domain,status,maturity,evidenceRefs:sortedUnique(claims.flatMap(c=>c.evidenceRefs))};
  });
  return deepFreeze({entries});
}

export function buildAuthoritySnapshotIndex(bindings:readonly AuthorityBindingRef[],options:OperationOptions):Result<AuthoritySnapshotIndex>{
  const c=cancelled(options);if(c)return c;
  const ids=bindings.map(b=>b.bindingId);if(new Set(ids).size!==ids.length)return fail('AUTHORITY_BINDING_DUPLICATE','Authority binding ids must be unique');
  for(const b of bindings)if(!validId(b.bindingId)||!b.domain.trim()||!SHA256.test(b.semanticIdentity)||!b.authorityRef.trim())return fail('AUTHORITY_BINDING_INVALID','Authority binding identity/domain/digest/authority is required',b.bindingId);
  const normalized=[...bindings].map(b=>({...b})).sort((a,b)=>compareCodePoint(a.bindingId,b.bindingId));
  const d=sha(options,normalized);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({bindings:normalized,indexDigest:d.value})};
}

export function evaluateContinuationInvariants(input:CanonicalContinuationCapsuleInput,authorityIndex:AuthoritySnapshotIndex,options:OperationOptions):Result<ContinuationInvariantSet>{
  const invariants:ContinuationInvariant[]=[];
  const add=(invariantId:string,satisfied:boolean,reason:string)=>invariants.push({invariantId,satisfied,reason});
  add('PROJECT_ID',validId(input.projectId),'projectId must be a stable identifier');
  add('LINEAGE_ID',validId(input.lineageId),'lineageId must be a stable identifier');
  add('MODULE_STAGE',validId(input.moduleId)&&validId(input.stageId),'module and stage identifiers are required');
  add('WORK_ORDER_PRESENT',input.admittedWorkOrderIds.length>0,'at least one admitted Work Order is required');
  add('NEXT_LEGAL_ACTION',input.nextLegalAction.trim().length>0,'next legal action must be explicit');
  add('POLICY_BINDING',SHA256.test(input.policyBinding.bindingDigest),'M16 continuity policy binding must be digest-bound');
  add('AUTHORITY_INDEX',authorityIndex.bindings.length===input.authorityBindings.length,'authority snapshot must cover supplied bindings');
  const claimIds=input.claims.map(c=>c.claimId);
  add('CLAIM_IDENTITIES',new Set(claimIds).size===claimIds.length&&input.claims.every(c=>validId(c.claimId)&&c.maturity>=0&&c.maturity<=100),'claims must have unique ids and bounded maturity');
  const bindingIds=new Set(authorityIndex.bindings.map(b=>b.bindingId));
  add('CLAIM_AUTHORITY_REFS',input.claims.every(c=>c.authorityBindingIds.every(id=>bindingIds.has(id))),'claim authority references must resolve');
  add('PREDECESSOR_FORMAT',input.predecessorCheckpointDigest===null||SHA256.test(input.predecessorCheckpointDigest),'predecessor checkpoint must be null or semantic digest');
  const d=sha(options,invariants);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({invariants,admissible:invariants.every(i=>i.satisfied),invariantDigest:d.value})};
}

export function createCanonicalContinuationCapsule(input:CanonicalContinuationCapsuleInput,options:OperationOptions):Result<CanonicalContinuationCapsule>{
  const c=cancelled(options);if(c)return c;
  if(input.schemaVersion!==1)return fail('CHECKPOINT_SCHEMA_UNSUPPORTED','Only checkpoint schema v1 is supported');
  const budget=bounded(options,input.claims.length+input.authorityBindings.length,refsIn(input));if(!budget.withinBudget)return fail('CHECKPOINT_SIZE_BUDGET_EXCEEDED','Checkpoint input exceeds bounded node/reference budget');
  const authority=buildAuthoritySnapshotIndex(input.authorityBindings,options);if(!authority.ok)return authority;
  const inv=evaluateContinuationInvariants(input,authority.value,options);if(!inv.ok)return inv;if(!inv.value.admissible)return fail('CHECKPOINT_INVARIANT_FAILED','Continuation invariants are not satisfied');
  const normalized={
    schemaVersion:1 as const,projectId:input.projectId,moduleId:input.moduleId,stageId:input.stageId,lineageId:input.lineageId,
    predecessorCheckpointDigest:input.predecessorCheckpointDigest,admittedWorkOrderIds:sortedUnique(input.admittedWorkOrderIds),
    authorityBindings:authority.value.bindings,policyBinding:input.policyBinding,
    claims:[...input.claims].map(c=>({...c,dependencyKeys:sortedUnique(c.dependencyKeys),authorityBindingIds:sortedUnique(c.authorityBindingIds),evidenceRefs:sortedUnique(c.evidenceRefs)})).sort((a,b)=>compareCodePoint(a.claimId,b.claimId)),
    blockers:sortedUnique(input.blockers),evidenceRefs:sortedUnique(input.evidenceRefs),nextLegalAction:input.nextLegalAction,requiredCapabilities:sortedUnique(input.requiredCapabilities),
    stateVector:buildCheckpointStateVector(input),authorityIndex:authority.value,
  };
  const d=sha(options,normalized);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({...normalized,checkpointDigest:d.value})};
}

export function verifyCanonicalContinuationCapsule(capsule:CanonicalContinuationCapsule,options:OperationOptions):Result<true>{
  const rebuilt=createCanonicalContinuationCapsule(capsule,options);if(!rebuilt.ok)return rebuilt as Result<true>;
  if(rebuilt.value.checkpointDigest!==capsule.checkpointDigest)return fail('CHECKPOINT_DIGEST_MISMATCH','Checkpoint semantic digest does not match its payload',capsule.checkpointDigest);
  if(rebuilt.value.authorityIndex.indexDigest!==capsule.authorityIndex.indexDigest)return fail('CHECKPOINT_AUTHORITY_INDEX_MISMATCH','Checkpoint authority index digest does not match its bindings');
  return{ok:true,value:true};
}
