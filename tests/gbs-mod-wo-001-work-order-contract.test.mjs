// GBS-MOD-WO-001 (A) — machine-readable Work Order contract.
//
// Acceptance: A1. The contract parses, and missing or ambiguous authority fields are rejected
// rather than defaulted. An executor that reads a defaulted authority field is the exact failure
// this suite exists to prevent.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  WORK_ORDER_CONTRACT_VERSION,
  WORK_ORDER_DIAGNOSTIC_CODES,
  isValidWorkOrderPattern,
  matchesWorkOrderPattern,
  maxWorkOrderRisk,
  normalizeWorkOrderPath,
  parseWorkOrderContract,
  resolveWriteAuthority,
  workOrderContractDigest,
} from '../packages/contracts/dist/index.js';

const digest = { algorithm: 'sha256', digest: (input) => createHash('sha256').update(input).digest('hex') };

function validContract(over = {}) {
  return {
    schemaVersion: WORK_ORDER_CONTRACT_VERSION,
    workOrderId: 'GBS-MOD-WO-001',
    repository: 'KayzenRoot/gef-bootstrap',
    risk: 'ELEVATED',
    baseSha: '0'.repeat(40),
    bindings: { branch: 'feat/mod/wo-001-agent-native-gate', issue: 394, pullRequest: 407 },
    mustRead: ['AGENTS.md', '.engineering/SOURCE-HIERARCHY.md'],
    readIfTriggered: [{ path: '.engineering/ARCHITECTURE.md', trigger: 'ARCHITECTURE' }],
    writeAllowed: ['AGENTS.md', 'packages/contracts/src/**', 'tests/**'],
    writeForbidden: ['.engineering/CHECKPOINT.md', '.engineering/CHECKPOINT.json', '**/dist/**'],
    requiredChecks: ['Repository validation', 'Pipeline integrity'],
    evidenceObligations: ['exact-head evidence bundle', 'proposed checkpoint delta'],
    scope: ['machine-readable work order contract'],
    outOfScope: ['profile implementation'],
    dependencies: [],
    stopCondition: 'GBS_MOD_WO_001_IMPLEMENTATION_READY_FOR_OWNER_AUDIT',
    ...over,
  };
}

const codes = (input) => parseWorkOrderContract(input).diagnostics.map((entry) => entry.code);

test('the canonical contract parses and freezes its authority lists', () => {
  const parsed = parseWorkOrderContract(validContract());
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.workOrderId, 'GBS-MOD-WO-001');
  assert.equal(parsed.value.risk, 'ELEVATED');
  assert.deepEqual(parsed.value.bindings, { branch: 'feat/mod/wo-001-agent-native-gate', issue: 394, pullRequest: 407 });
  assert.equal(Object.isFrozen(parsed.value), true);
});

test('a path admitted by both writeAllowed and writeForbidden is ambiguous authority and is rejected', () => {
  const diagnostics = codes(validContract({ writeForbidden: ['.engineering/CHECKPOINT.md', 'packages/contracts/src/**'] }));
  assert.ok(diagnostics.includes(WORK_ORDER_DIAGNOSTIC_CODES.WRITE_AUTHORITY_AMBIGUOUS));
});

test('every missing authority field is reported, not defaulted', () => {
  for (const field of ['workOrderId', 'repository', 'risk', 'baseSha', 'bindings', 'stopCondition', 'requiredChecks']) {
    const contract = validContract();
    delete contract[field];
    const diagnostics = codes(contract);
    assert.ok(
      diagnostics.includes(WORK_ORDER_DIAGNOSTIC_CODES.FIELD_MISSING),
      `removing ${field} must be reported as missing`,
    );
  }
});

test('an unknown field is rejected instead of silently discarded', () => {
  assert.ok(codes(validContract({ sneakyAuthority: true })).includes(WORK_ORDER_DIAGNOSTIC_CODES.FIELD_UNKNOWN));
  assert.ok(codes(validContract({ bindings: { branch: 'b', sneaky: 1 } })).includes(WORK_ORDER_DIAGNOSTIC_CODES.FIELD_UNKNOWN));
});

test('an unsupported major contract version fails closed', () => {
  assert.ok(codes(validContract({ schemaVersion: '2.0' })).includes(WORK_ORDER_DIAGNOSTIC_CODES.SCHEMA_VERSION_UNSUPPORTED));
});

test('malformed identity bindings are rejected', () => {
  assert.ok(codes(validContract({ baseSha: 'HEAD' })).includes(WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID));
  assert.ok(codes(validContract({ workOrderId: 'WO-1' })).includes(WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID));
  assert.ok(codes(validContract({ repository: 'gef-bootstrap' })).includes(WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID));
  assert.ok(codes(validContract({ risk: 'VERY_HIGH' })).includes(WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID));
  assert.ok(codes(validContract({ stopCondition: '   ' })).includes(WORK_ORDER_DIAGNOSTIC_CODES.STOP_CONDITION_INVALID));
  assert.ok(
    codes(validContract({ bindings: { branch: 'feat/x', issue: 0 } })).includes(WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID),
    'a non-positive issue number is not a binding',
  );
  assert.ok(
    codes(validContract({ bindings: { branch: '../../etc' } })).includes(WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID),
    'a traversing branch name is not a binding',
  );
});

test('empty required lists and duplicate entries are rejected', () => {
  assert.ok(codes(validContract({ requiredChecks: [] })).includes(WORK_ORDER_DIAGNOSTIC_CODES.LIST_EMPTY));
  assert.ok(codes(validContract({ mustRead: ['AGENTS.md', './AGENTS.md'] })).includes(WORK_ORDER_DIAGNOSTIC_CODES.LIST_DUPLICATE));
  assert.ok(
    codes(validContract({ readIfTriggered: [
      { path: 'a.md', trigger: 'T' },
      { path: 'a.md', trigger: 'T' },
    ] })).includes(WORK_ORDER_DIAGNOSTIC_CODES.TRIGGER_DUPLICATE),
  );
});

test('patterns that could silently widen the write boundary are rejected', () => {
  for (const pattern of ['*', '**', '/absolute/**', 'a/**/**', 'a//b', 'trailing/', 'C:/win/**', 'a\\b/**', 'a/[bc]', 'a/~/b']) {
    assert.equal(isValidWorkOrderPattern(pattern), false, `${pattern} must not be a usable glob`);
  }
  for (const pattern of ['packages/contracts/src/**', 'tests/**', '**/dist/**', 'a/**/b', '.engineering/evidence/GBS-MOD-WO-001-*', 'exact.md']) {
    assert.equal(isValidWorkOrderPattern(pattern), true, `${pattern} must be a usable glob`);
  }
  assert.ok(codes(validContract({ writeAllowed: ['*'] })).includes(WORK_ORDER_DIAGNOSTIC_CODES.PATTERN_INVALID));
});

test('glob matching separates star depth from globstar and never crosses a segment boundary by accident', () => {
  const cases = [
    ['packages/contracts/src/index.ts', ['packages/contracts/src/**'], true],
    ['packages/contracts/src', ['packages/contracts/src/**'], false],
    ['packages/contracts/other/index.ts', ['packages/contracts/src/**'], false],
    ['tests/m28-a.test.mjs', ['tests/*.test.mjs'], true],
    ['tests/sub/m28-a.test.mjs', ['tests/*.test.mjs'], false],
    ['tests/sub/m28-a.test.mjs', ['tests/**'], true],
    ['packages/contracts/dist/index.js', ['**/dist/**'], true],
    ['.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md', ['.engineering/evidence/GBS-MOD-WO-001-*'], true],
    ['./a/b.ts', ['a/b.ts'], true],
    ['a\\b.ts', ['a/b.ts'], true],
    ['a/b.tsc', ['a/*.ts'], false],
  ];
  for (const [path, patterns, expected] of cases) {
    assert.equal(matchesWorkOrderPattern(path, patterns), expected, `${path} against ${patterns.join()}`);
  }
});

test('path normalization is idempotent and never collapses traversal', () => {
  assert.equal(normalizeWorkOrderPath('.//a/./b/'), 'a/b');
  assert.equal(normalizeWorkOrderPath(normalizeWorkOrderPath('.//a/./b/')), 'a/b');
  assert.equal(normalizeWorkOrderPath('a/../../b'), 'a/../../b');
});

test('write authority resolution distinguishes allowed, forbidden, ambiguous and unclassified', () => {
  const allowed = ['packages/contracts/src/**'];
  const forbidden = ['**/dist/**'];
  assert.equal(resolveWriteAuthority('packages/contracts/src/a.ts', allowed, forbidden), 'ALLOWED');
  assert.equal(resolveWriteAuthority('packages/contracts/dist/a.js', allowed, forbidden), 'FORBIDDEN');
  assert.equal(resolveWriteAuthority('docs/x.md', allowed, forbidden), 'UNCLASSIFIED');
  assert.equal(resolveWriteAuthority('packages/contracts/src', allowed, forbidden), 'UNCLASSIFIED');
  assert.equal(
    resolveWriteAuthority('packages/contracts/src/a.ts', ['packages/contracts/**'], ['packages/contracts/src/**']),
    'AMBIGUOUS',
  );
});

test('a path that cannot carry authority is forbidden, never merely unmatched', () => {
  const allowed = ['packages/contracts/src/**', 'AGENTS.md'];
  const forbidden = ['**/dist/**'];
  for (const path of [
    'packages/contracts/src/../../../.engineering/CHECKPOINT.md',
    'a/../AGENTS.md',
    '../AGENTS.md',
    '..\\AGENTS.md',
    '',
  ]) {
    assert.equal(resolveWriteAuthority(path, allowed, forbidden), 'FORBIDDEN', `${JSON.stringify(path)} must not be writable`);
  }
  assert.equal(resolveWriteAuthority(null, allowed, forbidden), 'FORBIDDEN');
  assert.equal(resolveWriteAuthority(42, allowed, forbidden), 'FORBIDDEN');
  assert.equal(matchesWorkOrderPattern(null, ['a/**']), false, 'a malformed candidate is a refusal, not a throw');
  assert.equal(matchesWorkOrderPattern(42, ['a/**']), false);
});

test('a malformed pattern can never admit a forbidden surface', () => {
  // `**` is the widest legal-looking spelling and is rejected outright.
  assert.equal(isValidWorkOrderPattern('**'), false);
  assert.ok(codes(validContract({ writeAllowed: ['**'] })).includes(WORK_ORDER_DIAGNOSTIC_CODES.PATTERN_INVALID));
});

test('the same contract always digests to the same exact-state identity', () => {
  const left = parseWorkOrderContract(validContract());
  const right = parseWorkOrderContract(validContract());
  assert.equal(left.ok && right.ok, true);
  assert.equal(workOrderContractDigest(left.value, digest), workOrderContractDigest(right.value, digest));
});

test('a one-field change to the write boundary changes the contract identity', () => {
  const left = parseWorkOrderContract(validContract());
  const right = parseWorkOrderContract(validContract({ writeAllowed: [...validContract().writeAllowed, 'packages/cli/src/**'] }));
  assert.equal(left.ok && right.ok, true);
  assert.notEqual(workOrderContractDigest(left.value, digest), workOrderContractDigest(right.value, digest));
});

test('list ordering does not change contract identity', () => {
  const base = validContract();
  const left = parseWorkOrderContract(base);
  const right = parseWorkOrderContract({ ...base, mustRead: [...base.mustRead].reverse() });
  assert.equal(left.ok && right.ok, true);
  assert.equal(workOrderContractDigest(left.value, digest), workOrderContractDigest(right.value, digest));
});

test('risk combination only ever raises assurance', () => {
  assert.equal(maxWorkOrderRisk('LOW', 'HIGH_ASSURANCE'), 'HIGH_ASSURANCE');
  assert.equal(maxWorkOrderRisk('ELEVATED', 'STANDARD'), 'ELEVATED');
  assert.equal(maxWorkOrderRisk('STANDARD', 'STANDARD'), 'STANDARD');
});