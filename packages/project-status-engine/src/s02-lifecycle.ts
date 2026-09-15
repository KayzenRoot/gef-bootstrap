import type{CompletionOutcome,CompletionOutcomeInput,CompletionProgressWitness,LifecycleResolution,LifecycleResolutionInput,OperationOptions,ProgressAdmission,RemainingStateProjection,Result}from'./types.js';
import{deepFreeze,digestValue,fail,isSha256,ok,validId}from'./utils.js';

export function createCompletionOutcome(input:CompletionOutcomeInput,options:OperationOptions):Result<CompletionOutcome>{
 if(!validId(input.outcomeId)||!validId(input.projectId)||!validId(input.lineageId))return fail('COG23_ID_INVALID','Completion outcome requires stable outcome/project/lineage ids.');
 if(input.owner==='M27_ASSURANCE')return fail('COG23_OWNER_NOT_AVAILABLE','M27_ASSURANCE is a reserved future owner and is not executable before M27 exists.');
 if(input.owner!=='EXTERNAL_CANONICAL')return fail('COG23_OWNER_INVALID','Completion outcome owner is not allowed.');
 if(!['ACCEPTED','REJECTED','STALE','CONFLICT','UNKNOWN'].includes(input.state))return fail('COG23_STATE_INVALID','Completion outcome state is invalid.');
 if(!isSha256(input.progressSnapshotDigest)||!isSha256(input.sourceIdentityDigest)||!isSha256(input.validityBindingDigest))return fail('COG23_BINDING_INVALID','Completion outcome requires SHA-256 progress/source/validity bindings.');
 const body={outcomeId:input.outcomeId,owner:input.owner,projectId:input.projectId,lineageId:input.lineageId,progressSnapshotDigest:input.progressSnapshotDigest,state:input.state,sourceIdentityDigest:input.sourceIdentityDigest,validityBindingDigest:input.validityBindingDigest};const d=digestValue(options,'COG23',body);if(!d.ok)return d;return ok(deepFreeze({...body,outcomeDigest:d.value}));
}
export function verifyCompletionOutcome(value:CompletionOutcome,options:OperationOptions):Result<boolean>{const rebuilt=createCompletionOutcome(value,options);return rebuilt.ok?ok(rebuilt.value.outcomeDigest===value.outcomeDigest):rebuilt;}

export function createCompletionProgressWitness(progress:ProgressAdmission,options:OperationOptions):Result<CompletionProgressWitness>{
 let boundary:CompletionProgressWitness['boundary']='UNKNOWN';
 if(progress.completeness==='COMPLETE'){
  if(progress.exactNumerator===0)boundary='ZERO_PROGRESS';
  else if(progress.exactNumerator===progress.exactDenominator)boundary='FULL_PROGRESS';
  else boundary='PARTIAL_PROGRESS';
 }
 const body={snapshotDigest:progress.snapshotDigest,boundary,exactNumerator:progress.exactNumerator,exactDenominator:progress.exactDenominator,completeness:progress.completeness,regressionObserved:progress.regressionObserved};const d=digestValue(options,'CPW23',body);if(!d.ok)return d;return ok(deepFreeze({...body,witnessDigest:d.value}));
}

export function projectRemainingState(progress:CompletionProgressWitness,options:OperationOptions):Result<RemainingStateProjection>{const state:RemainingStateProjection['state']=progress.boundary==='FULL_PROGRESS'?'NONE_REMAINING':progress.boundary==='ZERO_PROGRESS'||progress.boundary==='PARTIAL_PROGRESS'?'HAS_REMAINING':'UNKNOWN';const body={progressWitnessDigest:progress.witnessDigest,state};const d=digestValue(options,'RSP23',body);if(!d.ok)return d;return ok(deepFreeze({...body,projectionDigest:d.value}));}

export function resolveLifecycleStatus(input:LifecycleResolutionInput,options:OperationOptions):Result<LifecycleResolution>{
 let status:LifecycleResolution['status'];const reasons:string[]=[];
 if(input.blockers.conflictConditionIds.length>0){status='CONFLICT';reasons.push('ACTIVE_CONFLICT_CONDITION');}
 else if(input.completionOutcome?.state==='CONFLICT'){status='CONFLICT';reasons.push('COMPLETION_OUTCOME_CONFLICT');}
 else if(input.progress?.completeness==='CONFLICT'){status='CONFLICT';reasons.push('PROGRESS_CONFLICT');}
 else if(input.blockers.recoveryConditionIds.length>0){status='RECOVERY_REQUIRED';reasons.push('ACTIVE_RECOVERY_CONDITION');}
 else if(input.blockers.blockingConditionIds.length>0||input.continuation?.validity==='BLOCKED'){status='BLOCKED';reasons.push(input.blockers.blockingConditionIds.length>0?'ACTIVE_BLOCKING_CONDITION':'CHECKPOINT_BLOCKED');}
 else if(input.continuation===null||input.progress===null||input.progressWitness===null){status='INDETERMINATE';reasons.push('MANDATORY_SOURCE_MISSING');}
 else if(!['VALID','PARTIAL'].includes(input.continuation.validity)&&!input.continuation.ready){status='INDETERMINATE';reasons.push(`CHECKPOINT_${input.continuation.validity}`);}
 else if(input.progress.completeness==='STALE'||input.progress.completeness==='INDETERMINATE'||input.progress.completeness==='PARTIAL_OBSERVATION'){status='INDETERMINATE';reasons.push(`PROGRESS_${input.progress.completeness}`);}
 else if(input.progressWitness.boundary==='FULL_PROGRESS'){
  if(input.completionOutcome!==null&&input.completionOutcome.progressSnapshotDigest!==input.progress.snapshotDigest){status='CONFLICT';reasons.push('COMPLETION_PROGRESS_BINDING_MISMATCH');}
  else if(input.completionOutcome?.state==='ACCEPTED'){status='COMPLETE';reasons.push('FULL_PROGRESS_ACCEPTED');}
  else{status='AWAITING_ACCEPTANCE';reasons.push(input.completionOutcome===null?'COMPLETION_OUTCOME_MISSING':`COMPLETION_${input.completionOutcome.state}`);}
 }
 else if(input.progressWitness.boundary==='ZERO_PROGRESS'&&!input.continuation.hasActiveOrDoneWorkSignal){status='NOT_STARTED';reasons.push('ZERO_PROGRESS_NO_ACTIVE_WORK');}
 else{status='IN_PROGRESS';reasons.push('WORK_REMAINS_OR_ACTIVE');}
 const body={status,reasonCodes:[...new Set(reasons)].sort()};const d=digestValue(options,'LSR23',body);if(!d.ok)return d;return ok(deepFreeze({...body,resolutionDigest:d.value}));
}

export function createCompletionRegressionFence(previousSnapshotDigest:string,previousLifecycle:LifecycleResolution['status'],candidateLifecycle:LifecycleResolution['status'],reopenWitnessDigest:string|null,options:OperationOptions):Result<{readonly allowed:boolean;readonly reason:string;readonly fenceDigest:string}>{
 if(!isSha256(previousSnapshotDigest))return fail('CRF23_PREDECESSOR_INVALID','Completion regression fence requires prior snapshot SHA-256.');
 const reopening=previousLifecycle==='COMPLETE'&&candidateLifecycle!=='COMPLETE';const allowed=!reopening||isSha256(reopenWitnessDigest);const reason=!reopening?'NO_COMPLETE_REOPEN':allowed?'EXPLICIT_REOPEN_WITNESS':'REOPEN_WITNESS_REQUIRED';const body={previousSnapshotDigest,previousLifecycle,candidateLifecycle,reopenWitnessDigest,allowed,reason};const d=digestValue(options,'CRF23',body);if(!d.ok)return d;return ok(deepFreeze({...body,fenceDigest:d.value}));
}
