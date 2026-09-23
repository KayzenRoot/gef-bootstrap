import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  buildTestMap,
  compileIncrementalValidationPlan,
  compileProofReusePlan,
  createReuseReceipt,
} from "../packages/test-impact-engine/dist/public.js";

const raw = value => createHash("sha256").update(value).digest("hex");
const H = value => `sha256:${raw(value)}`;
const options = { digest: { algorithm: "sha256", digest: raw } };

function mapFixture() {
  const result = buildTestMap(
    [
      { id: "src:a", fingerprint: H("src:a") },
      { id: "src:b", fingerprint: H("src:b") },
      { id: "src:c", fingerprint: H("src:c") },
    ],
    [
      { id: "test:a", fingerprint: H("test:a"), sources: ["src:a"] },
      { id: "test:b", fingerprint: H("test:b"), sources: ["src:b"], dependsOn: ["test:a"] },
      { id: "test:c", fingerprint: H("test:c"), sources: ["src:c"] },
      { id: "test:windows", fingerprint: H("test:windows"), sources: ["src:c"], platforms: ["windows"] },
    ],
    options,
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}

function validationPlan({ map = mapFixture(), changedSources = [], tests = ["test:a", "test:b", "test:c"], level = "L1", finalSweepRequired = false, brownfieldPosture = "GREENFIELD", selectorConfidence = "CERTAIN", platform = "linux" } = {}) {
  const result = compileIncrementalValidationPlan({
    candidateDigest: H("candidate"),
    platform,
    map,
    changedSources,
    assurance: { requiredLevel: level, policyDigest: H("policy"), profileDigest: H("profile") },
    selectorConfidence,
    brownfieldPosture,
    capsule: {
      state: "COMPILED",
      certainty: "SUFFICIENT",
      capsuleFingerprint: raw("capsule"),
      ladderLevel: level,
      tests,
      escalation: [{ trigger: "uncertain", escalateTo: "L4" }],
      finalSweepRequired,
    },
  }, options);
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}

function currentBinding(map, testId, overrides = {}) {
  const test = map.tests.find(item => item.id === testId);
  assert.ok(test, testId);
  return {
    testId,
    testFingerprint: test.fingerprint,
    sourceDigest: H(`source:${testId}`),
    dependencyDigest: H(`dependency:${testId}`),
    configDigest: H("config"),
    fixtureDigest: H("fixture"),
    toolchainDigest: H("toolchain"),
    runtimeDigest: H("runtime"),
    platform: "linux",
    policyDigest: H("policy"),
    candidateDigest: H("candidate"),
    ...overrides,
  };
}

function receiptFor(map, testId, receiptOverrides = {}) {
  const current = currentBinding(map, testId);
  const result = createReuseReceipt({
    ...current,
    evidenceId: `ev:${testId}`,
    acceptedPass: true,
    ...receiptOverrides,
  }, options);
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}

function reuseInput(overrides = {}) {
  const map = overrides.map ?? mapFixture();
  const validation = overrides.validation ?? validationPlan({
    map,
    changedSources: overrides.validationChangedSources ?? [],
  });
  const selected = validation.tests;
  return {
    candidateDigest: H("candidate"),
    platform: "linux",
    policyDigest: H("policy"),
    profileDigest: H("profile"),
    map,
    validation,
    receipts: selected.map(testId => receiptFor(map, testId)),
    currentBindings: selected.map(testId => currentBinding(map, testId)),
    changedSources: [],
    currentFailures: [],
    dependencyKnowledgeComplete: true,
    ...overrides,
    map,
    validation: overrides.validation ?? validation,
  };
}

function compile(overrides = {}) {
  return compileProofReusePlan(reuseInput(overrides), options);
}

function failCode(result) {
  assert.equal(result.ok, false, JSON.stringify(result));
  return result.diagnostics[0]?.code;
}

test("exact compatible receipts suppress repeated intermediate invocation only", () => {
  const result = compile();
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "READY");
  assert.deepEqual(result.value.reusedTests, ["test:a", "test:b", "test:c"]);
  assert.deepEqual(result.value.testsToRun, []);
  assert.ok(result.value.decisions.every(decision => decision.state === "REUSABLE" && decision.suppressed));
  assert.equal(result.value.finalSweepRequired, false);
  assert.equal(result.value.manufacturesProductionCredit, false);
  assert.equal(result.value.handoff.authority, "READ_ONLY_TEST_IMPACT");
  assert.equal(result.value.handoff.manufacturesProductionCredit, false);
});

test("PROOF-INV-01: every validator non-REUSABLE state suppresses nothing", () => {
  const map = mapFixture();
  const validation = validationPlan({ map, tests: ["test:a"] });
  const current = currentBinding(map, "test:a");
  const scenarios = [
    ["STALE_SOURCE", { sourceDigest: H("old-source") }, {}],
    ["STALE_TEST", { testFingerprint: H("old-test") }, {}],
    ["STALE_CONFIG", { configDigest: H("old-config") }, {}],
    ["STALE_FIXTURE", { fixtureDigest: H("old-fixture") }, {}],
    ["STALE_TOOLCHAIN", { toolchainDigest: H("old-toolchain") }, {}],
    ["STALE_RUNTIME", { runtimeDigest: H("old-runtime") }, {}],
    ["PLATFORM_MISMATCH", { platform: "windows" }, {}],
    ["DEPENDENCY_UNKNOWN", { dependencyDigest: H("old-dependency") }, {}],
    ["POLICY_DRIFT", { policyDigest: H("old-policy") }, {}],
    ["CONFLICT", { candidateDigest: H("old-candidate") }, {}],
    ["INDETERMINATE", { acceptedPass: false }, {}],
    ["CURRENT_FAILURE", { currentFailure: true }, {}],
  ];

  for (const [expectedState, receiptOverrides] of scenarios) {
    const receipt = receiptFor(map, "test:a", receiptOverrides);
    const result = compileProofReusePlan({
      ...reuseInput({ map, validation}),
      receipts: [receipt],
      currentBindings: [current],
    }, options);
    assert.equal(result.ok, true, `${expectedState}: ${JSON.stringify(result)}`);
    assert.deepEqual(result.value.reusedTests, [], expectedState);
    assert.deepEqual(result.value.testsToRun, ["test:a"], expectedState);
    assert.equal(result.value.decisions[0].state, expectedState, expectedState);
    assert.equal(result.value.decisions[0].suppressed, false, expectedState);
  }

  const good = receiptFor(map, "test:a");
  const tampered = { ...good, digest: H("tampered-receipt") };
  const conflict = compileProofReusePlan({
    ...reuseInput({ map, validation}),
    receipts: [tampered],
    currentBindings: [current],
  }, options);
  assert.equal(conflict.ok, true, JSON.stringify(conflict));
  assert.equal(conflict.value.decisions[0].state, "CONFLICT");
  assert.deepEqual(conflict.value.reusedTests, []);
});

test("PROOF-INV-02: targeted source invalidation affects only the proven overlap", () => {
  const map = mapFixture();
  const validation = validationPlan({ map, changedSources: ["src:a"] });
  const result = compile({
    map,
    validation,
    changedSources: ["src:a"],
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "READY");
  assert.deepEqual(result.value.reusedTests, ["test:c"]);
  assert.deepEqual(result.value.testsToRun, ["test:a", "test:b"]);
  assert.equal(result.value.decisions.find(x => x.testId === "test:a").state, "INVALIDATED_SOURCE");
  assert.equal(result.value.decisions.find(x => x.testId === "test:b").state, "INVALIDATED_SOURCE");
  assert.equal(result.value.decisions.find(x => x.testId === "test:c").state, "REUSABLE");
});

test("PROOF-INV-03: reuse cannot manufacture production credit", () => {
  const result = compile();
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.manufacturesProductionCredit, false);
  assert.equal(result.value.handoff.manufacturesProductionCredit, false);
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(Object.isFrozen(result.value.handoff), true);
  assert.throws(() => { result.value.manufacturesProductionCredit = true; }, TypeError);
});

test("PROOF-INV-04: stale toolchain and platform mismatch refuse reuse", () => {
  const map = mapFixture();

  const linuxValidation = validationPlan({ map, tests: ["test:a"], platform: "linux" });
  const staleToolchain = compileProofReusePlan({
    ...reuseInput({ map, validation: linuxValidation }),
    receipts: [receiptFor(map, "test:a")],
    currentBindings: [currentBinding(map, "test:a", { toolchainDigest: H("toolchain-new") })],
  }, options);
  assert.equal(staleToolchain.ok, true, JSON.stringify(staleToolchain));
  assert.equal(staleToolchain.value.decisions[0].state, "STALE_TOOLCHAIN");
  assert.equal(staleToolchain.value.decisions[0].suppressed, false);

  const windowsValidation = validationPlan({ map, tests: ["test:a"], platform: "windows" });
  const platformMismatch = compileProofReusePlan({
    ...reuseInput({ map, validation: windowsValidation }),
    platform: "windows",
    receipts: [receiptFor(map, "test:a", { platform: "linux" })],
    currentBindings: [currentBinding(map, "test:a", { platform: "windows" })],
  }, options);
  assert.equal(platformMismatch.ok, true, JSON.stringify(platformMismatch));
  assert.equal(platformMismatch.value.decisions[0].state, "PLATFORM_MISMATCH");
  assert.equal(platformMismatch.value.decisions[0].suppressed, false);
});
test("PROOF-INV-05: current failure invalidates failed test and transitive downstream overlap", () => {
  const map = mapFixture();
  const result = compile({
    map,
    currentFailures: [{ testId: "test:a", fingerprint: H("failure:a") }],
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.value.reusedTests, ["test:c"]);
  assert.deepEqual(result.value.testsToRun, ["test:a", "test:b"]);
  assert.equal(result.value.decisions.find(x => x.testId === "test:a").state, "INVALIDATED_FAILURE");
  assert.equal(result.value.decisions.find(x => x.testId === "test:b").state, "INVALIDATED_FAILURE");
});

test("missing receipt or current binding keeps the test runnable", () => {
  const map = mapFixture();
  const base = reuseInput({ map });
  const noReceipt = compileProofReusePlan({
    ...base,
    receipts: base.receipts.filter(receipt => receipt.testId !== "test:b"),
  }, options);
  assert.equal(noReceipt.ok, true, JSON.stringify(noReceipt));
  assert.ok(noReceipt.value.testsToRun.includes("test:b"));
  assert.equal(noReceipt.value.decisions.find(x => x.testId === "test:b").state, "MISSING_RECEIPT");

  const noBinding = compileProofReusePlan({
    ...base,
    currentBindings: base.currentBindings.filter(binding => binding.testId !== "test:b"),
  }, options);
  assert.equal(noBinding.ok, true, JSON.stringify(noBinding));
  assert.ok(noBinding.value.testsToRun.includes("test:b"));
  assert.equal(noBinding.value.decisions.find(x => x.testId === "test:b").state, "MISSING_BINDING");
});

test("duplicate receipt or binding identity makes the whole plan INDETERMINATE with zero suppression", () => {
  const base = reuseInput();
  const duplicateReceipt = compileProofReusePlan({
    ...base,
    receipts: [...base.receipts, base.receipts[0]],
  }, options);
  assert.equal(duplicateReceipt.ok, true, JSON.stringify(duplicateReceipt));
  assert.equal(duplicateReceipt.value.state, "INDETERMINATE");
  assert.deepEqual(duplicateReceipt.value.reusedTests, []);
  assert.deepEqual(duplicateReceipt.value.testsToRun, base.validation.tests.slice().sort());

  const duplicateBinding = compileProofReusePlan({
    ...base,
    currentBindings: [...base.currentBindings, base.currentBindings[0]],
  }, options);
  assert.equal(duplicateBinding.ok, true, JSON.stringify(duplicateBinding));
  assert.equal(duplicateBinding.value.state, "INDETERMINATE");
  assert.deepEqual(duplicateBinding.value.reusedTests, []);
});

test("current binding must triangulate against current map/candidate/policy/platform truth", () => {
  const base = reuseInput();
  const wrongCandidate = base.currentBindings.map((binding, index) =>
    index === 0 ? { ...binding, candidateDigest: H("other-candidate") } : binding
  );
  assert.equal(
    failCode(compileProofReusePlan({ ...base, currentBindings: wrongCandidate }, options)),
    "PROOF_REUSE_CURRENT_BINDING_INVALID",
  );

  const wrongFingerprint = base.currentBindings.map((binding, index) =>
    index === 0 ? { ...binding, testFingerprint: H("forged-current-test") } : binding
  );
  assert.equal(
    failCode(compileProofReusePlan({ ...base, currentBindings: wrongFingerprint }, options)),
    "PROOF_REUSE_CURRENT_BINDING_INVALID",
  );
});

test("L5 final exact-head sweep cannot be suppressed by reusable receipts", () => {
  const map = mapFixture();
  const validation = validationPlan({ map, level: "L5", finalSweepRequired: true });
  const result = compile({
    map,
    validation,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "NO_REUSE");
  assert.deepEqual(result.value.reusedTests, []);
  assert.deepEqual(result.value.testsToRun, validation.tests);
  assert.ok(result.value.decisions.every(entry => entry.state === "FINAL_SWEEP_REQUIRED"));
  assert.equal(result.value.finalSweepRequired, true);
});

test("WO-006 suppression-prohibited plan disables all reuse", () => {
  const map = mapFixture();
  const validation = validationPlan({ map, brownfieldPosture: "BROWNFIELD_UNPROVEN" });
  assert.equal(validation.intermediateSuppression, "PROHIBITED");
  const result = compile({
    map,
    validation,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.value.reusedTests, []);
  assert.deepEqual(result.value.testsToRun, validation.tests);
  assert.ok(result.value.decisions.every(entry => entry.state === "UPSTREAM_SUPPRESSION_PROHIBITED"));
});

test("incomplete dependency knowledge is globally fail-closed", () => {
  const result = compile({ dependencyKnowledgeComplete: false });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "INDETERMINATE");
  assert.deepEqual(result.value.reusedTests, []);
  assert.deepEqual(result.value.testsToRun, result.value.selectedTests);
});

test("unknown current failure identity conservatively disables suppression", () => {
  const result = compile({
    currentFailures: [{ testId: "test:unknown", fingerprint: H("unknown-failure") }],
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "INDETERMINATE");
  assert.deepEqual(result.value.reusedTests, []);
  assert.deepEqual(result.value.testsToRun, result.value.selectedTests);
});

test("receipt/binding/change/failure permutations are deterministic", () => {
  const map = mapFixture();
  const validation = validationPlan({ map, changedSources: ["src:a", "src:c"] });
  const base = reuseInput({
    map,
    validation,
    changedSources: ["src:c", "src:a"],
    currentFailures: [{ testId: "test:a", fingerprint: H("failure:a") }],
  });
  const first = compileProofReusePlan(base, options);
  const second = compileProofReusePlan({
    ...base,
    receipts: [...base.receipts].reverse(),
    currentBindings: [...base.currentBindings].reverse(),
    changedSources: [...base.changedSources].reverse(),
    currentFailures: [...base.currentFailures].reverse(),
  }, options);
  assert.equal(first.ok, true, JSON.stringify(first));
  assert.equal(second.ok, true, JSON.stringify(second));
  assert.equal(first.value.digest, second.value.digest);
  assert.equal(first.value.handoff.digest, second.value.handoff.digest);
  assert.deepEqual(first.value.decisions, second.value.decisions);
});

test("malformed receipts and failure fingerprints fail closed before eligibility", () => {
  const base = reuseInput();
  const malformedReceipt = { ...base.receipts[0], toolchainDigest: "bad" };
  assert.equal(
    failCode(compileProofReusePlan({ ...base, receipts: [malformedReceipt, ...base.receipts.slice(1)] }, options)),
    "PROOF_REUSE_INPUT_INVALID",
  );
  assert.equal(
    failCode(compileProofReusePlan({
      ...base,
      currentFailures: [{ testId: "test:a", fingerprint: "bad" }],
    }, options)),
    "PROOF_REUSE_INPUT_INVALID",
  );
});


test("WO-006 plan mix-and-match or digest tamper is rejected before reuse", () => {
  const base = reuseInput();

  const mixedPlatform = {
    ...base.validation,
    bindings: { ...base.validation.bindings, platform: "windows" },
  };
  assert.equal(
    failCode(compileProofReusePlan({ ...base, validation: mixedPlatform }, options)),
    "INCREMENTAL_PLAN_INTEGRITY_INVALID",
  );

  const wrongTopLevel = compileProofReusePlan({ ...base, platform: "windows" }, options);
  assert.equal(failCode(wrongTopLevel), "PROOF_REUSE_VALIDATION_PLAN_MISMATCH");

  const tamperedDigest = { ...base.validation, digest: H("tampered-plan") };
  assert.equal(
    failCode(compileProofReusePlan({ ...base, validation: tamperedDigest }, options)),
    "INCREMENTAL_PLAN_INTEGRITY_INVALID",
  );
});
