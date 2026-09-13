import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  applyTransaction,
  compileTransactionPlan,
  createFilesystemEffectAdapter,
  createGefError,
} from "../packages/kernel/dist/index.js";

const digest = { digest: (text) => createHash("sha256").update(text).digest("hex") };
const root = Object.freeze({
  rootRef: "project-root",
  rootKind: "PROJECT",
  physicalRoot: "/workspace/project",
  pathFlavor: "POSIX",
  caseSemantics: "SENSITIVE",
  allowedOperations: ["READ", "CREATE", "UPDATE", "REMOVE", "MOVE_SOURCE", "MOVE_DESTINATION", "RESTORE", "STAGE"],
  policyRef: "policy:m06:test",
  pathSemanticsRef: "posix:test",
});

function error(reason, category = "EXECUTION") {
  return { ok: false, error: createGefError({ id: `test-${reason}`, category, reason: `test.${reason}`, severity: "ERROR", summary: reason, retryability: "NEVER", recoverability: "NONE_REQUIRED", terminal: "BLOCKED" }) };
}

function plan() {
  const result = compileTransactionPlan({
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: "project:test", projectId: "p1", bindingStrength: "PROJECT" },
    expectedPreState: [{ key: "state:a", owner: "fixture", predicate: "EXACT", value: "before" }],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: [],
    mutationSurface: ["file:a"],
    intents: [{ intentId: "i1", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:a", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "after", payloadRef: "payload:opaque" }],
    ordering: [],
    verificationObligations: [{ verificationId: "staged", phase: "STAGED", targetRef: "file:a" }, { verificationId: "post", phase: "POST_STATE", targetRef: "file:a" }],
    recoveryRequirements: [{ intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "preimage" }],
    externalEffectDeclarations: [],
    policyRefs: [],
  }, digest);
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  return result.value;
}

function fixture(options = {}) {
  let fingerprint = "before";
  let identity = "inode:a:1";
  let promoteCount = 0;
  let cleanupCount = 0;
  const calls = [];
  const resolver = {
    resolve: (intent) => ({ ok: true, value: {
      target: { root, relativePath: "dir/a.txt", expected: { expectedKind: "FILE", expectedFingerprint: "before", expectedIdentityToken: "inode:a:1", ownershipRef: "owner:test" } },
      payloadRef: intent.payloadRef,
      desiredFingerprint: intent.desiredFingerprint,
      requireCrashDurability: true,
    } }),
  };
  const observation = (path) => ({
    ancestors: [{ relativePath: "dir", kind: "DIRECTORY", accessible: true, identityToken: "inode:dir:1", filesystemId: "fs1" }],
    target: { relativePath: path.normalizedRelativePath, kind: fingerprint === undefined ? "ABSENT" : "FILE", accessible: true, ...(fingerprint === undefined ? {} : { identityToken: identity, fingerprint, filesystemId: "fs1", linkCount: 1 }) },
  });
  let observeCount = 0;
  const physical = {
    observe: async (path) => {
      observeCount += 1;
      if (options.driftAtObserve === observeCount) identity = "inode:a:2";
      calls.push(`observe:${observeCount}`);
      return { ok: true, value: observation(path) };
    },
    atomicFacts: async ({ path }) => ({ ok: true, value: {
      primitive: { capabilityRef: `primitive:${path.operation}`, operation: path.operation, visibilityAtomic: true, raceResistant: true, noClobberCreate: true, replaceExisting: true, requiresSameFilesystem: true, durability: "CRASH_DURABLE" },
      stagingFilesystemId: "fs1",
      destinationFilesystemId: "fs1",
    } }),
    captureRecovery: async () => { calls.push("recovery"); return { ok: true, value: { recoveryRef: "recovery:i1", fingerprint } }; },
    verifyRecovery: async () => ({ ok: true, value: true }),
    stage: async ({ desiredFingerprint }) => {
      calls.push("stage");
      if (options.stageFail) return error("stage");
      return { ok: true, value: { stageRef: "stage:i1", ...(desiredFingerprint === undefined ? {} : { fingerprint: desiredFingerprint }) } };
    },
    verifyStage: async () => { calls.push("verify-stage"); return options.verifyStageFail ? error("verify-stage", "VERIFICATION") : { ok: true, value: true }; },
    promote: async ({ intent }) => {
      calls.push("promote");
      promoteCount += 1;
      if (options.promoteFail) return error("promote");
      if (intent.kind === "REMOVE_MANAGED_ARTIFACT") fingerprint = undefined;
      else fingerprint = intent.desiredFingerprint;
      identity = "inode:a:2";
      return { ok: true, value: { ...(fingerprint === undefined ? {} : { postFingerprint: fingerprint }) } };
    },
    verifyPost: async ({ target }) => {
      calls.push("verify-post");
      const value = observation(target).target;
      if (options.postMismatch && value.kind === "FILE") return { ok: true, value: [{ ...value, fingerprint: "wrong" }] };
      return { ok: true, value: [value] };
    },
    cleanup: async () => { cleanupCount += 1; calls.push("cleanup"); return { ok: true, value: true }; },
    restore: async ({ intent }) => {
      calls.push("restore");
      fingerprint = intent.kind === "CREATE_MANAGED_ARTIFACT" ? undefined : "before";
      return { ok: true, value: { ...(fingerprint === undefined ? {} : { postFingerprint: fingerprint }) } };
    },
  };
  const effects = createFilesystemEffectAdapter({ transactionId: "tx-m06", resolver, physical });
  const journal = { begin: async () => ({ ok: true, value: true }), update: async () => ({ ok: true, value: true }), finish: async () => ({ ok: true, value: true }) };
  const state = { observeBinding: async () => ({ ok: true, value: "before" }), observeTargetFingerprint: async () => ({ ok: true, value: fingerprint }) };
  return { effects, journal, state, calls, fingerprint: () => fingerprint, promoteCount: () => promoteCount, cleanupCount: () => cleanupCount };
}

async function apply(fx) {
  return applyTransaction({ plan: plan(), runId: "run-m06", transactionId: "tx-m06", ports: { digest, state: fx.state, journal: fx.journal, effects: fx.effects } });
}

test("M05 apply through M06 stages, revalidates, promotes once and verifies actual target", async () => {
  const fx = fixture();
  const result = await apply(fx);
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  assert.equal(result.outcome, "APPLIED");
  assert.equal(fx.fingerprint(), "after");
  assert.equal(fx.promoteCount(), 1);
  assert.ok(fx.calls.indexOf("stage") < fx.calls.indexOf("promote"));
  assert.ok(fx.calls.filter((item) => item.startsWith("observe:")).length >= 2);
  assert.equal(fx.calls.includes("verify-post"), true);
});

test("commit barrier identity drift blocks before target effect", async () => {
  const fx = fixture({ driftAtObserve: 2 });
  const result = await apply(fx);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "ABORTED_STAGED_NO_TARGET_EFFECT");
  assert.equal(fx.promoteCount(), 0);
  assert.equal(fx.fingerprint(), "before");
  assert.equal(fx.cleanupCount(), 1);
});

test("staged verification failure leaves target untouched", async () => {
  const fx = fixture({ verifyStageFail: true });
  const result = await apply(fx);
  assert.equal(result.ok, false);
  assert.equal(fx.promoteCount(), 0);
  assert.equal(fx.fingerprint(), "before");
});

test("actual post-state mismatch cannot produce M05 success", async () => {
  const fx = fixture({ postMismatch: true });
  const result = await apply(fx);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "FAILED_POST_STATE_VERIFICATION");
  assert.equal(fx.promoteCount(), 1);
});

test("filesystem adapter errors never copy opaque payload references into summaries", async () => {
  const fx = fixture({ stageFail: true });
  const result = await apply(fx);
  assert.equal(result.ok, false);
  assert.doesNotMatch(JSON.stringify(result.error), /payload:opaque/);
});
