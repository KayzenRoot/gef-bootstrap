import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  captureBaseline,
  capturePerformanceRecord,
  compareBenchmarks,
  compareCliRoi,
  digest,
  verifyBaseline,
  verifyPerformanceRecord,
} from '../packages/m62-m63-final/src/index.mjs';

const sha = (character) => character.repeat(64);

function population(overrides = {}) {
  const base = {
    P1: { workloadKind: 'VALIDATION_SELECTION' },
    P2: { workloadInstanceId: 'workload-wo008-01', fixtureId: 'fixed-fixture-01', fixtureDigest: sha('a') },
    P3: { commitSha: 'b'.repeat(40), treeFingerprint: sha('c') },
    P4: { node: '22.11.0', npm: '10.9.0', packageManager: 'npm', typescript: '6.0.3' },
    P5: { os: 'linux', osVersion: 'ubuntu-24.04', architecture: 'x64' },
    P6: { policyDigest: sha('d'), ladder: 'L5', finalSweepRequired: true },
    P7: { posture: 'COLD', reuseSetDigest: 'none' },
    P8: { timedRegion: 'work-order-complete', startEvent: 'executor-start', endEvent: 'accepted-handoff' },
  };
  return Object.fromEntries(Object.keys(base).map((key) => [key, { ...base[key], ...(overrides[key] ?? {}) }]));
}

const passingGate = { status: 'PASS', digest: sha('e') };

function record(recordId, samples, options = {}) {
  const metrics = options.metrics ?? {
    'M-LAT-01': { unit: 'ms', source: 'MEASURED', samples },
    'M-TOK-03': { value: null, unit: 'tokens', source: 'UNAVAILABLE' },
  };
  const result = capturePerformanceRecord({
    recordId,
    executionMode: options.executionMode ?? 'CLI',
    population: population(options.population),
    requiredMetricIds: options.requiredMetricIds,
    metrics,
    qualityGate: options.qualityGate ?? passingGate,
    accelerationBindings: options.accelerationBindings,
    prompt: 'private prompt must not be copied',
    response: 'private response must not be copied',
    secret: 'must not be copied',
    absolutePath: '/private/workspace/project',
  });
  assert.equal(result.state, 'CAPTURED', JSON.stringify(result));
  return result.record;
}

function noNumericDelta(report) {
  assert.equal(Object.hasOwn(report, 'delta'), false);
  for (const metric of Object.values(report.metrics)) assert.equal(Object.hasOwn(metric, 'delta'), false);
}

test('TELEM-01: P1-P8 mismatches are incomparable and publish no delta', () => {
  const baseline = record('telem-01-base', [100, 101, 99]);
  const cases = [
    { name: 'Node', population: { P4: { node: '23.0.0' } }, dimension: 'P4' },
    { name: 'OS', population: { P5: { osVersion: 'windows-2025' } }, dimension: 'P5' },
    { name: 'cache posture', population: { P7: { posture: 'WARM', reuseSetDigest: sha('f') } }, dimension: 'P7' },
    { name: 'measurement boundary', population: { P8: { timedRegion: 'validation-only' } }, dimension: 'P8' },
  ];
  for (const scenario of cases) {
    const candidate = record('telem-01-' + scenario.dimension, [80, 81, 79], { population: scenario.population });
    const report = compareBenchmarks(baseline, candidate);
    assert.equal(report.verdict, 'INCOMPARABLE', scenario.name);
    assert.ok(report.populationMismatchDimensions.includes(scenario.dimension));
    noNumericDelta(report);
  }
});

test('cold-vs-cold and warm-vs-warm are comparable; cold-vs-warm is not', () => {
  const coldBaseline = record('cold-base', [100, 101, 99]);
  const coldCandidate = record('cold-candidate', [70, 71, 69]);
  assert.equal(compareBenchmarks(coldBaseline, coldCandidate).verdict, 'IMPROVED');

  const warmPopulation = { P7: { posture: 'WARM', reuseSetDigest: sha('f') } };
  const warmBaseline = record('warm-base', [100, 101, 99], { population: warmPopulation });
  const warmCandidate = record('warm-candidate', [70, 71, 69], { population: warmPopulation });
  assert.equal(compareBenchmarks(warmBaseline, warmCandidate).verdict, 'IMPROVED');

  const crossPosture = compareBenchmarks(coldBaseline, warmCandidate);
  assert.equal(crossPosture.verdict, 'INCOMPARABLE');
  assert.ok(crossPosture.populationMismatchDimensions.includes('P7'));
  noNumericDelta(crossPosture);
});

test('TELEM-02: a missing required metric is indeterminate, never improved', () => {
  const baseline = record('telem-02-base', [100, 101, 99], { requiredMetricIds: ['M-LAT-01', 'M-VAL-01'] });
  const candidate = record('telem-02-candidate', [80, 81, 79], {
    requiredMetricIds: ['M-LAT-01', 'M-VAL-01'],
    metrics: { 'M-LAT-01': { unit: 'ms', source: 'MEASURED', samples: [80, 81, 79] } },
  });
  const report = compareBenchmarks(baseline, candidate);
  assert.equal(report.verdict, 'INDETERMINATE');
  assert.equal(report.optimizationClaimEligible, false);
  assert.deepEqual(report.missingOrInsufficientMetricIds, ['M-VAL-01']);
  noNumericDelta(report);
});

test('TELEM-03: unavailable token counts stay explicitly unavailable', () => {
  const baseline = record('telem-03-base', [100, 101, 99]);
  const candidate = record('telem-03-candidate', [100, 100, 100]);
  assert.deepEqual(
    { value: baseline.metrics['M-TOK-03'].value, source: baseline.metrics['M-TOK-03'].source },
    { value: null, source: 'UNAVAILABLE' },
  );
  const report = compareBenchmarks(baseline, candidate);
  assert.equal(report.metrics['M-TOK-03'].verdict, 'INDETERMINATE');
  assert.equal(Object.hasOwn(report.metrics['M-TOK-03'], 'delta'), false);
  assert.equal(report.verdict, 'NO_CHANGE');
});

test('TELEM-04: a failed quality gate voids an apparent latency gain', () => {
  const baseline = record('telem-04-base', [100, 101, 99]);
  const candidate = record('telem-04-candidate', [50, 49, 51], { qualityGate: { status: 'FAIL', digest: sha('1') } });
  const report = compareBenchmarks(baseline, candidate);
  assert.equal(report.metrics['M-LAT-01'].verdict, 'IMPROVED');
  assert.equal(report.verdict, 'REGRESSION');
  assert.equal(report.optimizationClaimEligible, false);
  assert.equal(report.reasonCode, 'QUALITY_GATE_FAILED');
});

test('TELEM-05: recapture creates a new immutable identity and preserves prior lineage', () => {
  const first = captureBaseline([], {
    baselineId: 'baseline-01',
    recordInput: {
      recordId: 'telem-05-record-01',
      population: population(),
      metrics: { 'M-LAT-01': { unit: 'ms', source: 'MEASURED', samples: [100, 101, 99] } },
      qualityGate: passingGate,
    },
  });
  assert.equal(first.state, 'CAPTURED');
  const firstSnapshot = JSON.stringify(first.baseline);
  const second = captureBaseline(first.registry, {
    baselineId: 'baseline-02',
    parentBaselineId: 'baseline-01',
    recordInput: {
      recordId: 'telem-05-record-02',
      population: population(),
      metrics: { 'M-LAT-01': { unit: 'ms', source: 'MEASURED', samples: [98, 99, 97] } },
      qualityGate: passingGate,
    },
  });
  assert.equal(second.state, 'CAPTURED');
  assert.equal(first.registry.length, 1);
  assert.equal(JSON.stringify(first.baseline), firstSnapshot);
  assert.equal(Object.isFrozen(first.baseline), true);
  assert.equal(Object.isFrozen(second.registry), true);
  assert.equal(second.registry.length, 2);
  assert.equal(second.registry[0].digest, first.baseline.digest);
  assert.notEqual(second.baseline.baselineId, first.baseline.baselineId);
  assert.deepEqual(second.baseline.lineageIds, ['baseline-01']);
  assert.equal(verifyBaseline(first.baseline), true);
  assert.equal(verifyBaseline(second.baseline), true);
});

test('baseline capture rejects duplicate IDs and inconsistent or incomplete ancestry', () => {
  const recordInput = (recordId, samples) => ({
    recordId,
    population: population(),
    metrics: { 'M-LAT-01': { unit: 'ms', source: 'MEASURED', samples } },
    qualityGate: passingGate,
  });
  const root = captureBaseline([], { baselineId: 'lineage-root', recordInput: recordInput('lineage-root-record', [100, 101, 99]) }).baseline;
  const duplicateRoot = captureBaseline([], { baselineId: 'lineage-root', recordInput: recordInput('duplicate-root-record', [90, 91, 89]) }).baseline;
  const duplicate = captureBaseline([root, duplicateRoot], {
    baselineId: 'lineage-child',
    parentBaselineId: 'lineage-root',
    recordInput: recordInput('lineage-child-record', [80, 81, 79]),
  });
  assert.equal(duplicate.state, 'INVALID');
  assert.equal(duplicate.reasonCode, 'BASELINE_REGISTRY_INVALID');

  const child = captureBaseline([root], {
    baselineId: 'lineage-child',
    parentBaselineId: 'lineage-root',
    recordInput: recordInput('lineage-child-record', [80, 81, 79]),
  }).baseline;
  const inconsistent = JSON.parse(JSON.stringify(child));
  inconsistent.lineageIds = ['orphan-baseline', 'lineage-root'];
  delete inconsistent.digest;
  inconsistent.digest = digest('GBS-V11-TELEM-BASELINE', inconsistent);
  assert.equal(verifyBaseline(inconsistent), true, 'a single baseline cannot prove its parent chain without the registry');

  const brokenChain = captureBaseline([root, inconsistent], {
    baselineId: 'lineage-grandchild',
    parentBaselineId: 'lineage-child',
    recordInput: recordInput('lineage-grandchild-record', [70, 71, 69]),
  });
  assert.equal(brokenChain.state, 'INVALID');
  assert.equal(brokenChain.reasonCode, 'BASELINE_REGISTRY_INVALID');

  const missingAncestor = captureBaseline([child], {
    baselineId: 'lineage-grandchild',
    parentBaselineId: 'lineage-child',
    recordInput: recordInput('lineage-grandchild-record', [70, 71, 69]),
  });
  assert.equal(missingAncestor.state, 'INVALID');
  assert.equal(missingAncestor.reasonCode, 'BASELINE_REGISTRY_INVALID');
});

test('TELEM-06: CLI ROI compares the same workload honestly, including adverse and incomparable outcomes', () => {
  const manual = record('telem-06-manual', [100, 101, 99], { executionMode: 'SOURCE_WORKSPACE_MANUAL' });
  const improvedCli = record('telem-06-cli-improved', [80, 81, 79], { executionMode: 'CLI' });
  const improved = compareCliRoi(manual, improvedCli);
  assert.equal(improved.verdict, 'IMPROVED');
  assert.equal(improved.roi.m41ComparisonState, 'IMPROVED');
  assert.equal(improved.optimizationClaimEligible, true);
  assert.equal(improved.roi.latencyDeltaPercent, -20);

  const slowerCli = record('telem-06-cli-slower', [120, 121, 119], { executionMode: 'CLI' });
  const adverse = compareCliRoi(manual, slowerCli);
  assert.equal(adverse.verdict, 'REGRESSION');
  assert.equal(adverse.roi.m41ComparisonState, 'REGRESSED');
  assert.equal(adverse.optimizationClaimEligible, false);

  const differentNode = record('telem-06-cli-node-drift', [80, 81, 79], {
    executionMode: 'CLI',
    population: { P4: { node: '23.0.0' } },
  });
  const incomparable = compareCliRoi(manual, differentNode);
  assert.equal(incomparable.verdict, 'INCOMPARABLE');
  assert.equal(incomparable.kind, 'CLI_ROI_REPORT');
  assert.equal(incomparable.roi.deltaAvailable, false);
  noNumericDelta(incomparable);
});

test('repeated sample summaries and records are deterministic under input permutation', () => {
  const first = record('deterministic-record', [5, 1, 3, 2, 4]);
  const permuted = record('deterministic-record', [4, 2, 5, 1, 3]);
  assert.equal(first.digest, permuted.digest);
  assert.deepEqual(first.metrics['M-LAT-01'].summary, { n: 5, median: 3, p90: 4, p95: 4, min: 1, max: 5 });
  assert.equal(verifyPerformanceRecord(first), true);
});

test('all frozen metric families preserve value, unit, and truth source labels', () => {
  const result = capturePerformanceRecord({
    recordId: 'metric-families',
    population: population(),
    qualityGate: passingGate,
    metrics: {
      'M-LAT-01': { unit: 'ms', source: 'MEASURED', samples: [100, 101, 99] },
      'M-CTX-03': { unit: 'count', source: 'MEASURED', samples: [4, 5, 3] },
      'M-VAL-02': { unit: 'count', source: 'MEASURED', samples: [2, 3, 1] },
      'M-RWK-01': { unit: 'count', source: 'MEASURED', samples: [1, 0, 1] },
      'M-OUT-01': { unit: 'count', source: 'MEASURED', samples: [1, 2, 1] },
      'M-OUT-03': { unit: 'enum', source: 'MEASURED', value: 'ACCEPTED' },
      'M-TOK-03': { unit: 'tokens', source: 'UNAVAILABLE', value: null },
    },
  });
  assert.equal(result.state, 'CAPTURED');
  for (const metric of Object.values(result.record.metrics)) {
    assert.ok(Object.hasOwn(metric, 'value'));
    assert.ok(Object.hasOwn(metric, 'unit'));
    assert.ok(Object.hasOwn(metric, 'source'));
  }
  assert.equal(result.record.metrics['M-VAL-02'].direction, 'HIGHER_IS_BETTER');
  assert.equal(result.record.metrics['M-OUT-01'].direction, 'HIGHER_IS_BETTER');
  assert.equal(result.record.metrics['M-RWK-01'].direction, 'LOWER_IS_BETTER');
  assert.equal(result.record.metrics['M-OUT-03'].direction, 'INFORMATIONAL');
});

test('invalid and negative samples are rejected; zero denominators fail closed', () => {
  const invalidSamples = [[1, -1, 2], [1, Number.NaN], [Number.POSITIVE_INFINITY, 1], []];
  for (const [index, samples] of invalidSamples.entries()) {
    const invalid = capturePerformanceRecord({
      recordId: 'bad-sample-' + index,
      population: population(),
      metrics: { 'M-LAT-01': { unit: 'ms', source: 'MEASURED', samples } },
    });
    assert.equal(invalid.state, 'INVALID');
    assert.equal(invalid.reasonCode, 'SAMPLE_INVALID');
  }

  const measuredTokens = (latency) => ({
    'M-LAT-01': { unit: 'ms', source: 'MEASURED', samples: latency },
    'M-TOK-03': { unit: 'tokens', source: 'MEASURED', samples: [10, 10] },
  });
  const zero = record('zero-base', [0, 0], { metrics: measuredTokens([0, 0]) });
  const positive = record('zero-candidate', [1, 1], { metrics: measuredTokens([1, 1]) });
  const report = compareBenchmarks(zero, positive);
  assert.equal(report.verdict, 'INDETERMINATE');
  assert.equal(report.metrics['M-LAT-01'].reasonCode, 'ZERO_DENOMINATOR');
  assert.equal(Object.hasOwn(report.metrics['M-LAT-01'], 'delta'), false);

  const subnormal = record('subnormal-base', [Number.MIN_VALUE, Number.MIN_VALUE]);
  const huge = record('huge-candidate', [1e308, 1e308]);
  const nonfinite = compareBenchmarks(subnormal, huge);
  assert.equal(nonfinite.verdict, 'INDETERMINATE');
  assert.equal(nonfinite.metrics['M-LAT-01'].reasonCode, 'DELTA_NONFINITE');
  assert.equal(Object.hasOwn(nonfinite.metrics['M-LAT-01'], 'delta'), false);
});

test('stale or missing WO-005/006/007 binding snapshots cannot produce an optimization claim', () => {
  const bindings = {
    executionCapsule: { used: true, id: 'capsule-a', digest: sha('2') },
    incrementalValidation: { used: true, id: 'candidate-a', digest: sha('3') },
    proofReuse: { used: true, id: 'candidate-a', digest: sha('4') },
  };
  const baseline = record('binding-base', [100, 101, 99], { accelerationBindings: bindings });
  const candidate = record('binding-candidate', [80, 81, 79], { accelerationBindings: bindings });
  assert.equal(compareBenchmarks(baseline, candidate).verdict, 'INDETERMINATE');

  const stale = {
    baseline: bindings,
    candidate: { ...bindings, incrementalValidation: { ...bindings.incrementalValidation, digest: sha('5') } },
  };
  const rejected = compareBenchmarks(baseline, candidate, { expectedAccelerationBindings: stale });
  assert.equal(rejected.verdict, 'INDETERMINATE');
  assert.equal(rejected.optimizationClaimEligible, false);
  assert.equal(rejected.reasonCode, 'ACCELERATION_BINDING_STALE_OR_UNVERIFIED');

  const verified = compareBenchmarks(baseline, candidate, { expectedAccelerationBindings: { baseline: bindings, candidate: bindings } });
  assert.equal(verified.verdict, 'IMPROVED');
});

test('reports redact prompt and secret payloads, remain read-only, and never suppress final assurance', () => {
  const baseline = record('readonly-base', [100, 101, 99]);
  const candidate = record('readonly-candidate', [100, 100, 100]);
  const report = compareBenchmarks(baseline, candidate);
  const serialized = JSON.stringify({ baseline, candidate, report });
  for (const forbidden of ['private prompt', 'private response', 'must not be copied', '/private/workspace/project', 'absolutePath']) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.equal(Object.isFrozen(report), true);
  assert.deepEqual(report.capabilities, {
    canWrite: false,
    canMerge: false,
    canPublish: false,
    canAcceptEvidence: false,
    canIssueAssurance: false,
    canSuppressFinalSweep: false,
  });
  assert.deepEqual(report.assurance, {
    baselineFinalSweepRequired: true,
    candidateFinalSweepRequired: true,
    finalSweepSuppressionAllowed: false,
  });

  const weakenedPolicy = record('readonly-weakened-policy', [80, 81, 79], { population: { P6: { finalSweepRequired: false } } });
  const mismatch = compareBenchmarks(baseline, weakenedPolicy);
  assert.equal(mismatch.verdict, 'INCOMPARABLE');
  assert.equal(mismatch.capabilities.canSuppressFinalSweep, false);
});

test('comparable populations can produce improved, no-change, and regression outcomes', () => {
  const baseline = record('verdict-base', [100, 101, 99]);
  assert.equal(compareBenchmarks(baseline, record('verdict-improved', [80, 81, 79])).verdict, 'IMPROVED');
  assert.equal(compareBenchmarks(baseline, record('verdict-no-change', [100, 101, 99])).verdict, 'NO_CHANGE');
  assert.equal(compareBenchmarks(baseline, record('verdict-regression', [130, 131, 129])).verdict, 'REGRESSION');
});

test('the recorded CLI ROI artifact verifies against its matched records without claiming improvement', () => {
  const artifact = JSON.parse(readFileSync(new URL('../.engineering/benchmarks/v1.1/cli-roi-result.json', import.meta.url), 'utf8'));
  const { sourceWorkspace, cli } = artifact.records;

  assert.equal(artifact.kind, 'GBS_V11_WO008_CLI_ROI_BENCHMARK');
  assert.equal(artifact.measuredAtCommit, cli.population.P3.commitSha);
  assert.equal(artifact.measuredTree, cli.population.P3.treeFingerprint);
  assert.equal(verifyPerformanceRecord(sourceWorkspace), true);
  assert.equal(verifyPerformanceRecord(cli), true);
  assert.deepEqual(compareCliRoi(sourceWorkspace, cli), artifact.report);
  assert.equal(sourceWorkspace.metrics['M-LAT-01'].summary.n, 7);
  assert.equal(cli.metrics['M-LAT-01'].summary.n, 7);
  assert.equal(sourceWorkspace.population.P8.timedRegion, cli.population.P8.timedRegion);
  assert.equal(artifact.tokens.source, 'UNAVAILABLE');
  assert.equal(artifact.report.verdict, 'NO_CHANGE');
  assert.equal(artifact.report.optimizationClaimEligible, false);
});
