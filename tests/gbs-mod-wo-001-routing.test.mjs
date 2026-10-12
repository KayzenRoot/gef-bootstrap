// GBS-MOD-WO-001 — adversarial routing fixtures.
//
// The Work Order requires proof that path tricks, renames and moves, mixed documentation and code
// changes, workflow/configuration/security changes, unknown files and risk escalation all fail to
// select a weaker gate. Each fixture below is one such attempt, asserted against the whole
// routing chain so a bypass at any single stage is visible.

import test from 'node:test';
import assert from 'node:assert/strict';

import { MAIN_RULESET_CONTEXTS, routeCandidate } from './helpers/gbs-mod-wo-001-routing.mjs';

const rank = { LOW: 0, STANDARD: 1, ELEVATED: 2, HIGH_ASSURANCE: 3 };

/** Routes a candidate that is expected to produce a receipt. */
/** Routes a candidate that is expected to produce a receipt. */
function receiptFor(changedPaths, over) {
  const routed = routeCandidate(changedPaths, over);
  assert.equal(routed.gate.ok, true, JSON.stringify(routed.gate.ok ? {} : routed.gate.diagnostics));
  return routed;
}

/** Routes a candidate that is expected to be refused before a receipt exists. */
function blockedFor(changedPaths, over) {
  const routed = routeCandidate(changedPaths, over);
  assert.equal(routed.gate.ok, false, 'a blocked candidate must not produce a gate receipt');
  return routed;
}

/**
 * Every fixture must keep the four ruleset contexts, and the receipt must stay consistent with the
 * closure verdict it was derived from.
 */
function assertBaselineInvariant(routed) {
  const receipt = routed.gate.value;
  const retained = receipt.requiredChecks.filter((check) => check.kind === 'RULESET_REQUIRED').map((check) => check.checkId);
  assert.deepEqual(retained, [...MAIN_RULESET_CONTEXTS].sort(), 'ruleset contexts are never narrowed');
  // A HIGH_ASSURANCE candidate demands the whole suite, so it may propose no exclusions at all.
  if (receipt.riskTier === 'HIGH_ASSURANCE') {
    assert.deepEqual(receipt.narrowingCandidates, [], 'a HIGH_ASSURANCE candidate must not narrow');
  }
  for (const candidate of receipt.narrowingCandidates) {
    assert.ok(
      candidate.closureProof.includes(routed.impact.impactDigest),
      'a narrowing proof must name the exact change-impact digest it was derived from',
    );
  }
}

test('governance-only is the only fixture that may propose exclusions', () => {
  const routed = receiptFor([
    '.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md',
    '.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md',
  ]);
  assertBaselineInvariant(routed);
  assert.equal(routed.impact.governanceFastPath, 'PERMITTED');
  assert.equal(routed.gate.value.decision, 'REDUCED_ADVISORY');
  assert.ok(routed.gate.value.narrowingCandidates.length > 0);
  for (const candidate of routed.gate.value.narrowingCandidates) {
    assert.equal(candidate.enforcement, 'NOT_ENFORCED_PENDING_RULESET_AUTHORIZATION');
  }
});

test('mixed documentation and code changes cannot use the governance fast path', () => {
  const routed = receiptFor([
    '.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md',
    'packages/contracts/src/work-order.ts',
  ]);
  assertBaselineInvariant(routed);
  assert.equal(routed.impact.governanceFastPath, 'REFUSED');
  assert.equal(routed.gate.value.decision, 'FULL_ASSURANCE');
  assert.deepEqual(routed.gate.value.narrowingCandidates, []);
});

test('a documentation change disguised as a code path still classifies as code', () => {
  const routed = receiptFor(['packages/preflight/src/change-impact.ts', '.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md']);
  assert.ok(routed.impact.kinds.includes('PRODUCT_CODE'));
  assert.equal(routed.impact.governanceFastPath, 'REFUSED');
});

test('workflow, dependency, build and schema changes each force the full assurance decision', () => {
  for (const path of [
    '.github/workflows/repository-validation.yml',
    '.github/workflows/gef-gate.yml',
    'package.json',
    'package-lock.json',
    'tsconfig.base.json',
    '.engineering/schemas/execution-capsule.schema.json',
  ]) {
    const routed = receiptFor([path]);
    assertBaselineInvariant(routed);
    assert.equal(routed.impact.governanceFastPath, 'REFUSED', `${path} must refuse the fast path`);
    assert.equal(routed.gate.value.decision, 'FULL_ASSURANCE', `${path} must not narrow`);
    assert.ok(rank[routed.impact.tier] >= rank.ELEVATED, `${path} must be at least ELEVATED`);
  }
});

test('pipeline integrity is an explicit obligation whenever a workflow changes', () => {
  const routed = receiptFor(['.github/workflows/gef-gate.yml']);
  assert.ok(routed.impact.obligations.includes('PIPELINE_INTEGRITY'));
  assert.ok(routed.gate.value.requiredChecks.some((check) => check.checkId === 'OBLIGATION:PIPELINE_INTEGRITY'));
});

test('a canonical checkpoint change always demands parity, at any declared risk', () => {
  for (const path of ['.engineering/CHECKPOINT.md', '.engineering/CHECKPOINT.json']) {
    const routed = receiptFor([path], { facts: { declaredRisk: 'LOW' } });
    assert.ok(routed.impact.obligations.includes('CHECKPOINT_PARITY'), `${path} must require parity`);
    assert.equal(routed.impact.governanceFastPath, 'REFUSED');
    assert.ok(routed.gate.value.requiredChecks.some((check) => check.checkId === 'OBLIGATION:CHECKPOINT_PARITY'));
  }
});

test('a security-bearing dependency change reaches supply-chain assurance', () => {
  const routed = receiptFor(['package-lock.json'], { facts: { declaredRisk: 'STANDARD' } });
  assert.ok(routed.impact.obligations.includes('DEPENDENCY_SUPPLY_CHAIN'));
  assert.equal(routed.gate.value.decision, 'FULL_ASSURANCE');
});

test('path traversal cannot reach a governance classification', () => {
  for (const path of [
    '../.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md',
    '..\\.engineering\\evidence\\GBS-MOD-WO-001-EVIDENCE.md',
    '.engineering/evidence/../../.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md',
  ]) {
    const routed = blockedFor([path]);
    assert.equal(routed.impact.state, 'BLOCKED', `${path} must block`);
    assert.equal(routed.impact.governanceFastPath, 'REFUSED');
    assert.equal(routed.impact.tier, 'HIGH_ASSURANCE');
    assert.equal(routed.gate.ok, false, `${path} must not produce a gate receipt`);
  }
});

test('a case variant of the executor contract cannot be classified as the executor contract', () => {
  const routed = blockedFor(['agents.md', '.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md']);
  assert.equal(routed.impact.state, 'BLOCKED');
  assert.equal(routed.impact.tier, 'HIGH_ASSURANCE');
  assert.deepEqual(routed.impact.suspiciousPaths, ['agents.md']);
});

test('an absolute or encoded-separator path is blocked rather than normalized into a narrow class', () => {
  for (const path of ['/mnt/d/Projects/gef-wo001/AGENTS.md', '.engineering%2fevidence%2fGBS-MOD-WO-001-EVIDENCE.md']) {
    const routed = blockedFor([path]);
    assert.equal(routed.impact.state, 'BLOCKED', `${path} must block`);
    assert.deepEqual(routed.impact.suspiciousPaths, [path]);
  }
});

test('renames and moves carry both sides of the change into the closure', () => {
  const rename = routeCandidate([
    'packages/contracts/src/work-order.ts',
    'packages/contracts/src/work-order.legacy.ts',
  ], { attributionComplete: true });
  assert.deepEqual(rename.closure.value.unattributedPaths, ['packages/contracts/src/work-order.legacy.ts']);
  assert.ok(rename.closure.value.obstructions.includes('PATH_NOT_ATTRIBUTED_TO_A_KNOWN_SOURCE'));
  assert.equal(rename.closure.value.fullSuiteRequired, true, 'an unresolved move widens the closure');
});

test('a deletion outside the attribution index widens rather than closing to nothing', () => {
  const deletion = routeCandidate(['packages/contracts/dist/generated/index.js'], { attributionComplete: true });
  assert.deepEqual(deletion.closure.value.changedSourceIds, []);
  assert.deepEqual(deletion.closure.value.unattributedPaths, ['packages/contracts/dist/generated/index.js']);
  assert.equal(deletion.closure.value.fullSuiteRequired, true);
});

test('an unknown file widens the impact and cannot claim a narrow gate', () => {
  const routed = receiptFor(['vendor/mystery.bin'], { facts: { declaredRisk: 'LOW' } });
  assertBaselineInvariant(routed);
  assert.equal(routed.impact.governanceFastPath, 'REFUSED');
  assert.ok(rank[routed.impact.tier] >= rank.ELEVATED);
  assert.equal(routed.gate.value.decision, 'FULL_ASSURANCE');
});

test('an empty changed set blocks instead of passing as a narrow change', () => {
  const routed = blockedFor([], { facts: { declaredRisk: 'LOW' } });
  assert.equal(routed.impact.governanceFastPath, 'REFUSED');
  assert.ok(routed.impact.escalateReasons.includes('EMPTY_CHANGED_STATE_UNPROVEN'));
  assert.equal(routed.gate.ok, false, 'an unproven changed state must not produce a receipt');
});

test('declared risk escalation reaches the specialist gate', () => {
  const routed = receiptFor(['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md'], {
    facts: { declaredRisk: 'HIGH_ASSURANCE' },
  });
  assert.equal(routed.impact.tier, 'HIGH_ASSURANCE');
  assert.ok(routed.gate.value.requiredChecks.some((check) => check.kind === 'SPECIALIST_GATE'));
  assertBaselineInvariant(routed);
});

test('escalating facts always raise the tier above the governance-only peer', () => {
  const baseline = receiptFor(['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md']).impact.tier;
  // Release-significant facts escalate to a full-assurance receipt; unproven or conflicted authority
  // refuses the receipt outright. Both are strictly stronger than the governance-only peer.
  for (const [facts, blocks, expectedTier] of [
    [{ releaseLifecycle: true }, false, 'HIGH_ASSURANCE'],
    [{ protectedSurfaceTouched: true }, false, 'HIGH_ASSURANCE'],
    [{ unresolvedRename: true }, false, 'ELEVATED'],
    [{ authorityConflict: true }, true, 'HIGH_ASSURANCE'],
    [{ changedStateUnproven: true }, true, 'HIGH_ASSURANCE'],
  ]) {
    const routed = routeCandidate(['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md'], { facts });
    assert.ok(
      rank[routed.impact.tier] > rank[baseline],
      `${JSON.stringify(facts)} must raise the tier above ${baseline}`,
    );
    assert.equal(routed.impact.governanceFastPath, 'REFUSED', `${JSON.stringify(facts)} must refuse the fast path`);
    if (blocks) {
      assert.equal(routed.gate.ok, false, `${JSON.stringify(facts)} must not produce a receipt`);
      continue;
    }
    assert.equal(routed.gate.ok, true, `${JSON.stringify(facts)} must still produce a full-assurance receipt`);
    assert.equal(routed.gate.value.decision, 'FULL_ASSURANCE');
    assert.equal(routed.gate.value.riskTier, expectedTier);
    assert.deepEqual(routed.gate.value.narrowingCandidates, []);
    assertBaselineInvariant(routed);
  }
});

test('every routing fixture yields a receipt with no mutation authority', () => {
  for (const changedPaths of [
    ['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md'],
    ['packages/contracts/src/work-order.ts'],
    ['.github/workflows/gef-gate.yml'],
    ['vendor/mystery.bin'],
  ]) {
    const receipt = receiptFor(changedPaths).gate.value;
    assert.equal(receipt.maySelectRequiredChecks, false);
    assert.equal(receipt.mayRelaxRulesetContexts, false);
    assert.equal(receipt.mayPromoteCheckpoint, false);
    assert.equal(receipt.mayRelease, false);
    assert.equal(receipt.manufacturesProductionCredit, false);
  }
});

test('routing is reproducible: the same candidate always yields the same receipt digest', () => {
  const changedPaths = ['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md', 'packages/contracts/src/work-order.ts'];
  assert.equal(routeCandidate(changedPaths).gate.value.receiptDigest, routeCandidate(changedPaths).gate.value.receiptDigest);
  const reversed = [...changedPaths].reverse();
  assert.equal(routeCandidate(reversed).gate.value.receiptDigest, routeCandidate(changedPaths).gate.value.receiptDigest);
});

test('the compiled Context Lock tier always matches the impact tier the gate consumed', () => {
  for (const changedPaths of [
    ['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md'],
    ['.engineering/CHECKPOINT.md'],
    ['packages/contracts/src/work-order.ts'],
    ['.github/workflows/gef-gate.yml'],
  ]) {
    const routed = receiptFor(changedPaths);
    assert.equal(routed.lock.ok, true, JSON.stringify(routed.lock.ok ? {} : routed.lock.diagnostics));
    assert.equal(routed.lock.value.tier, routed.impact.tier);
    assert.equal(routed.gate.value.riskTier, routed.impact.tier);
    assert.equal(routed.gate.value.bindings.changeImpactDigest, routed.impact.impactDigest);
  }
});