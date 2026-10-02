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
  assert.equal(candidateRelease.version, "1.1.2");
  assert.equal(candidateRelease.status, "PATCH_IN_PROGRESS");
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
