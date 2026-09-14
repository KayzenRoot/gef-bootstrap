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
import { compileExecutionPack } from '../packages/execution-pack-compiler/dist/public.js';
import {
  createPolicyAuthorityCapsule,
  createExceptionWarrant,
  decidePolicy,
  verifyPolicyDecisionReceipt,
  projectDecisionToNodes,
  verifyVerifiedProjection,
  issueMutationLease,
  issueVerifiedMutationLease,
  checkExceptionBlastRadius,
  applyExceptionWarrant,
  authorizeMutation,
  buildGuardrailCoverageMap,
  detectPolicyRegression,
} from '../packages/policy-guardrail-engine/dist/public.js';

const digest = {
  algorithm: 'sha256',
  digest: value => createHash('sha256').update(value).digest('hex'),
};
const opts = { digest };
const PROFILE_DIGEST = 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

function failCode(result) {
  assert.equal(result.ok, false);
  return result.diagnostics[0].code;
}

function buildAdmittedContext() {
  const tie = createTaskIntentEnvelope({
    taskId: 'task-m16-01', taskClass: 'CONTROLLED_MUTATION', riskClass: 'STANDARD',
    objectiveSummary: 'Guarded scope change', targetDomains: ['SCOPE'],
    requiredCapabilities: ['READ_CONTEXT', 'WRITE_SOURCES'],
    projectId: 'proj-gef', sourcePackIdentity: 'sp-canon-01', profileIdentity: 'node-typescript',
    profileDigest: PROFILE_DIGEST, policyVersion: '1.0.0', checkpointIdentity: 'chk-001',
  }, opts).value;
  const unit = createAuthorityBoundContextUnit({
    unitId: 'u-scope', domain: 'SCOPE', role: 'NORMATIVE', applicability: 'ACTIVE',
    authorityRef: 'auth-scope', sourceFingerprint: 'fp-u-scope',
    projectId: 'proj-gef', sourcePackIdentity: 'sp-canon-01', profileIdentity: 'node-typescript',
    profileDigest: PROFILE_DIGEST, policyVersion: '1.0.0', checkpointIdentity: 'chk-001',
    semanticPayloadRef: 'ref:SCOPE:u-scope', sensitivity: 'INTERNAL',
  }, opts).value;
  const lattice = buildSemanticCoverageLattice(
    tie, [{ obligationId: 'ob-scope', domain: 'SCOPE', requiredRoles: ['NORMATIVE'], mandatory: true }],
    [unit], opts,
  ).value;
  const closure = computeContextDependencyClosure(
    ['u-scope'], new Map([['u-scope', { id: 'u-scope', dependencies: [] }]]), undefined, opts,
  ).value;
  const deficit = buildContextDeficitVector(tie, lattice, closure, { unresolvedCount: 0, conflictCount: 0 }, 'STANDARD');
  const witness = buildMinimumContextWitness(tie, [unit], [unit], lattice, opts).value;
  const proof = buildContextSufficiencyProof({
    tie, lattice, deficitVector: deficit, witness, closure,
    validityFingerprints: [unit.sourceFingerprint], exclusionJustifications: [],
  }, opts).value;
  const capsule = buildTaskContextCapsule({
    taskIntentEnvelope: tie, projectId: tie.projectId, sourcePackIdentity: tie.sourcePackIdentity,
    profileIdentity: tie.profileIdentity, profileDigest: tie.profileDigest,
    policyVersion: tie.policyVersion, checkpointIdentity: tie.checkpointIdentity,
    selectedUnits: [unit],
    authorityProofs: [{ domain: 'SCOPE', sourceId: unit.unitId, proofRef: 'proof-scope', conflictState: 'RESOLVED' }],
    sufficiencyProof: proof, expansionTrace: [], exclusions: [], validity: 'VALID',
  }, opts).value;
  const graph = computeSelectiveContextInvalidationGraph(
    capsule, [{ unitId: unit.unitId, fingerprint: unit.sourceFingerprint }],
    proof.dependencyKnowledgeComplete, opts,
  ).value;
  const handoff = buildExecutionHandoffContract(capsule, graph, opts).value;
  return { capsule, handoff };
}

function makeNode(id, domain, dependsOn = []) {
  return {
    instructionId: id, objective: `Objective for ${id}`, targetFiles: [`src/${id}.ts`],
    dependsOn, mutationDomains: [domain], validationIds: [`val-${id}`],
    rollbackPlan: `revert-${id}`, provenanceRefs: [`auth:${id}`],
    preconditions: ['pack-valid'], mutationSpec: `mutation:${domain}`, evidenceOutputs: [`ev:${id}`],
  };
}

function compilePack() {
  const cap = {
    required: {
      capabilityIdentity: 'exec-cap-01', capabilities: ['READ', 'WRITE'], tools: ['read', 'write'],
      maxParallelism: 4, requiredMutationPermissions: ['fs:write:src'],
      forbiddenCapabilities: ['net:egress'], unavailableCapabilities: ['gpu:exec'],
      sandboxAssumptions: ['no-network', 'fs-sandbox:repo'],
    },
    offer: {
      capabilityIdentity: 'exec-cap-01', capabilities: ['READ', 'WRITE'], tools: ['read', 'write'],
      mutationPermissions: ['fs:write:src'], sandboxCapabilities: ['no-network', 'fs-sandbox:repo'],
      maxParallelism: 2,
    },
  };
  const result = compileExecutionPack({
    packId: 'pack-001',
    context: buildAdmittedContext(),
    objective: 'Guarded scope change',
    constraints: ['no-discovery'],
    allowedMutations: ['dom-a', 'dom-b'],
    forbiddenMutations: ['db:drop'],
    proofObligations: ['pack-sealed'],
    stopCondition: 'STOP: pack sealed VALID',
    handbackSchema: 'handback:v1',
    instructions: [makeNode('a', 'dom-a'), makeNode('b', 'dom-b', ['a'])],
    validations: [
      { validationId: 'val-a', command: 'node --test tests/a.test.mjs', scope: 'FOCUSED', covers: ['a'] },
      { validationId: 'val-b', command: 'node --test tests/b.test.mjs', scope: 'FOCUSED', covers: ['b'] },
    ],
    requiredCapability: cap.required,
    capabilityOffer: cap.offer,
    guardrailBindings: [
      { nodeId: 'a', policyIds: ['pol-guard-a'] },
      { nodeId: 'b', policyIds: ['pol-guard-b'] },
    ],
    provenanceEntries: [
      { instructionId: 'a', authorityRefs: ['auth:a'], decisionRefs: [] },
      { instructionId: 'b', authorityRefs: ['auth:b'], decisionRefs: [] },
    ],
    reasoningBranches: [{ branchId: 'r1', decided: true, canonicalRef: 'dec-1' }],
    ambiguities: [],
    cognitionBudget: { maxReads: 10, maxSearches: 10, maxToolCalls: 10, maxAmbiguityBranches: 5 },
    toolBlueprint: [{
      tool: 'read', purpose: 'inspect', afterNodeIds: [], inputs: ['pack-bindings'],
      expectedOutputs: ['source-text'], fallbackPath: 'escalate-to-compiler',
    }],
    readOnceEntries: { ctx: ['u-scope'] },
    negativeSearchLedger: [{ query: 'absent', fingerprint: 'fp-1', contextIdentity: 'ctx-1' }],
    noDiscoveryBoundary: ['product-intent'],
    promptSections: ['MUST: keep objective'],
    obligationMarkers: ['MUST:'],
  }, opts);
  assert.equal(result.ok, true);
  return result.value;
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
    warrantId: id, targetPolicyIds: ['pol-guard-a'], targetDomains: ['SCOPE'],
    targetObligations: ['audit-log'], scopeNodeIds: ['a'], scopeMutationDomains: ['dom-a'],
    rationale: 'Hotfix window', compensatingControls: ['extra-review'],
    approvedByAuthority: 'owner-pol-guard-a', approverProvenance: 'prov:pol-guard-a',
    reviewTrigger: 'review:24h', maxUses: 2,
    ...overrides,
  };
}

function warrant(id, overrides = {}) {
  const result = createExceptionWarrant(makeWarrant(id, overrides), opts);
  assert.equal(result.ok, true);
  return result.value;
}

function decideBound(policies, pack, mandatory = ['SCOPE'], request = { domains: ['SCOPE'], operations: [] }) {
  const result = decidePolicy({
    request,
    policies,
    lattice: { domains: [{ domain: 'domain-scope', order: policies.map(p => p.policyId) }] },
    mandatoryDomains: mandatory,
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion },
  }, opts);
  assert.equal(result.ok, true);
  return result.value;
}

// ─── HIGH-A: sealed verified projection; forged node with real digests fails ─

test('HIGH-A: forged projection with real PDR digest and policy set is rejected', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideBound([pac('pol-guard-a'), pac('pol-guard-b')], pack);
  // Attacker copies every public string correctly but names a node GEM
  // would reject (undeclared ghost node).
  const forged = {
    nodeId: 'ghost-node',
    mutationDomain: 'dom-a',
    operation: 'write:src/ghost.ts',
    decision: pdr.decision,
    obligations: [...pdr.obligations],
    policySetFingerprint: pdr.policySetFingerprint,
    provenanceRef: pdr.digest,
  };
  const leased = issueMutationLease({
    projection: forged, receipt: pdr, pack, trustedPackReceipt: receipt,
    projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
    reviewTrigger: 'review:mutation',
  }, opts);
  assert.equal(leased.ok, false);
  assert.ok(['POLICY_PROJECTION_INVALID', 'POLICY_GEM_UNKNOWN_NODE'].includes(leased.diagnostics[0].code));
});

test('HIGH-A: fake caller packDigest cannot become authority even when echoed to PTS', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideBound([pac('pol-guard-a'), pac('pol-guard-b')], pack);
  const fakeDigest = `sha256:${'9'.repeat(64)}`;
  const verified = issueVerifiedMutationLease({
    pack, trustedPackReceipt: receipt, receipt: pdr,
    operation: { nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' },
    projectId: 'proj-gef', reviewTrigger: 'review:mutation',
  }, opts);
  assert.equal(verified.ok, true);
  // The verified path derives the digest; a caller-supplied fake never matches.
  const forgedLease = issueMutationLease({
    projection: verified.value.projection, receipt: pdr, pack, trustedPackReceipt: receipt,
    projectId: 'proj-gef', packId: pack.packId,
    packDigest: fakeDigest, decisionDigest: pdr.digest,
    reviewTrigger: 'review:mutation',
  }, opts);
  assert.equal(failCode(forgedLease), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');
});

test('HIGH-A: verified high-level lease path issues a sealed projection and lease', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideBound([pac('pol-guard-a'), pac('pol-guard-b')], pack);
  const verified = issueVerifiedMutationLease({
    pack, trustedPackReceipt: receipt, receipt: pdr,
    operation: { nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' },
    projectId: 'proj-gef', reviewTrigger: 'review:mutation',
  }, opts);
  assert.equal(verified.ok, true);
  assert.equal(verifyVerifiedProjection(verified.value.projection, opts).ok, true);
  assert.equal(verified.value.lease.projectionDigest, verified.value.projection.projectionDigest);
  const current = {
    packDigest: pack.semanticDigest,
    currentPolicyFingerprints: Object.fromEntries(
      [pac('pol-guard-a'), pac('pol-guard-b')].map(p => [p.policyId, p.semanticIdentity]),
    ),
    currentWarrantFingerprints: {}, warrantUses: {},
  };
  const authorized = authorizeMutation({
    lease: verified.value.lease, projection: verified.value.projection,
    projectId: 'proj-gef', packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
  }, current, opts);
  assert.equal(authorized.ok, true);
});

// ─── HIGH-B: sealed cap; forged sets fail, mutations fail, genuine reseals ───

test('HIGH-B: forged cap with exactly matching sets is rejected without seal', () => {
  const { pack } = compilePack();
  const obligated = pac('pol-guard-a', {
    obligations: [
      { obligationId: 'audit-log', statement: 'Log it', mandatory: true, dependsOn: [], conflictsWith: [] },
    ],
  });
  const pdr = decideBound([obligated], pack, []);
  const w = warrant('w-1');
  // Exact structural match, but never issued by checkExceptionBlastRadius.
  const forgedCap = {
    nodeIds: [...w.scopeNodeIds], mutationDomains: [...w.scopeMutationDomains], obligations: [...w.targetObligations],
  };
  assert.equal(failCode(applyExceptionWarrant(pdr, w, forgedCap, opts)), 'POLICY_CAP_INVALID');
});

test('HIGH-B: mutated sealed cap fields each fail; genuine cap reseals', () => {
  const obligated = pac('pol-guard-a', {
    obligations: [
      { obligationId: 'audit-log', statement: 'Log it', mandatory: true, dependsOn: [], conflictsWith: [] },
      { obligationId: 'keep-me', statement: 'Keep it', mandatory: true, dependsOn: [], conflictsWith: [] },
    ],
  });
  const { pack } = compilePack();
  const pdr = decideBound([obligated], pack, []);
  const byId = new Map([['pol-guard-a', obligated]]);
  const sealed = checkExceptionBlastRadius(
    warrant('w-1'), byId,
    { nodeIds: ['a'], mutationDomains: ['dom-a'], obligations: ['audit-log', 'keep-me'] }, 0, opts,
  );
  assert.equal(sealed.ok, true);
  const cap = sealed.value;
  const w = warrant('w-1');
  const mutants = [
    { ...cap, warrantFingerprint: `sha256:${'0'.repeat(64)}` },
    { ...cap, targetPolicyIds: ['pol-other'] },
    { ...cap, affectedSetFingerprint: `sha256:${'1'.repeat(64)}` },
    { ...cap, useCount: cap.useCount + 1, capDigest: cap.capDigest },
    { ...cap, nodeIds: ['b'], capDigest: cap.capDigest },
  ];
  for (const mutant of mutants) {
    assert.equal(applyExceptionWarrant(pdr, w, mutant, opts).ok, false);
  }
  const genuine = applyExceptionWarrant(pdr, w, cap, opts);
  assert.equal(genuine.ok, true);
  assert.notEqual(genuine.value.receipt.digest, pdr.digest);
  assert.equal(genuine.value.debt.status, 'ACTIVE');
  assert.equal(verifyPolicyDecisionReceipt(genuine.value.receipt, opts).ok, true);
});

// ─── HIGH-C: decision evidence sealed; tampering detected ────────────────────

test('HIGH-C: tampered request, witness, mandatory, schema and lattice evidence fail verifier', () => {
  const { pack } = compilePack();
  const pdr = decideBound([pac('pol-guard-a'), pac('pol-guard-b')], pack);
  assert.equal(verifyPolicyDecisionReceipt(pdr, opts).ok, true);
  const mutants = [
    { ...pdr, request: { domains: ['OTHER'], operations: [] } },
    {
      ...pdr,
      applicabilityWitnesses: pdr.applicabilityWitnesses.map(w =>
        w.policyId === 'pol-guard-a' ? { ...w, state: 'NOT_APPLICABLE', witness: 'not-applicable:no-match' } : w,
      ),
    },
    { ...pdr, unresolvedMandatoryDomains: ['SCOPE'] },
    { ...pdr, supportedSchemas: ['v99'] },
    {
      ...pdr,
      latticeEvidence: {
        domains: [{ domain: 'domain-scope', order: ['pol-guard-b', 'pol-guard-a'] }],
        evidenceFingerprint: pdr.latticeEvidence.evidenceFingerprint,
      },
    },
  ];
  for (const mutant of mutants) {
    assert.equal(verifyPolicyDecisionReceipt(mutant, opts).ok, false);
  }
});

// ─── HIGH-D: missing evidence UNKNOWN; complete lattice membership ───────────

test('HIGH-D: omitted SCOPE evidence on constrained DENY fails closed, never ALLOW', () => {
  const { pack } = compilePack();
  const denyScope = pac('pol-deny-scope', {
    applicability: { domains: ['SCOPE'], operations: [], matchMode: 'ANY' },
    effectOnMatch: 'DENY',
  });
  const permissive = pac('pol-permissive', {
    applicability: { domains: ['SCOPE'], operations: [], matchMode: 'ANY' },
    effectOnMatch: 'ALLOW',
  });
  // No mandatory-domain rescue is supplied: the decision must stand on
  // applicability evidence alone.
  const result = decidePolicy({
    request: { domains: [], operations: [] },
    policies: [denyScope, permissive],
    lattice: { domains: [{ domain: 'domain-scope', order: ['pol-deny-scope', 'pol-permissive'] }] },
    mandatoryDomains: [],
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion },
  }, opts);
  assert.equal(result.ok, true);
  assert.notEqual(result.value.decision, 'ALLOW');
  assert.equal(result.value.decision, 'BLOCK_UNKNOWN');
});

test('HIGH-D: lattice omitting an applicable policy or naming a ghost fails', () => {
  const { pack } = compilePack();
  const policies = [pac('pol-guard-a'), pac('pol-guard-b')];
  const base = {
    request: { domains: ['SCOPE'], operations: [] },
    policies,
    mandatoryDomains: [],
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion },
  };
  assert.equal(failCode(decidePolicy({
    ...base, lattice: { domains: [{ domain: 'domain-scope', order: ['pol-guard-a'] }] },
  }, opts)), 'POLICY_LATTICE_INVALID');
  assert.equal(failCode(decidePolicy({
    ...base,
    lattice: { domains: [{ domain: 'domain-scope', order: ['pol-guard-a', 'pol-guard-b', 'pol-ghost'] }] },
  }, opts)), 'POLICY_LATTICE_INVALID');
});

test('HIGH-D: reversed unrelated inputs keep sealed evidence deterministic', () => {
  const { pack } = compilePack();
  const policies = [pac('pol-guard-a'), pac('pol-guard-b')];
  const lattice = { domains: [{ domain: 'domain-scope', order: ['pol-guard-a', 'pol-guard-b'] }] };
  const binding = { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion };
  const first = decidePolicy({
    request: { domains: ['SCOPE'], operations: [] }, policies, lattice,
    mandatoryDomains: [], supportedSchemas: ['v1'], packBinding: binding,
  }, opts);
  const second = decidePolicy({
    request: { domains: ['SCOPE'], operations: [] }, policies: [...policies].reverse(), lattice,
    mandatoryDomains: [], supportedSchemas: ['v1'], packBinding: binding,
  }, opts);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.value.digest, first.value.digest);
  assert.deepEqual(second.value.latticeEvidence, first.value.latticeEvidence);
});

// ─── HIGH-E: validated coverage; removed applicable DENY is regression ───────

test('HIGH-E: unsupported-schema policy cannot claim coverage', () => {
  const coveringFuture = pac('p-future', {
    schemaVersion: 'v99',
    applicability: { domains: ['SCOPE'], operations: ['write:src/a.ts'], matchMode: 'ANY' },
  });
  const map = buildGuardrailCoverageMap(
    [{ operation: 'write:src/a.ts', domain: 'SCOPE', nodeId: 'a' }],
    [coveringFuture],
    ['v1'],
  );
  assert.equal(map.entries[0].covered, false);
  assert.equal(map.gaps.length, 1);
  assert.equal(map.entries[0].validity, 'UNSUPPORTED_SCHEMA');
  assert.deepEqual(map.entries[0].excludedPolicyIds, ['p-future']);
});

test('HIGH-E: removing an applicable DENY with no obligations is a regression', () => {
  const deny = pac('p-deny', { effectOnMatch: 'DENY' });
  const previous = { policies: [deny], warrants: [] };
  const current = { policies: [], warrants: [] };
  const { findings, hasRegression } = detectPolicyRegression(previous, current);
  assert.equal(hasRegression, true);
  assert.ok(findings.some(f => f.kind === 'DENY_TO_ALLOW' && f.policyId === 'p-deny'));
});
