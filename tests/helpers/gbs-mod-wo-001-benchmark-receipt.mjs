// GBS-MOD-WO-001 — regenerates the committed benchmark receipt from live measurement.
//
//     node tests/helpers/gbs-mod-wo-001-benchmark-receipt.mjs
//
// The receipt is evidence, so it is generated rather than transcribed. `tests/gbs-mod-wo-001-benchmark.test.mjs`
// asserts that the committed JSON still equals the freshly measured table, so a measurement that
// drifts without a regeneration fails the gate rather than quietly disagreeing with the evidence.

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BASELINE_IMPLEMENTATION_BASE,
  BASELINE_MODEL_SCOPE,
  BASELINE_PATH_FILTERED_WORKFLOWS,
  BASELINE_UNCONDITIONAL_JOB_FAN_OUT,
  BASELINE_UNCONDITIONAL_WORKFLOWS,
  MEASUREMENTS,
} from '../gbs-mod-wo-001-benchmark.test.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUTPUT = resolve(ROOT, '.engineering/evidence/GBS-MOD-WO-001-BENCHMARK.json');

const receipt = {
  schemaVersion: '1.0',
  workOrder: 'GBS-MOD-WO-001',
  issue: 394,
  implementationPullRequest: 407,
  branch: 'feat/mod/wo-001-agent-native-gate',
  measurementUnit: 'check runs selected by committed pull_request trigger definitions',
  generatedBy: 'tests/helpers/gbs-mod-wo-001-benchmark-receipt.mjs',
  baseline: {
    implementationBaseSha: BASELINE_IMPLEMENTATION_BASE,
    modelScope: BASELINE_MODEL_SCOPE,
    unconditionalWorkflows: BASELINE_UNCONDITIONAL_WORKFLOWS,
    unconditionalJobFanOut: BASELINE_UNCONDITIONAL_JOB_FAN_OUT,
    pathFilteredWorkflows: BASELINE_PATH_FILTERED_WORKFLOWS,
    externalObservation: {
      source: '.engineering/context-locks/GBS-MOD-WO-001.json baselineObservation',
      pullRequests: [390, 395],
      observedCheckRunsPerGovernancePullRequest: 38,
      note: 'Observed provider-side check runs for real governance-only pull requests. This is an independent observation, not a reproduction by the model above.',
    },
  },
  measurements: MEASUREMENTS,
  claims: {
    wallClockPercentageClaim: 'NOT_CLAIMED',
    wallClockReason: 'CI duration is not reproducible from a deterministic test; the frozen Test & Benchmark Plan forbids a percentage claim without measured evidence.',
    narrowingEnforced: false,
    narrowingEnforcementState: 'NOT_ENFORCED_PENDING_RULESET_AUTHORIZATION',
    rulesetRewriteInScope: false,
    requiredRulesetContextsPreservedInEveryRow: true,
  },
  stopCondition: 'GBS_MOD_WO_001_IMPLEMENTATION_READY_FOR_OWNER_AUDIT',
};

writeFileSync(OUTPUT, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
process.stdout.write(`wrote ${OUTPUT} (${MEASUREMENTS.length} measurements)\n`);