import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

import { reportWindowsRights } from "../packages/cli/scripts/rights-diagnostics.mjs";

const REAL_SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "../packages/cli/scripts/prepare-package.mjs");
const REAL_CLI_PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), "../packages/cli");
const FIXTURE_ROOT = mkdtempSync(join(tmpdir(), "gef-pack-branch-fixture-"));
const FIXTURE_REPO = join(FIXTURE_ROOT, "repo");
const FIXTURE_SCRIPT = join(FIXTURE_REPO, "packages", "cli", "scripts", "prepare-package.mjs");
const REAL_SCRIPT_URL = pathToFileURL(REAL_SCRIPT).href;
const SOURCE_BYTES = readFileSync(REAL_SCRIPT);
const SOURCE_SHA256 = createHash("sha256").update(SOURCE_BYTES).digest("hex");
const ADMITTED_GIT_BLOB = "10e659ccce15045ed37ffa3e82d06a8408b8f734";
const gitBlobSha1 = bytes => {
  const canonicalBytes = Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
  return createHash("sha1").update(`blob ${canonicalBytes.length}\0`).update(canonicalBytes).digest("hex");
};
assert.equal(gitBlobSha1(SOURCE_BYTES), ADMITTED_GIT_BLOB, "package builder changed from the admitted source blob");

const ENGINE_SOURCES = [
  "packages/m48-m54-maintenance/src/index.mjs",
  "packages/area-h-governance/index.mjs",
  "packages/security-reliability-integrations/src/index.js",
  "packages/m41-m47-platform/src/index.mjs",
  "packages/m55-m61-quality/src/index.mjs",
  "packages/m62-m63-final/src/index.mjs",
];
const SUPPORT_SOURCE = "packages/m62-m63-final/src/v11-performance-telemetry.mjs";
const SCHEMA_ASSETS = [
  "gef-cli-state.schema.json",
  "gef-cli-receipt.schema.json",
  "gef-cli-upgrade-state.schema.json",
  "gef-cli-upgrade-compatibility-matrix.schema.json",
  "gef-cli-upgrade-compatibility-matrix.json",
];
const RUNTIME_PACKAGES = ["contracts", "kernel", "preflight"];
const HOST_NATIVE_PACKAGE = `koffi-${process.platform}-${process.arch}`;
const ORIGINAL_TEST_PROCESS = process;
const executionState = {
  execPath: ORIGINAL_TEST_PROCESS.execPath,
  env: ORIGINAL_TEST_PROCESS.env,
  argv: ORIGINAL_TEST_PROCESS.argv,
};
const fixtureProcess = new Proxy(ORIGINAL_TEST_PROCESS, {
  get(target, property) {
    if (property === "execPath" || property === "env" || property === "argv") return executionState[property];
    return Reflect.get(target, property, target);
  },
});

test.after(() => {
  const absolute = resolve(FIXTURE_ROOT);
  const tempRoot = resolve(tmpdir());
  const prefix = `${tempRoot}${sep}`;
  assert.ok(absolute.startsWith(prefix), `refusing fixture cleanup outside OS temp: ${absolute}`);
  assert.ok(absolute.split(/[\\/]/).pop().startsWith("gef-pack-branch-fixture-"));
  rmSync(absolute, { recursive: true, force: true });
});

function testCopySource() {
  const original = SOURCE_BYTES.toString("utf8");
  const metaUrlCount = original.split("import.meta.url").length - 1;
  assert.equal(metaUrlCount, 2, "only the two script-root URL expressions may be redirected");
  const fixtureUrl = pathToFileURL(FIXTURE_SCRIPT).href;
  let copied = original.replaceAll("import.meta.url", JSON.stringify(fixtureUrl));
  const processBinding = 'import { tmpdir } from "node:os";';
  assert.equal(copied.split(processBinding).length - 1, 1, "expected one test-local process binding point");
  copied = copied.replace(processBinding, `${processBinding} const process = globalThis.__gefPackageTestProcess;`);
  assert.equal((copied.match(/\n/g) ?? []).length, (original.match(/\n/g) ?? []).length, "fixture adaptation must preserve source line numbers");
  return copied;
}

function writeFixtureScript() {
  mkdirSync(dirname(FIXTURE_SCRIPT), { recursive: true });
  writeFileSync(FIXTURE_SCRIPT, testCopySource(), "utf8");
  assert.equal(createHash("sha256").update(SOURCE_BYTES).digest("hex"), SOURCE_SHA256);
}

function writeFixtureFile(relativePath, content = "fixture payload\n") {
  const path = join(FIXTURE_REPO, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function seedFixture({ payload = true, engines = true, support = true, schemas = true, nativeRoot = true, hostNative = true, koffi = true, runtimeDists = true, license = true } = {}) {
  if (payload) {
    for (const directory of ["dist", "bin", "schemas"]) mkdirSync(join(FIXTURE_REPO, "packages", "cli", directory), { recursive: true });
    writeFixtureFile("packages/cli/README.md", "fixture CLI readme\n");
    writeFixtureFile("packages/cli/package.json", JSON.stringify({ name: "@gef-bootstrap/cli", version: "1.1.0" }));
  }
  if (engines) for (const source of ENGINE_SOURCES) writeFixtureFile(source);
  if (support) writeFixtureFile(SUPPORT_SOURCE);
  if (schemas) for (const asset of SCHEMA_ASSETS) writeFixtureFile(`packages/cli/schemas/${asset}`, "{}\n");
  if (nativeRoot) {
    const root = join(FIXTURE_REPO, "node_modules", "@koromix");
    mkdirSync(root, { recursive: true });
    if (hostNative) writeFixtureFile(`node_modules/@koromix/${HOST_NATIVE_PACKAGE}/package.json`, JSON.stringify({ name: `@koromix/${HOST_NATIVE_PACKAGE}`, version: "3.3.0" }));
    else writeFixtureFile("node_modules/@koromix/koffi-other-platform-x64/package.json", JSON.stringify({ name: "@koromix/koffi-other-platform-x64", version: "3.3.0" }));
  }
  if (koffi) writeFixtureFile("node_modules/koffi/package.json", JSON.stringify({ name: "koffi", version: "3.3.0" }));
  if (runtimeDists) {
    for (const name of RUNTIME_PACKAGES) {
      writeFixtureFile(`packages/${name}/package.json`, JSON.stringify({ name: `@gef-bootstrap/${name}`, version: "0.0.0" }));
      writeFixtureFile(`packages/${name}/dist/index.mjs`);
    }
  }
  if (license) writeFixtureFile("LICENSE", "Synthetic fixture license\n");
}

function resetFixture(options) {
  rmSync(FIXTURE_REPO, { recursive: true, force: true });
  mkdirSync(FIXTURE_REPO, { recursive: true });
  writeFixtureScript();
  seedFixture(options);
}

function stagePaths() {
  const prefix = `gef-cli-package-${ORIGINAL_TEST_PROCESS.pid.toString(36)}-`;
  return readdirSync(tmpdir()).filter(name => name.startsWith(prefix)).map(name => join(tmpdir(), name));
}

function cleanupNewStages(before) {
  const tempRoot = resolve(tmpdir());
  const prefix = `${tempRoot}${sep}`;
  for (const candidate of stagePaths()) {
    if (before.has(candidate)) continue;
    const absolute = resolve(candidate);
    assert.ok(absolute.startsWith(prefix), `refusing to clean staging outside OS temp: ${absolute}`);
    assert.ok(absolute.split(/[\\/]/).pop().startsWith(`gef-cli-package-${ORIGINAL_TEST_PROCESS.pid.toString(36)}-`));
    rmSync(absolute, { recursive: true, force: true });
  }
}

function expectStageFailure(stage, message) {
  const before = new Set(stagePaths());
  let error;
  try {
    stage();
  } catch (caught) {
    error = caught;
  } finally {
    cleanupNewStages(before);
  }
  assert.ok(error instanceof Error, `expected stage() to fail with ${message}`);
  assert.match(error.message, message);
  assert.deepEqual(stagePaths(), [...before], "failed stage must leave no new staging directory");
}

function expectPackFailure(pack, destination, message) {
  const before = new Set(stagePaths());
  let error;
  try {
    pack(destination);
  } catch (caught) {
    error = caught;
  } finally {
    cleanupNewStages(before);
  }
  assert.ok(error instanceof Error, `expected pack() to fail with ${message}`);
  assert.match(error.message, message);
  assert.deepEqual(stagePaths(), [...before], "failed pack must remove staging in finally");
}

function packageTreeSnapshot(root) {
  const entries = [];
  const visit = (directory, relative = "") => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const absolute = join(directory, entry.name);
      if (entry.isSymbolicLink()) entries.push([childRelative, `link:${readlinkSync(absolute)}`]);
      else if (entry.isDirectory()) visit(absolute, childRelative);
      else if (entry.isFile()) entries.push([childRelative, createHash("sha256").update(readFileSync(absolute)).digest("hex")]);
    }
  };
  visit(root);
  return entries;
}

function withExecutionState(overrides, operation) {
  const previous = { execPath: executionState.execPath, env: executionState.env, argv: executionState.argv };
  Object.assign(executionState, overrides);
  try {
    return operation();
  } finally {
    Object.assign(executionState, previous);
  }
}

mkdirSync(FIXTURE_REPO, { recursive: true });
writeFixtureScript();
seedFixture();
const initialPackDestination = join(FIXTURE_ROOT, "initial-pack-output");
executionState.argv = [ORIGINAL_TEST_PROCESS.execPath, FIXTURE_SCRIPT, "--pack", "--destination", initialPackDestination];
globalThis.__gefPackageTestProcess = fixtureProcess;
registerHooks({
  load(url, context, nextLoad) {
    if (url === REAL_SCRIPT_URL) return { format: "module", shortCircuit: true, source: readFileSync(FIXTURE_SCRIPT, "utf8") };
    return nextLoad(url, context);
  },
});
const packageBuilder = await import(REAL_SCRIPT_URL);
delete globalThis.__gefPackageTestProcess;
executionState.argv = ORIGINAL_TEST_PROCESS.argv;
const initialTarballs = readdirSync(initialPackDestination).filter(name => name.endsWith(".tgz"));
assert.equal(initialTarballs.length, 1, "direct --pack invocation with --destination should create one real tarball");
assert.ok(readFileSync(join(initialPackDestination, initialTarballs[0])).length > 1024);

test("rights diagnostics: a non-Windows host does not probe replacement rights", () => {
  const lines = [];
  reportWindowsRights({
    platform: "linux",
    candidates: ["not-inspected"],
    available: () => assert.fail("Windows oracle must not run on POSIX"),
    pathExists: () => assert.fail("candidate must not be opened on POSIX"),
    log: (...values) => lines.push(values.join(" ")),
  });
  assert.deepEqual(lines, ["rights oracle: not applicable on linux (the POSIX effective-write chain is the proof)"]);
});

test("rights diagnostics: Windows reports absent and content-writable candidates", () => {
  const present = join("fixture", "bin", "git.exe");
  const missing = join("fixture", "bin", "absent.exe");
  const lines = [];
  const probes = [];
  let closed = 0;
  reportWindowsRights({
    platform: "win32",
    candidates: [missing, present],
    available: () => true,
    pathExists: path => path === present,
    openFile: (path, mode) => {
      assert.equal(path, present);
      assert.equal(mode, "r+");
      return 17;
    },
    closeFile: handle => {
      assert.equal(handle, 17);
      closed += 1;
    },
    right: (path, permission, isDirectory) => {
      probes.push({ path, permission, isDirectory });
      return permission === "DELETE" ? "DENIED" : "UNKNOWN";
    },
    log: (...values) => lines.push(values.join(" ")),
  });
  assert.equal(closed, 1);
  assert.deepEqual(probes, [
    { path: present, permission: "DELETE", isDirectory: false },
    { path: dirname(present), permission: "FILE_DELETE_CHILD", isDirectory: true },
  ]);
  assert.deepEqual(lines, [
    "rights oracle available: true",
    `${missing}: ABSENT`,
    `${present}: DELETE=DENIED FILE_DELETE_CHILD=UNKNOWN content-writable=true`,
  ]);
});

test("rights diagnostics: a denied content-open remains independent of the rights oracle", () => {
  const candidate = join("fixture", "locked", "git.exe");
  const lines = [];
  reportWindowsRights({
    platform: "win32",
    candidates: [candidate],
    available: () => false,
    pathExists: path => path === candidate,
    openFile: () => {
      const error = new Error("simulated access denied");
      error.code = "EACCES";
      throw error;
    },
    closeFile: () => assert.fail("failed open must never be closed"),
    right: (_path, permission) => permission === "DELETE" ? "UNKNOWN" : "DENIED",
    log: (...values) => lines.push(values.join(" ")),
  });
  assert.deepEqual(lines, [
    "rights oracle available: false",
    `${candidate}: DELETE=UNKNOWN FILE_DELETE_CHILD=DENIED content-writable=false`,
  ]);
});

test("package preparation: real fail-closed branches clean isolated staging and preserve the production package", { timeout: 180_000 }, () => {
  const { stage, pack } = packageBuilder;
  const productionSnapshot = packageTreeSnapshot(REAL_CLI_PACKAGE);
  const admittedBlob = gitBlobSha1(readFileSync(REAL_SCRIPT));
  assert.equal(admittedBlob, ADMITTED_GIT_BLOB);
  assert.ok(existsSync(join(initialPackDestination, initialTarballs[0])));

  resetFixture({ payload: false, engines: false, support: false, schemas: false, nativeRoot: false, hostNative: false, koffi: false, runtimeDists: false, license: false });
  expectStageFailure(stage, /Package payload is missing: dist/);

  resetFixture({ payload: true, engines: false, support: false, schemas: false, nativeRoot: false, hostNative: false, koffi: false, runtimeDists: false, license: false });
  expectStageFailure(stage, /Engine source is missing: packages\/m48-m54-maintenance\/src\/index\.mjs/);

  resetFixture({ payload: true, engines: true, support: false, schemas: false, nativeRoot: false, hostNative: false, koffi: false, runtimeDists: false, license: false });
  expectStageFailure(stage, /Engine support source is missing: packages\/m62-m63-final\/src\/v11-performance-telemetry\.mjs/);

  resetFixture({ payload: true, engines: true, support: true, schemas: false, nativeRoot: false, hostNative: false, koffi: false, runtimeDists: false, license: false });
  expectStageFailure(stage, /CLI schema asset is missing: schemas\/gef-cli-state\.schema\.json/);

  resetFixture({ payload: true, engines: true, support: true, schemas: true, nativeRoot: false, hostNative: false, koffi: false, runtimeDists: false, license: false });
  expectStageFailure(stage, /Native runtime for this host is missing: @koromix\/koffi-/);

  resetFixture({ payload: true, engines: true, support: true, schemas: true, nativeRoot: true, hostNative: false, koffi: false, runtimeDists: false, license: false });
  expectStageFailure(stage, /Native runtime for this host is missing: @koromix\/koffi-/);

  resetFixture({ payload: true, engines: true, support: true, schemas: true, nativeRoot: true, hostNative: true, koffi: false, runtimeDists: false, license: false });
  expectStageFailure(stage, /Runtime native package is missing: koffi/);

  resetFixture({ payload: true, engines: true, support: true, schemas: true, nativeRoot: true, hostNative: true, koffi: true, runtimeDists: false, license: false });
  expectStageFailure(stage, /Runtime package is not built: packages\/contracts\/dist/);

  resetFixture({ payload: true, engines: true, support: true, schemas: true, nativeRoot: true, hostNative: true, koffi: true, runtimeDists: true, license: false });
  expectStageFailure(stage, /Repository LICENSE is missing/);

  resetFixture();
  const beforeStage = new Set(stagePaths());
  const staged = stage();
  try {
    assert.ok(existsSync(join(staged, "vendor", "MANIFEST.json")));
    assert.ok(existsSync(join(staged, "LICENSE")));
  } finally {
    rmSync(staged, { recursive: true, force: true });
    cleanupNewStages(beforeStage);
  }
  assert.deepEqual(stagePaths(), [...beforeStage], "successful stage fixture is cleaned by its owner");

  const missingNpmCli = join(FIXTURE_ROOT, "missing-npm-cli.mjs");
  const isolatedExecPath = join(FIXTURE_ROOT, "isolated-node", "bin", "node.exe");
  const missingNpmDestination = join(FIXTURE_ROOT, "missing-npm-destination");
  const isolatedNpmCandidate = process.platform === "win32"
    ? join(dirname(isolatedExecPath), "node_modules", "npm", "bin", "npm-cli.js")
    : resolve(dirname(isolatedExecPath), "..", "lib", "node_modules", "npm", "bin", "npm-cli.js");
  assert.equal(existsSync(missingNpmCli), false);
  assert.equal(existsSync(isolatedNpmCandidate), false);
  withExecutionState(
    { execPath: isolatedExecPath, env: { ...ORIGINAL_TEST_PROCESS.env, npm_execpath: missingNpmCli } },
    () => expectPackFailure(pack, missingNpmDestination, /Unable to resolve npm CLI from the active Node\.js installation/),
  );

  const failingNpm = join(FIXTURE_ROOT, "fake-npm-failure.mjs");
  writeFileSync(failingNpm, 'process.stderr.write("fixture npm failure\\n"); process.exitCode = 7;\n', "utf8");
  withExecutionState(
    { env: { ...ORIGINAL_TEST_PROCESS.env, npm_execpath: failingNpm } },
    () => expectPackFailure(pack, join(FIXTURE_ROOT, "failed-pack"), /npm pack failed:.*fixture npm failure/),
  );

  const silentNpm = join(FIXTURE_ROOT, "fake-npm-no-tarball.mjs");
  writeFileSync(silentNpm, 'process.stdout.write("fixture completed without a tarball\\n");\n', "utf8");
  withExecutionState(
    { env: { ...ORIGINAL_TEST_PROCESS.env, npm_execpath: silentNpm } },
    () => expectPackFailure(pack, join(FIXTURE_ROOT, "empty-pack"), /npm pack produced no tarball at/),
  );

  const successDestination = join(FIXTURE_ROOT, "successful-pack-output");
  const realPackTarball = pack(successDestination);
  assert.equal(existsSync(realPackTarball), true);
  assert.equal(realPackTarball.endsWith(".tgz"), true);
  assert.equal(dirname(realPackTarball), successDestination);
  assert.ok(readFileSync(realPackTarball).length > 1024, "a real package tarball must be produced");
  assert.deepEqual(stagePaths(), [...beforeStage], "pack() must remove its staging directory on success");

  assert.equal(gitBlobSha1(readFileSync(REAL_SCRIPT)), ADMITTED_GIT_BLOB, "production builder source must remain unchanged");
  assert.deepEqual(packageTreeSnapshot(REAL_CLI_PACKAGE), productionSnapshot, "isolated package tests must not modify the production CLI workspace");
});
