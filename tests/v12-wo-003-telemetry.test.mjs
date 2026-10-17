import test from 'node:test';
import assert from 'node:assert/strict';
import { captureMarathonTelemetry, verifyPerformanceRecord } from '../packages/m62-m63-final/src/index.mjs';
import { syntheticMarathonTelemetryPopulation } from './v12-wo-003-telemetry-fixture.test.mjs';

const sha = (v) => v.repeat(64);
const base = 'a'.repeat(40);
const plan = { workOrderId: 'GBS-V12-WO-003', actor: 'CHATGPT_OWNER', baseSha: base,
  planDigest: 'sha256:' + sha('b') };
const state = { planDigest: plan.planDigest, stateDigest: 'sha256:' + sha('c') };
function input(metrics = {
  'M-LAT-01': { unit: 'ms', source: 'UNAVAILABLE', value: null },
  'M-TOK-03': { unit: 'tokens', source: 'UNAVAILABLE', value: null },
}) {
  return { recordId: 'marathon-telemetry-one',
    executionMode: 'CLI',
    population: syntheticMarathonTelemetryPopulation(
      { workloadInstanceId: 'wo003-telemetry', fixtureId: 'fixed-input',
        fixtureDigest: sha('d') },
      { commitSha: base, treeFingerprint: sha('e') },
      { policyDigest: sha('f'), ladder: 'L5', finalSweepRequired: true },
    ),
    requiredMetricIds: ['M-LAT-01', 'M-TOK-03'],
    metrics, qualityGate: { status: 'PASS', digest: sha('a') },
  };
}
test('Marathon M63 telemetry binds immutable population and preserves UNAVAILABLE metrics', () => {
  const result = captureMarathonTelemetry({ plan, state, recordInput: input() });
  assert.equal(result.state, 'CAPTURED', JSON.stringify(result));
  assert.equal(verifyPerformanceRecord(result.record), true);
  assert.equal(result.record.metrics['M-LAT-01'].source, 'UNAVAILABLE');
  assert.equal(result.record.metrics['M-TOK-03'].value, null);
  assert.equal(result.optimizationClaimEligible, false);
  assert.equal(result.lineage.planDigest, plan.planDigest);
  assert.equal(result.lineage.stateDigest, state.stateDigest);
});
test('Marathon M63 telemetry rejects stale SHA, mismatched plan and malformed population', () => {
  const wrongSha = input();
  wrongSha.population.P3.commitSha = 'f'.repeat(40);
  assert.equal(captureMarathonTelemetry({ plan, state, recordInput: wrongSha }).state, 'INVALID');
  assert.equal(captureMarathonTelemetry({ plan, state: { ...state, planDigest: 'sha256:' + sha('d') },
    recordInput: input() }).state, 'INVALID');
  const invalidM63 = input();
  invalidM63.population.P4.node = '';
  assert.equal(captureMarathonTelemetry({ plan, state, recordInput: invalidM63 }).state, 'INVALID');
});
