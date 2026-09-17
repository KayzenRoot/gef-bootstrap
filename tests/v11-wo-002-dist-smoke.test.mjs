// GBS-V11-WO-002 — distribution smoke.
//
// Proves the local packaging path end to end without ever touching a registry:
// the CLI package is packed with `npm pack`, the tarball is extracted into an isolated
// sandbox that supplies the workspace runtime, the packed `gef` executable is executed as a
// real process, and a broken install is shown to fail closed.
//
// Matrix mapping: DIST-SMOKE-01 .. DIST-SMOKE-04.
// No publication is performed or claimed by any case in this file.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI_PACKAGE_DIR = resolve(ROOT, "packages/cli");
const cliPackage = JSON.parse(readFileSync(join(CLI_PACKAGE_DIR, "package.json"), "utf8"));

const RUNTIME_DEPENDENCIES = ["contracts", "kernel"];

/** Engine modules the CLI reaches by relative resolution from its own dist directory. */
const ENGINE_MODULES = [
  { name: "m48-m54-maintenance", from: "packages/m48-m54-maintenance/src/index.mjs", to: "src/index.mjs" },
  { name: "area-h-governance", from: "packages/area-h-governance/index.mjs", to: "index.mjs" },
  { name: "security-reliability-integrations", from: "packages/security-reliability-integrations/src/index.js", to: "src/index.js" },
];

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", timeout: 120_000, ...options });
}

function packCli(destination) {
  mkdirSync(destination, { recursive: true });
  // npm ships as a `.cmd` shim on Windows, which needs a shell; elsewhere argv is passed directly.
  const packed =
    process.platform === "win32"
      ? spawnSync(`npm pack --pack-destination "${destination}"`, { cwd: CLI_PACKAGE_DIR, encoding: "utf8", timeout: 120_000, shell: true })
      : run("npm", ["pack", "--pack-destination", destination], { cwd: CLI_PACKAGE_DIR });
  assert.equal(packed.status, 0, `npm pack must succeed: ${packed.stderr}`);
  const tarball = packed.stdout.trim().split("\n").pop().trim();
  const tarballPath = join(destination, tarball);
  assert.ok(existsSync(tarballPath), `tarball must exist at ${tarballPath}`);
  return tarballPath;
}

function extract(tarball, destination) {
  mkdirSync(destination, { recursive: true });
  // The archive is streamed over stdin and the destination is supplied as the process cwd, so
  // no path is ever passed as a tar operand. That keeps extraction identical on Linux, macOS
  // and Windows, where a drive-letter path in `-f`/`-C` is misread as a remote host or mangled.
  const result = run("tar", ["-xz", "-f", "-", "--strip-components=1"], { cwd: destination, input: readFileSync(tarball) });
  assert.equal(result.status, 0, `tar extraction must succeed: ${result.stderr}`);
}

function installRuntime(sandbox) {
  for (const dependency of RUNTIME_DEPENDENCIES) {
    const target = join(sandbox, "node_modules", "@gef-bootstrap", dependency);
    mkdirSync(target, { recursive: true });
    cpSync(join(ROOT, "packages", dependency, "dist"), join(target, "dist"), { recursive: true });
    cpSync(join(ROOT, "packages", dependency, "package.json"), join(target, "package.json"));
  }
}

function installEngines(sandbox) {
  for (const engine of ENGINE_MODULES) {
    const target = join(sandbox, "node_modules", "@gef-bootstrap", engine.name, engine.to);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(ROOT, engine.from), target);
  }
}

function gefIn(sandbox, args) {
  const entry = join(sandbox, "node_modules", "@gef-bootstrap", "cli", "bin", "gef.mjs");
  const result = run(process.execPath, [entry, ...args], { encoding: "utf8", timeout: 60_000 });
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function buildSandbox({ engines }) {
  const sandbox = mkdtempSync(join(tmpdir(), "gef-dist-"));
  const tarball = packCli(join(sandbox, "__tarball__"));
  const cliDir = join(sandbox, "node_modules", "@gef-bootstrap", "cli");
  extract(tarball, cliDir);
  installRuntime(sandbox);
  if (engines) installEngines(sandbox);
  return { sandbox, cliDir, tarball };
}

// ------------------------------------------------------------ DIST-SMOKE-01

test("DIST-SMOKE-01: the packed executable resolves and runs from the tarball", () => {
  const { sandbox } = buildSandbox({ engines: true });
  try {
    const installedBin = join(sandbox, "node_modules", "@gef-bootstrap", "cli", "bin", "gef.mjs");
    assert.ok(existsSync(installedBin), "bin mapping target must exist in the packed package");

    const help = gefIn(sandbox, ["--help"]);
    assert.equal(help.code, 0, `packed --help must exit 0: ${help.stderr}`);
    assert.ok(help.stdout.includes("Usage: gef"));

    const version = gefIn(sandbox, ["--version"]);
    assert.equal(version.code, 0);
    assert.equal(version.stdout.split("\n")[0], `gef ${cliPackage.version}`);

    // The packed executable must resolve without a shell pipeline: run it directly as a process.
    const direct = run(process.execPath, [installedBin, "--version"], { encoding: "utf8", timeout: 60_000 });
    assert.equal(direct.status, 0);

    // Engine-backed commands work when the workspace runtime and engines are installed.
    const target = mkdtempSync(join(tmpdir(), "gef-dist-target-"));
    try {
      const plan = gefIn(sandbox, ["init", "--target", target, "--json"]);
      assert.equal(plan.code, 0, `packed init must exit 0: ${plan.stderr}`);
      assert.equal(JSON.parse(plan.stdout).value.plan.install.state, "READY");
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test("DIST-SMOKE-01b: the packed manifest carries the gef bin mapping and only intended payload", () => {
  const { sandbox, cliDir } = buildSandbox({ engines: false });
  try {
    const packed = JSON.parse(readFileSync(join(cliDir, "package.json"), "utf8"));
    assert.equal(packed.name, "@gef-bootstrap/cli");
    assert.equal(packed.version, cliPackage.version);
    assert.deepEqual(packed.bin, { gef: "./bin/gef.mjs" });
    assert.equal(packed.private, true, "the packaged manifest must stay private");

    assert.ok(existsSync(join(cliDir, "dist", "main.js")), "built runtime must be packaged");
    assert.ok(existsSync(join(cliDir, "bin", "gef.mjs")), "bin shim must be packaged");
    assert.ok(existsSync(join(cliDir, "README.md")), "docs payload must be packaged");

    // No build inputs, engines or dependency trees may leak into the tarball.
    for (const forbidden of ["src", "node_modules", "tsconfig.json", "tsconfig.tsbuildinfo"]) {
      assert.ok(!existsSync(join(cliDir, forbidden)), `${forbidden} must not be packaged`);
    }
    void sandbox;
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------ DIST-SMOKE-02

test("DIST-SMOKE-02a: a missing built entry fails closed without a stack trace", () => {
  const { sandbox, cliDir } = buildSandbox({ engines: true });
  try {
    rmSync(join(cliDir, "dist"), { recursive: true, force: true });
    const broken = gefIn(sandbox, ["--version"]);
    assert.equal(broken.code, 40, "a broken install must exit through the capability path");
    assert.match(broken.stderr, /CLI entry is unavailable/);
    assert.ok(!broken.stderr.includes("    at "), "a broken install must not emit an unhandled stack trace");
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test("DIST-SMOKE-02b: missing engines fail closed for engine commands but not for help/version", () => {
  const { sandbox } = buildSandbox({ engines: false });
  try {
    assert.equal(gefIn(sandbox, ["--help"]).code, 0, "help must not require any engine");
    assert.equal(gefIn(sandbox, ["--version"]).code, 0, "version must not require any engine");

    const target = mkdtempSync(join(tmpdir(), "gef-dist-target-"));
    try {
      const result = gefIn(sandbox, ["init", "--target", target, "--json"]);
      assert.equal(result.code, 40, "an unavailable engine must exit through the capability path");
      const envelope = JSON.parse(result.stdout);
      assert.equal(envelope.ok, false);
      assert.equal(envelope.error.category, "CAPABILITY");
      assert.equal(envelope.terminal, "BLOCKED");
      assert.equal(envelope.error.remediations[0].actionId, "gef.cli.verify_installation");
      assert.ok(!existsSync(join(target, ".gef")), "a failed command must not mutate the target");
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------ DIST-SMOKE-03

test("DIST-SMOKE-03: uninstall removes only installed files and never project data", () => {
  const { sandbox, cliDir } = buildSandbox({ engines: true });
  const project = mkdtempSync(join(tmpdir(), "gef-dist-project-"));
  try {
    writeFileSync(join(project, "USER-DATA.txt"), "irreplaceable user content\n");
    mkdirSync(join(project, "src"), { recursive: true });
    writeFileSync(join(project, "src", "app.js"), "// user source\n");

    const applied = gefIn(sandbox, ["init", "--apply", "--target", project, "--json"]);
    assert.equal(applied.code, 0, `apply must succeed: ${applied.stderr}`);
    assert.ok(existsSync(join(project, ".gef", "init-state.json")));

    // Uninstall the CLI package from the sandbox.
    rmSync(cliDir, { recursive: true, force: true });
    assert.ok(!existsSync(cliDir), "the package directory is removed");
    assert.ok(!existsSync(join(sandbox, "node_modules", "@gef-bootstrap", "cli")));

    // Project data — including the governed artifact written by the CLI — must survive intact.
    assert.equal(readFileSync(join(project, "USER-DATA.txt"), "utf8"), "irreplaceable user content\n");
    assert.equal(readFileSync(join(project, "src", "app.js"), "utf8"), "// user source\n");
    assert.ok(existsSync(join(project, ".gef", "init-state.json")), "governed project state is project data, not package data");

    // The runtime dependencies installed alongside were not collateral damage.
    assert.ok(existsSync(join(sandbox, "node_modules", "@gef-bootstrap", "kernel")));
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
    rmSync(project, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------ DIST-SMOKE-04

test("DIST-SMOKE-04: no publication is performed or claimed", () => {
  const { sandbox, cliDir } = buildSandbox({ engines: false });
  try {
    // Mechanical guards that make an accidental publication impossible.
    assert.equal(cliPackage.private, true, "the CLI package must stay private");
    assert.equal(cliPackage.publishConfig, undefined, "no publishConfig may be declared");
    assert.ok(!existsSync(join(CLI_PACKAGE_DIR, ".npmrc")), "no registry credentials may ship with the package");
    const packedManifest = JSON.parse(readFileSync(join(cliDir, "package.json"), "utf8"));
    assert.equal(packedManifest.private, true);

    // The workspace root is private as well.
    const rootManifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    assert.equal(rootManifest.private, true);

    // Documentation must not claim an available publication.
    const cliReadme = readFileSync(join(CLI_PACKAGE_DIR, "README.md"), "utf8");
    assert.match(cliReadme, /No publication to npm, GitHub Releases or any registry is performed or claimed/);

    // The shipped runtime must contain no registry-write capability at all.
    for (const file of readdirSync(join(cliDir, "dist")).filter((name) => name.endsWith(".js"))) {
      const body = readFileSync(join(cliDir, "dist", file), "utf8");
      for (const forbidden of ["node:http", "node:https", "registry.npmjs.org", "NPM_TOKEN", "npm_config_registry"]) {
        assert.ok(!body.includes(forbidden), `${file} must not reference ${forbidden}`);
      }
    }

    // The only npm command this suite issues is `pack`; no registry verb is available to it.
    const self = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const npmInvocations = [...self.matchAll(/run\(\s*"npm",\s*\[\s*"([a-z-]+)"/g)].map((match) => match[1]);
    assert.ok(npmInvocations.length > 0, "the suite must invoke npm pack at least once");
    for (const verb of npmInvocations) assert.equal(verb, "pack", `unexpected npm verb: ${verb}`);

    void sandbox;
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
