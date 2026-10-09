import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  validateManifest, planBatches, moduleConflict, prepareIssues, buildPrompt, runParallel,
  ParallelInputError, ghDefault
} from "../packages/cli/bin/parallel.mjs";

const mod = (id, write, extra = {}) => ({
  id, title: "Implement " + id, workOrder: "WO-" + id,
  approved: true, state: "ADMITTED", dependencies: [],
  files: { read: [], write: [write] }, tests: ["node --test"], ...extra
});
const manifest = (...modules) => ({
  schemaVersion: "1", repository: "KayzenRoot/fixture", modules
});
const checkReason = reason => error => error instanceof ParallelInputError && error.reason === reason;

test("six independent admitted modules fill one parallel batch; next module spills to another", () => {
  const input = manifest(...Array.from({ length: 7 }, (_, n) => mod("M" + (n + 1), "packages/m" + n + "/**")));
  const plan = planBatches(input);
  assert.deepEqual(plan.batches.map(x => x.modules.length), [6, 1]);
  assert.deepEqual(plan.blocked, []);
  assert.throws(() => planBatches(input, 7), checkReason("invalid_slots"));
});
test("dependency on unpromoted module is blocked, not scheduled in later batch", () => {
  const input = manifest(mod("M1", "src/m1/**"), mod("M2", "src/m2/**", { dependencies: ["M1"] }));
  const plan = planBatches(input);
  assert.deepEqual(plan.batches[0].modules, ["M1"]);
  assert.deepEqual(plan.blocked, [{ id: "M2", reason: "dependencies_not_promoted", dependencies: ["M1"] }]);
});
test("promoted predecessor explicitly recorded with a commit permits successor", () => {
  const parent = mod("M1", "src/m1/**", { state: "PROMOTED", promotionSha: "a".repeat(40) });
  assert.deepEqual(planBatches(manifest(parent, mod("M2", "src/m2/**", { dependencies: ["M1"] }))).batches[0].modules, ["M2"]);
});
test("write/write and write/read overlapping prefixes and reserved shared surfaces are serialized", () => {
  const one = mod("M1", "src/alpha/**");
  const two = mod("M2", "src/alpha/sub/file.ts");
  const three = mod("M3", "src/beta/**", { files: { read: ["src/alpha/private.ts"], write: ["src/beta/**"] } });
  const shared = mod("M4", "package-lock.json");
  assert.ok(moduleConflict(one, two));
  assert.ok(moduleConflict(one, three));
  assert.equal(moduleConflict(two, three), null);
  assert.equal(moduleConflict(shared, two), "reserved_shared_surface");
  assert.deepEqual(planBatches(manifest(one, two, three, shared)).batches.map(b => b.modules), [["M1"], ["M2", "M3"], ["M4"]]);
});
test("invalid IDs, duplicate IDs, unknown dependencies and cycles are fail closed", () => {
  assert.throws(() => validateManifest(manifest(mod("bad", "src/a"))), checkReason("invalid_module_id"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/a"), mod("M1", "src/b"))), checkReason("invalid_module_id"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/a", { dependencies: ["M404"] }))), checkReason("invalid_dependency"));
  assert.throws(() => validateManifest(manifest(
    mod("M1", "src/a", { dependencies: ["M2"] }), mod("M2", "src/b", { dependencies: ["M1"] })
  )), checkReason("dependency_cycle"));
});
test("unsafe paths, unknown writable surfaces and incomplete promotions fail closed", () => {
  for (const path of ["../escape", "/absolute", "src/*/file.ts", "C:\\temp\\file.ts", "src/../escape", "src//double", "src/", "src/module/.", ".git/config", ".GIT/config", "src/.git/index"]) {
    assert.throws(() => validateManifest(manifest(mod("M1", path))), checkReason("unsafe_path"));
  }
  assert.throws(() => validateManifest(manifest(mod("M1", "src/x", { files: { read: [], write: [] } }))), checkReason("unsafe_admission"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/x", { state: "PROMOTED" }))), checkReason("unproven_promotion"));
});
test("issue apply deduplicates by stable marker, writes only with apply and verifies readback", () => {
  let entries = [];
  const calls = [];
  const gh = args => {
    calls.push(args);
    if (args[0] === "issue" && args[1] === "list") return JSON.stringify(entries);
    if (args[0] === "issue" && args[1] === "create") {
      entries.push({ number: entries.length + 13, title: args[args.indexOf("--title") + 1],
        body: args[args.indexOf("--body") + 1], url: "https://github.com/KayzenRoot/fixture/issues/13" });
      return "created";
    }
    throw new Error("unexpected gh mock call");
  };
  const input = manifest(mod("M1", "src/m1/**"));
  assert.equal(prepareIssues(input, { gh }).issues[0].status, "WOULD_CREATE");
  assert.equal(calls.filter(x => x[1] === "create").length, 0);
  assert.equal(prepareIssues(input, { gh, apply: true }).issues[0].number, 13);
  assert.equal(prepareIssues(input, { gh, apply: true }).issues[0].number, 13);
  assert.equal(calls.filter(x => x[1] === "create").length, 1);
  assert.match(buildPrompt(input, { gh }).prompt, /AGENT 1 \| M1 \| WO-M1 \| ISSUE #13/);
  assert.match(buildPrompt(input, { gh }).prompt, /isolated/);
  assert.match(buildPrompt(input, { gh }).prompt, /Jev MCP/);
});
test("duplicate existing markers and unmarked legacy issue title block creation", () => {
  const m = mod("M1", "src/m1/**");
  const body = "<!-- gef-parallel-module:M1 -->";
  assert.throws(() => prepareIssues(manifest(m), { apply: true, gh: () => JSON.stringify([
    { number: 2, title: "M1", body, url: "a" }, { number: 3, title: "M1", body, url: "b" }
  ]) }), checkReason("issue_ambiguous"));
  assert.throws(() => prepareIssues(manifest(m), { apply: true, gh: () => JSON.stringify([
    { number: 4, title: "Implement M1", body: "", url: "c" }
  ]) }), checkReason("issue_ambiguous"));
});
test("missing GitHub authentication, missing mapped issue and incomplete inventory are blocked", () => {
  const input = manifest(mod("M1", "src/m1/**"));
  assert.throws(() => prepareIssues(input, { gh: () => { throw new ParallelInputError("github_unavailable", "no auth"); } }), checkReason("github_unavailable"));
  assert.throws(() => buildPrompt(input, { gh: () => "[]" }), checkReason("missing_issue"));
  assert.throws(() => prepareIssues(input, { gh: () => JSON.stringify(Array.from({ length: 1000 }, () => ({ title: "x" }))) }), checkReason("github_incomplete"));
});

test("later batches are selectable and issues never silently reuse a stale Work Order or path declaration", () => {
  const input = manifest(...Array.from({ length: 7 }, (_, n) =>
    mod("M" + (n + 1), "packages/m" + (n + 1) + "/**")));
  const entries = [];
  const gh = args => {
    if (args[1] === "list") return JSON.stringify(entries);
    if (args[1] === "create") {
      const title = args[args.indexOf("--title") + 1];
      const body = args[args.indexOf("--body") + 1];
      const number = entries.length + 101;
      entries.push({ number, title, body, url: "https://github.com/KayzenRoot/fixture/issues/" + number });
      return entries.at(-1).url;
    }
    throw new Error("unknown gh mock call");
  };
  prepareIssues(input, { apply: true, gh });
  const first = buildPrompt(input, { gh });
  const second = buildPrompt(input, { gh, batchNumber: 2 });
  assert.deepEqual(first.batch, ["M1", "M2", "M3", "M4", "M5", "M6"]);
  assert.deepEqual(second.batch, ["M7"]);
  assert.ok(second.prompt.includes("AGENT 1 | M7 | WO-M7 | ISSUE #107"));
  assert.ok(second.prompt.includes("feat/m7-wo-m7"));
  assert.throws(() => buildPrompt(input, { gh, batchNumber: 3 }), checkReason("batch_unavailable"));
  assert.throws(() => buildPrompt(input, { gh, batchNumber: 0 }), checkReason("invalid_batch"));
  const altered = manifest(mod("M1", "packages/different/**"));
  assert.throws(() => prepareIssues(altered, { gh }), checkReason("issue_stale"));
});

test("real CLI entry offers parallel help even without TypeScript dist and refuses --apply on plan", () => {
  const bin = fileURLToPath(new URL("../packages/cli/bin/gef.mjs", import.meta.url));
  const help = spawnSync(process.execPath, [bin, "parallel", "--help"], { encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /gef parallel plan\|issues\|prompt/);
  const errors = [];
  return runParallel(["plan", "--apply"], { stderr: s => errors.push(s) }).then(code => {
    assert.equal(code, 10);
    assert.match(errors.join(""), /unsafe_apply/);
  });
});
test("manifest file entry read-only; default invocation never calls gh for plan", async () => {
  const dir = mkdtempSync(join(tmpdir(), "gef-parallel-"));
  try {
    mkdirSync(join(dir, ".gef"));
    const path = join(dir, ".gef", "parallel-modules.json");
    writeFileSync(path, JSON.stringify(manifest(mod("M1", "src/m1/**"))));
    const stdout = [], stderr = [];
    const code = await runParallel(["plan", "--manifest", path, "--json"], {
      stdout: s => stdout.push(s), stderr: s => stderr.push(s),
      gh: () => { throw new Error("plan must be offline"); }
    });
    assert.equal(code, 0);
    assert.equal(stderr.length, 0);
    assert.deepEqual(JSON.parse(stdout.join("")).value.batches[0].modules, ["M1"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("GH bridge rejects incomplete oversized output before reporting authentication failure", () => {
  let observed;
  const invoke = (_exe, _args, options) => { observed = options; return { error: { code: "ENOBUFS" }, status: null }; };
  assert.throws(() => ghDefault(["issue", "list"], invoke), checkReason("github_incomplete"));
  assert.equal(observed.shell, false);
  assert.equal(observed.maxBuffer, 64 * 1024 * 1024);
  assert.throws(() => ghDefault(["issue", "list"], () => ({ status: 1, error: null })), checkReason("github_unavailable"));
  assert.equal(ghDefault(["issue", "list"], () => ({ status: 0, stdout: "[]" })), "[]");
});

test("manifest validation handles incomplete, uncertain and malformed input deterministically", () => {
  assert.throws(() => validateManifest({}), checkReason("invalid_manifest"));
  assert.throws(() => validateManifest(manifest()), checkReason("invalid_manifest"));
  assert.throws(() => validateManifest({ schemaVersion: "2", repository: "a/b", modules: [mod("M1", "src/m1")] }), checkReason("invalid_manifest"));
  assert.throws(() => validateManifest({ schemaVersion: "1", repository: "not-a-repository", modules: [mod("M1", "src/m1")] }), checkReason("invalid_manifest"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/m1", { title: "bad\nname" }))), checkReason("invalid_module"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/m1", { workOrder: "bad" }))), checkReason("invalid_module"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/m1", { approved: "yes" }))), checkReason("invalid_module"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/m1", { dependencies: ["M1", "M1"] }))), checkReason("invalid_module"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/m1", { files: { read: null, write: ["src/m1"] } }))), checkReason("invalid_paths"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/m1", { files: { read: [], write: ["src/m1", "src/m1"] } }))), checkReason("duplicate_path"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/m1", { files: { read: [], write: ["src/m1", "SRC/M1"] } }))), checkReason("duplicate_path"));
  assert.throws(() => validateManifest(manifest(mod("M1", "src/m1", { tests: ["okay", "bad\ncmd"] }))), checkReason("invalid_tests"));
  assert.equal(validateManifest(manifest(mod("M1", "src/m1", { state: "PLANNED", approved: false, files: { read: [], write: [] } }))).modules[0].state, "PLANNED");
});
test("planner excludes unadmitted and unapproved modules and honors one slot", () => {
  const input = manifest(mod("M1", "src/m1/**"), mod("M2", "src/m2/**"), mod("M3", "src/m3/**",
    { state: "PLANNED", approved: false, files: { read: [], write: [] } }));
  const plan = planBatches(input, 1);
  assert.deepEqual(plan.batches.map(b => b.modules), [["M1"], ["M2"]]);
  assert.deepEqual(plan.approvedModules, ["M1", "M2"]);
  assert.throws(() => planBatches(input, 0), checkReason("invalid_slots"));
});
test("issue creation refuses missing readback, corrupt inventory and ignores unapproved modules", () => {
  const ready = manifest(mod("M1", "src/m1/**"));
  assert.throws(() => prepareIssues(ready, { gh: () => "not-json" }), checkReason("github_malformed"));
  assert.throws(() => prepareIssues(ready, { gh: () => "[null]" }), checkReason("github_malformed"));
  assert.throws(() => prepareIssues(ready, { gh: () => "[{}]" }), checkReason("github_malformed"));
  assert.throws(() => prepareIssues(ready, { apply: true, gh: args =>
    args[1] === "list" ? "[]" : "https://github.com/example" }), checkReason("issue_readback_failed"));
  const parked = manifest(mod("M1", "src/m1/**", { state: "PLANNED", approved: false, files: { read: [], write: [] } }));
  assert.deepEqual(prepareIssues(parked, { apply: true, gh: () => "[]" }).issues, []);
  assert.throws(() => buildPrompt(parked, { gh: () => "[]" }), checkReason("batch_unavailable"));
});
test("CLI command parser and JSON failure boundaries remain fail closed", async () => {
  for (const [args, reason] of [
    [["unknown"], "unknown_action"],
    [["plan", "--bogus"], "unknown_option"],
    [["plan", "--repo"], "missing_option_value"],
    [["plan", "--apply"], "unsafe_apply"],
    [["plan", "--batch", "2"], "invalid_batch"],
    [["prompt", "--batch", "0"], "invalid_batch"]
  ]) {
    const error = [];
    const code = await runParallel([...args, "--json"], { stderr: text => error.push(text) });
    assert.equal(code, 10);
    assert.equal(JSON.parse(error.join("")).reason, reason);
  }
  const missing = [];
  assert.equal(await runParallel(["plan", "--manifest", "/no/such/file", "--json"], { stderr: s => missing.push(s) }), 10);
  assert.equal(JSON.parse(missing.join("")).reason, "manifest_missing");
  const help = [];
  assert.equal(await runParallel(["--help"], { stdout: s => help.push(s) }), 0);
  assert.match(help.join(""), /parallel/);
});
test("CLI manifest I/O rejects oversize, invalid JSON, directory and symlink safely", async () => {
  const dir = mkdtempSync(join(tmpdir(), "gef-parallel-fail-"));
  try {
    const f = join(dir, "manifest.json");
    const cases = [["not json", "manifest_invalid_json"], [" ".repeat(262145), "manifest_unsafe"]];
    for (const [payload, reason] of cases) {
      writeFileSync(f, payload);
      const err = [];
      assert.equal(await runParallel(["plan", "--manifest", f, "--json"], { stderr: s => err.push(s) }), 10);
      assert.equal(JSON.parse(err.join("")).reason, reason);
    }
    const errors = [];
    assert.equal(await runParallel(["plan", "--manifest", dir, "--json"], { stderr: s => errors.push(s) }), 10);
    assert.equal(JSON.parse(errors.join("")).reason, "manifest_unsafe");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("CLI prompt and issues report missing auth without executing shell", async () => {
  const dir = mkdtempSync(join(tmpdir(), "gef-parallel-gh-"));
  try {
    const file = join(dir, "manifest.json");
    writeFileSync(file, JSON.stringify(manifest(mod("M1", "src/m1/**"))));
    for (const cmd of ["issues", "prompt"]) {
      const err = [];
      const code = await runParallel([cmd, "--manifest", file, "--json"], {
        stderr: s => err.push(s), gh: () => { throw new ParallelInputError("github_unavailable", "permission denied"); }
      });
      assert.equal(code, 40);
      assert.equal(JSON.parse(err.join("")).reason, "github_unavailable");
    }
    const errors = [];
    assert.equal(await runParallel(["plan", "--manifest", file, "--repo", "invalid", "--json"], {
      stderr: s => errors.push(s)
    }), 10);
    assert.equal(JSON.parse(errors.join("")).reason, "invalid_repository");
    const ok = [];
    assert.equal(await runParallel(["plan", "--manifest", file, "--repo", "Owner/Other", "--slots", "1", "--json"], {
      stdout: s => ok.push(s)
    }), 0);
    assert.equal(JSON.parse(ok.join("")).value.repository, "Owner/Other");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

