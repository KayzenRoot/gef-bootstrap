// GBS-MOD-WO-001 — baseline and post-change check fan-out benchmark.
//
// Acceptance: A12. The frozen Test & Benchmark Plan forbids a percentage saving claim without
// measured evidence, so this suite measures exactly one reproducible quantity — which workflow
// files the repository's own committed `pull_request` triggers would select for a fixture's
// changed paths — and records it beside the `GEF Gate` decision for the same fixture.
//
// It deliberately records no wall-clock claim: CI duration is not reproducible from a test, and
// asserting one would be a fabricated measurement.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROVIDER_CANDIDATE_CHECKS, routeCandidate } from './helpers/gbs-mod-wo-001-routing.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW_ROOT = resolve(ROOT, '.github/workflows');

/** The implementation base this baseline was recorded against. */
export const BASELINE_IMPLEMENTATION_BASE = '921493797728a43aadc9f7840c954ce7e3ebc416';

/**
 * `pull_request` trigger definitions as committed at the implementation base.
 *
 * Recorded as literals rather than re-read from Git so the baseline keeps its meaning after the
 * routing change lands — that is what makes it a baseline and not a mirror.
 */
export const BASELINE_UNCONDITIONAL_WORKFLOWS = Object.freeze([
  '.github/workflows/dependency-review.yml',
  '.github/workflows/free-security-pilot.yml',
  '.github/workflows/pipeline-integrity.yml',
  '.github/workflows/repository-validation.yml',
  '.github/workflows/v11-release-assurance.yml',
]);

/**
 * `paths:`-filtered workflows, with the check-run count each one contributes.
 *
 * `checks` is counted from the committed job definitions at the implementation base: a job with an
 * OS matrix contributes one check run per matrix entry.
 */
export const BASELINE_PATH_FILTERED_WORKFLOWS = Object.freeze([
  { workflow: '.github/workflows/m41-m47-integrated.yml', paths: ['.engineering/**'], checks: 2 },
  { workflow: '.github/workflows/m48-m54-integrated.yml', paths: ['.engineering/**'], checks: 2 },
  { workflow: '.github/workflows/m55-m61-integrated.yml', paths: ['.engineering/**'], checks: 2 },
  { workflow: '.github/workflows/m62-m63-final.yml', paths: ['.engineering/**'], checks: 2 },
  { workflow: '.github/workflows/coverage-codecov.yml', paths: ['packages/**', 'tests/**'], checks: 1 },
  { workflow: '.github/workflows/security-codeql.yml', paths: ['packages/**/*.ts', 'tests/**/*.mjs'], checks: 1 },
  { workflow: '.github/workflows/m01-validation.yml', paths: ['packages/contracts/**', 'tests/*.test.mjs', 'package.json'], checks: 1 },
  { workflow: '.github/workflows/m14-platform.yml', paths: ['packages/task-context-compiler/**', 'tests/m14-*.mjs'], checks: 4 },
  { workflow: '.github/workflows/m27-platform.yml', paths: ['packages/assurance-pipeline/**', 'tests/m27-*.mjs'], checks: 4 },
  { workflow: '.github/workflows/m28-platform.yml', paths: ['packages/test-impact-engine/**', 'tests/m28-*.mjs'], checks: 4 },
  { workflow: '.github/workflows/wo-005-execution-capsule.yml', paths: ['packages/task-context-compiler/**'], checks: 3 },
  { workflow: '.github/workflows/wo-006-incremental-validation.yml', paths: ['packages/test-impact-engine/**'], checks: 3 },
  { workflow: '.github/workflows/wo-007-proof-reuse.yml', paths: ['packages/test-impact-engine/**'], checks: 3 },
]);

/**
 * Check runs contributed by the unconditional workflows, counted from their committed job
 * definitions at the implementation base (including OS matrix expansion).
 */
export const BASELINE_UNCONDITIONAL_JOB_FAN_OUT = 15;

/**
 * The baseline under-counts on purpose: it counts only check runs selected by a committed trigger
 * definition on the `pull_request` event. Provider-side reports with no committed workflow in this
 * repository (SonarCloud, Socket, CodeRabbit) are outside its scope and are therefore absent here.
 */
export const BASELINE_MODEL_SCOPE =
  'committed pull_request trigger definitions only; provider-side reports without a committed workflow are out of scope';

export const BENCHMARK_FIXTURES = Object.freeze([
  {
    id: 'GBS-MOD-WO-001-BENCH-GOVERNANCE',
    class: 'GOVERNANCE_ONLY',
    changedPaths: Object.freeze([
      '.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md',
      '.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md',
    ]),
    facts: Object.freeze({ declaredRisk: 'LOW' }),
  },
  {
    id: 'GBS-MOD-WO-001-BENCH-GOVERNANCE-DECLARED-ELEVATED',
    class: 'GOVERNANCE_ONLY_DECLARED_ELEVATED',
    changedPaths: Object.freeze([
      '.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md',
      '.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md',
    ]),
    facts: Object.freeze({ declaredRisk: 'ELEVATED' }),
  },
  {
    id: 'GBS-MOD-WO-001-BENCH-GOVERNANCE-DECLARED-HIGH-ASSURANCE',
    class: 'GOVERNANCE_ONLY_DECLARED_HIGH_ASSURANCE',
    changedPaths: Object.freeze([
      '.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md',
      '.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md',
    ]),
    facts: Object.freeze({ declaredRisk: 'HIGH_ASSURANCE' }),
  },
  {
    id: 'GBS-MOD-WO-001-BENCH-CODE',
    class: 'PRODUCT_CODE',
    changedPaths: Object.freeze([
      'packages/contracts/src/work-order.ts',
      'packages/preflight/src/change-impact.ts',
      'packages/task-context-compiler/src/s07-tiered-context-lock.ts',
      'packages/test-impact-engine/src/gate-closure.ts',
      'packages/assurance-pipeline/src/gef-gate.ts',
      'tests/gbs-mod-wo-001-routing.test.mjs',
    ]),
    facts: Object.freeze({ declaredRisk: 'STANDARD' }),
  },
]);

function matchesFrom(segments, patternIndex, candidate, candidateIndex) {
  if (patternIndex === segments.length) return candidateIndex === candidate.length;
  const segment = segments[patternIndex];
  if (segment === '**') {
    if (patternIndex === segments.length - 1) return true;
    for (let next = candidateIndex; next <= candidate.length; next += 1) {
      if (matchesFrom(segments, patternIndex + 1, candidate, next)) return true;
    }
    return false;
  }
  if (candidateIndex >= candidate.length) return false;
  if (segment !== '*' && segment !== candidate[candidateIndex]) return false;
  return matchesFrom(segments, patternIndex + 1, candidate, candidateIndex + 1);
}

function matchesPathPattern(path, pattern) {
  return matchesFrom(pattern.split('/'), 0, path.split('/'), 0);
}

/** Selects the workflow files the committed `pull_request` triggers would run for a path set. */
export function selectBaselineWorkflows(changedPaths) {
  const selected = new Set(BASELINE_UNCONDITIONAL_WORKFLOWS);
  for (const entry of BASELINE_PATH_FILTERED_WORKFLOWS) {
    if (changedPaths.some((path) => entry.paths.some((pattern) => matchesPathPattern(path, pattern)))) {
      selected.add(entry.workflow);
    }
  }
  return [...selected].sort();
}

export function baselineJobFanOut(changedPaths) {
  let total = BASELINE_UNCONDITIONAL_JOB_FAN_OUT;
  for (const entry of BASELINE_PATH_FILTERED_WORKFLOWS) {
    if (changedPaths.some((path) => entry.paths.some((pattern) => matchesPathPattern(path, pattern)))) total += entry.checks;
  }
  return total;
}

export function measure(fixture) {
  const workflows = selectBaselineWorkflows(fixture.changedPaths);
  const routed = routeCandidate(fixture.changedPaths, { facts: fixture.facts });
  assert.equal(routed.gate.ok, true, `${fixture.id} must produce a gate receipt`);
  const receipt = routed.gate.value;
  return {
    id: fixture.id,
    class: fixture.class,
    changedPathCount: fixture.changedPaths.length,
    baselineSelectedWorkflows: workflows.length,
    baselineJobFanOut: baselineJobFanOut(fixture.changedPaths),
    postDecision: receipt.decision,
    postRiskTier: receipt.riskTier,
    postRequiredCheckCount: receipt.requiredChecks.length,
    postRequiredContextCount: receipt.requiredChecks.filter((check) => check.kind === 'RULESET_REQUIRED').length,
    postObligationCount: receipt.requiredChecks.filter((check) => check.kind === 'MANDATORY_OBLIGATION').length,
    narrowingCandidateCount: receipt.narrowingCandidates.length,
    retainedCandidateCount: receipt.retainedChecks.length,
    // Read from the receipt rather than asserted locally, so this row can actually fail if a future
    // change starts enforcing narrowing behind the gate.
    narrowingEnforced: receipt.enforcement !== 'CONTRACT_ONLY_RULESET_PENDING',
    narrowingEnforcementState: receipt.narrowingCandidates[0]?.enforcement ?? 'NO_NARROWING_CANDIDATES',
    receiptDigest: receipt.receiptDigest,
  };
}

export const MEASUREMENTS = BENCHMARK_FIXTURES.map(measure);
const byClass = (name) => MEASUREMENTS.find((entry) => entry.class === name);

test('the benchmark fixture set covers a governance-only candidate and a product-code candidate', () => {
  const classes = MEASUREMENTS.map((entry) => entry.class);
  assert.ok(classes.includes('GOVERNANCE_ONLY'));
  assert.ok(classes.includes('PRODUCT_CODE'));
  for (const entry of MEASUREMENTS) assert.match(entry.receiptDigest, /^sha256:[0-9a-f]{64}$/);
});

test('the baseline is identical across the three comparable governance fixtures', () => {
  const baselines = MEASUREMENTS
    .filter((entry) => entry.class.startsWith('GOVERNANCE_ONLY'))
    .map((entry) => entry.baselineJobFanOut);
  assert.equal(new Set(baselines).size, 1, `governance baselines must agree, saw ${baselines.join()}`);
  assert.equal(MEASUREMENTS.filter((entry) => entry.class.startsWith('GOVERNANCE_ONLY')).length, 3);
});

test('a governance-only candidate selects fewer required checks than the fan-out it replaces', () => {
  const governance = byClass('GOVERNANCE_ONLY');
  assert.equal(governance.postDecision, 'REDUCED_ADVISORY');
  assert.ok(
    governance.postRequiredCheckCount < governance.baselineJobFanOut,
    `selected ${governance.postRequiredCheckCount} required checks against a baseline fan-out of ${governance.baselineJobFanOut}`,
  );
  assert.ok(governance.narrowingCandidateCount > 0, 'a narrowed receipt must name what a later ruleset update could drop');
  assert.ok(governance.retainedCandidateCount > 0, 'a narrowed receipt must also name what it keeps');
});

test('a declared risk raises the tier and, at HIGH_ASSURANCE, the obligation count', () => {
  const baseline = byClass('GOVERNANCE_ONLY');
  const elevated = byClass('GOVERNANCE_ONLY_DECLARED_ELEVATED');
  const high = byClass('GOVERNANCE_ONLY_DECLARED_HIGH_ASSURANCE');
  assert.equal(elevated.postRiskTier, 'ELEVATED');
  assert.equal(high.postRiskTier, 'HIGH_ASSURANCE');
  for (const entry of [baseline, elevated, high]) {
    assert.equal(entry.postRequiredContextCount, baseline.postRequiredContextCount, 'a declared risk never drops a required context');
  }
  assert.ok(high.postRequiredCheckCount > elevated.postRequiredCheckCount, 'HIGH_ASSURANCE adds release and specialist obligations');
});

test('a product-code candidate keeps the full required set and proposes no exclusions', () => {
  const code = byClass('PRODUCT_CODE');
  const governance = byClass('GOVERNANCE_ONLY');
  assert.ok(code.baselineJobFanOut > governance.baselineJobFanOut, 'a code change fans out wider than a governance change at the base');
  assert.equal(code.postRiskTier, 'ELEVATED');
  assert.equal(code.postDecision, 'FULL_ASSURANCE');
  assert.equal(code.narrowingCandidateCount, 0);
  assert.ok(code.postRequiredCheckCount > governance.postRequiredCheckCount);
});

test('narrowing is reported but not enforced, so no row claims a check was saved', () => {
  for (const entry of MEASUREMENTS) {
    assert.equal(entry.narrowingEnforced, false, `${entry.id} must not claim an enforced narrowing`);
    assert.equal(entry.postRequiredContextCount, 4, 'every required ruleset context survives in every row');
    assert.ok(
      entry.narrowingEnforcementState === 'NOT_ENFORCED_PENDING_RULESET_AUTHORIZATION' ||
        entry.narrowingEnforcementState === 'NO_NARROWING_CANDIDATES',
      `${entry.id} carries ${entry.narrowingEnforcementState}`,
    );
  }
});

test('every provider candidate check is classified as narrowed or retained, never dropped silently', () => {
  const routed = routeCandidate(BENCHMARK_FIXTURES[0].changedPaths, { facts: BENCHMARK_FIXTURES[0].facts });
  const accounted = new Set([
    ...routed.gate.value.narrowingCandidates.map((entry) => entry.checkId),
    ...routed.gate.value.retainedChecks.map((entry) => entry.checkId),
  ]);
  for (const candidate of PROVIDER_CANDIDATE_CHECKS) {
    assert.ok(accounted.has(candidate.checkId), `${candidate.checkId} must be accounted for in the receipt`);
  }
});

test('the repository still carries the workflows the baseline recorded', () => {
  const present = new Set(readdirSync(WORKFLOW_ROOT).map((name) => `.github/workflows/${name}`));
  for (const workflow of [...BASELINE_UNCONDITIONAL_WORKFLOWS, ...BASELINE_PATH_FILTERED_WORKFLOWS.map((entry) => entry.workflow)]) {
    assert.ok(present.has(workflow), `${workflow} must still exist for the baseline to remain meaningful`);
  }
  for (const workflow of BASELINE_UNCONDITIONAL_WORKFLOWS) {
    const text = readFileSync(resolve(WORKFLOW_ROOT, workflow.replace('.github/workflows/', '')), 'utf8');
    assert.match(text, /pull_request/, `${workflow} must still declare a pull_request trigger`);
  }
});

test('the recorded measurement table is reproducible from the fixtures', () => {
  // Recomputed here rather than compared with itself, so a non-deterministic measure would show up.
  for (const fixture of BENCHMARK_FIXTURES) {
    const first = measure(fixture);
    const second = measure(fixture);
    assert.deepEqual(second, first, `${fixture.id} must measure identically twice`);
    assert.equal(first.receiptDigest, MEASUREMENTS.find((entry) => entry.id === fixture.id).receiptDigest);
  }
});

test('the committed benchmark receipt matches the freshly measured table', () => {
  // The receipt is evidence, so it is regenerated from measurement rather than transcribed; a drift
  // between the committed JSON and the live measurement is itself a failing check.
  const committed = JSON.parse(readFileSync(resolve(ROOT, '.engineering/evidence/GBS-MOD-WO-001-BENCHMARK.json'), 'utf8'));
  assert.equal(committed.schemaVersion, '1.0');
  assert.equal(committed.baseline.implementationBaseSha, BASELINE_IMPLEMENTATION_BASE);
  assert.equal(committed.baseline.modelScope, BASELINE_MODEL_SCOPE);
  assert.equal(committed.baseline.unconditionalWorkflows.length, BASELINE_UNCONDITIONAL_WORKFLOWS.length);
  assert.equal(committed.baseline.unconditionalJobFanOut, BASELINE_UNCONDITIONAL_JOB_FAN_OUT);
  assert.equal(committed.baseline.pathFilteredWorkflows.length, BASELINE_PATH_FILTERED_WORKFLOWS.length);
  assert.deepEqual(committed.measurements, MEASUREMENTS);
  assert.equal(committed.claims.wallClockPercentageClaim, 'NOT_CLAIMED');
  assert.equal(committed.claims.narrowingEnforced, false);
});