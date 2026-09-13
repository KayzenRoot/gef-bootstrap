import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { EnvironmentObservationSession, GitObservationSession, ProjectPreflightSession, createMutableCounters } from "../packages/preflight/dist/index.js";

const digest = { algorithm: "sha256-test", digest: (text) => createHash("sha256").update(text).digest("hex") };

test("project preflight snapshot excludes config document cwd env values Git root and tool executable identity", async () => {
  const configMarker = "CONFIG_CONTEXT_MARKER";
  const environmentMarker = "ENV_CONTEXT_MARKER";
  const cwdMarker = "/local/CWD_CONTEXT_MARKER";
  const rootMarker = "/local/GIT_ROOT_CONTEXT_MARKER";
  const toolMarker = "/local/TOOL_EXECUTABLE_CONTEXT_MARKER";
  const session = new ProjectPreflightSession({
    digest,
    configReader: { readText: async () => JSON.stringify({ schemaVersion: "1.0", configVersion: "1.0", adopted: true, extensions: { note: configMarker } }) },
    environment: {
      platform: () => "linux",
      architecture: () => "x64",
      runtime: () => ({ family: "node", version: "24.1.0" }),
      workingDirectory: () => cwdMarker,
      readEnvironment: () => environmentMarker,
    },
    git: {
      observeRepository: async () => ({ state: "WORKTREE", root: rootMarker }),
      observeHead: async () => ({ state: "ATTACHED", branch: "main", headOid: "abc123" }),
      observeStatus: async () => ({ summary: { staged: 0, unstaged: 0, untracked: 0, conflicted: 0 } }),
      observeRemotes: async () => ({ remotes: [] }),
    },
    tools: {
      resolve: async () => ({ status: "FOUND", executable: "node", executableIdentity: toolMarker }),
      probe: async () => ({ status: "SUCCEEDED", exitCode: 0, stdout: "", stderr: "" }),
    },
  });

  const result = await session.run({
    projectRoot: rootMarker,
    requireProjectConfig: true,
    requireRepository: true,
    environment: { facts: ["workingDirectory", "platform"], environmentKeys: ["DISPLAY_NAME"], allowedEnvironmentKeys: ["DISPLAY_NAME"] },
    tools: [{ descriptor: { toolId: "node", source: "BUILTIN", resolution: { kind: "PATH_NAME", executable: "node" } }, required: false }],
  });

  assert.equal(result.readiness, "READY");
  assert.equal("document" in result.projectConfig, false);
  assert.equal(result.environment.requestedEnvironment.DISPLAY_NAME.status, "OBSERVED");
  assert.equal(result.git.repository.state, "WORKTREE");
  assert.equal("root" in result.git.repository, false);
  assert.equal("executableIdentity" in result.tools[0], false);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(configMarker), false);
  assert.equal(serialized.includes(environmentMarker), false);
  assert.equal(serialized.includes(cwdMarker), false);
  assert.equal(serialized.includes(rootMarker), false);
  assert.equal(serialized.includes(toolMarker), false);
});

test("environment platform fixtures preserve Windows Linux and macOS observations", () => {
  for (const platform of ["win32", "linux", "darwin"]) {
    const session = new EnvironmentObservationSession({
      platform: () => platform,
      architecture: () => "x64",
      runtime: () => ({ family: "node", version: "24.1.0" }),
      workingDirectory: () => "/repo",
      readEnvironment: () => undefined,
    }, createMutableCounters());
    assert.deepEqual(session.observe({ facts: ["platform"] }).platform, { status: "OBSERVED", value: platform });
  }
});

test("Git HEAD keeps attached detached unborn unavailable and invalid states distinct", async () => {
  for (const state of ["ATTACHED", "DETACHED", "UNBORN", "UNAVAILABLE", "INVALID_OR_AMBIGUOUS"]) {
    const session = new GitObservationSession({
      observeRepository: async () => ({ state: "WORKTREE", root: "/repo" }),
      observeHead: async () => ({ state, ...(state === "ATTACHED" ? { branch: "main", headOid: "abc123" } : {}) }),
      observeStatus: async () => ({ summary: { staged: 0, unstaged: 0, untracked: 0, conflicted: 0 } }),
      observeRemotes: async () => ({ remotes: [] }),
    }, createMutableCounters());
    const result = await session.observe({ startingDirectory: "/repo", facts: ["head"] });
    assert.equal(result.head.state, state);
  }
});
