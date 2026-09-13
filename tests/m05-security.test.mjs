import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  applyTransaction,
  compileTransactionPlan,
  decideIdempotentAction,
  linkRetryAttempt,
  rollbackTransaction,
  stableTransactionSerialize,
  validateTransactionPlanRuntime,
} from "../packages/kernel/dist/index.js";

const digest = { digest: (text) => createHash("sha256").update(text).digest("hex") };

function body(overrides = {}) {
  return {
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: "project:test", projectId: "p1", bindingStrength: "PROJECT" },
    expectedPreState: [],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: [],
    mutationSurface: ["file:a"],
    intents: [{ intentId: "i1", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:a", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "after" }],
    ordering: [],
    verificationObligations: [],
    recoveryRequirements: [{ intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "preimage" }],
    externalEffectDeclarations: [],
    policyRefs: [],
    ...overrides,
  };
}

function operationalPorts({ authorization } = {}) {
  return {
    digest,
    state: {
      observeBinding: async () => ({ ok: true, value: undefined }),
      observeTargetFingerprint: async () => ({ ok: true, value: "before" }),
    },
    ...(authorization === undefined ? {} : { authorization }),
    journal: {
      begin: async () => ({ ok: true, value: true }),
      update: async () => ({ ok: true, value: true }),
      finish: async () => ({ ok: true, value: true }),
      beginRollback: async () => ({ ok: true, value: true }),
      updateRollback: async () => ({ ok: true, value: true }),
      finishRollback: async () => ({ ok: true, value: true }),
    },
    effects: {
      checkPhysicalSafety: async () => ({ ok: true, value: true }),
      captureRecovery: async () => ({ ok: true, value: "recovery:i1" }),
      verifyRecoveryMaterial: async () => ({ ok: true, value: true }),
      stage: async () => ({ ok: true, value: true }),
      verifyStaged: async () => ({ ok: true, value: true }),
      revalidateCommitBarrier: async () => ({ ok: true, value: true }),
      promote: async () => ({ ok: true, value: { postFingerprint: "after" } }),
      verifyPostState: async () => ({ ok: true, value: [] }),
      cleanup: async () => ({ ok: true, value: true }),
      restore: async () => ({ ok: true, value: { postFingerprint: "before" } }),
    },
  };
}

test("runtime malformed plan fails closed without throwing", () => {
  assert.equal(validateTransactionPlanRuntime(null).ok, false);
  assert.equal(validateTransactionPlanRuntime({ schemaVersion: 1, planContractVersion: "1.0" }).ok, false);
  assert.equal(compileTransactionPlan(null, digest).ok, false);
});

test("S4 plan without explicit authorization requirement is rejected", () => {
  const candidate = body({
    securityClass: "S4_ELEVATED_DESTRUCTIVE",
    intents: [{ ...body().intents[0], securityClass: "S4_ELEVATED_DESTRUCTIVE" }],
  });
  const result = compileTransactionPlan(candidate, digest);
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /missing_elevated_authorization_requirement/);
});

test("irreversible or unproven effect requires explicit authorization requirement", () => {
  const candidate = body({
    intents: [{ ...body().intents[0], recoveryClass: "IRREVERSIBLE_OR_UNPROVEN" }],
    recoveryRequirements: [{ intentId: "i1", recoveryClass: "IRREVERSIBLE_OR_UNPROVEN", requirementRef: "disclosure" }],
  });
  const result = compileTransactionPlan(candidate, digest);
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /missing_elevated_authorization_requirement/);
});

test("S1+ managed intent requires matching recovery declaration", () => {
  const result = compileTransactionPlan(body({ recoveryRequirements: [] }), digest);
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /missing_recovery_requirement/);
});

test("S4 plan with explicit authorization and recovery requirements compiles", () => {
  const result = compileTransactionPlan(body({
    securityClass: "S4_ELEVATED_DESTRUCTIVE",
    authorizationRequirements: ["owner-approval:delete-a"],
    intents: [{ ...body().intents[0], securityClass: "S4_ELEVATED_DESTRUCTIVE" }],
  }), digest);
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
});

test("S4 apply authorization is action and target bound", async () => {
  const compiled = compileTransactionPlan(body({
    securityClass: "S4_ELEVATED_DESTRUCTIVE",
    authorizationRequirements: ["owner-approval:file-a"],
    intents: [{ ...body().intents[0], securityClass: "S4_ELEVATED_DESTRUCTIVE" }],
  }), digest);
  assert.equal(compiled.ok, true, compiled.ok ? "" : compiled.error.summary);
  const requests = [];
  const result = await applyTransaction({
    plan: compiled.value,
    runId: "run-s4",
    transactionId: "tx-s4",
    authorizationRefs: ["owner-approval:file-a"],
    ports: operationalPorts({ authorization: { authorize: async (request) => { requests.push(request); return { ok: true, value: true }; } } }),
  });
  assert.equal(result.ok, true);
  assert.equal(requests.some((request) => request.phase === "APPLY" && request.intent?.targetRef === "file:a"), true);
});

test("external saga intent is delegated before journal or managed effect ports execute", async () => {
  const compiled = compileTransactionPlan(body({
    securityClass: "S3_PROVIDER_CHANGE",
    mutationSurface: ["provider:repo"],
    intents: [{ intentId: "provider-1", kind: "EXTERNAL_SAGA_EFFECT", targetRef: "provider:repo", securityClass: "S3_PROVIDER_CHANGE", recoveryClass: "COMPENSATABLE_EXTERNAL", dependsOn: [] }],
    recoveryRequirements: [],
  }), digest);
  assert.equal(compiled.ok, true, compiled.ok ? "" : compiled.error.summary);
  let journalCalls = 0;
  let effectCalls = 0;
  const result = await applyTransaction({
    plan: compiled.value,
    runId: "run-external",
    transactionId: "tx-external",
    ports: {
      digest,
      state: { observeBinding: async () => ({ ok: true, value: undefined }), observeTargetFingerprint: async () => ({ ok: true, value: undefined }) },
      journal: { begin: async () => { journalCalls += 1; return { ok: true, value: true }; }, update: async () => ({ ok: true, value: true }), finish: async () => ({ ok: true, value: true }) },
      effects: {
        checkPhysicalSafety: async () => { effectCalls += 1; return { ok: true, value: true }; }, captureRecovery: async () => ({ ok: true, value: undefined }), stage: async () => ({ ok: true, value: true }), verifyStaged: async () => ({ ok: true, value: true }), revalidateCommitBarrier: async () => ({ ok: true, value: true }), promote: async () => ({ ok: true, value: {} }), verifyPostState: async () => ({ ok: true, value: [] }), cleanup: async () => ({ ok: true, value: true }), restore: async () => ({ ok: true, value: {} }),
      },
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /external_saga_delegated/);
  assert.equal(journalCalls, 0);
  assert.equal(effectCalls, 0);
});

test("rollback cannot restore without current target-bound authorization", async () => {
  const candidate = body({ expectedPreState: [{ key: "target:file:a", owner: "fixture", predicate: "EXACT", value: "before" }] });
  const compiled = compileTransactionPlan(candidate, digest);
  assert.equal(compiled.ok, true, compiled.ok ? "" : compiled.error.summary);
  const plan = compiled.value;
  const receiptBase = {
    schemaVersion: 1,
    applyContractVersion: "1.0",
    runId: "run-applied",
    transactionId: "tx-applied",
    planDigest: plan.planDigest,
    targetBinding: plan.targetBinding,
    securityClass: plan.securityClass,
    preStateBindings: plan.expectedPreState,
    appliedIntentResults: [{ intentId: "i1", targetRef: "file:a", progress: "VERIFIED", postFingerprint: "after", recoveryRef: "recovery:i1" }],
    changedTargets: ["file:a"],
    verificationResults: [],
    postStateBindings: [],
    externalEffectRefs: [],
    outcome: "APPLIED",
  };
  const applyReceipt = { ...receiptBase, receiptDigest: digest.digest(stableTransactionSerialize(receiptBase)) };
  let restores = 0;
  let current = "after";
  const ports = operationalPorts();
  ports.state.observeTargetFingerprint = async () => ({ ok: true, value: current });
  ports.effects.restore = async () => { restores += 1; current = "before"; return { ok: true, value: { postFingerprint: "before" } }; };
  const result = await rollbackTransaction({ plan, applyReceipt, recoveryRunId: "recovery-no-auth", ports });
  assert.equal(result.outcome, "ROLLBACK_FAILED");
  assert.equal(restores, 0);
  assert.equal(current, "after");
});

test("retry attempt chain requires new immutable execution identity", () => {
  const scope = { scopeId: "scope-1", targetRef: "project:test", planDigest: "plan-1", contractVersion: "1" };
  const eligibility = decideIdempotentAction({
    scope,
    effectState: "FULLY_RESTORED_VERIFIED",
    attemptCount: 1,
    authorizationValid: true,
    preStateValid: true,
    desiredStateAlreadyPresent: false,
    retryPolicy: { enabled: false, retryableReasons: [], maxAttempts: 1, backoff: "NONE" },
  });
  assert.equal(eligibility.decision, "FRESH_ATTEMPT_ELIGIBLE");
  const prior = { schemaVersion: 1, scope, planDigest: "plan-1", runId: "run-old", transactionId: "tx-old", effectState: "FULLY_RESTORED_VERIFIED", terminalOutcome: "RECOVERED" };
  const linked = linkRetryAttempt({ prior, eligibility, scope, planDigest: "plan-1", runId: "run-new", transactionId: "tx-new" });
  assert.equal(linked.ok, true, linked.ok ? "" : linked.error.summary);
  assert.equal(linked.value.predecessorRunId, "run-old");
  assert.equal(linked.value.runId, "run-new");
  assert.equal(linked.value.transactionId, "tx-new");
  assert.equal(linked.value.effectState, "IN_FLIGHT");
  assert.equal(prior.runId, "run-old");

  const reusedRun = linkRetryAttempt({ prior, eligibility, scope, planDigest: "plan-1", runId: "run-old", transactionId: "tx-new" });
  assert.equal(reusedRun.ok, false);
  assert.match(reusedRun.error.reasonCode, /run_identity_reused/);
  const reusedTransaction = linkRetryAttempt({ prior, eligibility, scope, planDigest: "plan-1", runId: "run-other", transactionId: "tx-old" });
  assert.equal(reusedTransaction.ok, false);
  assert.match(reusedTransaction.error.reasonCode, /transaction_identity_reused/);
});
