import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  applyTransaction,
  compileTransactionPlan,
  createGefError,
  rollbackTransaction,
} from "../packages/kernel/dist/index.js";

const digest = { digest: (text) => createHash("sha256").update(text).digest("hex") };

function failure(reason, summary = reason) {
  return {
    ok: false,
    error: createGefError({
      id: `test-${reason}`,
      category: "EXECUTION",
      reason: `test.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
    }),
  };
}

function baseBody(overrides = {}) {
  return {
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: "project:test", projectId: "project-1", bindingStrength: "PROJECT" },
    expectedPreState: [{ key: "target:file:a", owner: "fixture", predicate: "EXACT", value: "before" }],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: [],
    mutationSurface: ["file:a"],
    intents: [{ intentId: "i1", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:a", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "after", payloadRef: "payload:opaque" }],
    ordering: [],
    verificationObligations: [{ verificationId: "stage-a", phase: "STAGED", targetRef: "file:a" }, { verificationId: "post-a", phase: "POST_STATE", targetRef: "file:a" }],
    recoveryRequirements: [{ intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "preimage" }],
    externalEffectDeclarations: [],
    policyRefs: [],
    ...overrides,
  };
}

function compile(overrides = {}) {
  const result = compileTransactionPlan(baseBody(overrides), digest);
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function fixture(options = {}) {
  const targetState = new Map(Object.entries(options.targetState ?? { "file:a": "before", "file:unrelated": "legacy" }));
  const preState = new Map(Object.entries(options.preState ?? { "target:file:a": "before" }));
  let bindingCalls = 0;
  let authCalls = 0;
  const calls = { journalBegin: 0, journalUpdate: 0, journalFinish: 0, cleanup: 0, promote: [], restore: [], stage: 0, verifyStaged: 0, barrier: 0, observedTargets: [] };
  const journals = [];

  const state = {
    observeBinding: async (binding) => {
      bindingCalls += 1;
      if (options.staleBindingCall !== undefined && bindingCalls >= options.staleBindingCall) return { ok: true, value: "changed" };
      return { ok: true, value: preState.get(binding.key) };
    },
    observeTargetFingerprint: async (targetRef) => {
      calls.observedTargets.push(targetRef);
      return { ok: true, value: targetState.get(targetRef) };
    },
  };

  const journal = {
    begin: async (snapshot) => { calls.journalBegin += 1; journals.push(snapshot); return { ok: true, value: true }; },
    update: async (snapshot) => { calls.journalUpdate += 1; journals.push(snapshot); return { ok: true, value: true }; },
    finish: async (snapshot) => { calls.journalFinish += 1; journals.push(snapshot); return { ok: true, value: true }; },
  };

  const effects = {
    checkPhysicalSafety: async () => options.safetyFail ? failure("safety") : { ok: true, value: true },
    captureRecovery: async (intent) => options.recoveryFail ? failure("recovery") : { ok: true, value: `recovery:${intent.intentId}` },
    stage: async () => { calls.stage += 1; if (options.abortOnStage) options.abortOnStage(); return options.stageFail ? failure("stage") : { ok: true, value: true }; },
    verifyStaged: async () => { calls.verifyStaged += 1; return options.verifyStageFail ? failure("verify_stage") : { ok: true, value: true }; },
    revalidateCommitBarrier: async () => { calls.barrier += 1; return options.barrierFail ? failure("barrier") : { ok: true, value: true }; },
    promote: async (intent) => {
      calls.promote.push(intent.intentId);
      if (options.promoteFailIntent === intent.intentId) return failure("promote");
      if (intent.kind === "REMOVE_MANAGED_ARTIFACT") targetState.delete(intent.targetRef);
      else targetState.set(intent.targetRef, intent.desiredFingerprint ?? `after:${intent.intentId}`);
      return { ok: true, value: { ...(targetState.get(intent.targetRef) === undefined ? {} : { postFingerprint: targetState.get(intent.targetRef) }) } };
    },
    verifyPostState: async (plan) => options.postFail ? failure("post") : { ok: true, value: plan.intents.map((intent) => ({ key: `target:${intent.targetRef}`, owner: "fixture", predicate: "EXACT", value: targetState.get(intent.targetRef) ?? "ABSENT" })) },
    cleanup: async () => { calls.cleanup += 1; return options.cleanupFail ? failure("cleanup") : { ok: true, value: true }; },
    restore: async ({ intent, expectedPreFingerprint }) => {
      calls.restore.push(intent.intentId);
      if (options.restoreFail) return failure("restore");
      if (intent.kind === "CREATE_MANAGED_ARTIFACT") targetState.delete(intent.targetRef);
      else if (expectedPreFingerprint === undefined) targetState.delete(intent.targetRef);
      else targetState.set(intent.targetRef, expectedPreFingerprint);
      return { ok: true, value: { ...(targetState.get(intent.targetRef) === undefined ? {} : { postFingerprint: targetState.get(intent.targetRef) }) } };
    },
  };

  const authorization = {
    authorize: async () => {
      authCalls += 1;
      if (options.denyAuthorizationCall === authCalls) return failure("authorization");
      return { ok: true, value: true };
    },
  };

  return {
    ports: { digest, state, journal, effects, authorization },
    targetState,
    preState,
    calls,
    journals,
    authCalls: () => authCalls,
  };
}

async function apply(plan, fx, overrides = {}) {
  return applyTransaction({ plan, runId: "run-1", transactionId: "tx-1", ports: fx.ports, ...overrides });
}

test("missing physical effect capability blocks before journal mutation", async () => {
  const plan = compile();
  const fx = fixture();
  const result = await applyTransaction({ plan, runId: "run-1", transactionId: "tx-1", ports: { digest, state: fx.ports.state, journal: fx.ports.journal } });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "BLOCKED_BEFORE_EFFECT");
  assert.equal(fx.calls.journalBegin, 0);
});

test("staged verification failure terminalizes private journal and cleans without promotion", async () => {
  const fx = fixture({ verifyStageFail: true });
  const result = await apply(compile(), fx);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "ABORTED_STAGED_NO_TARGET_EFFECT");
  assert.equal(fx.calls.journalBegin, 1);
  assert.equal(fx.calls.journalFinish, 1);
  assert.equal(fx.calls.cleanup, 1);
  assert.deepEqual(fx.calls.promote, []);
  assert.equal(fx.journals.at(-1).terminalOutcome, "ABORTED_STAGED_NO_TARGET_EFFECT");
});

test("commit barrier detects late stale state and aborts before target effect", async () => {
  const fx = fixture({ staleBindingCall: 3 });
  const result = await apply(compile(), fx);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "ABORTED_STAGED_NO_TARGET_EFFECT");
  assert.deepEqual(fx.calls.promote, []);
  assert.equal(fx.calls.cleanup, 1);
});

test("authorization is revalidated at commit barrier", async () => {
  const plan = compile({ authorizationRequirements: ["auth:m05"] });
  const fx = fixture({ denyAuthorizationCall: 2 });
  const result = await apply(plan, fx, { authorizationRefs: ["auth:m05"] });
  assert.equal(result.ok, false);
  assert.equal(fx.authCalls(), 2);
  assert.deepEqual(fx.calls.promote, []);
  assert.equal(fx.calls.cleanup, 1);
});

test("cancellation after staging but before first promotion aborts private state", async () => {
  const controller = new AbortController();
  const fx = fixture({ abortOnStage: () => controller.abort() });
  const result = await apply(compile(), fx, { signal: controller.signal });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "ABORTED_STAGED_NO_TARGET_EFFECT");
  assert.deepEqual(fx.calls.promote, []);
  assert.equal(fx.calls.cleanup, 1);
});

test("successful apply follows dependency order and produces exact receipt", async () => {
  const plan = compile({
    expectedPreState: [
      { key: "target:file:a", owner: "fixture", predicate: "EXACT", value: "before" },
      { key: "target:file:b", owner: "fixture", predicate: "EXACT", value: "before-b" },
    ],
    mutationSurface: ["file:a", "file:b"],
    intents: [
      { ...baseBody().intents[0], intentId: "b", targetRef: "file:b", dependsOn: ["a"], desiredFingerprint: "after-b" },
      { ...baseBody().intents[0], intentId: "a", targetRef: "file:a", dependsOn: [], desiredFingerprint: "after-a" },
    ],
    recoveryRequirements: [
      { intentId: "a", recoveryClass: "REVERSIBLE_MANAGED" },
      { intentId: "b", recoveryClass: "REVERSIBLE_MANAGED" },
    ],
    verificationObligations: [{ verificationId: "post", phase: "POST_STATE" }],
  });
  const fx = fixture({ targetState: { "file:a": "before", "file:b": "before-b", "file:unrelated": "legacy" }, preState: { "target:file:a": "before", "target:file:b": "before-b" } });
  const result = await apply(plan, fx);
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "APPLIED");
  assert.deepEqual(fx.calls.promote, ["a", "b"]);
  assert.deepEqual(result.receipt.changedTargets, ["file:a", "file:b"]);
  assert.equal(fx.targetState.get("file:unrelated"), "legacy");
  assert.equal(fx.calls.observedTargets.includes("file:unrelated"), false);
});

test("promotion failure is treated as uncertain effect requiring recovery", async () => {
  const fx = fixture({ promoteFailIntent: "i1" });
  const result = await apply(compile(), fx);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "RECOVERY_REQUIRED");
  assert.equal(result.receipt.appliedIntentResults[0].progress, "FAILED_AFTER_PROMOTION");
  assert.equal(result.error.retryability, "REQUIRES_EFFECT_CHECK");
});

test("post-state verification failure cannot produce success", async () => {
  const fx = fixture({ postFail: true });
  const result = await apply(compile(), fx);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "FAILED_POST_STATE_VERIFICATION");
  assert.equal(result.receipt.appliedIntentResults[0].progress, "FAILED_AFTER_PROMOTION");
});

test("cleanup failure preserves verified target success but is recorded", async () => {
  const fx = fixture({ cleanupFail: true });
  const result = await apply(compile(), fx);
  assert.equal(result.ok, true);
  assert.equal(result.receipt.verificationResults.includes("CLEANUP_FAILED"), true);
});

test("no-op apply creates no transaction journal or target effect", async () => {
  const fx = fixture({ targetState: { "file:a": "after", "file:unrelated": "legacy" } });
  const result = await apply(compile(), fx);
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "NOOP_APPLIED");
  assert.equal(fx.calls.journalBegin, 0);
  assert.deepEqual(fx.calls.promote, []);
});

test("successful apply can be rolled back when transaction still owns current state", async () => {
  const plan = compile();
  const fx = fixture();
  const applied = await apply(plan, fx);
  assert.equal(applied.ok, true);
  assert.equal(fx.targetState.get("file:a"), "after");
  const rolled = await rollbackTransaction({ plan, applyReceipt: applied.receipt, recoveryRunId: "recovery-1", ports: fx.ports });
  assert.equal(rolled.outcome, "RESTORED");
  assert.equal(fx.targetState.get("file:a"), "before");
  assert.deepEqual(fx.calls.restore, ["i1"]);
});

test("rollback refuses to clobber later user or tool edit", async () => {
  const plan = compile();
  const fx = fixture();
  const applied = await apply(plan, fx);
  assert.equal(applied.ok, true);
  fx.targetState.set("file:a", "user-later-edit");
  const restoreCount = fx.calls.restore.length;
  const rolled = await rollbackTransaction({ plan, applyReceipt: applied.receipt, recoveryRunId: "recovery-2", ports: fx.ports });
  assert.equal(rolled.outcome, "ROLLBACK_CONFLICT");
  assert.equal(fx.targetState.get("file:a"), "user-later-edit");
  assert.equal(fx.calls.restore.length, restoreCount);
});

test("rollback recognizes already-restored state without another effect", async () => {
  const plan = compile();
  const fx = fixture();
  const applied = await apply(plan, fx);
  assert.equal(applied.ok, true);
  fx.targetState.set("file:a", "before");
  const restoreCount = fx.calls.restore.length;
  const rolled = await rollbackTransaction({ plan, applyReceipt: applied.receipt, recoveryRunId: "recovery-3", ports: fx.ports });
  assert.equal(rolled.outcome, "ALREADY_RESTORED");
  assert.equal(fx.calls.restore.length, restoreCount);
});

test("receipt does not copy payload secret material", async () => {
  const secret = "secret-value-never-copy";
  const plan = compile({ intents: [{ ...baseBody().intents[0], payloadRef: secret }] });
  const result = await apply(plan, fixture());
  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(result.receipt).includes(secret), false);
});
