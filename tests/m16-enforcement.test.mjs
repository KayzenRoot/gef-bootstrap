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
  projectDecisionToNodes,
  issueMutationLease,
  checkExceptionBlastRadius,
  applyExceptionWarrant,
  revalidateLeaseAtMutation,
  evaluateFailClosedDegradation,
  authorizeMutation,
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

// ─── Real M14/M15 fixtures (no weaker parallel structures) ───────────────────

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

// ─── M16 policy fixtures ──────────────────────────────────────────────────────

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

function decideFor(policies, mandatory = ['SCOPE'], packRef = null) {
  // Bind the PDR exactly to the candidate M15 pack when available; the
  // hardcoded fallback preserves the legacy shape for unit-only callers.
  const binding = packRef
    ? { packId: packRef.packId, taskIdentity: packRef.taskIdentity, policyVersion: packRef.policyVersion }
    : { packId: 'pack-001', taskIdentity: 'task-1', policyVersion: '1.0.0' };
  const result = decidePolicy({
    request: { domains: ['SCOPE'], operations: [] },
    policies,
    lattice: { domains: [{ domain: 'domain-scope', order: policies.map(p => p.policyId) }] },
    mandatoryDomains: mandatory,
    supportedSchemas: ['v1'],
    packBinding: binding,
  }, opts);
  assert.equal(result.ok, true);
  return result.value;
}

// ─── GEM ──────────────────────────────────────────────────────────────────────

test('GEM projects a valid PDR onto exact pack nodes and domains', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideFor([pac('pol-guard-a'), pac('pol-guard-b')], ['SCOPE'], pack);
  assert.equal(pdr.decision, 'ALLOW');
  const projected = projectDecisionToNodes({
    receipt: pdr,
    pack,
    trustedPackReceipt: receipt,
    operations: [
      { nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' },
      { nodeId: 'b', mutationDomain: 'dom-b', operation: 'write:src/b.ts' },
    ],
  }, opts);
  assert.equal(projected.ok, true);
  assert.equal(projected.value.length, 2);
  assert.equal(projected.value[0].policySetFingerprint, pdr.policySetFingerprint);
  assert.equal(projected.value[0].provenanceRef, pdr.digest);
});

test('GEM rejects unknown nodes, undeclared mutations and broadened domains', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideFor([pac('pol-guard-a'), pac('pol-guard-b')], ['SCOPE'], pack);
  assert.equal(failCode(projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'ghost', mutationDomain: 'dom-a', operation: 'write:x' }],
  }, opts)), 'POLICY_GEM_UNKNOWN_NODE');
  assert.equal(failCode(projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-evil', operation: 'write:x' }],
  }, opts)), 'POLICY_GEM_UNDECLARED_MUTATION');

  // Tampered node that broadens the sealed payload fails at independent
  // seal re-verification before domain checks are even reached.
  const broadened = {
    ...pack,
    workDag: pack.workDag.map(n => (n.instructionId === 'a'
      ? { ...n, mutationDomains: [...n.mutationDomains, 'dom-evil'] }
      : n)),
  };
  assert.equal(failCode(projectDecisionToNodes({
    receipt: pdr, pack: broadened, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-evil', operation: 'write:x' }],
  }, opts)), 'POLICY_GEM_PACK_RECEIPT_INVALID');
});

test('GEM requires the node policy to be bound to the effective decision', () => {
  const { pack, receipt } = compilePack();
  // Unrelated policy still bound to this pack so the test reaches the
  // policy-binding gate instead of the pack-binding gate.
  const unrelated = pac('pol-unrelated');
  const pdr = decidePolicy({
    request: { domains: ['SCOPE'], operations: [] },
    policies: [unrelated],
    lattice: { domains: [{ domain: 'domain-scope', order: ['pol-unrelated'] }] },
    mandatoryDomains: [],
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion },
  }, opts).value;
  assert.equal(failCode(projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts)), 'POLICY_GEM_POLICY_NOT_BOUND');
});

test('GEM cannot turn an invalid or stale M15 pack into executable work', () => {
  const { pack, receipt } = compilePack();
  const pdr = decidePolicy({
    request: { domains: ['SCOPE'], operations: [] },
    policies: [pac('pol-guard-a'), pac('pol-guard-b')],
    lattice: { domains: [{ domain: 'domain-scope', order: ['pol-guard-a', 'pol-guard-b'] }] },
    mandatoryDomains: ['SCOPE'],
    supportedSchemas: ['v1'],
    packBinding: { packId: pack.packId, taskIdentity: pack.taskIdentity, policyVersion: pack.policyVersion },
  }, opts).value;
  const op = [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }];
  assert.equal(failCode(projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: { ...receipt, status: 'BLOCKED', replayable: false, diagnostics: ['x'] },
    operations: op,
  }, opts)), 'POLICY_GEM_PACK_RECEIPT_INVALID');
  assert.equal(failCode(projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: { ...receipt, semanticDigest: `sha256:${'0'.repeat(64)}` },
    operations: op,
  }, opts)), 'POLICY_GEM_PACK_RECEIPT_INVALID');
});

// ─── MCL + PTS + authorizeMutation ────────────────────────────────────────────

function leasedProjection() {
  const { pack, receipt } = compilePack();
  const policies = [pac('pol-guard-a'), pac('pol-guard-b')];
  const pdr = decideFor(policies, ['SCOPE'], pack);
  const projected = projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts);
  assert.equal(projected.ok, true);
  return { pack, receipt, pdr, projection: projected.value[0], policies };
}

function currentFingerprints(policies) {
  const record = {};
  for (const p of policies) record[p.policyId] = p.semanticIdentity;
  return record;
}

test('lease issuance, TOCTOU revalidation and full authorization', () => {
  const { pack, pdr, projection, policies } = leasedProjection();
  const lease = issueMutationLease({
    projection, receipt: pdr, projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
    reviewTrigger: 'review:mutation',
  }, opts);
  assert.equal(lease.ok, true);
  assert.match(lease.value.leaseId, /^sha256:[0-9a-f]{64}$/);

  const current = {
    packDigest: pack.semanticDigest,
    currentPolicyFingerprints: currentFingerprints(policies),
    currentWarrantFingerprints: {},
    warrantUses: {},
  };
  const checked = revalidateLeaseAtMutation(lease.value, current, opts);
  assert.equal(checked.ok, true);

  const authorized = authorizeMutation({
    lease: lease.value, projection, projectId: 'proj-gef',
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
  }, current, opts);
  assert.equal(authorized.ok, true);
});

test('lease reuse on another node, domain or project fails closed', () => {
  const { pack, pdr, projection, policies } = leasedProjection();
  const lease = issueMutationLease({
    projection, receipt: pdr, projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
    reviewTrigger: 'review:mutation',
  }, opts).value;
  const current = {
    packDigest: pack.semanticDigest,
    currentPolicyFingerprints: currentFingerprints(policies),
    currentWarrantFingerprints: {},
    warrantUses: {},
  };
  const base = {
    lease, projection, projectId: 'proj-gef', packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
  };
  assert.equal(failCode(authorizeMutation(
    { ...base, projection: { ...projection, nodeId: 'b' } }, current, opts,
  )), 'POLICY_LEASE_SCOPE_MISMATCH');
  assert.equal(failCode(authorizeMutation(
    { ...base, projection: { ...projection, mutationDomain: 'dom-b' } }, current, opts,
  )), 'POLICY_LEASE_SCOPE_MISMATCH');
  assert.equal(failCode(authorizeMutation({ ...base, projectId: 'proj-evil' }, current, opts)), 'POLICY_LEASE_SCOPE_MISMATCH');
});

test('TOCTOU: fingerprint change after decision invalidates the lease', () => {
  const { pack, pdr, projection, policies } = leasedProjection();
  const lease = issueMutationLease({
    projection, receipt: pdr, projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
    reviewTrigger: 'review:mutation',
  }, opts).value;
  const rotated = { ...currentFingerprints(policies), 'pol-guard-a': `sha256:${'f'.repeat(64)}` };
  const stale = revalidateLeaseAtMutation(lease, {
    packDigest: pack.semanticDigest,
    currentPolicyFingerprints: rotated,
    currentWarrantFingerprints: {},
    warrantUses: {},
  }, opts);
  assert.equal(failCode(stale), 'POLICY_LEASE_STALE_POLICY');
  const stalePack = revalidateLeaseAtMutation(lease, {
    packDigest: `sha256:${'0'.repeat(64)}`,
    currentPolicyFingerprints: currentFingerprints(policies),
    currentWarrantFingerprints: {},
    warrantUses: {},
  }, opts);
  assert.equal(failCode(stalePack), 'POLICY_LEASE_STALE_PACK');
});

test('no lease issues against a denying decision', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideFor([pac('pol-guard-a', { effectOnMatch: 'DENY' }), pac('pol-guard-b')], ['SCOPE'], pack);
  assert.equal(pdr.decision, 'DENY');
  const projected = projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts);
  assert.equal(projected.ok, true);
  assert.equal(failCode(issueMutationLease({
    projection: projected.value[0], receipt: pdr, projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest, reviewTrigger: 'review:mutation',
  }, opts)), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');
});

// ─── EBRC ─────────────────────────────────────────────────────────────────────

test('narrow exception succeeds; cross-domain and broadened warrants rejected', () => {
  const policies = [pac('pol-guard-a'), pac('pol-guard-b')];
  const byId = new Map(policies.map(p => [p.policyId, p]));
  const cap = {
    nodeIds: ['a', 'b'], mutationDomains: ['dom-a', 'dom-b'], obligations: ['audit-log'],
  };
  const narrow = checkExceptionBlastRadius(warrant('w-1'), byId, cap, 0);
  assert.equal(narrow.ok, true);
  assert.deepEqual(narrow.value.obligations, ['audit-log']);

  const broad = checkExceptionBlastRadius(
    warrant('w-2', { scopeNodeIds: ['ghost-node'] }), byId, cap, 0,
  );
  assert.equal(failCode(broad), 'POLICY_WARRANT_SCOPE_EXCEEDED');

  const crossPolicies = [
    pac('pol-guard-a'),
    pac('pol-other', { precedenceDomain: 'other-domain', scopeDomains: ['OTHER'] }),
  ];
  const crossById = new Map(crossPolicies.map(p => [p.policyId, p]));
  const cross = checkExceptionBlastRadius(
    warrant('w-3', { targetPolicyIds: ['pol-guard-a', 'pol-other'] }), crossById, cap, 0,
  );
  assert.equal(failCode(cross), 'POLICY_WARRANT_CROSS_DOMAIN');

  const exhausted = checkExceptionBlastRadius(warrant('w-4'), byId, cap, 2);
  assert.equal(failCode(exhausted), 'POLICY_WARRANT_EXHAUSTED');
});

test('exception application relaxes only named obligations and preserves debt', () => {
  const pdr = decideFor([
    pac('pol-guard-a', {
      obligations: [
        { obligationId: 'audit-log', statement: 'Log it', mandatory: true, dependsOn: [], conflictsWith: [] },
        { obligationId: 'keep-me', statement: 'Keep it', mandatory: true, dependsOn: [], conflictsWith: [] },
      ],
    }),
  ]);
  const cap = { nodeIds: ['a'], mutationDomains: ['dom-a'], obligations: ['audit-log', 'keep-me'] };
  const byId = new Map([['pol-guard-a', pac('pol-guard-a')]]);
  assert.equal(checkExceptionBlastRadius(warrant('w-1'), byId, cap, 0).ok, true);
  const applied = applyExceptionWarrant(pdr, warrant('w-1'), cap, opts);
  assert.equal(applied.ok, true);
  assert.deepEqual(applied.value.receipt.obligations.map(o => o.obligationId), ['keep-me']);
  assert.deepEqual(applied.value.receipt.exceptionsApplied[0].relaxedObligations, ['audit-log']);
  assert.equal(applied.value.debt.status, 'ACTIVE');
  assert.deepEqual(applied.value.debt.compensatingControls, ['extra-review']);
  // Resealed: the mutated receipt carries a fresh digest, never the original.
  assert.notEqual(applied.value.receipt.digest, pdr.digest);
});

// ─── FDM ──────────────────────────────────────────────────────────────────────

test('fail-closed degradation blocks on mandatory loss, passes when healthy', () => {
  const healthy = evaluateFailClosedDegradation(
    [{ name: 'policy-store', state: 'AVAILABLE', mandatory: true }],
    ['write:src/a.ts'],
  );
  assert.equal(healthy.ok, true);
  assert.deepEqual(healthy.value.blockedActions, []);
  const degraded = evaluateFailClosedDegradation(
    [
      { name: 'policy-store', state: 'STALE', mandatory: true },
      { name: 'telemetry', state: 'UNAVAILABLE', mandatory: false },
    ],
    ['write:src/a.ts'],
  );
  assert.equal(failCode(degraded), 'POLICY_DEGRADATION_BLOCKED');
  const optionalOnly = evaluateFailClosedDegradation(
    [{ name: 'telemetry', state: 'UNAVAILABLE', mandatory: false }],
    ['write:src/a.ts'],
  );
  assert.equal(optionalOnly.ok, true);
});
