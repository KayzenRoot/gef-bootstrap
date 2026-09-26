import type{DodCriterion}from'@gef-bootstrap/scope-dod-engine';
import type{EvidenceAcceptanceBinding}from'@gef-bootstrap/progress-engine';

export type EvidenceKind='TEST'|'SECURITY'|'WORKFLOW'|'REVIEW'|'ARTIFACT'|'BENCHMARK'|'DOCUMENTATION'|'MIGRATION'|'RECOVERY'|'OTHER';
export type EvidenceObservation='PASS'|'FAIL'|'INCONCLUSIVE'|'NOT_APPLICABLE';
export type EvidenceAcceptanceState='ACCEPTED'|'REJECTED'|'STALE'|'CONFLICT'|'UNKNOWN';
export type EvidenceFreshnessState='CURRENT'|'STALE'|'CONFLICT'|'INDETERMINATE';
export type EvidenceSetCompletenessState='COMPLETE'|'PARTIAL'|'CONFLICT'|'INDETERMINATE'|'TRUNCATED';
export type ValidationState='VALID'|'INVALID'|'CONFLICT'|'INDETERMINATE';
export type RootClass='CHECKPOINT'|'DECISION'|'POLICY'|'CONTRACT'|'MODULE_GOVERNANCE'|'EXTERNAL_CANONICAL';
export type RootOwner='M11_DECISION'|'M16_POLICY'|'M17_CHECKPOINT'|'MODULE_GOVERNANCE'|'EXTERNAL_CANONICAL';
export type ExternalIdentityDomain='GIT_COMMIT'|'GIT_TREE'|'PROVIDER_RUN'|'ARTIFACT'|'RUNTIME'|'PLATFORM'|'POLICY'|'OTHER';
export type IdentityDomain='M24_SEMANTIC'|ExternalIdentityDomain;
export type ReceiptSetState='COMPLETE'|'PARTIAL'|'TRUNCATED'|'CONFLICT'|'INDETERMINATE';
export type ReplayGuardState='CLEAR'|'CONFLICT'|'TRUNCATED';

export interface DigestPort{readonly algorithm:'sha256';digest(input:string):string;}
export interface CancellationPort{isCancelled():boolean;}
export interface OperationOptions{readonly digest:DigestPort;readonly cancellation?:CancellationPort|undefined;readonly maxUnits?:number|undefined;readonly maxEvidence?:number|undefined;readonly maxHistory?:number|undefined;}
export interface Diagnostic{readonly code:string;readonly message:string;readonly subject?:string|undefined;}
export type Result<T>={readonly ok:true;readonly value:T}|{readonly ok:false;readonly diagnostics:readonly Diagnostic[]};

export interface EvidenceIntentInput{readonly intentId:string;readonly projectId:string;readonly lineageId:string;readonly subjectKind:string;readonly subjectId:string;readonly claimIds:readonly string[];readonly requestedKinds:readonly EvidenceKind[];}
export interface EvidenceIntentCapsule extends EvidenceIntentInput{readonly intentDigest:string;}
export interface EvidenceAuthorityBoundary{readonly intentDigest:string;readonly authority:'EVIDENCE_VALIDATION_AND_ACCEPTANCE_ONLY';readonly mayCreateProducerTruth:false;readonly mayEvaluateDod:false;readonly mayCalculateProgress:false;readonly mayComputeProjectStatus:false;readonly mayComputeProof:false;readonly mayDecideAssurance:false;readonly mayPromoteCheckpoint:false;readonly boundaryDigest:string;}

export interface AuthorityRootInput{readonly rootId:string;readonly rootClass:RootClass;readonly owner:RootOwner;readonly projectId:string;readonly lineageId:string|null;readonly semanticIdentity:string;readonly validityBindingDigest:string;readonly sourceRef:string;readonly allowedProducerIds:readonly string[];readonly allowedEvidenceKinds:readonly EvidenceKind[];readonly allowedClaimPrefixes:readonly string[];}
export interface AuthorityRoot extends AuthorityRootInput{readonly rootDigest:string;}
export interface AuthorityRootSet{readonly projectId:string;readonly lineageId:string;readonly roots:readonly AuthorityRoot[];readonly duplicateRootDigests:readonly string[];readonly conflictingRootIds:readonly string[];readonly rootSetDigest:string;}

export interface ProducerAuthorityEntryInput{readonly authorityId:string;readonly producerId:string;readonly rootId:string;readonly evidenceKinds:readonly EvidenceKind[];readonly claimPrefixes:readonly string[];readonly sourceIdentityDigest:string;}
export interface ProducerAuthorityEntry extends ProducerAuthorityEntryInput{readonly rootDigest:string;readonly authorityDigest:string;}
export interface SourceAuthorityIndex{readonly projectId:string;readonly lineageId:string;readonly rootSetDigest:string;readonly entries:readonly ProducerAuthorityEntry[];readonly duplicateAuthorityDigests:readonly string[];readonly conflictingAuthorityIds:readonly string[];readonly indexDigest:string;}
export interface ProducerAuthorityDecision{readonly producerId:string;readonly evidenceKind:EvidenceKind;readonly claimIds:readonly string[];readonly authorized:boolean;readonly conflict:boolean;readonly matchedAuthorityDigests:readonly string[];readonly reasonCodes:readonly string[];readonly decisionDigest:string;}

export interface ExternalIdentity{readonly domain:ExternalIdentityDomain;readonly algorithm:string|null;readonly value:string;}
export interface IdentityDescriptor{readonly domain:IdentityDomain;readonly algorithm:string|null;readonly value:string;}
export interface SubjectStateBindingInput{readonly projectId:string;readonly lineageId:string;readonly subjectKind:string;readonly subjectId:string;readonly moduleId:string|null;readonly workOrderId:string|null;readonly checkpointDigest:string|null;readonly baseRevision:ExternalIdentity|null;readonly headRevision:ExternalIdentity|null;readonly treeRevision:ExternalIdentity|null;readonly runtimeIdentity:ExternalIdentity|null;readonly platformIdentity:ExternalIdentity|null;readonly policyDigest:string|null;readonly dependencyDigests:readonly string[];}
export interface SubjectStateBinding extends SubjectStateBindingInput{readonly bindingDigest:string;}
export interface ExactRevisionBinding{readonly subjectBindingDigest:string;readonly baseRevision:ExternalIdentity|null;readonly headRevision:ExternalIdentity|null;readonly treeRevision:ExternalIdentity|null;readonly revisionDigest:string;}

export interface EvidenceReference{readonly refId:string;readonly kind:'OPAQUE'|'PUBLIC_URI_ID'|'ARTIFACT_ID';readonly contentDigest:string;}
export interface PrivacyDecision{readonly safe:boolean;readonly rejectedRefIds:readonly string[];readonly reasonCodes:readonly string[];readonly decisionDigest:string;}
export interface MachineEvidenceItemInput{readonly evidenceId:string;readonly kind:EvidenceKind;readonly producerId:string;readonly subject:SubjectStateBinding;readonly observation:EvidenceObservation;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly claimIds:readonly string[];readonly refs:readonly EvidenceReference[];}
export interface MachineEvidenceItem extends MachineEvidenceItemInput{readonly semanticDigest:string;}
export interface EvidenceClaimMappingEntry{readonly claimId:string;readonly evidenceDigests:readonly string[];}
export interface EvidenceClaimMapping{readonly entries:readonly EvidenceClaimMappingEntry[];readonly mappingDigest:string;}
export interface EvidenceBindingLedger{readonly acceptedItemDigests:readonly string[];readonly duplicateItemDigests:readonly string[];readonly conflictingEvidenceIds:readonly string[];readonly ledgerDigest:string;}
export interface MachineEvidenceManifest{readonly projectId:string;readonly lineageId:string;readonly rootSetDigest:string;readonly authorityIndexDigest:string;readonly items:readonly MachineEvidenceItem[];readonly itemDigests:readonly string[];readonly claimMapping:EvidenceClaimMapping;readonly bindingLedger:EvidenceBindingLedger;readonly manifestDigest:string;}

export interface CompatibilityWitnessInput{readonly witnessId:string;readonly owner:'EXTERNAL_CANONICAL';readonly projectId:string;readonly lineageId:string;readonly fromBindingDigest:string;readonly toBindingDigest:string;readonly claimIds:readonly string[];readonly authorizationDigest:string;}
export interface CompatibilityWitness extends CompatibilityWitnessInput{readonly witnessDigest:string;}
export interface DigestAlgorithmBoundary{readonly descriptor:IdentityDescriptor;readonly valid:boolean;readonly reasonCode:string;readonly boundaryDigest:string;}
export interface BindingIntegrityCertificate{readonly evidenceId:string;readonly evidenceSubjectBindingDigest:string;readonly currentSubjectBindingDigest:string;readonly exact:boolean;readonly translated:boolean;readonly compatibilityWitnessDigest:string|null;readonly mismatchedDimensions:readonly string[];readonly certificateDigest:string;}
export interface MixAndMatchSpliceWitness{readonly itemDigests:readonly string[];readonly mixedProject:boolean;readonly mixedLineage:boolean;readonly mixedSubject:boolean;readonly spliceDetected:boolean;readonly witnessDigest:string;}
export interface ProducerChainEnvelope{readonly evidenceId:string;readonly rootSetDigest:string;readonly authorityIndexDigest:string;readonly authorityDecisionDigest:string;readonly sourceIdentityDigest:string;readonly itemDigest:string;readonly chainDigest:string;}
export interface CrossBoundaryDecision{readonly evidenceId:string;readonly allowed:boolean;readonly compatibilityWitnessDigest:string|null;readonly reasonCodes:readonly string[];readonly decisionDigest:string;}
export interface EvidenceSemanticDigest{readonly evidenceId:string;readonly semanticDigest:string;}

export interface EvidenceValidationReceipt{readonly evidenceId:string;readonly itemDigest:string;readonly manifestDigest:string;readonly authorityDecisionDigest:string;readonly producerChainDigest:string;readonly bindingCertificateDigest:string;readonly privacyDecisionDigest:string;readonly state:ValidationState;readonly reasonCodes:readonly string[];readonly receiptDigest:string;}
export interface EvidenceAcceptanceReceipt{readonly evidenceId:string;readonly state:'ACCEPTED';readonly validationReceiptDigest:string;readonly freshnessGateDigest:string;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly claimIds:readonly string[];readonly receiptDigest:string;}
export interface EvidenceRejectionReceipt{readonly evidenceId:string;readonly state:'REJECTED';readonly validationReceiptDigest:string;readonly reasonCodes:readonly string[];readonly receiptDigest:string;}
export interface EvidenceStalenessReceipt{readonly evidenceId:string;readonly state:'STALE';readonly priorAcceptanceReceiptDigest:string|null;readonly freshnessGateDigest:string;readonly staleSubjects:readonly string[];readonly receiptDigest:string;}
export interface EvidenceConflictReceipt{readonly evidenceId:string;readonly state:'CONFLICT';readonly sourceReceiptDigests:readonly string[];readonly conflictSubjects:readonly string[];readonly receiptDigest:string;}
export type EvidenceDecisionReceipt=EvidenceAcceptanceReceipt|EvidenceRejectionReceipt|EvidenceStalenessReceipt|EvidenceConflictReceipt;
export interface EvidenceReceiptSet{readonly receiptDigests:readonly string[];readonly evidenceIds:readonly string[];readonly state:ReceiptSetState;readonly historyTruncated:boolean;readonly processedCount:number;readonly totalCount:number;readonly setDigest:string;}
export interface ReceiptReplayGuard{readonly state:ReplayGuardState;readonly acceptedReceiptDigests:readonly string[];readonly duplicateReceiptDigests:readonly string[];readonly conflictingEvidenceIds:readonly string[];readonly historyTruncated:boolean;readonly processedCount:number;readonly totalCount:number;readonly guardDigest:string;}
export interface EvidenceInvalidationReceipt{readonly invalidationId:string;readonly changedDependencyDigests:readonly string[];readonly affectedEvidenceIds:readonly string[];readonly affectedClaimIds:readonly string[];readonly widened:boolean;readonly priorReceiptDigests:readonly string[];readonly receiptDigest:string;}

export interface EvidenceFreshnessObservation{readonly rootSetDigest:string|null;readonly authorityIndexDigest:string|null;readonly subjectBindingDigest:string|null;readonly sourceIdentityDigest:string|null;readonly validityBindingDigest:string|null;readonly conflictSubjects:readonly string[];}
export interface EvidenceFreshnessGate{readonly evidenceId:string;readonly state:EvidenceFreshnessState;readonly staleSubjects:readonly string[];readonly conflictSubjects:readonly string[];readonly gateDigest:string;}
export interface EvidenceCompletenessGate{readonly requiredEvidenceIds:readonly string[];readonly observedEvidenceIds:readonly string[];readonly missingEvidenceIds:readonly string[];readonly state:EvidenceSetCompletenessState;readonly truncated:boolean;readonly gateDigest:string;}
export interface OwnerAuthorityGuard{readonly evidenceId:string;readonly authorized:boolean;readonly conflict:boolean;readonly authorityDecisionDigest:string;readonly reasonCodes:readonly string[];readonly guardDigest:string;}
export interface EvidenceDependencyEntry{readonly evidenceId:string;readonly claimIds:readonly string[];readonly dependencyDigests:readonly string[];}
export interface DependencyInvalidationDetector{readonly changedDependencyDigests:readonly string[];readonly affectedEvidenceIds:readonly string[];readonly affectedClaimIds:readonly string[];readonly widened:boolean;readonly completeKnowledge:boolean;readonly detectorDigest:string;}
export interface EvidenceSplitBrainWitness{readonly evidenceId:string;readonly receiptDigests:readonly string[];readonly divergentStates:readonly EvidenceAcceptanceState[];readonly splitBrain:boolean;readonly witnessDigest:string;}
export interface EvidenceAcceptanceContract{readonly binding:EvidenceAcceptanceBinding;readonly decisionReceiptDigest:string;readonly contractDigest:string;}
export interface DownstreamProofContextHandoff{readonly owner:'M24_EVIDENCE';readonly consumer:'M25_PROOF'|'M27_ASSURANCE';readonly manifestDigest:string;readonly acceptedEvidenceDigests:readonly string[];readonly rejectedEvidenceDigests:readonly string[];readonly staleEvidenceDigests:readonly string[];readonly conflictEvidenceDigests:readonly string[];readonly unknownEvidenceDigests:readonly string[];readonly claimMappingDigest:string;readonly receiptSetDigest:string;readonly unresolvedClaimIds:readonly string[];readonly mayComputeProof:false;readonly mayDecideAssurance:false;readonly handoffDigest:string;}
export interface DodEvidenceValidationEntry{readonly criterionId:string;readonly originalStatus:DodCriterion['status'];readonly evidenceRefs:readonly string[];readonly acceptedEvidenceRefs:readonly string[];readonly invalidEvidenceRefs:readonly string[];readonly state:'CURRENT'|'GAP'|'CONFLICT'|'INDETERMINATE';}
export interface DodEvidenceValidationContext{readonly entries:readonly DodEvidenceValidationEntry[];readonly originalCriteriaDigest:string;readonly contextDigest:string;}

export interface EvidenceEvaluationInput{readonly intent:EvidenceIntentCapsule;readonly rootSet:AuthorityRootSet;readonly authorityIndex:SourceAuthorityIndex;readonly manifest:MachineEvidenceManifest;readonly evidenceId:string;readonly currentSubject:SubjectStateBinding;readonly currentFreshness:EvidenceFreshnessObservation;readonly compatibilityWitness:CompatibilityWitness|null;}
export interface EvidenceEvaluationOutput{readonly authority:EvidenceAuthorityBoundary;readonly item:MachineEvidenceItem;readonly ownerGuard:OwnerAuthorityGuard;readonly bindingCertificate:BindingIntegrityCertificate;readonly freshness:EvidenceFreshnessGate;readonly validationReceipt:EvidenceValidationReceipt;readonly acceptanceState:EvidenceAcceptanceState;readonly decisionReceipt:EvidenceDecisionReceipt|null;}
