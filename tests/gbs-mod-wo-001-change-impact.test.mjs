// GBS-MOD-WO-001 (B) — deterministic change-impact and risk classification.
//
// Acceptance: A3 (reproducible from the same input state), A5 (mixed/workflow/dependency/security
// changes cannot use the governance fast path), A6 (unknown widens or blocks, never reduces).
//
// The classification is a pure function, so these tests deliberately feed it adversarial inputs
// rather than mocking a provider: if the answer depended on anything but its arguments, that
// would itself be the defect.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  CHANGE_IMPACT_DIAGNOSTIC_CODES,
  CHANGE_IMPACT_POLICY_VERSION,
  classifyChangeImpact,
  classifyChangePath,
  maxChangeImpactTier,
  normalizeChangePath,
} from '../packages/preflight/dist/index.js';

const digest = { algorithm: 'sha256', digest: (input) => createHash('sha256').update(input).digest('hex') };
const impact = (changedPaths, facts) => classifyChangeImpact({ changedPaths, facts }, digest);

const GOVERNANCE_PATHS = [
  '.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md',
  '.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md',
];

test('classification is reproducible and independent of caller input order', () => {
  const forward = impact(['AGENTS.md', ...GOVERNANCE_PATHS]);
  const reversed = impact([...GOVERNANCE_PATHS, 'AGENTS.md'].reverse());
  assert.equal(forward.impactDigest, reversed.impactDigest);
  assert.equal(forward.tier, reversed.tier);
  assert.deepEqual(forward.obligations, reversed.obligations);
  assert.equal(classifyChangeImpact({ changedPaths: ['AGENTS.md', ...GOVERNANCE_PATHS] }, digest).impactDigest, forward.impactDigest);
});

test('the policy version is stamped into every classification', () => {
  assert.equal(impact(GOVERNANCE_PATHS).policyVersion, CHANGE_IMPACT_POLICY_VERSION);
  assert.match(impact(GOVERNANCE_PATHS).impactDigest, /^sha256:[0-9a-f]{64}$/);
});

test('a governance-only change keeps the mandatory fast-path obligations', () => {
  const result = impact(GOVERNANCE_PATHS, { declaredRisk: 'LOW' });
  assert.equal(result.governanceFastPath, 'PERMITTED');
  assert.equal(result.state, 'CLASSIFIED');
  for (const obligation of ['GIT_DIFF_INTEGRITY', 'JSON_SCHEMA_PARSE', 'SOURCE_HIERARCHY_BINDING', 'SECRET_CONFIG_SECURITY']) {
    assert.ok(result.obligations.includes(obligation), `${obligation} survives the governance fast path`);
  }
});

test('a canonical checkpoint change always forces parity and never the fast path', () => {
  for (const path of ['.engineering/CHECKPOINT.md', '.engineering/CHECKPOINT.json']) {
    const result = impact([path], { declaredRisk: 'LOW' });
    assert.ok(result.obligations.includes('CHECKPOINT_PARITY'), `${path} must require checkpoint parity`);
    assert.equal(result.governanceFastPath, 'REFUSED');
    assert.equal(result.tier, 'STANDARD');
  }
});

test('mixed governance and code changes cannot use the governance fast path', () => {
  const result = impact([...GOVERNANCE_PATHS, 'packages/contracts/src/work-order.ts'], { declaredRisk: 'LOW' });
  assert.equal(result.governanceFastPath, 'REFUSED');
  assert.equal(result.tier, 'ELEVATED');
  assert.ok(result.governanceFastPathRefusals.some((reason) => reason.includes('PRODUCT_CODE')));
});

test('workflow, dependency, build, schema and decision changes each refuse the fast path', () => {
  const cases = [
    ['.github/workflows/repository-validation.yml', 'PIPELINE_INTEGRITY', 'ELEVATED'],
    ['.github/actions/local/action.yml', 'PIPELINE_INTEGRITY', 'ELEVATED'],
    ['package.json', 'DEPENDENCY_SUPPLY_CHAIN', 'ELEVATED'],
    ['package-lock.json', 'DEPENDENCY_SUPPLY_CHAIN', 'ELEVATED'],
    ['tsconfig.base.json', 'CROSS_PLATFORM_REGRESSION', 'ELEVATED'],
    ['.engineering/schemas/execution-capsule.schema.json', 'JSON_SCHEMA_PARSE', 'ELEVATED'],
  ];
  for (const [path, obligation, tier] of cases) {
    const result = impact([path], { declaredRisk: 'LOW' });
    assert.equal(result.governanceFastPath, 'REFUSED', `${path} must refuse the fast path`);
    assert.equal(result.tier, tier, `${path} must classify at ${tier}`);
    assert.ok(result.obligations.includes(obligation), `${path} must add ${obligation}`);
  }
});

test('an unclassified path widens instead of reducing assurance', () => {
  const result = impact(['vendor/mystery.bin'], { declaredRisk: 'LOW' });
  assert.equal(result.state, 'CLASSIFIED');
  assert.equal(result.tier, 'ELEVATED');
  assert.equal(result.governanceFastPath, 'REFUSED');
  assert.deepEqual(result.unclassifiedPaths, ['vendor/mystery.bin']);
  assert.ok(result.escalateReasons.some((reason) => reason.startsWith('UNCLASSIFIED_PATH:')));
});

test('an empty changed set is never treated as a narrow change', () => {
  const result = impact([], { declaredRisk: 'LOW' });
  assert.equal(result.tier, 'ELEVATED');
  assert.equal(result.governanceFastPath, 'REFUSED');
  assert.ok(result.escalateReasons.includes('EMPTY_CHANGED_STATE_UNPROVEN'));
});

test('a declared risk may raise but never lower the derived floor', () => {
  const raised = impact(GOVERNANCE_PATHS, { declaredRisk: 'HIGH_ASSURANCE' });
  assert.equal(raised.tier, 'HIGH_ASSURANCE');
  assert.equal(raised.declaredTier, 'HIGH_ASSURANCE');
  assert.equal(raised.tierFloor, 'STANDARD', 'the path-derived floor stays visible next to the declared risk');
  assert.equal(raised.declaredTier, 'HIGH_ASSURANCE');
  assert.equal(raised.tierFloor, 'STANDARD', 'the path-derived floor stays visible next to the declared risk');
  assert.ok(raised.obligations.includes('SPECIALIST_REVIEW'));
  assert.ok(raised.obligations.includes('RELEASE_ASSURANCE'));
  assert.equal(impact(GOVERNANCE_PATHS, { declaredRisk: 'LOW' }).tier, 'STANDARD');
});

test('authority conflict, unproven changed state and unresolved rename all widen or block', () => {
  const conflict = impact(GOVERNANCE_PATHS, { declaredRisk: 'LOW', authorityConflict: true });
  assert.equal(conflict.state, 'BLOCKED');
  assert.equal(conflict.tier, 'HIGH_ASSURANCE');
  assert.equal(conflict.governanceFastPath, 'REFUSED');

  const unproven = impact(GOVERNANCE_PATHS, { declaredRisk: 'LOW', changedStateUnproven: true });
  assert.equal(unproven.state, 'BLOCKED');
  assert.equal(unproven.tier, 'HIGH_ASSURANCE');

  const rename = impact(['packages/contracts/src/moved-away.ts', 'packages/contracts/dist/x.js'], {
    declaredRisk: 'LOW',
    unresolvedRename: true,
  });
  assert.equal(rename.governanceFastPath, 'REFUSED');
  assert.ok(changeReason(rename, 'UNRESOLVED_RENAME'));
});

test('release lifecycle and protected-surface facts force the strongest tier', () => {
  assert.equal(impact(GOVERNANCE_PATHS, { declaredRisk: 'LOW', releaseLifecycle: true }).tier, 'HIGH_ASSURANCE');
  const protectedSurface = impact(['.engineering/CHECKPOINT.json'], { declaredRisk: 'LOW', protectedSurfaceTouched: true });
  assert.equal(protectedSurface.tier, 'HIGH_ASSURANCE');
  assert.equal(protectedSurface.governanceFastPath, 'REFUSED');
});

test('path traversal, absolute paths, separators and control characters are suspicious, not unclassified', () => {
  const suspicious = [
    ['../outside.md', CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_TRAVERSAL],
    ['a/../../b.md', CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_TRAVERSAL],
    ['/etc/passwd', CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_ABSOLUTE],
    ['C:/Windows/system32', CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_ABSOLUTE],
    ['.github\\workflows\\x.yml', CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_BACKSLASH],
    ['a%2f..%2fb.md', CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_ENCODED_SEPARATOR],
    ['a\u0000b.md', CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_CONTROL_CHARACTER],
  ];
  for (const [path, code] of suspicious) {
    const classification = classifyChangePath(path);
    assert.equal(classification.kind, 'UNKNOWN_SUSPICIOUS', `${path} must be suspicious`);
    assert.ok(classification.findings.includes(code), `${path} must report ${code}`);
    const result = impact([path], { declaredRisk: 'LOW' });
    assert.equal(result.state, 'BLOCKED', `${path} must block`);
    assert.equal(result.tier, 'HIGH_ASSURANCE', `${path} must not buy a weaker tier`);
    assert.equal(result.governanceFastPath, 'REFUSED');
  }
});

test('case variants of a real surface are suspicious while legitimately cased names still classify', () => {
  for (const path of ['Packages/contracts/src/Index.ts', 'packages/CONTRACTS/src/A.TS', '.ENGINEERING/SECURITY.md']) {
    const classification = classifyChangePath(path);
    assert.equal(classification.kind, 'UNKNOWN_SUSPICIOUS', `${path} is a case variant`);
    assert.deepEqual(classification.findings, [CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_CASE_VARIANT]);
  }
  assert.equal(classifyChangePath('AGENTS.md').kind, 'EXECUTOR_CONTRACT');
  assert.equal(classifyChangePath('.engineering/CHECKPOINT.md').kind, 'CANONICAL_CHECKPOINT');
});

test('a non-string path is suspicious rather than a coercion', () => {
  for (const value of [null, undefined, 42, {}, [], Symbol.iterator]) {
    const classification = classifyChangePath(value);
    assert.equal(classification.kind, 'UNKNOWN_SUSPICIOUS');
    assert.deepEqual(classification.findings, [CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_NOT_STRING]);
  }
});

test('the same path repeated is reported rather than silently deduplicated', () => {
  const result = impact(['AGENTS.md', 'AGENTS.md']);
  assert.ok(changeReason(result, `${CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_DUPLICATE}:AGENTS.md`));
});

test('governance documents carry the Source-Hierarchy domain of the surface they encode', () => {
  const cases = [
    ['.engineering/SOURCE-HIERARCHY.md', 'GOVERNANCE'],
    ['.engineering/SECURITY.md', 'SECURITY'],
    ['.engineering/ARCHITECTURE.md', 'ARCHITECTURE'],
    ['.engineering/DEFINITION-OF-DONE.md', 'COMPLETION'],
    ['.engineering/BACKLOG.md', 'FUTURE_WORK'],
    ['.engineering/DECISIONS-LEDGER.md', 'DECISION'],
    ['.engineering/TEST-BENCHMARK-PLAN.md', 'VALIDATION'],
  ];
  for (const [path, domain] of cases) {
    assert.equal(classifyChangePath(path).domain, domain, `${path} belongs to ${domain}`);
  }
});

test('normalization reports a finding instead of silently repairing a path', () => {
  assert.deepEqual(normalizeChangePath('./a//b/'), { raw: './a//b/', normalized: 'a/b', findings: [] });
  assert.deepEqual(normalizeChangePath('../a'), {
    raw: '../a',
    normalized: '',
    findings: [CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_TRAVERSAL],
  });
  assert.deepEqual(normalizeChangePath(''), {
    raw: '',
    normalized: '',
    findings: [CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_EMPTY],
  });
  assert.deepEqual(normalizeChangePath(`a\u0000b`), {
    raw: `a\u0000b`,
    normalized: '',
    findings: [CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_CONTROL_CHARACTER],
  });
  assert.deepEqual(normalizeChangePath('a\\b').findings, [CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_BACKSLASH]);
});

test('tier combination is monotonic', () => {
  assert.equal(maxChangeImpactTier('LOW', 'HIGH_ASSURANCE'), 'HIGH_ASSURANCE');
  assert.equal(maxChangeImpactTier('STANDARD', 'ELEVATED'), 'ELEVATED');
  assert.equal(maxChangeImpactTier('LOW', 'LOW'), 'LOW');
});

function changeReason(result, code) {
  return result.escalateReasons.includes(code);
}


const rankOf = (tier) => ['LOW', 'STANDARD', 'ELEVATED', 'HIGH_ASSURANCE'].indexOf(tier);