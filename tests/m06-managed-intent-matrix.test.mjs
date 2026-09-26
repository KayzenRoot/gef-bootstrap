import assert from "node:assert/strict";
import test from "node:test";
import { createFilesystemEffectAdapter } from "../packages/kernel/dist/index.js";

const root = Object.freeze({
  rootRef: "project-root",
  rootKind: "PROJECT",
  physicalRoot: "/workspace/project",
  pathFlavor: "POSIX",
  caseSemantics: "SENSITIVE",
  allowedOperations: ["READ", "CREATE", "UPDATE", "REMOVE", "MOVE_SOURCE", "MOVE_DESTINATION", "RESTORE", "STAGE"],
  policyRef: "policy:m06:intent-matrix",
  pathSemanticsRef: "posix:intent-matrix:v1",
  bindingRef: "project:p1",
});

const intents = Object.freeze({
  create: Object.freeze({ intentId: "create", kind: "CREATE_MANAGED_ARTIFACT", targetRef: "file:create", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "create-after", payloadRef: "payload:create" }),
  remove: Object.freeze({ intentId: "remove", kind: "REMOVE_MANAGED_ARTIFACT", targetRef: "file:remove", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [] }),
  move: Object.freeze({ intentId: "move", kind: "MOVE_MANAGED_ARTIFACT", targetRef: "file:destination", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "move-content" }),
});

function expected(fingerprint, identityToken) {
  return { expectedKind: "FILE", expectedFingerprint: fingerprint, expectedIdentityToken: identityToken, ownershipRef: "owner:test" };
}

function fixture() {
  const state = new Map([
    ["dir/remove.txt", { fingerprint: "remove-before", identityToken: "id:remove:1" }],
    ["dir/source.txt", { fingerprint: "move-content", identityToken: "id:source:1" }],
  ]);
  const promotions = [];
  const restores = [];

  const resolver = {
    resolve(intent) {
      if (intent.intentId === "create") return { ok: true, value: { target: { root, relativePath: "dir/create.txt" }, payloadRef: intent.payloadRef, desiredFingerprint: "create-after" } };
      if (intent.intentId === "remove") return { ok: true, value: { target: { root, relativePath: "dir/remove.txt", expected: expected("remove-before", "id:remove:1") } } };
      if (intent.intentId === "move") return { ok: true, value: { target: { root, relativePath: "dir/destination.txt" }, source: { root, relativePath: "dir/source.txt", expected: expected("move-content", "id:source:1") }, desiredFingerprint: "move-content" } };
      throw new Error(`unexpected intent ${intent.intentId}`);
    },
  };

  function entry(relativePath) {
    const current = state.get(relativePath);
    if (current === undefined) return { relativePath, kind: "ABSENT", accessible: true };
    return { relativePath, kind: "FILE", accessible: true, identityToken: current.identityToken, fingerprint: current.fingerprint, filesystemId: "fs1", linkCount: 1 };
  }

  const physical = {
    observe: async (path) => ({ ok: true, value: { ancestors: [
      { relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "id:root:1", filesystemId: "fs1" },
      { relativePath: "dir", kind: "DIRECTORY", accessible: true, identityToken: "id:dir:1", filesystemId: "fs1" },
    ], target: entry(path.normalizedRelativePath) } }),
    atomicFacts: async ({ path }) => ({ ok: true, value: {
      primitive: { capabilityRef: `cap:${path.operation}`, operation: path.operation, visibilityAtomic: true, raceResistant: true, noClobberCreate: true, replaceExisting: true, requiresSameFilesystem: true, durability: "UNPROVEN" },
      stagingAuthorityRef: "stage-authority:test",
      stagingFilesystemId: "fs1",
      destinationFilesystemId: "fs1",
    } }),
    captureRecovery: async ({ intent }) => ({ ok: true, value: { recoveryRef: `recovery:${intent.intentId}` } }),
    verifyRecovery: async () => ({ ok: true, value: true }),
    stage: async ({ intent }) => ({ ok: true, value: { stageRef: `stage:${intent.intentId}` } }),
    verifyStage: async () => ({ ok: true, value: true }),
    promote: async (request) => {
      promotions.push(request);
      if (request.intent.kind === "CREATE_MANAGED_ARTIFACT") {
        state.set(request.target.normalizedRelativePath, { fingerprint: request.intent.desiredFingerprint, identityToken: "id:create:2" });
      } else if (request.intent.kind === "REMOVE_MANAGED_ARTIFACT") {
        state.delete(request.target.normalizedRelativePath);
      } else if (request.intent.kind === "MOVE_MANAGED_ARTIFACT") {
        assert.ok(request.source);
        const current = state.get(request.source.normalizedRelativePath);
        assert.ok(current);
        state.delete(request.source.normalizedRelativePath);
        state.set(request.target.normalizedRelativePath, { fingerprint: current.fingerprint, identityToken: "id:destination:2" });
      }
      const current = state.get(request.target.normalizedRelativePath);
      return { ok: true, value: { ...(current === undefined ? {} : { postFingerprint: current.fingerprint }) } };
    },
    verifyPost: async ({ intent, target, source }) => ({ ok: true, value: [entry(target.normalizedRelativePath), ...(intent.kind === "MOVE_MANAGED_ARTIFACT" && source !== undefined ? [entry(source.normalizedRelativePath)] : [])] }),
    cleanup: async () => ({ ok: true, value: true }),
    restore: async (request) => {
      restores.push(request);
      if (request.intent.kind === "CREATE_MANAGED_ARTIFACT") {
        state.delete(request.target.normalizedRelativePath);
      } else if (request.intent.kind === "REMOVE_MANAGED_ARTIFACT") {
        state.set(request.target.normalizedRelativePath, { fingerprint: "remove-before", identityToken: "id:remove:restored" });
      } else if (request.intent.kind === "MOVE_MANAGED_ARTIFACT") {
        assert.ok(request.source);
        const current = state.get(request.target.normalizedRelativePath);
        assert.ok(current);
        state.delete(request.target.normalizedRelativePath);
        state.set(request.source.normalizedRelativePath, { fingerprint: current.fingerprint, identityToken: "id:source:restored" });
      }
      const current = state.get(request.target.normalizedRelativePath);
      return { ok: true, value: { ...(current === undefined ? {} : { postFingerprint: current.fingerprint }) } };
    },
  };

  return { state, resolver, physical, promotions, restores };
}

async function exercise(intent, expectedPreFingerprint, expectedCurrentFingerprint) {
  const fx = fixture();
  const effects = createFilesystemEffectAdapter({ transactionId: `tx:${intent.intentId}`, resolver: fx.resolver, physical: fx.physical });
  const plan = { intents: [intent] };

  assert.equal((await effects.checkPhysicalSafety(intent)).ok, true);
  const recovery = await effects.captureRecovery(intent);
  assert.equal(recovery.ok, true);
  assert.equal((await effects.verifyRecoveryMaterial({ phase: "APPLY", planDigest: "plan:test", transactionId: `tx:${intent.intentId}`, intent, recoveryRef: recovery.value, ...(expectedPreFingerprint === undefined ? {} : { expectedPreFingerprint }) })).ok, true);
  assert.equal((await effects.stage(intent)).ok, true);
  assert.equal((await effects.verifyStaged(intent, [])).ok, true);
  assert.equal((await effects.revalidateCommitBarrier(plan)).ok, true);
  assert.equal((await effects.promote(intent)).ok, true);
  const verified = await effects.verifyPostState(plan, [{ intentId: intent.intentId, targetRef: intent.targetRef, progress: "VERIFICATION_PENDING" }], []);
  assert.equal(verified.ok, true);

  const restored = await effects.restore({ intent, recoveryRef: recovery.value, ...(expectedCurrentFingerprint === undefined ? {} : { expectedCurrentFingerprint }), ...(expectedPreFingerprint === undefined ? {} : { expectedPreFingerprint }) });
  assert.equal(restored.ok, true);
  return fx;
}

test("CREATE traverses M06 adapter, promotes no-clobber target, then rollback removes only the created target", async () => {
  const fx = await exercise(intents.create, undefined, "create-after");
  assert.equal(fx.promotions.length, 1);
  assert.equal(fx.promotions[0].target.operation, "CREATE");
  assert.equal(fx.restores.length, 1);
  assert.equal(fx.restores[0].target.operation, "REMOVE");
  assert.equal(fx.state.has("dir/create.txt"), false);
});

test("REMOVE traverses M06 adapter, produces absent post-state, then rollback recreates exact managed target", async () => {
  const fx = await exercise(intents.remove, "remove-before", undefined);
  assert.equal(fx.promotions.length, 1);
  assert.equal(fx.promotions[0].target.operation, "REMOVE");
  assert.equal(fx.restores.length, 1);
  assert.equal(fx.restores[0].target.operation, "CREATE");
  assert.equal(fx.state.get("dir/remove.txt")?.fingerprint, "remove-before");
});

test("MOVE traverses independent source and destination proofs and rollback reverses the endpoints", async () => {
  const fx = await exercise(intents.move, "move-content", "move-content");
  assert.equal(fx.promotions.length, 1);
  assert.equal(fx.promotions[0].target.operation, "MOVE_DESTINATION");
  assert.equal(fx.promotions[0].source?.operation, "MOVE_SOURCE");
  assert.equal(fx.restores.length, 1);
  assert.equal(fx.restores[0].target.operation, "MOVE_SOURCE");
  assert.equal(fx.restores[0].source?.operation, "MOVE_DESTINATION");
  assert.equal(fx.state.has("dir/destination.txt"), false);
  assert.equal(fx.state.get("dir/source.txt")?.fingerprint, "move-content");
});
