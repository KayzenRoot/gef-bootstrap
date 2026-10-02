import assert from "node:assert/strict";

const WO012_POST_MERGE_STATE = "GBS_V11_WO_012_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT";
const WO012_ADMITTED_STATE = "GBS_V11_WO_012_ADMITTED";
const WO012_PRODUCTION_ACCEPTED_STATE = "GBS_V11_1_1_2_PRODUCTION_ACCEPTED";

export const isWo012PostMergeCheckpoint = (checkpoint) => checkpoint.v11.status === WO012_POST_MERGE_STATE;
export const isWo012ProductionAcceptedCheckpoint = (checkpoint) => checkpoint.v11.status === WO012_PRODUCTION_ACCEPTED_STATE;

export const wo012CandidateReleaseStatus = (checkpoint) => isWo012ProductionAcceptedCheckpoint(checkpoint)
  ? "PRODUCTION_ACCEPTED"
  : isWo012PostMergeCheckpoint(checkpoint)
    ? "MERGED_AWAITING_PUBLICATION"
    : "PATCH_IN_PROGRESS";

export function laterV11WorkOrderOrdinal(checkpoint) {
  const state = checkpoint.v11.status;
  const admitted = /^GBS_V11_WO_(\d{3})_ADMITTED$/.exec(state);
  if (state === WO012_POST_MERGE_STATE || state === WO012_ADMITTED_STATE || state === WO012_PRODUCTION_ACCEPTED_STATE) return 12;
  if (state === "GBS_V11_WO_011_ADMITTED") return 11;
  if (state === "GBS_V11_WO_009_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT") return 10;
  if (state === "GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY" || state === "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_WO_009_ADMISSION_NEXT") return 8;
  return admitted === null ? null : Number.parseInt(admitted[1], 10);
}

export function isLegalPostFoundationV11State(checkpoint) {
  const status = checkpoint.v11.status;
  const ordinal = laterV11WorkOrderOrdinal(checkpoint);
  return status === "GBS_V11_FOUNDATION_PROMOTED"
    || status === "GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY"
    || status === "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_WO_009_ADMISSION_NEXT"
    || (Number.isInteger(ordinal) && ordinal >= 2 && ordinal <= 12);
}

export function wo012CurrentPatchCheckpoint(checkpoint) {
  const historical = structuredClone(checkpoint);
  historical.v11.status = WO012_ADMITTED_STATE;
  historical.v11.activeWorkOrderStatus = "IMPLEMENTATION_IN_PROGRESS";
  historical.v11.nextLegalAction = "CONTINUE_GBS_V11_WO_012_IMPLEMENTATION_ON_LOCKED_BASE";
  historical.v11.stopState = "GBS_V11_WO_012_IMPLEMENTATION_IN_PROGRESS";
  historical.v11.candidateRelease.status = "PATCH_IN_PROGRESS";
  historical.v11.candidateRelease.stopWhen = "GBS_V11_WO_012_EXACT_HEAD_READY_FOR_OWNER_AUDIT";
  return historical;
}

export const wo012CurrentPatchCheckpointMd = "Current V1.1 release position\nCurrent V1.1 execution state: `GBS_V11_WO_012_ADMITTED`; active Work Order `GBS-V11-WO-012`\nV1.1.2 PATCH_IN_PROGRESS\nGBS_V11_WO_012_EXACT_HEAD_READY_FOR_OWNER_AUDIT";

export function wo012ProductionAcceptedCheckpoint(checkpoint) {
  const accepted = structuredClone(checkpoint);
  const v11 = accepted.v11;
  v11.status = WO012_PRODUCTION_ACCEPTED_STATE;
  v11.activeWorkOrder = "NONE";
  v11.activeWorkOrderStatus = "NONE";
  v11.nextLegalAction = "V1_1_2_PRODUCTION_MAINTENANCE_OR_NEXT_GOVERNED_WORK_ORDER";
  v11.stopState = WO012_PRODUCTION_ACCEPTED_STATE;
  v11.candidateRelease.status = "PRODUCTION_ACCEPTED";
  v11.candidateRelease.stopWhen = WO012_PRODUCTION_ACCEPTED_STATE;
  v11.candidateRelease.tag = "v1.1.2";
  v11.candidateRelease.npmPublished = true;
  v11.stableRelease = {
    ...v11.stableRelease,
    version: "1.1.2",
    status: "PRODUCTION_ACCEPTED",
    tag: "v1.1.2",
    tagObject: "d8241d55231fa1a608546e37f4b178c7695d1fdd",
    tagTarget: "af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82",
    githubReleaseId: 401675074,
    githubReleaseUrl: "https://github.com/KayzenRoot/gef-bootstrap/releases/tag/v1.1.2",
    githubReleasePublishedAt: "2026-10-02T09:10:56Z",
    draft: false,
    prerelease: false,
    npmPackage: "@gef-bootstrap/cli@1.1.2",
    distIntegrity: "sha512-zLu0oaBWqwIPviZgN0PTk1/5QlsHK8r7aCNOkMop0MnlzqFZ1um3zfkRO2l8hx005nd/2xZ/Ll/lDzYUbH01uw==",
    releaseTarballSha256: "331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97",
  };
  return accepted;
}

function assertWo012CandidateReleaseIdentity(candidateRelease) {
  assert.equal(candidateRelease.version, "1.1.2");
  assert.equal(candidateRelease.workOrder, "GBS-V11-WO-012");
  assert.equal(candidateRelease.issue, 361);
  assert.equal(candidateRelease.baseMainSha, "5a32a607ccf2055fab722f3d5d452791c6aae3e6");
  assert.equal(candidateRelease.branch, "hotfix/v1.1.2-release-state-preflight");
  assert.equal(candidateRelease.contextLock, ".engineering/context-locks/GBS-V11-WO-012.json");
  assert.equal(candidateRelease.pullRequest, 362);
  assert.equal(candidateRelease.tag, null);
  assert.equal(candidateRelease.npmPublished, false);
  assert.equal(candidateRelease.registrySmoke, "NOT_RUN");
  assert.equal(candidateRelease.rolloutStarted, false);
}

export function assertWo012Gate2CarryForward(checkpoint) {
  assert.equal(checkpoint.v11.completedWorkOrders["GBS-V11-WO-009"].implementationPr, 316);
  assert.equal(checkpoint.v11.gate2CumulativeIntegration.state, "OWNER_OPTION_B_APPLIED_AWAITING_EXACT_HEAD_REAUDIT");
  assert.equal(checkpoint.v11.gate3Wo010Acceptance.finalProductionAcceptance.status, "PRODUCTION_ACCEPTED");
}

export function assertWo012ReleaseState(checkpoint, checkpointMd) {
  const candidate = checkpoint.v11.candidateRelease;
  assert.equal(candidate.status, wo012CandidateReleaseStatus(checkpoint));
  assert.ok(checkpointMd.includes("Current V1.1 release position"));
  if (isWo012ProductionAcceptedCheckpoint(checkpoint)) {
    assertWo012ProductionAcceptedRelease(checkpoint, checkpointMd);
  } else if (isWo012PostMergeCheckpoint(checkpoint)) {
    assertWo012PostMergeReleaseGates(checkpoint, checkpointMd);
    assert.match(checkpointMd, /V1\.1\.2.*MERGED_AWAITING_PUBLICATION/);
    assert.match(checkpointMd, /GBS_V11_WO_012_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT/);
  } else {
    assertWo012CurrentPatch(checkpoint);
    assert.match(checkpointMd, /V1\.1\.2.*PATCH_IN_PROGRESS/);
    assert.match(checkpointMd, /GBS_V11_WO_012_EXACT_HEAD_READY_FOR_OWNER_AUDIT/);
  }
}

export function assertWo012ReleaseStateIfApplicable(checkpoint, checkpointMd) {
  const status = checkpoint.v11.status;
  if (status !== WO012_POST_MERGE_STATE && status !== WO012_ADMITTED_STATE && status !== WO012_PRODUCTION_ACCEPTED_STATE) return false;
  assertWo012ReleaseState(checkpoint, checkpointMd);
  return true;
}

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
  if (isWo012ProductionAcceptedCheckpoint(checkpoint)) return assertWo012ProductionAcceptedRelease(checkpoint);
  if (isWo012PostMergeCheckpoint(checkpoint)) return assertWo012PostMergeReleaseGates(checkpoint);
  assert.ok(Number.isInteger(ordinal) && ordinal >= minimumOrdinal && ordinal <= 12, `unexpected V1.1 state: ${checkpoint.v11.status}`);
  if (wo008Completed) {
    assert.equal(checkpoint.v11.activeWorkOrder, "NONE");
    assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_READY_FOR_WO_009_ADMISSION");
    return;
  }
  if (ordinal === 10) {
    assertWo009MergedPromotionHandoff(checkpoint, "");
    return;
  }
  if (ordinal === 11) {
    assertWo011CurrentPatch(checkpoint);
    return;
  }
  if (ordinal === 12) {
    assertWo012CurrentPatch(checkpoint);
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

export function assertWo011CurrentPatch(checkpoint) {
  const v11 = checkpoint.v11;
  const candidateRelease = v11.candidateRelease;
  const canonicalizedStopState = "GBS_V11_WO_011_GOVERNANCE_CANONICALIZED_EXACT_HEAD_CHECKS_PENDING";
  const governanceCanonicalized = v11.stopState === canonicalizedStopState;

  assert.equal(v11.status, "GBS_V11_WO_011_ADMITTED");
  assert.equal(v11.activeWorkOrder, "GBS-V11-WO-011");
  assert.equal(v11.activeWorkOrderStatus, "ADMITTED");
  assert.equal(v11.implementationBranch, "hotfix/v1.1.1-adopt-baseline-rollout");
  assert.equal(v11.contextLock, ".engineering/context-locks/GBS-V11-WO-011.json");
  assert.equal(
    v11.stopState,
    governanceCanonicalized
      ? canonicalizedStopState
      : "GBS_V11_WO_011_IMPLEMENTATION_IN_PROGRESS",
  );
  assert.equal(
    v11.nextLegalAction,
    governanceCanonicalized
      ? "RUN_REQUIRED_CHECKS_ON_GBS_V11_WO_011_PR_358_EXACT_HEAD"
      : "CONTINUE_GBS_V11_WO_011_IMPLEMENTATION_ON_LOCKED_BASE",
  );
  assert.equal(v11.nextWorkOrder, "GBS-V11-WO-011");
  assert.equal(v11.activeMaintenanceWorkOrder, "NONE");
  assert.match(v11.wo010Gate, /^PRODUCTION_ACCEPTED:/);
  assert.equal(v11.stableRelease.version, "1.1.0");
  assert.equal(v11.stableRelease.status, "PRODUCTION_ACCEPTED");
  assert.equal(v11.stableRelease.tag, "v1.1.0");
  assert.equal(v11.stableRelease.tagTarget, "fb2a2e6d41086e82ba03f307dc6ada18a52458ea");
  assert.equal(v11.stableRelease.npmPackage, "@gef-bootstrap/cli@1.1.0");
  assert.equal(v11.stableRelease.githubReleaseUrl, "https://github.com/KayzenRoot/gef-bootstrap/releases/tag/v1.1.0");
  assert.equal(v11.stableRelease.distIntegrity, "sha512-Cb4ZGrpIq+WsU9fKkAqCobBFSNvIqb8X4xuphFXi2PZFh2TUxWAGcnpzjeGmwcLatNoYvBvGUIrJOfHOCPh4kg==");
  assert.equal(v11.stableRelease.ownerCloseoutComment, "https://github.com/KayzenRoot/gef-bootstrap/issues/351#issuecomment-5932018102");
  assert.equal(candidateRelease.version, "1.1.1");
  assert.equal(candidateRelease.status, "PATCH_IN_PROGRESS");
  assert.equal(candidateRelease.workOrder, "GBS-V11-WO-011");
  assert.equal(candidateRelease.issue, 357);
  assert.equal(candidateRelease.baseMainSha, "a88a61b7fcae632cdf5b282dc4461592b92cad57");
  assert.equal(candidateRelease.branch, "hotfix/v1.1.1-adopt-baseline-rollout");
  assert.equal(candidateRelease.contextLock, ".engineering/context-locks/GBS-V11-WO-011.json");
  assert.equal(candidateRelease.pullRequest, governanceCanonicalized ? 358 : null);
  assert.equal(candidateRelease.tag, null);
  assert.equal(candidateRelease.npmPublished, false);
  assert.equal(candidateRelease.contextLockSha256, governanceCanonicalized
    ? "E100E0B312A37ACEA67F6B1AF761A96D3DE778A6AC8B2C2789354E9771E381B7"
    : "5ABFFB90ECFE32A23B45F361371603FA6F2A4477883030512856F80B65B10C0B");
  if (governanceCanonicalized) {
    assert.deepEqual(candidateRelease.postProductionPatchRouting, {
      decision: "D-0064",
      adr: "ADR-0009",
      ownerResolution: "https://github.com/KayzenRoot/gef-bootstrap/issues/357#issuecomment-5935855771",
      canonicalizationPr: 358,
      prBase: "main",
      previousHeadChecks: "HISTORICAL_AFTER_GOVERNANCE_COMMIT",
      exactHeadChecks: "PENDING",
      stopWhen: "GBS_V11_WO_011_GOVERNANCE_CANONICALIZED_EXACT_HEAD_READY_FOR_OWNER_AUDIT",
      mergeTagNpmOrRolloutAuthorized: false,
    });
  } else {
    assert.equal(candidateRelease.postProductionPatchRouting, undefined);
  }
  assert.equal(v11.gate3Wo010Acceptance.finalProductionAcceptance.status, "PRODUCTION_ACCEPTED");
  assert.equal(v11.gate3Wo010Acceptance.finalProductionAcceptance.historicalRecoveryEvidencePreserved, true);
}

export function assertWo012CurrentPatch(checkpoint) {
  const v11 = checkpoint.v11;
  const candidateRelease = v11.candidateRelease;
  const publishedV111 = v11.patchHistory.find((release) => release.version === "1.1.1");

  assertWo012CandidateReleaseIdentity(candidateRelease);
  assert.equal(v11.status, "GBS_V11_WO_012_ADMITTED");
  assert.equal(v11.activeWorkOrder, "GBS-V11-WO-012");
  assert.equal(v11.activeWorkOrderStatus, "IMPLEMENTATION_IN_PROGRESS");
  assert.equal(v11.implementationBranch, "hotfix/v1.1.2-release-state-preflight");
  assert.equal(v11.contextLock, ".engineering/context-locks/GBS-V11-WO-012.json");
  assert.equal(v11.nextLegalAction, "CONTINUE_GBS_V11_WO_012_IMPLEMENTATION_ON_LOCKED_BASE");
  assert.equal(v11.stopState, "GBS_V11_WO_012_IMPLEMENTATION_IN_PROGRESS");
  assert.equal(v11.nextWorkOrder, "GBS-V11-WO-012");
  assert.equal(v11.nextCandidateWorkOrder, "NONE");
  assert.equal(v11.activeMaintenanceWorkOrder, "NONE");
  assert.match(v11.wo010Gate, /^PRODUCTION_ACCEPTED:/);
  assert.match(v11.wo010Gate, /WO-012 is the active V1\.1\.2 patch/);

  assert.equal(v11.stableRelease.version, "1.1.0");
  assert.equal(v11.stableRelease.status, "PRODUCTION_ACCEPTED");
  assert.equal(candidateRelease.status, "PATCH_IN_PROGRESS");
  assert.equal(candidateRelease.stopWhen, "GBS_V11_WO_012_EXACT_HEAD_READY_FOR_OWNER_AUDIT");

  assert.ok(publishedV111, "published 1.1.1 release history must remain recorded");
  assert.equal(publishedV111.status, "PUBLISHED_POST_PUBLISH_VERIFICATION_FAILED");
  assert.equal(publishedV111.tag, "v1.1.1");
  assert.equal(publishedV111.tagTarget, "1dc030f1358eab0347043a3d54c7fc311c7c2123");
  assert.equal(publishedV111.priorAdmissionRecord.workOrder, "GBS-V11-WO-011");
  assert.equal(publishedV111.priorAdmissionRecord.issue, 357);
  assert.equal(publishedV111.priorAdmissionRecord.pullRequest, 358);
  assert.equal(publishedV111.priorAdmissionRecord.status, "PATCH_IN_PROGRESS");
}

export function assertWo012PostMergeReleaseGates(checkpoint, checkpointMd = "") {
  const v11 = checkpoint.v11;
  const candidateRelease = v11.candidateRelease;
  const completed = v11.completedWorkOrders["GBS-V11-WO-012"];

  assertWo012CandidateReleaseIdentity(candidateRelease);
  assert.equal(v11.status, "GBS_V11_WO_012_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT");
  assert.equal(v11.activeWorkOrder, "GBS-V11-WO-012");
  assert.equal(v11.activeWorkOrderStatus, "OWNER_AUDIT_APPROVED_MERGED_AWAITING_RELEASE");
  assert.equal(v11.implementationBranch, "hotfix/v1.1.2-release-state-preflight");
  assert.equal(v11.contextLock, ".engineering/context-locks/GBS-V11-WO-012.json");
  assert.equal(v11.executionBrief, ".engineering/work-orders/GBS-V11-WO-012.md");
  assert.equal(v11.nextLegalAction, "CREATE_IMMUTABLE_V1_1_2_TAG_AT_CURRENT_MAIN_AND_OBSERVE_TRUSTED_PUBLISHER");
  assert.equal(v11.nextWorkOrder, "GBS-V11-WO-012");
  assert.equal(v11.nextCandidateWorkOrder, "NONE");
  assert.equal(v11.stopState, "GBS_V11_WO_012_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT");

  assert.equal(candidateRelease.status, "MERGED_AWAITING_PUBLICATION");
  assert.equal(candidateRelease.stopWhen, "GBS_V11_1_1_2_PRODUCTION_ACCEPTED");
  assert.equal(candidateRelease.auditedHead, "ca22282dd6f6891797430451968bc6bf244a28af");
  assert.equal(candidateRelease.ownerAudit, "OWNER_APPROVED_NOT_INDEPENDENT");
  assert.equal(candidateRelease.ownerReview, 5387212864);
  assert.equal(candidateRelease.mergeSha, "4c0f9bdab51e3c831263f7d45d6b5a8ee533dfd5");
  assert.deepEqual(candidateRelease.readyStateChecks, {
    count: 157,
    conclusion: "SUCCESS",
    head: "ca22282dd6f6891797430451968bc6bf244a28af",
  });
  assert.deepEqual(candidateRelease.postMergeMainChecks, {
    head: "4c0f9bdab51e3c831263f7d45d6b5a8ee533dfd5",
    repositoryValidation: "SUCCESS",
    nodeCoverageLcov: "SUCCESS",
    analyzeTypeScript: "SUCCESS",
  });

  assert.equal(completed.status, "OWNER_AUDIT_APPROVED_MERGED");
  assert.equal(completed.implementationPr, 362);
  assert.equal(completed.implementationBranch, "hotfix/v1.1.2-release-state-preflight");
  assert.equal(completed.auditedHead, "ca22282dd6f6891797430451968bc6bf244a28af");
  assert.equal(completed.objectiveAudit, "OWNER_APPROVED");
  assert.equal(completed.auditIndependence, "NOT_INDEPENDENT");
  assert.equal(completed.objectiveReview, 5387212864);
  assert.equal(completed.implementationMerge, "4c0f9bdab51e3c831263f7d45d6b5a8ee533dfd5");
  assert.equal(completed.criticalFindings, 0);
  assert.equal(completed.highFindings, 0);

  if (checkpointMd !== "") {
    assert.ok(checkpointMd.includes("Current V1.1 execution state: `GBS_V11_WO_012_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT`"));
    assert.ok(checkpointMd.includes("Current V1.1 next legal action: `CREATE_IMMUTABLE_V1_1_2_TAG_AT_CURRENT_MAIN_AND_OBSERVE_TRUSTED_PUBLISHER`"));
    assert.ok(checkpointMd.includes("WO-012 post-merge state: owner audit and merge are complete."));
  }
}

export function assertWo012ProductionAcceptedRelease(checkpoint, checkpointMd = "") {
  const v11 = checkpoint.v11;
  const release = v11.stableRelease;
  const candidate = v11.candidateRelease;

  assert.equal(v11.status, WO012_PRODUCTION_ACCEPTED_STATE);
  assert.equal(v11.activeWorkOrder, "NONE");
  assert.equal(v11.activeWorkOrderStatus, "NONE");
  assert.equal(v11.nextLegalAction, "V1_1_2_PRODUCTION_MAINTENANCE_OR_NEXT_GOVERNED_WORK_ORDER");
  assert.equal(v11.stopState, WO012_PRODUCTION_ACCEPTED_STATE);

  assert.equal(candidate.version, "1.1.2");
  assert.equal(candidate.workOrder, "GBS-V11-WO-012");
  assert.equal(candidate.status, "PRODUCTION_ACCEPTED");
  assert.equal(candidate.stopWhen, WO012_PRODUCTION_ACCEPTED_STATE);
  assert.equal(candidate.tag, "v1.1.2");
  assert.equal(candidate.npmPublished, true);
  assert.equal(candidate.rolloutStarted, false);

  assert.equal(release.version, "1.1.2");
  assert.equal(release.status, "PRODUCTION_ACCEPTED");
  assert.equal(release.tag, "v1.1.2");
  assert.equal(release.tagObject, "d8241d55231fa1a608546e37f4b178c7695d1fdd");
  assert.equal(release.tagTarget, "af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82");
  assert.equal(release.githubReleaseId, 401675074);
  assert.equal(release.githubReleaseUrl, "https://github.com/KayzenRoot/gef-bootstrap/releases/tag/v1.1.2");
  assert.equal(release.githubReleasePublishedAt, "2026-10-02T09:10:56Z");
  assert.equal(release.draft, false);
  assert.equal(release.prerelease, false);
  assert.equal(release.npmPackage, "@gef-bootstrap/cli@1.1.2");
  assert.equal(release.distIntegrity, "sha512-zLu0oaBWqwIPviZgN0PTk1/5QlsHK8r7aCNOkMop0MnlzqFZ1um3zfkRO2l8hx005nd/2xZ/Ll/lDzYUbH01uw==");
  assert.equal(release.releaseTarballSha256, "331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97");

  const historicalV111 = v11.patchHistory.find((entry) => entry.version === "1.1.1");
  assert.ok(historicalV111, "published 1.1.1 history must remain recorded");
  assert.equal(historicalV111.status, "PUBLISHED_POST_PUBLISH_VERIFICATION_FAILED");
  assert.equal(historicalV111.tag, "v1.1.1");
  assert.equal(historicalV111.tagTarget, "1dc030f1358eab0347043a3d54c7fc311c7c2123");

  if (checkpointMd !== "") {
    assert.ok(checkpointMd.includes("GBS_V11_1_1_2_PRODUCTION_ACCEPTED"));
    assert.ok(checkpointMd.includes("@gef-bootstrap/cli@1.1.2"));
    assert.ok(checkpointMd.includes("V1.1.0"), "historical V1.1.0 acceptance must remain documented");
  }
}

export function assertWo009MergedPromotionHandoff(checkpoint, checkpointMd) {
  const v11 = checkpoint.v11;
  const closedPr278 = v11.closedCumulativePr278;
  const gate2 = v11.gate2CumulativeIntegration;
  const optionBApproved = gate2?.codecovAcceptanceSemantics?.ownerDecision === "OPTION_B_APPROVED";
  if (optionBApproved) assert.equal(closedPr278?.state, "CLOSED_NOT_MERGED");
  if (closedPr278?.state === "CLOSED_NOT_MERGED") {
    assert.equal(v11.status, "GBS_V11_WO_009_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT");
    assert.equal(v11.activeWorkOrder, "GBS-V11-MAINT-POST-WO009-001");
    assert.equal(v11.activeWorkOrderStatus, "ADMITTED");
    assert.equal(v11.nextWorkOrder, "NONE");
    assert.equal(v11.nextCandidateWorkOrder, "GBS-V11-WO-010");
    assert.equal(
      v11.nextLegalAction,
      optionBApproved
        ? "GBS_V11_RELEASE_ONEPASS_013_GATE2_OPTION_B_APPLIED_READY_FOR_EXACT_HEAD_REAUDIT"
        : "COMPLETE_GBS_V11_RELEASE_ONEPASS_013_GATE2_EXACT_HEAD_PROOF_THEN_OWNER_AUDIT_BEFORE_WO010",
    );
    assert.equal(
      v11.stopState,
      optionBApproved
        ? "GBS_V11_RELEASE_ONEPASS_013_GATE2_OPTION_B_APPLIED_READY_FOR_EXACT_HEAD_REAUDIT"
        : "GBS_V11_RELEASE_ONEPASS_013_GATE2_CUMULATIVE_EXACT_HEAD_READY_FOR_OWNER_AUDIT",
    );
    assert.deepEqual(closedPr278, {
      state: "CLOSED_NOT_MERGED",
      historicalHead: "bbd83a179dd4c11f2f8653251db2b574d0266880",
      historicalBase: "e23311e77d79b84f3c70671072a22a6f8896d13d",
      historicalSonarQualityGate: "FAILURE",
      historicalCodecovPatch: "95.69% against 97.85%; not a current release-tip result",
      diagnosisIssue: 334,
      diagnosisComment: 5894818858,
      lcovDa: "238/238 lines hit",
      lcovBranches: "23/37 hit; 14 unhit branch outcomes across lines 73,83,97,117,139,140,144,159,173,199,203,219,222,232",
      codecovChangedLines: "13 uncovered and one partial (line 139) across the same 14 lines",
      cause: "Line DA coverage was 100%, while Codecov's branch-aware changed-line mapping marked the 14 missed branch outcomes; the exercised pack flow took the success path.",
    });
    assert.deepEqual(v11.issue337, {
      state: "CLOSED_MERGED",
      workOrderProposal: "GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012",
      pullRequest: 349,
      auditedHead: "ab81172a009a699542c63c54d80358226d075ab2",
      ownerReview: 5364744639,
      mergeSha: "4b2f66724ea5df94ddd8fda2d8088b12b9708c10",
    });
    assert.equal(v11.gate1CoverageCorrection.state, "CLOSED_MERGED");
    assert.equal(v11.gate1CoverageCorrection.pullRequest, 349);
    assert.equal(v11.gate1CoverageCorrection.auditedHead, "ab81172a009a699542c63c54d80358226d075ab2");
    assert.equal(v11.gate1CoverageCorrection.mergeSha, "4b2f66724ea5df94ddd8fda2d8088b12b9708c10");
    assert.equal(v11.gate1CoverageCorrection.cumulativeCodecovCredit, "NOT_CREDITED");
    assert.equal(v11.codexOnlyAdoption.actualMergeSha, "9f6f069c977868ade34a19cddb346f7bea9a95fe");
    assert.equal(v11.gate2CumulativeIntegration.issue, 348);
    assert.equal(
      gate2.state,
      optionBApproved ? "OWNER_OPTION_B_APPLIED_AWAITING_EXACT_HEAD_REAUDIT" : "ADMITTED_IN_PROGRESS",
    );
    assert.notEqual(v11.replacementCumulativeReleaseToMainPr, "NONE_FOUND_OPEN_AS_OF_2026-09-29");
    assert.equal(
      v11.wo010Gate,
      optionBApproved
        ? "NOT_ADMITTED until Gate2 owner audit closes: numeric Codecov patch >=97.85% when a numeric denominator exists, or N/A_ZERO_DENOMINATOR only under owner Option B exact-base/head + exact-head LCOV upload SUCCESS + provider patch SUCCESS with zero eligible patch lines/not affected + visible head/project coverage + no weakened coverage semantics + all other required gates green"
        : "NOT_ADMITTED until fresh exact-head cumulative Codecov patch >=97.85%, Sonar, security, ancestry/conflict and merge gates pass",
    );
    if (optionBApproved) {
      assert.equal(v11.nextLegalAction, "GBS_V11_RELEASE_ONEPASS_013_GATE2_OPTION_B_APPLIED_READY_FOR_EXACT_HEAD_REAUDIT");
      assert.equal(gate2.codecovAcceptanceSemantics.numericPatchRule, ">=97.85% when Codecov provides a numeric patch denominator");
      assert.equal(
        gate2.codecovAcceptanceSemantics.zeroDenominatorRule,
        "N/A_ZERO_DENOMINATOR accepted only with exact bound base/head, exact-head LCOV upload SUCCESS, provider patch status SUCCESS, zero eligible patch lines / Patch N/A / Coverage not affected, visible head/project coverage, unchanged threshold/exclusions/coverage definition, no synthetic denominator edits, all other required Gate2 checks green, and owner exact-head audit",
      );
      assert.equal(gate2.codecovAcceptanceSemantics.nAIsNot, "100% or numeric threshold satisfaction");
      assert.equal(gate2.mainMergeAuthorized, false);
      assert.equal(gate2.tagOrPublicationAuthorized, false);
      assert.equal(v11.nextWorkOrder, "NONE");
      assert.equal(v11.nextCandidateWorkOrder, "GBS-V11-WO-010");
    }
    if (checkpointMd !== "") {
      assert.ok(checkpointMd.includes("CLOSED without merge"));
      assert.ok(checkpointMd.includes("Issue [#334 diagnosis]("));
      assert.ok(checkpointMd.includes("14/37 branch outcomes were unhit"));
      assert.ok(checkpointMd.includes("Issue #337"));
      assert.ok(checkpointMd.includes("CLOSED / MERGED through"));
      assert.ok(checkpointMd.includes("WO-010 remains NOT_ADMITTED"));
      assert.ok(checkpointMd.includes(v11.nextLegalAction));
      assert.ok(checkpointMd.includes(">=97.85%"));
    }
  } else {
    assert.equal(v11.status, "GBS_V11_WO_009_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT");
    assert.equal(v11.activeWorkOrder, "GBS-V11-MAINT-POST-WO009-001");
    assert.equal(v11.activeWorkOrderStatus, "ADMITTED");
    assert.equal(v11.nextWorkOrder, "NONE");
    assert.equal(v11.nextCandidateWorkOrder, "GBS-V11-WO-010");
    assert.equal(v11.nextLegalAction, "RESOLVE_PR278_SONAR_AND_MERGE_CONFLICT_UNDER_GBS_V11_MAINT_POST_WO009_001");
    assert.equal(v11.stopState, "GBS_V11_WO009_MERGED_PR278_RELEASE_GATES_BLOCK_WO010");
  }

  const completed = v11.completedWorkOrders["GBS-V11-WO-009"];
  assert.equal(completed.status, "OWNER_AUDIT_APPROVED_MERGED");
  assert.equal(completed.implementationPr, 316);
  assert.equal(completed.auditedHead, "a04a6b239ccc81c9662830cd9074c70381c84b4e");
  assert.equal(completed.implementationMerge, "cb6cf5cf4f27d9d717921aa833ee342863f0d172");
  assert.equal(completed.auditIndependence, "NOT_INDEPENDENT");
  assert.equal(completed.codeqlTrackedAlert.state, "fixed");
  assert.equal(completed.sonarCumulativePr278, "FAILURE");
  if (checkpointMd !== "") {
    assert.ok(checkpointMd.includes("### Completed V1.1 increment — WO-009"));
    if (optionBApproved) {
      assert.ok(checkpointMd.includes("Next legal V1.1 action (`GBS_V11_RELEASE_ONEPASS_013_GATE2_OPTION_B_APPLIED_READY_FOR_EXACT_HEAD_REAUDIT`):"));
    } else {
      const stopState = closedPr278?.state === "CLOSED_NOT_MERGED"
        ? v11.stopState
        : "GBS_V11_WO009_MERGED_PR278_RELEASE_GATES_BLOCK_WO010";
      assert.ok(checkpointMd.includes("V1.1 STOP CONDITION: " + String.fromCharCode(96) + stopState + String.fromCharCode(96)));
    }
  }
}
