import type{
  BlockerAttributionVector,
  ContinuationAdmission,
  EstimationAdmission,
  LifecycleStatus,
  OperationOptions,
  ProjectStatusDecision,
  ProjectStatusInput,
  ReadinessResolution,
  ReadinessResolutionInput,
  Result,
  ResumeAdmission,
  ScheduleResolution,
  ScheduleResolutionInput,
}from'./types.js';
import{admitContinuationSource,admitEstimationSource,admitProgressSource,admitResumeSource,verifyStatusIntentCapsule}from'./s01-authority.js';
import{createCompletionProgressWitness,projectRemainingState,resolveLifecycleStatus,verifyCompletionOutcome}from'./s02-lifecycle.js';
import{createBlockerAttributionVector,createStatusConditionIndex}from'./s03-conditions.js';
import{deepFreeze,digestValue,fail,ok}from'./utils.js';

export function createNextLegalActionBinding(continuation:ContinuationAdmission,options:OperationOptions):Result<{readonly checkpointDigest:string;readonly nextLegalAction:string;readonly bindingDigest:string}>{const body={checkpointDigest:continuation.checkpointDigest,nextLegalAction:continuation.nextLegalAction};const d=digestValue(options,'NAB23',body);if(!d.ok)return d;return ok(deepFreeze({...body,bindingDigest:d.value}));}

export function createNextActionConsistencyWitness(continuation:ContinuationAdmission|null,resume:ResumeAdmission|null,options:OperationOptions):Result<{readonly state:'CONSISTENT'|'CONFLICT'|'REPLAN_REQUIRED'|'UNKNOWN';readonly reasonCodes:readonly string[];readonly witnessDigest:string}>{let state:'CONSISTENT'|'CONFLICT'|'REPLAN_REQUIRED'|'UNKNOWN'='UNKNOWN';const reasons:string[]=[];if(continuation===null){reasons.push('CONTINUATION_MISSING');}else if(resume===null){state='CONSISTENT';reasons.push('NO_RESUME_CONSTRAINT');}else if(resume.checkpointDigest!==continuation.checkpointDigest){state='CONFLICT';reasons.push('RESUME_CHECKPOINT_MISMATCH');}else if(resume.status==='PROJECT_MISMATCH'||resume.status==='LINEAGE_MISMATCH'){state='CONFLICT';reasons.push(`RESUME_${resume.status}`);}else if(resume.status==='READY'&&resume.nextLegalAction!==continuation.nextLegalAction){state='CONFLICT';reasons.push('RESUME_ACTION_MISMATCH');}else if(resume.status==='DRIFT_REQUIRES_REPLAN'){state='REPLAN_REQUIRED';reasons.push('RESUME_DRIFT_REQUIRES_REPLAN');}else{state='CONSISTENT';reasons.push(`RESUME_${resume.status}`);}const body={state,reasonCodes:[...new Set(reasons)].sort()};const d=digestValue(options,'NAC23',body);if(!d.ok)return d;return ok(deepFreeze({...body,witnessDigest:d.value}));}

export function resolveContinuationReadiness(input:ReadinessResolutionInput,options:OperationOptions):Result<ReadinessResolution>{const consistency=createNextActionConsistencyWitness(input.continuation,input.resume,options);if(!consistency.ok)return consistency;let status:ReadinessResolution['status'];const reasons:string[]=[...consistency.value.reasonCodes];let nextLegalAction:string|null=null;if(consistency.value.state==='CONFLICT'){status='CONFLICT';}
 else if(input.blockers.conflictConditionIds.length>0){status='CONFLICT';reasons.push('ACTIVE_CONFLICT_CONDITION');}
 else if(input.blockers.recoveryConditionIds.length>0||input.lifecycle==='RECOVERY_REQUIRED'){status='RECOVERY_REQUIRED';reasons.push('RECOVERY_REQUIRED');}
 else if(input.blockers.blockingConditionIds.length>0||input.lifecycle==='BLOCKED'||input.continuation?.validity==='BLOCKED'||(input.continuation?.capabilityGaps.length??0)>0||input.resume?.status==='POLICY_BLOCKED'){status='BLOCKED';reasons.push('BLOCKING_CONDITION');}
 else if(consistency.value.state==='REPLAN_REQUIRED'){status='REPLAN_REQUIRED';}
 else if(input.lifecycle==='COMPLETE'){status='NOT_APPLICABLE';reasons.push('PROJECT_COMPLETE');}
 else if(input.lifecycle==='AWAITING_ACCEPTANCE'){status='WAITING';reasons.push('AWAITING_ACCEPTANCE');}
 else if(input.resume?.status==='EXPANSION_REQUIRED'){status='WAITING';reasons.push('RESUME_EXPANSION_REQUIRED');}
 else if(input.continuation?.ready===true&&input.continuation.nextLegalAction.trim()){status='READY';nextLegalAction=input.continuation.nextLegalAction;reasons.push('CHECKPOINT_READY');}
 else{status='UNKNOWN';reasons.push('READINESS_NOT_PROVEN');}
 const body={status,nextLegalAction,reasonCodes:[...new Set(reasons)].sort()};const d=digestValue(options,'CRR23',body);if(!d.ok)return d;return ok(deepFreeze({...body,resolutionDigest:d.value}));}

export function classifyDeadlineInterval(estimation:EstimationAdmission,options:OperationOptions):Result<{readonly status:'UNKNOWN'|'ON_TRACK'|'AT_RISK'|'LATE';readonly reason:string;readonly classifierDigest:string}>{let status:'UNKNOWN'|'ON_TRACK'|'AT_RISK'|'LATE';let reason:string;const cmp=estimation.deadlineComparison;if(estimation.availability!=='AVAILABLE'||cmp===null){status='UNKNOWN';reason=estimation.availability!=='AVAILABLE'?`ESTIMATION_${estimation.availability}`:'DEADLINE_COMPARISON_UNAVAILABLE';}else if(cmp.upperDeltaMs>=0){status='ON_TRACK';reason='CONSERVATIVE_BOUND_ON_OR_BEFORE_DEADLINE';}else if(cmp.lowerDeltaMs<0){status='LATE';reason='OPTIMISTIC_BOUND_AFTER_DEADLINE';}else{status='AT_RISK';reason='FORECAST_INTERVAL_STRADDLES_DEADLINE';}const body={status,reason};const d=digestValue(options,'DIC23',body);if(!d.ok)return d;return ok(deepFreeze({...body,classifierDigest:d.value}));}

export function resolveScheduleHealth(input:ScheduleResolutionInput,options:OperationOptions):Result<ScheduleResolution>{if(!input.requested){const body={status:'NOT_APPLICABLE' as const,reasonCodes:['SCHEDULE_NOT_REQUESTED']};const d=digestValue(options,'SHR23',body);if(!d.ok)return d;return ok(deepFreeze({...body,resolutionDigest:d.value}));}if(input.estimation===null){const body={status:'UNKNOWN' as const,reasonCodes:['ESTIMATION_SOURCE_MISSING']};const d=digestValue(options,'SHR23',body);if(!d.ok)return d;return ok(deepFreeze({...body,resolutionDigest:d.value}));}const classified=classifyDeadlineInterval(input.estimation,options);if(!classified.ok)return classified;const body={status:classified.value.status,reasonCodes:[classified.value.reason]};const d=digestValue(options,'SHR23',body);if(!d.ok)return d;return ok(deepFreeze({...body,resolutionDigest:d.value}));}

export function createStatusIndependenceFirewall(lifecycle:LifecycleStatus,schedule:ScheduleResolution['status'],readiness:ReadinessResolution['status'],options:OperationOptions):Result<{readonly lifecycleIndependent:true;readonly scheduleCannotCreateBlocker:true;readonly readinessCannotMutateNextAction:true;readonly states:{readonly lifecycle:LifecycleStatus;readonly schedule:ScheduleResolution['status'];readonly readiness:ReadinessResolution['status']};readonly firewallDigest:string}>{const body={lifecycleIndependent:true as const,scheduleCannotCreateBlocker:true as const,readinessCannotMutateNextAction:true as const,states:{lifecycle,schedule,readiness}};const d=digestValue(options,'SIF23',body);if(!d.ok)return d;return ok(deepFreeze({...body,firewallDigest:d.value}));}

export function deriveProjectStatusDecision(input:ProjectStatusInput,options:OperationOptions):Result<ProjectStatusDecision>{
 const iv=verifyStatusIntentCapsule(input.intent,options);if(!iv.ok||!iv.value)return iv.ok?fail('STATUS_INTENT_TAMPERED','Project status derivation requires verified intent.'):iv;
 let continuation=null as ContinuationAdmission|null;if(input.continuationSource!==null){const r=admitContinuationSource(input.intent,input.continuationSource,options);if(!r.ok)return r;continuation=r.value;}
 let resume=null as ResumeAdmission|null;if(input.resumeSource!==null){const r=admitResumeSource(input.intent,input.resumeSource,options);if(!r.ok)return r;resume=r.value;}
 let progress=null as import('./types.js').ProgressAdmission|null;if(input.progressSource!==null){const r=admitProgressSource(input.intent,input.progressSource,options);if(!r.ok)return r;progress=r.value;}
 let estimation=null as EstimationAdmission|null;if(input.estimationSource!==null){const r=admitEstimationSource(input.intent,input.estimationSource,options);if(!r.ok)return r;estimation=r.value;}
 if(input.completionOutcome!==null){const v=verifyCompletionOutcome(input.completionOutcome,options);if(!v.ok||!v.value)return v.ok?fail('COMPLETION_OUTCOME_TAMPERED','Completion outcome failed verification.'):v;if(input.completionOutcome.projectId!==input.intent.projectId||input.completionOutcome.lineageId!==input.intent.lineageId)return fail('COMPLETION_OUTCOME_LINEAGE_MISMATCH','Completion outcome belongs to another project/lineage.');}
 const actualCompletion=input.completionOutcome?.outcomeDigest??null;if(actualCompletion!==input.intent.expected.completionOutcomeDigest)return fail('SIC23_COMPLETION_EXPECTATION_MISMATCH','Completion outcome does not match status intent expectation.');
 const actualConditions=[...input.currentConditions].map(c=>c.conditionDigest).sort();if(JSON.stringify(actualConditions)!==JSON.stringify([...input.intent.expected.conditionDigests].sort()))return fail('SIC23_CONDITION_EXPECTATION_MISMATCH','Current condition identities do not match status intent expectation.');
 const actualPrevious=input.previousConditionIndex?.indexDigest??null;if(actualPrevious!==input.intent.expected.previousConditionIndexDigest)return fail('SIC23_PREVIOUS_CONDITION_EXPECTATION_MISMATCH','Previous condition index does not match status intent expectation.');
 const checkpointDigest=input.intent.expected.checkpointDigest;if(checkpointDigest===null)return fail('SCI23_CHECKPOINT_EXPECTATION_REQUIRED','Condition/status derivation requires an expected canonical checkpoint digest.');
 const conditions=createStatusConditionIndex(input.intent.projectId,input.intent.lineageId,checkpointDigest,input.currentConditions,input.previousConditionIndex,options);if(!conditions.ok)return conditions;const blockers=createBlockerAttributionVector(conditions.value,options);if(!blockers.ok)return blockers;
 const witness=progress===null?null:createCompletionProgressWitness(progress,options);if(witness!==null&&!witness.ok)return witness;const remaining=witness===null?null:projectRemainingState(witness.value,options);if(remaining!==null&&!remaining.ok)return remaining;
 const lifecycle=resolveLifecycleStatus({continuation,progress,progressWitness:witness?.value??null,completionOutcome:input.completionOutcome,blockers:blockers.value},options);if(!lifecycle.ok)return lifecycle;
 const readiness=resolveContinuationReadiness({lifecycle:lifecycle.value.status,continuation,resume,blockers:blockers.value},options);if(!readiness.ok)return readiness;
 const schedule=resolveScheduleHealth({requested:input.intent.requestedDimensions.includes('SCHEDULE'),estimation},options);if(!schedule.ok)return schedule;
 const firewall=createStatusIndependenceFirewall(lifecycle.value.status,schedule.value.status,readiness.value.status,options);if(!firewall.ok)return firewall;
 const body={lifecycle:lifecycle.value,schedule:schedule.value,readiness:readiness.value,remaining:remaining?.value??null,conditionIndex:conditions.value,blockers:blockers.value};const d=digestValue(options,'STATUS_DECISION23',{...body,firewallDigest:firewall.value.firewallDigest});if(!d.ok)return d;return ok(deepFreeze({...body,decisionDigest:d.value}));
}
