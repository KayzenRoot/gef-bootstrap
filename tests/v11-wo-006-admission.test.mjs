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
const lock = json(".engineering/context-locks/GBS-V11-WO-006.json");
const wo = read(".engineering/work-orders/GBS-V11-WO-006.md");
const brief = read(".engineering/execution-briefs/GBS-V11-WO-006-DIRECT.md");

test("V1 production truth remains immutable while WO-006 is admitted", () => {
  assert.equal(checkpoint.status, "GBS_V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.phase, "V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.mainProductionDenominatorWeight, 1088);
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  assert.equal(checkpoint.remainingProductionWeight, 0);
  assert.equal(checkpoint.overallCompletionPercent, 100);
  assert.equal(checkpoint.stopState, "GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088");
});

test("WO-005 objective approval is promoted before WO-006 admission", () => {
  const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-005"];
  assert.equal(completed.status, "OBJECTIVE_AUDIT_APPROVED_MERGED");
  assert.equal(completed.implementationPr, 290);
  assert.equal(completed.auditedHead, "9110dc48d00a9dcfe28aae63cb609235ea174af5");
  assert.equal(completed.objectiveReview, 5291888382);
  assert.equal(completed.implementationMerge, "d20c0499556bbaf1304a88d869bdd2159537df3e");
  assert.equal(completed.criticalFindings, 0);
  assert.equal(completed.highFindings, 0);
  assert.equal(completed.assuranceRuns.executionCapsule, 35869769818);
});

test("WO-006 admission remains provable after objective promotion to later Work Orders", () => {
  const ownerGovernancePromoted = checkpoint.v11.status === 'GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY';
  const match = /^GBS_V11_WO_(\d{3})_ADMITTED$/.exec(checkpoint.v11.status);
  const ordinal = ownerGovernancePromoted ? 8 : match === null ? null : Number.parseInt(match[1], 10);
  assert.ok(Number.isInteger(ordinal) && ordinal >= 6, `unexpected V1.1 state: ${checkpoint.v11.status}`);

  if (ordinal === 6) {
    assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-006");
    assert.equal(checkpoint.v11.activeWorkOrderStatus, "ADMITTED");
    assert.equal(checkpoint.v11.implementationBranch, "feat/1.1/wo-006-incremental-validation");
    assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_006_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH");
  } else {
    const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-006"];
    assert.equal(completed.status, "OBJECTIVE_AUDIT_APPROVED_MERGED");
    assert.equal(completed.implementationPr, 292);
    assert.equal(completed.auditedHead, "e0c58ebec6887f766994c1a1f97b588f1a75706f");
    assert.equal(completed.objectiveReview, 5292197795);
    assert.equal(completed.implementationMerge, "5ceb8c6e77b122fcef50d85a26458fb95b388480");
    assert.equal(completed.criticalFindings, 0);
    assert.equal(completed.highFindings, 0);
    const activeId = String(ordinal).padStart(3, "0");
    assert.equal(checkpoint.v11.activeWorkOrder, `GBS-V11-WO-${activeId}`);
    assert.equal(checkpoint.v11.stopState, ownerGovernancePromoted ? 'GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY' : `GBS_V11_WO_${activeId}_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH`);
    assert.ok(checkpointMd.includes("### Completed V1.1 increment — WO-006"));
  }
});
test("WO-006 owns INC-VAL and preserves proof-reuse ownership for WO-007", () => {
  for (const id of ["INC-VAL-01","INC-VAL-02","INC-VAL-03","INC-VAL-04","INC-VAL-05"]) {
    assert.ok(wo.includes(id), `missing ${id}`);
  }
  assert.ok(wo.includes("WO-007"));
  assert.ok(wo.includes("Do not duplicate") || wo.includes("Do not create another source-to-test selector"));
  assert.ok(wo.includes("STOP CONDITION: `GBS_V11_WO_006_READY_FOR_OBJECTIVE_AUDIT`"));
});

test("WO-006 Context Lock binds exact WO-005 merge and immutable production refs", () => {
  assert.equal(lock.baseSha, "d20c0499556bbaf1304a88d869bdd2159537df3e");
  assert.equal(lock.productionShaAtLock, "72c17bd3e7e421790ac382022b1f0ebbb0275ea4");
  assert.equal(lock.v100TagObjectAtLock, "aac89f9c3f0c884474958025bf14828bc338b5ee");
  assert.equal(lock.v100TagTargetAtLock, "866fe3af8cccc65c929aaf6a47a924401fa448b3");
  assert.equal(lock.implementationBranch, "feat/1.1/wo-006-incremental-validation");
  assert.equal(lock.assurance, "ELEVATED");
  assert.deepEqual(lock.requiredTestIds, ["INC-VAL-01","INC-VAL-02","INC-VAL-03","INC-VAL-04","INC-VAL-05"]);
  assert.ok(lock.forbiddenWriteSurface.includes("WO-007+ implementation"));
  assert.ok(lock.forbiddenWriteSurface.includes("proof reuse eligibility decisions"));
});

test("Direct Execution Brief freezes fail-closed incremental validation rules", () => {
  assert.ok(brief.includes("State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`"));
  assert.ok(brief.includes("No repository-wide rediscovery") || brief.includes("Do not begin with repository-wide discovery"));
  assert.ok(brief.includes("BROWNFIELD_UNPROVEN"));
  assert.ok(brief.includes("L5/finalSweepRequired can never be downgraded"));
  assert.ok(brief.includes("Proof reuse eligibility is NOT decided here"));
  assert.ok(brief.includes("GBS_V11_WO_006_READY_FOR_OBJECTIVE_AUDIT"));
});
