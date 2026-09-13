import { stableTransactionSerialize, verifyTransactionPlanDigest } from "./transaction-plan.js";
import type { TransactionPorts } from "./transaction-ports.js";
import type { ApplyReceipt, RollbackEffectResult, RollbackOutcome, RollbackReceipt, TransactionIntent, TransactionPlan } from "./transaction-types.js";

export interface RollbackTransactionInput {
  readonly plan: TransactionPlan;
  readonly applyReceipt: ApplyReceipt;
  readonly recoveryRunId: string;
  readonly ports: TransactionPorts;
  readonly authorizationRefs?: readonly string[];
  readonly signal?: AbortSignal;
}

function preFingerprint(plan: TransactionPlan, targetRef: string): string | undefined {
  return plan.expectedPreState.find((binding) => binding.key === targetRef || binding.key === `target:${targetRef}`)?.value;
}

function finalOutcome(results: readonly RollbackEffectResult[], externalPending: boolean): RollbackOutcome {
  if (externalPending && results.every((item) => item.outcome === "RESTORED" || item.outcome === "ALREADY_RESTORED")) return "EXTERNAL_COMPENSATION_REQUIRED";
  if (results.length === 0 || results.every((item) => item.outcome === "ALREADY_RESTORED")) return "ALREADY_RESTORED";
  if (results.every((item) => item.outcome === "RESTORED" || item.outcome === "ALREADY_RESTORED")) return "RESTORED";
  if (results.some((item) => item.outcome === "RESTORED" || item.outcome === "ALREADY_RESTORED")) return "PARTIALLY_RESTORED";
  if (results.some((item) => item.outcome === "CONFLICT")) return "ROLLBACK_CONFLICT";
  if (results.some((item) => item.outcome === "MATERIAL_INVALID")) return "RECOVERY_MATERIAL_INVALID";
  return "ROLLBACK_FAILED";
}

function receipt(input: RollbackTransactionInput, results: readonly RollbackEffectResult[], outcome: RollbackOutcome): RollbackReceipt {
  const base = Object.freeze({
    schemaVersion: 1 as const,
    rollbackContractVersion: "1.0" as const,
    recoveryRunId: input.recoveryRunId,
    originalRunId: input.applyReceipt.runId,
    transactionId: input.applyReceipt.transactionId ?? "NO_TRANSACTION_ID",
    planDigest: input.plan.planDigest,
    targetBinding: input.plan.targetBinding,
    securityClass: input.plan.securityClass,
    effectResults: Object.freeze([...results]),
    outcome,
  });
  return Object.freeze({ ...base, receiptDigest: input.ports.digest.digest(stableTransactionSerialize(base)) });
}

export async function rollbackTransaction(input: RollbackTransactionInput): Promise<RollbackReceipt> {
  if (!verifyTransactionPlanDigest(input.plan, input.ports.digest) || input.applyReceipt.planDigest !== input.plan.planDigest) {
    return receipt(input, [], "RECOVERY_ESCALATION_REQUIRED");
  }
  if (input.ports.effects === undefined) return receipt(input, [], "RECOVERY_ESCALATION_REQUIRED");
  if (input.plan.authorizationRequirements.length > 0) {
    if (input.ports.authorization === undefined) return receipt(input, [], "RECOVERY_ESCALATION_REQUIRED");
    const authorized = await input.ports.authorization.authorize({ runId: input.recoveryRunId, plan: input.plan, authorizationRefs: input.authorizationRefs ?? [] });
    if (!authorized.ok) return receipt(input, [], "RECOVERY_ESCALATION_REQUIRED");
  }

  const byId = new Map(input.plan.intents.map((intent) => [intent.intentId, intent] as const));
  const applied = input.applyReceipt.appliedIntentResults.filter((item) => item.progress !== "NOT_ATTEMPTED").slice().reverse();
  const results: RollbackEffectResult[] = [];

  for (const effect of applied) {
    if (input.signal?.aborted === true) break;
    const intent = byId.get(effect.intentId);
    if (intent === undefined) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "MATERIAL_INVALID" }));
      continue;
    }
    const current = await input.ports.state.observeTargetFingerprint(effect.targetRef);
    if (!current.ok) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "FAILED" }));
      continue;
    }
    const before = preFingerprint(input.plan, effect.targetRef);
    const after = effect.postFingerprint ?? intent.desiredFingerprint;

    const alreadyRestored = intent.kind === "CREATE_MANAGED_ARTIFACT" ? current.value === undefined : before !== undefined && current.value === before;
    if (alreadyRestored) {
      results.push(Object.freeze({
        intentId: effect.intentId,
        targetRef: effect.targetRef,
        outcome: "ALREADY_RESTORED",
        ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value, postRollbackFingerprint: current.value }),
      }));
      continue;
    }

    const transactionStillOwnsCurrent = intent.kind === "REMOVE_MANAGED_ARTIFACT" ? current.value === undefined : after !== undefined && current.value === after;
    if (!transactionStillOwnsCurrent) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "CONFLICT", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      continue;
    }
    if (effect.recoveryRef === undefined || (intent.kind !== "CREATE_MANAGED_ARTIFACT" && before === undefined)) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "MATERIAL_INVALID", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      continue;
    }

    const safe = await input.ports.effects.checkPhysicalSafety(intent);
    if (!safe.ok) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "FAILED", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      continue;
    }
    const restored = await input.ports.effects.restore({
      intent,
      recoveryRef: effect.recoveryRef,
      ...(after === undefined ? {} : { expectedCurrentFingerprint: after }),
      ...(before === undefined ? {} : { expectedPreFingerprint: before }),
    });
    if (!restored.ok) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "FAILED", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      continue;
    }
    const verified = await input.ports.state.observeTargetFingerprint(effect.targetRef);
    const expectedRestored = intent.kind === "CREATE_MANAGED_ARTIFACT" ? undefined : before;
    if (!verified.ok || verified.value !== expectedRestored) {
      results.push(Object.freeze({
        intentId: effect.intentId,
        targetRef: effect.targetRef,
        outcome: "FAILED",
        ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }),
        ...(verified.ok && verified.value !== undefined ? { postRollbackFingerprint: verified.value } : {}),
      }));
      continue;
    }
    results.push(Object.freeze({
      intentId: effect.intentId,
      targetRef: effect.targetRef,
      outcome: "RESTORED",
      ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }),
      ...(verified.value === undefined ? {} : { postRollbackFingerprint: verified.value }),
    }));
  }

  return receipt(input, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
}

export function rollbackIntentFor(plan: TransactionPlan, intentId: string): TransactionIntent | undefined {
  return plan.intents.find((intent) => intent.intentId === intentId);
}
