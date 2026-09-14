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
  issueMutationLease,
  issueVerifiedMutationLease,
  checkExceptionBlastRadius,
  applyExceptionWarrant,
  applyVerifiedException,
  authorizeMutation,
  buildGuardrailCoverageMap,
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

function obligatedGuard() {
  return pac('pol-guard-a', {
    obligations: [
      { obligationId: 'audit-log', statement: 'Log it', mandatory: true, dependsOn: [], conflictsWith: [] },
      { obligationId: 'keep-me', statement: 'Keep it', mandatory: true, dependsOn: [], conflictsWith: [] },
    ],
  });
}

function leaseBase(pack, receipt, pdr, projection) {
  return {
    projection, receipt, pack, trustedPackReceipt: receipt,
    projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
    reviewTrigger: 'review:mutation',
  };
}

// ─── HIGH-F: lease obligations exact-derived ──────────────────────────────────

test('HIGH-F: reduced or mutated obligation overrides fail; derived lease is exact', () => {
  const { pack, receipt } = compilePack();
  const pdr = decideBound([obligatedGuard(), pac('pol-guard-b')], pack);
  assert.equal(pdr.decision, 'ALLOW_WITH_OBLIGATIONS');
  assert.equal(pdr.obligations.length, 2);
  const projection = projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts).value[0];
  const base = { ...leaseBase(pack, receipt, pdr, projection), receipt: pdr };

  // Omission and partial omission fail.
  assert.equal(failCode(issueMutationLease({ ...base, obligations: [] }, opts)), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');
  assert.equal(failCode(issueMutationLease({ ...base, obligations: [pdr.obligations[0]] }, opts)), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');

  // Semantic mutations fail: statement, mandatory, dependsOn, conflictsWith.
  const [first, second] = pdr.obligations;
  const mutants = [
    [{ ...first, statement: 'Forged statement' }, second],
    [{ ...first, mandatory: false }, second],
    [{ ...first, dependsOn: ['ghost-dep'] }, second],
    [{ ...first, conflictsWith: ['ghost-conflict'] }, second],
    [second, first, { obligationId: 'injected', statement: 'Extra', mandatory: true, dependsOn: [], conflictsWith: [] }],
  ];
  for (const obligations of mutants) {
    assert.equal(failCode(issueMutationLease({ ...base, obligations }, opts)), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');
  }

  // The successful lease carries exactly the canonical verified obligations.
  const good = issueMutationLease(base, opts);
  assert.equal(good.ok, true);
  assert.deepEqual(
    good.value.obligations.map(o => o.obligationId),
    projection.obligations.map(o => o.obligationId),
  );
  assert.deepEqual(good.value.obligations, projection.obligations);
});

// ─── HIGH-G: exception-bearing leases derive warrant state ───────────────────

function exceptionMutatedPdr() {
  const obligated = obligatedGuard();
  const { pack, receipt } = compilePack();
  const pdr = decideBound([obligated], pack, []);
  const byId = new Map([['pol-guard-a', obligated]]);
  const maxAffected = { nodeIds: ['a'], mutationDomains: ['dom-a'], obligations: ['audit-log', 'keep-me'] };
  const applied = applyVerifiedException(pdr, warrant('w-1'), { policiesById: byId, maxAffected, currentUses: 0 }, opts);
  assert.equal(applied.ok, true);
  return { pack, receipt, pdr: applied.value.receipt, authorization: applied.value.exceptionAuthorization, warrant: warrant('w-1') };
}

test('HIGH-G: omitted, wrong or extra exception bindings fail lease issuance', () => {
  const { pack, receipt, pdr, authorization, warrant: w } = exceptionMutatedPdr();
  assert.equal(pdr.exceptionsApplied.length, 1);
  const projection = projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts).value[0];
  // Lease issuance for the exception-mutated PDR uses the verified path;
  // the base helper points at the pre-exception receipt, so rebuild here.
  const base = {
    projection, receipt: pdr, pack, trustedPackReceipt: receipt,
    projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
    reviewTrigger: 'review:mutation',
  };
  // Omitted warrant authorization: reject.
  assert.equal(failCode(issueMutationLease({ ...base }, opts)), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');
  // Wrong fingerprint (stale seal): reject.
  assert.equal(failCode(issueMutationLease({
    ...base, exceptionAuthorizations: [{ ...authorization, warrantFingerprint: `sha256:${'0'.repeat(64)}` }],
  }, opts)), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');
  // Wrong maxUses bound (stale seal): reject.
  assert.equal(failCode(issueMutationLease({
    ...base, exceptionAuthorizations: [{ ...authorization, maxUses: authorization.maxUses + 5 }],
  }, opts)), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');
  // Unrelated extra warrant: reject.
  const extraApplied = applyVerifiedException(
    pdr, warrant('w-2', { targetPolicyIds: ['pol-guard-a'], targetObligations: ['keep-me'] }),
    {
      policiesById: new Map([['pol-guard-a', obligatedGuard()]]),
      maxAffected: { nodeIds: ['a'], mutationDomains: ['dom-a'], obligations: ['audit-log', 'keep-me'] },
      currentUses: 0,
    }, opts,
  );
  assert.equal(extraApplied.ok, true);
  assert.equal(failCode(issueMutationLease({
    ...base, exceptionAuthorizations: [authorization, extraApplied.value.exceptionAuthorization],
  }, opts)), 'POLICY_LEASE_DECISION_NOT_PERMISSIVE');
  // Exact sealed authorization succeeds.
  const good = issueMutationLease({ ...base, exceptionAuthorizations: [authorization] }, opts);
  assert.equal(good.ok, true);
  assert.deepEqual(good.value.warrantIds, [w.warrantId]);
  void w;
});

test('HIGH-G: PTS rejects mutated warrant fingerprint and exhausted uses', () => {
  const { pack, receipt, pdr, authorization } = exceptionMutatedPdr();
  const projection = projectDecisionToNodes({
    receipt: pdr, pack, trustedPackReceipt: receipt,
    operations: [{ nodeId: 'a', mutationDomain: 'dom-a', operation: 'write:src/a.ts' }],
  }, opts).value[0];
  const lease = issueMutationLease({
    projection, receipt: pdr, pack, trustedPackReceipt: receipt,
    projectId: 'proj-gef', packId: pack.packId,
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
    reviewTrigger: 'review:mutation', exceptionAuthorizations: [authorization],
  }, opts).value;
  const policies = [obligatedGuard(), pac('pol-guard-b')];
  void policies;
  const currentFingerprints = { 'pol-guard-a': obligatedGuard().semanticIdentity, 'pol-guard-b': pac('pol-guard-b').semanticIdentity };
  const live = {
    packDigest: pack.semanticDigest,
    currentPolicyFingerprints: pdr.policyFingerprintById,
    currentWarrantFingerprints: { 'w-1': authorization.warrantFingerprint },
    warrantUses: { 'w-1': 0 },
  };
  void currentFingerprints;
  const authorized = authorizeMutation({
    lease, projection, projectId: 'proj-gef',
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
  }, live, opts);
  assert.equal(authorized.ok, true);
  // Mutated warrant fingerprint before mutation: reject.
  assert.equal(failCode(authorizeMutation({
    lease, projection, projectId: 'proj-gef',
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
  }, { ...live, currentWarrantFingerprints: { 'w-1': `sha256:${'f'.repeat(64)}` } }, opts)), 'POLICY_LEASE_STALE_WARRANT');
  // Exhausted use count before mutation: reject.
  assert.equal(failCode(authorizeMutation({
    lease, projection, projectId: 'proj-gef',
    packDigest: pack.semanticDigest, decisionDigest: pdr.digest,
  }, { ...live, warrantUses: { 'w-1': authorization.maxUses } }, opts)), 'POLICY_LEASE_STALE_WARRANT');
});

// ─── HIGH-H: cap proves derivation under trusted context ─────────────────────

function canonical(value, seen = new Set()) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(v => canonical(v, seen)).join(',')}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k], seen)}`).join(',')}}`;
}

function shaHex(value) {
  return `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`;
}

test('HIGH-H: self-consistent forged cap in a forbidden context is rejected', () => {
  const obligated = obligatedGuard();
  const { pack } = compilePack();
  const pdr = decideBound([obligated], pack, []);
  const w = warrant('w-1');
  const permissiveById = new Map([['pol-guard-a', obligated]]);
  const permissiveAffected = { nodeIds: ['a'], mutationDomains: ['dom-a'], obligations: ['audit-log', 'keep-me'] };
  const genuine = checkExceptionBlastRadius(w, permissiveById, permissiveAffected, 0, opts);
  assert.equal(genuine.ok, true);

  // Hand-recompute every digest field to prove the forgery below is fully
  // self-consistent (not merely a stale-field edit).
  const affectedSetFingerprint = shaHex({
    mutationDomains: ['dom-a'], nodeIds: ['a'], obligations: ['audit-log'],
  });
  const targetBindings = { 'pol-guard-a': obligated.semanticIdentity };
  const policySetFingerprint = shaHex({ policies: ['pol-guard-a:' + obligated.semanticIdentity] });
  void targetBindings;
  const forgedDigest = shaHex({
    affectedSetFingerprint,
    maxUses: w.maxUses,
    policySetFingerprint,
    precedenceDomain: 'domain-scope',
    targetPolicyIds: ['pol-guard-a'],
    useCount: 0,
    warrantFingerprint: w.semanticFingerprint,
    warrantId: w.warrantId,
  });
  const forgedCap = {
    warrantId: w.warrantId,
    warrantFingerprint: w.semanticFingerprint,
    targetPolicyIds: ['pol-guard-a'],
    precedenceDomain: 'domain-scope',
    nodeIds: ['a'],
    mutationDomains: ['dom-a'],
    obligations: ['audit-log'],
    useCount: 0,
    maxUses: w.maxUses,
    policySetFingerprint,
    affectedSetFingerprint,
    capDigest: forgedDigest,
  };
  // Sanity: the hand-rolled canonicalization matches the sealed format —
  // a cap issued for the identical scope verifies, so the forgery above is
  // genuinely self-consistent.
  const narrowWarrant = warrant('w-narrow', { targetObligations: ['audit-log'] });
  const narrowGenuine = checkExceptionBlastRadius(
    narrowWarrant, permissiveById,
    { nodeIds: ['a'], mutationDomains: ['dom-a'], obligations: ['audit-log'] }, 0, opts,
  );
  assert.equal(narrowGenuine.ok, true);
  assert.equal(narrowGenuine.value.affectedSetFingerprint, affectedSetFingerprint);

  // The trusted context forbids this scope (ghost-only affected set), so
  // the public apply path must reject despite perfect self-consistency.
  const forbiddenAffected = { nodeIds: ['ghost-node'], mutationDomains: ['dom-a'], obligations: ['audit-log'] };
  const forbiddenDerivation = { policiesById: permissiveById, maxAffected: forbiddenAffected, currentUses: 0 };
  assert.equal(applyExceptionWarrant(pdr, w, forgedCap, forbiddenDerivation, opts).ok, false);

  // Cross-domain policy context is likewise rejected.
  const crossPolicies = new Map([
    ['pol-guard-a', obligated],
    ['pol-other', pac('pol-other', { precedenceDomain: 'other-domain', scopeDomains: ['OTHER'] })],
  ]);
  const crossWarrant = warrant('w-cross', { targetPolicyIds: ['pol-guard-a', 'pol-other'] });
  const crossDerivation = { policiesById: crossPolicies, maxAffected: permissiveAffected, currentUses: 0 };
  const crossForged = { ...forgedCap, warrantId: 'w-cross', targetPolicyIds: ['pol-guard-a', 'pol-other'] };
  assert.equal(applyExceptionWarrant(pdr, crossWarrant, crossForged, crossDerivation, opts).ok, false);
});

test('HIGH-H: genuine cap succeeds only in its derivation context', () => {
  const obligated = obligatedGuard();
  const { pack } = compilePack();
  const pdr = decideBound([obligated], pack, []);
  const byId = new Map([['pol-guard-a', obligated]]);
  const maxAffected = { nodeIds: ['a'], mutationDomains: ['dom-a'], obligations: ['audit-log', 'keep-me'] };
  const sealed = checkExceptionBlastRadius(warrant('w-1'), byId, maxAffected, 0, opts);
  assert.equal(sealed.ok, true);
  const derivation = { policiesById: byId, maxAffected, currentUses: 0 };
  assert.equal(applyExceptionWarrant(pdr, warrant('w-1'), sealed.value, derivation, opts).ok, true);
  // Policy fingerprint drift: reject.
  const driftedPolicy = pac('pol-guard-a', { version: '9.9.9' });
  const driftedById = new Map([['pol-guard-a', driftedPolicy]]);
  assert.equal(applyExceptionWarrant(
    pdr, warrant('w-1'), sealed.value,
    { policiesById: driftedById, maxAffected, currentUses: 0 }, opts,
  ).ok, false);
  // Affected-set authority drift: reject.
  assert.equal(applyExceptionWarrant(
    pdr, warrant('w-1'), sealed.value,
    { policiesById: byId, maxAffected: { nodeIds: ['b'], mutationDomains: ['dom-a'], obligations: ['audit-log', 'keep-me'] }, currentUses: 0 }, opts,
  ).ok, false);
  // Current-use drift: reject.
  assert.equal(applyExceptionWarrant(
    pdr, warrant('w-1'), sealed.value,
    { policiesById: byId, maxAffected, currentUses: 1 }, opts,
  ).ok, false);
  // The high-level verified path derives internally and succeeds.
  assert.equal(applyVerifiedException(
    pdr, warrant('w-1'), { policiesById: byId, maxAffected, currentUses: 0 }, opts,
  ).ok, true);
});

// ─── HIGH-I: GCM validity context mandatory ───────────────────────────────────

test('HIGH-I: omitted validity context yields no coverage with explicit status', () => {
  const coveringFuture = pac('p-future', {
    schemaVersion: 'v99',
    applicability: { domains: ['SCOPE'], operations: ['write:src/a.ts'], matchMode: 'ANY' },
  });
  const omitted = buildGuardrailCoverageMap(
    [{ operation: 'write:src/a.ts', domain: 'SCOPE', nodeId: 'a' }],
    [coveringFuture],
  );
  assert.equal(omitted.entries[0].covered, false);
  assert.equal(omitted.gaps.length, 1);
  assert.notEqual(omitted.entries[0].validity, 'VALID');
  const admitted = buildGuardrailCoverageMap(
    [{ operation: 'write:src/a.ts', domain: 'SCOPE', nodeId: 'a' }],
    [coveringFuture],
    ['v1', 'v99'],
  );
  assert.equal(admitted.entries[0].covered, true);
  assert.equal(admitted.entries[0].validity, 'VALID');
});
