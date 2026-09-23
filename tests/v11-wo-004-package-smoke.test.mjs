// GBS-V11-WO-004 L3 — package and install the CLI, then exercise its own upgrade assets.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { DEFAULT_GIT_TRUST_POLICY, createCliToolObservationPort, resolveGitToolWith } from "../packages/cli/dist/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI_PACKAGE_DIR = resolve(ROOT, "packages/cli");
const PRODUCT_VERSION = JSON.parse(readFileSync(join(CLI_PACKAGE_DIR, "package.json"), "utf8")).version;
const TIMEOUT_MS = 300_000;
const sha = (value) => createHash("sha256").update(value).digest("hex");

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", timeout: TIMEOUT_MS, ...options });
}

function npmRun(args, options = {}) {
  if (process.platform === "win32") {
    const command = ["npm", ...args].map((part) => part.includes(" ") ? `"${part}"` : part).join(" ");
    return spawnSync(command, { encoding: "utf8", timeout: TIMEOUT_MS, shell: true, ...options });
  }
  return spawnSync("npm", args, { encoding: "utf8", timeout: TIMEOUT_MS, ...options });
}

function packageAndInstall(sandbox) {
  const tarballDir = join(sandbox, "tarball");
  mkdirSync(tarballDir, { recursive: true });
  const packaged = run(process.execPath, [join(CLI_PACKAGE_DIR, "scripts", "prepare-package.mjs"), "--pack", "--destination", tarballDir], { cwd: ROOT });
  assert.equal(packaged.error, undefined, packaged.error?.message ?? "package command must not time out");
  assert.equal(packaged.status, 0, `package build must succeed: ${packaged.stderr}`);
  const tarball = packaged.stdout.trim().split("\n").pop().trim();
  assert.ok(existsSync(tarball), `tarball must exist at ${tarball}`);
  assert.equal(npmRun(["init", "-y"], { cwd: sandbox }).status, 0);
  const installed = npmRun(["install", "--offline", "--no-audit", "--no-fund", tarball], { cwd: sandbox });
  assert.equal(installed.error, undefined, installed.error?.message ?? "npm install must not time out");
  assert.equal(installed.status, 0, `offline package install must succeed: ${installed.stderr}`);
  return { tarball, cliDir: join(sandbox, "node_modules", "@gef-bootstrap", "cli"), bin: join(sandbox, "node_modules", "@gef-bootstrap", "cli", "bin", "gef.mjs") };
}

function seedLegacyProject(target) {
  const init = (args) => {
    const result = run("git", ["-C", target, ...args]);
    assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  };
  init(["init", "-q"]);
  init(["config", "user.email", "executor@example.invalid"]);
  init(["config", "user.name", "GEF Executor"]);
  writeFileSync(join(target, "README.md"), "preserve packed migration project\n");
  init(["add", "README.md"]);
  init(["commit", "-qm", "seed"]);

  const runId = "legacy-run-packed-init";
  const planDigest = sha("legacy-plan");
  const state = {
    schemaVersion: "1.0", kind: "gef.init.state", verb: "init", commandId: "gef.init.run",
    contractVersion: "1.0", productVersion: "1.0.0", runId, planDigest,
    observationFingerprint: sha("legacy-observation"), transaction: { planDigest, outcome: "APPLIED" },
  };
  const stateBytes = `${JSON.stringify(state, null, 2)}\n`;
  const receipt = {
    schemaVersion: "1.0", kind: "gef.cli.receipt", runId, commandId: "gef.init.run",
    contractVersion: "1.0", productVersion: "1.0.0", effectStatus: "CONFIRMED",
    lifecyclePhases: ["RECEIVED", "VALIDATING", "PREFLIGHTING", "READY", "EXECUTING", "VERIFYING", "RECEIPTING"],
    resultDigest: sha("legacy-result"),
    transaction: { planDigest: sha("legacy-kernel-plan"), outcome: "APPLIED", receiptDigest: sha("legacy-receipt"), postFingerprint: sha(stateBytes) },
  };
  mkdirSync(join(target, ".gef", "receipts"), { recursive: true });
  writeFileSync(join(target, ".gef", "init-state.json"), stateBytes);
  writeFileSync(join(target, ".gef", "receipts", `${runId}.json`), `${JSON.stringify(receipt, null, 2)}\n`);
}

function invoke(bin, args) {
  const result = run(process.execPath, [bin, ...args], { timeout: 90_000 });
  assert.equal(result.error, undefined, result.error?.message ?? "installed CLI must complete");
  assert.equal(result.signal, null);
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

test("installed package verifies matrix/schema digests and runs upgrade preview/apply without source injection", { timeout: TIMEOUT_MS }, (t) => {
  const sandbox = mkdtempSync(join(tmpdir(), "gef-wo004-packed-"));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));
  const { cliDir, bin } = packageAndInstall(sandbox);
  const manifest = JSON.parse(readFileSync(join(cliDir, "vendor", "MANIFEST.json"), "utf8"));
  const assets = ["gef-cli-upgrade-compatibility-matrix.json", "gef-cli-upgrade-compatibility-matrix.schema.json", "gef-cli-upgrade-state.schema.json"];
  for (const name of assets) {
    const entry = manifest.artifacts.find((artifact) => artifact.kind === "cli-schema" && artifact.name === name);
    assert.ok(entry, `${name} must be recorded in the installed manifest`);
    assert.equal(entry.target, `schemas/${name}`);
    assert.equal(sha(readFileSync(join(cliDir, entry.target))), entry.sha256, `${name} must match its packaged hash`);
  }
  for (const forbidden of ["src", "scripts", "tsconfig.json"]) assert.equal(existsSync(join(cliDir, forbidden)), false, `${forbidden} must not be injected into the installed runtime`);

  const target = mkdtempSync(join(tmpdir(), "gef-wo004-installed-target-"));
  t.after(() => rmSync(target, { recursive: true, force: true }));
  seedLegacyProject(target);
  const trustedGit = resolveGitToolWith(createCliToolObservationPort(DEFAULT_GIT_TRUST_POLICY)) !== null;
  const preview = invoke(bin, ["upgrade", "--target", target, "--json"]);
  assert.equal(preview.code, 0, preview.stderr);
  const previewValue = JSON.parse(preview.stdout).value;
  assert.equal(previewValue.commandId, "gef.upgrade.preview");
  assert.equal(previewValue.preview.readOnly, true);
  assert.equal(previewValue.preview.compatibility.state, trustedGit ? "SUPPORTED" : "INDETERMINATE");

  const applied = invoke(bin, ["upgrade", "--apply", "--target", target, "--json"]);
  if (!trustedGit) {
    assert.notEqual(applied.code, 0, "untrusted or privileged Git must fail closed on apply");
    assert.equal(existsSync(join(target, ".gef", "upgrade-state.json")), false);
  } else {
    assert.equal(applied.code, 0, applied.stderr);
    const value = JSON.parse(applied.stdout).value;
    assert.equal(value.transaction.outcome, "APPLIED");
    assert.equal(value.previewDigest, previewValue.previewDigest);
    assert.equal(JSON.parse(readFileSync(join(target, ".gef", "upgrade-state.json"), "utf8")).targetVersion, PRODUCT_VERSION);
  }
});
