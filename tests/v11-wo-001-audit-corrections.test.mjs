import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

const schema = readJson('.engineering/schemas/execution-capsule.schema.json');
const contextLock = readJson('.engineering/context-locks/GBS-V11-WO-001.json');
const adr = read('.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md');
const capsuleContract = read('.engineering/releases/V1.1-EXECUTION-CAPSULE-CONTRACT.md');

function requiredAt(objectSchema, key) {
  return (objectSchema.required ?? []).includes(key);
}

test('production-branch sentinel cannot disappear by omission', () => {
  assert.ok(requiredAt(schema.properties.base, 'productionBranchTouched'));
  assert.equal(schema.properties.base.properties.productionBranchTouched.const, false);
});

test('broad-search suppression sentinel cannot disappear by omission', () => {
  assert.ok(requiredAt(schema.properties.navigation, 'searchSuppressed'));
  assert.equal(schema.properties.navigation.properties.searchSuppressed.const, true);
});

test('final-sweep obligation is always explicit', () => {
  assert.ok(requiredAt(schema.properties.selectedTests, 'finalSweepRequired'));
  assert.equal(schema.properties.selectedTests.properties.finalSweepRequired.type, 'boolean');
});

test('proof reuse credit boundary cannot disappear by omission', () => {
  const proofItem = schema.properties.proofReferences.items;
  assert.ok(requiredAt(proofItem, 'manufacturesProductionCredit'));
  assert.equal(proofItem.properties.manufacturesProductionCredit.const, false);
});

test('Codex execution authority points to ADR-0003-D3, not hotfix D2', () => {
  assert.ok(contextLock.executor.includes('ADR-0003-D3'));
  assert.ok(contextLock.codexAuthorizedScope.includes('ADR-0003-D3'));
  assert.ok(contextLock.authorityNote.includes('ADR-0003-D3'));
  assert.ok(!contextLock.authorityNote.includes('ADR-0003-D2 grants'));
  assert.ok(adr.includes('ADR-0003-D3 — Conditional authorization for Codex execution'));
});

test('continuing Codex authority is gated by D-0042 audit and checkpoint promotion', () => {
  assert.ok(adr.includes('not effective for subsequent implementation Work Orders until objective audit is APPROVED and the decision is promoted through the governed checkpoint flow'));
  assert.ok(contextLock.codexAuthorizedScope.includes('until ADR-0003-D3 passes objective audit and checkpoint promotion'));
});

test('deterministic ordering is delegated truthfully to WO-005 instead of claimed as already proven', () => {
  assert.ok(capsuleContract.includes('actual canonical ordering is a compiler obligation'));
  assert.ok(capsuleContract.includes('WO-005'));
  assert.ok(!capsuleContract.includes('ordering is asserted by test'));
});
