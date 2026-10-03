import type{ProofComputationInput,ProofSnapshotCapsule}from'@gef-bootstrap/proof-graph';
import type{FindingSeverity,SemanticFinding}from'./types.js';

export type BugProofObservedOutcome='DEFECT_PRESENT'|'DEFECT_ABSENT'|'NOT_RUN';
export type BugProofProbeRole='POSITIVE'|'NEGATIVE';
export type BugProofDisposition='HYPOTHESIS'|'REPRODUCED_DEFECT'|'FALSE_POSITIVE'|'INDETERMINATE';
export type BugProofValidationLevel='L0'|'L1'|'L2'|'L3'|'L4'|'L5';
export type BugProofUncertainty='NONE'|'LOCAL'|'BOUNDARY'|'SYSTEMIC'|'CONFLICT'|'UNKNOWN'|'TRUNCATED';
export type BugProofImpactState='READY'|'WIDENED'|'CORRECTION_REQUIRED'|'BLOCKED'|'INDETERMINATE'|'TRUNCATED';

export interface BugProofProbeInput{
 readonly probeId:string;
 readonly targetId:string;
 readonly evidenceId:string;
 readonly role:BugProofProbeRole;
 readonly expectedOutcome:'DEFECT_PRESENT'|'DEFECT_ABSENT';
 readonly observedOutcome:BugProofObservedOutcome;
}
export interface BugProofSelectionPlan{readonly tests:readonly string[];readonly level:BugProofValidationLevel;readonly uncertainty:BugProofUncertainty;readonly reasons:readonly string[];readonly digest:string;}
export interface BugProofValidationWave{readonly id:string;readonly tests:readonly string[];readonly after:readonly string[];readonly exclusiveResources:readonly string[];}
export interface BugProofTestImpactResult{readonly state:BugProofImpactState;readonly selection:BugProofSelectionPlan;readonly reusableTests:readonly string[];readonly unresolved:readonly string[];readonly waves:readonly BugProofValidationWave[];readonly digest:string;}
export interface BugProofTestImpactHandoff{readonly consumerId:string;readonly candidateDigest:string;readonly resultDigest:string;readonly authority:'READ_ONLY_TEST_IMPACT';readonly digest:string;}
export interface BugProofTestImpactInput{
 readonly candidateDigest:string;
 readonly mapDigest:string;
 readonly policyDigest:string;
 readonly profileDigest:string;
 readonly platform:string;
 readonly requiredLevel:BugProofValidationLevel;
 readonly mandatoryTargetIds:readonly string[];
 readonly finalAssuranceTargetIds:readonly string[];
 readonly result:BugProofTestImpactResult;
 readonly handoff:BugProofTestImpactHandoff;
}
export interface BugProofFalsePositiveInput{readonly priorFinding:SemanticFinding;readonly priorReceipt:BugProofReceipt;readonly rationale:string;readonly evidenceIds:readonly string[];}
export interface BugProofEvaluationInput{
 readonly bugProofId:string;
 readonly requirementClaimId:string;
 readonly invariantClaimId:string;
 readonly hypothesisClaimId:string;
 readonly findingId:string;
 readonly subjectId:string;
 readonly severity:FindingSeverity;
 readonly sourceIdentityDigest:string;
 readonly probes:readonly BugProofProbeInput[];
 readonly computation:ProofComputationInput;
 readonly proofSnapshot:ProofSnapshotCapsule;
 readonly currentProofSnapshotDigest:string;
 readonly testImpact:BugProofTestImpactInput;
 readonly falsePositive?:BugProofFalsePositiveInput;
}
export interface BugProofProbeEvidenceReceipt extends BugProofProbeInput{readonly evidenceSemanticDigest:string;readonly proofState:'PROVEN'|'UNPROVEN'|'STALE'|'CONFLICT'|'INDETERMINATE'|'TRUNCATED';readonly accepted:boolean;}
export interface BugProofReceipt{
 readonly bugProofId:string;readonly hypothesisDigest:string;readonly requirementClaimId:string;readonly invariantClaimId:string;readonly hypothesisClaimId:string;readonly findingId:string;readonly projectId:string;readonly lineageId:string;readonly sourceIdentityDigest:string;readonly proofPolicyDigest:string;
 readonly sourceAuthorityDigest:string;readonly proofSnapshotDigest:string;readonly proofEvaluationDigest:string;readonly m24ContextDigest:string;readonly invalidationVectorDigest:string|null;readonly invalidationChangedDependencyDigests:readonly string[];readonly invalidationKnowledgeComplete:boolean|null;readonly testImpactResultDigest:string;readonly testImpactHandoffDigest:string;
 readonly requirementProofState:'PROVEN'|'UNPROVEN'|'STALE'|'CONFLICT'|'INDETERMINATE'|'TRUNCATED';readonly invariantProofState:'PROVEN'|'UNPROVEN'|'STALE'|'CONFLICT'|'INDETERMINATE'|'TRUNCATED';readonly hypothesisProofState:'PROVEN'|'UNPROVEN'|'STALE'|'CONFLICT'|'INDETERMINATE'|'TRUNCATED';
 readonly testImpactState:BugProofImpactState;readonly testImpactUncertainty:BugProofUncertainty;readonly testImpactValidationLevel:BugProofValidationLevel;readonly testImpactRequiredLevel:BugProofValidationLevel;readonly selectedTargetIds:readonly string[];readonly mandatoryTargetIds:readonly string[];readonly finalAssuranceTargetIds:readonly string[];readonly unresolvedTestIds:readonly string[];
 readonly probeEvidence:readonly BugProofProbeEvidenceReceipt[];readonly disposition:BugProofDisposition;readonly reasonCodes:readonly string[];readonly finding:SemanticFinding;readonly predecessorFindingDigest:string|null;readonly falsePositiveRationale:string|null;readonly falsePositiveEvidenceIds:readonly string[];readonly receiptDigest:string;
}
export type BugProofReplayState='CLEAR'|'CONFLICT'|'TRUNCATED';
export interface BugProofReplayGuard{readonly state:BugProofReplayState;readonly acceptedReceiptDigests:readonly string[];readonly duplicateReceiptDigests:readonly string[];readonly duplicateFindingDigests:readonly string[];readonly doubleCountedEvidenceDigests:readonly string[];readonly conflictingBugProofIds:readonly string[];readonly historyTruncated:boolean;readonly processedCount:number;readonly totalCount:number;readonly guardDigest:string;}
