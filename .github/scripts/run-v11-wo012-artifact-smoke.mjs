import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const receiptDirectory = process.env.GEF_RELEASE_RECEIPT_DIR;
assert.ok(receiptDirectory, "workflow must provide the downloaded release receipt directory");
const expectedProductVersion = process.env.GEF_EXPECTED_PRODUCT_VERSION;
assert.equal(expectedProductVersion, "1.1.2", "WO-012 workflow must bind the smoke to the 1.1.2 candidate");
const workOrder = "012";
const receipt = JSON.parse(readFileSync(join(receiptDirectory, `GBS-V11-WO-${workOrder}-RELEASE-MANIFEST.json`), "utf8"));
const tarball = join(receiptDirectory, receipt.tarball.file);
const actualSha256 = createHash("sha256").update(readFileSync(tarball)).digest("hex");
assert.equal(receipt.sourceCommit, process.env.GEF_EXPECTED_SOURCE_COMMIT, "receipt must bind to this exact workflow source");
assert.equal(receipt.event, process.env.GEF_EXPECTED_EVENT, "receipt must bind to this workflow event");
assert.equal(receipt.ref, process.env.GEF_EXPECTED_REF, "receipt must bind to this workflow ref");
assert.equal(receipt.tarball.sha256, actualSha256, "downloaded tarball must match its SHA-256 receipt");
assert.equal(receipt.version, expectedProductVersion);
assert.equal(receipt.packageName, "@gef-bootstrap/cli");

const TIMEOUT_MS = 120_000;
function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", timeout: TIMEOUT_MS, ...options });
}

function npmRun(args, cwd) {
  if (process.platform === "win32") {
    const command = ["npm", ...args].map((part) => part.includes(" ") ? `"${part}"` : part).join(" ");
    return spawnSync(command, { cwd, encoding: "utf8", timeout: TIMEOUT_MS, shell: true });
  }
  return run("npm", args, { cwd });
}

function requireSuccess(result, description) {
  assert.equal(result.error, undefined, `${description} must not time out: ${result.error?.message ?? ""}`);
  assert.equal(result.signal, null, `${description} must not be terminated by a signal`);
  assert.equal(result.status, 0, `${description} must succeed: ${result.stderr ?? ""}`);
}

function sha(value) {
  return createHash("sha256").update(value).digest("hex");
}

function seedV10Project(target) {
  const git = (args) => requireSuccess(run("git", ["-C", target, ...args]), `git ${args.join(" ")}`);
  git(["init", "-q"]);
  git(["config", "user.email", "executor@example.invalid"]);
  git(["config", "user.name", "GEF Executor"]);
  writeFileSync(join(target, "README.md"), "preserve same-artifact migration project\n");
  git(["add", "README.md"]);
  git(["commit", "-qm", "seed"]);

  const runId = "legacy-run-wo012-matrix";
  const planDigest = sha("legacy-plan");
  const state = {
    schemaVersion: "1.0", kind: "gef.init.state", verb: "init", commandId: "gef.init.run",
    contractVersion: "1.0", productVersion: "1.0.0", runId, planDigest,
    observationFingerprint: sha("legacy-observation"), transaction: { planDigest, outcome: "APPLIED" },
  };
  const stateBytes = `${JSON.stringify(state, null, 2)}\n`;
  const receiptBytes = `${JSON.stringify({
    schemaVersion: "1.0", kind: "gef.cli.receipt", runId, commandId: "gef.init.run",
    contractVersion: "1.0", productVersion: "1.0.0", effectStatus: "CONFIRMED",
    lifecyclePhases: ["RECEIVED", "VALIDATING", "PREFLIGHTING", "READY", "EXECUTING", "VERIFYING", "RECEIPTING"],
    resultDigest: sha("legacy-result"),
    transaction: { planDigest: sha("legacy-kernel-plan"), outcome: "APPLIED", receiptDigest: sha("legacy-receipt"), postFingerprint: sha(stateBytes) },
  }, null, 2)}\n`;
  mkdirSync(join(target, ".gef", "receipts"), { recursive: true });
  writeFileSync(join(target, ".gef", "init-state.json"), stateBytes);
  writeFileSync(join(target, ".gef", "receipts", `${runId}.json`), receiptBytes);
  return { stateBytes, receiptBytes };
}

const consumer = mkdtempSync(join(tmpdir(), "gef-wo012-cross-platform-"));
try {
  requireSuccess(npmRun(["init", "-y"], consumer), "isolated consumer npm init");
  requireSuccess(
    npmRun(["install", "--package-lock-only", "--ignore-scripts", "--offline", "--no-audit", "--no-fund", tarball], consumer),
    "lock exact release tarball",
  );
  assert.ok(existsSync(join(consumer, "package-lock.json")), "isolated tarball consumer must have a generated lockfile");
  requireSuccess(npmRun(["ci", "--ignore-scripts", "--offline", "--no-audit", "--no-fund"], consumer), "install locked exact release tarball");

  const cliDirectory = join(consumer, "node_modules", "@gef-bootstrap", "cli");
  const bin = join(cliDirectory, "bin", "gef.mjs");
  assert.ok(existsSync(bin), "installed tarball must provide the gef executable");
  const nativePackage = join(cliDirectory, "node_modules", "@koromix", "koffi-" + process.platform + "-" + process.arch);
  assert.ok(existsSync(join(nativePackage, "package.json")), "installed tarball must include the host Koffi prebuild");
  requireSuccess(
    run(process.execPath, ["-e", "require(process.argv[1])", join(cliDirectory, "node_modules", "koffi")], { cwd: consumer }),
    "load installed Koffi native prebuild without lifecycle scripts",
  );
  const invoke = (args, cwd = consumer) => {
    const result = run(process.execPath, [bin, ...args], { cwd });
    requireSuccess(result, `installed gef ${args.join(" ")}`);
    return result.stdout;
  };

  const help = JSON.parse(invoke(["--help"]));
  assert.ok(help.commands.some((command) => command.id === "gef.init.plan"));
  assert.ok(help.commands.some((command) => command.id === "gef.adopt.preview"));
  assert.ok(help.commands.some((command) => command.id === "gef.upgrade.preview"));
  assert.equal(JSON.parse(invoke(["--version"])).version, expectedProductVersion);
  JSON.parse(invoke(["doctor", "--target", consumer, "--json"]));
  JSON.parse(invoke(["status", "--target", consumer, "--json"]));
  requireSuccess(run(process.execPath, ["--input-type=module", "-e", "import { processExitCodeFor } from '@gef-bootstrap/cli'; if (typeof processExitCodeFor !== 'function') process.exit(1)"], { cwd: consumer }), "installed library import");

  const migrationTarget = mkdtempSync(join(tmpdir(), "gef-wo012-v10-migration-"));
  try {
    const legacy = seedV10Project(migrationTarget);
    const preview = JSON.parse(invoke(["upgrade", "--target", migrationTarget, "--json"])).value;
    assert.equal(preview.commandId, "gef.upgrade.preview");
    assert.equal(preview.preview.readOnly, true);
    assert.equal(preview.preview.compatibility.state, "SUPPORTED");
    const applied = JSON.parse(invoke(["upgrade", "--apply", "--target", migrationTarget, "--json"])).value;
    assert.equal(applied.commandId, "gef.upgrade.apply");
    assert.equal(applied.transaction.outcome, "APPLIED");
    assert.equal(applied.document.sourceVersion, "1.0.0");
    assert.equal(applied.document.targetVersion, expectedProductVersion);
    assert.equal(readFileSync(join(migrationTarget, ".gef", "init-state.json"), "utf8"), legacy.stateBytes);
    assert.equal(readFileSync(join(migrationTarget, ".gef", "receipts", "legacy-run-wo012-matrix.json"), "utf8"), legacy.receiptBytes);
  } finally {
    rmSync(migrationTarget, { recursive: true, force: true });
  }

  requireSuccess(npmRun(["uninstall", "--no-audit", "--no-fund", "@gef-bootstrap/cli"], consumer), "remove installed CLI");
  assert.equal(existsSync(cliDirectory), false, "npm uninstall must remove the installed CLI package");
  console.log(`PASS: ${process.platform}-${process.arch} installed, used, migrated with, and removed tarball sha256=${actualSha256}`);
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
