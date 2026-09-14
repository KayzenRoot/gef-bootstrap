import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createPolicyAuthorityCapsule,
  createExceptionWarrant,
  computePolicySemanticFingerprint,
  detectPolicyRegression,
  buildGuardrailCoverageMap,
  openExceptionDebt,
  resolveExceptionDebt,
  refreshDebtReviews,
  bindContinuityPolicy,
  revalidateContinuityPolicy,
} from '../packages/policy-guardrail-engine/dist/public.js';

const digest = {
  algorithm: 'sha256',
  digest: value => createHash('sha256').update(value).digest('hex'),
};
const opts = { digest };

function ob(id, overrides = {}) {
  return {
    obligationId: id, statement: `Do ${id}`, mandatory: true,
    dependsOn: [], conflictsWith: [], ...overrides,
  };
}

function makePolicy(id, overrides = {}) {
  return {
    policyId: id, version: '1.0.0', ownerAuthority: `owner-${id}`, ownerProvenance: `prov:${id}`,
    scopeDomains: ['SCOPE'],
    applicability: { domains: ['SCOPE'], operations: [], matchMode: 'ANY' },
    precedenceDomain: 'domain-scope', effectOnMatch: 'ALLOW', obligations: [],
    evidenceFingerprint: `fp:${id}`, reviewTrigger: 'review:quarterly', schemaVersion: 'v1',
    ...overrides,
  };
}

function pac(id, overrides = {}) {
  const result = createPolicyAuthorityCapsule(makePolicy(id, overrides), opts);
  assert.equal(result.ok, true);
  return result.value;
}

function makeWarrant(id, overrides = {}) {
  return {
    warrantId: id, targetPolicyIds: ['pol-a'], targetDomains: ['SCOPE'],
    targetObligations: ['audit-log'], scopeNodeIds: ['a'], scopeMutationDomains: ['dom-a'],
    rationale: 'Hotfix', compensatingControls: ['extra-review'],
    approvedByAuthority: 'owner-pol-a', approverProvenance: 'prov:pol-a',
    reviewTrigger: 'review:24h', maxUses: 2,
    ...overrides,
  };
}

function warrant(id, overrides = {}) {
  const result = createExceptionWarrant(makeWarrant(id, overrides), opts);
  assert.equal(result.ok, true);
  return result.value;
}

function failCode(result) {
  assert.equal(result.ok, false);
  return result.diagnostics[0].code;
}

// ─── PRS ──────────────────────────────────────────────────────────────────────

test('regression sentinel detects all six weakening kinds', () => {
  const previous = {
    policies: [
      pac('p-deny', { effectOnMatch: 'DENY' }),
      pac('p-unknown', { applicability: { domains: [], operations: [], matchMode: 'ANY' } }),
      pac('p-ob', { obligations: [ob('o-keep'), ob('o-drop')] }),
      pac('p-auth'),
    ],
    warrants: [warrant('w-1')],
  };
  // Craft the broadened/weakened warrant via spread: empty compensating
  // controls cannot pass creation, which is itself the fail-closed property.
  const currentWarrant = { ...warrant('w-1'), scopeNodeIds: ['a', 'b'], compensatingControls: [] };
  const snapshot = {
    policies: [
      pac('p-deny', { effectOnMatch: 'ALLOW' }),
      pac('p-ob', { obligations: [ob('o-keep')] }),
      pac('p-auth', { ownerAuthority: 'owner-evil', precedenceDomain: 'domain-scope' }),
    ],
    warrants: [currentWarrant],
  };
  const { findings, hasRegression } = detectPolicyRegression(previous, snapshot);
  assert.equal(hasRegression, true);
  const kinds = findings.map(f => f.kind);
  assert.ok(kinds.includes('DENY_TO_ALLOW'));
  assert.ok(kinds.includes('UNKNOWN_TO_ALLOW'));
  assert.ok(kinds.includes('OBLIGATION_LOSS'));
  assert.ok(kinds.includes('BROADER_EXCEPTION_SCOPE'));
  assert.ok(kinds.includes('WEAKENED_AUTHORITY'));
  assert.ok(kinds.includes('REMOVED_COMPENSATING_CONTROL'));
});

test('identical snapshots have no regression', () => {
  const snapshot = { policies: [pac('p-a')], warrants: [warrant('w-1')] };
  const same = { policies: [pac('p-a')], warrants: [warrant('w-1')] };
  const result = detectPolicyRegression(snapshot, same);
  assert.equal(result.hasRegression, false);
  assert.deepEqual(result.findings, []);
});

// ─── GCM ──────────────────────────────────────────────────────────────────────

test('coverage map exposes gaps deterministically', () => {
  const policies = [pac('p-a')];
  const map = buildGuardrailCoverageMap(
    [
      { operation: 'write:src/a.ts', domain: 'SCOPE', nodeId: 'a' },
      { operation: 'write:src/z.ts', domain: 'OTHER', nodeId: 'z' },
    ],
    policies,
  );
  assert.equal(map.entries.length, 2);
  assert.equal(map.entries[0].covered, false);
  assert.equal(map.entries[0].domain, 'OTHER');
  assert.equal(map.entries[1].covered, true);
  assert.deepEqual(map.entries[1].policyIds, ['p-a']);
  assert.equal(map.gaps.length, 1);
  const again = buildGuardrailCoverageMap(
    [
      { operation: 'write:src/z.ts', domain: 'OTHER', nodeId: 'z' },
      { operation: 'write:src/a.ts', domain: 'SCOPE', nodeId: 'a' },
    ],
    policies,
  );
  assert.deepEqual(again, map);
});

// ─── PSF ──────────────────────────────────────────────────────────────────────

test('policy fingerprint is order independent and semantically sensitive', () => {
  const first = computePolicySemanticFingerprint([pac('p-a'), pac('p-b')], opts);
  const second = computePolicySemanticFingerprint([pac('p-b'), pac('p-a')], opts);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.value, second.value);
  assert.match(first.value, /^sha256:[0-9a-f]{64}$/);
  const changed = computePolicySemanticFingerprint(
    [pac('p-a'), pac('p-b', { effectOnMatch: 'DENY' })], opts,
  );
  assert.equal(changed.ok, true);
  assert.notEqual(changed.value, first.value);
});

// ─── EDR ──────────────────────────────────────────────────────────────────────

test('exception debt is recorded, resolved explicitly and never dropped', () => {
  const opened = [openExceptionDebt(warrant('w-1'))];
  assert.equal(opened[0].status, 'ACTIVE');
  const resolved = resolveExceptionDebt(opened, 'w-1', 'resolution:review-board-7');
  assert.equal(resolved.ok, true);
  assert.equal(resolved.value[0].status, 'RESOLVED');
  assert.equal(resolved.value[0].resolutionRef, 'resolution:review-board-7');
  assert.equal(failCode(resolveExceptionDebt(resolved.value, 'w-1', 'resolution:again')), 'POLICY_DEBT_ALREADY_RESOLVED');
  assert.equal(failCode(resolveExceptionDebt(opened, 'w-ghost', 'resolution:x')), 'POLICY_DEBT_UNKNOWN_WARRANT');

  const stale = refreshDebtReviews(opened, { 'w-1': { uses: 2, maxUses: 2 } });
  assert.equal(stale[0].status, 'STALE_REVIEW');
  const fresh = refreshDebtReviews(opened, { 'w-1': { uses: 1, maxUses: 2 } });
  assert.equal(fresh[0].status, 'ACTIVE');
  // Refresh never drops entries.
  assert.equal(refreshDebtReviews(resolved.value, {}).length, 1);
});

// ─── CPB ──────────────────────────────────────────────────────────────────────

test('continuity binding revalidates exactly and rejects every drift', () => {
  const policies = [pac('p-a'), pac('p-b')];
  const bound = bindContinuityPolicy({
    projectId: 'proj-gef', taskIdentity: 'task-1',
    packDigest: `sha256:${'a'.repeat(64)}`, decisionDigest: `sha256:${'b'.repeat(64)}`,
    policies,
  });
  assert.equal(bound.ok, true);
  const current = {
    projectId: 'proj-gef',
    taskIdentity: 'task-1',
    packDigest: `sha256:${'a'.repeat(64)}`,
    decisionDigest: `sha256:${'b'.repeat(64)}`,
    policyFingerprints: Object.fromEntries(policies.map(p => [p.policyId, p.semanticIdentity])),
  };
  assert.equal(revalidateContinuityPolicy(bound.value, current).ok, true);
  assert.equal(failCode(revalidateContinuityPolicy(
    bound.value, { ...current, projectId: 'proj-evil' },
  )), 'POLICY_CONTINUITY_DRIFT');
  assert.equal(failCode(revalidateContinuityPolicy(
    bound.value, { ...current, decisionDigest: `sha256:${'0'.repeat(64)}` },
  )), 'POLICY_CONTINUITY_DRIFT');
  assert.equal(failCode(revalidateContinuityPolicy(
    bound.value, {
      ...current,
      policyFingerprints: { ...current.policyFingerprints, 'p-a': `sha256:${'f'.repeat(64)}` },
    },
  )), 'POLICY_CONTINUITY_DRIFT');
  const { 'p-b': _dropped, ...fewer } = current.policyFingerprints;
  assert.equal(failCode(revalidateContinuityPolicy(
    bound.value, { ...current, policyFingerprints: fewer },
  )), 'POLICY_CONTINUITY_DRIFT');
});
