import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  compileMarathon, initialMarathonState, readyMarathonNodes, advanceMarathon, validateMarathonState,
} from '../packages/execution-pack-compiler/dist/v12-marathon.js';
import {
  initializeDeltaLedger, addDeltaAttempt, evaluateDeltaAssurance, validateDeltaLedger,
} from '../packages/heds-delta-review/dist/v12-delta-assurance.js';

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
  const result = unwrap(evaluateDeltaAssurance(l, BASE, { 'tests:unit': ['src:x'], 'tests:security': ['policy:x'] }, [], digest));
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
  const v = unwrap(evaluateDeltaAssurance(l, BASE, { 'tests:unit': ['src:x'], 'tests:security': ['policy:x'] }, ['src:x'], digest));
  assert.deepEqual(v.evidenceReuseAllowed, ['tests:security']);
  assert.equal(v.state, 'CORRECTION_REQUIRED');
  let clean = unwrap(initializeDeltaLedger('GBS-V12-WO-003', BASE, ['tests:unit', 'tests:security'], digest));
  clean = unwrap(addDeltaAttempt(clean, attempt('a1', 'PASS'), digest));
  assert.equal(unwrap(evaluateDeltaAssurance(clean, BASE, { 'tests:unit': [] }, [], digest)).state, 'BLOCKED');
  clean = unwrap(addDeltaAttempt(clean, { ...attempt('s1', 'PASS'), testId: 'tests:security' }, digest));
  assert.equal(unwrap(evaluateDeltaAssurance(clean, BASE, { 'tests:unit': ['src:x'] }, [], digest)).state, 'BLOCKED');
  const final = unwrap(evaluateDeltaAssurance(clean, BASE, { 'tests:unit': ['src:x'], 'tests:security': ['policy:x'] }, [], digest));
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
  const graph = { 'tests:unit': ['proof:a'], 'proof:a': ['source:a'], 'tests:security': ['source:policy'] };
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
