import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
const cliBin = fileURLToPath(new URL("../packages/cli/bin/gef.mjs", import.meta.url));
const canonicalRepository = "KayzenRoot/gef-bootstrap";
const canonicalBaseSha = "921493797728a43aadc9f7840c954ce7e3ebc416";
const canonicalPromotionSha = "bd6d0e9884386d7ec8828ba3bd15de7777ebe362";

function fixtureGit(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", shell: false });
  assert.equal(result.status, 0, result.stderr || "git fixture setup failed");
  return result.stdout.trim();
}

function promotionFixture({ checkpoint = JSON.parse(readFileSync(fileURLToPath(new URL("../.engineering/CHECKPOINT.json", import.meta.url)), "utf8")),
  repository = canonicalRepository, origin = "https://github.com/KayzenRoot/gef-bootstrap.git",
  moduleId = "U12-01", workOrder = "GBS-V12-WO-001", promotionSha, includeCheckpoint = true,
  withCanonicalHistory = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "gef-parallel-promotion-"));
  const recordSha = checkpoint?.v12?.wo001Promotion?.implementationMergeSha ?? "a".repeat(40);
  const promoted = mod(moduleId, "src/previous/**", {
    workOrder, state: "PROMOTED", promotionSha: promotionSha ?? recordSha
  });
  const dependent = mod("U12-02", "src/next/**", { dependencies: [moduleId] });
  const input = { schemaVersion: "1", repository, modules: [promoted, dependent] };
  const manifestPath = join(root, ".gef", "parallel-modules.json");

  if (withCanonicalHistory) {
    const sourceRepository = fileURLToPath(new URL("../", import.meta.url));
    const clone = spawnSync("git", ["clone", "--shared", "--quiet", "--no-checkout", sourceRepository, root], {
      encoding: "utf8", shell: false
    });
    assert.equal(clone.status, 0, clone.stderr || "git fixture clone failed");
    fixtureGit(root, ["update-ref", "refs/heads/main", canonicalBaseSha]);
    fixtureGit(root, ["symbolic-ref", "HEAD", "refs/heads/main"]);
    fixtureGit(root, ["read-tree", canonicalBaseSha]);
  } else {
    fixtureGit(root, ["init", "--quiet"]);
    fixtureGit(root, ["checkout", "--quiet", "--orphan", "main"]);
  }
  fixtureGit(root, ["config", "user.name", "Parallel Test"]);
  fixtureGit(root, ["config", "user.email", "parallel-test@example.invalid"]);
  if (withCanonicalHistory) fixtureGit(root, ["remote", "set-url", "origin", origin]);
  if (includeCheckpoint) {
    mkdirSync(join(root, ".engineering"), { recursive: true });
    writeFileSync(join(root, ".engineering", "CHECKPOINT.json"), JSON.stringify(checkpoint, null, 2) + "\n");
  } else if (!includeCheckpoint) {
    rmSync(join(root, ".engineering", "CHECKPOINT.json"), { force: true });
  }
  mkdirSync(join(root, ".gef"), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(input));
  if (withCanonicalHistory) {
    if (includeCheckpoint && JSON.stringify(checkpoint) !== JSON.stringify(JSON.parse(readFileSync(fileURLToPath(new URL("../.engineering/CHECKPOINT.json", import.meta.url)), "utf8")))) {
      fixtureGit(root, ["add", "--", ".engineering/CHECKPOINT.json"]);
      const tree = fixtureGit(root, ["write-tree"]);
      const commit = fixtureGit(root, ["commit-tree", tree, "-p", canonicalBaseSha, "-m", "fixture changed checkpoint"]);
      fixtureGit(root, ["update-ref", "refs/heads/main", commit]);
    }
  } else {
    fixtureGit(root, ["add", "."]);
    fixtureGit(root, ["commit", "--quiet", "-m", "fixture tracked checkpoint and manifest"]);
    fixtureGit(root, ["remote", "add", "origin", origin]);
  }

  return {
    root,
    checkpointPath: join(root, ".engineering", "CHECKPOINT.json"),
    run(extraArgs = []) {
      return spawnSync(process.execPath, [cliBin, "parallel", "plan", "--manifest", manifestPath, "--json", ...extraArgs], {
        cwd: root, encoding: "utf8", shell: false, maxBuffer: 1024 * 1024
      });
    }
  };
}

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
test("promoted predecessor requires the exact tracked checkpoint and repository identity", () => {
  const fixture = promotionFixture();
  try {
    assert.equal(JSON.parse(readFileSync(fixture.checkpointPath, "utf8")).v12.wo001Promotion.implementationMergeSha, canonicalPromotionSha);
    const result = fixture.run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout).value.batches[0].modules, ["U12-02"]);
  } finally { rmSync(fixture.root, { recursive: true, force: true }); }
});
test("missing, fake, stale, divergent and conflicting promotion evidence fails closed", () => {
  const staleSha = "7b185a284004567217b98213d568c70f26077bfd";
  const badCases = [
    ["missing checkpoint", { includeCheckpoint: false }, "checkpoint_unavailable"],
    ["fake SHA", { promotionSha: "a".repeat(40) }, "unproven_promotion"],
    ["stale candidate SHA", { promotionSha: staleSha }, "unproven_promotion"],
    ["module identity conflict", { moduleId: "U12-03" }, "unproven_promotion"],
    ["Work Order identity conflict", { workOrder: "GBS-V12-WO-002" }, "unproven_promotion"]
  ];
  for (const [label, options, reason] of badCases) {
    const fixture = promotionFixture(options);
    try {
      const result = fixture.run();
      assert.notEqual(result.status, 0, label);
      assert.equal(JSON.parse(result.stderr).reason, reason, label);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }

  const divergent = JSON.parse(readFileSync(fileURLToPath(new URL("../.engineering/CHECKPOINT.json", import.meta.url)), "utf8"));
  divergent.v12.wo001Promotion.promotionSha = "b".repeat(40);
  const fixture = promotionFixture({ checkpoint: divergent });
  try {
    const result = fixture.run();
    assert.notEqual(result.status, 0);
    assert.equal(JSON.parse(result.stderr).reason, "unproven_promotion");
  } finally { rmSync(fixture.root, { recursive: true, force: true }); }

  for (const [field, value] of [["moduleId", "U12-02"], ["workOrder", "GBS-V12-WO-002"]]) {
    const conflicting = JSON.parse(readFileSync(fileURLToPath(new URL("../.engineering/CHECKPOINT.json", import.meta.url)), "utf8"));
    conflicting.v12.wo001Promotion[field] = value;
    const badIdentity = promotionFixture({ checkpoint: conflicting });
    try {
      const result = badIdentity.run();
      assert.notEqual(result.status, 0, "checkpoint " + field + " conflict");
      assert.equal(JSON.parse(result.stderr).reason, "unproven_promotion", "checkpoint " + field + " conflict");
    } finally { rmSync(badIdentity.root, { recursive: true, force: true }); }
  }
});
test("cross-project origin or --repo override cannot authorize a promoted dependency", () => {
  const mismatchedOrigin = promotionFixture({ origin: "https://github.com/KayzenRoot/other-project.git" });
  try {
    const result = mismatchedOrigin.run();
    assert.notEqual(result.status, 0);
    assert.equal(JSON.parse(result.stderr).reason, "repository_identity_mismatch");
  } finally { rmSync(mismatchedOrigin.root, { recursive: true, force: true }); }

  const mismatchedTarget = promotionFixture();
  try {
    const result = mismatchedTarget.run(["--repo", "KayzenRoot/other-project"]);
    assert.notEqual(result.status, 0);
    assert.equal(JSON.parse(result.stderr).reason, "repository_identity_mismatch");
  } finally { rmSync(mismatchedTarget.root, { recursive: true, force: true }); }

  const mismatchedManifest = promotionFixture({ repository: "KayzenRoot/other-project" });
  try {
    const result = mismatchedManifest.run(["--repo", "KayzenRoot/gef-bootstrap"]);
    assert.notEqual(result.status, 0);
    assert.equal(JSON.parse(result.stderr).reason, "repository_identity_mismatch");
  } finally { rmSync(mismatchedManifest.root, { recursive: true, force: true }); }
});
test("a copied checkpoint cannot authorize another project or a repository without the canonical merge ancestry", () => {
  const source = promotionFixture();
  try {
    const copiedCheckpoint = JSON.parse(readFileSync(source.checkpointPath, "utf8"));
    const target = promotionFixture({
      checkpoint: copiedCheckpoint,
      repository: "KayzenRoot/project-b",
      origin: "https://github.com/KayzenRoot/project-b.git",
      withCanonicalHistory: false
    });
    try {
      const result = target.run(["--repo", "KayzenRoot/project-b"]);
      assert.notEqual(result.status, 0);
      assert.equal(JSON.parse(result.stderr).reason, "repository_identity_mismatch");
    } finally { rmSync(target.root, { recursive: true, force: true }); }
  } finally { rmSync(source.root, { recursive: true, force: true }); }

  const unrelatedHistory = promotionFixture({ withCanonicalHistory: false });
  try {
    const result = unrelatedHistory.run();
    assert.notEqual(result.status, 0);
    assert.equal(JSON.parse(result.stderr).reason, "unproven_promotion");
  } finally { rmSync(unrelatedHistory.root, { recursive: true, force: true }); }
});
test("dirty and staged checkpoint copies cannot satisfy a promotion receipt", () => {
  for (const staged of [false, true]) {
    const fixture = promotionFixture();
    try {
      const changed = JSON.parse(readFileSync(fixture.checkpointPath, "utf8"));
      changed.project = "Different Project";
      writeFileSync(fixture.checkpointPath, JSON.stringify(changed, null, 2) + "\n");
      if (staged) fixtureGit(fixture.root, ["add", ".engineering/CHECKPOINT.json"]);
      const result = fixture.run();
      assert.notEqual(result.status, 0);
      assert.equal(JSON.parse(result.stderr).reason, "checkpoint_dirty");
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  }
});
test("public pure helpers cannot accept an injected or locally claimed promotion proof", () => {
  const checkpoint = JSON.parse(readFileSync(fileURLToPath(new URL("../.engineering/CHECKPOINT.json", import.meta.url)), "utf8"));
  const parent = mod("U12-01", "src/m1/**", {
    workOrder: "GBS-V12-WO-001", state: "PROMOTED", promotionSha: checkpoint.v12.wo001Promotion.implementationMergeSha
  });
  const input = manifest(parent, mod("U12-02", "src/m2/**", { dependencies: [parent.id] }));
  assert.throws(() => validateManifest(input), checkReason("unproven_promotion"));
  assert.throws(() => planBatches(input), checkReason("unproven_promotion"));
  assert.throws(() => planBatches(input, 6, { checkpoint }), checkReason("unproven_promotion"));
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
  assert.deepEqual(planBatches(manifest(one, two, three)).batches.map(b => b.modules), [["M1"], ["M2", "M3"]]);
  assert.throws(() => planBatches(manifest(shared)), checkReason("reserved_write"));
});
test("single module cannot schedule protected WRITE surfaces; READ permissions alone remain allowed", () => {
  for (const path of ["package.json", "package-lock.json", "AGENTS.md", ".github/workflows/ci.yml", ".engineering/checkpoint.json", "planning/roadmap.md", "PACKAGE.JSON", ".github"]) {
    const m = mod("M1", path);
    assert.throws(() => validateManifest(manifest(m)), checkReason("reserved_write"));
    assert.throws(() => planBatches(manifest(m)), checkReason("reserved_write"));
  }
  const safe = mod("M1", "src/m1/**", { files: { read: ["package.json"], write: ["src/m1/**"] } });
  assert.deepEqual(planBatches(manifest(safe)).batches[0].modules, ["M1"]);
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
test("Windows trailing-dot path aliases fail closed before write conflict batching", () => {
  const canonical = mod("M1", "src/config");
  const alias = mod("M2", "src/config.");
  assert.throws(() => validateManifest(manifest(canonical, alias)), checkReason("unsafe_path"));
  assert.throws(() => planBatches(manifest(canonical, alias)), checkReason("unsafe_path"));
  assert.throws(() => validateManifest(manifest(mod("M1", ".engineering."))), checkReason("unsafe_path"));
});
test("issue apply deduplicates by stable marker, writes only with apply and verifies readback", () => {
  let entries = [];
  const calls = [];
  const gh = args => {
    calls.push(args);
    if (args[0] === "issue" && args[1] === "list") return JSON.stringify(entries);
    if (args[0] === "issue" && args[1] === "create") {
      entries.push({ number: entries.length + 13, title: args[args.indexOf("--title") + 1],
        body: args[args.indexOf("--body") + 1], url: "https://github.com/KayzenRoot/fixture/issues/13",
        author: { login: "KayzenRoot" } });
      return "created";
    }
    if (args[0] === "api") return JSON.stringify({ permission: "admin" });
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
test("issue provenance blocks read-access spoofing, deleted authors and bad permission evidence", () => {
  const input = manifest(mod("M1", "src/m1/**"));
  const issue = {
    number: 77, title: "[GEF-MOD:M1] untrusted issue",
    body: [
      "<!-- gef-parallel-module:M1 -->", "Work Order: WO-M1", "Dependencies: none",
      "READ: none", "WRITE: src/m1/**"
    ].join("\n"),
    url: "https://github.com/KayzenRoot/fixture/issues/77",
    author: { login: "read-only-user" }
  };
  const calls = [];
  const gh = args => {
    calls.push(args);
    if (args[1] === "list") return JSON.stringify([issue]);
    if (args[0] === "api") return JSON.stringify({ permission: "read" });
    throw new Error("must not create untrusted issue");
  };
  assert.throws(() => prepareIssues(input, { gh, apply: true }), checkReason("issue_untrusted"));
  assert.throws(() => buildPrompt(input, { gh }), checkReason("issue_untrusted"));
  assert.equal(calls.filter(args => args[1] === "create").length, 0);
  assert.ok(calls.some(args => args[0] === "api" &&
    args[1] === "repos/KayzenRoot/fixture/collaborators/read-only-user/permission"));
  const missingAuthor = { ...issue, author: null };
  assert.throws(() => buildPrompt(input, {
    gh: args => args[1] === "list" ? JSON.stringify([missingAuthor]) : JSON.stringify({ permission: "admin" })
  }), checkReason("issue_untrusted"));
  assert.throws(() => buildPrompt(input, {
    gh: args => args[1] === "list" ? JSON.stringify([issue]) : JSON.stringify({})
  }), checkReason("github_malformed"));
  assert.throws(() => buildPrompt(input, {
    gh: args => args[1] === "list" ? JSON.stringify([issue]) : "{not json"
  }), checkReason("github_malformed"));
});
test("verified collaborator with write permission may reuse exactly matching issue", () => {
  const input = manifest(mod("M1", "src/m1/**"));
  const entry = {
    number: 5, title: "[GEF-MOD:M1] approved",
    body: "<!-- gef-parallel-module:M1 -->\nWork Order: WO-M1\nDependencies: none\nREAD: none\nWRITE: src/m1/**",
    url: "https://github.com/KayzenRoot/fixture/issues/5",
    author: { login: "repo-writer" }
  };
  let apiCount = 0;
  const gh = args => {
    if (args[1] === "list") return JSON.stringify([entry]);
    if (args[0] === "api") { apiCount++; return JSON.stringify({ permission: "write" }); }
    throw new Error("create must not run");
  };
  assert.equal(prepareIssues(input, { apply: true, gh }).issues[0].number, 5);
  assert.equal(apiCount, 1);
  assert.match(buildPrompt(input, { gh }).prompt, /ISSUE #5/);
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
      entries.push({ number, title, body, url: "https://github.com/KayzenRoot/fixture/issues/" + number,
        author: { login: "KayzenRoot" } });
      return entries.at(-1).url;
    }
    if (args[0] === "api") return JSON.stringify({ permission: "admin" });
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
    const forgedPath = join(dir, ".gef", "forged-parallel-modules.json");
    writeFileSync(forgedPath, JSON.stringify(manifest(mod("M1", "src/m1/**", {
      state: "PROMOTED", promotionSha: "a".repeat(40)
    }))));
    const blocked = [];
    assert.equal(await runParallel(["plan", "--manifest", forgedPath, "--json"], {
      stderr: s => blocked.push(s), gh: () => { throw new Error("plan must remain offline"); }
    }), 10);
    assert.equal(JSON.parse(blocked.join("")).reason, "repository_identity_mismatch");
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
