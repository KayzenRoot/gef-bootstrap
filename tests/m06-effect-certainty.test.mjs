import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { applyTransaction, compileTransactionPlan, createFilesystemEffectAdapter, createGefError } from "../packages/kernel/dist/index.js";

const digest = { digest: (text) => createHash("sha256").update(text).digest("hex") };
const root = Object.freeze({ rootRef: "root", rootKind: "PROJECT", physicalRoot: "/repo", pathFlavor: "POSIX", caseSemantics: "SENSITIVE", allowedOperations: ["UPDATE", "RESTORE", "STAGE"], policyRef: "p1", pathSemanticsRef: "posix-v1" });
const intent = Object.freeze({ intentId: "i1", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:a", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "after" });

function compiledPlan() {
  const result = compileTransactionPlan({ schemaVersion: 1, planContractVersion: "1.0", targetBinding: { targetRef: "project:test", projectId: "p1", bindingStrength: "PROJECT" }, expectedPreState: [{ key: "file:a", owner: "fixture", predicate: "EXACT", value: "before" }], securityClass: "S1_MANAGED_WRITE", authorizationRequirements: [], mutationSurface: ["file:a"], intents: [intent], ordering: [], verificationObligations: [{ verificationId: "staged", phase: "STAGED", targetRef: "file:a" }, { verificationId: "post", phase: "POST_STATE", targetRef: "file:a" }], recoveryRequirements: [{ intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "preimage" }], externalEffectDeclarations: [], policyRefs: [] }, digest);
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function fixture({ failAfterPromotion = false } = {}) {
  let fingerprint = "before";
  const cleanupRequests = [];
  const resolver = { resolve: () => ({ ok: true, value: { target: { root, relativePath: "a.txt", expected: { expectedKind: "FILE", expectedFingerprint: "before", expectedIdentityToken: "id1", ownershipRef: "owner" } }, desiredFingerprint: "after" } }) };
  const observe = (path) => ({ ancestors: [{ relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "root-id", filesystemId: "fs1" }], target: { relativePath: path.normalizedRelativePath, kind: "FILE", accessible: true, identityToken: "id1", fingerprint, filesystemId: "fs1", linkCount: 1 } });
  const physical = {
    observe: async (path) => ({ ok: true, value: observe(path) }),
    atomicFacts: async ({ path }) => ({ ok: true, value: { primitive: { capabilityRef: `cap:${path.operation}`, operation: path.operation, visibilityAtomic: true, raceResistant: true, noClobberCreate: false, replaceExisting: true, requiresSameFilesystem: true, durability: "UNPROVEN" }, stagingAuthorityRef: "stage:private", stagingFilesystemId: "fs1", destinationFilesystemId: "fs1" } }),
    captureRecovery: async () => ({ ok: true, value: { recoveryRef: "recovery:keep", fingerprint: "before" } }),
    verifyRecovery: async () => ({ ok: true, value: true }),
    stage: async () => ({ ok: true, value: { stageRef: "stage:1", fingerprint: "after" } }),
    verifyStage: async () => ({ ok: true, value: true }),
    promote: async () => {
      fingerprint = "after";
      if (!failAfterPromotion) return { ok: true, value: { postFingerprint: "after" } };
      return { ok: false, error: createGefError({ id: "m06-post-effect-failure", category: "EXECUTION", reason: "filesystem_effect.post_effect_flush_failed", severity: "CRITICAL", summary: "Target-visible effect occurred before required post-effect durability work failed", retryability: "REQUIRES_EFFECT_CHECK", recoverability: "RECOVERY_REQUIRED", effectStatus: "CONFIRMED", terminal: "RECOVERY_REQUIRED", targetRef: "file:a" }) };
    },
    verifyPost: async ({ target }) => ({ ok: true, value: [observe(target).target] }),
    cleanup: async (request) => { cleanupRequests.push(request); return { ok: true, value: true }; },
    restore: async () => { fingerprint = "before"; return { ok: true, value: { postFingerprint: "before" } }; },
  };
  const effects = createFilesystemEffectAdapter({ transactionId: "tx", resolver, physical });
  return { effects, cleanupRequests, fingerprint: () => fingerprint };
}

test("cleanup receives recovery references that must not be erased", async () => {
  const fx = fixture();
  assert.equal((await fx.effects.checkPhysicalSafety(intent)).ok, true);
  const captured = await fx.effects.captureRecovery(intent);
  assert.equal(captured.ok, true);
  const cleaned = await fx.effects.cleanup({ transactionId: "tx", successful: false });
  assert.equal(cleaned.ok, true);
  assert.deepEqual(fx.cleanupRequests[0].preserveRecoveryRefs, ["recovery:keep"]);
});

test("failure after target-visible promotion becomes recovery required, never no-effect", async () => {
  const fx = fixture({ failAfterPromotion: true });
  const plan = compiledPlan();
  const result = await applyTransaction({ plan, runId: "run", transactionId: "tx", ports: { digest, state: { observeBinding: async () => ({ ok: true, value: "before" }), observeTargetFingerprint: async () => ({ ok: true, value: fx.fingerprint() }) }, journal: { begin: async () => ({ ok: true, value: true }), update: async () => ({ ok: true, value: true }), finish: async () => ({ ok: true, value: true }) }, effects: fx.effects } });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "RECOVERY_REQUIRED");
  assert.equal(result.error.effectStatus, "PARTIAL");
  assert.equal(fx.fingerprint(), "after");
});
