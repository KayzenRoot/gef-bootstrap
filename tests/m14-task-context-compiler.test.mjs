import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createTaskIntentEnvelope,
  validateTaskIntentEnvelopeBinding,
  createAuthorityBoundContextUnit,
  validateAbcuBinding,
  computeContextDependencyClosure,
  applyCallerBudget,
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
  digest: v => createHash('sha256').update(v).digest('hex'),
};
const opts = { digest };

// Helper to make a valid TIE input
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
    profileDigest: 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    policyVersion: '1.0.0',
    checkpointIdentity: 'chk-001',
    ...overrides,
  };
}

// Helper to make a valid ABCU input
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
    profileDigest: 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    policyVersion: '1.0.0',
    checkpointIdentity: 'chk-001',
    semanticPayloadRef: `ref:${domain}:${id}`,
    sensitivity: 'INTERNAL',
    ...overrides,
  };
}

// ─── S01 Tests ─────────────────────────────────────────────────────────────────

test('S01 - Task Intent Envelope: deterministic identity and set normalization', () => {
  const tie1 = createTaskIntentEnvelope(makeTieInput({ targetDomains: ['ARCH', 'SCOPE'] }), opts);
  const tie2 = createTaskIntentEnvelope(makeTieInput({ targetDomains: ['SCOPE', 'ARCH'] }), opts);

  assert.equal(tie1.ok, true);
  assert.equal(tie2.ok, true);
  // Set-like domain normalization ensures identical semanticIdentity
  assert.equal(tie1.value.semanticIdentity, tie2.value.semanticIdentity);

  // Invalid inputs fail closed
  const bad1 = createTaskIntentEnvelope(makeTieInput({ projectId: '' }), opts);
  assert.equal(bad1.ok, false);
  assert.equal(bad1.diagnostics[0].code, 'TASK_CONTEXT_BINDING_STALE');

  const bad2 = createTaskIntentEnvelope(makeTieInput({ taskClass: 'UNKNOWN_CLASS' }), opts);
  assert.equal(bad2.ok, false);
  assert.equal(bad2.diagnostics[0].code, 'TASK_CONTEXT_INTENT_INVALID');

  // Binding validation against stale project
  const bindingCheck = validateTaskIntentEnvelopeBinding(tie1.value, {
    projectId: 'proj-gef',
    sourcePackIdentity: 'sp-canon-02', // mismatch
    checkpointIdentity: 'chk-001',
    policyVersion: '1.0.0',
  });
  assert.equal(bindingCheck.ok, false);
  assert.equal(bindingCheck.diagnostics[0].code, 'CONTEXT_UNIT_STALE');
});

test('S01 - Authority-Bound Context Unit: validation, immutability, and binding', () => {
  const u1Result = createAuthorityBoundContextUnit(makeAbcuInput('u1', 'SCOPE'), opts);
  assert.equal(u1Result.ok, true);
  const u1 = u1Result.value;
  assert.equal(u1.domain, 'SCOPE');
  assert.equal(u1.role, 'NORMATIVE');
  assert.ok(u1.semanticIdentity);

  // Sensitive reference cannot carry raw payload
  const badSens = createAuthorityBoundContextUnit(
    makeAbcuInput('u-bad', 'SCOPE', 'NORMATIVE', {
      sensitivity: 'SENSITIVE_REFERENCE',
      semanticPayloadRef: 'raw:secret_key_123',
    }),
    opts,
  );
  assert.equal(badSens.ok, false);
  assert.equal(badSens.diagnostics[0].code, 'CONTEXT_UNIT_INVALID');

  // Binding validation against current project state
  const validBinding = validateAbcuBinding(u1, {
    projectId: 'proj-gef',
    sourcePackIdentity: 'sp-canon-01',
    checkpointIdentity: 'chk-001',
    currentFingerprints: [{ id: 'u1', fingerprint: 'fp-u1' }],
  });
  assert.equal(validBinding.ok, true);

  // Stale source pack
  const stalePack = validateAbcuBinding(u1, {
    projectId: 'proj-gef',
    sourcePackIdentity: 'sp-canon-02',
    checkpointIdentity: 'chk-001',
    currentFingerprints: [{ id: 'u1', fingerprint: 'fp-u1' }],
  });
  assert.equal(stalePack.ok, false);
  assert.equal(stalePack.diagnostics[0].code, 'CONTEXT_UNIT_STALE');

  // Cross-project reuse is strictly forbidden
  const crossProj = validateAbcuBinding(u1, {
    projectId: 'other-proj',
    sourcePackIdentity: 'sp-canon-01',
    checkpointIdentity: 'chk-001',
    currentFingerprints: [{ id: 'u1', fingerprint: 'fp-u1' }],
  });
  assert.equal(crossProj.ok, false);
  assert.equal(crossProj.diagnostics[0].code, 'CROSS_PROJECT_CONTEXT_FORBIDDEN');
});

test('S01 - Context Dependency Closure: bounded graph traversal and cycle detection', () => {
  const nodeMap = new Map([
    ['u1', { id: 'u1', dependencies: ['u2'] }],
    ['u2', { id: 'u2', dependencies: ['u3'] }],
    ['u3', { id: 'u3', dependencies: [] }],
  ]);

  const closure = computeContextDependencyClosure(['u1'], nodeMap, undefined, opts);
  assert.equal(closure.ok, true);
  assert.deepEqual(closure.value.closedUnitIds, ['u1', 'u2', 'u3']);
  assert.equal(closure.value.state, 'COMPLETE');

  // Cycle detection
  const cycleMap = new Map([
    ['a', { id: 'a', dependencies: ['b'] }],
    ['b', { id: 'b', dependencies: ['c'] }],
    ['c', { id: 'c', dependencies: ['a'] }],
  ]);
  const cycleResult = computeContextDependencyClosure(['a'], cycleMap, undefined, opts);
  assert.equal(cycleResult.ok, true);
  assert.equal(cycleResult.value.state, 'CYCLE_DETECTED');
  assert.ok(cycleResult.value.cycles.length > 0);

  // Caller budget narrowing enforces maxNodes
  const budgetResult = computeContextDependencyClosure(['u1'], nodeMap, { maxNodes: 2 }, opts);
  assert.equal(budgetResult.ok, true);
  assert.equal(budgetResult.value.state, 'BUDGET_EXHAUSTED');
});

// ─── S02 Tests ─────────────────────────────────────────────────────────────────

test('S02 - Source Routing and Selection: routing relevance is not authority', () => {
  const tie = createTaskIntentEnvelope(makeTieInput(), opts).value;

  const candidateSources = [
    {
      sourceId: 'src-1',
      domains: ['SCOPE'],
      routingRelevance: 0.95,
      authorityRef: 'auth-scope',
      applicabilityState: 'ACTIVE',
      sourceFingerprint: 'fp-src1',
    },
    {
      sourceId: 'src-2',
      domains: ['ARCH'],
      routingRelevance: 0.40,
      authorityRef: 'auth-arch',
      applicabilityState: 'ACTIVE',
      sourceFingerprint: 'fp-src2',
    },
    {
      sourceId: 'src-3',
      domains: ['UNMAPPED'],
      routingRelevance: 0.99,
      authorityRef: 'auth-unmapped',
      applicabilityState: 'ACTIVE',
      sourceFingerprint: 'fp-src3',
    },
  ];

  const routeResult = routeTaskToSources(tie, candidateSources, opts);
  assert.equal(routeResult.ok, true);
  assert.equal(routeResult.value.candidates.length, 2); // Only SCOPE and ARCH match targetDomains

  const u1 = createAuthorityBoundContextUnit(makeAbcuInput('src-1', 'SCOPE'), opts).value;
  const u2 = createAuthorityBoundContextUnit(makeAbcuInput('src-2', 'ARCH'), opts).value;
  const unitsMap = new Map([['src-1', u1], ['src-2', u2]]);

  // ABSF selection requires valid authority proofs
  const proofs = [
    { domain: 'SCOPE', sourceId: 'src-1', proofRef: 'proof-1', conflictState: 'RESOLVED' },
    { domain: 'ARCH', sourceId: 'src-2', proofRef: 'proof-2', conflictState: 'RESOLVED' },
  ];

  const absfResult = applyAuthorityBoundSelectionFilter(
    { taskIntentEnvelope: tie, routeCandidates: routeResult.value.candidates, authorityProofs: proofs },
    unitsMap,
    opts,
  );
  assert.equal(absfResult.ok, true);
  assert.equal(absfResult.value.selected.length, 2);
  assert.equal(absfResult.value.matrix.unresolvedCount, 0);

  // Validate matrix passes
  const matrixValidation = validateContextAuthorityMatrix(absfResult.value.matrix);
  assert.equal(matrixValidation.ok, true);

  // Conflict state blocks selection
  const conflictProofs = [
    { domain: 'SCOPE', sourceId: 'src-1', proofRef: 'proof-1', conflictState: 'CONFLICT', conflictingSourceIds: ['src-alt'] },
  ];
  const conflictFilter = applyAuthorityBoundSelectionFilter(
    { taskIntentEnvelope: tie, routeCandidates: routeResult.value.candidates, authorityProofs: conflictProofs },
    unitsMap,
    opts,
  );
  assert.equal(conflictFilter.ok, true);
  assert.equal(conflictFilter.value.matrix.conflictCount > 0, true);
  const conflictValidation = validateContextAuthorityMatrix(conflictFilter.value.matrix);
  assert.equal(conflictValidation.ok, false);
  assert.equal(conflictValidation.diagnostics[0].code, 'CONTEXT_AUTHORITY_UNRESOLVED');
});

test('S02 - Redundancy Barrier and Neighborhood Projection', () => {
  const u1 = createAuthorityBoundContextUnit(makeAbcuInput('u1', 'SCOPE'), opts).value;

  const crbResult = applyContextRedundancyBarrier([u1, u1], opts);
  assert.equal(crbResult.ok, true);
  assert.equal(crbResult.value.length, 1);
  assert.equal(crbResult.value[0].canonicalUnitId, 'u1');
  assert.equal(crbResult.value[0].provenanceRefs.length, 2);

  // Neighborhood projection
  const anpResult = buildAuthorityNeighborhoodProjection(
    'task-test-01',
    [{ sourceId: 'u1', domain: 'SCOPE', authorityStrength: 0.9, neighborIds: ['u2'] }],
    undefined,
    opts,
  );
  assert.equal(anpResult.ok, true);
  assert.equal(anpResult.value.nodes.length, 1);
});

// ─── S03 Tests ─────────────────────────────────────────────────────────────────

test('S03 - Context Sufficiency Proof and Semantic Coverage Lattice', () => {
  const tie = createTaskIntentEnvelope(makeTieInput({ targetDomains: ['SCOPE'] }), opts).value;
  const uScope = createAuthorityBoundContextUnit(makeAbcuInput('u-scope', 'SCOPE', 'NORMATIVE'), opts).value;

  const obligations = [
    { obligationId: 'ob-scope', domain: 'SCOPE', requiredRoles: ['NORMATIVE'], mandatory: true },
  ];

  const latticeResult = buildSemanticCoverageLattice(tie, obligations, [uScope], opts);
  assert.equal(latticeResult.ok, true);
  assert.equal(latticeResult.value.overallCoverage, 'COVERED');

  const nodeMap = new Map([['u-scope', { id: 'u-scope', dependencies: [] }]]);
  const closure = computeContextDependencyClosure(['u-scope'], nodeMap, undefined, opts).value;
  const deficit = buildContextDeficitVector(tie, latticeResult.value, closure, { unresolvedCount: 0, conflictCount: 0 }, 'STANDARD');
  assert.equal(deficit.isEmpty, true);

  const witness = buildMinimumContextWitness(tie, [uScope], [uScope], latticeResult.value, opts).value;
  assert.equal(witness.includedUnits.length, 1);

  const proof = buildContextSufficiencyProof(
    {
      tie,
      lattice: latticeResult.value,
      deficitVector: deficit,
      witness,
      closure,
      validityFingerprints: ['fp-u-scope'],
      exclusionJustifications: [],
    },
    opts,
  );
  assert.equal(proof.ok, true);
  assert.equal(proof.value.sufficiencyState, 'SUFFICIENT');

  // Cut frontier computation
  const cut = computeContextCutFrontier(tie, [uScope], closure);
  assert.deepEqual(cut.frontierUnitIds, ['u-scope']);
});

// ─── S04 Tests ─────────────────────────────────────────────────────────────────

test('S04 - Full-Context Safety Gate, Risk Aperture, and Unknown Sentinel', () => {
  const tie = createTaskIntentEnvelope(makeTieInput({ riskClass: 'STANDARD', targetDomains: ['SCOPE'] }), opts).value;
  const uScope = createAuthorityBoundContextUnit(makeAbcuInput('u-scope', 'SCOPE', 'NORMATIVE'), opts).value;
  const obligations = [{ obligationId: 'ob-scope', domain: 'SCOPE', requiredRoles: ['NORMATIVE'], mandatory: true }];
  const lattice = buildSemanticCoverageLattice(tie, obligations, [uScope], opts).value;
  const nodeMap = new Map([['u-scope', { id: 'u-scope', dependencies: [] }]]);
  const closure = computeContextDependencyClosure(['u-scope'], nodeMap, undefined, opts).value;
  const deficit = buildContextDeficitVector(tie, lattice, closure, { unresolvedCount: 0, conflictCount: 0 }, 'STANDARD');
  const witness = buildMinimumContextWitness(tie, [uScope], [uScope], lattice, opts).value;
  const proof = buildContextSufficiencyProof(
    {
      tie,
      lattice,
      deficitVector: deficit,
      witness,
      closure,
      validityFingerprints: ['fp-u-scope'],
      exclusionJustifications: [],
    },
    opts,
  ).value;

  // FCSG Passes when clean
  const fcsgPass = evaluateFullContextSafetyGate(
    {
      tie,
      proof,
      hasStaleCheckpointBinding: false,
      hasStaleSourceBinding: false,
      hasStaleProfileBinding: false,
      hasPriorContextRegression: false,
      hasDestructiveOperation: false,
      hasHighRiskDomain: false,
      callerRequiresBroaderInspection: false,
    },
    opts,
  );
  assert.equal(fcsgPass.ok, true);
  assert.equal(fcsgPass.value.narrowContextPermitted, true);

  // FCSG Blocks on stale checkpoint
  const fcsgBlock = evaluateFullContextSafetyGate(
    {
      tie,
      proof,
      hasStaleCheckpointBinding: true,
      hasStaleSourceBinding: false,
      hasStaleProfileBinding: false,
      hasPriorContextRegression: false,
      hasDestructiveOperation: false,
      hasHighRiskDomain: false,
      callerRequiresBroaderInspection: false,
    },
    opts,
  );
  assert.equal(fcsgBlock.ok, true);
  assert.equal(fcsgBlock.value.narrowContextPermitted, false);
  assert.ok(fcsgBlock.value.triggeredReasons.includes('STALE_CHECKPOINT_BINDING'));

  // Risk Adaptive Aperture
  const aperture = computeRiskAdaptiveContextAperture(tie, proof, fcsgPass.value);
  assert.equal(aperture.apertureLevel, 'NARROW');

  // Shockwave scan
  const shock = scanDependencyShockwave(
    ['SCOPE'],
    [{ sourceId: 'src-1', domain: 'SCOPE', dependentDomains: ['ARCH'] }],
    undefined,
    opts,
  );
  assert.equal(shock.ok, true);
  assert.deepEqual(shock.value.affectedDomainIds, ['ARCH', 'SCOPE']);

  // Unknown-unknown sentinel
  const sentinel = runUnknownUnknownSentinel(
    'task-test-01',
    {
      unitIds: ['u-scope'],
      refs: [{ fromId: 'u-scope', toId: 'u-missing' }],
      aliasRefs: [],
      importRefs: [],
      authorityGaps: [],
    },
    opts,
  );
  assert.equal(sentinel.ok, true);
  assert.equal(sentinel.value.hasUnknowns, true);
  assert.ok(sentinel.value.findings.length > 0);

  // Expansion ladder
  const ladderStep = advanceExpansionLadder(tie, undefined, 'Need wider context', ['ob-extra'], opts);
  assert.equal(ladderStep.ok, true);
  assert.equal(ladderStep.value.currentStage, 'DEPENDENCY_NEIGHBORHOOD');
});

// ─── S05 Tests ─────────────────────────────────────────────────────────────────

test('S05 - Task Context Capsule, Invalidation Graph, and Handoff Contract', () => {
  const tie = createTaskIntentEnvelope(makeTieInput({ targetDomains: ['SCOPE'] }), opts).value;
  const uScope = createAuthorityBoundContextUnit(makeAbcuInput('u-scope', 'SCOPE', 'NORMATIVE'), opts).value;
  const obligations = [{ obligationId: 'ob-scope', domain: 'SCOPE', requiredRoles: ['NORMATIVE'], mandatory: true }];
  const lattice = buildSemanticCoverageLattice(tie, obligations, [uScope], opts).value;
  const nodeMap = new Map([['u-scope', { id: 'u-scope', dependencies: [] }]]);
  const closure = computeContextDependencyClosure(['u-scope'], nodeMap, undefined, opts).value;
  const deficit = buildContextDeficitVector(tie, lattice, closure, { unresolvedCount: 0, conflictCount: 0 }, 'STANDARD');
  const witness = buildMinimumContextWitness(tie, [uScope], [uScope], lattice, opts).value;
  const proof = buildContextSufficiencyProof(
    {
      tie,
      lattice,
      deficitVector: deficit,
      witness,
      closure,
      validityFingerprints: ['fp-u-scope'],
      exclusionJustifications: [],
    },
    opts,
  ).value;

  const proofs = [
    { domain: 'SCOPE', sourceId: 'u-scope', proofRef: 'proof-scope', conflictState: 'RESOLVED' },
  ];

  // Build immutable capsule
  const capsuleResult = buildTaskContextCapsule(
    {
      taskIntentEnvelope: tie,
      projectId: tie.projectId,
      sourcePackIdentity: tie.sourcePackIdentity,
      profileIdentity: tie.profileIdentity,
      profileDigest: tie.profileDigest,
      policyVersion: tie.policyVersion,
      checkpointIdentity: tie.checkpointIdentity,
      selectedUnits: [uScope],
      authorityProofs: proofs,
      sufficiencyProof: proof,
      expansionTrace: [],
      exclusions: [],
      validity: 'VALID',
    },
    opts,
  );

  assert.equal(capsuleResult.ok, true);
  const capsule = capsuleResult.value;
  assert.ok(capsule.semanticDigest);

  // Evaluate validity against current environment
  const evalState = evaluateCapsuleValidity({
    projectId: tie.projectId,
    sourcePackIdentity: tie.sourcePackIdentity,
    policyVersion: tie.policyVersion,
    capsule,
    currentFingerprints: [{ unitId: 'u-scope', fingerprint: 'fp-u-scope' }],
    supportedPolicies: ['1.0.0'],
  });
  assert.equal(evalState, 'VALID');

  // Selective Context Invalidation Graph
  const scig = computeSelectiveContextInvalidationGraph(
    capsule,
    [{ unitId: 'u-scope', fingerprint: 'fp-u-scope-modified' }],
    true,
    opts,
  );
  assert.equal(scig.ok, true);
  assert.equal(scig.value.invalidatedCount, 1);

  // Execution Handoff Contract
  const cleanScig = computeSelectiveContextInvalidationGraph(
    capsule,
    [{ unitId: 'u-scope', fingerprint: 'fp-u-scope' }],
    true,
    opts,
  ).value;
  const handoff = buildExecutionHandoffContract(capsule, cleanScig, opts);
  assert.equal(handoff.ok, true);
  assert.equal(handoff.value.readyForM15Consumption, true);

  // Invalidation causes handoff to block
  const blockedHandoff = buildExecutionHandoffContract(capsule, scig.value, opts);
  assert.equal(blockedHandoff.ok, true);
  assert.equal(blockedHandoff.value.readyForM15Consumption, false);
  assert.ok(blockedHandoff.value.blockerCodes.length > 0);

  // Context Regression Sentinel
  const prevSnapshot = {
    semanticDigest: 'prev-digest',
    selectedUnitIdentities: ['u-scope'],
    authorityProofStates: [{ domain: 'SCOPE', conflictState: 'RESOLVED' }],
    coverageState: 'COVERED',
    aperture: 'LOCAL_NEIGHBORHOOD',
  };

  const regResult = detectContextRegression(prevSnapshot, capsule, opts);
  assert.equal(regResult.ok, true);
  assert.equal(regResult.value.hasRegression, false);
});
