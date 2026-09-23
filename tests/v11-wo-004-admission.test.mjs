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
const lock = json('.engineering/context-locks/GBS-V11-WO-004.json');
const wo = read('.engineering/work-orders/GBS-V11-WO-004.md');
const brief = read('.engineering/execution-briefs/GBS-V11-WO-004-CODEX.md');

test('V1 production truth remains immutable while WO-004 is admitted', () => {
  assert.equal(checkpoint.status, 'GBS_V1_PRODUCTION_ACCEPTED');
  assert.equal(checkpoint.phase, 'V1_PRODUCTION_ACCEPTED');
  assert.equal(checkpoint.mainProductionDenominatorWeight, 1088);
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  assert.equal(checkpoint.remainingProductionWeight, 0);
  assert.equal(checkpoint.overallCompletionPercent, 100);
  assert.equal(checkpoint.stopState, 'GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088');
});

test('WO-003 objective approval is promoted before WO-004 admission', () => {
  const completed = checkpoint.v11.completedWorkOrders['GBS-V11-WO-003'];
  assert.equal(completed.status, 'OBJECTIVE_AUDIT_APPROVED_MERGED');
  assert.equal(completed.implementationPr, 284);
  assert.equal(completed.auditedHead, 'acb632a5f3b1770a50a3cce039473c5266c7b3b7');
  assert.equal(completed.objectiveReview, 5285940414);
  assert.equal(completed.implementationMerge, '22c5ce65443f1a7855a2967ff7837aadb98e0ba1');
  assert.equal(completed.criticalFindings, 0);
  assert.equal(completed.highFindings, 0);
  assert.equal(completed.assuranceRuns.windowsRightsOracle, 35805459223);
});

test('WO-004 promotion is preserved when the checkpoint advances to WO-005', () => {
  const completed = checkpoint.v11.completedWorkOrders['GBS-V11-WO-004'];
  assert.equal(completed.status, 'OBJECTIVE_AUDIT_APPROVED_MERGED');
  assert.equal(completed.implementationPr, 288);
  assert.equal(completed.auditedHead, '03a74d239958c456e1ed63b6cd210699a07f5798');
  assert.equal(completed.objectiveReview, 5291217891);
  assert.equal(completed.implementationMerge, 'ab820243b6c44e2ce9c5b747a7a6a4c688d90fed');
  assert.equal(completed.criticalFindings, 0);
  assert.equal(completed.highFindings, 0);
  assert.equal(checkpoint.v11.activeWorkOrder, 'GBS-V11-WO-005');
  assert.ok(checkpointMd.includes('### Completed V1.1 increment — WO-004'));
});

test('WO-004 scope is upgrade compatibility recovery and future ownership is preserved', () => {
  assert.ok(wo.includes('`gef upgrade` => `gef.upgrade.preview`'));
  assert.ok(wo.includes('`gef upgrade --apply` => `gef.upgrade.apply`'));
  assert.ok(wo.includes('preservation-first migration'));
  assert.ok(wo.includes('UPG-MIG-01..07') || wo.includes('`UPG-MIG-01` through `UPG-MIG-07`'));
  assert.ok(wo.includes('COMPAT-01..06') || wo.includes('`COMPAT-01` through `COMPAT-06`'));
  assert.ok(wo.includes('Context Compiler / Execution Capsule implementation (WO-005)'));
  assert.ok(wo.includes('STOP CONDITION: `GBS_V11_WO_004_READY_FOR_OBJECTIVE_AUDIT`'));
});

test('WO-004 Context Lock preserves lineage and binds the authorized refreshed clean baseline', () => {
  assert.equal(lock.baseSha, 'b97f2b454ef2647823b682da13b69a501d82c794');
  assert.equal(lock.refresh?.previousBaseSha, 'f5141d6548474f41884f19ffd432bddd3d23f6fc');
  assert.equal(lock.refresh?.refreshedBaseSha, 'b97f2b454ef2647823b682da13b69a501d82c794');
  assert.equal(lock.refresh?.preservesWorkOrderScope, true);
  assert.ok(lock.canonicalSources.some((source) => source.path === '.engineering/decisions/ADR-0005-LEGACY-ECOSYSTEM-DETACHMENT.md'));
  assert.equal(lock.productionShaAtLock, '72c17bd3e7e421790ac382022b1f0ebbb0275ea4');
  assert.equal(lock.v100TagObjectAtLock, 'aac89f9c3f0c884474958025bf14828bc338b5ee');
  assert.equal(lock.v100TagTargetAtLock, '866fe3af8cccc65c929aaf6a47a924401fa448b3');
  assert.equal(lock.implementationBranch, 'feat/1.1/wo-004-upgrade-recovery-clean');
  assert.equal(lock.executorAuthority, 'ADR-0003-D3');
  assert.equal(lock.assurance, 'HIGH_ASSURANCE');
  assert.ok(lock.canonicalSources.length >= 12);
  assert.ok(lock.forbiddenWriteSurface.includes('main'));
  assert.ok(lock.forbiddenWriteSurface.includes('tag:v1.0.0'));
});

test('Execution Brief suppresses rediscovery and freezes preview-first recovery rules', () => {
  assert.ok(brief.includes('State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`'));
  assert.ok(brief.includes('Do not start with repository-wide search'));
  assert.ok(brief.includes('`gef upgrade` -> `gef.upgrade.preview`'));
  assert.ok(brief.includes('USER_MODIFIED'));
  assert.ok(brief.includes('RECOVERY_REQUIRED'));
  assert.ok(brief.includes('UPG-MIG-01'));
  assert.ok(brief.includes('COMPAT-06'));
  assert.ok(brief.includes('MERGE NOT PERFORMED; OBJECTIVE AUDIT REQUIRED'));
});

test('WO-004 preserves accepted WO-002/WO-003 boundaries', () => {
  assert.ok(wo.includes('Existing WO-002/WO-003 source may be modified only when required'));
  assert.ok(wo.includes('Existing Windows trusted-Git rights oracle and POSIX trust chain must not regress'));
  assert.ok(brief.includes('weaken WO-002 transaction ownership/journal rules'));
  assert.ok(brief.includes('weaken WO-003 Git/process/trust rules'));
});
