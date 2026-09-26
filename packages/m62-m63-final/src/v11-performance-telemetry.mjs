import { digest, performanceRegression } from './index.mjs';
import { compareBenchmark } from '../../m41-m47-platform/src/index.mjs';
import { benchmarkSummary, performanceGate } from '../../m55-m61-quality/src/index.mjs';

/**
 * Pure V1.1 telemetry orchestration. Inputs are schema-shaped P1-P8 records;
 * measured numeric metrics use repeated samples, and absent token counts use
 * source UNAVAILABLE with a null value. The module performs no I/O or mutation.
 */
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9 ._:+-]{0,95}$/;
const SHA = /^(?:sha256:)?(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
const METRIC_ID = /^M-(?:LAT|CTX|VAL|RWK|OUT|TOK)-[0-9]{2}$/;
const METRIC_UNITS = new Set(['ms', 'count', 'bytes', 'ratio', 'tokens', 'enum']);
const POPULATION_KEYS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
const BINDING_KEYS = ['executionCapsule', 'incrementalValidation', 'proofReuse'];
const DEFAULT_REQUIRED_METRICS = ['M-LAT-01'];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, expected) {
  return isObject(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
}

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
}

function fail(state, reasonCode) {
  return { state, reasonCode };
}

function isDigest(value) {
  return typeof value === 'string' && SHA.test(value);
}

function token(value) {
  return typeof value === 'string' && TOKEN.test(value) ? value : null;
}

function metricDirection(id, unit) {
  if (unit === 'enum' || id === 'M-OUT-03') return 'INFORMATIONAL';
  if (id === 'M-OUT-01' || id === 'M-VAL-02' || id === 'M-VAL-03') return 'HIGHER_IS_BETTER';
  return 'LOWER_IS_BETTER';
}

function normalizePopulation(input) {
  if (!isObject(input)) return fail('INVALID', 'POPULATION_MISSING');
  const p1 = isObject(input.P1) ? token(input.P1.workloadKind) : null;
  const p2 = isObject(input.P2) ? [token(input.P2.workloadInstanceId), token(input.P2.fixtureId), input.P2.fixtureDigest] : null;
  const p3 = isObject(input.P3) ? [input.P3.commitSha, input.P3.treeFingerprint] : null;
  const p4 = isObject(input.P4) ? [token(input.P4.node), token(input.P4.npm), token(input.P4.packageManager), token(input.P4.typescript)] : null;
  const p5 = isObject(input.P5) ? [token(input.P5.os), token(input.P5.osVersion), token(input.P5.architecture)] : null;
  const p6 = isObject(input.P6) ? [input.P6.policyDigest, token(input.P6.ladder), input.P6.finalSweepRequired] : null;
  const p7 = isObject(input.P7) ? [token(input.P7.posture), input.P7.reuseSetDigest] : null;
  const p8 = isObject(input.P8) ? [token(input.P8.timedRegion), token(input.P8.startEvent), token(input.P8.endEvent)] : null;

  if (!p1 || !p1.length) return fail('INVALID', 'POPULATION_P1_INVALID');
  if (!p2 || p2.some(value => !value) || !ID.test(p2[0]) || !ID.test(p2[1]) || !isDigest(p2[2])) return fail('INVALID', 'POPULATION_P2_INVALID');
  if (!p3 || !isDigest(p3[0]) || !isDigest(p3[1])) return fail('INVALID', 'POPULATION_P3_INVALID');
  if (!p4 || p4.some(value => !value)) return fail('INVALID', 'POPULATION_P4_INVALID');
  if (!p5 || p5.some(value => !value)) return fail('INVALID', 'POPULATION_P5_INVALID');
  if (!p6 || !isDigest(p6[0]) || !p6[1] || typeof p6[2] !== 'boolean') return fail('INVALID', 'POPULATION_P6_INVALID');
  if (!p7 || !['COLD', 'WARM'].includes(p7[0])) return fail('INVALID', 'POPULATION_P7_INVALID');
  if (p7[0] === 'COLD' && p7[1] !== 'none') return fail('INVALID', 'COLD_REUSE_SET_MUST_BE_EMPTY');
  if (p7[0] === 'WARM' && !isDigest(p7[1])) return fail('INVALID', 'WARM_REUSE_SET_DIGEST_REQUIRED');
  if (!p8 || p8.some(value => !value)) return fail('INVALID', 'POPULATION_P8_INVALID');

  return {
    state: 'VALID',
    value: {
      P1: { workloadKind: p1 },
      P2: { workloadInstanceId: p2[0], fixtureId: p2[1], fixtureDigest: p2[2] },
      P3: { commitSha: p3[0], treeFingerprint: p3[1] },
      P4: { node: p4[0], npm: p4[1], packageManager: p4[2], typescript: p4[3] },
      P5: { os: p5[0], osVersion: p5[1], architecture: p5[2] },
      P6: { policyDigest: p6[0], ladder: p6[1], finalSweepRequired: p6[2] },
      P7: { posture: p7[0], reuseSetDigest: p7[1] },
      P8: { timedRegion: p8[0], startEvent: p8[1], endEvent: p8[2] },
    },
  };
}

function normalizeMetric(id, input) {
  if (!METRIC_ID.test(id) || !isObject(input) || !METRIC_UNITS.has(input.unit)) return fail('INVALID', 'METRIC_SHAPE_INVALID');
  if (!['MEASURED', 'ESTIMATED', 'UNAVAILABLE'].includes(input.source)) return fail('INVALID', 'METRIC_SOURCE_INVALID');
  const direction = metricDirection(id, input.unit);

  if (input.source === 'UNAVAILABLE') {
    if (input.value !== undefined && input.value !== null) return fail('INVALID', 'UNAVAILABLE_METRIC_HAS_VALUE');
    if (input.samples !== undefined) return fail('INVALID', 'UNAVAILABLE_METRIC_HAS_SAMPLES');
    return { state: 'VALID', value: { value: null, unit: input.unit, source: 'UNAVAILABLE', direction, summary: null } };
  }

  if (input.unit === 'enum') {
    if (input.samples !== undefined || typeof input.value !== 'string' || !ID.test(input.value)) return fail('INVALID', 'ENUM_METRIC_INVALID');
    return { state: 'VALID', value: { value: input.value, unit: input.unit, source: input.source, direction, summary: null } };
  }

  if (input.source === 'MEASURED' && input.samples !== undefined) {
    if (!Array.isArray(input.samples) || input.samples.length === 0 || input.samples.some(value => !Number.isFinite(value) || value < 0)) {
      return fail('INVALID', 'SAMPLE_INVALID');
    }
    const summary = benchmarkSummary(input.samples);
    if (summary.verdict === 'INSUFFICIENT_DATA') return fail('INVALID', 'SAMPLE_INVALID');
    if (input.value !== undefined && input.value !== summary.median) return fail('INVALID', 'METRIC_VALUE_DOES_NOT_MATCH_MEDIAN');
    return { state: 'VALID', value: { value: summary.median, unit: input.unit, source: input.source, direction, summary } };
  }

  if (input.source === 'ESTIMATED' && input.samples !== undefined) return fail('INVALID', 'ESTIMATED_METRIC_HAS_SAMPLES');

  if (!Number.isFinite(input.value) || input.value < 0) return fail('INVALID', 'METRIC_VALUE_INVALID');
  const summary = input.source === 'MEASURED' ? benchmarkSummary([input.value]) : null;
  return { state: 'VALID', value: { value: input.value, unit: input.unit, source: input.source, direction, summary } };
}

function normalizeMetrics(input) {
  if (!isObject(input) || Object.keys(input).length === 0) return fail('INVALID', 'METRICS_MISSING');
  const normalized = {};
  for (const id of Object.keys(input).sort()) {
    const result = normalizeMetric(id, input[id]);
    if (result.state !== 'VALID') return result;
    normalized[id] = result.value;
  }
  return { state: 'VALID', value: normalized };
}

function normalizeRequiredMetrics(input) {
  const values = input === undefined ? DEFAULT_REQUIRED_METRICS : input;
  if (!Array.isArray(values) || values.length === 0 || values.some(id => typeof id !== 'string' || !METRIC_ID.test(id))) return null;
  return [...new Set(values)].sort();
}

function normalizeQualityGate(input) {
  if (input === undefined || input === null) return { status: 'UNKNOWN', digest: null };
  if (!isObject(input) || !['PASS', 'FAIL', 'UNKNOWN'].includes(input.status)) return null;
  if (input.status === 'UNKNOWN') return { status: 'UNKNOWN', digest: isDigest(input.digest) ? input.digest : null };
  if (!isDigest(input.digest)) return null;
  return { status: input.status, digest: input.digest };
}

function normalizeBinding(input) {
  if (input === undefined || input === null || input.used === false) return { used: false, id: null, digest: null };
  if (!isObject(input) || input.used !== true || !ID.test(input.id ?? '') || !isDigest(input.digest)) return null;
  return { used: true, id: input.id, digest: input.digest };
}

function normalizeBindings(input) {
  if (input !== undefined && input !== null && !isObject(input)) return null;
  const source = input ?? {};
  const normalized = {};
  for (const key of BINDING_KEYS) {
    const binding = normalizeBinding(source[key]);
    if (!binding) return null;
    normalized[key] = binding;
  }
  return normalized;
}

function recordBody(record) {
  const { digest: ignored, ...body } = record;
  return body;
}

/** Sanitize and fingerprint one benchmark observation without retaining free-form payloads. */
export function capturePerformanceRecord(input) {
  if (!isObject(input) || !ID.test(input.recordId ?? '')) return fail('INVALID', 'RECORD_ID_REQUIRED');
  const population = normalizePopulation(input.population);
  if (population.state !== 'VALID') return population;
  const metrics = normalizeMetrics(input.metrics);
  if (metrics.state !== 'VALID') return metrics;
  const requiredMetricIds = normalizeRequiredMetrics(input.requiredMetricIds);
  if (!requiredMetricIds) return fail('INVALID', 'REQUIRED_METRIC_IDS_INVALID');
  const qualityGate = normalizeQualityGate(input.qualityGate);
  if (!qualityGate) return fail('INVALID', 'QUALITY_GATE_INVALID');
  const accelerationBindings = normalizeBindings(input.accelerationBindings);
  if (!accelerationBindings) return fail('INVALID', 'ACCELERATION_BINDINGS_INVALID');
  const executionMode = input.executionMode ?? 'CLI';
  if (!['CLI', 'SOURCE_WORKSPACE_MANUAL'].includes(executionMode)) return fail('INVALID', 'EXECUTION_MODE_INVALID');

  const body = {
    schemaVersion: 1,
    kind: 'PERFORMANCE_RECORD',
    recordId: input.recordId,
    executionMode,
    population: population.value,
    populationDigest: digest('GBS-V11-TELEM-POPULATION', population.value),
    requiredMetricIds,
    metrics: metrics.value,
    qualityGate,
    accelerationBindings,
    authority: 'READ_ONLY_TELEMETRY',
  };
  const record = freezeDeep({ ...body, digest: digest('GBS-V11-TELEM-RECORD', body) });
  return { state: 'CAPTURED', record };
}

export function verifyPerformanceRecord(record) {
  if (!isObject(record) || record.kind !== 'PERFORMANCE_RECORD' || !isDigest(record.digest)) return false;
  if (!exactKeys(record, ['schemaVersion', 'kind', 'recordId', 'executionMode', 'population', 'populationDigest', 'requiredMetricIds', 'metrics', 'qualityGate', 'accelerationBindings', 'authority', 'digest'])) return false;
  if (record.schemaVersion !== 1 || !ID.test(record.recordId ?? '') || !['CLI', 'SOURCE_WORKSPACE_MANUAL'].includes(record.executionMode)) return false;
  if (record.authority !== 'READ_ONLY_TELEMETRY' || !isDigest(record.populationDigest)) return false;
  const population = normalizePopulation(record.population);
  if (population.state !== 'VALID' || digest('GBS-V11-TELEM-POPULATION', population.value) !== record.populationDigest || digest('GBS-V11-TELEM-POPULATION', population.value) !== digest('GBS-V11-TELEM-POPULATION', record.population)) return false;
  const required = normalizeRequiredMetrics(record.requiredMetricIds);
  if (!required || JSON.stringify(required) !== JSON.stringify(record.requiredMetricIds)) return false;
  const qualityGate = normalizeQualityGate(record.qualityGate);
  if (!qualityGate || digest('GBS-V11-TELEM-QUALITY', qualityGate) !== digest('GBS-V11-TELEM-QUALITY', record.qualityGate)) return false;
  const bindings = normalizeBindings(record.accelerationBindings);
  if (!bindings || digest('GBS-V11-TELEM-BINDINGS', bindings) !== digest('GBS-V11-TELEM-BINDINGS', record.accelerationBindings)) return false;
  if (!isObject(record.metrics) || Object.keys(record.metrics).length === 0) return false;
  for (const [id, metric] of Object.entries(record.metrics)) {
    if (!METRIC_ID.test(id) || !exactKeys(metric, ['value', 'unit', 'source', 'direction', 'summary']) || !METRIC_UNITS.has(metric.unit) || metric.direction !== metricDirection(id, metric.unit)) return false;
    if (!['MEASURED', 'ESTIMATED', 'UNAVAILABLE'].includes(metric.source)) return false;
    if (metric.source === 'UNAVAILABLE') {
      if (metric.value !== null || metric.summary !== null) return false;
      continue;
    }
    if (metric.unit === 'enum') {
      if (typeof metric.value !== 'string' || !ID.test(metric.value) || metric.summary !== null) return false;
      continue;
    }
    if (!Number.isFinite(metric.value) || metric.value < 0) return false;
    if (metric.source === 'ESTIMATED') {
      if (metric.summary !== null) return false;
      continue;
    }
    if (!exactKeys(metric.summary, ['n', 'median', 'p90', 'p95', 'min', 'max'])) return false;
    const summaryValues = [metric.summary.median, metric.summary.p90, metric.summary.p95, metric.summary.min, metric.summary.max];
    if (!Number.isInteger(metric.summary.n) || metric.summary.n < 1 || summaryValues.some(value => !Number.isFinite(value) || value < 0)) return false;
    if (metric.value !== metric.summary.median || metric.summary.min > metric.summary.median || metric.summary.median > metric.summary.max || metric.summary.min > metric.summary.p90 || metric.summary.p90 > metric.summary.max || metric.summary.min > metric.summary.p95 || metric.summary.p95 > metric.summary.max) return false;
    if (metric.summary.p90 > metric.summary.p95) return false;
  }
  return digest('GBS-V11-TELEM-RECORD', recordBody(record)) === record.digest;
}

function baselineBody(baseline) {
  const { digest: ignored, ...body } = baseline;
  return body;
}

export function verifyBaseline(baseline) {
  if (!isObject(baseline) || baseline.kind !== 'IMMUTABLE_BASELINE' || !isDigest(baseline.digest)) return false;
  if (!exactKeys(baseline, ['schemaVersion', 'kind', 'baselineId', 'parentBaselineId', 'lineageIds', 'sourceRecordDigest', 'record', 'authority', 'digest'])) return false;
  if (baseline.schemaVersion !== 1 || !ID.test(baseline.baselineId ?? '') || baseline.authority !== 'READ_ONLY_TELEMETRY') return false;
  if (!verifyPerformanceRecord(baseline.record) || baseline.record.digest !== baseline.sourceRecordDigest) return false;
  if (!Array.isArray(baseline.lineageIds) || baseline.lineageIds.some(id => typeof id !== 'string' || !ID.test(id)) || new Set(baseline.lineageIds).size !== baseline.lineageIds.length) return false;
  if (baseline.lineageIds.includes(baseline.baselineId) || (baseline.parentBaselineId === null && baseline.lineageIds.length > 0)) return false;
  if (baseline.parentBaselineId !== null && baseline.lineageIds.at(-1) !== baseline.parentBaselineId) return false;
  return digest('GBS-V11-TELEM-BASELINE', baselineBody(baseline)) === baseline.digest;
}

function verifyBaselineRegistry(registry) {
  if (!Array.isArray(registry)) return false;
  const byId = new Map();
  for (const baseline of registry) {
    if (!verifyBaseline(baseline) || byId.has(baseline.baselineId)) return false;
    byId.set(baseline.baselineId, baseline);
  }
  for (const baseline of registry) {
    if (baseline.parentBaselineId === null) {
      if (baseline.lineageIds.length !== 0) return false;
      continue;
    }
    const parent = byId.get(baseline.parentBaselineId);
    if (!parent
      || parent.record.populationDigest !== baseline.record.populationDigest
      || JSON.stringify(baseline.lineageIds) !== JSON.stringify([...parent.lineageIds, parent.baselineId])) return false;
  }
  return true;
}

/** Append an immutable baseline snapshot; recaptures of the same population require a parent ID. */
export function captureBaseline(existingBaselines, input) {
  if (!Array.isArray(existingBaselines) || !isObject(input) || !ID.test(input.baselineId ?? '')) return fail('INVALID', 'BASELINE_INPUT_INVALID');
  if (!verifyBaselineRegistry(existingBaselines)) return fail('INVALID', 'BASELINE_REGISTRY_INVALID');
  if (existingBaselines.some(item => item.baselineId === input.baselineId)) return fail('INVALID', 'BASELINE_ID_ALREADY_EXISTS');
  const recordResult = capturePerformanceRecord(input.recordInput);
  if (recordResult.state !== 'CAPTURED') return recordResult;

  const samePopulation = existingBaselines.filter(item => item.record.populationDigest === recordResult.record.populationDigest);
  const parentBaselineId = input.parentBaselineId ?? null;
  if (samePopulation.length > 0 && !parentBaselineId) return fail('INVALID', 'BASELINE_LINEAGE_REQUIRED');
  if (parentBaselineId !== null && !existingBaselines.some(item => item.baselineId === parentBaselineId)) return fail('INVALID', 'BASELINE_PARENT_NOT_FOUND');
  const parent = parentBaselineId === null ? null : existingBaselines.find(item => item.baselineId === parentBaselineId);
  if (parent && parent.record.populationDigest !== recordResult.record.populationDigest) return fail('INVALID', 'BASELINE_PARENT_POPULATION_MISMATCH');

  const baselinePayload = {
    schemaVersion: 1,
    kind: 'IMMUTABLE_BASELINE',
    baselineId: input.baselineId,
    parentBaselineId,
    lineageIds: parent ? [...parent.lineageIds, parent.baselineId] : [],
    sourceRecordDigest: recordResult.record.digest,
    record: recordResult.record,
    authority: 'READ_ONLY_TELEMETRY',
  };
  const baseline = freezeDeep({ ...baselinePayload, digest: digest('GBS-V11-TELEM-BASELINE', baselinePayload) });
  const retained = existingBaselines.map(item => freezeDeep(JSON.parse(JSON.stringify(item))));
  return { state: 'CAPTURED', baseline, registry: freezeDeep([...retained, baseline]) };
}

function unwrapRecord(value) {
  if (value?.kind === 'IMMUTABLE_BASELINE') return verifyBaseline(value) ? value.record : null;
  return verifyPerformanceRecord(value) ? value : null;
}

function expectedBindingsMatch(recordBindings, expected) {
  if (expected === undefined || expected === null) return BINDING_KEYS.every(key => !recordBindings[key].used);
  const normalized = normalizeBindings(expected);
  if (!normalized) return false;
  return BINDING_KEYS.every(key => JSON.stringify(recordBindings[key]) === JSON.stringify(normalized[key]));
}

function finalReport(body) {
  const { reportDigest: ignored, ...payload } = body;
  return freezeDeep({ ...payload, reportDigest: digest('GBS-V11-TELEM-REPORT', payload) });
}

function baseReport(mode, verdict, reasonCode, extra = {}) {
  return finalReport({
    schemaVersion: 1,
    kind: 'PERFORMANCE_COMPARISON',
    mode,
    verdict,
    optimizationClaimEligible: false,
    reasonCode,
    metrics: {},
    capabilities: {
      canWrite: false,
      canMerge: false,
      canPublish: false,
      canAcceptEvidence: false,
      canIssueAssurance: false,
      canSuppressFinalSweep: false,
    },
    ...extra,
  });
}

function compareCore(baselineInput, candidateInput, options = {}, mode = 'BENCHMARK') {
  const baseline = unwrapRecord(baselineInput);
  const candidate = unwrapRecord(candidateInput);
  if (!baseline || !candidate) return baseReport(mode, 'INDETERMINATE', 'RECORD_INTEGRITY_INVALID');

  const mismatches = POPULATION_KEYS.filter(key => digest('GBS-V11-TELEM-DIMENSION', baseline.population[key]) !== digest('GBS-V11-TELEM-DIMENSION', candidate.population[key]));
  if (mismatches.length > 0) {
    return baseReport(mode, 'INCOMPARABLE', 'POPULATION_MISMATCH', {
      baselinePopulationDigest: baseline.populationDigest,
      candidatePopulationDigest: candidate.populationDigest,
      populationMismatchDimensions: mismatches,
      executionModes: { baseline: baseline.executionMode, candidate: candidate.executionMode },
    });
  }

  const expected = options.expectedAccelerationBindings ?? {};
  if (!expectedBindingsMatch(baseline.accelerationBindings, expected.baseline) || !expectedBindingsMatch(candidate.accelerationBindings, expected.candidate)) {
    return baseReport(mode, 'INDETERMINATE', 'ACCELERATION_BINDING_STALE_OR_UNVERIFIED', {
      baselinePopulationDigest: baseline.populationDigest,
      candidatePopulationDigest: candidate.populationDigest,
      accelerationBindings: { baseline: baseline.accelerationBindings, candidate: candidate.accelerationBindings },
    });
  }

  const required = normalizeRequiredMetrics(options.requiredMetricIds ?? baseline.requiredMetricIds);
  if (!required || JSON.stringify(required) !== JSON.stringify(baseline.requiredMetricIds) || JSON.stringify(required) !== JSON.stringify(candidate.requiredMetricIds)) {
    return baseReport(mode, 'INDETERMINATE', 'REQUIRED_METRIC_POLICY_MISMATCH', {
      baselinePopulationDigest: baseline.populationDigest,
      candidatePopulationDigest: candidate.populationDigest,
    });
  }

  const requiredMissing = required.filter(id => !baseline.metrics[id] || !candidate.metrics[id] || baseline.metrics[id].source !== 'MEASURED' || candidate.metrics[id].source !== 'MEASURED' || baseline.metrics[id].summary?.n < 2 || candidate.metrics[id].summary?.n < 2);
  if (requiredMissing.length > 0) {
    return baseReport(mode, 'INDETERMINATE', 'REQUIRED_METRIC_MISSING_OR_NOT_REPEATED', {
      baselinePopulationDigest: baseline.populationDigest,
      candidatePopulationDigest: candidate.populationDigest,
      requiredMetricIds: required,
      missingOrInsufficientMetricIds: requiredMissing,
      qualityGate: { baseline: baseline.qualityGate.status, candidate: candidate.qualityGate.status },
    });
  }

  const tolerance = options.tolerance ?? 0.15;
  const metricTolerance = options.metricTolerance ?? 0.02;
  if (![tolerance, metricTolerance].every(value => Number.isFinite(value) && value >= 0 && value < 1)) return baseReport(mode, 'INDETERMINATE', 'TOLERANCE_INVALID');
  const ids = [...new Set([...Object.keys(baseline.metrics), ...Object.keys(candidate.metrics)])].sort();
  const metrics = {};
  let anyImprovement = false;
  let anyRegression = false;
  let anyMeasured = false;
  const requiredSet = new Set(required);

  for (const id of ids) {
    const before = baseline.metrics[id];
    const after = candidate.metrics[id];
    if (!before || !after || before.source === 'UNAVAILABLE' || after.source === 'UNAVAILABLE' || before.source !== 'MEASURED' || after.source !== 'MEASURED') {
      metrics[id] = { verdict: 'INDETERMINATE', unit: before?.unit ?? after?.unit ?? null, source: before?.source ?? after?.source ?? 'UNAVAILABLE' };
      continue;
    }
    if (before.unit !== after.unit || before.direction !== after.direction) {
      metrics[id] = { verdict: 'INCOMPARABLE', unit: before.unit, source: 'MEASURED' };
      continue;
    }
    if (before.unit === 'enum' || before.direction === 'INFORMATIONAL') {
      metrics[id] = { verdict: before.value === after.value ? 'NO_CHANGE' : 'INDETERMINATE', unit: before.unit, source: 'MEASURED' };
      continue;
    }
    if (before.summary?.n < 2 || after.summary?.n < 2) {
      metrics[id] = { verdict: 'INDETERMINATE', unit: before.unit, source: 'MEASURED' };
      continue;
    }
    if ((before.value === 0) !== (after.value === 0)) {
      metrics[id] = { verdict: 'INDETERMINATE', unit: before.unit, source: 'MEASURED', reasonCode: before.value === 0 ? 'ZERO_DENOMINATOR' : 'ZERO_CANDIDATE_VALUE' };
      continue;
    }

    const delta = before.value === 0 ? 0 : (after.value - before.value) / before.value;
    if (!Number.isFinite(delta)) {
      metrics[id] = { verdict: 'INDETERMINATE', unit: before.unit, source: 'MEASURED', reasonCode: 'DELTA_NONFINITE' };
      continue;
    }
    const threshold = id === 'M-LAT-01' ? tolerance : metricTolerance;
    let verdict;
    if (id === 'M-LAT-01' && before.value > 0 && after.value > 0) {
      const gate = performanceGate(
        { population: baseline.populationDigest, median: before.value },
        { population: candidate.populationDigest, median: after.value },
        threshold,
      );
      verdict = gate.verdict === 'REGRESSION' ? 'REGRESSION' : gate.verdict === 'IMPROVEMENT' ? 'IMPROVED' : gate.verdict === 'PASS' ? 'NO_CHANGE' : 'INDETERMINATE';
    } else if (Math.abs(delta) <= threshold) {
      verdict = 'NO_CHANGE';
    } else if (before.direction === 'LOWER_IS_BETTER') {
      verdict = delta < 0 ? 'IMPROVED' : 'REGRESSION';
    } else {
      verdict = delta > 0 ? 'IMPROVED' : 'REGRESSION';
    }
    anyMeasured = true;
    anyImprovement ||= verdict === 'IMPROVED';
    anyRegression ||= verdict === 'REGRESSION';
    metrics[id] = {
      verdict,
      unit: before.unit,
      direction: before.direction,
      source: 'MEASURED',
      baseline: { value: before.value, summary: before.summary },
      candidate: { value: after.value, summary: after.summary },
      delta,
    };
  }

  const qualityFailed = baseline.qualityGate.status === 'FAIL' || candidate.qualityGate.status === 'FAIL';
  const qualityUnknown = baseline.qualityGate.status !== 'PASS' || candidate.qualityGate.status !== 'PASS';
  const requiredIndeterminate = required.some(id => metrics[id]?.verdict === 'INDETERMINATE' || metrics[id]?.verdict === 'INCOMPARABLE');
  const verdict = qualityFailed ? 'REGRESSION' : qualityUnknown || requiredIndeterminate || !anyMeasured ? 'INDETERMINATE' : anyRegression ? 'REGRESSION' : anyImprovement ? 'IMPROVED' : 'NO_CHANGE';
  const latency = metrics['M-LAT-01'];
  const tokenBefore = baseline.metrics['M-TOK-03'];
  const tokenAfter = candidate.metrics['M-TOK-03'];
  let m63Regression = { state: 'NOT_APPLICABLE' };
  if (latency?.source === 'MEASURED' && latency.baseline?.value > 0 && latency.candidate?.value > 0 && tokenBefore?.source === 'MEASURED' && tokenAfter?.source === 'MEASURED' && tokenBefore.value > 0 && tokenBefore.summary?.n >= 2 && tokenAfter.summary?.n >= 2) {
    m63Regression = performanceRegression(
      { population: baseline.populationDigest, latencyMs: latency.baseline.value, tokens: tokenBefore.value },
      { population: candidate.populationDigest, latencyMs: latency.candidate.value, tokens: tokenAfter.value },
    );
    if (m63Regression.verdict === 'REGRESSION' && verdict === 'IMPROVED') anyRegression = true;
  }
  const finalVerdict = qualityFailed || anyRegression ? 'REGRESSION' : verdict;
  const eligible = finalVerdict === 'IMPROVED' && !qualityUnknown && !requiredIndeterminate;

  return finalReport({
    schemaVersion: 1,
    kind: 'PERFORMANCE_COMPARISON',
    mode,
    verdict: finalVerdict,
    optimizationClaimEligible: eligible,
    reasonCode: qualityFailed ? 'QUALITY_GATE_FAILED' : qualityUnknown ? 'QUALITY_GATE_NOT_PASS' : requiredIndeterminate ? 'REQUIRED_METRIC_NOT_COMPARABLE' : 'COMPARABLE',
    baselinePopulationDigest: baseline.populationDigest,
    candidatePopulationDigest: candidate.populationDigest,
    populationMismatchDimensions: [],
    requiredMetricIds: required,
    metrics,
    qualityGate: { baseline: baseline.qualityGate.status, candidate: candidate.qualityGate.status },
    accelerationBindings: { baseline: baseline.accelerationBindings, candidate: candidate.accelerationBindings },
    assurance: {
      baselineFinalSweepRequired: baseline.population.P6.finalSweepRequired,
      candidateFinalSweepRequired: candidate.population.P6.finalSweepRequired,
      finalSweepSuppressionAllowed: false,
    },
    primitives: { m57PerformanceGateUsedForLatency: Boolean(metrics['M-LAT-01']?.delta !== undefined), m63PerformanceRegression: m63Regression },
    executionModes: { baseline: baseline.executionMode, candidate: candidate.executionMode },
    capabilities: {
      canWrite: false,
      canMerge: false,
      canPublish: false,
      canAcceptEvidence: false,
      canIssueAssurance: false,
      canSuppressFinalSweep: false,
    },
  });
}

/** Compare exact P1-P8 matches. Used acceleration bindings require current expected snapshots. */
export function compareBenchmarks(baseline, candidate, options = {}) {
  return compareCore(baseline, candidate, options, 'BENCHMARK');
}

/** Compare one source-workspace/manual run with one CLI run under the same P1-P8 population. */
export function compareCliRoi(sourceWorkspaceRecord, cliRecord, options = {}) {
  const manual = unwrapRecord(sourceWorkspaceRecord);
  const cli = unwrapRecord(cliRecord);
  if (!manual || !cli) return baseReport('CLI_ROI', 'INDETERMINATE', 'RECORD_INTEGRITY_INVALID');
  if (manual.executionMode !== 'SOURCE_WORKSPACE_MANUAL' || cli.executionMode !== 'CLI') {
    return baseReport('CLI_ROI', 'INCOMPARABLE', 'CLI_ROI_EXECUTION_MODE_MISMATCH', {
      executionModes: { baseline: manual.executionMode, candidate: cli.executionMode },
    });
  }

  const report = compareCore(sourceWorkspaceRecord, cliRecord, options, 'CLI_ROI');
  if (report.verdict === 'INCOMPARABLE' || report.verdict === 'INDETERMINATE' || !report.metrics['M-LAT-01']?.delta && report.metrics['M-LAT-01']?.delta !== 0) {
    return finalReport({ ...report, kind: 'CLI_ROI_REPORT', roi: { verdict: report.verdict, metricId: 'M-LAT-01', deltaAvailable: false } });
  }

  const latencyBefore = manual.metrics['M-LAT-01'];
  const latencyAfter = cli.metrics['M-LAT-01'];
  const workload = digest('GBS-V11-CLI-ROI-WORKLOAD', { P1: manual.population.P1, P2: manual.population.P2, P3: manual.population.P3 });
  const assurance = digest('GBS-V11-CLI-ROI-ASSURANCE', manual.population.P6);
  const environment = digest('GBS-V11-CLI-ROI-ENVIRONMENT', { P4: manual.population.P4, P5: manual.population.P5, P8: manual.population.P8 });
  const m41 = compareBenchmark(
    { workload, assurance, environment, value: latencyBefore.value },
    { workload, assurance, environment, value: latencyAfter.value },
  );
  const roi = {
    verdict: report.verdict,
    metricId: 'M-LAT-01',
    sourceWorkspaceMedian: latencyBefore.value,
    cliMedian: latencyAfter.value,
    latencyDeltaPercent: report.metrics['M-LAT-01'].delta * 100,
    m41ComparisonState: m41.state,
  };
  return finalReport({ ...report, kind: 'CLI_ROI_REPORT', roi, primitives: { ...report.primitives, m41CompareBenchmarkState: m41.state } });
}
