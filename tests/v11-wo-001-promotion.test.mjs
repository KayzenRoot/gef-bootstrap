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
const ledger = read('.engineering/DECISIONS-LEDGER.md');
const adr = read('.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md');
const receipt = json('.engineering/evidence/GBS-V11-WO-001-PROMOTION-RECEIPT.json');

const foundationPromoted = checkpoint.v11.status === 'GBS_V11_FOUNDATION_PROMOTED';
const wo002Admitted = checkpoint.v11.status === 'GBS_V11_WO_002_ADMITTED';

test('V1.0 production acceptance remains byte-semantically preserved at the checkpoint boundary', () => {
  assert.equal(checkpoint.status, 'GBS_V1_PRODUCTION_ACCEPTED');
  assert.equal(checkpoint.phase, 'V1_PRODUCTION_ACCEPTED');
  assert.equal(checkpoint.mainProductionDenominatorWeight, 1088);
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  assert.equal(checkpoint.remainingProductionWeight, 0);
  assert.equal(checkpoint.overallCompletionPercent, 100);
  assert.equal(checkpoint.stopState, 'GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088');
});

test('human and machine checkpoints preserve production stop state while V1.1 advances monotonically', () => {
  assert.ok(checkpointMd.includes('Production STOP CONDITION: `GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088`'));
  assert.equal(checkpoint.stopState, 'GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088');

  if (foundationPromoted) {
    assert.ok(checkpointMd.includes('V1.1 STOP CONDITION: `GBS_V11_FOUNDATION_PROMOTED_READY_FOR_WO_002`'));
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_FOUNDATION_PROMOTED_READY_FOR_WO_002');
  } else if (wo002Admitted) {
    assert.ok(checkpointMd.includes('V1.1 STOP CONDITION: `GBS_V11_WO_002_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH`'));
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_WO_002_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH');
  } else {
    assert.fail(`unexpected V1.1 lifecycle state after foundation promotion: ${checkpoint.v11.status}`);
  }
});

test('V1.1 overlay preserves the objectively audited WO-001 foundation lineage after later admissions', () => {
  assert.equal(checkpoint.v11.releaseLine, '1.1.x');
  assert.ok(foundationPromoted || wo002Admitted, `unexpected V1.1 state ${checkpoint.v11.status}`);
  assert.equal(checkpoint.v11.foundation.workOrder, 'GBS-V11-WO-001');
  assert.equal(checkpoint.v11.foundation.auditedHead, '989dacef39a4d4bcbd6c3e8ef73ae7d54df6e635');
  assert.equal(checkpoint.v11.foundation.objectiveAudit, 'APPROVED');
  assert.equal(checkpoint.v11.foundation.implementationPr, 279);
  assert.equal(checkpoint.v11.foundation.implementationMerge, 'c5890620a98f2b23c794d65234824ad2ea084036');
  assert.equal(checkpoint.v11.foundation.criticalFindings, 0);
  assert.equal(checkpoint.v11.foundation.highFindings, 0);
});

test('D-0042 promotion is explicit and does not self-authorize main', () => {
  assert.equal(checkpoint.v11.promotion.decision, 'D-0059');
  assert.equal(checkpoint.v11.promotion.adr, 'ADR-0003');
  assert.equal(checkpoint.v11.executorAuthority.decision, 'ADR-0003-D3');
  assert.equal(checkpoint.v11.executorAuthority.requiresAdmittedWorkOrder, true);
  assert.ok(checkpoint.v11.executorAuthority.allowedBranches.includes('release/1.1'));
  for (const forbidden of ['main', 'merge', 'tag', 'publish', 'force-push', 'history rewrite', 'self-approval']) {
    assert.ok(checkpoint.v11.executorAuthority.prohibited.includes(forbidden), `missing prohibition ${forbidden}`);
  }
});

test('promotion does not convert the V1.1 integration branch into production', () => {
  assert.ok(checkpointMd.includes('The V1.0 production state above remains canonical for `main`'));
  assert.match(checkpointMd, /No V1\.1 development state represents production/i);
  assert.notEqual(checkpoint.v11.status, 'PRODUCTION_APPROVED');
});

test('promotion ledger preserves proposal history and records the later effective transition', () => {
  assert.ok(ledger.includes('D-0052'));
  assert.ok(ledger.includes('D-0058'));
  assert.ok(ledger.includes('D-0059 — V1.1 foundation decisions are promoted after objective audit'));
  const d59 = ledger.slice(ledger.indexOf('## D-0059'));
  assert.ok(d59.includes('989dacef39a4d4bcbd6c3e8ef73ae7d54df6e635'));
  assert.ok(d59.includes('c5890620a98f2b23c794d65234824ad2ea084036'));
  assert.ok(d59.includes('- Status: APPROVED'));
});

test('ADR-0003 is approved but remains strictly bounded to V1.1', () => {
  assert.match(adr, /Status: `APPROVED`/);
  assert.ok(adr.includes('ADR-0003-D3'));
  assert.ok(adr.includes('release/1.1'));
  assert.ok(adr.includes('does NOT authorize Codex on `main`'));
  assert.ok(adr.includes('989dacef39a4d4bcbd6c3e8ef73ae7d54df6e635'));
  assert.ok(adr.includes('c5890620a98f2b23c794d65234824ad2ea084036'));
});

test('promotion receipt binds PR, substantive head and inherited audit evidence', () => {
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.workOrder, 'GBS-V11-WO-001-PROMOTION');
  assert.equal(receipt.pullRequest, 280);
  assert.equal(receipt.baseSha, 'c5890620a98f2b23c794d65234824ad2ea084036');
  assert.match(receipt.promotionPayloadHead, /^[0-9a-f]{40}$/);
  assert.equal(receipt.inheritedAudit.workOrder, 'GBS-V11-WO-001');
  assert.equal(receipt.inheritedAudit.auditedHead, '989dacef39a4d4bcbd6c3e8ef73ae7d54df6e635');
  assert.equal(receipt.inheritedAudit.auditComment, 5706304150);
  assert.equal(receipt.inheritedAudit.verdict, 'APPROVED');
  assert.equal(receipt.inheritedAudit.criticalFindings, 0);
  assert.equal(receipt.inheritedAudit.highFindings, 0);
  assert.equal(receipt.productionStatePreserved.status, 'GBS_V1_PRODUCTION_ACCEPTED');
  assert.equal(receipt.productionStatePreserved.earnedProductionWeight, 1088);
  assert.equal(receipt.executorAuthority.decision, 'ADR-0003-D3');
  assert.equal(receipt.executorAuthority.mainAuthorized, false);
  assert.equal(receipt.nextLegalWorkOrder, 'GBS-V11-WO-002');
  assert.equal(receipt.state, 'PROMOTION_CANDIDATE');
});

test('receipt makes post-payload semantic mutation invalid by contract', () => {
  assert.equal(receipt.postPayloadMutationPolicy, 'RECEIPT_STALE_ON_ANY_NON_RECEIPT_CHANGE');
  assert.equal(receipt.finalHeadAuditRule, 'OBJECTIVE_AUDIT_MUST_BIND_THE_PR_HEAD_CONTAINING_THIS_RECEIPT');
});

test('WO-002 remains the governed next increment before admission and becomes the active admitted increment afterwards', () => {
  if (foundationPromoted) {
    assert.equal(checkpoint.v11.nextLegalWorkOrder, 'GBS-V11-WO-002');
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_FOUNDATION_PROMOTED_READY_FOR_WO_002');
  } else if (wo002Admitted) {
    assert.equal(checkpoint.v11.activeWorkOrder, 'GBS-V11-WO-002');
    assert.equal(checkpoint.v11.activeWorkOrderStatus, 'ADMITTED');
    assert.equal(checkpoint.v11.nextLegalAction, 'CREATE_WO_002_IMPLEMENTATION_BRANCH_FROM_EXACT_ADMISSION_MERGE');
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_WO_002_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH');
  } else {
    assert.fail(`unexpected V1.1 lifecycle state: ${checkpoint.v11.status}`);
  }
});
