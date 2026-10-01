import test from "node:test";
import assert from "node:assert/strict";
import { assertWo009ContextLockRefreshHandoff, assertWo009BranchReconciliationNote, assertWo009MergedPromotionHandoff, assertWo011CurrentPatch } from "./helpers/v11-context-lock-refresh-assertions.mjs";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");
const json = (path) => JSON.parse(read(path));

const checkpoint = json(".engineering/CHECKPOINT.json");
const checkpointMd = read(".engineering/CHECKPOINT.md");
const lock = json(".engineering/context-locks/GBS-V11-WO-009.json");
const wo = read(".engineering/work-orders/GBS-V11-WO-009.md");
const brief = read(".engineering/execution-briefs/GBS-V11-WO-009-DIRECT.md");
const releasePlan = read(".engineering/releases/V1.1-RELEASE-PLAN.md");

test("WO-008 stays owner-audited and merged while the V1 production baseline stays unchanged", () => {
  assert.equal(checkpoint.status, "GBS_V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.phase, "V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.mainProductionDenominatorWeight, 1088);
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  assert.equal(checkpoint.remainingProductionWeight, 0);
  assert.equal(checkpoint.overallCompletionPercent, 100);
  assert.equal(checkpoint.v11.completedWorkOrders["GBS-V11-WO-008"].implementationMerge, "ed69cc790c599674cc8ba845f3c393cd38964ef1");
  assert.equal(checkpoint.v11.completedWorkOrders["GBS-V11-WO-008"].auditIndependence, "NOT_INDEPENDENT");
  assert.equal(checkpoint.v11.ownerGovernance.requiredCollaboratorReview, false);
});

test("Checkpoint names one admitted V1.1 action with branch and source references", () => {
  if (checkpoint.v11.status === "GBS_V11_WO_011_ADMITTED") {
    assertWo011CurrentPatch(checkpoint);
    assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-011");
    assert.ok(checkpointMd.includes("Current V1.1 release position"));
  } else if (checkpoint.v11.status === "GBS_V11_WO_009_OWNER_AUDIT_APPROVED_MERGED_RELEASE_GATES_NEXT") {
    assertWo009MergedPromotionHandoff(checkpoint, checkpointMd);
    assert.equal(checkpoint.v11.contextLock, ".engineering/context-locks/GBS-V11-WO-009.json");
    assert.equal(checkpoint.v11.executionBrief, ".engineering/execution-briefs/GBS-V11-WO-009-DIRECT.md");
  } else {
  assert.equal(checkpoint.v11.status, "GBS_V11_WO_009_ADMITTED");
  assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-009");
  assert.equal(checkpoint.v11.activeWorkOrderStatus, "ADMITTED");
  assert.equal(checkpoint.v11.nextWorkOrder, "GBS-V11-WO-009");
  assert.equal(checkpoint.v11.implementationBranch, "feat/1.1/wo-009-integrated-assurance");
  assert.equal(checkpoint.v11.contextLock, ".engineering/context-locks/GBS-V11-WO-009.json");
  assert.equal(checkpoint.v11.executionBrief, ".engineering/execution-briefs/GBS-V11-WO-009-DIRECT.md");
  assertWo009ContextLockRefreshHandoff(checkpoint, checkpointMd);
  assert.ok(checkpointMd.includes("### Active V1.1 increment — WO-009"));
  assertWo009BranchReconciliationNote(checkpointMd);
  }
});

test("WO-009 locks integrated assurance and new-context continuation cases", () => {
  for (const id of ["UNIT","INT","CLI-E2E","DIST-SMOKE","UPG-MIG","COMPAT","CTX-DET","INC-VAL","PROOF-INV","TELEM","SEC-INT","REG"]) {
    assert.ok(lock.requiredSuiteIds.includes(id), "missing suite " + id);
  }
  for (const id of ["SEC-INT-01","SEC-INT-06","REG-01","REG-07","CONT-RESUME-01","CONT-RESUME-04","SEC-INT-07"]) {
    assert.ok(lock.requiredTestIds.includes(id), "missing case " + id);
  }
  assert.equal(lock.baseSha, "0172d774719d10ab8d7aab5de9ef0ace2cb5878d");
  assert.equal(lock.productionShaAtLock, "e23311e77d79b84f3c70671072a22a6f8896d13d");
  assert.equal(lock.v100TagTargetAtLock, "866fe3af8cccc65c929aaf6a47a924401fa448b3");
  assert.equal(lock.knownSecurityFinding.checkRunId, 108450457038);
  assert.equal(lock.knownSecurityFinding.severity, "HIGH");
  assert.equal(lock.knownSecurityFinding.requiredDisposition, "identify_and_resolve_before_WO009_final_audit");
  assert.ok(lock.staleIf.some((x) => x.includes("CodeQL")));
  assert.ok(lock.forbiddenWriteSurface.includes("main"));
  assert.ok(lock.forbiddenWriteSurface.includes("tag:v1.0.0"));
});

test("WO-009 preserves owner-operated audit and updates WO-010 wording", () => {
  assert.ok(wo.includes("Collaborator approval is not required"));
  assert.ok(wo.includes("not independent"));
  assert.ok(brief.includes("sole GitHub write, audit and merge account"));
  assert.ok(brief.includes("Never call the owner audit independent"));
  assert.ok(releasePlan.includes("Owner-operated exact-head audit by `KayzenRoot`"));
  assert.ok(releasePlan.includes("not an independent review"));
  assert.equal(releasePlan.includes("Exact-head independent audit"), false);
});

test("fresh-context steering routes governed build work from canonical state", () => {
  assert.ok(wo.includes("one canonical next necessary action"));
  assert.ok(wo.includes("chat history"));
  for (const id of ["CONT-RESUME-01","CONT-RESUME-02","CONT-RESUME-03","CONT-RESUME-04"]) assert.ok(wo.includes(id));
  assert.ok(brief.includes("A new chat reconstructs from canonical repository/provider state"));
});
