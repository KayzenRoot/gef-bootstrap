import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  compileMarathon, compileMarathonFromExecutionPack, executeMarathonStep, initialMarathonState, advanceMarathon,
  recoverMarathonWithCanonicalContinuity,
} from '../packages/execution-pack-compiler/dist/public.js';
import {
  createCanonicalContinuationCapsule, verifyCanonicalContinuationCapsule,
  buildCheckpointFreshnessVector, buildCheckpointPortabilityEnvelope,
  buildResumeReadinessCertificate, buildContinuationHandoffContract,
} from '../packages/checkpoint-engine/dist/public.js';
import {
  createResumeIntentCapsule, proveLineageContinuity, enforceResumeAuthorityBoundary,
  applyConversationIndependence, buildResumeMinimumSufficientContext, rehydrateHotState,
  buildContextTemperatureMap, buildResumeReadPlan, buildResumeDriftVector,
  detectOrphanWork, buildResumeConflictQuarantine, evaluateSafeReentry,
  buildResumeReceipt, verifyResumeReceipt, verifyContinuationHandoff,
} from '../packages/resume-engine/dist/public.js';


import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createTaskIntentEnvelope, createAuthorityBoundContextUnit,
  buildSemanticCoverageLattice, computeContextDependencyClosure,
  buildContextDeficitVector, buildMinimumContextWitness,
  buildContextSufficiencyProof, buildTaskContextCapsule,
  computeSelectiveContextInvalidationGraph, buildExecutionHandoffContract,
} from '../packages/task-context-compiler/dist/public.js';
import { compileExecutionPack } from '../packages/execution-pack-compiler/dist/public.js';
import { captureMarathonTelemetry, verifyPerformanceRecord } from '../packages/m62-m63-final/src/index.mjs';

const digest = text => createHash('sha256').update(text).digest('hex');
const H = s => 'sha256:' + digest(s);
const options = { digest: { algorithm: 'sha256', digest } };
const binding = { baseSha: 'a'.repeat(40), lockDigest: H('admitted-lock'), actor: 'CHATGPT_OWNER' };
const policyBinding = { checkpointIdentity: 'prev', policyFingerprint: H('a'),
  decisionReceiptDigest: H('b'), exceptionDebtDigest: H('c'),
  policyIds: ['p'], bindingDigest: H('d') };
const unwrap = result => {
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
};
function plan() {
  return unwrap(compileMarathon({
    workOrderId: 'GBS-V12-WO-003', ...binding,
    nodes: [{ id: 'step1', deps: [], reads: ['src/input'], writes: ['out/result'] }],
  }, digest));
}
function canonicalChain(p, state, overrides = {}) {
  const bindings = [
    ['marathon-base', H('GEF:MARATHON_BASE\\n' + p.baseSha)],
    ['marathon-lock', p.lockDigest],
    ['marathon-plan', p.planDigest],
    ['marathon-state', state.stateDigest],
  ].map(([bindingId, semanticIdentity]) => ({
    bindingId, semanticIdentity, domain: 'MARATHON',
    authorityRef: 'source:' + bindingId, required: true,
  }));
  const checkpoint = unwrap(createCanonicalContinuationCapsule({
    schemaVersion: 1, projectId: 'gef-bootstrap', moduleId: 'GBS-M17',
    stageId: 'WO003-CONTINUATION', lineageId: 'lineage-wo003',
    predecessorCheckpointDigest: null, admittedWorkOrderIds: [p.workOrderId],
    authorityBindings: bindings, policyBinding, claims: [], blockers: [],
    evidenceRefs: ['wo003:durable-state'], nextLegalAction: 'RECOVER_MARATHON_STATE',
    requiredCapabilities: [],
    ...overrides,
  }, options));
  const identities = Object.fromEntries(checkpoint.authorityBindings.map(b => [b.bindingId, b.semanticIdentity]));
  const freshness = unwrap(buildCheckpointFreshnessVector(checkpoint, identities, options));
  const portability = unwrap(buildCheckpointPortabilityEnvelope(checkpoint, [], options));
  const readiness = unwrap(buildResumeReadinessCertificate(checkpoint, freshness, portability, options));
  const handoff = unwrap(buildContinuationHandoffContract(checkpoint, readiness, options));
  const intent = unwrap(createResumeIntentCapsule({
    resumeId: 'resume-wo003', projectId: checkpoint.projectId,
    expectedLineageId: checkpoint.lineageId,
    expectedCheckpointDigest: checkpoint.checkpointDigest,
    requestedNextAction: null,
  }, options));
  const lineage = unwrap(proveLineageContinuity(intent, checkpoint, handoff, options));
  const authority = unwrap(enforceResumeAuthorityBoundary(intent, checkpoint, handoff, options));
  const refs = [{ refId: 'checkpoint', dependencyKeys: ['checkpoint'], mandatory: true,
    preferredTemperature: 'HOT' }];
  const context = unwrap(buildResumeMinimumSufficientContext(checkpoint, handoff, refs, options));
  const hot = unwrap(rehydrateHotState([], handoff.handoffDigest, options));
  const temperature = unwrap(buildContextTemperatureMap(refs, {}, options));
  const readPlan = unwrap(buildResumeReadPlan(context, hot, temperature, options));
  const drift = unwrap(buildResumeDriftVector(checkpoint, {
    projectId: checkpoint.projectId, lineageId: checkpoint.lineageId,
    checkpointDigest: checkpoint.checkpointDigest,
    policyBindingDigest: checkpoint.policyBinding.bindingDigest,
    authorityIdentities: identities, claimStates: {},
  }, options));
  const orphans = unwrap(detectOrphanWork(checkpoint, [], options));
  const conversation = unwrap(applyConversationIndependence([], {}, options));
  const quarantine = unwrap(buildResumeConflictQuarantine(drift, orphans, conversation, options));
  const decision = unwrap(evaluateSafeReentry(
    checkpoint, lineage, authority, readiness, drift, readPlan, orphans, options));
  assert.equal(decision.status, 'READY', JSON.stringify(decision));
  const resumeReceipt = unwrap(buildResumeReceipt(
    intent, checkpoint, handoff, decision, readPlan, drift, orphans, quarantine, options));
  const witness = { checkpoint, readiness, handoff, resumeReceipt };
  const verifier = {
    async verifyCheckpoint(cp) { return verifyCanonicalContinuationCapsule(cp, options).ok; },
    async verifyReadiness(cp, rd) {
      const fresh = buildCheckpointFreshnessVector(cp, identities, options);
      if (!fresh.ok) return false;
      const portable = buildCheckpointPortabilityEnvelope(cp, [], options);
      if (!portable.ok) return false;
      const rebuilt = buildResumeReadinessCertificate(cp, fresh.value, portable.value, options);
      return rebuilt.ok && rebuilt.value.certificateDigest === rd.certificateDigest &&
        rebuilt.value.ready && rebuilt.value.validity === 'VALID';
    },
    async verifyHandoff(ho) { return verifyContinuationHandoff(ho, options).ok; },
    async verifyResumeReceipt(re) { return verifyResumeReceipt(re, options).ok; },
  };
  return { witness, verifier };
}
function storeWith(initial) {
  let state = initial;
  return { async read() { return state; },
    async compareAndSwap(_key, before, next) {
      if (state.stateDigest !== before) return false;
      state = next; return true;
    },
    set(next) { state = next; },
  };
}
const reject = (result, code) => {
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.equal(result.code, code);
};


function compileNativeM14M15() {
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


  return compilePack().compiled;
}
function realPlan() {
  const compiled = compileNativeM14M15();
  return unwrap(compileMarathonFromExecutionPack(
    compiled, { workOrderId: 'GBS-V12-WO-003', ...binding }, digest));
}
function telemetryInput(p) {
  const hex = x => createHash('sha256').update(x).digest('hex');
  const metrics = {
    'M-LAT-01': { unit: 'ms', source: 'UNAVAILABLE', value: null },
    'M-TOK-03': { unit: 'tokens', source: 'UNAVAILABLE', value: null },
  };
  return {
    recordId: 'native-marathon-chain',
    executionMode: 'CLI',
    population: {
      P1: { workloadKind: 'VALIDATION_SELECTION' },
      P2: { workloadInstanceId: 'wo003-native-m14-m18', fixtureId: 'exact-graph',
        fixtureDigest: hex('fixture') },
      P3: { commitSha: p.baseSha, treeFingerprint: hex('tree') },
      P4: { node: '22.11.0', npm: '10.9.0', packageManager: 'npm', typescript: '6.0.3' },
      P5: { os: 'linux', osVersion: 'ubuntu-24.04', architecture: 'x64' },
      P6: { policyDigest: hex('policy'), ladder: 'L5', finalSweepRequired: true },
      P7: { posture: 'COLD', reuseSetDigest: 'none' },
      P8: { timedRegion: 'work-order-complete', startEvent: 'executor-start',
        endEvent: 'accepted-handoff' },
    },
    requiredMetricIds: ['M-LAT-01', 'M-TOK-03'],
    metrics, qualityGate: { status: 'PASS', digest: hex('quality') },
  };
}


test('REAL M14/M15 pack compiles Marathon; M17/M18 resume, provider receipt and M63 telemetry stay exact-bound', async t => {
  const p = realPlan();
  assert.deepEqual(p.waves, [['a']]);
  const start = unwrap(initialMarathonState(p, digest));
  const store = storeWith(start);
  const first = canonicalChain(p, start);
  const ready = unwrap(await recoverMarathonWithCanonicalContinuity(
    p, store, binding, digest, first.witness, first.verifier));
  assert.deepEqual(ready.recovery.readyNodeIds, ['a']);
  assert.equal(ready.privilegeGranted, false);

  const dir = await mkdtemp(join(tmpdir(), 'gef-native-marathon-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const marker = join(dir, 'applied');
  let issued = 0;
  const provider = {
    async execute(input) {
      assert.equal((await store.read()).steps.a.status, 'ACTIVE');
      issued += 1;
      await writeFile(marker, input.intentId, { flag: 'wx' });
      return { outcome: 'VERIFIED', proofDigest: H('external-provider-proof') };
    },
  };
  const authority = {
    async verify(plan, previous, action) {
      return plan.planDigest === p.planDigest &&
        previous.steps.a.status === 'ACTIVE' &&
        action.intentId === 'native-single-intent' &&
        action.outcome === 'VERIFIED' &&
        action.proofDigest === H('external-provider-proof');
    },
  };
  const done = unwrap(await executeMarathonStep(p, store, 'a',
    'native-single-intent', binding, digest, { provider, proofAuthority: authority }));
  assert.equal(done.steps.a.status, 'VERIFIED');
  assert.equal(await readFile(marker, 'utf8'), 'native-single-intent');
  assert.equal(issued, 1);

  // M17/M18 accepts the new state only with a reissued exact-state witness.
  reject(await recoverMarathonWithCanonicalContinuity(
    p, store, binding, digest, first.witness, first.verifier),
    'CONTINUITY_M17_AUTHORITY_DRIFT');
  const second = canonicalChain(p, done);
  const resumed = unwrap(await recoverMarathonWithCanonicalContinuity(
    p, store, binding, digest, second.witness, second.verifier));
  assert.equal(resumed.recovery.status, 'READY');
  assert.deepEqual(resumed.recovery.readyNodeIds, []);
  assert.equal(resumed.privilegeGranted, false);
  reject(await executeMarathonStep(p, store, 'a', 'native-retry',
    binding, digest, { provider, proofAuthority: authority }), 'STEP_NOT_DURABLY_READY');
  assert.equal(issued, 1);

  const telem = captureMarathonTelemetry({
    plan: p, state: done, recordInput: telemetryInput(p),
  });
  assert.equal(telem.state, 'CAPTURED', JSON.stringify(telem));
  assert.equal(verifyPerformanceRecord(telem.record), true);
  assert.equal(telem.lineage.stateDigest, done.stateDigest);
  assert.equal(telem.optimizationClaimEligible, false);
  assert.equal(telem.record.metrics['M-LAT-01'].source, 'UNAVAILABLE');
});

test('REAL M14/M15 graph refuses drift in continuity and never duplicates uncertain provider mutation', async () => {
  const p = realPlan();
  const state = unwrap(initialMarathonState(p, digest));
  const store = storeWith(state);
  const badBinding = { ...binding, lockDigest: H('changed-lock') };
  const c = canonicalChain(p, state);
  reject(await recoverMarathonWithCanonicalContinuity(
    p, store, badBinding, digest, c.witness, c.verifier),
    'CONTINUITY_SOURCE_OR_ACTOR_DRIFT');

  let effects = 0;
  const provider = { async execute() {
    effects += 1;
    throw Error('provider may have committed mutation before timeout');
  } };
  const authority = { async verify() { return true; } };
  reject(await executeMarathonStep(p, store, 'a',
    'ambiguous-native-intent', binding, digest, { provider, proofAuthority: authority }),
    'PROVIDER_OUTCOME_UNKNOWN_RECONCILE');
  const updated = await store.read();
  assert.equal(updated.steps.a.status, 'ACTIVE');
  const active = canonicalChain(p, updated);
  const resumed = unwrap(await recoverMarathonWithCanonicalContinuity(
    p, store, binding, digest, active.witness, active.verifier));
  assert.equal(resumed.recovery.status, 'RECONCILIATION_REQUIRED');
  assert.deepEqual(resumed.recovery.unresolvedIntentIds, ['ambiguous-native-intent']);
  reject(await executeMarathonStep(p, store, 'a',
    'another-native-intent', binding, digest, { provider, proofAuthority: authority }),
    'STEP_NOT_DURABLY_READY');
  assert.equal(effects, 1);
});
