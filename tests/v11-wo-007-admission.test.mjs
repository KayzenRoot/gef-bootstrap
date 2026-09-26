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
const lock = json(".engineering/context-locks/GBS-V11-WO-007.json");
const wo = read(".engineering/work-orders/GBS-V11-WO-007.md");
const brief = read(".engineering/execution-briefs/GBS-V11-WO-007-DIRECT.md");

test("V1 production truth remains immutable while WO-007 is admitted", () => {
  assert.equal(checkpoint.status, "GBS_V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.phase, "V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.mainProductionDenominatorWeight, 1088);
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  assert.equal(checkpoint.remainingProductionWeight, 0);
  assert.equal(checkpoint.overallCompletionPercent, 100);
  assert.equal(checkpoint.stopState, "GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088");
});

test("WO-006 objective approval is promoted before WO-007 admission", () => {
  const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-006"];
  assert.equal(completed.status, "OBJECTIVE_AUDIT_APPROVED_MERGED");
  assert.equal(completed.implementationPr, 292);
  assert.equal(completed.auditedHead, "e0c58ebec6887f766994c1a1f97b588f1a75706f");
  assert.equal(completed.objectiveReview, 5292197795);
  assert.equal(completed.implementationMerge, "5ceb8c6e77b122fcef50d85a26458fb95b388480");
  assert.equal(completed.criticalFindings, 0);
  assert.equal(completed.highFindings, 0);
  assert.equal(completed.assuranceRuns.incrementalValidation, 35872917260);
});

test("WO-007 admission remains provable after objective promotion to later Work Orders", () => {
  const ownerGovernancePending = checkpoint.v11.status === 'GBS_V11_GOV_001_OWNER_POLICY_PENDING_PROMOTION_WO_008_OWNER_AUDIT_NEXT';
  const match = /^GBS_V11_WO_(\d{3})_ADMITTED$/.exec(checkpoint.v11.status);
  const ordinal = ownerGovernancePending ? 8 : match === null ? null : Number.parseInt(match[1], 10);
  assert.ok(Number.isInteger(ordinal) && ordinal >= 7, `unexpected V1.1 state: ${checkpoint.v11.status}`);

  if (ordinal === 7) {
    assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-007");
    assert.equal(checkpoint.v11.activeWorkOrderStatus, "ADMITTED");
    assert.equal(checkpoint.v11.implementationBranch, "feat/1.1/wo-007-proof-reuse");
    assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_007_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH");
  } else {
    const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-007"];
    assert.equal(completed.status, "OBJECTIVE_AUDIT_APPROVED_MERGED");
    assert.equal(completed.implementationPr, 294);
    assert.equal(completed.auditedHead, "5c85b974f8d76dd6ede8fafb9f68b305e3312549");
    assert.equal(completed.objectiveReview, 5292475178);
    assert.equal(completed.implementationMerge, "d5b923f1aaf0c8319fc29285c76bda89a363aadf");
    assert.equal(completed.criticalFindings, 0);
    assert.equal(completed.highFindings, 0);
    const activeId = String(ordinal).padStart(3, "0");
    assert.equal(checkpoint.v11.activeWorkOrder, `GBS-V11-WO-${activeId}`);
    assert.equal(checkpoint.v11.stopState, ownerGovernancePending ? 'GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY' : `GBS_V11_WO_${activeId}_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH`);
    assert.ok(checkpointMd.includes("### Completed V1.1 increment — WO-007"));
  }
});

test("WO-007 owns PROOF-INV while preserving M24/M25/M27 authority", () => {
  for (const id of ["PROOF-INV-01","PROOF-INV-02","PROOF-INV-03","PROOF-INV-04","PROOF-INV-05"]) {
    assert.ok(wo.includes(id), `missing ${id}`);
  }
  assert.ok(wo.includes("M24 remains evidence-acceptance owner"));
  assert.ok(wo.includes("M25 remains general proof-graph owner"));
  assert.ok(wo.includes("M27 remains assurance owner"));
  assert.ok(wo.includes("STOP CONDITION: `GBS_V11_WO_007_READY_FOR_OBJECTIVE_AUDIT`"));
});

test("WO-007 Context Lock binds exact WO-006 merge and immutable production refs", () => {
  assert.equal(lock.baseSha, "5ceb8c6e77b122fcef50d85a26458fb95b388480");
  assert.equal(lock.productionShaAtLock, "72c17bd3e7e421790ac382022b1f0ebbb0275ea4");
  assert.equal(lock.v100TagObjectAtLock, "aac89f9c3f0c884474958025bf14828bc338b5ee");
  assert.equal(lock.v100TagTargetAtLock, "866fe3af8cccc65c929aaf6a47a924401fa448b3");
  assert.equal(lock.implementationBranch, "feat/1.1/wo-007-proof-reuse");
  assert.equal(lock.assurance, "ELEVATED");
  assert.deepEqual(lock.requiredTestIds, ["PROOF-INV-01","PROOF-INV-02","PROOF-INV-03","PROOF-INV-04","PROOF-INV-05"]);
  assert.ok(lock.forbiddenWriteSurface.includes("evidence acceptance"));
  assert.ok(lock.forbiddenWriteSurface.includes("general proof-graph verdict"));
  assert.ok(lock.forbiddenWriteSurface.includes("assurance verdict"));
});

test("Direct Execution Brief freezes fail-closed proof-reuse boundaries", () => {
  assert.ok(brief.includes("State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`"));
  assert.ok(brief.includes("Only `REUSABLE` may suppress"));
  assert.ok(brief.includes("Current failure invalidates"));
  assert.ok(brief.includes("manufacturesProductionCredit:false"));
  assert.ok(brief.includes("L5/final exact-head sweep cannot be suppressed"));
  assert.ok(brief.includes("GBS_V11_WO_007_READY_FOR_OBJECTIVE_AUDIT"));
});
