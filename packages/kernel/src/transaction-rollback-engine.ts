import { stableTransactionSerialize, verifyTransactionPlanDigest } from "./transaction-plan-engine.js";
import { rollbackIntentFor, rollbackTransaction as rollbackCore, type RollbackTransactionInput } from "./transaction-rollback.js";
import type { RollbackReceipt } from "./transaction-types.js";

function escalation(input: RollbackTransactionInput): RollbackReceipt {
  const base = Object.freeze({
    schemaVersion: 1 as const,
    rollbackContractVersion: "1.0" as const,
    recoveryRunId: input.recoveryRunId,
    originalRunId: input.applyReceipt.runId,
    transactionId: input.applyReceipt.transactionId ?? "NO_TRANSACTION_ID",
    planDigest: input.plan.planDigest,
    targetBinding: input.plan.targetBinding,
    securityClass: input.plan.securityClass,
    effectResults: Object.freeze([]),
    outcome: "RECOVERY_ESCALATION_REQUIRED" as const,
  });
  return Object.freeze({ ...base, receiptDigest: input.ports.digest.digest(stableTransactionSerialize(base)) });
}

export async function rollbackTransaction(input: RollbackTransactionInput): Promise<RollbackReceipt> {
  if (!verifyTransactionPlanDigest(input.plan, input.ports.digest)) return escalation(input);
  if (input.applyReceipt.planDigest !== input.plan.planDigest) return escalation(input);
  return rollbackCore(input);
}

export { rollbackIntentFor };
export type { RollbackTransactionInput };
