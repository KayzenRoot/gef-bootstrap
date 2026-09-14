import { buildCheckpointDependencyGraph, selectiveContinuationInvalidation } from '@gef-bootstrap/checkpoint-engine';
import type { CanonicalContinuationCapsule, ResumeReadinessCertificate } from '@gef-bootstrap/checkpoint-engine';
import type { ConversationIndependenceResult, DeltaRehydrationGraph, LineageContinuityProof, OperationOptions, OrphanWorkReport, ResumeAuthorityBoundary, ResumeConflictEntry, ResumeConflictQuarantine, ResumeContextRef, ResumeDriftEntry, ResumeDriftVector, ResumeObservation, ResumeReadPlan, Result, SafeReentryDecision, WorkObservation } from './types.js';
import { cancelled, compareCodePoint, deepFreeze, fail, nodeBudget, sha, sortedUnique } from './utils.js';

export function buildResumeDriftVector(checkpoint:CanonicalContinuationCapsule,observation:ResumeObservation,options:OperationOptions):Result<ResumeDriftVector>{
  const c=cancelled(options);if(c)return c;const entries:ResumeDriftEntry[]=[];
  const state=(expected:string,observed:string|undefined|null):ResumeDriftEntry['state']=>observed===undefined||observed===null?'MISSING':observed===expected?'SAME':'CHANGED';
  entries.push({dimension:'CHECKPOINT',subject:'checkpoint',state:state(checkpoint.checkpointDigest,observation.checkpointDigest),expected:checkpoint.checkpointDigest,observed:observation.checkpointDigest});
  entries.push({dimension:'POLICY',subject:'policy-binding',state:state(checkpoint.policyBinding.bindingDigest,observation.policyBindingDigest),expected:checkpoint.policyBinding.bindingDigest,observed:observation.policyBindingDigest});
  for(const b of [...checkpoint.authorityBindings].sort((a,b)=>compareCodePoint(a.bindingId,b.bindingId))){const observed=observation.authorityIdentities[b.bindingId];entries.push({dimension:'AUTHORITY',subject:b.bindingId,state:observed===undefined?(b.required?'MISSING':'UNKNOWN'):observed===b.semanticIdentity?'SAME':'CHANGED',expected:b.semanticIdentity,observed:observed??null});}
  for(const claim of [...checkpoint.claims].sort((a,b)=>compareCodePoint(a.claimId,b.claimId))){const expected=`${claim.status}:${claim.maturity}`;const observed=observation.claimStates[claim.claimId];entries.push({dimension:'CLAIM',subject:claim.claimId,state:observed===undefined?'UNKNOWN':observed===expected?'SAME':'CHANGED',expected,observed:observed??null});}
  const hasMaterialDrift=entries.some(e=>e.state==='CHANGED'||(e.state==='MISSING'&&(e.dimension==='CHECKPOINT'||e.dimension==='POLICY'||e.dimension==='AUTHORITY')));
  const hasUnknown=entries.some(e=>e.state==='UNKNOWN'||e.state==='MISSING');
  const semantic={entries,hasMaterialDrift,hasUnknown};const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,vectorDigest:d.value})};
}

export function buildDeltaRehydrationGraph(checkpoint:CanonicalContinuationCapsule,contextRefs:readonly ResumeContextRef[],changedKeys:readonly string[],dependencyKnowledgeComplete:boolean,options:OperationOptions):Result<DeltaRehydrationGraph>{
  const c=cancelled(options);if(c)return c;const budget=nodeBudget(options);if(contextRefs.length>budget)return fail('DELTA_GRAPH_BUDGET_EXCEEDED','Delta rehydration graph exceeds bounded node budget');
  const graph=buildCheckpointDependencyGraph(checkpoint,dependencyKnowledgeComplete);const invalidation=selectiveContinuationInvalidation(checkpoint,graph,changedKeys);const invalid=new Set(invalidation.invalidatedClaimIds);const changed=new Set(changedKeys);
  let refs=contextRefs.filter(ref=>ref.dependencyKeys.some(k=>changed.has(k)||(k.startsWith('claim:')&&invalid.has(k.slice(6)))));
  if(invalidation.conservativeWidening)refs=[...contextRefs];
  const nodes=refs.map(ref=>({refId:ref.refId,dependencyRefs:sortedUnique(ref.dependencyKeys.filter(k=>k.startsWith('ref:')).map(k=>k.slice(4))),reasonKeys:sortedUnique([...ref.dependencyKeys.filter(k=>changed.has(k)),...ref.dependencyKeys.filter(k=>k.startsWith('claim:')&&invalid.has(k.slice(6)))])})).sort((a,b)=>compareCodePoint(a.refId,b.refId));
  const semantic={nodes,complete:graph.complete&&!invalidation.conservativeWidening};const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,graphDigest:d.value})};
}

export function detectOrphanWork(checkpoint:CanonicalContinuationCapsule,work:readonly WorkObservation[],options:OperationOptions):Result<OrphanWorkReport>{
  const c=cancelled(options);if(c)return c;const knownClaims=new Set(checkpoint.claims.map(x=>x.claimId));
  const findings=[...work].sort((a,b)=>compareCodePoint(a.workId,b.workId)).map(w=>{const reasons:string[]=[];if(w.projectId!==checkpoint.projectId)reasons.push('PROJECT_MISMATCH');if(w.lineageId!==checkpoint.lineageId)reasons.push('LINEAGE_MISMATCH');if(w.baseCheckpointDigest!==checkpoint.checkpointDigest&&w.baseCheckpointDigest!==checkpoint.predecessorCheckpointDigest)reasons.push('BASE_NOT_RECOGNIZED');for(const id of w.claimIds)if(!knownClaims.has(id))reasons.push(`UNKNOWN_CLAIM:${id}`);return{workId:w.workId,orphaned:reasons.length>0,reasons:sortedUnique(reasons)};});
  const orphanWorkIds=sortedUnique(findings.filter(f=>f.orphaned).map(f=>f.workId));const semantic={findings,orphanWorkIds};const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,reportDigest:d.value})};
}

export function buildResumeConflictQuarantine(drift:ResumeDriftVector,orphans:OrphanWorkReport,conversation:ConversationIndependenceResult,options:OperationOptions):Result<ResumeConflictQuarantine>{
  const entries:ResumeConflictEntry[]=[];
  for(const d of drift.entries.filter(e=>e.state==='CHANGED'||e.state==='MISSING'))entries.push({subject:`${d.dimension}:${d.subject}`,reason:`DRIFT_${d.state}`,evidenceRefs:[d.expected,...(d.observed?[d.observed]:[])]});
  for(const f of orphans.findings.filter(f=>f.orphaned))entries.push({subject:`WORK:${f.workId}`,reason:f.reasons.join(','),evidenceRefs:[]});
  for(const id of conversation.conflictingClaimIds)entries.push({subject:`CONVERSATION:${id}`,reason:'INFORMATIONAL_CONFLICT_CANONICAL_STATE_WINS',evidenceRefs:[]});
  entries.sort((a,b)=>compareCodePoint(`${a.subject}:${a.reason}`,`${b.subject}:${b.reason}`));const d=sha(options,entries);if(!d.ok)return d;return{ok:true,value:deepFreeze({entries,quarantineDigest:d.value})};
}

export function evaluateSafeReentry(checkpoint:CanonicalContinuationCapsule,lineage:LineageContinuityProof,authority:ResumeAuthorityBoundary,readiness:ResumeReadinessCertificate,drift:ResumeDriftVector,readPlan:ResumeReadPlan,orphans:OrphanWorkReport,options:OperationOptions):Result<SafeReentryDecision>{
  const c=cancelled(options);if(c)return c;let status:SafeReentryDecision['status']='READY';const diagnostics:SafeReentryDecision['diagnostics'][number][]=[];let nextAction:string|null=checkpoint.nextLegalAction;const expansionRefs=sortedUnique(readPlan.steps.filter(s=>s.mandatory).map(s=>s.refId));
  if(!lineage.valid){status=lineage.mismatch==='PROJECT'?'PROJECT_MISMATCH':lineage.mismatch==='LINEAGE'?'LINEAGE_MISMATCH':'DRIFT_REQUIRES_REPLAN';diagnostics.push({code:`RESUME_${lineage.mismatch}_MISMATCH`,message:'Resume lineage continuity proof failed'});}
  else if(!authority.authorized){status='INDETERMINATE';diagnostics.push({code:'RESUME_ACTION_NOT_CANONICAL',message:'Requested or handed-off action does not match canonical checkpoint action'});}
  else if(drift.entries.some(e=>e.dimension==='POLICY'&&e.state!=='SAME')){status='POLICY_BLOCKED';diagnostics.push({code:'RESUME_POLICY_DRIFT',message:'Policy continuity binding changed or is missing'});}
  else if(readiness.validity==='BLOCKED'){status='POLICY_BLOCKED';diagnostics.push({code:'RESUME_READINESS_BLOCKED',message:'Checkpoint readiness is blocked'});}
  else if(readiness.validity==='STALE_BINDING'||drift.hasMaterialDrift||orphans.orphanWorkIds.length>0){status='DRIFT_REQUIRES_REPLAN';diagnostics.push({code:'RESUME_DRIFT_REPLAN',message:'Material drift or orphan work requires bounded replan'});}
  else if(readiness.validity==='PARTIAL'||readPlan.expansionRequired||drift.hasUnknown){status='EXPANSION_REQUIRED';diagnostics.push({code:'RESUME_EXPANSION_REQUIRED',message:'Additional bounded canonical reads are required before safe re-entry'});}
  else if(readiness.validity!=='VALID'){status='INDETERMINATE';diagnostics.push({code:'RESUME_READINESS_INDETERMINATE',message:'Checkpoint readiness is not conclusively valid'});}
  if(status!=='READY')nextAction=null;
  const semantic={status,checkpointDigest:checkpoint.checkpointDigest,nextAction,expansionRefs,diagnostics};const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,decisionDigest:d.value})};
}
