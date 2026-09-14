import type { CanonicalContinuationCapsule, CheckpointDependencyGraph, CheckpointRollbackPointer, ContinuityRegressionFinding, InvalidationResult, OperationOptions, Result, StaleClaimQuarantine } from './types.js';
import { cancelled, compareCodePoint, deepFreeze, fail, sha, sortedUnique } from './utils.js';

export function buildCheckpointDependencyGraph(capsule:CanonicalContinuationCapsule,complete=true):CheckpointDependencyGraph{
  return deepFreeze({complete,nodes:[...capsule.claims].sort((a,b)=>compareCodePoint(a.claimId,b.claimId)).map(c=>({claimId:c.claimId,dependencyKeys:sortedUnique([...c.dependencyKeys,...c.authorityBindingIds.map(id=>`authority:${id}`),...c.evidenceRefs.map(id=>`evidence:${id}`)] )}))});
}

export function selectiveContinuationInvalidation(capsule:CanonicalContinuationCapsule,graph:CheckpointDependencyGraph,changedKeys:readonly string[]):InvalidationResult{
  const changed=new Set(changedKeys);const directly=new Set(graph.nodes.filter(n=>n.dependencyKeys.some(k=>changed.has(k))).map(n=>n.claimId));
  const invalidated=graph.complete?[...directly]:changedKeys.length>0?capsule.claims.map(c=>c.claimId):[];
  const ids=sortedUnique(invalidated);const invalid=new Set(ids);
  return deepFreeze({invalidatedClaimIds:ids,preservedClaimIds:sortedUnique(capsule.claims.filter(c=>!invalid.has(c.claimId)).map(c=>c.claimId)),conservativeWidening:!graph.complete&&changedKeys.length>0});
}

export function createCheckpointRollbackPointer(capsule:CanonicalContinuationCapsule,options:OperationOptions):Result<CheckpointRollbackPointer>{
  const c=cancelled(options);if(c)return c;
  if(!capsule.predecessorCheckpointDigest)return fail('ROLLBACK_PREDECESSOR_MISSING','Checkpoint has no admissible predecessor pointer');
  const semantic={fromCheckpointDigest:capsule.checkpointDigest,predecessorCheckpointDigest:capsule.predecessorCheckpointDigest,lineageId:capsule.lineageId};const d=sha(options,semantic);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({...semantic,pointerDigest:d.value})};
}

export function buildStaleClaimQuarantine(capsule:CanonicalContinuationCapsule,invalidation:InvalidationResult,reasonKeys:readonly string[],options:OperationOptions):Result<StaleClaimQuarantine>{
  const set=new Set(invalidation.invalidatedClaimIds);const entries=capsule.claims.filter(c=>set.has(c.claimId)).sort((a,b)=>compareCodePoint(a.claimId,b.claimId)).map(claim=>({claim,reasonKeys:sortedUnique(reasonKeys)}));
  const d=sha(options,entries);if(!d.ok)return d;return{ok:true,value:deepFreeze({entries,quarantineDigest:d.value})};
}

export function detectContinuityRegression(previous:CanonicalContinuationCapsule,current:CanonicalContinuationCapsule,authorizedRollback=false):readonly ContinuityRegressionFinding[]{
  const findings:ContinuityRegressionFinding[]=[];
  if(previous.projectId!==current.projectId||previous.lineageId!==current.lineageId)return deepFreeze([{kind:'AUTHORITY_LOSS',subject:'project-or-lineage'}]);
  for(const p of previous.claims){const c=current.claims.find(x=>x.claimId===p.claimId);if(!c)continue;if(!authorizedRollback&&c.maturity<p.maturity)findings.push({kind:'MATURITY_ROLLBACK',subject:p.claimId});if(!authorizedRollback&&p.status==='DONE'&&c.status!=='DONE')findings.push({kind:'DONE_TO_NON_DONE',subject:p.claimId});}
  const currentBindings=new Set(current.authorityBindings.map(b=>b.bindingId));for(const b of previous.authorityBindings.filter(b=>b.required))if(!currentBindings.has(b.bindingId))findings.push({kind:'AUTHORITY_LOSS',subject:b.bindingId});
  for(const w of previous.admittedWorkOrderIds)if(!current.admittedWorkOrderIds.includes(w))findings.push({kind:'WORK_ORDER_LOSS',subject:w});
  if(!current.nextLegalAction.trim())findings.push({kind:'NEXT_ACTION_AMBIGUITY',subject:'nextLegalAction'});
  return deepFreeze(findings.sort((a,b)=>compareCodePoint(`${a.kind}:${a.subject}`,`${b.kind}:${b.subject}`)));
}
