import test from "node:test";
import assert from "node:assert/strict";
import { compileTransactionPlan } from "../packages/kernel/dist/index.js";
import { evaluateTemplate } from "../packages/template-engine/dist/index.js";
import { bundle, control, digest } from "./m07-fixture.mjs";

test("M07 desired artifact carries no mutation or authorization inference", async () => {
  const result = await evaluateTemplate(bundle(), digest, control());
  assert.equal(result.ok, true, result.ok ? "" : result.error.code);
  assert.equal(result.value.validation.outcome, "VALIDATED_FOR_EFFECT_PLANNING");
  const artifact = result.value.validation.artifacts[0];
  for (const forbidden of ["operation", "intentKind", "securityClass", "authorization", "owner", "overwrite", "recoveryClass"]) {
    assert.equal(forbidden in artifact, false, forbidden);
  }
});

test("M07 output reaches M05 only after explicit downstream state and policy translation", async () => {
  const result = await evaluateTemplate(bundle(), digest, control());
  assert.equal(result.ok, true);
  const artifact = result.value.validation.artifacts[0];
  const targetRef = `file:${artifact.logicalTarget}`;

  const planBody = {
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: "project:test", projectId: "project-1", bindingStrength: "PROJECT" },
    expectedPreState: [{ key: `target:${targetRef}`, owner: "integration-fixture", predicate: "EXACT", value: "ABSENT" }],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: [],
    mutationSurface: [targetRef],
    intents: [{
      intentId: "template_create_readme",
      kind: "CREATE_MANAGED_ARTIFACT",
      targetRef,
      securityClass: "S1_MANAGED_WRITE",
      recoveryClass: "REVERSIBLE_MANAGED",
      dependsOn: [],
      desiredFingerprint: artifact.renderedContentDigest,
    }],
    ordering: [],
    verificationObligations: [
      { verificationId: "stage_readme", phase: "STAGED", targetRef },
      { verificationId: "post_readme", phase: "POST_STATE", targetRef },
    ],
    recoveryRequirements: [{ intentId: "template_create_readme", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "remove_created_target" }],
    externalEffectDeclarations: [],
    policyRefs: [{ policyId: "m07-template-desired-state", version: "1" }],
  };

  const plan = compileTransactionPlan(planBody, digest);
  assert.equal(plan.ok, true, plan.ok ? "" : plan.error.summary);
  assert.equal(plan.value.intents[0].desiredFingerprint, artifact.renderedContentDigest);
  assert.equal(plan.value.securityClass, "S1_MANAGED_WRITE");
  assert.equal(result.value.validation.downstreamRequirements.includes("M06_PHYSICAL_PATH_AUTHORITY"), true);
});

test("M07 omission never translates itself into REMOVE or MOVE intents", async () => {
  const result = await evaluateTemplate(bundle(), digest, control());
  assert.equal(result.ok, true);
  const serialized = JSON.stringify(result.value.validation);
  assert.equal(serialized.includes("REMOVE_MANAGED_ARTIFACT"), false);
  assert.equal(serialized.includes("MOVE_MANAGED_ARTIFACT"), false);
});
