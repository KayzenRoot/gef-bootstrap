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
const lock = json(".engineering/context-locks/GBS-V11-WO-005.json");
const wo = read(".engineering/work-orders/GBS-V11-WO-005.md");
const brief = read(".engineering/execution-briefs/GBS-V11-WO-005-DIRECT.md");

test("V1 production truth remains immutable while WO-005 is admitted", () => {
  assert.equal(checkpoint.status, "GBS_V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.phase, "V1_PRODUCTION_ACCEPTED");
  assert.equal(checkpoint.mainProductionDenominatorWeight, 1088);
  assert.equal(checkpoint.earnedProductionWeight, 1088);
  assert.equal(checkpoint.remainingProductionWeight, 0);
  assert.equal(checkpoint.overallCompletionPercent, 100);
  assert.equal(checkpoint.stopState, "GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088");
});

test("WO-004 objective approval is promoted before WO-005 admission", () => {
  const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-004"];
  assert.equal(completed.status, "OBJECTIVE_AUDIT_APPROVED_MERGED");
  assert.equal(completed.implementationPr, 288);
  assert.equal(completed.auditedHead, "03a74d239958c456e1ed63b6cd210699a07f5798");
  assert.equal(completed.objectiveReview, 5291217891);
  assert.equal(completed.implementationMerge, "ab820243b6c44e2ce9c5b747a7a6a4c688d90fed");
  assert.equal(completed.criticalFindings, 0);
  assert.equal(completed.highFindings, 0);
  assert.equal(completed.assuranceRuns.upgradeRecovery, 35862839188);
});

test("legacy ecosystem detachment remains effective before WO-005", () => {
  assert.equal(checkpoint.v11.ecosystemDetachment.decision, "D-0061");
  assert.equal(checkpoint.v11.ecosystemDetachment.adr, "ADR-0005");
  assert.equal(checkpoint.v11.ecosystemDetachment.state, "EFFECTIVE");
  assert.equal(checkpoint.v11.ecosystemDetachment.criticalFindings, 0);
  assert.equal(checkpoint.v11.ecosystemDetachment.highFindings, 0);
});

test("WO-005 admission remains provable after objective promotion to later Work Orders", () => {
  const match = /^GBS_V11_WO_(\d{3})_ADMITTED$/.exec(checkpoint.v11.status);
  const ordinal = match === null ? null : Number.parseInt(match[1], 10);
  assert.ok(Number.isInteger(ordinal) && ordinal >= 5, `unexpected V1.1 state: ${checkpoint.v11.status}`);

  if (ordinal === 5) {
    assert.equal(checkpoint.v11.activeWorkOrder, "GBS-V11-WO-005");
    assert.equal(checkpoint.v11.activeWorkOrderStatus, "ADMITTED");
    assert.equal(checkpoint.v11.implementationBranch, "feat/1.1/wo-005-execution-capsule");
    assert.equal(checkpoint.v11.stopState, "GBS_V11_WO_005_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH");
  } else {
    const completed = checkpoint.v11.completedWorkOrders["GBS-V11-WO-005"];
    assert.equal(completed.status, "OBJECTIVE_AUDIT_APPROVED_MERGED");
    assert.equal(completed.implementationPr, 290);
    assert.equal(completed.auditedHead, "9110dc48d00a9dcfe28aae63cb609235ea174af5");
    assert.equal(completed.objectiveReview, 5291888382);
    assert.equal(completed.implementationMerge, "d20c0499556bbaf1304a88d869bdd2159537df3e");
    assert.equal(completed.criticalFindings, 0);
    assert.equal(completed.highFindings, 0);
    const activeId = String(ordinal).padStart(3, "0");
    assert.equal(checkpoint.v11.activeWorkOrder, `GBS-V11-WO-${activeId}`);
    assert.equal(checkpoint.v11.stopState, `GBS_V11_WO_${activeId}_ADMITTED_READY_FOR_IMPLEMENTATION_BRANCH`);
    assert.ok(checkpointMd.includes("### Completed V1.1 increment — WO-005"));
  }
});
test("WO-005 scope owns CTX-DET and preserves downstream ownership", () => {
  assert.ok(wo.includes("CTX-DET-01"));
  assert.ok(wo.includes("CTX-DET-08"));
  assert.ok(wo.includes("Incremental Validation") || wo.includes("WO-006"));
  assert.ok(wo.includes("Proof Reuse") || wo.includes("WO-007"));
  assert.ok(wo.includes("STOP CONDITION: `GBS_V11_WO_005_READY_FOR_OBJECTIVE_AUDIT`"));
});

test("WO-005 Context Lock binds exact WO-004 merge and immutable production refs", () => {
  assert.equal(lock.baseSha, "ab820243b6c44e2ce9c5b747a7a6a4c688d90fed");
  assert.equal(lock.productionShaAtLock, "72c17bd3e7e421790ac382022b1f0ebbb0275ea4");
  assert.equal(lock.v100TagObjectAtLock, "aac89f9c3f0c884474958025bf14828bc338b5ee");
  assert.equal(lock.v100TagTargetAtLock, "866fe3af8cccc65c929aaf6a47a924401fa448b3");
  assert.equal(lock.implementationBranch, "feat/1.1/wo-005-execution-capsule");
  assert.equal(lock.assurance, "ELEVATED");
  assert.ok(lock.canonicalSources.length >= 16);
  assert.ok(lock.requiredTestIds.includes("CTX-DET-01"));
  assert.ok(lock.requiredTestIds.includes("CTX-DET-08"));
  assert.ok(lock.forbiddenWriteSurface.includes("main"));
  assert.ok(lock.forbiddenWriteSurface.includes("tag:v1.0.0"));
});

test("Direct Execution Brief suppresses rediscovery and freezes fail-closed capsule rules", () => {
  assert.ok(brief.includes("State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`"));
  assert.ok(brief.includes("Do not begin with repository-wide discovery"));
  assert.ok(brief.includes("Same semantic inputs => byte-identical"));
  assert.ok(brief.includes("manufacturesProductionCredit:false"));
  assert.ok(brief.includes("CTX-DET-01"));
  assert.ok(brief.includes("CTX-DET-08"));
  assert.ok(brief.includes("GBS_V11_WO_005_READY_FOR_OBJECTIVE_AUDIT"));
});
