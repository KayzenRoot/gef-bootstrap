import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createFileBackedDeltaLedgerStore, initializeDurableDeltaLedger,
  recordVerifiedDeltaAttempt, evaluateDeltaFinalClosure,
} from '../packages/heds-delta-review/dist/public.js';
import { buildTestMap, compileGateClosure } from '../packages/test-impact-engine/dist/public.js';

const sha = x => createHash('sha256').update(x).digest('hex');
const H = x => 'sha256:' + sha(x);
const digest = x => sha(x);
const opts = { digest: { algorithm: 'sha256', digest } };
const WO = 'GBS-V12-WO-003', HEAD = 'e'.repeat(40);
const tests = ['tests:security', 'tests:unit'];
const graph = {
  'tests:security': ['src:security'], 'tests:unit': ['src:unit'],
  'src:security': [], 'src:unit': [],
};
const unwrap = result => {
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
};
const reject = (result, code) => {
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.equal(result.code, code);
};
const attempt = (testId, id, observation) => ({
  testId, attemptId: id, headSha: HEAD, toolchainDigest: H('node22'),
  inputDigest: H('source:fixed'), evidenceDigest: H(testId + ':' + id),
  observation, failureSignature: observation === 'FAIL' ? 'failure:original' : null,
});
const persistAuthority = { async verify(_ledger, a) {
  return { verified: true, testId: a.testId, attemptId: a.attemptId,
    headSha: a.headSha, toolchainDigest: a.toolchainDigest,
    inputDigest: a.inputDigest, evidenceDigest: a.evidenceDigest };
} };

async function fixture(t, failure = false) {
  const root = await mkdtemp(join(tmpdir(), 'gef-v12-final-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createFileBackedDeltaLedgerStore(root);
  unwrap(await initializeDurableDeltaLedger(store, WO, HEAD, tests, digest));
  if (failure) {
    unwrap(await recordVerifiedDeltaAttempt(store, persistAuthority, WO,
      attempt('tests:unit', 'failure-first', 'FAIL'), HEAD, digest));
  }
  for (const testId of tests) {
    unwrap(await recordVerifiedDeltaAttempt(store, persistAuthority, WO,
      attempt(testId, testId + '-final', 'PASS'), HEAD, digest));
  }
  return store;
}

// M28 is a real engine artifact, not merely an asserted result.
function actualM28() {
  const sources = [
    { id: 'src:unit', fingerprint: H('unit-source') },
    { id: 'src:security', fingerprint: H('security-source') },
  ];
  const mappedTests = tests.map(testId => ({
    id: testId, fingerprint: H(testId), sources: [testId === 'tests:unit' ? 'src:unit' : 'src:security'],
  }));
  const map = unwrap(buildTestMap(sources, mappedTests, opts));
  const input = {
    map, sourcePathIndex: { 'src/unit.ts': ['src:unit'] },
    changedPaths: ['src/unit.ts'], attributionComplete: true,
    assurance: { requiredLevel: 'L4', policyDigest: H('policy'), profileDigest: H('profile') },
    platform: 'ubuntu-latest', tierFloor: 'L4',
  };
  return { input, result: unwrap(compileGateClosure(input, opts)) };
}
function evidence(m28 = actualM28()) {
  return ['M24', 'M25', 'M27', 'M28'].map(module => {
    const payload = module === 'M28' ? m28 :
      { module, provenance: 'TEST_ONLY_EXTERNAL_VERIFIER_FIXTURE', workOrderId: WO, headSha: HEAD };
    return { module, payload, artifactDigest: H(JSON.stringify(payload)) };
  });
}
const inputs = (over = {}) => ({
  workOrderId: WO, headSha: HEAD, requiredFinalTests: tests,
  proofDependencies: graph, changedDependencies: [],
  fullFinalSweepPerformed: true, modules: evidence(), repairs: [], ...over,
});
function verifier(over = {}) {
  return {
    // TEST ONLY: the canonical set is independently fixed in this fixture,
    // never copied from the caller-supplied ledger or input.
    async verifyFinalSweep(request) {
      return { verified: true, workOrderId: WO, headSha: HEAD,
        ledgerDigest: request.ledgerDigest, requiredFinalTests: tests,
        obligationSourceDigest: H('test-only-m26-canonical-obligations'),
        finalSweepEvidenceDigest: H('test-only-m28-full-final-run'),
        materialization: 'COMPLETE' };
    },
    async verifyModule(a) {
      if (a.module === 'M28') {
        const recomputed = compileGateClosure(a.payload.input, opts);
        if (!recomputed.ok || recomputed.value.closureDigest !== a.payload.result.closureDigest ||
            recomputed.value.fullSuiteRequired !== true ||
            recomputed.value.obstructions.length !== 0) return null;
      }
      if (a.artifactDigest !== H(JSON.stringify(a.payload))) return null;
      return { verified: true, module: a.module, headSha: HEAD,
        workOrderId: WO, artifactDigest: a.artifactDigest, verdict: 'PASS' };
    },
    async verifyFinalTest(_record, a) {
      return { verified: true, workOrderId: WO, headSha: a.headSha,
        testId: a.testId, attemptId: a.attemptId,
        evidenceDigest: a.evidenceDigest, toolchainDigest: a.toolchainDigest,
        inputDigest: a.inputDigest, observation: a.observation };
    },
    async verifyRepair(record, claim) {
      return { verified: true, workOrderId: WO, headSha: HEAD,
        testId: record.testId,
        firstFailureAttemptId: record.firstFailure.attemptId,
        firstFailureEvidenceDigest: record.firstFailure.evidenceDigest,
        causeDependencyId: claim.hypothesis.causeDependencyId,
        repairEvidenceDigest: claim.repairEvidenceDigest,
        finalAttemptId: claim.finalAttemptId };
    },
    ...over,
  };
}
function repair() {
  return {
    hypothesis: { testId: 'tests:unit', firstFailureAttemptId: 'failure-first',
      firstFailureEvidenceDigest: H('tests:unit:failure-first'),
      causeDependencyId: 'src:unit', reason: 'Changed source requires independent test proof' },
    repairEvidenceDigest: H('separately-verified-repair'),
    finalAttemptId: 'tests:unit-final',
  };
}

test('Delta final closure requires complete durable exact-HEAD M24-M28 gate and full test sweep', async t => {
  const store = await fixture(t);
  const result = unwrap(await evaluateDeltaFinalClosure(store, inputs(), verifier(), digest));
  assert.equal(result.state, 'READY_FOR_INDEPENDENT_REVIEW');
  assert.deepEqual(result.requiredFinalTests, tests);
  assert.deepEqual(result.finalTestsIndependentlyVerified, tests);
  assert.equal(result.moduleProofDigests.length, 4);
  assert.equal(result.mayMerge, false);
  assert.equal(result.mayPromoteCheckpoint, false);
  assert.equal(result.mayPublish, false);
});

test('a green retry cannot erase immutable first failure or bypass independently proven repair', async t => {
  const store = await fixture(t, true);
  const args = inputs({ changedDependencies: ['src:unit'] });
  reject(await evaluateDeltaFinalClosure(store, args, verifier(), digest),
    'DELTA_FINAL_REPAIR_CLOSURE_MISSING');
  const withClaim = { ...args, repairs: [repair()] };
  const approvedForReview = unwrap(await evaluateDeltaFinalClosure(
    store, withClaim, verifier(), digest));
  assert.deepEqual(approvedForReview.firstFailureTestIds, ['tests:unit']);
  assert.deepEqual(approvedForReview.repairsIndependentlyVerified, ['tests:unit']);
  assert.equal((await store.read(WO, HEAD)).records.find(r =>
    r.testId === 'tests:unit').firstFailure.attemptId, 'failure-first');
  reject(await evaluateDeltaFinalClosure(store, withClaim, verifier({
    async verifyRepair() { return null; },
  }), digest), 'DELTA_FINAL_REPAIR_PROOF_NOT_VERIFIED');
  reject(await evaluateDeltaFinalClosure(store, {
    ...withClaim, repairs: [{ ...repair(), hypothesis: {
      ...repair().hypothesis, firstFailureEvidenceDigest: H('tampered') } }],
  }, verifier(), digest), 'DELTA_FINAL_ROOT_CAUSE_UNPROVEN');
});

test('mandatory tests, untrusted module handoffs and stale revisions fail closed', async t => {
  const store = await fixture(t);
  reject(await evaluateDeltaFinalClosure(store, inputs({
    requiredFinalTests: ['tests:unit'],
  }), verifier(), digest), 'DELTA_FINAL_MANDATORY_TEST_MISMATCH');
  reject(await evaluateDeltaFinalClosure(store, inputs({
    fullFinalSweepPerformed: false,
  }), verifier(), digest), 'DELTA_FINAL_SWEEP_REQUIRED');
  reject(await evaluateDeltaFinalClosure(store, inputs({
    modules: evidence().slice(1),
  }), verifier(), digest), 'DELTA_FINAL_MODULE_SET_INVALID');
  reject(await evaluateDeltaFinalClosure(store, inputs({
    modules: evidence().map(a => a.module === 'M24' ?
      { ...a, artifactDigest: H('forged') } : a),
  }), verifier(), digest), 'DELTA_FINAL_MODULE_PROOF_NOT_VERIFIED');
  reject(await evaluateDeltaFinalClosure(store, inputs(), verifier({
    async verifyFinalTest(_r, a) {
      return { verified: true, workOrderId: WO, headSha: 'f'.repeat(40),
        testId: a.testId, attemptId: a.attemptId, evidenceDigest: a.evidenceDigest,
        inputDigest: a.inputDigest, toolchainDigest: a.toolchainDigest, observation: 'PASS' };
    },
  }), digest), 'DELTA_FINAL_TEST_PROOF_NOT_VERIFIED');
  reject(await evaluateDeltaFinalClosure(store, inputs({
    changedDependencies: ['src:unknown'],
    proofDependencies: { ...graph, 'tests:unit': ['src:nonexistent'] },
  }), verifier(), digest), 'DELTA_FINAL_IMPACT_UNKNOWN');
});

test('even a verified module response cannot approve a concurrent CAS-changed ledger', async t => {
  const store = await fixture(t);
  const authority = verifier();
  const before = await store.read(WO, HEAD);
  let shifted = false;
  const maliciousRace = verifier({
    async verifyModule(a) {
      if (!shifted) {
        shifted = true;
        unwrap(await recordVerifiedDeltaAttempt(store, persistAuthority, WO,
          attempt('tests:unit', 'new-after-snapshot', 'PASS'), HEAD, digest));
      }
      return authority.verifyModule(a);
    },
  });
  reject(await evaluateDeltaFinalClosure(store, inputs(), maliciousRace, digest),
    'DELTA_FINAL_CONCURRENT_OR_TAMPERED_LEDGER');
  assert.notEqual((await store.read(WO, HEAD)).ledgerDigest, before.ledgerDigest);
});

test('actual M28 unknown attribution is not accepted as complete module assurance', async t => {
  const store = await fixture(t);
  const compromised = actualM28();
  compromised.input = { ...compromised.input, attributionComplete: false };
  compromised.result = unwrap(compileGateClosure(compromised.input, opts));
  reject(await evaluateDeltaFinalClosure(store, inputs({
    modules: evidence(compromised),
  }), verifier(), digest), 'DELTA_FINAL_MODULE_PROOF_NOT_VERIFIED');
});

test('a caller cannot hide an M26 mandatory test using a shortened ledger and self-declared full sweep', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'gef-v12-shortened-ledger-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createFileBackedDeltaLedgerStore(dir);
  unwrap(await initializeDurableDeltaLedger(store, WO, HEAD, ['tests:unit'], digest));
  unwrap(await recordVerifiedDeltaAttempt(store, persistAuthority, WO,
    attempt('tests:unit', 'unit-only-final', 'PASS'), HEAD, digest));
  const claimed = inputs({
    requiredFinalTests: ['tests:unit'], fullFinalSweepPerformed: true,
  });
  // The attacker controls BOTH ledger creation and input, not the M26
  // authority's expected canonical set of unit + security obligations.
  reject(await evaluateDeltaFinalClosure(store, claimed, verifier(), digest),
    'DELTA_FINAL_CANONICAL_SWEEP_NOT_VERIFIED');
});

test('final full-suite proof refuses a stale HEAD, missing trust port or an expired materialization', async t => {
  const store = await fixture(t);
  reject(await evaluateDeltaFinalClosure(store, inputs(), verifier({
    async verifyFinalSweep() { return null; },
  }), digest), 'DELTA_FINAL_CANONICAL_SWEEP_NOT_VERIFIED');
  reject(await evaluateDeltaFinalClosure(store, inputs(), verifier({
    async verifyFinalSweep() { throw new Error('provider unavailable'); },
  }), digest), 'DELTA_FINAL_SWEEP_PROOF_UNAVAILABLE');
  reject(await evaluateDeltaFinalClosure(store, inputs(), verifier({
    async verifyFinalSweep(req) {
      return { verified: true, workOrderId: WO, headSha: 'f'.repeat(40),
        ledgerDigest: req.ledgerDigest, requiredFinalTests: tests,
        obligationSourceDigest: H('m26'), finalSweepEvidenceDigest: H('m28'),
        materialization: 'COMPLETE' };
    },
  }), digest), 'DELTA_FINAL_CANONICAL_SWEEP_NOT_VERIFIED');
  reject(await evaluateDeltaFinalClosure(store, inputs(), verifier({
    async verifyFinalSweep(req) {
      return { verified: true, workOrderId: WO, headSha: HEAD,
        ledgerDigest: req.ledgerDigest, requiredFinalTests: tests,
        obligationSourceDigest: H('m26'), finalSweepEvidenceDigest: H('m28'),
        materialization: 'PARTIAL' };
    },
  }), digest), 'DELTA_FINAL_CANONICAL_SWEEP_NOT_VERIFIED');
  const { verifyFinalSweep: _unused, ...noSweepPort } = verifier();
  reject(await evaluateDeltaFinalClosure(store, inputs(), noSweepPort, digest),
    'DELTA_FINAL_PORT_OR_INPUT_MISSING');
});
