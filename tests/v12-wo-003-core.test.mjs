import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  compileMarathon, initialMarathonState, readyMarathonNodes, advanceMarathon, validateMarathonState,
  compileMarathonFromExecutionPack,
} from '../packages/execution-pack-compiler/dist/v12-marathon.js';
import {
  initializeDeltaLedger, addDeltaAttempt, evaluateDeltaAssurance, validateDeltaLedger,
  initializeDeltaLedgerFromBugProof,
} from '../packages/heds-delta-review/dist/v12-delta-assurance.js';

import { initializePersistedMarathon, recoverPersistedMarathon, persistMarathonTransition } from '../packages/execution-pack-compiler/dist/v12-marathon-persistence.js';

import { executeMarathonStep, reconcileMarathonStep } from '../packages/execution-pack-compiler/dist/v12-marathon-runner.js';

import { assessDeltaRootCause } from '../packages/heds-delta-review/dist/v12-delta-root-cause.js';

import { initializeDurableDeltaLedger, recordVerifiedDeltaAttempt } from '../packages/heds-delta-review/dist/v12-delta-ledger-persistence.js';

import { describeMarathonNextActions } from '../packages/execution-pack-compiler/dist/v12-marathon-operator.js';

const digest = input => createHash('sha256').update(input).digest('hex');
const H = s => `sha256:${digest(s)}`;
const BASE = 'a'.repeat(40), OTHER = 'b'.repeat(40), LOCK = H('lock');
const unwrap = result => { assert.equal(result.ok, true, JSON.stringify(result)); return result.value; };
const reject = (result, code) => assert.deepEqual(result, { ok: false, code });
const fixture = () => unwrap(compileMarathon({
  workOrderId: 'GBS-V12-WO-003', actor: 'CHATGPT_OWNER', baseSha: BASE, lockDigest: LOCK,
  nodes: [
    { id: 'build', deps: ['source'], reads: ['src/x'], writes: ['out/build'] },
    { id: 'source', deps: [], reads: ['src'], writes: ['out/source'] },
    { id: 'audit', deps: [], reads: ['src/y'], writes: ['out/audit'] },
    { id: 'release', deps: ['build', 'audit'], reads: ['out/build', 'out/audit'], writes: ['out/release'] },
  ],
}, digest));
const bindings = { baseSha: BASE, lockDigest: LOCK, actor: 'CHATGPT_OWNER' };

test('Marathon plans deterministic waves and blocks unknown/cyclic/colliding nodes', () => {
  const p = fixture();
  assert.deepEqual(p.waves, [['audit', 'source'], ['build'], ['release']]);
  const shuffle = unwrap(compileMarathon({ ...p, nodes: [...p.nodes].reverse() }, digest));
  assert.equal(p.planDigest, shuffle.planDigest);
  reject(compileMarathon({ ...p, nodes: [{ id: 'a', deps: ['missing'], reads: [], writes: [] }] }, digest), 'UNKNOWN_DEPENDENCY');
  reject(compileMarathon({ ...p, nodes: [{ id: 'a', deps: ['b'], reads: [], writes: [] }, { id: 'b', deps: ['a'], reads: [], writes: [] }] }, digest), 'DEPENDENCY_CYCLE');
  reject(compileMarathon({ ...p, nodes: [{ id: 'a', deps: [], reads: [], writes: ['dir'] }, { id: 'b', deps: [], reads: ['dir/file'], writes: [] }] }, digest), 'CONCURRENT_WRITE_CONFLICT');
  reject(compileMarathon({ ...p, nodes: [{ id: 'a', deps: [], reads: [], writes: ['../escape'] }] }, digest), 'INVALID_NODE');
});

test('Marathon starts only admitted dependency-ready nodes and seals retries', () => {
  const p = fixture();
  let s = unwrap(initialMarathonState(p, digest));
  assert.deepEqual(unwrap(readyMarathonNodes(p, s, digest)), ['audit', 'source']);
  reject(advanceMarathon(p, s, { type: 'START', nodeId: 'build', intentId: 'i-build' }, bindings, digest), 'DEPENDENCY_NOT_VERIFIED');
  s = unwrap(advanceMarathon(p, s, { type: 'START', nodeId: 'source', intentId: 'i-source' }, bindings, digest));
  reject(advanceMarathon(p, s, { type: 'START', nodeId: 'source', intentId: 'i-source' }, bindings, digest), 'EFFECT_UNCERTAIN_RECONCILE');
  reject(advanceMarathon(p, s, { type: 'SETTLE', nodeId: 'source', intentId: 'bad', outcome: 'VERIFIED', proofDigest: H('proof') }, bindings, digest), 'UNBOUND_PROOF_OR_REPLAY');
  s = unwrap(advanceMarathon(p, s, { type: 'SETTLE', nodeId: 'source', intentId: 'i-source', outcome: 'VERIFIED', proofDigest: H('proof') }, bindings, digest));
  const replay = unwrap(advanceMarathon(p, s, { type: 'SETTLE', nodeId: 'source', intentId: 'i-source', outcome: 'VERIFIED', proofDigest: H('proof') }, bindings, digest));
  assert.equal(replay.stateDigest, s.stateDigest);
  reject(advanceMarathon(p, s, { type: 'START', nodeId: 'source', intentId: 'new' }, bindings, digest), 'NOT_PENDING');
  s = unwrap(advanceMarathon(p, s, { type: 'PAUSE' }, bindings, digest));
  reject(advanceMarathon(p, s, { type: 'START', nodeId: 'audit', intentId: 'i-audit' }, bindings, digest), 'PAUSED');
  s = unwrap(advanceMarathon(p, s, { type: 'RESUME' }, bindings, digest));
  assert.deepEqual(unwrap(readyMarathonNodes(p, s, digest)), ['audit', 'build']);
  reject(advanceMarathon(p, s, { type: 'START', nodeId: 'audit', intentId: 'i-audit' }, { ...bindings, lockDigest: H('changed') }, digest), 'STALE_OR_WRONG_ACTOR');
  reject(advanceMarathon(p, s, { type: 'START', nodeId: 'audit', intentId: 'i-audit' }, { ...bindings, actor: 'OTHER' }, digest), 'STALE_OR_WRONG_ACTOR');
  reject(validateMarathonState(p, { ...s, paused: true }, digest), 'STATE_TAMPERED');
});

test('Marathon failure invalidates only descendants; unrelated nodes still progress', () => {
  const p = fixture();
  let s = unwrap(initialMarathonState(p, digest));
  s = unwrap(advanceMarathon(p, s, { type: 'START', nodeId: 'source', intentId: 'i-source' }, bindings, digest));
  s = unwrap(advanceMarathon(p, s, { type: 'SETTLE', nodeId: 'source', intentId: 'i-source', outcome: 'FAILED', proofDigest: H('failed') }, bindings, digest));
  assert.equal(s.steps.build.status, 'BLOCKED');
  assert.equal(s.steps.release.status, 'BLOCKED');
  assert.equal(s.steps.audit.status, 'PENDING');
  assert.deepEqual(unwrap(readyMarathonNodes(p, s, digest)), ['audit']);
});

const attempt = (id, observation, change = {}) => ({
  testId: 'tests:unit', attemptId: id, headSha: BASE, toolchainDigest: H('node22'), inputDigest: H('same'),
  evidenceDigest: H(id), observation, failureSignature: observation === 'FAIL' ? 'assertion:x' : null, ...change,
});

test('Delta Assurance retains original failure even when passing on retry', () => {
  let l = unwrap(initializeDeltaLedger('GBS-V12-WO-003', BASE, ['tests:unit', 'tests:security'], digest));
  l = unwrap(addDeltaAttempt(l, attempt('a1', 'FAIL'), digest));
  const first = l.records[0].firstFailure;
  l = unwrap(addDeltaAttempt(l, attempt('a2', 'PASS'), digest));
  assert.equal(l.records[0].classification, 'FLAKE_CANDIDATE');
  l = unwrap(addDeltaAttempt(l, attempt('a3', 'FAIL'), digest));
  assert.equal(l.records[0].classification, 'FLAKE_CONFIRMED');
  assert.deepEqual(l.records[0].firstFailure, first);
  const result = unwrap(evaluateDeltaAssurance(l, BASE, { 'tests:unit': ['src:x'], 'tests:security': ['policy:x'], 'src:x': [], 'policy:x': [] }, [], digest));
  assert.equal(result.state, 'CORRECTION_REQUIRED');
  assert.deepEqual(result.carriedFirstFailures, ['tests:unit']);
  assert.deepEqual(result.requiredFinalTests, ['tests:security', 'tests:unit']);
  assert.deepEqual(result.evidenceReuseAllowed, []);
  reject(addDeltaAttempt(l, attempt('a3', 'PASS'), digest), 'DUPLICATE_ATTEMPT');
  reject(addDeltaAttempt(l, attempt('a4', 'PASS', { headSha: OTHER }), digest), 'ATTEMPT_BINDING_INVALID');
  reject(evaluateDeltaAssurance(l, OTHER, {}, [], digest), 'STALE_HEAD');
  reject(validateDeltaLedger({ ...l, records: [] }, digest), 'LEDGER_TAMPERED');
});

test('Delta Assurance fail-closed on deterministic failure, unknown impact and mandatory final gates', () => {
  let l = unwrap(initializeDeltaLedger('GBS-V12-WO-003', BASE, ['tests:unit', 'tests:security'], digest));
  l = unwrap(addDeltaAttempt(l, attempt('a1', 'FAIL'), digest));
  l = unwrap(addDeltaAttempt(l, attempt('a2', 'FAIL'), digest));
  assert.equal(l.records[0].classification, 'DETERMINISTIC_FAILURE');
  l = unwrap(addDeltaAttempt(l, { ...attempt('s1', 'PASS'), testId: 'tests:security' }, digest));
  const v = unwrap(evaluateDeltaAssurance(l, BASE, { 'tests:unit': ['src:x'], 'tests:security': ['policy:x'], 'src:x': [], 'policy:x': [] }, ['src:x'], digest));
  assert.deepEqual(v.evidenceReuseAllowed, ['tests:security']);
  assert.equal(v.state, 'CORRECTION_REQUIRED');
  let clean = unwrap(initializeDeltaLedger('GBS-V12-WO-003', BASE, ['tests:unit', 'tests:security'], digest));
  clean = unwrap(addDeltaAttempt(clean, attempt('a1', 'PASS'), digest));
  assert.equal(unwrap(evaluateDeltaAssurance(clean, BASE, { 'tests:unit': [] }, [], digest)).state, 'BLOCKED');
  clean = unwrap(addDeltaAttempt(clean, { ...attempt('s1', 'PASS'), testId: 'tests:security' }, digest));
  assert.equal(unwrap(evaluateDeltaAssurance(clean, BASE, { 'tests:unit': ['src:x'] }, [], digest)).state, 'BLOCKED');
  const final = unwrap(evaluateDeltaAssurance(clean, BASE, { 'tests:unit': ['src:x'], 'tests:security': ['policy:x'], 'src:x': [], 'policy:x': [] }, [], digest));
  assert.equal(final.state, 'READY_FOR_FINAL_ASSURANCE');
  assert.equal(final.requiredFinalTests.length, 2); // final tests still mandatory: never declared performed
  assert.equal(final.evidenceReuseAllowed.length, 2);
});

test('Marathon cancellation blocks downstream without reissuing active mutations', () => {
  const p = fixture();
  let s = unwrap(initialMarathonState(p, digest));
  s = unwrap(advanceMarathon(p, s, { type: 'CANCEL', nodeId: 'source' }, bindings, digest));
  assert.equal(s.steps.source.status, 'BLOCKED');
  assert.equal(s.steps.build.status, 'BLOCKED');
  assert.equal(s.steps.release.status, 'BLOCKED');
  assert.equal(s.steps.audit.status, 'PENDING');
  let live = unwrap(initialMarathonState(p, digest));
  live = unwrap(advanceMarathon(p, live, { type: 'START', nodeId: 'source', intentId: 'effect-possible' }, bindings, digest));
  reject(advanceMarathon(p, live, { type: 'CANCEL', nodeId: 'source' }, bindings, digest), 'EFFECT_UNCERTAIN_RECONCILE');
});

test('Marathon checks live resource conflicts even between different waves', () => {
  const p = unwrap(compileMarathon({
    workOrderId: 'WO-A', actor: 'OWNER', baseSha: BASE, lockDigest: LOCK,
    nodes: [
      { id: 'first', deps: [], reads: [], writes: ['out/shared'] },
      { id: 'unrelated', deps: [], reads: [], writes: ['out/separate'] },
      { id: 'later', deps: ['unrelated'], reads: ['out/shared/file'], writes: ['out/new'] },
    ],
  }, digest));
  const binding = { baseSha: BASE, lockDigest: LOCK, actor: 'OWNER' };
  let s = unwrap(initialMarathonState(p, digest));
  s = unwrap(advanceMarathon(p, s, { type: 'START', nodeId: 'first', intentId: 'intent-first' }, binding, digest));
  s = unwrap(advanceMarathon(p, s, { type: 'START', nodeId: 'unrelated', intentId: 'intent-unrelated' }, binding, digest));
  s = unwrap(advanceMarathon(p, s, { type: 'SETTLE', nodeId: 'unrelated', intentId: 'intent-unrelated', outcome: 'VERIFIED', proofDigest: H('proof-unrelated') }, binding, digest));
  reject(advanceMarathon(p, s, { type: 'START', nodeId: 'later', intentId: 'intent-later' }, binding, digest), 'ACTIVE_RESOURCE_CONFLICT');
});

test('Delta Assurance enforces bounded retries and does not drop required security test', () => {
  let l = unwrap(initializeDeltaLedger('GBS-V12-WO-003', BASE, ['tests:security'], digest));
  for (let n = 1; n <= 8; n++) l = unwrap(addDeltaAttempt(l, { ...attempt(`security-${n}`, 'PASS'), testId: 'tests:security' }, digest));
  reject(addDeltaAttempt(l, { ...attempt('security-9', 'PASS'), testId: 'tests:security' }, digest), 'RETRY_BUDGET_EXHAUSTED');
  const v = unwrap(evaluateDeltaAssurance(l, BASE, { 'tests:security': ['security:policy'] }, ['security:policy'], digest));
  assert.equal(v.state, 'READY_FOR_FINAL_ASSURANCE');
  assert.deepEqual(v.evidenceReuseAllowed, []);
  assert.deepEqual(v.requiredFinalTests, ['tests:security']);
});


test('Delta Assurance invalidates transitive proof closure without dropping final gates', () => {
  let ledger = unwrap(initializeDeltaLedger('GBS-V12-WO-003', BASE, ['tests:unit', 'tests:security'], digest));
  ledger = unwrap(addDeltaAttempt(ledger, attempt('good-unit', 'PASS'), digest));
  ledger = unwrap(addDeltaAttempt(ledger, { ...attempt('good-security', 'PASS'), testId: 'tests:security' }, digest));
  const graph = { 'tests:unit': ['proof:a'], 'proof:a': ['source:a'], 'source:a': [], 'tests:security': ['source:policy'], 'source:policy': [] };
  const verdict = unwrap(evaluateDeltaAssurance(ledger, BASE, graph, ['source:a'], digest));
  assert.deepEqual(verdict.evidenceReuseAllowed, ['tests:security']);
  assert.deepEqual(verdict.requiredFinalTests, ['tests:security', 'tests:unit']);
  reject(evaluateDeltaAssurance(ledger, BASE, { ...graph, 'proof:a': ['tests:unit'] }, [], digest), 'DEPENDENCY_GRAPH_CYCLE');
});

test('Marathon rejects recycled intents and fabricated dependency-complete states before seal validation', () => {
  const p = fixture();
  let s = unwrap(initialMarathonState(p, digest));
  s = unwrap(advanceMarathon(p, s, { type: 'START', nodeId: 'source', intentId: 'i-source' }, bindings, digest));
  const duplicated = { ...s, steps: { ...s.steps, audit: { status: 'ACTIVE', intentId: 'i-source', proofDigest: null } } };
  reject(validateMarathonState(p, duplicated, digest), 'STATE_INTENT_REUSED');
  const invented = { ...s, steps: { ...s.steps, build: { status: 'VERIFIED', intentId: 'i-build', proofDigest: H('invented') } } };
  reject(validateMarathonState(p, invented, digest), 'STATE_DEPENDENCY_VIOLATION');
});

test('Delta Assurance rejects missing original failures and forged flake classes in history', () => {
  let l = unwrap(initializeDeltaLedger('GBS-V12-WO-003', BASE, ['tests:unit'], digest));
  l = unwrap(addDeltaAttempt(l, attempt('original', 'FAIL'), digest));
  const erased = { ...l, records: [{ ...l.records[0], firstFailure: null }] };
  reject(validateDeltaLedger(erased, digest), 'LEDGER_FAILURE_HISTORY_INCONSISTENT');
  const forged = { ...l, records: [{ ...l.records[0], classification: 'NO_FAILURE' }] };
  reject(validateDeltaLedger(forged, digest), 'LEDGER_FAILURE_HISTORY_INCONSISTENT');
});

test('Delta Assurance scans every impact branch even after a changed source matches', () => {
  let l = unwrap(initializeDeltaLedger('GBS-V12-WO-003', BASE, ['tests:unit'], digest));
  l = unwrap(addDeltaAttempt(l, attempt('pass', 'PASS'), digest));
  const graph = { 'tests:unit': ['source:changed', 'proof:cycle'], 'proof:cycle': ['tests:unit'] };
  reject(evaluateDeltaAssurance(l, BASE, graph, ['source:changed'], digest), 'DEPENDENCY_GRAPH_CYCLE');
});

test('Delta refuses proof reuse for undeclared transitive leaf', () => {
  let ledger = unwrap(initializeDeltaLedger('GBS-V12-WO-003', BASE, ['tests:unit'], digest));
  ledger = unwrap(addDeltaAttempt(ledger, attempt('verified-pass', 'PASS'), digest));
  const unknown = unwrap(evaluateDeltaAssurance(ledger, BASE,
    { 'tests:unit': ['proof:middle'], 'proof:middle': ['source:unknown'] }, [], digest));
  assert.equal(unknown.state, 'BLOCKED');
  assert.deepEqual(unknown.evidenceReuseAllowed, []);
  const complete = unwrap(evaluateDeltaAssurance(ledger, BASE,
    { 'tests:unit': ['proof:middle'], 'proof:middle': ['source:known'], 'source:known': [] }, [], digest));
  assert.equal(complete.state, 'READY_FOR_FINAL_ASSURANCE');
  assert.deepEqual(complete.evidenceReuseAllowed, ['tests:unit']);
});

test('Marathon rejects conflicting ACTIVE nodes in imported snapshots', () => {
  const p = unwrap(compileMarathon({ workOrderId: 'WO-A', actor: 'OWNER', baseSha: BASE, lockDigest: LOCK,
    nodes: [{ id: 'first', deps: [], reads: [], writes: ['out/shared'] },
            { id: 'unrelated', deps: [], reads: [], writes: ['out/separate'] },
            { id: 'later', deps: ['unrelated'], reads: ['out/shared/file'], writes: ['out/new'] }],
  }, digest));
  const binding = { baseSha: BASE, lockDigest: LOCK, actor: 'OWNER' };
  let state = unwrap(initialMarathonState(p, digest));
  state = unwrap(advanceMarathon(p, state, { type: 'START', nodeId: 'first', intentId: 'first-intent' }, binding, digest));
  state = unwrap(advanceMarathon(p, state, { type: 'START', nodeId: 'unrelated', intentId: 'second-intent' }, binding, digest));
  state = unwrap(advanceMarathon(p, state, { type: 'SETTLE', nodeId: 'unrelated', intentId: 'second-intent',
    outcome: 'VERIFIED', proofDigest: H('unrelated-proof') }, binding, digest));
  const incompatible = { ...state, steps: { ...state.steps, later:
    { status: 'ACTIVE', intentId: 'later-intent', proofDigest: null } } };
  reject(validateMarathonState(p, incompatible, digest), 'STATE_RESOURCE_CONFLICT');
});

test('Marathon admits only source-bound M15 execution-pack receipts and exact safe waves', () => {
  const binding = { workOrderId: 'GBS-V12-WO-003', actor: 'CHATGPT_OWNER', baseSha: BASE, lockDigest: LOCK };
  const node = { instructionId: 'proof', dependsOn: [], targetFiles: ['out/proof'],
    preconditions: ['admitted'], mutationSpec: 'write with proof',
    evidenceOutputs: ['proof:sha'] };
  const pack = { packId: 'pack:1', taskIdentity: 'task:1', contextIdentity: 'context:1',
    contextDigest: H('context'), policyVersion: 'policy:1', capabilityIdentity: 'cap:1',
    semanticDigest: H('semantic'), graphDigest: H('graph'), toolPlanDigest: H('tools'),
    validationPlanDigest: H('validation'), workDag: [node], safeParallelWaves: [['proof']] };
  const receipt = { status: 'VALID', diagnostics: [], semanticDigest: pack.semanticDigest,
    contextDigest: pack.contextDigest, taskIdentity: pack.taskIdentity,
    contextIdentity: pack.contextIdentity, policyVersion: pack.policyVersion,
    capabilityIdentity: pack.capabilityIdentity, graphDigest: pack.graphDigest,
    toolPlanDigest: pack.toolPlanDigest, validationPlanDigest: pack.validationPlanDigest };
  const compiled = { pack, receipt,
    envelope: { packId: pack.packId, taskIdentity: pack.taskIdentity, contextIdentity: pack.contextIdentity },
    certificate: { packId: pack.packId, complete: true, missingItems: [] } };
  const accepted = unwrap(compileMarathonFromExecutionPack(compiled, binding, digest));
  assert.deepEqual(accepted.waves, [['proof']]);
  reject(compileMarathonFromExecutionPack({ ...compiled,
    receipt: { ...receipt, status: 'STALE_CONTEXT' } }, binding, digest), 'EXECUTION_PACK_NOT_ADMITTED');
  reject(compileMarathonFromExecutionPack({ ...compiled,
    receipt: { ...receipt, semanticDigest: H('forged') } }, binding, digest), 'EXECUTION_PACK_NOT_ADMITTED');
  reject(compileMarathonFromExecutionPack({ ...compiled,
    pack: { ...pack, safeParallelWaves: [['wrong']] } }, binding, digest), 'PACK_WAVE_MISMATCH');
});

test('Delta imports M26 final gates but never imports historical proof as a PASS', () => {
  const receipt = { projectId: 'gef', sourceIdentityDigest: H('source'),
    testImpactHandoffDigest: H('handoff'), receiptDigest: H('receipt'),
    testImpactState: 'READY', testImpactUncertainty: 'LOCAL',
    mandatoryTargetIds: ['tests:security'], finalAssuranceTargetIds: ['tests:security', 'tests:release'],
    unresolvedTestIds: [] };
  const ledger = unwrap(initializeDeltaLedgerFromBugProof(receipt, 'GBS-V12-WO-003', BASE, digest));
  assert.deepEqual(ledger.requiredFinalTests, ['tests:release', 'tests:security']);
  assert.deepEqual(ledger.records, []);
  assert.equal(unwrap(evaluateDeltaAssurance(ledger, BASE, {}, [], digest)).state, 'BLOCKED');
  reject(initializeDeltaLedgerFromBugProof({ ...receipt, testImpactState: 'INDETERMINATE' },
    'GBS-V12-WO-003', BASE, digest), 'BUG_PROOF_NOT_READY');
  reject(initializeDeltaLedgerFromBugProof({ ...receipt, unresolvedTestIds: ['tests:missing'] },
    'GBS-V12-WO-003', BASE, digest), 'BUG_PROOF_NOT_READY');
});

test('Marathon rejects undefined identity and null input without implicit coercion', () => {
  reject(compileMarathon({ workOrderId: 'GBS-V12-WO-003', actor: undefined,
    baseSha: BASE, lockDigest: LOCK, nodes: [{ id: 'only', deps: [], reads: [], writes: [] }] }, digest), 'INVALID_BINDING');
  reject(compileMarathon(null, digest), 'INVALID_BINDING');
  reject(compileMarathon({ workOrderId: 'GBS-V12-WO-003', actor: 'OWNER',
    baseSha: BASE, lockDigest: LOCK, nodes: [null] }, digest), 'INVALID_NODE');
});

test('Delta refuses missing IDs and malformed imported input instead of coercing them', () => {
  reject(initializeDeltaLedger('WO', BASE, undefined, digest), 'INVALID_ASSURANCE_INPUT');
  reject(initializeDeltaLedger('WO', BASE, [undefined], digest), 'INVALID_ASSURANCE_INPUT');
  reject(validateDeltaLedger(null, digest), 'LEDGER_STRUCTURE_INVALID');
  let ledger = unwrap(initializeDeltaLedger('WO', BASE, ['tests:unit'], digest));
  reject(addDeltaAttempt(ledger, null, digest), 'ATTEMPT_BINDING_INVALID');
  reject(evaluateDeltaAssurance(ledger, BASE, null, [], digest), 'UNKNOWN_DEPENDENCY');
});

test('Marathon persists intent with CAS before provider activity, replay is a no-op', async () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  let writes = 0;
  const store = {
    async read() { return state; },
    async compareAndSwap(key, prior, next) {
      assert.equal(key, plan.planDigest);
      if (state.stateDigest !== prior) return false;
      writes++; state = next; return true;
    },
  };
  const start = { type: 'START', nodeId: 'source', intentId: 'persisted-intent' };
  const applied = unwrap(await persistMarathonTransition(plan, store, start, bindings, digest));
  assert.equal(writes, 1);
  assert.equal(applied.steps.source.status, 'ACTIVE');
  const recovered = unwrap(await recoverPersistedMarathon(plan, store, bindings, digest));
  assert.equal(recovered.status, 'RECONCILIATION_REQUIRED');
  assert.deepEqual(recovered.unresolvedIntentIds, ['persisted-intent']);
  reject(await persistMarathonTransition(plan, store, start, bindings, digest), 'EFFECT_UNCERTAIN_RECONCILE');
  assert.equal(writes, 1);
  const proved = { type: 'SETTLE', nodeId: 'source', intentId: 'persisted-intent',
    outcome: 'VERIFIED', proofDigest: H('trusted-external-evidence') };
  const authority = { async verify(_plan, prior, action) {
    return prior.steps.source?.status === 'ACTIVE' || (prior.steps.source?.status === 'VERIFIED' &&
      prior.steps.source?.proofDigest === action.proofDigest);
  } };
  reject(await persistMarathonTransition(plan, store, proved, bindings, digest),
    'SETTLEMENT_PROOF_AUTHORITY_REQUIRED');
  unwrap(await persistMarathonTransition(plan, store, proved, bindings, digest, authority));
  assert.equal(writes, 2);
  unwrap(await persistMarathonTransition(plan, store, proved, bindings, digest, authority));
  assert.equal(writes, 2);
});
test('Marathon fail-closed on lost snapshots, CAS conflict and store outage', async () => {
  const plan = fixture();
  const snapshot = unwrap(initialMarathonState(plan, digest));
  const start = { type: 'START', nodeId: 'source', intentId: 'safe-intent' };
  const missing = { async read() { return null; }, async compareAndSwap() { throw Error('not called'); } };
  reject(await recoverPersistedMarathon(plan, missing, bindings, digest),
    'SNAPSHOT_MISSING_REQUIRES_RECONCILIATION');
  reject(await persistMarathonTransition(plan, missing, start, bindings, digest),
    'SNAPSHOT_MISSING_REQUIRES_RECONCILIATION');
  const conflict = { async read() { return snapshot; }, async compareAndSwap() { return false; } };
  reject(await persistMarathonTransition(plan, conflict, start, bindings, digest), 'PERSISTENCE_CAS_CONFLICT');
  const broken = { async read() { throw Error('read failed'); }, async compareAndSwap() { return true; } };
  reject(await persistMarathonTransition(plan, broken, start, bindings, digest), 'PERSISTENCE_UNAVAILABLE');
  reject(await recoverPersistedMarathon(plan, broken, bindings, digest), 'PERSISTENCE_UNAVAILABLE');
  reject(await recoverPersistedMarathon(plan, conflict,
    { ...bindings, lockDigest: H('drift') }, digest), 'RECOVERY_BINDING_INVALID');
});
test('Marathon recovery quarantines in-flight conflicts and preserves independent work', async () => {
  const plan = fixture();
  let snapshot = unwrap(initialMarathonState(plan, digest));
  snapshot = unwrap(advanceMarathon(plan, snapshot, {
    type: 'START', nodeId: 'source', intentId: 'inflight' }, bindings, digest));
  const store = { async read() { return snapshot; } };
  const recovery = unwrap(await recoverPersistedMarathon(plan, store, bindings, digest));
  assert.equal(recovery.status, 'RECONCILIATION_REQUIRED');
  assert.deepEqual(recovery.readyNodeIds, ['audit']);
  assert.deepEqual(recovery.unresolvedIntentIds, ['inflight']);
});

test('Marathon persisted settlement refuses unverified or unavailable proof authority', async () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  state = unwrap(advanceMarathon(plan, state,
    { type: 'START', nodeId: 'source', intentId: 'proof-required' }, bindings, digest));
  let writes = 0;
  const store = {
    async read() { return state; },
    async compareAndSwap() { writes++; return true; },
  };
  const settle = { type: 'SETTLE', nodeId: 'source', intentId: 'proof-required',
    outcome: 'VERIFIED', proofDigest: H('untrusted') };
  reject(await persistMarathonTransition(plan, store, settle, bindings, digest,
    { async verify() { return false; } }), 'SETTLEMENT_PROOF_NOT_VERIFIED');
  reject(await persistMarathonTransition(plan, store, settle, bindings, digest,
    { async verify() { throw Error('provider offline'); } }),
    'SETTLEMENT_PROOF_VERIFICATION_UNAVAILABLE');
  assert.equal(writes, 0);
});

test('Marathon initializes durable snapshot atomically and refuses duplicate starts', async () => {
  const plan = fixture();
  let state = null;
  let creates = 0;
  const store = {
    async read() { return state; },
    async createIfAbsent(key, initial) {
      assert.equal(key, plan.planDigest);
      creates++;
      if (state !== null) return false;
      state = initial;
      return true;
    },
    async compareAndSwap(_key, previous, next) {
      if (!state || state.stateDigest !== previous) return false;
      state = next;
      return true;
    },
  };
  const initialized = unwrap(await initializePersistedMarathon(plan, store, bindings, digest));
  assert.equal(initialized.steps.source.status, 'PENDING');
  assert.equal(creates, 1);
  reject(await initializePersistedMarathon(plan, store, bindings, digest),
    'SNAPSHOT_EXISTS_REQUIRES_RECOVERY');
  assert.equal(creates, 2);
  const recovered = unwrap(await recoverPersistedMarathon(plan, store, bindings, digest));
  assert.equal(recovered.status, 'READY');
  assert.deepEqual(recovered.readyNodeIds, ['audit', 'source']);
});

test('Marathon refuses non-atomic, wrong-owner or failed initial snapshot storage', async () => {
  const plan = fixture();
  const noInit = { async read() { return null; }, async compareAndSwap() { return false; } };
  reject(await initializePersistedMarathon(plan, noInit, bindings, digest),
    'PERSISTENCE_INITIALIZATION_INVALID');
  reject(await initializePersistedMarathon(plan, {
    ...noInit, async createIfAbsent() { return true; },
  }, { ...bindings, lockDigest: H('wrong-lock') }, digest),
  'PERSISTENCE_INITIALIZATION_INVALID');
  reject(await initializePersistedMarathon(plan, {
    ...noInit, async createIfAbsent() { throw Error('disk unavailable'); },
  }, bindings, digest), 'PERSISTENCE_UNAVAILABLE');
});

test('Marathon executes only after durable START and verified external settlement', async () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  const events = [];
  const store = {
    async read() { return state; },
    async compareAndSwap(_key, oldDigest, next) {
      assert.equal(state.stateDigest, oldDigest);
      events.push('persist:' + next.steps.source.status);
      state = next;
      return true;
    },
  };
  const provider = { async execute(input) {
    assert.equal(state.steps.source.status, 'ACTIVE');
    assert.equal(input.persistedStartDigest, state.stateDigest);
    events.push('provider');
    return { outcome: 'VERIFIED', proofDigest: H('trusted-proof') };
  } };
  const verifier = { async verify(_plan, prior, action) {
    assert.equal(prior.steps.source.status, 'ACTIVE');
    assert.equal(action.proofDigest, H('trusted-proof'));
    events.push('verify');
    return true;
  } };
  const done = unwrap(await executeMarathonStep(
    plan, store, 'source', 'one-time-intent', bindings, digest, { provider, proofAuthority: verifier }));
  assert.equal(done.steps.source.status, 'VERIFIED');
  assert.deepEqual(events, ['persist:ACTIVE', 'provider', 'verify', 'persist:VERIFIED']);
  reject(await executeMarathonStep(
    plan, store, 'source', 'second-intent', bindings, digest, { provider, proofAuthority: verifier }),
    'STEP_NOT_DURABLY_READY');
  assert.equal(events.filter(event => event === 'provider').length, 1);
});

test('Marathon never repeats provider on CAS conflict or uncertain outcome', async () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  let called = 0;
  const provider = { async execute() { called++; throw Error('timeout after mutation'); } };
  const verifier = { async verify() { return true; } };
  const conflictStore = {
    async read() { return state; },
    async compareAndSwap() { return false; },
  };
  reject(await executeMarathonStep(
    plan, conflictStore, 'source', 'intent-cas', bindings, digest, { provider, proofAuthority: verifier }),
    'PERSISTENCE_CAS_CONFLICT');
  assert.equal(called, 0);
  const store = {
    async read() { return state; },
    async compareAndSwap(_key, oldDigest, next) {
      assert.equal(state.stateDigest, oldDigest);
      state = next;
      return true;
    },
  };
  reject(await executeMarathonStep(
    plan, store, 'source', 'intent-uncertain', bindings, digest, { provider, proofAuthority: verifier }),
    'PROVIDER_OUTCOME_UNKNOWN_RECONCILE');
  assert.equal(state.steps.source.status, 'ACTIVE');
  reject(await executeMarathonStep(
    plan, store, 'source', 'intent-retry', bindings, digest, { provider, proofAuthority: verifier }),
    'STEP_NOT_DURABLY_READY');
  assert.equal(called, 1);
});

test('Marathon cannot settle an untrusted result even after provider returned', async () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  const store = {
    async read() { return state; },
    async compareAndSwap(_key, previous, next) {
      assert.equal(state.stateDigest, previous);
      state = next;
      return true;
    },
  };
  const provider = { async execute() {
    return { outcome: 'VERIFIED', proofDigest: H('untrusted-result') };
  } };
  const verifier = { async verify() { return false; } };
  reject(await executeMarathonStep(
    plan, store, 'source', 'untrusted-intent', bindings, digest, { provider, proofAuthority: verifier }),
    'SETTLEMENT_PROOF_NOT_VERIFIED');
  assert.equal(state.steps.source.status, 'ACTIVE');
});

test('Marathon recovers an unknown provider result without replaying the mutation', async () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  state = unwrap(advanceMarathon(plan, state,
    { type: 'START', nodeId: 'source', intentId: 'recovery-intent' }, bindings, digest));
  let lookedUp = 0, settled = 0;
  const store = {
    async read() { return state; },
    async compareAndSwap(_key, expected, next) {
      assert.equal(expected, state.stateDigest);
      settled++;
      state = next;
      return true;
    },
  };
  const proof = H('real-provider-receipt');
  const provider = { async lookup(input) {
    lookedUp++;
    assert.equal(input.nodeId, 'source');
    assert.equal(input.intentId, 'recovery-intent');
    return { status: 'VERIFIED', proofDigest: proof };
  } };
  const verifier = { async verify(_plan, prior, action) {
    return prior.steps.source?.status === 'ACTIVE' &&
      action.intentId === 'recovery-intent' && action.proofDigest === proof;
  } };
  const recovered = unwrap(await reconcileMarathonStep(
    plan, store, 'source', bindings, digest, provider, verifier));
  assert.equal(recovered.steps.source.status, 'VERIFIED');
  assert.equal(lookedUp, 1);
  assert.equal(settled, 1);
  reject(await reconcileMarathonStep(
    plan, store, 'source', bindings, digest, provider, verifier),
    'RECONCILIATION_STEP_NOT_ACTIVE');
  assert.equal(lookedUp, 1);
});

test('Marathon reconciliation quarantines missing or unverified provider evidence', async () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  state = unwrap(advanceMarathon(plan, state,
    { type: 'START', nodeId: 'source', intentId: 'uncertain-intent' }, bindings, digest));
  let writes = 0;
  const store = {
    async read() { return state; },
    async compareAndSwap() { writes++; return true; },
  };
  const verifier = { async verify() { return false; } };
  reject(await reconcileMarathonStep(plan, store, 'source', bindings, digest,
    { async lookup() { return { status: 'UNKNOWN' }; } }, verifier),
    'RECONCILIATION_PROOF_PENDING');
  reject(await reconcileMarathonStep(plan, store, 'source', bindings, digest,
    { async lookup() { throw Error('unavailable'); } }, verifier),
    'RECONCILIATION_LOOKUP_UNAVAILABLE');
  reject(await reconcileMarathonStep(plan, store, 'source', bindings, digest,
    { async lookup() { return { status: 'VERIFIED', proofDigest: H('untrusted') }; } }, verifier),
    'SETTLEMENT_PROOF_NOT_VERIFIED');
  assert.equal(writes, 0);
  assert.equal(state.steps.source.status, 'ACTIVE');
});

test('Marathon reconciliation refuses stale source binding and concurrent CAS', async () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  state = unwrap(advanceMarathon(plan, state,
    { type: 'START', nodeId: 'source', intentId: 'original-intent' }, bindings, digest));
  const store = {
    async read() { return state; },
    async compareAndSwap() { return false; },
  };
  let lookups = 0;
  const provider = { async lookup() { lookups++; return { status: 'FAILED', proofDigest: H('failure-proof') }; } };
  const verify = { async verify() { return true; } };
  reject(await reconcileMarathonStep(plan, store, 'source',
    { ...bindings, lockDigest: H('drift') }, digest, provider, verify),
    'RECOVERY_BINDING_INVALID');
  assert.equal(lookups, 0);
  reject(await reconcileMarathonStep(plan, store, 'source', bindings, digest, provider, verify),
    'PERSISTENCE_CAS_CONFLICT');
  assert.equal(lookups, 1);
});

test('Delta rejects null imported records without throwing', () => {
  const empty = unwrap(initializeDeltaLedger('WO-1', BASE, ['tests:unit'], digest));
  reject(validateDeltaLedger({ ...empty, records: [null] }, digest),
    'LEDGER_STRUCTURE_INVALID');
});

test('Marathon adapter rejects missing receipt arrays and malformed M15 waves', () => {
  const binding = { workOrderId: 'WO-1', actor: 'OWNER', baseSha: BASE, lockDigest: LOCK };
  const node = { instructionId: 'one', dependsOn: [], targetFiles: ['out/file'],
    preconditions: ['ok'], mutationSpec: 'write', evidenceOutputs: ['proof'] };
  const pack = { packId: 'pack-1', taskIdentity: 'task-1',
    contextIdentity: 'context-1', semanticDigest: H('sem'), contextDigest: H('ctx'),
    policyVersion: 'v1', capabilityIdentity: 'cap-1', graphDigest: H('graph'),
    toolPlanDigest: H('tool'), validationPlanDigest: H('validation'),
    workDag: [node], safeParallelWaves: [['one']] };
  const receipt = { status: 'VALID', diagnostics: [], semanticDigest: pack.semanticDigest,
    contextDigest: pack.contextDigest, taskIdentity: pack.taskIdentity,
    contextIdentity: pack.contextIdentity, policyVersion: pack.policyVersion,
    capabilityIdentity: pack.capabilityIdentity, graphDigest: pack.graphDigest,
    toolPlanDigest: pack.toolPlanDigest, validationPlanDigest: pack.validationPlanDigest };
  const base = { pack, receipt, envelope: { packId: pack.packId,
    taskIdentity: pack.taskIdentity, contextIdentity: pack.contextIdentity },
    certificate: { packId: pack.packId, complete: true, missingItems: [] } };
  reject(compileMarathonFromExecutionPack({ ...base, receipt: { ...receipt, diagnostics: null } },
    binding, digest), 'EXECUTION_PACK_NOT_ADMITTED');
  reject(compileMarathonFromExecutionPack({ ...base,
    certificate: { ...base.certificate, missingItems: null } },
    binding, digest), 'EXECUTION_PACK_NOT_ADMITTED');
  reject(compileMarathonFromExecutionPack({ ...base, pack: { ...pack, workDag: [null] } },
    binding, digest), 'PACK_NODE_INCOMPLETE');
  reject(compileMarathonFromExecutionPack({ ...base, pack: { ...pack, safeParallelWaves: [null] } },
    binding, digest), 'PACK_NODE_INCOMPLETE');
});

test('Delta links the original failure to a changed source through transitive proof closure', () => {
  let ledger = unwrap(initializeDeltaLedger('WO-003', BASE, ['tests:unit','tests:security'], digest));
  ledger = unwrap(addDeltaAttempt(ledger, attempt('original-failure','FAIL'), digest));
  ledger = unwrap(addDeltaAttempt(ledger, attempt('later-pass','PASS'), digest));
  const h = { testId: 'tests:unit', firstFailureAttemptId: 'original-failure',
    firstFailureEvidenceDigest: H('original-failure'), causeDependencyId: 'source:changed',
    reason: 'Suspected dependency change invalidated the unit proof' };
  const graph = { 'tests:unit':['proof:middle'], 'proof:middle':['source:changed'],
    'source:changed': [] };
  const result = unwrap(assessDeltaRootCause(ledger, h, graph, ['source:changed'], digest));
  assert.equal(result.status, 'HYPOTHESIS_ONLY');
  assert.equal(result.independentRepairProofRequired, true);
  assert.equal(result.firstFailureAttemptId, 'original-failure');
  assert.deepEqual(result.finalTestsRequired, ['tests:security','tests:unit']);
});
test('Delta never promotes hypothesis with wrong first-failure identity or unrelated cause', () => {
  let ledger = unwrap(initializeDeltaLedger('WO-003', BASE, ['tests:unit'], digest));
  ledger = unwrap(addDeltaAttempt(ledger, attempt('failed','FAIL'), digest));
  const h = { testId:'tests:unit', firstFailureAttemptId:'failed',
    firstFailureEvidenceDigest:H('failed'), causeDependencyId:'source:real',
    reason:'Repair suspected' };
  const graph = { 'tests:unit':['source:other'],'source:other':[],'source:real':[] };
  reject(assessDeltaRootCause(ledger,{...h,firstFailureEvidenceDigest:H('forged')},
    graph,['source:real'],digest), 'FIRST_FAILURE_BINDING_MISMATCH');
  reject(assessDeltaRootCause(ledger,h,graph,['source:other'],digest),
    'CAUSE_NOT_IN_CHANGE_SET');
  reject(assessDeltaRootCause(ledger,h,graph,['source:real'],digest),
    'CAUSE_NOT_IN_PROOF_CLOSURE');
});
test('Delta hypothesis scans full DAG and rejects cycles and unknown proof leaves', () => {
  let ledger = unwrap(initializeDeltaLedger('WO-003', BASE, ['tests:unit'], digest));
  ledger = unwrap(addDeltaAttempt(ledger, attempt('failed','FAIL'), digest));
  const h = { testId:'tests:unit', firstFailureAttemptId:'failed',
    firstFailureEvidenceDigest:H('failed'), causeDependencyId:'source:real',
    reason:'Suspected changed source' };
  reject(assessDeltaRootCause(ledger,h,
    { 'tests:unit':['source:real','proof:cycle'], 'source:real':[],
      'proof:cycle':['tests:unit'] },['source:real'],digest), 'PROOF_GRAPH_CYCLE');
  reject(assessDeltaRootCause(ledger,h,
    { 'tests:unit':['source:real','source:unknown'], 'source:real':[] },
    ['source:real'],digest), 'UNKNOWN_PROOF_DEPENDENCY');
});

test('Delta durable ledger accepts only a receipt bound to the exact attempt and HEAD', async () => {
  const workOrder = 'WO-003';
  let state = null;
  let writes = 0;
  const store = {
    async createIfAbsent(wo, head, initial) {
      assert.equal(wo, workOrder);
      assert.equal(head, BASE);
      if (state) return false;
      state = initial;
      return true;
    },
    async read(wo, head) { assert.equal(wo, workOrder); assert.equal(head, BASE); return state; },
    async compareAndSwap(wo, head, previous, next) {
      assert.equal(wo, workOrder);
      assert.equal(head, BASE);
      if (state.ledgerDigest !== previous) return false;
      writes++; state = next; return true;
    },
  };
  unwrap(await initializeDurableDeltaLedger(store, workOrder, BASE, ['tests:unit'], digest));
  reject(await initializeDurableDeltaLedger(store, workOrder, BASE, ['tests:unit'], digest),
    'DELTA_LEDGER_EXISTS_REQUIRES_RECOVERY');
  const candidate = attempt('trusted-attempt','PASS');
  const authority = { async verify(_ledger, a) { return {
    verified: true, testId: a.testId, attemptId: a.attemptId,
    headSha: a.headSha, toolchainDigest: a.toolchainDigest,
    inputDigest: a.inputDigest, evidenceDigest: a.evidenceDigest,
  }; } };
  const updated = unwrap(await recordVerifiedDeltaAttempt(
    store, authority, workOrder, candidate, BASE, digest));
  assert.equal(updated.records[0].attempts[0].attemptId, 'trusted-attempt');
  assert.equal(writes, 1);
  reject(await recordVerifiedDeltaAttempt(store, authority, workOrder, candidate, BASE, digest),
    'DUPLICATE_ATTEMPT');
  assert.equal(writes, 1);
});

test('Delta verified append blocks untrusted receipts, stale HEAD and concurrency races', async () => {
  const workOrder = 'WO-003';
  let ledger = unwrap(initializeDeltaLedger(workOrder, BASE, ['tests:unit'], digest));
  let writes = 0;
  const store = {
    async read() { return ledger; },
    async compareAndSwap() { writes++; return false; },
  };
  const candidate = attempt('first-fail','FAIL');
  const bogus = { async verify(_l, a) { return { verified: true, testId: a.testId,
    attemptId: a.attemptId, headSha: a.headSha, toolchainDigest: a.toolchainDigest,
    inputDigest: a.inputDigest, evidenceDigest: H('forged') }; } };
  reject(await recordVerifiedDeltaAttempt(store, bogus, workOrder, candidate, BASE, digest),
    'DELTA_EVIDENCE_NOT_VERIFIED');
  reject(await recordVerifiedDeltaAttempt(store, bogus, workOrder, candidate, OTHER, digest),
    'DELTA_STALE_HEAD');
  assert.equal(writes, 0);
  const trusted = { async verify(_l, a) { return { verified: true,
    testId: a.testId, attemptId: a.attemptId, headSha: a.headSha,
    toolchainDigest: a.toolchainDigest, inputDigest: a.inputDigest,
    evidenceDigest: a.evidenceDigest }; } };
  reject(await recordVerifiedDeltaAttempt(store, trusted, workOrder, candidate, BASE, digest),
    'DELTA_PERSISTENCE_CAS_CONFLICT');
  assert.equal(writes, 1);
  assert.equal(ledger.records.length, 0);
  reject(await recordVerifiedDeltaAttempt(store, { async verify() { throw Error('offline'); } },
    workOrder, candidate, BASE, digest), 'DELTA_EVIDENCE_UNAVAILABLE');
});

test('Delta never erases first failing proof under separately verified retries', async () => {
  const workOrder = 'WO-003';
  let ledger = unwrap(initializeDeltaLedger(workOrder, BASE, ['tests:unit'], digest));
  const store = {
    async read() { return ledger; },
    async compareAndSwap(_wo, _head, old, next) {
      if (ledger.ledgerDigest !== old) return false;
      ledger = next; return true;
    },
  };
  const authority = { async verify(_l, a) { return {
    verified: true, testId: a.testId, attemptId: a.attemptId, headSha: a.headSha,
    toolchainDigest: a.toolchainDigest, inputDigest: a.inputDigest, evidenceDigest: a.evidenceDigest,
  }; } };
  unwrap(await recordVerifiedDeltaAttempt(store, authority, workOrder, attempt('f1','FAIL'), BASE, digest));
  const original = ledger.records[0].firstFailure;
  unwrap(await recordVerifiedDeltaAttempt(store, authority, workOrder, attempt('p2','PASS'), BASE, digest));
  assert.deepEqual(ledger.records[0].firstFailure, original);
  assert.equal(ledger.records[0].classification, 'FLAKE_CANDIDATE');
});

test('Marathon operator projects deterministic next actions with exact source binding', () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  const initial = unwrap(describeMarathonNextActions(plan, state, bindings, digest));
  assert.deepEqual(initial.eligibleStarts, ['audit', 'source']);
  assert.deepEqual(initial.decisions.map(x => [x.nodeId, x.action]), [
    ['audit', 'START'], ['build', 'WAIT_DEPENDENCIES'],
    ['release', 'WAIT_DEPENDENCIES'], ['source', 'START'],
  ]);
  reject(describeMarathonNextActions(plan, state,
    { ...bindings, baseSha: OTHER }, digest), 'OPERATOR_SOURCE_OR_ACTOR_DRIFT');
  state = unwrap(advanceMarathon(plan, state, { type: 'PAUSE' }, bindings, digest));
  const paused = unwrap(describeMarathonNextActions(plan, state, bindings, digest));
  assert.deepEqual(paused.eligibleStarts, []);
  assert.equal(paused.decisions[0].action, 'RESUME');
});

test('Marathon operator quarantines ACTIVE intent without blocking independent work', () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  state = unwrap(advanceMarathon(plan, state,
    { type: 'START', nodeId: 'source', intentId: 'operator-uncertain' }, bindings, digest));
  const view = unwrap(describeMarathonNextActions(plan, state, bindings, digest));
  assert.deepEqual(view.eligibleStarts, ['audit']);
  assert.equal(view.decisions.find(x => x.nodeId === 'source').action, 'RECONCILE');
  assert.equal(view.decisions.find(x => x.nodeId === 'build').action, 'WAIT_DEPENDENCIES');
  assert.equal(view.decisions.find(x => x.nodeId === 'source').intentId, 'operator-uncertain');
});

test('Marathon operator reports failed subtree without hiding unrelated work', () => {
  const plan = fixture();
  let state = unwrap(initialMarathonState(plan, digest));
  state = unwrap(advanceMarathon(plan, state,
    { type: 'START', nodeId: 'source', intentId: 'failure-intent' }, bindings, digest));
  state = unwrap(advanceMarathon(plan, state, { type: 'SETTLE', nodeId: 'source',
    intentId: 'failure-intent', outcome: 'FAILED', proofDigest: H('original-failure') },
    bindings, digest));
  const view = unwrap(describeMarathonNextActions(plan, state, bindings, digest));
  assert.deepEqual(view.eligibleStarts, ['audit']);
  assert.equal(view.decisions.find(x => x.nodeId === 'source').action, 'INSPECT_FAILURE');
  assert.equal(view.decisions.find(x => x.nodeId === 'release').action, 'STOP_BLOCKED');
  assert.equal(view.decisions.find(x => x.nodeId === 'audit').action, 'START');
});
test('Marathon refuses forged action verbs and invalid outcomes before evidence settlement', async () => {
  const plan = fixture();
  let snapshot = unwrap(initialMarathonState(plan, digest));
  snapshot = unwrap(advanceMarathon(plan, snapshot,
    { type: 'START', nodeId: 'source', intentId: 'immutable-intent' }, bindings, digest));
  const before = snapshot.stateDigest;
  let writes = 0, verifications = 0;
  const store = {
    async read() { return snapshot; },
    async compareAndSwap(_key, prior, next) {
      assert.equal(prior, snapshot.stateDigest);
      writes++;
      snapshot = next;
      return true;
    },
  };
  // Untrusted JavaScript/JSON inputs bypass TypeScript's union at runtime.
  // In particular, an unknown verb must never reach SETTLE without proof authority.
  const forged = { type: 'FORGED_SETTLE', nodeId: 'source', intentId: 'immutable-intent',
    outcome: 'VERIFIED', proofDigest: H('untrusted-evidence') };
  reject(advanceMarathon(plan, snapshot, forged, bindings, digest), 'INVALID_ACTION');
  reject(await persistMarathonTransition(plan, store, forged, bindings, digest), 'INVALID_ACTION');
  const unknownOutcome = { ...forged, type: 'SETTLE', outcome: 'SKIPPED' };
  reject(advanceMarathon(plan, snapshot, unknownOutcome, bindings, digest),
    'INVALID_SETTLEMENT_OUTCOME');
  reject(await persistMarathonTransition(plan, store, unknownOutcome, bindings, digest,
    { async verify() { verifications++; return true; } }), 'INVALID_SETTLEMENT_OUTCOME');
  assert.equal(writes, 0);
  assert.equal(verifications, 0);
  assert.equal(snapshot.stateDigest, before);
  assert.equal(snapshot.steps.source.status, 'ACTIVE');
});

test('Marathon SKIPPED never grants dependency proof and preserves terminal stop receipt', async () => {
  const plan = fixture();
  let snapshot = unwrap(initialMarathonState(plan, digest));
  reject(advanceMarathon(plan, snapshot,
    { type: 'SKIP', nodeId: 'source', reasonCode: '../invalid' }, bindings, digest),
    'INVALID_STOP_REASON');
  snapshot = unwrap(advanceMarathon(plan, snapshot,
    { type: 'SKIP', nodeId: 'source', reasonCode: 'OWNER_NOT_EXECUTED' }, bindings, digest));
  assert.equal(snapshot.steps.source.status, 'SKIPPED');
  assert.equal(snapshot.steps.source.stopReasonCode, 'OWNER_NOT_EXECUTED');
  assert.equal(snapshot.steps.build.status, 'BLOCKED');
  assert.equal(snapshot.steps.build.stopReasonCode, 'DEPENDENCY_SKIPPED');
  assert.equal(snapshot.steps.release.status, 'BLOCKED');
  assert.equal(snapshot.steps.audit.status, 'PENDING');
  assert.deepEqual(unwrap(readyMarathonNodes(plan, snapshot, digest)), ['audit']);
  reject(advanceMarathon(plan, snapshot,
    { type: 'START', nodeId: 'source', intentId: 'not-allowed' }, bindings, digest), 'NOT_PENDING');
  reject(advanceMarathon(plan, snapshot,
    { type: 'START', nodeId: 'build', intentId: 'cannot-bypass' }, bindings, digest), 'NOT_PENDING');
  const operator = unwrap(describeMarathonNextActions(plan, snapshot, bindings, digest));
  const skipped = operator.decisions.find(item => item.nodeId === 'source');
  assert.equal(skipped.action, 'STOP_BLOCKED');
  assert.equal(skipped.stopReasonCode, 'OWNER_NOT_EXECUTED');
  assert.deepEqual(operator.eligibleStarts, ['audit']);

  let persisted = unwrap(initialMarathonState(plan, digest));
  const store = {
    async read() { return persisted; },
    async compareAndSwap(_key, old, next) {
      if (persisted.stateDigest !== old) return false;
      persisted = next; return true;
    },
  };
  const durable = unwrap(await persistMarathonTransition(plan, store,
    { type: 'SKIP', nodeId: 'source', reasonCode: 'OWNER_NOT_EXECUTED' }, bindings, digest));
  assert.equal(durable.steps.source.status, 'SKIPPED');
  assert.equal(unwrap(await recoverPersistedMarathon(plan, store, bindings, digest)).status, 'READY');
  assert.deepEqual(unwrap(await recoverPersistedMarathon(plan, store, bindings, digest)).readyNodeIds, ['audit']);
  reject(await persistMarathonTransition(plan, store,
    { type: 'SKIP', nodeId: 'source', reasonCode: 'DIFFERENT_REASON' }, bindings, digest), 'NOT_PENDING');
  assert.equal((await store.read()).steps.source.stopReasonCode, 'OWNER_NOT_EXECUTED');
  const inflight = unwrap(advanceMarathon(plan, unwrap(initialMarathonState(plan, digest)),
    { type: 'START', nodeId: 'source', intentId: 'in-flight' }, bindings, digest));
  reject(advanceMarathon(plan, inflight,
    { type: 'SKIP', nodeId: 'source', reasonCode: 'FORGED_NO_EFFECT' }, bindings, digest),
    'EFFECT_UNCERTAIN_RECONCILE');
});
