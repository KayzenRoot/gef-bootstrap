import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  EnvironmentObservationSession,
  GitObservationSession,
  HostedProfileObservationSession,
  ProjectPreflightSession,
  ToolObservationSession,
  compactEnvironmentEvidence,
  createMutableCounters,
} from "../packages/preflight/dist/index.js";

const P1 = "550e8400-e29b-41d4-a716-446655440000";
const digest = { algorithm: "sha256-test", digest: (text) => createHash("sha256").update(text).digest("hex") };
const locator = { transportIndependentHost: "github.com", normalizedRepositoryPath: "Owner/Repo" };
const remoteBinding = { bindingKind: "REMOTE", normalizedLocator: locator, stableProviderId: "repo-1" };
const validConfig = (repositoryBinding = remoteBinding) => JSON.stringify({ schemaVersion: "1.0", configVersion: "1.0", adopted: true, projectId: P1, ...(repositoryBinding ? { repositoryBinding } : {}) });
const configReader = (text) => ({ readText: async () => text });
const remoteResolution = { projection: { schemaVersion: 1, state: "RESOLVED_REMOTE_BOUND", bindingKind: "REMOTE", normalizedLocator: locator, stableProviderId: "repo-1", normalizationVersion: 1 }, canonicalBindingPersisted: true, candidateCount: 1, diagnostics: [] };

function gitPort(overrides = {}) {
  const calls = { repository: 0, head: 0, status: 0, remotes: 0 };
  const port = {
    observeRepository: async () => { calls.repository += 1; return { presence: "PRESENT", root: "/repo" }; },
    observeHead: async () => { calls.head += 1; return { state: "BRANCH", branch: "main", headOid: "abc123" }; },
    observeStatus: async (_root, detail) => { calls.status += 1; return { summary: { staged: 0, unstaged: 1, untracked: 0, conflicted: 0 }, ...(detail === "PATHS" ? { paths: ["src/a.ts"] } : {}) }; },
    observeRemotes: async () => { calls.remotes += 1; return { remotes: [{ alias: "origin", url: "https://github.com/Owner/Repo.git" }] }; },
    ...overrides,
  };
  return { port, calls };
}

function providerPort(overrides = {}) {
  let calls = 0;
  const port = {
    observeRepository: async ({ locator: expected, capabilities }) => {
      calls += 1;
      return { locator: expected, stableRepositoryId: "repo-1", authenticationStatus: "AVAILABLE", capabilities: capabilities.map((capability) => ({ capability, status: "AVAILABLE" })), extra: "ignored" };
    },
    ...overrides,
  };
  return { port, calls: () => calls };
}

function toolPort(overrides = {}) {
  const calls = { resolve: 0, probe: 0, specs: [] };
  const port = {
    resolve: async (descriptor) => { calls.resolve += 1; return { status: "FOUND", executable: descriptor.resolution.executable, executableIdentity: `tool:${descriptor.toolId}` }; },
    probe: async (spec) => { calls.probe += 1; calls.specs.push(spec); return { status: "SUCCEEDED", exitCode: 0, stdout: "tool 1.2.3\n", stderr: "" }; },
    ...overrides,
  };
  return { port, calls };
}

const toolRequest = (toolId = "node", required = true) => ({
  descriptor: { toolId, source: "BUILTIN", resolution: { kind: "PATH_NAME", executable: toolId }, versionProbe: { argv: ["--version"], timeoutMs: 1000, maxOutputBytes: 1024 } },
  requireVersion: true,
  required,
  compatibility: { classify: () => "COMPATIBLE" },
});

test("environment discovery is explicit, allowlisted and compact evidence excludes values/cwd", () => {
  const reads = [];
  const counters = createMutableCounters();
  const session = new EnvironmentObservationSession({
    platform: () => "linux",
    architecture: () => "x64",
    runtime: () => ({ family: "node", version: "24.1.0" }),
    workingDirectory: () => "/private/work/repo",
    readEnvironment: (key) => { reads.push(key); return key === "HOME" ? "/home/user" : "hidden"; },
  }, counters);
  assert.deepEqual(reads, []);
  const result = session.observe({ facts: ["platform", "runtime", "workingDirectory"], environmentKeys: ["HOME", "ACCESS_TOKEN"], allowedEnvironmentKeys: ["HOME"] });
  assert.deepEqual(reads, ["HOME"]);
  assert.equal(result.platform.value, "linux");
  assert.equal(result.requestedEnvironment.ACCESS_TOKEN.status, "POLICY_REDACTED");
  const evidence = JSON.stringify(compactEnvironmentEvidence(result));
  assert.equal(evidence.includes("/private/work/repo"), false);
  assert.equal(evidence.includes("/home/user"), false);
  assert.equal(evidence.includes("hidden"), false);
});

test("unknown platform remains explicit and per-fact environment cache is reusable", () => {
  let platformReads = 0;
  const counters = createMutableCounters();
  const session = new EnvironmentObservationSession({
    platform: () => { platformReads += 1; return "future-os"; }, architecture: () => "x64", runtime: () => ({ family: "node", version: "24.1.0" }), workingDirectory: () => "/repo", readEnvironment: () => undefined,
  }, counters);
  assert.equal(session.observe({ facts: ["platform"] }).platform.status, "UNKNOWN");
  session.observe({ facts: ["platform"] });
  assert.equal(platformReads, 1);
  session.invalidate({ facts: ["platform"] });
  session.observe({ facts: ["platform"] });
  assert.equal(platformReads, 2);
});

test("Git discovery requests only selected facts and supports targeted cache invalidation", async () => {
  const { port, calls } = gitPort();
  const counters = createMutableCounters();
  const session = new GitObservationSession(port, counters);
  const first = await session.observe({ startingDirectory: "/repo", facts: ["repository", "head"] });
  assert.equal(first.head.headOid, "abc123");
  assert.deepEqual(calls, { repository: 1, head: 1, status: 0, remotes: 0 });
  await session.observe({ startingDirectory: "/repo", facts: ["repository", "head"] });
  assert.deepEqual(calls, { repository: 1, head: 1, status: 0, remotes: 0 });
  session.invalidate({ repositoryRoot: "/repo", facts: ["head"] });
  await session.observe({ startingDirectory: "/repo", facts: ["repository", "head"] });
  assert.deepEqual(calls, { repository: 1, head: 2, status: 0, remotes: 0 });
});

test("Git status is summary-first and stronger cached detail is narrowed for weaker consumers", async () => {
  const { port, calls } = gitPort();
  const session = new GitObservationSession(port, createMutableCounters());
  const summary = await session.observe({ startingDirectory: "/repo", facts: ["status"], statusDetail: "SUMMARY" });
  assert.equal(summary.status.paths, undefined);
  const detailed = await session.observe({ startingDirectory: "/repo", facts: ["status"], statusDetail: "PATHS" });
  assert.deepEqual(detailed.status.paths, ["src/a.ts"]);
  const narrowed = await session.observe({ startingDirectory: "/repo", facts: ["status"], statusDetail: "SUMMARY" });
  assert.equal(narrowed.status.paths, undefined);
  assert.equal(calls.status, 2);
});

test("missing repository short-circuits downstream Git observations", async () => {
  const { port, calls } = gitPort({ observeRepository: async () => { calls.repository += 1; return { presence: "ABSENT" }; } });
  const counters = createMutableCounters();
  const result = await new GitObservationSession(port, counters).observe({ startingDirectory: "/repo", facts: ["head", "status", "remotes"] });
  assert.equal(result.repository.presence, "ABSENT");
  assert.deepEqual(calls, { repository: 1, head: 0, status: 0, remotes: 0 });
  assert.equal(counters.skippedByPrerequisite, 3);
});

test("hosted discovery makes no call for optional local-only state", async () => {
  const { port, calls } = providerPort();
  const session = new HostedProfileObservationSession(port, createMutableCounters());
  const local = { projection: { schemaVersion: 1, state: "RESOLVED_LOCAL_ONLY", bindingKind: "LOCAL", localBindingId: "local-1", normalizationVersion: 1 }, canonicalBindingPersisted: true, candidateCount: 0, diagnostics: [] };
  const result = await session.observe({ profileId: "github", expectedHost: "github.com", repository: local, required: false });
  assert.equal(result.readiness, "NOT_REQUIRED");
  assert.equal(calls(), 0);
});

test("hosted discovery is exact-target, request-scoped and detects provider identity conflicts", async () => {
  const { port, calls } = providerPort();
  const session = new HostedProfileObservationSession(port, createMutableCounters());
  const result = await session.observe({ profileId: "github", expectedHost: "github.com", repository: remoteResolution, capabilities: ["pull_request_write"] });
  assert.equal(result.readiness, "READY");
  assert.deepEqual(result.repository.capabilities.map((item) => item.capability), ["pull_request_write"]);
  assert.equal(calls(), 1);
  const conflictPort = providerPort({ observeRepository: async ({ locator: expected, capabilities }) => ({ locator: expected, stableRepositoryId: "repo-other", authenticationStatus: "AVAILABLE", capabilities: capabilities.map((capability) => ({ capability, status: "AVAILABLE" })) }) });
  const conflict = await new HostedProfileObservationSession(conflictPort.port, createMutableCounters()).observe({ profileId: "github", expectedHost: "github.com", repository: remoteResolution, capabilities: [] });
  assert.equal(conflict.readiness, "BLOCKED_IDENTITY");
});

test("tool observation rejects repository-selected path names before resolution", async () => {
  const { port, calls } = toolPort();
  const result = await new ToolObservationSession(port, createMutableCounters()).observe({ descriptor: { toolId: "bad", source: "PROFILE", resolution: { kind: "PATH_NAME", executable: "./node_modules/.bin/bad" } }, required: true });
  assert.equal(result.presence, "AMBIGUOUS");
  assert.equal(calls.resolve, 0);
  assert.equal(calls.probe, 0);
});

test("tool version probe is bounded, shell-free by shape, cached and compatibility is injected", async () => {
  const { port, calls } = toolPort();
  const session = new ToolObservationSession(port, createMutableCounters());
  const request = toolRequest("node");
  const first = await session.observe(request);
  assert.equal(first.observedVersion, "1.2.3");
  assert.equal(first.compatibility, "COMPATIBLE");
  assert.deepEqual(calls.specs[0].argv, ["--version"]);
  assert.equal(calls.specs[0].timeoutMs, 1000);
  assert.equal(calls.specs[0].maxOutputBytes, 1024);
  assert.deepEqual(calls.specs[0].env, {});
  assert.equal("shell" in calls.specs[0], false);
  await session.observe({ ...request, compatibility: { classify: () => "INCOMPATIBLE" } });
  assert.equal(calls.resolve, 1);
  assert.equal(calls.probe, 1);
  const second = await session.observe({ ...request, compatibility: { classify: () => "INCOMPATIBLE" } });
  assert.equal(second.compatibility, "INCOMPATIBLE");
});

test("project preflight cheap config blocker avoids provider, tool and environment work", async () => {
  const provider = providerPort();
  const tool = toolPort();
  let environmentReads = 0;
  const session = new ProjectPreflightSession({
    digest,
    configReader: configReader(null),
    environment: { platform: () => { environmentReads += 1; return "linux"; }, architecture: () => "x64", runtime: () => ({ family: "node", version: "24.1.0" }), workingDirectory: () => "/repo", readEnvironment: () => undefined },
    hosted: provider.port,
    tools: tool.port,
  });
  const result = await session.run({ projectRoot: "/repo", requireProjectConfig: true, environment: { facts: ["platform"] }, hosted: { profileId: "github", expectedHost: "github.com", required: true }, tools: [toolRequest()] });
  assert.equal(result.readiness, "BLOCKED_PRECONDITION");
  assert.equal(provider.calls(), 0);
  assert.equal(tool.calls.resolve, 0);
  assert.equal(environmentReads, 0);
  assert.ok(result.counters.skippedByPrerequisite >= 3);
});

test("identity bootstrap blocker prevents expensive discovery", async () => {
  const provider = providerPort();
  const tool = toolPort();
  const git = gitPort();
  const session = new ProjectPreflightSession({ digest, configReader: configReader(JSON.stringify({ schemaVersion: "1.0", configVersion: "1.0", adopted: true })), git: git.port, hosted: provider.port, tools: tool.port });
  const result = await session.run({ projectRoot: "/repo", identityBindingStrength: "PROJECT_ONLY", hosted: { profileId: "github", expectedHost: "github.com" }, tools: [toolRequest()] });
  assert.equal(result.readiness, "BLOCKED_IDENTITY");
  assert.equal(git.calls.repository, 0);
  assert.equal(provider.calls(), 0);
  assert.equal(tool.calls.resolve, 0);
});

test("brownfield read-only repository preflight does not require project config or hosted provider", async () => {
  const git = gitPort();
  const provider = providerPort();
  const session = new ProjectPreflightSession({ digest, git: git.port, hosted: provider.port });
  const result = await session.run({ projectRoot: "/repo", mode: "EXISTING_PROJECT", requireRepository: true, gitFacts: ["head"] });
  assert.equal(result.readiness, "READY");
  assert.equal(result.projectConfig, undefined);
  assert.equal(result.identity, undefined);
  assert.equal(provider.calls(), 0);
});

test("stronger identity request expands discovery without rereading valid config", async () => {
  let configReads = 0;
  const git = gitPort({ observeRepository: async () => { git.calls.repository += 1; return { presence: "ABSENT" }; } });
  const session = new ProjectPreflightSession({ digest, configReader: { readText: async () => { configReads += 1; return validConfig(null); } }, git: git.port });
  const projectOnly = await session.run({ projectRoot: "/repo", identityBindingStrength: "PROJECT_ONLY" });
  assert.equal(projectOnly.readiness, "READY");
  assert.equal(git.calls.repository, 0);
  const identityState = await session.run({ projectRoot: "/repo", identityBindingStrength: "IDENTITY_STATE" });
  assert.equal(identityState.readiness, "READY");
  assert.equal(configReads, 1);
  assert.equal(git.calls.repository, 1);
});

test("project preflight composes exact remote identity and hosted capability only when requested", async () => {
  const git = gitPort();
  const provider = providerPort();
  const session = new ProjectPreflightSession({ digest, configReader: configReader(validConfig()), git: git.port, hosted: provider.port });
  const local = await session.run({ projectRoot: "/repo", identityBindingStrength: "REPOSITORY_BOUND", gitFacts: ["head"] });
  assert.equal(local.readiness, "READY");
  assert.equal(provider.calls(), 0);
  const hosted = await session.run({ projectRoot: "/repo", identityBindingStrength: "REPOSITORY_BOUND", hosted: { profileId: "github", expectedHost: "github.com", capabilities: ["pull_request_write"] } });
  assert.equal(hosted.readiness, "READY");
  assert.equal(provider.calls(), 1);
  assert.equal(hosted.repositoryProjection.stableProviderId, "repo-1");
});

test("provider and independent tool resolution begin concurrently after target prerequisites", async () => {
  let providerStarted = false;
  let toolStarted = false;
  let release;
  const ready = new Promise((resolve) => { release = resolve; });
  const maybeRelease = () => { if (providerStarted && toolStarted) release(); };
  const provider = providerPort({ observeRepository: async ({ locator: expected, capabilities }) => { providerStarted = true; maybeRelease(); await ready; return { locator: expected, stableRepositoryId: "repo-1", authenticationStatus: "AVAILABLE", capabilities: capabilities.map((capability) => ({ capability, status: "AVAILABLE" })) }; } });
  const tool = toolPort({ resolve: async (descriptor) => { toolStarted = true; tool.calls.resolve += 1; maybeRelease(); await ready; return { status: "FOUND", executable: descriptor.resolution.executable }; } });
  const git = gitPort();
  const session = new ProjectPreflightSession({ digest, configReader: configReader(validConfig()), git: git.port, hosted: provider.port, tools: tool.port });
  const result = await Promise.race([
    session.run({ projectRoot: "/repo", identityBindingStrength: "REPOSITORY_BOUND", hosted: { profileId: "github", expectedHost: "github.com" }, tools: [{ ...toolRequest(), requireVersion: false }] }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("parallel observation did not start")), 250)),
  ]);
  assert.equal(providerStarted, true);
  assert.equal(toolStarted, true);
  assert.equal(result.readiness, "READY");
});

test("targeted invalidation re-observes only invalidated Git fact", async () => {
  const git = gitPort();
  const tool = toolPort();
  let platformReads = 0;
  const session = new ProjectPreflightSession({
    digest,
    git: git.port,
    tools: tool.port,
    environment: { platform: () => { platformReads += 1; return "linux"; }, architecture: () => "x64", runtime: () => ({ family: "node", version: "24.1.0" }), workingDirectory: () => "/repo", readEnvironment: () => undefined },
  });
  const request = { projectRoot: "/repo", requireRepository: true, gitFacts: ["head"], environment: { facts: ["platform"] }, tools: [{ ...toolRequest(), requireVersion: false }] };
  await session.run(request);
  assert.equal(platformReads, 1);
  assert.equal(git.calls.head, 1);
  assert.equal(tool.calls.resolve, 1);
  session.invalidate({ repositoryRoot: "/repo", gitFacts: ["head"] });
  await session.run(request);
  assert.equal(git.calls.head, 2);
  assert.equal(platformReads, 1);
  assert.equal(tool.calls.resolve, 1);
});

test("expected-state mismatch becomes targeted stale block", async () => {
  const git = gitPort();
  const session = new ProjectPreflightSession({ digest, git: git.port });
  const result = await session.run({ projectRoot: "/repo", requireRepository: true, gitFacts: ["head"], expectedBindings: [{ kind: "GIT_HEAD", value: "different" }] });
  assert.equal(result.readiness, "BLOCKED_STALE");
  assert.equal(result.gaps.some((item) => item.code.includes("expected_binding_stale:GIT_HEAD")), true);
});

test("controlled identical requirements produce stable requirement fingerprint", async () => {
  const git = gitPort();
  const session = new ProjectPreflightSession({ digest, git: git.port });
  const request = { projectRoot: "/repo", requireRepository: true, gitFacts: ["head"] };
  const a = await session.run(request);
  const b = await session.run({ gitFacts: ["head"], requireRepository: true, projectRoot: "/repo" });
  assert.equal(a.requirementFingerprint, b.requirementFingerprint);
  assert.equal(a.readiness, b.readiness);
});
