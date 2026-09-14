import type { CanonicalContinuationCapsule, ContinuationHandoffContract, ContinuationMinimumSufficientState, ResumeReadinessCertificate } from '@gef-bootstrap/checkpoint-engine';

export type ResumeStatus = 'READY' | 'EXPANSION_REQUIRED' | 'DRIFT_REQUIRES_REPLAN' | 'POLICY_BLOCKED' | 'LINEAGE_MISMATCH' | 'PROJECT_MISMATCH' | 'INDETERMINATE';
export type ContextTemperature = 'HOT' | 'WARM' | 'COLD';
export type DriftState = 'SAME' | 'CHANGED' | 'MISSING' | 'UNKNOWN';
export type DriftDimension = 'PROJECT' | 'LINEAGE' | 'CHECKPOINT' | 'POLICY' | 'AUTHORITY' | 'CLAIM';

export interface DigestPort { algorithm: 'sha256'; digest(input: string): string; }
export interface CancellationPort { isCancelled(): boolean; }
export interface OperationOptions { digest: DigestPort; cancellation?: CancellationPort | undefined; maxReads?: number | undefined; maxNodes?: number | undefined; }
export interface Diagnostic { code: string; message: string; subject?: string | undefined; }
export type Result<T> = { ok: true; value: T } | { ok: false; diagnostics: readonly Diagnostic[] };

export interface ResumeIntentCapsuleInput {
  readonly resumeId: string;
  readonly projectId: string;
  readonly expectedLineageId: string;
  readonly expectedCheckpointDigest: string;
  readonly requestedNextAction: string | null;
}
export interface ResumeIntentCapsule extends ResumeIntentCapsuleInput { readonly intentDigest: string; }

export interface LineageContinuityProof {
  readonly projectId: string;
  readonly lineageId: string;
  readonly checkpointDigest: string;
  readonly handoffDigest: string;
  readonly valid: boolean;
  readonly mismatch: 'NONE' | 'PROJECT' | 'LINEAGE' | 'CHECKPOINT' | 'HANDOFF';
  readonly proofDigest: string;
}

export interface ResumeAuthorityBoundary {
  readonly canonicalNextAction: string;
  readonly requestedNextAction: string | null;
  readonly authorized: boolean;
  readonly reason: string;
  readonly boundaryDigest: string;
}

export interface ConversationClaim { readonly claimId: string; readonly subject: string; readonly assertedDigest: string; }
export interface ConversationIndependenceResult { readonly informationalClaimIds: readonly string[]; readonly conflictingClaimIds: readonly string[]; readonly authoritySource: 'CANONICAL_CHECKPOINT_ONLY'; readonly resultDigest: string; }

export interface ResumeContextRef { readonly refId: string; readonly dependencyKeys: readonly string[]; readonly mandatory: boolean; readonly preferredTemperature: ContextTemperature; }
export interface ResumeMinimumSufficientContext {
  readonly checkpointDigest: string;
  readonly handoffDigest: string;
  readonly nextLegalAction: string;
  readonly activeClaimIds: readonly string[];
  readonly requiredAuthorityBindingIds: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly contextRefs: readonly ResumeContextRef[];
  readonly contextDigest: string;
}

export interface HotStateEntry { readonly refId: string; readonly contentDigest: string; readonly validityBindingDigest: string; }
export interface HotStateRehydration { readonly accepted: readonly HotStateEntry[]; readonly rejectedRefIds: readonly string[]; readonly rehydrationDigest: string; }

export interface ResumeReadPlanStep { readonly refId: string; readonly temperature: ContextTemperature; readonly reason: string; readonly mandatory: boolean; readonly dependencyKeys: readonly string[]; }
export interface ResumeReadPlan { readonly steps: readonly ResumeReadPlanStep[]; readonly maxReads: number; readonly expansionRequired: boolean; readonly planDigest: string; }

export interface NegativeRehydrationCacheEntry { readonly refId: string; readonly absenceProofDigest: string; readonly validityBindingDigest: string; }
export interface NegativeRehydrationCache { readonly entries: readonly NegativeRehydrationCacheEntry[]; readonly cacheDigest: string; }

export interface ContextTemperatureEntry { readonly refId: string; readonly temperature: ContextTemperature; readonly relevance: number; }
export interface ContextTemperatureMap { readonly entries: readonly ContextTemperatureEntry[]; readonly mapDigest: string; }

export interface ResumeObservation {
  readonly projectId: string;
  readonly lineageId: string;
  readonly checkpointDigest: string | null;
  readonly policyBindingDigest: string | null;
  readonly authorityIdentities: Readonly<Record<string,string|undefined>>;
  readonly claimStates: Readonly<Record<string,string|undefined>>;
}
export interface ResumeDriftEntry { readonly dimension: DriftDimension; readonly subject: string; readonly state: DriftState; readonly expected: string; readonly observed: string | null; }
export interface ResumeDriftVector { readonly entries: readonly ResumeDriftEntry[]; readonly hasMaterialDrift: boolean; readonly hasUnknown: boolean; readonly vectorDigest: string; }

export interface SafeReentryDecision { readonly status: ResumeStatus; readonly checkpointDigest: string; readonly nextAction: string | null; readonly expansionRefs: readonly string[]; readonly diagnostics: readonly Diagnostic[]; readonly decisionDigest: string; }

export interface DeltaRehydrationNode { readonly refId: string; readonly dependencyRefs: readonly string[]; readonly reasonKeys: readonly string[]; }
export interface DeltaRehydrationGraph { readonly nodes: readonly DeltaRehydrationNode[]; readonly complete: boolean; readonly graphDigest: string; }

export interface WorkObservation { readonly workId: string; readonly projectId: string; readonly lineageId: string; readonly baseCheckpointDigest: string; readonly claimIds: readonly string[]; }
export interface OrphanWorkFinding { readonly workId: string; readonly orphaned: boolean; readonly reasons: readonly string[]; }
export interface OrphanWorkReport { readonly findings: readonly OrphanWorkFinding[]; readonly orphanWorkIds: readonly string[]; readonly reportDigest: string; }

export interface ResumeConflictEntry { readonly subject: string; readonly reason: string; readonly evidenceRefs: readonly string[]; }
export interface ResumeConflictQuarantine { readonly entries: readonly ResumeConflictEntry[]; readonly quarantineDigest: string; }

export interface ResumeReceipt {
  readonly resumeId: string;
  readonly status: ResumeStatus;
  readonly projectId: string;
  readonly lineageId: string;
  readonly checkpointDigest: string;
  readonly handoffDigest: string;
  readonly nextAction: string | null;
  readonly decisionDigest: string;
  readonly readPlanDigest: string;
  readonly driftVectorDigest: string;
  readonly orphanReportDigest: string;
  readonly quarantineDigest: string;
  readonly receiptDigest: string;
}

export interface ResumeSemanticDigest { readonly resumeId: string; readonly semanticDigest: string; }
export type ContinuityLossKind = 'AUTHORITY_LOSS' | 'BLOCKER_LOSS' | 'CLAIM_LOSS' | 'NEXT_ACTION_CHANGE' | 'STALE_SUCCESS_REINTRODUCED';
export interface ContinuityLossFinding { readonly kind: ContinuityLossKind; readonly subject: string; }

export interface ResumeEfficiencyReceipt { readonly plannedReads: number; readonly hotHits: number; readonly negativeCacheHits: number; readonly expansionReads: number; readonly efficiencyDigest: string; }

export interface SafeHandbackContract { readonly status: ResumeStatus; readonly checkpointDigest: string; readonly nextLegalAction: string | null; readonly blockers: readonly string[]; readonly receiptDigest: string; readonly handbackDigest: string; }

export interface ResumeCanonicalInputs { readonly checkpoint: CanonicalContinuationCapsule; readonly handoff: ContinuationHandoffContract; readonly readiness: ResumeReadinessCertificate; readonly minimumState: ContinuationMinimumSufficientState; }
