import { createGefError } from "./errors.js";
import { rollbackTransaction as rollbackCore, rollbackIntentFor, type RollbackTransactionInput } from "./transaction-rollback-certified.js";
import type { TransactionEffectPort, TransactionPortResult, TransactionPorts } from "./transaction-ports.js";
import type { RollbackReceipt } from "./transaction-types.js";

function blocked(input: RollbackTransactionInput, reason: string): TransactionPortResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m05-rollback-${input.recoveryRunId}-${reason}`,
      category: "AUTHORIZATION",
      reason: `transaction_rollback.${reason}`,
      severity: "ERROR",
      summary: "Rollback target effect is not currently authorized",
      retryability: "NEVER",
      recoverability: "RECOVERY_REQUIRED",
      effectStatus: "NONE",
      terminal: "RECOVERY_REQUIRED",
      runId: input.recoveryRunId,
      targetRef: input.plan.targetBinding.targetRef,
      metadata: { planDigest: input.plan.planDigest },
    }),
  };
}

function guardedEffects(input: RollbackTransactionInput, effects: TransactionEffectPort): TransactionEffectPort {
  return {
    checkPhysicalSafety: (intent) => effects.checkPhysicalSafety(intent),
    captureRecovery: (intent) => effects.captureRecovery(intent),
    ...(effects.verifyRecoveryMaterial === undefined ? {} : { verifyRecoveryMaterial: (request) => effects.verifyRecoveryMaterial!(request) }),
    stage: (intent) => effects.stage(intent),
    verifyStaged: (intent, obligations) => effects.verifyStaged(intent, obligations),
    revalidateCommitBarrier: (plan) => effects.revalidateCommitBarrier(plan),
    promote: (intent) => effects.promote(intent),
    verifyPostState: (plan, applied, obligations) => effects.verifyPostState(plan, applied, obligations),
    cleanup: (request) => effects.cleanup(request),
    restore: async (request) => {
      const verifier = effects.verifyRecoveryMaterial;
      if (verifier === undefined) return blocked(input, "recovery_verifier_missing");
      const reverified = await verifier({
        phase: "ROLLBACK",
        planDigest: input.plan.planDigest,
        transactionId: input.applyReceipt.transactionId ?? "UNBOUND_TRANSACTION",
        intent: request.intent,
        recoveryRef: request.recoveryRef,
        ...(request.expectedPreFingerprint === undefined ? {} : { expectedPreFingerprint: request.expectedPreFingerprint }),
        ...(request.expectedCurrentFingerprint === undefined ? {} : { expectedPostFingerprint: request.expectedCurrentFingerprint }),
      });
      if (!reverified.ok) return reverified;

      if (input.plan.authorizationRequirements.length === 0) {
        const authorization = input.ports.authorization;
        if (authorization === undefined) return blocked(input, "current_authorization_missing");
        const authorized = await authorization.authorize({
          runId: input.recoveryRunId,
          plan: input.plan,
          authorizationRefs: input.authorizationRefs ?? [],
          phase: "ROLLBACK",
          intent: request.intent,
        });
        if (!authorized.ok) return authorized;
      }
      return effects.restore(request);
    },
  };
}

export async function rollbackTransaction(input: RollbackTransactionInput): Promise<RollbackReceipt> {
  if (input.ports.effects === undefined) return rollbackCore(input);
  const ports: TransactionPorts = { ...input.ports, effects: guardedEffects(input, input.ports.effects) };
  return rollbackCore({ ...input, ports });
}

export { rollbackIntentFor };
export type { RollbackTransactionInput };
