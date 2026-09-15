import type{EvaluateProjectStatusOutput,OperationOptions,ProjectStatusInput,Result}from'./types.js';
import{createStatusAuthorityBoundary,admitContinuationSource,admitResumeSource,admitProgressSource,admitEstimationSource}from'./s01-authority.js';
import{deriveProjectStatusDecision}from'./s04-readiness.js';
import{createDelegatedProjectStatusHandoff,createProjectStatusIntegrityReceipt,createProjectStatusSnapshot}from'./s05-snapshot.js';
import{deepFreeze,ok}from'./utils.js';

export function evaluateProjectStatus(input:ProjectStatusInput,predecessorSnapshotDigest:string|null,options:OperationOptions):Result<EvaluateProjectStatusOutput>{
 const authority=createStatusAuthorityBoundary(input.intent,options);if(!authority.ok)return authority;
 const continuation=input.continuationSource===null?null:admitContinuationSource(input.intent,input.continuationSource,options);if(continuation!==null&&!continuation.ok)return continuation;
 const resume=input.resumeSource===null?null:admitResumeSource(input.intent,input.resumeSource,options);if(resume!==null&&!resume.ok)return resume;
 const progress=input.progressSource===null?null:admitProgressSource(input.intent,input.progressSource,options);if(progress!==null&&!progress.ok)return progress;
 const estimation=input.estimationSource===null?null:admitEstimationSource(input.intent,input.estimationSource,options);if(estimation!==null&&!estimation.ok)return estimation;
 const decision=deriveProjectStatusDecision(input,options);if(!decision.ok)return decision;
 const snapshot=createProjectStatusSnapshot(input,predecessorSnapshotDigest,options);if(!snapshot.ok)return snapshot;
 const integrity=createProjectStatusIntegrityReceipt(snapshot.value,input,options);if(!integrity.ok)return integrity;
 const handoff=createDelegatedProjectStatusHandoff(snapshot.value,options);if(!handoff.ok)return handoff;
 return ok(deepFreeze({authority:authority.value,continuation:continuation?.value??null,resume:resume?.value??null,progress:progress?.value??null,estimation:estimation?.value??null,decision:decision.value,snapshot:snapshot.value,integrityReceipt:integrity.value,delegatedHandoff:handoff.value}));
}
