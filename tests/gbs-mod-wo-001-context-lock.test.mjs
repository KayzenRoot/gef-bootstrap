// GBS-MOD-WO-001 (C) — risk-tiered Context Lock compilation.
//
// Acceptance: A2. A narrow task loads only the canonical sources its tier requires and expands
// deterministically when a triggered domain actually fires.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES,
  TIERED_CONTEXT_LOCK_VERSION,
  compileTieredContextLock,
  contextLockTierOrder,
  maxContextLockTier,
} from '../packages/task-context-compiler/dist/public.js';

const options = {
  digest: { algorithm: 'sha256', digest: (input) => createHash('sha256').update(input).digest('hex') },
};

const lockInput = (over = {}) => ({
  taskIdentity: 'GBS-MOD-WO-001',
  workOrderId: 'GBS-MOD-WO-001',
  workOrderPath: '.engineering/work-orders/GBS-MOD-WO-001.md',
  contextLockPath: '.engineering/context-locks/GBS-MOD-WO-001.json',
  floorTier: 'LOW',
  declaredTier: 'LOW',
  baseSha: 'a'.repeat(40),
  headSha: 'b'.repeat(40),
  affectedPaths: ['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md'],
  readIfTriggered: [
    { path: '.engineering/DEPLOYMENT.md', trigger: 'RELEASE' },
    { path: '.engineering/SECURITY.md', trigger: 'SECURITY' },
  ],
  triggeredDomains: [],
  obligations: ['GIT_DIFF_INTEGRITY'],
  ...over,
});

const compile = (over) => compileTieredContextLock(lockInput(over), options);
const must = (over) => {
  const result = compile(over);
  assert.equal(result.ok, true, JSON.stringify(result.ok ? {} : result.diagnostics));
  return result.value;
};

test('each tier is a strict superset of the tier below it', () => {
  const tiers = contextLockTierOrder.map((tier) => must({ floorTier: tier, declaredTier: tier }));
  assert.deepEqual(tiers.map((lock) => lock.tier), ['LOW', 'STANDARD', 'ELEVATED', 'HIGH_ASSURANCE']);
  for (let index = 1; index < tiers.length; index += 1) {
    const current = new Set(tiers[index].requiredSources);
    for (const source of tiers[index - 1].requiredSources) {
      assert.ok(current.has(source), `${source} loaded at ${tiers[index - 1].tier} must still load at ${tiers[index].tier}`);
    }
    assert.ok(tiers[index].requiredSources.length > tiers[index - 1].requiredSources.length);
  }
});

test('LOW loads the exact head, the affected file and required authority, and nothing more', () => {
  const lock = must({});
  assert.equal(lock.tier, 'LOW');
  assert.deepEqual(lock.requiredSources, [
    '.engineering/CHECKPOINT.json',
    '.engineering/CHECKPOINT.md',
    '.engineering/SOURCE-HIERARCHY.md',
    '.engineering/context-locks/GBS-MOD-WO-001.json',
    '.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md',
    '.engineering/work-orders/GBS-MOD-WO-001.md',
  ]);
  assert.equal(lock.specialistGateRequired, false);
  assert.equal(lock.requiredSources.includes('.engineering/ARCHITECTURE.md'), false);
  assert.equal(lock.requiredSources.includes('.engineering/DEPLOYMENT.md'), false);
});

test('STANDARD adds Scope and Architecture; ELEVATED adds Security, DoD and the test plan', () => {
  const standard = must({ floorTier: 'STANDARD', declaredTier: 'STANDARD' });
  for (const source of ['.engineering/ARCHITECTURE.md', '.engineering/BACKLOG.md', '.engineering/DECISIONS-LEDGER.md']) {
    assert.ok(standard.requiredSources.includes(source), `${source} is required at STANDARD`);
  }
  assert.equal(standard.requiredSources.includes('.engineering/SECURITY.md'), false);

  const elevated = must({ floorTier: 'ELEVATED', declaredTier: 'ELEVATED' });
  for (const source of [
    '.engineering/SECURITY.md',
    '.engineering/TEST-BENCHMARK-PLAN.md',
    '.engineering/DEFINITION-OF-DONE.md',
    '.engineering/REQUIREMENTS.md',
    '.engineering/SCOPE.md',
  ]) {
    assert.ok(elevated.requiredSources.includes(source), `${source} is required at ELEVATED`);
  }
  for (const tier of ['LOW', 'STANDARD']) {
    const lock = must({ floorTier: tier, declaredTier: tier });
    assert.equal(lock.requiredSources.includes('.engineering/REQUIREMENTS.md'), false, `${tier} does not load Requirements`);
  }
});

test('HIGH_ASSURANCE adds the full proof obligations and the specialist gate', () => {
  const high = must({ floorTier: 'HIGH_ASSURANCE', declaredTier: 'HIGH_ASSURANCE' });
  for (const source of ['.engineering/DEPLOYMENT.md', '.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md', '.engineering/CONSTITUTION-LOCK.md']) {
    assert.ok(high.requiredSources.includes(source), `${source} is required at HIGH_ASSURANCE`);
  }
  assert.equal(high.specialistGateRequired, true);
});

test('a triggered domain pulls its source in and is named as the reason', () => {
  const lock = must({ floorTier: 'ELEVATED', declaredTier: 'ELEVATED', triggeredDomains: ['RELEASE'] });
  assert.equal(lock.state, 'EXPANDED');
  assert.ok(lock.requiredSources.includes('.engineering/DEPLOYMENT.md'));
  const inclusion = lock.includedSources.find((entry) => entry.path === '.engineering/DEPLOYMENT.md');
  assert.equal(inclusion.reason, 'TRIGGERED:RELEASE');
  assert.ok(lock.expansionReasons.includes('TRIGGERED_SOURCE:RELEASE'));
});

test('an untriggered source is excluded with the reason, so the receipt states what was left out', () => {
  const lock = must({});
  assert.deepEqual(lock.excludedTriggeredSources, [
    { path: '.engineering/DEPLOYMENT.md', reason: 'NOT_TRIGGERED:RELEASE' },
    { path: '.engineering/SECURITY.md', reason: 'NOT_TRIGGERED:SECURITY' },
  ]);
});

test('every inclusion carries a reason', () => {
  for (const tier of contextLockTierOrder) {
    const lock = must({ floorTier: tier, declaredTier: tier });
    for (const inclusion of lock.includedSources) {
      assert.ok(inclusion.reason.length > 0, `${inclusion.path} must state why it is loaded`);
    }
    assert.equal(lock.includedSources.length, lock.requiredSources.length);
  }
});

test('a declared tier below the proven floor blocks instead of being silently repaired', () => {
  const result = compile({ floorTier: 'ELEVATED', declaredTier: 'STANDARD' });
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_TIER_BELOW_FLOOR);
});

test('an authority conflict and an unproven changed state both refuse to compile', () => {
  for (const [field, code] of [
    ['authorityConflict', TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_AUTHORITY_CONFLICT],
    ['changedStateUnproven', TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_CHANGED_STATE_UNPROVEN],
  ]) {
    const result = compile({ [field]: true });
    assert.equal(result.ok, false, `${field} must not compile`);
    assert.equal(result.diagnostics[0].code, code);
  }
});

test('malformed bindings, traversing source paths and malformed collections are rejected', () => {
  assert.equal(compile({ headSha: 'HEAD' }).diagnostics[0].code, TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_INPUT_INVALID);
  assert.equal(compile({ workOrderPath: '../escape.md' }).diagnostics[0].code, TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_SOURCE_INVALID);
  assert.equal(compile({ affectedPaths: ['/abs/a.md'] }).diagnostics[0].code, TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_SOURCE_INVALID);
  assert.equal(compile({ workOrderPath: 'a\\b.md' }).diagnostics[0].code, TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_SOURCE_INVALID);
  for (const over of [
    { affectedPaths: null },
    { readIfTriggered: null },
    { triggeredDomains: null },
    { obligations: null },
    { triggeredDomains: ['RELEASE', ''] },
    { obligations: [42] },
  ]) {
    const result = compile(over);
    assert.equal(result.ok, false, `${JSON.stringify(over)} must be refused`);
    assert.equal(result.diagnostics[0].code, TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_INPUT_INVALID);
  }
});

test('the lock digest binds the exact base, head and source set', () => {
  const lock = must({});
  assert.equal(lock.schemaVersion, TIERED_CONTEXT_LOCK_VERSION);
  assert.match(lock.lockDigest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(must({}).lockDigest, lock.lockDigest);
  assert.notEqual(must({ headSha: 'c'.repeat(40) }).lockDigest, lock.lockDigest);
  assert.notEqual(must({ floorTier: 'HIGH_ASSURANCE', declaredTier: 'HIGH_ASSURANCE' }).lockDigest, lock.lockDigest);
});

test('tier combination only ever raises assurance', () => {
  assert.equal(maxContextLockTier('LOW', 'HIGH_ASSURANCE'), 'HIGH_ASSURANCE');
  assert.equal(maxContextLockTier('ELEVATED', 'STANDARD'), 'ELEVATED');
  assert.deepEqual(contextLockTierOrder, ['LOW', 'STANDARD', 'ELEVATED', 'HIGH_ASSURANCE']);
});