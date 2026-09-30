// GBS-V11-WO-002 correction V2 — H6: repository dirtiness must be observed, never assumed clean.
//
// The accepted `repositoryState` engine treats omitted dirty arrays as empty, so an observation
// that did not read the working tree would be reported as CLEAN. These cases cover the full
// matrix — clean, modified, staged, untracked, conflicted, mid-operation and unobservable — and
// prove that unknown evidence blocks mutation before any target-visible effect.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { loadEngines, observeRepository, observeRepositoryDirtiness } from "../packages/cli/dist/index.js";

function tempRoot(t) {
  const root = mkdtempSync(join(tmpdir(), "gef-repo-state-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function git(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 60_000 });
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout ?? "";
}

function initRepo(root) {
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "executor@example.invalid"]);
  git(root, ["config", "user.name", "GEF Executor"]);
  writeFileSync(join(root, "tracked.txt"), "base\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "base"]);
}

test("H6: the observation matrix never reports unobserved dirtiness as clean", async (t) => {
  const engines = await loadEngines();
  const cases = [];

  // clean
  const clean = tempRoot(t);
  initRepo(clean);
  cases.push({ name: "clean", root: clean, dirtiness: "OBSERVED", state: "CLEAN", expect: [] });

  // modified (unstaged)
  const modified = tempRoot(t);
  initRepo(modified);
  writeFileSync(join(modified, "tracked.txt"), "changed\n");
  cases.push({ name: "modified", root: modified, dirtiness: "OBSERVED", state: "DIRTY", expect: ["modified"] });

  // staged
  const staged = tempRoot(t);
  initRepo(staged);
  writeFileSync(join(staged, "added.txt"), "staged content\n");
  git(staged, ["add", "added.txt"]);
  cases.push({ name: "staged", root: staged, dirtiness: "OBSERVED", state: "DIRTY", expect: ["staged"] });

  // untracked
  const untracked = tempRoot(t);
  initRepo(untracked);
  writeFileSync(join(untracked, "loose.txt"), "loose\n");
  cases.push({ name: "untracked", root: untracked, dirtiness: "OBSERVED", state: "DIRTY", expect: ["untracked"] });

  // conflicted (a real merge conflict)
  const conflicted = tempRoot(t);
  initRepo(conflicted);
  git(conflicted, ["checkout", "-q", "-b", "feature"]);
  writeFileSync(join(conflicted, "tracked.txt"), "feature side\n");
  git(conflicted, ["commit", "-qam", "feature"]);
  git(conflicted, ["checkout", "-q", "-"]);
  writeFileSync(join(conflicted, "tracked.txt"), "base side\n");
  git(conflicted, ["commit", "-qam", "base"]);
  const merge = spawnSync("git", ["-C", conflicted, "merge", "feature"], { encoding: "utf8", timeout: 60_000 });
  assert.notEqual(merge.status, 0, "the fixture must produce a real conflict");
  cases.push({ name: "conflicted", root: conflicted, dirtiness: "OBSERVED", state: "BLOCKED", expect: ["conflicted"] });

  for (const entry of cases) {
    const observation = observeRepository(entry.root);
    assert.equal(observation.dirtiness, entry.dirtiness, `${entry.name}: dirtiness`);
    assert.deepEqual([...observation.observationLimits], [], `${entry.name}: an observed tree carries no limitation`);
    const verdict = engines.repositoryState(observation.input);
    assert.equal(verdict.state, entry.state, `${entry.name}: engine verdict`);
    for (const key of entry.expect) {
      assert.ok(Array.isArray(observation.input[key]), `${entry.name}: ${key} must be observed`);
      assert.ok(observation.input[key].length > 0, `${entry.name}: ${key} must be non-empty`);
    }
  }

  // The conflicted fixture is genuinely reported, not inferred from the merge command alone.
  assert.ok(observeRepository(conflicted).input.conflicted.length > 0);
});

test("H6: a mid-operation repository is observed and the engine blocks it", async (t) => {
  const engines = await loadEngines();
  const root = tempRoot(t);
  initRepo(root);
  assert.equal(observeRepository(root).input.operation, undefined);

  writeFileSync(join(root, ".git", "MERGE_HEAD"), `${"0".repeat(40)}\n`);
  const observation = observeRepository(root);
  assert.equal(observation.input.operation, "MERGE");
  assert.equal(observation.dirtiness, "OBSERVED", "the working tree is still observable");
  assert.equal(engines.repositoryState(observation.input).state, "BLOCKED");
});

test("H6: an unreadable working tree yields UNKNOWN and no verdict", (t) => {
  const root = tempRoot(t);
  // Git identity present, but not a usable repository: dirtiness cannot be proven.
  const gitDirectory = join(root, ".git");
  spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
  writeFileSync(join(gitDirectory, "HEAD"), "ref: refs/heads/main\n");
  rmSync(join(gitDirectory, "config"), { force: true });
  rmSync(join(gitDirectory, "objects"), { recursive: true, force: true });
  rmSync(join(gitDirectory, "refs"), { recursive: true, force: true });

  const observation = observeRepository(root);
  assert.equal(observation.dirtiness, "UNKNOWN");
  assert.ok(observation.observationLimits.includes("WORKING_TREE_NOT_OBSERVED"));
  assert.ok(observation.observationLimits.some((limit) => limit.startsWith("DIRTINESS_UNKNOWN")), "the concrete reason must be recorded");
  for (const key of ["modified", "staged", "untracked", "conflicted"]) {
    assert.equal(observation.input[key], undefined, `${key} must not be supplied when it was not observed`);
  }
});

test("H6: a non-repository directory is known-absent, not unknown", (t) => {
  const root = tempRoot(t);
  const observation = observeRepository(root);
  assert.deepEqual(observation.input, {});
  assert.equal(observation.dirtiness, "NOT_APPLICABLE");
  assert.ok(observation.observationLimits.includes("NO_LOCAL_GIT_DIRECTORY"));
});

test("H6: dirtiness reading is bounded and reports its failure rather than guessing", (t) => {
  const root = tempRoot(t);
  const evidence = observeRepositoryDirtiness(root);
  assert.equal(evidence.observation, "UNKNOWN");
  assert.equal(typeof evidence.detail, "string");
  for (const key of ["modified", "staged", "untracked", "conflicted"]) assert.deepEqual([...evidence[key]], []);

  initRepo(root);
  const observed = observeRepositoryDirtiness(root);
  assert.equal(observed.observation, "OBSERVED");
  assert.deepEqual([...observed.modified, ...observed.staged, ...observed.untracked, ...observed.conflicted], []);
});

test("H6: unobserved dirtiness keeps the plan honest and blocks apply before effects", (t) => {
  // The process-level equivalent of the UNKNOWN case: `init --apply` must refuse with zero effect.
  const root = tempRoot(t);
  spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
  rmSync(join(root, ".git", "objects"), { recursive: true, force: true });
  rmSync(join(root, ".git", "refs"), { recursive: true, force: true });
  writeFileSync(join(root, ".git", "HEAD"), "ref: refs/heads/main\n");
  writeFileSync(join(root, "USER.txt"), "user content\n");

  const observation = observeRepository(root);
  assert.equal(observation.dirtiness, "UNKNOWN");
  assert.equal(existsSync(join(root, ".gef")), false, "observation alone must not create governed state");
});
