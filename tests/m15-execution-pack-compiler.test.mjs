import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
  consumeReadOnce,
  recordNegativeSearch,
  checkNegativeSearch,
  evaluateAmbiguityEscalation,
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

function makeContext(overrides = {}) {
  return {
    projectId: 'proj-gef',
    sourcePackIdentity: 'sp-canon-01',
    profileIdentity: 'node-typescript',
    profileDigest: PROFILE_DIGEST,
    policyVersion: '1.0.0',
    checkpointIdentity: 'chk-001',
    capabilityIdentity: 'exec-cap-01',
    contextIdentity: 'ctx-001',
    contextDigest: 'sha256:ffff0000ffff0000ffff0000ffff0000ffff0000ffff0000ffff0000ffff0000',
    contextValidity: 'VALID',
    readyForConsumption: true,
    ...overrides,
  };
}

function makeInstruction(id, overrides = {}) {
  return {
    instructionId: id,
    objective: `Objective for ${id}`,
    targetFiles: [`src/${id}.ts`],
    dependsOn: [],
    mutationDomains: [],
    validationIds: [`val-${id}`],
    provenanceRefs: [`auth:${id}`],
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
    },
    offer: {
      capabilityIdentity: 'exec-cap-01',
      capabilities: ['READ', 'WRITE'],
      tools: ['read', 'write'],
    },
  };
}

function makeValidInput(overrides = {}) {
  const cap = makeCapability();
  return {
    packId: 'pack-001',
    context: makeContext(),
    instructions: [
      makeInstruction('a', { mutationDomains: ['dom-a'], rollbackPlan: 'revert-a' }),
      makeInstruction('b', { dependsOn: ['a'], mutationDomains: ['dom-b'], rollbackPlan: 'revert-b' }),
      makeInstruction('c', { dependsOn: ['b'] }),
    ],
    validations: [makeValidation('a'), makeValidation('b'), makeValidation('c')],
    requiredCapability: cap.required,
    capabilityOffer: cap.offer,
    guardrailBindings: [makeGuardrail('a'), makeGuardrail('b'), makeGuardrail('c')],
    provenanceEntries: [makeProvenance('a'), makeProvenance('b'), makeProvenance('c')],
    cognitionBudget: { maxReads: 10, maxSearches: 10, maxToolCalls: 10, maxAmbiguityBranches: 5 },
    toolBlueprint: [{ tool: 'read', purpose: 'inspect sources', afterNodeIds: [] }],
    readOnceEntries: { ctx: ['u-scope', 'u-arch'] },
    negativeSearchLedger: ['absent-thing'],
    noDiscoveryBoundary: ['product-intent', 'policy-decision'],
    checklist: {
      objective: true, workGraph: true, validations: true, rollback: true,
      evidenceSlots: true, stopCondition: true, noDiscoveryBoundary: true,
    },
    ...overrides,
  };
}

function failCode(result) {
  assert.equal(result.ok, false);
  return result.diagnostics[0].code;
}

// ─── End-to-end compilation ───────────────────────────────────────────────────

test('exact binding success compiles to a VALID sealed pack', () => {
  const result = compileExecutionPack(makeValidInput(), opts);
  assert.equal(result.ok, true);
  const { pack, receipt } = result.value;
  assert.equal(receipt.status, 'VALID');
  assert.equal(receipt.replayable, true);
  assert.match(pack.semanticDigest, /^sha256:[0-9a-f]{64}$/);
  assert.deepEqual(pack.criticalPath, ['a', 'b', 'c']);
  assert.deepEqual(pack.safeParallelWaves, [['a'], ['b'], ['c']]);
  assert.equal(pack.completenessCertificate.complete, true);
  assert.equal(result.value.increments.length, 3);
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

test('pack semantic digest is order independent', () => {
  const input = {
    packId: 'pack-001', projectId: 'proj-gef', sourcePackIdentity: 'sp-canon-01',
    profileIdentity: 'node-typescript', profileDigest: PROFILE_DIGEST, policyVersion: '1.0.0',
    checkpointIdentity: 'chk-001', capabilityIdentity: 'exec-cap-01', contextIdentity: 'ctx-001',
    instructionIdentities: ['a', 'b', 'c'], criticalPath: ['a', 'b'],
    waves: [['a'], ['b', 'c']], validationIds: ['v1', 'v2'],
    guardrailPolicyIds: ['p1'], toolKeys: ['read:inspect'],
  };
  const reordered = {
    ...input,
    instructionIdentities: ['c', 'a', 'b'], validationIds: ['v2', 'v1'],
    waves: [['a'], ['c', 'b']],
  };
  const d1 = computePackSemanticDigest(input, opts);
  const d2 = computePackSemanticDigest(reordered, opts);
  assert.equal(d1.ok, true);
  assert.equal(d2.ok, true);
  assert.equal(d1.value, d2.value);
});

// ─── S01: pack contract ───────────────────────────────────────────────────────

test('envelope binds every dimension exactly', () => {
  const result = createExecutionPackEnvelope(
    { packId: 'pack-001', contextIdentity: 'ctx-001', ...makeContext() }, opts,
  );
  assert.equal(result.ok, true);
  assert.match(result.value.envelopeDigest, /^sha256:[0-9a-f]{64}$/);
});

test('stale context capsule fails closed at the handoff gate', () => {
  const result = compileExecutionPack(
    makeValidInput({ context: makeContext({ contextValidity: 'STALE' }) }), opts,
  );
  assert.equal(failCode(result), 'PACK_CONTEXT_STALE');
});

test('unready handoff fails closed', () => {
  const result = compileExecutionPack(
    makeValidInput({ context: makeContext({ readyForConsumption: false }) }), opts,
  );
  assert.equal(failCode(result), 'PACK_CONTEXT_NOT_READY');
});

test('capability identity mismatch fails closed', () => {
  const cap = makeCapability();
  const result = compileExecutionPack(
    makeValidInput({ capabilityOffer: { ...cap.offer, capabilityIdentity: 'other-cap' } }), opts,
  );
  assert.equal(failCode(result), 'PACK_CAPABILITY_MISMATCH');
});

test('missing capability fails closed', () => {
  const cap = makeCapability();
  const result = validateExecutorCapabilityContract(cap.required, {
    ...cap.offer, capabilities: ['READ'],
  });
  assert.equal(failCode(result), 'PACK_CAPABILITY_MISSING');
});

test('missing tool fails closed', () => {
  const cap = makeCapability();
  const result = validateExecutorCapabilityContract(cap.required, {
    ...cap.offer, tools: ['read'],
  });
  assert.equal(failCode(result), 'PACK_CAPABILITY_MISSING');
});

test('provenance missing for one instruction fails closed', () => {
  const input = makeValidInput();
  const result = compileExecutionPack(
    makeValidInput({ provenanceEntries: input.provenanceEntries.slice(0, 2) }), opts,
  );
  assert.equal(failCode(result), 'PACK_PROVENANCE_MISSING');
});

test('provenance entry without refs fails closed', () => {
  const result = buildInstructionProvenanceMap(
    [makeInstruction('a')],
    [{ instructionId: 'a', authorityRefs: [], decisionRefs: [] }],
  );
  assert.equal(failCode(result), 'PACK_PROVENANCE_MISSING');
});

test('PCC completeness failure fails closed', () => {
  const result = compileExecutionPack(
    makeValidInput({
      checklist: {
        objective: true, workGraph: true, validations: true, rollback: false,
        evidenceSlots: true, stopCondition: true, noDiscoveryBoundary: true,
      },
    }),
    opts,
  );
  assert.equal(failCode(result), 'PACK_COMPLETENESS_FAILED');
});

test('NDB violation fails closed; clear topics pass', () => {
  const bad = checkNoDiscoveryBoundary(['product-intent'], ['product-intent']);
  assert.equal(failCode(bad), 'PACK_NDB_VIOLATION');
  const good = checkNoDiscoveryBoundary(['Objective for a'], ['product-intent']);
  assert.equal(good.ok, true);
});

test('PCC certificate is deterministic on success', () => {
  const result = issuePromptCompletenessCertificate('pack-001', {
    objective: true, workGraph: true, validations: true, rollback: true,
    evidenceSlots: true, stopCondition: true, noDiscoveryBoundary: true,
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.complete, true);
});

// ─── S02: work graph ──────────────────────────────────────────────────────────

test('unknown dependency fails closed', () => {
  const result = compileExecutionPack(
    makeValidInput({
      instructions: [makeInstruction('a', { dependsOn: ['ghost'] })],
      validations: [makeValidation('a')],
      guardrailBindings: [makeGuardrail('a')],
      provenanceEntries: [makeProvenance('a')],
    }),
    opts,
  );
  assert.equal(failCode(result), 'PACK_GRAPH_UNKNOWN_DEPENDENCY');
});

test('duplicate node fails closed', () => {
  const result = computeExecutableWorkDag([makeInstruction('a'), makeInstruction('a')], opts);
  assert.equal(failCode(result), 'PACK_GRAPH_DUPLICATE_NODE');
});

test('cycle fails closed, including self-dependency', () => {
  const cyclic = computeExecutableWorkDag(
    [makeInstruction('a', { dependsOn: ['b'] }), makeInstruction('b', { dependsOn: ['a'] })],
    opts,
  );
  assert.equal(failCode(cyclic), 'PACK_GRAPH_CYCLE');
  const self = computeExecutableWorkDag([makeInstruction('a', { dependsOn: ['a'] })], opts);
  assert.equal(failCode(self), 'PACK_GRAPH_CYCLE');
});

test('deterministic topological order regardless of input order', () => {
  const nodes = [
    makeInstruction('c', { dependsOn: ['b'] }),
    makeInstruction('a'),
    makeInstruction('b', { dependsOn: ['a'] }),
  ];
  const result = computeExecutableWorkDag(nodes, opts);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.order, ['a', 'b', 'c']);
  assert.deepEqual(result.value.waves, [['a'], ['b'], ['c']]);
});

test('critical path ties break deterministically to the smallest path', () => {
  const nodes = [
    makeInstruction('a'),
    makeInstruction('c', { dependsOn: ['a'] }),
    makeInstruction('b', { dependsOn: ['a'] }),
    makeInstruction('d', { dependsOn: ['b', 'c'] }),
  ];
  const first = computeSemanticCriticalPath(nodes, opts);
  const reordered = computeSemanticCriticalPath([...nodes].reverse(), opts);
  assert.equal(first.ok, true);
  assert.equal(reordered.ok, true);
  assert.deepEqual(first.value, ['a', 'b', 'd']);
  assert.deepEqual(reordered.value, ['a', 'b', 'd']);
});

test('independent nodes share a wave; dependents do not', () => {
  const nodes = [makeInstruction('b'), makeInstruction('a'), makeInstruction('c', { dependsOn: ['a'] })];
  const dag = computeExecutableWorkDag(nodes, opts);
  assert.equal(dag.ok, true);
  assert.deepEqual(dag.value.waves, [['a', 'b'], ['c']]);
});

test('mutation-domain collision splits waves without explicit safety proof', () => {
  const nodes = [
    makeInstruction('x', { mutationDomains: ['dom-shared'] }),
    makeInstruction('y', { mutationDomains: ['dom-shared'] }),
  ];
  const dag = computeExecutableWorkDag(nodes, opts);
  assert.equal(dag.ok, true);
  const split = computeSafeParallelismMatrix(dag.value.waves, nodes);
  assert.equal(split.ok, true);
  assert.deepEqual(split.value, [['x'], ['y']]);
  const allowed = computeSafeParallelismMatrix(dag.value.waves, nodes, [overlapPairKey('x', 'y')]);
  assert.equal(allowed.ok, true);
  assert.deepEqual(allowed.value, [['x', 'y']]);
});

test('graph budget exhaustion fails closed', () => {
  const nodes = [makeInstruction('a'), makeInstruction('b'), makeInstruction('c')];
  const result = computeExecutableWorkDag(nodes, { ...opts, maxNodes: 1 });
  assert.equal(failCode(result), 'PACK_GRAPH_BUDGET_EXHAUSTED');
});

test('reasoning branches: decided suppress, undecided escalate', () => {
  const result = suppressReasoningBranches([
    { branchId: 'b1', decided: true, canonicalRef: 'dec-1' },
    { branchId: 'b2', decided: false },
    { branchId: 'b3', decided: true },
  ]);
  assert.deepEqual(result.suppressed, ['b1']);
  assert.deepEqual(result.escalated, ['b2', 'b3']);
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
  const result = compileExecutionPack(
    makeValidInput({ validations: input.validations.slice(0, 2) }), opts,
  );
  assert.equal(failCode(result), 'PACK_VALIDATION_UNCLOSED');
});

test('validation covering unknown instruction fails closed', () => {
  const result = buildValidationClosureMatrix(
    [makeInstruction('a')],
    [{ validationId: 'v-ghost', command: 'x', scope: 'FOCUSED', covers: ['ghost'] }],
  );
  assert.equal(failCode(result), 'PACK_VALIDATION_UNKNOWN_TARGET');
});

test('rollback missing on mutating instruction fails closed; read-only passes', () => {
  const bad = proveRollbackReadiness([makeInstruction('a', { mutationDomains: ['dom'] })]);
  assert.equal(failCode(bad), 'PACK_ROLLBACK_MISSING');
  const good = proveRollbackReadiness([makeInstruction('a')]);
  assert.equal(good.ok, true);
});

test('unbound guardrail node fails closed', () => {
  const result = buildGuardrailBindingTable(['a', 'b'], [makeGuardrail('a')]);
  assert.equal(failCode(result), 'PACK_GUARDRAIL_UNBOUND');
});

test('failure containment invalidates only downstream dependents', () => {
  const nodes = [
    makeInstruction('a'),
    makeInstruction('b', { dependsOn: ['a'] }),
    makeInstruction('c', { dependsOn: ['b'] }),
    makeInstruction('d'),
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
  const slot = createPostconditionEvidenceSlot('pes-a', 'a', 'Postcondition evidence for a');
  assert.equal(slot.ok, true);
  const empty = createPostconditionEvidenceSlot('pes-a', 'a', '  ');
  assert.equal(failCode(empty), 'PACK_EVIDENCE_SLOT_INVALID');
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
  const result = createExecutorCognitionBudget({ maxReads: 0, maxSearches: 1, maxToolCalls: 1, maxAmbiguityBranches: 1 });
  assert.equal(failCode(result), 'PACK_BUDGET_INVALID');
});

test('read-once index reuses without rereading; unknown keys fail', () => {
  const built = buildReadOnceContextIndex({ k1: ['v1', 'v2'] });
  assert.equal(built.ok, true);
  const first = consumeReadOnce(built.value, 'k1', []);
  assert.equal(first.ok, true);
  assert.equal(first.value.reused, false);
  const second = consumeReadOnce(built.value, 'k1', first.value.consumedKeys);
  assert.equal(second.ok, true);
  assert.equal(second.value.reused, true);
  assert.deepEqual(second.value.value, ['v1', 'v2']);
  const unknown = consumeReadOnce(built.value, 'ghost', []);
  assert.equal(failCode(unknown), 'PACK_ROCI_UNKNOWN_KEY');
});

test('negative search ledger reuses proven-negative results', () => {
  let ledger = recordNegativeSearch([], '  foo   bar ');
  ledger = recordNegativeSearch(ledger, 'foo bar');
  assert.deepEqual(ledger, ['foo bar']);
  assert.equal(checkNegativeSearch(ledger, 'foo  bar').knownAbsent, true);
  assert.equal(checkNegativeSearch(ledger, 'something-else').knownAbsent, false);
});

test('unresolved ambiguity escalates; resolved sets pass', () => {
  const escalated = evaluateAmbiguityEscalation([{ topic: 'scope-x', resolved: false }]);
  assert.equal(failCode(escalated), 'PACK_AMBIGUITY_ESCALATED');
  const clear = evaluateAmbiguityEscalation([{ topic: 'scope-x', resolved: true }]);
  assert.equal(clear.ok, true);
});

test('tool blueprint is deterministic regardless of input order', () => {
  const invocations = [
    { tool: 'write', purpose: 'apply', afterNodeIds: ['b'] },
    { tool: 'read', purpose: 'inspect', afterNodeIds: [] },
  ];
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
  const current = { ...makeContext(), contextIdentity: 'ctx-001' };

  const driftCases = [
    [{ ...current, projectId: 'other' }, 'STALE_CONTEXT'],
    [{ ...current, sourcePackIdentity: 'other' }, 'STALE_CONTEXT'],
    [{ ...current, profileIdentity: 'other' }, 'STALE_CONTEXT'],
    [{ ...current, profileDigest: 'sha256:0000' }, 'STALE_CONTEXT'],
    [{ ...current, checkpointIdentity: 'other' }, 'STALE_CONTEXT'],
    [{ ...current, contextIdentity: 'other' }, 'STALE_CONTEXT'],
    [{ ...current, policyVersion: '9.9.9' }, 'STALE_POLICY'],
  ];
  for (const [bindings, expected] of driftCases) {
    const receipt = checkPreInvocationDrift(pack, {
      currentBindings: bindings, currentCapabilityIdentity: 'exec-cap-01',
    });
    assert.equal(receipt.status, expected);
    assert.equal(receipt.replayable, false);
  }
  const capDrift = checkPreInvocationDrift(pack, {
    currentBindings: current, currentCapabilityIdentity: 'other-cap',
  });
  assert.equal(capDrift.status, 'CAPABILITY_MISMATCH');
  const fresh = checkPreInvocationDrift(pack, {
    currentBindings: current, currentCapabilityIdentity: 'exec-cap-01',
  });
  assert.equal(fresh.status, 'VALID');
  assert.equal(fresh.replayable, true);
});

test('VALID receipts cannot carry diagnostics', () => {
  const result = buildExecutionPackReceipt({
    packId: 'pack-001', status: 'VALID', semanticDigest: 'sha256:' + 'a'.repeat(64),
    diagnostics: ['something uncertain'], replayable: true,
  });
  assert.equal(failCode(result), 'PACK_RECEIPT_INVALID');
});

test('entropy reducer preserves mandatory semantics while removing redundancy', () => {
  const sections = [
    'MUST: keep objective\nduplicate line\nduplicate line\n\n',
    'another line\nMUST: keep rollback\nduplicate line',
  ];
  const result = reducePromptEntropy(sections, ['MUST:']);
  assert.ok(result.removedLines > 0);
  assert.deepEqual(result.preservedMarkers, ['MUST:']);
  assert.equal(new Set(result.reduced).size, result.reduced.length);
  assert.ok(result.reduced.some(l => l.includes('MUST: keep objective')));
  assert.ok(result.reduced.some(l => l.includes('MUST: keep rollback')));
});

test('replay accepts identical digests and rejects drift or invalid bindings', () => {
  const d = 'sha256:' + 'b'.repeat(64);
  const accepted = evaluatePackReplay(d, d, true);
  assert.equal(accepted.replayable, true);
  const drifted = evaluatePackReplay(d, 'sha256:' + 'c'.repeat(64), true);
  assert.equal(drifted.replayable, false);
  const invalid = evaluatePackReplay(d, d, false);
  assert.equal(invalid.replayable, false);
});

test('diagnostic codes map to terminal states, never silently VALID', () => {
  assert.equal(statusForDiagnosticCode('PACK_CONTEXT_STALE'), 'STALE_CONTEXT');
  assert.equal(statusForDiagnosticCode('PACK_POLICY_STALE'), 'STALE_POLICY');
  assert.equal(statusForDiagnosticCode('PACK_CAPABILITY_MISMATCH'), 'CAPABILITY_MISMATCH');
  assert.equal(statusForDiagnosticCode('PACK_GRAPH_CYCLE'), 'GRAPH_INVALID');
  assert.equal(statusForDiagnosticCode('PACK_VALIDATION_UNCLOSED'), 'GRAPH_INVALID');
  assert.equal(statusForDiagnosticCode('PACK_AMBIGUITY_ESCALATED'), 'BLOCKED');
  assert.equal(statusForDiagnosticCode('PACK_BUDGET_EXHAUSTED'), 'BLOCKED');
  assert.equal(statusForDiagnosticCode('SOMETHING_UNKNOWN'), 'INDETERMINATE');
});

// ─── Cancellation / capability ports ──────────────────────────────────────────

test('cancellation fails closed across traversal', () => {
  const cancelledOpts = { ...opts, cancellation: { isCancelled: () => true } };
  const result = compileExecutionPack(makeValidInput(), cancelledOpts);
  assert.equal(failCode(result), 'CANCELLED');
});

test('invalid digest capability fails closed', () => {
  const badOpts = { digest: { algorithm: 'sha256' } };
  const result = compileExecutionPack(makeValidInput(), badOpts);
  assert.equal(failCode(result), 'DIGEST_CAPABILITY_INVALID');
});
