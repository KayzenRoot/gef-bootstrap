import type {
  RollbackEffectResult,
  RollbackOutcome,
  TransactionSecurityClass,
  TransactionTargetBinding,
} from "./transaction-types.js";

export type RollbackPhase =
  | "ROLLBACK_PREPARING"
  | "ROLLBACK_BARRIER"
  | "ROLLBACK_RESTORING"
  | "ROLLBACK_VERIFYING"
  | "ROLLBACK_RECEIPTING";

export interface RollbackJournalRecoveryRef {
  readonly intentId: string;
  readonly targetRef: string;
  readonly recoveryRef: string;
}

export interface RollbackJournalSnapshot {
  readonly schemaVersion: 1;
  readonly recoveryRunId: string;
  readonly originalRunId: string;
  readonly transactionId: string;
  readonly planDigest: string;
  readonly targetBinding: TransactionTargetBinding;
  readonly securityClass: TransactionSecurityClass;
  readonly phase: RollbackPhase;
  readonly effectResults: readonly RollbackEffectResult[];
  readonly recoveryRefs: readonly RollbackJournalRecoveryRef[];
  readonly terminalOutcome?: RollbackOutcome;
}
