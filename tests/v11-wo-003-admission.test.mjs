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
const lock = json('.engineering/context-locks/GBS-V11-WO-003.json');
const wo = read('.engineering/work-orders/GBS-V11-WO-003.md');
const brief = read('.engineering/execution-briefs/GBS-V11-WO-003-CODEX.md');

test('V1 production checkpoint stays immutable while WO-003 is admitted', () => {
  assert.equal(checkpoint.status, 'GBS_V1_PRODUCTION_ACCEPTED');
  assert.equal(checkpoint.phase, 'V1_PRODUCTION_ACCEPTED');
  assert.equal(checkpoint.mainProductionDenominatorWeight, 1088);
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  assert.equal(checkpoint.remainingProductionWeight, 0);
  assert.equal(checkpoint.stopState, 'GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088');
});

test('WO-002 objective approval is promoted before WO-003 admission', () => {
  const completed = checkpoint.v11.completedWorkOrders['GBS-V11-WO-002'];
  assert.equal(completed.status, 'OBJECTIVE_AUDIT_APPROVED_MERGED');
  assert.equal(completed.implementationPr, 282);
  assert.equal(completed.auditedHead, '50bca2a60d0cc5ae237d994b2008957b1bf078bd');
  assert.equal(completed.objectiveReview, 5235463254);
  assert.equal(completed.implementationMerge, '9ee390180cb12ef6568ab77673e52514e13cf0c7');
  assert.equal(completed.criticalFindings, 0);
  assert.equal(completed.highFindings, 0);
});

test('machine and human checkpoint preserve WO-003 admission or prove its objective promotion before later Work Orders', () => {
  const ownerGovernancePending = checkpoint.v11.status === 'GBS_V11_GOV_001_OWNER_POLICY_PENDING_PROMOTION_WO_008_OWNER_AUDIT_NEXT';
  const match = /^GBS_V11_WO_(\d{3})_ADMITTED$/.exec(checkpoint.v11.status);
  const ordinal = ownerGovernancePending ? 8 : match === null ? null : Number.parseInt(match[1], 10);
  assert.ok(Number.isInteger(ordinal) && ordinal >= 3, `unexpected V1.1 state: ${checkpoint.v11.status}`);
  if (ordinal === 3) {
    assert.equal(checkpoint.v11.activeWorkOrder, 'GBS-V11-WO-003');
    assert.equal(checkpoint.v11.activeWorkOrderStatus, 'ADMITTED');
    assert.equal(checkpoint.v11.implementationBranch, 'feat/1.1/wo-003-doctor-status');
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_WO_003_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH');
  } else {
    const completed = checkpoint.v11.completedWorkOrders['GBS-V11-WO-003'];
    assert.equal(completed.status, 'OBJECTIVE_AUDIT_APPROVED_MERGED');
    assert.equal(completed.implementationPr, 284);
    assert.equal(completed.auditedHead, 'acb632a5f3b1770a50a3cce039473c5266c7b3b7');
    assert.equal(completed.objectiveReview, 5285940414);
    assert.equal(completed.implementationMerge, '22c5ce65443f1a7855a2967ff7837aadb98e0ba1');
    assert.equal(completed.criticalFindings, 0);
    assert.equal(completed.highFindings, 0);
    assert.ok(checkpointMd.includes('Completed V1.1 increment — WO-003'));
    const activeId = String(ordinal).padStart(3, '0');
    assert.equal(checkpoint.v11.activeWorkOrder, `GBS-V11-WO-${activeId}`);
    assert.equal(checkpoint.v11.stopState, ownerGovernancePending ? 'GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY' : `GBS_V11_WO_${activeId}_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH`);
  }
});

test('WO-003 is read-only doctor/status scope and preserves future ownership', () => {
  assert.ok(wo.includes('`gef doctor`'));
  assert.ok(wo.includes('`gef status`'));
  assert.ok(wo.includes('No destructive automatic repair'));
  assert.ok(wo.includes('`gef upgrade` or compatibility/migration/recovery implementation (WO-004)'));
  assert.ok(wo.includes('Context Compiler / Execution Capsule compiler implementation (WO-005)'));
  assert.ok(wo.includes('STOP CONDITION: `GBS_V11_WO_003_READY_FOR_OBJECTIVE_AUDIT`'));
});

test('WO-003 Context Lock remains an immutable historical admission record', () => {
  assert.equal(lock.baseSha, '9ee390180cb12ef6568ab77673e52514e13cf0c7');
  assert.equal(lock.productionShaAtLock, '72c17bd3e7e421790ac382022b1f0ebbb0275ea4');
  assert.equal(lock.v100TagTargetAtLock, '866fe3af8cccc65c929aaf6a47a924401fa448b3');
  assert.equal(lock.implementationBranch, 'feat/1.1/wo-003-doctor-status');
  assert.equal(lock.executorAuthority, 'ADR-0003-D3');
  assert.ok(lock.expectedWriteSurface.every((path) => !path.includes('packages/kernel')));
  assert.ok(lock.forbiddenWriteSurface.includes('main'));
  assert.ok(lock.canonicalSources.length >= 10);
});

test('Execution Brief suppresses repository-wide rediscovery and destructive repair', () => {
  assert.ok(brief.includes('State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`'));
  assert.ok(brief.includes('Do **not** start with repository-wide search'));
  assert.ok(brief.includes('No `--fix`, no destructive repair'));
  assert.ok(brief.includes('Git missing/unavailable must be surfaced as an actionable capability diagnostic'));
  assert.ok(brief.includes('MERGE NOT PERFORMED; OBJECTIVE AUDIT REQUIRED'));
});

test('doctor/status delegation map uses the architecture-named existing engines', () => {
  for (const symbol of ['doctor', 'repairSuggestion', 'invariantResult', 'dependencySecurity', 'githubSecurity', 'integritySnapshot', 'capabilityEnvelope', 'safetyDecision']) {
    assert.ok(wo.includes(`\`${symbol}\``), `missing doctor dependency ${symbol}`);
  }
  for (const symbol of ['operatorStatus', 'repositoryState', 'documentationManifest', 'navigationPlan']) {
    assert.ok(wo.includes(`\`${symbol}\``), `missing status dependency ${symbol}`);
  }
});
