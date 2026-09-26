import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createTaskIntentEnvelope,
  createAuthorityBoundContextUnit,
  buildSemanticCoverageLattice,
  computeContextDependencyClosure,
  buildContextDeficitVector,
  buildMinimumContextWitness,
  buildContextSufficiencyProof,
  buildTaskContextCapsule,
  computeSelectiveContextInvalidationGraph,
  buildExecutionHandoffContract,
} from "../packages/task-context-compiler/dist/public.js";

import {
  compileExecutionPack,
  compileExecutionCapsule,
  serializeExecutionCapsuleCanonical,
  verifyExecutionCapsuleFingerprint,
  validateExecutionCapsuleContract,
} from "../packages/execution-pack-compiler/dist/public.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sha = value => createHash("sha256").update(value).digest("hex");
const digest = { algorithm: "sha256", digest: sha };
const opts = { digest };
const PROFILE_DIGEST = `sha256:${sha("profile")}`;

function admittedContext(validity = "VALID") {
  const tie = createTaskIntentEnvelope({
    taskId: "task-wo005-01",
    taskClass: "CONTROLLED_MUTATION",
    riskClass: "ELEVATED",
    objectiveSummary: "Compile V1.1 Execution Capsule",
    targetDomains: ["EXECUTION"],
    requiredCapabilities: ["READ_CONTEXT", "WRITE_SOURCES"],
    projectId: "proj-gef",
    sourcePackIdentity: "sp-wo005",
    profileIdentity: "node-typescript",
    profileDigest: PROFILE_DIGEST,
    policyVersion: "1.1.0",
    checkpointIdentity: "chk-wo005",
  }, opts).value;

  const unit = createAuthorityBoundContextUnit({
    unitId: "u-execution",
    domain: "EXECUTION",
    role: "NORMATIVE",
    applicability: "ACTIVE",
    authorityRef: "auth-execution",
    sourceFingerprint: "fp-u-execution",
    projectId: tie.projectId,
    sourcePackIdentity: tie.sourcePackIdentity,
    profileIdentity: tie.profileIdentity,
    profileDigest: tie.profileDigest,
    policyVersion: tie.policyVersion,
    checkpointIdentity: tie.checkpointIdentity,
    semanticPayloadRef: "ref:EXECUTION:u-execution",
    sensitivity: "INTERNAL",
  }, opts).value;

  const obligations = [{ obligationId: "ob-execution", domain: "EXECUTION", requiredRoles: ["NORMATIVE"], mandatory: true }];
  const lattice = buildSemanticCoverageLattice(tie, obligations, [unit], opts).value;
  const closure = computeContextDependencyClosure(
    [unit.unitId],
    new Map([[unit.unitId, { id: unit.unitId, dependencies: [] }]]),
    undefined,
    opts,
  ).value;
  const deficit = buildContextDeficitVector(
    tie,
    lattice,
    closure,
    { unresolvedCount: 0, conflictCount: 0 },
    "ELEVATED",
  );
  const witness = buildMinimumContextWitness(tie, [unit], [unit], lattice, opts).value;
  const proof = buildContextSufficiencyProof({
    tie,
    lattice,
    deficitVector: deficit,
    witness,
    closure,
    validityFingerprints: [unit.sourceFingerprint],
    exclusionJustifications: [],
  }, opts).value;

  const capsule = buildTaskContextCapsule({
    taskIntentEnvelope: tie,
    projectId: tie.projectId,
    sourcePackIdentity: tie.sourcePackIdentity,
    profileIdentity: tie.profileIdentity,
    profileDigest: tie.profileDigest,
    policyVersion: tie.policyVersion,
    checkpointIdentity: tie.checkpointIdentity,
    selectedUnits: [unit],
    authorityProofs: [{
      domain: "EXECUTION",
      sourceId: unit.unitId,
      proofRef: "proof-execution",
      conflictState: "RESOLVED",
    }],
    sufficiencyProof: proof,
    expansionTrace: [],
    exclusions: [],
    validity,
  }, opts).value;

  const invalidation = computeSelectiveContextInvalidationGraph(
    capsule,
    [{ unitId: unit.unitId, fingerprint: unit.sourceFingerprint }],
    proof.dependencyKnowledgeComplete,
    opts,
  ).value;
  const handoff = buildExecutionHandoffContract(capsule, invalidation, opts).value;
  return { capsule, handoff, unit };
}

function compilePack(context = admittedContext()) {
  const requiredCapability = {
    capabilityIdentity: "exec-cap-wo005",
    capabilities: ["READ", "WRITE"],
    tools: ["read", "write"],
    maxParallelism: 2,
    requiredMutationPermissions: ["fs:write:src"],
    forbiddenCapabilities: ["net:egress"],
    unavailableCapabilities: [],
    sandboxAssumptions: ["no-network", "fs-sandbox:repo"],
  };
  const capabilityOffer = {
    capabilityIdentity: "exec-cap-wo005",
    capabilities: ["READ", "WRITE"],
    tools: ["read", "write"],
    mutationPermissions: ["fs:write:src"],
    sandboxCapabilities: ["no-network", "fs-sandbox:repo"],
    maxParallelism: 1,
  };
  const input = {
    packId: "pack-wo005",
    context: { capsule: context.capsule, handoff: context.handoff },
    objective: "Compile deterministic Execution Capsule",
    constraints: ["deterministic-only", "no-discovery"],
    allowedMutations: ["src"],
    forbiddenMutations: ["main"],
    proofObligations: ["capsule-sealed"],
    stopCondition: "STOP_WO005",
    handbackSchema: "handback:v1",
    instructions: [{
      instructionId: "a",
      objective: "Patch source deterministically",
      targetFiles: ["src/a.ts"],
      dependsOn: [],
      mutationDomains: ["src"],
      validationIds: ["val-a"],
      provenanceRefs: ["auth:a"],
      preconditions: ["context-valid"],
      mutationSpec: "patch:src/a.ts",
      evidenceOutputs: ["ev:a"],
      rollbackPlan: "restore-src-a",
    }],
    validations: [{
      validationId: "val-a",
      command: "node --test tests/a.test.mjs",
      scope: "FOCUSED",
      covers: ["a"],
    }],
    requiredCapability,
    capabilityOffer,
    guardrailBindings: [{ nodeId: "a", policyIds: ["policy-a"] }],
    provenanceEntries: [{ instructionId: "a", authorityRefs: ["auth:a"], decisionRefs: [] }],
    reasoningBranches: [{ branchId: "r1", decided: true, canonicalRef: "decision-1" }],
    ambiguities: [],
    cognitionBudget: { maxReads: 8, maxSearches: 2, maxToolCalls: 8, maxAmbiguityBranches: 1 },
    toolBlueprint: [{
      tool: "read",
      purpose: "read bound source",
      afterNodeIds: [],
      inputs: ["src/a.ts"],
      expectedOutputs: ["source-bytes"],
      fallbackPath: "escalate",
    }],
    readOnceEntries: { source: ["src/a.ts"] },
    negativeSearchLedger: [],
    noDiscoveryBoundary: ["product-intent"],
    promptSections: ["MUST: preserve constraints", "MUST: satisfy proof obligations"],
    obligationMarkers: ["MUST:"],
  };
  const result = compileExecutionPack(input, opts);
  assert.equal(result.ok, true, JSON.stringify(result));
  return { context, compiled: result.value };
}

function baseCapsuleInput(overrides = {}) {
  const { context, compiled } = compilePack();
  const base = {
    repository: "KayzenRoot/gef-bootstrap",
    branch: "feat/1.1/wo-005-execution-capsule",
    headSha: "a".repeat(40),
    treeFingerprint: sha("tree"),
    productionBranchTouched: false,
  };
  const workOrder = {
    id: "GBS-V11-WO-005",
    source: ".engineering/work-orders/GBS-V11-WO-005.md",
    scopeDigest: sha("scope"),
    assurance: "ELEVATED",
  };
  return {
    base,
    workOrder,
    context: { capsule: context.capsule, handoff: context.handoff },
    compiledPack: compiled,
    navigation: {
      mustRead: ["ref:EXECUTION:u-execution", ".engineering/work-orders/GBS-V11-WO-005.md"],
      readIfTriggered: [
        { path: "packages/execution-pack-compiler/src/compile.ts", trigger: "compiler-binding-change" },
        { path: "packages/task-context-compiler/src/public.ts", trigger: "context-binding-change" },
      ],
      writeAllowed: [
        "packages/execution-pack-compiler/src/execution-capsule.ts",
        "tests/v11-wo-005-execution-capsule.test.mjs",
      ],
      writeForbidden: [".git", "main"],
    },
    affected: {
      files: [
        { path: "src/a.ts", mode: "EXISTING_FILE_PATCH_INTENT", fingerprint: sha("src/a.ts") },
        { path: "tests/a.test.mjs", mode: "READ_ONLY", fingerprint: sha("tests/a.test.mjs") },
      ],
      symbols: ["compileExecutionCapsule", "serializeExecutionCapsuleCanonical"],
      dependencies: ["M14", "M15"],
      dependencyClosureDigest: sha("dep-closure"),
      dependencyKnowledgeComplete: true,
    },
    constraints: ["no-discovery", "deterministic-only"],
    acceptanceCriteria: [
      { id: "AC-01", criterion: "deterministic output", proofObligation: "repeat compilation equality" },
      { id: "AC-02", criterion: "fail closed", proofObligation: "negative-state tests" },
    ],
    selectedTests: {
      ladderLevel: "L5",
      tests: ["CTX-DET-01", "CTX-DET-02", "CTX-DET-03"],
      escalation: [
        { trigger: "dependency-unknown", escalateTo: "L4" },
        { trigger: "final-candidate", escalateTo: "L5" },
      ],
      finalSweepRequired: true,
    },
    proofReferences: [
      { proofId: "proof-a", state: "REUSABLE", bindsTo: sha("proof-a"), manufacturesProductionCredit: false },
      { proofId: "proof-b", state: "STALE_TEST", bindsTo: sha("proof-b"), manufacturesProductionCredit: false },
    ],
    inputFingerprints: [
      { ref: "architecture", fingerprint: sha("architecture") },
      { ref: "requirements", fingerprint: sha("requirements") },
    ],
    driftClass: "NONE",
    stopCondition: "STOP_WO005",
    openQuestions: [],
    expiresAt: "2030-01-01T00:00:00.000Z",
    volatileMetadata: { host: "host-a", time: 12345 },
    ...overrides,
  };
}

function compile(overrides = {}) {
  const result = compileExecutionCapsule(baseCapsuleInput(overrides), opts);
  return result;
}

function failCode(result) {
  assert.equal(result.ok, false, JSON.stringify(result));
  return result.diagnostics[0]?.code;
}

test("CTX-DET-01: repeat compilation of identical input is byte-identical", () => {
  const input = baseCapsuleInput();
  const first = compileExecutionCapsule(input, opts);
  const second = compileExecutionCapsule(input, opts);
  assert.equal(first.ok, true, JSON.stringify(first));
  assert.equal(second.ok, true, JSON.stringify(second));
  assert.equal(first.value.state, "COMPILED");
  assert.equal(first.value.certainty, "SUFFICIENT");
  assert.equal(first.value.fingerprints.capsuleFingerprint, second.value.fingerprints.capsuleFingerprint);
  assert.equal(serializeExecutionCapsuleCanonical(first.value), serializeExecutionCapsuleCanonical(second.value));
  assert.equal(validateExecutionCapsuleContract(first.value).ok, true);
  const verified = verifyExecutionCapsuleFingerprint(first.value, opts);
  assert.equal(verified.ok, true);
  assert.equal(verified.value, true);
});

test("CTX-DET-02: a semantically meaningful input change changes the fingerprint", () => {
  const first = compile();
  const second = compile({ workOrder: { ...baseCapsuleInput().workOrder, scopeDigest: sha("scope-changed") } });
  assert.equal(first.ok, true, JSON.stringify(first));
  assert.equal(second.ok, true, JSON.stringify(second));
  assert.notEqual(first.value.fingerprints.capsuleFingerprint, second.value.fingerprints.capsuleFingerprint);
  assert.notEqual(first.value.capsuleId, second.value.capsuleId, "different exact bindings require different capsule identities");
});

test("CTX-DET-03: volatile-only metadata and expiry do not change the semantic fingerprint", () => {
  const base = baseCapsuleInput();
  const first = compileExecutionCapsule(base, opts);
  const second = compileExecutionCapsule({
    ...base,
    expiresAt: "2040-02-02T00:00:00.000Z",
    volatileMetadata: { host: "another-host", time: 999999, absolutePath: "/tmp/other" },
  }, opts);
  assert.equal(first.ok, true, JSON.stringify(first));
  assert.equal(second.ok, true, JSON.stringify(second));
  assert.equal(first.value.fingerprints.capsuleFingerprint, second.value.fingerprints.capsuleFingerprint);
  assert.equal(first.value.capsuleId, second.value.capsuleId, "volatile-only changes cannot change capsule identity");
  assert.notEqual(serializeExecutionCapsuleCanonical(first.value), serializeExecutionCapsuleCanonical(second.value));
});

test("CTX-DET-04: insufficient certainty cannot produce COMPILED", () => {
  const base = baseCapsuleInput();
  const result = compileExecutionCapsule({
    ...base,
    affected: { ...base.affected, dependencyKnowledgeComplete: false },
  }, opts);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "INDETERMINATE");
  assert.equal(result.value.certainty, "INSUFFICIENT");
  assert.notEqual(result.value.state, "COMPILED");
});

test("CTX-DET-05: all four capsule states are representable with schema-valid semantics", () => {
  const base = baseCapsuleInput();
  const compiled = compileExecutionCapsule(base, opts);
  const indeterminate = compileExecutionCapsule({
    ...base,
    affected: { ...base.affected, dependencyKnowledgeComplete: false },
  }, opts);
  const stale = compileExecutionCapsule({ ...base, driftClass: "SEED_RECOMPILE_REQUIRED" }, opts);
  const rejected = compileExecutionCapsule({ ...base, driftClass: "CONFLICT" }, opts);
  for (const result of [compiled, indeterminate, stale, rejected]) {
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(validateExecutionCapsuleContract(result.value).ok, true);
  }
  assert.deepEqual(
    [compiled.value.state, indeterminate.value.state, stale.value.state, rejected.value.state],
    ["COMPILED", "INDETERMINATE", "STALE", "REJECTED"],
  );

  const schema = JSON.parse(readFileSync(resolve(ROOT, ".engineering/schemas/execution-capsule.schema.json"), "utf8"));
  assert.equal(schema.$id, "urn:gef:schema:execution-capsule:1");
  assert.deepEqual(schema.properties.state.enum, ["COMPILED", "INDETERMINATE", "STALE", "REJECTED"]);
});

test("CTX-DET-06: drift classes map deterministically to state and action", () => {
  const expected = [
    ["NONE", "COMPILED", "RECOMPILE"],
    ["LOCAL_COMPATIBLE", "COMPILED", "RECOMPILE"],
    ["SEED_RECOMPILE_REQUIRED", "STALE", "RECOMPILE"],
    ["CONTEXT_EXPANSION_REQUIRED", "INDETERMINATE", "EXPAND_CONTEXT"],
    ["CONFLICT", "REJECTED", "HALT"],
  ];
  const base = baseCapsuleInput();
  for (const [driftClass, state, action] of expected) {
    const result = compileExecutionCapsule({ ...base, driftClass }, opts);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.state, state, driftClass);
    assert.equal(result.value.invalidation.onDrift, action, driftClass);
  }
});

test("CTX-DET-07: empty constraints or escalation are rejected", () => {
  const base = baseCapsuleInput();
  assert.equal(failCode(compileExecutionCapsule({ ...base, constraints: [] }, opts)), "CAPSULE_CONSTRAINTS_EMPTY");
  assert.equal(
    failCode(compileExecutionCapsule({
      ...base,
      selectedTests: { ...base.selectedTests, escalation: [] },
    }, opts)),
    "CAPSULE_ESCALATION_EMPTY",
  );
});

test("CTX-DET-08: production-branch mutation intent is structurally rejected", () => {
  const base = baseCapsuleInput();
  assert.equal(
    failCode(compileExecutionCapsule({
      ...base,
      base: { ...base.base, productionBranchTouched: true },
    }, opts)),
    "CAPSULE_PRODUCTION_BRANCH_FORBIDDEN",
  );
  assert.equal(
    failCode(compileExecutionCapsule({
      ...base,
      base: { ...base.base, branch: "main" },
    }, opts)),
    "CAPSULE_PRODUCTION_BRANCH_FORBIDDEN",
  );
});

test("unordered-set permutations compile to one canonical capsule", () => {
  const base = baseCapsuleInput();
  const first = compileExecutionCapsule(base, opts);
  const second = compileExecutionCapsule({
    ...base,
    navigation: {
      mustRead: [...base.navigation.mustRead].reverse(),
      readIfTriggered: [...base.navigation.readIfTriggered].reverse(),
      writeAllowed: [...base.navigation.writeAllowed].reverse(),
      writeForbidden: [...base.navigation.writeForbidden].reverse(),
    },
    affected: {
      ...base.affected,
      files: [...base.affected.files].reverse(),
      symbols: [...base.affected.symbols].reverse(),
      dependencies: [...base.affected.dependencies].reverse(),
    },
    constraints: [...base.constraints].reverse(),
    acceptanceCriteria: [...base.acceptanceCriteria].reverse(),
    selectedTests: {
      ...base.selectedTests,
      tests: [...base.selectedTests.tests].reverse(),
      escalation: [...base.selectedTests.escalation].reverse(),
    },
    proofReferences: [...base.proofReferences].reverse(),
    inputFingerprints: [...base.inputFingerprints].reverse(),
  }, opts);
  assert.equal(first.ok, true, JSON.stringify(first));
  assert.equal(second.ok, true, JSON.stringify(second));
  assert.equal(first.value.fingerprints.capsuleFingerprint, second.value.fingerprints.capsuleFingerprint);
  assert.equal(serializeExecutionCapsuleCanonical(first.value), serializeExecutionCapsuleCanonical(second.value));
});

test("M14 stale or mismatched handoff cannot become COMPILED", () => {
  const base = baseCapsuleInput();
  const stale = compileExecutionCapsule({
    ...base,
    context: {
      capsule: { ...base.context.capsule, validity: "STALE" },
      handoff: base.context.handoff,
    },
  }, opts);
  assert.equal(stale.ok, true, JSON.stringify(stale));
  assert.equal(stale.value.state, "STALE");

  const mismatch = compileExecutionCapsule({
    ...base,
    context: {
      capsule: base.context.capsule,
      handoff: { ...base.context.handoff, capsuleSemanticDigest: `sha256:${"0".repeat(64)}` },
    },
  }, opts);
  assert.equal(mismatch.ok, true, JSON.stringify(mismatch));
  assert.equal(mismatch.value.state, "STALE");
});

test("M15 receipt or sealed-pack mismatch is rejected before projection", () => {
  const base = baseCapsuleInput();
  const badReceipt = compileExecutionCapsule({
    ...base,
    compiledPack: {
      ...base.compiledPack,
      receipt: {
        ...base.compiledPack.receipt,
        semanticDigest: `sha256:${"f".repeat(64)}`,
      },
    },
  }, opts);
  assert.equal(failCode(badReceipt), "CAPSULE_M15_SEAL_INVALID");

  const badReceiptBinding = compileExecutionCapsule({
    ...base,
    compiledPack: {
      ...base.compiledPack,
      receipt: {
        ...base.compiledPack.receipt,
        policyVersion: "9.9.9",
      },
    },
  }, opts);
  assert.equal(failCode(badReceiptBinding), "CAPSULE_M15_SEAL_INVALID");

  const badPack = compileExecutionCapsule({
    ...base,
    compiledPack: {
      ...base.compiledPack,
      pack: {
        ...base.compiledPack.pack,
        objective: "tampered objective that was never sealed",
      },
    },
  }, opts);
  assert.equal(failCode(badPack), "CAPSULE_M15_SEAL_INVALID");
});
test("write-allowed and write-forbidden intersection rejects the capsule", () => {
  const base = baseCapsuleInput();
  const result = compileExecutionCapsule({
    ...base,
    navigation: {
      ...base.navigation,
      writeAllowed: ["same/path.ts"],
      writeForbidden: ["same/path.ts"],
    },
  }, opts);
  assert.equal(failCode(result), "CAPSULE_WRITE_SET_CONFLICT");
});

test("proof references can never manufacture production credit", () => {
  const base = baseCapsuleInput();
  const rejected = compileExecutionCapsule({
    ...base,
    proofReferences: [{ proofId: "bad", state: "REUSABLE", bindsTo: sha("bad"), manufacturesProductionCredit: true }],
  }, opts);
  assert.equal(failCode(rejected), "CAPSULE_PRODUCTION_CREDIT_FORBIDDEN");

  const valid = compileExecutionCapsule(base, opts);
  assert.equal(valid.ok, true, JSON.stringify(valid));
  assert.ok(valid.value.proofReferences.every(proof => proof.manufacturesProductionCredit === false));
});

test("L5 cannot disable the final exact-head sweep", () => {
  const base = baseCapsuleInput();
  const result = compileExecutionCapsule({
    ...base,
    selectedTests: { ...base.selectedTests, finalSweepRequired: false },
  }, opts);
  assert.equal(failCode(result), "CAPSULE_FINAL_SWEEP_REQUIRED");
});

test("open unresolved questions degrade to INDETERMINATE rather than invented certainty", () => {
  const base = baseCapsuleInput();
  const result = compileExecutionCapsule({ ...base, openQuestions: ["Which dependency owns X?"] }, opts);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "INDETERMINATE");
  assert.equal(result.value.certainty, "INSUFFICIENT");
});

test("affected-file projection must cover every M15 instruction target", () => {
  const base = baseCapsuleInput();
  const result = compileExecutionCapsule({
    ...base,
    affected: { ...base.affected, files: [{ path: "tests/a.test.mjs", mode: "READ_ONLY", fingerprint: sha("tests/a.test.mjs") }] },
  }, opts);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "REJECTED");
});

test("navigation MUST_READ must cover every admitted M14 semantic payload", () => {
  const base = baseCapsuleInput();
  const result = compileExecutionCapsule({
    ...base,
    navigation: { ...base.navigation, mustRead: [".engineering/work-orders/GBS-V11-WO-005.md"] },
  }, opts);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.state, "REJECTED");
});


test("runtime contract validator rejects undeclared properties and malformed nested schema state", () => {
  const compiled = compile();
  assert.equal(compiled.ok, true, JSON.stringify(compiled));

  const extraTopLevel = { ...compiled.value, surprise: true };
  assert.equal(failCode(validateExecutionCapsuleContract(extraTopLevel)), "CAPSULE_SCHEMA_INVALID");

  const badProofState = {
    ...compiled.value,
    proofReferences: compiled.value.proofReferences.map((proof, index) =>
      index === 0 ? { ...proof, state: "NOT_A_STATE" } : proof
    ),
  };
  assert.equal(failCode(validateExecutionCapsuleContract(badProofState)), "CAPSULE_SCHEMA_INVALID");

  const extraNested = {
    ...compiled.value,
    navigation: { ...compiled.value.navigation, surprise: "nope" },
  };
  assert.equal(failCode(validateExecutionCapsuleContract(extraNested)), "CAPSULE_SCHEMA_INVALID");

  const badFingerprint = {
    ...compiled.value,
    fingerprints: {
      ...compiled.value.fingerprints,
      inputs: [{ ref: "x", fingerprint: "not-a-sha" }],
    },
  };
  assert.equal(failCode(validateExecutionCapsuleContract(badFingerprint)), "CAPSULE_SCHEMA_INVALID");
});

test("capsule identity changes for semantic navigation/test/proof changes but not volatile metadata", () => {
  const base = baseCapsuleInput();
  const original = compileExecutionCapsule(base, opts);
  assert.equal(original.ok, true, JSON.stringify(original));

  const navChanged = compileExecutionCapsule({
    ...base,
    navigation: {
      ...base.navigation,
      readIfTriggered: [
        ...base.navigation.readIfTriggered,
        { path: "packages/execution-pack-compiler/src/types.ts", trigger: "type-surface-change" },
      ],
    },
  }, opts);
  assert.equal(navChanged.ok, true, JSON.stringify(navChanged));
  assert.notEqual(navChanged.value.capsuleId, original.value.capsuleId);

  const testsChanged = compileExecutionCapsule({
    ...base,
    selectedTests: {
      ...base.selectedTests,
      tests: [...base.selectedTests.tests, "CTX-DET-08"],
    },
  }, opts);
  assert.equal(testsChanged.ok, true, JSON.stringify(testsChanged));
  assert.notEqual(testsChanged.value.capsuleId, original.value.capsuleId);

  const proofChanged = compileExecutionCapsule({
    ...base,
    proofReferences: [
      ...base.proofReferences,
      { proofId: "proof-c", state: "INDETERMINATE", bindsTo: sha("proof-c"), manufacturesProductionCredit: false },
    ],
  }, opts);
  assert.equal(proofChanged.ok, true, JSON.stringify(proofChanged));
  assert.notEqual(proofChanged.value.capsuleId, original.value.capsuleId);

  const volatileChanged = compileExecutionCapsule({
    ...base,
    expiresAt: "2050-05-05T00:00:00.000Z",
    volatileMetadata: { host: "volatile-host", time: 42 },
  }, opts);
  assert.equal(volatileChanged.ok, true, JSON.stringify(volatileChanged));
  assert.equal(volatileChanged.value.capsuleId, original.value.capsuleId);
});


test("runtime validator enforces raw lowercase SHA-256 output exactly as the frozen schema", () => {
  const compiled = compile();
  assert.equal(compiled.ok, true, JSON.stringify(compiled));

  const prefixedTree = {
    ...compiled.value,
    base: {
      ...compiled.value.base,
      treeFingerprint: `sha256:${compiled.value.base.treeFingerprint}`,
    },
  };
  assert.equal(failCode(validateExecutionCapsuleContract(prefixedTree)), "CAPSULE_SCHEMA_INVALID");

  const uppercaseProof = {
    ...compiled.value,
    proofReferences: compiled.value.proofReferences.map((proof, index) =>
      index === 0 ? { ...proof, bindsTo: proof.bindsTo.toUpperCase() } : proof
    ),
  };
  assert.equal(failCode(validateExecutionCapsuleContract(uppercaseProof)), "CAPSULE_SCHEMA_INVALID");
});

test("derived capsule identity includes resulting state/certainty", () => {
  const base = baseCapsuleInput();
  const compiled = compileExecutionCapsule(base, opts);
  const indeterminate = compileExecutionCapsule({
    ...base,
    affected: { ...base.affected, dependencyKnowledgeComplete: false },
  }, opts);
  assert.equal(compiled.ok, true, JSON.stringify(compiled));
  assert.equal(indeterminate.ok, true, JSON.stringify(indeterminate));
  assert.equal(compiled.value.state, "COMPILED");
  assert.equal(indeterminate.value.state, "INDETERMINATE");
  assert.notEqual(compiled.value.capsuleId, indeterminate.value.capsuleId);
});
