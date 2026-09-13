import { createGefError } from "./errors.js";
import { applyTransaction as applyCore, type ApplyTransactionInput } from "./transaction-apply-governed.js";
import { validateTransactionPlanRuntime } from "./transaction-plan-engine.js";
import type { TransactionAuthorizationPort, TransactionEffectPort, TransactionPorts } from "./transaction-ports.js";
import type { ApplyResult, TransactionIntent } from "./transaction-types.js";

function preFingerprint(input: ApplyTransactionInput, targetRef: string): string | undefined {
  return input.plan.expectedPreState.find((binding) => binding.key === targetRef || binding.key === `target:${targetRef}`)?.value;
}

function requiresTargetAuthorization(intent: TransactionIntent): boolean {
  return intent.securityClass === "S4_ELEVATED_DESTRUCTIVE" || intent.recoveryClass === "IRREVERSIBLE_OR_UNPROVEN";
}

function capabilityFailure(input: ApplyTransactionInput, reason: string, summary: string): ApplyResult {
  return Object.freeze({
    ok: false,
    outcome: "BLOCKED_BEFORE_EFFECT" as const,
    error: createGefError({
      id: `m05-apply-${input.runId}-${reason}`,
      category: "CAPABILITY",
      reason: `transaction_apply.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      effectStatus: "NONE",
      terminal: "BLOCKED",
      runId: input.runId,
      targetRef: input.plan.targetBinding.targetRef,
      metadata: { planDigest: input.plan.planDigest },
    }),
  });
}

function certifiedAuthorization(input: ApplyTransactionInput): TransactionAuthorizationPort | undefined {
  const original = input.ports.authorization;
  if (original === undefined) return undefined;
  return {
    authorize: async (request) => {
      const planResult = await original.authorize({ ...request, phase: "APPLY" });
      if (!planResult.ok || request.intent !== undefined) return planResult;
      for (const intent of input.plan.intents) {
        if (!requiresTargetAuthorization(intent)) continue;
        const targetResult = await original.authorize({ ...request, phase: "APPLY", intent });
        if (!targetResult.ok) return targetResult;
      }
      return planResult;
    },
  };
}

function certifiedEffects(input: ApplyTransactionInput, effects: TransactionEffectPort): TransactionEffectPort {
  return {
    checkPhysicalSafety: (intent) => effects.checkPhysicalSafety(intent),
    captureRecovery: async (intent) => {
      const captured = await effects.captureRecovery(intent);
      if (!captured.ok || captured.value === undefined || intent.recoveryClass !== "REVERSIBLE_MANAGED") return captured;
      const verified = await effects.verifyRecoveryMaterial?.({
        phase: "APPLY",
        planDigest: input.plan.planDigest,
        transactionId: input.transactionId ?? "UNBOUND_TRANSACTION",
        intent,
        recoveryRef: captured.value,
        ...(preFingerprint(input, intent.targetRef) === undefined ? {} : { expectedPreFingerprint: preFingerprint(input, intent.targetRef) }),
      });
      if (verified === undefined) {
        return {
          ok: false,
          error: createGefError({
            id: `m05-recovery-verifier-${input.runId}`,
            category: "CAPABILITY",
            reason: "transaction_apply.recovery_verifier_missing",
            severity: "ERROR",
            summary: "Recovery material cannot be accepted without explicit verification",
            retryability: "NEVER",
            recoverability: "NONE_REQUIRED",
            terminal: "BLOCKED",
            runId: input.runId,
            targetRef: intent.targetRef,
          }),
        };
      }
      if (!verified.ok) return verified;
      return captured;
    },
    ...(effects.verifyRecoveryMaterial === undefined ? {} : { verifyRecoveryMaterial: (request) => effects.verifyRecoveryMaterial!(request) }),
    stage: (intent) => effects.stage(intent),
    verifyStaged: (intent, obligations) => effects.verifyStaged(intent, obligations),
    revalidateCommitBarrier: (plan) => effects.revalidateCommitBarrier(plan),
    promote: (intent) => effects.promote(intent),
    verifyPostState: (plan, applied, obligations) => effects.verifyPostState(plan, applied, obligations),
    cleanup: (request) => effects.cleanup(request),
    restore: (request) => effects.restore(request),
  };
}

export async function applyTransaction(input: ApplyTransactionInput): Promise<ApplyResult> {
  const runtime = validateTransactionPlanRuntime(input.plan);
  if (!runtime.ok) return applyCore(input);

  const reversible = input.plan.intents.some((intent) => intent.recoveryClass === "REVERSIBLE_MANAGED");
  if (reversible && input.ports.effects !== undefined && input.ports.effects.verifyRecoveryMaterial === undefined) {
    return capabilityFailure(input, "recovery_verifier_missing", "Reversible mutation requires an exact recovery-material verification capability");
  }

  const ports: TransactionPorts = {
    ...input.ports,
    ...(input.ports.authorization === undefined ? {} : { authorization: certifiedAuthorization(input) }),
    ...(input.ports.effects === undefined ? {} : { effects: certifiedEffects(input, input.ports.effects) }),
  };
  return applyCore({ ...input, ports });
}

export type { ApplyTransactionInput };
