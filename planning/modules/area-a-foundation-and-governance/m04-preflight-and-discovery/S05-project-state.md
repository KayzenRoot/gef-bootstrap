# GBS-M04-S05 — Project State Discovery

Status: `FROZEN`

## Purpose
Freeze the final M04 project-state preflight contract. S05 composes the smallest operation-relative snapshot required to decide whether a deterministic use-case may proceed to execution, using already-owned configuration, identity, environment, Git, GitHub and tool observations without creating a new canonical source of project truth.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M04_S05`;
- frozen Requirements, Scope, Architecture, Security, DoD and Deployment;
- `GBS-M04-S01 — Environment Discovery` FROZEN;
- `GBS-M04-S02 — Git Discovery` FROZEN;
- `GBS-M04-S03 — GitHub Discovery` FROZEN;
- `GBS-M04-S04 — Toolchain Discovery` FROZEN;
- `GBS-M02 — Configuration & Schema` MODULE_DONE;
- `GBS-M03 — Project Identity` MODULE_DONE;
- M01 lifecycle/preflight boundary;
- later ownership boundaries for M05/M06 mutation, M13 adoption, M17/M18 continuity, M19 registry, M21/M23 progress/status, M24/M25 evidence/proof and M29+ execution/provider mutation.

## Ownership boundary
M04-S05 OWNS:
- composition of operation-required project preflight facts;
- project-state snapshot shape for the current invocation;
- requirement-relative READY/GAP/BLOCK result before execution;
- exact dependency binding sufficient for consumers to detect stale preflight state;
- cheap-blocker short-circuit and bounded parallel observation policy;
- compact gap aggregation and remediation references;
- per-invocation reuse of still-valid component observations.

M04-S05 DOES NOT OWN:
- canonical project identity semantics (M03);
- configuration truth/migration (M02);
- adoption/brownfield maturity or normalization workflow (M13);
- persistent project registry/index (M19);
- checkpoint/resume truth (M17/M18);
- project progress/status reporting product surface (M21/M23);
- durable proof graph/invalidation engine (M24/M25/M37);
- mutation plans/apply/recovery (M05/M06/M36);
- Git or hosted-provider mutation (M29+);
- source-pack semantic authority or broad repository understanding (M09+);
- semantic approval, risk acceptance or scope admission.

## Frozen project-state contract

### STATE-01 — Project state is operation-relative preflight, not canonical truth
S05 produces a bounded snapshot for one admitted use-case/invocation. The snapshot summarizes facts required to decide whether that operation can safely enter execution. It is derived operational state and never replaces canonical repository sources, project configuration, project identity, checkpoint state, registry state or semantic review.

### STATE-02 — Requirements drive discovery
The invoking use-case supplies a validated preflight requirement set describing only the fact families it needs:

```text
ProjectPreflightRequirements
  requireProjectConfig?
  identityBindingStrength?
  requireRepository?
  gitFacts[]?
  githubFacts[]?
  toolRequirements[]?
  requireCleanlinessClass?
  expectedBindings[]?
  optionalFacts[]?
```

S05 does not broaden that request merely to create a richer project portrait.

### STATE-03 — Snapshot composes owned observations without duplicating them
A project preflight snapshot references or embeds compact projections from owning components:

```text
ProjectPreflightSnapshot
  schemaVersion
  requirementFingerprint
  projectConfigState?
  identityState?
  environmentState?
  repositoryState?
  hostedProfileState?
  toolchainState?
  expectedStateBindings[]
  gaps[]
  readiness
```

Each component remains governed by its owning contract. S05 does not reinterpret a provider permission, Git status, identity conflict or compatibility result into a contradictory local taxonomy.

### STATE-04 — Configuration and identity are separate facts
Project configuration validity/adoption marker and M03 identity state remain distinct. Legacy adopted config may be structurally valid while identity bootstrap remains required; unadopted/new project may legitimately have no project config for bootstrap/adoption discovery; operations requiring established identity block when the required M03 binding strength is unavailable. S05 never silently generates/fixes identity or migrates config while observing state.

### STATE-05 — Project mode is supplied/owned, not guessed
`NEW_PROJECT` versus `EXISTING_PROJECT/BROWNFIELD` is a governed workflow/adoption concern. S05 may carry a mode supplied by the invoking operation or later M13 contract, but it does not infer mode from file count, project age, directory name, framework markers or Git history heuristics. If mode is required and not established, preserve `MODE_UNRESOLVED`.

### STATE-06 — Repository presence and project identity are not equivalent
A Git repository may exist without an adopted GEF project, and a GEF project may be local-only. Git root, branch, HEAD and remote locator never substitute for `projectId`. S05 consumes M03/M04 repository identity and collision results instead of reimplementing them.

### STATE-07 — Readiness is exact-operation relative
Baseline result classes are `READY`, `READY_WITH_GAPS`, `BLOCKED_PRECONDITION`, `BLOCKED_IDENTITY`, `BLOCKED_REPOSITORY`, `BLOCKED_PROVIDER`, `BLOCKED_TOOLCHAIN`, `BLOCKED_POLICY`, `BLOCKED_STALE`, `CANCELLED` and `TIMED_OUT`.

These classes describe deterministic preflight only. They are not module/product completion or semantic approval.

### STATE-08 — Gap aggregation preserves cause and owner
Every gap has a stable reason code, owning component/module, blocking/optional classification and bounded remediation reference when known. Equivalent gaps may be deduplicated, but materially different causes remain distinct.

### STATE-09 — Cheap blockers short-circuit expensive discovery by default
Preflight evaluates prerequisite dependencies so obviously blocking cheap/local facts prevent unnecessary expensive work. Invalid config can block before provider calls; unresolved target identity can prevent hosted probing; local-only operations skip hosted discovery; admitted transport alternatives can avoid optional CLI probes.

A fuller diagnostic sweep requires explicit bounded diagnostic mode. Normal execution preflight optimizes for the smallest sufficient proof.

### STATE-10 — Independent read observations may run concurrently
Once prerequisite bindings are established, independent S0 observations may execute concurrently under M01 bounded concurrency, cancellation and resource budgets. Parallelism is allowed only where observations cannot change or invalidate each other's assumptions. Mutation is not part of M04.

### STATE-11 — Exact expected-state bindings cross into execution
When an operation depends on current state, S05 emits compact expected-state bindings sufficient for the execution/mutation owner to revalidate before side effects. They may include project config fingerprint/version, identity fingerprint/binding strength, repository identity projection/fingerprint, HEAD/reference, status summary, hosted repository/capability observation reference and tool/version-policy reference.

M05/M06/M29/provider owners decide how those bindings are rechecked at the final mutation boundary. S05 never claims a snapshot stays valid indefinitely.

### STATE-12 — Snapshot staleness is dependency-targeted
A component change invalidates only dependent conclusions where narrower invalidation is provable. HEAD movement need not invalidate Node version; hosted-session changes need not invalidate local project ID; config changes invalidate config-bound projections; stable tool facts remain valid through unrelated status changes.

Durable cross-run invalidation graphs remain owned later; S05 freezes only the dependency semantics required by M04.

### STATE-13 — Reuse requires equivalent requirements and valid dependencies
A preflight snapshot/component observation may be reused within an invocation only when requirement fingerprint is equivalent, needed observations remain valid, no stronger binding was introduced, cancellation/budget context permits reuse and the consuming operation has not crossed a mutation boundary that invalidates it. Weaker prior snapshots cannot silently satisfy stronger requests.

### STATE-14 — Brownfield remains preservation-first
For existing projects, missing GEF governance/config/identity facts are explicit bootstrap/adoption gaps rather than reasons for broad repository rewrite. S05 does not require complete historical normalization before useful read-only discovery. M13 owns progressive adoption/maturity and legal mutations that establish missing state.

### STATE-15 — No hidden repair during preflight
S05/M04 never silently create GEF state, write project config, generate/rekey identity, change Git state, clean/stash/reset worktree, install tools, authenticate to providers or change hosted settings. Required remediation is a separate admitted operation with its own security class and evidence.

### STATE-16 — Baseline state requires no full repository scan
Project-state composition uses exact canonical paths and targeted adapters/fact requests. Baseline M04 does not recursively inventory source files, dependencies, frameworks, tests or architecture merely to decide mechanical readiness.

### STATE-17 — Snapshot is compact and secret-safe
Reusable evidence includes only fields required for readiness/stale-state checks and excludes full environment maps, raw provider payloads, broad Git detail unless requested, raw tool output, secrets and unnecessary absolute paths.

### STATE-18 — Failure is truthful and non-mutating
Malformed mandatory component results, incompatible schema, resource exhaustion, timeout, cancellation or conflicting binding terminate or degrade preflight truthfully. Partial observation cannot become `READY` when mandatory evidence is missing.

### STATE-19 — Controlled inputs produce deterministic readiness
Given the same validated requirements, controlled observations, compatibility/policy inputs and expected bindings, S05 produces the same logical readiness/gap result independent of iteration order or prose rendering. Nondeterministic external facts remain explicit inputs.

### STATE-20 — M04 stops before execution authority
M04 `READY` means required deterministic discovery/preflight gates are satisfied at the observed state. It grants no authority beyond the already-admitted operation/policy. Mutation owners still revalidate applicable bindings before side effects; semantic reviewer/DoD approval remains outside M04.

## Security and reliability invariants
- no mutation or hidden remediation;
- target/identity ambiguity fails closed;
- component gaps preserve owning cause;
- provider/tool access remains least-necessary and request-scoped;
- weaker evidence cannot satisfy stronger binding;
- stale expected state blocks until refreshed;
- broad sensitive snapshots are excluded;
- diagnostic completeness never justifies unsafe default scanning;
- elevated/provider capability never bypasses explicit authorization.

## Token/time economy invariants
- requirement-driven discovery only;
- cheap local blockers before expensive provider/tool checks;
- bounded parallel independent reads after prerequisites;
- component snapshots reused under targeted dependencies;
- no full repository/provider/software inventory;
- compact gap codes and expected bindings replace repeated prose rediscovery;
- stronger assurance may expand facts, but ordinary commands consume the smallest sufficient snapshot.

## Required future proof
Implementation must eventually prove:
1. only required fact families are requested;
2. cheap blockers prevent unnecessary provider/tool calls;
3. allowed independent observations run concurrently without changing logical result;
4. config and identity remain distinct;
5. project mode is not guessed from heuristics;
6. Git root/remote/HEAD cannot replace `projectId`;
7. readiness preserves component causes;
8. optional gaps do not block unless mandatory;
9. missing mandatory evidence cannot produce READY;
10. expected config/identity/repository/HEAD/status/provider/tool bindings carry to stale-state recheck;
11. changed bindings produce targeted stale/block behavior;
12. weaker cached snapshots cannot satisfy stronger requests;
13. preflight never mutates config/Git/provider/tool environment;
14. brownfield missing state remains bounded adoption/bootstrap gap;
15. baseline state requires no recursive repository scan;
16. compact snapshot excludes broad dumps and secret values;
17. malformed mandatory observations fail closed;
18. controlled inputs produce deterministic output;
19. M04 READY does not bypass authorization/revalidation;
20. per-invocation reuse reduces rediscovery without hiding relevant changes.

## Resolved freeze decisions
1. State role: **ephemeral operation-relative preflight snapshot, never canonical project state store**.
2. Composition: **reuse M02/M03/S01-S04 facts rather than duplicating them**.
3. Mode/adoption: **M13/workflow owns NEW_PROJECT/BROWNFIELD semantics**.
4. Registry/status/continuity: **M17-M19/M21/M23 retain persistent ownership**.
5. Execution binding: **S05 emits compact expected-state bindings; mutation owners revalidate**.
6. Performance: **cheap-blocker short-circuit, bounded parallel reads, targeted reuse/invalidation**.
7. Brownfield: **preservation-first; no broad normalization prerequisite**.
8. Repair: **preflight never mutates; remediation is a separate admitted operation**.

## Freeze record
Exact-head semantic review passed on PR `#80` for head `3d16f89418c4b0f793f66d9aacbb392abd3fce98`; review threads were empty. The reviewed content was squash-merged as `602e8cad65c67499af1929c0d20113bd5d02f8ec` before checkpoint promotion.

STOP CONDITION: `M04_S05_FROZEN`.
