import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { applyTransaction, compileTransactionPlan, validateTransactionPlanRuntime } from "../packages/kernel/dist/index.js";

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
