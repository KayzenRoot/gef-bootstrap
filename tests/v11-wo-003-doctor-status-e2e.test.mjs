// GBS-V11-WO-003 — process E2E for `gef doctor` and `gef status`.
//
// Every case spawns the real executable shim, so the parser, the kernel runtime, the diagnostic
// compositions, the renderer and the exit projection are all exercised through the process
// boundary. stdio is piped, so these runs are non-TTY by construction.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { delimiter, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_GIT_TRUST_POLICY,
  GIT_APPROVED_EXECUTABLES,
  GIT_EXECUTABLE_POLICY_REF,
  createCliToolObservationPort,
  gitProbeEnvironment,
  gitTool,
  gitToolDescriptor,
  resolveGitToolWith,
} from "../packages/cli/dist/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GEF_BIN = resolve(ROOT, "packages/cli/bin/gef.mjs");
const PROCESS_TIMEOUT_MS = 90_000;

function gef(args, options = {}) {
  const result = spawnSync(process.execPath, [GEF_BIN, ...args], { encoding: "utf8", timeout: PROCESS_TIMEOUT_MS, ...options });
  assert.equal(result.error, undefined, `process must not fail or time out: ${result.error?.message ?? ""}`);
  assert.equal(result.signal, null, "process must not be killed");
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** An environment whose PATH cannot resolve `git`, for the WO-002 F2 closure. */
function withoutGit(t) {
  const empty = mkdtempSync(join(tmpdir(), "gef-nogit-"));
  t.after(() => rmSync(empty, { recursive: true, force: true }));
  return { ...process.env, PATH: empty, Path: empty };
}

function tempProject(t, prefix = "gef-wo003-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

const digestOf = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** Run Git in `root` with an explicit argv array; returns the raw spawn result. */
function gitIn(root, args, options = {}) {
  return spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 60_000, ...options });
}

/**
 * A repository whose index stat cache is stale, so `git status` has something to refresh.
 *
 * The tracked files keep their content but get an mtime a day in the past, which is exactly the
 * condition under which Git rewrites the index during a status refresh.
 */
function refreshableRepo(t, prefix) {
  const root = tempProject(t, prefix);
  gitIn(root, ["init", "-q"]);
  gitIn(root, ["config", "user.email", "executor@example.invalid"]);
  gitIn(root, ["config", "user.name", "GEF Executor"]);
  gitIn(root, ["config", "gc.auto", "0"]);
  gitIn(root, ["config", "maintenance.auto", "false"]);
  writeFileSync(join(root, "tracked.txt"), "tracked content\n");
  writeFileSync(join(root, "second.txt"), "second content\n");
  gitIn(root, ["add", "."]);
  gitIn(root, ["commit", "-qm", "seed"]);
  const stale = new Date(Date.now() - 86_400_000);
  utimesSync(join(root, "tracked.txt"), stale, stale);
  utimesSync(join(root, "second.txt"), stale, stale);
  return { root, index: join(root, ".git", "index") };
}

/**
 * A side-effect-free `git status`.
 *
 * Used by the comparison helpers: a helper that perturbed the very state it measures (by
 * refreshing the index or running a repository fsmonitor hook) would invalidate its own
 * measurement before the probe under test is even reached.
 */
function safeGitStatus(root) {
  const result = spawnSync("git", ["-c", "core.fsmonitor=false", "--no-optional-locks", "-C", root, "status", "--porcelain"], {
    encoding: "utf8",
    timeout: 60_000,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
  });
  return result.stdout ?? "";
}

/** The Git metadata that a read-only probe must never rewrite, including the index bytes. */
function gitState(root) {
  const read = (args) => gitIn(root, args).stdout ?? "";
  return {
    index: digestOf(join(root, ".git", "index")),
    status: safeGitStatus(root),
    branch: read(["rev-parse", "--abbrev-ref", "HEAD"]),
    head: read(["rev-parse", "HEAD"]),
    refs: read(["for-each-ref"]),
    tags: read(["tag", "--list"]),
    config: read(["config", "--local", "--list"]),
  };
}

function snapshot(root) {
  const entries = [];
  const walk = (current) => {
    const stats = statSync(current);
    const rel = relative(root, current).split(sep).join("/");
    if (rel.length > 0) {
      if (stats.isSymbolicLink()) entries.push(`${rel}:LINK`);
      else if (stats.isDirectory()) entries.push(`${rel}:DIR`);
      else entries.push(`${rel}:FILE:${createHash("sha256").update(readFileSync(current)).digest("hex")}`);
    }
    if (stats.isDirectory() && !stats.isSymbolicLink()) for (const child of readdirSync(current).sort()) walk(join(current, child));
  };
  walk(root);
  return entries.sort();
}

function initRepo(root) {
  const run = (args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 30_000 });
  run(["init", "-q"]);
  run(["config", "user.email", "executor@example.invalid"]);
  run(["config", "user.name", "GEF Executor"]);
  run(["config", "gc.auto", "0"]);
  run(["config", "maintenance.auto", "false"]);
  writeFileSync(join(root, "seed.txt"), "seed\n");
  run(["add", "."]);
  run(["commit", "-qm", "seed"]);
}

// ------------------------------------------------------------------- success

test("doctor and status succeed through the real process with a JSON envelope", (t) => {
  const project = tempProject(t);
  for (const [verb, commandId, key] of [
    ["doctor", "gef.doctor.run", "doctor"],
    ["status", "gef.status.show", "status"],
  ]) {
    const result = gef([verb, "--target", project, "--json"]);
    assert.equal(result.code, 0, `${verb} must exit 0: ${result.stderr}`);
    const envelope = JSON.parse(result.stdout);
    assert.deepEqual(Object.keys(envelope), ["schemaVersion", "ok", "commandId", "contractVersion", "terminal", "value"]);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.commandId, commandId);
    assert.equal(envelope.value.effect, "NONE");
    assert.equal(envelope.value[key].readOnly, true);
  }
});

test("non-TTY stdout emits the machine envelope without --json and never blocks", (t) => {
  const project = tempProject(t);
  const result = spawnSync(process.execPath, [GEF_BIN, "status", "--target", project], { encoding: "utf8", timeout: 30_000, stdio: ["pipe", "pipe", "pipe"] });
  assert.equal(result.error, undefined, "a non-TTY run must complete without timing out");
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.commandId, "gef.status.show");
});

test("help and verb help cover both diagnostic commands deterministically", () => {
  const global = gef(["--help"]);
  assert.equal(global.code, 0);
  const ids = JSON.parse(global.stdout).commands.map((command) => command.id);
  assert.deepEqual(ids, ["gef.adopt.apply", "gef.adopt.preview", "gef.doctor.run", "gef.init.plan", "gef.init.run", "gef.status.show"]);
  assert.equal(global.stdout, gef(["--help"]).stdout, "help must be byte-identical across runs");
  for (const verb of ["doctor", "status"]) assert.equal(gef([verb, "--help"]).code, 0);
});

// -------------------------------------------------------------------- usage

test("malformed input stays on exit 10 and mutates nothing", (t) => {
  const project = tempProject(t);
  writeFileSync(join(project, "USER.txt"), "user content\n");
  const before = snapshot(project);

  assert.equal(gef(["doctor", "--nope", "--target", project]).code, 10);
  assert.equal(gef(["status", "--target"]).code, 10);
  assert.equal(gef(["doctor", "--apply", "--target", project]).code, 10, "a mutation flag must be refused for a read-only command");
  assert.equal(gef(["status", "--apply", "--target", project]).code, 10);
  assert.equal(gef(["upgrade", "--target", project]).code, 10, "upgrade remains WO-004");

  assert.deepEqual(snapshot(project), before, "usage failures must leave the project untouched");
  assert.ok(!existsSync(join(project, ".gef")));
  assert.ok(!existsSync(join(project, ".gef-private")));
});

// ------------------------------------------------------------- no mutation

test("neither command mutates the project tree, .gef state or Git state", (t) => {
  const project = tempProject(t);
  mkdirSync(join(project, "src"), { recursive: true });
  writeFileSync(join(project, "src", "app.js"), "// user source\n");
  writeFileSync(join(project, "README.md"), "user readme\n");
  initRepo(project);

  const treeBefore = snapshot(project);
  const gitBefore = gitState(project);

  for (const verb of ["doctor", "status"]) {
    assert.equal(gef([verb, "--target", project]).code, 0);
    assert.deepEqual(snapshot(project), treeBefore, `${verb} must not change the project tree`);
    assert.deepEqual(gitState(project), gitBefore, `${verb} must not change Git state`);
    assert.ok(!existsSync(join(project, ".gef")), `${verb} must not create .gef state`);
    assert.ok(!existsSync(join(project, ".gef-private")), `${verb} must not create transaction substrate`);
  }

  // Nor may they touch the repository's own working tree.
  const repoBefore = gitState(ROOT);
  for (const verb of ["doctor", "status"]) assert.equal(gef([verb]).code, 0);
  assert.deepEqual(gitState(ROOT), repoBefore, "the commands must not change the repository they run in");
});

// ------------------------------------ Git tool resolution (H10) and ambient PATH

test("Git presence no longer depends on ambient PATH at all", (t) => {
  const project = tempProject(t);
  const result = gef(["doctor", "--target", project, "--json"], { env: withoutGit(t) });
  assert.equal(result.code, 0, "doctor reports findings in its payload, it does not fail the process");

  const doctor = JSON.parse(result.stdout).value.doctor;
  // The approved resolution does not consult PATH, so emptying it cannot make the admitted Git
  // disappear: the evidence is the same toolchain identity either way.
  assert.equal(doctor.toolchain.git.presence, "FOUND", "the approved executable is resolved without PATH");
  assert.equal(doctor.toolchain.git.probeStatus, "SUCCEEDED");
  assert.match(doctor.toolchain.git.executableIdentity, /^[0-9a-f]{64}$/);
  assert.equal(doctor.findings.find((finding) => finding.id === "toolchain.git").state, "HEALTHY");
  assert.deepEqual([...doctor.toolchain.git.gaps], [], "a resolved, probed tool carries no gap");
});

test("the approved Git is used even with an empty PATH, and status still observes the tree", (t) => {
  const project = tempProject(t);
  initRepo(project);

  const result = gef(["status", "--target", project, "--json"], { env: withoutGit(t) });
  assert.equal(result.code, 0);
  const status = JSON.parse(result.stdout).value.status;
  assert.equal(status.repository.dirtiness, "OBSERVED", "the approved executable is run without any PATH entry");
  assert.notEqual(status.repository.verdict, null);
});

// ------------------------------------------- H9: hostile ambient Git environment

/**
 * Two distinct repositories plus an external index.
 *
 * A is clean and B is dirty (one untracked file), so a redirected observation is *visible*: the
 * reported dirtiness of A differs from A's real dirtiness whenever an ambient variable succeeds in
 * pointing Git at B. A fixture where both repositories looked the same would prove nothing.
 */
function twoRepoFixture(t) {
  const a = tempProject(t, "gef-h9-a-");
  const b = tempProject(t, "gef-h9-b-");
  initRepo(a);
  initRepo(b);
  writeFileSync(join(b, "second-repo-marker.txt"), "only in B\n");
  const externalIndex = join(tempProject(t, "gef-h9-idx-"), "external.index");
  return { a, b, externalIndex, marker: "second-repo-marker.txt" };
}

/** The plain `git status` a hostile variable would produce, for liveness. */
function naiveStatus(root, env) {
  return (spawnSync("git", ["-C", root, "status", "--porcelain"], { encoding: "utf8", env }).stdout ?? "");
}

test("H9: GIT_DIR and GIT_WORK_TREE cannot redirect the admitted target", (t) => {
  const { a, b, marker } = twoRepoFixture(t);
  const ambient = { ...process.env, GIT_DIR: join(b, ".git"), GIT_WORK_TREE: b };

  // Liveness: the hostile variables really do redirect a plain Git invocation — `-C A` still reports
  // B's untracked file, so a redirect would be visible in the dirtiness GEF reports.
  assert.equal(naiveStatus(a, ambient).includes(marker), true, "the redirect must be real for this fixture to be live");
  assert.equal(naiveStatus(a, process.env).includes(marker), false, "A itself is clean");

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", a, "--json"], { env: ambient });
    assert.equal(result.code, 0, `${verb} must exit 0: ${result.stderr}`);
    assert.equal(result.stdout.includes(marker), false, `${verb} must not report the second repository`);
    assert.equal(result.stdout.includes(b), false, `${verb} must not report the second repository path`);
  }

  const status = JSON.parse(gef(["status", "--target", a, "--json"], { env: ambient }).stdout).value.status;
  assert.equal(status.repository.dirtiness, "OBSERVED", "A must still be observed");
  assert.equal(status.repository.verdict.dirty, false, "A is clean, so no foreign dirtiness may be reported");
  assert.deepEqual([...status.repository.verdict.untracked ?? []], [], "B's untracked file must not appear");
  assert.equal(
    status.target.targetRef.replace(/\\/g, "/").toLowerCase().endsWith(a.replace(/\\/g, "/").toLowerCase()),
    true,
    "the observed target is the admitted one",
  );
});

test("H9: GIT_INDEX_FILE is neither consumed nor modified", (t) => {
  const { a, externalIndex } = twoRepoFixture(t);
  writeFileSync(externalIndex, "sentinel-index-content");
  const before = readFileSync(externalIndex);
  const ambient = { ...process.env, GIT_INDEX_FILE: externalIndex };

  // Liveness: an external index really does change what a plain Git invocation reports — Git either
  // fails against the foreign index or reports a state that is not A's.
  const naive = spawnSync("git", ["-C", a, "status", "--porcelain"], { encoding: "utf8", env: ambient });
  assert.equal(naive.status !== 0 || (naive.stdout ?? "").trim() !== "", true, "the external index must change the plain observation for this fixture to be live");

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", a, "--json"], { env: ambient });
    assert.equal(result.code, 0);
    assert.equal(result.stdout.includes(externalIndex), false, `${verb} must not echo the external index path`);
  }
  const status = JSON.parse(gef(["status", "--target", a, "--json"], { env: ambient }).stdout).value.status;
  assert.equal(status.repository.dirtiness, "OBSERVED", "A is observed through its own index");
  assert.equal(status.repository.verdict.dirty, false, "the external index must not fabricate dirtiness");
  assert.equal(readFileSync(externalIndex).equals(before), true, "the external index must not be consumed, replaced or written");
  assert.equal(readFileSync(externalIndex).toString("utf8"), "sentinel-index-content");
});

test("H9: object-store and config redirection variables cannot change the observation", (t) => {
  const { a, b, marker } = twoRepoFixture(t);
  const ambient = {
    ...process.env,
    GIT_OBJECT_DIRECTORY: join(b, ".git", "objects"),
    GIT_ALTERNATE_OBJECT_DIRECTORIES: join(b, ".git", "objects"),
    GIT_NAMESPACE: "hostile-namespace",
    GIT_CEILING_DIRECTORIES: join(a, ".."),
    GIT_COMMON_DIR: join(b, ".git"),
    GIT_CONFIG_GLOBAL: join(b, "hostile.gitconfig"),
    GIT_CONFIG_SYSTEM: join(b, "hostile-system.gitconfig"),
    GIT_TRACE: "1",
  };
  const baseline = JSON.parse(gef(["status", "--target", a, "--json"]).stdout).value.status;
  const hostile = JSON.parse(gef(["status", "--target", a, "--json"], { env: ambient }).stdout).value.status;

  assert.equal(baseline.repository.verdict.dirty, false, "A is clean under the baseline");
  assert.equal(hostile.repository.dirtiness, baseline.repository.dirtiness, "dirtiness must be identical under hostile Git-control variables");
  assert.deepEqual(hostile.repository.verdict, baseline.repository.verdict, "the repository verdict must be identical and clean");
  assert.equal(hostile.target.targetRef, baseline.target.targetRef, "the target must be the admitted one");
  assert.equal(JSON.stringify(hostile).includes(marker), false, "B's untracked file must not appear");
});

test("H9: an arbitrary ambient variable is not forwarded or echoed", (t) => {
  const { a } = twoRepoFixture(t);
  const secret = "GEF-H9-AMBIENT-SECRET-VALUE";
  const ambient = { ...process.env, GEF_TEST_AMBIENT_SECRET: secret, ANOTHER_SECRET: secret };

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", a, "--json"], { env: ambient });
    assert.equal(result.code, 0);
    assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false, `${verb} must not echo arbitrary ambient values`);
  }
});

test("H9: the Git probe environment is an explicit allowlist", () => {
  const environment = gitProbeEnvironment();
  const admitted = Object.keys(environment).sort();
  // GIT_OPTIONAL_LOCKS is always set explicitly; the rest are the documented runtime keys actually
  // present in this process. Nothing else is forwarded.
  const allowed = new Set(["GIT_OPTIONAL_LOCKS", "PATH", "HOME", "USERPROFILE", "SystemRoot", "WINDIR", "PATHEXT", "TEMP", "TMP", "TMPDIR"]);
  for (const key of admitted) assert.equal(allowed.has(key), true, `${key} is not an admitted probe key`);
  assert.equal(environment.GIT_OPTIONAL_LOCKS, "0", "optional locks stay disabled");
  for (const forbidden of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_NAMESPACE", "GIT_CEILING_DIRECTORIES", "GIT_COMMON_DIR"]) {
    assert.equal(forbidden in environment, false, `${forbidden} must never be forwarded`);
  }
});

// ------------------------------------------- H10: approved executable resolution

/**
 * A directory placed first on PATH that offers a `git` an ambient lookup would really run.
 *
 * On Windows Node refuses to spawn `.cmd`/`.bat` without a shell, so a batch fake would never be
 * live; instead a genuine system executable is copied in under the name `git.exe`, which Node does
 * spawn. On POSIX a shell script named `git` is used and writes the sentinel when executed.
 */
function hostilePathFixture(t, sentinelName) {
  const dir = tempProject(t, "gef-h10-fake-");
  const sentinel = join(tempProject(t, "gef-h10-sent-"), sentinelName);
  if (process.platform === "win32") {
    const source = join(process.env["SystemRoot"] ?? "C:\\Windows", "System32", "cmd.exe");
    copyFileSync(source, join(dir, "git.exe"));
    return { dir, sentinel, fake: join(dir, "git.exe"), kind: "exe-copy" };
  }
  const fake = join(dir, "git");
  writeFileSync(fake, `#!/bin/sh\nprintf run > "${sentinel}"\nexit 0\n`);
  try { chmodSync(fake, 0o755); } catch { /* POSIX honours the mode set above */ }
  return { dir, sentinel, fake, kind: "shell-script" };
}

test("H10: a runnable fake git first in PATH is never executed", (t) => {
  const { a } = twoRepoFixture(t);
  const fixture = hostilePathFixture(t, "sentinel");
  const ambient = { ...process.env, PATH: `${fixture.dir}${delimiter}${process.env.PATH ?? ""}` };

  // Liveness: an ambient lookup really does reach the fake. On Windows the copy runs and fails
  // (`cmd.exe --version` is not a Git version); on POSIX the script runs and writes its sentinel.
  const naive = spawnSync("git", ["--version"], { encoding: "utf8", env: ambient });
  if (fixture.kind === "shell-script") {
    assert.equal(naive.status, 0, "the fake must be runnable for this fixture to be live");
    assert.equal(existsSync(fixture.sentinel), true, "a plain PATH lookup must execute the fake");
  } else {
    // The copied system executable runs, but what it prints is not a Git version — which is how the
    // fixture proves that an ambient lookup reaches the fake rather than the real Git.
    assert.equal((naive.stdout ?? "").includes("git version"), false, "the PATH-supplied fake git must be the one that ran");
    t.diagnostic("H10 liveness on win32: a copied system executable named git.exe is what an ambient lookup runs");
  }

  rmSync(fixture.sentinel, { force: true });
  const sentinelBefore = existsSync(fixture.sentinel);
  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", a, "--json"], { env: ambient });
    assert.equal(result.code, 0, `${verb} must exit 0: ${result.stderr}`);
    assert.equal(existsSync(fixture.sentinel), sentinelBefore, `${verb} must never execute a PATH-supplied fake git`);
    assert.equal(result.stdout.includes(fixture.dir), false, `${verb} must not echo the hostile directory`);
  }

  // The observation is the approved Git's, not the fake's: had the fake been used, the version probe
  // would have failed and the toolchain evidence would carry that failure.
  const doctor = JSON.parse(gef(["doctor", "--target", a, "--json"], { env: ambient }).stdout).value.doctor;
  assert.equal(doctor.toolchain.git.presence, "FOUND", "the approved Git is still the one used");
  assert.equal(doctor.toolchain.git.probeStatus, "SUCCEEDED", "the fake would have failed this probe");
  assert.equal(doctor.toolchain.git.observedVersion.includes("git version"), false, "no raw probe output is propagated");
  assert.equal(doctor.toolchain.git.executableIdentity, gitTool().identity, "the identity is the approved executable's");

  // Execution-tied evidence: the fake prints its own error text on stdout and exits 0, so a probe
  // that ran it would parse that text as porcelain output and report fabricated dirtiness. A is
  // clean, so any reported dirtiness here would be the fake's.
  const status = JSON.parse(gef(["status", "--target", a, "--json"], { env: ambient }).stdout).value.status;
  assert.equal(status.repository.dirtiness, "OBSERVED", "the approved Git must be the process that answered");
  assert.equal(status.repository.verdict.dirty, false, "A is clean; the fake's output must not be parsed as dirtiness");
});

test("H10: a failed resolution does not fall back to ambient git", (t) => {
  const fakeDir = tempProject(t, "gef-h10-fallback-");
  const fake = join(fakeDir, process.platform === "win32" ? "git.cmd" : "git");
  writeFileSync(fake, process.platform === "win32" ? "@echo off\r\nexit /b 0\r\n" : "#!/bin/sh\nexit 0\n");
  try { chmodSync(fake, 0o755); } catch { /* Windows ignores the mode */ }
  // An ambient PATH that resolves, so a fallback would succeed if one existed.
  const priorPath = process.env.PATH;
  process.env.PATH = `${fakeDir}${delimiter}${priorPath ?? ""}`;
  t.after(() => { process.env.PATH = priorPath; });

  const refusing = {
    policy: DEFAULT_GIT_TRUST_POLICY,
    counters: { environmentReads: new Map(), gitReads: new Map(), providerReads: 0, toolResolutions: new Map(), toolProbes: new Map(), cacheHits: 0, skippedByPrerequisite: 0 },
    resolve: () => ({ status: "ABSENT", reasonCode: "gef.test.refused" }),
    probe: () => ({ status: "FAILED", stdout: "", stderr: "" }),
    lastSpawnRefusal: () => null,
    verifiedIdentity: () => null,
    verifiedPhysical: () => null,
  };
  const resolution = resolveGitToolWith(refusing);
  assert.equal(resolution, null, "a refused resolution yields no tool rather than an ambient fallback");
});

test("H10: the approved locations are a frozen constant list", () => {
  // Every admitted candidate is an absolute path in a machine-owned directory, and no ambient
  // value can change the list or its order.
  for (const candidate of GIT_APPROVED_EXECUTABLES) {
    assert.equal(isAbsolute(candidate), true, `${candidate} must be absolute`);
    assert.equal(candidate.includes("PATH"), false);
  }
  const resolved = gitTool();
  assert.notEqual(resolved, null, "this environment has an approved Git");
  assert.match(resolved.identity, /^[0-9a-f]{64}$/);
  assert.equal(resolved.descriptor.resolution.kind, "TRUSTED_PATH");
  assert.equal(resolved.descriptor.resolution.policyRef, GIT_EXECUTABLE_POLICY_REF);
  // Both probes read this single resolution, so their executable is identical by construction.
  assert.equal(gitTool().identity, resolved.identity, "resolution is stable for the invocation");
  // A probe is only admitted after this port instance has verified the executable, so the
  // resolution must happen through the same instance.
  const port = createCliToolObservationPort();
  assert.equal(port.resolve(resolved.descriptor).status, "FOUND");
  const probe = port.probe({ executable: resolved.executable, argv: ["--version"], timeoutMs: 5000, maxOutputBytes: 65536, env: {} });
  assert.equal(probe.status, "SUCCEEDED");
  assert.equal(port.probe({ executable: resolved.executable, argv: ["--version"], timeoutMs: 5000, maxOutputBytes: 65536, env: {} }).status, "SUCCEEDED");
  // A fresh port has verified nothing, so it must refuse rather than spawn.
  assert.equal(createCliToolObservationPort().probe({ executable: resolved.executable, argv: ["--version"], timeoutMs: 5000, maxOutputBytes: 65536, env: {} }).status, "FAILED");
});

test("H10: a descriptor outside the declared policy is refused", (t) => {
  const { a } = twoRepoFixture(t);
  const insideTarget = join(a, "git");
  writeFileSync(insideTarget, "not a real git");

  // The policy admits a closed set of locations. A descriptor naming anything else is refused by the
  // policy itself rather than trusted because it carried the policy reference (M04-S04 TOOL-06/16).
  for (const notAdmitted of [insideTarget, join(a, "absent-git"), process.platform === "win32" ? "C:\\tmp\\git.exe" : "/tmp/git"]) {
    const resolution = createCliToolObservationPort().resolve(gitToolDescriptor(notAdmitted));
    assert.equal(resolution.status, "UNAVAILABLE", `${notAdmitted} must not be admitted`);
    assert.equal(resolution.reasonCode, "gef.cli.git.path_not_admitted");
  }
  // A PATH_NAME resolution — the weaker descriptor kind — is not admitted by this policy either.
  const pathName = createCliToolObservationPort().resolve({ toolId: "git", source: "BUILTIN", resolution: { kind: "PATH_NAME", executable: "git" } });
  assert.equal(pathName.status, "UNAVAILABLE");
  assert.equal(pathName.reasonCode, "gef.cli.git.untrusted_resolution_kind");

  // Each admitted location is inspected, not assumed: every candidate answers with a real state.
  const states = GIT_APPROVED_EXECUTABLES.map((candidate) => createCliToolObservationPort().resolve(gitToolDescriptor(candidate)).status);
  for (const state of states) assert.equal(["FOUND", "ABSENT", "UNAVAILABLE"].includes(state), true, `unexpected resolution state ${state}`);
  assert.equal(states.includes("FOUND"), true, "this environment has at least one admitted Git");

  // And the production resolution still selects the approved executable.
  assert.notEqual(gitTool(), null);
});

test("with Git available and an unobservable tree, status stays unknown", (t) => {
  const project = tempProject(t);
  // Git identity present but not a usable repository: the tree cannot be observed.
  mkdirSync(join(project, ".git"), { recursive: true });
  writeFileSync(join(project, ".git", "HEAD"), "ref: refs/heads/main\n");
  writeFileSync(join(project, "USER.txt"), "user content\n");

  const result = gef(["status", "--target", project, "--json"]);
  assert.equal(result.code, 0);
  const status = JSON.parse(result.stdout).value.status;
  assert.equal(status.repository.dirtiness, "UNKNOWN");
  assert.equal(status.repository.verdict, null);
  assert.equal(readFileSync(join(project, "USER.txt"), "utf8"), "user content\n");
});

// ------------------------------------------- production / development truth

test("status reports the declared production truth and the V1.1 overlay separately", (t) => {
  const project = tempProject(t);
  mkdirSync(join(project, ".engineering"), { recursive: true });
  writeFileSync(
    join(project, ".engineering", "CHECKPOINT.json"),
    JSON.stringify({ schemaVersion: 2, status: "GBS_V1_PRODUCTION_ACCEPTED", overallCompletionPercent: 100, v11: { status: "OVERLAY_STATUS", activeWorkOrder: "GBS-V11-WO-003" } }),
  );
  writeFileSync(join(project, "README.md"), "readme\n");

  const result = gef(["status", "--target", project, "--json"]);
  assert.equal(result.code, 0);
  const status = JSON.parse(result.stdout).value.status;
  assert.equal(status.release.valid, true, "a supported checkpoint carries semantic authority");
  assert.equal(status.release.production.status, "GBS_V1_PRODUCTION_ACCEPTED");
  assert.equal(status.release.development.status, "OVERLAY_STATUS", "the V1.1 overlay is reported separately");
  assert.equal(status.release.development.activeWorkOrder, "GBS-V11-WO-003");
  assert.equal(status.operator.progress, 100);
  assert.ok(status.documentation.entries.some((entry) => entry.id === "README.md"));
  assert.ok(status.navigation.files.includes(".engineering/CHECKPOINT.json"));
});

test("an ancestor alias is refused through the real process, not followed", (t) => {
  const SENTINEL = "GEF-E2E-EXTERNAL-SENTINEL";
  const project = tempProject(t, "gef-wo003-alias-");
  const external = tempProject(t, "gef-wo003-alias-ext-");
  mkdirSync(join(external, ".engineering"), { recursive: true });
  writeFileSync(join(external, ".engineering", "CHECKPOINT.json"), JSON.stringify({ schemaVersion: 2, status: SENTINEL, overallCompletionPercent: 100 }));
  writeFileSync(join(external, "README.md"), `${SENTINEL}\n`);

  // Junctions are unprivileged on Windows; directory symlinks are used elsewhere.
  if (process.platform === "win32") symlinkSync(join(external, ".engineering"), join(project, ".engineering"), "junction");
  else symlinkSync(join(external, ".engineering"), join(project, ".engineering"), "dir");

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", project, "--json"]);
    assert.equal(result.code, 0);
    assert.equal(`${result.stdout}${result.stderr}`.includes(SENTINEL), false, `${verb} must not expose aliased content`);
    assert.equal(result.stdout.includes(external), false, `${verb} must not expose the alias destination`);
    const value = JSON.parse(result.stdout).value[verb];
    assert.ok(value.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_ALIAS_REFUSED")), `${verb} must record the concrete alias refusal`);
  }

  // The external content is untouched and the alias itself was never rewritten.
  assert.equal(readFileSync(join(external, ".engineering", "CHECKPOINT.json"), "utf8").includes(SENTINEL), true);
  assert.equal(existsSync(join(project, ".gef")), false, "a refused read must not create state");
});

test("an over-budget checkpoint cannot populate release or operator truth", (t) => {
  const project = tempProject(t, "gef-wo003-budget-");
  mkdirSync(join(project, ".engineering"), { recursive: true });
  // A syntactically valid checkpoint that exceeds the admitted diagnostic budget.
  const padding = "x".repeat(1024 * 1024);
  writeFileSync(
    join(project, ".engineering", "CHECKPOINT.json"),
    JSON.stringify({ schemaVersion: 2, status: "FABRICATED_STATE", overallCompletionPercent: 100, padding }),
  );

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", project, "--json"]);
    assert.equal(result.code, 0);
    const value = JSON.parse(result.stdout).value[verb];
    assert.ok(value.observationLimits.some((limit) => limit.startsWith("DIAGNOSTIC_FILE_OVER_BUDGET")), `${verb} must record the concrete over-budget refusal`);
    assert.equal(result.stdout.includes("FABRICATED_STATE"), false, "oversized content must never reach the projection");
  }

  const status = JSON.parse(gef(["status", "--target", project, "--json"]).stdout).value.status;
  assert.equal(status.release.present, true, "an over-budget source is present, not absent");
  assert.equal(status.release.valid, false);
  assert.equal(status.release.production, null);
  assert.equal(status.operator.progress, null, "progress must never come from an over-budget document");
});

/** Every observation-limit code a diagnostic projection reports, wherever it scopes them. */
function limitsOf(value) {
  return [...(value.observationLimits ?? []), ...(value.repository?.observationLimits ?? [])];
}

test("an aliased Git directory is refused through the real process", (t) => {
  const SENTINEL = "GEF-E2E-GIT-EXTERNAL-SENTINEL";
  const project = tempProject(t, "gef-wo003-gitdir-");
  const external = tempProject(t, "gef-wo003-gitdir-ext-");
  mkdirSync(join(external, "refs", "heads"), { recursive: true });
  writeFileSync(join(external, "HEAD"), "ref: refs/heads/leaked\n");
  writeFileSync(join(external, "refs", "heads", "leaked"), SENTINEL);

  // Junctions are unprivileged on Windows; directory symlinks are used elsewhere.
  if (process.platform === "win32") symlinkSync(external, join(project, ".git"), "junction");
  else symlinkSync(external, join(project, ".git"), "dir");

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", project, "--json"]);
    assert.equal(result.code, 0, `${verb} must stay on the success path`);
    assert.equal(`${result.stdout}${result.stderr}`.includes(SENTINEL), false, `${verb} must not expose aliased Git content`);
    const value = JSON.parse(result.stdout).value[verb];
    assert.ok(limitsOf(value).some((limit) => limit.startsWith("DIAGNOSTIC_ALIAS_REFUSED:.git")), `${verb} must record the alias refusal`);
  }

  const status = JSON.parse(gef(["status", "--target", project, "--json"]).stdout).value.status;
  assert.equal(status.repository.dirtiness, "UNKNOWN", "an aliased Git directory cannot produce a usable state");
  assert.equal(status.repository.verdict, null);
});

test("oversized Git metadata is refused through the real process", (t) => {
  const PADDING = "GEF-E2E-GIT-PADDING-SENTINEL";
  const project = tempProject(t, "gef-wo003-gitbig-");
  mkdirSync(join(project, ".git"), { recursive: true });
  writeFileSync(join(project, ".git", "HEAD"), PADDING.repeat(200));

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", project, "--json"]);
    assert.equal(result.code, 0);
    assert.equal(`${result.stdout}${result.stderr}`.includes(PADDING), false, `${verb} must not echo oversized metadata`);
    const value = JSON.parse(result.stdout).value[verb];
    assert.ok(limitsOf(value).some((limit) => limit.startsWith("DIAGNOSTIC_FILE_OVER_BUDGET:.git/HEAD")), `${verb} must record the over-budget refusal`);
  }

  const status = JSON.parse(gef(["status", "--target", project, "--json"]).stdout).value.status;
  assert.equal(status.repository.dirtiness, "UNKNOWN");
  assert.equal(status.repository.verdict, null);
  assert.equal(status.operator.state, "UNOBSERVED", "no repository and no governance source means unobserved");
});

// ------------------------------------------------- H7: no index mutation

test("H7: the fixture's index really is refreshable by a plain git status", (t) => {
  const { root, index } = refreshableRepo(t, "gef-wo003-h7-live-");
  const before = digestOf(index);

  // Sensitivity: without optional-lock suppression Git rewrites the refreshed index. If this
  // assertion ever stops holding, the H7 fixture has gone stale and the test below would prove
  // nothing.
  gitIn(root, ["status", "--porcelain"]);
  assert.notEqual(digestOf(index), before, "a plain git status must be able to change this fixture's index");
});

test("H7: doctor and status leave .git/index byte-for-byte identical", (t) => {
  const { root, index } = refreshableRepo(t, "gef-wo003-h7-");
  writeFileSync(join(root, "untracked.txt"), "untracked\n");
  const indexBefore = digestOf(index);
  const stateBefore = gitState(root);

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", root, "--json"]);
    assert.equal(result.code, 0, `${verb} must exit 0: ${result.stderr}`);
    assert.equal(digestOf(index), indexBefore, `${verb} must not rewrite .git/index`);
    assert.equal(existsSync(join(root, ".git", "index.lock")), false, `${verb} must leave no index lock behind`);
    assert.deepEqual(gitState(root), stateBefore, `${verb} must not change branch, HEAD, refs, tags or config`);
  }

  // Dirtiness reporting is not weakened to obtain the side-effect-free probe.
  const status = JSON.parse(gef(["status", "--target", root, "--json"]).stdout).value.status;
  assert.equal(status.repository.dirtiness, "OBSERVED");
  assert.equal(status.repository.verdict.dirty, true, "the untracked file must still be reported");
});

// ------------------------------------------------- H8: no fsmonitor hook

/**
 * A repository whose `core.fsmonitor` names a hook that writes an external sentinel if Git runs it.
 *
 * Git treats the value as a shell command, so the hook path is written in POSIX form; the hook
 * records its own working directory and a run marker next to itself, outside the worktree.
 */
function fsmonitorRepo(t, prefix, value) {
  const root = tempProject(t, prefix);
  gitIn(root, ["init", "-q"]);
  gitIn(root, ["config", "user.email", "executor@example.invalid"]);
  gitIn(root, ["config", "user.name", "GEF Executor"]);
  gitIn(root, ["config", "gc.auto", "0"]);
  gitIn(root, ["config", "maintenance.auto", "false"]);
  writeFileSync(join(root, "tracked.txt"), "tracked content\n");
  gitIn(root, ["add", "."]);
  gitIn(root, ["commit", "-qm", "seed"]);

  const hook = join(root, ".git", "fsmonitor-hook.sh");
  const marker = join(root, ".git", "hook-ran.txt");
  const sentinel = join(root, "..", `gef-fsmon-sentinel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const posix = (path) => path.split("\\").join("/");
  writeFileSync(
    hook,
    ["#!/bin/sh", 'dir=$(dirname "$0")', `printf run > "${posix(marker)}"`, `printf sentinel > "${posix(sentinel)}"`, 'echo ""', ""].join("\n"),
  );
  try {
    chmodSync(hook, 0o755);
  } catch {
    // Windows ignores the mode; Git invokes the hook through its own shell.
  }
  gitIn(root, ["config", "core.fsmonitor", value === "hook" ? posix(hook) : value]);
  const cleanup = () => rmSync(sentinel, { force: true });
  t.after(cleanup);
  cleanup();
  return { root, hook, marker, sentinel, posixHook: posix(hook) };
}

test("H8: the fsmonitor fixture is live — a plain git status does run the hook", (t) => {
  const fixture = fsmonitorRepo(t, "gef-wo003-h8-live-", "hook");
  gitIn(fixture.root, ["status", "--porcelain"]);
  assert.equal(existsSync(fixture.marker), true, "a plain git status must invoke this fixture's fsmonitor hook");
  assert.equal(existsSync(fixture.sentinel), true, "the hook must be able to write the external sentinel");
});

test("H8: doctor and status never execute a repository fsmonitor hook", (t) => {
  const fixture = fsmonitorRepo(t, "gef-wo003-h8-", "hook");
  const indexBefore = digestOf(join(fixture.root, ".git", "index"));
  const stateBefore = gitState(fixture.root);

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", fixture.root, "--json"]);
    assert.equal(result.code, 0, `${verb} must exit 0: ${result.stderr}`);
    assert.equal(existsSync(fixture.marker), false, `${verb} must not execute the repository's fsmonitor hook`);
    assert.equal(existsSync(fixture.sentinel), false, `${verb} must not produce the hook's external side effect`);
    assert.equal(digestOf(join(fixture.root, ".git", "index")), indexBefore, `${verb} must not rewrite the index`);
    assert.deepEqual(gitState(fixture.root), stateBefore, `${verb} must not change Git state`);
    // The override is process-local: the repository configuration still names its own hook.
    assert.equal(gitIn(fixture.root, ["config", "core.fsmonitor"]).stdout.trim(), fixture.posixHook, `${verb} must not rewrite repository configuration`);
    // No hook path, sentinel path or environment detail leaks into the projection.
    assert.equal(result.stdout.includes(fixture.posixHook), false, `${verb} must not echo the hook path`);
    assert.equal(result.stdout.includes(fixture.sentinel), false, `${verb} must not echo the sentinel path`);
  }

  // Dirtiness reporting is preserved with fsmonitor disabled.
  writeFileSync(join(fixture.root, "untracked.txt"), "untracked\n");
  const status = JSON.parse(gef(["status", "--target", fixture.root, "--json"]).stdout).value.status;
  assert.equal(status.repository.dirtiness, "OBSERVED");
  assert.equal(status.repository.verdict.dirty, true);
});

test("H8: core.fsmonitor=true needs no daemon or hook for the probe", (t) => {
  const fixture = fsmonitorRepo(t, "gef-wo003-h8-daemon-", "true");
  const before = snapshot(fixture.root);

  for (const verb of ["doctor", "status"]) {
    const result = gef([verb, "--target", fixture.root, "--json"]);
    assert.equal(result.code, 0, `${verb} must exit 0: ${result.stderr}`);
    const value = JSON.parse(result.stdout).value[verb];
    assert.equal(value.repository?.observationLimits?.some((limit) => limit.startsWith("DIRTINESS_UNKNOWN")) ?? false, false, `${verb} must observe the tree, not fail closed`);
  }

  assert.equal(existsSync(fixture.marker), false, "no hook may run for the built-in fsmonitor setting");
  assert.equal(existsSync(fixture.sentinel), false);
  // No daemon artefact may be created in the repository by a read-only probe.
  for (const name of ["fsmonitor--daemon.ipc", "fsmonitor--daemon"]) {
    assert.equal(existsSync(join(fixture.root, ".git", name)), false, `${name} must not be created`);
  }
  assert.deepEqual(snapshot(fixture.root), before, "doctor and status must not change the repository");
});

test("an invalid checkpoint never becomes production or operator truth", (t) => {
  const project = tempProject(t);
  mkdirSync(join(project, ".engineering"), { recursive: true });
  // Syntactically valid JSON that is not a valid checkpoint: impossible progress and no version.
  writeFileSync(
    join(project, ".engineering", "CHECKPOINT.json"),
    JSON.stringify({ status: "GBS_V1_PRODUCTION_ACCEPTED", overallCompletionPercent: 999, nextLegalStage: "DONE" }),
  );
  writeFileSync(join(project, "README.md"), "readme\n");

  const result = gef(["status", "--target", project, "--json"]);
  assert.equal(result.code, 0);
  const status = JSON.parse(result.stdout).value.status;
  assert.equal(status.release.present, true, "presence is reported even when the content is not authoritative");
  assert.equal(status.release.valid, false, "presence must not be confused with validated authority");
  assert.equal(status.release.production, null);
  assert.equal(status.release.development, null);
  assert.equal(status.operator.progress, null, "progress must never be taken from an invalid checkpoint");
  assert.notEqual(status.operator.state, "GBS_V1_PRODUCTION_ACCEPTED", "a string in a file is not production approval");
  assert.ok(status.observationLimits.some((limit) => limit.startsWith("GOVERNANCE_CHECKPOINT_")), "the concrete refusal must be recorded");
});
