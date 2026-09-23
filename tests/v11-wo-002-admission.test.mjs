import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(ROOT, path), 'utf8');
const json = (path) => JSON.parse(read(path));

const checkpoint = json('.engineering/CHECKPOINT.json');
const checkpointMd = read('.engineering/CHECKPOINT.md');
const lock = json('.engineering/context-locks/GBS-V11-WO-002.json');
const wo = read('.engineering/work-orders/GBS-V11-WO-002.md');
const brief = read('.engineering/execution-briefs/GBS-V11-WO-002-CODEX.md');

test('V1 production truth remains unchanged while V1.1 progresses beyond WO-002 admission', () => {
  assert.equal(checkpoint.status, 'GBS_V1_PRODUCTION_ACCEPTED');
  assert.equal(checkpoint.mainProductionDenominatorWeight, 1088);
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  assert.equal(checkpoint.remainingProductionWeight, 0);
  assert.equal(checkpoint.stopState, 'GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088');
});

test('V1.1 checkpoint progression never regresses before WO-002 admission', () => {
  const legal = ['GBS_V11_WO_002_ADMITTED', 'GBS_V11_WO_003_ADMITTED', 'GBS_V11_WO_004_ADMITTED'];
  assert.ok(legal.includes(checkpoint.v11.status), `unexpected V1.1 state: ${checkpoint.v11.status}`);
  if (checkpoint.v11.status === 'GBS_V11_WO_002_ADMITTED') {
    assert.equal(checkpoint.v11.activeWorkOrder, 'GBS-V11-WO-002');
    assert.equal(checkpoint.v11.activeWorkOrderStatus, 'ADMITTED');
    assert.equal(checkpoint.v11.implementationBranch, 'feat/1.1/wo-002-cli-distribution');
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_WO_002_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH');
  } else {
    assert.equal(checkpoint.v11.completedWorkOrders['GBS-V11-WO-002'].objectiveAudit, 'APPROVED');
    assert.equal(checkpoint.v11.completedWorkOrders['GBS-V11-WO-002'].implementationPr, 282);
    assert.equal(checkpoint.v11.completedWorkOrders['GBS-V11-WO-002'].criticalFindings, 0);
    assert.equal(checkpoint.v11.completedWorkOrders['GBS-V11-WO-002'].highFindings, 0);
    assert.ok(checkpointMd.includes('Completed V1.1 increment — WO-002'));
  }
});

test('executor authority remains branch and Work-Order bounded', () => {
  assert.equal(checkpoint.v11.executorAuthority.decision, 'ADR-0003-D3');
  assert.equal(checkpoint.v11.executorAuthority.state, 'EFFECTIVE');
  assert.equal(checkpoint.v11.executorAuthority.requiresAdmittedWorkOrder, true);
  assert.ok(checkpoint.v11.executorAuthority.allowedBranches.includes('release/1.1'));
  for (const forbidden of ['main', 'merge', 'tag', 'publish', 'force-push', 'history rewrite', 'self-approval']) {
    assert.ok(checkpoint.v11.executorAuthority.prohibited.includes(forbidden), `missing prohibition: ${forbidden}`);
  }
});

test('WO-002 remains narrow and delegates future commands to their owning WOs', () => {
  assert.ok(wo.includes('`gef init`'));
  assert.ok(wo.includes('`gef adopt`'));
  assert.ok(wo.includes('`gef doctor`, `gef status` implementation (WO-003)'));
  assert.ok(wo.includes('`gef upgrade` implementation or migration engine changes (WO-004)'));
  assert.ok(wo.includes('Execution Capsule compiler implementation (WO-005)'));
  assert.ok(wo.includes('STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_AUDIT`'));
});

test('CLI action defaults are fail-safe and mutation requires explicit apply', () => {
  assert.ok(wo.includes('`gef init` => `gef.init.plan` by default'));
  assert.ok(wo.includes('`gef init --apply` => `gef.init.run`'));
  assert.ok(wo.includes('`gef adopt` => `gef.adopt.preview` by default'));
  assert.ok(wo.includes('`gef adopt --apply` => `gef.adopt.apply`'));
});

test('known C3 C5 C6 constraints are not silently normalized', () => {
  const ids = lock.knownConstraints.map((entry) => entry.id);
  assert.deepEqual(ids, ['C3', 'C5', 'C6']);
  assert.ok(wo.includes('Do **not** reorganize the monorepo'));
  assert.ok(wo.includes('Never consume these through an ambiguous flat barrel'));
  assert.ok(wo.includes('Resolve only the version/bin/distribution portion'));
});

test('WO-002 Context Lock remains an immutable historical base record', () => {
  assert.equal(lock.baseSha, '02e5926557e485e8c5e340e9bb9c4d2aee74e0ea');
  assert.equal(lock.productionShaAtLock, '72c17bd3e7e421790ac382022b1f0ebbb0275ea4');
  assert.equal(lock.v100TagTargetAtLock, '866fe3af8cccc65c929aaf6a47a924401fa448b3');
  assert.equal(lock.executorAuthority, 'ADR-0003-D3');
  assert.equal(lock.implementationBranch, 'feat/1.1/wo-002-cli-distribution');
  assert.ok(lock.canonicalSources.length >= 10);
  for (const source of lock.canonicalSources) assert.match(source.baseBlobSha ?? source.admissionBlobSha, /^[0-9a-f]{40}$/);
});

test('WO-002 Execution Brief remains historical and suppresses broad rediscovery', () => {
  assert.ok(brief.includes('State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`'));
  assert.ok(brief.includes('Do **not** start with repository-wide search'));
  assert.ok(brief.includes('MERGE NOT PERFORMED; OBJECTIVE AUDIT REQUIRED'));
  assert.ok(brief.includes('STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_AUDIT`'));
});

test('distribution remains local-proof-only and publication stays forbidden', () => {
  assert.ok(wo.includes('Do **not** publish to npm, GitHub Releases, or any registry'));
  assert.ok(wo.includes('locally packable/installable') || wo.includes('`npm pack`'));
  assert.ok(brief.includes('Local packaging proof is required; publication is forbidden'));
  assert.ok(brief.includes('no publication claim/action'));
});
