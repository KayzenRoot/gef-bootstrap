import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GEF_BIN = resolve(ROOT, "packages/cli/bin/gef.mjs");
const PROCESS_TIMEOUT_MS = 90_000;

function runGef(args) {
  const result = spawnSync(process.execPath, [GEF_BIN, ...args], { encoding: "utf8", timeout: PROCESS_TIMEOUT_MS });
  assert.equal(result.error, undefined, `GEF must complete: ${result.error?.message ?? ""}`);
  assert.equal(result.signal, null, "GEF must not be killed");
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function createBrownfieldRepo(t, name) {
  const target = mkdtempSync(join(tmpdir(), `gef-wo-011-${name}-`));
  t.after(() => rmSync(target, { recursive: true, force: true }));
  const git = (args) => {
    const result = spawnSync("git", ["-C", target, ...args], { encoding: "utf8", timeout: 30_000 });
    assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
    return result.stdout ?? "";
  };
  git(["init", "-q", "--initial-branch=main"]);
  git(["config", "user.email", "executor@example.invalid"]);
  git(["config", "user.name", "GEF Executor"]);
  mkdirSync(join(target, "src"));
  writeFileSync(join(target, "src", "legacy.js"), "// brownfield source\n");
  git(["add", "."]);
  git(["commit", "-qm", "seed brownfield repository"]);
  return target;
}

function valueOf(result, key) {
  assert.equal(result.code, 0, `GEF ${key} failed: ${result.stderr || result.stdout}`);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.ok, true);
  return envelope.value[key];
}

test("adopt baseline ignores GEF metadata, keeps diagnostics, and still detects real project drift", (t) => {
  const target = createBrownfieldRepo(t, "adopt");
  const preview = valueOf(runGef(["adopt", "--target", target, "--json"]), "preview");
  assert.equal(preview.observation.hasGefDirectory, false);
  assert.ok(!preview.observation.entries.includes(".gef-private"));
  assert.equal(readdirSync(target).includes(".gef"), false, "preview stays read-only");

  const appliedEnvelope = JSON.parse(runGef(["adopt", "--apply", "--target", target, "--json"]).stdout);
  assert.equal(appliedEnvelope.ok, true);
  assert.equal(appliedEnvelope.value.transaction.outcome, "APPLIED");

  const first = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(first.drift.changed, false, "adopt must not report self-created metadata as project drift");
  assert.notEqual(first.drift.class, "UNEXPECTED");
  assert.notEqual(first.operator.state, "DIRTY", "GEF's own directories do not make operator state dirty");

  const state = JSON.parse(readFileSync(join(target, ".gef", "adopt-state.json"), "utf8"));
  assert.equal(state.observationModel, "PROJECT_DRIFT_V1");

  mkdirSync(join(target, ".gef-private", "operator-notes"), { recursive: true });
  writeFileSync(join(target, ".gef-private", "operator-notes", "local.txt"), "managed metadata only\n");
  const metadataOnly = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(metadataOnly.drift.changed, false);
  assert.notEqual(metadataOnly.operator.state, "DIRTY");

  const postApplyPreview = valueOf(runGef(["adopt", "--target", target, "--json"]), "preview");
  assert.equal(postApplyPreview.observation.hasGefDirectory, true, "diagnostics retain .gef visibility");
  assert.equal(postApplyPreview.observation.hasGefPrivateDirectory, true, "diagnostics retain .gef-private visibility");
  assert.ok(postApplyPreview.observation.entries.includes(".gef-private"), "diagnostics retain .gef-private visibility");
  assert.equal(runGef(["doctor", "--target", target, "--json"]).code, 0);

  const repeated = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.deepEqual(repeated.drift, metadataOnly.drift, "status drift remains deterministic without project changes");
  assert.deepEqual(repeated.operator, metadataOnly.operator);

  writeFileSync(join(target, "user-change.js"), "// real user change\n");
  const changed = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(changed.drift.changed, true, "real user-owned file drift remains visible");
  assert.equal(changed.drift.class, "UNEXPECTED");
  assert.equal(changed.operator.state, "DIRTY");
});

test("init uses the same drift baseline", (t) => {
  const target = createBrownfieldRepo(t, "init");
  const plan = valueOf(runGef(["init", "--target", target, "--json"]), "plan");
  assert.equal(plan.repository.dirtiness, "OBSERVED", "an unborn but observable Git repository is not an unavailable repository");
  const appliedEnvelope = JSON.parse(runGef(["init", "--apply", "--target", target, "--json"]).stdout);
  assert.equal(appliedEnvelope.ok, true, appliedEnvelope.stderr || appliedEnvelope.stdout);
  assert.equal(appliedEnvelope.value.transaction.outcome, "APPLIED");

  const state = JSON.parse(readFileSync(join(target, ".gef", "init-state.json"), "utf8"));
  assert.equal(state.observationModel, "PROJECT_DRIFT_V1");
  const status = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(status.drift.changed, false);
  assert.notEqual(status.operator.state, "DIRTY");
});

test("status keeps an absent baseline unknown instead of inventing drift", (t) => {
  const target = createBrownfieldRepo(t, "absent");
  const status = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(status.drift, null);
  assert.equal(status.driftBaseline.state, "ABSENT");
});

function legacyObservationFingerprint(target) {
  const entries = readdirSync(target).sort((left, right) => (left < right ? -1 : left > right ? 1 : 0)).slice(0, 64);
  const observation = {
    targetRef: resolve(target),
    exists: true,
    isDirectory: true,
    entryCount: entries.length,
    hasGefDirectory: entries.includes(".gef"),
    entries,
  };
  const canonical = JSON.stringify(observation, (_key, nested) => {
    if (nested === null || typeof nested !== "object" || Array.isArray(nested)) return nested;
    return Object.fromEntries(Object.entries(nested).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)));
  });
  return createHash("sha256").update(canonical).digest("hex");
}

test("legacy V1.1.0 baselines survive GEF metadata creation while malformed and unsupported state fail closed", (t) => {
  const target = createBrownfieldRepo(t, "legacy");
  const oldObservationFingerprint = legacyObservationFingerprint(target);
  mkdirSync(join(target, ".gef"));
  mkdirSync(join(target, ".gef-private"));
  const digest = "a".repeat(64);
  const legacyState = {
    schemaVersion: "1.0",
    kind: "gef.adopt.state",
    verb: "adopt",
    commandId: "gef.adopt.apply",
    contractVersion: "1.0",
    productVersion: "1.1.0",
    runId: "legacy-v110",
    planDigest: digest,
    observationFingerprint: oldObservationFingerprint,
    transaction: { planDigest: digest, outcome: "APPLIED" },
  };
  const statePath = join(target, ".gef", "adopt-state.json");
  writeFileSync(statePath, `${JSON.stringify(legacyState, null, 2)}\n`);
  const legacyStatus = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(legacyStatus.driftBaseline.state, "RECORDED");
  assert.equal(legacyStatus.drift.changed, false, "a V1.1.0 baseline before GEF dirs is matched semantically");

  writeFileSync(statePath, `${JSON.stringify({ ...legacyState, observationModel: "UNKNOWN_MODEL" }, null, 2)}\n`);
  const unknownModel = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(unknownModel.driftBaseline.state, "UNSUPPORTED");
  assert.equal(unknownModel.drift, null);

  writeFileSync(statePath, `${JSON.stringify({ ...legacyState, schemaVersion: "9.0" }, null, 2)}\n`);
  const unsupportedVersion = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(unsupportedVersion.driftBaseline.state, "UNSUPPORTED");
  assert.equal(unsupportedVersion.drift, null);

  writeFileSync(statePath, `${JSON.stringify({ ...legacyState, productVersion: "9.0.0" }, null, 2)}\n`);
  const unsupportedProductVersion = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(unsupportedProductVersion.driftBaseline.state, "UNSUPPORTED");
  assert.equal(unsupportedProductVersion.drift, null);

  writeFileSync(statePath, `${JSON.stringify({ ...legacyState, productVersion: "1.1.0", observationModel: "PROJECT_DRIFT_V1" }, null, 2)}\n`);
  const inconsistentModel = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(inconsistentModel.driftBaseline.state, "UNSUPPORTED");
  assert.equal(inconsistentModel.drift, null);

  writeFileSync(statePath, `${JSON.stringify({ ...legacyState, observationFingerprint: "invalid" }, null, 2)}\n`);
  const invalid = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(invalid.driftBaseline.state, "UNSUPPORTED");
  assert.equal(invalid.drift, null);

  const missingCurrentModel = { ...legacyState, productVersion: "1.1.1" };
  writeFileSync(statePath, `${JSON.stringify(missingCurrentModel, null, 2)}\n`);
  const missingModel = valueOf(runGef(["status", "--target", target, "--json"]), "status");
  assert.equal(missingModel.driftBaseline.state, "UNSUPPORTED");
  assert.equal(missingModel.drift, null);
});
