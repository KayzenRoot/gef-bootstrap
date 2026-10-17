/**
 * TEST-ONLY synthetic M24–M28 and durable Delta fixtures for WO-003.
 * Never use these trust roots or verifier callbacks in production.
 */
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createFileBackedDeltaLedgerStore, initializeDurableDeltaLedger,
  recordVerifiedDeltaAttempt,
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
    inputDigest: a.inputDigest, evidenceDigest: a.evidenceDigest,
    observation: a.observation, failureSignature: a.failureSignature};
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


export {
  sha, H, digest, opts, WO, HEAD, tests, graph, unwrap, reject, attempt,
  persistAuthority, fixture, actualM28, evidence, inputs, verifier, repair,
};
