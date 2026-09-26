import type { GefError } from "@gef-bootstrap/contracts";

export const transactionSecurityClasses = [
  "S0_READ_ONLY",
  "S1_MANAGED_WRITE",
  "S2_REPOSITORY_CHANGE",
  "S3_PROVIDER_CHANGE",
  "S4_ELEVATED_DESTRUCTIVE",
] as const;

export type TransactionSecurityClass = (typeof transactionSecurityClasses)[number];
export type StatePredicate = "EXACT" | "COMPATIBLE";
export type RecoveryClass = "REVERSIBLE_MANAGED" | "COMPENSATABLE_EXTERNAL" | "IRREVERSIBLE_OR_UNPROVEN" | "NO_EFFECT";
export type TransactionIntentKind =
  | "CREATE_MANAGED_ARTIFACT"
  | "UPDATE_MANAGED_ARTIFACT"
  | "REMOVE_MANAGED_ARTIFACT"
  | "MOVE_MANAGED_ARTIFACT"
  | "DELEGATED_TRANSITION"
  | "EXTERNAL_SAGA_EFFECT";

export interface TransactionTargetBinding {
  readonly targetRef: string;
  readonly projectId?: string;
  readonly repositoryIdentity?: string;
  readonly bindingStrength: "PROJECT" | "REPOSITORY" | "PROJECT_AND_REPOSITORY" | "OPERATIONAL_ONLY";
}

export interface TransactionStateBinding {
  readonly key: string;
  readonly owner: string;
  readonly predicate: StatePredicate;
  readonly value: string;
  readonly contractVersion?: string;
}

export interface TransactionIntent {
  readonly intentId: string;
  readonly kind: TransactionIntentKind;
  readonly targetRef: string;
  readonly securityClass: TransactionSecurityClass;
  readonly recoveryClass: RecoveryClass;
  readonly dependsOn: readonly string[];
  readonly desiredFingerprint?: string;
  readonly payloadRef?: string;
  readonly delegatedContractRef?: string;
}

export interface VerificationObligation {
  readonly verificationId: string;
  readonly phase: "STAGED" | "POST_STATE" | "EXTERNAL";
  readonly targetRef?: string;
  readonly contractRef?: string;
}

export interface RecoveryRequirement {
  readonly intentId: string;
  readonly recoveryClass: RecoveryClass;
  readonly requirementRef?: string;
}

export interface ExternalEffectDeclaration {
  readonly effectId: string;
  readonly owner: string;
  readonly targetRef: string;
  readonly securityClass: TransactionSecurityClass;
  readonly compensation: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
  readonly operationRef?: string;
}

export interface TransactionPolicyRef {
  readonly policyId: string;
  readonly version: string;
}

export interface TransactionPlanBody {
  readonly schemaVersion: 1;
  readonly planContractVersion: "1.0";
  readonly targetBinding: TransactionTargetBinding;
  readonly expectedPreState: readonly TransactionStateBinding[];
  readonly securityClass: TransactionSecurityClass;
  readonly authorizationRequirements: readonly string[];
  readonly mutationSurface: readonly string[];
  readonly intents: readonly TransactionIntent[];
  readonly ordering: readonly { readonly before: string; readonly after: string }[];
  readonly verificationObligations: readonly VerificationObligation[];
  readonly recoveryRequirements: readonly RecoveryRequirement[];
  readonly externalEffectDeclarations: readonly ExternalEffectDeclaration[];
  readonly policyRefs: readonly TransactionPolicyRef[];
}

export interface TransactionPlan extends TransactionPlanBody {
  readonly planDigest: string;
}

export type TransactionFindingSeverity = "INFO" | "WARNING" | "ERROR";
export interface TransactionFinding {
  readonly code: string;
  readonly severity: TransactionFindingSeverity;
  readonly summary: string;
  readonly intentId?: string;
  readonly targetRef?: string;
}

export type DryRunOutcome = "READY" | "NOOP" | "BLOCKED" | "CONFLICT" | "STALE" | "INDETERMINATE";
export interface DryRunIntentResult {
  readonly intentId: string;
  readonly targetRef: string;
  readonly action: "WOULD_CREATE" | "WOULD_UPDATE" | "WOULD_REMOVE" | "WOULD_MOVE" | "WOULD_DELEGATE" | "WOULD_EXTERNAL_EFFECT" | "NO_CHANGE";
  readonly currentFingerprint?: string;
  readonly desiredFingerprint?: string;
}

export interface DryRunReport {
  readonly schemaVersion: 1;
  readonly dryRunContractVersion: "1.0";
  readonly planDigest: string;
  readonly outcome: DryRunOutcome;
  readonly observedStateBindings: readonly TransactionStateBinding[];
  readonly intentResults: readonly DryRunIntentResult[];
  readonly findings: readonly TransactionFinding[];
  readonly reportDigest: string;
}

export type TransactionPhase =
  | "ACCEPTED"
  | "VALIDATING_PLAN"
  | "REVALIDATING_PRE_STATE"
  | "AUTHORIZING"
  | "PREPARING_TRANSACTION"
  | "CAPTURING_RECOVERY"
  | "STAGING"
  | "VERIFYING_STAGED"
  | "COMMIT_BARRIER"
  | "PROMOTING"
  | "VERIFYING_POST_STATE"
  | "RECEIPTING"
  | "CLEANUP"
  | "APPLIED";

export type ApplyOutcome =
  | "APPLIED"
  | "NOOP_APPLIED"
  | "BLOCKED_BEFORE_EFFECT"
  | "ABORTED_STAGED_NO_TARGET_EFFECT"
  | "RECOVERY_REQUIRED"
  | "PARTIAL_EXTERNAL_EFFECT"
  | "FAILED_POST_STATE_VERIFICATION";

export type EffectProgress = "NOT_ATTEMPTED" | "PROMOTED" | "VERIFICATION_PENDING" | "VERIFIED" | "FAILED_AFTER_PROMOTION";
export interface AppliedIntentResult {
  readonly intentId: string;
  readonly targetRef: string;
  readonly progress: EffectProgress;
  readonly postFingerprint?: string;
  readonly recoveryRef?: string;
}

export interface TransactionJournalSnapshot {
  readonly schemaVersion: 1;
  readonly transactionId: string;
  readonly runId: string;
  readonly planDigest: string;
  readonly targetBinding: TransactionTargetBinding;
  readonly securityClass: TransactionSecurityClass;
  readonly phase: TransactionPhase;
  readonly preStateBindings: readonly TransactionStateBinding[];
  readonly intentResults: readonly AppliedIntentResult[];
  readonly terminalOutcome?: ApplyOutcome;
}

export interface ApplyReceipt {
  readonly schemaVersion: 1;
  readonly applyContractVersion: "1.0";
  readonly runId: string;
  readonly transactionId?: string;
  readonly planDigest: string;
  readonly targetBinding: TransactionTargetBinding;
  readonly securityClass: TransactionSecurityClass;
  readonly preStateBindings: readonly TransactionStateBinding[];
  readonly appliedIntentResults: readonly AppliedIntentResult[];
  readonly changedTargets: readonly string[];
  readonly verificationResults: readonly string[];
  readonly postStateBindings: readonly TransactionStateBinding[];
  readonly externalEffectRefs: readonly string[];
  readonly outcome: ApplyOutcome;
  readonly receiptDigest: string;
}

export type ApplyResult =
  | { readonly ok: true; readonly outcome: "APPLIED" | "NOOP_APPLIED"; readonly receipt: ApplyReceipt }
  | { readonly ok: false; readonly outcome: Exclude<ApplyOutcome, "APPLIED" | "NOOP_APPLIED">; readonly error: GefError; readonly receipt?: ApplyReceipt };

export type RollbackOutcome =
  | "RESTORED"
  | "ALREADY_RESTORED"
  | "PARTIALLY_RESTORED"
  | "ROLLBACK_CONFLICT"
  | "RECOVERY_MATERIAL_INVALID"
  | "ROLLBACK_FAILED"
  | "EXTERNAL_COMPENSATION_REQUIRED"
  | "RECOVERY_ESCALATION_REQUIRED";

export interface RollbackEffectResult {
  readonly intentId: string;
  readonly targetRef: string;
  readonly outcome: "RESTORED" | "ALREADY_RESTORED" | "CONFLICT" | "FAILED" | "MATERIAL_INVALID";
  readonly preRollbackFingerprint?: string;
  readonly postRollbackFingerprint?: string;
}

export interface RollbackReceipt {
  readonly schemaVersion: 1;
  readonly rollbackContractVersion: "1.0";
  readonly recoveryRunId: string;
  readonly originalRunId: string;
  readonly transactionId: string;
  readonly planDigest: string;
  readonly targetBinding: TransactionTargetBinding;
  readonly securityClass: TransactionSecurityClass;
  readonly effectResults: readonly RollbackEffectResult[];
  readonly outcome: RollbackOutcome;
  readonly receiptDigest: string;
}

export type EffectState =
  | "NO_EFFECT"
  | "FULLY_APPLIED_VERIFIED"
  | "FULLY_RESTORED_VERIFIED"
  | "PARTIALLY_APPLIED"
  | "PARTIALLY_RESTORED"
  | "EXTERNAL_EFFECT_PRESENT"
  | "IN_FLIGHT"
  | "UNKNOWN_EFFECT";

export interface IdempotencyScope {
  readonly scopeId: string;
  readonly targetRef: string;
  readonly planDigest: string;
  readonly contractVersion: string;
  readonly policyFingerprint?: string;
  readonly providerOperationRef?: string;
}

export type IdempotencyDecision =
  | "SUPPRESS_DUPLICATE_IN_FLIGHT"
  | "RETURN_ALREADY_APPLIED"
  | "RETURN_NOOP"
  | "FRESH_ATTEMPT_ELIGIBLE"
  | "RETRY_ELIGIBLE"
  | "RECOVERY_REQUIRED"
  | "REPLAN_OR_BLOCK"
  | "BLOCKED"
  | "NO_AUTOMATIC_RETRY";

export interface IdempotencyDecisionResult {
  readonly decision: IdempotencyDecision;
  readonly effectState: EffectState;
  readonly reason: string;
  readonly priorReceiptRef?: string;
}

export interface RetryPolicy {
  readonly enabled: boolean;
  readonly retryableReasons: readonly string[];
  readonly maxAttempts: number;
  readonly backoff: "NONE" | "FIXED" | "EXPONENTIAL";
}

export interface RetryContext {
  readonly scope: IdempotencyScope;
  readonly effectState: EffectState;
  readonly attemptCount: number;
  readonly failureReason?: string;
  readonly authorizationValid: boolean;
  readonly preStateValid: boolean;
  readonly desiredStateAlreadyPresent: boolean;
  readonly priorReceiptRef?: string;
  readonly retryPolicy: RetryPolicy;
}
