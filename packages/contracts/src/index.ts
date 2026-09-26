export const errorCategories = [
  "INPUT",
  "PRECONDITION",
  "POLICY",
  "AUTHORIZATION",
  "CAPABILITY",
  "DEPENDENCY",
  "EXECUTION",
  "VERIFICATION",
  "INTEGRITY",
  "RECOVERY",
  "CANCELLED",
  "TIMEOUT",
  "INTERNAL",
] as const;

export type ErrorCategory = (typeof errorCategories)[number];
export type RuntimeSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";
export type Retryability =
  | "NEVER"
  | "SAFE_IMMEDIATE"
  | "SAFE_WITH_BACKOFF"
  | "REQUIRES_EFFECT_CHECK"
  | "REQUIRES_NEW_AUTHORIZATION"
  | "MANUAL_ONLY";

export type Recoverability =
  | "NONE_REQUIRED"
  | "AUTO_COMPENSATION_AVAILABLE"
  | "RECOVERY_REQUIRED"
  | "MANUAL_REPAIR_REQUIRED"
  | "IRREVERSIBLE_EFFECT_RECORDED";

export type EffectStatus =
  | "NONE"
  | "POSSIBLE"
  | "CONFIRMED"
  | "PARTIAL"
  | "RECOVERED"
  | "IRREVERSIBLE";

export type LifecyclePhase =
  | "RECEIVED"
  | "VALIDATING"
  | "PREFLIGHTING"
  | "READY"
  | "EXECUTING"
  | "VERIFYING"
  | "RECEIPTING";

export type LifecycleTerminal =
  | "SUCCEEDED"
  | "BLOCKED"
  | "CANCELLED"
  | "TIMED_OUT"
  | "FAILED"
  | "RECOVERY_REQUIRED"
  | "PARTIAL_EXTERNAL_EFFECT";

export interface RemediationAction {
  readonly actionId: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface ErrorCause {
  readonly id: string;
  readonly reasonCode: string;
  readonly summary: string;
}

export interface GefError {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly category: ErrorCategory;
  readonly reasonCode: string;
  readonly severity: RuntimeSeverity;
  readonly summary: string;
  readonly retryability: Retryability;
  readonly recoverability: Recoverability;
  readonly effectStatus: EffectStatus;
  readonly lifecyclePhase?: LifecyclePhase;
  readonly terminal?: Exclude<LifecycleTerminal, "SUCCEEDED">;
  readonly commandId?: string;
  readonly runId?: string;
  readonly targetRef?: string;
  readonly causes: readonly ErrorCause[];
  readonly evidenceRefs: readonly string[];
  readonly remediations: readonly RemediationAction[];
  readonly diagnosticRef?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface LifecycleSnapshot {
  readonly runId: string;
  readonly parentRunId?: string;
  readonly commandId: string;
  readonly phases: readonly LifecyclePhase[];
  readonly terminal: LifecycleTerminal;
  readonly startedAtMs: number;
  readonly endedAtMs: number;
  readonly effectStatus: EffectStatus;
  readonly targetRef?: string;
  readonly receiptRef?: string;
}

export interface SuccessResult<T> {
  readonly ok: true;
  readonly value: T;
  readonly lifecycle: LifecycleSnapshot;
}

export interface FailureResult {
  readonly ok: false;
  readonly error: GefError;
  readonly lifecycle: LifecycleSnapshot;
}

export type GefResult<T> = SuccessResult<T> | FailureResult;

export enum ProcessExitCode {
  SUCCESS = 0,
  USAGE_OR_INPUT_ERROR = 10,
  PRECONDITION_OR_STATE_BLOCK = 20,
  POLICY_OR_AUTHORIZATION_BLOCK = 30,
  DEPENDENCY_OR_CAPABILITY_FAILURE = 40,
  EXECUTION_FAILURE = 50,
  VERIFICATION_OR_INTEGRITY_FAILURE = 60,
  RECOVERY_REQUIRED_OR_PARTIAL_EFFECT = 70,
  CANCELLED_OR_TIMED_OUT = 80,
  INTERNAL_UNEXPECTED_FAILURE = 90,
}

export interface CommandRequest {
  readonly commandId: string;
  readonly contractVersion: string;
  readonly input: unknown;
  readonly targetRef?: string;
  readonly expectedState?: string;
  readonly authorizationRef?: string;
  readonly deadlineMs?: number;
  readonly parentRunId?: string;
  readonly signal?: AbortSignal;
}

export interface ValidationSuccess<T> {
  readonly ok: true;
  readonly value: T;
}

export interface ValidationFailure {
  readonly ok: false;
  readonly reason: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
export type InputValidator<T> = (input: unknown) => ValidationResult<T>;

export interface TargetBinding {
  readonly targetRef: string;
  readonly stateFingerprint?: string;
}

export interface RuntimeEvent {
  readonly runId: string;
  readonly commandId: string;
  readonly phase: LifecyclePhase | LifecycleTerminal;
  readonly event: "PHASE" | "TERMINAL";
  readonly timestampMs: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ProcessSpec {
  readonly executable: string;
  readonly argv: readonly string[];
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
}

export interface VerificationRequest<T> {
  readonly runId: string;
  readonly commandId: string;
  readonly target?: TargetBinding;
  readonly value: T;
  readonly effectStatus: EffectStatus;
}

export interface ReceiptRequest<T> extends VerificationRequest<T> {
  readonly lifecyclePhases: readonly LifecyclePhase[];
}

export interface HandlerSuccess<T> {
  readonly ok: true;
  readonly value: T;
  readonly effectStatus?: EffectStatus;
}

export interface HandlerFailure {
  readonly ok: false;
  readonly error: GefError;
  readonly terminal?: Exclude<LifecycleTerminal, "SUCCEEDED">;
  readonly effectStatus?: EffectStatus;
}

export type HandlerOutcome<T> = HandlerSuccess<T> | HandlerFailure;
