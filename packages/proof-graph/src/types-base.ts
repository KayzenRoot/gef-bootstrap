import type{DownstreamProofContextHandoff,EvidenceEvaluationInput,EvidenceAcceptanceState,TrustedOperationOptions}from'@gef-bootstrap/evidence-engine';
export type ProofState='PROVEN'|'UNPROVEN'|'STALE'|'CONFLICT'|'INDETERMINATE'|'TRUNCATED';
export type ProofNodeKind='CLAIM'|'OBLIGATION'|'EVIDENCE';
export type ProofEdgeKind='CLAIM_REQUIRES_OBLIGATION'|'OBLIGATION_REQUIRES_EVIDENCE'|'OBLIGATION_REQUIRES_CLAIM';
export type SufficiencyMode='ALL'|'ANY'|'AT_LEAST';
export type FreshnessState='CURRENT'|'STALE'|'CONFLICT'|'INDETERMINATE';
export type CarryForwardDecisionState='REUSE_FULL'|'REUSE_PARTIAL'|'RECOMPUTE'|'BLOCKED'|'INDETERMINATE';
export type ShadowAssuranceState='REQUIRED'|'NOT_REQUIRED'|'UNKNOWN';
export type ReplayGuardState='CLEAR'|'CONFLICT'|'TRUNCATED';
export interface DigestPort{readonly algorithm:'sha256';digest(input:string):string;}
export interface CancellationPort{isCancelled():boolean;}
export interface OperationOptions{readonly digest:DigestPort;readonly cancellation?:CancellationPort|undefined;readonly maxUnits?:number|undefined;readonly maxHistory?:number|undefined;readonly trustedSourceAuthorityDigests?:readonly string[]|undefined;}
export interface Diagnostic{readonly code:string;readonly message:string;readonly subject?:string|undefined;}
export type Result<T>={readonly ok:true;readonly value:T}|{readonly ok:false;readonly diagnostics:readonly Diagnostic[]};
export interface ProofIntentInput{readonly intentId:string;readonly projectId:string;readonly lineageId:string;readonly requestedClaimIds:readonly string[];readonly purpose:string;readonly sourceAuthorityDigest:string;readonly proofPolicyDigest:string;}
export interface ProofIntentCapsule extends ProofIntentInput{readonly intentDigest:string;}
export interface ProofAuthorityBoundary{readonly intentDigest:string;readonly authority:'PROOF_RELATIONSHIP_AND_SUFFICIENCY_ONLY';readonly mayCreateClaimTruth:false;readonly mayValidateEvidence:false;readonly mayEvaluateDod:false;readonly mayCalculateProgress:false;readonly mayComputeProjectStatus:false;readonly mayPerformDeltaReview:false;readonly mayDecideAssurance:false;readonly mayPromoteCheckpoint:false;readonly boundaryDigest:string;}
export interface CanonicalClaimInput{readonly claimId:string;readonly ownerId:string;readonly sourceIdentityDigest:string;readonly projectId:string;readonly lineageId:string;readonly proofPolicyDigest:string;}
export interface CanonicalClaimIdentity extends CanonicalClaimInput{readonly claimDigest:string;}
export interface ProofNodeIdentity{readonly nodeId:string;readonly kind:ProofNodeKind;readonly canonicalId:string;readonly projectId:string;readonly lineageId:string;readonly nodeDigest:string;}
export interface ProofEdgeIdentity{readonly edgeId:string;readonly kind:ProofEdgeKind;readonly fromNodeId:string;readonly toNodeId:string;readonly edgeDigest:string;}
export interface ProofDependencyAtom{readonly kind:'EVIDENCE'|'CLAIM';readonly id:string;}
export interface ProofObligationInput{readonly obligationId:string;readonly claimId:string;readonly ownerId:string;readonly sourceIdentityDigest:string;readonly projectId:string;readonly lineageId:string;readonly proofPolicyDigest:string;readonly mode:SufficiencyMode;readonly threshold:number|null;readonly dependencies:readonly ProofDependencyAtom[];readonly applicable:boolean;readonly required:boolean;readonly validityDependencyDigests:readonly string[];}
export interface ProofObligationDeclaration extends ProofObligationInput{readonly obligationDigest:string;}
export interface ProofNamespaceSeal{readonly projectId:string;readonly lineageId:string;readonly proofPolicyDigest:string;readonly namespaceDigest:string;}
export interface ProofIdentityManifest{readonly projectId:string;readonly lineageId:string;readonly proofPolicyDigest:string;readonly namespaceDigest:string;readonly claims:readonly CanonicalClaimIdentity[];readonly obligations:readonly ProofObligationDeclaration[];readonly nodes:readonly ProofNodeIdentity[];readonly edges:readonly ProofEdgeIdentity[];readonly duplicateSemanticDigests:readonly string[];readonly conflictingStableIds:readonly string[];readonly manifestDigest:string;}
export interface M24EvidenceFact{readonly evidenceId:string;readonly semanticDigest:string;readonly state:EvidenceAcceptanceState;readonly claimIds:readonly string[];readonly validityBindingDigest:string;readonly sourceIdentityDigest:string;readonly decisionReceiptDigest:string;}
export interface VerifiedM24ProofContext{readonly handoff:DownstreamProofContextHandoff;readonly manifestDigest:string;readonly claimMappingDigest:string;readonly receiptSetDigest:string;readonly facts:readonly M24EvidenceFact[];readonly conflictingEvidenceIds:readonly string[];readonly contextDigest:string;}
export interface M24ProofContextInput{readonly evaluations:readonly EvidenceEvaluationInput[];readonly handoff:DownstreamProofContextHandoff;readonly options:TrustedOperationOptions;}
