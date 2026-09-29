import assert from "node:assert/strict";

export function assertWo009ContextLockRefreshHandoff(checkpoint, checkpointMd) {
  assert.equal(checkpoint.v11.status, "GBS_V11_WO_009_ADMITTED");
  assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-009");
  assert.equal(checkpoint.v11.activeWorkOrderStatus, "ADMITTED");
  assert.equal(checkpoint.v11.nextLegalAction, "REFRESH_WO_009_CONTEXT_LOCK_FOR_CURRENT_RELEASE_HEAD");
  assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_009_CONTEXT_LOCK_REFRESH_REQUIRED_AFTER_PIPELINE_FORWARD_PORT");
  assert.ok(checkpointMd.includes("Next legal action: after this checkpoint reconciliation merges, refresh the WO-009 Context Lock against the exact current `release/1.1` tip"));
  assert.ok(checkpointMd.includes("V1.1 STOP CONDITION: `GBS_V11_WO_009_CONTEXT_LOCK_REFRESH_REQUIRED_AFTER_PIPELINE_FORWARD_PORT`"));
}

export function assertWo009BranchReconciliationNote(checkpointMd) {
  assert.ok(checkpointMd.includes("WO-009 implementation branch exists as `feat/1.1/wo-009-integrated-assurance`; PR #302 still needs reconciliation"));
}

export function assertLaterActiveWorkOrder(checkpoint, ordinal, ownerGovernancePromoted, minimumOrdinal, wo008Completed = false) {
  assert.ok(Number.isInteger(ordinal) && ordinal >= minimumOrdinal, `unexpected V1.1 state: ${checkpoint.v11.status}`);
  if (wo008Completed) {
    assert.equal(checkpoint.v11.activeWorkOrder, "NONE");
    assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_READY_FOR_WO_009_ADMISSION");
    return;
  }
  if (ordinal === 10) {
    assertWo009MergedPromotionHandoff(checkpoint, "");
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

export function assertWo009MergedPromotionHandoff(checkpoint, checkpointMd) {
  assert.equal(checkpoint.v11.status, "GBS_V11_WO_009_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT");
  assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-MAINT-POST-WO009-001");
  assert.equal(checkpoint.v11.activeWorkOrderStatus, "ADMITTED");
  assert.equal(checkpoint.v11.nextWorkOrder, "NONE");
  assert.equal(checkpoint.v11.nextCandidateWorkOrder, "GBS-V11-WO-010");
  assert.equal(checkpoint.v11.nextLegalAction, "RESOLVE_PR278_SONAR_AND_MERGE_CONFLICT_UNDER_GBS_V11_MAINT_POST_WO009_001");
  assert.equal(checkpoint.v11.stopState, "GBS_V11_WO009_MERGED_PR278_RELEASE_GATES_BLOCK_WO010");
  const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-009"];
  assert.equal(completed.status, "OWNER_AUDIT_APPROVED_MERGED");
  assert.equal(completed.implementationPr, 316);
  assert.equal(completed.auditedHead, "a04a6b239ccc81c9662830cd9074c70381c84b4e");
  assert.equal(completed.implementationMerge, "cb6cf5cf4f27d9d717921aa833ee342863f0d172");
  assert.equal(completed.auditIndependence, "NOT_INDEPENDENT");
  assert.equal(completed.codeqlTrackedAlert.state, "fixed");
  assert.equal(completed.sonarCumulativePr278, "FAILURE");
  if (checkpointMd !== "") {
    assert.ok(checkpointMd.includes("### Completed V1.1 increment — WO-009"));
    assert.ok(checkpointMd.includes("V1.1 STOP CONDITION: \`GBS_V11_WO009_MERGED_PR278_RELEASE_GATES_BLOCK_WO010\`"));
  }
}
