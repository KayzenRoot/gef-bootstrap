// GBS-V11-WO-003 — focused contract for `gef doctor` and `gef status`.
//
// Both commands are read-only diagnostic projections over verified engines. These cases cover the
// command identity, the frozen delegation maps, the "never synthesize a healthy verdict" rule, the
// Git-unavailable closure of the carried WO-002 finding F2, and the no-mutation contract.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { tmpdir } from "node:os";

import {
  ADMITTED_VERBS,
  CLI_COMMAND_IDS,
  HELP_INVENTORY,
  buildRegistry,
  cliRegistrations,
  gitBinaryAvailable,
  loadEngines,
  observeDocumentation,
  observeGovernance,
  observeGovernanceFiles,
  parseArgv,
  runCli,
} from "../packages/cli/dist/index.js";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// --------------------------------------------------------------------- parser

test("doctor and status resolve through their canonical command IDs", () => {
  assert.equal(parseArgv(["doctor"]).commandId, "gef.doctor.run");
  assert.equal(parseArgv(["status"]).commandId, "gef.status.show");
  assert.equal(parseArgv(["doctor", "--json"]).json, true);
  assert.equal(parseArgv(["status", "--target", "somewhere"]).targetRef, "somewhere");
  assert.ok(ADMITTED_VERBS.includes("doctor") && ADMITTED_VERBS.includes("status"));
});

test("neither read-only command admits a mutation flag", () => {
  for (const verb of ["doctor", "status"]) {
    const parsed = parseArgv([verb, "--apply"]);
    assert.equal(parsed.kind, "failure", `${verb} --apply must be a usage failure`);
    assert.equal(parsed.reason, "apply_not_admitted");
  }
});

test("unknown input stays on the canonical usage path", () => {
  assert.equal(parseArgv(["doctor", "--nope"]).reason, "unknown_flag");
  assert.equal(parseArgv(["doctor", "--target"]).reason, "missing_target_value");
  assert.equal(parseArgv(["upgrade"]).reason, "unknown_command", "upgrade remains WO-004");
});

// ------------------------------------------------------------------- registry

test("registry publishes both diagnostic commands as read-only and target-optional", () => {
  const introspection = buildRegistry().introspect();
  const byId = Object.fromEntries(introspection.map((entry) => [entry.commandId, entry]));
  for (const [commandId, owner] of [
    ["gef.doctor.run", "m48-m54-maintenance+security-reliability-integrations"],
    ["gef.status.show", "m41-m47-platform+m55-m61-quality+m62-m63-final"],
  ]) {
    assert.ok(byId[commandId], `${commandId} must be registered`);
    assert.equal(byId[commandId].mutation, false, `${commandId} must be read-only`);
    assert.equal(byId[commandId].requiresTarget, false);
    assert.equal(byId[commandId].owner, owner, `${commandId} must declare its engine ownership`);
  }
  assert.deepEqual([...CLI_COMMAND_IDS].sort(), introspection.map((entry) => entry.commandId).sort());
});

test("the help inventory covers every admitted command", () => {
  assert.deepEqual([...HELP_INVENTORY].map((entry) => entry.id).sort(), [...CLI_COMMAND_IDS].sort());
  for (const commandId of ["gef.doctor.run", "gef.status.show"]) {
    assert.equal(typeof HELP_INVENTORY.find((entry) => entry.id === commandId)?.summary, "string");
  }
});

test("diagnostic input validation refuses a mutation intent or malformed input", () => {
  const validate = buildRegistry().get("gef.doctor.run").validateInput;
  assert.equal(validate(null).ok, false);
  assert.equal(validate({ verb: "init", apply: false }).ok, false);
  assert.equal(validate({ verb: "doctor", apply: true }).ok, false, "an apply intent must not reach a read-only command");
  assert.equal(validate({ verb: "doctor", targetRef: 5 }).ok, false);
  assert.equal(validate({ verb: "doctor" }).ok, true);
  assert.equal(validate({ verb: "status" }).ok, true);
});

// --------------------------------------------- the frozen delegation maps

test("the doctor delegation map is bound by explicit engine ownership", async () => {
  const engines = await loadEngines();
  for (const symbol of ["doctor", "repairSuggestion", "invariantResult", "dependencySecurity", "githubSecurity", "integritySnapshot", "capabilityEnvelope", "safetyDecision"]) {
    assert.equal(typeof engines[symbol], "function", `doctor must delegate to ${symbol}`);
  }
});

test("the status delegation map is bound by explicit engine ownership", async () => {
  const engines = await loadEngines();
  for (const symbol of ["operatorStatus", "repositoryState", "documentationManifest", "navigationPlan"]) {
    assert.equal(typeof engines[symbol], "function", `status must delegate to ${symbol}`);
  }
});

test("the delegated engines keep their accepted fail-closed semantics", async () => {
  const engines = await loadEngines();
  // Unknown observations are UNKNOWN, never HEALTHY.
  assert.deepEqual(engines.doctor({ "a.b": undefined }), [{ id: "a.b", state: "UNKNOWN" }]);
  assert.deepEqual(engines.doctor({}), []);
  assert.deepEqual(engines.doctor({ "a.b": false }), [{ id: "a.b", state: "FINDING" }]);
  assert.deepEqual(engines.doctor({ "a.b": true }), [{ id: "a.b", state: "HEALTHY" }]);

  // Remediation is guidance: never automatic, always preview-first.
  const suggestion = engines.repairSuggestion("toolchain.git");
  assert.equal(suggestion.automatic, false);
  assert.equal(suggestion.previewRequired, true);

  // Unverified dependency provenance is REVIEW, never PASS.
  assert.equal(engines.dependencySecurity({}).state, "UNKNOWN");
  assert.equal(engines.dependencySecurity({ manifestDigest: "a", lockDigest: "b", provenance: "unverified" }).state, "REVIEW");
  // Absent provider evidence is REVIEW, never PASS by omission.
  assert.equal(engines.githubSecurity({}).state, "REVIEW");

  // Capabilities that were not verified are reported unknown, and the envelope degrades.
  assert.equal(engines.capabilityEnvelope([{ capability: "x", verified: false }]).state, "DEGRADED");
  assert.deepEqual([...engines.capabilityEnvelope([{ capability: "x" }]).unknown], ["x"]);

  // Invariants compare exactly.
  assert.equal(engines.invariantResult("i", 1, 1).pass, true);
  assert.equal(engines.invariantResult("i", 1, 2).pass, false);
});

// ------------------------------------------------------------- observations

test("governance observation reports what the target declares, and nothing more", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-obs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  assert.equal(observeGovernance(root).present, false);
  assert.deepEqual(observeGovernanceFiles(root), []);
  assert.deepEqual([...observeDocumentation(root)], []);

  mkdirSync(join(root, ".engineering"), { recursive: true });
  writeFileSync(join(root, ".engineering", "CHECKPOINT.json"), JSON.stringify({ status: "SOMETHING", overallCompletionPercent: 42, v11: { status: "OVERLAY", activeWorkOrder: "X" } }));
  writeFileSync(join(root, "README.md"), "readme\n");

  const governance = observeGovernance(root);
  assert.equal(governance.present, true);
  assert.equal(governance.readable, true);
  assert.equal(governance.production?.status, "SOMETHING");
  assert.equal(governance.production?.overallCompletionPercent, 42);
  assert.equal(governance.development?.status, "OVERLAY", "the development overlay stays separate from the production truth");
  assert.deepEqual([...observeGovernanceFiles(root)], [".engineering/CHECKPOINT.json", "README.md"]);
  assert.equal(observeDocumentation(root).length, 2);
});

test("an unreadable governance source is reported as such, not as absent", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-obs-bad-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".engineering"), { recursive: true });
  writeFileSync(join(root, ".engineering", "CHECKPOINT.json"), "{ not json");
  const governance = observeGovernance(root);
  assert.equal(governance.present, true);
  assert.equal(governance.readable, false);
  assert.equal(governance.production, null);
  assert.deepEqual([...governance.observationLimits], ["GOVERNANCE_SOURCE_NOT_PARSEABLE"]);
});

test("the git probe reports the binary truthfully", () => {
  assert.equal(typeof gitBinaryAvailable(), "boolean");
  // In this environment git is present; the unavailable path is exercised end to end in the E2E suite.
  assert.equal(gitBinaryAvailable(), true);
});

// ----------------------------------------------------------- no mutation

/** Whole-tree snapshot: every path with its kind and content digest. */
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
  return { status: run(["status", "--porcelain"]), branch: run(["rev-parse", "--abbrev-ref", "HEAD"]), head: run(["rev-parse", "HEAD"]), tags: run(["tag", "--list"]) };
}

function deps(argv) {
  const out = [];
  const err = [];
  return {
    argv,
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
    env: {},
    cwd: ROOT,
    platform: process.platform,
    nodeVersion: process.version,
    architecture: process.arch,
    productVersion: "1.1.0",
    stdoutIsTty: false,
    out,
    err,
  };
}

test("doctor and status mutate neither the project tree nor Git state", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-nomut-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "app.js"), "// user source\n");
  writeFileSync(join(root, "README.md"), "user readme\n");
  const run = (args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 30_000 });
  run(["init", "-q"]);
  run(["config", "user.email", "executor@example.invalid"]);
  run(["config", "user.name", "GEF Executor"]);
  run(["add", "."]);
  run(["commit", "-qm", "seed"]);

  const treeBefore = snapshot(root);
  const gitBefore = gitState(root);

  for (const verb of ["doctor", "status"]) {
    const captured = deps([verb, "--target", root]);
    const code = await runCli(captured);
    assert.equal(code, 0, `${verb} must exit 0 for a healthy invocation`);
    assert.deepEqual(snapshot(root), treeBefore, `${verb} must not change the project tree`);
    assert.deepEqual(gitState(root), gitBefore, `${verb} must not change Git state`);
    assert.equal(existsSync(join(root, ".gef")), false, `${verb} must not create .gef state`);
    assert.equal(existsSync(join(root, ".gef-private")), false, `${verb} must not create transaction substrate`);
  }
});

test("the doctor projection reports the frozen delegation surface truthfully", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-doctor-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const captured = deps(["doctor", "--target", root, "--json"]);
  assert.equal(await runCli(captured), 0);
  const envelope = JSON.parse(captured.out.join(""));
  assert.equal(envelope.commandId, "gef.doctor.run");
  assert.equal(envelope.value.effect, "NONE");
  const doctor = envelope.value.doctor;
  assert.equal(doctor.readOnly, true);
  assert.ok(Array.isArray(doctor.findings));
  assert.ok(Array.isArray(doctor.remediation));
  assert.equal(doctor.security.dependency.state !== "PASS", true, "dependency security must never be reported as PASS without independent verification");
  assert.equal(doctor.security.github.state, "REVIEW", "absent provider evidence is REVIEW");
  assert.equal(typeof doctor.integrity.digest, "string");
  for (const finding of doctor.findings) assert.ok(["HEALTHY", "FINDING", "UNKNOWN"].includes(finding.state));
  for (const suggestion of doctor.remediation) {
    assert.equal(suggestion.automatic, false, "remediation is never automatic");
    assert.equal(suggestion.previewRequired, true);
  }
});

test("the status projection keeps production truth and the development overlay distinct", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-status-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const captured = deps(["status", "--target", root, "--json"]);
  assert.equal(await runCli(captured), 0);
  const envelope = JSON.parse(captured.out.join(""));
  assert.equal(envelope.commandId, "gef.status.show");
  assert.equal(envelope.value.effect, "NONE");
  const status = envelope.value.status;
  assert.equal(status.readOnly, true);
  assert.ok("production" in status.release && "development" in status.release);
  assert.equal(status.release.present, false, "a target without a governance source declares nothing");
  assert.equal(status.operator.progress, null, "progress is never invented when the target declares none");
  assert.ok(Array.isArray(status.documentation.entries));
  assert.ok(Array.isArray(status.navigation.files));
  assert.deepEqual(status.driftBaseline, { state: "ABSENT", ref: null }, "a target with no governed artifact has no baseline");
  assert.ok(status.observationLimits.includes("drift.baseline.absent"), "the absent baseline is declared as an observation limit");
});

test("the status baseline is taken from whichever governed artifact exists", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-status-baseline-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "README.md"), "user readme\n");

  const read = async () => {
    const captured = deps(["status", "--target", root, "--json"]);
    assert.equal(await runCli(captured), 0);
    return JSON.parse(captured.out.join("")).value.status;
  };

  assert.equal((await read()).driftBaseline.state, "ABSENT");

  // An adopted target is governed too: the baseline must not be assumed to come from `init`.
  const adopted = deps(["adopt", "--apply", "--target", root, "--json"]);
  assert.equal(await runCli(adopted), 0);
  assert.equal(JSON.parse(adopted.out.join("")).value.transaction.outcome, "APPLIED");
  const afterAdopt = await read();
  assert.deepEqual(afterAdopt.driftBaseline, { state: "RECORDED", ref: ".gef/adopt-state.json" });
  assert.deepEqual(afterAdopt.observationLimits, []);

  // The governed artifact is observed, never rewritten.
  const recorded = readFileSync(join(root, ".gef", "adopt-state.json"), "utf8");
  await read();
  assert.equal(readFileSync(join(root, ".gef", "adopt-state.json"), "utf8"), recorded);
});
