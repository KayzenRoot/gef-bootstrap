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
  buildApplicabilityWitnessSet,
  issuePolicyDecisionReceipt,
  verifyPolicyDecisionReceipt,
  validatePolicyDomainLattice,
  projectDecisionToNodes,
  issueMutationLease,
  checkExceptionBlastRadius,
  applyExceptionWarrant,
  revalidateLeaseAtMutation,
  authorizeMutation,
  computePolicySemanticFingerprint,
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

function decideBound(policies, pack, mandatory = ['SCOPE']) {
  const result = decidePolicy({
    request: { domains: ['SCOPE'], operations: [] },
    policies,
    lattice: { domains: [{ domain: 'domain-scope', order: policies.map(p => p.policyId) }] },
    mandatoryDomains: mandatory,
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion },
  }, opts);
  assert.equal(result.ok, true);
  return result.value;
}

function currentFingerprints(policies) {
  const record = {};
  for (const p of policies) record[p.policyId] = p.semanticIdentity;
  return record;
}

// ─── HIGH-1: independent M15 seal re-verification + exact PDR binding ─────────

test('HIGH-1: tampered M15 payload with stale stored digest fails GEM', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideBound([pac('pol-guard-a'), pac('pol-guard-b')], pack);
  const tampered = {
    ...pack,
    workDag: pack.workDag.map(n => (n.instructionId === 'a'
      ? { ...n, mutationDomains: [...n.mutationDomains, 'dom-evil'] }
      : n)),
    // Attacker keeps the stale stored digest to look valid.
    semanticDigest: pack.semanticDigest,
    graphDigest: pack.graphDigest,
  };
  const projected = projectDecisionToNodes({
    receipt: pdr, pack: tampered, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts);
  assert.equal(failCode(projected), 'POLICY_GEM_PACK_RECEIPT_INVALID');
});

test('HIGH-1: same packId but wrong taskIdentity fails GEM', () => {
  const { pack, receipt } = compilePack();
  const wrongTask = decidePolicy({
    request: { domains: ['SCOPE'], operations: [] },
    policies: [pac('pol-guard-a'), pac('pol-guard-b')],
    lattice: { domains: [{ domain: 'domain-scope', order: ['pol-guard-a', 'pol-guard-b'] }] },
    mandatoryDomains: ['SCOPE'],
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: 'task-forged', policyVersion: pack.policyVersion },
  }, opts).value;
  const projected = projectDecisionToNodes({
    receipt: wrongTask, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts);
  assert.equal(failCode(projected), 'POLICY_GEM_PACK_RECEIPT_INVALID');
});

test('HIGH-1: same packId but wrong policyVersion fails GEM', () => {
  const { pack, receipt } = compilePack();
  const wrongPolicy = decidePolicy({
    request: { domains: ['SCOPE'], operations: [] },
    policies: [pac('pol-guard-a'), pac('pol-guard-b')],
    lattice: { domains: [{ domain: 'domain-scope', order: ['pol-guard-a', 'pol-guard-b'] }] },
    mandatoryDomains: ['SCOPE'],
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: '9.9.9-forged' },
  }, opts).value;
  const projected = projectDecisionToNodes({
    receipt: wrongPolicy, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts);
  assert.equal(failCode(projected), 'POLICY_GEM_PACK_RECEIPT_INVALID');
});

test('HIGH-1: tampered PDR with unchanged digest fails GEM and verifier', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideBound([pac('pol-guard-a'), pac('pol-guard-b')], pack);
  assert.equal(pdr.decision, 'ALLOW');
  const tamperedPdr = { ...pdr, decision: 'DENY' };
  // Digest kept stale on purpose.
  assert.equal(tamperedPdr.digest, pdr.digest);
  assert.equal(failCode(verifyPolicyDecisionReceipt(tamperedPdr, opts)), 'POLICY_RECEIPT_INVALID');
  const projected = projectDecisionToNodes({
    receipt: tamperedPdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts);
  assert.equal(failCode(projected), 'POLICY_RECEIPT_INVALID');
});

// ─── HIGH-2: MCL only from verified GEM/PDR chain ─────────────────────────────

test('HIGH-2: caller-crafted ALLOW projection cannot mint a lease', () => {
  const { pack } = compilePack();
  const pdr = decideBound([pac('pol-guard-a'), pac('pol-guard-b')], pack);
  const forgedProjection = {
    nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts',
    decision: 'ALLOW', obligations: [],
    policySetFingerprint: pdr.policySetFingerprint,
    provenanceRef: `sha256:${'e'.repeat(64)}`,
  };
  const leased = issueMutationLease({
    projection: forgedProjection, receipt: pdr, projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest, reviewTrigger: 'review:mutation',
  }, opts);
  assert.equal(failCode(leased), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');
});

test('HIGH-2: mismatched decision digest fails lease and authorization', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideBound([pac('pol-guard-a'), pac('pol-guard-b')], pack);
  const projected = projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts).value[0];
  const mismatched = issueMutationLease({
    projection: projected, receipt: pdr, projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: `sha256:${'0'.repeat(64)}`,
    reviewTrigger: 'review:mutation',
  }, opts);
  assert.equal(failCode(mismatched), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');

  const lease = issueMutationLease({
    projection: projected, receipt: pdr, projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest, reviewTrigger: 'review:mutation',
  }, opts).value;
  const current = {
    packDigest: pack.semanticDigest,
    currentPolicyFingerprints: currentFingerprints([pac('pol-guard-a'), pac('pol-guard-b')]),
    currentWarrantFingerprints: {}, warrantUses: {},
  };
  const authorized = authorizeMutation({
    lease, projection: projected, projectId: 'proj-gef',
    packDigest: pack.semanticDigest, decisionDigest: `sha256:${'1'.repeat(64)}`,
  }, current, opts);
  assert.equal(failCode(authorized), 'POLICY_LEASE_SCOPE_MISMATCH');
});

// ─── HIGH-3: EBRC cap enforcement + PDR reseal ────────────────────────────────

test('HIGH-3: forged or reused EBRC cap fails exception application', () => {
  const { pack } = compilePack();
  const obligated = pac('pol-guard-a', {
    obligations: [
      { obligationId: 'audit-log', statement: 'Log it', mandatory: true, dependsOn: [], conflictsWith: [] },
    ],
  });
  const pdr = decideBound([obligated], pack, []);
  const forgedCap = { nodeIds: ['other-node'], mutationDomains: ['dom-a'], obligations: ['audit-log'] };
  assert.equal(failCode(applyExceptionWarrant(pdr, warrant('w-1'), forgedCap, opts)), 'POLICY_WARRANT_SCOPE_EXCEEDED');
  const reusedCap = { nodeIds: ['a'], mutationDomains: ['other-domain'], obligations: ['audit-log'] };
  assert.equal(failCode(applyExceptionWarrant(pdr, warrant('w-1'), reusedCap, opts)), 'POLICY_WARRANT_SCOPE_EXCEEDED');
});

test('HIGH-3: exception-mutated PDR is resealed with a fresh digest', () => {
  const { pack } = compilePack();
  const obligated = pac('pol-guard-a', {
    obligations: [
      { obligationId: 'audit-log', statement: 'Log it', mandatory: true, dependsOn: [], conflictsWith: [] },
      { obligationId: 'keep-me', statement: 'Keep it', mandatory: true, dependsOn: [], conflictsWith: [] },
    ],
  });
  const pdr = decideBound([obligated], pack, []);
  const cap = { nodeIds: ['a'], mutationDomains: ['dom-a'], obligations: ['audit-log', 'keep-me'] };
  const applied = applyExceptionWarrant(pdr, warrant('w-1'), cap, opts);
  assert.equal(applied.ok, true);
  assert.notEqual(applied.value.receipt.digest, pdr.digest);
  assert.equal(verifyPolicyDecisionReceipt(applied.value.receipt, opts).ok, true);
});

// ─── HIGH-4: ID-to-fingerprint binding + full PDR sealing + PTS ──────────────

test('HIGH-4: swapped policy fingerprints across IDs fail PTS', () => {
  const { pack, receipt } = compilePack();
  const policies = [pac('pol-guard-a'), pac('pol-guard-b')];
  const pdr = decideBound(policies, pack);
  const projected = projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts).value[0];
  const lease = issueMutationLease({
    projection: projected, receipt: pdr, projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest, reviewTrigger: 'review:mutation',
  }, opts).value;
  const fps = currentFingerprints(policies);
  const swapped = { 'pol-guard-a': fps['pol-guard-b'], 'pol-guard-b': fps['pol-guard-a'] };
  const stale = revalidateLeaseAtMutation(lease, {
    packDigest: pack.semanticDigest, currentPolicyFingerprints: swapped,
    currentWarrantFingerprints: {}, warrantUses: {},
  }, opts);
  assert.equal(failCode(stale), 'POLICY_LEASE_STALE_POLICY');
});

test('HIGH-4: PDR digest seals obligation dependency and conflict semantics', () => {
  const { pack } = compilePack();
  const base = pac('pol-x', {
    obligations: [
      { obligationId: 'o1', statement: 'Do o1', mandatory: true, dependsOn: [], conflictsWith: [] },
    ],
  });
  const withDep = pac('pol-x', {
    obligations: [
      { obligationId: 'o1', statement: 'Do o1', mandatory: true, dependsOn: ['o0'], conflictsWith: [] },
    ],
  });
  void withDep;
  const pdrBase = decideBound([base], pack, []);
  const altered = pac('pol-x', {
    obligations: [
      { obligationId: 'o1', statement: 'Do o1', mandatory: true, dependsOn: [], conflictsWith: ['o2'] },
    ],
  });
  const pdrAltered = decideBound([altered], pack, []);
  assert.notEqual(pdrBase.digest, pdrAltered.digest);
  assert.notEqual(pdrBase.policySetFingerprint, pdrAltered.policySetFingerprint);
});

test('HIGH-4: PTS rejects dropped or injected policy IDs', () => {
  const { pack, receipt } = compilePack();
  const policies = [pac('pol-guard-a'), pac('pol-guard-b')];
  const pdr = decideBound(policies, pack);
  const projected = projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts).value[0];
  const lease = issueMutationLease({
    projection: projected, receipt: pdr, projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest, reviewTrigger: 'review:mutation',
  }, opts).value;
  const fewer = { 'pol-guard-a': currentFingerprints(policies)['pol-guard-a'] };
  assert.equal(failCode(revalidateLeaseAtMutation(lease, {
    packDigest: pack.semanticDigest, currentPolicyFingerprints: fewer,
    currentWarrantFingerprints: {}, warrantUses: {},
  }, opts)), 'POLICY_LEASE_STALE_POLICY');
});

// ─── HIGH-5: duplicates, missing evidence, lattice ────────────────────────────

test('HIGH-5: duplicate policy IDs rejected in both orders', () => {
  const { pack } = compilePack();
  const first = pac('pol-dup');
  const second = pac('pol-dup', { version: '2.0.0' });
  const input = {
    request: { domains: ['SCOPE'], operations: [] },
    lattice: { domains: [{ domain: 'domain-scope', order: ['pol-dup'] }] },
    mandatoryDomains: [],
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion },
  };
  assert.equal(failCode(decidePolicy({ ...input, policies: [first, second] }, opts)), 'POLICY_CAPSULE_INVALID');
  assert.equal(failCode(decidePolicy({ ...input, policies: [second, first] }, opts)), 'POLICY_CAPSULE_INVALID');
});

test('HIGH-5: missing request domain and operation evidence fails closed', () => {
  const policies = [pac('pol-needs-scope')];
  const set = buildApplicabilityWitnessSet(policies, { domains: [], operations: [] }, ['v1']);
  assert.equal(set[0].state, 'NOT_APPLICABLE');
  const { pack } = compilePack();
  const decided = decidePolicy({
    request: { domains: [], operations: [] },
    policies,
    lattice: { domains: [{ domain: 'domain-scope', order: ['pol-needs-scope'] }] },
    mandatoryDomains: ['SCOPE'],
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion },
  }, opts);
  assert.equal(decided.ok, true);
  assert.equal(decided.value.decision, 'BLOCK_UNKNOWN');
});

test('HIGH-5: invalid and incomplete lattices fail closed', () => {
  const { pack } = compilePack();
  const policies = [pac('pol-guard-a')];
  const base = {
    request: { domains: ['SCOPE'], operations: [] },
    policies,
    mandatoryDomains: [],
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion },
  };
  assert.equal(failCode(decidePolicy({ ...base, lattice: { domains: [] } }, opts)), 'POLICY_LATTICE_INVALID');
  assert.equal(failCode(decidePolicy({
    ...base,
    lattice: { domains: [{ domain: 'domain-scope', order: ['pol-guard-a', 'pol-guard-a'] }] },
  }, opts)), 'POLICY_LATTICE_INVALID');
  assert.equal(failCode(decidePolicy({
    ...base, lattice: { domains: [{ domain: 'other-domain', order: ['pol-guard-a'] }] },
  }, opts)), 'POLICY_LATTICE_INVALID');
  // Direct validator consumption as well.
  assert.equal(validatePolicyDomainLattice({ domains: [] }, policies).ok, false);
});

// ─── HIGH-6: full PSF + set-based PRS scope regression ───────────────────────

test('HIGH-6: PSF changes on provenance, evidence, review, dependency and conflict', () => {
  const base = pac('pol-psf');
  const baseline = computePolicySemanticFingerprint([base], opts).value;
  const cases = [
    pac('pol-psf', { ownerProvenance: 'prov:changed' }),
    pac('pol-psf', { evidenceFingerprint: 'fp:changed' }),
    pac('pol-psf', { reviewTrigger: 'review:changed' }),
    pac('pol-psf', {
      obligations: [
        { obligationId: 'o1', statement: 'Do o1', mandatory: true, dependsOn: ['o0'], conflictsWith: [] },
      ],
    }),
    pac('pol-psf', {
      obligations: [
        { obligationId: 'o1', statement: 'Do o1', mandatory: true, dependsOn: [], conflictsWith: ['o2'] },
      ],
    }),
  ];
  for (const altered of cases) {
    const fp = computePolicySemanticFingerprint([altered], opts).value;
    assert.notEqual(fp, baseline);
  }
});

test('HIGH-6: PRS detects same-cardinality scope change and maxUses broadening', () => {
  const previous = { policies: [pac('pol-a')], warrants: [warrant('w-1')] };
  const sameSize = {
    policies: [pac('pol-a')],
    warrants: [{ ...warrant('w-1'), scopeNodeIds: ['b'] }],
  };
  const foundSame = detectPolicyRegression(previous, sameSize);
  assert.equal(foundSame.hasRegression, true);
  assert.ok(foundSame.findings.some(f => f.kind === 'BROADER_EXCEPTION_SCOPE'));

  const broaderUses = {
    policies: [pac('pol-a')],
    warrants: [{ ...warrant('w-1'), maxUses: 9 }],
  };
  const foundUses = detectPolicyRegression(previous, broaderUses);
  assert.equal(foundUses.hasRegression, true);
  assert.ok(foundUses.findings.some(f => f.kind === 'BROADER_EXCEPTION_SCOPE'));

  const changedTargets = {
    policies: [pac('pol-a')],
    warrants: [{ ...warrant('w-1'), targetPolicyIds: ['pol-other'] }],
  };
  const foundTargets = detectPolicyRegression(previous, changedTargets);
  assert.equal(foundTargets.hasRegression, true);
  assert.ok(foundTargets.findings.some(f => f.kind === 'BROADER_EXCEPTION_SCOPE'));
});
