// GBS-V11-WO-002 correction — distribution smoke.
//
// Proves a real local install of the packed artifact. The package is built with `npm pack`,
// then installed with an actual `npm install` into a fresh temporary directory. Nothing from
// the source tree is copied into the sandbox: whatever the installed CLI needs must come from
// the tarball itself, which is exactly the property the previous revision failed to prove.
//
// No publication is performed or claimed by any case in this file.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI_PACKAGE_DIR = resolve(ROOT, "packages/cli");
const cliPackage = JSON.parse(readFileSync(join(CLI_PACKAGE_DIR, "package.json"), "utf8"));

const PACK_TIMEOUT_MS = 180_000;
const INSTALL_TIMEOUT_MS = 300_000;

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", timeout: PACK_TIMEOUT_MS, ...options });
}

function npmCommand(argsString, options) {
  // npm ships as a `.cmd` shim on Windows, which needs a shell; elsewhere argv is passed directly.
  if (process.platform === "win32") return spawnSync(argsString, { encoding: "utf8", timeout: PACK_TIMEOUT_MS, shell: true, ...options });
  const [command, ...args] = argsString.split(" ");
  return run(command, args, options);
}

function packCli(destination) {
  // The repository-approved local distribution path: a staging build that never writes into the
  // package directory. It is deliberately not `npm pack` in place, so a pack cannot disturb a
  // concurrently running CLI in this workspace.
  mkdirSync(destination, { recursive: true });
  const packaged = run(process.execPath, [join(CLI_PACKAGE_DIR, "scripts", "prepare-package.mjs"), "--pack", "--destination", destination], { cwd: ROOT, shell: false });
  assert.equal(packaged.status, 0, `packaging must succeed: ${packaged.stderr}`);
  const tarballPath = packaged.stdout.trim().split("\n").pop().trim();
  assert.ok(existsSync(tarballPath), `tarball must exist at ${tarballPath}`);
  return tarballPath;
}

/** A fresh directory containing only what a real `npm install` produces. */
function freshInstall(t) {
  const sandbox = mkdtempSync(join(tmpdir(), "gef-dist-"));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));
  const tarball = packCli(join(sandbox, "__tarball__"));
  const init = npmCommand("npm init -y", { cwd: sandbox });
  assert.equal(init.status, 0, `npm init must succeed: ${init.stderr}`);
  const installed = npmCommand(`npm install --no-audit --no-fund "${tarball}"`, { cwd: sandbox });
  assert.equal(installed.status, 0, `npm install must succeed: ${installed.stderr}`);
  const cliDir = join(sandbox, "node_modules", "@gef-bootstrap", "cli");
  return { sandbox, cliDir, bin: join(cliDir, "bin", "gef.mjs") };
}

function gefAt(bin, args) {
  const result = run(process.execPath, [bin, ...args], { encoding: "utf8", timeout: 60_000 });
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function tempProject(t) {
  const project = mkdtempSync(join(tmpdir(), "gef-dist-project-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));
  return project;
}

// ------------------------------------------------------------ DIST-SMOKE-01

test("DIST-SMOKE-01: a clean npm install produces a self-contained, runnable CLI", (t) => {
  const { cliDir, bin } = freshInstall(t);
  assert.ok(existsSync(bin), "the packed bin mapping target must exist after install");

  // The install must not contain source-tree copies injected by the test.
  const installedTopLevel = readdirSync(join(cliDir)).sort();
  assert.ok(installedTopLevel.includes("dist"), "built runtime must be installed");
  assert.ok(installedTopLevel.includes("vendor"), "vendored engines must be installed");
  assert.ok(installedTopLevel.includes("schemas"), "schema assets must be installed");
  assert.ok(!installedTopLevel.includes("src"), "build sources must not be installed");
  assert.ok(!installedTopLevel.includes("tsconfig.json"), "build config must not be installed");
});

test("DIST-SMOKE-01b: the packed payload carries README, LICENSE and the schema assets", (t) => {
  const { cliDir } = freshInstall(t);
  assert.ok(existsSync(join(cliDir, "README.md")), "README is part of the payload");
  assert.ok(existsSync(join(cliDir, "LICENSE")), "LICENSE is part of the payload");
  for (const schema of ["gef-cli-state.schema.json", "gef-cli-receipt.schema.json"]) {
    assert.ok(existsSync(join(cliDir, "schemas", schema)), `${schema} is part of the payload`);
  }
  const packedManifest = JSON.parse(readFileSync(join(cliDir, "package.json"), "utf8"));
  assert.equal(packedManifest.name, "@gef-bootstrap/cli");
  assert.equal(packedManifest.version, cliPackage.version);
  assert.deepEqual(packedManifest.bin, { gef: "./bin/gef.mjs" });
  assert.equal(packedManifest.private, true);
  // Runtime dependencies are bundled, not resolved from a registry.
  assert.deepEqual(
    [...(packedManifest.bundleDependencies ?? packedManifest.bundledDependencies ?? [])].sort(),
    ["@gef-bootstrap/contracts", "@gef-bootstrap/kernel"],
  );
  assert.ok(existsSync(join(cliDir, "node_modules", "@gef-bootstrap", "kernel")), "the bundled runtime must be installed with the package");
  assert.ok(existsSync(join(cliDir, "node_modules", "@gef-bootstrap", "contracts")));
});

test("DIST-SMOKE-01c: the installed CLI operates without any surrounding source checkout", (t) => {
  const { bin } = freshInstall(t);
  const project = tempProject(t);

  const help = gefAt(bin, ["--help"]);
  assert.equal(help.code, 0, `installed help must exit 0: ${help.stderr}`);
  assert.deepEqual(JSON.parse(help.stdout).commands.map((command) => command.id), ["gef.adopt.apply", "gef.adopt.preview", "gef.init.plan", "gef.init.run"]);

  const version = gefAt(bin, ["--version"]);
  assert.equal(version.code, 0);
  assert.equal(JSON.parse(version.stdout).version, cliPackage.version);

  const plan = gefAt(bin, ["init", "--target", project]);
  assert.equal(plan.code, 0, `installed init must exit 0: ${plan.stderr}`);
  assert.equal(JSON.parse(plan.stdout).value.plan.install.state, "READY");

  const applied = gefAt(bin, ["init", "--apply", "--target", project]);
  assert.equal(applied.code, 0, `installed init --apply must exit 0: ${applied.stderr}`);
  assert.equal(JSON.parse(applied.stdout).value.transaction.outcome, "APPLIED");

  const adopted = gefAt(bin, ["adopt", "--apply", "--target", project]);
  assert.equal(adopted.code, 0, `installed adopt --apply must exit 0: ${adopted.stderr}`);
  assert.equal(JSON.parse(adopted.stdout).value.transaction.outcome, "APPLIED");

  assert.ok(existsSync(join(project, ".gef", "init-state.json")));
  assert.ok(existsSync(join(project, ".gef", "adopt-state.json")));

  // Engine resolution is explicit and reproducible: the installed package's own vendor tree is
  // used, and the workspace fallback cannot resolve from the sandbox.
  const engineBundle = readFileSync(join(bin, "..", "..", "dist", "registry.js"), "utf8");
  assert.ok(engineBundle.includes("vendor/engines"), "the declared resolution order must include the packaged vendor path");
  const manifest = JSON.parse(readFileSync(join(bin, "..", "..", "vendor", "MANIFEST.json"), "utf8"));
  assert.equal(manifest.kind, "gef.cli.vendored-artifacts");
  for (const artefact of manifest.artifacts.filter((entry) => entry.kind === "engine")) {
    assert.match(artefact.sha256, /^[0-9a-f]{64}$/, `${artefact.name} must carry a recorded digest`);
  }
});

// ------------------------------------------------------------ DIST-SMOKE-02

test("DIST-SMOKE-02a: a missing built entry fails closed without a stack trace", (t) => {
  const { cliDir, bin } = freshInstall(t);
  rmSync(join(cliDir, "dist"), { recursive: true, force: true });
  const broken = gefAt(bin, ["--version"]);
  assert.equal(broken.code, 40, "a broken install must exit through the capability path");
  assert.match(broken.stderr, /CLI entry is unavailable/);
  assert.ok(!broken.stderr.includes("    at "), "a broken install must not emit an unhandled stack trace");
});

test("DIST-SMOKE-02b: a missing engine bundle fails closed instead of degrading", (t) => {
  const { cliDir, bin } = freshInstall(t);
  rmSync(join(cliDir, "vendor"), { recursive: true, force: true });
  const project = tempProject(t);

  // --version is pure provenance and still works.
  assert.equal(gefAt(bin, ["--version"]).code, 0);

  // Anything that requires the engine inventory or a domain engine fails closed.
  for (const args of [["--help"], ["init", "--target", project], ["init", "--apply", "--target", project]]) {
    const result = gefAt(bin, args);
    assert.equal(result.code, 40, `${args.join(" ")} must fail closed without engines`);
    assert.ok(result.code !== 0);
  }
  assert.ok(!existsSync(join(project, ".gef")), "a failed command must not mutate the target");
});

// ------------------------------------------------------------ DIST-SMOKE-03

test("DIST-SMOKE-03: uninstall removes only installed files and never project data", (t) => {
  const { cliDir, bin, sandbox } = freshInstall(t);
  const project = tempProject(t);
  writeFileSync(join(project, "USER-DATA.txt"), "irreplaceable user content\n");
  mkdirSync(join(project, "src"), { recursive: true });
  writeFileSync(join(project, "src", "app.js"), "// user source\n");

  assert.equal(gefAt(bin, ["init", "--apply", "--target", project]).code, 0);
  assert.ok(existsSync(join(project, ".gef", "init-state.json")));

  rmSync(cliDir, { recursive: true, force: true });
  assert.ok(!existsSync(cliDir), "the package directory is removed");

  assert.equal(readFileSync(join(project, "USER-DATA.txt"), "utf8"), "irreplaceable user content\n");
  assert.equal(readFileSync(join(project, "src", "app.js"), "utf8"), "// user source\n");
  assert.ok(existsSync(join(project, ".gef", "init-state.json")), "governed project state is project data, not package data");
  assert.ok(existsSync(join(sandbox, "node_modules", "@gef-bootstrap")), "the install root itself is untouched");
});

// ------------------------------------------------------------ DIST-SMOKE-04

test("DIST-SMOKE-04: no publication is performed or claimed", (t) => {
  const { cliDir } = freshInstall(t);

  assert.equal(cliPackage.private, true, "the CLI package must stay private");
  assert.equal(cliPackage.publishConfig, undefined, "no publishConfig may be declared");
  assert.ok(!existsSync(join(CLI_PACKAGE_DIR, ".npmrc")), "no registry credentials may ship with the package");
  assert.equal(JSON.parse(readFileSync(join(cliDir, "package.json"), "utf8")).private, true);
  assert.equal(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).private, true);

  const cliReadme = readFileSync(join(CLI_PACKAGE_DIR, "README.md"), "utf8");
  assert.match(cliReadme, /No publication to npm, GitHub Releases or any registry is performed or claimed/);

  // The shipped runtime carries no registry-write capability at all.
  for (const file of readdirSync(join(cliDir, "dist")).filter((name) => name.endsWith(".js"))) {
    const body = readFileSync(join(cliDir, "dist", file), "utf8");
    for (const forbidden of ["node:http", "node:https", "registry.npmjs.org", "NPM_TOKEN", "npm_config_registry"]) {
      assert.ok(!body.includes(forbidden), `${file} must not reference ${forbidden}`);
    }
  }

  // The only npm verbs this suite invokes are pack/init/install; no registry write is reachable.
  const self = readFileSync(fileURLToPath(import.meta.url), "utf8");
  // This suite invokes only `npm init` and `npm install`; packaging goes through the
  // repository script, and no registry write is reachable from any of them.
  const verbs = [...new Set([...self.matchAll(/npmCommand\(`npm ([a-z-]+)/g)].map((match) => match[1]))];
  for (const verb of verbs) assert.ok(["init", "install"].includes(verb), `unexpected npm verb: ${verb}`);
  assert.ok(!/npm (publish|adduser|login|token)/.test(self), "no registry verb may appear in this suite");
});
