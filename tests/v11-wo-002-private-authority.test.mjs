// GBS-V11-WO-002 correction V3 — H7: private filesystem authority containment and zero-effect.
//
// The private transaction substrate (probes, staging, journal) is not covered by the kernel
// traversal chain, which only protects the final admitted artifact. These cases prove the private
// area is containment/alias proven, that nothing project-visible is created before authorization,
// and that no alias can redirect a private effect outside the target.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { tmpdir } from "node:os";

import { PRIVATE_DIRECTORY, applyGovernedCreate, createPrivateArea, detectCaseSemantics } from "../packages/cli/dist/index.js";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const SENTINEL = "EXTERNAL SENTINEL CONTENT\n";

function tempRoot(t, prefix = "gef-private-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function request(root, relativePath = ".gef/init-state.json", content = "{}\n", overrides = {}) {
  return {
    targetRoot: root,
    relativePath,
    content,
    contentFingerprint: sha(content),
    runId: "run-private",
    transactionId: "tx-private",
    policyRef: "cli:init:managed-write:v1",
    moduleOwner: "m48-m54-maintenance",
    commandId: "gef.init.run",
    purpose: "STATE_INIT",
    ...overrides,
  };
}

/**
 * Whole-tree identity: every path with its kind, size and content hash. A test that checks only the
 * final `.gef` artifact cannot see a stray directory, so the entire tree is compared.
 */
function treeIdentity(root) {
  const entries = [];
  const walk = (current) => {
    const stats = lstatSync(current);
    const rel = relative(root, current).split(sep).join("/");
    if (rel.length > 0) {
      if (stats.isSymbolicLink()) entries.push(`${rel}:LINK:${sha(readlinkSync(current))}`);
      else if (stats.isDirectory()) entries.push(`${rel}:DIR`);
      else entries.push(`${rel}:FILE:${String(stats.size)}:${sha(readFileSync(current))}`);
    }
    if (stats.isDirectory() && !stats.isSymbolicLink()) for (const child of readdirSync(current).sort()) walk(join(current, child));
  };
  walk(root);
  return entries.sort();
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
const DENY = {
  authorize: () => ({
    ok: false,
    error: { schemaVersion: 1, id: "test", category: "AUTHORIZATION", reasonCode: "gef.authorization.denied", severity: "ERROR", summary: "denied by test", retryability: "REQUIRES_NEW_AUTHORIZATION", recoverability: "NONE_REQUIRED", effectStatus: "NONE", terminal: "BLOCKED", causes: [], evidenceRefs: [], remediations: [], metadata: {} },
  }),
};

// ----------------------------------------------- zero delta before authorization

test("H7: an initial authorization denial produces an exact zero filesystem delta", async (t) => {
  const root = tempRoot(t);
  // A pristine target with pre-existing user content, so the comparison is over a non-trivial tree.
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "app.js"), "// user source\n");
  writeFileSync(join(root, "README.md"), "user readme\n");

  const before = treeIdentity(root);
  const applied = await applyGovernedCreate(request(root), { authorization: DENY });

  assert.equal(applied.ok, false);
  assert.equal(applied.outcome, "BLOCKED_BEFORE_EFFECT");
  assert.equal(applied.error.category, "AUTHORIZATION");
  assert.deepEqual(treeIdentity(root), before, "the tree must be byte-for-byte identical after a pre-authorization denial");

  for (const residue of [PRIVATE_DIRECTORY, ".gef"]) {
    assert.equal(existsSync(join(root, residue)), false, `${residue} must not exist after a pre-authorization denial`);
  }
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY, "probes")), false);
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY, "journal")), false);
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY, "tx-private")), false);
  // Case-semantics measurement is read-only and must not have created anything either.
  assert.ok(["SENSITIVE", "INSENSITIVE"].includes(await detectCaseSemantics(root)));
  assert.deepEqual(treeIdentity(root), before, "the read-only measurement must not create anything");
});

// ------------------------------------------------------- private-root aliasing

test("H7: a pre-existing private-root alias fails closed and leaves the external target untouched", (t) => {
  const root = tempRoot(t);
  const external = tempRoot(t, "gef-external-");
  writeFileSync(join(external, "sentinel.txt"), SENTINEL);
  const externalBefore = treeIdentity(external);

  const created = createAlias(external, join(root, PRIVATE_DIRECTORY));
  if (created.startsWith("unavailable")) {
    t.diagnostic(`directory alias primitive unavailable on this host: ${created}; covered by the Windows/Linux/macOS assurance matrix`);
    return;
  }

  return (async () => {
    const applied = await applyGovernedCreate(request(root), { authorization: ALLOW });
    assert.equal(applied.ok, false, "a private-root alias must not be written through");
    assert.equal(applied.outcome, "BLOCKED_BEFORE_EFFECT");
    assert.match(applied.error.reasonCode, /private_authority_/);
    assert.deepEqual(treeIdentity(external), externalBefore, "the external target must be unchanged");
    assert.ok(!existsSync(join(root, ".gef")), "no governed artifact may be created");
  })();
});

test("H7: a pre-existing probe-subpath alias is refused and never written through", async (t) => {
  const root = tempRoot(t);
  const external = tempRoot(t, "gef-external-probes-");
  writeFileSync(join(external, "sentinel.txt"), SENTINEL);
  const externalBefore = treeIdentity(external);

  mkdirSync(join(root, PRIVATE_DIRECTORY), { recursive: true });
  const created = createAlias(external, join(root, PRIVATE_DIRECTORY, "probes"));
  if (created.startsWith("unavailable")) {
    t.diagnostic(`directory alias primitive unavailable on this host: ${created}`);
    return;
  }

  // Read-only measurement does not need the private area, so it still answers.
  assert.ok(["SENSITIVE", "INSENSITIVE"].includes(await detectCaseSemantics(root)));

  const applied = await applyGovernedCreate(request(root), { authorization: ALLOW });
  assert.equal(applied.ok, false, "a probe-subpath alias must not be written through");
  assert.deepEqual(treeIdentity(external), externalBefore, "the external target must be unchanged");
  assert.ok(!existsSync(join(root, ".gef", "init-state.json")), "no artifact may be promoted");
});

test("H7: a pre-existing journal-subpath alias is refused before any external mutation", async (t) => {
  const root = tempRoot(t);
  const external = tempRoot(t, "gef-external-journal-");
  writeFileSync(join(external, "sentinel.txt"), SENTINEL);
  const externalBefore = treeIdentity(external);

  mkdirSync(join(root, PRIVATE_DIRECTORY), { recursive: true });
  const created = createAlias(external, join(root, PRIVATE_DIRECTORY, "journal"));
  if (created.startsWith("unavailable")) {
    t.diagnostic(`directory alias primitive unavailable on this host: ${created}`);
    return;
  }

  const applied = await applyGovernedCreate(request(root), { authorization: ALLOW });
  assert.equal(applied.ok, false, "a journal-subpath alias must not be written through");
  assert.equal(applied.outcome, "BLOCKED_BEFORE_EFFECT");
  assert.deepEqual(treeIdentity(external), externalBefore, "the external target must be unchanged");
  assert.ok(!existsSync(join(root, ".gef", "init-state.json")));
});

test("H7: a pre-existing staging-subpath alias is refused before any external mutation", async (t) => {
  const root = tempRoot(t);
  const external = tempRoot(t, "gef-external-staging-");
  writeFileSync(join(external, "sentinel.txt"), SENTINEL);
  const externalBefore = treeIdentity(external);

  mkdirSync(join(root, PRIVATE_DIRECTORY), { recursive: true });
  const created = createAlias(external, join(root, PRIVATE_DIRECTORY, "tx-private"));
  if (created.startsWith("unavailable")) {
    t.diagnostic(`directory alias primitive unavailable on this host: ${created}`);
    return;
  }

  const applied = await applyGovernedCreate(request(root), { authorization: ALLOW });
  assert.equal(applied.ok, false, "a staging-subpath alias must not be written through");
  assert.deepEqual(treeIdentity(external), externalBefore, "the external target must be unchanged");
  assert.ok(!existsSync(join(root, ".gef", "init-state.json")));
});

// --------------------------------------------------- ordinary private content

test("H7: user content inside an ordinary private directory is preserved", async (t) => {
  const root = tempRoot(t);
  mkdirSync(join(root, PRIVATE_DIRECTORY), { recursive: true });
  writeFileSync(join(root, PRIVATE_DIRECTORY, "notes.txt"), "user notes\n");
  mkdirSync(join(root, PRIVATE_DIRECTORY, "probes"), { recursive: true });
  writeFileSync(join(root, PRIVATE_DIRECTORY, "probes", "user-file.txt"), "user probe file\n");

  const applied = await applyGovernedCreate(request(root), { authorization: ALLOW });
  assert.equal(applied.ok, true, applied.ok ? "" : applied.error.summary);

  assert.equal(readFileSync(join(root, PRIVATE_DIRECTORY, "notes.txt"), "utf8"), "user notes\n");
  assert.equal(readFileSync(join(root, PRIVATE_DIRECTORY, "probes", "user-file.txt"), "utf8"), "user probe file\n");
  assert.deepEqual(readdirSync(join(root, PRIVATE_DIRECTORY, "probes")), ["user-file.txt"], "no probe residue beside user content");
  assert.ok(existsSync(join(root, ".gef", "init-state.json")));
});

test("H7: an invocation-created private root is removed again when nothing else needs it", async (t) => {
  const root = tempRoot(t);
  // A refusal after the gate still records journal evidence, so the private root legitimately
  // remains; a refusal *before* the gate must leave nothing at all.
  const denied = await applyGovernedCreate(request(root), { authorization: DENY });
  assert.equal(denied.ok, false);
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY)), false, "no private root may survive a pre-gate refusal");
  assert.equal(existsSync(join(root, PRIVATE_DIRECTORY, "probes")), false, "no probe directory may survive");
});

// ---------------------------------------------------------- cleanup identity

test("H7: cleanup revalidates identity and refuses a path swapped to an alias", async (t) => {
  const root = tempRoot(t);
  const external = tempRoot(t, "gef-external-swap-");
  writeFileSync(join(external, "sentinel.txt"), SENTINEL);

  const area = createPrivateArea(root);
  const owned = await area.createOwnedProbeDirectory();
  assert.ok(existsSync(owned.path));
  writeFileSync(join(owned.path, "durability-probe"), "probe");

  // Swap the owned directory for an alias to an external directory after ownership was recorded.
  rmSync(owned.path, { recursive: true, force: true });
  const created = createAlias(external, owned.path);
  if (created.startsWith("unavailable")) {
    t.diagnostic(`directory alias primitive unavailable on this host: ${created}`);
    return;
  }

  const released = await area.releaseOwnedDirectory(owned, ["durability-probe"]);
  assert.equal(released, false, "a swapped identity must not be removed");
  assert.equal(readFileSync(join(external, "sentinel.txt"), "utf8"), SENTINEL, "the external target must survive");
  assert.ok(existsSync(owned.path), "the alias itself is left alone rather than followed");
});

test("H7: containment is proven lexically and physically", async (t) => {
  const root = tempRoot(t);
  const area = createPrivateArea(root);
  await area.assertContainment([PRIVATE_DIRECTORY]);
  await assert.rejects(() => area.assertContainment(["..", "escape"]), /NOT_CONTAINED/);
  await assert.rejects(() => area.assertContainment([PRIVATE_DIRECTORY, "..", "..", "escape"]), /NOT_CONTAINED/);
});
