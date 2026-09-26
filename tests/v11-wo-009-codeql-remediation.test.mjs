import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const diagnostics = resolve(ROOT, "packages/cli/scripts/rights-diagnostics.mjs");
const codeqlWorkflow = readFileSync(resolve(ROOT, ".github/workflows/security-codeql.yml"), "utf8");

test("SEC-INT-07: rights diagnostics never print the caller username from the environment", () => {
  const sentinel = `GEF_USERNAME_SENTINEL_${randomUUID()}`;
  const result = spawnSync(process.execPath, [diagnostics], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 30_000,
    windowsHide: true,
    env: { ...process.env, USERNAME: sentinel },
  });

  assert.equal(result.error, undefined, `diagnostics must execute: ${result.error?.message ?? ""}`);
  assert.equal(result.signal, null, "diagnostics must not be killed");
  assert.equal(result.status, 0, `diagnostics must exit successfully: ${result.stderr ?? ""}`);
  assert.equal(`${result.stdout ?? ""}${result.stderr ?? ""}`.includes(sentinel), false,
    "the environment username must never appear in diagnostics output");
});

test("CodeQL covers V1.1 pull requests, pushes, JavaScript, TypeScript and tests", () => {
  const expectedBranchFilter = 'branches: [main, "release/1.1"]';
  assert.equal(codeqlWorkflow.split(expectedBranchFilter).length - 1, 2);
  for (const path of ['"packages/**/*.ts"', '"packages/**/*.js"', '"packages/**/*.mjs"', '"tests/**/*.mjs"']) {
    assert.ok(codeqlWorkflow.includes(path), `CodeQL path filter is missing ${path}`);
  }
});
