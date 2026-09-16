// GBS-V11-WO-001 — contract validation for the V1.1 release foundation artifacts.
// Dependency-free: evaluates a JSON Schema 2020-12 subset sufficient for the
// Execution Capsule schema, so the contract is machine-checkable without adding
// packages to the workspace.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

// ---------------------------------------------------------------- validator
const isType = (value, type) => {
  switch (type) {
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array': return Array.isArray(value);
    case 'string': return typeof value === 'string';
    case 'boolean': return typeof value === 'boolean';
    case 'null': return value === null;
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'integer': return Number.isInteger(value);
    default: return true;
  }
};

function resolveRef(ref, root) {
  assert.ok(ref.startsWith('#/'), `unsupported $ref: ${ref}`);
  return ref.slice(2).split('/').reduce((node, key) => node[key], root);
}

/** Returns a list of violations; empty list means the document conforms. */
function validate(schema, data, root = schema, path = '$') {
  const errors = [];
  const push = (msg) => errors.push(`${path}: ${msg}`);

  if (schema.$ref) return validate(resolveRef(schema.$ref, root), data, root, path);

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => isType(data, t))) { push(`expected type ${types.join('|')}`); return errors; }
  }
  if ('const' in schema && data !== schema.const) push(`expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(data)}`);
  if (schema.enum && !schema.enum.includes(data)) push(`value ${JSON.stringify(data)} not in enum`);
  if (typeof data === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) push(`does not match pattern ${schema.pattern}`);
    if (schema.minLength !== undefined && data.length < schema.minLength) push(`shorter than minLength ${schema.minLength}`);
  }
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) push(`fewer than minItems ${schema.minItems}`);
    if (schema.uniqueItems) {
      const seen = new Set();
      for (const item of data) {
        const key = JSON.stringify(item);
        if (seen.has(key)) push('contains duplicate items but uniqueItems is set');
        seen.add(key);
      }
    }
    if (schema.items) data.forEach((item, i) => errors.push(...validate(schema.items, item, root, `${path}[${i}]`)));
  }
  if (isType(data, 'object')) {
    for (const key of schema.required ?? []) {
      if (!(key in data)) push(`missing required property "${key}"`);
    }
    for (const [key, sub] of Object.entries(schema.properties ?? {})) {
      if (key in data) errors.push(...validate(sub, data[key], root, `${path}.${key}`));
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!(key in (schema.properties ?? {}))) push(`additional property "${key}" is not allowed`);
      }
    }
  }
  if (schema.anyOf) {
    const ok = schema.anyOf.some((sub) => validate(sub, data, root, path).length === 0);
    if (!ok) push('does not satisfy anyOf');
  }
  for (const clause of schema.allOf ?? []) {
    const conditionMet = !clause.if || validate(clause.if, data, root, path).length === 0;
    if (conditionMet && clause.then) errors.push(...validate(clause.then, data, root, path));
  }
  return errors;
}

// ---------------------------------------------------------------- fixtures
const sha = (c) => c.repeat(64);
const baseCapsule = () => ({
  schemaVersion: '1.0',
  capsuleId: 'gef.capsule.wo-001.release-foundation',
  capsuleVersion: '1.0',
  releaseLine: '1.1.x',
  state: 'COMPILED',
  certainty: 'SUFFICIENT',
  base: { repository: 'KayzenRoot/gef-bootstrap', branch: 'release/1.1', headSha: 'a'.repeat(40), treeFingerprint: sha('b'), productionBranchTouched: false },
  workOrder: { id: 'GBS-V11-WO-001', source: '.engineering/work-orders/GBS-V11-WO-001.md', scopeDigest: sha('c'), assurance: 'STANDARD' },
  navigation: { mustRead: ['README.md'], readIfTriggered: [], writeAllowed: ['.engineering/releases/x.md'], writeForbidden: ['main'], searchSuppressed: true },
  affected: { files: [{ path: 'x.md', mode: 'NEW_FILE_SEED', fingerprint: null }], symbols: [], dependencies: [], dependencyClosureDigest: sha('d') },
  constraints: ['main is never modified'],
  acceptanceCriteria: [{ id: 'AC-1', criterion: 'no change to V1.0.0 history', proofObligation: 'git verification' }],
  selectedTests: { ladderLevel: 'L1', tests: ['tests/x.test.mjs'], escalation: [{ trigger: 'unmapped file', escalateTo: 'L4' }], finalSweepRequired: false },
  proofReferences: [],
  fingerprints: { canonicalization: 'stable-key-order + sorted arrays + sha256', capsuleFingerprint: sha('e') },
  invalidation: { driftClasses: ['NONE'], onDrift: 'RECOMPILE', expiresAt: null },
  stopCondition: 'GBS_V11_WO_001_READY_FOR_OBJECTIVE_AUDIT'
});

const schema = readJson('.engineering/schemas/execution-capsule.schema.json');

test('execution capsule schema is a valid JSON Schema 2020-12 document', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.$id, 'urn:gef:schema:execution-capsule:1');
  assert.equal(schema.type, 'object');
  for (const key of ['capsuleId', 'state', 'certainty', 'base', 'workOrder', 'navigation', 'affected', 'constraints', 'acceptanceCriteria', 'selectedTests', 'proofReferences', 'fingerprints', 'invalidation', 'stopCondition']) {
    assert.ok(schema.required.includes(key), `schema must require ${key}`);
  }
});

test('a well-formed compiled capsule conforms', () => {
  assert.deepEqual(validate(schema, baseCapsule()), []);
});

test('insufficient certainty cannot produce a compiled capsule', () => {
  const c = baseCapsule();
  c.certainty = 'INSUFFICIENT';
  assert.notDeepEqual(validate(schema, c), []);
  assert.deepEqual(validate(schema, { ...c, state: 'INDETERMINATE' }), []);
});

test('a compiled capsule requires sufficient certainty', () => {
  const errs = validate(schema, { ...baseCapsule(), certainty: 'INSUFFICIENT', state: 'COMPILED' });
  assert.ok(errs.some((e) => e.includes('INDETERMINATE')));
});

test('capsule cannot authorize mutation of the production branch', () => {
  const c = baseCapsule();
  c.base.productionBranchTouched = true;
  assert.notDeepEqual(validate(schema, c), []);
});

test('capsule cannot decline to suppress repository-wide search', () => {
  const c = baseCapsule();
  c.navigation.searchSuppressed = false;
  assert.notDeepEqual(validate(schema, c), []);
});

test('constraints cannot be empty', () => {
  assert.notDeepEqual(validate(schema, { ...baseCapsule(), constraints: [] }), []);
});

test('selected tests must declare at least one escalation trigger', () => {
  const c = baseCapsule();
  c.selectedTests.escalation = [];
  assert.notDeepEqual(validate(schema, c), []);
});

test('an L5 capsule must require the final sweep', () => {
  const c = baseCapsule();
  c.selectedTests.ladderLevel = 'L5';
  c.selectedTests.finalSweepRequired = false;
  assert.notDeepEqual(validate(schema, c), []);
  assert.deepEqual(validate(schema, { ...c, selectedTests: { ...c.selectedTests, finalSweepRequired: true } }), []);
});

test('proof reuse can never manufacture production credit', () => {
  const c = baseCapsule();
  c.proofReferences = [{ proofId: 'p1', state: 'REUSABLE', bindsTo: sha('f'), manufacturesProductionCredit: true }];
  assert.notDeepEqual(validate(schema, c), []);
});

test('only REUSABLE is a valid suppressing proof state vocabulary', () => {
  const c = baseCapsule();
  c.proofReferences = [{ proofId: 'p1', state: 'STALE_SOURCE', bindsTo: sha('f'), manufacturesProductionCredit: false }];
  assert.deepEqual(validate(schema, c), []);
  c.proofReferences = [{ proofId: 'p1', state: 'PROBABLY_FINE', bindsTo: sha('f'), manufacturesProductionCredit: false }];
  assert.notDeepEqual(validate(schema, c), []);
});

test('capsule identity must follow the canonical command-id shape', () => {
  assert.notDeepEqual(validate(schema, { ...baseCapsule(), capsuleId: 'capsule-1' }), []);
});

test('capsule rejects unknown properties', () => {
  assert.notDeepEqual(validate(schema, { ...baseCapsule(), surpriseField: 1 }), []);
});

test('missing stop condition is rejected', () => {
  const c = baseCapsule();
  delete c.stopCondition;
  assert.notDeepEqual(validate(schema, c), []);
});

// ------------------------------------------------------- compatibility matrix
const matrix = readJson('.engineering/releases/V1.1-COMPATIBILITY-MATRIX.skeleton.json');
const ROW_STATES = ['UNVERIFIED', 'VERIFIED', 'UNSUPPORTED', 'INDETERMINATE'];

test('compatibility matrix is a skeleton that claims nothing', () => {
  assert.equal(matrix.status, 'SKELETON_UNPOPULATED');
  assert.equal(matrix.summary.verified, 0);
  assert.equal(matrix.summary.totalRows, matrix.rows.length);
});

test('compatibility matrix declares every dimension D1-D10', () => {
  for (let i = 1; i <= 10; i++) assert.ok(matrix.dimensions[`D${i}`], `missing dimension D${i}`);
});

test('compatibility matrix rows use the declared state vocabulary', () => {
  for (const row of matrix.rows) assert.ok(ROW_STATES.includes(row.status), `row ${row.id} has invalid status ${row.status}`);
});

test('a row with an UNKNOWN blocking dimension is never VERIFIED', () => {
  const blocking = Object.values(matrix.dimensions).filter((d) => d.blocking).map((d) => d.name);
  for (const row of matrix.rows) {
    if (row.status !== 'VERIFIED') continue;
    for (const name of blocking) assert.notEqual(row[name], 'UNKNOWN', `row ${row.id} verified with UNKNOWN blocking dimension ${name}`);
  }
});

test('known candidate evidence is explicitly not adopted', () => {
  assert.ok(matrix.knownCandidateEvidence.note.includes('Not adopted'));
});

// ---------------------------------------------------------------- documents
const ADR = '.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md';
const DOCS = [
  '.engineering/releases/V1.1-CLI-DISTRIBUTION-ARCHITECTURE.md',
  '.engineering/releases/V1.1-COMPATIBILITY-MIGRATION-CONTRACT.md',
  '.engineering/releases/V1.1-EXECUTION-CAPSULE-CONTRACT.md',
  '.engineering/releases/V1.1-INCREMENTAL-VALIDATION-PROOF-REUSE-CONTRACT.md',
  '.engineering/releases/V1.1-PERFORMANCE-BENCHMARK-PROTOCOL.md',
  '.engineering/releases/V1.1-TEST-MATRIX.md',
  '.engineering/releases/V1.1-IMPLEMENTATION-DECOMPOSITION.md'
];

test('every WO-001 contract artifact exists and declares a STOP CONDITION', () => {
  for (const path of DOCS) {
    const text = read(path);
    assert.ok(text.includes('STOP CONDITION:'), `${path} must declare a STOP CONDITION`);
    assert.ok(text.length > 800, `${path} is too thin to be a contract`);
  }
});

test('the ADR follows repository ADR convention and declares audit status', () => {
  const adr = read(ADR);
  assert.ok(adr.length > 800);
  assert.ok(adr.includes('## Audit status'), 'ADR must declare audit status');
  assert.ok(adr.includes('Not self-approved'), 'ADR must not claim its own approval');
  // Repository ADR convention (ADR-0001, ADR-0002) does not use STOP CONDITION blocks.
  const priorAdr = read('.engineering/decisions/ADR-0002-PLANNING-TO-EXECUTION-ACCELERATION.md');
  assert.equal((priorAdr.match(/STOP CONDITION:/g) ?? []).length, 0, 'convention check: prior ADRs carry no STOP CONDITION');
});

test('release-channel ADR carries decisions D1-D5 and the conflict report', () => {
  const adr = read(ADR);
  for (const id of ['ADR-0003-D1', 'ADR-0003-D2', 'ADR-0003-D3', 'ADR-0003-D4', 'ADR-0003-D5']) assert.ok(adr.includes(id), `missing ${id}`);
  assert.ok(adr.includes('Conflict report'), 'ADR must report discovered conflicts');
  assert.ok(adr.includes('C1') && adr.includes('C2'), 'ADR must record conflicts C1 and C2');
  assert.ok(adr.includes('ADR-0002-D8'), 'ADR must name the superseded decision explicitly');
});

test('CLI architecture delegates to verified kernel and engine symbols', () => {
  const cli = read(DOCS[0]);
  for (const symbol of ['CommandRegistry', 'projectExitCode', 'helpIndex', 'installPlan', 'upgradePreview', 'doctor', 'navigationPlan', 'operatorStatus']) {
    assert.ok(cli.includes(symbol), `CLI architecture must reference verified symbol ${symbol}`);
  }
  assert.ok(cli.includes('Designed, not proven') || cli.includes('designed, not proven'), 'CLI architecture must separate designed from proven');
});

test('decomposition maps all twelve NECESSARY scope items and WO-002..WO-010', () => {
  const dec = read(DOCS[6]);
  for (let i = 1; i <= 12; i++) assert.ok(new RegExp(`\\| ${i} \\|`).test(dec), `decomposition must map NECESSARY item ${i}`);
  for (let i = 2; i <= 10; i++) assert.ok(dec.includes(`WO-${String(i).padStart(3, '0')}`), `decomposition must reference WO-${String(i).padStart(3, '0')}`);
});

test('test matrix covers Windows, Linux and macOS', () => {
  const matrixDoc = read(DOCS[5]);
  assert.ok(matrixDoc.includes('windows-latest') && matrixDoc.includes('ubuntu-latest') && matrixDoc.includes('macos-latest'));
  for (const suite of ['CLI-E2E', 'DIST-SMOKE', 'UPG-MIG', 'COMPAT', 'CTX-DET', 'INC-VAL', 'PROOF-INV', 'TELEM', 'SEC-INT', 'REG']) {
    assert.ok(matrixDoc.includes(suite), `test matrix must define suite ${suite}`);
  }
});

// -------------------------------------------------------------- context lock
const lock = readJson('.engineering/context-locks/GBS-V11-WO-001.json');

test('context lock lineage matches the Work Order expectation', () => {
  assert.equal(lock.baseSha, '331414660a195716471ce3b150ff6d20c3dcec51');
  assert.equal(lock.ancestryVerified.matches, true);
  assert.equal(lock.workOrderId, 'GBS-V11-WO-001');
});

test('context lock records the bounded executor authorization and its authority note', () => {
  assert.equal(lock.codexAllowed, true);
  assert.ok(lock.authorityNote.includes('ADR-0003-D2'), 'authorization must cite its superseding decision');
  assert.ok(lock.codexProhibited.includes('main'));
  assert.ok(lock.codexProhibited.includes('tag v1.0.0'));
});

test('context lock reports conflicts with owners and never silently drops them', () => {
  const ids = lock.conflictsReported.map((c) => c.id);
  for (const id of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']) assert.ok(ids.includes(id), `conflict ${id} must be reported`);
  for (const conflict of lock.conflictsReported) {
    assert.ok(conflict.disposition && conflict.status, `conflict ${conflict.id} needs disposition and status`);
    assert.notEqual(conflict.status, 'SILENTLY_CHANGED');
  }
});

test('context lock fingerprints every canonical source', () => {
  assert.ok(lock.lockedSources.length >= 12);
  for (const source of lock.lockedSources) assert.match(source.sha256, /^[0-9a-f]{64}$/);
});

// ------------------------------------------------------------- guardrails
test('WO-001 must not have modified production state or the release tag', () => {
  const checkpoint = readJson('.engineering/CHECKPOINT.json');
  assert.equal(checkpoint.status, 'GBS_V1_PRODUCTION_ACCEPTED');
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  const releaseReceipt = readJson('.engineering/GBS-V1-RELEASE-RECEIPT.json');
  assert.equal(releaseReceipt.tag, 'v1.0.0');
  assert.equal(releaseReceipt.releaseCommitSha, '866fe3af8cccc65c929aaf6a47a924401fa448b3');
});

test('new ledger entries are marked proposed, not approved', () => {
  const ledger = read('.engineering/DECISIONS-LEDGER.md');
  assert.ok(ledger.includes('D-0052'), 'ledger must record the release-channel decision');
  const proposed = ledger.match(/- Status: PROPOSED_FOR_WO_001_AUDIT/g) ?? [];
  assert.ok(proposed.length >= 7, `expected >=7 proposed entries, got ${proposed.length}`);
});
