#!/usr/bin/env node

// Reproducible matched CLI vs source-workspace API latency measurement for `gef init --plan`.
// Run after `npm run build`. Every sample uses a fresh child process and the same empty target
// fixture. The output contains only allowlisted population/metric data, never command payloads.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";

import { capturePerformanceRecord, compareCliRoi } from "../../../packages/m62-m63-final/src/index.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(scriptPath), "../../..");
const cliBin = join(repositoryRoot, "packages/cli/bin/gef.mjs");
const manualEntry = join(repositoryRoot, ".engineering/benchmarks/v1.1/source-workspace-manual.mjs");
const rootManifest = JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8"));
const lockfile = JSON.parse(readFileSync(join(repositoryRoot, "package-lock.json"), "utf8"));
const repetitions = 7;
const allowedEnvironmentKeys = ["HOME", "USERPROFILE", "SystemRoot", "WINDIR", "PATHEXT", "PATH", "TEMP", "TMP", "TMPDIR"];
const childEnvironment = Object.fromEntries(allowedEnvironmentKeys.filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function git(args) {
  const result = spawnSync("git", args, { cwd: repositoryRoot, encoding: "utf8", timeout: 10_000, env: childEnvironment });
  if (result.status !== 0) throw new Error("benchmark git identity is unavailable");
  return result.stdout.trim();
}

function npmVersion() {
  const result = spawnSync("npm", ["--version"], { cwd: repositoryRoot, encoding: "utf8", timeout: 10_000, env: childEnvironment, shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error("benchmark npm version is unavailable");
  return result.stdout.trim();
}

function invoke(mode, target) {
  const args = mode === "CLI"
    ? [cliBin, "init", "--target", target, "--json"]
    : [manualEntry, target];
  const started = performance.now();
  const result = spawnSync(process.execPath, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 2 * 1024 * 1024,
    env: childEnvironment,
  });
  const elapsed = performance.now() - started;
  assert.equal(result.status, 0, `${mode} init plan must succeed`);
  assert.equal(result.stderr, "", `${mode} init plan must not emit diagnostics`);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.ok, true, `${mode} init plan must return a success envelope`);
  assert.equal(envelope.value.plan.install.state, "READY", `${mode} init plan must be ready`);
  return { elapsed, planDigest: envelope.value.planDigest };
}

const status = git(["status", "--porcelain"]);
if (status !== "") throw new Error("benchmark requires a clean source tree");
if (!existsSync(cliBin) || !existsSync(manualEntry)) throw new Error("benchmark entry is unavailable; run the build first");

const commitSha = git(["rev-parse", "HEAD"]);
const treeFingerprint = git(["rev-parse", "HEAD^{tree}"]);
const target = mkdtempSync(join(tmpdir(), "gef-v11-wo008-cli-roi-"));
const cliSamples = [];
const manualSamples = [];

try {
  assert.deepEqual(readdirSync(target), [], "the representative init target must be empty");
  for (let index = 0; index < repetitions; index += 1) {
    // Alternate invocation order to keep one mode from always benefiting from machine warm-up.
    const order = index % 2 === 0 ? ["CLI", "SOURCE_WORKSPACE_MANUAL"] : ["SOURCE_WORKSPACE_MANUAL", "CLI"];
    const results = {};
    for (const mode of order) results[mode] = invoke(mode, target);
    assert.equal(results.CLI.planDigest, results.SOURCE_WORKSPACE_MANUAL.planDigest, "both paths must produce the same init plan");
    cliSamples.push(results.CLI.elapsed);
    manualSamples.push(results.SOURCE_WORKSPACE_MANUAL.elapsed);
  }
} finally {
  rmSync(target, { recursive: true, force: true });
}

const population = {
  P1: { workloadKind: "GREENFIELD_INIT_PLAN" },
  P2: {
    workloadInstanceId: "wo008-cli-roi-init-plan-v1",
    fixtureId: "empty-target-v1",
    fixtureDigest: sha256("GEF-V11-CLI-ROI\0GREENFIELD_INIT_PLAN\0EMPTY_TARGET\0V1"),
  },
  P3: { commitSha, treeFingerprint },
  P4: {
    node: process.version,
    npm: npmVersion(),
    packageManager: "npm",
    typescript: lockfile.packages["node_modules/typescript"]?.version ?? rootManifest.devDependencies.typescript,
  },
  P5: { os: process.platform, osVersion: (await import("node:os")).release(), architecture: process.arch },
  P6: {
    policyDigest: sha256("GEF-V11-CLI-ROI\0ASSURANCE_STANDARD\0FINAL_EXACT_HEAD_SWEEP_REQUIRED\0V1"),
    ladder: "STANDARD",
    finalSweepRequired: true,
  },
  P7: { posture: "COLD", reuseSetDigest: "none" },
  P8: { timedRegion: "process-start-to-json-envelope-output", startEvent: "process-start", endEvent: "json-envelope-output" },
};
const gateStatus = process.env.GEF_BENCHMARK_QUALITY_GATE_STATUS === "PASS" ? "PASS" : "UNKNOWN";
const qualityGate = {
  status: gateStatus,
  digest: sha256(`GEF-V11-CLI-ROI\0QUALITY-GATE\0${commitSha}\0${treeFingerprint}\0${gateStatus}`),
};
const metrics = (samples) => ({
  "M-LAT-01": { unit: "ms", source: "MEASURED", samples },
  "M-TOK-03": { unit: "tokens", source: "UNAVAILABLE", value: null },
});
const manualResult = capturePerformanceRecord({
  recordId: `cli-roi-manual-${commitSha.slice(0, 12)}`,
  executionMode: "SOURCE_WORKSPACE_MANUAL",
  population,
  requiredMetricIds: ["M-LAT-01"],
  metrics: metrics(manualSamples),
  qualityGate,
});
const cliResult = capturePerformanceRecord({
  recordId: `cli-roi-cli-${commitSha.slice(0, 12)}`,
  executionMode: "CLI",
  population,
  requiredMetricIds: ["M-LAT-01"],
  metrics: metrics(cliSamples),
  qualityGate,
});
assert.equal(manualResult.state, "CAPTURED");
assert.equal(cliResult.state, "CAPTURED");

const report = compareCliRoi(manualResult.record, cliResult.record);
process.stdout.write(`${JSON.stringify({
  schemaVersion: 1,
  kind: "GBS_V11_WO008_CLI_ROI_BENCHMARK",
  measuredAtCommit: commitSha,
  measuredTree: treeFingerprint,
  repetitionCount: repetitions,
  timing: { source: "MEASURED", unit: "ms", sourceWorkspace: manualSamples, cli: cliSamples },
  tokens: { source: "UNAVAILABLE", unit: "tokens", value: null, scope: "ChatGPT Work does not expose token counts to this local runner" },
  qualityGateStatus: gateStatus,
  records: { sourceWorkspace: manualResult.record, cli: cliResult.record },
  report,
}, null, 2)}\n`);
