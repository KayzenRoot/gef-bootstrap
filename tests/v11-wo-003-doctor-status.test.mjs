// GBS-V11-WO-003 — focused contract for `gef doctor` and `gef status`.
//
// Both commands are read-only diagnostic projections over verified engines. These cases cover the
// command identity, the frozen delegation maps, the "never synthesize a healthy verdict" rule, the
// Git-unavailable closure of the carried WO-002 finding F2, and the no-mutation contract.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { tmpdir } from "node:os";

import {
  ADMITTED_VERBS,
  CLI_COMMAND_IDS,
  DIAGNOSTIC_FILE_MAX_BYTES,
  DIAGNOSTIC_SOURCE_MAX_FILES,
  HELP_INVENTORY,
  SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS,
  buildRegistry,
  cliRegistrations,
  gitBinaryAvailable,
  loadEngines,
  observeDocumentation,
  observeGovernance,
  observeGovernanceFiles,
  observeTarget,
  parseArgv,
  readContainedDiagnosticFile,
  runCli,
  validateGovernanceCheckpoint,
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
  writeFileSync(join(root, ".engineering", "CHECKPOINT.json"), JSON.stringify({ schemaVersion: 2, status: "SOMETHING", overallCompletionPercent: 42, v11: { status: "OVERLAY", activeWorkOrder: "X" } }));
  writeFileSync(join(root, "README.md"), "readme\n");

  const governance = observeGovernance(root);
  assert.equal(governance.present, true);
  assert.equal(governance.readable, true);
  assert.equal(governance.valid, true);
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
  assert.equal(governance.valid, false);
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
  assert.equal(status.drift, null, "no supported baseline means no authoritative drift comparison");
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
  assert.equal(afterAdopt.observationLimits.some((limit) => limit.startsWith("drift.baseline.")), false, "a supported baseline raises no baseline limitation");

  // The governed artifact is observed, never rewritten.
  const recorded = readFileSync(join(root, ".gef", "adopt-state.json"), "utf8");
  await read();
  assert.equal(readFileSync(join(root, ".gef", "adopt-state.json"), "utf8"), recorded);
});

// =========================================================================
// H1-H4 correction (objective audit review 5236410386)
// =========================================================================

const SENTINEL = "GEF-EXTERNAL-SENTINEL-DO-NOT-READ";

/** Create a directory alias. Junctions work unprivileged on Windows; symlinks elsewhere. */
function dirAlias(target, linkPath) {
  if (process.platform === "win32") {
    symlinkSync(target, linkPath, "junction");
    return "junction";
  }
  symlinkSync(target, linkPath, "dir");
  return "symlink";
}

/**
 * Create a final-file alias. A real file symlink needs elevation on Windows, so when that is
 * unavailable the same link-like refusal is exercised with a junction at the final path and the
 * gap is reported instead of being silently treated as covered.
 */
function fileAlias(target, linkPath) {
  try {
    symlinkSync(target, linkPath);
    return { kind: "symlink", gap: null };
  } catch (cause) {
    if (process.platform !== "win32") throw cause;
    symlinkSync(target, linkPath, "junction");
    return { kind: "junction", gap: "file-symlink-requires-elevation-on-this-host" };
  }
}

function poisonedTarget(t, tag) {
  const root = mkdtempSync(join(tmpdir(), `gef-${tag}-`));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const external = mkdtempSync(join(tmpdir(), `gef-${tag}-ext-`));
  t.after(() => rmSync(external, { recursive: true, force: true }));
  mkdirSync(join(external, ".engineering"), { recursive: true });
  writeFileSync(
    join(external, ".engineering", "CHECKPOINT.json"),
    JSON.stringify({ schemaVersion: 2, status: SENTINEL, overallCompletionPercent: 100, v11: { status: SENTINEL } }),
  );
  writeFileSync(join(external, "README.md"), `${SENTINEL}\n`);
  return { root, external };
}

// ------------------------------------------------------------------- H1

test("H1: the shared read helper refuses a lexical escape", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h1-escape-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outside = mkdtempSync(join(tmpdir(), "gef-h1-outside-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(join(outside, "secret.txt"), SENTINEL);

  for (const ref of ["../secret.txt", ".engineering/../../secret.txt"]) {
    const outcome = readContainedDiagnosticFile(root, ref);
    assert.equal(outcome.status, "ALIAS_REFUSED", `${ref} must not be read`);
    assert.equal(outcome.bytes, null);
    assert.match(outcome.limit, /^DIAGNOSTIC_PATH_ESCAPE:/);
  }
  // An absolute path is refused for the same reason.
  assert.equal(readContainedDiagnosticFile(root, join(outside, "secret.txt")).status, "ALIAS_REFUSED");
});

test("H1: an ancestor directory alias is refused and its content never reaches output", async (t) => {
  const { root, external } = poisonedTarget(t, "h1-ancestor");
  mkdirSync(root, { recursive: true });
  dirAlias(join(external, ".engineering"), join(root, ".engineering"));

  const governance = observeGovernance(root);
  assert.equal(governance.present, true, "the path exists, so it is not reported as absent");
  assert.equal(governance.readable, false);
  assert.equal(governance.valid, false);
  assert.equal(governance.production, null);
  assert.equal([...governance.observationLimits][0].startsWith("DIAGNOSTIC_ALIAS_REFUSED"), true);

  // Sensitivity: the naive `resolve` + `readFileSync` this correction replaced really does follow
  // the alias out of the root, so this fixture genuinely exercises the escape.
  assert.equal(readFileSync(join(root, ".engineering", "CHECKPOINT.json"), "utf8").includes(SENTINEL), true, "the alias is a real escape; only the contained read refuses it");
  assert.equal(existsSync(join(root, ".engineering")), true);

  // The alias is not a diagnostic file and its bytes never enter any projection.
  assert.equal(observeGovernanceFiles(root).includes(".engineering/CHECKPOINT.json"), false);
  assert.equal(observeDocumentation(root).some((entry) => entry.id === "README.md"), false);

  for (const verb of ["doctor", "status"]) {
    const captured = deps([verb, "--target", root, "--json"]);
    assert.equal(await runCli(captured), 0);
    const text = captured.out.join("");
    assert.equal(text.includes(SENTINEL), false, `${verb} must not expose aliased content`);
    assert.equal(text.includes(external), false, `${verb} must not expose the alias destination`);
  }
});

test("H1: a link-like final governance target is refused, never followed", (t) => {
  const { root, external } = poisonedTarget(t, "h1-final");
  mkdirSync(join(root, ".engineering"), { recursive: true });
  const alias = fileAlias(join(external, ".engineering"), join(root, ".engineering", "CHECKPOINT.json"));
  if (alias.gap !== null) t.diagnostic(`H1 evidence gap on ${process.platform}: ${alias.gap}`);

  const outcome = readContainedDiagnosticFile(root, ".engineering/CHECKPOINT.json");
  assert.equal(outcome.status, "ALIAS_REFUSED");
  assert.equal(outcome.bytes, null, "no content is returned for a refused alias");

  const governance = observeGovernance(root);
  assert.equal(governance.present, true);
  assert.equal(governance.readable, false);
  assert.equal(governance.production, null);
});

test("H1: a link-like documentation source never enters the manifest", (t) => {
  const { root, external } = poisonedTarget(t, "h1-doc");
  const alias = fileAlias(join(external, "README.md"), join(root, "README.md"));
  if (alias.gap !== null) t.diagnostic(`H1 evidence gap on ${process.platform}: ${alias.gap}`);

  assert.deepEqual([...observeDocumentation(root)], [], "a refused source contributes no entry");
  assert.equal(observeGovernanceFiles(root).length, 0);
  assert.equal(readContainedDiagnosticFile(root, "README.md").status, "ALIAS_REFUSED");
});

test("H1: a path that is not a regular file is refused, not read", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h1-kind-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".engineering", "CHECKPOINT.json"), { recursive: true });

  const outcome = readContainedDiagnosticFile(root, ".engineering/CHECKPOINT.json");
  assert.equal(outcome.status, "NOT_REGULAR");
  assert.match(outcome.limit, /^DIAGNOSTIC_NOT_REGULAR:/);
  // A directory where a file is expected is not "absent": it is an explicit refusal.
  assert.equal(observeGovernance(root).present, true);
});

test("H1: contained regular files still work normally", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h1-ok-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".engineering"), { recursive: true });
  writeFileSync(join(root, ".engineering", "CHECKPOINT.json"), JSON.stringify({ schemaVersion: 2, status: "OK_STATE" }));
  writeFileSync(join(root, "README.md"), "readme\n");

  const outcome = readContainedDiagnosticFile(root, ".engineering/CHECKPOINT.json");
  assert.equal(outcome.status, "OK");
  assert.equal(outcome.limit, null);
  assert.ok(outcome.bytes.length > 0);

  const governance = observeGovernance(root);
  assert.equal(governance.valid, true);
  assert.equal(governance.production.status, "OK_STATE");
  assert.deepEqual([...observeGovernanceFiles(root)], [".engineering/CHECKPOINT.json", "README.md"]);
  assert.equal(observeDocumentation(root).length, 2);
  assert.equal(observeDocumentation(root).find((entry) => entry.id === "README.md").digest, createHash("sha256").update("readme\n").digest("hex"));
});

// ------------------------------------------------------------------- H2

test("H2: the diagnostic budgets are explicit constants", () => {
  assert.equal(Number.isInteger(DIAGNOSTIC_FILE_MAX_BYTES), true);
  assert.equal(Number.isInteger(DIAGNOSTIC_SOURCE_MAX_FILES), true);
  assert.ok(DIAGNOSTIC_FILE_MAX_BYTES > 0 && DIAGNOSTIC_FILE_MAX_BYTES <= 8 * 1024 * 1024);
  assert.ok(DIAGNOSTIC_SOURCE_MAX_FILES > 0 && DIAGNOSTIC_SOURCE_MAX_FILES <= 1024);
});

test("H2: a file exactly at the budget is accepted and one byte over is refused", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h2-edge-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const budget = 64;

  writeFileSync(join(root, "sized.bin"), Buffer.alloc(budget, 0x61));
  const atLimit = readContainedDiagnosticFile(root, "sized.bin", budget);
  assert.equal(atLimit.status, "OK");
  assert.equal(atLimit.bytes.length, budget);

  writeFileSync(join(root, "sized.bin"), Buffer.alloc(budget + 1, 0x61));
  const overLimit = readContainedDiagnosticFile(root, "sized.bin", budget);
  assert.equal(overLimit.status, "OVER_BUDGET");
  assert.equal(overLimit.bytes, null, "nothing is returned, so oversized content cannot be parsed as evidence");
  assert.equal(overLimit.limit, "DIAGNOSTIC_FILE_OVER_BUDGET:sized.bin");
});

test("H2: the default budget itself is enforced at the boundary", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h2-default-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  writeFileSync(join(root, "big.bin"), Buffer.alloc(DIAGNOSTIC_FILE_MAX_BYTES, 0x61));
  assert.equal(readContainedDiagnosticFile(root, "big.bin").status, "OK");

  writeFileSync(join(root, "big.bin"), Buffer.alloc(DIAGNOSTIC_FILE_MAX_BYTES + 1, 0x61));
  assert.equal(readContainedDiagnosticFile(root, "big.bin").status, "OVER_BUDGET");
});

test("H2: an over-budget checkpoint cannot populate release or operator semantics", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h2-gov-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".engineering"), { recursive: true });
  writeFileSync(join(root, ".engineering", "CHECKPOINT.json"), JSON.stringify({ schemaVersion: 2, status: "FABRICATED", overallCompletionPercent: 100 }));

  const governance = observeGovernance(root, 8);
  assert.equal(governance.present, true);
  assert.equal(governance.readable, false);
  assert.equal(governance.valid, false);
  assert.equal(governance.production, null, "over-budget content yields no production values");
  assert.deepEqual([...governance.observationLimits], ["DIAGNOSTIC_FILE_OVER_BUDGET:.engineering/CHECKPOINT.json"]);
});

test("H2: an over-budget documentation source cannot enter the manifest", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h2-doc-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "README.md"), "x".repeat(100));

  assert.deepEqual([...observeDocumentation(root, 64)], []);
  assert.equal(observeDocumentation(root, 100).length, 1, "the same file is admitted when the budget allows it");
});

test("H2: over-budget is never reported as absent", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h2-not-absent-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".engineering"), { recursive: true });
  writeFileSync(join(root, ".engineering", "CHECKPOINT.json"), "{}");

  const governance = observeGovernance(root, 1);
  assert.equal(governance.present, true, "an over-budget source is present, not absent");
  assert.equal(governance.readable, false);
  assert.equal(governance.observationLimits.includes("GOVERNANCE_SOURCE_ABSENT"), false);
});

// ------------------------------------------------------------------- H3

/** Write a governed baseline whose recorded observation matches the target exactly. */
function recordMatchingBaseline(root, verb = "init") {
  mkdirSync(join(root, ".gef"), { recursive: true });
  const path = join(root, ".gef", `${verb}-state.json`);
  writeFileSync(path, JSON.stringify({ schemaVersion: "1.0", observationFingerprint: "placeholder" }));
  // The observation covers the root entry listing only, so rewriting the document content does not
  // change it.
  const fingerprint = observeTarget(root).stateFingerprint;
  writeFileSync(path, JSON.stringify({ schemaVersion: "1.0", observationFingerprint: fingerprint }));
  return fingerprint;
}

async function statusOf(root) {
  const captured = deps(["status", "--target", root, "--json"]);
  assert.equal(await runCli(captured), 0);
  return JSON.parse(captured.out.join("")).value.status;
}

test("H3: a never-governed target emits no drift event at all", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h3-none-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "README.md"), "readme\n");

  const status = await statusOf(root);
  assert.equal(status.drift, null, "no supported baseline means no authoritative comparison");
  assert.deepEqual(status.driftBaseline, { state: "ABSENT", ref: null });
  assert.equal(JSON.stringify(status).includes("UNEXPECTED"), false, "no fabricated change event may appear anywhere");
  assert.ok(status.observationLimits.includes("drift.baseline.absent"));
  assert.ok(status.observationLimits.includes("operator.stale.unknown_conservative"), "the conservative staleness must be explained");
  assert.equal(status.operator.stale, true, "staleness stays conservative when it cannot be known");
});

test("H3: a governed unchanged target reports no drift", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h3-same-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  recordMatchingBaseline(root);

  const status = await statusOf(root);
  assert.notEqual(status.drift, null, "a supported baseline is compared");
  assert.deepEqual(status.driftBaseline, { state: "RECORDED", ref: ".gef/init-state.json" });
  assert.equal(status.drift.changed, false);
  assert.equal(status.drift.class, "NONE");
  assert.equal(status.observationLimits.some((limit) => limit.startsWith("drift.baseline.")), false);
});

test("H3: a governed changed target still reports real drift", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h3-changed-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  recordMatchingBaseline(root);
  assert.equal((await statusOf(root)).drift.changed, false);

  writeFileSync(join(root, "NEW-FILE.txt"), "added after the baseline\n");
  const status = await statusOf(root);
  assert.equal(status.drift.changed, true);
  assert.equal(status.drift.class, "UNEXPECTED", "real unauthorised drift is still reported by the engine verbatim");
  assert.equal(status.operator.stale, true);
});

test("H3: an adopted target is a valid baseline too", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h3-adopt-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  recordMatchingBaseline(root, "adopt");

  const status = await statusOf(root);
  assert.deepEqual(status.driftBaseline, { state: "RECORDED", ref: ".gef/adopt-state.json" });
  assert.equal(status.drift.changed, false);
});

test("H3: an unusable recorded document is not treated as a baseline", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h3-bad-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".gef"), { recursive: true });
  writeFileSync(join(root, ".gef", "init-state.json"), JSON.stringify({ schemaVersion: "9.0", observationFingerprint: "x" }));

  const status = await statusOf(root);
  assert.equal(status.drift, null, "an unsupported document is not a baseline");
  assert.deepEqual(status.driftBaseline, { state: "UNSUPPORTED", ref: ".gef/init-state.json" });
  assert.ok(status.observationLimits.includes("drift.baseline.unsupported"));
});

// ------------------------------------------------------------------- H4

test("H4: the checkpoint gate accepts only well-formed supported documents", () => {
  assert.equal([...SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS].includes(2), true);
  assert.equal(validateGovernanceCheckpoint({ schemaVersion: 2 }).valid, true);
  assert.equal(validateGovernanceCheckpoint({ schemaVersion: 2, status: "S", overallCompletionPercent: 0 }).valid, true);
  assert.equal(validateGovernanceCheckpoint({ schemaVersion: 2, overallCompletionPercent: 100 }).valid, true);
});

test("H4: the checkpoint gate rejects non-objects, arrays and unsupported versions", () => {
  for (const value of [null, 42, "text", [], [{ schemaVersion: 2 }]]) {
    const result = validateGovernanceCheckpoint(value);
    assert.equal(result.valid, false, `${JSON.stringify(value)} must be rejected`);
    assert.equal(result.production, null);
  }
  for (const version of [undefined, "2", 1, 3, 2.5, null]) {
    const result = validateGovernanceCheckpoint({ schemaVersion: version, status: "S" });
    assert.equal(result.valid, false, `schemaVersion ${String(version)} must be rejected`);
    assert.match(result.limit, /^GOVERNANCE_CHECKPOINT_SCHEMA_UNSUPPORTED:/);
  }
});

test("H4: the checkpoint gate rejects wrong field types and impossible progress", () => {
  const cases = [
    [{ schemaVersion: 2, status: 7 }, "GOVERNANCE_CHECKPOINT_FIELD_TYPE_INVALID:status"],
    [{ schemaVersion: 2, nextLegalStage: [] }, "GOVERNANCE_CHECKPOINT_FIELD_TYPE_INVALID:nextLegalStage"],
    [{ schemaVersion: 2, earnedProductionWeight: "1088" }, "GOVERNANCE_CHECKPOINT_FIELD_TYPE_INVALID:earnedProductionWeight"],
    [{ schemaVersion: 2, overallCompletionPercent: Number.NaN }, "GOVERNANCE_CHECKPOINT_FIELD_TYPE_INVALID:overallCompletionPercent"],
    [{ schemaVersion: 2, overallCompletionPercent: Number.POSITIVE_INFINITY }, "GOVERNANCE_CHECKPOINT_FIELD_TYPE_INVALID:overallCompletionPercent"],
    [{ schemaVersion: 2, overallCompletionPercent: 999 }, "GOVERNANCE_CHECKPOINT_PROGRESS_OUT_OF_RANGE:999"],
    [{ schemaVersion: 2, overallCompletionPercent: -1 }, "GOVERNANCE_CHECKPOINT_PROGRESS_OUT_OF_RANGE:-1"],
    [{ schemaVersion: 2, v11: [] }, "GOVERNANCE_CHECKPOINT_OVERLAY_INVALID"],
    [{ schemaVersion: 2, v11: "overlay" }, "GOVERNANCE_CHECKPOINT_OVERLAY_INVALID"],
  ];
  for (const [value, limit] of cases) {
    const result = validateGovernanceCheckpoint(value);
    assert.equal(result.valid, false, `${JSON.stringify(value)} must be rejected`);
    assert.equal(result.limit, limit);
    assert.equal(result.production, null);
    assert.equal(result.development, null);
  }
});

test("H4: a valid checkpoint still projects both layers separately", () => {
  const result = validateGovernanceCheckpoint({ schemaVersion: 2, status: "GBS_V1_PRODUCTION_ACCEPTED", overallCompletionPercent: 100, v11: { status: "OVERLAY", activeWorkOrder: "GBS-V11-WO-003" } });
  assert.equal(result.valid, true);
  assert.equal(result.production.status, "GBS_V1_PRODUCTION_ACCEPTED");
  assert.equal(result.production.overallCompletionPercent, 100);
  assert.equal(result.development.status, "OVERLAY");
  assert.equal(result.limit, null);
});

test("H4: an invalid checkpoint never becomes status semantics", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h4-status-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".engineering"), { recursive: true });
  writeFileSync(
    join(root, ".engineering", "CHECKPOINT.json"),
    JSON.stringify({ status: "GBS_V1_PRODUCTION_ACCEPTED", overallCompletionPercent: 100, stopState: "DONE", v11: { status: "APPROVED" } }),
  );

  const status = await statusOf(root);
  assert.equal(status.release.present, true, "presence is still reported");
  assert.equal(status.release.readable, true, "the bytes were read");
  assert.equal(status.release.valid, false, "but the document is not authoritative");
  assert.equal(status.release.production, null);
  assert.equal(status.release.development, null);
  assert.equal(status.operator.progress, null);
  assert.notEqual(status.operator.state, "GBS_V1_PRODUCTION_ACCEPTED");
  assert.equal(JSON.stringify(status).includes("APPROVED"), false, "text in a file is not approval");
  assert.ok(status.observationLimits.some((limit) => limit.startsWith("GOVERNANCE_CHECKPOINT_SCHEMA_UNSUPPORTED")));
});

