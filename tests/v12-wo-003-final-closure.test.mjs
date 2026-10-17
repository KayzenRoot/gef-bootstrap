import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  sha, H, digest, opts, WO, HEAD, tests, graph, unwrap, reject, attempt,
  persistAuthority, fixture, actualM28, evidence, inputs, verifier, repair,
  createFileBackedDeltaLedgerStore, initializeDurableDeltaLedger,
  recordVerifiedDeltaAttempt, evaluateDeltaFinalClosure, compileGateClosure,
} from './v12-wo-003-fixtures.test.mjs';

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

test('a repaired first failure cannot conceal unknown dependencies in a separate passing security test', async t => {
  const store = await fixture(t, true);
  const repaired = inputs({
    repairs: [repair()], changedDependencies: ['src:unit'],
    // The security test PASS is real, but its dependency graph has an
    // undeclared leaf. This must block the entire review handoff.
    proofDependencies: {
      ...graph,
      'tests:security': ['src:missing-security-policy'],
    },
  });
  reject(await evaluateDeltaFinalClosure(store, repaired, verifier(), digest),
    'DELTA_FINAL_IMPACT_UNKNOWN');
});
