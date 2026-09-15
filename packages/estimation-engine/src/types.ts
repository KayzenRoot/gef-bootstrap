export type AvailabilityState='AVAILABLE'|'NOT_YET_BASELINED'|'STALE'|'CONFLICT'|'INDETERMINATE';
export type ConfidenceLevel='LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';
export type ProgressCompleteness='COMPLETE'|'PARTIAL_OBSERVATION'|'STALE'|'CONFLICT'|'INDETERMINATE';
export type TemporalOwner='M43_TELEMETRY'|'EXTERNAL_CANONICAL';
export type RiskOwner='M43_TELEMETRY'|'EXTERNAL_CANONICAL';
export type BiasState='NONE'|'OPTIMISTIC'|'PESSIMISTIC'|'UNDERCOVERAGE'|'CONFLICT';
export type DriftState='CURRENT'|'DRIFTED'|'STALE'|'CONFLICT';

export interface DigestPort{readonly algorithm:'sha256';digest(input:string):string;}
export interface CancellationPort{isCancelled():boolean;}
export interface OperationOptions{readonly digest:DigestPort;readonly cancellation?:CancellationPort|undefined;readonly maxSamples?:number|undefined;readonly maxHistory?:number|undefined;readonly maxRefs?:number|undefined;}
export interface Diagnostic{readonly code:string;readonly message:string;readonly subject?:string|undefined;}
export type Result<T>={readonly ok:true;readonly value:T}|{readonly ok:false;readonly diagnostics:readonly Diagnostic[]};

export interface ExactRational{readonly numerator:number;readonly denominator:number;readonly rationalDigest:string;}
export interface M21EstimationBaselineHandoff{readonly owner:'M21_PROGRESS';readonly consumer:'M22_ESTIMATION';readonly snapshotDigests:readonly string[];readonly semanticDigests:readonly string[];readonly handoffDigest:string;}
export interface M21ProjectProgressProjection{readonly projectId:string;readonly lineageDigest:string;readonly epochId:string;readonly snapshotDigest:string;readonly semanticDigest:string;readonly predecessorSemanticDigest:string|null;readonly exactNumerator:number;readonly exactDenominator:number;readonly completeness:ProgressCompleteness;}
export interface ProgressAuthorityPort{readonly owner:'M21_PROGRESS';verifyProjectSnapshot(value:M21ProjectProgressProjection):boolean;}

export interface EstimationIntentCapsule{readonly projectId:string;readonly lineageDigest:string;readonly horizon:'PROJECT_REMAINING';readonly baselineHandoffDigest:string;readonly asOfEpochMs:number;readonly outputFamily:'DURATION_INTERVAL';readonly intentDigest:string;}
export interface EstimationAuthorityBoundary{readonly intentDigest:string;readonly authority:'ESTIMATION_ONLY';readonly mayComputeProgress:false;readonly mayComputeProjectStatus:false;readonly mayDecideEvidence:false;readonly mayCollectTelemetry:false;readonly mayTreatWeightAsTime:false;readonly boundaryDigest:string;}
export interface ProgressBaselineAdmission{readonly projectId:string;readonly lineageDigest:string;readonly epochId:string;readonly snapshotDigests:readonly string[];readonly semanticDigests:readonly string[];readonly latestSnapshotDigest:string;readonly latestSemanticDigest:string;readonly admissionDigest:string;}
export interface TemporalObservationInput{readonly observationId:string;readonly owner:TemporalOwner;readonly projectId:string;readonly lineageDigest:string;readonly epochId:string;readonly fromSnapshotDigest:string;readonly toSnapshotDigest:string;readonly elapsedMs:number;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;}
export interface TemporalObservation extends TemporalObservationInput{readonly observationDigest:string;}
export interface TemporalObservationAuthorityIndex{readonly projectId:string;readonly lineageDigest:string;readonly epochId:string;readonly observations:readonly TemporalObservation[];readonly duplicateObservationIds:readonly string[];readonly indexDigest:string;}
export interface BaselineSufficiencyGate{readonly availability:AvailabilityState;readonly independentSampleDigests:readonly string[];readonly sampleCount:number;readonly minimumRequired:3;readonly reasonCodes:readonly string[];readonly gateDigest:string;}
export interface EstimationBindingManifest{readonly baselineAdmissionDigest:string;readonly observationIndexDigest:string;readonly epochId:string;readonly estimationPolicyDigest:string;readonly riskInputDigest:string|null;readonly calibrationEpochDigest:string;readonly bindingDigest:string;}

export interface TemporalProgressSample{readonly sampleId:string;readonly projectId:string;readonly lineageDigest:string;readonly epochId:string;readonly fromSnapshotDigest:string;readonly toSnapshotDigest:string;readonly observationDigest:string;readonly workDelta:ExactRational;readonly elapsedMs:number;readonly throughput:ExactRational;readonly sampleDigest:string;}
export interface SampleNormalizationWitness{readonly acceptedSampleDigests:readonly string[];readonly duplicateSampleDigests:readonly string[];readonly excluded:readonly {readonly sampleDigest:string;readonly reason:string;}[];readonly witnessDigest:string;}
export interface ThroughputWindow{readonly projectId:string;readonly lineageDigest:string;readonly epochId:string;readonly sampleDigests:readonly string[];readonly windowPolicyDigest:string;readonly windowDigest:string;}
export interface ThroughputModel{readonly windowDigest:string;readonly sufficiencyGateDigest:string;readonly sampleCount:number;readonly q1:ExactRational;readonly median:ExactRational;readonly q3:ExactRational;readonly modelDigest:string;}
export interface RemainingWorkVector{readonly snapshotDigest:string;readonly remaining:ExactRational;readonly vectorDigest:string;}
export interface DurationProjection{readonly modelDigest:string;readonly remainingWorkDigest:string;readonly lowerMs:number;readonly baseMs:number;readonly upperMs:number;readonly projectionDigest:string;}

export interface UnknownWorkReserveInput{readonly reserveId:string;readonly owner:'EXTERNAL_CANONICAL';readonly lowerBps:number;readonly baseBps:number;readonly upperBps:number;readonly rationaleDigest:string;}
export interface UnknownWorkReserve extends UnknownWorkReserveInput{readonly reserveDigest:string;}
export interface RiskModifierInput{readonly riskId:string;readonly owner:RiskOwner;readonly basisPoints:number;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;}
export interface RiskModifier extends RiskModifierInput{readonly modifierDigest:string;}
export interface RiskAdjustmentVector{readonly modifiers:readonly RiskModifier[];readonly totalBasisPoints:number;readonly vectorDigest:string;}
export interface ForecastIntervalEnvelope{readonly availability:AvailabilityState;readonly durationProjectionDigest:string|null;readonly riskVectorDigest:string|null;readonly reserveDigest:string|null;readonly lowerMs:number|null;readonly baseMs:number|null;readonly upperMs:number|null;readonly intervalDigest:string;}
export interface ScenarioTriad{readonly intervalDigest:string;readonly optimisticMs:number;readonly baseMs:number;readonly conservativeMs:number;readonly scenarioDigest:string;}
export interface FalsePrecisionDecision{readonly availability:AvailabilityState;readonly confidence:ConfidenceLevel;readonly scalarPresentationAllowed:boolean;readonly reasons:readonly string[];readonly decisionDigest:string;}
export interface DeadlineComparison{readonly intervalDigest:string;readonly asOfEpochMs:number;readonly deadlineEpochMs:number;readonly lowerCompletionEpochMs:number;readonly baseCompletionEpochMs:number;readonly upperCompletionEpochMs:number;readonly deadlineMinusBaseMs:number;readonly comparisonDigest:string;}

export interface ActualOutcomeInput{readonly actualId:string;readonly owner:TemporalOwner;readonly forecastSnapshotDigest:string;readonly actualDurationMs:number;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;}
export interface ActualOutcome extends ActualOutcomeInput{readonly actualDigest:string;}
export interface ForecastForCalibration{readonly snapshotDigest:string;readonly semanticDigest:string;readonly lowerMs:number;readonly baseMs:number;readonly upperMs:number;}
export interface ForecastActualVarianceReceipt{readonly forecastSnapshotDigest:string;readonly actualDigest:string;readonly actualDurationMs:number;readonly lowerMs:number;readonly baseMs:number;readonly upperMs:number;readonly signedErrorMs:number;readonly contained:boolean;readonly receiptDigest:string;}
export interface CalibrationBiasSentinel{readonly state:BiasState;readonly applicableReceiptDigests:readonly string[];readonly optimisticMisses:number;readonly pessimisticMisses:number;readonly outsideInterval:number;readonly sentinelDigest:string;}
export interface ModelDriftSentinel{readonly state:DriftState;readonly reasonCodes:readonly string[];readonly priorModelDigest:string;readonly currentModelDigest:string;readonly sentinelDigest:string;}
export interface RecalibrationEpoch{readonly epochId:string;readonly predecessorEpochDigest:string|null;readonly windowDigest:string;readonly calibrationPolicyDigest:string;readonly triggerDigests:readonly string[];readonly epochDigest:string;}
export interface ForecastRevisionReceipt{readonly beforeSnapshotDigest:string;readonly afterSnapshotDigest:string;readonly predecessorRevisionDigest:string|null;readonly reasonCodes:readonly string[];readonly beforeIntervalDigest:string;readonly afterIntervalDigest:string;readonly receiptDigest:string;}
export interface RevisionReplayGuard{readonly actualDigests:readonly string[];readonly revisionDigests:readonly string[];readonly duplicateActualDigests:readonly string[];readonly duplicateRevisionDigests:readonly string[];readonly splitBrain:boolean;readonly guardDigest:string;}

export interface EstimationConfidenceState{readonly availability:AvailabilityState;readonly confidence:ConfidenceLevel;readonly reasonCodes:readonly string[];readonly stateDigest:string;}
export interface EstimationSnapshotInput{readonly projectId:string;readonly lineageDigest:string;readonly baselineAdmissionDigest:string;readonly bindingManifestDigest:string;readonly asOfEpochMs:number;readonly availability:AvailabilityState;readonly throughputModel:ThroughputModel|null;readonly interval:ForecastIntervalEnvelope|null;readonly scenarios:ScenarioTriad|null;readonly riskVectorDigest:string|null;readonly reserveDigest:string|null;readonly calibrationEpochDigest:string;readonly calibrationReceipts:readonly ForecastActualVarianceReceipt[];readonly bias:CalibrationBiasSentinel;readonly drift:ModelDriftSentinel;readonly estimationPolicyDigest:string;readonly predecessorSnapshotDigest:string|null;}
export interface EstimationSnapshotCapsule{readonly projectId:string;readonly lineageDigest:string;readonly baselineAdmissionDigest:string;readonly bindingManifestDigest:string;readonly asOfEpochMs:number;readonly availability:AvailabilityState;readonly confidence:EstimationConfidenceState;readonly throughputModelDigest:string|null;readonly interval:ForecastIntervalEnvelope|null;readonly scenarios:ScenarioTriad|null;readonly riskVectorDigest:string|null;readonly reserveDigest:string|null;readonly calibrationEpochDigest:string;readonly calibrationReceiptDigests:readonly string[];readonly biasDigest:string;readonly driftDigest:string;readonly estimationPolicyDigest:string;readonly predecessorSnapshotDigest:string|null;readonly semanticDigest:string;readonly snapshotDigest:string;}
export interface EstimationIntegrityReceipt{readonly snapshotDigest:string;readonly semanticDigest:string;readonly recomputedSemanticDigest:string;readonly valid:boolean;readonly receiptDigest:string;}
export interface DelegatedEstimationMetricHandoff{readonly owner:'M22_ESTIMATION';readonly consumer:'M20_RESPONSE';readonly snapshotDigest:string;readonly availability:AvailabilityState;readonly confidence:ConfidenceLevel;readonly lowerMs:number|null;readonly baseMs:number|null;readonly upperMs:number|null;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly handoffDigest:string;}
export interface StatusEstimationHandoff{readonly owner:'M22_ESTIMATION';readonly consumer:'M23_PROJECT_STATUS';readonly snapshotDigest:string;readonly availability:AvailabilityState;readonly confidence:ConfidenceLevel;readonly lowerMs:number|null;readonly baseMs:number|null;readonly upperMs:number|null;readonly revisionObserved:boolean;readonly handoffDigest:string;}
export interface EstimationBindingObservation{readonly baselineAdmissionDigest:string;readonly bindingManifestDigest:string;readonly calibrationEpochDigest:string;readonly estimationPolicyDigest:string;readonly riskVectorDigest:string|null;readonly reserveDigest:string|null;}
export interface EstimationStalenessReport{readonly stale:boolean;readonly staleSubjects:readonly string[];readonly reportDigest:string;}
