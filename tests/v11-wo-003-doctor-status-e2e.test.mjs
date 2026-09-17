// GBS-V11-WO-003 — process E2E for `gef doctor` and `gef status`.
//
// Every case spawns the real executable shim, so the parser, the kernel runtime, the diagnostic
// compositions, the renderer and the exit projection are all exercised through the process
// boundary. stdio is piped, so these runs are non-TTY by construction.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GEF_BIN = resolve(ROOT, "packages/cli/bin/gef.mjs");
const PROCESS_TIMEOUT_MS = 90_000;

function gef(args, options = {}) {
  const result = spawnSync(process.execPath, [GEF_BIN, ...args], { encoding: "utf8", timeout: PROCESS_TIMEOUT_MS, ...options });
  assert.equal(result.error, undefined, `process must not fail or time out: ${result.error?.message ?? ""}`);
  assert.equal(result.signal, null, "process must not be killed");
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** An environment whose PATH cannot resolve `git`, for the WO-002 F2 closure. */
function withoutGit(t) {
  const empty = mkdtempSync(join(tmpdir(), "gef-nogit-"));
  t.after(() => rmSync(empty, { recursive: true, force: true }));
  return { ...process.env, PATH: empty, Path: empty };
}

function tempProject(t, prefix = "gef-wo003-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function snapshot(root) {
  const entries = [];
  const walk = (current) => {
    const stats = statSync(current);
    const rel = relative(root, current).split(sep).join("/");
    if (rel.length > 0) {
      if (stats.isSymbolicLink()) entries.push(`${rel}:LINK`);
      else if (stats.isDirectory()) entries.push(`${rel}:DIR`);
      else entries.push(`${rel}:FILE:${createHash("sha256").update(readFileSync(current)).digest("hex")}`);
    }
    if (stats.isDirectory() && !stats.isSymbolicLink()) for (const child of readdirSync(current).sort()) walk(join(current, child));
  };
  walk(root);
  return entries.sort();
}

function gitState(root) {
  const run = (args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 30_000 }).stdout ?? "";
  return { status: run(["status", "--porcelain"]), head: run(["rev-parse", "HEAD"]), branch: run(["rev-parse", "--abbrev-ref", "HEAD"]), tags: run(["tag", "--list"]) };
}

function initRepo(root) {
  const run = (args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 30_000 });
  run(["init", "-q"]);
  run(["config", "user.email", "executor@example.invalid"]);
  run(["config", "user.name", "GEF Executor"]);
  writeFileSync(join(root, "seed.txt"), "seed\n");
  run(["add", "."]);
  run(["commit", "-qm", "seed"]);
}

// ------------------------------------------------------------------- success

test("doctor and status succeed through the real process with a JSON envelope", (t) => {
  const project = tempProject(t);
  for (const [verb, commandId, key] of [
    ["doctor", "gef.doctor.run", "doctor"],
    ["status", "gef.status.show", "status"],
  ]) {
    const result = gef([verb, "--target", project, "--json"]);
    assert.equal(result.code, 0, `${verb} must exit 0: ${result.stderr}`);
    const envelope = JSON.parse(result.stdout);
    assert.deepEqual(Object.keys(envelope), ["schemaVersion", "ok", "commandId", "contractVersion", "terminal", "value"]);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.commandId, commandId);
    assert.equal(envelope.value.effect, "NONE");
    assert.equal(envelope.value[key].readOnly, true);
  }
});

test("non-TTY stdout emits the machine envelope without --json and never blocks", (t) => {
  const project = tempProject(t);
  const result = spawnSync(process.execPath, [GEF_BIN, "status", "--target", project], { encoding: "utf8", timeout: 30_000, stdio: ["pipe", "pipe", "pipe"] });
  assert.equal(result.error, undefined, "a non-TTY run must complete without timing out");
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.commandId, "gef.status.show");
});

test("help and verb help cover both diagnostic commands deterministically", () => {
  const global = gef(["--help"]);
  assert.equal(global.code, 0);
  const ids = JSON.parse(global.stdout).commands.map((command) => command.id);
  assert.deepEqual(ids, ["gef.adopt.apply", "gef.adopt.preview", "gef.doctor.run", "gef.init.plan", "gef.init.run", "gef.status.show"]);
  assert.equal(global.stdout, gef(["--help"]).stdout, "help must be byte-identical across runs");
  for (const verb of ["doctor", "status"]) assert.equal(gef([verb, "--help"]).code, 0);
});

// -------------------------------------------------------------------- usage

test("malformed input stays on exit 10 and mutates nothing", (t) => {
  const project = tempProject(t);
  writeFileSync(join(project, "USER.txt"), "user content\n");
  const before = snapshot(project);

  assert.equal(gef(["doctor", "--nope", "--target", project]).code, 10);
  assert.equal(gef(["status", "--target"]).code, 10);
  assert.equal(gef(["doctor", "--apply", "--target", project]).code, 10, "a mutation flag must be refused for a read-only command");
  assert.equal(gef(["status", "--apply", "--target", project]).code, 10);
  assert.equal(gef(["upgrade", "--target", project]).code, 10, "upgrade remains WO-004");

  assert.deepEqual(snapshot(project), before, "usage failures must leave the project untouched");
  assert.ok(!existsSync(join(project, ".gef")));
  assert.ok(!existsSync(join(project, ".gef-private")));
});

// ------------------------------------------------------------- no mutation

test("neither command mutates the project tree, .gef state or Git state", (t) => {
  const project = tempProject(t);
  mkdirSync(join(project, "src"), { recursive: true });
  writeFileSync(join(project, "src", "app.js"), "// user source\n");
  writeFileSync(join(project, "README.md"), "user readme\n");
  initRepo(project);

  const treeBefore = snapshot(project);
  const gitBefore = gitState(project);

  for (const verb of ["doctor", "status"]) {
    assert.equal(gef([verb, "--target", project]).code, 0);
    assert.deepEqual(snapshot(project), treeBefore, `${verb} must not change the project tree`);
    assert.deepEqual(gitState(project), gitBefore, `${verb} must not change Git state`);
    assert.ok(!existsSync(join(project, ".gef")), `${verb} must not create .gef state`);
    assert.ok(!existsSync(join(project, ".gef-private")), `${verb} must not create transaction substrate`);
  }

  // Nor may they touch the repository's own working tree.
  const repoBefore = gitState(ROOT);
  for (const verb of ["doctor", "status"]) assert.equal(gef([verb]).code, 0);
  assert.deepEqual(gitState(ROOT), repoBefore, "the commands must not change the repository they run in");
});

// ------------------------------------------- WO-002 F2: Git unavailable

test("a missing Git binary is an actionable doctor finding, never a healthy verdict", (t) => {
  const project = tempProject(t);
  const result = gef(["doctor", "--target", project, "--json"], { env: withoutGit(t) });
  assert.equal(result.code, 0, "doctor reports findings in its payload, it does not fail the process");

  const doctor = JSON.parse(result.stdout).value.doctor;
  const gitFinding = doctor.findings.find((finding) => finding.id === "toolchain.git");
  assert.ok(gitFinding, "the git capability must be reported");
  assert.equal(gitFinding.state, "FINDING", "an unavailable Git binary is a finding, not HEALTHY");
  assert.equal(gitFinding.state === "HEALTHY", false, "the verdict must never be healthy by omission");

  const remediation = doctor.remediation.find((suggestion) => suggestion.finding === "toolchain.git");
  assert.ok(remediation, "the finding must carry actionable remediation");
  assert.equal(remediation.automatic, false, "remediation is never automatic");
  assert.equal(remediation.previewRequired, true);

  assert.equal(doctor.invariants.find((entry) => entry.name === "toolchain.git").pass, false);
  assert.ok(doctor.capabilities.unknown.includes("toolchain.git") || doctor.capabilities.state === "DEGRADED", "the capability envelope must record the gap");
});

test("with Git unavailable, status reports unknown rather than clean", (t) => {
  const project = tempProject(t);
  initRepo(project);

  const result = gef(["status", "--target", project, "--json"], { env: withoutGit(t) });
  assert.equal(result.code, 0);
  const status = JSON.parse(result.stdout).value.status;

  assert.equal(status.repository.dirtiness, "UNKNOWN", "unobservable dirtiness must be reported as unknown");
  assert.equal(status.repository.verdict, null, "no repository verdict may be fabricated while the tree is unobservable");
  assert.notEqual(status.operator.state, "CLEAN", "status must never report CLEAN by omission");
  assert.ok(status.repository.observationLimits.some((limit) => limit.startsWith("DIRTINESS_UNKNOWN")), "the concrete reason must be recorded");
});

test("with Git available and an unobservable tree, status stays unknown", (t) => {
  const project = tempProject(t);
  // Git identity present but not a usable repository: the tree cannot be observed.
  mkdirSync(join(project, ".git"), { recursive: true });
  writeFileSync(join(project, ".git", "HEAD"), "ref: refs/heads/main\n");
  writeFileSync(join(project, "USER.txt"), "user content\n");

  const result = gef(["status", "--target", project, "--json"]);
  assert.equal(result.code, 0);
  const status = JSON.parse(result.stdout).value.status;
  assert.equal(status.repository.dirtiness, "UNKNOWN");
  assert.equal(status.repository.verdict, null);
  assert.equal(readFileSync(join(project, "USER.txt"), "utf8"), "user content\n");
});

// ------------------------------------------- production / development truth

test("status reports the declared production truth and the V1.1 overlay separately", (t) => {
  const project = tempProject(t);
  mkdirSync(join(project, ".engineering"), { recursive: true });
  writeFileSync(
    join(project, ".engineering", "CHECKPOINT.json"),
    JSON.stringify({ status: "GBS_V1_PRODUCTION_ACCEPTED", overallCompletionPercent: 100, v11: { status: "OVERLAY_STATUS", activeWorkOrder: "GBS-V11-WO-003" } }),
  );
  writeFileSync(join(project, "README.md"), "readme\n");

  const result = gef(["status", "--target", project, "--json"]);
  assert.equal(result.code, 0);
  const status = JSON.parse(result.stdout).value.status;
  assert.equal(status.release.production.status, "GBS_V1_PRODUCTION_ACCEPTED");
  assert.equal(status.release.development.status, "OVERLAY_STATUS", "the V1.1 overlay is reported separately");
  assert.equal(status.release.development.activeWorkOrder, "GBS-V11-WO-003");
  assert.equal(status.operator.progress, 100);
  assert.ok(status.documentation.entries.some((entry) => entry.id === "README.md"));
  assert.ok(status.navigation.files.includes(".engineering/CHECKPOINT.json"));
});
