import assert from "node:assert/strict";
import test from "node:test";
import { createFilesystemEffectAdapter } from "../packages/kernel/dist/index.js";

const root = Object.freeze({
  rootRef: "root",
  rootKind: "PROJECT",
  physicalRoot: "/repo",
  pathFlavor: "POSIX",
  caseSemantics: "SENSITIVE",
  allowedOperations: ["UPDATE", "RESTORE", "STAGE"],
  policyRef: "p1",
  pathSemanticsRef: "posix-v1",
});
const intent = Object.freeze({ intentId: "i1", kind: "UPDATE_MANAGED_ARTIFACT", targetRef: "file:a", securityClass: "S1_MANAGED_WRITE", recoveryClass: "REVERSIBLE_MANAGED", dependsOn: [], desiredFingerprint: "after" });
const plan = Object.freeze({ intents: [intent] });

function fixture(options = {}) {
  let atomicCalls = 0;
  const resolver = {
    resolve: () => ({ ok: true, value: { target: { root, relativePath: "a.txt", expected: { expectedKind: "FILE", expectedFingerprint: "before", expectedIdentityToken: "id1", ownershipRef: "owner" } }, desiredFingerprint: "after" } }),
  };
  const physical = {
    observe: async (path) => ({ ok: true, value: { ancestors: [{ relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "root-id", filesystemId: "fs1" }], target: { relativePath: path.normalizedRelativePath, kind: "FILE", accessible: true, identityToken: "id1", fingerprint: "before", filesystemId: "fs1", linkCount: 1 } } }),
    atomicFacts: async ({ path }) => {
      atomicCalls += 1;
      const drift = options.driftAt === atomicCalls;
      return { ok: true, value: {
        primitive: { capabilityRef: `cap:${path.operation}`, operation: path.operation, visibilityAtomic: true, raceResistant: true, noClobberCreate: false, replaceExisting: true, requiresSameFilesystem: true, durability: "UNPROVEN" },
        stagingAuthorityRef: options.missingAuthority ? "" : drift ? "stage:changed" : "stage:original",
        stagingFilesystemId: drift && options.driftFilesystem ? "fs2" : "fs1",
        destinationFilesystemId: "fs1",
      } };
    },
    captureRecovery: async () => ({ ok: true, value: { recoveryRef: "r1" } }),
    verifyRecovery: async () => ({ ok: true, value: true }),
    stage: async () => ({ ok: true, value: { stageRef: "s1" } }),
    verifyStage: async () => ({ ok: true, value: true }),
    promote: async () => ({ ok: true, value: { postFingerprint: "after" } }),
    verifyPost: async () => ({ ok: true, value: [] }),
    cleanup: async () => ({ ok: true, value: true }),
    restore: async () => ({ ok: true, value: { postFingerprint: "before" } }),
  };
  return createFilesystemEffectAdapter({ transactionId: "tx", resolver, physical });
}

test("missing governed staging authority blocks physical safety before effect", async () => {
  const adapter = fixture({ missingAuthority: true });
  const result = await adapter.checkPhysicalSafety(intent);
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /staging_authority_missing/);
});

test("staging authority drift invalidates commit barrier capability", async () => {
  const adapter = fixture({ driftAt: 2 });
  assert.equal((await adapter.checkPhysicalSafety(intent)).ok, true);
  const result = await adapter.revalidateCommitBarrier(plan);
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /stale_physical_state/);
});

test("staging filesystem drift invalidates commit barrier instead of reusing old proof", async () => {
  const adapter = fixture({ driftAt: 2, driftFilesystem: true });
  assert.equal((await adapter.checkPhysicalSafety(intent)).ok, true);
  const result = await adapter.revalidateCommitBarrier(plan);
  assert.equal(result.ok, false);
});
