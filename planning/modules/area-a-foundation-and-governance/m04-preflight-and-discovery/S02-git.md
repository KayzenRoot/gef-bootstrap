# GBS-M04-S02 — Git Discovery

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze the provider-neutral local Git discovery contract consumed by deterministic preflight. S02 defines which Git facts may be observed, how ambiguity/gaps are represented and how discovery remains bounded, without implementing Git commands, branch/commit policy, dirty-tree mutation safety or hosted-provider behavior.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M04_S02`;
- `GBS-M04-S01 — Environment Discovery` FROZEN;
- frozen Requirements, Scope, Architecture, Security and DoD;
- `GBS-M01-S01 — Deterministic Work Plane Runtime` FROZEN;
- `GBS-M01-S03 — Deterministic Lifecycle` FROZEN;
- `GBS-M03-S03 — Repository Identity` FROZEN and M03 MODULE_DONE evidence;
- reserved M29 sessions: Repository State, Branch Lifecycle, Commit Policy, Dirty Tree Safety;
- M51-S02 Git compatibility remains reserved for supported-version policy.

## Ownership boundary
M04-S02 OWNS:
- the semantic request/result shape for local Git facts needed by M04 preflight;
- bounded discovery from one admitted starting location/target context;
- explicit repository-presence/type/access/gap classifications;
- optional HEAD, status-summary and remote-observation requests;
- raw-to-sanitized handoff rules for M03 repository identity normalization;
- preflight freshness/reuse semantics for observed Git facts;
- compact Git discovery evidence suitable for later S05 project-state aggregation.

M04-S02 DOES NOT OWN:
- Git executable/process invocation, command construction or parsing implementation (M29);
- branch create/switch/delete policy (M29-S02);
- commit/stage/index mutation policy (M29-S03);
- authoritative dirty-tree overwrite/conflict safety or path-level overlap logic (M29-S04/M06);
- Git supported-version matrix (M51-S02);
- Git executable/tool presence detection (M04-S04/M38);
- repository identity equality/normalization semantics (M03);
- GitHub/provider state, permissions or network discovery (M04-S03/M30+);
- project/adoption/source-pack state aggregation (M04-S05);
- filesystem containment/symlink write safety (M06).

## Frozen Git discovery contract

### GITD-01 — Git discovery is explicit S0 read-only preflight
Git discovery is `S0_READ_ONLY`. It may observe local Git facts but performs no checkout, reset, clean, add, stage, commit, branch mutation, config mutation, fetch, pull, push or provider operation.

A discovery failure never triggers an automatic repair or Git configuration change.

### GITD-02 — Domain logic consumes a Git observation port
M04 domain logic does not build shell strings or directly parse implementation-specific Git process output. It consumes a typed injectable `GitObservationPort` or equivalent boundary.

M29 owns how production Git facts are obtained safely. Tests may inject deterministic fixtures without installing or executing Git.

### GITD-03 — Discovery starts from one admitted location and never scans broadly
The starting location is supplied by the invocation/environment/target context. Discovery may resolve the containing Git context for that location through the Git port, but does not crawl sibling directories, parent project collections, user home directories or the filesystem looking for repositories.

Repository discovery cost is therefore independent of unrelated repository/filesystem population.

### GITD-04 — Repository state is explicit
The baseline observation distinguishes at least:
- `NOT_REPOSITORY`;
- `WORKTREE`;
- `BARE_REPOSITORY`;
- `ACCESS_BLOCKED`;
- `UNAVAILABLE`;
- `INVALID_OR_AMBIGUOUS`.

`WORKTREE` does not by itself mean the target is the intended governed project. S05 and M03 identity binding decide that.

Bare repositories are reported truthfully. Consumers requiring a checked-out filesystem worktree may block, but S02 does not fabricate one or clone automatically.

### GITD-05 — Minimal request-driven projection
Git discovery is field-selective. A consumer requests only the fact families required for that preflight:

```text
GitDiscoveryRequest
  repositoryContext: required
  head: optional
  statusSummary: optional
  remotes: optional
  worktreeMetadata: optional
```

A request that only needs repository presence/root must not pay for status/remotes. A request that only needs HEAD must not enumerate every changed path.

### GITD-06 — Repository/root paths are operational facts, not identity
The observed worktree root, Git directory/common directory and linked-worktree paths are local operational facts. They are excluded from M03 project/repository identity equality.

Raw absolute paths are not included in compact reusable evidence by default. When later safety logic requires exact paths, they remain local operational inputs subject to M06 containment/path policy.

S02 does not infer project identity from folder names or path similarity.

### GITD-07 — HEAD state is structured and distinct from repository identity
When requested, HEAD observation distinguishes at least:
- `ATTACHED` with current local ref/branch name where observable;
- `DETACHED`;
- `UNBORN` for a repository with no first commit;
- `UNAVAILABLE`;
- `INVALID_OR_AMBIGUOUS`.

An object ID/SHA may be observed for exact-state binding where available. Branch name and HEAD OID are operational/exact-state facts, never repository identity or project identity.

### GITD-08 — Status discovery is summary-first and lazy
When status is requested, the baseline compact result reports categories needed for preflight, such as:
- staged changes present;
- unstaged tracked changes present;
- untracked entries present;
- unresolved conflicts present;
- clean versus non-clean classification;
- optional bounded counts where reliable.

S02 does not enumerate every changed path by default. Exact path-level overlap/overwrite analysis is requested only by an operation that needs it and remains governed by M29-S04/M06 safety contracts.

A dirty tree is never silently cleaned, reset, stashed or normalized by discovery.

### GITD-09 — Remote aliases are observations, never selection authority
When remotes are requested, S02 observes the configured candidates without assuming `origin` or `upstream` is canonical.

Remote alias names are descriptive local labels. Selection/equality is governed by M03 repository identity and later explicit project binding.

### GITD-10 — Credential-bearing remote text is ephemeral untrusted input
Git configuration may contain sensitive URL material. Raw remote text is untrusted and is not emitted into normal receipts, telemetry or reusable context.

If remote text is needed for repository identity, it is passed through the narrow M03 normalization/validation path and discarded from the compact discovery result. Evidence carries the normalized credential-free projection/status or typed error, not the original sensitive string.

Errors must not echo rejected remote text.

### GITD-11 — Provider-stable identity remains outside local Git authority
Local Git discovery can observe remote locator text but cannot claim a trusted GitHub/provider-stable repository ID by itself.

Stable provider IDs require the owning provider contract/session. S02 therefore never upgrades locator evidence into provider authority.

### GITD-12 — Git access/configuration failures fail truthfully
Situations such as repository ownership/safe-directory rejection, unreadable metadata, malformed repository state or unavailable Git observation capability produce typed gaps/blocks.

S02 never edits user/global Git configuration, marks a repository safe, changes ownership or weakens security policy merely to make discovery succeed.

### GITD-13 — Nested repository/worktree context is observed, not guessed
Linked worktrees, nested repositories/submodules and other valid Git layouts are interpreted through Git semantics exposed by the observation port rather than handwritten `.git` path heuristics in M04.

S02 reports the current containing Git context. It does not recursively inspect sibling/nested repositories unless a later admitted operation explicitly owns that traversal.

### GITD-14 — Tool availability/version is a dependency, not S02 authority
If no usable Git observation adapter/capability is available, S02 returns `UNAVAILABLE`/typed capability gap. It does not install Git or define which Git version is supported.

M04-S04/M38 own tool capability discovery; M51-S02 owns Git compatibility policy; M29 owns the production adapter implementation.

### GITD-15 — Git snapshot validity is dependency-bound
Git facts are derived operational observations. Within one invocation, a validated snapshot may be reused while its relevant dependencies remain unchanged.

Facts that can change through Git/filesystem activity have explicit freshness classes:
- repository context/root facts are relatively stable within an invocation unless target/worktree changes;
- HEAD becomes stale when ref/checkout/commit state changes;
- status becomes stale when index/worktree content changes;
- remotes become stale when Git configuration changes.

Consumers requiring exact state must bind to the applicable current observation rather than assuming a prior snapshot is fresh.

### GITD-16 — Observation does not grant mutation authorization
Being on a branch, having a clean tree, owning the filesystem or having local Git write capability does not authorize a Git mutation.

Mutation security class, policy, target binding and expected-state gates remain independently enforced by M01/Security/M29/M05-M06.

### GITD-17 — Discovery integrates with M01 lifecycle before side effects
Applicable Git discovery occurs in the logical `PREFLIGHTING` boundary. A required Git fact that is absent, stale, blocked or ambiguous terminates before mutation-capable execution whenever technically possible.

Cheap read-only checks may collapse physically for latency, but the machine result must retain enough structured evidence to prove the required gate was satisfied.

### GITD-18 — Compact result surface
The reusable sanitized result conceptually contains only requested non-sensitive facts:

```text
GitDiscoverySnapshot
  schemaVersion
  repositoryState
  rootReference?           # local operational reference, not canonical identity
  worktreeKind?
  headState?
  headOid?                 # only when requested/needed
  statusSummary?           # compact categories/counts
  repositoryIdentity?      # M03 normalized projection/result when remotes requested
  observationGaps[]
  requestedFactFamilies[]
```

Provider-specific state, raw remote URLs, full changed-path lists and process stdout/stderr are excluded unless a separate owning operation explicitly requires them.

## Security and reliability invariants
- read-only discovery never mutates Git/config/provider state;
- no shell-string interpolation or Git process ownership in M04;
- no implicit `safe.directory`/global-config repair;
- raw sensitive remote text is not persisted/logged;
- remote alias cannot become canonical authority;
- local root/branch/HEAD cannot replace M03 identity;
- dirty/conflicted state is reported, never automatically erased;
- bare/unavailable/ambiguous states remain explicit;
- no broad filesystem/repository enumeration;
- stale Git observations cannot satisfy exact-state consumers silently.

## Token/time economy invariants
- Git facts are requested by family rather than always collecting everything;
- repository presence/root discovery avoids status/remotes when not needed;
- status is summary-first, path expansion is demand-driven;
- normalized M03 repository projection replaces repeated raw remote parsing downstream;
- validated same-invocation observations are reusable under freshness rules;
- no provider network call is bundled into local Git discovery;
- structured gap codes prevent repeated exploratory Git commands by executors/models.

## Required future proof
Implementation must eventually prove:
1. S02 domain logic works with an injected Git observation port and does not own shell/process Git execution;
2. NOT_REPOSITORY, WORKTREE, BARE_REPOSITORY, ACCESS_BLOCKED, UNAVAILABLE and INVALID_OR_AMBIGUOUS remain distinguishable;
3. discovery from one starting location performs no broad repository/filesystem scan;
4. repository/root path does not enter project/repository identity;
5. attached, detached and unborn HEAD states are distinct;
6. branch/HEAD change does not by itself change repository identity;
7. status is not computed unless requested;
8. default status evidence is summary-first and does not enumerate full changed paths;
9. dirty/conflicted state cannot trigger automatic clean/reset/stash;
10. remote alias changes alone do not change M03 repository identity;
11. raw credential-bearing remote text never appears in reusable receipt/telemetry/error output;
12. no remote alias is auto-selected as canonical merely by name;
13. S02 never fabricates a trusted provider-stable repository ID;
14. safe-directory/ownership failures cannot cause automatic global Git config mutation;
15. linked worktree/nested Git layouts rely on Git adapter semantics rather than `.git` string heuristics;
16. Git availability/version policy remains delegated to S04/M38/M51/M29;
17. HEAD/status/remotes snapshots invalidate when their owning dependencies change;
18. same-invocation valid observations can be reused without repeating unrelated Git queries;
19. Git facts do not grant mutation authorization;
20. required missing/ambiguous Git facts block before mutation execution.

## Resolved freeze decisions
1. Discovery model: **typed injected Git observation port; M04 owns semantic request/result, M29 owns Git execution/parsing**.
2. Cost model: **request-driven fact families; no status/remotes/path expansion unless required**.
3. Repository root: **operational local fact only, never identity authority**.
4. HEAD: **attached/detached/unborn explicitly represented; OID is exact-state evidence, not repository identity**.
5. Status: **summary-first and lazy; path-level dirty-tree safety remains M29-S04/M06**.
6. Remotes: **aliases are observations; raw text is ephemeral and normalized through M03 before reusable evidence**.
7. Git security/config errors: **typed gap/block; no automatic Git/global-config repair**.
8. Tool/version ownership: **S04/M38 observe capability, M51 defines support policy, M29 implements Git adapter**.
9. Snapshot reuse: **allowed within validity dependencies; HEAD/status/remotes have targeted freshness rules**.
10. Provider boundary: **no GitHub/provider network or stable provider-ID claim in local S02 discovery**.

## Session completion rule
Planning content is frozen-candidate. Exact-head semantic review must confirm alignment with M03 repository identity, M01 lifecycle, Security Git rules, M29 ownership, M51 compatibility and S01 lazy discovery. After approval/merge, checkpoint advances to `GBS-M04-S03 — GitHub`.

STOP CONDITION: `M04_S02_EXACT_HEAD_REVIEW_REQUIRED`.
