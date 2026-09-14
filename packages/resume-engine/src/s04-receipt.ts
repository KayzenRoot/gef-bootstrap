import type { CanonicalContinuationCapsule, ContinuationHandoffContract } from '@gef-bootstrap/checkpoint-engine';
import type { ContinuityLossFinding, OperationOptions, OrphanWorkReport, Result, ResumeConflictQuarantine, ResumeDriftVector, ResumeEfficiencyReceipt, ResumeIntentCapsule, ResumeReadPlan, ResumeReceipt, ResumeSemanticDigest, SafeHandbackContract, SafeReentryDecision } from './types.js';
import { cancelled, compareCodePoint, deepFreeze, fail, sha, sortedUnique } from './utils.js';
import { verifyResumeIntentCapsule, verifyContinuationHandoff } from './s01-intent.js';

export function buildResumeReceipt(intent:ResumeIntentCapsule,checkpoint:CanonicalContinuationCapsule,handoff:ContinuationHandoffContract,decision:SafeReentryDecision,readPlan:ResumeReadPlan,drift:ResumeDriftVector,orphans:OrphanWorkReport,quarantine:ResumeConflictQuarantine,options:OperationOptions):Result<ResumeReceipt>{
  const c=cancelled(options);if(c)return c;const iv=verifyResumeIntentCapsule(intent,options);if(!iv.ok)return iv as Result<ResumeReceipt>;const hv=verifyContinuationHandoff(handoff,options);if(!hv.ok)return hv as Result<ResumeReceipt>;
  if(decision.checkpointDigest!==checkpoint.checkpointDigest||handoff.checkpointDigest!==checkpoint.checkpointDigest)return fail('RESUME_RECEIPT_BINDING_MISMATCH','Resume receipt inputs are not bound to one checkpoint');
  if(decision.status==='READY'&&decision.nextAction!==checkpoint.nextLegalAction)return fail('RESUME_READY_ACTION_MISMATCH','READY resume must hand back the exact canonical next action');
  const semantic={resumeId:intent.resumeId,status:decision.status,projectId:checkpoint.projectId,lineageId:checkpoint.lineageId,checkpointDigest:checkpoint.checkpointDigest,handoffDigest:handoff.handoffDigest,nextAction:decision.nextAction,readPlanDigest:readPlan.planDigest,driftVectorDigest:drift.vectorDigest,orphanReportDigest:orphans.reportDigest,quarantineDigest:quarantine.quarantineDigest};
  const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,receiptDigest:d.value})};
}

export function verifyResumeReceipt(receipt:ResumeReceipt,options:OperationOptions):Result<true>{
  const semantic={resumeId:receipt.resumeId,status:receipt.status,projectId:receipt.projectId,lineageId:receipt.lineageId,checkpointDigest:receipt.checkpointDigest,handoffDigest:receipt.handoffDigest,nextAction:receipt.nextAction,readPlanDigest:receipt.readPlanDigest,driftVectorDigest:receipt.driftVectorDigest,orphanReportDigest:receipt.orphanReportDigest,quarantineDigest:receipt.quarantineDigest};const d=sha(options,semantic);if(!d.ok)return d as Result<true>;if(d.value!==receipt.receiptDigest)return fail('RESUME_RECEIPT_TAMPERED','Resume receipt digest does not match its semantic payload');return{ok:true,value:true};
}

export function buildResumeSemanticDigest(receipt:ResumeReceipt,options:OperationOptions):Result<ResumeSemanticDigest>{
  const verified=verifyResumeReceipt(receipt,options);if(!verified.ok)return verified as Result<ResumeSemanticDigest>;const d=sha(options,{resumeId:receipt.resumeId,receiptDigest:receipt.receiptDigest,status:receipt.status,checkpointDigest:receipt.checkpointDigest,nextAction:receipt.nextAction});if(!d.ok)return d;return{ok:true,value:deepFreeze({resumeId:receipt.resumeId,semanticDigest:d.value})};
}

export function detectContinuityLoss(previous:CanonicalContinuationCapsule,current:CanonicalContinuationCapsule,currentReceipt:ResumeReceipt,options:OperationOptions):Result<readonly ContinuityLossFinding[]>{
  const c=cancelled(options);if(c)return c;const findings:ContinuityLossFinding[]=[];
  const currentBindings=new Set(current.authorityBindings.map(b=>b.bindingId));for(const b of previous.authorityBindings.filter(b=>b.required))if(!currentBindings.has(b.bindingId))findings.push({kind:'AUTHORITY_LOSS',subject:b.bindingId});
  for(const b of previous.blockers)if(!current.blockers.includes(b))findings.push({kind:'BLOCKER_LOSS',subject:b});
  const currentClaims=new Set(current.claims.map(x=>x.claimId));for(const claim of previous.claims)if(!currentClaims.has(claim.claimId))findings.push({kind:'CLAIM_LOSS',subject:claim.claimId});
  if(previous.checkpointDigest===current.checkpointDigest&&previous.nextLegalAction!==current.nextLegalAction)findings.push({kind:'NEXT_ACTION_CHANGE',subject:current.nextLegalAction});
  if(currentReceipt.status==='READY'&&currentReceipt.checkpointDigest!==current.checkpointDigest)findings.push({kind:'STALE_SUCCESS_REINTRODUCED',subject:currentReceipt.resumeId});
  return{ok:true,value:deepFreeze(findings.sort((a,b)=>compareCodePoint(`${a.kind}:${a.subject}`,`${b.kind}:${b.subject}`)))};
}

export function buildResumeEfficiencyReceipt(plannedReads:number,hotHits:number,negativeCacheHits:number,expansionReads:number,options:OperationOptions):Result<ResumeEfficiencyReceipt>{
  if([plannedReads,hotHits,negativeCacheHits,expansionReads].some(v=>!Number.isInteger(v)||v<0))return fail('RESUME_EFFICIENCY_INVALID','Efficiency metrics must be non-negative integers');
  if(hotHits+negativeCacheHits>plannedReads+hotHits+negativeCacheHits)return fail('RESUME_EFFICIENCY_INVALID','Cache hits cannot exceed considered reads');
  const semantic={plannedReads,hotHits,negativeCacheHits,expansionReads};const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,efficiencyDigest:d.value})};
}

export function buildSafeHandbackContract(decision:SafeReentryDecision,receipt:ResumeReceipt,options:OperationOptions):Result<SafeHandbackContract>{
  const verified=verifyResumeReceipt(receipt,options);if(!verified.ok)return verified as Result<SafeHandbackContract>;
  if(receipt.status!==decision.status||receipt.checkpointDigest!==decision.checkpointDigest)return fail('HANDBACK_RECEIPT_MISMATCH','Handback decision and receipt are not bound to the same resume result');
  const nextLegalAction=decision.status==='READY'?decision.nextAction:null;if(decision.status==='READY'&&!nextLegalAction)return fail('HANDBACK_READY_WITHOUT_ACTION','READY handback requires exactly one canonical next action');
  const blockers=decision.status==='READY'?[]:sortedUnique(decision.diagnostics.map(d=>d.code));const semantic={status:decision.status,checkpointDigest:decision.checkpointDigest,nextLegalAction,blockers,receiptDigest:receipt.receiptDigest};const d=sha(options,semantic);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({...semantic,handbackDigest:d.value})};
}
