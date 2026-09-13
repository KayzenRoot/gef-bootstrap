import assert from "node:assert/strict";
import test from "node:test";
import { linkRetryAttempt } from "../packages/kernel/dist/index.js";

const scope = { scopeId: "scope-1", targetRef: "project:test", planDigest: "plan-1", contractVersion: "1" };
const prior = {
  schemaVersion: 1,
  scope,
  planDigest: "plan-1",
  runId: "run-old",
  transactionId: "tx-old",
  effectState: "FULLY_RESTORED_VERIFIED",
  terminalOutcome: "RECOVERED",
};

test("retry eligibility must match predecessor effect state", () => {
  const staleEligibility = {
    decision: "FRESH_ATTEMPT_ELIGIBLE",
    effectState: "NO_EFFECT",
    reason: "eligibility from a different observation",
  };
  const result = linkRetryAttempt({
    prior,
    eligibility: staleEligibility,
    scope,
    planDigest: "plan-1",
    runId: "run-new",
    transactionId: "tx-new",
  });
  assert.equal(result.ok, false);
  assert.match(result.error.reasonCode, /eligibility_state_mismatch/);
});

test("new retry attempt always starts in flight", () => {
  const eligibility = {
    decision: "FRESH_ATTEMPT_ELIGIBLE",
    effectState: "FULLY_RESTORED_VERIFIED",
    reason: "verified restored state",
  };
  const result = linkRetryAttempt({
    prior,
    eligibility,
    scope,
    planDigest: "plan-1",
    runId: "run-new",
    transactionId: "tx-new",
  });
  assert.equal(result.ok, true, result.ok ? "" : result.error.summary);
  assert.equal(result.value.effectState, "IN_FLIGHT");
  assert.equal(result.value.predecessorRunId, "run-old");
});
