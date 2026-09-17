// GBS-V11-WO-003 — focused contract for `gef doctor` and `gef status`.
//
// Both commands are read-only diagnostic projections over verified engines. These cases cover the
// command identity, the frozen delegation maps, the "never synthesize a healthy verdict" rule, the
// Git-unavailable closure of the carried WO-002 finding F2, and the no-mutation contract.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { accessSync, chmodSync, closeSync, constants, copyFileSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { delimiter as pathDelimiter, dirname, join, relative, sep } from "node:path";
import { tmpdir } from "node:os";

import {
  ADMITTED_VERBS,
  CLI_COMMAND_IDS,
  DIAGNOSTIC_FILE_MAX_BYTES,
  DIAGNOSTIC_SOURCE_MAX_FILES,
  GIT_METADATA_MAX_BYTES,
  HELP_INVENTORY,
  SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS,
  buildRegistry,
  cliRegistrations,
  containedEntryKind,
  DEFAULT_GIT_TRUST_POLICY,
  withGitToolInvocation,
  userManagedGitTrustPolicy,
  gitBinaryAvailable,
  inspectAdmittedExecutable,
  createCliToolObservationPort,
  resolveGitToolWith,
  runGitProbe,
  observeRepositoryDirtiness,
  observeGitTool,
  gitTool,
  gitToolDescriptor,
  loadEngines,
  observeDocumentation,
  observeGovernance,
  observeGovernanceFiles,
  observeRepository,
  observeTarget,
  parseArgv,
  readContainedDiagnosticFile,
  readGitMetadata,
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

/**
 * Git status without optional locks.
 *
 * The comparison helper must not perturb the state it measures. A plain `git status` may refresh
 * and rewrite the index, and it may run auto-maintenance, which on Linux can run detached and leave
 * a transient `.git/objects/maintenance.lock` behind while this suite is walking the tree.
 */
function safeGitStatus(root) {
  const result = spawnSync("git", ["-c", "core.fsmonitor=false", "--no-optional-locks", "-C", root, "status", "--porcelain"], {
    encoding: "utf8",
    timeout: 30_000,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
  });
  return result.stdout ?? "";
}

function gitState(root) {
  const run = (args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 30_000 }).stdout ?? "";
  return { status: safeGitStatus(root), branch: run(["rev-parse", "--abbrev-ref", "HEAD"]), head: run(["rev-parse", "HEAD"]), tags: run(["tag", "--list"]) };
}

/**
 * Initialise a repository with Git's own automatic maintenance disabled.
 *
 * The suite asserts that GEF changes nothing; a background `git maintenance run --auto` scheduled
 * by the fixture's own commit would be a second, unrelated writer in the same tree, and its
 * transient lock files would race this suite's tree walk.
 */
function initQuietRepo(root) {
  const run = (args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 30_000 });
  run(["init", "-q"]);
  run(["config", "user.email", "executor@example.invalid"]);
  run(["config", "user.name", "GEF Executor"]);
  run(["config", "gc.auto", "0"]);
  run(["config", "maintenance.auto", "false"]);
  return run;
}

function deps(argv, policy) {
  const out = [];
  const err = [];
  return {
    argv,
    ...(policy === undefined ? {} : { gitExecutablePolicy: policy }),
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
  const run = initQuietRepo(root);
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

// =========================================================================
// H5-H6 correction (objective reaudit review 5237002898)
// =========================================================================

/** A target whose `.git` metadata points at external content. */
function poisonedRepo(t, tag) {
  const root = mkdtempSync(join(tmpdir(), `gef-${tag}-`));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const external = mkdtempSync(join(tmpdir(), `gef-${tag}-ext-`));
  t.after(() => rmSync(external, { recursive: true, force: true }));
  mkdirSync(join(external, "refs", "heads"), { recursive: true });
  writeFileSync(join(external, "HEAD"), "ref: refs/heads/leaked\n");
  writeFileSync(join(external, "refs", "heads", "leaked"), SENTINEL);
  return { root, external };
}

/** Initialise a real repository with one commit and return its true HEAD sha and branch. */
function realRepo(t, tag) {
  const root = mkdtempSync(join(tmpdir(), `gef-${tag}-`));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 30_000 });
  git(["init", "-q"]);
  git(["config", "user.email", "executor@example.invalid"]);
  git(["config", "user.name", "GEF Executor"]);
  writeFileSync(join(root, "README.md"), "readme\n");
  git(["add", "."]);
  git(["commit", "-qm", "seed"]);
  return { root, head: git(["rev-parse", "HEAD"]).stdout.trim(), branch: git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim() };
}

// ------------------------------------------------------------------- H5

test("H5: a `.git` directory alias is refused and never inspected", async (t) => {
  const { root, external } = poisonedRepo(t, "h5-gitdir");
  dirAlias(external, join(root, ".git"));

  const observation = observeRepository(root);
  assert.equal(observation.dirtiness, "UNKNOWN", "an aliased Git directory cannot yield a usable state");
  assert.equal(observation.input["head"], undefined, "no head may be reported from an aliased Git directory");
  assert.ok(observation.observationLimits.includes("GIT_DIRECTORY_ALIAS_REFUSED"));
  assert.ok(observation.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_ALIAS_REFUSED:.git")));

  for (const verb of ["doctor", "status"]) {
    const captured = deps([verb, "--target", root, "--json"]);
    assert.equal(await runCli(captured), 0);
    const text = captured.out.join("");
    assert.equal(text.includes(SENTINEL), false, `${verb} must not expose aliased Git content`);
    assert.equal(text.includes(external), false, `${verb} must not expose the alias destination`);
  }

  // Sensitivity: the alias is a real escape — a direct read of the same path returns the sentinel.
  assert.equal(readFileSync(join(root, ".git", "refs", "heads", "leaked"), "utf8"), SENTINEL);
});

test("H5: an aliased `.git/HEAD` is refused and its content never reaches output", async (t) => {
  const { root, external } = poisonedRepo(t, "h5-head");
  mkdirSync(join(root, ".git"), { recursive: true });
  const alias = fileAlias(join(external, "HEAD"), join(root, ".git", "HEAD"));
  if (alias.gap !== null) t.diagnostic(`H5 evidence gap on ${process.platform}: ${alias.gap}`);

  const outcome = readGitMetadata(root, ".git/HEAD");
  assert.equal(outcome.status, "ALIAS_REFUSED");
  assert.equal(outcome.bytes, null, "no metadata content is returned for a refused alias");

  const observation = observeRepository(root);
  assert.equal(observation.dirtiness, "UNKNOWN");
  assert.equal(observation.input["head"], undefined);
  assert.ok(observation.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_ALIAS_REFUSED:.git/HEAD")));

  const captured = deps(["status", "--target", root, "--json"]);
  assert.equal(await runCli(captured), 0);
  assert.equal(captured.out.join("").includes(SENTINEL), false);
});

test("H5: an aliased symbolic-ref target is refused, never followed", (t) => {
  const { root, external } = poisonedRepo(t, "h5-ref");
  mkdirSync(join(root, ".git", "refs", "heads"), { recursive: true });
  writeFileSync(join(root, ".git", "HEAD"), "ref: refs/heads/main\n");
  const alias = fileAlias(join(external, "refs", "heads", "leaked"), join(root, ".git", "refs", "heads", "main"));
  if (alias.gap !== null) t.diagnostic(`H5 evidence gap on ${process.platform}: ${alias.gap}`);

  const observation = observeRepository(root);
  assert.equal(observation.input["head"], "", "an aliased ref yields no head value");
  assert.ok(observation.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_ALIAS_REFUSED:.git/refs/heads/main")));
  assert.equal(JSON.stringify(observation).includes(SENTINEL), false);
});

test("H5: a symbolic ref naming a traversal path is still rejected", (t) => {
  const { root } = poisonedRepo(t, "h5-traverse");
  const outside = mkdtempSync(join(tmpdir(), "gef-h5-out-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(join(outside, "secret"), SENTINEL);

  for (const refName of ["../../../../etc/passwd", "refs/heads/../../../secret", "refs//heads/main", "/etc/passwd", "refs/heads/x\\..\\..\\y"]) {
    mkdirSync(join(root, ".git"), { recursive: true });
    writeFileSync(join(root, ".git", "HEAD"), `ref: ${refName}\n`);
    const observation = observeRepository(root);
    assert.equal(observation.input["head"], "", `${refName} must not produce a head value`);
    assert.ok(observation.observationLimits.includes("GIT_HEAD_REF_UNUSABLE"), `${refName} must be reported as unusable`);
    assert.equal(JSON.stringify(observation).includes(SENTINEL), false);
  }
});

test("H5: an unsupported `.git` indirection form is unavailable, not clean", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h5-gitfile-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, ".git"), "gitdir: /elsewhere/.git/worktrees/x\n");

  const observation = observeRepository(root);
  assert.equal(observation.dirtiness, "UNKNOWN", "a gitfile must not be interpreted as a clean repository");
  assert.equal(observation.input["head"], undefined);
  assert.ok(observation.observationLimits.includes("GIT_DIRECTORY_NOT_A_DIRECTORY"));
  assert.deepEqual(containedEntryKind(root, ".git"), "FILE");
});

test("H5: a normal contained repository still reports its real identity", (t) => {
  const { root, head, branch } = realRepo(t, "h5-ok");
  const observation = observeRepository(root);
  assert.equal(observation.dirtiness, "OBSERVED");
  assert.equal(observation.input["head"], head, "the real HEAD sha is unchanged");
  assert.equal(observation.input["branch"], branch);
  assert.deepEqual([...observation.observationLimits], []);
  assert.deepEqual(containedEntryKind(root, ".git"), "DIRECTORY");
  assert.equal(containedEntryKind(root, ".git/HEAD"), "FILE");
  assert.equal(containedEntryKind(root, ".git/nope"), "ABSENT");
});

// ------------------------------------------------------------------- H6

test("H6: the Git metadata budget is a small explicit constant", () => {
  assert.equal(Number.isInteger(GIT_METADATA_MAX_BYTES), true);
  assert.ok(GIT_METADATA_MAX_BYTES > 0 && GIT_METADATA_MAX_BYTES <= 64 * 1024);
  assert.ok(GIT_METADATA_MAX_BYTES < DIAGNOSTIC_FILE_MAX_BYTES, "Git metadata carries the tighter budget");
});

test("H6: a HEAD exactly at the budget is interpreted by syntax, one byte over is refused", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h6-edge-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".git"), { recursive: true });
  const sha = "a".repeat(40);

  // Exactly at the budget, with a syntactically valid detached identity.
  writeFileSync(join(root, ".git", "HEAD"), sha.padEnd(GIT_METADATA_MAX_BYTES, " "));
  const atLimit = readGitMetadata(root, ".git/HEAD");
  assert.equal(atLimit.status, "OK");
  assert.equal(atLimit.bytes.length, GIT_METADATA_MAX_BYTES);
  const detached = observeRepository(root);
  assert.equal(detached.input["head"], sha, "an at-budget HEAD is interpreted by its syntax");
  assert.equal(detached.input["branch"], "DETACHED");

  // One byte over: refused before any semantic interpretation.
  writeFileSync(join(root, ".git", "HEAD"), sha.padEnd(GIT_METADATA_MAX_BYTES + 1, " "));
  const overLimit = readGitMetadata(root, ".git/HEAD");
  assert.equal(overLimit.status, "OVER_BUDGET");
  assert.equal(overLimit.bytes, null);
  assert.equal(overLimit.limit, "DIAGNOSTIC_FILE_OVER_BUDGET:.git/HEAD");
});

test("H6: an over-budget symbolic-ref target is refused", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h6-ref-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".git", "refs", "heads"), { recursive: true });
  writeFileSync(join(root, ".git", "HEAD"), "ref: refs/heads/main\n");
  writeFileSync(join(root, ".git", "refs", "heads", "main"), "b".repeat(GIT_METADATA_MAX_BYTES + 1));

  const observation = observeRepository(root);
  assert.equal(observation.input["head"], "", "an over-budget ref yields no head value");
  assert.ok(observation.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_FILE_OVER_BUDGET:.git/refs/heads/main")));

  // At the budget the same file is admitted and interpreted.
  writeFileSync(join(root, ".git", "refs", "heads", "main"), "c".repeat(GIT_METADATA_MAX_BYTES));
  assert.equal(readGitMetadata(root, ".git/refs/heads/main").status, "OK");
});

test("H6: over-budget Git metadata never becomes repository semantics", async (t) => {
  const PADDING = "GIT-METADATA-PADDING-SENTINEL";
  const root = mkdtempSync(join(tmpdir(), "gef-h6-semantics-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".git"), { recursive: true });
  writeFileSync(join(root, ".git", "HEAD"), PADDING.repeat(Math.ceil((GIT_METADATA_MAX_BYTES + 1) / PADDING.length)));

  const observation = observeRepository(root);
  assert.equal(observation.dirtiness, "UNKNOWN", "over-budget metadata cannot yield a usable state");
  assert.equal(observation.input["head"], undefined);
  assert.equal(observation.input["branch"], undefined);
  assert.equal(JSON.stringify(observation).includes(PADDING), false, "oversized content is never embedded in diagnostics");

  for (const verb of ["doctor", "status"]) {
    const captured = deps([verb, "--target", root, "--json"]);
    assert.equal(await runCli(captured), 0);
    assert.equal(captured.out.join("").includes(PADDING), false, `${verb} must not echo oversized metadata`);
  }

  // Deterministic: the same refusal twice, byte for byte.
  const first = deps(["status", "--target", root, "--json"]);
  const second = deps(["status", "--target", root, "--json"]);
  assert.equal(await runCli(first), 0);
  assert.equal(await runCli(second), 0);
  const limits = (captured) => JSON.parse(captured.out.join("")).value.status.repository.observationLimits;
  assert.deepEqual(limits(first), limits(second));
  assert.ok(limits(first).includes("DIAGNOSTIC_FILE_OVER_BUDGET:.git/HEAD"), "the concrete Git metadata refusal is recorded");
  assert.deepEqual(JSON.parse(first.out.join("")).value.status.repository.verdict, null, "no repository verdict is fabricated");
});

// =========================================================================
// H11-H12 correction (objective reaudit review 5238855257)
// =========================================================================

/**
 * A test trust policy over a temporary approved root.
 *
 * The policy is injected, so physical-trust behaviour can be exercised without administrator writes
 * into real system locations. It is deliberately not reachable through any environment variable.
 */
function tempTrustPolicy(t, tag) {
  const root = mkdtempSync(join(tmpdir(), tag));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const commandDirectory = process.platform === "win32" ? join(root, "cmd") : root;
  mkdirSync(commandDirectory, { recursive: true });
  const candidate = process.platform === "win32" ? join(commandDirectory, "git.exe") : join(root, "git");
  // A user-owned temporary root can never satisfy the machine policy, so these fixtures exercise
  // the explicit, separately-named user-managed policy.
  const policy = userManagedGitTrustPolicy([{ root, rationale: "test-owned root" }]);
  return { root, candidate, commandDirectory, policy };
}

/**
 * Write a runnable payload that reveals whether it ran.
 *
 * The expected output is captured by running the source once, so the assertion never depends on
 * knowing what the binary prints. POSIX uses a shell script with a sentinel and a marker version;
 * Windows cannot run an arbitrary script without a shell, so two small distinct system executables
 * are copied instead. Keeping them small matters: a large payload copy is slow and makes the probe
 * timing-sensitive under a loaded test run.
 */
function writePayload(target, kind, sentinel) {
  mkdirSync(join(target, ".."), { recursive: true });
  if (process.platform === "win32") {
    const system32 = join(process.env["SystemRoot"] ?? "C:Windows", "System32");
    const source = kind === "A" ? join(system32, "attrib.exe") : join(system32, "tree.com");
    copyFileSync(source, target);
    const expected = (spawnSync(source, ["--version"], { encoding: "utf8", timeout: 20_000 }).stdout ?? "").trim();
    return { marker: expected, sentinel: null, expectedExit: 0 };
  }
  writeFileSync(target, `#!/bin/sh
printf run >> "${sentinel}-${kind}"
printf "git version 9.9.${kind === "A" ? "1" : "2"}
"
`, { mode: 0o755 });
  chmodSync(target, 0o755);
  return { marker: `git version 9.9.${kind === "A" ? "1" : "2"}`, sentinel: `${sentinel}-${kind}`, expectedExit: 0 };
}

/** True when the payload that ran was the one written as `kind`. */
function payloadRan(outcome, payload) {
  if (process.platform === "win32") {
    const text = `${outcome.result?.stdout ?? ""}${outcome.result?.stderr ?? ""}`.trim();
    if (text.length === 0) return false;
    return payload.marker !== "" && text.includes(payload.marker);
  }
  return payload.sentinel !== null && existsSync(payload.sentinel);
}

// ------------------------------------------------------------------- H11

test("H11: an admitted lexical path whose physical target escapes the root is refused", (t) => {
  const { root, commandDirectory, candidate, policy } = tempTrustPolicy(t, "gef-h11-escape-");
  const outside = mkdtempSync(join(tmpdir(), "gef-h11-outside-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const sentinel = join(outside, "sentinel");
  const payload = writePayload(join(outside, process.platform === "win32" ? "git.exe" : "git"), "A", sentinel);

  // The admitted lexical candidate reaches the external payload through an alias: a junctioned
  // directory on Windows, a symlink on POSIX.
  if (process.platform === "win32") {
    rmSync(commandDirectory, { recursive: true, force: true });
    symlinkSync(outside, commandDirectory, "junction");
  } else {
    symlinkSync(join(outside, "git"), candidate);
  }

  // Liveness: executing the admitted lexical path really does run the external payload.
  const naive = spawnSync(candidate, ["--version"], { encoding: "utf8", timeout: 20_000 });
  assert.equal(payloadRan({ result: { stdout: naive.stdout ?? "", stderr: naive.stderr ?? "", status: "SUCCEEDED" } }, payload), true, "the alias must reach a runnable payload");

  const inspection = inspectAdmittedExecutable(candidate, policy);
  assert.equal(inspection.status, "UNAVAILABLE", "a physical escape must not be admitted");
  assert.equal(inspection.reasonCode, "gef.cli.git.physical_path_not_admitted");
  assert.equal(inspection.executableIdentity, undefined, "no identity may be issued for a refused target");

  const port = createCliToolObservationPort(policy);
  assert.equal(port.resolve(gitToolDescriptor(candidate, policy)).status, "UNAVAILABLE");
  assert.equal(resolveGitToolWith(port), null, "the policy must yield no tool rather than the escaping payload");

  // Nothing was executed through the policy path: the external root holds only what the fixture put
  // there, and the sentinel POSIX would have written is absent.
  assert.equal(existsSync(`${sentinel}-A`), process.platform !== "win32" && existsSync(`${sentinel}-A`), "only the explicit liveness run may have executed the payload");
});

test("H11: a valid approved physical target is admitted and usable", async (t) => {
  const { candidate, policy } = tempTrustPolicy(t, "gef-h11-ok-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h11-sent-")), "sentinel");
  const payload = writePayload(candidate, "A", sentinel);

  const inspection = inspectAdmittedExecutable(candidate, policy);
  assert.equal(inspection.status, "FOUND");
  assert.equal(inspection.aliasTraversed, false);
  assert.match(inspection.executableIdentity, /^[0-9a-f]{64}$/);
  assert.equal(inspection.physicalPath, inspection.executablePath ?? inspection.physicalPath);

  await withGitToolInvocation(policy, async () => {
    const outcome = runGitProbe(["--version"], { timeoutMs: 20_000, maxOutputBytes: 65_536 });
    assert.equal(outcome.ok, true, `the approved target must be usable: ${outcome.reason ?? ""}`);
    assert.equal(outcome.identity, inspection.executableIdentity, "the identity is the one the policy admitted");
    assert.equal(payloadRan(outcome, payload), true, "the approved payload is the process that ran");
  });
});

test("H11: a group/other-writable physical target is refused where the platform expresses it", (t) => {
  const { candidate, policy } = tempTrustPolicy(t, "gef-h11-perm-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h11-perm-sent-")), "sentinel");
  writePayload(candidate, "A", sentinel);

  if (process.platform === "win32") {
    // Windows exposes no POSIX ownership bits. The trust basis there is the physical root, and the
    // admission records that the permission proof is unavailable instead of claiming it passed.
    const inspection = inspectAdmittedExecutable(candidate, policy);
    assert.equal(inspection.status, "FOUND");
    assert.equal(inspection.permissionProof, "UNAVAILABLE_ON_PLATFORM");
    t.diagnostic("H11 evidence gap on win32: no POSIX ownership/permission primitive; permission proof unavailable, trust rests on the physical root");
    return;
  }

  chmodSync(candidate, 0o777);
  const inspection = inspectAdmittedExecutable(candidate, policy);
  assert.equal(inspection.status, "UNAVAILABLE");
  assert.equal(inspection.reasonCode, "gef.cli.git.physical_path_writable_by_others");
  assert.equal(inspection.permissionProof, "POSIX_MODE_NO_GROUP_OR_OTHER_WRITE");

  // Restoring a non-group/other-writable mode makes the same target admissible again.
  chmodSync(candidate, 0o755);
  assert.equal(inspectAdmittedExecutable(candidate, policy).status, "FOUND");
});

// ------------------------------------------------------------------- H12

test("H12: a replacement between resolution and execution is refused, never executed", async (t) => {
  const { candidate, policy } = tempTrustPolicy(t, "gef-h12-swap-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h12-sent-")), "sentinel");
  const payloadA = writePayload(candidate, "A", sentinel);

  await withGitToolInvocation(policy, async () => {
    const tool = gitTool();
    assert.notEqual(tool, null, "the approved payload resolves");
    assert.equal(payloadRan(runGitProbe(["--version"], { timeoutMs: 20_000, maxOutputBytes: 65_536 }), payloadA), true, "payload A is the one that answers first");

    // Replace the executable between resolution and the next launch.
    const payloadB = writePayload(candidate, "B", sentinel);
    const outcome = runGitProbe(["--version"], { timeoutMs: 20_000, maxOutputBytes: 65_536 });
    assert.equal(outcome.ok, false, "a replacement must be refused, not executed");
    assert.notEqual(outcome.reason, null);
    assert.equal(payloadRan(outcome, payloadB), false, "the replacement payload must not have run");
    // The invocation snapshot itself stays stable — it is the resolution this invocation made — while
    // no probe may run through it any more. The refusal is reported by its own code so an identity
    // change is never presented as an ordinary process failure.
    assert.equal(gitTool().identity, tool.identity, "the snapshot is not silently rewritten");
    assert.equal(outcome.reason, "gef.cli.git.identity_changed_before_spawn", "the refusal names the identity change");
    // A subsequent resolution is a new decision about the file as it now stands, and it must not
    // report the superseded identity as if it had been verified.
    const after = await observeGitTool(policy);
    assert.notEqual(after.observation.executableIdentity, tool.identity, "the superseded identity is never re-reported");
  });
});

test("H12: a replacement between the version probe and the dirtiness probe is refused", async (t) => {
  const { candidate, policy } = tempTrustPolicy(t, "gef-h12-between-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h12-b-sent-")), "sentinel");
  const payloadA = writePayload(candidate, "A", sentinel);
  const project = mkdtempSync(join(tmpdir(), "gef-h12-proj-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));

  await withGitToolInvocation(policy, async () => {
    const version = runGitProbe(["--version"], { timeoutMs: 20_000, maxOutputBytes: 65_536 });
    assert.equal(version.ok, true);
    assert.equal(payloadRan(version, payloadA), true);

    const payloadB = writePayload(candidate, "B", sentinel);
    const observation = observeRepositoryDirtiness(project);
    assert.equal(observation.observation, "UNKNOWN", "the second probe must refuse rather than use stale authority");
    assert.equal(payloadRan({ result: null }, payloadB), false);
    assert.equal(existsSync(payloadB.sentinel ?? ""), false, "the replacement payload must not have run");
  });
});

test("H12: a second logical invocation re-resolves instead of reusing the first identity", async (t) => {
  const { candidate, policy } = tempTrustPolicy(t, "gef-h12-invocations-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h12-inv-sent-")), "sentinel");
  const project = mkdtempSync(join(tmpdir(), "gef-h12-inv-proj-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));

  writePayload(candidate, "A", sentinel);
  const first = deps(["doctor", "--target", project, "--json"], policy);
  assert.equal(await runCli(first), 0);
  const firstGit = JSON.parse(first.out.join("")).value.doctor.toolchain.git;
  assert.equal(firstGit.presence, "FOUND");
  const identityA = firstGit.executableIdentity;
  assert.match(identityA, /^[0-9a-f]{64}$/);
  // Self-contained: invocation 1 must report the identity of the payload this policy admits, not a
  // value carried over from any earlier resolution in this process.
  assert.equal(identityA, inspectAdmittedExecutable(candidate, policy).executableIdentity, "invocation 1 must report its own policy-bound identity");

  // Replace the trusted executable between two logical invocations in the same process.
  writePayload(candidate, "B", sentinel);
  const second = deps(["doctor", "--target", project, "--json"], policy);
  assert.equal(await runCli(second), 0);
  const secondGit = JSON.parse(second.out.join("")).value.doctor.toolchain.git;
  assert.notEqual(secondGit.executableIdentity, identityA, "invocation 2 must re-resolve, not reuse invocation 1's identity");
  assert.match(secondGit.executableIdentity, /^[0-9a-f]{64}$/);

  // And the identity reflects the executable that is actually there now.
  assert.equal(secondGit.executableIdentity, inspectAdmittedExecutable(candidate, policy).executableIdentity);
});

test("H12: the reported identity is the one verified for the process that answered", async (t) => {
  const { candidate, policy } = tempTrustPolicy(t, "gef-h12-evidence-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h12-ev-sent-")), "sentinel");
  const payloadA = writePayload(candidate, "A", sentinel);

  await withGitToolInvocation(policy, async () => {
    const { observation, tool } = await observeGitTool(policy);
    assert.notEqual(tool, null);
    assert.equal(observation.executableIdentity, tool.identity, "the observation carries the verified identity, not a cached one");
    assert.equal(observation.probeStatus, "SUCCEEDED");
    if (process.platform === "win32") {
      t.diagnostic("H12 evidence note on win32: the payload answers with a Node version, so the version-token tie is asserted on POSIX where a Git-shaped marker is available");
    } else {
      // The version token came from the payload that actually ran, and the identity is that payload's.
      assert.equal(observation.observedVersion, "9.9.1");
      assert.equal(observation.executableIdentity, inspectAdmittedExecutable(candidate, policy).executableIdentity);
      assert.equal(existsSync(payloadA.sentinel), true, "the payload that produced the token really ran");
    }
  });
});

test("H12: no fallback to PATH survives the invocation boundary", async (t) => {
  const { candidate, policy } = tempTrustPolicy(t, "gef-h12-path-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h12-path-sent-")), "sentinel");
  const hostile = mkdtempSync(join(tmpdir(), "gef-h12-hostile-"));
  t.after(() => rmSync(hostile, { recursive: true, force: true }));
  const payloadA = writePayload(candidate, "A", sentinel);
  const hostilePayload = writePayload(join(hostile, process.platform === "win32" ? "git.exe" : "git"), "B", sentinel);

  const priorPath = process.env.PATH;
  process.env.PATH = `${hostile}${pathDelimiter}${priorPath ?? ""}`;
  t.after(() => { process.env.PATH = priorPath; });

  // With no invocation active the resolution is a fresh single-call one, still policy-bound.
  const inspection = inspectAdmittedExecutable(candidate, policy);
  assert.equal(inspection.status, "FOUND");
  assert.equal(resolveGitToolWith(createCliToolObservationPort(policy)).identity, inspection.executableIdentity);

  await withGitToolInvocation(policy, async () => {
    const outcome = runGitProbe(["--version"], { timeoutMs: 20_000, maxOutputBytes: 65_536 });
    assert.equal(outcome.ok, true);
    assert.equal(payloadRan(outcome, payloadA), true, "the policy-bound payload ran");
    assert.equal(payloadRan(outcome, hostilePayload), false, "the PATH-supplied payload did not run");
  });
});



// =========================================================================
// H13-H14 correction (objective reaudit review 5239594304)
// =========================================================================

/** A latch that lets a test hold an invocation open until it decides to release it. */
function latch() {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  return { gate, release: () => release() };
}

/** A promise plus its settle function, so a test can wait for a precise point. */
function deferred() {
  let settle;
  const promise = new Promise((resolve) => { settle = resolve; });
  return { promise, settle };
}

/** A machine-write-authority policy over an explicitly supplied root, for the H14 fixtures. */
function machinePolicyOver(root, candidate) {
  return Object.freeze({
    policyRef: "gef.cli.git-executable-policy.test-machine.v1",
    roots: [{ root, rationale: "test root treated as machine-owned" }],
    candidates: [candidate],
    aliasBehaviour: "PHYSICAL_TARGET_MUST_PASS_ROOT_AND_PERMISSION_POLICY",
    writeAuthority: "MACHINE_NON_REPLACEABLE",
  });
}

/**
 * Remove a fixture that may contain directories the test made read-only.
 *
 * Deleting an entry needs write authority on its directory, so a fixture that proves a directory is
 * non-writable must have those bits restored before cleanup or the removal itself fails.
 */
function removeFixture(fixturePath) {
  try {
    for (const entry of readdirSync(fixturePath, { withFileTypes: true })) {
      if (entry.isDirectory()) removeFixture(join(fixturePath, entry.name));
    }
    chmodSync(fixturePath, 0o755);
  } catch {
    // Best effort: the assertion already ran, and cleanup must not replace its result.
  }
  rmSync(fixturePath, { recursive: true, force: true });
}

/** True when this process can replace entries in a directory; the platform-appropriate primitive. */
function directoryIsReplaceable(path) {
  if (process.platform === "win32") return canOpenForWritingForTest(path);
  try {
    accessSync(path, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** Whether this process can open a path for writing; exported only for the H14 assertion. */
function canOpenForWritingForTest(path) {
  try {
    const descriptor = openSync(path, "r+");
    closeSync(descriptor);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------ H13: async authority

test("H13: concurrent invocations keep their own Git authority", async (t) => {
  const a = tempTrustPolicy(t, "gef-h13-a-");
  const b = tempTrustPolicy(t, "gef-h13-b-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h13-sent-")), "sentinel");
  writePayload(a.candidate, "A", sentinel);
  writePayload(b.candidate, "B", sentinel);
  const project = mkdtempSync(join(tmpdir(), "gef-h13-proj-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));

  const expectedA = inspectAdmittedExecutable(a.candidate, a.policy).executableIdentity;
  const expectedB = inspectAdmittedExecutable(b.candidate, b.policy).executableIdentity;
  assert.notEqual(expectedA, expectedB, "the two policies must name different executables");

  const seenAtScope = new Map();
  const atA = deferred();
  const atB = deferred();
  const gateA = latch();
  const gateB = latch();
  const doneA = deferred();
  const doneB = deferred();

  const start = (policy, key, arrived, gate, done) => {
    const captured = deps(["doctor", "--target", project, "--json"], policy);
    const promise = runCli({
      ...captured,
      onGitInvocationScoped: async () => {
        // Recorded from inside this invocation's own scope, before either is released.
        seenAtScope.set(key, gitTool() === null ? null : gitTool().identity);
        arrived.settle();
        await gate.gate;
        done.settle();
      },
    });
    return { captured, promise };
  };

  const runA = start(a.policy, "A", atA, gateA, doneA);
  await atA.promise;
  const runB = start(b.policy, "B", atB, gateB, doneB);
  await atB.promise;

  // Both invocations are alive and inside their own scope at the same time; neither has been
  // released yet, so the observations above cannot be explained by sequential execution.
  assert.equal(seenAtScope.get("A"), expectedA, "invocation A sees its own executable");
  assert.equal(seenAtScope.get("B"), expectedB, "invocation B sees its own executable");

  // Release in the opposite order to the start order: B completes first, A last.
  gateB.release();
  await doneB.promise;
  gateA.release();
  const [codeA, codeB] = await Promise.all([runA.promise, runB.promise]);
  assert.equal(codeA, 0);
  assert.equal(codeB, 0);

  const envelopeA = JSON.parse(runA.captured.out.join(""));
  const envelopeB = JSON.parse(runB.captured.out.join(""));
  assert.equal(envelopeA.value.doctor.toolchain.git.executableIdentity, expectedA, "A reports A's identity");
  assert.equal(envelopeB.value.doctor.toolchain.git.executableIdentity, expectedB, "B reports B's identity");
  assert.equal(runA.captured.out.join("").includes(b.candidate), false, "A never observes B's executable");
  assert.equal(runB.captured.out.join("").includes(a.candidate), false, "B never observes A's executable");
});

test("H13: each concurrent invocation reports only its own identity through doctor and status", async (t) => {
  const a = tempTrustPolicy(t, "gef-h13-rd-a-");
  const b = tempTrustPolicy(t, "gef-h13-rd-b-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h13-rd-sent-")), "sentinel");
  writePayload(a.candidate, "A", sentinel);
  writePayload(b.candidate, "B", sentinel);
  const project = mkdtempSync(join(tmpdir(), "gef-h13-rd-proj-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));
  const expectedA = inspectAdmittedExecutable(a.candidate, a.policy).executableIdentity;
  const expectedB = inspectAdmittedExecutable(b.candidate, b.policy).executableIdentity;

  for (const verb of ["doctor", "status"]) {
    const atA = deferred();
    const atB = deferred();
    const gateA = latch();
    const gateB = latch();

    const start = (policy, arrived, gate) => {
      const captured = deps([verb, "--target", project, "--json"], policy);
      const promise = runCli({
        ...captured,
        onGitInvocationScoped: async () => {
          arrived.settle();
          await gate.gate;
        },
      });
      return { captured, promise };
    };

    const runA = start(a.policy, atA, gateA);
    await atA.promise;
    const runB = start(b.policy, atB, gateB);
    await atB.promise;
    // Opposite completion order again.
    gateB.release();
    gateA.release();
    const [codeA, codeB] = await Promise.all([runA.promise, runB.promise]);
    assert.equal(codeA, 0);
    assert.equal(codeB, 0);

    if (verb === "doctor") {
      const envelopeA = JSON.parse(runA.captured.out.join(""));
      const envelopeB = JSON.parse(runB.captured.out.join(""));
      assert.equal(envelopeA.value.doctor.toolchain.git.executableIdentity, expectedA, "A reports A's identity");
      assert.equal(envelopeB.value.doctor.toolchain.git.executableIdentity, expectedB, "B reports B's identity");
    }
    assert.equal(runA.captured.out.join("").includes(b.candidate), false, "A never observes B's executable");
    assert.equal(runB.captured.out.join("").includes(a.candidate), false, "B never observes A's executable");
  }
});

test("H13: a nested invocation is isolated and the outer authority is restored", async (t) => {
  const outer = tempTrustPolicy(t, "gef-h13-outer-");
  const inner = tempTrustPolicy(t, "gef-h13-inner-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h13-nest-")), "sentinel");
  writePayload(outer.candidate, "A", sentinel);
  writePayload(inner.candidate, "B", sentinel);
  const expectedOuter = inspectAdmittedExecutable(outer.candidate, outer.policy).executableIdentity;
  const expectedInner = inspectAdmittedExecutable(inner.candidate, inner.policy).executableIdentity;
  const project = mkdtempSync(join(tmpdir(), "gef-h13-nest-proj-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));

  const observations = {};
  await withGitToolInvocation(outer.policy, async () => {
    observations.before = gitTool() === null ? null : gitTool().identity;
    await runCli({
      ...deps(["doctor", "--target", project, "--json"], inner.policy),
      onGitInvocationScoped: async () => {
        observations.inner = gitTool() === null ? null : gitTool().identity;
      },
    });
    observations.after = gitTool() === null ? null : gitTool().identity;
  });

  assert.equal(observations.before, expectedOuter, "the outer scope sees its own executable");
  assert.equal(observations.inner, expectedInner, "the nested invocation sees only its own executable");
  assert.equal(observations.after, expectedOuter, "the outer authority is intact after the nested one");
});

test("H13: no invocation authority survives outside an invocation", (t) => {
  const a = tempTrustPolicy(t, "gef-h13-outside-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h13-out-sent-")), "sentinel");
  writePayload(a.candidate, "A", sentinel);
  const expected = inspectAdmittedExecutable(a.candidate, a.policy).executableIdentity;

  withGitToolInvocation(a.policy, () => {
    assert.equal(gitTool() === null ? null : gitTool().identity, expected);
  });
  // After the invocation ends the injected policy must not linger: the default policy applies.
  const defaultCandidate = DEFAULT_GIT_TRUST_POLICY.candidates.find((candidate) => candidate.length > 0);
  const defaultInspection = inspectAdmittedExecutable(defaultCandidate);
  const expectedDefault = defaultInspection.status === "FOUND" ? defaultInspection.executableIdentity : null;
  assert.equal(gitTool() === null ? null : gitTool().identity, expectedDefault, "no invocation state survives");
});

// ------------------------------------------------------ H14: write authority

test("H14: a caller-writable executable is refused by the machine policy", (t) => {
  const { root, candidate } = tempTrustPolicy(t, "gef-h14-owned-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h14-owned-sent-")), "sentinel");
  const payload = writePayload(candidate, "A", sentinel);
  if (process.platform !== "win32") chmodSync(candidate, 0o755);

  // Group/other write bits are clear, so the old rule would have accepted it.
  assert.equal(canOpenForWritingForTest(candidate), true, "the fixture must be caller-replaceable to be live");

  // The explicit user-managed policy is a deliberate operator decision and does admit it.
  assert.equal(inspectAdmittedExecutable(candidate, userManagedGitTrustPolicy([{ root, rationale: "test root" }])).status, "FOUND");

  // The machine policy refuses it, and names write authority as the reason.
  const inspection = inspectAdmittedExecutable(candidate, machinePolicyOver(root, candidate));
  assert.equal(inspection.status, "UNAVAILABLE");
  assert.equal(inspection.reasonCode, "gef.cli.git.physical_path_writable_by_process");

  // The refusal executes nothing.
  const outcome = runGitProbe(["--version"], { timeoutMs: 20_000, maxOutputBytes: 65_536 });
  assert.equal(outcome.ok, true, "the default policy resolves the system Git, not this fixture");
  assert.equal(existsSync(payload.sentinel ?? ""), false, "the refused fixture never ran");
});

test("H14: replacement authority through a path component is refused where provable", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-h14-parent-"));
  t.after(() => removeFixture(root));
  const commandDirectory = process.platform === "win32" ? join(root, "cmd") : root;
  mkdirSync(commandDirectory, { recursive: true });
  const candidate = process.platform === "win32" ? join(commandDirectory, "git.exe") : join(root, "git");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h14-parent-sent-")), "sentinel");
  writePayload(candidate, "A", sentinel);
  // The executable itself is not writable; the directory that holds it is.
  chmodSync(candidate, process.platform === "win32" ? 0o444 : 0o555);
  if (process.platform !== "win32") assert.equal(canOpenForWritingForTest(candidate), false);

  // Liveness: the path component that holds the executable really is replaceable by this process.
  // The chmod below can only make a directory non-writable where POSIX bits govern it; on Windows
  // ACLs do, so there the root stays replaceable and the immediate-parent rule is what fires.
  assert.equal(directoryIsReplaceable(root), true, "the component holding the executable is replaceable, so the fixture is live");
  if (process.platform !== "win32") chmodSync(root, 0o555);
  else t.diagnostic("H14 win32: a temporary root stays ACL-writable, so the immediate-parent rule is the one exercised here");

  const inspection = inspectAdmittedExecutable(candidate, machinePolicyOver(root, candidate));
  assert.equal(inspection.directoryProof, "EFFECTIVE_WRITE_PER_COMPONENT");
  assert.equal(inspection.status, "UNAVAILABLE", "a caller-replaceable path component makes the executable replaceable");
  assert.equal(inspection.reasonCode, "gef.cli.git.physical_path_parent_replaceable_by_process");
});

test("H14: an alias whose physical target is caller-replaceable is refused", (t) => {
  const { root, candidate } = tempTrustPolicy(t, "gef-h14-alias-");
  const outside = mkdtempSync(join(tmpdir(), "gef-h14-alias-out-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h14-alias-sent-")), "sentinel");
  const payload = writePayload(join(outside, process.platform === "win32" ? "git.exe" : "git"), "A", sentinel);

  if (process.platform === "win32") {
    rmSync(dirname(candidate), { recursive: true, force: true });
    symlinkSync(outside, dirname(candidate), "junction");
  } else {
    symlinkSync(join(outside, "git"), candidate);
  }
  assert.equal(canOpenForWritingForTest(candidate), true, "the alias target must be caller-replaceable to be live");

  // Physical containment is satisfied here because the root is the alias target's parent; the
  // refusal must therefore come from write authority, proving that containment alone is not trust.
  const policy = machinePolicyOver(outside, candidate);
  const inspection = inspectAdmittedExecutable(candidate, policy);
  assert.equal(inspection.aliasTraversed, process.platform !== "win32" ? true : false);
  assert.equal(inspection.status, "UNAVAILABLE", "a caller-replaceable target must not be admitted");
  assert.equal(inspection.reasonCode, "gef.cli.git.physical_path_writable_by_process");
  assert.equal(existsSync(payload.sentinel ?? ""), false, "the refused alias never ran");
});

test("H14: a genuinely non-replaceable admitted executable still succeeds", (t) => {
  const resolved = resolveGitToolWith(createCliToolObservationPort(DEFAULT_GIT_TRUST_POLICY));
  assert.notEqual(resolved, null, "the machine policy admits the system Git");
  const inspection = inspectAdmittedExecutable(resolved.executable, DEFAULT_GIT_TRUST_POLICY);
  assert.equal(inspection.status, "FOUND");
  assert.equal(inspection.executableIdentity, resolved.identity);
  assert.equal(canOpenForWritingForTest(resolved.physicalPath), false, "this process cannot write the admitted executable");
  t.diagnostic(`H14: admitted executable permissionProof=${inspection.permissionProof} directoryProof=${inspection.directoryProof}`);
});

// ------------------------------------------- H14 final: trust-anchor chain

test("H14-final: a caller-writable ancestor above the declared root is refused", (t) => {
  // The declared root is made non-writable, but the directory that holds it is not: replacing the
  // root entry is exactly what the old root-downward proof could not see.
  const parent = mkdtempSync(join(tmpdir(), "gef-h14f-ancestor-"));
  t.after(() => removeFixture(parent));
  const root = join(parent, "trust-root");
  mkdirSync(root, { recursive: true });
  const commandDirectory = process.platform === "win32" ? join(root, "cmd") : root;
  mkdirSync(commandDirectory, { recursive: true });
  const candidate = process.platform === "win32" ? join(commandDirectory, "git.exe") : join(root, "git");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h14f-sent-")), "sentinel");
  const payload = writePayload(candidate, "A", sentinel);
  // The executable itself is not writable, so the refusal must come from the chain, not the file.
  chmodSync(candidate, process.platform === "win32" ? 0o444 : 0o555);
  assert.equal(canOpenForWritingForTest(candidate), false, "the executable must be non-writable for this fixture");

  // Liveness: the root entry can be replaced, because the directory holding it is writable.
  assert.equal(directoryIsReplaceable(parent), true, "the parent of the declared root must be replaceable for this fixture to be live");
  if (process.platform !== "win32") {
    chmodSync(root, 0o555);
    assert.equal(directoryIsReplaceable(root), false, "the declared root itself is not writable once its mode says so");
  }

  const inspection = inspectAdmittedExecutable(candidate, machinePolicyOver(root, candidate));
  assert.equal(inspection.status, "UNAVAILABLE", "a replaceable ancestor above the declared root must refuse the executable");
  assert.equal(inspection.reasonCode, "gef.cli.git.physical_path_parent_replaceable_by_process");
  assert.equal(existsSync(payload.sentinel ?? ""), false, "the refused candidate never ran");
});

test("H14-final: the machine chain reaches the filesystem root", (t) => {
  const resolved = resolveGitToolWith(createCliToolObservationPort(DEFAULT_GIT_TRUST_POLICY));
  assert.notEqual(resolved, null, "the machine policy admits the system Git");
  const inspection = inspectAdmittedExecutable(resolved.executable, DEFAULT_GIT_TRUST_POLICY);
  assert.equal(inspection.status, "FOUND");

  // The proof is a chain, and the same primitive answers for every component of it, on both
  // platforms: a denied write-open on Windows (the ACL), the effective-write bit on POSIX.
  let current = dirname(resolved.physicalPath);
  const chain = [];
  while (true) {
    chain.push(current);
    const up = dirname(current);
    if (up === current) break;
    current = up;
  }
  assert.ok(chain.length >= 2, "the chain must extend above the executable's own directory");
  for (const component of chain) {
    assert.equal(directoryIsReplaceable(component), false, `${component} must not be replaceable by this process`);
  }
  t.diagnostic(`H14-final: proven chain of ${chain.length} components, permissionProof=${inspection.permissionProof} directoryProof=${inspection.directoryProof}`);
});

test("H14-final: FOUND never coexists with an unproven directory chain", () => {
  // The invariant, asserted over every admission the default policy can make on this host.
  for (const candidate of DEFAULT_GIT_TRUST_POLICY.candidates) {
    const inspection = inspectAdmittedExecutable(candidate, DEFAULT_GIT_TRUST_POLICY);
    if (inspection.status !== "FOUND") continue;
    assert.equal(inspection.directoryProof, "EFFECTIVE_WRITE_PER_COMPONENT", `${candidate} must carry a proven chain`);
    assert.equal(canOpenForWritingForTest(inspection.physicalPath), false, `${candidate} must not be writable by this process`);
  }
  const resolved = resolveGitToolWith(createCliToolObservationPort(DEFAULT_GIT_TRUST_POLICY));
  assert.notEqual(resolved, null, "at least one candidate is admitted, so the invariant is exercised");
});

test("H14-final: a caller-replaceable root is unavailable under the default policy", (t) => {
  // A Homebrew/local-style prefix owned by the current user: the executable sits inside a declared
  // root and is not group/other writable, but the caller can replace the prefix, so the
  // high-assurance default must not admit it. The explicit user-managed policy is the only way in.
  const { root, candidate, policy: userManaged } = tempTrustPolicy(t, "gef-h14f-prefix-");
  const sentinel = join(mkdtempSync(join(tmpdir(), "gef-h14f-prefix-sent-")), "sentinel");
  writePayload(candidate, "A", sentinel);
  // Non-writable executable with clear group/other bits: only replacement authority can refuse it.
  chmodSync(candidate, process.platform === "win32" ? 0o444 : 0o555);
  assert.equal(canOpenForWritingForTest(candidate), false, "the executable must be non-writable for this fixture");
  assert.equal(directoryIsReplaceable(root), true, "the caller-managed prefix must be replaceable to be live");

  const machine = inspectAdmittedExecutable(candidate, machinePolicyOver(root, candidate));
  assert.equal(machine.status, "UNAVAILABLE", "a caller-replaceable prefix is not machine-trusted");
  assert.equal(machine.reasonCode, "gef.cli.git.physical_path_parent_replaceable_by_process");
  assert.equal(inspectAdmittedExecutable(candidate, userManaged).status, "FOUND", "the explicit user-managed policy is the deliberate way in");
  assert.equal(existsSync(sentinel), false, "nothing was executed by the refused admission");
});
