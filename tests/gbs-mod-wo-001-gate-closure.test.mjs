// GBS-MOD-WO-001 (D) — changed-path closure onto the M28 test-impact selection.
//
// Acceptance: A6/A7 at the dependency level. A changed path that cannot be attributed to a known
// source must widen the closure and name the offending path, and the tier floor the classifier
// proved must survive the selection.

import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  GATE_CLOSURE_DIAGNOSTIC_CODES,
  buildTestMap,
  compileGateClosure,
  selectImpactedTests,
  tierToValidationLevel,
} from '../packages/test-impact-engine/dist/public.js';

const options = {
  digest: { algorithm: 'sha256', digest: (input) => createHash('sha256').update(input).digest('hex') },
  maxUnits: 4096,
};

const sha = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

const SOURCES = [
  { id: 'SRC.ROUTER', fingerprint: sha('router') },
  { id: 'SRC.DOCS', fingerprint: sha('docs') },
];

const TESTS = [
  { id: 'TEST.ROUTER', fingerprint: sha('t-router'), sources: ['SRC.ROUTER'] },
  { id: 'TEST.DOCS', fingerprint: sha('t-docs'), sources: ['SRC.DOCS'] },
];

const map = buildTestMap(SOURCES, TESTS, options);

before(() => {
  assert.equal(map.ok, true, 'the M28 test map fixture must build');
});

const ASSURANCE = { requiredLevel: 'L1', policyDigest: sha('policy'), profileDigest: sha('profile') };

const INDEX = {
  'packages/contracts/src/work-order.ts': ['SRC.ROUTER'],
  'AGENTS.md': ['SRC.DOCS'],
};

const closureInput = (over = {}) => ({
  map: map.value,
  sourcePathIndex: INDEX,
  changedPaths: ['AGENTS.md'],
  assurance: ASSURANCE,
  platform: 'ubuntu-latest',
  tierFloor: 'L1',
  attributionComplete: true,
  ...over,
});

const must = (over) => {
  const result = compileGateClosure(closureInput(over), options);
  assert.equal(result.ok, true, JSON.stringify(result.ok ? {} : result.diagnostics));
  return result.value;
};

test('tier floors map onto the validation ladder conservatively', () => {
  assert.equal(tierToValidationLevel('LOW'), 'L1');
  assert.equal(tierToValidationLevel('STANDARD'), 'L2');
  assert.equal(tierToValidationLevel('ELEVATED'), 'L4');
  assert.equal(tierToValidationLevel('HIGH_ASSURANCE'), 'L5');
  assert.equal(tierToValidationLevel('SOMETHING_NEW'), 'L5', 'an unknown tier must not buy a weaker floor');
});

test('a narrow attributed change selects only the impacted test', () => {
  const result = must({});
  assert.deepEqual(result.changedSourceIds, ['SRC.DOCS']);
  assert.deepEqual(result.selection.tests, ['TEST.DOCS']);
  // The dependency closure was reached, so the M28 ladder floor is L2 even though the LOW tier
  // only asked for L1; the floor is the stronger of the two, never the weaker.
  assert.equal(result.effectiveFloor, 'L2');
  assert.equal(result.fullSuiteRequired, false);
  assert.deepEqual(result.obstructions, []);
});

test('the closure digest is reproducible and order independent', () => {
  const first = must({});
  const second = compileGateClosure(
    closureInput({ changedPaths: ['AGENTS.md', 'packages/contracts/src/work-order.ts'] }),
    options,
  );
  const third = compileGateClosure(
    closureInput({ changedPaths: ['packages/contracts/src/work-order.ts', 'AGENTS.md'] }),
    options,
  );
  assert.equal(second.value.closureDigest, third.value.closureDigest);
  assert.notEqual(first.closureDigest, second.value.closureDigest);
  assert.match(first.closureDigest, /^sha256:[0-9a-f]{64}$/);
});

test('a path with no attributed source widens and is named', () => {
  const result = must({ changedPaths: ['AGENTS.md', 'packages/cli/src/index.ts'] });
  assert.deepEqual(result.unattributedPaths, ['packages/cli/src/index.ts']);
  assert.ok(result.obstructions.includes('PATH_NOT_ATTRIBUTED_TO_A_KNOWN_SOURCE'));
  assert.equal(result.effectiveFloor, 'L4');
  assert.equal(result.fullSuiteRequired, true);
});

test('an attribution index pointing at an unknown source is not silently accepted', () => {
  const result = must({
    changedPaths: ['AGENTS.md'],
    sourcePathIndex: { 'AGENTS.md': ['SRC.GHOST'] },
  });
  assert.deepEqual(result.unattributedPaths, ['AGENTS.md']);
  assert.deepEqual(result.changedSourceIds, []);
  assert.ok(result.obstructions.includes('PATH_NOT_ATTRIBUTED_TO_A_KNOWN_SOURCE'));
});

test('an incomplete attribution claim forces the L4 floor', () => {
  const result = must({ attributionComplete: false });
  assert.ok(result.obstructions.includes('SOURCE_PATH_INDEX_INCOMPLETE'));
  assert.equal(result.effectiveFloor, 'L4');
});

test('an incomplete M28 dependency map is reported as an unknown closure', () => {
  const dangling = buildTestMap(SOURCES, [{ id: 'TEST.GHOST', fingerprint: sha('t-ghost'), sources: ['SRC.GONE'] }], options);
  assert.equal(dangling.ok, true);
  assert.equal(dangling.value.complete, false);
  const result = must({ map: dangling.value, changedPaths: ['AGENTS.md'] });
  assert.ok(result.obstructions.includes('DEPENDENCY_CLOSURE_UNKNOWN'));
  assert.equal(result.effectiveFloor, 'L4');
});

test('the tier floor is never undercut by a narrow selection', () => {
  const rank = { L1: 0, L2: 1, L4: 2, L5: 3 };
  for (const tierFloor of ['L1', 'L2', 'L4', 'L5']) {
    const result = must({ tierFloor });
    assert.equal(result.tierFloor, tierFloor);
    assert.ok(rank[result.effectiveFloor] >= rank[tierFloor], `${tierFloor} must not be undercut by ${result.effectiveFloor}`);
    assert.equal(result.fullSuiteRequired, rank[result.effectiveFloor] >= rank.L4);
  }
});

test('HIGH_ASSURANCE forces the full suite and cannot be narrowed by attribution', () => {
  const result = must({ tierFloor: 'L5' });
  assert.equal(result.effectiveFloor, 'L5');
  assert.equal(result.fullSuiteRequired, true);
});

test('renames and deletions carry both sides of the move into the closure', () => {
  const moved = must({ changedPaths: ['packages/contracts/src/work-order.ts', 'packages/contracts/src/work-order.legacy.ts'] });
  assert.deepEqual(moved.changedSourceIds, ['SRC.ROUTER']);
  const deleted = must({ changedPaths: ['packages/contracts/dist/generated/index.js'] });
  assert.deepEqual(deleted.unattributedPaths, ['packages/contracts/dist/generated/index.js']);
  assert.equal(deleted.fullSuiteRequired, true, 'a deletion outside the known index must widen');
});

test('malformed closure input fails closed instead of throwing or coercing', () => {
  for (const over of [
    { changedPaths: [] },
    { changedPaths: ['AGENTS.md', 42] },
    { sourcePathIndex: null },
    { sourcePathIndex: ['AGENTS.md'] },
    { sourcePathIndex: { 'AGENTS.md': null } },
    { sourcePathIndex: { 'AGENTS.md': {} } },
    { sourcePathIndex: { 'AGENTS.md': 'SRC.DOCS' } },
    { sourcePathIndex: { 'AGENTS.md': [''] } },
    { map: null },
    { platform: '' },
    { tierFloor: 'GARBAGE' },
  ]) {
    const result = compileGateClosure(closureInput(over), options);
    assert.equal(result.ok, false, `${JSON.stringify(over)} must be refused`);
    assert.equal(result.diagnostics[0].code, GATE_CLOSURE_DIAGNOSTIC_CODES.GATE_CLOSURE_INPUT_INVALID);
  }
});

test('cancellation is reported rather than producing a partial closure', () => {
  let cancelled = false;
  const result = compileGateClosure(closureInput({}), {
    ...options,
    cancellation: { isCancelled: () => (cancelled = true) },
  });
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, 'OPERATION_CANCELLED');
  assert.equal(cancelled, true);
});

test('the closure reuses the M28 selection rather than replacing it', () => {
  const direct = selectImpactedTests(map.value, ['SRC.DOCS'], 'ubuntu-latest', ASSURANCE, options);
  assert.equal(direct.ok, true);
  assert.equal(must({}).selection.digest, direct.value.digest);
});