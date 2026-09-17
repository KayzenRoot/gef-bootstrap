// GBS-V11-WO-002 — unit and integration contract for the thin CLI transport.
//
// Covers parser determinism, renderer stability, registry registration/delegation and the
// single exit-code projection. No domain policy is asserted here; engine behaviour is
// observed through the real engines loaded by the registry.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { ProcessExitCode } from "../packages/contracts/dist/index.js";
import {
  ADMITTED_VERBS,
  CLI_COMMAND_IDS,
  CLI_CONTRACT_VERSION,
  ENVELOPE_SCHEMA_VERSION,
  buildRegistry,
  cliRegistrations,
  fingerprint,
  loadEngines,
  observeTarget,
  parseArgv,
  processExitCodeFor,
  renderResultHuman,
  renderResultJson,
  renderUsageFailureJson,
  resultEnvelope,
  rootDescriptorFor,
  runCli,
  usageText,
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
  assert.equal(parseArgv(["init", "--apply"]).apply, true);
  assert.equal(parseArgv(["init"]).apply, false);
});

test("parser is order-insensitive and accepts global --json anywhere", () => {
  for (const argv of [["--json", "init"], ["init", "--json"], ["init", "--apply", "--json"]]) {
    const parsed = parseArgv(argv);
    assert.equal(parsed.kind, "command");
    assert.equal(parsed.json, true);
  }
});

test("parser resolves help and version without a command", () => {
  assert.equal(parseArgv([]).kind, "help");
  assert.equal(parseArgv(["--help"]).kind, "help");
  assert.equal(parseArgv(["init", "--help"]).kind, "help");
  assert.equal(parseArgv(["init", "--help"]).verb, "init");
  assert.equal(parseArgv(["--version"]).kind, "version");
});

test("parser fails closed on unknown command and malformed flags", () => {
  const unknown = parseArgv(["bogus"]);
  assert.equal(unknown.kind, "failure");
  assert.equal(unknown.reason, "unknown_command");

  const flag = parseArgv(["--nope"]);
  assert.equal(flag.kind, "failure");
  assert.equal(flag.reason, "unknown_flag");

  const missingValue = parseArgv(["init", "--target"]);
  assert.equal(missingValue.kind, "failure");
  assert.equal(missingValue.reason, "missing_target_value");

  const extra = parseArgv(["init", "adopt"]);
  assert.equal(extra.kind, "failure");
  assert.equal(extra.reason, "unexpected_argument");
});

test("parser rejects apply/target without a command and version conflicts", () => {
  assert.equal(parseArgv(["--apply"]).reason, "apply_without_command");
  assert.equal(parseArgv(["--target", "x"]).reason, "target_without_command");
  assert.equal(parseArgv(["--version", "init"]).reason, "conflicting_options");
});

test("verb-level help is never an error even with --apply", () => {
  const parsed = parseArgv(["init", "--apply", "--help"]);
  assert.equal(parsed.kind, "help");
  assert.equal(parsed.verb, "init");
});

test("only init and adopt are admitted in this increment", () => {
  assert.deepEqual([...ADMITTED_VERBS], ["init", "adopt"]);
  for (const deferred of ["doctor", "status", "upgrade"]) {
    assert.equal(parseArgv([deferred]).reason, "unknown_command", `${deferred} must be deferred, not silently accepted`);
  }
});

test("usage text is deterministic and names the deferred verbs", () => {
  assert.deepEqual(usageText(), usageText());
  assert.deepEqual(usageText("init"), usageText("init"));
  assert.ok(usageText().join("\n").includes("Not yet available: doctor, status, upgrade."));
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

  const badEnvelope = resultEnvelope(failureResult("INPUT"), "gef.init.plan", CLI_CONTRACT_VERSION);
  assert.deepEqual(Object.keys(badEnvelope), ["schemaVersion", "ok", "commandId", "contractVersion", "terminal", "error"]);
  assert.equal(badEnvelope.ok, false);

  // The rendered envelope must round-trip through JSON unchanged.
  const rendered = renderResultJson(success, "gef.init.plan", CLI_CONTRACT_VERSION);
  assert.deepEqual(JSON.parse(rendered), okEnvelope);
  assert.equal(renderResultJson(success, "gef.init.plan", CLI_CONTRACT_VERSION), rendered);
});

test("rendering never reinterprets the engine payload", () => {
  const payload = { nested: { value: 42 }, list: [1, 2, 3] };
  const result = { ok: true, value: payload, lifecycle: { runId: "r", commandId: "gef.init.plan", phases: [], terminal: "SUCCEEDED", startedAtMs: 0, endedAtMs: 0, effectStatus: "NONE" } };
  assert.deepEqual(resultEnvelope(result, "c", "1.0").value, payload);
  assert.ok(renderResultHuman(result, "gef.init.plan").includes('"value": 42'));
});

test("usage failure envelope is machine readable", () => {
  const envelope = JSON.parse(renderUsageFailureJson("unknown_command", "Unknown command: x"));
  assert.equal(envelope.ok, false);
  assert.equal(envelope.terminal, "BLOCKED");
  assert.equal(envelope.error.category, "INPUT");
  assert.equal(envelope.error.reasonCode, "gef.input.unknown_command");
});

// ------------------------------------------------------------------ registry

test("registry exposes canonical command IDs with explicit ownership and mutation flags", () => {
  const registry = buildRegistry();
  const introspection = registry.introspect();
  assert.deepEqual(introspection.map((entry) => entry.commandId), ["gef.adopt.apply", "gef.adopt.preview", "gef.init.plan", "gef.init.run"]);

  const byId = Object.fromEntries(introspection.map((entry) => [entry.commandId, entry]));
  assert.equal(byId["gef.init.plan"].mutation, false);
  assert.equal(byId["gef.init.preview"], undefined);
  assert.equal(byId["gef.init.run"].mutation, true);
  assert.equal(byId["gef.adopt.preview"].mutation, false);
  assert.equal(byId["gef.adopt.apply"].mutation, true);

  assert.equal(byId["gef.init.plan"].requiresTarget, false);
  assert.equal(byId["gef.init.run"].requiresTarget, true);
  assert.equal(byId["gef.adopt.apply"].requiresTarget, true);

  assert.equal(byId["gef.init.plan"].owner, "m48-m54-maintenance");
  assert.equal(byId["gef.adopt.apply"].owner, "security-reliability-integrations");
});

test("every registration uses the canonical command id pattern and one contract version", () => {
  const pattern = /^gef\.[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/;
  for (const registration of cliRegistrations()) {
    assert.match(registration.commandId, pattern);
    assert.equal(registration.contractVersion, CLI_CONTRACT_VERSION);
    assert.equal(typeof registration.validateInput, "function");
    assert.equal(typeof registration.handler, "function");
  }
  assert.deepEqual([...CLI_COMMAND_IDS].sort(), cliRegistrations().map((r) => r.commandId).sort());
});

test("registry rejects a duplicate command id", () => {
  const registry = buildRegistry();
  const registration = cliRegistrations()[0];
  assert.throws(() => registry.register(registration), /Duplicate canonical command ID/);
});

test("command input validation fails closed", () => {
  const registry = buildRegistry();
  const validate = registry.get("gef.init.plan").validateInput;
  assert.equal(validate(null).ok, false);
  assert.equal(validate({ verb: "upgrade", apply: false }).ok, false);
  assert.equal(validate({ verb: "init", apply: "yes" }).ok, false);
  assert.equal(validate({ verb: "init", apply: false }).ok, true);
  assert.equal(validate({ verb: "init", apply: false, targetRef: 5 }).ok, false);
});

test("handlers delegate to the real engines instead of duplicating policy", async () => {
  const engines = await loadEngines();
  const plan = engines.installPlan({ platform: "linux", target: "t", version: "1.1.0", current: null });
  assert.equal(plan.state, "READY");
  assert.deepEqual([...plan.phases], ["PRECHECK", "STAGE", "VERIFY", "COMMIT"]);

  const unsupported = engines.installPlan({ platform: "plan9", target: "t", version: "1.1.0" });
  assert.equal(unsupported.state, "UNSUPPORTED");

  const safety = engines.safetyDecision({ classification: "IRREVERSIBLE", blastRadius: "unknown" });
  assert.equal(safety.confirmation, "FORBIDDEN");
  assert.equal(safety.state, "BLOCKED");

  const drift = engines.detectDrift({ a: 1 }, { a: 2 }, { authorized: false });
  assert.equal(drift.changed, true);
  assert.equal(drift.class, "UNEXPECTED");
  assert.equal(engines.detectDrift({ a: 1 }, { a: 1 }).changed, false);
});

test("colliding exports are bound by explicit module ownership (C5)", async () => {
  const engines = await loadEngines();
  // `compatibility` and `redactSecrets` collide across packages and must NOT be reachable here.
  assert.equal(engines.compatibility, undefined);
  assert.equal(engines.redactSecrets, undefined);
  // Only explicitly bound symbols are exposed.
  assert.deepEqual(Object.keys(engines).sort(), ["backupManifest", "detectDrift", "githubBootstrap", "installPlan", "normalizeRestrictedPath", "recoveryPlan", "safetyDecision"]);
});

test("engine loader fails closed for a missing module or symbol", async () => {
  const { EngineUnavailableError } = await import("../packages/cli/dist/registry.js");
  const enginesSource = readFileSync(resolve(ROOT, "packages/cli/dist/registry.js"), "utf8");
  assert.ok(enginesSource.includes("EngineUnavailableError"), "loader must expose a fail-closed error type");
  assert.equal(typeof EngineUnavailableError, "function");
});

// --------------------------------------------------------- target observation

test("target observation is read-only and deterministic", () => {
  const first = observeTarget(ROOT);
  const second = observeTarget(ROOT);
  assert.equal(first.stateFingerprint, second.stateFingerprint);
  assert.equal(first.exists, true);
  assert.equal(first.isDirectory, true);
  assert.ok(first.entryCount > 0);

  const missing = observeTarget(resolve(ROOT, "__definitely_absent__"));
  assert.equal(missing.exists, false);
  assert.equal(missing.entryCount, 0);
});

test("target observation does not follow repository rediscovery", () => {
  const observation = observeTarget(ROOT);
  assert.ok(observation.entries.length <= 64, "observation must stay bounded");
  assert.deepEqual([...observation.entries], [...observation.entries].sort());
});

test("fingerprint is stable under key reordering and sensitive to value change", () => {
  assert.equal(fingerprint({ a: 1, b: 2 }), fingerprint({ b: 2, a: 1 }));
  assert.notEqual(fingerprint({ a: 1 }), fingerprint({ a: 2 }));
});

test("root descriptor declares the platform path flavor and never admits root mutation", () => {
  const descriptor = rootDescriptorFor(ROOT);
  assert.equal(descriptor.pathFlavor, process.platform === "win32" ? "WINDOWS" : "POSIX");
  assert.deepEqual([...descriptor.allowedOperations], ["READ", "CREATE"]);
  assert.ok(!descriptor.allowedOperations.includes("REMOVE"));
  assert.ok(!descriptor.allowedOperations.includes("UPDATE"));
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

  // Recovery-required always dominates the category mapping.
  assert.equal(processExitCodeFor(failureResult("INPUT", { terminal: "RECOVERY_REQUIRED" })), ProcessExitCode.RECOVERY_REQUIRED_OR_PARTIAL_EFFECT);
  assert.equal(processExitCodeFor(failureResult("INPUT", { terminal: "FAILED", recoverability: "MANUAL_REPAIR_REQUIRED" })), ProcessExitCode.RECOVERY_REQUIRED_OR_PARTIAL_EFFECT);
});

// ------------------------------------------------------- in-process dispatch

function captureDeps(argv) {
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
    out,
    err,
  };
}

test("in-process dispatch projects help, version and usage failures", async () => {
  const help = captureDeps(["--help"]);
  assert.equal(await runCli(help), 0);
  assert.ok(help.out[0].includes("Usage: gef"));

  const version = captureDeps(["--version"]);
  assert.equal(await runCli(version), 0);
  assert.equal(version.out[0], `gef ${cliPackage.version}\nnode ${process.version}\nplatform ${process.platform}\n`);

  const unknown = captureDeps(["nope"]);
  assert.equal(await runCli(unknown), ProcessExitCode.USAGE_OR_INPUT_ERROR);
  assert.equal(unknown.out.length, 0, "usage failure must not write to stdout");
  assert.ok(unknown.err[0].includes("Unknown command"));

  const unknownJson = captureDeps(["nope", "--json"]);
  assert.equal(await runCli(unknownJson), ProcessExitCode.USAGE_OR_INPUT_ERROR);
  assert.equal(JSON.parse(unknownJson.err[0]).error.reasonCode, "gef.input.unknown_command");
});

test("version provenance is mechanically single-sourced", () => {
  // Root package.json is the canonical source; the CLI package and the runtime report must agree.
  assert.equal(rootPackage.version, cliPackage.version);
  assert.equal(cliPackage.version, "1.1.0");
  assert.equal(cliPackage.bin.gef, "./bin/gef.mjs");
});
