export type CreditAcceptanceState='ACCEPTED'|'REJECTED'|'STALE'|'CONFLICT'|'UNKNOWN';
export type CreditState='EARNED'|'ZERO'|'QUARANTINED';
export type CompletenessState='COMPLETE'|'PARTIAL_OBSERVATION'|'STALE'|'CONFLICT'|'INDETERMINATE';
export type QueryKind='PROJECT'|'PHASE'|'AREA'|'MODULE';
export type DriftState='CURRENT'|'STALE'|'CONFLICT'|'UNKNOWN';
export type RoundingMode='HALF_UP'|'DOWN';

export interface DigestPort{readonly algorithm:'sha256';digest(input:string):string;}
export interface CancellationPort{isCancelled():boolean;}
export interface OperationOptions{readonly digest:DigestPort;readonly cancellation?:CancellationPort|undefined;readonly maxUnits?:number|undefined;readonly maxNodes?:number|undefined;readonly maxRefs?:number|undefined;}
export interface Diagnostic{readonly code:string;readonly message:string;readonly subject?:string|undefined;}
export type Result<T>={readonly ok:true;readonly value:T}|{readonly ok:false;readonly diagnostics:readonly Diagnostic[]};

export interface ExactFraction{readonly numerator:number;readonly denominator:number;readonly fractionDigest:string;}
export interface DenominatorUnitInput{readonly unitId:string;readonly moduleId:string;readonly areaId:string;readonly phaseId:string;readonly maxWeight:number;readonly dependencyDigests?:readonly string[]|undefined;}
export interface DenominatorUnit extends DenominatorUnitInput{readonly dependencyDigests:readonly string[];readonly unitDigest:string;}
export interface DenominatorManifestInput{readonly projectId:string;readonly lineageDigest:string;readonly epochId:string;readonly scopeDigest:string;readonly dodDigest:string;readonly policyDigest:string;readonly units:readonly DenominatorUnitInput[];readonly excludedUnitIds?:readonly string[]|undefined;}
export interface DenominatorIntegrityManifest{readonly projectId:string;readonly lineageDigest:string;readonly epochId:string;readonly scopeDigest:string;readonly dodDigest:string;readonly policyDigest:string;readonly units:readonly DenominatorUnit[];readonly excludedUnitIds:readonly string[];readonly totalWeight:number;readonly manifestDigest:string;}
export interface ProgressBaselineCapsule{readonly projectId:string;readonly lineageDigest:string;readonly epochId:string;readonly manifestDigest:string;readonly scopeDigest:string;readonly dodDigest:string;readonly policyDigest:string;readonly capsuleDigest:string;}
export interface ProgressAuthorityBoundary{readonly baselineDigest:string;readonly mayMintScope:false;readonly mayDecideEvidence:false;readonly mayEstimateEta:false;readonly mayComputeProjectStatus:false;readonly authority:'CALCULATION_ONLY';readonly boundaryDigest:string;}
export interface ScopeDodBinding{readonly scopeDigest:string;readonly dodDigest:string;readonly bindingDigest:string;}
export interface EvidenceAcceptanceBindingInput{readonly unitId:string;readonly owner:string;readonly state:CreditAcceptanceState;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;}
export interface EvidenceAcceptanceBinding extends EvidenceAcceptanceBindingInput{readonly bindingDigest:string;}
export interface WeightedCreditUnit{readonly unitId:string;readonly moduleId:string;readonly areaId:string;readonly phaseId:string;readonly maxWeight:number;readonly earnedWeight:number;readonly state:CreditState;readonly evidenceBindingDigest:string|null;readonly validityBindingDigest:string|null;readonly creditDigest:string;}
export interface CreditEligibilityResult{readonly credits:readonly WeightedCreditUnit[];readonly missingUnitIds:readonly string[];readonly rejectedUnitIds:readonly string[];readonly gateDigest:string;}
export interface DenominatorMutationWitness{readonly beforeManifestDigest:string;readonly afterManifestDigest:string;readonly beforeEpochId:string;readonly afterEpochId:string;readonly authorizationDigest:string;readonly addedUnitIds:readonly string[];readonly removedUnitIds:readonly string[];readonly reweightedUnitIds:readonly string[];readonly beforeTotalWeight:number;readonly afterTotalWeight:number;readonly witnessDigest:string;}

export interface ProgressQuery{readonly kind:QueryKind;readonly refId:string|null;}
export interface ProgressQueryPlan{readonly query:ProgressQuery;readonly selectedUnitIds:readonly string[];readonly expansionRequired:boolean;readonly planDigest:string;}
export interface CoverageCompletenessWitness{readonly query:ProgressQuery;readonly requiredUnitIds:readonly string[];readonly observedUnitIds:readonly string[];readonly missingUnitIds:readonly string[];readonly state:CompletenessState;readonly witnessDigest:string;}
export interface WeightedProgressVector{readonly manifestDigest:string;readonly epochId:string;readonly query:ProgressQuery;readonly creditDigests:readonly string[];readonly exact:ExactFraction;readonly completeness:CoverageCompletenessWitness;readonly vectorDigest:string;}
export interface ProgressGraphNode{readonly nodeId:string;readonly kind:'PROJECT'|'PHASE'|'AREA'|'MODULE'|'UNIT';readonly refId:string;readonly nodeDigest:string;}
export interface ProgressGraphEdge{readonly parentNodeId:string;readonly childNodeId:string;readonly edgeDigest:string;}
export interface HierarchicalProgressGraph{readonly projectId:string;readonly nodes:readonly ProgressGraphNode[];readonly edges:readonly ProgressGraphEdge[];readonly graphDigest:string;}
export interface AntiDoubleCountLedger{readonly requestedUnitIds:readonly string[];readonly uniqueUnitIds:readonly string[];readonly duplicateUnitIds:readonly string[];readonly ledgerDigest:string;}
export interface ProgressRollup{readonly manifestDigest:string;readonly query:ProgressQuery;readonly exact:ExactFraction;readonly completeness:CoverageCompletenessWitness;readonly antiDoubleCount:AntiDoubleCountLedger;readonly rollupDigest:string;}
export interface PartialCreditAllocation{readonly parentId:string;readonly parentMaxWeight:number;readonly allocations:readonly {readonly unitId:string;readonly maxWeight:number;}[];readonly allocatedWeight:number;readonly remainingWeight:number;readonly allocationDigest:string;}
export interface PresentationPercentage{readonly numerator:number;readonly denominator:number;readonly text:string;readonly decimals:number;readonly roundingMode:RoundingMode;readonly projectionDigest:string;}

export interface CreditDependencyEntry{readonly unitId:string;readonly dependencyDigests:readonly string[];readonly entryDigest:string;}
export interface CreditDependencyGraph{readonly entries:readonly CreditDependencyEntry[];readonly completeKnowledge:boolean;readonly graphDigest:string;}
export interface ProgressInvalidationVector{readonly dependencyGraphDigest:string;readonly changedBindingDigests:readonly string[];readonly affectedUnitIds:readonly string[];readonly widened:boolean;readonly reasonCodes:readonly string[];readonly vectorDigest:string;}
export interface StaleCreditQuarantineEntry{readonly unitId:string;readonly priorCreditDigest:string;readonly reasonCodes:readonly string[];readonly entryDigest:string;}
export interface StaleCreditQuarantine{readonly invalidationVectorDigest:string;readonly entries:readonly StaleCreditQuarantineEntry[];readonly quarantineDigest:string;}
export interface CreditRetractionTransaction{readonly invalidationVectorDigest:string;readonly beforeVectorDigest:string;readonly afterVectorDigest:string;readonly retractedUnitIds:readonly string[];readonly beforeExact:ExactFraction;readonly afterExact:ExactFraction;readonly transactionDigest:string;}
export interface ProgressBindingObservation{readonly projectId:string;readonly lineageDigest:string;readonly manifestDigest:string;readonly epochId:string;readonly scopeDigest:string;readonly dodDigest:string;readonly evidenceSetDigest:string;}
export interface ProgressDriftReport{readonly snapshotDigest:string;readonly state:DriftState;readonly staleSubjects:readonly string[];readonly reportDigest:string;}
export interface DenominatorDriftDecision{readonly snapshotDigest:string;readonly currentManifestDigest:string;readonly witnessDigest:string|null;readonly sameEpoch:boolean;readonly comparisonAllowed:boolean;readonly snapshotReusable:boolean;readonly reason:string;readonly decisionDigest:string;}
export interface ProgressSplitBrainWitness{readonly samePredecessor:boolean;readonly divergent:boolean;readonly snapshotDigests:readonly string[];readonly witnessDigest:string;}
export interface ProgressRegressionReceipt{readonly transactionDigest:string;readonly beforeSnapshotDigest:string;readonly afterSnapshotDigest:string;readonly beforeExact:ExactFraction;readonly afterExact:ExactFraction;readonly retractedUnitIds:readonly string[];readonly reasonCodes:readonly string[];readonly receiptDigest:string;}

export interface ProgressCompletenessEnvelope{readonly state:CompletenessState;readonly requiredUnitCount:number;readonly observedUnitCount:number;readonly missingUnitIds:readonly string[];readonly quarantinedUnitIds:readonly string[];readonly envelopeDigest:string;}
export interface ProgressSnapshotInput{readonly baseline:ProgressBaselineCapsule;readonly vector:WeightedProgressVector;readonly graph:HierarchicalProgressGraph;readonly credits:readonly WeightedCreditUnit[];readonly evidenceSetDigest:string;readonly quarantinedUnitIds?:readonly string[]|undefined;readonly predecessorSemanticDigest?:string|null|undefined;}
export interface ProgressSnapshotCapsule{readonly projectId:string;readonly lineageDigest:string;readonly manifestDigest:string;readonly epochId:string;readonly scopeDigest:string;readonly dodDigest:string;readonly query:ProgressQuery;readonly evidenceSetDigest:string;readonly exact:ExactFraction;readonly completeness:ProgressCompletenessEnvelope;readonly creditDigests:readonly string[];readonly graphDigest:string;readonly predecessorSemanticDigest:string|null;readonly semanticDigest:string;readonly snapshotDigest:string;}
export interface ProgressIntegrityReceipt{readonly snapshotDigest:string;readonly manifestDigest:string;readonly query:ProgressQuery;readonly graphDigest:string;readonly creditDigests:readonly string[];readonly recomputedExact:ExactFraction;readonly valid:boolean;readonly receiptDigest:string;}
export interface DelegatedProgressMetricHandoff{readonly snapshotDigest:string;readonly metricKey:'project_completion';readonly owner:'M21_PROGRESS';readonly availability:CompletenessState;readonly exactNumerator:number;readonly exactDenominator:number;readonly presentationBasisPoints:number|null;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly handoffDigest:string;}
export interface EstimationBaselineHandoff{readonly owner:'M21_PROGRESS';readonly consumer:'M22_ESTIMATION';readonly snapshotDigests:readonly string[];readonly semanticDigests:readonly string[];readonly handoffDigest:string;}
export interface StatusProgressHandoff{readonly owner:'M21_PROGRESS';readonly consumer:'M23_PROJECT_STATUS';readonly snapshotDigest:string;readonly exact:ExactFraction;readonly completeness:CompletenessState;readonly regressionObserved:boolean;readonly handoffDigest:string;}
export interface ProgressStalenessReport{readonly snapshotDigest:string;readonly stale:boolean;readonly staleSubjects:readonly string[];readonly reportDigest:string;}
