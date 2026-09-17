// GBS-V11-WO-003 — packed-install parity for `gef doctor` and `gef status`.
//
// The package is built with the repository's staging script and installed with a real
// `npm install` into a fresh directory. Nothing from the source tree is copied in: doctor/status
// must work from the packaged artifact alone, with the same semantics as the source workspace.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI_PACKAGE_DIR = resolve(ROOT, "packages/cli");
const cliPackage = JSON.parse(readFileSync(join(CLI_PACKAGE_DIR, "package.json"), "utf8"));

const TIMEOUT_MS = 300_000;

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", timeout: TIMEOUT_MS, ...options });
}

/** npm ships as a `.cmd` shim on Windows, which needs a shell; elsewhere argv is passed directly. */
function npmRun(args, options) {
  if (process.platform === "win32") {
    const command = ["npm", ...args].map((part) => (part.includes(" ") ? `"${part}"` : part)).join(" ");
    return spawnSync(command, { encoding: "utf8", timeout: TIMEOUT_MS, shell: true, ...options });
  }
  return spawnSync("npm", args, { encoding: "utf8", timeout: TIMEOUT_MS, ...options });
}

function packCli(destination) {
  mkdirSync(destination, { recursive: true });
  const packaged = run(process.execPath, [join(CLI_PACKAGE_DIR, "scripts", "prepare-package.mjs"), "--pack", "--destination", destination], { cwd: ROOT });
  assert.equal(packaged.status, 0, `packaging must succeed: ${packaged.stderr}`);
  const tarballPath = packaged.stdout.trim().split("\n").pop().trim();
  assert.ok(existsSync(tarballPath), `tarball must exist at ${tarballPath}`);
  return tarballPath;
}

function freshInstall(t, tag) {
  const sandbox = mkdtempSync(join(tmpdir(), `gef-wo003-${tag}-`));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));
  const tarball = packCli(join(sandbox, "__tarball__"));
  assert.equal(npmRun(["init", "-y"], { cwd: sandbox }).status, 0);
  const installed = npmRun(["install", "--no-audit", "--no-fund", tarball], { cwd: sandbox });
  assert.equal(installed.status, 0, `npm install must succeed: ${installed.stderr}`);
  const cliDir = join(sandbox, "node_modules", "@gef-bootstrap", "cli");
  return { sandbox, cliDir, bin: join(cliDir, "bin", "gef.mjs") };
}

function gefAt(bin, args) {
  const result = run(process.execPath, [bin, ...args], { encoding: "utf8", timeout: 60_000 });
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function tempProject(t) {
  const project = mkdtempSync(join(tmpdir(), "gef-wo003-project-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));
  return project;
}

// ------------------------------------------------------------- packaged parity

test("the packed payload vendors every engine doctor and status depend on", (t) => {
  const { cliDir } = freshInstall(t, "payload");
  // The three engine modules WO-003 introduced must be part of the packaged artifact.
  for (const engine of ["m41-m47-platform", "m55-m61-quality", "m62-m63-final", "m48-m54-maintenance", "area-h-governance", "security-reliability-integrations"]) {
    assert.ok(existsSync(join(cliDir, "vendor", "engines", engine)), `${engine} must be vendored`);
  }
  const manifest = JSON.parse(readFileSync(join(cliDir, "vendor", "MANIFEST.json"), "utf8"));
  assert.equal(manifest.artifacts.filter((entry) => entry.kind === "engine").length, 6);
  for (const artefact of manifest.artifacts.filter((entry) => entry.kind === "engine")) {
    assert.match(artefact.sha256, /^[0-9a-f]{64}$/, `${artefact.name} must carry a recorded digest`);
  }
  // No source-tree injection: build inputs and sources are not part of the payload.
  for (const forbidden of ["src", "tsconfig.json", "scripts"]) assert.ok(!existsSync(join(cliDir, forbidden)), `${forbidden} must not be packaged`);
  assert.equal(cliPackage.private, true, "the package stays private");
});

test("the installed package exposes doctor and status with source-workspace semantics", (t) => {
  const { bin } = freshInstall(t, "parity");
  const project = tempProject(t);

  const doctor = gefAt(bin, ["doctor", "--target", project, "--json"]);
  assert.equal(doctor.code, 0, `installed doctor must exit 0: ${doctor.stderr}`);
  const doctorEnvelope = JSON.parse(doctor.stdout);
  assert.equal(doctorEnvelope.commandId, "gef.doctor.run");
  assert.equal(doctorEnvelope.value.doctor.readOnly, true);
  assert.ok(Array.isArray(doctorEnvelope.value.doctor.findings));
  const gitFinding = doctorEnvelope.value.doctor.findings.find((finding) => finding.id === "toolchain.git");
  assert.equal(gitFinding.state, "HEALTHY", "the packaged CLI can see a working Git binary in this environment");
  assert.equal(doctorEnvelope.value.doctor.security.github.state, "REVIEW", "provider evidence is absent and reported as REVIEW");

  const status = gefAt(bin, ["status", "--target", project, "--json"]);
  assert.equal(status.code, 0, `installed status must exit 0: ${status.stderr}`);
  const statusEnvelope = JSON.parse(status.stdout);
  assert.equal(statusEnvelope.commandId, "gef.status.show");
  assert.equal(statusEnvelope.value.status.readOnly, true);
  assert.ok("production" in statusEnvelope.value.status.release && "development" in statusEnvelope.value.status.release);

  // The packaged binary resolves its own manifest for the version provenance.
  const version = gefAt(bin, ["--version"]);
  assert.equal(version.code, 0);
  assert.equal(JSON.parse(version.stdout).version, cliPackage.version);
});

test("the installed package keeps the read-only contract and the usage path", (t) => {
  const { bin } = freshInstall(t, "contract");
  const project = tempProject(t);
  const before = readdirSync(project);

  assert.equal(gefAt(bin, ["doctor", "--apply", "--target", project]).code, 10, "a mutation flag must be refused");
  assert.equal(gefAt(bin, ["status", "--apply", "--target", project]).code, 10);
  assert.equal(gefAt(bin, ["doctor", "--nope"]).code, 10);
  assert.deepEqual(readdirSync(project), before, "the installed CLI must not touch the project");

  const help = gefAt(bin, ["--help"]);
  assert.equal(help.code, 0);
  assert.deepEqual(JSON.parse(help.stdout).commands.map((command) => command.id), [
    "gef.adopt.apply",
    "gef.adopt.preview",
    "gef.doctor.run",
    "gef.init.plan",
    "gef.init.run",
    "gef.status.show",
  ]);
});

test("the installed package still keeps WO-002 behaviour intact", (t) => {
  const { bin } = freshInstall(t, "regression");
  const project = tempProject(t);

  // init/adopt remain available and still require an explicit --apply for mutation.
  const plan = gefAt(bin, ["init", "--target", project, "--json"]);
  assert.equal(plan.code, 0, `installed init plan must exit 0: ${plan.stderr}`);
  assert.equal(JSON.parse(plan.stdout).value.effect, "NONE");
  assert.ok(!existsSync(join(project, ".gef")), "a plan must not mutate");

  const applied = gefAt(bin, ["init", "--apply", "--target", project, "--json"]);
  assert.equal(applied.code, 0, `installed init --apply must exit 0: ${applied.stderr}`);
  assert.equal(JSON.parse(applied.stdout).value.transaction.outcome, "APPLIED");
  assert.ok(existsSync(join(project, ".gef", "init-state.json")));

  // Doctor and status observe that applied state without mutating it.
  const appliedDigest = readFileSync(join(project, ".gef", "init-state.json"), "utf8");
  const status = gefAt(bin, ["status", "--target", project, "--json"]);
  assert.equal(status.code, 0);
  assert.equal(readFileSync(join(project, ".gef", "init-state.json"), "utf8"), appliedDigest, "status must not change the governed artifact");
});

test("the installed package carries the contained-read hardening", (t) => {
  const { bin } = freshInstall(t, "hardening");
  const SENTINEL = "GEF-PACKED-EXTERNAL-SENTINEL";
  const project = tempProject(t);
  const external = mkdtempSync(join(tmpdir(), "gef-wo003-packed-ext-"));
  t.after(() => rmSync(external, { recursive: true, force: true }));
  mkdirSync(join(external, ".engineering"), { recursive: true });
  writeFileSync(join(external, ".engineering", "CHECKPOINT.json"), JSON.stringify({ schemaVersion: 2, status: SENTINEL, overallCompletionPercent: 100 }));

  // Junctions are unprivileged on Windows; directory symlinks are used elsewhere.
  if (process.platform === "win32") symlinkSync(join(external, ".engineering"), join(project, ".engineering"), "junction");
  else symlinkSync(join(external, ".engineering"), join(project, ".engineering"), "dir");

  for (const verb of ["doctor", "status"]) {
    const result = gefAt(bin, [verb, "--target", project, "--json"]);
    assert.equal(result.code, 0, `installed ${verb} must exit 0: ${result.stderr}`);
    assert.equal(result.stdout.includes(SENTINEL), false, `installed ${verb} must not expose aliased content`);
    const value = JSON.parse(result.stdout).value[verb];
    assert.ok(value.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_ALIAS_REFUSED")), `installed ${verb} must record the alias refusal`);
  }
});

test("the installed package fails closed when the vendored engines are missing", (t) => {
  const { cliDir, bin } = freshInstall(t, "broken-engines");
  rmSync(join(cliDir, "vendor"), { recursive: true, force: true });
  const project = tempProject(t);
  const before = readdirSync(project);

  for (const args of [["doctor", "--target", project, "--json"], ["status", "--target", project, "--json"]]) {
    const result = gefAt(bin, args);
    assert.equal(result.code, 40, `${args.join(" ")} must fail closed without engines`);
    const envelope = JSON.parse(result.stdout);
    assert.equal(envelope.ok, false, "a capability failure must not claim success");
    assert.equal(envelope.error.category, "CAPABILITY");
    assert.equal(envelope.value, undefined, "no partial value may be emitted");
  }

  // A degraded install must never degrade into a healthy verdict, and must not mutate anything.
  assert.deepEqual(readdirSync(project), before, "a failed diagnostic must not touch the project");
  assert.ok(!existsSync(join(project, ".gef")));
});
