// GBS-V11-WO-002 correction V2 — H4: filesystem capability probes must never touch project content.
//
// Probes are capability measurements, not governed effects. Each case seeds a project with
// content at the paths the previous revision used for probing, then runs the probe and both the
// successful and the refused apply path, asserting byte-for-byte preservation and no residue.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { TRANSACTION_PRIVATE_DIRECTORY, applyGovernedCreate, detectCaseSemantics } from "../packages/cli/dist/index.js";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const USER_CASE_PROBE = "ORIGINAL USER CaseProbe CONTENT\n";
const USER_DURABILITY_PROBE = "ORIGINAL USER durability probe CONTENT\n";

function tempRoot(t) {
  const root = mkdtempSync(join(tmpdir(), "gef-probe-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function request(root, relativePath, content, overrides = {}) {
  return {
    targetRoot: root,
    relativePath,
    content,
    contentFingerprint: sha(content),
    runId: "run-probe",
    transactionId: "tx-probe",
    policyRef: "cli:init:managed-write:v1",
    moduleOwner: "m48-m54-maintenance",
    commandId: "gef.init.run",
    ...overrides,
  };
}

/** The exact paths the previous revision probed, seeded as user-owned content. */
function seedUserProbePaths(root) {
  mkdirSync(join(root, TRANSACTION_PRIVATE_DIRECTORY), { recursive: true });
  writeFileSync(join(root, TRANSACTION_PRIVATE_DIRECTORY, "CaseProbe"), USER_CASE_PROBE);
  writeFileSync(join(root, `${TRANSACTION_PRIVATE_DIRECTORY}-durability-probe`), USER_DURABILITY_PROBE);
}

function assertUserContentIntact(root, label) {
  assert.equal(
    readFileSync(join(root, TRANSACTION_PRIVATE_DIRECTORY, "CaseProbe"), "utf8"),
    USER_CASE_PROBE,
    `${label}: a pre-existing .gef-private/CaseProbe must survive byte for byte`,
  );
  assert.equal(
    readFileSync(join(root, `${TRANSACTION_PRIVATE_DIRECTORY}-durability-probe`), "utf8"),
    USER_DURABILITY_PROBE,
    `${label}: a pre-existing durability-probe path must survive byte for byte`,
  );
}

// ------------------------------------------------------------- successful path

test("H4: a successful apply preserves pre-existing probe-path content", async (t) => {
  const root = tempRoot(t);
  seedUserProbePaths(root);

  const semantics = await detectCaseSemantics(root);
  assert.ok(["SENSITIVE", "INSENSITIVE"].includes(semantics), "the probe must still measure the platform");
  assertUserContentIntact(root, "after probing");

  const applied = await applyGovernedCreate(request(root, ".gef/init-state.json", "{}\n", { transactionId: "tx-probe-ok" }));
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);
  assert.ok(existsSync(join(root, ".gef", "init-state.json")), "the governed artifact is still created");
  assertUserContentIntact(root, "after a successful apply");
});

// --------------------------------------------------------------- refused path

test("H4: a refused apply preserves pre-existing probe-path content", async (t) => {
  const root = tempRoot(t);
  seedUserProbePaths(root);
  mkdirSync(join(root, ".gef"), { recursive: true });
  writeFileSync(join(root, ".gef", "init-state.json"), "ALREADY PRESENT\n");

  const refused = await applyGovernedCreate(request(root, ".gef/init-state.json", "{}\n", { transactionId: "tx-probe-refused" }));
  assert.equal(refused.ok, false, "a managed create must not clobber an existing artifact");
  assert.equal(readFileSync(join(root, ".gef", "init-state.json"), "utf8"), "ALREADY PRESENT\n");
  assertUserContentIntact(root, "after a refused apply");
});

// ------------------------------------------------------- residue and ownership

test("H4: probing leaves no residue behind", async (t) => {
  const root = tempRoot(t);
  const semantics = await detectCaseSemantics(root);
  assert.ok(semantics.length > 0);

  const probesRoot = join(root, TRANSACTION_PRIVATE_DIRECTORY, "probes");
  assert.equal(existsSync(probesRoot), false, "a probe directory created only for probing must be removed again");
  const entries = existsSync(join(root, TRANSACTION_PRIVATE_DIRECTORY)) ? readdirSync(join(root, TRANSACTION_PRIVATE_DIRECTORY)) : [];
  assert.deepEqual(entries, [], "no probe artefact may remain in the private area");
});

test("H4: a pre-existing probe directory is reused, never removed", async (t) => {
  const root = tempRoot(t);
  const probesRoot = join(root, TRANSACTION_PRIVATE_DIRECTORY, "probes");
  mkdirSync(probesRoot, { recursive: true });
  const userOwned = join(probesRoot, "user-owned.txt");
  writeFileSync(userOwned, "user owned probe directory\n");

  assert.ok(["SENSITIVE", "INSENSITIVE"].includes(await detectCaseSemantics(root)));

  assert.equal(readFileSync(userOwned, "utf8"), "user owned probe directory\n", "content of a pre-existing probe directory must survive");
  assert.deepEqual(readdirSync(probesRoot), ["user-owned.txt"], "only our own probe directory may be removed");
});

test("H4: a file occupying the probe directory path is preserved and fails closed", async (t) => {
  const root = tempRoot(t);
  mkdirSync(join(root, TRANSACTION_PRIVATE_DIRECTORY), { recursive: true });
  const occupied = join(root, TRANSACTION_PRIVATE_DIRECTORY, "probes");
  writeFileSync(occupied, "user owned file at the probe directory path\n");

  // The probe cannot establish an owned identity, so the measurement fails closed...
  assert.equal(await detectCaseSemantics(root), "UNKNOWN");
  // ...without touching the occupant.
  assert.equal(readFileSync(occupied, "utf8"), "user owned file at the probe directory path\n");

  // ...and the governed mutation refuses rather than proceeding without a capability.
  const applied = await applyGovernedCreate(request(root, ".gef/init-state.json", "{}\n", { transactionId: "tx-probe-occupied" }));
  assert.equal(applied.ok, false);
  assert.ok(!existsSync(join(root, ".gef")), "a refused transaction must leave no target effect");
  assert.equal(readFileSync(occupied, "utf8"), "user owned file at the probe directory path\n");
});

test("H4: a collision-suffixed probe identity is retried until an unused name is owned", async (t) => {
  const root = tempRoot(t);
  // Pre-create the probe parent with several decoys; the probe must still find an unused name.
  const probesRoot = join(root, TRANSACTION_PRIVATE_DIRECTORY, "probes");
  mkdirSync(probesRoot, { recursive: true });
  for (let index = 0; index < 3; index += 1) writeFileSync(join(probesRoot, `decoy-${String(index)}.txt`), "user\n");

  assert.ok(["SENSITIVE", "INSENSITIVE"].includes(await detectCaseSemantics(root)));
  assert.deepEqual(readdirSync(probesRoot).sort(), ["decoy-0.txt", "decoy-1.txt", "decoy-2.txt"], "no decoy may be removed or replaced");
});

test("H4: the durability probe also leaves project content untouched", async (t) => {
  const root = tempRoot(t);
  seedUserProbePaths(root);
  // A transaction exercises the durability probe through atomicFacts and recovery capture.
  const applied = await applyGovernedCreate(request(root, ".gef/init-state.json", "{}\n", { transactionId: "tx-probe-durability" }));
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);
  assertUserContentIntact(root, "after the durability probe ran");
});
