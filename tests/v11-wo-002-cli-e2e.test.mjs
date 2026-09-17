// GBS-V11-WO-002 — CLI process E2E.
//
// Every case spawns the real executable shim as a child process, so the parser, the kernel
// runtime, the engine boundary, the renderer and the exit projection are all exercised
// through the actual process boundary rather than in-process imports.
//
// Matrix mapping: CLI-E2E-01 .. CLI-E2E-07 (limited to the commands admitted by WO-002).
// Rows requiring doctor/status/upgrade are DEFERRED_TO_OWNING_WO and are asserted as
// absent rather than green.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GEF_BIN = resolve(ROOT, "packages/cli/bin/gef.mjs");
const cliPackage = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/package.json"), "utf8"));
const rootPackage = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));

const PROCESS_TIMEOUT_MS = 60_000;

function gef(args, options = {}) {
  const result = spawnSync(process.execPath, [GEF_BIN, ...args], {
    encoding: "utf8",
    timeout: PROCESS_TIMEOUT_MS,
    // stdio defaults to pipes: this is a non-TTY invocation by construction.
    ...options,
  });
  assert.equal(result.error, undefined, `process must not fail or time out: ${result.error?.message ?? ""}`);
  assert.equal(result.signal, null, "process must not be killed");
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function tempTarget() {
  return mkdtempSync(join(tmpdir(), "gef-wo-002-"));
}

// ------------------------------------------------------------ CLI-E2E-01 help

test("CLI-E2E-01: help is deterministic, exits 0 and requires no network", () => {
  const first = gef(["--help"]);
  const second = gef(["--help"]);
  assert.equal(first.code, 0);
  assert.equal(second.code, 0);
  assert.equal(first.stdout, second.stdout, "help must be byte-identical across runs");
  assert.equal(first.stderr, "");
  assert.ok(first.stdout.includes("Usage: gef"));

  for (const verb of ["init", "adopt"]) {
    const verbHelp = gef([verb, "--help"]);
    assert.equal(verbHelp.code, 0, `${verb} --help must exit 0`);
    assert.equal(verbHelp.stdout, gef([verb, "--help"]).stdout);
    assert.ok(verbHelp.stdout.includes("Usage: gef"));
  }

  // Verb-level help is not an error even when combined with mutation flags.
  assert.equal(gef(["init", "--apply", "--help"]).code, 0);

  // Static no-network proof over the shipped runtime surface.
  const shipped = readdirSync(resolve(ROOT, "packages/cli/dist")).filter((name) => name.endsWith(".js"));
  for (const file of shipped) {
    const body = readFileSync(resolve(ROOT, "packages/cli/dist", file), "utf8");
    for (const forbidden of ["node:http", "node:https", "node:net", "node:dgram", "fetch("]) {
      assert.ok(!body.includes(forbidden), `${file} must not reference ${forbidden}`);
    }
  }
});

// --------------------------------------------------------- CLI-E2E-02 version

test("CLI-E2E-02: version agrees with the canonical and packaged provenance", () => {
  const result = gef(["--version"]);
  assert.equal(result.code, 0);
  const [firstLine] = result.stdout.split("\n");
  assert.equal(firstLine, `gef ${rootPackage.version}`);
  assert.equal(rootPackage.version, cliPackage.version, "root and CLI package versions must agree");
  assert.equal(cliPackage.version, "1.1.0");

  const json = gef(["--version", "--json"]);
  assert.equal(json.code, 0);
  assert.equal(JSON.parse(json.stdout).version, rootPackage.version);
});

// ------------------------------------------------------- CLI-E2E-03 usage/10

test("CLI-E2E-03: unknown command and malformed flags exit 10 with no mutation", () => {
  const target = tempTarget();
  try {
    const before = readdirSync(target);

    const unknown = gef(["bogus", "--target", target]);
    assert.equal(unknown.code, 10);
    assert.equal(unknown.stdout, "", "usage failure must not write to stdout");
    assert.match(unknown.stderr, /Unknown command/);

    const badFlag = gef(["init", "--nope", "--target", target]);
    assert.equal(badFlag.code, 10);
    assert.match(badFlag.stderr, /Unknown flag/);

    const missingValue = gef(["init", "--target"]);
    assert.equal(missingValue.code, 10);
    assert.match(missingValue.stderr, /requires a value/);

    for (const deferred of ["doctor", "status", "upgrade"]) {
      const result = gef([deferred, "--target", target]);
      assert.equal(result.code, 10, `${deferred} is deferred and must fail as usage`);
    }

    assert.deepEqual(readdirSync(target), before, "usage failures must leave the target untouched");
    assert.ok(!existsSync(join(target, ".gef")), "usage failures must not create GEF state");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------- CLI-E2E-04 json

test("CLI-E2E-04: --json yields a stable machine envelope for success and failure", () => {
  const target = tempTarget();
  try {
    const success = gef(["init", "--target", target, "--json"]);
    assert.equal(success.code, 0);
    const okEnvelope = JSON.parse(success.stdout);
    assert.equal(okEnvelope.ok, true);
    assert.equal(okEnvelope.commandId, "gef.init.plan");
    assert.equal(okEnvelope.terminal, "SUCCEEDED");
    assert.equal(okEnvelope.schemaVersion, 1);
    assert.deepEqual(Object.keys(okEnvelope), ["schemaVersion", "ok", "commandId", "contractVersion", "terminal", "value"]);

    // --json is global: it applies even when it appears after the failing token.
    const failure = gef(["bogus", "--json"]);
    assert.equal(failure.code, 10);
    const badEnvelope = JSON.parse(failure.stderr);
    assert.equal(badEnvelope.ok, false);
    assert.equal(badEnvelope.terminal, "BLOCKED");
    assert.equal(badEnvelope.error.category, "INPUT");

    const apply = gef(["init", "--apply", "--target", target, "--json"]);
    assert.equal(apply.code, 0);
    const applyEnvelope = JSON.parse(apply.stdout);
    assert.equal(applyEnvelope.value.effect, "CONFIRMED");

    const repeat = gef(["init", "--apply", "--target", target, "--json"]);
    assert.equal(repeat.code, 20);
    const precondition = JSON.parse(repeat.stdout);
    assert.equal(precondition.ok, false);
    assert.equal(precondition.error.category, "PRECONDITION");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

// --------------------------------------------------------- CLI-E2E-05 no hang

test("CLI-E2E-05: non-TTY invocation never blocks on an implicit prompt", () => {
  const target = tempTarget();
  try {
    // stdin is an open pipe that never receives data. A CLI that prompted would hang here.
    const result = spawnSync(process.execPath, [GEF_BIN, "init", "--target", target], {
      encoding: "utf8",
      timeout: 30_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    assert.equal(result.error, undefined, "non-TTY run must complete without timing out");
    assert.equal(result.status, 0);

    // The CLI must not read stdin at all.
    const sources = readdirSync(resolve(ROOT, "packages/cli/dist")).filter((name) => name.endsWith(".js"));
    for (const file of sources) {
      const body = readFileSync(resolve(ROOT, "packages/cli/dist", file), "utf8");
      assert.ok(!body.includes("readFileSync(0"), `${file} must not read stdin`);
      assert.ok(!body.includes("process.stdin"), `${file} must not read stdin`);
    }
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

// ------------------------------------------------- CLI-E2E-06 engine delegation

test("CLI-E2E-06: commands reach the real engines through the registry", () => {
  const target = tempTarget();
  try {
    // init plan must carry real engine output (installPlan phases and safety classification).
    const plan = JSON.parse(gef(["init", "--target", target, "--json"]).stdout);
    assert.deepEqual(plan.value.plan.install.phases, ["PRECHECK", "STAGE", "VERIFY", "COMMIT"]);
    assert.equal(plan.value.plan.safety.classification, "MUTATING");
    assert.deepEqual(plan.value.plan.governance.labelsToAdd, ["gef-managed", "governed"]);
    assert.equal(plan.value.effect, "NONE", "a plan must declare no effect");

    // adopt preview must carry adoption/drift/recovery engine output.
    const preview = JSON.parse(gef(["adopt", "--target", target, "--json"]).stdout);
    assert.equal(preview.value.preview.admission.state, "ALLOWED");
    assert.equal(preview.value.preview.recovery.action, "RESTART");
    assert.equal(preview.value.preview.backup.verified, true);
    assert.equal(preview.value.effect, "NONE");

    // The plan path must remain side-effect free.
    assert.ok(!existsSync(join(target, ".gef")), "plan and preview must not mutate the target");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

// ------------------------------------------------- CLI-E2E-07 exit projection

test("CLI-E2E-07: exit codes are projected through the single kernel mapping", () => {
  const target = tempTarget();
  try {
    assert.equal(gef(["--help"]).code, 0);
    assert.equal(gef(["--version"]).code, 0);
    assert.equal(gef(["bogus"]).code, 10);
    assert.equal(gef(["init", "--target", target]).code, 0);
    assert.equal(gef(["init", "--apply", "--target", target]).code, 0);
    assert.equal(gef(["init", "--apply", "--target", target]).code, 20, "existing artifact is a precondition block");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

// ------------------------------------------------------- governed apply paths

test("governed apply creates exclusively, verifies, receipts and preserves user data", () => {
  const target = tempTarget();
  try {
    writeFileSync(join(target, "USER-README.md"), "user owned\n");

    const applied = gef(["init", "--apply", "--target", target, "--json"]);
    assert.equal(applied.code, 0);
    const envelope = JSON.parse(applied.stdout);
    const receipt = envelope.value.receipt;
    assert.equal(receipt.createdExclusively, true);
    assert.equal(receipt.driftClass, "EXPECTED");

    const artifactPath = join(target, ".gef", "init-state.json");
    assert.ok(existsSync(artifactPath), "governed artifact must exist after apply");
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    assert.equal(artifact.commandId, "gef.init.run");
    assert.equal(artifact.productVersion, rootPackage.version);
    assert.equal(artifact.planDigest, envelope.value.planDigest);

    // A receipt is produced by the kernel receipt port.
    const receipts = readdirSync(join(target, ".gef", "receipts"));
    assert.equal(receipts.length, 1);
    const receiptBody = JSON.parse(readFileSync(join(target, ".gef", "receipts", receipts[0]), "utf8"));
    assert.equal(receiptBody.kind, "gef.cli.receipt");
    assert.equal(receiptBody.effectStatus, "CONFIRMED");
    assert.deepEqual(receiptBody.lifecyclePhases, ["RECEIVED", "VALIDATING", "PREFLIGHTING", "READY", "EXECUTING", "VERIFYING", "RECEIPTING"]);

    // Preservation-first: a second apply is refused and the original artifact survives.
    const before = readFileSync(artifactPath, "utf8");
    const second = gef(["init", "--apply", "--target", target]);
    assert.equal(second.code, 20);
    assert.equal(readFileSync(artifactPath, "utf8"), before, "existing artifact must never be overwritten");

    // User content is untouched throughout.
    assert.equal(readFileSync(join(target, "USER-README.md"), "utf8"), "user owned\n");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("adopt apply runs the governed path and presumes no brownfield mutation of user files", () => {
  const target = tempTarget();
  try {
    writeFileSync(join(target, "legacy.js"), "// existing brownfield source\n");
    const before = readFileSync(join(target, "legacy.js"), "utf8");

    const applied = gef(["adopt", "--apply", "--target", target, "--json"]);
    assert.equal(applied.code, 0);
    const envelope = JSON.parse(applied.stdout);
    assert.equal(envelope.value.commandId, "gef.adopt.apply");
    assert.equal(envelope.value.receipt.createdExclusively, true);
    assert.ok(existsSync(join(target, ".gef", "adopt-state.json")));
    assert.equal(readFileSync(join(target, "legacy.js"), "utf8"), before);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
