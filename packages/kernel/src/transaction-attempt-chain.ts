import { createGefError } from "./errors.js";
import type { TransactionPortResult } from "./transaction-ports.js";
import type { EffectState, IdempotencyDecisionResult, IdempotencyScope } from "./transaction-types.js";
import { sameIdempotencyScope } from "./transaction-idempotency.js";

export interface TransactionAttemptRecord {
  readonly schemaVersion: 1;
  readonly scope: IdempotencyScope;
  readonly planDigest: string;
  readonly runId: string;
  readonly transactionId?: string;
  readonly predecessorRunId?: string;
  readonly effectState: EffectState;
  readonly terminalOutcome?: string;
}

export interface LinkRetryAttemptInput {
  readonly prior: TransactionAttemptRecord;
  readonly eligibility: IdempotencyDecisionResult;
  readonly scope: IdempotencyScope;
  readonly planDigest: string;
  readonly runId: string;
  readonly transactionId?: string;
  readonly effectState?: EffectState;
}

function invalid(reason: string, summary: string): TransactionPortResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m05-attempt-${reason}`,
      category: "PRECONDITION",
      reason: `transaction_attempt.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
    }),
  };
}

export function linkRetryAttempt(input: LinkRetryAttemptInput): TransactionPortResult<TransactionAttemptRecord> {
  if (input.eligibility.decision !== "RETRY_ELIGIBLE" && input.eligibility.decision !== "FRESH_ATTEMPT_ELIGIBLE") {
    return invalid("not_eligible", "A new attempt can be linked only after explicit retry or fresh-attempt eligibility");
  }
  if (!sameIdempotencyScope(input.prior.scope, input.scope)) {
    return invalid("scope_mismatch", "Retry attempt scope must exactly match its predecessor idempotency scope");
  }
  if (input.planDigest !== input.scope.planDigest || input.prior.planDigest !== input.planDigest) {
    return invalid("plan_mismatch", "Retry attempt must preserve the exact semantic plan identity");
  }
  if (input.runId.length === 0 || input.runId === input.prior.runId) {
    return invalid("run_identity_reused", "A retry or fresh execution must receive a new run identity");
  }
  if (input.transactionId !== undefined && input.prior.transactionId !== undefined && input.transactionId === input.prior.transactionId) {
    return invalid("transaction_identity_reused", "A re-executed mutation must not reuse the predecessor transaction identity");
  }

  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: 1 as const,
      scope: Object.freeze({ ...input.scope }),
      planDigest: input.planDigest,
      runId: input.runId,
      ...(input.transactionId === undefined ? {} : { transactionId: input.transactionId }),
      predecessorRunId: input.prior.runId,
      effectState: input.effectState ?? "IN_FLIGHT",
    }),
  };
}
