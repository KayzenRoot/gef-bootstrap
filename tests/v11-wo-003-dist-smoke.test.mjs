// GBS-V11-WO-003 — packed-install parity for `gef doctor` and `gef status`.
//
// The package is built with the repository's staging script and installed with a real
// `npm install` into a fresh directory. Nothing from the source tree is copied in: doctor/status
// must work from the packaged artifact alone, with the same semantics as the source workspace.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { DEFAULT_GIT_TRUST_POLICY, createCliToolObservationPort, resolveGitToolWith } from "../packages/cli/dist/index.js";



const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI_PACKAGE_DIR = resolve(ROOT, "packages/cli");
const cliPackage = JSON.parse(readFileSync(join(CLI_PACKAGE_DIR, "package.json"), "utf8"));

const TIMEOUT_MS = 300_000;

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", timeout: TIMEOUT_MS, ...options });
}

/** npm ships as a `.cmd` shim on Windows, which needs a shell; elsewhere argv is passed directly. */
function npmRun(args, options) {
  if (process.platform === "win32") {
    const command = ["npm", ...args].map((part) => (part.includes(" ") ? `"${part}"` : part)).join(" ");
    return spawnSync(command, { encoding: "utf8", timeout: TIMEOUT_MS, shell: true, ...options });
  }
  return spawnSync("npm", args, { encoding: "utf8", timeout: TIMEOUT_MS, ...options });
}

function packCli(destination) {
  mkdirSync(destination, { recursive: true });
  const packaged = run(process.execPath, [join(CLI_PACKAGE_DIR, "scripts", "prepare-package.mjs"), "--pack", "--destination", destination], { cwd: ROOT });
  assert.equal(packaged.status, 0, `packaging must succeed: ${packaged.stderr}`);
  const tarballPath = packaged.stdout.trim().split("\n").pop().trim();
  assert.ok(existsSync(tarballPath), `tarball must exist at ${tarballPath}`);
  return tarballPath;
}

function freshInstall(t, tag) {
  const sandbox = mkdtempSync(join(tmpdir(), `gef-wo003-${tag}-`));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));
  const tarball = packCli(join(sandbox, "__tarball__"));
  assert.equal(npmRun(["init", "-y"], { cwd: sandbox }).status, 0);
  const installed = npmRun(["install", "--no-audit", "--no-fund", tarball], { cwd: sandbox });
  assert.equal(installed.status, 0, `npm install must succeed: ${installed.stderr}`);
  const cliDir = join(sandbox, "node_modules", "@gef-bootstrap", "cli");
  return { sandbox, cliDir, bin: join(cliDir, "bin", "gef.mjs") };
}

/**
 * The decision the source workspace makes for the system Git on the current token.
 *
 * An assurance token that can itself replace the machine executable is refused by the
 * high-assurance policy, so the installed package must be compared against this decision instead of
 * against an assumption that Git is admitted on every machine.
 */
function sourceGitDecision() {
  const resolved = resolveGitToolWith(createCliToolObservationPort(DEFAULT_GIT_TRUST_POLICY));
  return resolved === null ? "UNAVAILABLE" : "FOUND";
}

function gefAt(bin, args, env) {
  const result = run(process.execPath, [bin, ...args], { encoding: "utf8", timeout: 60_000, ...(env === undefined ? {} : { env }) });
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function tempProject(t) {
  const project = mkdtempSync(join(tmpdir(), "gef-wo003-project-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));
  return project;
}

// ------------------------------------------------------------- packaged parity

// ------------------------------------------- workspace manifest / lock consistency

/**
 * The canonical lockfile must agree with every workspace manifest.
 *
 * A runtime dependency added to a workspace manifest without reconciling the root lockfile is a
 * supply-chain metadata defect that `npm ci` can hide, so the drift is detected directly here.
 */
test("every workspace manifest agrees with the root lockfile", () => {
  const lockfile = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));
  const workspaceDirectories = readdirSync(join(ROOT, "packages"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.ok(workspaceDirectories.length > 0, "the workspace must contain packages");

  for (const directory of workspaceDirectories) {
    const manifestPath = join(ROOT, "packages", directory, "package.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const lockEntry = lockfile.packages[`packages/${directory}`];
    assert.ok(lockEntry, `packages/${directory} must appear in the lockfile`);
    assert.deepEqual(lockEntry.dependencies ?? {}, manifest.dependencies ?? {}, `packages/${directory} dependencies drifted between manifest and lockfile`);
    assert.deepEqual(lockEntry.optionalDependencies ?? {}, manifest.optionalDependencies ?? {}, `packages/${directory} optional dependencies drifted between manifest and lockfile`);
    const bundled = manifest.bundleDependencies ?? manifest.bundledDependencies ?? [];
    const lockedBundled = lockEntry.bundleDependencies ?? lockEntry.bundledDependencies ?? [];
    assert.deepEqual(lockedBundled, bundled, `packages/${directory} bundled dependencies drifted between manifest and lockfile`);
    assert.equal(lockEntry.version, manifest.version, `packages/${directory} version drifted`);
  }
});

test("the CLI lockfile entry records the toolchain runtime dependency", () => {
  const lockfile = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(CLI_PACKAGE_DIR, "package.json"), "utf8"));
  const lockEntry = lockfile.packages["packages/cli"];
  assert.equal(lockEntry.dependencies["@gef-bootstrap/preflight"], "0.0.0");
  assert.equal(manifest.dependencies["@gef-bootstrap/preflight"], "0.0.0");
  assert.equal((lockEntry.bundleDependencies ?? []).includes("@gef-bootstrap/preflight"), true);
  assert.deepEqual(Object.keys(lockEntry.dependencies).sort(), Object.keys(manifest.dependencies).sort(), "no unrelated dependency drift for this package");
});


test("the packed payload vendors every engine doctor and status depend on", (t) => {
  const { cliDir } = freshInstall(t, "payload");
  // The three engine modules WO-003 introduced must be part of the packaged artifact.
  for (const engine of ["m41-m47-platform", "m55-m61-quality", "m62-m63-final", "m48-m54-maintenance", "area-h-governance", "security-reliability-integrations"]) {
    assert.ok(existsSync(join(cliDir, "vendor", "engines", engine)), `${engine} must be vendored`);
  }
  const manifest = JSON.parse(readFileSync(join(cliDir, "vendor", "MANIFEST.json"), "utf8"));
  assert.equal(manifest.artifacts.filter((entry) => entry.kind === "engine").length, 6);
  for (const artefact of manifest.artifacts.filter((entry) => entry.kind === "engine")) {
    assert.match(artefact.sha256, /^[0-9a-f]{64}$/, `${artefact.name} must carry a recorded digest`);
  }
  const telemetryPath = "vendor/engines/m62-m63-final/src/v11-performance-telemetry.mjs";
  assert.ok(existsSync(join(cliDir, telemetryPath)), "the M62 supporting telemetry module must be vendored");
  const telemetryManifestEntry = manifest.artifacts.find((entry) => entry.kind === "engine-support" && entry.target === telemetryPath);
  assert.ok(telemetryManifestEntry, "the M62 supporting telemetry module must be recorded in the vendor manifest");
  assert.match(telemetryManifestEntry.sha256, /^[0-9a-f]{64}$/, "the telemetry module must carry a recorded digest");
  // No source-tree injection: build inputs and sources are not part of the payload.
  for (const forbidden of ["src", "tsconfig.json", "scripts"]) assert.ok(!existsSync(join(cliDir, forbidden)), `${forbidden} must not be packaged`);
  assert.equal(cliPackage.private, true, "the package stays private");
});

test("the installed package exposes doctor and status with source-workspace semantics", (t) => {

  const { bin } = freshInstall(t, "parity");
  const project = tempProject(t);

  const doctor = gefAt(bin, ["doctor", "--target", project, "--json"]);
  assert.equal(doctor.code, 0, `installed doctor must exit 0: ${doctor.stderr}`);
  const doctorEnvelope = JSON.parse(doctor.stdout);
  assert.equal(doctorEnvelope.commandId, "gef.doctor.run");
  assert.equal(doctorEnvelope.value.doctor.readOnly, true);
  assert.ok(Array.isArray(doctorEnvelope.value.doctor.findings));
  const gitFinding = doctorEnvelope.value.doctor.findings.find((finding) => finding.id === "toolchain.git");
  const decision = sourceGitDecision();
  assert.equal(
    gitFinding.state,
    decision === "FOUND" ? "HEALTHY" : "FINDING",
    `the installed CLI must reach the same toolchain decision as the source workspace (${decision})`,
  );
  assert.equal(doctorEnvelope.value.doctor.security.github.state, "REVIEW", "provider evidence is absent and reported as REVIEW");

  const status = gefAt(bin, ["status", "--target", project, "--json"]);
  assert.equal(status.code, 0, `installed status must exit 0: ${status.stderr}`);
  const statusEnvelope = JSON.parse(status.stdout);
  assert.equal(statusEnvelope.commandId, "gef.status.show");
  assert.equal(statusEnvelope.value.status.readOnly, true);
  assert.ok("production" in statusEnvelope.value.status.release && "development" in statusEnvelope.value.status.release);

  // The packaged binary resolves its own manifest for the version provenance.
  const version = gefAt(bin, ["--version"]);
  assert.equal(version.code, 0);
  assert.equal(JSON.parse(version.stdout).version, cliPackage.version);
});

test("the installed package keeps the read-only contract and the usage path", (t) => {
  const { bin } = freshInstall(t, "contract");
  const project = tempProject(t);
  const before = readdirSync(project);

  assert.equal(gefAt(bin, ["doctor", "--apply", "--target", project]).code, 10, "a mutation flag must be refused");
  assert.equal(gefAt(bin, ["status", "--apply", "--target", project]).code, 10);
  assert.equal(gefAt(bin, ["doctor", "--nope"]).code, 10);
  assert.deepEqual(readdirSync(project), before, "the installed CLI must not touch the project");

  const help = gefAt(bin, ["--help"]);
  assert.equal(help.code, 0);
  assert.deepEqual(JSON.parse(help.stdout).commands.map((command) => command.id), [
    "gef.adopt.apply",
    "gef.adopt.preview",
    "gef.doctor.run",
    "gef.init.plan",
    "gef.init.run",
    "gef.status.show",
    "gef.upgrade.apply",
    "gef.upgrade.preview",
  ]);
});

test("the installed package still keeps WO-002 behaviour intact", (t) => {
  const { bin } = freshInstall(t, "regression");
  const project = tempProject(t);

  // init/adopt remain available and still require an explicit --apply for mutation.
  const plan = gefAt(bin, ["init", "--target", project, "--json"]);
  assert.equal(plan.code, 0, `installed init plan must exit 0: ${plan.stderr}`);
  assert.equal(JSON.parse(plan.stdout).value.effect, "NONE");
  assert.ok(!existsSync(join(project, ".gef")), "a plan must not mutate");

  const applied = gefAt(bin, ["init", "--apply", "--target", project, "--json"]);
  assert.equal(applied.code, 0, `installed init --apply must exit 0: ${applied.stderr}`);
  assert.equal(JSON.parse(applied.stdout).value.transaction.outcome, "APPLIED");
  assert.ok(existsSync(join(project, ".gef", "init-state.json")));

  // Doctor and status observe that applied state without mutating it.
  const appliedDigest = readFileSync(join(project, ".gef", "init-state.json"), "utf8");
  const status = gefAt(bin, ["status", "--target", project, "--json"]);
  assert.equal(status.code, 0);
  assert.equal(readFileSync(join(project, ".gef", "init-state.json"), "utf8"), appliedDigest, "status must not change the governed artifact");
});

test("the installed package carries the contained-read hardening", (t) => {
  const { bin } = freshInstall(t, "hardening");
  const SENTINEL = "GEF-PACKED-EXTERNAL-SENTINEL";
  const project = tempProject(t);
  const external = mkdtempSync(join(tmpdir(), "gef-wo003-packed-ext-"));
  t.after(() => rmSync(external, { recursive: true, force: true }));
  mkdirSync(join(external, ".engineering"), { recursive: true });
  writeFileSync(join(external, ".engineering", "CHECKPOINT.json"), JSON.stringify({ schemaVersion: 2, status: SENTINEL, overallCompletionPercent: 100 }));

  // Junctions are unprivileged on Windows; directory symlinks are used elsewhere.
  if (process.platform === "win32") symlinkSync(join(external, ".engineering"), join(project, ".engineering"), "junction");
  else symlinkSync(join(external, ".engineering"), join(project, ".engineering"), "dir");

  for (const verb of ["doctor", "status"]) {
    const result = gefAt(bin, [verb, "--target", project, "--json"]);
    assert.equal(result.code, 0, `installed ${verb} must exit 0: ${result.stderr}`);
    assert.equal(result.stdout.includes(SENTINEL), false, `installed ${verb} must not expose aliased content`);
    const value = JSON.parse(result.stdout).value[verb];
    assert.ok(value.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_ALIAS_REFUSED")), `installed ${verb} must record the alias refusal`);
  }
});

test("the installed package refuses aliased and oversized Git metadata", (t) => {
  const { bin } = freshInstall(t, "git-metadata");
  const SENTINEL = "GEF-PACKED-GIT-SENTINEL";

  // Aliased Git directory.
  const aliased = tempProject(t);
  const external = mkdtempSync(join(tmpdir(), "gef-wo003-packed-git-ext-"));
  t.after(() => rmSync(external, { recursive: true, force: true }));
  mkdirSync(join(external, "refs", "heads"), { recursive: true });
  writeFileSync(join(external, "HEAD"), "ref: refs/heads/leaked\n");
  writeFileSync(join(external, "refs", "heads", "leaked"), SENTINEL);
  if (process.platform === "win32") symlinkSync(external, join(aliased, ".git"), "junction");
  else symlinkSync(external, join(aliased, ".git"), "dir");

  const aliasStatus = gefAt(bin, ["status", "--target", aliased, "--json"]);
  assert.equal(aliasStatus.code, 0);
  assert.equal(aliasStatus.stdout.includes(SENTINEL), false, "the installed CLI must not expose aliased Git content");
  assert.ok(JSON.parse(aliasStatus.stdout).value.status.repository.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_ALIAS_REFUSED:.git")));

  // Oversized Git metadata.
  const oversized = tempProject(t);
  mkdirSync(join(oversized, ".git"), { recursive: true });
  writeFileSync(join(oversized, ".git", "HEAD"), SENTINEL.repeat(300));
  const bigStatus = gefAt(bin, ["status", "--target", oversized, "--json"]);
  assert.equal(bigStatus.code, 0);
  assert.equal(bigStatus.stdout.includes(SENTINEL), false, "the installed CLI must not echo oversized metadata");
  assert.ok(JSON.parse(bigStatus.stdout).value.status.repository.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_FILE_OVER_BUDGET:.git/HEAD")));
});

test("the installed package probes dirtiness without index or fsmonitor side effects", (t) => {

  const { bin } = freshInstall(t, "git-side-effects");
  const project = tempProject(t);
  const git = (args) => spawnSync("git", ["-C", project, ...args], { encoding: "utf8", timeout: 60_000 });
  git(["init", "-q"]);
  git(["config", "user.email", "executor@example.invalid"]);
  git(["config", "user.name", "GEF Executor"]);
  // Git's own automatic maintenance must not become a second writer in the tree under test.
  git(["config", "gc.auto", "0"]);
  git(["config", "maintenance.auto", "false"]);
  writeFileSync(join(project, "tracked.txt"), "tracked content\n");
  git(["add", "."]);
  git(["commit", "-qm", "seed"]);

  // A repository-configured fsmonitor hook that would record its own execution.
  const marker = join(project, ".git", "hook-ran.txt");
  const hook = join(project, ".git", "fsmonitor-hook.sh");
  writeFileSync(hook, ["#!/bin/sh", 'dir=$(dirname "$0")', 'printf run > "$dir/hook-ran.txt"', 'echo ""', ""].join("\n"));
  git(["config", "core.fsmonitor", hook.split("\\").join("/")]);

  // Invalidate the index stat cache so a refresh would rewrite it.
  const stale = new Date(Date.now() - 86_400_000);
  utimesSync(join(project, "tracked.txt"), stale, stale);
  const index = join(project, ".git", "index");
  const indexBefore = readFileSync(index);

  for (const verb of ["doctor", "status"]) {
    const result = gefAt(bin, [verb, "--target", project, "--json"]);
    assert.equal(result.code, 0, `installed ${verb} must exit 0: ${result.stderr}`);
    assert.equal(readFileSync(index).equals(indexBefore), true, `installed ${verb} must not rewrite .git/index`);
    assert.equal(existsSync(marker), false, `installed ${verb} must not execute the repository's fsmonitor hook`);
    assert.equal(result.stdout.includes(hook.split("\\").join("/")), false, `installed ${verb} must not echo the hook path`);
  }

  const status = JSON.parse(gefAt(bin, ["status", "--target", project, "--json"]).stdout).value.status;
  // The no-mutation properties above hold on any token; the observation itself follows the toolchain
  // decision this token reaches.
  assert.equal(
    status.repository.dirtiness,
    sourceGitDecision() === "FOUND" ? "OBSERVED" : "UNKNOWN",
    "dirtiness follows the same toolchain decision as the source workspace",
  );
});

test("the installed package resolves Git through the approved policy, not PATH", (t) => {

  const { bin } = freshInstall(t, "trusted-git");
  const project = tempProject(t);
  const fakeDir = mkdtempSync(join(tmpdir(), "gef-packed-fake-git-"));
  t.after(() => rmSync(fakeDir, { recursive: true, force: true }));
  const sentinel = join(fakeDir, "sentinel");
  const fake = join(fakeDir, process.platform === "win32" ? "git.cmd" : "git");
  writeFileSync(fake, process.platform === "win32" ? `@echo off\r\necho run > "${sentinel}"\r\nexit /b 0\r\n` : `#!/bin/sh\nprintf run > "${sentinel}"\nexit 0\n`);
  try { chmodSync(fake, 0o755); } catch { /* Windows ignores the mode */ }

  const env = { ...process.env, PATH: `${fakeDir}${delimiter}${process.env.PATH ?? ""}` };
  for (const verb of ["doctor", "status"]) {
    const result = gefAt(bin, [verb, "--target", project, "--json"], env);
    assert.equal(result.code, 0, `installed ${verb} must exit 0: ${result.stderr}`);
    assert.equal(existsSync(sentinel), false, `installed ${verb} must not execute a PATH-supplied fake git`);
  }

  const doctor = JSON.parse(gefAt(bin, ["doctor", "--target", project, "--json"], env).stdout).value.doctor;
  assert.equal(doctor.toolchain.git.presence, sourceGitDecision(), "the installed CLI reaches the source workspace decision");
  if (doctor.toolchain.git.presence === "FOUND") assert.match(doctor.toolchain.git.executableIdentity, /^[0-9a-f]{64}$/);
});

test("the installed package fails closed when the vendored engines are missing", (t) => {
  const { cliDir, bin } = freshInstall(t, "broken-engines");
  rmSync(join(cliDir, "vendor"), { recursive: true, force: true });
  const project = tempProject(t);
  const before = readdirSync(project);

  for (const args of [["doctor", "--target", project, "--json"], ["status", "--target", project, "--json"]]) {
    const result = gefAt(bin, args);
    assert.equal(result.code, 40, `${args.join(" ")} must fail closed without engines`);
    const envelope = JSON.parse(result.stdout);
    assert.equal(envelope.ok, false, "a capability failure must not claim success");
    assert.equal(envelope.error.category, "CAPABILITY");
    assert.equal(envelope.value, undefined, "no partial value may be emitted");
  }

  // A degraded install must never degrade into a healthy verdict, and must not mutate anything.
  assert.deepEqual(readdirSync(project), before, "a failed diagnostic must not touch the project");
  assert.ok(!existsSync(join(project, ".gef")));
});

// ------------------------------------------- native rights oracle in the payload

test("the installed package carries the Windows rights oracle and its prebuilt binary", (t) => {
  const { cliDir, bin } = freshInstall(t, "native-runtime");
  const hostPlatformPackage = `koffi-${process.platform}-${process.arch}`;

  // Koffi resolves its native binary as a sibling of its own package directory, so both must ship.
  assert.ok(existsSync(join(cliDir, "node_modules", "koffi")), "the FFI runtime must be packaged");
  assert.ok(existsSync(join(cliDir, "node_modules", "@koromix", hostPlatformPackage)), `the host prebuilt must be packaged: ${hostPlatformPackage}`);

  const manifest = JSON.parse(readFileSync(join(cliDir, "vendor", "MANIFEST.json"), "utf8"));
  const natives = manifest.artifacts.filter((entry) => entry.kind === "native-runtime");
  assert.equal(natives.length, 2, "the manifest records the runtime and the host platform binary");
  assert.deepEqual(natives.map((entry) => entry.name).sort(), ["@koromix/" + hostPlatformPackage, "koffi"].sort());
  for (const entry of natives) assert.match(entry.version, /^\d+\.\d+\.\d+$/, `${entry.name} must carry its exact version`);

  // The declared dependency is an exact pin, not a range.
  const packedManifest = JSON.parse(readFileSync(join(cliDir, "package.json"), "utf8"));
  assert.match(packedManifest.dependencies.koffi, /^\d+\.\d+\.\d+$/, "koffi must be pinned exactly");
  assert.equal(packedManifest.optionalDependencies["@koromix/koffi-win32-x64"], "3.3.0", "the Windows prebuilt is declared exactly as an optional platform binary");

  // The installed CLI uses its own payload: on Windows that means loading the packaged adapter.
  const project = tempProject(t);
  const doctor = JSON.parse(gefAt(bin, ["doctor", "--target", project, "--json"]).stdout).value.doctor;
  assert.equal(doctor.toolchain.git.presence, sourceGitDecision(), "the installed CLI reaches the source workspace decision on this token");
  if (process.platform === "win32") {
    if (doctor.toolchain.git.presence === "FOUND") {
      // The packaged adapter loaded and proved the replacement rights for this token.
      assert.deepEqual([...doctor.toolchain.git.gaps], [], "the packaged oracle proved the chain on Windows");
      t.diagnostic("win32: the installed package loaded the packaged FFI adapter and proved the replacement rights");
    } else {
      // An assurance token that can itself replace the machine executable is refused by the policy;
      // the reason must be the unprovable right, never a missing adapter.
      assert.equal(doctor.toolchain.git.presence, "UNAVAILABLE");
      assert.equal(doctor.toolchain.git.gaps.some((gap) => gap.startsWith("gef.cli.git.")), true, "the packaged CLI states the trust reason");
      t.diagnostic("win32: this token holds the replacement rights, so the policy withholds the executable");
    }
  } else {
    // POSIX never loads the adapter; the effective-write chain is the proof there.
    assert.equal(existsSync(join(cliDir, "node_modules", "@koromix", "koffi-win32-x64")), false, "a POSIX build stages no Windows binary");
  }
});
