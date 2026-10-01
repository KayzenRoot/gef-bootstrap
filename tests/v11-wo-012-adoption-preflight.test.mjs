import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GEF_BIN = resolve(ROOT, "packages/cli/bin/gef.mjs");

function git(target, args) {
  const result = spawnSync("git", ["-C", target, ...args], { encoding: "utf8", timeout: 30_000 });
  assert.equal(result.error, undefined, result.error?.message ?? "git must complete");
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return (result.stdout ?? "").trim();
}

function createConsumer(t, { paths = ["src/", "scripts/", "harness/"], registry = true } = {}) {
  const target = mkdtempSync(join(tmpdir(), "gef-wo-012-consumer-"));
  t.after(() => rmSync(target, { recursive: true, force: true }));
  git(target, ["init", "-q", "--initial-branch=main"]);
  git(target, ["config", "user.email", "executor@example.invalid"]);
  git(target, ["config", "user.name", "GEF Work Order Test"]);
  mkdirSync(join(target, "src"), { recursive: true });
  writeFileSync(join(target, "src", "consumer.mjs"), "export const consumer = true;\n");

  if (registry !== false) {
    mkdirSync(join(target, "scripts", "lib"), { recursive: true });
    mkdirSync(join(target, "harness"), { recursive: true });
    writeFileSync(join(target, "scripts", "harness.mjs"), [
      'import fs from "node:fs";',
      'import path from "node:path";',
      'import { calculateImpact, validateRegistry } from "./lib/impact.mjs";',
      'const root = process.cwd();',
      'const registry = validateRegistry(JSON.parse(fs.readFileSync(path.join(root, "harness/modules.json"), "utf8")));',
      "function fail(message) { throw new Error(message); }",
      "function impact(files) {",
      "  const result = calculateImpact(registry, files);",
      '  if (result.unknown.length) fail("UNKNOWN_FILES_FAIL_CLOSED");',
      "  return result;",
      "}",
      "void impact;",
      "",
    ].join("\n"));
    writeFileSync(join(target, "scripts", "lib", "impact.mjs"), [
      "export function validateRegistry(registry) {",
      '  if (registry.schema_version !== 1 || !Array.isArray(registry.modules)) throw new Error("INVALID_REGISTRY_SCHEMA");',
      "  return registry;",
      "}",
      "export function calculateImpact(registry, paths) {",
      "  const unknown = [];",
      "  for (const path of paths) {",
      "    let matched = false;",
      '    for (const mod of registry.modules) if (mod.paths.some(prefix => prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix)) matched = true;',
      "    if (!matched) unknown.push(path);",
      "  }",
      "  return { unknown };",
      "}",
      "",
    ].join("\n"));
    if (registry === "malformed") {
      writeFileSync(join(target, "harness", "modules.json"), "{ malformed registry\n");
    } else {
      writeFileSync(join(target, "harness", "modules.json"), `${JSON.stringify({
        schema_version: 1,
        modules: [{
          id: "bootstrap",
          state: "active",
          depends_on: [],
          paths,
          tests: ["tests/bootstrap/*.test.mjs"],
        }],
      }, null, 2)}\n`);
    }
  }

  git(target, ["add", "."]);
  git(target, ["commit", "-qm", "seed consumer baseline"]);
  return target;
}

function filesystemSnapshot(target) {
  const files = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name === ".git") continue;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) {
        files.push({
          path: relative(target, absolute).replaceAll("\\", "/"),
          sha256: createHash("sha256").update(readFileSync(absolute)).digest("hex"),
        });
      }
    }
  };
  walk(target);
  files.sort((left, right) => left.path.localeCompare(right.path));
  return {
    files,
    gitHead: git(target, ["rev-parse", "HEAD"]),
    gitStatus: git(target, ["status", "--porcelain", "--untracked-files=all"]),
  };
}

function runGef(args) {
  const result = spawnSync(process.execPath, [GEF_BIN, ...args, "--json"], { encoding: "utf8", timeout: 120_000 });
  assert.equal(result.error, undefined, result.error?.message ?? "GEF must complete");
  assert.equal(result.signal, null, "GEF must not be killed");
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

test("WO-012 blocks init/adopt before mutation when the local impact contract rejects generated GEF paths", (t) => {
  const target = createConsumer(t);
  for (const verb of ["init", "adopt"]) {
    const before = filesystemSnapshot(target);
    const result = runGef([verb, "--apply", "--target", target]);
    assert.notEqual(result.code, 0, `${verb} must block before writing GEF state`);
    const envelope = JSON.parse(result.stdout);
    assert.equal(envelope.ok, false);
    assert.match(JSON.stringify(envelope.error), /consumer_impact_contract_rejects_planned_paths/);
    assert.match(JSON.stringify(envelope.error), /UNKNOWN_FILES_FAIL_CLOSED/);
    assert.match(JSON.stringify(envelope.error), /\.gef\/.*state\.json/);
    assert.match(JSON.stringify(envelope.error), /\.gef\/receipts\//);
    assert.match(JSON.stringify(envelope.error), /blockingRule.*UNKNOWN_FILES_FAIL_CLOSED/);
    assert.deepEqual(filesystemSnapshot(target), before, `${verb} block must preserve files and Git state exactly`);
  }
});

test("WO-012 reports an ambiguous fail-closed impact contract and blocks without mutation", (t) => {
  const target = createConsumer(t, { registry: "malformed" });
  const before = filesystemSnapshot(target);
  const result = runGef(["adopt", "--apply", "--target", target]);
  assert.notEqual(result.code, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.ok, false);
  assert.match(JSON.stringify(envelope.error), /consumer_impact_contract_unknown/);
  assert.match(JSON.stringify(envelope.error), /harness\/modules\.json/);
  assert.deepEqual(filesystemSnapshot(target), before, "unknown policy must not be an optimistic pass or mutate the target");
});

test("WO-012 permits adoption when the valid local impact contract classifies generated GEF paths", (t) => {
  const target = createConsumer(t, { paths: ["src/", "scripts/", "harness/", ".gef/"] });
  const result = runGef(["adopt", "--apply", "--target", target]);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.ok, true);
  assert.equal(envelope.value.transaction.outcome, "APPLIED");
  assert.equal(envelope.value.artifactRef, ".gef/adopt-state.json");
  assert.equal(existsSync(join(target, ".gef", "receipts")), true);
});

test("WO-012 preserves normal adoption when no local impact contract is present", (t) => {
  const target = createConsumer(t, { registry: false });
  const result = runGef(["adopt", "--apply", "--target", target]);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.ok, true);
  assert.equal(envelope.value.transaction.outcome, "APPLIED");
});
