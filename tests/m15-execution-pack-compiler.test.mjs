import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createTaskIntentEnvelope,
  createAuthorityBoundContextUnit,
  buildSemanticCoverageLattice,
  computeContextDependencyClosure,
  buildContextDeficitVector,
  buildMinimumContextWitness,
  buildContextSufficiencyProof,
  buildTaskContextCapsule,
  computeSelectiveContextInvalidationGraph,
  buildExecutionHandoffContract,
} from '../packages/task-context-compiler/dist/public.js';
import {
  createExecutionPackEnvelope,
  buildInstructionProvenanceMap,
  validateExecutorCapabilityContract,
  issuePromptCompletenessCertificate,
  checkNoDiscoveryBoundary,
  computeExecutableWorkDag,
  computeSemanticCriticalPath,
  computeSafeParallelismMatrix,
  overlapPairKey,
  suppressReasoningBranches,
  createAtomicIncrementBoundary,
  buildGuardrailBindingTable,
  buildValidationClosureMatrix,
  proveRollbackReadiness,
  computeFailureContainmentCell,
  createPostconditionEvidenceSlot,
  createExecutorCognitionBudget,
  consumeCognitionBudget,
  buildToolInvocationBlueprint,
  buildReadOnceContextIndex,
  validateReadOnceContextBinding,
  consumeReadOnce,
  recordNegativeSearch,
  checkNegativeSearch,
  evaluateAmbiguityEscalation,
  buildPackDigestInput,
  computePackSemanticDigest,
  buildExecutionPackReceipt,
  statusForDiagnosticCode,
  checkPreInvocationDrift,
  reducePromptEntropy,
  evaluatePackReplay,
  compileExecutionPack,
} from '../packages/execution-pack-compiler/dist/public.js';

const digest = {
  algorithm: 'sha256',
  digest: value => createHash('sha256').update(value).digest('hex'),
};
const opts = { digest };
const PROFILE_DIGEST = 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

// ─── Admitted M14 context built with the real M14 public API ──────────────────

function makeTieInput(overrides = {}) {
  return {
    taskId: 'task-m15-01',
    taskClass: 'CONTROLLED_MUTATION',
    riskClass: 'STANDARD',
    objectiveSummary: 'Compile executor-ready pack for scope change',
    targetDomains: ['SCOPE'],
    requiredCapabilities: ['READ_CONTEXT', 'WRITE_SOURCES'],
    projectId: 'proj-gef',
    sourcePackIdentity: 'sp-canon-01',
    profileIdentity: 'node-typescript',
    profileDigest: PROFILE_DIGEST,
    policyVersion: '1.0.0',
    checkpointIdentity: 'chk-001',
    ...overrides,
  };
}

function makeAbcuInput(id, domain, overrides = {}) {
  return {
    unitId: id,
    domain,
    role: 'NORMATIVE',
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

function buildAdmittedContext(validity = 'VALID') {
  const tie = createTaskIntentEnvelope(makeTieInput(), opts).value;
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
    validity,
  }, opts).value;
  const graph = computeSelectiveContextInvalidationGraph(
    capsule,
    [{ unitId: unit.unitId, fingerprint: unit.sourceFingerprint }],
    proof.dependencyKnowledgeComplete,
    opts,
  ).value;
  const handoff = buildExecutionHandoffContract(capsule, graph, opts).value;
  return { capsule, handoff };
}

// ─── M15 fixtures ─────────────────────────────────────────────────────────────

function makeNode(id, overrides = {}) {
  return {
    instructionId: id,
    objective: `Objective for ${id}`,
    targetFiles: [`src/${id}.ts`],
    dependsOn: [],
    mutationDomains: [],
    validationIds: [`val-${id}`],
    provenanceRefs: [`auth:${id}`],
    preconditions: ['pack-valid'],
    mutationSpec: 'read-only',
    evidenceOutputs: [`ev:${id}`],
    ...overrides,
  };
}

function makeValidation(id) {
  return {
    validationId: `val-${id}`,
    command: `node --test tests/${id}.test.mjs`,
    scope: 'FOCUSED',
    covers: [id],
  };
}

function makeGuardrail(id) {
  return { nodeId: id, policyIds: [`pol-${id}`] };
}

function makeProvenance(id) {
  return { instructionId: id, authorityRefs: [`auth:${id}`], decisionRefs: [] };
}

function makeCapability() {
  return {
    required: {
      capabilityIdentity: 'exec-cap-01',
      capabilities: ['READ', 'WRITE'],
      tools: ['read', 'write'],
      maxParallelism: 4,
      requiredMutationPermissions: ['fs:write:src'],
      forbiddenCapabilities: ['net:egress'],
      unavailableCapabilities: ['gpu:exec'],
      sandboxAssumptions: ['no-network', 'fs-sandbox:repo'],
    },
    offer: {
      capabilityIdentity: 'exec-cap-01',
      capabilities: ['READ', 'WRITE'],
      tools: ['read', 'write'],
      mutationPermissions: ['fs:write:src'],
      sandboxCapabilities: ['no-network', 'fs-sandbox:repo'],
      maxParallelism: 2,
    },
  };
}

function makeTool(name, purpose) {
  return {
    tool: name,
    purpose,
    afterNodeIds: [],
    inputs: ['pack-bindings'],
    expectedOutputs: [`${name}-result`],
    fallbackPath: 'escalate-to-compiler',
  };
}

function makeValidInput(overrides = {}) {
  const cap = makeCapability();
  return {
    packId: 'pack-001',
    context: buildAdmittedContext(),
    objective: 'Compile executor-ready pack for scope change',
    constraints: ['no-discovery', 'deterministic-only'],
    allowedMutations: ['dom-a', 'dom-b'],
    forbiddenMutations: ['db:drop', 'auth:escalate'],
    proofObligations: ['pack-sealed'],
    stopCondition: 'STOP: pack sealed VALID',
    handbackSchema: 'handback:v1',
    instructions: [
      makeNode('a', { mutationDomains: ['dom-a'], mutationSpec: 'mutation:dom-a', rollbackPlan: 'revert-a' }),
      makeNode('b', { dependsOn: ['a'], mutationDomains: ['dom-b'], mutationSpec: 'mutation:dom-b', rollbackPlan: 'revert-b' }),
      makeNode('c', { dependsOn: ['b'] }),
    ],
    validations: [makeValidation('a'), makeValidation('b'), makeValidation('c')],
    requiredCapability: cap.required,
    capabilityOffer: cap.offer,
    guardrailBindings: [makeGuardrail('a'), makeGuardrail('b'), makeGuardrail('c')],
    provenanceEntries: [makeProvenance('a'), makeProvenance('b'), makeProvenance('c')],
    reasoningBranches: [{ branchId: 'r1', decided: true, canonicalRef: 'dec-1' }],
    ambiguities: [],
    cognitionBudget: { maxReads: 10, maxSearches: 10, maxToolCalls: 10, maxAmbiguityBranches: 5 },
    toolBlueprint: [makeTool('read', 'inspect sources')],
    readOnceEntries: { ctx: ['u-scope'] },
    negativeSearchLedger: [{ query: 'absent-thing', fingerprint: 'fp-1', contextIdentity: 'ctx-1' }],
    noDiscoveryBoundary: ['product-intent', 'policy-decision'],
    promptSections: ['MUST: keep objective\nduplicate line\nduplicate line', 'another line\nMUST: keep rollback'],
    obligationMarkers: ['MUST:'],
    ...overrides,
  };
}

function failCode(result) {
  assert.equal(result.ok, false);
  return result.diagnostics[0].code;
}

function currentBindingsOf(pack) {
  return {
    currentTaskIdentity: pack.taskIdentity,
    currentBindings: {
      projectId: pack.projectId,
      sourcePackIdentity: pack.sourcePackIdentity,
      profileIdentity: pack.profileIdentity,
      profileDigest: pack.profileDigest,
      policyVersion: pack.policyVersion,
      checkpointIdentity: pack.checkpointIdentity,
      capabilityIdentity: pack.capabilityIdentity,
      contextIdentity: pack.contextIdentity,
      contextDigest: pack.contextDigest,
    },
    currentCapabilityIdentity: pack.capabilityIdentity,
  };
}

// ─── M14 integration + end-to-end compilation ─────────────────────────────────

test('admitted M14 handoff gates compilation and flows task identity through', () => {
  const admitted = buildAdmittedContext();
  assert.equal(admitted.capsule.validity, 'VALID');
  assert.equal(admitted.handoff.readyForM15Consumption, true);
  assert.equal(admitted.handoff.capsuleSemanticDigest, admitted.capsule.semanticDigest);

  const result = compileExecutionPack(makeValidInput(), opts);
  assert.equal(result.ok, true);
  const { pack, receipt, envelope } = result.value;
  assert.equal(receipt.status, 'VALID');
  assert.equal(receipt.replayable, true);
  assert.match(pack.semanticDigest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(pack.taskIdentity, admitted.capsule.taskIntentEnvelope.semanticIdentity);
  assert.equal(envelope.taskIdentity, pack.taskIdentity);
  assert.equal(pack.contextIdentity, admitted.capsule.semanticDigest);
  assert.equal(pack.contextDigest, admitted.capsule.semanticDigest);
  assert.deepEqual(pack.criticalPath, ['a', 'b', 'c']);
  assert.deepEqual(pack.safeParallelWaves, [['a'], ['b'], ['c']]);
  assert.equal(pack.completenessCertificate.complete, true);
  assert.equal(pack.readOnceIndex.contextIdentity, pack.contextIdentity);
  assert.equal(result.value.increments.length, 3);
  // EPR exposes every frozen binding.
  for (const field of ['taskIdentity', 'contextIdentity', 'contextDigest', 'policyVersion', 'graphDigest', 'toolPlanDigest', 'validationPlanDigest', 'capabilityIdentity', 'semanticDigest']) {
    assert.ok(receipt[field] && receipt[field].length > 0, field);
  }
});

test('deterministic digest: reordered instructions compile to the same digest and order', () => {
  const base = makeValidInput();
  const shuffled = makeValidInput({
    instructions: [base.instructions[2], base.instructions[0], base.instructions[1]],
    validations: [base.validations[2], base.validations[0], base.validations[1]],
  });
  const first = compileExecutionPack(base, opts);
  const second = compileExecutionPack(shuffled, opts);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.value.pack.semanticDigest, second.value.pack.semanticDigest);
  assert.deepEqual(first.value.pack.safeParallelWaves, second.value.pack.safeParallelWaves);
});

test('pack semantic digest is order independent over payloads', () => {
  const compiled = compileExecutionPack(makeValidInput(), opts);
  assert.equal(compiled.ok, true);
  const baseInput = buildPackDigestInput(compiled.value.pack);
  const reordered = {
    ...baseInput,
    instructionPayloads: [...baseInput.instructionPayloads].reverse(),
    workGraphPayloads: [...baseInput.workGraphPayloads].reverse(),
    validationPayloads: [...baseInput.validationPayloads].reverse(),
    toolPayloads: [...baseInput.toolPayloads].reverse(),
  };
  const d1 = computePackSemanticDigest(baseInput, opts);
  const d2 = computePackSemanticDigest(reordered, opts);
  assert.equal(d1.ok, true);
  assert.equal(d2.ok, true);
  assert.equal(d1.value, d2.value);
});

// ─── S01: pack contract ───────────────────────────────────────────────────────

test('envelope binds task identity exactly', () => {
  const admitted = buildAdmittedContext();
  const capsule = admitted.capsule;
  const result = createExecutionPackEnvelope(
    {
      packId: 'pack-001',
      taskIdentity: capsule.taskIntentEnvelope.semanticIdentity,
      projectId: capsule.projectId,
      sourcePackIdentity: capsule.sourcePackIdentity,
      profileIdentity: capsule.profileIdentity,
      profileDigest: capsule.profileDigest,
      policyVersion: capsule.policyVersion,
      checkpointIdentity: capsule.checkpointIdentity,
      capabilityIdentity: 'exec-cap-01',
      contextIdentity: capsule.semanticDigest,
    },
    opts,
  );
  assert.equal(result.ok, true);
  assert.match(result.value.envelopeDigest, /^sha256:[0-9a-f]{64}$/);
  const missing = createExecutionPackEnvelope(
    {
      packId: 'pack-001',
      taskIdentity: '',
      projectId: capsule.projectId,
      sourcePackIdentity: capsule.sourcePackIdentity,
      profileIdentity: capsule.profileIdentity,
      profileDigest: capsule.profileDigest,
      policyVersion: capsule.policyVersion,
      checkpointIdentity: capsule.checkpointIdentity,
      capabilityIdentity: 'exec-cap-01',
      contextIdentity: capsule.semanticDigest,
    },
    opts,
  );
  assert.equal(failCode(missing), 'PACK_TASK_IDENTITY_MISSING');
});

test('stale capsule fails closed at the handoff gate', () => {
  const result = compileExecutionPack(makeValidInput({ context: buildAdmittedContext('STALE') }), opts);
  assert.equal(failCode(result), 'PACK_CONTEXT_STALE');
});

test('handoff digest mismatch fails closed', () => {
  const admitted = buildAdmittedContext();
  const tampered = {
    capsule: admitted.capsule,
    handoff: { ...admitted.handoff, capsuleSemanticDigest: `sha256:${'0'.repeat(64)}` },
  };
  const result = compileExecutionPack(makeValidInput({ context: tampered }), opts);
  assert.equal(failCode(result), 'PACK_CONTEXT_STALE');
});

test('unready handoff fails closed', () => {
  const admitted = buildAdmittedContext();
  const tampered = {
    capsule: admitted.capsule,
    handoff: { ...admitted.handoff, readyForM15Consumption: false, blockerCodes: ['X'] },
  };
  const result = compileExecutionPack(makeValidInput({ context: tampered }), opts);
  assert.equal(failCode(result), 'PACK_CONTEXT_NOT_READY');
});

test('capability identity mismatch fails closed', () => {
  const cap = makeCapability();
  const result = compileExecutionPack(
    makeValidInput({ capabilityOffer: { ...cap.offer, capabilityIdentity: 'other-cap' } }), opts,
  );
  assert.equal(failCode(result), 'PACK_CAPABILITY_MISMATCH');
});

test('missing capability or tool fails closed', () => {
  const cap = makeCapability();
  assert.equal(failCode(validateExecutorCapabilityContract(cap.required, {
    ...cap.offer, capabilities: ['READ'],
  })), 'PACK_CAPABILITY_MISSING');
  assert.equal(failCode(validateExecutorCapabilityContract(cap.required, {
    ...cap.offer, tools: ['read'],
  })), 'PACK_CAPABILITY_MISSING');
});

test('mutation-permission mismatch fails closed', () => {
  const cap = makeCapability();
  const result = validateExecutorCapabilityContract(cap.required, {
    ...cap.offer, mutationPermissions: [],
  });
  assert.equal(failCode(result), 'PACK_CAPABILITY_MISSING');
});

test('forbidden or unavailable capability offered fails closed', () => {
  const cap = makeCapability();
  assert.equal(failCode(validateExecutorCapabilityContract(cap.required, {
    ...cap.offer, capabilities: [...cap.offer.capabilities, 'net:egress'],
  })), 'PACK_FORBIDDEN_CAPABILITY_OFFERED');
  assert.equal(failCode(validateExecutorCapabilityContract(cap.required, {
    ...cap.offer, tools: [...cap.offer.tools, 'gpu:exec'],
  })), 'PACK_FORBIDDEN_CAPABILITY_OFFERED');
});

test('sandbox mismatch fails closed', () => {
  const cap = makeCapability();
  const result = validateExecutorCapabilityContract(cap.required, {
    ...cap.offer, sandboxCapabilities: ['fs-sandbox:repo'],
  });
  assert.equal(failCode(result), 'PACK_SANDBOX_MISMATCH');
});

test('offered parallelism above allowed fails closed', () => {
  const cap = makeCapability();
  const result = validateExecutorCapabilityContract(cap.required, {
    ...cap.offer, maxParallelism: 8,
  });
  assert.equal(failCode(result), 'PACK_PARALLELISM_EXCEEDED');
});

test('pack sections missing fail closed without checklist booleans', () => {
  const cases = [
    ['objective', { objective: '' }],
    ['constraints', { constraints: [] }],
    ['allowedMutations', { allowedMutations: [] }],
    ['forbiddenMutations', { forbiddenMutations: [] }],
    ['proofObligations', { proofObligations: [] }],
    ['stopCondition', { stopCondition: '' }],
    ['handbackSchema', { handbackSchema: '' }],
  ];
  for (const [name, override] of cases) {
    const result = compileExecutionPack(makeValidInput(override), opts);
    assert.equal(failCode(result), 'PACK_SECTION_MISSING', name);
  }
});

test('forbidden or unallowed mutation domains fail closed', () => {
  const forbidden = makeValidInput({
    instructions: [makeNode('a', { mutationDomains: ['db:drop'], mutationSpec: 'mutation:db:drop', rollbackPlan: 'revert-a' })],
    validations: [makeValidation('a')],
    guardrailBindings: [makeGuardrail('a')],
    provenanceEntries: [makeProvenance('a')],
  });
  assert.equal(failCode(compileExecutionPack(forbidden, opts)), 'PACK_MUTATION_NOT_PERMITTED');
  const unallowed = makeValidInput({
    instructions: [makeNode('a', { mutationDomains: ['dom-zzz'], mutationSpec: 'mutation:dom-zzz', rollbackPlan: 'revert-a' })],
    validations: [makeValidation('a')],
    guardrailBindings: [makeGuardrail('a')],
    provenanceEntries: [makeProvenance('a')],
  });
  assert.equal(failCode(compileExecutionPack(unallowed, opts)), 'PACK_MUTATION_NOT_PERMITTED');
});

test('PCC is derived from the pack and cannot self-certify missing fields', () => {
  const compiled = compileExecutionPack(makeValidInput(), opts);
  assert.equal(compiled.ok, true);
  assert.equal(compiled.value.certificate.complete, true);
  const blanked = { ...compiled.value.pack, objective: '' };
  assert.equal(failCode(issuePromptCompletenessCertificate(blanked)), 'PACK_COMPLETENESS_FAILED');
  const noRollback = {
    ...compiled.value.pack,
    rollbackProofs: [],
  };
  assert.equal(failCode(issuePromptCompletenessCertificate(noRollback)), 'PACK_COMPLETENESS_FAILED');
});

test('provenance missing or empty fails closed', () => {
  const input = makeValidInput();
  assert.equal(failCode(compileExecutionPack(
    makeValidInput({ provenanceEntries: input.provenanceEntries.slice(0, 2) }), opts,
  )), 'PACK_PROVENANCE_MISSING');
  assert.equal(failCode(buildInstructionProvenanceMap(
    [makeNode('a')],
    [{ instructionId: 'a', authorityRefs: [], decisionRefs: [] }],
  )), 'PACK_PROVENANCE_MISSING');
});

test('NDB violation fails closed; clear topics pass', () => {
  assert.equal(failCode(checkNoDiscoveryBoundary(['product-intent'], ['product-intent'])), 'PACK_NDB_VIOLATION');
  assert.equal(checkNoDiscoveryBoundary(['Objective for a'], ['product-intent']).ok, true);
});

// ─── S02: work graph ──────────────────────────────────────────────────────────

test('EWD nodes without preconditions or evidence outputs fail closed', () => {
  assert.equal(failCode(computeExecutableWorkDag(
    [{ ...makeNode('x'), preconditions: undefined }], opts,
  )), 'PACK_NODE_PRECONDITION_MISSING');
  assert.equal(failCode(computeExecutableWorkDag(
    [{ ...makeNode('x'), evidenceOutputs: [] }], opts,
  )), 'PACK_NODE_EVIDENCE_MISSING');
  assert.equal(failCode(computeExecutableWorkDag(
    [{ ...makeNode('x'), mutationSpec: '  ' }], opts,
  )), 'PACK_NODE_MUTATION_SPEC_MISSING');
});

test('EWD nodes carry rollback hook and readiness reference', () => {
  const dag = computeExecutableWorkDag(
    [
      makeNode('a', { mutationDomains: ['dom-a'], mutationSpec: 'mutation:dom-a', rollbackPlan: 'revert-a' }),
      makeNode('c'),
    ],
    opts,
  );
  assert.equal(dag.ok, true);
  const byId = new Map(dag.value.nodes.map(n => [n.instructionId, n]));
  assert.equal(byId.get('a').rollbackHook, 'revert-a');
  assert.equal(byId.get('a').readinessRef, 'rrp:a');
  assert.equal(byId.get('c').rollbackHook, 'none:read-only');
  assert.equal(byId.get('c').readinessRef, 'rrp:not-required');
});

test('unknown dependency fails closed', () => {
  const result = compileExecutionPack(
    makeValidInput({
      instructions: [makeNode('a', { dependsOn: ['ghost'] })],
      validations: [makeValidation('a')],
      guardrailBindings: [makeGuardrail('a')],
      provenanceEntries: [makeProvenance('a')],
    }),
    opts,
  );
  assert.equal(failCode(result), 'PACK_GRAPH_UNKNOWN_DEPENDENCY');
});

test('duplicate node fails closed', () => {
  assert.equal(failCode(computeExecutableWorkDag([makeNode('a'), makeNode('a')], opts)), 'PACK_GRAPH_DUPLICATE_NODE');
});

test('cycle fails closed, including self-dependency', () => {
  assert.equal(failCode(computeExecutableWorkDag(
    [makeNode('a', { dependsOn: ['b'] }), makeNode('b', { dependsOn: ['a'] })], opts,
  )), 'PACK_GRAPH_CYCLE');
  assert.equal(failCode(computeExecutableWorkDag([makeNode('a', { dependsOn: ['a'] })], opts)), 'PACK_GRAPH_CYCLE');
});

test('deterministic topological order regardless of input order', () => {
  const nodes = [
    makeNode('c', { dependsOn: ['b'] }),
    makeNode('a'),
    makeNode('b', { dependsOn: ['a'] }),
  ];
  const result = computeExecutableWorkDag(nodes, opts);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.order, ['a', 'b', 'c']);
  assert.deepEqual(result.value.waves, [['a'], ['b'], ['c']]);
});

test('critical path ties break deterministically to the smallest path', () => {
  const nodes = [
    makeNode('a'),
    makeNode('c', { dependsOn: ['a'] }),
    makeNode('b', { dependsOn: ['a'] }),
    makeNode('d', { dependsOn: ['b', 'c'] }),
  ];
  const first = computeSemanticCriticalPath(nodes, opts);
  const reordered = computeSemanticCriticalPath([...nodes].reverse(), opts);
  assert.equal(first.ok, true);
  assert.equal(reordered.ok, true);
  assert.deepEqual(first.value, ['a', 'b', 'd']);
  assert.deepEqual(reordered.value, ['a', 'b', 'd']);
});

test('independent nodes share a wave; dependents do not', () => {
  const nodes = [makeNode('b'), makeNode('a'), makeNode('c', { dependsOn: ['a'] })];
  const dag = computeExecutableWorkDag(nodes, opts);
  assert.equal(dag.ok, true);
  assert.deepEqual(dag.value.waves, [['a', 'b'], ['c']]);
});

test('mutation-domain collision splits waves without explicit safety proof', () => {
  const nodes = [
    makeNode('x', { mutationDomains: ['dom-shared'], mutationSpec: 'mutation:dom-shared' }),
    makeNode('y', { mutationDomains: ['dom-shared'], mutationSpec: 'mutation:dom-shared' }),
  ];
  const dag = computeExecutableWorkDag(nodes, opts);
  assert.equal(dag.ok, true);
  assert.deepEqual(computeSafeParallelismMatrix(dag.value.waves, nodes).value, [['x'], ['y']]);
  assert.deepEqual(
    computeSafeParallelismMatrix(dag.value.waves, nodes, [overlapPairKey('x', 'y')]).value,
    [['x', 'y']],
  );
});

test('graph budget exhaustion fails closed', () => {
  const nodes = [makeNode('a'), makeNode('b'), makeNode('c')];
  assert.equal(failCode(computeExecutableWorkDag(nodes, { ...opts, maxNodes: 1 })), 'PACK_GRAPH_BUDGET_EXHAUSTED');
});

test('unresolved reasoning branches block top-level compilation', () => {
  const direct = suppressReasoningBranches([
    { branchId: 'b1', decided: true, canonicalRef: 'dec-1' },
    { branchId: 'b2', decided: false },
  ]);
  assert.deepEqual(direct.suppressed, ['b1']);
  assert.deepEqual(direct.escalated, ['b2']);
  const result = compileExecutionPack(
    makeValidInput({ reasoningBranches: [{ branchId: 'r-x', decided: false }] }), opts,
  );
  assert.equal(failCode(result), 'PACK_REASONING_BRANCH_UNRESOLVED');
});

test('atomic increments partition waves with evidence slots', () => {
  const increments = createAtomicIncrementBoundary(
    [['a'], ['b', 'c']],
    [
      { slotId: 'pes-a', instructionId: 'a', description: 'd' },
      { slotId: 'pes-b', instructionId: 'b', description: 'd' },
      { slotId: 'pes-c', instructionId: 'c', description: 'd' },
    ],
  );
  assert.equal(increments.length, 2);
  assert.equal(increments[0].incrementId, 'aib-001');
  assert.deepEqual(increments[1].nodeIds, ['b', 'c']);
  assert.deepEqual(increments[1].evidenceSlotIds, ['pes-b', 'pes-c']);
});

// ─── S03: guardrails ──────────────────────────────────────────────────────────

test('validation closure missing fails closed', () => {
  const input = makeValidInput();
  assert.equal(failCode(compileExecutionPack(
    makeValidInput({ validations: input.validations.slice(0, 2) }), opts,
  )), 'PACK_VALIDATION_UNCLOSED');
});

test('validation covering unknown instruction fails closed', () => {
  assert.equal(failCode(buildValidationClosureMatrix(
    [makeNode('a')],
    [{ validationId: 'v-ghost', command: 'x', scope: 'FOCUSED', covers: ['ghost'] }],
  )), 'PACK_VALIDATION_UNKNOWN_TARGET');
});

test('rollback missing on mutating instruction fails closed; read-only passes', () => {
  assert.equal(failCode(proveRollbackReadiness(
    [makeNode('a', { mutationDomains: ['dom'], mutationSpec: 'mutation:dom' })],
  )), 'PACK_ROLLBACK_MISSING');
  assert.equal(proveRollbackReadiness([makeNode('a')]).ok, true);
});

test('unbound guardrail node fails closed', () => {
  assert.equal(failCode(buildGuardrailBindingTable(['a', 'b'], [makeGuardrail('a')])), 'PACK_GUARDRAIL_UNBOUND');
});

test('failure containment invalidates only downstream dependents', () => {
  const nodes = [
    makeNode('a'),
    makeNode('b', { dependsOn: ['a'] }),
    makeNode('c', { dependsOn: ['b'] }),
    makeNode('d'),
  ];
  const cell = computeFailureContainmentCell('b', nodes);
  assert.equal(cell.ok, true);
  assert.deepEqual(cell.value.invalidatedNodeIds, ['c']);
  assert.deepEqual(cell.value.unaffectedNodeIds, ['a', 'd']);
});

test('evidence slots are created deterministically per instruction', () => {
  const result = compileExecutionPack(makeValidInput(), opts);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.pack.evidenceSlots, ['pes-a', 'pes-b', 'pes-c']);
  assert.equal(createPostconditionEvidenceSlot('pes-a', 'a', 'Postcondition evidence for a').ok, true);
  assert.equal(failCode(createPostconditionEvidenceSlot('pes-a', 'a', '  ')), 'PACK_EVIDENCE_SLOT_INVALID');
});

// ─── S04: cognition ───────────────────────────────────────────────────────────

test('cognition budget exhaustion names the dimension', () => {
  const created = createExecutorCognitionBudget({ maxReads: 1, maxSearches: 1, maxToolCalls: 1, maxAmbiguityBranches: 1 });
  assert.equal(created.ok, true);
  const used = consumeCognitionBudget(created.value, { reads: 1 });
  assert.equal(used.ok, true);
  const exhausted = consumeCognitionBudget(used.value, { reads: 1 });
  assert.equal(failCode(exhausted), 'PACK_BUDGET_EXHAUSTED');
  assert.equal(exhausted.diagnostics[0].subject, 'reads');
});

test('invalid budget limits fail closed', () => {
  assert.equal(failCode(createExecutorCognitionBudget(
    { maxReads: 0, maxSearches: 1, maxToolCalls: 1, maxAmbiguityBranches: 1 },
  )), 'PACK_BUDGET_INVALID');
});

test('read-once index reuses without rereading; unknown keys fail', () => {
  const built = buildReadOnceContextIndex({ k1: ['v1', 'v2'] }, 'ctx-A');
  assert.equal(built.ok, true);
  const first = consumeReadOnce(built.value, 'k1', []);
  assert.equal(first.ok, true);
  assert.equal(first.value.reused, false);
  const second = consumeReadOnce(built.value, 'k1', first.value.consumedKeys);
  assert.equal(second.ok, true);
  assert.equal(second.value.reused, true);
  assert.deepEqual(second.value.value, ['v1', 'v2']);
  assert.equal(failCode(consumeReadOnce(built.value, 'ghost', [])), 'PACK_ROCI_UNKNOWN_KEY');
});

test('ROCI bound to another context fails closed', () => {
  const built = buildReadOnceContextIndex({ k1: ['v1'] }, 'ctx-A');
  assert.equal(built.ok, true);
  assert.equal(validateReadOnceContextBinding(built.value, 'ctx-A').ok, true);
  assert.equal(failCode(validateReadOnceContextBinding(built.value, 'ctx-B')), 'PACK_ROCI_CONTEXT_MISMATCH');
});

test('negative search ledger is validity-bound; stale proofs do not suppress', () => {
  let ledger = recordNegativeSearch([], '  foo   bar ', 'fp-1', 'ctx-1');
  ledger = recordNegativeSearch(ledger, 'foo bar', 'fp-1', 'ctx-1');
  assert.equal(ledger.length, 1);
  assert.equal(checkNegativeSearch(ledger, 'foo  bar', 'fp-1', 'ctx-1').knownAbsent, true);
  assert.equal(checkNegativeSearch(ledger, 'foo bar', 'fp-2', 'ctx-1').knownAbsent, false);
  assert.equal(checkNegativeSearch(ledger, 'foo bar', 'fp-1', 'ctx-2').knownAbsent, false);
  assert.equal(checkNegativeSearch(ledger, 'something-else', 'fp-1', 'ctx-1').knownAbsent, false);
});

test('unresolved ambiguity escalates, including at top-level compilation', () => {
  assert.equal(failCode(evaluateAmbiguityEscalation([{ topic: 'scope-x', resolved: false }])), 'PACK_AMBIGUITY_ESCALATED');
  assert.equal(evaluateAmbiguityEscalation([{ topic: 'scope-x', resolved: true }]).ok, true);
  const result = compileExecutionPack(
    makeValidInput({ ambiguities: [{ topic: 'scope-x', resolved: false }] }), opts,
  );
  assert.equal(failCode(result), 'PACK_AMBIGUITY_ESCALATED');
});

test('tool blueprint requires inputs, expected outputs and fallback', () => {
  const good = makeTool('read', 'inspect');
  assert.equal(buildToolInvocationBlueprint([good]).ok, true);
  assert.equal(failCode(buildToolInvocationBlueprint([{ ...good, inputs: [] }])), 'PACK_TOOL_BLUEPRINT_INVALID');
  assert.equal(failCode(buildToolInvocationBlueprint([{ ...good, expectedOutputs: [] }])), 'PACK_TOOL_BLUEPRINT_INVALID');
  assert.equal(failCode(buildToolInvocationBlueprint([{ ...good, fallbackPath: '' }])), 'PACK_TOOL_BLUEPRINT_INVALID');
});

test('tool blueprint is deterministic regardless of input order', () => {
  const invocations = [makeTool('write', 'apply'), makeTool('read', 'inspect')];
  const first = buildToolInvocationBlueprint(invocations);
  const second = buildToolInvocationBlueprint([...invocations].reverse());
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.value, second.value);
  assert.equal(first.value[0].tool, 'read');
});

// ─── S05: receipt, drift, replay ──────────────────────────────────────────────

test('PIDS reports each binding drift with the exact dimension', () => {
  const compiled = compileExecutionPack(makeValidInput(), opts);
  assert.equal(compiled.ok, true);
  const pack = compiled.value.pack;
  const fresh = currentBindingsOf(pack);

  const driftCases = [
    [{ ...fresh, currentTaskIdentity: 'other-task' }, 'STALE_CONTEXT'],
    [{ ...fresh, currentBindings: { ...fresh.currentBindings, projectId: 'other' } }, 'STALE_CONTEXT'],
    [{ ...fresh, currentBindings: { ...fresh.currentBindings, contextDigest: 'sha256:0000' } }, 'STALE_CONTEXT'],
    [{ ...fresh, currentBindings: { ...fresh.currentBindings, contextIdentity: 'other' } }, 'STALE_CONTEXT'],
    [{ ...fresh, currentBindings: { ...fresh.currentBindings, policyVersion: '9.9.9' } }, 'STALE_POLICY'],
    [{ ...fresh, currentCapabilityIdentity: 'other-cap' }, 'CAPABILITY_MISMATCH'],
  ];
  for (const [current, expected] of driftCases) {
    const receipt = checkPreInvocationDrift(pack, current, opts);
    assert.equal(receipt.ok, true);
    assert.equal(receipt.value.status, expected);
    assert.equal(receipt.value.replayable, false);
  }
  const valid = checkPreInvocationDrift(pack, fresh, opts);
  assert.equal(valid.ok, true);
  assert.equal(valid.value.status, 'VALID');
  assert.equal(valid.value.replayable, true);
  assert.equal(valid.value.semanticDigest, pack.semanticDigest);
});

test('PIDS detects semantic tampering with unchanged external bindings', () => {
  const compiled = compileExecutionPack(makeValidInput(), opts);
  assert.equal(compiled.ok, true);
  const pack = compiled.value.pack;
  const tamperedInstruction = {
    ...pack,
    instructions: pack.instructions.map((ins, i) => (i === 0 ? { ...ins, objective: 'Tampered objective' } : ins)),
  };
  const r1 = checkPreInvocationDrift(tamperedInstruction, currentBindingsOf(pack), opts);
  assert.equal(r1.ok, true);
  assert.equal(r1.value.status, 'GRAPH_INVALID');

  const tamperedValidation = {
    ...pack,
    validations: pack.validations.map((v, i) => (i === 0 ? { ...v, command: 'tampered-command' } : v)),
  };
  const r2 = checkPreInvocationDrift(tamperedValidation, currentBindingsOf(pack), opts);
  assert.equal(r2.ok, true);
  assert.equal(r2.value.status, 'GRAPH_INVALID');

  const tamperedStop = { ...pack, stopCondition: 'Tampered stop' };
  const r3 = checkPreInvocationDrift(tamperedStop, currentBindingsOf(pack), opts);
  assert.equal(r3.ok, true);
  assert.equal(r3.value.status, 'GRAPH_INVALID');
});

test('VALID receipts cannot carry diagnostics', () => {
  const compiled = compileExecutionPack(makeValidInput(), opts);
  assert.equal(compiled.ok, true);
  const receipt = compiled.value.receipt;
  const bad = buildExecutionPackReceipt({ ...receipt, diagnostics: ['something uncertain'] });
  assert.equal(failCode(bad), 'PACK_RECEIPT_INVALID');
});

test('entropy reducer preserves obligations and fails closed on dropped markers', () => {
  const sections = [
    'MUST: keep objective\nduplicate line\nduplicate line\n\n',
    'another line\nMUST: keep rollback\nduplicate line',
  ];
  const good = reducePromptEntropy(sections, ['MUST:']);
  assert.equal(good.ok, true);
  assert.ok(good.value.removedLines > 0);
  assert.deepEqual(good.value.preservedMarkers, ['MUST:']);
  assert.equal(new Set(good.value.reduced).size, good.value.reduced.length);

  const dropped = reducePromptEntropy(['unrelated line'], ['MUST:']);
  assert.equal(failCode(dropped), 'PACK_ENTROPY_OBLIGATION_MISSING');

  const compileDropped = compileExecutionPack(
    makeValidInput({ promptSections: ['unrelated line'] }), opts,
  );
  assert.equal(failCode(compileDropped), 'PACK_ENTROPY_OBLIGATION_MISSING');
});

test('replay proves equivalence; changed replays are rejected with matching bindings', () => {
  const compiled = compileExecutionPack(makeValidInput(), opts);
  assert.equal(compiled.ok, true);
  const sealed = compiled.value.pack;
  const identical = evaluatePackReplay(sealed, { ...sealed }, opts);
  assert.equal(identical.replayable, true);
  const tampered = {
    ...sealed,
    instructions: sealed.instructions.map((ins, i) => (i === 1 ? { ...ins, mutationSpec: 'mutation:evil' } : ins)),
  };
  const changed = evaluatePackReplay(sealed, tampered, opts);
  assert.equal(changed.replayable, false);
  assert.match(changed.reason, /digest drift/);
});

test('diagnostic codes map to terminal states, never silently VALID', () => {
  assert.equal(statusForDiagnosticCode('PACK_CONTEXT_STALE'), 'STALE_CONTEXT');
  assert.equal(statusForDiagnosticCode('PACK_TASK_IDENTITY_MISSING'), 'STALE_CONTEXT');
  assert.equal(statusForDiagnosticCode('PACK_POLICY_STALE'), 'STALE_POLICY');
  assert.equal(statusForDiagnosticCode('PACK_CAPABILITY_MISMATCH'), 'CAPABILITY_MISMATCH');
  assert.equal(statusForDiagnosticCode('PACK_FORBIDDEN_CAPABILITY_OFFERED'), 'CAPABILITY_MISMATCH');
  assert.equal(statusForDiagnosticCode('PACK_PARALLELISM_EXCEEDED'), 'CAPABILITY_MISMATCH');
  assert.equal(statusForDiagnosticCode('PACK_SANDBOX_MISMATCH'), 'CAPABILITY_MISMATCH');
  assert.equal(statusForDiagnosticCode('PACK_GRAPH_CYCLE'), 'GRAPH_INVALID');
  assert.equal(statusForDiagnosticCode('PACK_SECTION_MISSING'), 'GRAPH_INVALID');
  assert.equal(statusForDiagnosticCode('PACK_NODE_PRECONDITION_MISSING'), 'GRAPH_INVALID');
  assert.equal(statusForDiagnosticCode('PACK_COMPLETENESS_FAILED'), 'GRAPH_INVALID');
  assert.equal(statusForDiagnosticCode('PACK_AMBIGUITY_ESCALATED'), 'BLOCKED');
  assert.equal(statusForDiagnosticCode('PACK_REASONING_BRANCH_UNRESOLVED'), 'BLOCKED');
  assert.equal(statusForDiagnosticCode('PACK_ENTROPY_OBLIGATION_MISSING'), 'BLOCKED');
  assert.equal(statusForDiagnosticCode('SOMETHING_UNKNOWN'), 'INDETERMINATE');
});

// ─── Cancellation / capability ports ──────────────────────────────────────────

test('cancellation fails closed across traversal', () => {
  const cancelledOpts = { ...opts, cancellation: { isCancelled: () => true } };
  assert.equal(failCode(compileExecutionPack(makeValidInput(), cancelledOpts)), 'CANCELLED');
});

test('invalid digest capability fails closed', () => {
  const badOpts = { digest: { algorithm: 'sha256' } };
  assert.equal(failCode(compileExecutionPack(makeValidInput(), badOpts)), 'DIGEST_CAPABILITY_INVALID');
});
