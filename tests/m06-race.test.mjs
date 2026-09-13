import assert from "node:assert/strict";
import test from "node:test";
import { createFilesystemEffectAdapter } from "../packages/kernel/dist/index.js";

const root = Object.freeze({
  rootRef: "project-root",
  rootKind: "PROJECT",
  physicalRoot: "/repo",
  pathFlavor: "POSIX",
  caseSemantics: "SENSITIVE",
  allowedOperations: ["CREATE", "STAGE", "RESTORE", "REMOVE"],
  policyRef: "policy:m06:race",
  pathSemanticsRef: "posix:v1",
});
const intent = Object.freeze({
  intentId: "create-child",
  kind: "CREATE_MANAGED_ARTIFACT",
  targetRef: "file:new",
  securityClass: "S1_MANAGED_WRITE",
  recoveryClass: "REVERSIBLE_MANAGED",
  dependsOn: [],
  desiredFingerprint: "new-content",
});

function makeAdapter() {
  let observations = 0;
  let promotions = 0;
  const resolver = {
    resolve: () => ({ ok: true, value: { target: { root, relativePath: "managed/new.txt" }, desiredFingerprint: "new-content" } }),
  };
  const physical = {
    observe: async (path) => {
      observations += 1;
      const parent = observations === 1
        ? { relativePath: "managed", kind: "DIRECTORY", accessible: true, identityToken: "dir:v1", filesystemId: "fs1" }
        : { relativePath: "managed", kind: "SYMLINK", accessible: true, identityToken: "link:v2", filesystemId: "fs1" };
      return { ok: true, value: {
        ancestors: [
          { relativePath: "", kind: "DIRECTORY", accessible: true, identityToken: "root:v1", filesystemId: "fs1" },
          parent,
        ],
        target: { relativePath: path.normalizedRelativePath, kind: "ABSENT", accessible: true },
      } };
    },
    atomicFacts: async ({ path }) => ({ ok: true, value: {
      primitive: { capabilityRef: `cap:${path.operation}`, operation: path.operation, visibilityAtomic: true, raceResistant: true, noClobberCreate: true, replaceExisting: false, requiresSameFilesystem: false, durability: "UNPROVEN" },
      stagingAuthorityRef: "stage:tx",
      stagingFilesystemId: "fs1",
      destinationFilesystemId: "fs1",
    } }),
    captureRecovery: async () => ({ ok: true, value: { recoveryRef: "recovery:create" } }),
    verifyRecovery: async () => ({ ok: true, value: true }),
    stage: async () => ({ ok: true, value: { stageRef: "stage:create", fingerprint: "new-content" } }),
    verifyStage: async () => ({ ok: true, value: true }),
    promote: async () => { promotions += 1; return { ok: true, value: { postFingerprint: "new-content" } }; },
    verifyPost: async () => ({ ok: true, value: [] }),
    cleanup: async () => ({ ok: true, value: true }),
    restore: async () => ({ ok: true, value: {} }),
  };
  return { adapter: createFilesystemEffectAdapter({ transactionId: "tx-race", resolver, physical }), promotions: () => promotions };
}

test("ancestor replaced by a link after initial proof blocks at commit barrier before promotion", async () => {
  const fx = makeAdapter();
  const prepared = await fx.adapter.checkPhysicalSafety(intent);
  assert.equal(prepared.ok, true, prepared.ok ? "" : prepared.error.summary);
  const barrier = await fx.adapter.revalidateCommitBarrier({ intents: [intent] });
  assert.equal(barrier.ok, false);
  assert.match(barrier.error.reasonCode, /link_ancestor_blocked|stale_physical_state/);
  assert.equal(fx.promotions(), 0);
});
