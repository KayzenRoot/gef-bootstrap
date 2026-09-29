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

export function assertLaterActiveWorkOrder(checkpoint, ordinal, ownerGovernancePromoted) {
  if (ordinal === 9) {
    assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-009");
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
