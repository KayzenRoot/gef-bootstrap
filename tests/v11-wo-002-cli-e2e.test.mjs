// GBS-V11-WO-002 correction — CLI process E2E.
//
// Every case spawns the real executable shim as a child process, so the parser, the kernel
// runtime, the transaction engine, the engine boundary, the renderer and the exit projection
// are exercised through the actual process boundary.
//
// stdio is piped, so these runs are non-TTY by construction — which is also how the automatic
// JSON selection contract is verified.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GEF_BIN = resolve(ROOT, "packages/cli/bin/gef.mjs");
const cliPackage = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/package.json"), "utf8"));
const rootPackage = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));

const PROCESS_TIMEOUT_MS = 90_000;

function gef(args, options = {}) {
  const result = spawnSync(process.execPath, [GEF_BIN, ...args], { encoding: "utf8", timeout: PROCESS_TIMEOUT_MS, ...options });
  assert.equal(result.error, undefined, `process must not fail or time out: ${result.error?.message ?? ""}`);
  assert.equal(result.signal, null, "process must not be killed");
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function tempTarget() {
  return mkdtempSync(join(tmpdir(), "gef-wo-002-"));
}

// -------------------------------------------------- help / version / usage

test("CLI-E2E-01: help is deterministic, exits 0 and comes from the engine inventory", () => {
  const first = gef(["--help"]);
  assert.equal(first.code, 0);
  assert.equal(first.stdout, gef(["--help"]).stdout, "help must be byte-identical across runs");

  const envelope = JSON.parse(first.stdout);
  const ids = envelope.commands.map((command) => command.id);
  assert.deepEqual(ids, ["gef.adopt.apply", "gef.adopt.preview", "gef.doctor.run", "gef.init.plan", "gef.init.run", "gef.status.show", "gef.upgrade.apply", "gef.upgrade.preview"]);
  assert.deepEqual(ids, [...ids].sort(), "the engine inventory is sorted by id");

  for (const verb of ["init", "adopt", "upgrade"]) assert.equal(gef([verb, "--help"]).code, 0);
  assert.equal(gef(["init", "--apply", "--help"]).code, 0);

  // No network capability is reachable from the shipped runtime.
  for (const file of readdirSync(resolve(ROOT, "packages/cli/dist")).filter((name) => name.endsWith(".js"))) {
    const body = readFileSync(resolve(ROOT, "packages/cli/dist", file), "utf8");
    for (const forbidden of ["node:http", "node:https", "node:net", "node:dgram", "fetch("]) {
      assert.ok(!body.includes(forbidden), `${file} must not reference ${forbidden}`);
    }
  }
});

test("CLI-E2E-02: version agrees with the canonical and packaged provenance", () => {
  const result = gef(["--version"]);
  assert.equal(result.code, 0);
  assert.equal(JSON.parse(result.stdout).version, rootPackage.version);
  assert.equal(rootPackage.version, cliPackage.version);
  assert.equal(cliPackage.version, "1.1.0");
});

test("CLI-E2E-03: unknown command and malformed flags exit 10 with no mutation", () => {
  const target = tempTarget();
  try {
    const before = readdirSync(target);
    assert.equal(gef(["bogus", "--target", target]).code, 10);
    assert.equal(gef(["init", "--nope", "--target", target]).code, 10);
    assert.equal(gef(["init", "--target"]).code, 10);
    // `upgrade` is admitted by WO-004 but malformed upgrade input stays on the usage path.
    assert.equal(gef(["upgrade", "--nope", "--target", target]).code, 10, "malformed upgrade input must remain a usage failure");
    for (const readOnly of ["doctor", "status"]) assert.equal(gef([readOnly, "--apply", "--target", target]).code, 10, `${readOnly} must not admit a mutation flag`);
    assert.deepEqual(readdirSync(target), before);
    assert.ok(!existsSync(join(target, ".gef")));
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("CLI-E2E-04: --json yields a stable machine envelope for success and failure", () => {
  const target = tempTarget();
  try {
    const success = gef(["init", "--target", target, "--json"]);
    assert.equal(success.code, 0);
    const okEnvelope = JSON.parse(success.stdout);
    assert.deepEqual(Object.keys(okEnvelope), ["schemaVersion", "ok", "commandId", "contractVersion", "terminal", "value"]);
    assert.equal(okEnvelope.value.effect, "NONE");

    const failure = gef(["bogus", "--json"]);
    assert.equal(failure.code, 10);
    assert.equal(JSON.parse(failure.stderr).error.category, "INPUT");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("CLI-E2E-05: non-TTY invocation never blocks on an implicit prompt", () => {
  const target = tempTarget();
  try {
    const result = spawnSync(process.execPath, [GEF_BIN, "init", "--target", target], { encoding: "utf8", timeout: 30_000, stdio: ["pipe", "pipe", "pipe"] });
    assert.equal(result.error, undefined, "non-TTY run must complete without timing out");
    assert.equal(result.status, 0);
    for (const file of readdirSync(resolve(ROOT, "packages/cli/dist")).filter((name) => name.endsWith(".js"))) {
      const body = readFileSync(resolve(ROOT, "packages/cli/dist", file), "utf8");
      assert.ok(!body.includes("process.stdin"), `${file} must not read stdin`);
    }
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("non-TTY stdout selects JSON automatically, without --json", () => {
  const target = tempTarget();
  try {
    const result = gef(["--version"]);
    assert.equal(result.code, 0);
    const envelope = JSON.parse(result.stdout);
    assert.equal(envelope.version, rootPackage.version, "a piped stdout must produce the machine envelope");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

// ----------------------------------------------- H2 — delegation in a run

test("CLI-E2E-06: commands reach the frozen delegation surface", () => {
  const target = tempTarget();
  try {
    const plan = JSON.parse(gef(["init", "--target", target, "--json"]).stdout).value.plan;
    // installPlan
    assert.deepEqual(plan.install.phases, ["PRECHECK", "STAGE", "VERIFY", "COMMIT"]);
    // repositoryState
    assert.ok(["CLEAN", "DIRTY", "BLOCKED"].includes(plan.repository.verdict.state));
    assert.ok(Array.isArray(plan.repository.observationLimits));
    // githubBootstrap
    assert.deepEqual(plan.governance.labelsToAdd, ["gef-managed", "governed"]);
    // resolveCanonical
    assert.ok(["READY", "CONFLICT", "UNKNOWN"].includes(plan.canonical.state));
    assert.match(plan.canonical.digest, /^[0-9a-f]{64}$/);
    // detectDrift
    assert.ok(["NONE", "EXPECTED", "UNEXPECTED"].includes(plan.drift.class));
    assert.match(plan.drift.digest, /^[0-9a-f]{64}$/);

    const preview = JSON.parse(gef(["adopt", "--target", target, "--json"]).stdout).value.preview;
    // backupManifest
    assert.equal(preview.backup.verified, true);
    // recoveryPlan
    assert.equal(preview.recovery.action, "RESTART");
    // installPlan
    assert.equal(preview.install.state, "READY");
    // detectDrift / resolveCanonical
    assert.ok(preview.drift.class.length > 0 && preview.canonical.state.length > 0);

    assert.ok(!existsSync(join(target, ".gef")), "plan and preview must stay side-effect free");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

// ------------------------------------------------- H1 — governed mutation

test("CLI-E2E-07: apply runs through the transaction engine and writes schema-bound documents", () => {
  const target = tempTarget();
  try {
    writeFileSync(join(target, "USER-README.md"), "user owned\n");
    const applied = gef(["init", "--apply", "--target", target, "--json"]);
    assert.equal(applied.code, 0);
    const envelope = JSON.parse(applied.stdout);
    assert.equal(envelope.value.transaction.outcome, "APPLIED");
    assert.match(envelope.value.transaction.planDigest, /^[0-9a-f]{64}$/);
    assert.match(envelope.value.transaction.receiptDigest, /^[0-9a-f]{64}$/);

    const artifactPath = join(target, ".gef", "init-state.json");
    const document = JSON.parse(readFileSync(artifactPath, "utf8"));
    assert.equal(document.schemaVersion, "1.0");
    assert.equal(document.kind, "gef.init.state");
    assert.equal(document.commandId, "gef.init.run");
    assert.equal(document.productVersion, rootPackage.version);
    assert.match(document.observationFingerprint, /^[0-9a-f]{64}$/);

    // Receipt persisted through the same governed path, bound to its own schema.
    const receipts = readdirSync(join(target, ".gef", "receipts"));
    assert.equal(receipts.length, 1);
    const receipt = JSON.parse(readFileSync(join(target, ".gef", "receipts", receipts[0]), "utf8"));
    assert.equal(receipt.kind, "gef.cli.receipt");
    assert.equal(receipt.schemaVersion, "1.0");
    assert.equal(receipt.effectStatus, "CONFIRMED");
    assert.deepEqual(receipt.lifecyclePhases, ["RECEIVED", "VALIDATING", "PREFLIGHTING", "READY", "EXECUTING", "VERIFYING", "RECEIPTING"]);

    // Transaction journal evidence survives cleanup.
    const journals = readdirSync(join(target, ".gef-private", "journal"));
    assert.ok(journals.some((name) => name.includes("init")), "a journal must be recorded for the applied transaction");
    // Transaction-private staging does not.
    assert.ok(!existsSync(join(target, ".gef-private", journalTransactionSegment(journals, "init"))));

    // Preservation: a second apply is refused and the original document survives byte for byte.
    const before = readFileSync(artifactPath, "utf8");
    const second = gef(["init", "--apply", "--target", target]);
    assert.notEqual(second.code, 0, "a second managed create must not succeed");
    assert.equal(readFileSync(artifactPath, "utf8"), before);
    assert.equal(readFileSync(join(target, "USER-README.md"), "utf8"), "user owned\n");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

function journalTransactionSegment(names, marker) {
  const name = names.find((candidate) => candidate.includes(marker));
  return name === undefined ? "__none__" : name.replace(/\.json$/, "");
}

test("adopt apply runs the governed path and leaves brownfield source untouched", () => {
  const target = tempTarget();
  try {
    mkdirSync(join(target, "src"), { recursive: true });
    writeFileSync(join(target, "src", "legacy.js"), "// existing brownfield source\n");

    const applied = gef(["adopt", "--apply", "--target", target, "--json"]);
    assert.equal(applied.code, 0);
    const envelope = JSON.parse(applied.stdout);
    assert.equal(envelope.value.commandId, "gef.adopt.apply");
    assert.equal(envelope.value.transaction.outcome, "APPLIED");
    assert.ok(existsSync(join(target, ".gef", "adopt-state.json")));
    assert.equal(JSON.parse(readFileSync(join(target, ".gef", "adopt-state.json"), "utf8")).kind, "gef.adopt.state");
    assert.equal(readFileSync(join(target, "src", "legacy.js"), "utf8"), "// existing brownfield source\n");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

function git(target, args) {
  const result = spawnSync("git", ["-C", target, ...args], { encoding: "utf8", timeout: 60_000 });
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout ?? "";
}

/** A real repository, so dirtiness is observable and the operation sentinel is the only anomaly. */
function initGitRepo(target) {
  git(target, ["init", "-q"]);
  git(target, ["config", "user.email", "executor@example.invalid"]);
  git(target, ["config", "user.name", "GEF Executor"]);
  writeFileSync(join(target, "seed.txt"), "seed\n");
  git(target, ["add", "."]);
  git(target, ["commit", "-qm", "seed"]);
}

test("a repository mid-operation is a precondition block for apply", () => {
  const target = tempTarget();
  try {
    initGitRepo(target);
    // A real in-flight operation: the sentinel is present while the working tree stays observable.
    writeFileSync(join(target, ".git", "MERGE_HEAD"), `${"0".repeat(40)}\n`);

    const result = gef(["init", "--apply", "--target", target, "--json"]);
    assert.equal(result.code, 20, "an in-flight Git operation must block the mutation");
    assert.equal(JSON.parse(result.stdout).error.reasonCode, "gef.precondition.repository_operation_in_progress");
    assert.ok(!existsSync(join(target, ".gef")), "a blocked run must not create governed state");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("an unobservable working tree blocks apply with zero target effect", () => {
  const target = tempTarget();
  try {
    // Git identity is present but not a usable repository, so dirtiness cannot be proven.
    mkdirSync(join(target, ".git"), { recursive: true });
    writeFileSync(join(target, ".git", "HEAD"), "ref: refs/heads/main\n");
    writeFileSync(join(target, "USER.txt"), "user content\n");

    const plan = gef(["init", "--target", target, "--json"]);
    assert.equal(plan.code, 0);
    const observed = JSON.parse(plan.stdout).value.plan.repository;
    assert.equal(observed.dirtiness, "UNKNOWN");
    assert.equal(observed.verdict, null, "no engine verdict may be fabricated from an unobserved tree");

    const applied = gef(["init", "--apply", "--target", target, "--json"]);
    assert.equal(applied.code, 20);
    assert.equal(JSON.parse(applied.stdout).error.reasonCode, "gef.precondition.repository_state_unknown");
    assert.ok(!existsSync(join(target, ".gef")), "a blocked run must not create governed state");
    assert.equal(readFileSync(join(target, "USER.txt"), "utf8"), "user content\n");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
