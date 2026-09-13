import {
  loadProjectConfig,
  resolveProjectConfigPaths,
  type ConfigReadPort,
} from "@gef-bootstrap/config";
import {
  assessProjectIdentity,
  bindingStrengthSatisfies,
  canonicalIdentityStringify,
  parsePersistedRepositoryBinding,
  repositoryResolutionSatisfiesBound,
  resolveRepositoryIdentity,
  type BindingStrength,
  type PersistedRepositoryBinding,
  type ProjectIdentityAssessment,
  type RepositoryResolution,
} from "@gef-bootstrap/project-identity";
import { createMutableCounters, fingerprintRequirement, snapshotCounters, stablePreflightStringify } from "./canonical.js";
import { EnvironmentObservationSession } from "./environment.js";
import { GitObservationSession } from "./git.js";
import { HostedProfileObservationSession } from "./provider.js";
import { ToolObservationSession } from "./toolchain.js";
import type {
  EnvironmentObservationPort,
  ExpectedStateBinding,
  GitFactFamily,
  GitObservation,
  GitObservationPort,
  HostedProfileObservation,
  HostedProfilePort,
  MutablePreflightCounters,
  PreflightGap,
  ProjectConfigObservation,
  ProjectPreflightReadiness,
  ProjectPreflightRequirements,
  ProjectPreflightSnapshot,
  RequirementDigestPort,
  ToolObservation,
  ToolObservationPort,
} from "./types.js";

export interface ProjectPreflightSessionOptions {
  readonly digest: RequirementDigestPort;
  readonly configReader?: ConfigReadPort;
  readonly environment?: EnvironmentObservationPort;
  readonly git?: GitObservationPort;
  readonly hosted?: HostedProfilePort;
  readonly tools?: ToolObservationPort;
}

function gap(code: string, owner: PreflightGap["owner"], blocking: boolean): PreflightGap { return { code, owner, blocking }; }

function readinessForGaps(gaps: readonly PreflightGap[]): ProjectPreflightReadiness {
  const blocking = gaps.find((item) => item.blocking);
  if (!blocking) return gaps.length === 0 ? "READY" : "READY_WITH_GAPS";
  if (blocking.code.includes("stale") || blocking.code.includes("expected_binding")) return "BLOCKED_STALE";
  if (blocking.owner === "M03") return "BLOCKED_IDENTITY";
  if (blocking.owner === "M29") return "BLOCKED_REPOSITORY";
  if (blocking.owner === "M30") return "BLOCKED_PROVIDER";
  if (blocking.owner === "M38" || blocking.owner === "M51") return "BLOCKED_TOOLCHAIN";
  if (blocking.owner === "M16") return "BLOCKED_POLICY";
  return "BLOCKED_PRECONDITION";
}

function actualBindingStrength(identity: ProjectIdentityAssessment | undefined, repository: RepositoryResolution | undefined): BindingStrength | null {
  if (identity?.state !== "ADOPTED_VALID" || !identity.projectId) return null;
  if (!repository) return "PROJECT_ONLY";
  return repositoryResolutionSatisfiesBound(repository) ? "REPOSITORY_BOUND" : "IDENTITY_STATE";
}

function mergeGaps(target: PreflightGap[], source: readonly PreflightGap[], forceBlocking = false): void {
  for (const item of source) target.push(forceBlocking && !item.blocking ? { ...item, blocking: true } : item);
}

function dedupeGaps(gaps: readonly PreflightGap[]): readonly PreflightGap[] {
  const seen = new Set<string>();
  const out: PreflightGap[] = [];
  for (const item of gaps) {
    const key = `${item.owner}|${item.code}|${item.blocking ? 1 : 0}`;
    if (!seen.has(key)) { seen.add(key); out.push(item); }
  }
  return Object.freeze(out);
}

function bindingMap(bindings: readonly ExpectedStateBinding[]): Map<string, string> {
  return new Map(bindings.map((item) => [item.kind, item.value]));
}

export class ProjectPreflightSession {
  readonly #digest: RequirementDigestPort;
  readonly #configReader?: ConfigReadPort;
  readonly #counters: MutablePreflightCounters = createMutableCounters();
  readonly #environment?: EnvironmentObservationSession;
  readonly #git?: GitObservationSession;
  readonly #hosted?: HostedProfileObservationSession;
  readonly #tools?: ToolObservationSession;
  readonly #configCache = new Map<string, ProjectConfigObservation>();

  constructor(options: ProjectPreflightSessionOptions) {
    this.#digest = options.digest;
    this.#configReader = options.configReader;
    if (options.environment) this.#environment = new EnvironmentObservationSession(options.environment, this.#counters);
    if (options.git) this.#git = new GitObservationSession(options.git, this.#counters);
    if (options.hosted) this.#hosted = new HostedProfileObservationSession(options.hosted, this.#counters);
    if (options.tools) this.#tools = new ToolObservationSession(options.tools, this.#counters);
  }

  async #projectConfig(projectRoot: string): Promise<ProjectConfigObservation | undefined> {
    const cached = this.#configCache.get(projectRoot);
    if (cached) { this.#counters.cacheHits += 1; return cached; }
    if (!this.#configReader) return undefined;
    const paths = resolveProjectConfigPaths(projectRoot);
    const loaded = await loadProjectConfig(this.#configReader, paths.configPath);
    const observation: ProjectConfigObservation = loaded.value
      ? { status: "VALID", document: loaded.value, fingerprint: loaded.fingerprint, diagnostics: loaded.diagnostics }
      : loaded.diagnostics.some((item) => item.severity === "ERROR")
        ? { status: "INVALID", fingerprint: loaded.fingerprint, diagnostics: loaded.diagnostics }
        : { status: "MISSING", fingerprint: loaded.fingerprint, diagnostics: loaded.diagnostics };
    this.#configCache.set(projectRoot, observation);
    return observation;
  }

  #finish(input: Omit<ProjectPreflightSnapshot, "schemaVersion" | "counters" | "gaps" | "readiness"> & { readonly gaps: readonly PreflightGap[] }): ProjectPreflightSnapshot {
    const gaps = dedupeGaps(input.gaps);
    return Object.freeze({ schemaVersion: 1, ...input, gaps, readiness: readinessForGaps(gaps), counters: snapshotCounters(this.#counters) });
  }

  async run(requirements: ProjectPreflightRequirements): Promise<ProjectPreflightSnapshot> {
    const requirementFingerprint = fingerprintRequirement(requirements, this.#digest);
    const mode = requirements.mode ?? "MODE_UNRESOLVED";
    const gaps: PreflightGap[] = [];
    const tools: ToolObservation[] = [];
    const generatedBindings: ExpectedStateBinding[] = [];
    const needIdentity = requirements.identityBindingStrength !== undefined;
    const needConfig = requirements.requireProjectConfig === true || needIdentity;
    let projectConfig: ProjectConfigObservation | undefined;
    let identity: ProjectIdentityAssessment | undefined;
    let git: GitObservation | undefined;
    let repositoryResolution: RepositoryResolution | undefined;
    let hosted: HostedProfileObservation | undefined;

    if (needConfig) {
      projectConfig = await this.#projectConfig(requirements.projectRoot);
      if (!projectConfig) gaps.push(gap("gef.preflight.config.reader_unavailable", "M02", true));
      else {
        generatedBindings.push({ kind: "PROJECT_CONFIG", value: projectConfig.fingerprint });
        if (projectConfig.status === "MISSING") gaps.push(gap("gef.preflight.config.project_missing", "M02", requirements.requireProjectConfig === true || needIdentity));
        if (projectConfig.status === "INVALID") gaps.push(gap("gef.preflight.config.project_invalid", "M02", true));
      }
      if (gaps.some((item) => item.blocking) && !requirements.diagnosticMode) {
        this.#counters.skippedByPrerequisite += (requirements.hosted ? 1 : 0) + (requirements.tools?.length ?? 0);
        return this.#finish({ requirementFingerprint, mode, ...(projectConfig ? { projectConfig } : {}), tools, expectedStateBindings: generatedBindings, gaps });
      }
    }

    if (needIdentity) {
      identity = assessProjectIdentity(projectConfig?.document);
      if (identity.projectId) generatedBindings.push({ kind: "PROJECT_ID", value: identity.projectId });
      if (identity.state !== "ADOPTED_VALID") gaps.push(gap(identity.reasonCode ?? `gef.preflight.identity.${identity.state.toLowerCase()}`, "M03", true));
      if (gaps.some((item) => item.blocking) && !requirements.diagnosticMode) {
        this.#counters.skippedByPrerequisite += (requirements.hosted ? 1 : 0) + (requirements.tools?.length ?? 0);
        return this.#finish({ requirementFingerprint, mode, ...(projectConfig ? { projectConfig } : {}), identity, tools, expectedStateBindings: generatedBindings, gaps });
      }
    }

    const requestedGitFacts = new Set<GitFactFamily>(requirements.gitFacts ?? []);
    const needRepositoryState = requirements.requireRepository === true || needIdentity && requirements.identityBindingStrength !== "PROJECT_ONLY" || requirements.hosted !== undefined;
    if (needRepositoryState) { requestedGitFacts.add("repository"); requestedGitFacts.add("remotes"); }
    if (requestedGitFacts.size > 0) {
      if (!this.#git) gaps.push(gap("gef.preflight.git.port_unavailable", "M29", true));
      else {
        git = await this.#git.observe({ startingDirectory: requirements.projectRoot, facts: [...requestedGitFacts], ...(requirements.statusDetail ? { statusDetail: requirements.statusDetail } : {}) });
        const forceGitBlocking = requirements.requireRepository === true || (requirements.gitFacts?.length ?? 0) > 0 || needRepositoryState;
        mergeGaps(gaps, git.gaps, forceGitBlocking);
        if (git.head) generatedBindings.push({ kind: "GIT_HEAD", value: stablePreflightStringify(git.head) });
        if (git.status) generatedBindings.push({ kind: "GIT_STATUS", value: stablePreflightStringify(git.status.summary) });

        const repositoryPresent = git.repository?.presence === "PRESENT";
        let persistedBinding: PersistedRepositoryBinding | undefined;
        if (projectConfig?.document?.repositoryBinding !== undefined) {
          const parsed = parsePersistedRepositoryBinding(projectConfig.document.repositoryBinding);
          if (!parsed.ok) gaps.push(gap(parsed.diagnostic.code, "M03", true));
          else persistedBinding = parsed.value;
        }
        if (needRepositoryState || repositoryPresent) {
          repositoryResolution = resolveRepositoryIdentity({
            repositoryPresent,
            ...(git.remotes ? { remotes: git.remotes.remotes } : {}),
            ...(persistedBinding ? { persistedBinding } : {}),
          });
          generatedBindings.push({ kind: "REPOSITORY_IDENTITY", value: canonicalIdentityStringify(repositoryResolution.projection) });
          for (const diagnostic of repositoryResolution.diagnostics) gaps.push(gap(diagnostic.code, "M03", diagnostic.severity === "ERROR"));
        }
      }
    }

    if (requirements.requireRepository && git?.repository?.presence !== "PRESENT") gaps.push(gap("gef.preflight.git.repository_required", "M29", true));
    if (needIdentity && requirements.identityBindingStrength) {
      const actual = actualBindingStrength(identity, repositoryResolution);
      if (!actual || !bindingStrengthSatisfies(actual, requirements.identityBindingStrength)) gaps.push(gap("gef.preflight.identity.binding_strength_insufficient", "M03", true));
    }

    if (gaps.some((item) => item.blocking) && !requirements.diagnosticMode) {
      this.#counters.skippedByPrerequisite += (requirements.hosted ? 1 : 0) + (requirements.tools?.length ?? 0) + (requirements.environment ? 1 : 0);
      return this.#finish({
        requirementFingerprint,
        mode,
        ...(projectConfig ? { projectConfig } : {}),
        ...(identity ? { identity } : {}),
        ...(git ? { git } : {}),
        ...(repositoryResolution ? { repositoryResolution, repositoryProjection: repositoryResolution.projection } : {}),
        tools,
        expectedStateBindings: generatedBindings,
        gaps,
      });
    }

    let environmentResult: Awaited<ReturnType<EnvironmentObservationSession["observe"]>> | undefined;
    const parallel: Promise<void>[] = [];
    if (requirements.environment) {
      if (!this.#environment) gaps.push(gap("gef.preflight.environment.port_unavailable", "M04", true));
      else parallel.push(Promise.resolve(this.#environment.observe(requirements.environment)).then((value) => { environmentResult = value; mergeGaps(gaps, value.gaps, true); }));
    }

    if (requirements.hosted) {
      if (!repositoryResolution) gaps.push(gap("gef.preflight.provider.repository_state_required", "M30", requirements.hosted.required ?? true));
      else if (!this.#hosted) gaps.push(gap("gef.preflight.provider.port_unavailable", "M30", requirements.hosted.required ?? true));
      else parallel.push(this.#hosted.observe({ ...requirements.hosted, repository: repositoryResolution }).then((value) => { hosted = value; mergeGaps(gaps, value.gaps); }));
    }

    for (const request of requirements.tools ?? []) {
      if (!this.#tools) {
        gaps.push(gap("gef.preflight.tool.port_unavailable", "M38", request.required ?? true));
        continue;
      }
      parallel.push(this.#tools.observe(request).then((value) => { tools.push(value); mergeGaps(gaps, value.gaps); }));
    }
    await Promise.all(parallel);
    tools.sort((a, b) => a.toolId.localeCompare(b.toolId));

    if (hosted?.repository) {
      if (hosted.repository.stableRepositoryId) generatedBindings.push({ kind: "PROVIDER_REPOSITORY_ID", value: hosted.repository.stableRepositoryId });
      generatedBindings.push({ kind: "PROVIDER_CAPABILITIES", value: stablePreflightStringify(hosted.repository.capabilities) });
    }
    for (const tool of tools) generatedBindings.push({ kind: `TOOL:${tool.toolId}`, value: stablePreflightStringify({ presence: tool.presence, version: tool.observedVersion ?? null, compatibility: tool.compatibility }) });

    const currentBindings = bindingMap(generatedBindings);
    for (const expected of requirements.expectedBindings ?? []) {
      const current = currentBindings.get(expected.kind);
      if (current === undefined || current !== expected.value) gaps.push(gap(`gef.preflight.expected_binding_stale:${expected.kind}`, "M04", true));
    }

    return this.#finish({
      requirementFingerprint,
      mode,
      ...(projectConfig ? { projectConfig } : {}),
      ...(identity ? { identity } : {}),
      ...(environmentResult ? { environment: environmentResult } : {}),
      ...(git ? { git } : {}),
      ...(repositoryResolution ? { repositoryResolution, repositoryProjection: repositoryResolution.projection } : {}),
      ...(hosted ? { hosted } : {}),
      tools,
      expectedStateBindings: generatedBindings,
      gaps,
    });
  }

  invalidate(input: {
    readonly projectRoot?: string;
    readonly environmentFacts?: readonly ("platform" | "architecture" | "runtime" | "workingDirectory")[];
    readonly environmentKeys?: readonly string[];
    readonly gitFacts?: readonly GitFactFamily[];
    readonly repositoryRoot?: string;
    readonly hosted?: boolean;
    readonly toolIds?: readonly string[];
  } = {}): void {
    if (input.projectRoot) this.#configCache.delete(input.projectRoot);
    if (input.environmentFacts || input.environmentKeys) this.#environment?.invalidate({ ...(input.environmentFacts ? { facts: input.environmentFacts } : {}), ...(input.environmentKeys ? { environmentKeys: input.environmentKeys } : {}) });
    if (input.gitFacts) this.#git?.invalidate({ ...(input.projectRoot ? { startingDirectory: input.projectRoot } : {}), ...(input.repositoryRoot ? { repositoryRoot: input.repositoryRoot } : {}), facts: input.gitFacts });
    if (input.hosted) this.#hosted?.invalidate();
    for (const toolId of input.toolIds ?? []) this.#tools?.invalidate(toolId);
  }

  counters() { return snapshotCounters(this.#counters); }
}
