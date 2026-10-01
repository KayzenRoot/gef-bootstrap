import test from 'node:test';
import { assertLaterActiveWorkOrder } from './helpers/v11-context-lock-refresh-assertions.mjs';
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
const ownerGovernancePromoted = checkpoint.v11.status === 'GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY';
const wo008Completed = checkpoint.v11.status === 'GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_WO_009_ADMISSION_NEXT';
const wo009Completed = checkpoint.v11.status === 'GBS_V11_WO_009_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT';
const wo011Current = checkpoint.v11.status === 'GBS_V11_WO_011_ADMITTED';
const admittedMatch = /^GBS_V11_WO_(\d{3})_ADMITTED$/.exec(checkpoint.v11.status);
const admittedOrdinal = wo011Current ? 11 : wo009Completed ? 10 : (ownerGovernancePromoted || wo008Completed) ? 8 : admittedMatch === null ? null : Number.parseInt(admittedMatch[1], 10);
const legalPostFoundationStates = foundationPromoted || ownerGovernancePromoted || wo008Completed || (Number.isInteger(admittedOrdinal) && admittedOrdinal >= 2 && admittedOrdinal <= 11);

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
    return;
  }
  if (ownerGovernancePromoted) {
    assert.equal(checkpoint.v11.activeWorkOrder, 'GBS-V11-WO-008');
    assert.equal(checkpoint.v11.activeWorkOrderStatus, 'IMPLEMENTED_PR_OPEN_AWAITING_OWNER_AUDIT');
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY');
    assert.ok(checkpointMd.includes('V1.1 STOP CONDITION: `GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY`'));
    return;
  }
  if (wo008Completed) {
    const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-008"];
    assert.equal(completed.status, "OWNER_AUDIT_APPROVED_MERGED");
    assert.equal(completed.implementationPr, 296);
    assert.equal(completed.auditedHead, "c4a108059d5b77baed43faa28847828ea1f450a7");
    assert.equal(completed.objectiveAudit, "OWNER_APPROVED");
    assert.equal(completed.objectiveReview, 5848062290);
    assert.equal(completed.implementationMerge, "ed69cc790c599674cc8ba845f3c393cd38964ef1");
    assert.equal(checkpoint.v11.activeWorkOrder, "NONE");
    assert.equal(checkpoint.v11.nextLegalAction, "PLAN_AND_ADMIT_GBS_V11_WO_009");
    assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_READY_FOR_WO_009_ADMISSION");
    assert.ok(checkpointMd.includes("### Completed V1.1 increment — WO-008"));
    return;
  }
  if (wo011Current) {
    assertLaterActiveWorkOrder(checkpoint, admittedOrdinal, false, 9);
    assert.ok(checkpointMd.includes('Current V1.1 release position'));
    return;
  }
  assert.ok(Number.isInteger(admittedOrdinal) && admittedOrdinal >= 2, `unexpected V1.1 lifecycle state after foundation promotion: ${checkpoint.v11.status}`);
  const id = String(admittedOrdinal).padStart(3, '0');
  if (admittedOrdinal === 9 || admittedOrdinal === 11 || wo009Completed) {
    assertLaterActiveWorkOrder(checkpoint, admittedOrdinal, false, 9);
  } else {
    const expectedStop = `GBS_V11_WO_${id}_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH`;
    assert.equal(checkpoint.v11.stopState, expectedStop);
    assert.ok(checkpointMd.includes(`V1.1 STOP CONDITION: \`${expectedStop}\``));
  }
});

test('pre-canonicalization WO-011 checkpoint retains its exact implementation-in-progress state', () => {
  if (!wo011Current) return;

  const historicalCheckpoint = structuredClone(checkpoint);
  historicalCheckpoint.v11.stopState = 'GBS_V11_WO_011_IMPLEMENTATION_IN_PROGRESS';
  historicalCheckpoint.v11.nextLegalAction = 'CONTINUE_GBS_V11_WO_011_IMPLEMENTATION_ON_LOCKED_BASE';
  historicalCheckpoint.v11.candidateRelease.pullRequest = null;
  historicalCheckpoint.v11.candidateRelease.contextLockSha256 = '5ABFFB90ECFE32A23B45F361371603FA6F2A4477883030512856F80B65B10C0B';
  historicalCheckpoint.v11.stableRelease = structuredClone(historicalCheckpoint.v11.previousStableRelease);
  historicalCheckpoint.v11.candidateRelease.status = 'PATCH_IN_PROGRESS';
  historicalCheckpoint.v11.candidateRelease.tag = null;
  historicalCheckpoint.v11.candidateRelease.npmPublished = false;
  historicalCheckpoint.v11.candidateRelease.registrySmoke = 'NOT_RUN';
  historicalCheckpoint.v11.candidateRelease.rolloutStarted = false;
  delete historicalCheckpoint.v11.candidateRelease.postProductionPatchRouting;

  assertLaterActiveWorkOrder(historicalCheckpoint, 11, false, 9);
});

test('V1.1 overlay preserves the objectively audited WO-001 foundation lineage after later admissions', () => {
  assert.equal(checkpoint.v11.releaseLine, '1.1.x');
  assert.ok(legalPostFoundationStates, `unexpected V1.1 state ${checkpoint.v11.status}`);
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
  assert.equal(checkpoint.v11.executorAuthority.decision, 'D-0062 / ADR-0006');
  assert.equal(checkpoint.v11.executorAuthority.state, 'EFFECTIVE');
  assert.equal(checkpoint.v11.executorAuthority.ownerAccount, 'KayzenRoot');
  assert.equal(checkpoint.v11.executorAuthority.requiresAdmittedWorkOrder, true);
  assert.equal(checkpoint.v11.executorAuthority.requiresExactHeadOwnerAudit, true);
  assert.equal(checkpoint.v11.executorAuthority.requiresCollaboratorReview, false);
  assert.equal(checkpoint.v11.executorAuthority.ownerMayMergeAfterExactHeadAuditAndChecks, true);
  assert.ok(checkpoint.v11.executorAuthority.allowedBranches.includes('release/1.1'));
  for (const forbidden of ['direct main mutation', 'v1.0.0 tag mutation', 'force-push', 'history rewrite', 'merge with failed, pending, stale or mismatched required checks', 'merge with unresolved CRITICAL/HIGH blockers']) {
    assert.ok(checkpoint.v11.executorAuthority.prohibited.includes(forbidden), `missing prohibition ${forbidden}`);
  }
});

test('V1.1.1 release acceptance does not rewrite the V1.0 production ledger', () => {
  assert.ok(checkpointMd.includes('The V1.0 production state above remains canonical for `main`'));
  assert.equal(checkpoint.v11.stableRelease.status, 'PRODUCTION_ACCEPTED');
  assert.equal(checkpoint.v11.stableRelease.version, '1.1.1');
  assert.equal(checkpoint.v11.stableRelease.tag, 'v1.1.1');
  assert.equal(checkpoint.v11.candidateRelease.status, 'RELEASED_REGISTRY_SMOKE_VERIFIED');
  assert.equal(checkpoint.v11.candidateRelease.version, '1.1.1');
  assert.equal(checkpoint.v11.previousStableRelease.version, '1.1.0');
  assert.equal(checkpoint.v11.releaseGateCloseout.recoveryConclusion, 'SUCCESS');
  assert.equal(checkpoint.earnedProductionWeight, 1088);
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

test('WO-002 remains the first governed increment and later admissions preserve monotonic completion', () => {
  if (foundationPromoted) {
    assert.equal(checkpoint.v11.nextLegalWorkOrder, 'GBS-V11-WO-002');
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_FOUNDATION_PROMOTED_READY_FOR_WO_002');
    return;
  }
  assert.ok(Number.isInteger(admittedOrdinal) && admittedOrdinal >= 2);
  if (wo008Completed) {
    const completed = checkpoint.v11.completedWorkOrders['GBS-V11-WO-008'];
    assert.equal(completed.status, 'OWNER_AUDIT_APPROVED_MERGED');
    assert.equal(completed.objectiveAudit, 'OWNER_APPROVED');
    assert.equal(completed.criticalFindings, 0);
    assert.equal(completed.highFindings, 0);
    assert.equal(checkpoint.v11.activeWorkOrder, 'NONE');
    assert.equal(checkpoint.v11.nextLegalAction, 'PLAN_AND_ADMIT_GBS_V11_WO_009');
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_READY_FOR_WO_009_ADMISSION');
  } else if (ownerGovernancePromoted) {
    assert.equal(checkpoint.v11.activeWorkOrder, 'GBS-V11-WO-008');
    assert.equal(checkpoint.v11.activeWorkOrderStatus, 'IMPLEMENTED_PR_OPEN_AWAITING_OWNER_AUDIT');
    assert.equal(checkpoint.v11.stopState, 'GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY');
  } else if (wo009Completed || wo011Current) {
    assertLaterActiveWorkOrder(checkpoint, admittedOrdinal, false, 9);
  } else {
    const activeId = String(admittedOrdinal).padStart(3, '0');
    assert.equal(checkpoint.v11.activeWorkOrder, `GBS-V11-WO-${activeId}`);
    assert.equal(checkpoint.v11.activeWorkOrderStatus, 'ADMITTED');
  }

  for (let ordinal = 2; ordinal < admittedOrdinal; ordinal += 1) {
    if (ordinal === 10) continue; // WO-010 is a release acceptance record, not an implementation increment entry.
    const id = `GBS-V11-WO-${String(ordinal).padStart(3, '0')}`;
    const completed = checkpoint.v11.completedWorkOrders[id];
    assert.ok(completed, `missing completed work order ${id}`);
    if (ordinal === 8 || ordinal === 9) {
      assert.equal(completed.status, 'OWNER_AUDIT_APPROVED_MERGED');
      assert.equal(completed.objectiveAudit, 'OWNER_APPROVED');
    } else {
      assert.equal(completed.status, 'OBJECTIVE_AUDIT_APPROVED_MERGED');
      assert.equal(completed.objectiveAudit, 'APPROVED');
    }
    assert.equal(completed.criticalFindings, 0);
    assert.equal(completed.highFindings, 0);
  }
});
