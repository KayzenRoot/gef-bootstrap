import type{CanonicalContinuationCapsule,CheckpointFreshnessVector,CheckpointPortabilityEnvelope,ContinuationHandoffContract,ResumeReadinessCertificate}from'@gef-bootstrap/checkpoint-engine';
import type{ResumeReceipt,SafeHandbackContract}from'@gef-bootstrap/resume-engine';
import type{ProgressBindingObservation,ProgressSnapshotCapsule,StatusProgressHandoff}from'@gef-bootstrap/progress-engine';
import type{EstimationBindingManifest,EstimationSnapshotCapsule,StatusEstimationHandoff}from'@gef-bootstrap/estimation-engine';

export type LifecycleStatus='NOT_STARTED'|'IN_PROGRESS'|'AWAITING_ACCEPTANCE'|'BLOCKED'|'RECOVERY_REQUIRED'|'COMPLETE'|'INDETERMINATE'|'CONFLICT';
export type ScheduleHealth='NOT_APPLICABLE'|'UNKNOWN'|'ON_TRACK'|'AT_RISK'|'LATE';
export type ContinuationReadiness='NOT_APPLICABLE'|'READY'|'WAITING'|'REPLAN_REQUIRED'|'BLOCKED'|'RECOVERY_REQUIRED'|'UNKNOWN'|'CONFLICT';
export type RequestedStatusDimension='LIFECYCLE'|'SCHEDULE'|'READINESS';
export type CompletionState='ACCEPTED'|'REJECTED'|'STALE'|'CONFLICT'|'UNKNOWN';
export type CompletionOwner='EXTERNAL_CANONICAL'|'M27_ASSURANCE';
export type ConditionOwner='EXTERNAL_CANONICAL'|'M27_ASSURANCE';
export type ConditionClass='WARNING'|'BLOCKING'|'RECOVERY'|'CONFLICT';
export type ConditionState='ACTIVE'|'RESOLVED';
export type ProgressBoundary='ZERO_PROGRESS'|'PARTIAL_PROGRESS'|'FULL_PROGRESS'|'UNKNOWN';
export type RemainingState='NONE_REMAINING'|'HAS_REMAINING'|'UNKNOWN';
export type HistoryGuardState='CLEAR'|'CONFLICT'|'TRUNCATED';
export type StatusFreshnessState='CURRENT'|'STALE'|'CONFLICT'|'INDETERMINATE';
export type StatusChangedDimension='LIFECYCLE'|'SCHEDULE'|'READINESS'|'NEXT_ACTION';
export type StatusChangedSource='CHECKPOINT'|'RESUME'|'PROGRESS'|'ESTIMATION'|'COMPLETION'|'CONDITIONS';

export interface DigestPort{readonly algorithm:'sha256';digest(input:string):string;}
export interface CancellationPort{isCancelled():boolean;}
export interface OperationOptions{readonly digest:DigestPort;readonly cancellation?:CancellationPort|undefined;readonly maxUnits?:number|undefined;readonly maxHistory?:number|undefined;}
export interface Diagnostic{readonly code:string;readonly message:string;readonly subject?:string|undefined;}
export type Result<T>={readonly ok:true;readonly value:T}|{readonly ok:false;readonly diagnostics:readonly Diagnostic[]};

export interface StatusSourceExpectations{readonly checkpointDigest:string|null;readonly progressHandoffDigest:string|null;readonly estimationHandoffDigest:string|null;readonly resumeHandbackDigest:string|null;readonly completionOutcomeDigest:string|null;readonly conditionDigests:readonly string[];readonly previousConditionIndexDigest:string|null;}
export interface StatusIntentInput{readonly statusId:string;readonly projectId:string;readonly lineageId:string;readonly requestedDimensions:readonly RequestedStatusDimension[];readonly asOfEpochMs:number|null;readonly expected:StatusSourceExpectations;}
export interface StatusIntentCapsule extends StatusIntentInput{readonly intentDigest:string;}
export interface StatusAuthorityBoundary{readonly authority:'PROJECT_STATUS_ONLY';readonly mayPromoteCheckpoint:false;readonly mayDecideResume:false;readonly mayCalculateProgress:false;readonly mayEstimateEta:false;readonly mayAcceptEvidence:false;readonly mayCollectTelemetry:false;readonly mayMutateProvider:false;readonly mayRenderResponse:false;readonly boundaryDigest:string;}

export interface ContinuationSourceInput{readonly checkpoint:CanonicalContinuationCapsule;readonly observedAuthorityIdentities:Readonly<Record<string,string|undefined>>;readonly availableCapabilities:readonly string[];readonly readiness:ResumeReadinessCertificate;readonly handoff:ContinuationHandoffContract;}
export interface ContinuationAdmission{readonly projectId:string;readonly lineageId:string;readonly checkpointDigest:string;readonly handoffDigest:string;readonly readinessCertificateDigest:string;readonly validity:ResumeReadinessCertificate['validity'];readonly ready:boolean;readonly nextLegalAction:string;readonly unresolvedBlockers:readonly string[];readonly capabilityGaps:readonly string[];readonly hasActiveOrDoneWorkSignal:boolean;readonly admissionDigest:string;}
export interface ResumeSourceInput{readonly receipt:ResumeReceipt;readonly handback:SafeHandbackContract;}
export interface ResumeAdmission{readonly status:ResumeReceipt['status'];readonly checkpointDigest:string;readonly nextLegalAction:string|null;readonly blockers:readonly string[];readonly receiptDigest:string;readonly handbackDigest:string;readonly admissionDigest:string;}
export interface ProgressSourceInput{readonly snapshot:ProgressSnapshotCapsule;readonly handoff:StatusProgressHandoff;readonly currentBinding:ProgressBindingObservation;}
export interface ProgressAdmission{readonly projectId:string;readonly lineageDigest:string;readonly snapshotDigest:string;readonly handoffDigest:string;readonly exactNumerator:number;readonly exactDenominator:number;readonly completeness:StatusProgressHandoff['completeness'];readonly regressionObserved:boolean;readonly admissionDigest:string;}
export interface EstimationSourceInput{readonly snapshot:EstimationSnapshotCapsule;readonly binding:EstimationBindingManifest;readonly currentObservationIndexDigest:string;readonly currentThroughputModelDigest:string|null;readonly handoff:StatusEstimationHandoff;}
export interface EstimationAdmission{readonly projectId:string;readonly lineageDigest:string;readonly snapshotDigest:string;readonly handoffDigest:string;readonly availability:StatusEstimationHandoff['availability'];readonly confidence:StatusEstimationHandoff['confidence'];readonly deadlineComparison:StatusEstimationHandoff['deadlineComparison'];readonly revisionDigest:string|null;readonly admissionDigest:string;}

export interface CompletionOutcomeInput{readonly outcomeId:string;readonly owner:CompletionOwner;readonly projectId:string;readonly lineageId:string;readonly progressSnapshotDigest:string;readonly state:CompletionState;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;}
export interface CompletionOutcome extends CompletionOutcomeInput{readonly outcomeDigest:string;}
export interface StatusConditionInput{readonly conditionId:string;readonly owner:ConditionOwner;readonly projectId:string;readonly lineageId:string;readonly checkpointDigest:string;readonly class:ConditionClass;readonly state:ConditionState;readonly reasonCode:string;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly supersedesConditionDigest:string|null;}
export interface StatusCondition extends StatusConditionInput{readonly conditionDigest:string;}
export interface StatusConditionResolution{readonly conditionId:string;readonly priorConditionDigest:string;readonly resolutionConditionDigest:string;}
export interface StatusConditionIndex{readonly projectId:string;readonly lineageId:string;readonly checkpointDigest:string;readonly effectiveConditions:readonly StatusCondition[];readonly carriedForwardConditionIds:readonly string[];readonly resolvedConditionIds:readonly string[];readonly resolutions:readonly StatusConditionResolution[];readonly conflictConditionIds:readonly string[];readonly indexDigest:string;}
export interface BlockerAttributionVector{readonly warningConditionIds:readonly string[];readonly blockingConditionIds:readonly string[];readonly recoveryConditionIds:readonly string[];readonly conflictConditionIds:readonly string[];readonly vectorDigest:string;}
export interface CompletionProgressWitness{readonly snapshotDigest:string;readonly boundary:ProgressBoundary;readonly exactNumerator:number;readonly exactDenominator:number;readonly completeness:ProgressAdmission['completeness'];readonly regressionObserved:boolean;readonly witnessDigest:string;}
export interface RemainingStateProjection{readonly progressWitnessDigest:string;readonly state:RemainingState;readonly projectionDigest:string;}

export interface LifecycleResolutionInput{readonly continuation:ContinuationAdmission|null;readonly progress:ProgressAdmission|null;readonly progressWitness:CompletionProgressWitness|null;readonly completionOutcome:CompletionOutcome|null;readonly blockers:BlockerAttributionVector;}
export interface LifecycleResolution{readonly status:LifecycleStatus;readonly reasonCodes:readonly string[];readonly resolutionDigest:string;}
export interface ReadinessResolutionInput{readonly lifecycle:LifecycleStatus;readonly continuation:ContinuationAdmission|null;readonly resume:ResumeAdmission|null;readonly blockers:BlockerAttributionVector;}
export interface ReadinessResolution{readonly status:ContinuationReadiness;readonly nextLegalAction:string|null;readonly reasonCodes:readonly string[];readonly resolutionDigest:string;}
export interface ScheduleResolutionInput{readonly requested:boolean;readonly estimation:EstimationAdmission|null;}
export interface ScheduleResolution{readonly status:ScheduleHealth;readonly reasonCodes:readonly string[];readonly resolutionDigest:string;}
export interface ProjectStatusDecision{readonly lifecycle:LifecycleResolution;readonly schedule:ScheduleResolution;readonly readiness:ReadinessResolution;readonly remaining:RemainingStateProjection|null;readonly conditionIndex:StatusConditionIndex;readonly blockers:BlockerAttributionVector;readonly decisionDigest:string;}
export interface ProjectStatusInput{readonly intent:StatusIntentCapsule;readonly continuationSource:ContinuationSourceInput|null;readonly resumeSource:ResumeSourceInput|null;readonly progressSource:ProgressSourceInput|null;readonly estimationSource:EstimationSourceInput|null;readonly completionOutcome:CompletionOutcome|null;readonly currentConditions:readonly StatusCondition[];readonly previousConditionIndex:StatusConditionIndex|null;}

export interface ProjectStatusSnapshot{
 readonly projectId:string;readonly lineageId:string;readonly intentDigest:string;readonly decisionDigest:string;
 readonly checkpointDigest:string|null;readonly checkpointReadinessCertificateDigest:string|null;readonly continuationHandoffDigest:string|null;
 readonly resumeReceiptDigest:string|null;readonly resumeHandbackDigest:string|null;
 readonly progressSnapshotDigest:string|null;readonly progressHandoffDigest:string|null;
 readonly estimationSnapshotDigest:string|null;readonly estimationHandoffDigest:string|null;
 readonly completionOutcomeDigest:string|null;readonly completionOutcomeState:CompletionState|'ABSENT';readonly conditionIndexDigest:string;
 readonly lifecycleStatus:LifecycleStatus;readonly scheduleHealth:ScheduleHealth;readonly continuationReadiness:ContinuationReadiness;readonly nextLegalAction:string|null;
 readonly blockingConditionIds:readonly string[];readonly recoveryConditionIds:readonly string[];readonly conflictConditionIds:readonly string[];readonly reasonCodeTrace:readonly string[];
 readonly predecessorSnapshotDigest:string|null;readonly predecessorSemanticDigest:string|null;readonly validityBindingDigest:string;readonly semanticDigest:string;readonly snapshotDigest:string;
}
export interface ProjectStatusIntegrityReceipt{readonly snapshotDigest:string;readonly recomputedDecisionDigest:string;readonly recomputedSemanticDigest:string;readonly recomputedValidityBindingDigest:string;readonly valid:boolean;readonly receiptDigest:string;}
export interface ProjectStatusSemanticDigest{readonly snapshotDigest:string;readonly semanticDigest:string;}
export interface StatusReopenWitnessInput{readonly witnessId:string;readonly owner:'EXTERNAL_CANONICAL'|'M27_ASSURANCE';readonly priorCompleteSnapshotDigest:string;readonly authorizationFactDigest:string;readonly reasonCode:string;}
export interface StatusReopenWitness extends StatusReopenWitnessInput{readonly witnessDigest:string;}
export interface StatusTransitionRecord{
 readonly predecessorSnapshotDigest:string|null;readonly successorSnapshotDigest:string;readonly predecessorSemanticDigest:string|null;readonly successorSemanticDigest:string;
 readonly predecessorLifecycle:LifecycleStatus|null;readonly successorLifecycle:LifecycleStatus;readonly predecessorSchedule:ScheduleHealth|null;readonly successorSchedule:ScheduleHealth;
 readonly predecessorReadiness:ContinuationReadiness|null;readonly successorReadiness:ContinuationReadiness;readonly changedDimensions:readonly StatusChangedDimension[];
 readonly reasonCodes:readonly string[];readonly changedSourceIdentities:readonly StatusChangedSource[];readonly reopenWitnessDigest:string|null;readonly transitionDigest:string;
}
export interface StatusHistoryGuard{readonly state:HistoryGuardState;readonly acceptedTransitionDigests:readonly string[];readonly duplicateTransitionDigests:readonly string[];readonly splitBrainPredecessorDigests:readonly string[];readonly historyTruncated:boolean;readonly processedTransitionCount:number;readonly totalTransitionCount:number;readonly guardDigest:string;}
export interface DelegatedProjectStatusHandoff{readonly owner:'M23_PROJECT_STATUS';readonly consumer:'M20_RESPONSE';readonly snapshotDigest:string;readonly semanticDigest:string;readonly lifecycleStatus:LifecycleStatus;readonly scheduleHealth:ScheduleHealth;readonly continuationReadiness:ContinuationReadiness;readonly nextLegalAction:string|null;readonly reasonCodes:readonly string[];readonly validityBindingDigest:string;readonly handoffDigest:string;}
export interface StatusFreshnessObservation{readonly checkpointDigest:string|null;readonly checkpointReadinessCertificateDigest:string|null;readonly continuationHandoffDigest:string|null;readonly resumeHandbackDigest:string|null;readonly progressHandoffDigest:string|null;readonly estimationHandoffDigest:string|null;readonly completionOutcomeDigest:string|null;readonly conditionIndexDigest:string|null;}
export interface StatusFreshnessGate{readonly snapshotDigest:string;readonly state:StatusFreshnessState;readonly reusable:boolean;readonly staleSubjects:readonly string[];readonly conflictSubjects:readonly string[];readonly indeterminateSubjects:readonly string[];readonly gateDigest:string;}
export interface EvaluateProjectStatusOutput{readonly authority:StatusAuthorityBoundary;readonly continuation:ContinuationAdmission|null;readonly resume:ResumeAdmission|null;readonly progress:ProgressAdmission|null;readonly estimation:EstimationAdmission|null;readonly decision:ProjectStatusDecision;readonly snapshot:ProjectStatusSnapshot;readonly integrityReceipt:ProjectStatusIntegrityReceipt;readonly delegatedHandoff:DelegatedProjectStatusHandoff;}
export type UpstreamCheckpointFreshness=CheckpointFreshnessVector;
export type UpstreamCheckpointPortability=CheckpointPortabilityEnvelope;
