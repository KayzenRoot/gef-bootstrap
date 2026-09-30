import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(TEST_FILE), "..");
const REAL_SCRIPT = join(REPO_ROOT, "packages", "cli", "scripts", "prepare-package.mjs");
const SOURCE_BYTES = readFileSync(REAL_SCRIPT);
const EXPECTED_GIT_BLOB = "10e659ccce15045ed37ffa3e82d06a8408b8f734";
const canonicalBytes = Buffer.from(SOURCE_BYTES.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
const actualGitBlob = createHash("sha1").update(`blob ${canonicalBytes.length}\0`).update(canonicalBytes).digest("hex");
assert.equal(actualGitBlob, EXPECTED_GIT_BLOB, "package builder changed from its admitted source blob");

const FIXTURE_ROOT = mkdtempSync(join(realpathSync(tmpdir()), "gef-pack-cli-negative-"));
test.after(() => {
  const absolute = resolve(FIXTURE_ROOT);
  const tempRoot = resolve(realpathSync(tmpdir()));
  const prefix = `${tempRoot}${sep}`;
  assert.ok(absolute.startsWith(prefix), `refusing fixture cleanup outside OS temp: ${absolute}`);
  assert.ok(absolute.split(/[\\/]/).pop().startsWith("gef-pack-cli-negative-"));
  rmSync(absolute, { recursive: true, force: true });
});

const FIXTURE_SCRIPT = join(FIXTURE_ROOT, "packages", "cli", "scripts", "prepare-package.mjs");
const BOOTSTRAP = join(FIXTURE_ROOT, "register-test-process.mjs");
mkdirSync(dirname(FIXTURE_SCRIPT), { recursive: true });
const originalSource = SOURCE_BYTES.toString("utf8");
assert.equal(originalSource.split("import.meta.url").length - 1, 2);
let copiedSource = originalSource.replaceAll("import.meta.url", JSON.stringify(pathToFileURL(FIXTURE_SCRIPT).href));
const processBinding = 'import { tmpdir } from "node:os";';
assert.equal(copiedSource.split(processBinding).length - 1, 1);
copiedSource = copiedSource.replace(processBinding, `${processBinding} const process = globalThis.__gefPackNegativeProcess;`);
assert.equal((copiedSource.match(/\n/g) ?? []).length, (originalSource.match(/\n/g) ?? []).length);
writeFileSync(FIXTURE_SCRIPT, copiedSource, "utf8");
writeFileSync(BOOTSTRAP, "globalThis.__gefPackNegativeProcess = process;\n", "utf8");

test("package CLI rejects missing --destination through a real child process", () => {
  const result = spawnSync(process.execPath, ["--import", pathToFileURL(BOOTSTRAP).href, "packages/cli/scripts/prepare-package.mjs", "--pack"], {
    cwd: FIXTURE_ROOT,
    encoding: "utf8",
    timeout: 30_000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--pack requires --destination <dir>/);
  assert.equal(result.stdout, "");
});
