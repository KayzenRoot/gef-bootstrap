import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");
const json = (path) => JSON.parse(read(path));

const checkpoint = json(".engineering/CHECKPOINT.json");
const checkpointMd = read(".engineering/CHECKPOINT.md");
const lock = json(".engineering/context-locks/GBS-V11-WO-008.json");
const wo = read(".engineering/work-orders/GBS-V11-WO-008.md");
const brief = read(".engineering/execution-briefs/GBS-V11-WO-008-DIRECT.md");

test("V1 production truth remains immutable while WO-008 is admitted", () => {
  assert.equal(checkpoint.status, "GBS_V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.phase, "V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.mainProductionDenominatorWeight, 1088);
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  assert.equal(checkpoint.remainingProductionWeight, 0);
  assert.equal(checkpoint.overallCompletionPercent, 100);
  assert.equal(checkpoint.stopState, "GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088");
});

test("WO-007 objective approval is promoted before WO-008 admission", () => {
  const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-007"];
  assert.equal(completed.status, "OBJECTIVE_AUDIT_APPROVED_MERGED");
  assert.equal(completed.implementationPr, 294);
  assert.equal(completed.auditedHead, "5c85b974f8d76dd6ede8fafb9f68b305e3312549");
  assert.equal(completed.objectiveReview, 5292475178);
  assert.equal(completed.implementationMerge, "d5b923f1aaf0c8319fc29285c76bda89a363aadf");
  assert.equal(completed.criticalFindings, 0);
  assert.equal(completed.highFindings, 0);
  assert.equal(completed.assuranceRuns.proofReuse, 35875616420);
});

test("machine and human checkpoint agree on owner-only governance and WO-008 audit route", () => {
  assert.equal(checkpoint.v11.status, "GBS_V11_GOV_001_OWNER_POLICY_PENDING_PROMOTION_WO_008_OWNER_AUDIT_NEXT");
  assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-008");
  assert.equal(checkpoint.v11.activeWorkOrderStatus, "IMPLEMENTED_PR_OPEN_AWAITING_OWNER_AUDIT");
  assert.equal(checkpoint.v11.implementationBranch, "feat/1.1/wo-008-performance-telemetry");
  assert.equal(checkpoint.v11.contextLock, ".engineering/context-locks/GBS-V11-WO-008.json");
  assert.equal(checkpoint.v11.executionBrief, ".engineering/execution-briefs/GBS-V11-WO-008-DIRECT.md");
  assert.equal(checkpoint.v11.nextLegalAction, "PROMOTE_GBS_V11_GOV_001_THEN_OWNER_AUDIT_PR_296_EXACT_HEAD_C4A108059D5B77BAED43FAA28847828EA1F450A7");
  assert.equal(checkpoint.v11.stopState, "GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY");
  assert.equal(checkpoint.v11.ownerGovernance.ownerAccount, "KayzenRoot");
  assert.equal(checkpoint.v11.ownerGovernance.requiredCollaboratorReview, false);
  assert.equal(checkpoint.v11.ownerGovernance.requiredStatusCheck, undefined);
  assert.equal(checkpoint.v11.ownerGovernance.rulesetSnapshot.requiredApprovingReviewCount, 0);
  assert.equal(checkpoint.v11.ownerGovernance.rulesetSnapshot.requiredStatusCheck, "Repository validation");
  assert.ok(checkpointMd.includes("Collaborator review/approval requirement: `NONE`"));
  assert.ok(checkpointMd.includes("Implementation PR: [#296]"));
  assert.ok(checkpointMd.includes("V1.1 STOP CONDITION: `GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY`"));
});

test("WO-008 owns TELEM and enforces comparability with owner-only merge authority", () => {
  for (const id of ["TELEM-01","TELEM-02","TELEM-03","TELEM-04","TELEM-05","TELEM-06"]) assert.ok(wo.includes(id), `missing ${id}`);
  assert.ok(wo.includes("P1-P8"));
  assert.ok(wo.includes("INCOMPARABLE"));
  assert.ok(wo.includes("optimizationClaimEligible:false"));
  assert.ok(wo.includes("Owner exact-head audit"));
  assert.ok(wo.includes("collaborator approval is not required"));
  assert.ok(wo.includes("STOP CONDITION: `GBS_V11_WO_008_READY_FOR_OWNER_AUDIT_AND_MERGE`"));
});

test("WO-008 Context Lock binds exact WO-007 merge and immutable production refs", () => {
  assert.equal(lock.baseSha, "d5b923f1aaf0c8319fc29285c76bda89a363aadf");
  assert.equal(lock.productionShaAtLock, "72c17bd3e7e421790ac382022b1f0ebbb0275ea4");
  assert.equal(lock.v100TagObjectAtLock, "aac89f9c3f0c884474958025bf14828bc338b5ee");
  assert.equal(lock.v100TagTargetAtLock, "866fe3af8cccc65c929aaf6a47a924401fa448b3");
  assert.equal(lock.implementationBranch, "feat/1.1/wo-008-performance-telemetry");
  assert.equal(lock.assurance, "STANDARD");
  assert.deepEqual(lock.requiredTestIds, ["TELEM-01","TELEM-02","TELEM-03","TELEM-04","TELEM-05","TELEM-06"]);
  assert.ok(lock.requiredOwners.includes("M63 Executor Performance Engine"));
});

test("Direct Execution Brief freezes truthful telemetry boundaries", () => {
  assert.ok(brief.includes("State: `IMPLEMENTED_PR_296_AWAITING_OWNER_AUDIT`"));
  assert.ok(brief.includes("P1-P8 population identity"));
  assert.ok(brief.includes("publish no speedup delta"));
  assert.ok(brief.includes("Unavailable tokens remain"));
  assert.ok(brief.includes("optimizationClaimEligible:false"));
  assert.ok(brief.includes("GBS_V11_WO_008_READY_FOR_OWNER_AUDIT_AND_MERGE"));
});
