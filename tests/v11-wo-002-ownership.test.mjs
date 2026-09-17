// GBS-V11-WO-002 correction V4 — H9/H10: creation-time ownership for staging and the journal.
//
// Ownership is recorded when this invocation creates an entry and revalidated before it is removed
// or overwritten. These cases exercise the two ways the previous revision could destroy or
// overwrite content it did not own: staging cleanup inferring identity at removal time, and the
// journal truncating whatever occupied its path.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { tmpdir } from "node:os";

import { JOURNAL_DIRECTORY, PRIVATE_DIRECTORY, applyGovernedCreate, createJournalPort, createPrivateArea, fingerprintOf } from "../packages/cli/dist/index.js";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const SENTINEL = "PRE-EXISTING SENTINEL CONTENT\n";

function tempRoot(t, prefix = "gef-own-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function request(root, overrides = {}) {
  const content = "{}\n";
  return {
    targetRoot: root,
    relativePath: ".gef/init-state.json",
    content,
    contentFingerprint: sha(content),
    runId: "run-own",
    transactionId: "tx-own",
    policyRef: "cli:init:managed-write:v1",
    moduleOwner: "m48-m54-maintenance",
    commandId: "gef.init.run",
    purpose: "STATE_INIT",
    ...overrides,
  };
}

function treeEntries(root) {
  const out = [];
  const walk = (current) => {
    const stats = lstatSync(current);
    const rel = relative(root, current).split(sep).join("/");
    if (rel.length > 0) {
      if (stats.isSymbolicLink()) out.push(`${rel}:LINK`);
      else if (stats.isDirectory()) out.push(`${rel}:DIR`);
      else out.push(`${rel}:FILE:${sha(readFileSync(current))}`);
    }
    if (stats.isDirectory() && !stats.isSymbolicLink()) for (const child of readdirSync(current).sort()) walk(join(current, child));
  };
  walk(root);
  return out.sort();
}

/** Create a directory alias with the strongest primitive the host allows. */
function createAlias(target, linkPath) {
  try {
    symlinkSync(target, linkPath, "dir");
    return "symlink";
  } catch (cause) {
    if (cause?.code !== "EPERM" && cause?.code !== "EACCES") throw cause;
  }
  try {
    symlinkSync(target, linkPath, "junction");
    return "junction";
  } catch (cause) {
    return `unavailable:${cause?.code ?? "UNKNOWN"}`;
  }
}

const ALLOW = { authorize: () => ({ ok: true, value: true }) };

// =============================================================== H9: staging

test("H9: a pre-existing empty private directory survives the whole transaction and cleanup", async (t) => {
  const root = tempRoot(t);
  // A pre-existing but empty reserved directory tree: nothing in it belongs to this invocation.
  mkdirSync(join(root, PRIVATE_DIRECTORY, "probes"), { recursive: true });
  assert.deepEqual(readdirSync(join(root, PRIVATE_DIRECTORY)), ["probes"]);

  const applied = await applyGovernedCreate(request(root), { authorization: ALLOW });
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);

  assert.ok(existsSync(join(root, PRIVATE_DIRECTORY)), "the pre-existing private root must survive");
  assert.ok(existsSync(join(root, PRIVATE_DIRECTORY, "probes")), "the pre-existing probe directory must survive");
  assert.deepEqual(readdirSync(join(root, PRIVATE_DIRECTORY, "probes")), [], "no probe residue may be left inside it");
  assert.ok(existsSync(join(root, ".gef", "init-state.json")));
});

test("H9: an invocation-created probe directory is pruned while pre-existing ancestors survive", async (t) => {
  const root = tempRoot(t);
  mkdirSync(join(root, PRIVATE_DIRECTORY, "probes"), { recursive: true });

  const area = createPrivateArea(root);
  const owned = await area.createOwnedProbeDirectory();
  assert.equal(owned.owned, true, "the probe directory is created by this invocation");
  assert.ok(existsSync(owned.path));

  const report = await area.releaseOwnedDirectory(owned, []);
  assert.equal(report.removed, true);
  assert.deepEqual([...report.refusals], []);
  assert.equal(existsSync(owned.path), false, "the owned probe directory is removed");
  assert.ok(existsSync(join(root, PRIVATE_DIRECTORY, "probes")), "a pre-existing parent is never removed, even when empty");
  assert.ok(existsSync(join(root, PRIVATE_DIRECTORY)), "a pre-existing private root is never removed, even when empty");
});

test("H9: a pre-existing empty staging directory is never removed by cleanup", async (t) => {
  const root = tempRoot(t);
  mkdirSync(join(root, PRIVATE_DIRECTORY, "tx-own"), { recursive: true });

  const area = createPrivateArea(root);
  const staging = await area.claimStagingDirectory("tx-own");
  assert.equal(staging.owned, false, "a pre-existing staging path is claimed but never owned");
  assert.ok(existsSync(staging.path));

  const report = await area.releaseOwnedDirectory(staging, []);
  assert.equal(report.removed, false);
  assert.ok(report.refusals.includes("PREEXISTING_DIRECTORY"));
  assert.ok(existsSync(staging.path), "the pre-existing staging directory must survive");
});

test("H9: a staging directory replaced by an ordinary directory before cleanup survives untouched", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);
  const staging = await area.claimStagingDirectory("tx-swap");
  assert.equal(staging.owned, true);

  // Replace the owned directory with a *different ordinary* directory at the same path. A token
  // comparison must catch this exactly like a symlink replacement.
  rmSync(staging.path, { recursive: true, force: true });
  mkdirSync(staging.path, { recursive: true });
  writeFileSync(join(staging.path, "user-content.txt"), SENTINEL);
  const replacementIdentity = lstatSync(staging.path);
  assert.notEqual(`${String(replacementIdentity.dev)}:${String(replacementIdentity.ino)}`, staging.identity);

  const report = await area.releaseOwnedDirectory(staging, []);
  assert.equal(report.removed, false, "an ordinary-directory replacement must not be removed");
  assert.ok(report.refusals.includes("DIRECTORY_IDENTITY_CHANGED"), `expected an identity refusal, got ${report.refusals.join(",")}`);
  assert.equal(readFileSync(join(staging.path, "user-content.txt"), "utf8"), SENTINEL, "the replacement content survives byte for byte");
});

test("H9: a staged file replaced under the same name survives cleanup byte for byte", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);
  const staging = await area.claimStagingDirectory("tx-file");

  const stagePath = join(staging.path, "i1.stage");
  writeFileSync(stagePath, "staged payload\n", { flag: "wx" });
  const ownedFile = await area.captureOwnedFile(stagePath, fingerprintOf("staged payload\n"));
  assert.ok(ownedFile !== undefined, "creation-time ownership must be recordable");

  // Replace the staged file with a different regular file under the same name.
  rmSync(stagePath, { force: true });
  writeFileSync(stagePath, SENTINEL);

  const report = await area.releaseOwnedDirectory(staging, [ownedFile]);
  assert.equal(readFileSync(stagePath, "utf8"), SENTINEL, "the replacement content survives byte for byte");
  assert.ok(
    report.refusals.some((entry) => entry.startsWith("FILE_IDENTITY_CHANGED") || entry.startsWith("FILE_CONTENT_CHANGED")),
    `expected a file ownership refusal, got ${report.refusals.join(",")}`,
  );
  assert.equal(report.removed, false, "a directory holding a foreign file is not removed");
  assert.ok(existsSync(staging.path));
});

test("H9: a staged file whose content changed in place is refused", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);
  const staging = await area.claimStagingDirectory("tx-content");
  const stagePath = join(staging.path, "i1.stage");
  writeFileSync(stagePath, "staged payload\n", { flag: "wx" });
  const ownedFile = await area.captureOwnedFile(stagePath, fingerprintOf("staged payload\n"));

  writeFileSync(stagePath, SENTINEL);

  const report = await area.releaseOwnedDirectory(staging, [ownedFile]);
  assert.equal(readFileSync(stagePath, "utf8"), SENTINEL);
  assert.ok(report.refusals.some((entry) => entry.startsWith("FILE_CONTENT_CHANGED")), `got ${report.refusals.join(",")}`);
});

test("H9: a created parent swapped before ancestor pruning is not removed", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);
  const staging = await area.claimStagingDirectory("tx-prune");
  assert.ok(existsSync(join(root, PRIVATE_DIRECTORY)));

  // Remove the leaf, then swap the created private root for a different ordinary directory.
  rmSync(staging.path, { recursive: true, force: true });
  rmSync(join(root, PRIVATE_DIRECTORY), { recursive: true, force: true });
  mkdirSync(join(root, PRIVATE_DIRECTORY), { recursive: true });
  const swapped = lstatSync(join(root, PRIVATE_DIRECTORY));

  const report = await area.releaseOwnedDirectory(staging, []);
  assert.equal(report.removed, false);
  assert.ok(existsSync(join(root, PRIVATE_DIRECTORY)), "a swapped ancestor is never removed");
  assert.equal(`${String(swapped.dev)}:${String(swapped.ino)}`, `${String(lstatSync(join(root, PRIVATE_DIRECTORY)).dev)}:${String(lstatSync(join(root, PRIVATE_DIRECTORY)).ino)}`);
});

test("H9: a normal transaction removes only the entries it created", async (t) => {
  const root = tempRoot(t);
  mkdirSync(join(root, PRIVATE_DIRECTORY), { recursive: true });
  writeFileSync(join(root, PRIVATE_DIRECTORY, "user-notes.txt"), "user notes\n");

  const applied = await applyGovernedCreate(request(root), { authorization: ALLOW });
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);

  assert.equal(readFileSync(join(root, PRIVATE_DIRECTORY, "user-notes.txt"), "utf8"), "user notes\n");
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY, "tx-own")), false, "transaction-owned staging is removed");
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY, "probes")), false, "the probe directory this invocation created is pruned");
  assert.ok(existsSync(join(root, ".gef", "init-state.json")));
});

test("H9: an alias-swapped staging directory is left alone (existing behaviour preserved)", async (t) => {
  const root = tempRoot(t);
  const external = tempRoot(t, "gef-ext-staging-");
  writeFileSync(join(external, "sentinel.txt"), SENTINEL);

  const area = createPrivateArea(root);
  const staging = await area.claimStagingDirectory("tx-alias");
  rmSync(staging.path, { recursive: true, force: true });
  const created = createAlias(external, staging.path);
  if (created.startsWith("unavailable")) {
    t.diagnostic(`directory alias primitive unavailable on this host: ${created}`);
    return;
  }

  const before = treeEntries(external);
  const report = await area.releaseOwnedDirectory(staging, []);
  assert.equal(report.removed, false);
  assert.deepEqual(treeEntries(external), before, "the external target must be unchanged");
});

// =============================================================== H10: journal

test("H10: a pre-existing journal file is refused and its sentinel survives byte for byte", async (t) => {
  const root = tempRoot(t);
  const journalPath = join(root, PRIVATE_DIRECTORY, "journal", "tx-own.json");
  mkdirSync(join(root, PRIVATE_DIRECTORY, "journal"), { recursive: true });
  writeFileSync(journalPath, SENTINEL);
  const before = readFileSync(journalPath, "utf8");

  const applied = await applyGovernedCreate(request(root), { authorization: ALLOW });
  assert.equal(applied.ok, false, "a pre-existing journal entry must fail the transaction closed");
  assert.ok(
    ["BLOCKED_BEFORE_EFFECT", "ABORTED_STAGED_NO_TARGET_EFFECT"].includes(applied.outcome),
    `expected no target effect, got ${applied.outcome}`,
  );
  assert.equal(readFileSync(journalPath, "utf8"), before, "the pre-existing journal file must be byte-for-byte unchanged");
  assert.ok(!existsSync(join(root, ".gef", "init-state.json")), "no artifact may be promoted");
});

test("H10: a journal file replaced by another regular file between lifecycle writes is refused", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);
  const port = createJournalPort(area);

  const began = await port.begin({ transactionId: "tx-swap", phase: "BEGIN" });
  assert.equal(began.ok, true);
  const journalPath = join(root, PRIVATE_DIRECTORY, "journal", "tx-swap.json");
  assert.ok(existsSync(journalPath));

  // Replace the owned journal file with a different regular file.
  rmSync(journalPath, { force: true });
  writeFileSync(journalPath, SENTINEL);

  const updated = await port.update({ transactionId: "tx-swap", phase: "UPDATE" });
  assert.equal(updated.ok, false, "an update must not overwrite a file this transaction no longer owns");
  assert.equal(updated.error.reasonCode, "gef.integrity.journal_ownership_refused");
  assert.equal(readFileSync(journalPath, "utf8"), SENTINEL, "the replacement survives byte for byte");
});

test("H10: a journal path replaced by an alias between lifecycle writes leaves the external target untouched", async (t) => {
  const root = tempRoot(t);
  const external = tempRoot(t, "gef-ext-journal-");
  writeFileSync(join(external, "journal.json"), SENTINEL);
  const before = treeEntries(external);

  const area = createPrivateArea(root);
  const port = createJournalPort(area);
  assert.equal((await port.begin({ transactionId: "tx-alias", phase: "BEGIN" })).ok, true);

  const journalPath = join(root, PRIVATE_DIRECTORY, "journal", "tx-alias.json");
  rmSync(journalPath, { force: true });
  const created = createAlias(external, journalPath);
  if (created.startsWith("unavailable")) {
    t.diagnostic(`alias primitive unavailable on this host: ${created}`);
    return;
  }

  const updated = await port.update({ transactionId: "tx-alias", phase: "UPDATE" });
  assert.equal(updated.ok, false, "an alias replacement must be refused");
  assert.deepEqual(treeEntries(external), before, "the external target must be untouched");
  assert.equal(readFileSync(join(external, "journal.json"), "utf8"), SENTINEL);
});

test("H10: the normal journal lifecycle writes only to the file this transaction owns", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);
  const port = createJournalPort(area);

  assert.equal((await port.begin({ transactionId: "tx-ok", phase: "BEGIN" })).ok, true);
  assert.equal((await port.update({ transactionId: "tx-ok", phase: "MID" })).ok, true);
  assert.equal((await port.finish({ transactionId: "tx-ok", phase: "FINISH" })).ok, true);

  const journalPath = join(root, PRIVATE_DIRECTORY, "journal", "tx-ok.json");
  const recorded = JSON.parse(readFileSync(journalPath, "utf8"));
  assert.equal(recorded.kind, "gef.cli.transaction-journal");
  assert.equal(recorded.transactionId, "tx-ok");
  assert.equal(recorded.phase, "FINISH");
  assert.deepEqual(readdirSync(join(root, PRIVATE_DIRECTORY, "journal")), ["tx-ok.json"]);
});

test("H10: valid journal evidence survives an aborted transaction when ownership is intact", async (t) => {
  const root = tempRoot(t);
  let calls = 0;
  const authorization = {
    authorize: () => {
      calls += 1;
      // Approve the initial gate, deny at the commit barrier: the transaction has already begun and
      // journaled by then, so the abort must still leave valid evidence behind.
      return calls === 1
        ? { ok: true, value: true }
        : {
            ok: false,
            error: { schemaVersion: 1, id: "t", category: "AUTHORIZATION", reasonCode: "gef.authorization.denied", severity: "ERROR", summary: "denied at the barrier", retryability: "REQUIRES_NEW_AUTHORIZATION", recoverability: "NONE_REQUIRED", effectStatus: "NONE", terminal: "BLOCKED", causes: [], evidenceRefs: [], remediations: [], metadata: {} },
          };
    },
  };

  const applied = await applyGovernedCreate(request(root), { authorization });
  assert.equal(calls, 2);
  assert.equal(applied.ok, false);
  assert.equal(applied.outcome, "ABORTED_STAGED_NO_TARGET_EFFECT");

  const journalPath = join(root, PRIVATE_DIRECTORY, "journal", "tx-own.json");
  assert.ok(existsSync(journalPath), "journal evidence must survive for the aborted transaction");
  const recorded = JSON.parse(readFileSync(journalPath, "utf8"));
  assert.equal(recorded.kind, "gef.cli.transaction-journal");
  assert.equal(recorded.transactionId, "tx-own");
  assert.equal(typeof recorded.phase, "string");
  assert.ok(!existsSync(join(root, ".gef", "init-state.json")), "no artifact may be promoted");
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY, "tx-own")), false, "transaction-owned staging is cleaned up");
});

test("H10: the journal directory is created under the containment-proven private area", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);
  const port = createJournalPort(area);
  assert.equal((await port.begin({ transactionId: "tx-contained", phase: "BEGIN" })).ok, true);
  assert.ok(existsSync(join(root, JOURNAL_DIRECTORY, "tx-contained.json")));
  assert.ok(existsSync(join(root, PRIVATE_DIRECTORY)));
});
