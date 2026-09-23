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

test("UPG-MIG-05: user-modified and conflicting managed state is never overwritten", { skip: !TRUSTED_GIT_AVAILABLE }, (t) => {
  const modifiedTarget = tempTarget(t);
  initRepository(modifiedTarget);
  seedManagedState(modifiedTarget);
  writeFileSync(join(modifiedTarget, UPGRADE_STATE_REF), "user-owned upgrade document\n");
  const modifiedBefore = snapshot(modifiedTarget);
  const modifiedPreview = JSON.parse(gef(["upgrade", "--target", modifiedTarget, "--json"]).stdout).value.preview;
  assert.equal(modifiedPreview.state.readiness, "USER_MODIFIED");
  assert.ok(modifiedPreview.inventory.some((entry) => entry.path === UPGRADE_STATE_REF && entry.classification === "USER_MODIFIED"));
  assert.notEqual(gef(["upgrade", "--apply", "--target", modifiedTarget, "--json"]).code, 0);
  assert.deepEqual(snapshot(modifiedTarget), modifiedBefore);

  const conflictTarget = tempTarget(t);
  initRepository(conflictTarget);
  seedManagedState(conflictTarget);
  seedManagedState(conflictTarget, { verb: "adopt", runId: "legacy-run-adopt-001" });
  const conflict = JSON.parse(gef(["upgrade", "--target", conflictTarget, "--json"]).stdout).value.preview;
  assert.equal(conflict.state.readiness, "CONFLICTING");
  assert.ok(conflict.inventory.filter((entry) => entry.path === ".gef/init-state.json" || entry.path === ".gef/adopt-state.json").every((entry) => entry.classification === "CONFLICTING"));
  const beforeApply = snapshot(conflictTarget);
  assert.notEqual(gef(["upgrade", "--apply", "--target", conflictTarget, "--json"]).code, 0);
  assert.deepEqual(snapshot(conflictTarget), beforeApply);
});

test("UPG-MIG-06: a repeated apply is idempotent and preserves the upgraded state bytes", { skip: !TRUSTED_GIT_AVAILABLE }, (t) => {
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

test("UPG-MIG-07: a stale transaction journal cannot authorize another run", async (t) => {
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

test("COMPAT-01: the evidence-bound 1.0.0 to 1.1.0 row is supported on Windows, Linux and macOS", async () => {
  const project = inMemoryProject();
  for (const platform of ["win32", "linux", "darwin"]) {
    const result = await directPreview(project, { platform });
    assert.equal(result.compatibility, "SUPPORTED", platform);
    assert.equal(result.readiness, "READY", platform);
    assert.equal(result.body.compatibility.row.from, "1.0.0");
    assert.equal(result.body.compatibility.row.to, "1.1.0");
    assert.equal(result.body.compatibility.row.evidenceState, "VERIFIED");
  }
});

test("COMPAT-02: unsupported version pairs are explicit and have no apply eligibility", async () => {
  const project = inMemoryProject({ productVersion: "2.0.0" });
  const result = await directPreview(project);
  assert.equal(result.compatibility, "UNSUPPORTED");
  assert.equal(result.readiness, "UNSUPPORTED");
});

test("COMPAT-03: unsupported platform and Node runtime fail closed", async () => {
  const project = inMemoryProject();
  const platform = await directPreview(project, { platform: "plan9" });
  const runtime = await directPreview(project, { nodeMajor: 20 });
  assert.equal(platform.compatibility, "UNSUPPORTED");
  assert.equal(platform.readiness, "UNSUPPORTED");
  assert.equal(runtime.compatibility, "UNSUPPORTED");
  assert.equal(runtime.readiness, "UNSUPPORTED");
});

test("COMPAT-04: missing matrix row or required capability never becomes SUPPORTED", async () => {
  const project = inMemoryProject();
  const gitUnknown = await directPreview(project, { repository: { dirtiness: "UNKNOWN", input: {}, observationLimits: ["TEST_GIT_UNAVAILABLE"] } });
  assert.equal(gitUnknown.compatibility, "INDETERMINATE");
  assert.equal(gitUnknown.readiness, "INDETERMINATE");
  const emptyState = inMemoryProject({ verb: "init" });
  const noState = await loadEngines().then((engines) => composeUpgradePreview({
    targetRoot: "C:/fixture/empty",
    productVersion: PRODUCT_VERSION,
    platform: "linux",
    nodeMajor: 22,
    observationFingerprint: sha("empty"),
    repository: { dirtiness: "OBSERVED", input: { repo: "C:/fixture/empty", head: "b".repeat(40), branch: "main" }, observationLimits: [] },
    readFile: () => ({ status: "ABSENT", bytes: null, limit: null }),
    engines,
  }));
  assert.equal(noState.compatibility, "INDETERMINATE");
  assert.equal(noState.readiness, "INDETERMINATE");
  assert.equal(noState.body.recovery.interruptedTransactionAction, "START_FRESH_RUN_ONLY");

  const modified = inMemoryProject();
  modified.write(modified.fixture.sourceRef, `${modified.fixture.stateBytes}user edit\n`);
  const userModified = await directPreview(modified);
  assert.equal(userModified.readiness, "USER_MODIFIED");
  assert.ok(userModified.body.inventory.some((entry) => entry.path === modified.fixture.sourceRef && entry.classification === "USER_MODIFIED"));

  const conflicting = inMemoryProject();
  const adopt = fixtureState({ verb: "adopt", runId: "legacy-run-adopt-memory" });
  conflicting.write(adopt.sourceRef, adopt.stateBytes);
  conflicting.write(adopt.receiptRef, adopt.receiptBytes);
  const conflict = await directPreview(conflicting);
  assert.equal(conflict.readiness, "CONFLICTING");
  assert.equal(conflict.compatibility, "SUPPORTED");

  const incomplete = inMemoryProject();
  const upgradeState = {
    schemaVersion: "1.0", kind: "gef.upgrade.state", commandId: UPGRADE_COMMAND,
    contractVersion: "1.0", productVersion: PRODUCT_VERSION, sourceVersion: "1.0.0", targetVersion: PRODUCT_VERSION,
    migrationId: "GEF-UPGRADE-STATE-V1-1", runId: "upgrade-run-incomplete", sourceRef: incomplete.fixture.sourceRef,
    sourceFingerprint: sha(incomplete.fixture.stateBytes), sourceReceiptFingerprint: sha(incomplete.fixture.receiptBytes),
    planDigest: sha("committed-upgrade-plan"), observationFingerprint: sha("committed-upgrade-observation"),
    transaction: { planDigest: sha("committed-upgrade-plan"), outcome: "APPLIED" },
  };
  incomplete.write(UPGRADE_STATE_REF, `${JSON.stringify(upgradeState, null, 2)}\n`);
  const recoveryRequired = await directPreview(incomplete);
  assert.equal(recoveryRequired.readiness, "RECOVERY_REQUIRED");
  assert.equal(recoveryRequired.body.inventory.find((entry) => entry.path === UPGRADE_STATE_REF).classification, "RECOVERY_REQUIRED");
  assert.ok(emptyState.fixture);
});

test("COMPAT-05: schemas are 2020-12, row evidence IDs map all required cases, and packaged hashes are reproducible", async () => {
  const matrix = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/schemas/gef-cli-upgrade-compatibility-matrix.json"), "utf8"));
  const matrixSchema = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/schemas/gef-cli-upgrade-compatibility-matrix.schema.json"), "utf8"));
  const stateSchema = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/schemas/gef-cli-upgrade-state.schema.json"), "utf8"));
  assert.equal(matrix["$schema"], "https://json-schema.org/draft/2020-12/schema");
  assert.equal(matrixSchema["$schema"], "https://json-schema.org/draft/2020-12/schema");
  assert.equal(stateSchema["$schema"], "https://json-schema.org/draft/2020-12/schema");
  assert.equal(matrix.compatibility.length, 1);
  const row = matrix.compatibility[0];
  assert.equal(row.evidenceState, "VERIFIED");
  assert.equal(new Set(row.evidenceRefs).size, 13);
  for (const id of [...Array.from({ length: 7 }, (_, i) => `UPG-MIG-0${i + 1}`), ...Array.from({ length: 6 }, (_, i) => `COMPAT-0${i + 1}`)]) {
    assert.ok(row.evidenceRefs.includes(`tests/v11-wo-004-upgrade.test.mjs#${id}`), `${id} must be bound into the verified row`);
  }
  const manifest = spawnSync(process.execPath, [resolve(ROOT, "packages/cli/scripts/prepare-package.mjs")], { cwd: ROOT, encoding: "utf8", timeout: 180_000 });
  assert.equal(manifest.error, undefined, manifest.error?.message ?? "");
  assert.equal(manifest.status, 0, manifest.stderr);
});

test("COMPAT-06: untrusted Git is indeterminate and the Windows machine-write policy stays strict", async (t) => {
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
