// GBS-MOD-WO-001 (E) — the stable `GEF Gate` decision and receipt.
//
// Acceptance: A9 (binds base/head and required checks), A10 (existing high-risk and release proof
// obligations remain intact), A11 (no self-approval or checkpoint promotion path).

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  GEF_GATE_DIAGNOSTIC_CODES,
  GEF_GATE_MECHANISMS,
  GEF_GATE_RECEIPT_VERSION,
  decideGefGate,
  gefGateReceiptIsCurrent,
  verifyGefGateReceipt,
} from '../packages/assurance-pipeline/dist/public.js';

const options = { digest: { algorithm: 'sha256', digest: (input) => createHash('sha256').update(input).digest('hex') } };
const sha = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

/** The main branch ruleset contexts recorded in the GBS-MOD-WO-001 implementation Context Lock. */
export const MAIN_RULESET_CONTEXTS = Object.freeze([
  'Repository validation',
  'Pipeline integrity',
  'Gitleaks secrets',
  'Trivy filesystem and configuration',
]);

const gateInput = (over = {}) => ({
  gateId: 'GATE-PR407',
  repository: 'KayzenRoot/gef-bootstrap',
  workOrderId: 'GBS-MOD-WO-001',
  baseRef: 'main',
  baseSha: 'a'.repeat(40),
  headSha: 'b'.repeat(40),
  changedPaths: ['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md'],
  changeImpactDigest: sha('impact'),
  impactState: 'CLASSIFIED',
  riskTier: 'LOW',
  governanceFastPath: 'PERMITTED',
  escalateReasons: [],
  obligations: ['GIT_DIFF_INTEGRITY', 'JSON_SCHEMA_PARSE', 'SECRET_CONFIG_SECURITY', 'SOURCE_HIERARCHY_BINDING'],
  contextLockDigest: sha('lock'),
  contextLockState: 'COMPILED',
  closureDigest: sha('closure'),
  validationFloor: 'L1',
  rulesetRequiredContexts: MAIN_RULESET_CONTEXTS,
  mandatoryObligationFloor: ['GIT_DIFF_INTEGRITY', 'JSON_SCHEMA_PARSE', 'SOURCE_HIERARCHY_BINDING', 'SECRET_CONFIG_SECURITY'],
  providerCandidateChecks: [
    { checkId: 'Analyze TypeScript', ownerWorkflow: 'security-codeql.yml', reason: 'STATIC_ANALYSIS', outsideChangedClosure: true },
    { checkId: 'm41-m47-focused', ownerWorkflow: 'm41-m47-integrated.yml', reason: 'INTEGRATED_ASSURANCE', outsideChangedClosure: true },
    { checkId: 'Node coverage LCOV', ownerWorkflow: 'coverage-codecov.yml', reason: 'COVERAGE', outsideChangedClosure: false },
  ],
  policyDigest: sha('policy'),
  candidateSemanticDigest: sha('candidate'),
  ...over,
});

const decide = (over) => decideGefGate(gateInput(over), options);
const must = (over) => {
  const result = decide(over);
  assert.equal(result.ok, true, JSON.stringify(result.ok ? {} : result.diagnostics));
  return result.value;
};

test('the four mechanism identities introduced by this Work Order are frozen and distinct', () => {
  assert.deepEqual([...GEF_GATE_MECHANISMS], ['GGD01', 'GGC02', 'GGV03', 'GGX04']);
  assert.equal(new Set(GEF_GATE_MECHANISMS).size, GEF_GATE_MECHANISMS.length);
});

test('a governance-only candidate produces a REDUCED_ADVISORY receipt bound to its exact head', () => {
  const receipt = must({});
  assert.equal(receipt.schemaVersion, GEF_GATE_RECEIPT_VERSION);
  assert.equal(receipt.decision, 'REDUCED_ADVISORY');
  assert.equal(receipt.riskTier, 'LOW');
  assert.equal(receipt.bindings.baseSha, 'a'.repeat(40));
  assert.equal(receipt.bindings.headSha, 'b'.repeat(40));
  assert.equal(receipt.bindings.changeImpactDigest, sha('impact'));
  assert.equal(receipt.bindings.contextLockDigest, sha('lock'));
  assert.equal(receipt.bindings.closureDigest, sha('closure'));
  assert.equal(receipt.bindings.changedPathCount, 1);
  assert.match(receipt.receiptDigest, /^sha256:[0-9a-f]{64}$/);
});

test('every ruleset-required context survives regardless of tier or fast path', () => {
  for (const [tier, fastPath, reasons] of [
    ['LOW', 'PERMITTED', []],
    ['STANDARD', 'REFUSED', ['UNCLASSIFIED_PATH:x.bin']],
    ['ELEVATED', 'REFUSED', ['UNCLASSIFIED_PATH:x.bin']],
    ['HIGH_ASSURANCE', 'REFUSED', ['RELEASE_LIFECYCLE']],
  ]) {
    const receipt = must({ riskTier: tier, governanceFastPath: fastPath, escalateReasons: reasons });
    const retained = receipt.requiredChecks.filter((check) => check.kind === 'RULESET_REQUIRED').map((check) => check.checkId);
    assert.deepEqual(retained, [...MAIN_RULESET_CONTEXTS].sort(), `${tier} must keep every ruleset context`);
  }
});

test('every obligation proven by the change impact becomes a required check', () => {
  const receipt = must({
    obligations: ['GIT_DIFF_INTEGRITY', 'JSON_SCHEMA_PARSE', 'SECRET_CONFIG_SECURITY', 'SOURCE_HIERARCHY_BINDING', 'CHECKPOINT_PARITY', 'PIPELINE_INTEGRITY'],
  });
  const obligations = receipt.requiredChecks.filter((check) => check.kind === 'MANDATORY_OBLIGATION').map((check) => check.checkId);
  assert.deepEqual(obligations, [
    'OBLIGATION:CHECKPOINT_PARITY',
    'OBLIGATION:GIT_DIFF_INTEGRITY',
    'OBLIGATION:JSON_SCHEMA_PARSE',
    'OBLIGATION:PIPELINE_INTEGRITY',
    'OBLIGATION:SECRET_CONFIG_SECURITY',
    'OBLIGATION:SOURCE_HIERARCHY_BINDING',
  ]);
  for (const check of receipt.requiredChecks) {
    assert.ok(check.reason.length > 0, `${check.checkId} must state why it is required`);
  }
});

test('HIGH_ASSURANCE adds the independent specialist gate; lower tiers do not', () => {
  assert.equal(
    must({ riskTier: 'HIGH_ASSURANCE', governanceFastPath: 'REFUSED', escalateReasons: ['RELEASE_LIFECYCLE'] })
      .requiredChecks.some((check) => check.kind === 'SPECIALIST_GATE'),
    true,
  );
  for (const tier of ['LOW', 'STANDARD', 'ELEVATED']) {
    assert.equal(
      must({ riskTier: tier }).requiredChecks.some((check) => check.kind === 'SPECIALIST_GATE'),
      false,
      `${tier} must not claim a specialist gate it did not prove`,
    );
  }
});

test('narrowing only happens under the fast path and each exclusion carries a closure proof', () => {
  const receipt = must({});
  assert.deepEqual(receipt.narrowingCandidates.map((entry) => entry.checkId), ['Analyze TypeScript', 'm41-m47-focused']);
  for (const candidate of receipt.narrowingCandidates) {
    assert.equal(candidate.enforcement, 'NOT_ENFORCED_PENDING_RULESET_AUTHORIZATION');
    assert.ok(candidate.closureProof.startsWith('OUTSIDE_CHANGED_DEPENDENCY_AND_RISK_CLOSURE:LOW:'));
  }
  assert.deepEqual(receipt.retainedChecks.map((entry) => entry.checkId), ['Node coverage LCOV']);
  assert.equal(receipt.retainedChecks[0].retentionReason, 'INSIDE_CHANGED_DEPENDENCY_OR_RISK_CLOSURE');
});

test('a refused fast path retains every candidate instead of proposing exclusions', () => {
  const receipt = must({
    governanceFastPath: 'REFUSED',
    escalateReasons: ['UNCLASSIFIED_PATH:vendor/mystery.bin'],
    changedPaths: ['vendor/mystery.bin'],
  });
  assert.equal(receipt.decision, 'FULL_ASSURANCE');
  assert.deepEqual(receipt.narrowingCandidates, []);
  assert.equal(receipt.retainedChecks.length, 3);
  for (const retained of receipt.retainedChecks) {
    assert.equal(retained.retentionReason, 'GOVERNANCE_FAST_PATH_REFUSED:REFUSED');
  }
});

test('a receipt cannot waive the mandatory obligation floor', () => {
  for (const obligation of ['GIT_DIFF_INTEGRITY', 'JSON_SCHEMA_PARSE', 'SOURCE_HIERARCHY_BINDING', 'SECRET_CONFIG_SECURITY']) {
    const result = decide({ obligations: gateInput().obligations.filter((entry) => entry !== obligation) });
    assert.equal(result.ok, false, `${obligation} must not be waivable`);
    assert.equal(result.diagnostics[0].code, GEF_GATE_DIAGNOSTIC_CODES.GATE_OBLIGATION_FLOOR_MISSING);
    assert.equal(result.diagnostics[0].subject, obligation);
  }
});

test('the decision does not depend on the order provider candidates are listed in', () => {
  const candidates = gateInput().providerCandidateChecks;
  const reversed = [...candidates].reverse().map((entry) => ({ ...entry }));
  const duplicated = [
    { ...candidates[0], outsideChangedClosure: true },
    { ...candidates[0], outsideChangedClosure: false },
  ];
  const strict = decide({ providerCandidateChecks: duplicated });
  const strictReversed = decide({ providerCandidateChecks: [...duplicated].reverse() });
  assert.equal(strict.ok && strictReversed.ok, true);
  assert.equal(strict.value.decision, 'FULL_ASSURANCE', 'a duplicated claim that includes the closure is read strictly');
  assert.deepEqual(strict.value.narrowingCandidates, []);
  assert.equal(strict.value.receiptDigest, strictReversed.value.receiptDigest);
  const forward = must({ providerCandidateChecks: candidates });
  const backward = must({ providerCandidateChecks: reversed });
  assert.equal(forward.receiptDigest, backward.receiptDigest);
});

test('unknown upstream states and malformed collections are refused rather than trusted', () => {
  for (const over of [
    { impactState: 'WHATEVER' },
    { contextLockState: 'WHATEVER' },
    { validationFloor: 'GARBAGE' },
    { validationFloor: '' },
    { changedPaths: null },
    { changedPaths: ['a', 42] },
    { rulesetRequiredContexts: null },
    { obligations: null },
    { escalateReasons: null },
    { mandatoryObligationFloor: null },
    { providerCandidateChecks: null },
    { providerCandidateChecks: {} },
    { providerCandidateChecks: [{ checkId: 'c1' }] },
    { closureDigest: 42 },
  ]) {
    const result = decide(over);
    assert.equal(result.ok, false, `${JSON.stringify(over)} must be refused`);
    assert.ok(
      [
        GEF_GATE_DIAGNOSTIC_CODES.GATE_INPUT_INVALID,
        GEF_GATE_DIAGNOSTIC_CODES.GATE_BINDING_INVALID,
        GEF_GATE_DIAGNOSTIC_CODES.GATE_STATE_UNKNOWN,
      ].includes(result.diagnostics[0].code),
      `${JSON.stringify(over)} produced ${result.diagnostics[0].code}`,
    );
  }
});

test('a caller claim of an outside-closure check is not believed without a proven dependency closure', () => {
  const withoutClosure = must({ closureDigest: null, validationFloor: null });
  assert.equal(withoutClosure.decision, 'FULL_ASSURANCE');
  assert.deepEqual(withoutClosure.narrowingCandidates, []);
  for (const retained of withoutClosure.retainedChecks) {
    assert.equal(retained.retentionReason, 'NARROWING_REQUIRES_A_PROVEN_DEPENDENCY_CLOSURE');
  }
  const fullSuiteFloor = must({ validationFloor: 'L5' });
  assert.equal(fullSuiteFloor.decision, 'FULL_ASSURANCE');
  assert.deepEqual(fullSuiteFloor.narrowingCandidates, []);
  assert.ok(fullSuiteFloor.retainedChecks.every((entry) => entry.retentionReason === 'NARROWING_REQUIRES_A_PROVEN_DEPENDENCY_CLOSURE'));
});

test('escalation reasons alone forbid narrowing even if the fast path is claimed', () => {
  const receipt = must({ governanceFastPath: 'PERMITTED', escalateReasons: ['AUTHORITY_CONFLICT'] });
  assert.equal(receipt.decision, 'FULL_ASSURANCE');
  assert.equal(receipt.narrowingCandidates.length, 0);
});

test('the gate never grants selection, relaxation, promotion or release authority', () => {
  const receipt = must({});
  assert.equal(receipt.maySelectRequiredChecks, false);
  assert.equal(receipt.mayRelaxRulesetContexts, false);
  assert.equal(receipt.mayPromoteCheckpoint, false);
  assert.equal(receipt.mayRelease, false);
  assert.equal(receipt.manufacturesProductionCredit, false);
  assert.equal(receipt.enforcement, 'CONTRACT_ONLY_RULESET_PENDING');
});

test('an unproven ruleset context set blocks before any decision is made', () => {
  const result = decide({ rulesetRequiredContexts: [] });
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, GEF_GATE_DIAGNOSTIC_CODES.GATE_RULESET_CONTEXTS_UNPROVEN);
});

test('blocked upstream classifications block the gate', () => {
  assert.equal(decide({ impactState: 'BLOCKED' }).diagnostics[0].code, GEF_GATE_DIAGNOSTIC_CODES.GATE_IMPACT_BLOCKED);
  assert.equal(decide({ contextLockState: 'BLOCKED' }).diagnostics[0].code, GEF_GATE_DIAGNOSTIC_CODES.GATE_CONTEXT_LOCK_BLOCKED);
});

test('an unbound or malformed candidate cannot produce a receipt', () => {
  assert.equal(decide({ headSha: 'HEAD' }).diagnostics[0].code, GEF_GATE_DIAGNOSTIC_CODES.GATE_BINDING_INVALID);
  assert.equal(decide({ changedPaths: [] }).diagnostics[0].code, GEF_GATE_DIAGNOSTIC_CODES.GATE_BINDING_INVALID);
  assert.equal(decide({ gateId: 'bad id!' }).diagnostics[0].code, GEF_GATE_DIAGNOSTIC_CODES.GATE_INPUT_INVALID);
  assert.equal(decide({ riskTier: 'EXTREME' }).diagnostics[0].code, GEF_GATE_DIAGNOSTIC_CODES.GATE_TIER_UNKNOWN);
});

test('the receipt digest detects tampering with any decision-bearing field', () => {
  const receipt = must({});
  assert.equal(verifyGefGateReceipt(receipt, options).value.valid, true);
  assert.equal(gefGateReceiptIsCurrent(receipt, options), true);
  for (const tamper of [
    { riskTier: 'HIGH_ASSURANCE' },
    { decision: 'FULL_ASSURANCE' },
    { mayPromoteCheckpoint: true },
    { bindings: { ...receipt.bindings, headSha: 'c'.repeat(40) } },
    { requiredChecks: [] },
    { narrowingCandidates: [] },
    { enforcement: 'ENFORCED' },
  ]) {
    const forged = { ...receipt, ...tamper };
    const verified = verifyGefGateReceipt(forged, options);
    assert.equal(verified.value.valid, false, `${JSON.stringify(tamper)} must be detected`);
  }
});

test('the same candidate state always yields the same receipt digest', () => {
  assert.equal(must({}).receiptDigest, must({}).receiptDigest);
  assert.notEqual(must({ headSha: 'c'.repeat(40) }).receiptDigest, must({}).receiptDigest);
  assert.notEqual(must({ changeImpactDigest: sha('other') }).receiptDigest, must({}).receiptDigest);
});