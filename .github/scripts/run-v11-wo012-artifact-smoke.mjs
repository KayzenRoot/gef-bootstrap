import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const receiptRoot = process.env.GEF_RELEASE_RECEIPT_DIR;
const expectedProductVersion = process.env.GEF_EXPECTED_PRODUCT_VERSION;
assert.ok(receiptRoot, "release workflow must provide its receipt directory");
assert.equal(expectedProductVersion, "1.1.2", "this smoke is bound to the WO-012 package");
const receipt = JSON.parse(readFileSync(join(receiptRoot, "GBS-V11-WO-012-RELEASE-MANIFEST.json"), "utf8"));
assert.equal(receipt.tarball.file, "gef-bootstrap-cli-1.1.2.tgz", "receipt must name the exact WO-012 archive");
const archive = join(receiptRoot, "gef-bootstrap-cli-1.1.2.tgz");
const archiveBytes = readFileSync(archive);
const digest = createHash("sha256").update(archiveBytes).digest("hex");
assert.deepEqual(
  [receipt.sourceCommit, receipt.event, receipt.ref, receipt.tarball.sha256, receipt.version, receipt.packageName],
  [process.env.GEF_EXPECTED_SOURCE_COMMIT, process.env.GEF_EXPECTED_EVENT, process.env.GEF_EXPECTED_REF, digest, expectedProductVersion, "@gef-bootstrap/cli"],
  "the downloaded package receipt must identify this workflow invocation and exact tarball",
);

function command(exe, args, cwd, windowsShell = false) {
  const child = spawnSync(exe, args, { cwd, encoding: "utf8", timeout: 120_000, shell: windowsShell });
  assert.equal(child.error, undefined, `${exe} must not time out: ${child.error?.message ?? ""}`);
  assert.equal(child.signal, null, `${exe} must not be interrupted`);
  assert.equal(child.status, 0, `${exe} ${args.join(" ")} failed: ${child.stderr ?? ""}`);
  return child.stdout ?? "";
}

function npm(args, cwd) {
  const win = process.platform === "win32";
  const npmCli = win ? join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js") : null;
  if (npmCli !== null) assert.ok(existsSync(npmCli), "Node installation must provide its npm CLI entrypoint");
  return command(npmCli === null ? "npm" : process.execPath, npmCli === null ? args : [npmCli, ...args], cwd);
}

const sha = (value) => createHash("sha256").update(value).digest("hex");
const consumer = mkdtempSync(join(tmpdir(), "gef-wo012-exact-tarball-"));
let migration;
try {
  npm(["init", "-y"], consumer);
  npm(["install", "--package-lock-only", "--ignore-scripts", "--offline", "--no-audit", "--no-fund", archive], consumer);
  assert.ok(existsSync(join(consumer, "package-lock.json")), "npm must lock the exact receipt tarball");
  npm(["ci", "--ignore-scripts", "--offline", "--no-audit", "--no-fund"], consumer);

  const installed = join(consumer, "node_modules", "@gef-bootstrap", "cli");
  const executable = join(installed, "bin", "gef.mjs");
  const platformRuntime = join(installed, "node_modules", "@koromix", `koffi-${process.platform}-${process.arch}`);
  assert.ok(existsSync(executable), "the installed archive must expose the CLI entrypoint");
  assert.ok(existsSync(join(platformRuntime, "package.json")), "the install must contain its host-specific native runtime");
  command(process.execPath, ["-e", "require(process.argv[1])", join(installed, "node_modules", "koffi")], consumer);
  const gef = (...args) => JSON.parse(command(process.execPath, [executable, ...args], consumer));
  const commandIds = gef("--help").commands.map((entry) => entry.id);
  for (const id of ["gef.init.plan", "gef.adopt.preview", "gef.upgrade.preview"]) assert.ok(commandIds.includes(id));
  assert.equal(gef("--version").version, expectedProductVersion);
  gef("doctor", "--target", consumer, "--json");
  gef("status", "--target", consumer, "--json");
  command(process.execPath, ["--input-type=module", "-e", "import { processExitCodeFor } from '@gef-bootstrap/cli'; if (typeof processExitCodeFor !== 'function') process.exit(1)"], consumer);

  migration = mkdtempSync(join(tmpdir(), "gef-wo012-v10-migration-"));
  command("git", ["init", "-q"], migration);
  command("git", ["config", "user.email", "executor@example.invalid"], migration);
  command("git", ["config", "user.name", "GEF Executor"], migration);
  writeFileSync(join(migration, "README.md"), "preserve same-artifact migration project\n");
  command("git", ["add", "README.md"], migration);
  command("git", ["commit", "-qm", "seed"], migration);

  const runId = "wo012-release-artifact-migration";
  const planDigest = sha("legacy-plan");
  const stateBytes = `${JSON.stringify({
    schemaVersion: "1.0", kind: "gef.init.state", verb: "init", commandId: "gef.init.run", contractVersion: "1.0",
    productVersion: "1.0.0", runId, planDigest, observationFingerprint: sha("legacy-observation"),
    transaction: { planDigest, outcome: "APPLIED" },
  }, null, 2)}\n`;
  const receiptBytes = `${JSON.stringify({
    schemaVersion: "1.0", kind: "gef.cli.receipt", runId, commandId: "gef.init.run", contractVersion: "1.0",
    productVersion: "1.0.0", effectStatus: "CONFIRMED",
    lifecyclePhases: ["RECEIVED", "VALIDATING", "PREFLIGHTING", "READY", "EXECUTING", "VERIFYING", "RECEIPTING"],
    resultDigest: sha("legacy-result"),
    transaction: { planDigest: sha("legacy-kernel-plan"), outcome: "APPLIED", receiptDigest: sha("legacy-receipt"), postFingerprint: sha(stateBytes) },
  }, null, 2)}\n`;
  mkdirSync(join(migration, ".gef", "receipts"), { recursive: true });
  writeFileSync(join(migration, ".gef", "init-state.json"), stateBytes);
  writeFileSync(join(migration, ".gef", "receipts", `${runId}.json`), receiptBytes);

  const preview = gef("upgrade", "--target", migration, "--json").value;
  assert.equal(preview.commandId, "gef.upgrade.preview");
  assert.equal(preview.preview.readOnly, true);
  assert.equal(preview.preview.compatibility.state, "SUPPORTED");
  const result = gef("upgrade", "--apply", "--target", migration, "--json").value;
  assert.equal(result.commandId, "gef.upgrade.apply");
  assert.equal(result.transaction.outcome, "APPLIED");
  assert.deepEqual([result.document.sourceVersion, result.document.targetVersion], ["1.0.0", expectedProductVersion]);
  assert.equal(readFileSync(join(migration, ".gef", "init-state.json"), "utf8"), stateBytes);
  assert.equal(readFileSync(join(migration, ".gef", "receipts", `${runId}.json`), "utf8"), receiptBytes);

  npm(["uninstall", "--no-audit", "--no-fund", "@gef-bootstrap/cli"], consumer);
  assert.equal(existsSync(installed), false, "npm uninstall must remove the CLI package");
  console.log(`PASS: ${process.platform}-${process.arch} installed, used, migrated with, and removed sha256=${digest}`);
} finally {
  if (migration) rmSync(migration, { recursive: true, force: true });
  rmSync(consumer, { recursive: true, force: true });
}
