// GBS-V11-WO-002 correction — unit and integration contract for the thin CLI transport.
//
// Covers parser determinism, renderer stability, the frozen output-selection contract, the
// registry/delegation map (including the required engine symbols), the schema version
// contract and the single exit-code projection.

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { ProcessExitCode } from "../packages/contracts/dist/index.js";
import {
  ADMITTED_VERBS,
  CLI_COMMAND_IDS,
  CLI_CONTRACT_VERSION,
  CLI_RECEIPT_SCHEMA_ID,
  CLI_STATE_SCHEMA_ID,
  ENVELOPE_SCHEMA_VERSION,
  HELP_INVENTORY,
  SCHEMA_ASSETS,
  SUPPORTED_SCHEMA_MAJOR,
  SUPPORTED_SCHEMA_VERSION,
  UnsupportedDocumentVersionError,
  buildReceiptDocument,
  buildRegistry,
  buildStateDocument,
  cliRegistrations,
  fingerprint,
  loadEngines,
  observeCanonicalSources,
  observeRepository,
  observeTarget,
  parseArgv,
  processExitCodeFor,
  readRecordedArtifact,
  renderHelp,
  renderHelpJson,
  renderResultHuman,
  renderResultJson,
  renderUsageFailureJson,
  requireSupportedSchemaVersion,
  resultEnvelope,
  runCli,
} from "../packages/cli/dist/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPackage = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/package.json"), "utf8"));
const rootPackage = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));

// --------------------------------------------------------------------- parser

test("parser maps the frozen safe-action surface", () => {
  assert.equal(parseArgv(["init"]).commandId, "gef.init.plan");
  assert.equal(parseArgv(["init", "--apply"]).commandId, "gef.init.run");
  assert.equal(parseArgv(["adopt"]).commandId, "gef.adopt.preview");
  assert.equal(parseArgv(["adopt", "--apply"]).commandId, "gef.adopt.apply");
});

test("parser is order-insensitive and resolves --json in a pre-pass", () => {
  for (const argv of [["--json", "init"], ["init", "--json"], ["init", "--apply", "--json"]]) {
    const parsed = parseArgv(argv);
    assert.equal(parsed.kind, "command");
    assert.equal(parsed.json, true);
  }
  // A failure raised before --json still carries the json intent.
  assert.equal(parseArgv(["bogus", "--json"]).json, true);
});

test("parser resolves help and version without a command", () => {
  assert.equal(parseArgv([]).kind, "help");
  assert.equal(parseArgv(["init", "--help"]).verb, "init");
  assert.equal(parseArgv(["--version"]).kind, "version");
});

test("parser fails closed on unknown command and malformed flags", () => {
  assert.equal(parseArgv(["bogus"]).reason, "unknown_command");
  assert.equal(parseArgv(["--nope"]).reason, "unknown_flag");
  assert.equal(parseArgv(["init", "--target"]).reason, "missing_target_value");
  assert.equal(parseArgv(["init", "adopt"]).reason, "unexpected_argument");
  assert.equal(parseArgv(["--apply"]).reason, "apply_without_command");
  assert.equal(parseArgv(["--version", "init"]).reason, "conflicting_options");
});

test("only init and adopt are admitted in this increment", () => {
  assert.deepEqual([...ADMITTED_VERBS], ["init", "adopt"]);
  for (const deferred of ["doctor", "status", "upgrade"]) {
    assert.equal(parseArgv([deferred]).reason, "unknown_command", `${deferred} must stay deferred`);
  }
});

// -------------------------------------------------------------------- render

function failureResult(category, { terminal = "BLOCKED", recoverability = "NONE_REQUIRED" } = {}) {
  return {
    ok: false,
    error: {
      schemaVersion: 1,
      id: "err-1",
      category,
      reasonCode: `gef.${String(category).toLowerCase()}.sample`,
      severity: "ERROR",
      summary: "sample",
      retryability: "NEVER",
      recoverability,
      effectStatus: "NONE",
      causes: [],
      evidenceRefs: [],
      remediations: [],
      metadata: {},
    },
    lifecycle: { runId: "run-1", commandId: "gef.init.plan", phases: ["RECEIVED"], terminal, startedAtMs: 0, endedAtMs: 0, effectStatus: "NONE" },
  };
}

test("json envelope is stable and ordered for success and failure", () => {
  const success = { ok: true, value: { a: 1 }, lifecycle: { runId: "r", commandId: "gef.init.plan", phases: [], terminal: "SUCCEEDED", startedAtMs: 0, endedAtMs: 0, effectStatus: "NONE" } };
  const okEnvelope = resultEnvelope(success, "gef.init.plan", CLI_CONTRACT_VERSION);
  assert.deepEqual(Object.keys(okEnvelope), ["schemaVersion", "ok", "commandId", "contractVersion", "terminal", "value"]);
  assert.equal(okEnvelope.schemaVersion, ENVELOPE_SCHEMA_VERSION);
  assert.deepEqual(Object.keys(resultEnvelope(failureResult("INPUT"), "gef.init.plan", CLI_CONTRACT_VERSION)), ["schemaVersion", "ok", "commandId", "contractVersion", "terminal", "error"]);
  const rendered = renderResultJson(success, "gef.init.plan", CLI_CONTRACT_VERSION);
  assert.deepEqual(JSON.parse(rendered), okEnvelope);
});

test("rendering never reinterprets the engine payload", () => {
  const payload = { nested: { value: 42 }, list: [1, 2, 3] };
  const result = { ok: true, value: payload, lifecycle: { runId: "r", commandId: "c", phases: [], terminal: "SUCCEEDED", startedAtMs: 0, endedAtMs: 0, effectStatus: "NONE" } };
  assert.deepEqual(resultEnvelope(result, "c", "1.0").value, payload);
  assert.ok(renderResultHuman(result, "c").includes('"value": 42'));
});

test("usage failure envelope is machine readable", () => {
  const envelope = JSON.parse(renderUsageFailureJson("unknown_command", "Unknown command: x"));
  assert.equal(envelope.error.category, "INPUT");
  assert.equal(envelope.error.reasonCode, "gef.input.unknown_command");
});

// ------------------------------------------------------------------ registry

test("registry exposes canonical command IDs with explicit ownership and mutation flags", () => {
  const introspection = buildRegistry().introspect();
  assert.deepEqual(introspection.map((entry) => entry.commandId), ["gef.adopt.apply", "gef.adopt.preview", "gef.init.plan", "gef.init.run"]);
  const byId = Object.fromEntries(introspection.map((entry) => [entry.commandId, entry]));
  assert.equal(byId["gef.init.plan"].mutation, false);
  assert.equal(byId["gef.init.run"].mutation, true);
  assert.equal(byId["gef.adopt.preview"].mutation, false);
  assert.equal(byId["gef.adopt.apply"].mutation, true);
  assert.equal(byId["gef.init.plan"].requiresTarget, false);
  assert.equal(byId["gef.init.run"].requiresTarget, true);
  assert.equal(byId["gef.init.plan"].owner, "m48-m54-maintenance");
  assert.equal(byId["gef.adopt.apply"].owner, "security-reliability-integrations");
});

test("every registration uses the canonical command id pattern and one contract version", () => {
  const pattern = /^gef\.[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/;
  for (const registration of cliRegistrations()) {
    assert.match(registration.commandId, pattern);
    assert.equal(registration.contractVersion, CLI_CONTRACT_VERSION);
  }
  assert.deepEqual([...CLI_COMMAND_IDS].sort(), cliRegistrations().map((r) => r.commandId).sort());
});

test("registry rejects a duplicate command id", () => {
  const registry = buildRegistry();
  assert.throws(() => registry.register(cliRegistrations()[0]), /Duplicate canonical command ID/);
});

test("command input validation fails closed", () => {
  const validate = buildRegistry().get("gef.init.plan").validateInput;
  assert.equal(validate(null).ok, false);
  assert.equal(validate({ verb: "upgrade", apply: false }).ok, false);
  assert.equal(validate({ verb: "init", apply: "yes" }).ok, false);
  assert.equal(validate({ verb: "init", apply: false, targetRef: 5 }).ok, false);
  assert.equal(validate({ verb: "init", apply: false }).ok, true);
});

// ------------------------------------------------- H2 — delegation surface

test("the frozen delegation symbols are exposed by the engine boundary", async () => {
  const engines = await loadEngines();
  // init: installPlan, repositoryState, githubBootstrap, detectDrift, resolveCanonical
  // adopt: detectDrift, resolveCanonical, backupManifest, recoveryPlan, installPlan
  for (const symbol of ["installPlan", "repositoryState", "githubBootstrap", "detectDrift", "resolveCanonical", "backupManifest", "recoveryPlan", "helpIndex"]) {
    assert.equal(typeof engines[symbol], "function", `${symbol} must be bound`);
  }
  assert.deepEqual(
    Object.keys(engines).sort(),
    ["backupManifest", "detectDrift", "githubBootstrap", "helpIndex", "installPlan", "recoveryPlan", "repositoryState", "resolveCanonical", "safetyDecision"],
  );
});

test("colliding exports are bound by explicit module ownership (C5)", async () => {
  const engines = await loadEngines();
  assert.equal(engines.compatibility, undefined);
  assert.equal(engines.redactSecrets, undefined);
  assert.equal(engines.digest, undefined);
});

test("delegated engines behave as the repository documents", async () => {
  const engines = await loadEngines();
  const plan = engines.installPlan({ platform: "linux", target: "t", version: "1.1.0", current: null });
  assert.equal(plan.state, "READY");
  assert.equal(engines.installPlan({ platform: "plan9", target: "t", version: "1.1.0" }).state, "UNSUPPORTED");

  const blocked = engines.repositoryState({});
  assert.equal(blocked.state, "BLOCKED");

  const conflicted = engines.repositoryState({ repo: "r", head: "h", branch: "b", conflicted: ["x"] });
  assert.equal(conflicted.state, "BLOCKED");

  const resolved = engines.resolveCanonical([{ id: "a", kind: "checkpoint", value: "1" }, { id: "b", kind: "checkpoint", value: "2" }]);
  assert.equal(resolved.state, "CONFLICT");
  assert.equal(engines.resolveCanonical([{ id: "a", kind: "other", value: "1" }]).state, "READY");

  assert.equal(engines.detectDrift({ a: 1 }, { a: 2 }).changed, true);
  assert.equal(engines.detectDrift({ a: 1 }, { a: 2 }, { authorized: true }).class, "EXPECTED");
  assert.equal(engines.backupManifest([{ id: "x", digest: "a".repeat(64) }]).verified, true);
  assert.equal(engines.recoveryPlan({}).action, "RESTART");
});

test("help inventory is projected by helpIndex in deterministic id order (M1)", async () => {
  const engines = await loadEngines();
  const entries = engines.helpIndex(HELP_INVENTORY);
  const ids = entries.map((entry) => entry.id);
  assert.deepEqual(ids, [...ids].sort(), "help entries must be sorted by id");
  assert.deepEqual(ids, [...CLI_COMMAND_IDS].sort(), "the projected inventory must cover every admitted command");
  for (const entry of entries) assert.equal(typeof entry.summary, "string");
  // The projection is the engine's, not the caller's order.
  assert.deepEqual(engines.helpIndex([...HELP_INVENTORY].reverse()).map((e) => e.id), ids);
});

test("help rendering derives from the projected entries and is deterministic", async () => {
  const engines = await loadEngines();
  const entries = engines.helpIndex(HELP_INVENTORY);
  const first = renderHelp(entries);
  assert.equal(first, renderHelp(engines.helpIndex(HELP_INVENTORY)));
  for (const entry of entries) assert.ok(first.includes(entry.id), `help must list ${entry.id}`);
  assert.ok(first.includes("Not yet available: doctor, status, upgrade."));
  assert.ok(renderHelp(entries, "init").includes("gef.init.plan"));
  assert.ok(!renderHelp(entries, "init").includes("gef.adopt.plan"));

  const json = JSON.parse(renderHelpJson(entries));
  assert.deepEqual(json.commands.map((command) => command.id), entries.map((entry) => entry.id));
  assert.deepEqual(JSON.parse(renderHelpJson(entries, "init")).commands.map((c) => c.id), ["gef.init.plan", "gef.init.run"]);
});

// ----------------------------------------------------- observation surfaces

test("target observation is read-only, bounded and deterministic", () => {
  assert.equal(observeTarget(ROOT).stateFingerprint, observeTarget(ROOT).stateFingerprint);
  const observation = observeTarget(ROOT);
  assert.ok(observation.entries.length <= 64);
  assert.deepEqual([...observation.entries], [...observation.entries].sort());
  const missing = observeTarget(resolve(ROOT, "__definitely_absent__"));
  assert.equal(missing.exists, false);
});

test("repository observation reports what it cannot observe instead of assuming clean", () => {
  const absent = observeRepository(resolve(ROOT, "__definitely_absent__"));
  assert.deepEqual(absent.input, {});
  assert.ok(absent.observationLimits.includes("NO_LOCAL_GIT_DIRECTORY"));
  assert.ok(absent.observationLimits.includes("WORKING_TREE_NOT_OBSERVED"));

  const here = observeRepository(ROOT);
  assert.ok(here.observationLimits.includes("WORKING_TREE_DIRTINESS_NOT_OBSERVED"));
  if (here.input.head !== undefined) assert.equal(typeof here.input.branch, "string");
});

test("a repository mid-operation is observed as such", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-repo-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".git"), { recursive: true });
  writeFileSync(join(root, ".git", "HEAD"), "ref: refs/heads/main\n");
  assert.equal(observeRepository(root).input.operation, undefined);
  writeFileSync(join(root, ".git", "MERGE_HEAD"), "deadbeef\n");
  assert.equal(observeRepository(root).input.operation, "MERGE");
});

test("canonical source observation never fabricates a value", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-canon-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual([...observeCanonicalSources(root)], []);
  mkdirSync(join(root, ".engineering"), { recursive: true });
  writeFileSync(join(root, ".engineering", "SCOPE.md"), "scope\n");
  const sources = observeCanonicalSources(root);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].kind, "scope");
  assert.match(sources[0].value, /^[0-9a-f]{64}$/);
});

// ------------------------------------------------- M3 — schema contract

test("the CLI ships JSON Schema 2020-12 contracts for both persisted documents", () => {
  for (const asset of SCHEMA_ASSETS) {
    const schema = JSON.parse(readFileSync(resolve(ROOT, "packages/cli/schemas", asset), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.properties.schemaVersion.const, SUPPORTED_SCHEMA_VERSION);
    assert.ok(schema.required.includes("schemaVersion"));
  }
  assert.equal(CLI_STATE_SCHEMA_ID, "urn:gef:schema:cli-state:1");
  assert.equal(CLI_RECEIPT_SCHEMA_ID, "urn:gef:schema:cli-receipt:1");
});

test("document version handling fails closed", () => {
  assert.equal(requireSupportedSchemaVersion({ schemaVersion: SUPPORTED_SCHEMA_VERSION }), SUPPORTED_SCHEMA_VERSION);
  assert.equal(SUPPORTED_SCHEMA_MAJOR, 1);
  for (const bad of [null, {}, { schemaVersion: 1 }, { schemaVersion: "1" }, { schemaVersion: "2.0" }, { schemaVersion: "x.y" }, { schemaVersion: "0.9" }]) {
    assert.throws(() => requireSupportedSchemaVersion(bad), UnsupportedDocumentVersionError, `must reject ${JSON.stringify(bad)}`);
  }
});

test("emitted documents are bound to their schema version", () => {
  const state = buildStateDocument({
    verb: "init",
    commandId: "gef.init.run",
    contractVersion: CLI_CONTRACT_VERSION,
    productVersion: "1.1.0",
    runId: "run-1",
    planDigest: "a".repeat(64),
    observationFingerprint: "b".repeat(64),
    transaction: { planDigest: "a".repeat(64), outcome: "APPLIED" },
  });
  assert.equal(state.schemaVersion, SUPPORTED_SCHEMA_VERSION);
  assert.equal(state.kind, "gef.init.state");
  assert.equal(requireSupportedSchemaVersion(state), SUPPORTED_SCHEMA_VERSION);

  const receipt = buildReceiptDocument({
    runId: "run-1",
    commandId: "gef.init.run",
    contractVersion: CLI_CONTRACT_VERSION,
    productVersion: "1.1.0",
    effectStatus: "CONFIRMED",
    lifecyclePhases: ["RECEIVED", "READY", "EXECUTING"],
    resultDigest: "c".repeat(64),
    transaction: { planDigest: "a".repeat(64), outcome: "APPLIED" },
  });
  assert.equal(receipt.schemaVersion, SUPPORTED_SCHEMA_VERSION);
  assert.equal(receipt.kind, "gef.cli.receipt");
  assert.equal(requireSupportedSchemaVersion(receipt), SUPPORTED_SCHEMA_VERSION);
});

test("reading a persisted document with an unsupported version is refused", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gef-ver-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".gef"), { recursive: true });
  writeFileSync(join(root, ".gef", "init-state.json"), JSON.stringify({ schemaVersion: "9.0", observationFingerprint: "x" }));
  const recorded = readRecordedArtifact(root, "init");
  assert.equal(recorded.present, true);
  assert.equal(recorded.schemaVersionSupported, false, "an unsupported major version must not be interpreted");
  assert.equal(recorded.recordedObservationFingerprint, null);

  writeFileSync(join(root, ".gef", "init-state.json"), JSON.stringify({ schemaVersion: SUPPORTED_SCHEMA_VERSION, observationFingerprint: "x" }));
  const supported = readRecordedArtifact(root, "init");
  assert.equal(supported.schemaVersionSupported, true);
  assert.equal(supported.recordedObservationFingerprint, "x");
});

// ------------------------------------------------- M2 — output selection

function captureDeps(argv, stdoutIsTty) {
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
    productVersion: cliPackage.version,
    stdoutIsTty,
    out,
    err,
  };
}

test("output selection follows the frozen TTY contract (M2)", async () => {
  // Explicit --json on a TTY.
  const ttyJson = captureDeps(["--version", "--json"], true);
  assert.equal(await runCli(ttyJson), ProcessExitCode.SUCCESS);
  assert.equal(JSON.parse(ttyJson.out[0]).version, cliPackage.version);

  // Human output on a TTY without --json.
  const ttyHuman = captureDeps(["--version"], true);
  assert.equal(await runCli(ttyHuman), ProcessExitCode.SUCCESS);
  assert.ok(ttyHuman.out[0].startsWith("gef "), "a TTY without --json must render human output");

  // Non-TTY selects JSON automatically, including for failures.
  const pipeVersion = captureDeps(["--version"], false);
  assert.equal(await runCli(pipeVersion), ProcessExitCode.SUCCESS);
  assert.equal(JSON.parse(pipeVersion.out[0]).version, cliPackage.version);

  const pipeFailureTty = captureDeps(["bogus"], true);
  assert.equal(await runCli(pipeFailureTty), ProcessExitCode.USAGE_OR_INPUT_ERROR);
  assert.ok(!pipeFailureTty.err[0].startsWith("{"), "a TTY failure must stay human readable");

  const pipeFailure = captureDeps(["bogus"], false);
  assert.equal(await runCli(pipeFailure), ProcessExitCode.USAGE_OR_INPUT_ERROR);
  assert.equal(JSON.parse(pipeFailure.err[0]).error.category, "INPUT");
});

test("in-process dispatch projects help, version and usage failures", async () => {
  const help = captureDeps(["--help"], true);
  assert.equal(await runCli(help), ProcessExitCode.SUCCESS);
  assert.ok(help.out[0].includes("gef.init.plan"), "help must list the admitted commands");

  const unknown = captureDeps(["nope"], true);
  assert.equal(await runCli(unknown), ProcessExitCode.USAGE_OR_INPUT_ERROR);
  assert.equal(unknown.out.length, 0);
  assert.ok(unknown.err[0].includes("Unknown command"));
});

// ------------------------------------------------------- exit-code projection

test("exit-code projection covers the full ProcessExitCode table exactly", () => {
  const success = { ok: true, value: {}, lifecycle: { runId: "r", commandId: "c", phases: [], terminal: "SUCCEEDED", startedAtMs: 0, endedAtMs: 0, effectStatus: "NONE" } };
  assert.equal(processExitCodeFor(success), ProcessExitCode.SUCCESS);
  const table = [
    ["INPUT", "BLOCKED", "NONE_REQUIRED", ProcessExitCode.USAGE_OR_INPUT_ERROR],
    ["PRECONDITION", "BLOCKED", "NONE_REQUIRED", ProcessExitCode.PRECONDITION_OR_STATE_BLOCK],
    ["POLICY", "BLOCKED", "NONE_REQUIRED", ProcessExitCode.POLICY_OR_AUTHORIZATION_BLOCK],
    ["AUTHORIZATION", "BLOCKED", "NONE_REQUIRED", ProcessExitCode.POLICY_OR_AUTHORIZATION_BLOCK],
    ["CAPABILITY", "BLOCKED", "NONE_REQUIRED", ProcessExitCode.DEPENDENCY_OR_CAPABILITY_FAILURE],
    ["DEPENDENCY", "BLOCKED", "NONE_REQUIRED", ProcessExitCode.DEPENDENCY_OR_CAPABILITY_FAILURE],
    ["EXECUTION", "FAILED", "NONE_REQUIRED", ProcessExitCode.EXECUTION_FAILURE],
    ["VERIFICATION", "FAILED", "NONE_REQUIRED", ProcessExitCode.VERIFICATION_OR_INTEGRITY_FAILURE],
    ["INTEGRITY", "FAILED", "NONE_REQUIRED", ProcessExitCode.VERIFICATION_OR_INTEGRITY_FAILURE],
    ["RECOVERY", "FAILED", "RECOVERY_REQUIRED", ProcessExitCode.RECOVERY_REQUIRED_OR_PARTIAL_EFFECT],
    ["CANCELLED", "CANCELLED", "NONE_REQUIRED", ProcessExitCode.CANCELLED_OR_TIMED_OUT],
    ["TIMEOUT", "TIMED_OUT", "NONE_REQUIRED", ProcessExitCode.CANCELLED_OR_TIMED_OUT],
    ["INTERNAL", "FAILED", "NONE_REQUIRED", ProcessExitCode.INTERNAL_UNEXPECTED_FAILURE],
  ];
  for (const [category, terminal, recoverability, expected] of table) {
    assert.equal(processExitCodeFor(failureResult(category, { terminal, recoverability })), expected, `category ${category}`);
  }
  assert.equal(processExitCodeFor(failureResult("INPUT", { terminal: "RECOVERY_REQUIRED" })), ProcessExitCode.RECOVERY_REQUIRED_OR_PARTIAL_EFFECT);
});

// ------------------------------------------------------------ misc contract

test("fingerprint is stable under key reordering and sensitive to value change", () => {
  assert.equal(fingerprint({ a: 1, b: 2 }), fingerprint({ b: 2, a: 1 }));
  assert.notEqual(fingerprint({ a: 1 }), fingerprint({ a: 2 }));
});

test("version provenance is mechanically single-sourced", () => {
  assert.equal(rootPackage.version, cliPackage.version);
  assert.equal(cliPackage.version, "1.1.0");
  assert.equal(cliPackage.bin.gef, "./bin/gef.mjs");
});
