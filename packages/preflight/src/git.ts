import { incrementCounter } from "./canonical.js";
import type {
  GitFactFamily,
  GitHeadObservation,
  GitObservation,
  GitObservationPort,
  GitObservationRequest,
  GitRemotesObservation,
  GitRepositoryObservation,
  GitStatusObservation,
  MutablePreflightCounters,
  PreflightGap,
} from "./types.js";

function repositoryGap(observation: GitRepositoryObservation): PreflightGap | null {
  if (observation.presence === "PRESENT") return null;
  return {
    code: observation.reasonCode ?? `gef.preflight.git.repository_${observation.presence.toLowerCase()}`,
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
      const observed = await this.#port.observeRepository(startingDirectory);
      this.#repositoryCache.set(startingDirectory, observed);
      return observed;
    } catch {
      const unavailable: GitRepositoryObservation = { presence: "UNAVAILABLE", reasonCode: "gef.preflight.git.repository_unavailable" };
      this.#repositoryCache.set(startingDirectory, unavailable);
      return unavailable;
    }
  }

  async #head(root: string): Promise<GitHeadObservation> {
    const cached = this.#headCache.get(root);
    if (cached) { this.#counters.cacheHits += 1; return cached; }
    incrementCounter(this.#counters.gitReads, "head");
    try {
      const observed = await this.#port.observeHead(root);
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
      const observed = await this.#port.observeStatus(root, detail);
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
      const observed = await this.#port.observeRemotes(root);
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
    if (repository.presence !== "PRESENT" || !repository.root) {
      this.#counters.skippedByPrerequisite += requested.filter((fact) => fact !== "repository").length;
      return { schemaVersion: 1, repository, gaps };
    }

    const root = repository.root;
    let head: GitHeadObservation | undefined;
    let status: GitStatusObservation | undefined;
    let remotes: GitRemotesObservation | undefined;
    const tasks: Promise<void>[] = [];
    if (requested.includes("head")) tasks.push(this.#head(root).then((value) => { head = value; }));
    if (requested.includes("status")) tasks.push(this.#status(root, request.statusDetail ?? "SUMMARY").then((value) => { status = value; }));
    if (requested.includes("remotes")) tasks.push(this.#remotes(root).then((value) => { remotes = value; }));
    await Promise.all(tasks);

    const headGap = head ? factGap("head", head.reasonCode) : null;
    const statusGap = status ? factGap("status", status.reasonCode) : null;
    const remotesGap = remotes ? factGap("remotes", remotes.reasonCode) : null;
    if (headGap) gaps.push(headGap);
    if (statusGap) gaps.push(statusGap);
    if (remotesGap) gaps.push(remotesGap);

    return {
      schemaVersion: 1,
      repository,
      ...(head ? { head } : {}),
      ...(status ? { status } : {}),
      ...(remotes ? { remotes } : {}),
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

export function compactGitEvidence(observation: GitObservation): Readonly<Record<string, unknown>> {
  return Object.freeze({
    schemaVersion: 1,
    ...(observation.repository ? { repository: { presence: observation.repository.presence, ...(observation.repository.reasonCode ? { reasonCode: observation.repository.reasonCode } : {}) } } : {}),
    ...(observation.head ? { head: observation.head } : {}),
    ...(observation.status ? { status: { summary: observation.status.summary, ...(observation.status.reasonCode ? { reasonCode: observation.status.reasonCode } : {}) } } : {}),
    ...(observation.remotes ? { remotes: { count: observation.remotes.remotes.length, ...(observation.remotes.reasonCode ? { reasonCode: observation.remotes.reasonCode } : {}) } } : {}),
    gaps: observation.gaps,
  });
}
