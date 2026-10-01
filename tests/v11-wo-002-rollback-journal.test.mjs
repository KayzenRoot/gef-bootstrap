// GBS-V11-WO-002 correction V5 — H12: the journal handle survives the whole rollback lifecycle.
//
// The port mapped beginRollback/updateRollback/finishRollback to one internal phase and closed the
// owned handle whenever it saw that phase. `beginRollback` therefore closed the descriptor, and the
// next `updateRollback` tried a fresh exclusive claim of the already-existing journal file and was
// refused — escalating recovery over a journaling artefact rather than a real recovery defect.
//
// These cases drive the real certified rollback engine (`rollbackTransaction`), not isolated port
// calls, so the three-step lifecycle and its journal authority are exercised as the kernel uses them.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { applyTransaction, compileTransactionPlan, createFilesystemEffectAdapter, rollbackTransaction } from "../packages/kernel/dist/index.js";
import { createJournalPort, createPhysicalPort, createPrivateArea, createStatePort, detectCaseSemantics, fingerprintOf } from "../packages/cli/dist/index.js";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const SENTINEL = "REPLACEMENT SENTINEL CONTENT\n";
const TARGET_REF = ".gef/init-state.json";
const POLICY = "cli:init:managed-write:v1";

function tempRoot(t, prefix = "gef-rollback-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

/** The same plan shape the CLI drivers compile. */
function planBody(root, content) {
  return {
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: `target:${root}`, bindingStrength: "OPERATIONAL_ONLY" },
    expectedPreState: [{ key: TARGET_REF, owner: "m48-m54-maintenance", predicate: "EXACT", value: "absent", contractVersion: "cli-tx-v1" }],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: [POLICY],
    mutationSurface: [TARGET_REF],
    intents: [
      {
        intentId: "i1",
        kind: "CREATE_MANAGED_ARTIFACT",
        targetRef: TARGET_REF,
        securityClass: "S1_MANAGED_WRITE",
        recoveryClass: "REVERSIBLE_MANAGED",
        dependsOn: [],
        desiredFingerprint: sha(content),
        payloadRef: TARGET_REF,
      },
    ],
    ordering: [],
    verificationObligations: [
      { verificationId: "v1", phase: "STAGED", targetRef: TARGET_REF },
      { verificationId: "v2", phase: "POST_STATE", targetRef: TARGET_REF },
    ],
    recoveryRequirements: [{ intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "cli-managed-create-v1" }],
    externalEffectDeclarations: [],
    policyRefs: [{ policyId: POLICY, version: "1" }],
  };
}

const digest = { digest: (canonicalValue) => sha(canonicalValue) };
const authorization = { authorize: () => ({ ok: true, value: true }) };

/** Apply for real, then return everything a rollback needs — including the shared journal port. */
async function appliedFixture(root, content = "{}\n", transactionId = "tx-rb") {
  const caseSemantics = await detectCaseSemantics(root);
  const privateArea = createPrivateArea(root);
  const journal = createJournalPort(privateArea);
  const physical = createPhysicalPort({
    targetRoot: root,
    rootRef: `target:${root}`,
    transactionId,
    caseSemantics,
    privateArea,
    payloads: new Map([[TARGET_REF, content]]),
    policyRef: POLICY,
  });
  const effects = createFilesystemEffectAdapter({
    transactionId,
    resolver: {
      resolve: () => ({
        ok: true,
        value: {
          target: {
            root: {
              rootRef: `target:${root}`,
              rootKind: "project-directory",
              physicalRoot: root,
              pathFlavor: process.platform === "win32" ? "WINDOWS" : "POSIX",
              caseSemantics,
              allowedOperations: ["READ", "CREATE", "STAGE"],
              policyRef: POLICY,
              pathSemanticsRef: `cli:${process.platform}:v1`,
            },
            relativePath: TARGET_REF,
            expected: { expectedKind: "ABSENT" },
          },
          payloadRef: TARGET_REF,
          desiredFingerprint: sha(content),
        },
      }),
    },
    physical,
  });

  const compiled = compileTransactionPlan(planBody(root, content), digest);
  assert.equal(compiled.ok, true, compiled.ok ? "" : compiled.error.summary);
  const ports = { digest, state: createStatePort(root, TARGET_REF), authorization, journal, effects };
  const applied = await applyTransaction({ plan: compiled.value, runId: "run-rb", transactionId, authorizationRefs: [POLICY], ports });
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);
  return { ports, plan: compiled.value, journal, transactionId, receipt: applied.receipt };
}

function journalPath(root, transactionId) {
  return join(root, ".gef-private", "journal", `${transactionId}.json`);
}

// ------------------------------------------------ the certified rollback path

test("H12: the certified rollback runs begin -> update -> finish against one owned journal file", async (t) => {
  const root = tempRoot(t);
  const fixture = await appliedFixture(root);
  assert.ok(existsSync(join(root, TARGET_REF)));

  // Model the restore target already being absent: the rollback engine then journals the
  // ALREADY_RESTORED path, which is exactly the updateRollback leg.
  rmSync(join(root, TARGET_REF));

  const rollback = await rollbackTransaction({ plan: fixture.plan, applyReceipt: fixture.receipt, recoveryRunId: "rb-1", ports: fixture.ports });

  assert.notEqual(rollback.outcome, "RECOVERY_ESCALATION_REQUIRED", `rollback must not escalate over journal ownership (got ${rollback.outcome})`);
  assert.deepEqual(
    rollback.effectResults.map((entry) => entry.outcome),
    ["ALREADY_RESTORED"],
    "the updateRollback leg must have been reached and journaled successfully",
  );

  const recorded = JSON.parse(readFileSync(journalPath(root, fixture.transactionId), "utf8"));
  assert.equal(recorded.phase, "ROLLBACK_FINISH", "the terminal rollback phase is recorded");
  assert.equal(recorded.snapshot.phase, "ROLLBACK_RECEIPTING");
  assert.equal(recorded.snapshot.terminalOutcome, rollback.outcome);
  await fixture.journal.release();
});

test("H12: the journal file identity is unchanged across both lifecycles", async (t) => {
  const root = tempRoot(t);
  const fixture = await appliedFixture(root, "{}\n", "tx-identity");
  const path = journalPath(root, "tx-identity");

  const afterApply = readFileSync(path, "utf8");
  assert.match(afterApply, /"phase": "APPLY_FINISH"/);

  rmSync(join(root, TARGET_REF));
  const rollback = await rollbackTransaction({ plan: fixture.plan, applyReceipt: fixture.receipt, recoveryRunId: "rb-2", ports: fixture.ports });
  assert.notEqual(rollback.outcome, "RECOVERY_ESCALATION_REQUIRED");

  const afterRollback = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(afterRollback.transactionId, "tx-identity", "the rollback wrote the transaction's own journal file");
  assert.equal(afterRollback.phase, "ROLLBACK_FINISH");
  await fixture.journal.release();
});

test("H12: a replacement between rollback updates is refused and the replacement survives", async (t) => {
  const root = tempRoot(t);
  const fixture = await appliedFixture(root, "{}\n", "tx-swap-rb");
  const path = journalPath(root, "tx-swap-rb");

  rmSync(join(root, TARGET_REF));

  // Replace the journal file after beginRollback has claimed its handle but before any update.
  const racing = {
    ...fixture.journal,
    beginRollback: async (snapshot) => {
      const begun = await fixture.journal.beginRollback(snapshot);
      rmSync(path, { force: true });
      writeFileSync(path, SENTINEL);
      return begun;
    },
  };

  const rollback = await rollbackTransaction({
    plan: fixture.plan,
    applyReceipt: fixture.receipt,
    recoveryRunId: "rb-3",
    ports: { ...fixture.ports, journal: racing },
  });

  assert.equal(rollback.outcome, "RECOVERY_ESCALATION_REQUIRED", "a genuinely failed journal update must escalate");
  assert.equal(readFileSync(path, "utf8"), SENTINEL, "the replacement survives byte for byte");
  await fixture.journal.release();
});

test("H12: a second rollback lifecycle reuses the same owned authority without double-claiming", async (t) => {
  const root = tempRoot(t);
  const fixture = await appliedFixture(root, "{}\n", "tx-repeat");
  rmSync(join(root, TARGET_REF));

  const first = await rollbackTransaction({ plan: fixture.plan, applyReceipt: fixture.receipt, recoveryRunId: "rb-a", ports: fixture.ports });
  assert.notEqual(first.outcome, "RECOVERY_ESCALATION_REQUIRED");

  const second = await rollbackTransaction({ plan: fixture.plan, applyReceipt: fixture.receipt, recoveryRunId: "rb-b", ports: fixture.ports });
  assert.notEqual(second.outcome, "RECOVERY_ESCALATION_REQUIRED", "reopening the owned journal must not fail as ALREADY_PRESENT");

  const recorded = JSON.parse(readFileSync(journalPath(root, "tx-repeat"), "utf8"));
  assert.equal(recorded.phase, "ROLLBACK_FINISH");
  await fixture.journal.release();
});

test("H12: apply and rollback phases are distinct in the recorded evidence", async (t) => {
  const root = tempRoot(t);
  const fixture = await appliedFixture(root, "{}\n", "tx-phases");
  const path = journalPath(root, "tx-phases");

  assert.equal(JSON.parse(readFileSync(path, "utf8")).phase, "APPLY_FINISH");

  rmSync(join(root, TARGET_REF));
  await rollbackTransaction({ plan: fixture.plan, applyReceipt: fixture.receipt, recoveryRunId: "rb-c", ports: fixture.ports });
  assert.equal(JSON.parse(readFileSync(path, "utf8")).phase, "ROLLBACK_FINISH");

  // The transaction still has exactly one journal evidence file, written by both lifecycles.
  const evidence = readdirSync(join(root, ".gef-private", "journal")).filter((name) => name.endsWith(".json"));
  assert.deepEqual(evidence, ["tx-phases.json"]);
  await fixture.journal.release();
});

test("H12: releasing outstanding descriptors never removes journal evidence", async (t) => {
  const root = tempRoot(t);
  const fixture = await appliedFixture(root, "{}\n", "tx-release");
  const path = journalPath(root, "tx-release");

  await fixture.journal.release();
  assert.ok(existsSync(path), "evidence survives the descriptor release");
  assert.equal(JSON.parse(readFileSync(path, "utf8")).phase, "APPLY_FINISH");
  assert.equal(fingerprintOf(readFileSync(path, "utf8")).length, 64);
});
