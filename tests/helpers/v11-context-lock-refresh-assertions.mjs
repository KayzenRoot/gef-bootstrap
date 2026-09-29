import assert from "node:assert/strict";

const PROMOTED_WO009 = "GBS_V11_WO_009_OWNER_AUDIT_APPROVED_MERGED_WO_010_ADMISSION_NEXT";
const PROMOTED_STOP = "GBS_V11_WO_009_OWNER_AUDIT_APPROVED_MERGED_READY_FOR_WO_010_ADMISSION";

export function assertWo009ContextLockRefreshHandoff(checkpoint, checkpointMd) {
  if (checkpoint.v11.status === PROMOTED_WO009) {
    assert.equal(checkpoint.v11.activeWorkOrder, "NONE");
    assert.equal(checkpoint.v11.activeWorkOrderStatus, "NONE");
    assert.equal(checkpoint.v11.nextWorkOrder, "GBS-V11-WO-010");
    assert.equal(checkpoint.v11.nextLegalAction, "PLAN_AND_ADMIT_GBS_V11_WO_010");
    assert.equal(checkpoint.v11.stopState, PROMOTED_STOP);
    assert.ok(checkpointMd.includes("### Completed V1.1 increment — WO-009"));
    assert.ok(checkpointMd.includes(`V1.1 STOP CONDITION: \`${PROMOTED_STOP}\``));
    return;
  }
  assert.equal(checkpoint.v11.status, "GBS_V11_WO_009_ADMITTED");
  assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-009");
  assert.equal(checkpoint.v11.activeWorkOrderStatus, "ADMITTED");
  assert.equal(checkpoint.v11.nextLegalAction, "REFRESH_WO_009_CONTEXT_LOCK_FOR_CURRENT_RELEASE_HEAD");
  assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_009_CONTEXT_LOCK_REFRESH_REQUIRED_AFTER_PIPELINE_FORWARD_PORT");
  assert.ok(checkpointMd.includes("Next legal action: after this checkpoint reconciliation merges, refresh the WO-009 Context Lock against the exact current `release/1.1` tip"));
  assert.ok(checkpointMd.includes("V1.1 STOP CONDITION: `GBS_V11_WO_009_CONTEXT_LOCK_REFRESH_REQUIRED_AFTER_PIPELINE_FORWARD_PORT`"));
}

export function assertWo009BranchReconciliationNote(checkpointMd) {
  if (checkpointMd.includes("### Completed V1.1 increment — WO-009")) {
    assert.ok(checkpointMd.includes("PR #302 superseded and closed without merge"));
    assert.ok(checkpointMd.includes("PR #316"));
    return;
  }
  assert.ok(checkpointMd.includes("WO-009 implementation branch exists as `feat/1.1/wo-009-integrated-assurance`; PR #302 still needs reconciliation"));
}

export function assertLaterActiveWorkOrder(checkpoint, ordinal, ownerGovernancePromoted, minimumOrdinal, wo008Completed = false) {
  if (checkpoint.v11.status === PROMOTED_WO009) {
    assert.equal(ordinal, 10);
    assert.ok(ordinal >= minimumOrdinal);
    assert.equal(checkpoint.v11.activeWorkOrder, "NONE");
    assert.equal(checkpoint.v11.activeWorkOrderStatus, "NONE");
    assert.equal(checkpoint.v11.nextWorkOrder, "GBS-V11-WO-010");
    assert.equal(checkpoint.v11.stopState, PROMOTED_STOP);
    return;
  }
  assert.ok(Number.isInteger(ordinal) && ordinal >= minimumOrdinal, `unexpected V1.1 state: ${checkpoint.v11.status}`);
  if (wo008Completed) {
    assert.equal(checkpoint.v11.activeWorkOrder, "NONE");
    assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_READY_FOR_WO_009_ADMISSION");
    return;
  }
  if (ordinal === 9) {
    assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-009");
    assert.equal(checkpoint.v11.activeWorkOrderStatus, "ADMITTED");
    return;
  }
  const activeId = String(ordinal).padStart(3, "0");
  assert.equal(checkpoint.v11.activeWorkOrder, `GBS-V11-WO-${activeId}`);
  assert.equal(
    checkpoint.v11.stopState,
    ownerGovernancePromoted
      ? "GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY"
      : `GBS_V11_WO_${activeId}_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH`
  );
}
