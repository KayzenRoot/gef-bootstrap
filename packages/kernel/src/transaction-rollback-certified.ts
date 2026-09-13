import { stableTransactionSerialize, verifyTransactionPlanDigest } from "./transaction-plan-engine.js";
import type { RollbackJournalSnapshot, RollbackPhase } from "./transaction-recovery-types.js";
import type { TransactionPorts } from "./transaction-ports.js";
import type {
  AppliedIntentResult,
  ApplyReceipt,
  RollbackEffectResult,
  RollbackOutcome,
  RollbackReceipt,
  TransactionIntent,
  TransactionPlan,
} from "./transaction-types.js";

export interface RollbackTransactionInput {
  readonly plan: TransactionPlan;
  readonly applyReceipt: ApplyReceipt;
  readonly recoveryRunId: string;
  readonly ports: TransactionPorts;
  readonly authorizationRefs?: readonly string[];
  readonly signal?: AbortSignal;
  readonly deadlineMs?: number;
  readonly nowMs?: () => number;
}

function preFingerprint(plan: TransactionPlan, targetRef: string): string | undefined {
  return plan.expectedPreState.find((binding) => binding.key === targetRef || binding.key === `target:${targetRef}`)?.value;
}

function stopped(input: RollbackTransactionInput): boolean {
  if (input.signal?.aborted === true) return true;
  return input.deadlineMs !== undefined && (input.nowMs?.() ?? Date.now()) >= input.deadlineMs;
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

function validApplyReceipt(input: RollbackTransactionInput): boolean {
  const source = input.applyReceipt;
  if (source.schemaVersion !== 1 || source.applyContractVersion !== "1.0") return false;
  if (source.planDigest !== input.plan.planDigest || source.securityClass !== input.plan.securityClass) return false;
  if (stableTransactionSerialize(source.targetBinding) !== stableTransactionSerialize(input.plan.targetBinding)) return false;
  const { receiptDigest: _ignored, ...base } = source;
  if (input.ports.digest.digest(stableTransactionSerialize(base)) !== source.receiptDigest) return false;

  const byId = new Map(input.plan.intents.map((intent) => [intent.intentId, intent] as const));
  const seen = new Set<string>();
  for (const effect of source.appliedIntentResults) {
    if (seen.has(effect.intentId)) return false;
    seen.add(effect.intentId);
    const intent = byId.get(effect.intentId);
    if (intent === undefined || effect.targetRef !== intent.targetRef) return false;
    if (effect.progress !== "NOT_ATTEMPTED" && intent.recoveryClass === "REVERSIBLE_MANAGED" && (effect.recoveryRef === undefined || effect.recoveryRef.length === 0)) return false;
  }

  const expectedChanged = [...new Set(source.appliedIntentResults.filter((item) => item.progress !== "NOT_ATTEMPTED").map((item) => item.targetRef))].sort();
  const actualChanged = [...source.changedTargets].sort();
  return stableTransactionSerialize(expectedChanged) === stableTransactionSerialize(actualChanged);
}

function recoveryRefs(applied: readonly AppliedIntentResult[]) {
  return Object.freeze(applied.flatMap((effect) => effect.recoveryRef === undefined ? [] : [{ intentId: effect.intentId, targetRef: effect.targetRef, recoveryRef: effect.recoveryRef }]));
}

function journalSnapshot(
  input: RollbackTransactionInput,
  phase: RollbackPhase,
  applied: readonly AppliedIntentResult[],
  results: readonly RollbackEffectResult[],
  terminalOutcome?: RollbackOutcome,
): RollbackJournalSnapshot {
  return Object.freeze({
    schemaVersion: 1,
    recoveryRunId: input.recoveryRunId,
    originalRunId: input.applyReceipt.runId,
    transactionId: input.applyReceipt.transactionId ?? "NO_TRANSACTION_ID",
    planDigest: input.plan.planDigest,
    targetBinding: input.plan.targetBinding,
    securityClass: input.plan.securityClass,
    phase,
    effectResults: Object.freeze([...results]),
    recoveryRefs: recoveryRefs(applied),
    ...(terminalOutcome === undefined ? {} : { terminalOutcome }),
  });
}

async function beginJournal(input: RollbackTransactionInput, applied: readonly AppliedIntentResult[], results: readonly RollbackEffectResult[]): Promise<boolean> {
  const fn = input.ports.journal?.beginRollback;
  if (fn === undefined) return false;
  const result = await fn(journalSnapshot(input, "ROLLBACK_PREPARING", applied, results));
  return result.ok;
}

async function updateJournal(input: RollbackTransactionInput, applied: readonly AppliedIntentResult[], results: readonly RollbackEffectResult[], phase: RollbackPhase): Promise<boolean> {
  const fn = input.ports.journal?.updateRollback;
  if (fn === undefined) return false;
  const result = await fn(journalSnapshot(input, phase, applied, results));
  return result.ok;
}

async function finishJournal(input: RollbackTransactionInput, applied: readonly AppliedIntentResult[], results: readonly RollbackEffectResult[], outcome: RollbackOutcome): Promise<boolean> {
  const fn = input.ports.journal?.finishRollback;
  if (fn === undefined) return false;
  const result = await fn(journalSnapshot(input, "ROLLBACK_RECEIPTING", applied, results, outcome));
  return result.ok;
}

function markRemainingFailed(applied: readonly AppliedIntentResult[], fromIndex: number, results: RollbackEffectResult[]): void {
  for (let index = fromIndex; index < applied.length; index += 1) {
    const effect = applied[index];
    if (effect !== undefined) results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "FAILED" }));
  }
}

async function authorizeEffect(input: RollbackTransactionInput, intent: TransactionIntent): Promise<boolean> {
  if (input.plan.authorizationRequirements.length === 0) return true;
  const authorization = input.ports.authorization;
  if (authorization === undefined) return false;
  const result = await authorization.authorize({
    runId: input.recoveryRunId,
    plan: input.plan,
    authorizationRefs: input.authorizationRefs ?? [],
    phase: "ROLLBACK",
    intent,
  });
  return result.ok;
}

async function terminalReceipt(input: RollbackTransactionInput, applied: readonly AppliedIntentResult[], results: readonly RollbackEffectResult[], outcome: RollbackOutcome): Promise<RollbackReceipt> {
  const journaled = await finishJournal(input, applied, results, outcome);
  return receipt(input, results, journaled ? outcome : "RECOVERY_ESCALATION_REQUIRED");
}

export async function rollbackTransaction(input: RollbackTransactionInput): Promise<RollbackReceipt> {
  if (!verifyTransactionPlanDigest(input.plan, input.ports.digest) || !validApplyReceipt(input)) return receipt(input, [], "RECOVERY_ESCALATION_REQUIRED");
  if (input.ports.effects === undefined) return receipt(input, [], "RECOVERY_ESCALATION_REQUIRED");

  const byId = new Map(input.plan.intents.map((intent) => [intent.intentId, intent] as const));
  const applied = input.applyReceipt.appliedIntentResults.filter((item) => item.progress !== "NOT_ATTEMPTED").slice().reverse();
  const results: RollbackEffectResult[] = [];
  if (applied.length === 0) return receipt(input, results, input.applyReceipt.externalEffectRefs.length > 0 ? "EXTERNAL_COMPENSATION_REQUIRED" : "ALREADY_RESTORED");
  if (input.applyReceipt.transactionId === undefined) return receipt(input, [], "RECOVERY_ESCALATION_REQUIRED");
  if (input.ports.effects.verifyRecoveryMaterial === undefined) return receipt(input, [], "RECOVERY_ESCALATION_REQUIRED");
  if (!await beginJournal(input, applied, results)) return receipt(input, [], "RECOVERY_ESCALATION_REQUIRED");

  for (let index = 0; index < applied.length; index += 1) {
    const effect = applied[index];
    if (effect === undefined) continue;
    if (stopped(input)) {
      markRemainingFailed(applied, index, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    const intent = byId.get(effect.intentId);
    if (intent === undefined) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "MATERIAL_INVALID" }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    const current = await input.ports.state.observeTargetFingerprint(effect.targetRef);
    if (!current.ok) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "FAILED" }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
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
      if (!await updateJournal(input, applied, results, "ROLLBACK_VERIFYING")) return receipt(input, results, "RECOVERY_ESCALATION_REQUIRED");
      continue;
    }

    const transactionStillOwnsCurrent = intent.kind === "REMOVE_MANAGED_ARTIFACT" ? current.value === undefined : after !== undefined && current.value === after;
    if (!transactionStillOwnsCurrent) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "CONFLICT", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    if (effect.recoveryRef === undefined || (intent.kind !== "CREATE_MANAGED_ARTIFACT" && before === undefined)) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "MATERIAL_INVALID", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    const material = await input.ports.effects.verifyRecoveryMaterial({
      phase: "ROLLBACK",
      planDigest: input.plan.planDigest,
      transactionId: input.applyReceipt.transactionId,
      intent,
      recoveryRef: effect.recoveryRef,
      ...(before === undefined ? {} : { expectedPreFingerprint: before }),
      ...(after === undefined ? {} : { expectedPostFingerprint: after }),
    });
    if (!material.ok) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "MATERIAL_INVALID", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    if (!await authorizeEffect(input, intent)) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "FAILED", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    const safe = await input.ports.effects.checkPhysicalSafety(intent);
    if (!safe.ok) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "FAILED", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    const barrier = await input.ports.effects.revalidateCommitBarrier(input.plan);
    if (!barrier.ok || stopped(input)) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "FAILED", ...(current.value === undefined ? {} : { preRollbackFingerprint: current.value }) }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    const currentAtBarrier = await input.ports.state.observeTargetFingerprint(effect.targetRef);
    const stillOwnedAtBarrier = currentAtBarrier.ok && (intent.kind === "REMOVE_MANAGED_ARTIFACT" ? currentAtBarrier.value === undefined : after !== undefined && currentAtBarrier.value === after);
    if (!stillOwnedAtBarrier) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "CONFLICT", ...(currentAtBarrier.ok && currentAtBarrier.value !== undefined ? { preRollbackFingerprint: currentAtBarrier.value } : {}) }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    if (!await updateJournal(input, applied, results, "ROLLBACK_BARRIER")) return receipt(input, results, "RECOVERY_ESCALATION_REQUIRED");
    const restored = await input.ports.effects.restore({
      intent,
      recoveryRef: effect.recoveryRef,
      ...(after === undefined ? {} : { expectedCurrentFingerprint: after }),
      ...(before === undefined ? {} : { expectedPreFingerprint: before }),
    });
    if (!restored.ok) {
      results.push(Object.freeze({ intentId: effect.intentId, targetRef: effect.targetRef, outcome: "FAILED", ...(currentAtBarrier.value === undefined ? {} : { preRollbackFingerprint: currentAtBarrier.value }) }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    const verified = await input.ports.state.observeTargetFingerprint(effect.targetRef);
    const expectedRestored = intent.kind === "CREATE_MANAGED_ARTIFACT" ? undefined : before;
    if (!verified.ok || verified.value !== expectedRestored) {
      results.push(Object.freeze({
        intentId: effect.intentId,
        targetRef: effect.targetRef,
        outcome: "FAILED",
        ...(currentAtBarrier.value === undefined ? {} : { preRollbackFingerprint: currentAtBarrier.value }),
        ...(verified.ok && verified.value !== undefined ? { postRollbackFingerprint: verified.value } : {}),
      }));
      markRemainingFailed(applied, index + 1, results);
      return terminalReceipt(input, applied, results, finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0));
    }

    results.push(Object.freeze({
      intentId: effect.intentId,
      targetRef: effect.targetRef,
      outcome: "RESTORED",
      ...(currentAtBarrier.value === undefined ? {} : { preRollbackFingerprint: currentAtBarrier.value }),
      ...(verified.value === undefined ? {} : { postRollbackFingerprint: verified.value }),
    }));
    if (!await updateJournal(input, applied, results, "ROLLBACK_VERIFYING")) return receipt(input, results, "RECOVERY_ESCALATION_REQUIRED");
  }

  const outcome = finalOutcome(results, input.applyReceipt.externalEffectRefs.length > 0);
  return terminalReceipt(input, applied, results, outcome);
}

export function rollbackIntentFor(plan: TransactionPlan, intentId: string): TransactionIntent | undefined {
  return plan.intents.find((intent) => intent.intentId === intentId);
}
