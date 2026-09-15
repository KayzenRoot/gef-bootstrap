import {
  buildCheckpointFreshnessVector,
  buildCheckpointPortabilityEnvelope,
  buildContinuationHandoffContract,
  buildResumeReadinessCertificate,
  verifyCanonicalContinuationCapsule,
} from '@gef-bootstrap/checkpoint-engine';
import { verifyResumeReceipt } from '@gef-bootstrap/resume-engine';
import { createStatusProgressHandoff, detectProgressStaleness, verifyProgressSnapshotCapsule } from '@gef-bootstrap/progress-engine';
import { verifyEstimationSnapshotCapsule, verifyStatusEstimationHandoff } from '@gef-bootstrap/estimation-engine';
import type {
  ContinuationAdmission,
  ContinuationSourceInput,
  EstimationAdmission,
  EstimationSourceInput,
  OperationOptions,
  ProgressAdmission,
  ProgressSourceInput,
  RequestedStatusDimension,
  Result,
  ResumeAdmission,
  ResumeSourceInput,
  StatusAuthorityBoundary,
  StatusIntentCapsule,
  StatusIntentInput,
} from './types.js';
import { deepFreeze, digestPlain, digestValue, fail, ok, sameCanonical, safeEpoch, sortedUnique, validId } from './utils.js';

const DIMENSIONS:readonly RequestedStatusDimension[]=['LIFECYCLE','SCHEDULE','READINESS'];
function validExpected(value:string|null){return value===null||/^sha256:[0-9a-f]{64}$/.test(value);}
function sourceExpectation(intent:StatusIntentCapsule,key:'checkpointDigest'|'progressHandoffDigest'|'estimationHandoffDigest'|'resumeHandbackDigest',actual:string|null):Result<true>{const expected=intent.expected[key];if(expected===null&&actual===null)return ok(true);if(expected===null||actual===null||expected!==actual)return fail('SIC23_SOURCE_EXPECTATION_MISMATCH',`Status intent expected ${String(key)} does not match supplied source.`,String(key));return ok(true);}

export function createStatusIntentCapsule(input:StatusIntentInput,options:OperationOptions):Result<StatusIntentCapsule>{
 if(!validId(input.statusId)||!validId(input.projectId)||!validId(input.lineageId))return fail('SIC23_ID_INVALID','Status intent requires stable status/project/lineage ids.');
 const dims=sortedUnique(input.requestedDimensions) as RequestedStatusDimension[];
 if(dims.length===0||dims.some(d=>!DIMENSIONS.includes(d)))return fail('SIC23_DIMENSION_INVALID','Status intent requires known requested dimensions.');
 if(!safeEpoch(input.asOfEpochMs))return fail('SIC23_AS_OF_INVALID','asOfEpochMs must be null or a non-negative safe integer.');
 const wantsSchedule=dims.includes('SCHEDULE');
 if(wantsSchedule&&input.asOfEpochMs===null)return fail('SIC23_AS_OF_REQUIRED','Schedule interpretation requires explicit asOfEpochMs.');
 if(!wantsSchedule&&input.asOfEpochMs!==null)return fail('SIC23_AS_OF_UNEXPECTED','asOfEpochMs is accepted only when schedule interpretation is requested.');
 const expected={...input.expected,conditionDigests:sortedUnique(input.expected.conditionDigests)};
 if(!validExpected(expected.checkpointDigest)||!validExpected(expected.progressHandoffDigest)||!validExpected(expected.estimationHandoffDigest)||!validExpected(expected.resumeHandbackDigest)||!validExpected(expected.completionOutcomeDigest)||!validExpected(expected.previousConditionIndexDigest)||expected.conditionDigests.some(v=>!validExpected(v)))return fail('SIC23_EXPECTATION_INVALID','Expected source identities must be null/SHA-256 and condition identities must be SHA-256 digests.');
 if(expected.checkpointDigest===null||expected.progressHandoffDigest===null)return fail('SIC23_MANDATORY_EXPECTATION_REQUIRED','M17 checkpoint and M21 progress handoff expectations are mandatory identities.');
 const body={statusId:input.statusId,projectId:input.projectId,lineageId:input.lineageId,requestedDimensions:dims,asOfEpochMs:input.asOfEpochMs,expected};
 const d=digestValue(options,'SIC23',body);if(!d.ok)return d;
 return ok(deepFreeze({...body,intentDigest:d.value}));
}

export function verifyStatusIntentCapsule(intent:StatusIntentCapsule,options:OperationOptions):Result<boolean>{const rebuilt=createStatusIntentCapsule(intent,options);return rebuilt.ok?ok(rebuilt.value.intentDigest===intent.intentDigest):rebuilt;}

export function createStatusAuthorityBoundary(intent:StatusIntentCapsule,options:OperationOptions):Result<StatusAuthorityBoundary>{const v=verifyStatusIntentCapsule(intent,options);if(!v.ok||!v.value)return v.ok?fail('SAB23_INTENT_TAMPERED','Status authority requires verified intent.'):v;const body={authority:'PROJECT_STATUS_ONLY' as const,mayPromoteCheckpoint:false as const,mayDecideResume:false as const,mayCalculateProgress:false as const,mayEstimateEta:false as const,mayAcceptEvidence:false as const,mayCollectTelemetry:false as const,mayMutateProvider:false as const,mayRenderResponse:false as const};const d=digestValue(options,'SAB23',{intentDigest:intent.intentDigest,...body});if(!d.ok)return d;return ok(deepFreeze({...body,boundaryDigest:d.value}));}

export function admitContinuationSource(intent:StatusIntentCapsule,source:ContinuationSourceInput,options:OperationOptions):Result<ContinuationAdmission>{
 const iv=verifyStatusIntentCapsule(intent,options);if(!iv.ok||!iv.value)return iv.ok?fail('CAG23_INTENT_TAMPERED','Continuation admission requires verified intent.'):iv;
 const cv=verifyCanonicalContinuationCapsule(source.checkpoint,{digest:options.digest,cancellation:options.cancellation});if(!cv.ok)return{ok:false,diagnostics:cv.diagnostics};
 if(source.checkpoint.projectId!==intent.projectId||source.checkpoint.lineageId!==intent.lineageId)return fail('CAG23_PROJECT_LINEAGE_MISMATCH','Checkpoint does not match status intent project/lineage.');
 const se=sourceExpectation(intent,'checkpointDigest',source.checkpoint.checkpointDigest);if(!se.ok)return se;
 const freshness=buildCheckpointFreshnessVector(source.checkpoint,source.observedAuthorityIdentities,{digest:options.digest,cancellation:options.cancellation});if(!freshness.ok)return{ok:false,diagnostics:freshness.diagnostics};
 const portability=buildCheckpointPortabilityEnvelope(source.checkpoint,source.availableCapabilities,{digest:options.digest,cancellation:options.cancellation});if(!portability.ok)return{ok:false,diagnostics:portability.diagnostics};
 const expectedReadiness=buildResumeReadinessCertificate(source.checkpoint,freshness.value,portability.value,{digest:options.digest,cancellation:options.cancellation});if(!expectedReadiness.ok)return{ok:false,diagnostics:expectedReadiness.diagnostics};
 if(!sameCanonical(expectedReadiness.value,source.readiness))return fail('CAG23_READINESS_MISMATCH','Readiness certificate does not recompute from current checkpoint freshness/capabilities.');
 const expectedHandoff=buildContinuationHandoffContract(source.checkpoint,source.readiness,{digest:options.digest,cancellation:options.cancellation});if(!expectedHandoff.ok)return{ok:false,diagnostics:expectedHandoff.diagnostics};
 if(!sameCanonical(expectedHandoff.value,source.handoff))return fail('CAG23_HANDOFF_MISMATCH','Continuation handoff does not bind the admitted checkpoint/readiness.');
 const body={projectId:source.checkpoint.projectId,lineageId:source.checkpoint.lineageId,checkpointDigest:source.checkpoint.checkpointDigest,handoffDigest:source.handoff.handoffDigest,readinessCertificateDigest:source.readiness.certificateDigest,validity:source.readiness.validity,ready:source.readiness.ready,nextLegalAction:source.checkpoint.nextLegalAction,unresolvedBlockers:[...source.readiness.unresolvedBlockers].sort(),capabilityGaps:[...source.readiness.requiredCapabilityGaps].sort(),hasActiveOrDoneWorkSignal:source.checkpoint.claims.some(c=>c.status==='ACTIVE'||c.status==='DONE')};
 const d=digestValue(options,'CAG23',body);if(!d.ok)return d;return ok(deepFreeze({...body,admissionDigest:d.value}));
}

export function admitResumeSource(intent:StatusIntentCapsule,source:ResumeSourceInput,options:OperationOptions):Result<ResumeAdmission>{
 const iv=verifyStatusIntentCapsule(intent,options);if(!iv.ok||!iv.value)return iv.ok?fail('RAG23_INTENT_TAMPERED','Resume admission requires verified intent.'):iv;
 const rv=verifyResumeReceipt(source.receipt,{digest:options.digest,cancellation:options.cancellation});if(!rv.ok)return{ok:false,diagnostics:rv.diagnostics};
 const handbackBody={status:source.handback.status,checkpointDigest:source.handback.checkpointDigest,nextLegalAction:source.handback.nextLegalAction,blockers:source.handback.blockers,receiptDigest:source.handback.receiptDigest};
 const hd=digestPlain(options,handbackBody);if(!hd.ok)return hd;
 if(hd.value!==source.handback.handbackDigest)return fail('RAG23_HANDBACK_TAMPERED','Resume handback digest does not match semantic payload.');
 if(source.handback.receiptDigest!==source.receipt.receiptDigest||source.handback.status!==source.receipt.status||source.handback.checkpointDigest!==source.receipt.checkpointDigest)return fail('RAG23_RECEIPT_MISMATCH','Resume handback does not bind the verified receipt.');
 if(source.handback.status==='READY'){
  if(source.handback.nextLegalAction===null||source.receipt.nextAction!==source.handback.nextLegalAction)return fail('RAG23_READY_ACTION_MISMATCH','READY resume handback must preserve the receipt next action.');
 }else if(source.handback.nextLegalAction!==null)return fail('RAG23_NONREADY_ACTION_INVALID','Non-READY resume handback cannot grant a next legal action.');
 const se=sourceExpectation(intent,'resumeHandbackDigest',source.handback.handbackDigest);if(!se.ok)return se;
 const body={status:source.receipt.status,checkpointDigest:source.receipt.checkpointDigest,nextLegalAction:source.handback.nextLegalAction,blockers:[...source.handback.blockers].sort(),receiptDigest:source.receipt.receiptDigest,handbackDigest:source.handback.handbackDigest};const d=digestValue(options,'RAG23',body);if(!d.ok)return d;return ok(deepFreeze({...body,admissionDigest:d.value}));
}

export function admitProgressSource(intent:StatusIntentCapsule,source:ProgressSourceInput,options:OperationOptions):Result<ProgressAdmission>{
 const iv=verifyStatusIntentCapsule(intent,options);if(!iv.ok||!iv.value)return iv.ok?fail('PHG23_INTENT_TAMPERED','Progress admission requires verified intent.'):iv;
 const sv=verifyProgressSnapshotCapsule(source.snapshot,{digest:options.digest,cancellation:options.cancellation,maxUnits:options.maxUnits});if(!sv.ok||!sv.value)return sv.ok?fail('PHG23_SNAPSHOT_TAMPERED','Progress snapshot failed independent verification.'):sv;
 if(source.snapshot.projectId!==intent.projectId)return fail('PHG23_PROJECT_MISMATCH','Progress snapshot project does not match status intent.');
 const stale=detectProgressStaleness(source.snapshot,source.currentBinding,{digest:options.digest,cancellation:options.cancellation,maxUnits:options.maxUnits});if(!stale.ok)return stale;if(stale.value.stale)return fail('PHG23_STALE','Progress snapshot is stale against current binding.',stale.value.staleSubjects.join(','));
 const expected=createStatusProgressHandoff(source.snapshot,source.handoff.regressionObserved,{digest:options.digest,cancellation:options.cancellation,maxUnits:options.maxUnits});if(!expected.ok)return expected;
 if(!sameCanonical(expected.value,source.handoff))return fail('PHG23_HANDOFF_MISMATCH','Progress handoff does not bind the verified current project snapshot.');
 const se=sourceExpectation(intent,'progressHandoffDigest',source.handoff.handoffDigest);if(!se.ok)return se;
 const body={projectId:source.snapshot.projectId,lineageDigest:source.snapshot.lineageDigest,snapshotDigest:source.snapshot.snapshotDigest,handoffDigest:source.handoff.handoffDigest,exactNumerator:source.handoff.exact.numerator,exactDenominator:source.handoff.exact.denominator,completeness:source.handoff.completeness,regressionObserved:source.handoff.regressionObserved};const d=digestValue(options,'PHG23',body);if(!d.ok)return d;return ok(deepFreeze({...body,admissionDigest:d.value}));
}

export function admitEstimationSource(intent:StatusIntentCapsule,source:EstimationSourceInput,options:OperationOptions):Result<EstimationAdmission>{
 const iv=verifyStatusIntentCapsule(intent,options);if(!iv.ok||!iv.value)return iv.ok?fail('EHG23_INTENT_TAMPERED','Estimation admission requires verified intent.'):iv;
 const sv=verifyEstimationSnapshotCapsule(source.snapshot,source.binding,source.currentObservationIndexDigest,source.currentThroughputModelDigest,{digest:options.digest,cancellation:options.cancellation,maxUnits:options.maxUnits});if(!sv.ok||!sv.value)return sv.ok?fail('EHG23_SNAPSHOT_TAMPERED','Estimation snapshot failed exact current-binding verification.'):sv;
 const hv=verifyStatusEstimationHandoff(source.handoff,source.snapshot,{digest:options.digest,cancellation:options.cancellation,maxUnits:options.maxUnits});if(!hv.ok||!hv.value)return hv.ok?fail('EHG23_HANDOFF_TAMPERED','Estimation handoff failed exact snapshot verification.'):hv;
 if(source.snapshot.projectId!==intent.projectId)return fail('EHG23_PROJECT_MISMATCH','Estimation snapshot project does not match status intent.');
 if(intent.requestedDimensions.includes('SCHEDULE')&&intent.asOfEpochMs!==source.snapshot.asOfEpochMs)return fail('EHG23_AS_OF_MISMATCH','Schedule status must use the exact admitted M22 as-of value.');
 const se=sourceExpectation(intent,'estimationHandoffDigest',source.handoff.handoffDigest);if(!se.ok)return se;
 const body={projectId:source.snapshot.projectId,lineageDigest:source.snapshot.lineageDigest,snapshotDigest:source.snapshot.snapshotDigest,handoffDigest:source.handoff.handoffDigest,availability:source.handoff.availability,confidence:source.handoff.confidence,deadlineComparison:source.handoff.deadlineComparison,revisionDigest:source.handoff.revisionDigest};const d=digestValue(options,'EHG23',body);if(!d.ok)return d;return ok(deepFreeze({...body,admissionDigest:d.value}));
}
