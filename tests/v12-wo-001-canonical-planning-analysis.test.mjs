import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as m15 from '../packages/execution-pack-compiler/dist/public.js';

const digest = {
  algorithm: 'sha256',
  digest: value => createHash('sha256').update(value).digest('hex'),
};
const options = { digest };

const DOMAINS = [
  'SCOPE', 'REQUIREMENTS', 'ARCHITECTURE', 'SECURITY',
  'TESTS', 'DEPLOYMENT', 'DECISIONS', 'DEFINITION_OF_DONE',
];

function hasPlanningAnalysisApi() {
  assert.equal(typeof m15.analyzeCanonicalPlan, 'function');
  return typeof m15.analyzeCanonicalPlan === 'function';
}

function domainGraph() {
  return [
    { domain: 'SCOPE', dependentDomains: ['REQUIREMENTS'] },
    { domain: 'REQUIREMENTS', dependentDomains: ['ARCHITECTURE', 'SECURITY'] },
    { domain: 'ARCHITECTURE', dependentDomains: ['SECURITY'] },
    { domain: 'SECURITY', dependentDomains: ['TESTS'] },
    { domain: 'TESTS', dependentDomains: ['DEPLOYMENT'] },
    { domain: 'DEPLOYMENT', dependentDomains: ['DECISIONS'] },
    { domain: 'DECISIONS', dependentDomains: ['DEFINITION_OF_DONE'] },
    { domain: 'DEFINITION_OF_DONE', dependentDomains: [] },
  ];
}

function fixture(overrides = {}) {
  const requirements = [
    {
      requirementId: 'REQ-SCOPE', domain: 'SCOPE', dependsOn: [],
      proofRefs: ['proof-scope'], criticalPath: true, required: true,
    },
    {
      requirementId: 'REQ-SECURITY', domain: 'SECURITY', dependsOn: ['REQ-SCOPE'],
      proofRefs: ['proof-security'], criticalPath: true, required: true,
    },
    {
      requirementId: 'REQ-TESTS', domain: 'TESTS', dependsOn: ['REQ-SECURITY'],
      proofRefs: ['proof-tests'], criticalPath: false, required: true,
    },
  ];
  return {
    planId: 'plan-v12-wo001',
    planVersion: '2',
    binding: {
      projectId: 'project-gef',
      sourcePackIdentity: 'source-pack-v12-1',
      profileIdentity: 'profile-universal-core',
      profileDigest: 'sha256:profile-1',
      policyVersion: 'policy-v1',
      checkpointIdentity: 'checkpoint-main-8e63',
    },
    requirements,
    proofs: [
      { proofRef: 'proof-scope', sourceId: 'scope.md', sourceFingerprint: 'fp-scope', knowledgeState: 'KNOWN' },
      { proofRef: 'proof-security', sourceId: 'security.md', sourceFingerprint: 'fp-security', knowledgeState: 'KNOWN' },
      { proofRef: 'proof-tests', sourceId: 'tests.md', sourceFingerprint: 'fp-tests', knowledgeState: 'KNOWN' },
    ],
    currentSourceFingerprints: [
      { sourceId: 'scope.md', fingerprint: 'fp-scope' },
      { sourceId: 'security.md', fingerprint: 'fp-security' },
      { sourceId: 'tests.md', fingerprint: 'fp-tests' },
    ],
    domainDependencies: domainGraph(),
    unknownAuthorityDomains: [],
    ownerChanges: [],
    ...overrides,
  };
}

test('canonical plan proves exact requirement links and deterministic critical-path gaps', () => {
  if (!hasPlanningAnalysisApi()) return;

  const base = fixture();
  const changedOrder = fixture({
    requirements: [...base.requirements].reverse(),
    proofs: [...base.proofs].reverse(),
    domainDependencies: [...base.domainDependencies].reverse(),
  });
  const first = m15.analyzeCanonicalPlan(base, options);
  const second = m15.analyzeCanonicalPlan(changedOrder, options);

  assert.equal(first.ok, true);
  assert.equal(first.value.state, 'COMPLETE');
  assert.deepEqual(first.value.requirements.map(item => [item.requirementId, item.proofLinks.map(link => link.proofRef)]), [
    ['REQ-SCOPE', ['proof-scope']],
    ['REQ-SECURITY', ['proof-security']],
    ['REQ-TESTS', ['proof-tests']],
  ]);
  assert.deepEqual(first.value.missingCriticalPathObligationIds, []);
  assert.deepEqual(first.value.dependencyClosure.closedUnitIds, ['REQ-SCOPE', 'REQ-SECURITY', 'REQ-TESTS']);
  assert.equal(first.value.semanticIdentity, second.value.semanticIdentity);
  assert.equal(first.value.requirements.every(item => item.knowledgeState === 'KNOWN'), true);
});

test('owner change impact follows canonical domain and requirement dependencies exactly', () => {
  if (!hasPlanningAnalysisApi()) return;

  const plan = fixture({
    ownerChanges: [{
      changeId: 'change-security-1',
      sourceId: 'security.md',
      domain: 'SECURITY',
      previousFingerprint: 'fp-security-old',
      currentFingerprint: 'fp-security',
    }],
  });
  const result = m15.analyzeCanonicalPlan(plan, options);

  assert.equal(result.value.ownerChangeImpact.state, 'KNOWN');
  assert.deepEqual(result.value.ownerChangeImpact.affectedDomains, [
    'DECISIONS', 'DEFINITION_OF_DONE', 'DEPLOYMENT', 'SECURITY', 'TESTS',
  ]);
  assert.deepEqual(result.value.ownerChangeImpact.affectedRequirementIds, ['REQ-SECURITY', 'REQ-TESTS']);
  assert.deepEqual(result.value.ownerChangeImpact.affectedProofRefs, ['proof-security', 'proof-tests']);
});

test('narrow deployment change leaves unrelated scope and security proof untouched', () => {
  if (!hasPlanningAnalysisApi()) return;

  const base = fixture();
  const plan = fixture({
    requirements: [...base.requirements, {
      requirementId: 'REQ-DEPLOY', domain: 'DEPLOYMENT', dependsOn: [],
      proofRefs: ['proof-deploy'], criticalPath: false, required: false,
    }],
    proofs: [...base.proofs, {
      proofRef: 'proof-deploy', sourceId: 'deployment.md', sourceFingerprint: 'fp-deploy', knowledgeState: 'KNOWN',
    }],
    currentSourceFingerprints: [...base.currentSourceFingerprints, { sourceId: 'deployment.md', fingerprint: 'fp-deploy' }],
    ownerChanges: [{
      changeId: 'change-deploy-1', sourceId: 'deployment.md', domain: 'DEPLOYMENT',
      previousFingerprint: 'fp-deploy-old', currentFingerprint: 'fp-deploy',
    }],
  });
  const result = m15.analyzeCanonicalPlan(plan, options);

  assert.deepEqual(result.value.ownerChangeImpact.affectedDomains, [
    'DECISIONS', 'DEFINITION_OF_DONE', 'DEPLOYMENT',
  ]);
  assert.deepEqual(result.value.ownerChangeImpact.affectedRequirementIds, ['REQ-DEPLOY']);
  assert.equal(result.value.ownerChangeImpact.affectedRequirementIds.includes('REQ-SCOPE'), false);
  assert.equal(result.value.ownerChangeImpact.affectedProofRefs.includes('proof-security'), false);
});

test('stale evidence, missing critical proofs and unknown authority never become known', () => {
  if (!hasPlanningAnalysisApi()) return;

  const base = fixture();
  const plan = fixture({
    proofs: base.proofs.filter(proof => proof.proofRef !== 'proof-security'),
    currentSourceFingerprints: base.currentSourceFingerprints.map(source =>
      source.sourceId === 'tests.md' ? { ...source, fingerprint: 'fp-tests-new' } : source),
    unknownAuthorityDomains: [{ domain: 'SECURITY', reason: 'security authority receipt is absent' }],
  });
  const result = m15.analyzeCanonicalPlan(plan, options);

  assert.equal(result.value.state, 'INDETERMINATE');
  assert.deepEqual(result.value.missingCriticalPathObligationIds, ['REQ-SECURITY']);
  assert.equal(result.value.requirements.find(item => item.requirementId === 'REQ-SECURITY').knowledgeState, 'UNRESOLVED');
  assert.equal(result.value.requirements.find(item => item.requirementId === 'REQ-TESTS').knowledgeState, 'UNRESOLVED');
  assert.equal(result.value.unknowns.some(item => item.kind === 'AUTHORITY_UNKNOWN' && item.subject === 'SECURITY'), true);
  assert.equal(result.value.requirements.find(item => item.requirementId === 'REQ-TESTS').proofLinks[0].knowledgeState, 'UNRESOLVED');
});

test('privileged security change widens impact through tests, deployment and decisions', () => {
  if (!hasPlanningAnalysisApi()) return;
  const base = fixture();
  const result = m15.analyzeCanonicalPlan(fixture({
    ownerChanges: [{
      changeId: 'change-auth-schema', sourceId: 'security.md', domain: 'SECURITY',
      previousFingerprint: 'old-security', currentFingerprint: 'fp-security',
    }],
  }), options);

  assert.deepEqual(result.value.ownerChangeImpact.affectedDomains, [
    'DECISIONS', 'DEFINITION_OF_DONE', 'DEPLOYMENT', 'SECURITY', 'TESTS',
  ]);
  assert.deepEqual(result.value.ownerChangeImpact.affectedRequirementIds, ['REQ-SECURITY', 'REQ-TESTS']);
});

test('unknown dependency, cycle, graph budget and cancellation fail safely', () => {
  if (!hasPlanningAnalysisApi()) return;

  const unknown = fixture({ requirements: fixture().requirements.map(item => item.requirementId === 'REQ-SECURITY'
    ? { ...item, dependsOn: ['REQ-MISSING'] } : item) });
  const unknownResult = m15.analyzeCanonicalPlan(unknown, options).value;
  assert.equal(unknownResult.state, 'INDETERMINATE');
  assert.equal(unknownResult.dependencyClosure.state, 'UNKNOWN_DEPENDENCY');
  assert.deepEqual(unknownResult.dependencyClosure.unknownRefs, ['REQ-MISSING']);

  const cycle = fixture({ requirements: [
    { requirementId: 'REQ-A', domain: 'SCOPE', dependsOn: ['REQ-B'], proofRefs: ['proof-scope'], criticalPath: true, required: true },
    { requirementId: 'REQ-B', domain: 'SECURITY', dependsOn: ['REQ-A'], proofRefs: ['proof-security'], criticalPath: true, required: true },
  ] });
  const cycleResult = m15.analyzeCanonicalPlan(cycle, options).value;
  assert.equal(cycleResult.state, 'BLOCKED');
  assert.equal(cycleResult.dependencyClosure.state, 'CYCLE_DETECTED');

  const exhausted = m15.analyzeCanonicalPlan(fixture(), { ...options, maxNodes: 1 });
  assert.equal(exhausted.value.state, 'INDETERMINATE');
  assert.equal(exhausted.value.dependencyClosure.state, 'BUDGET_EXHAUSTED');

  const cancelled = m15.analyzeCanonicalPlan(fixture(), { ...options, cancellation: { isCancelled: () => true } });
  assert.equal(cancelled.ok, false);
  assert.equal(cancelled.diagnostics[0].code, 'CANCELLED');
});

test('unknown domain topology and mismatched owner-change fingerprints remain unresolved', () => {
  if (!hasPlanningAnalysisApi()) return;

  const base = fixture();
  const missingDomain = m15.analyzeCanonicalPlan(fixture({
    domainDependencies: base.domainDependencies.filter(node => node.domain !== 'DEFINITION_OF_DONE'),
  }), options).value;
  assert.equal(missingDomain.state, 'INDETERMINATE');
  assert.equal(missingDomain.ownerChangeImpact.state, 'UNRESOLVED');
  assert.equal(missingDomain.ownerChangeImpact.unknownDomains.includes('DEFINITION_OF_DONE'), true);

  const changedWithoutCurrentProof = m15.analyzeCanonicalPlan(fixture({
    ownerChanges: [{
      changeId: 'change-without-current-fingerprint', sourceId: 'security.md', domain: 'SECURITY',
      previousFingerprint: 'old', currentFingerprint: 'unobserved',
    }],
  }), options).value;
  assert.equal(changedWithoutCurrentProof.state, 'INDETERMINATE');
  assert.equal(changedWithoutCurrentProof.ownerChangeImpact.state, 'UNRESOLVED');
  assert.equal(changedWithoutCurrentProof.ownerChangeImpact.unknownChangeIds.includes('change-without-current-fingerprint'), true);
});
