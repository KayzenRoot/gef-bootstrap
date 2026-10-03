import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createAuthorityRoot, createAuthorityRootSet, createProducerAuthorityEntry, createSourceAuthorityIndex,
  createSubjectStateBinding, createMachineEvidenceItem, createMachineEvidenceManifest, createEvidenceIntentCapsule,
  createDownstreamProofContextHandoff,
} from '../packages/evidence-engine/dist/public.js';
import {
  createCanonicalClaimIdentity, createProofObligationDeclaration, createProofNamespaceSeal,
  createProofIdentityManifest, createProofDependencyGraph, createProofSnapshotCapsule,
} from '../packages/proof-graph/dist/public.js';
import { buildTestMap, selectImpactedTests, createTestImpactResult, createTestImpactHandoff } from '../packages/test-impact-engine/dist/public.js';
import {
  M26_MECHANISMS, evaluateBugProof, createBugProofReplayGuard,
} from '../packages/heds-delta-review/dist/public.js';

const raw = value => createHash('sha256').update(value).digest('hex');
const H = value => `sha256:${raw(value)}`;
const digest = { algorithm: 'sha256', digest: raw };
const m24Options = { digest, trustedAuthorityRootDigests: [] };
const proofOptions = { digest, maxUnits: 20000 };
const m26Options = { digest, maxUnits: 20000, maxHistory: 1000 };
const m28Options = { digest, maxUnits: 20000 };
const PROJECT = 'gef-bootstrap';
const LINEAGE = 'wo-002-lineage';
const SOURCE = H('exact-source');
const POLICY = H('proof-policy');
const unwrap = result => {
  assert.equal(result.ok, true, result.ok ? '' : JSON.stringify(result.diagnostics));
  return result.value;
};

function fixture({ staleEvidenceIds = [], observationByEvidence = {}, uncertaintySource = 'src:code', candidateDigest = SOURCE, invalidationKnowledge = null,
  projectId = PROJECT, lineageId = LINEAGE, evidenceRun = '', positiveEvidenceClaims = ['HYP:1'], negativeEvidenceClaims = ['HYP:1'] } = {}) {
  const evidenceId = label => `evidence:${label}${evidenceRun ? `:${evidenceRun}` : ''}`;
  const subject = unwrap(createSubjectStateBinding({
    projectId, lineageId, subjectKind: 'WORK_ORDER', subjectId: 'GBS-V12-WO-002',
    moduleId: 'M26', workOrderId: 'GBS-V12-WO-002', checkpointDigest: H('checkpoint'),
    baseRevision: { domain: 'GIT_COMMIT', algorithm: null, value: 'base' },
    headRevision: { domain: 'GIT_COMMIT', algorithm: null, value: 'head' },
    treeRevision: { domain: 'GIT_TREE', algorithm: null, value: 'tree' },
    runtimeIdentity: { domain: 'RUNTIME', algorithm: null, value: 'node22' },
    platformIdentity: { domain: 'PLATFORM', algorithm: null, value: 'linux' },
    policyDigest: H('subject-policy'), dependencyDigests: [H('source-dependency')],
  }, m24Options));
  const root = unwrap(createAuthorityRoot({
    rootId: 'root-wo-002', rootClass: 'MODULE_GOVERNANCE', owner: 'MODULE_GOVERNANCE',
    projectId, lineageId, semanticIdentity: H('root-semantic'),
    validityBindingDigest: H('root-validity'), sourceRef: 'root:wo-002',
    allowedProducerIds: ['TEST-RUNNER'], allowedEvidenceKinds: ['TEST'],
    allowedClaimPrefixes: ['REQ', 'INV', 'HYP', 'OTHER'],
  }, m24Options));
  const rootSet = unwrap(createAuthorityRootSet(projectId, lineageId, [root], m24Options));
  const trusted = { ...m24Options, trustedAuthorityRootDigests: [root.rootDigest] };
  const entry = unwrap(createProducerAuthorityEntry({
    authorityId: 'authority:test-runner', producerId: 'TEST-RUNNER', rootId: root.rootId,
    evidenceKinds: ['TEST'], claimPrefixes: ['REQ', 'INV', 'HYP', 'OTHER'],
    sourceIdentityDigest: H('producer-source'),
  }, rootSet, trusted));
  const authorityIndex = unwrap(createSourceAuthorityIndex(rootSet, [entry], trusted));
  const claimByEvidence = new Map([
    [evidenceId('requirement'), ['REQ:1']], [evidenceId('positive'), positiveEvidenceClaims],
    [evidenceId('negative'), negativeEvidenceClaims], [evidenceId('unrelated'), ['OTHER:1']],
  ]);
  const items = [...claimByEvidence].map(([evidenceId, claimIds]) => unwrap(createMachineEvidenceItem({
    evidenceId, kind: 'TEST', producerId: 'TEST-RUNNER', subject,
    observation: observationByEvidence[evidenceId] ?? 'PASS', sourceIdentityDigest: SOURCE,
    validityBindingDigest: H(`validity:${evidenceId}`), claimIds,
    refs: [{ refId: `artifact:${evidenceId}`, kind: 'ARTIFACT_ID', contentDigest: H(`artifact:${evidenceId}`) }],
  }, trusted)));
  const evidenceManifest = unwrap(createMachineEvidenceManifest(rootSet, authorityIndex, items, trusted));
  const evaluations = items.map(item => {
    const intent = unwrap(createEvidenceIntentCapsule({
      intentId: `intent:${item.evidenceId}`, projectId, lineageId,
      subjectKind: subject.subjectKind, subjectId: subject.subjectId, claimIds: item.claimIds,
      requestedKinds: ['TEST'],
    }, trusted));
    const stale = staleEvidenceIds.includes(item.evidenceId);
    return {
      intent, rootSet, authorityIndex, manifest: evidenceManifest, evidenceId: item.evidenceId,
      currentSubject: subject,
      currentFreshness: {
        rootSetDigest: rootSet.rootSetDigest, authorityIndexDigest: authorityIndex.indexDigest,
        subjectBindingDigest: subject.bindingDigest,
        sourceIdentityDigest: stale ? H(`stale:${item.evidenceId}`) : item.sourceIdentityDigest,
        validityBindingDigest: item.validityBindingDigest, conflictSubjects: [],
      },
      compatibilityWitness: null,
    };
  });
  const m24Handoff = unwrap(createDownstreamProofContextHandoff(evaluations, 'M25_PROOF', trusted));
  const claimIds = ['REQ:1', 'INV:1', 'HYP:1', 'OTHER:1'];
  const claims = claimIds.map(claimId => unwrap(createCanonicalClaimIdentity({
    claimId, ownerId: 'WO-002-OWNER', sourceIdentityDigest: SOURCE,
    projectId, lineageId, proofPolicyDigest: POLICY,
  }, proofOptions)));
  const depDigest = label => H(`dependency:${label}`);
  const obligationInputs = [
    { obligationId: 'obligation:req', claimId: 'REQ:1', dependencies: [{ kind: 'EVIDENCE', id: evidenceId('requirement') }] },
    { obligationId: 'obligation:inv', claimId: 'INV:1', dependencies: [{ kind: 'CLAIM', id: 'REQ:1' }] },
    { obligationId: 'obligation:hyp', claimId: 'HYP:1', dependencies: [
      { kind: 'CLAIM', id: 'INV:1' }, { kind: 'EVIDENCE', id: evidenceId('positive') },
      { kind: 'EVIDENCE', id: evidenceId('negative') },
    ] },
    { obligationId: 'obligation:other', claimId: 'OTHER:1', dependencies: [{ kind: 'EVIDENCE', id: evidenceId('unrelated') }] },
  ];
  const obligations = obligationInputs.map(({ obligationId, claimId, dependencies }) => unwrap(createProofObligationDeclaration({
    obligationId, claimId, ownerId: 'WO-002-OWNER', sourceIdentityDigest: SOURCE,
    projectId, lineageId, proofPolicyDigest: POLICY, mode: 'ALL', threshold: null,
    dependencies, applicable: true, required: true, validityDependencyDigests: [depDigest(claimId)],
  }, proofOptions)));
  const namespace = unwrap(createProofNamespaceSeal(projectId, lineageId, POLICY, proofOptions));
  const proofManifest = unwrap(createProofIdentityManifest(namespace, claims, obligations, proofOptions));
  const graph = unwrap(createProofDependencyGraph(proofManifest, ['HYP:1', 'OTHER:1'], proofOptions));
  const computation = { graph, manifest: proofManifest, claims, m24: { evaluations, handoff: m24Handoff, options: trusted } };
  const snapshotInput = {
    snapshotId: `snapshot:wo-002${evidenceRun ? `:${evidenceRun}` : ''}`, computation, fingerprintDigests: [H('proof-fingerprint')], predecessorSemanticDigest: null,
  };
  if (invalidationKnowledge !== null) snapshotInput.invalidation = {
    completeKnowledge: invalidationKnowledge,
    changedDependencyDigests: [depDigest('OTHER:1')],
  };
  const proofSnapshot = unwrap(createProofSnapshotCapsule(snapshotInput, trusted, proofOptions));
  const sources = [
    { id: 'src:code', fingerprint: H('src:code') },
    { id: 'src:other', fingerprint: H('src:other') },
  ];
  const tests = [
    { id: 'test:positive', fingerprint: H('test:positive'), sources: ['src:code'] },
    { id: 'test:negative', fingerprint: H('test:negative'), sources: ['src:code'] },
    { id: 'test:final', fingerprint: H('test:final'), sources: ['src:code'] },
  ];
  const testMap = unwrap(buildTestMap(sources, tests, m28Options));
  const assurance = { requiredLevel: 'L2', policyDigest: H('test-policy'), profileDigest: H('test-profile') };
  const selection = unwrap(selectImpactedTests(testMap, [uncertaintySource], 'linux', assurance, m28Options));
  const testImpactResult = unwrap(createTestImpactResult({ selection }, m28Options));
  const testImpactHandoff = unwrap(createTestImpactHandoff('M26_HEDS', candidateDigest, testImpactResult, m28Options));
  const input = {
    bugProofId: 'bug-proof:one', requirementClaimId: 'REQ:1', invariantClaimId: 'INV:1',
    hypothesisClaimId: 'HYP:1', findingId: 'finding:one', subjectId: subject.subjectId, severity: 'HIGH',
    sourceIdentityDigest: SOURCE,
    probes: [
      { probeId: 'probe:positive', targetId: 'test:positive', evidenceId: evidenceId('positive'), role: 'POSITIVE', expectedOutcome: 'DEFECT_PRESENT', observedOutcome: 'DEFECT_PRESENT' },
      { probeId: 'probe:negative', targetId: 'test:negative', evidenceId: evidenceId('negative'), role: 'NEGATIVE', expectedOutcome: 'DEFECT_ABSENT', observedOutcome: 'DEFECT_ABSENT' },
    ],
    computation, proofSnapshot, currentProofSnapshotDigest: proofSnapshot.snapshotDigest,
    testImpact: {
      candidateDigest, mapDigest: testMap.digest, policyDigest: assurance.policyDigest, profileDigest: assurance.profileDigest,
      platform: 'linux', requiredLevel: assurance.requiredLevel, mandatoryTargetIds: ['test:final'],
      finalAssuranceTargetIds: ['test:final'], result: testImpactResult, handoff: testImpactHandoff,
    },
  };
  return { input, trusted, computation, proofSnapshot, testMap, testImpactResult, testImpactHandoff };
}

test('U12-04 registers stable M26 identity/evaluation/replay mechanisms', () => {
  assert.deepEqual(M26_MECHANISMS.slice(-3), ['BPI26', 'BPE26', 'BPR26']);
});

test('requirement → invariant → hypothesis → M28 probe → accepted M24 evidence → finding reproduces only at exact state', () => {
  const f = fixture();
  const result = unwrap(evaluateBugProof(f.input, proofOptions, m26Options));
  assert.equal(result.disposition, 'REPRODUCED_DEFECT');
  assert.equal(result.finding.state, 'OPEN');
  assert.equal(result.finding.ruleId, 'U12-04-REPRODUCED-DEFECT');
  assert.deepEqual(result.probeEvidence.map(p => p.evidenceId), ['evidence:negative', 'evidence:positive']);
  assert.ok(result.probeEvidence.every(p => p.accepted && p.proofState === 'PROVEN'));
  assert.equal(result.projectId, PROJECT);
  assert.equal(result.lineageId, LINEAGE);
  assert.equal(result.proofSnapshotDigest, f.proofSnapshot.snapshotDigest);
  assert.ok(result.hypothesisDigest.startsWith('sha256:'));
});

test('unrun or refuted positive probe remains a hypothesis, never a reproduced defect', () => {
  const f = fixture();
  const unrun = unwrap(evaluateBugProof({ ...f.input, probes: f.input.probes.map(p => p.role === 'POSITIVE' ? { ...p, observedOutcome: 'NOT_RUN' } : p) }, proofOptions, m26Options));
  assert.equal(unrun.disposition, 'HYPOTHESIS');
  assert.equal(unrun.finding.state, 'INDETERMINATE');
  const refuted = unwrap(evaluateBugProof({ ...f.input, probes: f.input.probes.map(p => p.role === 'POSITIVE' ? { ...p, observedOutcome: 'DEFECT_ABSENT' } : p) }, proofOptions, m26Options));
  assert.equal(refuted.disposition, 'HYPOTHESIS');
  assert.equal(refuted.finding.ruleId, 'U12-04-UNRESOLVED-HYPOTHESIS');
});

test('negative controls are retained and a failed control blocks reproduction', () => {
  const f = fixture();
  const failedControl = unwrap(evaluateBugProof({ ...f.input, probes: f.input.probes.map(p => p.role === 'NEGATIVE' ? { ...p, observedOutcome: 'DEFECT_PRESENT' } : p) }, proofOptions, m26Options));
  assert.equal(failedControl.disposition, 'INDETERMINATE');
  assert.ok(failedControl.reasonCodes.includes('NEGATIVE_CONTROL_NOT_SATISFIED'));
  assert.ok(failedControl.probeEvidence.some(p => p.role === 'NEGATIVE' && p.evidenceId === 'evidence:negative'));
});

test('stale/rejected evidence stays indeterminate and unrelated stale evidence does not invalidate a complete narrow proof', () => {
  const staleTarget = fixture({ staleEvidenceIds: ['evidence:negative'] });
  const staleResult = unwrap(evaluateBugProof(staleTarget.input, proofOptions, m26Options));
  assert.equal(staleResult.disposition, 'INDETERMINATE');
  assert.equal(staleResult.probeEvidence.find(p => p.evidenceId === 'evidence:negative').proofState, 'STALE');
  const staleUnrelated = fixture({ staleEvidenceIds: ['evidence:unrelated'] });
  const narrowResult = unwrap(evaluateBugProof(staleUnrelated.input, proofOptions, m26Options));
  assert.equal(narrowResult.disposition, 'REPRODUCED_DEFECT');
  assert.ok(narrowResult.probeEvidence.every(p => p.accepted));
  const provenNarrowClosure = fixture({ invalidationKnowledge: true });
  const selectiveResult = unwrap(evaluateBugProof(provenNarrowClosure.input, proofOptions, m26Options));
  assert.equal(selectiveResult.disposition, 'REPRODUCED_DEFECT');
  assert.equal(selectiveResult.invalidationKnowledgeComplete, true);
  assert.ok(selectiveResult.invalidationVectorDigest);
  assert.deepEqual(selectiveResult.invalidationChangedDependencyDigests, [H('dependency:OTHER:1')]);
  const unknownClosure = fixture({ invalidationKnowledge: false });
  const unknownResult = unwrap(evaluateBugProof(unknownClosure.input, proofOptions, m26Options));
  assert.equal(unknownResult.disposition, 'INDETERMINATE');
  assert.equal(unknownResult.invalidationKnowledgeComplete, false);
});

test('false-positive adjudication requires explicit rationale and accepted evidence, then supersedes with retained lineage', () => {
  const prior = fixture();
  const priorReceipt = unwrap(evaluateBugProof(prior.input, proofOptions, m26Options));
  const f = fixture({ evidenceRun: 'current' });
  const falsePositive = unwrap(evaluateBugProof({
    ...f.input,
    findingId: 'finding:resolved',
    probes: f.input.probes.map(p => p.role === 'POSITIVE' ? { ...p, observedOutcome: 'DEFECT_ABSENT' } : p),
    falsePositive: { priorFinding: priorReceipt.finding, priorReceipt, rationale: 'Current controls and accepted reproduction evidence refute the prior finding.', evidenceIds: ['evidence:positive:current'] },
  }, proofOptions, m26Options));
  assert.equal(falsePositive.disposition, 'FALSE_POSITIVE');
  assert.equal(falsePositive.finding.state, 'RESOLVED');
  assert.equal(falsePositive.finding.supersedesFindingDigest, priorReceipt.finding.findingDigest);
  assert.equal(falsePositive.predecessorFindingDigest, priorReceipt.finding.findingDigest);
  assert.equal(falsePositive.falsePositiveRationale, 'Current controls and accepted reproduction evidence refute the prior finding.');
  assert.deepEqual(falsePositive.falsePositiveEvidenceIds, ['evidence:positive:current']);
  assert.notEqual(falsePositive.finding.findingDigest, priorReceipt.finding.findingDigest);
  const refutedInput = {
    ...f.input,
    probes: f.input.probes.map(p => p.role === 'POSITIVE' ? { ...p, observedOutcome: 'DEFECT_ABSENT' } : p),
  };
  const otherProof = fixture({ evidenceRun: 'other-proof' });
  const otherProofReceipt = unwrap(evaluateBugProof({
    ...otherProof.input,
    bugProofId: 'bug-proof:other',
    findingId: 'finding:other',
  }, proofOptions, m26Options));
  const crossProofLineage = evaluateBugProof({
    ...refutedInput,
    findingId: 'finding:cross-proof-lineage',
    falsePositive: {
      priorFinding: otherProofReceipt.finding,
      priorReceipt: otherProofReceipt,
      rationale: 'Current evidence must not resolve a different bug proof.',
      evidenceIds: ['evidence:positive:current'],
    },
  }, proofOptions, m26Options);
  assert.equal(crossProofLineage.ok, false);
  const forgedPriorFinding = { ...priorReceipt.finding, afterSemanticDigest: H('forged-predecessor') };
  const mismatchedPriorFinding = evaluateBugProof({
    ...refutedInput,
    findingId: 'finding:mismatched-prior',
    falsePositive: {
      priorFinding: forgedPriorFinding,
      priorReceipt,
      rationale: 'The predecessor fields must match the verified prior receipt.',
      evidenceIds: ['evidence:positive:current'],
    },
  }, proofOptions, m26Options);
  assert.equal(mismatchedPriorFinding.ok, false);
  const shortRationale = evaluateBugProof({
    ...f.input,
    findingId: 'finding:short-rationale',
    probes: f.input.probes.map(p => p.role === 'POSITIVE' ? { ...p, observedOutcome: 'DEFECT_ABSENT' } : p),
    falsePositive: { priorFinding: priorReceipt.finding, priorReceipt, rationale: 'brief', evidenceIds: ['evidence:positive:current'] },
  }, proofOptions, m26Options);
  assert.equal(shortRationale.ok, false);
  assert.equal(shortRationale.diagnostics[0].code, 'BPE26_FALSE_POSITIVE_UNSUPPORTED');

  for (const foreign of [fixture({ projectId: 'other-project' }), fixture({ lineageId: 'other-lineage' })]) {
    const foreignReceipt = unwrap(evaluateBugProof(foreign.input, proofOptions, m26Options));
    const crossLineage = {
      ...f.input,
      findingId: 'finding:cross-lineage',
      probes: f.input.probes.map(p => p.role === 'POSITIVE' ? { ...p, observedOutcome: 'DEFECT_ABSENT' } : p),
      falsePositive: {
        priorFinding: foreignReceipt.finding,
        priorReceipt: foreignReceipt,
        rationale: 'Current controls refute the prior finding but its origin is foreign.',
        evidenceIds: ['evidence:positive:current'],
      },
    };
    assert.equal(evaluateBugProof(crossLineage, proofOptions, m26Options).ok, false);
  }
});

test('M28 uncertainty widens to L4 and remains indeterminate; mandatory/final targets cannot be omitted', () => {
  const widened = fixture({ uncertaintySource: 'src:unknown' });
  assert.equal(widened.testImpactResult.selection.uncertainty, 'UNKNOWN');
  assert.ok(['L4', 'L5'].includes(widened.testImpactResult.selection.level));
  const result = unwrap(evaluateBugProof(widened.input, proofOptions, m26Options));
  assert.equal(result.disposition, 'INDETERMINATE');
  const omitted = fixture();
  const bad = { ...omitted.input, testImpact: { ...omitted.input.testImpact, mandatoryTargetIds: ['test:missing'] } };
  assert.equal(evaluateBugProof(bad, proofOptions, m26Options).ok, false);
  const conservative = fixture();
  const widenedResult = unwrap(createTestImpactResult({ selection: conservative.testImpactResult.selection, state: 'WIDENED' }, m28Options));
  const widenedHandoff = unwrap(createTestImpactHandoff('M26_HEDS', SOURCE, widenedResult, m28Options));
  const widenedWithoutUncertainty = unwrap(evaluateBugProof({
    ...conservative.input,
    testImpact: { ...conservative.input.testImpact, result: widenedResult, handoff: widenedHandoff },
  }, proofOptions, m26Options));
  assert.equal(widenedWithoutUncertainty.disposition, 'INDETERMINATE');
});

test('cross-context, stale snapshot, missing lineage and mix-and-match evidence fail closed', () => {
  const f = fixture();
  assert.equal(evaluateBugProof({ ...f.input, currentProofSnapshotDigest: H('another-snapshot') }, proofOptions, m26Options).ok, false);
  assert.equal(evaluateBugProof({ ...f.input, sourceIdentityDigest: H('foreign-source') }, proofOptions, m26Options).ok, false);
  assert.equal(evaluateBugProof({ ...f.input, probes: f.input.probes.map(p => p.evidenceId === 'evidence:negative' ? { ...p, evidenceId: 'evidence:unrelated' } : p) }, proofOptions, m26Options).ok, false);
  const missingControl = { ...f.input, probes: f.input.probes.filter(p => p.role !== 'NEGATIVE') };
  assert.equal(evaluateBugProof(missingControl, proofOptions, m26Options).ok, false);
  const wrongClaim = fixture({ positiveEvidenceClaims: ['REQ:1'] });
  assert.equal(evaluateBugProof(wrongClaim.input, proofOptions, m26Options).ok, false);
  const malformedRole = { ...f.input, probes: f.input.probes.map(p => p.role === 'POSITIVE' ? { ...p, role: 'UNCLASSIFIED' } : p) };
  assert.equal(evaluateBugProof(malformedRole, proofOptions, m26Options).ok, false);
});

test('replay deduplicates exact receipts, detects same-context split brain and bounds history', () => {
  const f = fixture();
  const receipt = unwrap(evaluateBugProof(f.input, proofOptions, m26Options));
  const replay = unwrap(createBugProofReplayGuard([receipt, receipt], m26Options));
  assert.equal(replay.state, 'CLEAR');
  assert.deepEqual(replay.duplicateReceiptDigests, [receipt.receiptDigest]);
  const hypothesis = unwrap(evaluateBugProof({
    ...f.input,
    probes: f.input.probes.map(probe => probe.role === 'POSITIVE' ? { ...probe, observedOutcome: 'NOT_RUN' } : probe),
  }, proofOptions, m26Options));
  const conflict = unwrap(createBugProofReplayGuard([receipt, hypothesis], m26Options));
  assert.equal(conflict.state, 'CONFLICT');
  assert.deepEqual(conflict.conflictingBugProofIds, ['bug-proof:one']);
  const reused = fixture();
  const secondFinding = unwrap(evaluateBugProof({ ...reused.input, bugProofId: 'bug-proof:two', findingId: 'finding:two' }, proofOptions, m26Options));
  assert.equal(secondFinding.hypothesisDigest, receipt.hypothesisDigest);
  const evidenceConflict = unwrap(createBugProofReplayGuard([receipt, secondFinding], m26Options));
  assert.equal(evidenceConflict.state, 'CONFLICT');
  assert.equal(evidenceConflict.doubleCountedEvidenceDigests.length, 2);
  const bounded = unwrap(createBugProofReplayGuard([receipt, receipt], { ...m26Options, maxHistory: 1 }));
  assert.equal(bounded.state, 'TRUNCATED');
  assert.equal(bounded.historyTruncated, true);
});

test('input order does not change semantic receipt; duplicate probes and U12-05/profile fields are excluded', () => {
  const f = fixture();
  const a = unwrap(evaluateBugProof(f.input, proofOptions, m26Options));
  const b = unwrap(evaluateBugProof({ ...f.input, probes: [...f.input.probes].reverse() }, proofOptions, m26Options));
  assert.equal(a.hypothesisDigest, b.hypothesisDigest);
  assert.equal(a.receiptDigest, b.receiptDigest);
  assert.equal(evaluateBugProof({ ...f.input, probes: [f.input.probes[0], f.input.probes[0]] }, proofOptions, m26Options).ok, false);
  assert.equal(Object.hasOwn(a, 'causalRepair'), false);
  assert.equal(Object.hasOwn(a, 'flakeRegistry'), false);
  assert.equal(Object.hasOwn(a, 'profile'), false);
});

test('cancellation and operation budget return failure, not optimistic disposition', () => {
  const f = fixture();
  const cancelled = evaluateBugProof(f.input, proofOptions, { ...m26Options, cancellation: { isCancelled: () => true } });
  assert.equal(cancelled.ok, false);
  assert.equal(cancelled.diagnostics[0].code, 'OPERATION_CANCELLED');
  const exhausted = evaluateBugProof(f.input, proofOptions, { ...m26Options, maxUnits: 1 });
  assert.equal(exhausted.ok, false);
  assert.equal(exhausted.diagnostics[0].code, 'OPERATION_BUDGET_EXCEEDED');
});
