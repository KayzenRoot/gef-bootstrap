import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { compileTransactionPlan } from "../packages/kernel/dist/index.js";

const digest = { digest: (text) => createHash("sha256").update(text).digest("hex") };

function body(binding) {
  const targetRef = "move:source:destination";
  return {
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: "project:test", projectId: "p1", bindingStrength: "PROJECT" },
    expectedPreState: [binding],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: [],
    mutationSurface: [targetRef],
    intents: [{
      intentId: "move",
      kind: "MOVE_MANAGED_ARTIFACT",
      targetRef,
      securityClass: "S1_MANAGED_WRITE",
      recoveryClass: "REVERSIBLE_MANAGED",
      dependsOn: [],
      desiredFingerprint: "src=ABSENT|dst=before",
    }],
    ordering: [],
    verificationObligations: [],
    recoveryRequirements: [{ intentId: "move", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "move-pre" }],
    externalEffectDeclarations: [],
    policyRefs: [],
  };
}

test("move composite pre-state must declare its contract version", () => {
  const targetRef = "move:source:destination";
  const unversioned = compileTransactionPlan(body({
    key: `target:${targetRef}`,
    owner: "fixture",
    predicate: "EXACT",
    value: "src=before|dst=ABSENT",
  }), digest);
  assert.equal(unversioned.ok, false);
  assert.match(unversioned.error.reasonCode, /move_pre_state_missing/);

  const versioned = compileTransactionPlan(body({
    key: `target:${targetRef}`,
    owner: "fixture",
    predicate: "EXACT",
    value: "src=before|dst=ABSENT",
    contractVersion: "composite-endpoints-v1",
  }), digest);
  assert.equal(versioned.ok, true, versioned.ok ? "" : versioned.error.summary);
});
