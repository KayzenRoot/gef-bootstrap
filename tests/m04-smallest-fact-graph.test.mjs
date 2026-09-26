import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { ProjectPreflightSession } from "../packages/preflight/dist/index.js";

const digest = { algorithm: "sha256-test", digest: (text) => createHash("sha256").update(text).digest("hex") };

test("requireRepository alone observes repository presence without reading remotes", async () => {
  const calls = { repository: 0, head: 0, status: 0, remotes: 0 };
  const git = {
    observeRepository: async () => { calls.repository += 1; return { state: "WORKTREE", root: "/repo" }; },
    observeHead: async () => { calls.head += 1; return { state: "ATTACHED", branch: "main", headOid: "abc123" }; },
    observeStatus: async () => { calls.status += 1; return { summary: { staged: 0, unstaged: 0, untracked: 0, conflicted: 0 } }; },
    observeRemotes: async () => { calls.remotes += 1; return { remotes: [] }; },
  };

  const result = await new ProjectPreflightSession({ digest, git }).run({
    projectRoot: "/repo",
    requireRepository: true,
  });

  assert.equal(result.readiness, "READY");
  assert.deepEqual(calls, { repository: 1, head: 0, status: 0, remotes: 0 });
  assert.equal(result.repositoryResolution, undefined);
  assert.equal(result.repositoryProjection, undefined);
});
