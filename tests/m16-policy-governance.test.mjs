import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createPolicyAuthorityCapsule,
  combineDecisions,
  isPermissiveDecision,
  comparePolicyPrecedence,
  assertDomainIndependent,
  createExceptionWarrant,
  isWarrantExhausted,
  buildPolicyProvenanceChain,
  verifyProvenanceCoverage,
  composeObligations,
  buildApplicabilityWitnessSet,
  joinPolicyAssessments,
  issuePolicyDecisionReceipt,
  applyShortCircuitFirewall,
  decidePolicy,
} from '../packages/policy-guardrail-engine/dist/public.js';

const digest = {
  algorithm: 'sha256',
  digest: value => createHash('sha256').update(value).digest('hex'),
};
const opts = { digest };

function ob(id, overrides = {}) {
  return {
    obligationId: id,
    statement: `Do ${id}`,
    mandatory: true,
    dependsOn: [],
    conflictsWith: [],
    ...overrides,
  };
}

function makePolicy(id, overrides = {}) {
  return {
    policyId: id,
    version: '1.0.0',
    ownerAuthority: `owner-${id}`,
    ownerProvenance: `prov:${id}`,
    scopeDomains: ['SCOPE'],
    applicability: { domains: ['SCOPE'], operations: [], matchMode: 'ANY' },
    precedenceDomain: 'domain-scope',
    effectOnMatch: 'ALLOW',
    obligations: [],
    evidenceFingerprint: `fp:${id}`,
    reviewTrigger: 'review:quarterly',
    schemaVersion: 'v1',
    ...overrides,
  };
}

function pac(id, overrides = {}) {
  const result = createPolicyAuthorityCapsule(makePolicy(id, overrides), opts);
  assert.equal(result.ok, true);
  return result.value;
}

function failCode(result) {
  assert.equal(result.ok, false);
  return result.diagnostics[0].code;
}

const PACK_BINDING = { packId: 'pack-001', taskIdentity: 'task-1', policyVersion: '1.0.0' };
const LATTICE = { domains: [{ domain: 'domain-scope', order: ['pol-allow', 'pol-deny'] }] };

// ─── S01: policy model ────────────────────────────────────────────────────────

test('PAC exact binding and deterministic identity', () => {
  const a = pac('pol-a');
  const b = pac('pol-a');
  assert.equal(a.semanticIdentity, b.semanticIdentity);
  assert.match(a.semanticIdentity, /^sha256:[0-9a-f]{64}$/);
  const changed = pac('pol-a', { version: '2.0.0' });
  assert.notEqual(changed.semanticIdentity, a.semanticIdentity);
});

test('PAC rejects missing owner, scope, domain and provenance', () => {
  assert.equal(failCode(createPolicyAuthorityCapsule(makePolicy('x', { ownerAuthority: '' }), opts)), 'POLICY_CAPSULE_INVALID');
  assert.equal(failCode(createPolicyAuthorityCapsule(makePolicy('x', { ownerProvenance: '' }), opts)), 'POLICY_CAPSULE_INVALID');
  assert.equal(failCode(createPolicyAuthorityCapsule(makePolicy('x', { scopeDomains: [] }), opts)), 'POLICY_CAPSULE_INVALID');
  assert.equal(failCode(createPolicyAuthorityCapsule(makePolicy('x', { precedenceDomain: '' }), opts)), 'POLICY_CAPSULE_INVALID');
  assert.equal(failCode(createPolicyAuthorityCapsule(makePolicy('x', { effectOnMatch: 'MAYBE' }), opts)), 'POLICY_DECISION_INVALID');
});

test('GDA exact four-state vocabulary; unknown never ALLOW', () => {
  assert.equal(combineDecisions([]), 'BLOCK_UNKNOWN');
  assert.equal(combineDecisions(['ALLOW']), 'ALLOW');
  assert.equal(combineDecisions(['ALLOW', 'ALLOW_WITH_OBLIGATIONS']), 'ALLOW_WITH_OBLIGATIONS');
  assert.equal(combineDecisions(['ALLOW', 'DENY']), 'DENY');
  assert.equal(combineDecisions(['ALLOW', 'BLOCK_UNKNOWN']), 'BLOCK_UNKNOWN');
  assert.equal(combineDecisions(['DENY', 'BLOCK_UNKNOWN']), 'DENY');
  assert.equal(combineDecisions(['SOMETHING_ELSE']), 'BLOCK_UNKNOWN');
  assert.equal(isPermissiveDecision('ALLOW'), true);
  assert.equal(isPermissiveDecision('ALLOW_WITH_OBLIGATIONS'), true);
  assert.equal(isPermissiveDecision('DENY'), false);
  assert.equal(isPermissiveDecision('BLOCK_UNKNOWN'), false);
});

test('PDL preserves independent domains; recency and order confer nothing', () => {
  const lattice = {
    domains: [
      { domain: 'd1', order: ['p-old', 'p-new'] },
      { domain: 'd2', order: ['q1'] },
    ],
  };
  // Newer version listed later still loses: explicit order decides.
  assert.equal(comparePolicyPrecedence(lattice, 'd1', 'p-old', 'p-new'), 'A_FIRST');
  assert.equal(comparePolicyPrecedence(lattice, 'd1', 'p-new', 'p-old'), 'B_FIRST');
  assert.equal(comparePolicyPrecedence(lattice, 'd1', 'p-old', 'ghost'), 'UNORDERED');
  assert.equal(comparePolicyPrecedence(lattice, 'nope', 'p-old', 'p-new'), 'INCOMPARABLE');
  const byId = new Map([
    ['p-old', pac('p-old', { precedenceDomain: 'd1' })],
    ['q1', pac('q1', { precedenceDomain: 'd2' })],
  ]);
  assert.deepEqual(assertDomainIndependent(byId, 'q1', 'p-old').value, ['p-old', 'q1']);
  const sameDomain = new Map([
    ['p-old', pac('p-old', { precedenceDomain: 'd1' })],
    ['p-new', pac('p-new', { precedenceDomain: 'd1' })],
  ]);
  assert.equal(failCode(assertDomainIndependent(sameDomain, 'p-old', 'p-new')), 'POLICY_PRECEDENCE_INCOMPARABLE');
});

test('exception warrant requires authority, scope, controls and review', () => {
  const base = {
    warrantId: 'w-1',
    targetPolicyIds: ['pol-a'],
    targetDomains: ['SCOPE'],
    targetObligations: [],
    scopeNodeIds: ['a'],
    scopeMutationDomains: ['dom-a'],
    rationale: 'Hotfix window',
    compensatingControls: ['extra-review'],
    approvedByAuthority: 'owner-pol-a',
    approverProvenance: 'prov:pol-a',
    reviewTrigger: 'review:24h',
    maxUses: 2,
  };
  const good = createExceptionWarrant(base, opts);
  assert.equal(good.ok, true);
  assert.match(good.value.semanticFingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.equal(failCode(createExceptionWarrant({ ...base, approvedByAuthority: '' }, opts)), 'POLICY_WARRANT_INVALID');
  assert.equal(failCode(createExceptionWarrant({ ...base, compensatingControls: [] }, opts)), 'POLICY_WARRANT_INVALID');
  assert.equal(failCode(createExceptionWarrant({ ...base, reviewTrigger: '' }, opts)), 'POLICY_WARRANT_INVALID');
  assert.equal(failCode(createExceptionWarrant({ ...base, maxUses: 0 }, opts)), 'POLICY_WARRANT_INVALID');
  assert.equal(failCode(createExceptionWarrant({ ...base, targetDomains: [], targetObligations: [] }, opts)), 'POLICY_WARRANT_INVALID');
  assert.equal(isWarrantExhausted(good.value, 1), false);
  assert.equal(isWarrantExhausted(good.value, 2), true);
});

test('provenance chain is complete or broken', () => {
  const chain = buildPolicyProvenanceChain([
    { sourceRef: 'src:scope', policyId: 'pol-a', decisionRef: 'dec-1' },
    { sourceRef: 'src:arch', policyId: 'pol-b', decisionRef: 'dec-1' },
  ]);
  assert.equal(chain.ok, true);
  assert.deepEqual(chain.value.map(l => l.policyId), ['pol-a', 'pol-b']);
  assert.equal(verifyProvenanceCoverage(chain.value, 'dec-1').ok, true);
  assert.equal(failCode(verifyProvenanceCoverage(chain.value, 'dec-missing')), 'POLICY_PROVENANCE_BROKEN');
  assert.equal(failCode(buildPolicyProvenanceChain(
    [{ sourceRef: '', policyId: 'pol-a', decisionRef: 'dec-1' }],
  )), 'POLICY_PROVENANCE_BROKEN');
});

// ─── S02: evaluation ──────────────────────────────────────────────────────────

test('OCG deterministic order, closure and fail-closed graph', () => {
  const graph = composeObligations(
    [ob('c', { dependsOn: ['b'] }), ob('a'), ob('b', { dependsOn: ['a'] })],
    opts,
  );
  assert.equal(graph.ok, true);
  assert.deepEqual(graph.value.order, ['a', 'b', 'c']);
  assert.equal(failCode(composeObligations([ob('a', { dependsOn: ['ghost'] })], opts)), 'POLICY_OBLIGATION_UNKNOWN_DEPENDENCY');
  assert.equal(failCode(composeObligations(
    [ob('a'), ob('a', { statement: 'Different' })], opts,
  )), 'POLICY_OBLIGATION_DUPLICATE_NODE');
  assert.equal(failCode(composeObligations(
    [ob('a', { dependsOn: ['b'] }), ob('b', { dependsOn: ['a'] })], opts,
  )), 'POLICY_OBLIGATION_CYCLE');
  assert.equal(failCode(composeObligations([ob('a'), ob('b')], { ...opts, maxNodes: 1 })), 'POLICY_OBLIGATION_BUDGET_EXHAUSTED');
  // Same statement duplicates merge silently and deterministically.
  const merged = composeObligations([ob('a'), ob('a')], opts);
  assert.equal(merged.ok, true);
  assert.deepEqual(merged.value.order, ['a']);
});

test('CPPJ preserves conflicts; DENY and UNKNOWN dominate', () => {
  const byId = new Map([['p1', pac('p1')], ['p2', pac('p2')], ['p3', pac('p3', { precedenceDomain: 'other' })]]);
  const allow = { policyId: 'p1', decision: 'ALLOW', obligations: [ob('o1')], witness: 'w' };
  const obligated = { policyId: 'p2', decision: 'ALLOW_WITH_OBLIGATIONS', obligations: [ob('o2')], witness: 'w' };
  const compatible = joinPolicyAssessments([allow, obligated], byId);
  assert.equal(compatible.decision, 'ALLOW_WITH_OBLIGATIONS');
  assert.deepEqual(compatible.obligations.map(o => o.obligationId), ['o1', 'o2']);

  const deny = joinPolicyAssessments(
    [allow, { policyId: 'p2', decision: 'DENY', obligations: [], witness: 'w' }], byId,
  );
  assert.equal(deny.decision, 'DENY');
  assert.deepEqual(deny.denials, ['p2']);

  const unknown = joinPolicyAssessments(
    [allow, { policyId: 'p2', decision: 'BLOCK_UNKNOWN', obligations: [], witness: 'w' }], byId,
  );
  assert.equal(unknown.decision, 'BLOCK_UNKNOWN');

  const conflictSame = joinPolicyAssessments(
    [
      { policyId: 'p1', decision: 'ALLOW', obligations: [ob('o1', { statement: 'Left' })], witness: 'w' },
      { policyId: 'p2', decision: 'ALLOW', obligations: [ob('o1', { statement: 'Right' })], witness: 'w' },
    ],
    byId,
  );
  assert.equal(conflictSame.decision, 'BLOCK_UNKNOWN');
  assert.equal(conflictSame.conflicts[0].kind, 'OBLIGATION');

  const conflictCross = joinPolicyAssessments(
    [
      { policyId: 'p1', decision: 'ALLOW', obligations: [ob('o1', { statement: 'Left' })], witness: 'w' },
      { policyId: 'p3', decision: 'ALLOW', obligations: [ob('o1', { statement: 'Right' })], witness: 'w' },
    ],
    byId,
  );
  assert.equal(conflictCross.decision, 'BLOCK_UNKNOWN');
  assert.equal(conflictCross.conflicts[0].kind, 'AUTHORITY');

  // Order reversal cannot change the outcome.
  const forward = joinPolicyAssessments([allow, obligated], byId);
  const reversed = joinPolicyAssessments([obligated, allow], byId);
  assert.deepEqual(reversed, forward);
});

test('AWS explains applicable, non-applicable, unknown and blocked', () => {
  const policies = [
    pac('p-match'),
    pac('p-other', { applicability: { domains: ['OTHER'], operations: [], matchMode: 'ANY' } }),
    pac('p-empty', { applicability: { domains: [], operations: [], matchMode: 'ANY' } }),
    pac('p-future', { schemaVersion: 'v99' }),
  ];
  const set = buildApplicabilityWitnessSet(policies, { domains: ['SCOPE'], operations: [] }, ['v1']);
  const byId = new Map(set.map(s => [s.policyId, s]));
  assert.equal(byId.get('p-match').state, 'APPLICABLE');
  assert.ok(byId.get('p-match').witness.includes('SCOPE'));
  assert.equal(byId.get('p-other').state, 'NOT_APPLICABLE');
  assert.equal(byId.get('p-empty').state, 'UNKNOWN');
  assert.equal(byId.get('p-future').state, 'BLOCKED');
});

test('PDR deterministic digest and full provenance', () => {
  const input = {
    packIdentity: 'pack-001',
    taskIdentity: 'task-1',
    policyVersion: '1.0.0',
    decision: 'ALLOW_WITH_OBLIGATIONS',
    obligations: [ob('o1')],
    denials: [],
    unknowns: [],
    conflicts: [],
    exceptionsApplied: [],
    provenance: [{ sourceRef: 'prov:p1', policyId: 'p1', decisionRef: 'ALLOW_WITH_OBLIGATIONS' }],
    policyFingerprints: ['sha256:' + 'a'.repeat(64)],
  };
  const first = issuePolicyDecisionReceipt(input, opts);
  const second = issuePolicyDecisionReceipt(input, opts);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.value.digest, second.value.digest);
  assert.match(first.value.digest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(failCode(issuePolicyDecisionReceipt({ ...input, packIdentity: '' }, opts)), 'POLICY_RECEIPT_INVALID');
});

test('GSF short-circuits DENY and BLOCK_UNKNOWN, never early ALLOW', () => {
  const deny = applyShortCircuitFirewall([{ domain: 'd1', decision: 'DENY' }], ['d2', 'd3']);
  assert.equal(deny.shortCircuited, true);
  assert.deepEqual(deny.unevaluatedDomains, ['d2', 'd3']);
  const unknown = applyShortCircuitFirewall([{ domain: 'd1', decision: 'BLOCK_UNKNOWN' }], ['d2']);
  assert.equal(unknown.shortCircuited, true);
  const allow = applyShortCircuitFirewall([{ domain: 'd1', decision: 'ALLOW' }], ['d2']);
  assert.equal(allow.shortCircuited, false);
  assert.deepEqual(allow.unevaluatedDomains, []);
  const obligated = applyShortCircuitFirewall(
    [{ domain: 'd1', decision: 'ALLOW_WITH_OBLIGATIONS' }], ['d2'],
  );
  assert.equal(obligated.shortCircuited, false);
  const complete = applyShortCircuitFirewall([{ domain: 'd1', decision: 'DENY' }], []);
  assert.equal(complete.shortCircuited, false);
});

test('decidePolicy end-to-end with mandatory domains and order independence', () => {
  const policies = [
    pac('pol-allow', { obligations: [ob('audit-log')] }),
    pac('pol-deny-other', {
      scopeDomains: ['OTHER'],
      applicability: { domains: ['OTHER'], operations: [], matchMode: 'ANY' },
      effectOnMatch: 'DENY',
    }),
  ];
  const input = {
    request: { domains: ['SCOPE'], operations: [] },
    policies,
    lattice: LATTICE,
    mandatoryDomains: ['SCOPE'],
    supportedSchemas: ['v1'],
    packBinding: PACK_BINDING,
  };
  const first = decidePolicy(input, opts);
  assert.equal(first.ok, true);
  assert.equal(first.value.decision, 'ALLOW_WITH_OBLIGATIONS');
  assert.deepEqual(first.value.obligations.map(o => o.obligationId), ['audit-log']);
  const reversed = decidePolicy({ ...input, policies: [...policies].reverse() }, opts);
  assert.equal(reversed.ok, true);
  assert.equal(reversed.value.digest, first.value.digest);

  const denied = decidePolicy({
    ...input,
    request: { domains: ['OTHER'], operations: [] },
    mandatoryDomains: ['OTHER'],
  }, opts);
  assert.equal(denied.ok, true);
  assert.equal(denied.value.decision, 'DENY');

  const unresolved = decidePolicy({ ...input, mandatoryDomains: ['SCOPE', 'MISSING'] }, opts);
  assert.equal(unresolved.ok, true);
  assert.equal(unresolved.value.decision, 'BLOCK_UNKNOWN');
  assert.ok(unresolved.value.unknowns.some(u => u.includes('MISSING')));
});
