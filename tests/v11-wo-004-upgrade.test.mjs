// GBS-V11-WO-004: upgrade compatibility, preservation and transaction recovery.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, readlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  ADMITTED_MUTATION_BINDINGS,
  DEFAULT_GIT_TRUST_POLICY,
  applyGovernedCreate,
  bindingFor,
  createCliToolObservationPort,
  loadEngines,
  resolveGitToolWith,
  runCli,
} from "../packages/cli/dist/index.js";
import { composeUpgradePreview, UPGRADE_STATE_REF } from "../packages/cli/dist/upgrade.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI_BIN = resolve(ROOT, "packages/cli/bin/gef.mjs");
const PRODUCT_VERSION = "1.1.0";
const TRUSTED_GIT_AVAILABLE = resolveGitToolWith(createCliToolObservationPort(DEFAULT_GIT_TRUST_POLICY)) !== null;
const UPGRADE_POLICY = "cli:upgrade:managed-write:v1";
const UPGRADE_COMMAND = "gef.upgrade.apply";
const sha = (value) => createHash("sha256").update(value).digest("hex");

function tempTarget(t) {
  const target = mkdtempSync(join(tmpdir(), "gef-wo-004-"));
  t.after(() => rmSync(target, { recursive: true, force: true }));
  return target;
}

function git(target, args) {
  const result = spawnSync("git", ["-C", target, ...args], { encoding: "utf8", timeout: 60_000 });
  assert.equal(result.error, undefined, `git ${args.join(" ")} must not time out`);
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout ?? "";
}

function initRepository(target) {
  git(target, ["init", "-q"]);
  git(target, ["config", "user.email", "executor@example.invalid"]);
  git(target, ["config", "user.name", "GEF Executor"]);
  writeFileSync(join(target, "README.md"), "user-owned project\n");
  git(target, ["add", "README.md"]);
  git(target, ["commit", "-qm", "seed project"]);
}

function fixtureState({ verb = "init", runId = "legacy-run-init-001", productVersion = "1.0.0" } = {}) {
  const sourceCommand = verb === "init" ? "gef.init.run" : "gef.adopt.apply";
  const sourceRef = `.gef/${verb}-state.json`;
  const state = {
    schemaVersion: "1.0",
    kind: `gef.${verb}.state`,
    verb,
    commandId: sourceCommand,
    contractVersion: "1.0",
    productVersion,
    runId,
    planDigest: sha(`${runId}:semantic-plan`),
    observationFingerprint: sha(`${runId}:observation`),
    transaction: { planDigest: sha(`${runId}:semantic-plan`), outcome: "APPLIED" },
  };
  const stateBytes = `${JSON.stringify(state, null, 2)}\n`;
  const receipt = {
    schemaVersion: "1.0",
    kind: "gef.cli.receipt",
    runId,
    commandId: sourceCommand,
    contractVersion: "1.0",
    productVersion,
    effectStatus: "CONFIRMED",
    lifecyclePhases: ["RECEIVED", "VALIDATING", "PREFLIGHTING", "READY", "EXECUTING", "VERIFYING", "RECEIPTING"],
    resultDigest: sha(`${runId}:result`),
    transaction: {
      planDigest: sha(`${runId}:kernel-plan`),
      outcome: "APPLIED",
      receiptDigest: sha(`${runId}:apply-receipt`),
      postFingerprint: sha(stateBytes),
    },
  };
  const receiptBytes = `${JSON.stringify(receipt, null, 2)}\n`;
  return { sourceRef, stateBytes, receiptRef: `.gef/receipts/${runId}.json`, receiptBytes };
}

function seedManagedState(target, options = {}) {
  const fixture = fixtureState(options);
  mkdirSync(join(target, ".gef", "receipts"), { recursive: true });
  writeFileSync(join(target, fixture.sourceRef), fixture.stateBytes);
  writeFileSync(join(target, fixture.receiptRef), fixture.receiptBytes);
  return fixture;
}

function gef(args, bin = CLI_BIN) {
  const result = spawnSync(process.execPath, [bin, ...args], { encoding: "utf8", timeout: 90_000 });
  assert.equal(result.error, undefined, `CLI must not fail or time out: ${result.error?.message ?? ""}`);
  assert.equal(result.signal, null, "CLI must not be killed");
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function snapshot(root) {
  const result = [];
  const walk = (directory, prefix = "") => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      const info = lstatSync(path);
      if (info.isSymbolicLink()) result.push([rel, "LINK", readlinkSync(path)]);
      else if (info.isDirectory()) { result.push([rel, "DIR"]); walk(path, rel); }
      else result.push([rel, "FILE", sha(readFileSync(path))]);
    }
  };
  walk(root);
  return result;
}

function inMemoryProject(options = {}) {
  const fixture = fixtureState(options);
  const files = new Map([
    [fixture.sourceRef, Buffer.from(fixture.stateBytes)],
    [fixture.receiptRef, Buffer.from(fixture.receiptBytes)],
  ]);
  return {
    fixture,
    readFile(relativeRef) {
      const bytes = files.get(relativeRef);
      return bytes === undefined ? { status: "ABSENT", bytes: null, limit: null } : { status: "OK", bytes, limit: null };
    },
    write(relativeRef, bytes) { files.set(relativeRef, Buffer.from(bytes)); },
  };
}

function directPreview(project, overrides = {}) {
  return loadEngines().then((engines) => composeUpgradePreview({
    targetRoot: "C:/fixture/project",
    productVersion: PRODUCT_VERSION,
    platform: "linux",
    nodeMajor: 22,
    observationFingerprint: sha("target-observation"),
    repository: { dirtiness: "OBSERVED", input: { repo: "C:/fixture/project", head: "a".repeat(40), branch: "main" }, observationLimits: [] },
    readFile: project.readFile,
    engines,
    ...overrides,
  }));
}

test("UPG-MIG-01: preview is deterministic, read-only and inventories preservation state", { skip: !TRUSTED_GIT_AVAILABLE }, (t) => {
  const target = tempTarget(t);
  initRepository(target);
  const fixture = seedManagedState(target);
  const before = snapshot(target);

  const first = gef(["upgrade", "--target", target, "--json"]);
  assert.equal(first.code, 0, first.stderr);
  const firstValue = JSON.parse(first.stdout).value;
  assert.equal(firstValue.commandId, "gef.upgrade.preview");
  assert.equal(firstValue.effect, "NONE");
  assert.equal(firstValue.preview.readOnly, true);
  assert.equal(firstValue.preview.state.readiness, "READY");
  assert.equal(firstValue.preview.compatibility.state, "SUPPORTED");
  assert.equal(firstValue.preview.planDigest, firstValue.previewDigest);
  assert.equal(firstValue.preview.backup.verified, true);
  assert.equal(firstValue.preview.recovery.backupBytesVerified, true);
  assert.equal(firstValue.preview.recovery.interruptedTransactionAction, "START_FRESH_RUN_ONLY");
  assert.ok(firstValue.preview.inventory.some((entry) => entry.path === fixture.sourceRef && entry.classification === "UNCHANGED"));
  assert.ok(firstValue.preview.inventory.some((entry) => entry.path === UPGRADE_STATE_REF && entry.classification === "GEF_MANAGED_CHANGED"));
  assert.equal(JSON.parse(gef(["upgrade", "--target", target, "--json"]).stdout).value.previewDigest, firstValue.previewDigest);
  assert.deepEqual(snapshot(target), before, "preview must preserve files, private state and Git state");
});

test("UPG-MIG-02: V1.0 to V1.1 apply matches preview digest and preserves source bytes", { skip: !TRUSTED_GIT_AVAILABLE }, (t) => {
  const target = tempTarget(t);
  initRepository(target);
  const fixture = seedManagedState(target);
  const preview = JSON.parse(gef(["upgrade", "--target", target, "--json"]).stdout).value;
  const applied = gef(["upgrade", "--apply", "--target", target, "--json"]);
  assert.equal(applied.code, 0, applied.stderr);
  const value = JSON.parse(applied.stdout).value;
  assert.equal(value.commandId, "gef.upgrade.apply");
  assert.equal(value.transaction.outcome, "APPLIED");
  assert.equal(value.previewDigest, preview.previewDigest);
  assert.equal(value.document.planDigest, preview.previewDigest);
  assert.equal(value.document.sourceVersion, "1.0.0");
  assert.equal(value.document.targetVersion, "1.1.0");
  assert.equal(readFileSync(join(target, fixture.sourceRef), "utf8"), fixture.stateBytes);
  assert.equal(readFileSync(join(target, fixture.receiptRef), "utf8"), fixture.receiptBytes);
  const stateBytes = readFileSync(join(target, UPGRADE_STATE_REF));
  assert.equal(sha(stateBytes), value.transaction.postFingerprint);
  const receipt = JSON.parse(readFileSync(join(target, ".gef", "receipts", `${value.document.runId}.json`), "utf8"));
  assert.equal(receipt.commandId, UPGRADE_COMMAND);
  assert.equal(receipt.transaction.postFingerprint, sha(stateBytes));
});

test("UPG-MIG-03: a forced post-promotion failure is rolled back and reports RECOVERED", async (t) => {
  const target = tempTarget(t);
  const content = "upgrade state for recovery test\n";
  const result = await applyGovernedCreate({
    targetRoot: target,
    relativePath: UPGRADE_STATE_REF,
    content,
    contentFingerprint: sha(content),
    runId: "wo004-recover-complete",
    transactionId: "wo004-recover-complete:upgrade",
    policyRef: UPGRADE_POLICY,
    moduleOwner: "m48-m54-maintenance",
    commandId: UPGRADE_COMMAND,
    purpose: "STATE_UPGRADE",
    automaticRecovery: true,
  }, { failPostStateVerification: true });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "RECOVERED", JSON.stringify(result));
  assert.equal(result.recoveryOutcome, "RESTORED");
  assert.equal(existsSync(join(target, UPGRADE_STATE_REF)), false, "verified rollback must restore the absent pre-state");
});

test("UPG-MIG-04: corrupted rollback material remains RECOVERY_REQUIRED with journal evidence", async (t) => {
  const target = tempTarget(t);
  const content = "upgrade state with invalid recovery material\n";
  const result = await applyGovernedCreate({
    targetRoot: target,
    relativePath: UPGRADE_STATE_REF,
    content,
    contentFingerprint: sha(content),
    runId: "wo004-recover-incomplete",
    transactionId: "wo004-recover-incomplete:upgrade",
    policyRef: UPGRADE_POLICY,
    moduleOwner: "m48-m54-maintenance",
    commandId: UPGRADE_COMMAND,
    purpose: "STATE_UPGRADE",
    automaticRecovery: true,
  }, { failPostStateVerification: true, failRollbackRecoveryVerification: true });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "RECOVERY_REQUIRED");
  assert.equal(result.recoveryOutcome, "RECOVERY_MATERIAL_INVALID");
  assert.equal(existsSync(join(target, UPGRADE_STATE_REF)), true, "the unproven effect is preserved for manual recovery");
  assert.ok(existsSync(join(target, ".gef-private", "journal")), "recovery journal evidence must remain available");
});

test("UPG-MIG-05: USER_MODIFIED managed state is never silently overwritten", { skip: !TRUSTED_GIT_AVAILABLE }, (t) => {
  const modifiedTarget = tempTarget(t);
  initRepository(modifiedTarget);
  seedManagedState(modifiedTarget);
  writeFileSync(join(modifiedTarget, UPGRADE_STATE_REF), "user-owned upgrade document\n");
  const before = snapshot(modifiedTarget);
  const preview = JSON.parse(gef(["upgrade", "--target", modifiedTarget, "--json"]).stdout).value.preview;
  assert.equal(preview.state.readiness, "USER_MODIFIED");
  assert.ok(preview.inventory.some((entry) => entry.path === UPGRADE_STATE_REF && entry.classification === "USER_MODIFIED"));
  assert.notEqual(gef(["upgrade", "--apply", "--target", modifiedTarget, "--json"]).code, 0);
  assert.deepEqual(snapshot(modifiedTarget), before);
});

test("UPG-MIG-06: CONFLICTING managed state escalates and is never automatically resolved", { skip: !TRUSTED_GIT_AVAILABLE }, (t) => {
  const target = tempTarget(t);
  initRepository(target);
  seedManagedState(target);
  seedManagedState(target, { verb: "adopt", runId: "legacy-run-adopt-001" });
  const preview = JSON.parse(gef(["upgrade", "--target", target, "--json"]).stdout).value.preview;
  assert.equal(preview.state.readiness, "CONFLICTING");
  assert.ok(preview.inventory.filter((entry) => entry.path === ".gef/init-state.json" || entry.path === ".gef/adopt-state.json").every((entry) => entry.classification === "CONFLICTING"));
  const before = snapshot(target);
  assert.notEqual(gef(["upgrade", "--apply", "--target", target, "--json"]).code, 0);
  assert.deepEqual(snapshot(target), before);
});

test("UPG-MIG-07: the admitted V1.0 to V1.1 migration row exists and applies", { skip: !TRUSTED_GIT_AVAILABLE }, (t) => {
  const target = tempTarget(t);
  initRepository(target);
  seedManagedState(target);
  const preview = JSON.parse(gef(["upgrade", "--target", target, "--json"]).stdout).value.preview;
  assert.equal(preview.compatibility.state, "SUPPORTED");
  assert.equal(preview.compatibility.row.from, "1.0.0");
  assert.equal(preview.compatibility.row.to, "1.1.0");
  assert.equal(preview.compatibility.row.migrationId, "GEF-UPGRADE-STATE-V1-1");
  const applied = gef(["upgrade", "--apply", "--target", target, "--json"]);
  assert.equal(applied.code, 0, applied.stderr);
  const value = JSON.parse(applied.stdout).value;
  assert.equal(value.document.sourceVersion, "1.0.0");
  assert.equal(value.document.targetVersion, "1.1.0");
  assert.equal(value.document.migrationId, "GEF-UPGRADE-STATE-V1-1");
  assert.equal(value.transaction.outcome, "APPLIED");
});

test("WO004-IDEMPOTENCE: a repeated apply is a no-op and preserves upgraded-state bytes", { skip: !TRUSTED_GIT_AVAILABLE }, (t) => {
  const target = tempTarget(t);
  initRepository(target);
  seedManagedState(target);
  const first = gef(["upgrade", "--apply", "--target", target, "--json"]);
  assert.equal(first.code, 0, first.stderr);
  const stateBefore = readFileSync(join(target, UPGRADE_STATE_REF));
  const second = gef(["upgrade", "--apply", "--target", target, "--json"]);
  assert.equal(second.code, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).value.transaction.outcome, "NOOP_APPLIED");
  assert.equal(readFileSync(join(target, UPGRADE_STATE_REF)).toString("utf8"), stateBefore.toString("utf8"));
});

test("WO004-JOURNAL-ISOLATION: a stale transaction journal cannot authorize another run", async (t) => {
  const retryRoot = tempTarget(t);
  const content = "stale journal must not bind a different run\n";
  const request = {
    targetRoot: retryRoot,
    relativePath: UPGRADE_STATE_REF,
    content,
    contentFingerprint: sha(content),
    runId: "wo004-stale-journal-first",
    transactionId: "wo004-reused-upgrade-transaction",
    policyRef: UPGRADE_POLICY,
    moduleOwner: "m48-m54-maintenance",
    commandId: UPGRADE_COMMAND,
    purpose: "STATE_UPGRADE",
    automaticRecovery: true,
  };
  const recovered = await applyGovernedCreate(request, { failPostStateVerification: true });
  assert.equal(recovered.outcome, "RECOVERED", JSON.stringify(recovered));
  const retry = await applyGovernedCreate({ ...request, runId: "wo004-stale-journal-second" });
  assert.equal(retry.ok, false);
  assert.equal(existsSync(join(retryRoot, UPGRADE_STATE_REF)), false, "another run cannot reuse the stale transaction journal");
});

test("COMPAT-01: an unsupported version pair is UNSUPPORTED and has no mutation eligibility", async () => {
  const project = inMemoryProject({ productVersion: "2.0.0" });
  const result = await directPreview(project);
  assert.equal(result.compatibility, "UNSUPPORTED");
  assert.equal(result.readiness, "UNSUPPORTED");
});

test("COMPAT-02: an unknown blocking dimension is INDETERMINATE and fails closed", async () => {
  const engines = await loadEngines();
  const result = composeUpgradePreview({
    targetRoot: "C:/fixture/unknown",
    productVersion: PRODUCT_VERSION,
    platform: "linux",
    nodeMajor: 22,
    observationFingerprint: sha("unknown-target"),
    repository: { dirtiness: "OBSERVED", input: { repo: "C:/fixture/unknown", head: "a".repeat(40), branch: "main" }, observationLimits: [] },
    readFile: () => ({ status: "ABSENT", bytes: null, limit: null }),
    engines,
  });
  assert.equal(result.compatibility, "INDETERMINATE");
  assert.equal(result.readiness, "INDETERMINATE");
  assert.equal(result.body.state.reason, "SOURCE_STATE_ABSENT");
});

test("COMPAT-03: an unsupported platform is UNSUPPORTED", async () => {
  const project = inMemoryProject();
  const result = await directPreview(project, { platform: "plan9" });
  assert.equal(result.compatibility, "UNSUPPORTED");
  assert.equal(result.readiness, "UNSUPPORTED");
});

test("COMPAT-04: a Node runtime below the declared minimum is UNSUPPORTED", async () => {
  const project = inMemoryProject();
  const result = await directPreview(project, { nodeMajor: 20 });
  assert.equal(result.compatibility, "UNSUPPORTED");
  assert.equal(result.readiness, "UNSUPPORTED");
});

test("COMPAT-05: an absent required trusted-Git capability produces a gap and no bypass", async () => {
  const project = inMemoryProject();
  const result = await directPreview(project, {
    repository: { dirtiness: "UNKNOWN", input: {}, observationLimits: ["TEST_TRUSTED_GIT_CAPABILITY_ABSENT"] },
  });
  assert.equal(result.compatibility, "INDETERMINATE");
  assert.equal(result.readiness, "INDETERMINATE");
  assert.equal(result.body.state.reason, "TRUSTED_GIT_OBSERVATION_UNAVAILABLE");
  assert.ok(result.body.repository.observationLimits.includes("TEST_TRUSTED_GIT_CAPABILITY_ABSENT"));
});

test("COMPAT-06: no VERIFIED compatibility row exists without complete evidence bindings", () => {
  const matrix = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/schemas/gef-cli-upgrade-compatibility-matrix.json"), "utf8"));
  const matrixSchema = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/schemas/gef-cli-upgrade-compatibility-matrix.schema.json"), "utf8"));
  const stateSchema = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/schemas/gef-cli-upgrade-state.schema.json"), "utf8"));
  assert.equal(matrix["$schema"], "https://json-schema.org/draft/2020-12/schema");
  assert.equal(matrixSchema["$schema"], "https://json-schema.org/draft/2020-12/schema");
  assert.equal(stateSchema["$schema"], "https://json-schema.org/draft/2020-12/schema");
  assert.equal(matrix.compatibility.length, 1);
  const requiredIds = [
    ...Array.from({ length: 7 }, (_, i) => `UPG-MIG-0${i + 1}`),
    ...Array.from({ length: 6 }, (_, i) => `COMPAT-0${i + 1}`),
  ];
  for (const row of matrix.compatibility) {
    if (row.evidenceState !== "VERIFIED") continue;
    assert.ok(Array.isArray(row.evidenceRefs) && row.evidenceRefs.length > 0);
    assert.equal(new Set(row.evidenceRefs).size, requiredIds.length);
    for (const id of requiredIds) {
      assert.ok(row.evidenceRefs.includes(`tests/v11-wo-004-upgrade.test.mjs#${id}`), `${id} must bind a VERIFIED row`);
    }
  }
  const manifest = spawnSync(process.execPath, [resolve(ROOT, "packages/cli/scripts/prepare-package.mjs")], { cwd: ROOT, encoding: "utf8", timeout: 180_000 });
  assert.equal(manifest.error, undefined, manifest.error?.message ?? "");
  assert.equal(manifest.status, 0, manifest.stderr);
});

test("WO004-TRUST-BOUNDARY: untrusted Git stays indeterminate and cannot mutate", async (t) => {
  const target = tempTarget(t);
  initRepository(target);
  seedManagedState(target);
  const before = snapshot(target);
  const output = { stdout: "", stderr: "" };
  const result = await runCli({
    argv: ["upgrade", "--target", target, "--json"],
    stdout: (text) => { output.stdout += text; },
    stderr: (text) => { output.stderr += text; },
    env: process.env,
    cwd: target,
    platform: process.platform,
    nodeVersion: process.version,
    architecture: process.arch,
    productVersion: PRODUCT_VERSION,
    stdoutIsTty: false,
    gitExecutablePolicy: { ...DEFAULT_GIT_TRUST_POLICY, policyRef: "test:no-trusted-git", roots: [], candidates: [] },
  });
  assert.equal(result, 0, output.stderr);
  assert.equal(JSON.parse(output.stdout).value.preview.compatibility.state, "INDETERMINATE");
  assert.deepEqual(snapshot(target), before);
  const upgradeBindings = ADMITTED_MUTATION_BINDINGS.filter((entry) => entry.verb === "upgrade");
  assert.equal(upgradeBindings.length, 2);
  assert.equal(bindingFor("gef.upgrade.apply", "STATE_UPGRADE").policyRef, UPGRADE_POLICY);
  assert.equal(bindingFor("gef.upgrade.apply", "RECEIPT_UPGRADE").moduleOwner, "cli.transport");
  if (process.platform === "win32") {
    assert.equal(DEFAULT_GIT_TRUST_POLICY.writeAuthority, "MACHINE_NON_REPLACEABLE");
    assert.ok(DEFAULT_GIT_TRUST_POLICY.candidates.every((candidate) => candidate.startsWith("C:\\Program Files")));
  }
});

test("CI-01: the cross-platform workflow checks out and verifies the exact pull-request head", () => {
  const workflow = readFileSync(join(ROOT, ".github", "workflows", "wo-004-upgrade-recovery.yml"), "utf8");
  const eventHead = "github.event.pull_request.head.sha || github.sha";
  assert.ok(workflow.includes(`WO_EXPECTED_SHA: \${{ ${eventHead} }}`));
  assert.ok(workflow.includes(`ref: \${{ ${eventHead} }}`));
  assert.ok(workflow.includes("$actual -ne $env:WO_EXPECTED_SHA"));
  assert.ok(workflow.includes('= "$WO_EXPECTED_SHA"'));
  assert.ok(workflow.includes(".engineering/evidence/GBS-V11-WO-004-EVIDENCE.md"));
});
