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

function fail(reason) {
  return {
    ok: false,
    error: createGefError({
      id: `test-${reason}`,
      category: "EXECUTION",
      reason: `test.${reason}`,
      severity: "ERROR",
      summary: reason,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
    }),
  };
}

function bodyTwo() {
  return {
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: "project:test", projectId: "p1", bindingStrength: "PROJECT" },
    expectedPreState: [
      { key: "target:file:a", owner: "fixture", predicate: "EXACT", value: "before-a" },
      { key: "target:file:b", owner: "fixture", predicate: "EXACT", value: "before-b" },
    ],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: [],
    mutationSurface: ["file:a", "file:b"],
    intents: [
      { intentId: "a", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:a", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "after-a" },
      { intentId: "b", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:b", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: ["a"], desiredFingerprint: "after-b" },
    ],
    ordering: [],
    verificationObligations: [{ verificationId: "post", phase: "POST_STATE" }],
    recoveryRequirements: [
      { intentId: "a", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "pre-a" },
      { intentId: "b", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "pre-b" },
    ],
    externalEffectDeclarations: [],
    policyRefs: [],
  };
}

function compilePlan() {
  const result = compileTransactionPlan(bodyTwo(), digest);
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

test("journal failure immediately after target promotion requires recovery before another effect", async () => {
  const plan = compilePlan();
  const targets = new Map([["file:a", "before-a"], ["file:b", "before-b"]]);
  const bindings = new Map([["target:file:a", "before-a"], ["target:file:b", "before-b"]]);
  let journalUpdates = 0;
  const promoted = [];

  const ports = {
    digest,
    state: {
      observeBinding: async (binding) => ({ ok: true, value: bindings.get(binding.key) }),
      observeTargetFingerprint: async (target) => ({ ok: true, value: targets.get(target) }),
    },
    journal: {
      begin: async () => ({ ok: true, value: true }),
      update: async () => {
        journalUpdates += 1;
        if (journalUpdates === 3) return fail("journal-after-promotion");
        return { ok: true, value: true };
      },
      finish: async () => ({ ok: true, value: true }),
    },
    effects: {
      checkPhysicalSafety: async () => ({ ok: true, value: true }),
      captureRecovery: async (intent) => ({ ok: true, value: `recovery:${intent.intentId}` }),
      stage: async () => ({ ok: true, value: true }),
      verifyStaged: async () => ({ ok: true, value: true }),
      revalidateCommitBarrier: async () => ({ ok: true, value: true }),
      promote: async (intent) => {
        promoted.push(intent.intentId);
        targets.set(intent.targetRef, intent.desiredFingerprint);
        return { ok: true, value: { postFingerprint: intent.desiredFingerprint } };
      },
      verifyPostState: async () => ({ ok: true, value: [] }),
      cleanup: async () => ({ ok: true, value: true }),
      restore: async () => ({ ok: true, value: {} }),
    },
  };

  const result = await applyTransaction({ plan, runId: "run-journal", transactionId: "tx-journal", ports });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "RECOVERY_REQUIRED");
  assert.deepEqual(promoted, ["a"]);
  assert.equal(result.receipt.verificationResults.includes("JOURNAL_UPDATE_FAILED_AFTER_PROMOTION"), true);
});

function receiptFor(plan) {
  return {
    schemaVersion: 1,
    applyContractVersion: "1.0",
    runId: "run-applied",
    transactionId: "tx-applied",
    planDigest: plan.planDigest,
    targetBinding: plan.targetBinding,
    securityClass: plan.securityClass,
    preStateBindings: plan.expectedPreState,
    appliedIntentResults: [
      { intentId: "a", targetRef: "file:a", progress: "VERIFIED", postFingerprint: "after-a", recoveryRef: "recovery:a" },
      { intentId: "b", targetRef: "file:b", progress: "VERIFIED", postFingerprint: "after-b", recoveryRef: "recovery:b" },
    ],
    changedTargets: ["file:a", "file:b"],
    verificationResults: ["post"],
    postStateBindings: [],
    externalEffectRefs: [],
    outcome: "APPLIED",
    receiptDigest: "receipt-source",
  };
}

test("rollback cancellation after one restoration marks remaining effect unresolved", async () => {
  const plan = compilePlan();
  const controller = new AbortController();
  const targets = new Map([["file:a", "after-a"], ["file:b", "after-b"]]);
  let restores = 0;
  const ports = {
    digest,
    state: { observeTargetFingerprint: async (target) => ({ ok: true, value: targets.get(target) }), observeBinding: async () => ({ ok: true, value: undefined }) },
    effects: {
      checkPhysicalSafety: async () => ({ ok: true, value: true }),
      captureRecovery: async () => ({ ok: true, value: undefined }),
      stage: async () => ({ ok: true, value: true }),
      verifyStaged: async () => ({ ok: true, value: true }),
      revalidateCommitBarrier: async () => ({ ok: true, value: true }),
      promote: async () => ({ ok: true, value: {} }),
      verifyPostState: async () => ({ ok: true, value: [] }),
      cleanup: async () => ({ ok: true, value: true }),
      restore: async ({ intent, expectedPreFingerprint }) => {
        restores += 1;
        targets.set(intent.targetRef, expectedPreFingerprint);
        if (restores === 1) controller.abort();
        return { ok: true, value: { postFingerprint: expectedPreFingerprint } };
      },
    },
  };

  const result = await rollbackTransaction({ plan, applyReceipt: receiptFor(plan), recoveryRunId: "recovery-cancel", ports, signal: controller.signal });
  assert.equal(result.outcome, "PARTIALLY_RESTORED");
  assert.equal(result.effectResults.length, 2);
  assert.equal(result.effectResults.filter((item) => item.outcome === "FAILED").length, 1);
  assert.equal(restores, 1);
});

test("rollback already cancelled cannot report already restored", async () => {
  const plan = compilePlan();
  const controller = new AbortController();
  controller.abort();
  const ports = {
    digest,
    state: { observeTargetFingerprint: async () => ({ ok: true, value: "after" }), observeBinding: async () => ({ ok: true, value: undefined }) },
    effects: {
      checkPhysicalSafety: async () => ({ ok: true, value: true }), captureRecovery: async () => ({ ok: true, value: undefined }), stage: async () => ({ ok: true, value: true }), verifyStaged: async () => ({ ok: true, value: true }), revalidateCommitBarrier: async () => ({ ok: true, value: true }), promote: async () => ({ ok: true, value: {} }), verifyPostState: async () => ({ ok: true, value: [] }), cleanup: async () => ({ ok: true, value: true }), restore: async () => ({ ok: true, value: {} }),
    },
  };
  const result = await rollbackTransaction({ plan, applyReceipt: receiptFor(plan), recoveryRunId: "recovery-pre-cancel", ports, signal: controller.signal });
  assert.equal(result.outcome, "ROLLBACK_FAILED");
  assert.equal(result.effectResults.length, 2);
  assert.equal(result.effectResults.every((item) => item.outcome === "FAILED"), true);
});
