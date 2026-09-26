import type { ContinuityPolicyBinding } from '@gef-bootstrap/policy-guardrail-engine';

export type CheckpointValidity = 'VALID' | 'STALE_BINDING' | 'DIVERGENT' | 'PARTIAL' | 'BLOCKED' | 'PROJECT_MISMATCH' | 'SCHEMA_UNSUPPORTED' | 'INDETERMINATE';
export type ContinuationStatus = 'PLANNED' | 'ACTIVE' | 'BLOCKED' | 'DONE' | 'STALE' | 'QUARANTINED';
export type PromotionStatus = 'READY' | 'STALE_BASE' | 'DIVERGENT_SUCCESSOR' | 'BLOCKED' | 'COMMITTED';
export type FreshnessState = 'CURRENT' | 'STALE' | 'UNKNOWN' | 'MISSING';

export interface DigestPort { algorithm: 'sha256'; digest(input: string): string; }
export interface CancellationPort { isCancelled(): boolean; }
export interface OperationOptions { digest: DigestPort; cancellation?: CancellationPort | undefined; maxNodes?: number | undefined; maxReferences?: number | undefined; }
export interface Diagnostic { code: string; message: string; subject?: string | undefined; }
export type Result<T> = { ok: true; value: T } | { ok: false; diagnostics: readonly Diagnostic[] };

export interface AuthorityBindingRef { readonly bindingId: string; readonly domain: string; readonly semanticIdentity: string; readonly authorityRef: string; readonly required: boolean; }
export interface CheckpointStateEntry { readonly domain: string; readonly status: ContinuationStatus; readonly maturity: number; readonly evidenceRefs: readonly string[]; }
export interface CheckpointStateVector { readonly entries: readonly CheckpointStateEntry[]; }
export interface AuthoritySnapshotIndex { readonly bindings: readonly AuthorityBindingRef[]; readonly indexDigest: string; }
export interface ContinuationClaim { readonly claimId: string; readonly domain: string; readonly status: ContinuationStatus; readonly maturity: number; readonly dependencyKeys: readonly string[]; readonly authorityBindingIds: readonly string[]; readonly evidenceRefs: readonly string[]; }
export interface CanonicalContinuationCapsuleInput { readonly schemaVersion: 1; readonly projectId: string; readonly moduleId: string; readonly stageId: string; readonly lineageId: string; readonly predecessorCheckpointDigest: string | null; readonly admittedWorkOrderIds: readonly string[]; readonly authorityBindings: readonly AuthorityBindingRef[]; readonly policyBinding: ContinuityPolicyBinding; readonly claims: readonly ContinuationClaim[]; readonly blockers: readonly string[]; readonly evidenceRefs: readonly string[]; readonly nextLegalAction: string; readonly requiredCapabilities: readonly string[]; }
export interface CanonicalContinuationCapsule extends CanonicalContinuationCapsuleInput { readonly stateVector: CheckpointStateVector; readonly authorityIndex: AuthoritySnapshotIndex; readonly checkpointDigest: string; }
export interface ContinuationInvariant { readonly invariantId: string; readonly satisfied: boolean; readonly reason: string; }
export interface ContinuationInvariantSet { readonly invariants: readonly ContinuationInvariant[]; readonly admissible: boolean; readonly invariantDigest: string; }
export interface PromotionFenceToken { readonly tokenId: string; readonly lineageId: string; readonly baseCheckpointDigest: string; readonly nonce: string; readonly tokenDigest: string; }
export interface CheckpointPromotionProposal { readonly expectedBaseDigest: string; readonly candidate: CanonicalContinuationCapsule; readonly fenceToken: PromotionFenceToken; readonly authorizationRef: string; readonly proposalDigest: string; }
export interface SemanticCasResult { readonly status: 'MATCH' | 'STALE_BASE'; readonly expectedBaseDigest: string; readonly currentBaseDigest: string; }
export interface SplitBrainFinding { readonly baseCheckpointDigest: string; readonly successorDigests: readonly string[]; readonly divergent: boolean; }
export interface CheckpointMutationReceipt { readonly status: PromotionStatus; readonly beforeCheckpointDigest: string; readonly afterCheckpointDigest: string; readonly lineageId: string; readonly fenceTokenDigest: string; readonly authorizationRef: string; readonly invariantDigest: string; readonly evidenceRefs: readonly string[]; readonly receiptDigest: string; }
export interface DependencyNode { readonly claimId: string; readonly dependencyKeys: readonly string[]; }
export interface CheckpointDependencyGraph { readonly complete: boolean; readonly nodes: readonly DependencyNode[]; }
export interface InvalidationResult { readonly invalidatedClaimIds: readonly string[]; readonly preservedClaimIds: readonly string[]; readonly conservativeWidening: boolean; }
export interface CheckpointRollbackPointer { readonly fromCheckpointDigest: string; readonly predecessorCheckpointDigest: string; readonly lineageId: string; readonly pointerDigest: string; }
export interface QuarantinedClaim { readonly claim: ContinuationClaim; readonly reasonKeys: readonly string[]; }
export interface StaleClaimQuarantine { readonly entries: readonly QuarantinedClaim[]; readonly quarantineDigest: string; }
export type ContinuityRegressionKind = 'CLAIM_LOSS' | 'MATURITY_ROLLBACK' | 'DONE_TO_NON_DONE' | 'AUTHORITY_LOSS' | 'WORK_ORDER_LOSS' | 'NEXT_ACTION_AMBIGUITY';
export interface ContinuityRegressionFinding { readonly kind: ContinuityRegressionKind; readonly subject: string; }
export interface ContinuationMinimumSufficientState { readonly projectId: string; readonly moduleId: string; readonly stageId: string; readonly checkpointDigest: string; readonly nextLegalAction: string; readonly activeClaimIds: readonly string[]; readonly requiredAuthorityBindingIds: readonly string[]; readonly evidenceRefs: readonly string[]; readonly blockerRefs: readonly string[]; readonly stateDigest: string; }
export interface HistoricalPointer { readonly checkpointDigest: string; readonly relation: 'PREDECESSOR' | 'SUPERSEDED' | 'ROLLBACK_SOURCE' | 'EVIDENCE'; }
export interface HistoricalPointerCompaction { readonly pointers: readonly HistoricalPointer[]; readonly compactionDigest: string; }
export interface CheckpointPortabilityEnvelope { readonly schemaVersion: 1; readonly projectId: string; readonly lineageId: string; readonly checkpointDigest: string; readonly requiredCapabilities: readonly string[]; readonly unsupportedCapabilities: readonly string[]; readonly envelopeDigest: string; }
export interface ColdHistoryEvictionEntry { readonly checkpointDigest: string; readonly retainedByRefs: readonly string[]; }
export interface ColdHistoryEvictionMap { readonly entries: readonly ColdHistoryEvictionEntry[]; readonly mapDigest: string; }
export interface CheckpointSizeAssessment { readonly withinBudget: boolean; readonly nodeCount: number; readonly referenceCount: number; readonly maxNodes: number; readonly maxReferences: number; }
export interface CheckpointAdmissionReceipt { readonly validity: CheckpointValidity; readonly beforeCheckpointDigest: string; readonly afterCheckpointDigest: string; readonly lineageId: string; readonly policyBindingDigest: string; readonly authorityIndexDigest: string; readonly blockerRefs: readonly string[]; readonly nextLegalAction: string; readonly admissionDigest: string; }
export interface ResumeReadinessCertificate { readonly validity: CheckpointValidity; readonly checkpointDigest: string; readonly ready: boolean; readonly missingBindingIds: readonly string[]; readonly unresolvedBlockers: readonly string[]; readonly requiredCapabilityGaps: readonly string[]; readonly certificateDigest: string; }
export interface FreshnessEntry { readonly bindingId: string; readonly state: FreshnessState; readonly expectedIdentity: string; readonly observedIdentity: string | null; }
export interface CheckpointFreshnessVector { readonly entries: readonly FreshnessEntry[]; readonly allCurrent: boolean; readonly vectorDigest: string; }
export interface ContinuationHandoffContract { readonly checkpointDigest: string; readonly projectId: string; readonly lineageId: string; readonly nextLegalAction: string; readonly authorityIndexDigest: string; readonly policyBindingDigest: string; readonly readinessCertificateDigest: string; readonly handoffDigest: string; }
