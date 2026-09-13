# GBS-M04-S05 — Project State Discovery

Status: `FROZEN_CANDIDATE`

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
S05 produces a bounded snapshot for one admitted use-case/invocation. The snapshot summarizes facts required to decide whether that operation can safely enter execution.

It is derived operational state. It never replaces canonical repository sources, project configuration, project identity, checkpoint state, registry state or semantic review.

### STATE-02 — Requirements drive discovery
The invoking use-case supplies a validated preflight requirement set describing only the fact families it needs, for example:

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

Each component remains governed by its owning contract. S05 does not reinterpret a GitHub permission, Git status, identity conflict or compatibility result into a contradictory local taxonomy.

### STATE-04 — Configuration and identity are separate facts
Project configuration validity/adoption marker and M03 identity state remain distinct.

Examples:
- a legacy adopted config may be structurally valid while M03 reports `IDENTITY_BOOTSTRAP_REQUIRED`;
- an unadopted/new project may legitimately have no project config yet when the selected operation is bootstrap/adoption discovery;
- an operation requiring an established project identity must block when the required M03 binding strength is unavailable.

S05 never silently generates/fixes identity or migrates config while observing state.

### STATE-05 — Project mode is supplied/owned, not guessed from arbitrary files
`NEW_PROJECT` versus `EXISTING_PROJECT/BROWNFIELD` is a governed workflow/adoption concern. S05 may carry a mode supplied by the invoking operation or later M13 contract, but it does not infer mode from file count, project age, directory name, framework markers or Git history heuristics.

When the invoking use-case has not yet established mode, S05 preserves `MODE_UNRESOLVED` if mode is required rather than inventing one.

### STATE-06 — Repository presence and project identity are not equivalent
A Git repository may exist without an adopted GEF project. A GEF project may be in a local-only repository state. Git root, branch, HEAD and remote locator never substitute for `projectId`.

S05 consumes M03/M04 repository identity and collision results rather than reimplementing equality/collision logic.

### STATE-07 — Readiness is exact-operation relative
Baseline result classes are:
- `READY` — all mandatory preflight requirements are satisfied with current valid facts;
- `READY_WITH_GAPS` — only optional/non-blocking facts are missing or degraded;
- `BLOCKED_PRECONDITION` — required config/mode/state is not established;
- `BLOCKED_IDENTITY` — required project/repository identity binding is invalid/conflicted/insufficient;
- `BLOCKED_REPOSITORY` — required local repository state is unavailable/incompatible;
- `BLOCKED_PROVIDER` — required hosted fact/capability is unavailable;
- `BLOCKED_TOOLCHAIN` — required tool fact/compatibility is unavailable;
- `BLOCKED_POLICY` — an owning policy/security layer denies progression;
- `BLOCKED_STALE` — expected state no longer matches the current observed binding;
- `CANCELLED` / `TIMED_OUT` — observation did not complete under lifecycle budget.

These classes describe deterministic preflight only. They are not module/product completion or semantic approval.

### STATE-08 — Gap aggregation preserves cause and owner
Every gap has a stable reason code, owning component/module, blocking/optional classification and bounded remediation reference when one is known.

S05 may deduplicate equivalent gaps but must not collapse materially different causes, such as tool absent versus incompatible, provider unavailable versus permission gap, or identity bootstrap required versus identity conflict.

### STATE-09 — Cheap blockers short-circuit expensive discovery by default
Preflight evaluates prerequisite dependencies so obviously blocking cheap/local facts prevent unnecessary expensive work.

Examples:
- invalid project config can block an operation before provider calls;
- unresolved project/repository identity can prevent hosted capability probing tied to an ambiguous target;
- local-only operation skips GitHub entirely;
- an admitted transport alternative may avoid probing an optional CLI tool.

A use-case may request a fuller diagnostic sweep only through an explicit bounded diagnostic mode. Normal execution preflight optimizes for the smallest sufficient proof.

### STATE-10 — Independent read observations may run concurrently
Once prerequisite bindings are established, independent S0 observations may execute concurrently under M01 bounded concurrency, cancellation and resource budgets.

Parallelism is allowed only where one observation cannot change or invalidate the assumptions of another. Mutation is not part of M04.

### STATE-11 — Exact expected-state bindings cross into execution
When an operation depends on current state, S05 emits compact expected-state bindings sufficient for the execution/mutation owner to revalidate before side effects.

Examples may include:
- project configuration fingerprint/version;
- project identity fingerprint/binding strength;
- repository identity projection/fingerprint;
- HEAD/reference observation when required;
- dirty/status summary binding when required;
- provider repository identity/capability observation reference when required;
- tool observation/version-policy reference when required.

M05/M06/M29/provider owners decide how those bindings are rechecked at the final mutation boundary. S05 does not claim that a snapshot remains valid forever.

### STATE-12 — Snapshot staleness is dependency-targeted
A component change invalidates only dependent conclusions where narrower invalidation is provable.

Examples:
- HEAD movement invalidates HEAD-bound readiness but need not invalidate Node version;
- provider session/capability changes invalidate hosted conclusions but not local project ID;
- config change invalidates config-bound readiness and any projection derived from that config;
- stable tool facts remain valid when unrelated Git status changes.

Durable cross-run invalidation graphs remain owned later; S05 freezes the dependency semantics required by M04.

### STATE-13 — Reuse is allowed only while requirement and dependencies match
A preflight snapshot or component observation may be reused within an invocation when:
- the requirement fingerprint is equivalent;
- the needed component observation is still valid;
- no stronger binding requirement was introduced;
- cancellation/budget context permits reuse;
- the consuming operation has not crossed a mutation boundary that invalidates the observation.

A weaker previous snapshot cannot satisfy a stronger new request silently.

### STATE-14 — Brownfield remains preservation-first
For existing projects, missing GEF governance/config/identity facts are represented as explicit bootstrap/adoption gaps rather than reasons to scan/rewrite the repository broadly.

S05 does not require complete historical normalization before useful read-only discovery can occur. M13 later owns progressive adoption/maturity and the legal mutations that establish missing governed state.

### STATE-15 — No hidden repair during preflight
S05 and all M04 sessions are observational. Preflight never silently:
- creates `.gef` state;
- writes project config;
- generates/rekeys project ID;
- changes Git config/remotes/branch/index;
- cleans/stashes/resets worktree;
- installs tools;
- authenticates/logs into providers;
- changes hosted settings.

Required repair/remediation becomes a separate admitted operation with its own security class and evidence.

### STATE-16 — No full repository scan is required for baseline state
Project-state composition is built from exact canonical paths and targeted adapters/fact requests. Baseline M04 does not recursively inventory source files, dependencies, frameworks, tests or architecture merely to decide mechanical preflight readiness.

Broader project discovery belongs to explicit later profile/source/planning operations with bounded purpose.

### STATE-17 — Snapshot is compact and secret-safe
Ordinary reusable evidence includes only the fields needed for readiness and stale-state checking. It excludes full environment maps, raw provider payloads, broad Git status detail unless requested, raw tool outputs, credentials and unnecessary absolute paths.

Local diagnostic details may be referenced separately under an owning evidence policy instead of inflating every context capsule.

### STATE-18 — Failure is truthful and non-mutating
Any malformed required component result, incompatible schema, resource exhaustion, timeout, cancellation or conflicting binding terminates or degrades the preflight result truthfully according to the operation contract.

A partial observation set never becomes `READY` when mandatory evidence is missing.

### STATE-19 — Preflight result is deterministic for controlled inputs
Given the same validated requirements, controlled component observations, compatibility/policy inputs and expected bindings, S05 produces the same logical readiness/gap result independent of map/object iteration order or prose rendering.

Nondeterministic provider/environment facts are inputs to the decision and remain explicit observations, not hidden sources of semantic variance.

### STATE-20 — M04 stops before execution authority
An M04 `READY` result means the required deterministic discovery/preflight gates are satisfied at the observed state. It authorizes nothing beyond what the already-admitted operation/policy authorizes.

Mutation owners still revalidate applicable bindings before side effects. Semantic reviewer/DoD approval remains outside M04.

## Security and reliability invariants
- no mutation or hidden remediation in project-state discovery;
- exact target/identity requirements fail closed on ambiguity;
- component gaps preserve owning cause;
- provider/tool access remains least-necessary and request-scoped;
- weaker evidence cannot satisfy stronger binding silently;
- stale expected state blocks execution until refreshed;
- secrets/raw broad snapshots are excluded from compact state;
- diagnostic completeness never justifies unsafe/broad default scanning;
- S4 or provider capability never bypasses explicit authorization.

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
1. project preflight requests only required fact families;
2. local cheap blockers can prevent unnecessary provider/tool calls;
3. independent allowed observations can run concurrently without changing logical result;
4. config state and M03 identity state remain distinct;
5. project mode is not guessed from arbitrary repository heuristics;
6. Git root/remote/HEAD cannot replace `projectId`;
7. operation-relative READY/GAP/BLOCK classes preserve component causes;
8. optional gaps cannot block a path unless the requirement marks them mandatory;
9. missing mandatory evidence cannot produce READY;
10. expected config/identity/repository/HEAD/status/provider/tool bindings can be carried to execution for stale-state recheck;
11. changed bindings produce targeted stale/block behavior;
12. weaker cached snapshot cannot satisfy a stronger request;
13. no preflight path mutates config/Git/provider/tool environment;
14. brownfield missing GEF state remains a bounded adoption/bootstrap gap rather than triggering destructive normalization;
15. baseline project state does not require recursive repository scan;
16. compact snapshot excludes broad local/provider/tool dumps and secret values;
17. malformed component observations fail closed where mandatory;
18. deterministic controlled inputs produce deterministic readiness output;
19. M04 READY does not bypass operation authorization or later mutation revalidation;
20. per-invocation reuse reduces repeated discovery without hiding relevant changes.

## Resolved freeze decisions
1. State role: **ephemeral operation-relative preflight snapshot, never a new canonical project state store**.
2. Composition: **reuse M02/M03/S01-S04 facts rather than duplicating their taxonomies/logic**.
3. Mode/adoption: **M13/workflow owns NEW_PROJECT/BROWNFIELD adoption semantics; S05 carries supplied mode or unresolved gap**.
4. Registry/status/continuity: **M17-M19/M21/M23 retain persistent checkpoint/registry/progress/status ownership**.
5. Execution binding: **S05 emits compact expected-state bindings; mutation owners revalidate before side effects**.
6. Performance: **cheap-blocker short-circuit, bounded parallel independent reads, targeted reuse/invalidation**.
7. Brownfield: **preservation-first; no broad normalization required for early safe discovery**.
8. Repair: **preflight never mutates; remediation is a separate admitted operation**.

## Session completion rule
Planning content is frozen-candidate. Exact-head semantic review must confirm alignment with M01 lifecycle, M02 config, M03 identity, S01-S04 discovery, brownfield requirements, continuity/status ownership and M05+ mutation boundaries. After approval/merge, checkpoint advances to M04 module-gate compilation; implementation remains prohibited until that gate admits a Work Order.

STOP CONDITION: `M04_S05_EXACT_HEAD_REVIEW_REQUIRED`.
