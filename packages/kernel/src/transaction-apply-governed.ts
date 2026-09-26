import { createGefError } from "./errors.js";
import { dryRunTransaction } from "./transaction-dry-run.js";
import { stableTransactionSerialize, topologicalIntents, validateTransactionPlanBody, verifyTransactionPlanDigest } from "./transaction-plan-engine.js";
import type { TransactionPorts } from "./transaction-ports.js";
import { evaluateStateBinding } from "./transaction-state.js";
import type {
  AppliedIntentResult,
  ApplyOutcome,
  ApplyReceipt,
  ApplyResult,
  TransactionJournalSnapshot,
  TransactionPhase,
  TransactionPlan,
  TransactionStateBinding,
} from "./transaction-types.js";

export interface ApplyTransactionInput {
  readonly plan: TransactionPlan;
  readonly runId: string;
  readonly transactionId?: string;
  readonly authorizationRefs?: readonly string[];
  readonly signal?: AbortSignal;
  readonly deadlineMs?: number;
  readonly nowMs?: () => number;
  readonly ports: TransactionPorts;
}

function stopped(input: ApplyTransactionInput): "CANCELLED" | "TIMEOUT" | undefined {
  if (input.signal?.aborted === true) return "CANCELLED";
  if (input.deadlineMs !== undefined && (input.nowMs?.() ?? Date.now()) >= input.deadlineMs) return "TIMEOUT";
  return undefined;
}

function failure(input: ApplyTransactionInput, outcome: Exclude<ApplyOutcome, "APPLIED" | "NOOP_APPLIED">, reason: string, summary: string, category: "PRECONDITION" | "AUTHORIZATION" | "CAPABILITY" | "EXECUTION" | "VERIFICATION" | "RECOVERY" | "CANCELLED" | "TIMEOUT" = "EXECUTION", receipt?: ApplyReceipt): ApplyResult {
  const terminal = outcome === "RECOVERY_REQUIRED" || outcome === "FAILED_POST_STATE_VERIFICATION" ? "RECOVERY_REQUIRED" : outcome === "PARTIAL_EXTERNAL_EFFECT" ? "PARTIAL_EXTERNAL_EFFECT" : category === "CANCELLED" ? "CANCELLED" : category === "TIMEOUT" ? "TIMED_OUT" : "BLOCKED";
  const effectStatus = outcome === "RECOVERY_REQUIRED" || outcome === "FAILED_POST_STATE_VERIFICATION" ? "PARTIAL" : outcome === "PARTIAL_EXTERNAL_EFFECT" ? "CONFIRMED" : "NONE";
  return Object.freeze({
    ok: false,
    outcome,
    error: createGefError({
      id: `m05-apply-${input.runId}-${reason}`,
      category,
      reason: `transaction_apply.${reason}`,
      severity: terminal === "RECOVERY_REQUIRED" ? "CRITICAL" : "ERROR",
      summary,
      retryability: effectStatus === "NONE" ? "NEVER" : "REQUIRES_EFFECT_CHECK",
      recoverability: terminal === "RECOVERY_REQUIRED" ? "RECOVERY_REQUIRED" : "NONE_REQUIRED",
      effectStatus,
      terminal,
      runId: input.runId,
      targetRef: input.plan.targetBinding.targetRef,
      metadata: { planDigest: input.plan.planDigest },
    }),
    ...(receipt === undefined ? {} : { receipt }),
  });
}

async function revalidatePreState(plan: TransactionPlan, ports: TransactionPorts): Promise<{ readonly ok: true; readonly bindings: readonly TransactionStateBinding[] } | { readonly ok: false; readonly reason: string }> {
  const observed: TransactionStateBinding[] = [];
  for (const binding of plan.expectedPreState) {
    const result = await evaluateStateBinding(binding, ports);
    if (!result.ok) return { ok: false, reason: result.error.summary };
    if (!result.value.matches) return { ok: false, reason: `State binding ${binding.key} is stale` };
    observed.push(Object.freeze({ ...binding, value: result.value.observedValue }));
  }
  return { ok: true, bindings: Object.freeze(observed) };
}

function journalSnapshot(input: ApplyTransactionInput, transactionId: string, phase: TransactionPhase, preStateBindings: readonly TransactionStateBinding[], intentResults: readonly AppliedIntentResult[], terminalOutcome?: ApplyOutcome): TransactionJournalSnapshot {
  return Object.freeze({
    schemaVersion: 1,
    transactionId,
    runId: input.runId,
    planDigest: input.plan.planDigest,
    targetBinding: input.plan.targetBinding,
    securityClass: input.plan.securityClass,
    phase,
    preStateBindings,
    intentResults: Object.freeze([...intentResults]),
    ...(terminalOutcome === undefined ? {} : { terminalOutcome }),
  });
}

function makeReceipt(input: ApplyTransactionInput, outcome: ApplyOutcome, preStateBindings: readonly TransactionStateBinding[], appliedIntentResults: readonly AppliedIntentResult[], verificationResults: readonly string[], postStateBindings: readonly TransactionStateBinding[], transactionId?: string): ApplyReceipt {
  const changedTargets = [...new Set(appliedIntentResults.filter((item) => item.progress !== "NOT_ATTEMPTED").map((item) => item.targetRef))].sort();
  const base = {
    schemaVersion: 1 as const,
    applyContractVersion: "1.0" as const,
    runId: input.runId,
    ...(transactionId === undefined ? {} : { transactionId }),
    planDigest: input.plan.planDigest,
    targetBinding: input.plan.targetBinding,
    securityClass: input.plan.securityClass,
    preStateBindings,
    appliedIntentResults: Object.freeze([...appliedIntentResults]),
    changedTargets: Object.freeze(changedTargets),
    verificationResults: Object.freeze([...verificationResults]),
    postStateBindings: Object.freeze([...postStateBindings]),
    externalEffectRefs: Object.freeze([] as string[]),
    outcome,
  };
  return Object.freeze({ ...base, receiptDigest: input.ports.digest.digest(stableTransactionSerialize(base)) });
}

async function updateJournal(input: ApplyTransactionInput, transactionId: string, phase: TransactionPhase, preState: readonly TransactionStateBinding[], results: readonly AppliedIntentResult[], terminalOutcome?: ApplyOutcome): Promise<boolean> {
  const journal = input.ports.journal;
  if (journal === undefined) return false;
  const snapshot = journalSnapshot(input, transactionId, phase, preState, results, terminalOutcome);
  const result = phase === "PREPARING_TRANSACTION" ? await journal.begin(snapshot) : terminalOutcome === undefined ? await journal.update(snapshot) : await journal.finish(snapshot);
  return result.ok;
}

async function abortPrivate(
  input: ApplyTransactionInput,
  transactionId: string,
  phase: TransactionPhase,
  preState: readonly TransactionStateBinding[],
  results: readonly AppliedIntentResult[],
  reason: string,
  summary: string,
  category: "PRECONDITION" | "AUTHORIZATION" | "CAPABILITY" | "EXECUTION" | "VERIFICATION" | "RECOVERY" | "CANCELLED" | "TIMEOUT",
): Promise<ApplyResult> {
  await updateJournal(input, transactionId, phase, preState, results, "ABORTED_STAGED_NO_TARGET_EFFECT");
  if (input.ports.effects !== undefined) await input.ports.effects.cleanup({ transactionId, successful: false });
  return failure(input, "ABORTED_STAGED_NO_TARGET_EFFECT", reason, summary, category);
}

async function authorize(input: ApplyTransactionInput): Promise<{ readonly ok: true } | { readonly ok: false; readonly summary: string }> {
  if (input.plan.authorizationRequirements.length === 0) return { ok: true };
  if (input.ports.authorization === undefined) return { ok: false, summary: "Authorization capability is required before mutation" };
  const authorization = await input.ports.authorization.authorize({ runId: input.runId, plan: input.plan, authorizationRefs: input.authorizationRefs ?? [] });
  return authorization.ok ? { ok: true } : { ok: false, summary: authorization.error.summary };
}

export async function applyTransaction(input: ApplyTransactionInput): Promise<ApplyResult> {
  const valid = validateTransactionPlanBody(input.plan);
  if (!valid.ok || !verifyTransactionPlanDigest(input.plan, input.ports.digest)) return failure(input, "BLOCKED_BEFORE_EFFECT", "invalid_plan", "Transaction plan is invalid or its digest is stale", "PRECONDITION");

  const stopBefore = stopped(input);
  if (stopBefore !== undefined) return failure(input, "BLOCKED_BEFORE_EFFECT", stopBefore.toLowerCase(), `Transaction ${stopBefore.toLowerCase()} before effects`, stopBefore);
  if (input.plan.externalEffectDeclarations.length > 0 || input.plan.intents.some((intent) => intent.kind === "EXTERNAL_SAGA_EFFECT")) return failure(input, "BLOCKED_BEFORE_EFFECT", "external_saga_delegated", "External effects require their owning Git/provider saga executor", "CAPABILITY");

  const dryRun = await dryRunTransaction(input.plan, input.ports);
  if (dryRun.outcome === "NOOP") {
    const receipt = makeReceipt(input, "NOOP_APPLIED", dryRun.observedStateBindings, [], ["NOOP_REVALIDATED"], dryRun.observedStateBindings);
    return Object.freeze({ ok: true, outcome: "NOOP_APPLIED", receipt });
  }
  if (dryRun.outcome !== "READY") return failure(input, "BLOCKED_BEFORE_EFFECT", `dry_run_${dryRun.outcome.toLowerCase()}`, `Apply blocked because dry run is ${dryRun.outcome}`, "PRECONDITION");

  const preState = await revalidatePreState(input.plan, input.ports);
  if (!preState.ok) return failure(input, "BLOCKED_BEFORE_EFFECT", "stale_pre_state", preState.reason, "PRECONDITION");
  const initialAuthorization = await authorize(input);
  if (!initialAuthorization.ok) return failure(input, "BLOCKED_BEFORE_EFFECT", "authorization_denied", initialAuthorization.summary, "AUTHORIZATION");

  const ordered = topologicalIntents(input.plan);
  if (!ordered.ok) return failure(input, "BLOCKED_BEFORE_EFFECT", "ordering_invalid", ordered.error.summary, "PRECONDITION");
  if (ordered.value.length === 0) {
    const receipt = makeReceipt(input, "NOOP_APPLIED", preState.bindings, [], ["NO_MUTATION_INTENTS"], preState.bindings);
    return Object.freeze({ ok: true, outcome: "NOOP_APPLIED", receipt });
  }
  if (input.transactionId === undefined) return failure(input, "BLOCKED_BEFORE_EFFECT", "transaction_id_required", "Mutation transaction requires an explicit transaction identity", "PRECONDITION");
  if (input.ports.journal === undefined) return failure(input, "BLOCKED_BEFORE_EFFECT", "journal_port_missing", "Mutation transaction requires a journal port", "CAPABILITY");
  if (input.ports.effects === undefined) return failure(input, "BLOCKED_BEFORE_EFFECT", "effect_port_missing", "M06/owning physical effect capability is unavailable", "CAPABILITY");

  const transactionId = input.transactionId;
  const results: AppliedIntentResult[] = [];
  if (!await updateJournal(input, transactionId, "PREPARING_TRANSACTION", preState.bindings, results)) return failure(input, "ABORTED_STAGED_NO_TARGET_EFFECT", "journal_begin_failed", "Transaction journal could not be started", "EXECUTION");

  for (const intent of ordered.value) {
    const stop = stopped(input);
    if (stop !== undefined) return abortPrivate(input, transactionId, "STAGING", preState.bindings, results, stop.toLowerCase(), `Transaction ${stop.toLowerCase()} before target-visible effects`, stop);
    const safe = await input.ports.effects.checkPhysicalSafety(intent);
    if (!safe.ok) return abortPrivate(input, transactionId, "STAGING", preState.bindings, results, "physical_safety_unavailable", safe.error.summary, "CAPABILITY");

    let recoveryRef: string | undefined;
    if (intent.recoveryClass === "REVERSIBLE_MANAGED") {
      const recovery = await input.ports.effects.captureRecovery(intent);
      if (!recovery.ok || recovery.value === undefined) return abortPrivate(input, transactionId, "CAPTURING_RECOVERY", preState.bindings, results, "recovery_capture_failed", recovery.ok ? "Required recovery material was not produced" : recovery.error.summary, "RECOVERY");
      recoveryRef = recovery.value;
    }

    const staged = await input.ports.effects.stage(intent);
    if (!staged.ok) return abortPrivate(input, transactionId, "STAGING", preState.bindings, results, "stage_failed", staged.error.summary, "EXECUTION");
    const stagedObligations = input.plan.verificationObligations.filter((item) => item.phase === "STAGED" && (item.targetRef === undefined || item.targetRef === intent.targetRef));
    const verified = await input.ports.effects.verifyStaged(intent, stagedObligations);
    if (!verified.ok) return abortPrivate(input, transactionId, "VERIFYING_STAGED", preState.bindings, results, "staged_verification_failed", verified.error.summary, "VERIFICATION");
    results.push(Object.freeze({ intentId: intent.intentId, targetRef: intent.targetRef, progress: "NOT_ATTEMPTED", ...(recoveryRef === undefined ? {} : { recoveryRef }) }));
  }

  if (!await updateJournal(input, transactionId, "VERIFYING_STAGED", preState.bindings, results)) return abortPrivate(input, transactionId, "VERIFYING_STAGED", preState.bindings, results, "journal_update_failed", "Transaction journal could not record staged verification", "RECOVERY");
  const barrierState = await revalidatePreState(input.plan, input.ports);
  if (!barrierState.ok) return abortPrivate(input, transactionId, "COMMIT_BARRIER", preState.bindings, results, "commit_barrier_stale", barrierState.reason, "PRECONDITION");
  const barrierAuthorization = await authorize(input);
  if (!barrierAuthorization.ok) return abortPrivate(input, transactionId, "COMMIT_BARRIER", preState.bindings, results, "commit_barrier_authorization_denied", barrierAuthorization.summary, "AUTHORIZATION");
  const barrier = await input.ports.effects.revalidateCommitBarrier(input.plan);
  if (!barrier.ok) return abortPrivate(input, transactionId, "COMMIT_BARRIER", preState.bindings, results, "commit_barrier_blocked", barrier.error.summary, "PRECONDITION");
  if (!await updateJournal(input, transactionId, "COMMIT_BARRIER", preState.bindings, results)) return abortPrivate(input, transactionId, "COMMIT_BARRIER", preState.bindings, results, "journal_commit_barrier_failed", "Transaction journal could not record the commit barrier", "RECOVERY");

  for (let index = 0; index < ordered.value.length; index += 1) {
    const intent = ordered.value[index];
    const currentResult = results[index];
    if (intent === undefined || currentResult === undefined) continue;

    const stop = stopped(input);
    if (stop !== undefined) {
      const targetEffectObserved = results.some((item) => item.progress !== "NOT_ATTEMPTED");
      if (!targetEffectObserved) return abortPrivate(input, transactionId, "COMMIT_BARRIER", preState.bindings, results, stop.toLowerCase(), `Transaction ${stop.toLowerCase()} before first target-visible effect`, stop);
      const receipt = makeReceipt(input, "RECOVERY_REQUIRED", preState.bindings, results, [stop], [], transactionId);
      await updateJournal(input, transactionId, "PROMOTING", preState.bindings, results, "RECOVERY_REQUIRED");
      return failure(input, "RECOVERY_REQUIRED", stop.toLowerCase(), `Transaction ${stop.toLowerCase()} after a target-visible effect`, stop, receipt);
    }

    const promoted = await input.ports.effects.promote(intent);
    if (!promoted.ok) {
      results[index] = Object.freeze({
        intentId: currentResult.intentId,
        targetRef: currentResult.targetRef,
        progress: "FAILED_AFTER_PROMOTION",
        ...(currentResult.recoveryRef === undefined ? {} : { recoveryRef: currentResult.recoveryRef }),
      });
      const receipt = makeReceipt(input, "RECOVERY_REQUIRED", preState.bindings, results, ["PROMOTION_FAILED_EFFECT_UNKNOWN"], [], transactionId);
      await updateJournal(input, transactionId, "PROMOTING", preState.bindings, results, "RECOVERY_REQUIRED");
      return failure(input, "RECOVERY_REQUIRED", "promotion_failed", promoted.error.summary, "RECOVERY", receipt);
    }

    results[index] = Object.freeze({
      intentId: currentResult.intentId,
      targetRef: currentResult.targetRef,
      progress: "VERIFICATION_PENDING",
      ...(promoted.value.postFingerprint === undefined ? {} : { postFingerprint: promoted.value.postFingerprint }),
      ...(currentResult.recoveryRef === undefined ? {} : { recoveryRef: currentResult.recoveryRef }),
    });
    if (!await updateJournal(input, transactionId, "PROMOTING", preState.bindings, results)) {
      const receipt = makeReceipt(input, "RECOVERY_REQUIRED", preState.bindings, results, ["JOURNAL_UPDATE_FAILED_AFTER_PROMOTION"], [], transactionId);
      return failure(input, "RECOVERY_REQUIRED", "journal_update_failed_after_promotion", "Target effect occurred but transaction journal could not record it", "RECOVERY", receipt);
    }
  }

  const postObligations = input.plan.verificationObligations.filter((item) => item.phase === "POST_STATE");
  const post = await input.ports.effects.verifyPostState(input.plan, results, postObligations);
  if (!post.ok) {
    const failedResults = results.map((item) => Object.freeze({ ...item, progress: item.progress === "VERIFICATION_PENDING" ? "FAILED_AFTER_PROMOTION" as const : item.progress }));
    const receipt = makeReceipt(input, "FAILED_POST_STATE_VERIFICATION", preState.bindings, failedResults, ["POST_STATE_VERIFICATION_FAILED"], [], transactionId);
    await updateJournal(input, transactionId, "VERIFYING_POST_STATE", preState.bindings, failedResults, "FAILED_POST_STATE_VERIFICATION");
    return failure(input, "FAILED_POST_STATE_VERIFICATION", "post_state_verification_failed", post.error.summary, "VERIFICATION", receipt);
  }

  const verifiedResults = results.map((item) => Object.freeze({ ...item, progress: "VERIFIED" as const }));
  const verificationResults = postObligations.map((item) => item.verificationId);
  const journalFinished = await updateJournal(input, transactionId, "RECEIPTING", preState.bindings, verifiedResults, "APPLIED");
  if (!journalFinished) verificationResults.push("JOURNAL_FINALIZATION_FAILED");
  const cleanup = await input.ports.effects.cleanup({ transactionId, successful: true });
  if (!cleanup.ok) verificationResults.push("CLEANUP_FAILED");
  const receipt = makeReceipt(input, "APPLIED", preState.bindings, verifiedResults, verificationResults, post.value, transactionId);
  return Object.freeze({ ok: true, outcome: "APPLIED", receipt });
}
