import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createTaskIntentEnvelope,
  validateTaskIntentEnvelopeBinding,
  createAuthorityBoundContextUnit,
  validateAbcuBinding,
  computeContextDependencyClosure,
  routeTaskToSources,
  applyAuthorityBoundSelectionFilter,
  validateContextAuthorityMatrix,
  buildAuthorityNeighborhoodProjection,
  applyContextRedundancyBarrier,
  computeContextCutFrontier,
  buildSemanticCoverageLattice,
  buildContextDeficitVector,
  buildMinimumContextWitness,
  buildContextSufficiencyProof,
  evaluateFullContextSafetyGate,
  computeRiskAdaptiveContextAperture,
  scanDependencyShockwave,
  runUnknownUnknownSentinel,
  advanceExpansionLadder,
  computeContextSemanticDigest,
  buildTaskContextCapsule,
  computeSelectiveContextInvalidationGraph,
  detectContextRegression,
  buildExecutionHandoffContract,
  evaluateCapsuleValidity,
} from '../packages/task-context-compiler/dist/public.js';

const digest = {
  algorithm: 'sha256',
  digest: value => createHash('sha256').update(value).digest('hex'),
};
const opts = { digest };
const PROFILE_DIGEST = 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

function makeTieInput(overrides = {}) {
  return {
    taskId: 'task-test-01',
    taskClass: 'READ_ONLY_QUERY',
    riskClass: 'STANDARD',
    objectiveSummary: 'Deterministic compilation of task context',
    targetDomains: ['SCOPE', 'ARCH'],
    requiredCapabilities: ['READ_CONTEXT'],
    projectId: 'proj-gef',
    sourcePackIdentity: 'sp-canon-01',
    profileIdentity: 'node-typescript',
    profileDigest: PROFILE_DIGEST,
    policyVersion: '1.0.0',
    checkpointIdentity: 'chk-001',
    ...overrides,
  };
}

function makeAbcuInput(id, domain, role = 'NORMATIVE', overrides = {}) {
  return {
    unitId: id,
    domain,
    role,
    applicability: 'ACTIVE',
    authorityRef: `auth-${domain.toLowerCase()}`,
    sourceFingerprint: `fp-${id}`,
    projectId: 'proj-gef',
    sourcePackIdentity: 'sp-canon-01',
    profileIdentity: 'node-typescript',
    profileDigest: PROFILE_DIGEST,
    policyVersion: '1.0.0',
    checkpointIdentity: 'chk-001',
    semanticPayloadRef: `ref:${domain}:${id}`,
    sensitivity: 'INTERNAL',
    ...overrides,
  };
}

function buildValidFixture() {
  const tie = createTaskIntentEnvelope(makeTieInput({ targetDomains: ['SCOPE'] }), opts).value;
  const unit = createAuthorityBoundContextUnit(makeAbcuInput('u-scope', 'SCOPE'), opts).value;
  const obligations = [{ obligationId: 'ob-scope', domain: 'SCOPE', requiredRoles: ['NORMATIVE'], mandatory: true }];
  const lattice = buildSemanticCoverageLattice(tie, obligations, [unit], opts).value;
  const closure = computeContextDependencyClosure(
    ['u-scope'],
    new Map([['u-scope', { id: 'u-scope', dependencies: [] }]]),
    undefined,
    opts,
  ).value;
  const deficit = buildContextDeficitVector(tie, lattice, closure, { unresolvedCount: 0, conflictCount: 0 }, 'STANDARD');
  const witness = buildMinimumContextWitness(tie, [unit], [unit], lattice, opts).value;
  const proof = buildContextSufficiencyProof({
    tie,
    lattice,
    deficitVector: deficit,
    witness,
    closure,
    validityFingerprints: [unit.sourceFingerprint],
    exclusionJustifications: [],
  }, opts).value;
  const capsule = buildTaskContextCapsule({
    taskIntentEnvelope: tie,
    projectId: tie.projectId,
    sourcePackIdentity: tie.sourcePackIdentity,
    profileIdentity: tie.profileIdentity,
    profileDigest: tie.profileDigest,
    policyVersion: tie.policyVersion,
    checkpointIdentity: tie.checkpointIdentity,
    selectedUnits: [unit],
    authorityProofs: [{ domain: 'SCOPE', sourceId: unit.unitId, proofRef: 'proof-scope', conflictState: 'RESOLVED' }],
    sufficiencyProof: proof,
    expansionTrace: [],
    exclusions: [],
    validity: 'VALID',
  }, opts).value;
  return { tie, unit, lattice, closure, deficit, witness, proof, capsule };
}

test('S01 deterministic TIE, ABCU binding and bounded dependency closure', () => {
  const a = createTaskIntentEnvelope(makeTieInput({ targetDomains: ['ARCH', 'SCOPE'] }), opts);
  const b = createTaskIntentEnvelope(makeTieInput({ targetDomains: ['SCOPE', 'ARCH'] }), opts);
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(a.value.semanticIdentity, b.value.semanticIdentity);
  assert.match(a.value.semanticIdentity, /^sha256:[0-9a-f]{64}$/);

  const badClass = createTaskIntentEnvelope(makeTieInput({ taskClass: 'UNKNOWN_CLASS' }), opts);
  assert.equal(badClass.ok, false);

  const unit = createAuthorityBoundContextUnit(makeAbcuInput('u1', 'SCOPE'), opts).value;
  assert.equal(validateAbcuBinding(unit, {
    projectId: 'proj-gef',
    sourcePackIdentity: 'sp-canon-01',
    checkpointIdentity: 'chk-001',
    currentFingerprints: [{ id: 'u1', fingerprint: 'fp-u1' }],
  }).ok, true);
  assert.equal(validateAbcuBinding(unit, {
    projectId: 'other-project',
    sourcePackIdentity: 'sp-canon-01',
    checkpointIdentity: 'chk-001',
    currentFingerprints: [{ id: 'u1', fingerprint: 'fp-u1' }],
  }).ok, false);

  const graph = new Map([
    ['a', { id: 'a', dependencies: ['b'] }],
    ['b', { id: 'b', dependencies: ['c'] }],
    ['c', { id: 'c', dependencies: [] }],
  ]);
  assert.equal(computeContextDependencyClosure(['a'], graph, undefined, opts).value.state, 'COMPLETE');
  assert.equal(computeContextDependencyClosure(['a'], graph, { maxNodes: 2 }, opts).value.state, 'BUDGET_EXHAUSTED');
  const cycle = new Map([
    ['a', { id: 'a', dependencies: ['b'] }],
    ['b', { id: 'b', dependencies: ['a'] }],
  ]);
  assert.equal(computeContextDependencyClosure(['a'], cycle, undefined, opts).value.state, 'CYCLE_DETECTED');

  const bindingMismatch = validateTaskIntentEnvelopeBinding(a.value, {
    projectId: 'proj-gef',
    sourcePackIdentity: 'other-pack',
    policyVersion: '1.0.0',
  });
  assert.equal(bindingMismatch.ok, false);
});

test('S02 routing relevance remains separate from authority and conflicts fail closed', () => {
  const tie = createTaskIntentEnvelope(makeTieInput(), opts).value;
  const candidates = [
    { sourceId: 'src-1', domains: ['SCOPE'], routingRelevance: 0.95, authorityRef: 'auth-scope', applicabilityState: 'ACTIVE', sourceFingerprint: 'fp-src1' },
    { sourceId: 'src-2', domains: ['ARCH'], routingRelevance: 0.4, authorityRef: 'auth-arch', applicabilityState: 'ACTIVE', sourceFingerprint: 'fp-src2' },
    { sourceId: 'src-3', domains: ['OTHER'], routingRelevance: 1, authorityRef: 'auth-other', applicabilityState: 'ACTIVE', sourceFingerprint: 'fp-src3' },
  ];
  const route = routeTaskToSources(tie, candidates, opts).value;
  assert.equal(route.candidates.length, 2);

  const u1 = createAuthorityBoundContextUnit(makeAbcuInput('src-1', 'SCOPE'), opts).value;
  const u2 = createAuthorityBoundContextUnit(makeAbcuInput('src-2', 'ARCH'), opts).value;
  const units = new Map([['src-1', u1], ['src-2', u2]]);
  const proofs = [
    { domain: 'SCOPE', sourceId: 'src-1', proofRef: 'p1', conflictState: 'RESOLVED' },
    { domain: 'ARCH', sourceId: 'src-2', proofRef: 'p2', conflictState: 'RESOLVED' },
  ];
  const selected = applyAuthorityBoundSelectionFilter({ taskIntentEnvelope: tie, routeCandidates: route.candidates, authorityProofs: proofs }, units, opts).value;
  assert.equal(selected.selected.length, 2);
  assert.equal(validateContextAuthorityMatrix(selected.matrix).ok, true);

  const conflict = applyAuthorityBoundSelectionFilter({
    taskIntentEnvelope: tie,
    routeCandidates: route.candidates,
    authorityProofs: [{ domain: 'SCOPE', sourceId: 'src-1', proofRef: 'pc', conflictState: 'CONFLICT', conflictingSourceIds: ['src-alt'] }],
  }, units, opts).value;
  assert.equal(validateContextAuthorityMatrix(conflict.matrix).ok, false);

  assert.equal(applyContextRedundancyBarrier([u1, u1], opts).value.length, 1);
  assert.equal(buildAuthorityNeighborhoodProjection(
    tie.taskId,
    [{ sourceId: 'src-1', domain: 'SCOPE', authorityStrength: 0.9, neighborIds: ['src-2'] }],
    undefined,
    opts,
  ).value.nodes.length, 1);
});

test('S03 MSC proof exposes lattice, deficit, witness and cut frontier', () => {
  const { tie, unit, lattice, closure, deficit, witness, proof } = buildValidFixture();
  assert.equal(lattice.overallCoverage, 'COVERED');
  assert.equal(deficit.isEmpty, true);
  assert.equal(witness.includedUnits.length, 1);
  assert.equal(proof.sufficiencyState, 'SUFFICIENT');
  assert.deepEqual(computeContextCutFrontier(tie, [unit], closure).frontierUnitIds, ['u-scope']);
});

test('S04 safety gate, RACA, shockwave, UUS and expansion ladder are fail-closed', () => {
  const { tie, proof } = buildValidFixture();
  const clean = evaluateFullContextSafetyGate({
    tie,
    proof,
    hasStaleCheckpointBinding: false,
    hasStaleSourceBinding: false,
    hasStaleProfileBinding: false,
    hasPriorContextRegression: false,
    hasDestructiveOperation: false,
    hasHighRiskDomain: false,
    callerRequiresBroaderInspection: false,
  }, opts).value;
  assert.equal(clean.narrowContextPermitted, true);
  assert.equal(computeRiskAdaptiveContextAperture(tie, proof, clean).apertureLevel, 'NARROW');

  const stale = evaluateFullContextSafetyGate({
    tie,
    proof,
    hasStaleCheckpointBinding: true,
    hasStaleSourceBinding: false,
    hasStaleProfileBinding: false,
    hasPriorContextRegression: false,
    hasDestructiveOperation: false,
    hasHighRiskDomain: false,
    callerRequiresBroaderInspection: false,
  }, opts).value;
  assert.equal(stale.narrowContextPermitted, false);

  const shock = scanDependencyShockwave(
    ['SCOPE'],
    [{ sourceId: 'src-1', domain: 'SCOPE', dependentDomains: ['ARCH'] }],
    undefined,
    opts,
  ).value;
  assert.deepEqual(shock.affectedDomainIds, ['ARCH', 'SCOPE']);

  const unknown = runUnknownUnknownSentinel(tie.taskId, {
    unitIds: ['u-scope'],
    refs: [{ fromId: 'u-scope', toId: 'u-missing' }],
    aliasRefs: [],
    importRefs: [],
    authorityGaps: [],
  }, opts).value;
  assert.equal(unknown.hasUnknowns, true);
  assert.equal(advanceExpansionLadder(tie, undefined, 'expand', ['ob-extra'], opts).value.currentStage, 'DEPENDENCY_NEIGHBORHOOD');
});

test('S05 semantic digest is deterministic and exact current bindings gate validity', () => {
  const { tie, capsule } = buildValidFixture();
  const digestA = computeContextSemanticDigest({
    taskIdentity: tie.semanticIdentity,
    selectedUnitIdentities: ['b', 'a'],
    authorityProofRefs: ['p2', 'p1'],
    sufficiencyProofIdentity: capsule.sufficiencyProof.semanticIdentity,
    validityFingerprints: ['f2', 'f1'],
    projectId: tie.projectId,
    sourcePackIdentity: tie.sourcePackIdentity,
    policyVersion: tie.policyVersion,
  }, opts).value;
  const digestB = computeContextSemanticDigest({
    taskIdentity: tie.semanticIdentity,
    selectedUnitIdentities: ['a', 'b'],
    authorityProofRefs: ['p1', 'p2'],
    sufficiencyProofIdentity: capsule.sufficiencyProof.semanticIdentity,
    validityFingerprints: ['f1', 'f2'],
    projectId: tie.projectId,
    sourcePackIdentity: tie.sourcePackIdentity,
    policyVersion: tie.policyVersion,
  }, opts).value;
  assert.equal(digestA, digestB);

  const current = {
    projectId: tie.projectId,
    sourcePackIdentity: tie.sourcePackIdentity,
    profileIdentity: tie.profileIdentity,
    profileDigest: tie.profileDigest,
    policyVersion: tie.policyVersion,
    checkpointIdentity: tie.checkpointIdentity,
    capsule,
    currentFingerprints: [{ unitId: 'u-scope', fingerprint: 'fp-u-scope' }],
    supportedPolicies: ['1.0.0'],
  };
  assert.equal(evaluateCapsuleValidity(current), 'VALID');
  assert.equal(evaluateCapsuleValidity({ ...current, projectId: 'other' }), 'PROJECT_MISMATCH');
  assert.equal(evaluateCapsuleValidity({ ...current, sourcePackIdentity: 'other' }), 'SOURCE_PACK_MISMATCH');
  assert.equal(evaluateCapsuleValidity({ ...current, profileIdentity: 'other' }), 'STALE');
  assert.equal(evaluateCapsuleValidity({ ...current, profileDigest: 'sha256:other' }), 'STALE');
  assert.equal(evaluateCapsuleValidity({ ...current, checkpointIdentity: 'other' }), 'STALE');
  assert.equal(evaluateCapsuleValidity({ ...current, policyVersion: '2.0.0' }), 'POLICY_UNSUPPORTED');
  assert.equal(evaluateCapsuleValidity({ ...current, currentFingerprints: [] }), 'INDETERMINATE');
  assert.equal(evaluateCapsuleValidity({ ...current, currentFingerprints: [{ unitId: 'u-scope', fingerprint: 'changed' }] }), 'STALE');
});

test('S05 capsule construction rejects internal binding drift and EHC blocks invalidation', () => {
  const { tie, unit, proof, capsule } = buildValidFixture();
  const invalidCapsule = buildTaskContextCapsule({
    taskIntentEnvelope: tie,
    projectId: tie.projectId,
    sourcePackIdentity: tie.sourcePackIdentity,
    profileIdentity: tie.profileIdentity,
    profileDigest: tie.profileDigest,
    policyVersion: tie.policyVersion,
    checkpointIdentity: 'wrong-checkpoint',
    selectedUnits: [unit],
    authorityProofs: [{ domain: 'SCOPE', sourceId: unit.unitId, proofRef: 'proof-scope', conflictState: 'RESOLVED' }],
    sufficiencyProof: proof,
    expansionTrace: [],
    exclusions: [],
    validity: 'VALID',
  }, opts);
  assert.equal(invalidCapsule.ok, false);

  const cleanGraph = computeSelectiveContextInvalidationGraph(
    capsule,
    [{ unitId: 'u-scope', fingerprint: 'fp-u-scope' }],
    true,
    opts,
  ).value;
  const cleanHandoff = buildExecutionHandoffContract(capsule, cleanGraph, opts).value;
  assert.equal(cleanHandoff.readyForM15Consumption, true);

  const staleGraph = computeSelectiveContextInvalidationGraph(
    capsule,
    [{ unitId: 'u-scope', fingerprint: 'changed' }],
    true,
    opts,
  ).value;
  const blockedHandoff = buildExecutionHandoffContract(capsule, staleGraph, opts).value;
  assert.equal(blockedHandoff.readyForM15Consumption, false);

  const previous = {
    semanticDigest: 'previous',
    selectedUnitIdentities: [unit.semanticIdentity],
    authorityProofStates: [{ domain: 'SCOPE', conflictState: 'RESOLVED' }],
    coverageState: 'COVERED',
    aperture: 'NARROW',
  };
  assert.equal(detectContextRegression(previous, capsule, opts).value.hasRegression, false);
});
