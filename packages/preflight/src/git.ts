import { resolveRepositoryIdentity } from "@gef-bootstrap/project-identity";
import { incrementCounter } from "./canonical.js";
import type {
  CompactGitObservation,
  GitFactFamily,
  GitHeadObservation,
  GitHeadState,
  GitObservation,
  GitObservationPort,
  GitObservationRequest,
  GitRemotesObservation,
  GitRepositoryObservation,
  GitRepositoryState,
  GitStatusObservation,
  MutablePreflightCounters,
  PreflightGap,
} from "./types.js";

const REPOSITORY_STATES = new Set<GitRepositoryState>(["NOT_REPOSITORY", "WORKTREE", "BARE_REPOSITORY", "ACCESS_BLOCKED", "UNAVAILABLE", "INVALID_OR_AMBIGUOUS"]);
const HEAD_STATES = new Set<GitHeadState>(["ATTACHED", "DETACHED", "UNBORN", "UNAVAILABLE", "INVALID_OR_AMBIGUOUS"]);
const SAFE_REASON = /^[A-Za-z0-9._:-]{1,256}$/;
const SAFE_REMOTE_ALIAS = /^[^\u0000-\u001f\u007f]{1,128}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeReason(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_REASON.test(value) ? value : undefined;
}

function safeLocalPath(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 4096 && !/[\u0000\r\n]/.test(value);
}

function normalizeRepository(value: unknown): GitRepositoryObservation {
  if (!isRecord(value) || typeof value.state !== "string" || !REPOSITORY_STATES.has(value.state as GitRepositoryState)) {
    return { state: "INVALID_OR_AMBIGUOUS", reasonCode: "gef.preflight.git.repository_observation_invalid" };
  }
  const state = value.state as GitRepositoryState;
  const root = value.root;
  const reasonCode = safeReason(value.reasonCode);
  if (root !== undefined && !safeLocalPath(root)) return { state: "INVALID_OR_AMBIGUOUS", reasonCode: "gef.preflight.git.repository_root_invalid" };
  if ((state === "WORKTREE" || state === "BARE_REPOSITORY") && !safeLocalPath(root)) {
    return { state: "INVALID_OR_AMBIGUOUS", reasonCode: "gef.preflight.git.repository_root_missing" };
  }
  return { state, ...(typeof root === "string" ? { root } : {}), ...(reasonCode ? { reasonCode } : {}) };
}

function normalizeHead(value: unknown): GitHeadObservation {
  if (!isRecord(value) || typeof value.state !== "string" || !HEAD_STATES.has(value.state as GitHeadState)) {
    return { state: "INVALID_OR_AMBIGUOUS", reasonCode: "gef.preflight.git.head_observation_invalid" };
  }
  const state = value.state as GitHeadState;
  const branch = value.branch;
  const headOid = value.headOid;
  const reasonCode = safeReason(value.reasonCode);
  if (branch !== undefined && (typeof branch !== "string" || branch.length === 0 || branch.length > 512 || /[\u0000\r\n]/.test(branch))) {
    return { state: "INVALID_OR_AMBIGUOUS", reasonCode: "gef.preflight.git.head_branch_invalid" };
  }
  if (headOid !== undefined && (typeof headOid !== "string" || !/^[0-9a-fA-F]{4,128}$/.test(headOid))) {
    return { state: "INVALID_OR_AMBIGUOUS", reasonCode: "gef.preflight.git.head_oid_invalid" };
  }
  return { state, ...(typeof branch === "string" ? { branch } : {}), ...(typeof headOid === "string" ? { headOid: headOid.toLowerCase() } : {}), ...(reasonCode ? { reasonCode } : {}) };
}

function normalizeStatus(value: unknown, detail: "SUMMARY" | "PATHS"): GitStatusObservation {
  if (!isRecord(value) || !isRecord(value.summary)) return { summary: { staged: 0, unstaged: 0, untracked: 0, conflicted: 0 }, reasonCode: "gef.preflight.git.status_observation_invalid" };
  const raw = value.summary;
  const keys = ["staged", "unstaged", "untracked", "conflicted"] as const;
  const counts: Record<(typeof keys)[number], number> = { staged: 0, unstaged: 0, untracked: 0, conflicted: 0 };
  for (const key of keys) {
    const count = raw[key];
    if (!Number.isSafeInteger(count) || (count as number) < 0) return { summary: counts, reasonCode: "gef.preflight.git.status_summary_invalid" };
    counts[key] = count as number;
  }
  const reasonCode = safeReason(value.reasonCode);
  if (detail === "SUMMARY") return { summary: counts, ...(reasonCode ? { reasonCode } : {}) };
  const paths = value.paths;
  if (paths === undefined) return { summary: counts, ...(reasonCode ? { reasonCode } : {}) };
  if (!Array.isArray(paths) || paths.length > 4096 || paths.some((path) => typeof path !== "string" || path.length === 0 || path.length > 4096 || /[\u0000\r\n]/.test(path))) {
    return { summary: counts, reasonCode: "gef.preflight.git.status_paths_invalid" };
  }
  return { summary: counts, paths: Object.freeze([...paths] as string[]), ...(reasonCode ? { reasonCode } : {}) };
}

function normalizeRemotes(value: unknown): GitRemotesObservation {
  if (!isRecord(value) || !Array.isArray(value.remotes) || value.remotes.length > 64) return { remotes: [], reasonCode: "gef.preflight.git.remotes_observation_invalid" };
  const remotes = [];
  for (const item of value.remotes) {
    if (!isRecord(item) || typeof item.alias !== "string" || !SAFE_REMOTE_ALIAS.test(item.alias) || typeof item.url !== "string" || item.url.length === 0 || item.url.length > 4096 || /[\u0000\r\n]/.test(item.url)) {
      return { remotes: [], reasonCode: "gef.preflight.git.remote_candidate_invalid" };
    }
    const providerHint = item.providerHint;
    if (providerHint !== undefined && (typeof providerHint !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(providerHint))) {
      return { remotes: [], reasonCode: "gef.preflight.git.remote_candidate_invalid" };
    }
    remotes.push({ alias: item.alias, url: item.url, ...(typeof providerHint === "string" ? { providerHint } : {}) });
  }
  const reasonCode = safeReason(value.reasonCode);
  return { remotes: Object.freeze(remotes), ...(reasonCode ? { reasonCode } : {}) };
}

function repositoryUsable(observation: GitRepositoryObservation): boolean {
  return observation.state === "WORKTREE" || observation.state === "BARE_REPOSITORY";
}

function repositoryGap(observation: GitRepositoryObservation): PreflightGap | null {
  if (repositoryUsable(observation)) return null;
  return {
    code: observation.reasonCode ?? `gef.preflight.git.repository_${observation.state.toLowerCase()}`,
    owner: "M29",
    blocking: false,
  };
}

function factGap(fact: Exclude<GitFactFamily, "repository">, reasonCode: string | undefined): PreflightGap | null {
  return reasonCode ? { code: reasonCode, owner: "M29", blocking: false } : null;
}

function summaryOnly(value: GitStatusObservation): GitStatusObservation {
  return value.paths === undefined ? value : { summary: value.summary, ...(value.reasonCode ? { reasonCode: value.reasonCode } : {}) };
}

export class GitObservationSession {
  readonly #port: GitObservationPort;
  readonly #counters: MutablePreflightCounters;
  readonly #repositoryCache = new Map<string, GitRepositoryObservation>();
  readonly #headCache = new Map<string, GitHeadObservation>();
  readonly #statusSummaryCache = new Map<string, GitStatusObservation>();
  readonly #statusPathsCache = new Map<string, GitStatusObservation>();
  readonly #remotesCache = new Map<string, GitRemotesObservation>();

  constructor(port: GitObservationPort, counters: MutablePreflightCounters) {
    this.#port = port;
    this.#counters = counters;
  }

  async #repository(startingDirectory: string): Promise<GitRepositoryObservation> {
    const cached = this.#repositoryCache.get(startingDirectory);
    if (cached) { this.#counters.cacheHits += 1; return cached; }
    incrementCounter(this.#counters.gitReads, "repository");
    try {
      const observed = normalizeRepository(await this.#port.observeRepository(startingDirectory));
      this.#repositoryCache.set(startingDirectory, observed);
      return observed;
    } catch {
      const unavailable: GitRepositoryObservation = { state: "UNAVAILABLE", reasonCode: "gef.preflight.git.repository_unavailable" };
      this.#repositoryCache.set(startingDirectory, unavailable);
      return unavailable;
    }
  }

  async #head(root: string): Promise<GitHeadObservation> {
    const cached = this.#headCache.get(root);
    if (cached) { this.#counters.cacheHits += 1; return cached; }
    incrementCounter(this.#counters.gitReads, "head");
    try {
      const observed = normalizeHead(await this.#port.observeHead(root));
      this.#headCache.set(root, observed);
      return observed;
    } catch {
      const unavailable: GitHeadObservation = { state: "UNAVAILABLE", reasonCode: "gef.preflight.git.head_unavailable" };
      this.#headCache.set(root, unavailable);
      return unavailable;
    }
  }

  async #status(root: string, detail: "SUMMARY" | "PATHS"): Promise<GitStatusObservation> {
    if (detail === "SUMMARY") {
      const summary = this.#statusSummaryCache.get(root);
      if (summary) { this.#counters.cacheHits += 1; return summary; }
      const stronger = this.#statusPathsCache.get(root);
      if (stronger) { this.#counters.cacheHits += 1; const narrowed = summaryOnly(stronger); this.#statusSummaryCache.set(root, narrowed); return narrowed; }
    } else {
      const detailed = this.#statusPathsCache.get(root);
      if (detailed) { this.#counters.cacheHits += 1; return detailed; }
    }
    incrementCounter(this.#counters.gitReads, detail === "PATHS" ? "status:paths" : "status:summary");
    try {
      const observed = normalizeStatus(await this.#port.observeStatus(root, detail), detail);
      if (detail === "PATHS") {
        this.#statusPathsCache.set(root, observed);
        this.#statusSummaryCache.set(root, summaryOnly(observed));
      } else {
        this.#statusSummaryCache.set(root, summaryOnly(observed));
      }
      return detail === "SUMMARY" ? summaryOnly(observed) : observed;
    } catch {
      const unavailable: GitStatusObservation = { summary: { staged: 0, unstaged: 0, untracked: 0, conflicted: 0 }, reasonCode: "gef.preflight.git.status_unavailable" };
      if (detail === "PATHS") this.#statusPathsCache.set(root, unavailable); else this.#statusSummaryCache.set(root, unavailable);
      return unavailable;
    }
  }

  async #remotes(root: string): Promise<GitRemotesObservation> {
    const cached = this.#remotesCache.get(root);
    if (cached) { this.#counters.cacheHits += 1; return cached; }
    incrementCounter(this.#counters.gitReads, "remotes");
    try {
      const observed = normalizeRemotes(await this.#port.observeRemotes(root));
      this.#remotesCache.set(root, observed);
      return observed;
    } catch {
      const unavailable: GitRemotesObservation = { remotes: [], reasonCode: "gef.preflight.git.remotes_unavailable" };
      this.#remotesCache.set(root, unavailable);
      return unavailable;
    }
  }

  async observe(request: GitObservationRequest): Promise<GitObservation> {
    const requested = [...new Set(request.facts)].sort() as GitFactFamily[];
    if (requested.length === 0) return { schemaVersion: 1, gaps: [] };

    const repository = await this.#repository(request.startingDirectory);
    const gaps: PreflightGap[] = [];
    const repoGap = repositoryGap(repository);
    if (repoGap) gaps.push(repoGap);
    if (!repositoryUsable(repository) || !repository.root) {
      this.#counters.skippedByPrerequisite += requested.filter((fact) => fact !== "repository").length;
      const repositoryIdentity = requested.includes("remotes") && repository.state === "NOT_REPOSITORY"
        ? resolveRepositoryIdentity({ repositoryPresent: false, ...(request.persistedRepositoryBinding ? { persistedBinding: request.persistedRepositoryBinding } : {}) })
        : undefined;
      return { schemaVersion: 1, repository, ...(repositoryIdentity ? { repositoryIdentity } : {}), gaps };
    }

    const root = repository.root;
    let head: GitHeadObservation | undefined;
    let status: GitStatusObservation | undefined;
    let rawRemotes: GitRemotesObservation | undefined;
    const tasks: Promise<void>[] = [];
    if (requested.includes("head")) tasks.push(this.#head(root).then((value) => { head = value; }));
    if (requested.includes("status")) tasks.push(this.#status(root, request.statusDetail ?? "SUMMARY").then((value) => { status = value; }));
    if (requested.includes("remotes")) tasks.push(this.#remotes(root).then((value) => { rawRemotes = value; }));
    await Promise.all(tasks);

    const headGap = head ? factGap("head", head.reasonCode) : null;
    const statusGap = status ? factGap("status", status.reasonCode) : null;
    const remotesGap = rawRemotes ? factGap("remotes", rawRemotes.reasonCode) : null;
    if (headGap) gaps.push(headGap);
    if (statusGap) gaps.push(statusGap);
    if (remotesGap) gaps.push(remotesGap);

    const repositoryIdentity = rawRemotes && !rawRemotes.reasonCode
      ? resolveRepositoryIdentity({ repositoryPresent: true, remotes: rawRemotes.remotes, ...(request.persistedRepositoryBinding ? { persistedBinding: request.persistedRepositoryBinding } : {}) })
      : undefined;
    for (const diagnostic of repositoryIdentity?.diagnostics ?? []) {
      gaps.push({ code: diagnostic.code, owner: "M03", blocking: diagnostic.severity === "ERROR" });
    }

    return {
      schemaVersion: 1,
      repository,
      ...(head ? { head } : {}),
      ...(status ? { status } : {}),
      ...(rawRemotes ? { remotes: { count: rawRemotes.remotes.length, ...(rawRemotes.reasonCode ? { reasonCode: rawRemotes.reasonCode } : {}) } } : {}),
      ...(repositoryIdentity ? { repositoryIdentity } : {}),
      gaps,
    };
  }

  invalidate(input: { readonly startingDirectory?: string; readonly repositoryRoot?: string; readonly facts?: readonly GitFactFamily[] } = {}): void {
    const facts = new Set(input.facts ?? ["repository", "head", "status", "remotes"]);
    if (facts.has("repository")) {
      if (input.startingDirectory) this.#repositoryCache.delete(input.startingDirectory); else this.#repositoryCache.clear();
    }
    const root = input.repositoryRoot;
    if (facts.has("head")) root ? this.#headCache.delete(root) : this.#headCache.clear();
    if (facts.has("status")) {
      if (root) { this.#statusSummaryCache.delete(root); this.#statusPathsCache.delete(root); }
      else { this.#statusSummaryCache.clear(); this.#statusPathsCache.clear(); }
    }
    if (facts.has("remotes")) root ? this.#remotesCache.delete(root) : this.#remotesCache.clear();
  }
}

export function compactGitEvidence(observation: GitObservation): CompactGitObservation {
  return Object.freeze({
    schemaVersion: 1,
    ...(observation.repository ? { repository: { state: observation.repository.state, ...(observation.repository.reasonCode ? { reasonCode: observation.repository.reasonCode } : {}) } } : {}),
    ...(observation.head ? { head: observation.head } : {}),
    ...(observation.status ? { status: { summary: observation.status.summary, ...(observation.status.reasonCode ? { reasonCode: observation.status.reasonCode } : {}) } } : {}),
    ...(observation.remotes ? { remotes: observation.remotes } : {}),
    ...(observation.repositoryIdentity ? { repositoryIdentity: { projection: observation.repositoryIdentity.projection, canonicalBindingPersisted: observation.repositoryIdentity.canonicalBindingPersisted, candidateCount: observation.repositoryIdentity.candidateCount } } : {}),
    gaps: observation.gaps,
  });
}
