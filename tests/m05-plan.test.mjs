import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  compileTransactionPlan,
  decideIdempotentAction,
  dryRunTransaction,
  sameIdempotencyScope,
} from "../packages/kernel/dist/index.js";

const digest = { digest: (text) => createHash("sha256").update(text).digest("hex") };

function body(overrides = {}) {
  return {
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: "project:test", projectId: "project-1", bindingStrength: "PROJECT" },
    expectedPreState: [{ key: "target:file:a", owner: "fixture", predicate: "EXACT", value: "before" }],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: [],
    mutationSurface: ["file:a"],
    intents: [{ intentId: "i1", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:a", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "after" }],
    ordering: [],
    verificationObligations: [{ verificationId: "stage-a", phase: "STAGED", targetRef: "file:a" }, { verificationId: "post-a", phase: "POST_STATE", targetRef: "file:a" }],
    recoveryRequirements: [{ intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "preimage" }],
    externalEffectDeclarations: [],
    policyRefs: [{ policyId: "policy", version: "1" }],
    ...overrides,
  };
}

function compile(overrides = {}) {
  const result = compileTransactionPlan(body(overrides), digest);
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function ports({ binding = "before", target = "before", compatibility, externalEffects } = {}) {
  return {
    digest,
    state: {
      observeBinding: async () => ({ ok: true, value: binding }),
      observeTargetFingerprint: async () => ({ ok: true, value: target }),
    },
    ...(compatibility === undefined ? {} : { compatibility }),
    ...(externalEffects === undefined ? {} : { externalEffects }),
  };
}

test("plan digest is deterministic across canonical list ordering", () => {
  const a = compile({ mutationSurface: ["file:b", "file:a"], policyRefs: [{ policyId: "z", version: "1" }, { policyId: "a", version: "2" }], intents: [
    { intentId: "i2", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:b", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: ["i1"], desiredFingerprint: "b2" },
    { intentId: "i1", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:a", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "a2" },
  ], recoveryRequirements: [
    { intentId: "i2", recoveryClass: "REVERSIBLE_MANAGED" },
    { intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED" },
  ] });
  const b = compile({ mutationSurface: ["file:a", "file:b"], policyRefs: [{ policyId: "a", version: "2" }, { policyId: "z", version: "1" }], intents: [
    { intentId: "i1", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:a", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "a2" },
    { intentId: "i2", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:b", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: ["i1"], desiredFingerprint: "b2" },
  ], recoveryRequirements: [
    { intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED" },
    { intentId: "i2", recoveryClass: "REVERSIBLE_MANAGED" },
  ] });
  assert.equal(a.planDigest, b.planDigest);
});

test("semantic plan delta changes digest", () => {
  assert.notEqual(compile().planDigest, compile({ intents: [{ ...body().intents[0], desiredFingerprint: "different" }] }).planDigest);
});

test("runtime-invalid intent kind fails closed", () => {
  const invalid = body({ intents: [{ ...body().intents[0], kind: "EXECUTE_SHELL" }] });
  const result = compileTransactionPlan(invalid, digest);
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /unsupported_intent_kind/);
});

test("dependency cycle fails closed", () => {
  const result = compileTransactionPlan(body({
    mutationSurface: ["file:a", "file:b"],
    intents: [
      { ...body().intents[0], intentId: "a", dependsOn: ["b"] },
      { ...body().intents[0], intentId: "b", targetRef: "file:b", dependsOn: ["a"] },
    ],
    recoveryRequirements: [
      { intentId: "a", recoveryClass: "REVERSIBLE_MANAGED" },
      { intentId: "b", recoveryClass: "REVERSIBLE_MANAGED" },
    ],
  }), digest);
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /dependency_cycle/);
});

test("dry run is zero-effect and returns READY for pending managed change", async () => {
  const plan = compile();
  const result = await dryRunTransaction(plan, ports());
  assert.equal(result.outcome, "READY");
  assert.equal(result.intentResults[0].action, "WOULD_UPDATE");
});

test("dry run returns NOOP when desired state is already present", async () => {
  const result = await dryRunTransaction(compile(), ports({ target: "after" }));
  assert.equal(result.outcome, "NOOP");
});

test("compatible state predicate requires owning compatibility policy", async () => {
  const plan = compile({ expectedPreState: [{ key: "target:file:a", owner: "fixture", predicate: "COMPATIBLE", value: "v1" }] });
  assert.equal((await dryRunTransaction(plan, ports({ binding: "v2" }))).outcome, "INDETERMINATE");
  const compatible = await dryRunTransaction(plan, ports({ binding: "v2", compatibility: { evaluate: async () => ({ ok: true, value: true }) } }));
  assert.equal(compatible.outcome, "READY");
});

test("external effect without observation is indeterminate; present effect is conflict", async () => {
  const ext = { effectId: "provider-1", owner: "provider", targetRef: "provider:repo", securityClass: "S3_PROVIDER_CHANGE", compensation: "UNKNOWN" };
  const plan = compile({
    securityClass: "S3_PROVIDER_CHANGE",
    mutationSurface: ["file:a", "provider:repo"],
    externalEffectDeclarations: [ext],
  });
  assert.equal((await dryRunTransaction(plan, ports())).outcome, "INDETERMINATE");
  const present = await dryRunTransaction(plan, ports({ externalEffects: { observeEffect: async () => ({ ok: true, value: "PRESENT" }) } }));
  assert.equal(present.outcome, "CONFLICT");
});

test("in-flight duplicate is suppressed", () => {
  const result = decideIdempotentAction({
    scope: { scopeId: "s", targetRef: "project:test", planDigest: "p", contractVersion: "1" },
    effectState: "IN_FLIGHT",
    attemptCount: 1,
    authorizationValid: true,
    preStateValid: true,
    desiredStateAlreadyPresent: false,
    retryPolicy: { enabled: false, retryableReasons: [], maxAttempts: 1, backoff: "NONE" },
  });
  assert.equal(result.decision, "SUPPRESS_DUPLICATE_IN_FLIGHT");
});

test("verified applied state returns prior result without replay", () => {
  const result = decideIdempotentAction({
    scope: { scopeId: "s", targetRef: "project:test", planDigest: "p", contractVersion: "1" },
    effectState: "FULLY_APPLIED_VERIFIED",
    attemptCount: 1,
    authorizationValid: true,
    preStateValid: true,
    desiredStateAlreadyPresent: true,
    priorReceiptRef: "receipt:1",
    retryPolicy: { enabled: false, retryableReasons: [], maxAttempts: 1, backoff: "NONE" },
  });
  assert.equal(result.decision, "RETURN_ALREADY_APPLIED");
  assert.equal(result.priorReceiptRef, "receipt:1");
});

test("unknown or partial effect requires recovery rather than retry", () => {
  for (const effectState of ["UNKNOWN_EFFECT", "PARTIALLY_APPLIED", "PARTIALLY_RESTORED", "EXTERNAL_EFFECT_PRESENT"]) {
    const result = decideIdempotentAction({
      scope: { scopeId: "s", targetRef: "project:test", planDigest: "p", contractVersion: "1" },
      effectState,
      attemptCount: 1,
      authorizationValid: true,
      preStateValid: true,
      desiredStateAlreadyPresent: false,
      retryPolicy: { enabled: true, retryableReasons: ["transient"], maxAttempts: 3, backoff: "FIXED" },
      failureReason: "transient",
    });
    assert.equal(result.decision, "RECOVERY_REQUIRED");
  }
});

test("bounded retry is eligible only after verified no-effect/restoration and explicit policy", () => {
  const base = {
    scope: { scopeId: "s", targetRef: "project:test", planDigest: "p", contractVersion: "1" },
    effectState: "FULLY_RESTORED_VERIFIED",
    attemptCount: 1,
    authorizationValid: true,
    preStateValid: true,
    desiredStateAlreadyPresent: false,
    failureReason: "transient",
  };
  assert.equal(decideIdempotentAction({ ...base, retryPolicy: { enabled: false, retryableReasons: [], maxAttempts: 1, backoff: "NONE" } }).decision, "FRESH_ATTEMPT_ELIGIBLE");
  assert.equal(decideIdempotentAction({ ...base, retryPolicy: { enabled: true, retryableReasons: ["transient"], maxAttempts: 3, backoff: "FIXED" } }).decision, "RETRY_ELIGIBLE");
  assert.equal(decideIdempotentAction({ ...base, attemptCount: 3, retryPolicy: { enabled: true, retryableReasons: ["transient"], maxAttempts: 3, backoff: "FIXED" } }).decision, "NO_AUTOMATIC_RETRY");
});

test("idempotency scope comparison includes policy/provider identity", () => {
  const a = { scopeId: "s", targetRef: "project:test", planDigest: "p", contractVersion: "1", policyFingerprint: "a", providerOperationRef: "op" };
  assert.equal(sameIdempotencyScope(a, { ...a }), true);
  assert.equal(sameIdempotencyScope(a, { ...a, policyFingerprint: "b" }), false);
  assert.equal(sameIdempotencyScope(a, { ...a, providerOperationRef: "other" }), false);
});
