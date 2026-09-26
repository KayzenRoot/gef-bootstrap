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
const governanceEvidence = read(".engineering/evidence/GBS-V11-GOV-001-PROMOTION-EVIDENCE.md");
const lock = json(".engineering/context-locks/GBS-V11-WO-008.json");
const wo = read(".engineering/work-orders/GBS-V11-WO-008.md");
const brief = read(".engineering/execution-briefs/GBS-V11-WO-008-DIRECT.md");
const evidence = read(".engineering/evidence/GBS-V11-WO-008-EVIDENCE.md");

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

test("machine and human checkpoint record completed WO-008 and owner-only audit", () => {
  const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-008"];
  assert.equal(checkpoint.v11.status, "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_WO_009_ADMISSION_NEXT");
  assert.equal(checkpoint.v11.activeWorkOrder, "NONE");
  assert.equal(checkpoint.v11.activeWorkOrderStatus, "NONE");
  assert.equal(checkpoint.v11.nextWorkOrder, "GBS-V11-WO-009");
  assert.equal(checkpoint.v11.nextLegalAction, "PLAN_AND_ADMIT_GBS_V11_WO_009");
  assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_READY_FOR_WO_009_ADMISSION");
  assert.equal(completed.status, "OWNER_AUDIT_APPROVED_MERGED");
  assert.equal(completed.implementationPr, 296);
  assert.equal(completed.auditedHead, "c4a108059d5b77baed43faa28847828ea1f450a7");
  assert.equal(completed.objectiveAudit, "OWNER_APPROVED");
  assert.equal(completed.auditIndependence, "NOT_INDEPENDENT");
  assert.equal(completed.objectiveReview, 5848062290);
  assert.equal(completed.implementationMerge, "ed69cc790c599674cc8ba845f3c393cd38964ef1");
  assert.deepEqual(completed.exactHeadChecks, { count: 24, conclusion: "SUCCESS", head: "c4a108059d5b77baed43faa28847828ea1f450a7" });
  assert.equal(checkpoint.v11.ownerGovernance.state, "EFFECTIVE");
  assert.equal(checkpoint.v11.ownerGovernance.requiredCollaboratorReview, false);
  assert.ok(checkpointMd.includes("### Completed V1.1 increment — WO-008"));
  assert.ok(checkpointMd.includes("No WO-009 implementation has started"));
  assert.ok(checkpointMd.includes("Collaborator review/approval requirement: `NONE`"));
  assert.ok(evidence.includes("24/24 SUCCESS"));
  assert.ok(evidence.includes("OWNER_APPROVED"));
});

test("WO-008 owns TELEM and enforces comparability with owner-only merge authority", () => {
  for (const id of ["TELEM-01","TELEM-02","TELEM-03","TELEM-04","TELEM-05","TELEM-06"]) assert.ok(wo.includes(id), `missing ${id}`);
  assert.ok(wo.includes("P1-P8"));
  assert.ok(wo.includes("INCOMPARABLE"));
  assert.ok(wo.includes("optimizationClaimEligible:false"));
  assert.ok(wo.includes("Owner exact-head audit"));
  assert.ok(wo.includes("collaborator approval is not required"));
  assert.ok(wo.includes("Status: `OWNER_AUDIT_APPROVED_MERGED`"));
  assert.ok(wo.includes("STOP CONDITION: `GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_READY_FOR_WO_009_ADMISSION`"));
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
  assert.ok(brief.includes("State: `OWNER_AUDIT_APPROVED_MERGED`"));
  assert.ok(brief.includes("P1-P8 population identity"));
  assert.ok(brief.includes("publish no speedup delta"));
  assert.ok(brief.includes("Unavailable tokens remain"));
  assert.ok(brief.includes("optimizationClaimEligible:false"));
  assert.ok(brief.includes("GBS_V11_WO_008_OWNER_AUDIT_APPROVED_MERGED_READY_FOR_WO_009_ADMISSION"));
});

test("owner-only governance promotion is bound to the exact audit and successful checks", () => {
  assert.equal(checkpoint.v11.ownerGovernance.state, "EFFECTIVE");
  assert.equal(checkpoint.v11.ownerGovernance.promotionPr, 298);
  assert.equal(checkpoint.v11.ownerGovernance.auditedHead, "03f81da4c85fe06310ad4c94a79af20e71747681");
  assert.equal(checkpoint.v11.ownerGovernance.ownerAuditComment, 5847950958);
  assert.equal(checkpoint.v11.ownerGovernance.promotionMerge, "d52dcca0840465324582b022c53b5a12fd0a3840");
  assert.deepEqual(checkpoint.v11.ownerGovernance.exactHeadChecks, {
    count: 30,
    conclusion: "SUCCESS",
    head: "03f81da4c85fe06310ad4c94a79af20e71747681"
  });
  assert.ok(governanceEvidence.includes("30/30 SUCCESS"));
  assert.ok(governanceEvidence.includes("required approving reviews"));
});
