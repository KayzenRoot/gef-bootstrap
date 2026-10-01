// GBS-V11-WO-002 correction V5 — H11: a concurrently-created directory is never claimed as owned.
//
// `ensureChain` observed a missing directory, called mkdir, and treated EEXIST as acceptable — but
// then wrote an ownership marker and registered the path as invocation-owned anyway. A directory
// created by another actor in that window could therefore be marked as ours and later removed.
//
// The interleaving is exercised through the private area's `onBeforeCreate` seam, which runs after
// the absence observation and immediately before this invocation's mkdir. That makes the race
// deterministic: no sleep, no timing assumption.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
import { tmpdir } from "node:os";

import { OWNER_MARKER, PRIVATE_DIRECTORY, applyGovernedCreate, createJournalPort, createPrivateArea } from "../packages/cli/dist/index.js";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const SENTINEL = "CONCURRENT CREATOR CONTENT\n";

function tempRoot(t, prefix = "gef-race-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

/** Wins the race for exactly the path whose trailing segment matches `target`. */
function raceFor(target, sideEffect) {
  return (path) => {
    if (path.split(sep).pop() !== target) return;
    mkdirSync(path);
    if (sideEffect !== undefined) sideEffect(path);
  };
}

const ALLOW = { authorize: () => ({ ok: true, value: true }) };

function request(root, overrides = {}) {
  const content = "{}\n";
  return {
    targetRoot: root,
    relativePath: ".gef/init-state.json",
    content,
    contentFingerprint: sha(content),
    runId: "run-race",
    transactionId: "tx-race",
    policyRef: "cli:init:managed-write:v1",
    moduleOwner: "m48-m54-maintenance",
    commandId: "gef.init.run",
    purpose: "STATE_INIT",
    ...overrides,
  };
}

// ------------------------------------------------- the ownership contract

test("H11: a directory created concurrently is claimed as pre-existing, never as owned", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root, { onBeforeCreate: raceFor("tx-race") });

  const staging = await area.claimStagingDirectory("tx-race");
  assert.equal(staging.owned, false, "a directory this invocation did not create is never owned");
  assert.ok(existsSync(staging.path));
});

test("H11: no ownership marker is written into a concurrently-created directory", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root, {
    onBeforeCreate: raceFor("tx-race", (path) => writeFileSync(join(path, "user-content.txt"), SENTINEL)),
  });

  const staging = await area.claimStagingDirectory("tx-race");
  assert.equal(staging.owned, false);
  assert.equal(existsSync(join(staging.path, OWNER_MARKER)), false, "this invocation must not mark another actor's directory");
  assert.equal(readdirSync(staging.path).sort().join(","), "user-content.txt", "only the concurrent creator's content is present");
});

test("H11: cleanup never removes a concurrently-created directory, even when empty", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root, { onBeforeCreate: raceFor("tx-race") });

  const staging = await area.claimStagingDirectory("tx-race");
  const report = await area.releaseOwnedDirectory(staging, []);
  assert.equal(report.removed, false);
  assert.ok(report.refusals.includes("PREEXISTING_DIRECTORY"), `expected PREEXISTING_DIRECTORY, got ${report.refusals.join(",")}`);
  assert.ok(existsSync(staging.path), "the concurrent directory survives cleanup");
});

test("H11: content written by the concurrent creator survives byte for byte", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root, {
    onBeforeCreate: raceFor("tx-race", (path) => writeFileSync(join(path, "user-content.txt"), SENTINEL)),
  });

  const staging = await area.claimStagingDirectory("tx-race");
  const before = readFileSync(join(staging.path, "user-content.txt"), "utf8");
  assert.equal(before, SENTINEL);

  await area.releaseOwnedDirectory(staging, []);
  assert.equal(readFileSync(join(staging.path, "user-content.txt"), "utf8"), SENTINEL, "byte for byte intact after cleanup");
});

test("H11: a concurrently-created probe parent is not marked and is never pruned", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root, { onBeforeCreate: raceFor("probes") });

  const probe = await area.createOwnedProbeDirectory();
  assert.equal(probe.owned, true, "the probe directory itself was created here");
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY, "probes", OWNER_MARKER)), false, "the raced parent must not be marked");

  const report = await area.releaseOwnedDirectory(probe, []);
  assert.equal(report.removed, true, "the owned probe directory is removed");
  assert.ok(existsSync(join(root, PRIVATE_DIRECTORY, "probes")), "the raced parent survives, even though it is now empty");
});

test("H11: a concurrently-created journal directory is not marked and its content survives", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root, {
    onBeforeCreate: raceFor("journal", (path) => writeFileSync(join(path, "user-note.txt"), SENTINEL)),
  });

  const port = createJournalPort(area);
  try {
    assert.equal((await port.begin({ transactionId: "tx-race", phase: "BEGIN" })).ok, true);

    const journalDirectory = join(root, PRIVATE_DIRECTORY, "journal");
    assert.equal(existsSync(join(journalDirectory, OWNER_MARKER)), false, "the raced journal directory must not be marked");
    assert.equal(readFileSync(join(journalDirectory, "user-note.txt"), "utf8"), SENTINEL);
  } finally {
    // Descriptors are released explicitly; the evidence file itself is never removed.
    await port.release();
  }
});

// ------------------------------------------- the normal path still works

test("H11: an invocation-created directory still gets a marker and still prunes", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);

  const staging = await area.claimStagingDirectory("tx-normal");
  assert.equal(staging.owned, true);
  assert.ok(existsSync(join(staging.path, OWNER_MARKER)), "an invocation-created directory carries its ownership marker");
  assert.equal(staging.marker?.path, join(staging.path, OWNER_MARKER));

  const report = await area.releaseOwnedDirectory(staging, []);
  assert.equal(report.removed, true);
  assert.equal(existsSync(staging.path), false, "the owned directory is removed");
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY)), false, "the private root created for it is pruned again");
});

test("H11: a full transaction is unaffected when no race occurs", async (t) => {
  const root = tempRoot(t);
  const applied = await applyGovernedCreate(request(root), { authorization: ALLOW });
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);
  assert.ok(existsSync(join(root, ".gef", "init-state.json")));
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY, "tx-race")), false, "the owned staging directory is removed");
  assert.ok(existsSync(join(root, PRIVATE_DIRECTORY, "journal")), "the journal directory remains as evidence");
});

test("H11: the race does not weaken alias or containment checks", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);
  await assert.rejects(() => area.assertContainment(["..", "escape"]), /NOT_CONTAINED/);

  // A raced symlink is still rejected: the alias check runs before the ownership decision.
  const external = tempRoot(t, "gef-race-ext-");
  const linked = createPrivateArea(root, {
    onBeforeCreate: (path) => {
      if (path.split(sep).pop() !== "tx-race") return;
      try {
        rmSync(path, { recursive: true, force: true });
        symlinkSync(external, path, "junction");
      } catch {
        // The alias primitive is unavailable on this host; the case then simply does not occur.
      }
    },
  });
  const claimed = await linked.claimStagingDirectory("tx-race").catch((cause) => cause);
  if (claimed instanceof Error) {
    assert.match(String(claimed.message), /ALIAS_ANCESTOR|NOT_A_DIRECTORY|PHYSICAL_ESCAPE|UNAVAILABLE/);
  } else {
    assert.equal(claimed.owned, false, "a raced alias is never owned");
  }
  assert.ok(existsSync(external), "the external target is untouched");
});
