import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  buildTestMap,
  compileIncrementalValidationPlan,
  deniesMutationAuthority,
} from "../packages/test-impact-engine/dist/public.js";

const raw = value => createHash("sha256").update(value).digest("hex");
const H = value => `sha256:${raw(value)}`;
const options = { digest: { algorithm: "sha256", digest: raw } };

function canonicalMap() {
  const result = buildTestMap(
    [
      { id: "src:a", fingerprint: H("src:a") },
      { id: "src:b", fingerprint: H("src:b") },
      { id: "src:c", fingerprint: H("src:c") },
    ],
    [
      { id: "test:a", fingerprint: H("test:a"), sources: ["src:a"] },
      { id: "test:b", fingerprint: H("test:b"), sources: ["src:b"] },
      { id: "test:extra", fingerprint: H("test:extra"), sources: ["src:c"] },
      { id: "test:windows", fingerprint: H("test:windows"), sources: ["src:c"], platforms: ["windows"] },
    ],
    options,
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}

function incompleteMap() {
  const result = buildTestMap(
    [
      { id: "src:a", fingerprint: H("src:a"), dependsOn: ["src:missing"] },
      { id: "src:b", fingerprint: H("src:b") },
    ],
    [
      { id: "test:a", fingerprint: H("test:a"), sources: ["src:a"] },
      { id: "test:b", fingerprint: H("test:b"), sources: ["src:b"] },
    ],
    options,
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.complete, false);
  return result.value;
}

function dynamicMap() {
  const result = buildTestMap(
    [{ id: "src:a", fingerprint: H("src:a") }],
    [{ id: "test:a", fingerprint: H("test:a"), sources: ["src:a"], dynamic: true }],
    options,
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}

function knownButUnmappedMap() {
  const result = buildTestMap(
    [
      { id: "src:a", fingerprint: H("src:a") },
      { id: "src:b", fingerprint: H("src:b") },
    ],
    [{ id: "test:b", fingerprint: H("test:b"), sources: ["src:b"] }],
    options,
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.complete, true);
  return result.value;
}

function boundaryMap() {
  const result = buildTestMap(
    [
      { id: "src:a", fingerprint: H("src:a") },
      { id: "src:b", fingerprint: H("src:b") },
    ],
    [
      { id: "test:a", fingerprint: H("test:a"), sources: ["src:a"], boundaries: ["api:orders"] },
      { id: "test:api", fingerprint: H("test:api"), sources: ["src:b"], boundaries: ["api:orders"] },
    ],
    options,
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}

function capsule(overrides = {}) {
  return {
    state: "COMPILED",
    certainty: "SUFFICIENT",
    capsuleFingerprint: raw("capsule"),
    ladderLevel: "L1",
    tests: [],
    escalation: [{ trigger: "uncertain", escalateTo: "L4" }],
    finalSweepRequired: false,
    ...overrides,
  };
}

function input(overrides = {}) {
  return {
    candidateDigest: H("candidate"),
    platform: "linux",
    map: canonicalMap(),
    changedSources: ["src:a"],
    assurance: { requiredLevel: "L1", policyDigest: H("policy"), profileDigest: H("profile") },
    selectorConfidence: "CERTAIN",
    brownfieldPosture: "GREENFIELD",
    capsule: capsule(),
    ...overrides,
  };
}

function compile(overrides = {}) {
  return compileIncrementalValidationPlan(input(overrides), options);
}

function failCode(result) {
  assert.equal(result.ok, false, JSON.stringify(result));
  return result.diagnostics[0]?.code;
}

test("known mapped change stays narrow when assurance and certainty permit", () => {
  const result = compile();
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "READY");
  assert.equal(result.value.level, "L1");
  assert.deepEqual(result.value.tests, ["test:a"]);
  assert.equal(result.value.fullSuiteRequired, false);
  assert.equal(result.value.intermediateSuppression, "DEFER_TO_PROOF_REUSE");
  assert.equal(result.value.finalSweepRequired, false);
  assert.equal(result.value.handoff.authority, "READ_ONLY_TEST_IMPACT");
  assert.equal(deniesMutationAuthority(result.value.handoff), true);
});

test("INC-VAL-01: known changed source with no test mapping widens to L4 and never selects empty", () => {
  const result = compile({
    map: knownButUnmappedMap(),
    changedSources: ["src:a"],
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.level, "L4");
  assert.equal(result.value.state, "WIDENED");
  assert.equal(result.value.uncertainty, "UNKNOWN");
  assert.equal(result.value.fullSuiteRequired, true);
  assert.equal(result.value.intermediateSuppression, "PROHIBITED");
  assert.deepEqual(result.value.tests, ["test:b"]);
  assert.ok(result.value.reasons.includes("CHANGED_SOURCE_UNMAPPED:src:a"));

  const absentSource = compile({ changedSources: ["src:not-in-map"] });
  assert.equal(absentSource.ok, true, JSON.stringify(absentSource));
  assert.equal(absentSource.value.level, "L4");
  assert.equal(absentSource.value.intermediateSuppression, "PROHIBITED");
  assert.ok(absentSource.value.reasons.includes("DEPENDENCY_UNKNOWN"));
});

test("INC-VAL-02: selector confidence INDETERMINATE prohibits suppression and widens to L4", () => {
  const result = compile({ selectorConfidence: "INDETERMINATE" });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "INDETERMINATE");
  assert.equal(result.value.level, "L4");
  assert.equal(result.value.intermediateSuppression, "PROHIBITED");
  assert.equal(result.value.fullSuiteRequired, true);
  assert.ok(result.value.reasons.includes("SELECTOR_CONFIDENCE_INDETERMINATE"));
});

test("INC-VAL-03: unknown dependency endpoint widens selection", () => {
  const result = compile({
    map: incompleteMap(),
    changedSources: ["src:a"],
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.level, "L4");
  assert.equal(result.value.state, "WIDENED");
  assert.equal(result.value.fullSuiteRequired, true);
  assert.equal(result.value.intermediateSuppression, "PROHIBITED");
  assert.deepEqual(result.value.tests, ["test:a", "test:b"]);
  assert.ok(result.value.reasons.includes("DEPENDENCY_UNKNOWN"));
});

test("INC-VAL-04: L5 requirement survives an otherwise narrow L1 selection", () => {
  const result = compile({
    assurance: { requiredLevel: "L1", policyDigest: H("policy"), profileDigest: H("profile") },
    capsule: capsule({ ladderLevel: "L5", finalSweepRequired: true }),
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.level, "L5");
  assert.equal(result.value.finalSweepRequired, true);
  assert.equal(result.value.fullSuiteRequired, true);
  assert.deepEqual(result.value.tests, ["test:a", "test:b", "test:extra"]);
});

test("INC-VAL-05: unproven brownfield forces the full relevant suite and prohibits suppression", () => {
  const result = compile({ brownfieldPosture: "BROWNFIELD_UNPROVEN" });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "WIDENED");
  assert.equal(result.value.level, "L4");
  assert.equal(result.value.fullSuiteRequired, true);
  assert.equal(result.value.intermediateSuppression, "PROHIBITED");
  assert.deepEqual(result.value.tests, ["test:a", "test:b", "test:extra"]);
  assert.ok(result.value.reasons.includes("BROWNFIELD_SHADOW_ASSURANCE_MISSING"));
});

test("capsule-mandated tests are unioned with the narrow impacted set", () => {
  const result = compile({ capsule: capsule({ tests: ["test:extra"] }) });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.level, "L1");
  assert.deepEqual(result.value.tests, ["test:a", "test:extra"]);
});

test("missing capsule-mandated test becomes INDETERMINATE and is never silently dropped", () => {
  const result = compile({ capsule: capsule({ tests: ["test:missing"] }) });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "INDETERMINATE");
  assert.equal(result.value.level, "L4");
  assert.equal(result.value.intermediateSuppression, "PROHIBITED");
  assert.ok(result.value.tests.includes("test:missing"));
  assert.ok(result.value.reasons.includes("CAPSULE_TEST_UNMAPPED:test:missing"));
});

test("platform filtering follows M28 semantics and records filtered mandatory tests explicitly", () => {
  const result = compile({
    platform: "linux",
    capsule: capsule({ tests: ["test:windows"] }),
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.ok(!result.value.tests.includes("test:windows"));
  assert.ok(result.value.reasons.includes("CAPSULE_TEST_PLATFORM_FILTERED:test:windows"));
});

test("dynamic test surface widens to L4 through the existing M28 selector", () => {
  const result = compile({
    map: dynamicMap(),
    changedSources: ["src:a"],
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.level, "L4");
  assert.equal(result.value.state, "WIDENED");
  assert.equal(result.value.uncertainty, "SYSTEMIC");
  assert.equal(result.value.intermediateSuppression, "PROHIBITED");
  assert.ok(result.value.reasons.includes("DYNAMIC_TEST_SURFACE"));
});

test("invalid or insufficient capsule never authorizes selective suppression", () => {
  const indeterminate = compile({
    capsule: capsule({ state: "INDETERMINATE", certainty: "INSUFFICIENT" }),
  });
  assert.equal(indeterminate.ok, true, JSON.stringify(indeterminate));
  assert.equal(indeterminate.value.state, "INDETERMINATE");
  assert.equal(indeterminate.value.intermediateSuppression, "PROHIBITED");
  assert.equal(indeterminate.value.fullSuiteRequired, true);

  const stale = compile({
    capsule: capsule({ state: "STALE", certainty: "SUFFICIENT" }),
  });
  assert.equal(stale.ok, true, JSON.stringify(stale));
  assert.equal(stale.value.state, "BLOCKED");
  assert.equal(stale.value.intermediateSuppression, "PROHIBITED");
});

test("tampered TestMap content cannot ride on an old M28 digest", () => {
  const map = canonicalMap();
  const tampered = { ...map, tests: map.tests.slice(0, 1) };
  const result = compile({ map: tampered });
  assert.equal(failCode(result), "INCREMENTAL_TEST_MAP_INVALID");
});

test("repeat compilation and unordered input permutations are deterministic", () => {
  const base = input({
    changedSources: ["src:b", "src:a"],
    capsule: capsule({ tests: ["test:extra", "test:a"] }),
  });
  const first = compileIncrementalValidationPlan(base, options);
  const second = compileIncrementalValidationPlan({
    ...base,
    changedSources: [...base.changedSources].reverse(),
    capsule: { ...base.capsule, tests: [...base.capsule.tests].reverse() },
  }, options);
  assert.equal(first.ok, true, JSON.stringify(first));
  assert.equal(second.ok, true, JSON.stringify(second));
  assert.equal(first.value.digest, second.value.digest);
  assert.deepEqual(first.value.tests, second.value.tests);
  assert.equal(first.value.handoff.digest, second.value.handoff.digest);
});

test("WO-006 does not issue proof-reuse verdicts", () => {
  const result = compile();
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.ok(["DEFER_TO_PROOF_REUSE", "PROHIBITED"].includes(result.value.intermediateSuppression));
  assert.equal("reusableTests" in result.value, false);
  assert.equal(result.value.handoff.authority, "READ_ONLY_TEST_IMPACT");
});

test("L3 closes over impacted boundary tests and unknown boundary knowledge escalates to L4", () => {
  const withBoundary = compile({
    map: boundaryMap(),
    changedSources: ["src:a"],
    assurance: { requiredLevel: "L3", policyDigest: H("policy"), profileDigest: H("profile") },
    capsule: capsule({ ladderLevel: "L3" }),
  });
  assert.equal(withBoundary.ok, true, JSON.stringify(withBoundary));
  assert.equal(withBoundary.value.level, "L3");
  assert.deepEqual(withBoundary.value.tests, ["test:a", "test:api"]);
  assert.ok(withBoundary.value.reasons.includes("BOUNDARY_CLOSURE_INCLUDED"));

  const withoutBoundary = compile({
    changedSources: ["src:a"],
    assurance: { requiredLevel: "L3", policyDigest: H("policy"), profileDigest: H("profile") },
    capsule: capsule({ ladderLevel: "L3" }),
  });
  assert.equal(withoutBoundary.ok, true, JSON.stringify(withoutBoundary));
  assert.equal(withoutBoundary.value.level, "L4");
  assert.equal(withoutBoundary.value.fullSuiteRequired, true);
  assert.equal(withoutBoundary.value.intermediateSuppression, "PROHIBITED");
  assert.ok(withoutBoundary.value.reasons.includes("BOUNDARY_KNOWLEDGE_INCOMPLETE"));
});

test("invalid assurance/capsule enum truth fails closed before selection", () => {
  const badLevel = compile({
    assurance: { requiredLevel: "L9", policyDigest: H("policy"), profileDigest: H("profile") },
  });
  assert.equal(failCode(badLevel), "INCREMENTAL_INPUT_INVALID");

  const badCertainty = compile({
    capsule: capsule({ certainty: "MAYBE" }),
  });
  assert.equal(failCode(badCertainty), "INCREMENTAL_INPUT_INVALID");
});
