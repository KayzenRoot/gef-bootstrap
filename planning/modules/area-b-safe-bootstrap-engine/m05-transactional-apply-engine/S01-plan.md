# GBS-M05-S01 — Transaction Plan

Status: `FROZEN`

## Purpose
Freeze the provider-neutral logical transaction-plan contract for `GBS-M05 — Transactional Apply Engine`. S01 defines what a mutation plan is, how it binds to exact pre-state and admitted mutation surfaces, how deterministic plan identity is computed, and what information later dry-run/apply/rollback/idempotency sessions must consume.

S01 is planning only. It does not implement writes, staging, rollback, journaling or retries.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M05_PLANNING` after M04 `MODULE_DONE`;
- frozen Requirements, Scope, Architecture, Security, Definition of Done and Test & Benchmark Plan;
- `GBS-M01-S03 — Deterministic Lifecycle` FROZEN;
- completed M02 Configuration & Schema preview/apply contracts;
- completed M03 Project Identity transition preview/apply contracts;
- completed M04 Preflight & Discovery exact-state/expected-binding contracts;
- Architecture A5 transaction envelope: `plan → stage → verify → commit/promote`;
- Security `REQ-SEC-004/005`, SEC-01/02/03/09 and filesystem/Git/evidence cross-cutting rules;
- Master Module Index: M05 sessions are S01 Plan, S02 Dry Run, S03 Apply, S04 Rollback, S05 Idempotency.

## Ownership boundary
M05-S01 OWNS:
- immutable logical transaction-plan shape and version;
- deterministic semantic plan identity/digest contract;
- exact target/project/repository binding references consumed from M03/M04;
- expected-pre-state binding requirements;
- declared ordered mutation intents and dependency ordering;
- admitted mutation-surface declaration;
- declared verification obligations;
- declared recovery/compensation requirements and reversibility classification metadata;
- security-class and authorization-requirement projection into the plan;
- plan validity/staleness inputs;
- plan-level deterministic conflict detection for contradictory intents;
- compact, secret-safe plan representation suitable for S02-S05.

M05-S01 DOES NOT OWN:
- physical path containment, symlink/junction/reparse-point safety, permission semantics, staging directories, fsync or atomic-replace mechanics (M06);
- dry-run simulation/report semantics (M05-S02);
- actual mutation execution/commit promotion (M05-S03);
- rollback/compensation execution (M05-S04, with M36 recovery ownership where broader recovery applies);
- retry/idempotency execution policy (M05-S05 and M01 lifecycle constraints);
- Git index/branch/commit mutation mechanics (M29);
- hosted-provider side effects/sagas (M30+ and owning provider modules);
- proof graph/invalidation engine (M24/M25/M37);
- durable audit ledger/telemetry storage (M44/M43);
- policy/risk acceptance itself (Security/M16 and semantic governance);
- content hashing policy authority beyond consuming an injected/versioned digest capability (M37 later owns broad integrity policy).

## Frozen transaction-plan contract

### PLAN-01 — Plan generation is pure read-only work
Building a transaction plan is `S0_READ_ONLY`. Plan generation performs no governed mutation, staging write, backup, Git mutation, provider side effect, dependency installation, repair or hidden normalization.

The planner may consume already-admitted canonical intent plus validated M02/M03/M04 state. If a required fact is missing/conflicted/stale, planning returns a typed gap/block rather than inventing state.

### PLAN-02 — Plan is semantic execution intent, not an execution attempt
A plan describes **what** governed mutation would be attempted against **which exact expected state**. It is not itself a run, transaction journal or execution attempt.

Three identities remain distinct:
1. `planDigest` — deterministic semantic identity of the canonical plan body;
2. M01 `runId` — invocation/correlation identity created when an execution invocation is accepted;
3. transaction/journal instance identity — operational identity created only when S03/S04 execution ownership requires durable transaction state.

Random run/transaction IDs, clocks and machine-local paths MUST NOT participate in `planDigest`.

### PLAN-03 — Canonical plan shape is explicit and versioned
Baseline logical shape:

```text
TransactionPlan
  schemaVersion
  planContractVersion
  targetBinding
    projectId?                 # when project identity is applicable
    repositoryIdentity?        # canonical M03 projection when applicable
    bindingStrength
  expectedPreState[]           # compact exact-state bindings from owning facts
  securityClass                # minimum S0..S4 classification for planned effects
  authorizationRequirements[]  # policy/owner grants required before execution
  mutationSurface[]            # admitted logical targets/surfaces
  intents[]                    # typed logical mutation intents
  ordering[]                   # explicit dependency edges / stable order rules
  verificationObligations[]    # required staged/post-state checks
  recoveryRequirements[]       # recovery material/compensation expectations
  externalEffectDeclarations[] # declaration only; no provider execution in M05 core plan
  policyRefs[]                 # versioned policy identities affecting semantics
  planDigest
```

Persisted/interchanged plans use an explicit schema/contract version. Unknown required major versions fail closed.

### PLAN-04 — The plan binds exact expected pre-state, not only target names
Mutation authority requires both target identity and applicable expected state. The plan consumes compact expected-state bindings from M04/M02/M03 or other owning contracts rather than rediscovering state by path/name heuristics.

Examples may include:
- project/config fingerprint;
- repository identity fingerprint;
- relevant file/content fingerprint;
- HEAD/index/status binding when a later owner requires it;
- schema/migration graph/version binding;
- provider state binding only for a separately admitted provider saga.

Each pre-state binding declares its owner/type/version and whether equality, compatibility or another explicit predicate is required. A consumer cannot silently weaken an exact predicate to “approximately current”.

### PLAN-05 — Mutation surface is default-deny and positively enumerated
Every plan declares the logical mutation surface it is allowed to affect. An execution engine may narrow the surface further but may not silently expand it.

The surface uses provider-neutral logical targets. Raw absolute local paths may exist in an execution-local resolution layer when M06 requires them, but canonical/reusable plan identity should prefer stable project-relative/logical target references.

Unexpected target expansion after plan creation invalidates the plan or requires a new plan.

### PLAN-06 — Intents are typed data, never arbitrary callbacks or shell commands
A plan contains typed mutation intents, not executable closures, arbitrary repository scripts or shell command strings.

Baseline intent categories are logical and extensible, for example:
- create managed artifact;
- replace/update managed artifact;
- remove managed artifact when explicitly admitted;
- move/promote managed artifact;
- apply an owning-module transition/migration through a typed delegated contract;
- declare external saga effect for a later provider owner.

S01 does not freeze all future domain-specific intent kinds. New kinds require versioned contract compatibility and an owning execution adapter. Unknown required intent kinds fail closed.

### PLAN-07 — Stable intent identity and ordering are deterministic
Each intent has a stable plan-local `intentId` derived from admitted logical input or deterministically assigned from canonical order. It is not a random UUID.

Order is explicit. Independent intents may be represented as a dependency DAG, but canonical serialization uses a deterministic stable ordering. Cycles, duplicate intent IDs, contradictory writes to the same logical target, or ambiguous ordering that could alter outcome are plan conflicts and block execution.

S03 may execute proven-independent physical work concurrently only if doing so preserves the plan semantics and M06 safety; S01 merely describes dependencies.

### PLAN-08 — One logical target cannot receive ambiguous competing final states
If multiple intents affect the same logical target, the plan must either:
- collapse them deterministically into one admitted final intent before freezing the plan; or
- express a deterministic dependency chain whose intermediate states are semantically required and verifiable.

Two unordered competing final writes, create-vs-delete ambiguity, move cycles or incompatible delegated transitions fail closed as `PLAN_CONFLICT` or equivalent typed reason.

### PLAN-09 — Security class is an inherited floor, not caller preference
The plan records the minimum security class implied by its highest-impact declared effect using frozen Security S0-S4 rules.

A caller may request stricter treatment but cannot downgrade the computed floor. Splitting one dangerous change into multiple intents cannot reduce its transaction security class.

S4 declarations require separate target-specific owner authorization before execution; the plan may expose that requirement but cannot manufacture the authorization.

### PLAN-10 — Authorization requirement is distinct from observed capability
The plan can declare required policy/authorization references. Capability presence from M04/provider/tool discovery does not become authorization.

Authorization tokens/secrets are never embedded in the plan. Execution receives authorized references/capabilities through the owning policy boundary.

### PLAN-11 — Verification obligations are part of plan semantics
A mutation plan declares the checks required before terminal success. Verification obligations may target:
- staged content fingerprint;
- schema/contract validation;
- expected changed-path manifest;
- post-state fingerprint;
- owning-module invariant;
- provider-side verification for a separately orchestrated saga.

S03 cannot declare success while silently omitting a mandatory plan verification obligation. Later assurance modules may require additional checks, but they cannot weaken these minimum obligations.

### PLAN-12 — Recovery readiness is declared before mutation
The plan classifies each effect with the recovery material/compensation expectation needed before execution begins.

Baseline recovery classes:
- `REVERSIBLE_MANAGED` — inverse/pre-image can be captured and restored under M05/M06;
- `COMPENSATABLE_EXTERNAL` — external effect has an owning compensating action, but is not falsely atomic;
- `IRREVERSIBLE_OR_UNPROVEN` — safe automatic recovery cannot be claimed;
- `NO_EFFECT` — read-only/no-op semantic intent where applicable.

Any S1+ managed write requires a declared recovery requirement. S4 or irreversible/unproven effects require explicit disclosure/authorization under Security before execution.

The plan stores bounded requirements/references, not secret or large recovery payloads.

### PLAN-13 — External effects are declared but not folded into false local atomicity
Provider/adaptor effects are modeled as external declarations/saga steps with their own owner, target identity, required capability/authorization, verification and compensation availability.

A local transaction plan must never claim that a GitHub/provider side effect can be rolled back atomically with filesystem renames. S03+ orchestration reports partial external effect truthfully through M01 lifecycle classifications when needed.

### PLAN-14 — Canonical plan digest covers all semantic fields that can change outcome
`planDigest` is calculated from a canonical serialization of the semantic plan body using an injected/versioned digest port. The digest input includes target binding, expected pre-state, security floor, mutation surface, intents/order, verification/recovery requirements, external declarations and policy refs that affect semantics.

Excluded from semantic digest:
- `planDigest` itself;
- clocks/timestamps used only for observation/audit;
- run IDs, journal IDs and retry-attempt IDs;
- local temp/staging paths;
- non-semantic display prose;
- telemetry counters;
- credentials/secrets.

Identical governed semantic inputs under the same contract/policy versions produce the same `planDigest`.

### PLAN-15 — Plan validity is dependency-bound, not time-to-live guessed
A plan is valid only while its declared semantic dependencies remain satisfied. There is no arbitrary universal TTL that substitutes for exact-state checking.

Before dry-run/apply, the consumer revalidates applicable target/pre-state/policy/contract dependencies. Any relevant mismatch yields a stale/conflict result and requires replanning unless an owning compatibility rule explicitly permits the observed delta.

Unrelated state changes do not invalidate the plan when narrower dependency binding is provable.

### PLAN-16 — Replanning creates a new semantic plan, never mutates a frozen one in place
Once emitted for review/execution, a plan is immutable. If intent, surface, target, pre-state, policy or verification/recovery semantics change, compile a new plan with a new digest.

An old plan/receipt may link to the superseding digest, but it is not rewritten to pretend the original intent was different.

### PLAN-17 — No-op is first-class and must not manufacture writes
If desired state already equals applicable current state and owning semantics confirm no mutation is required, planning may emit a deterministic no-op plan/result.

A no-op plan has zero managed mutation intents, preserves the relevant target/pre-state bindings, and declares why no change is required. S03 must not create staging/recovery writes merely to “execute” a no-op.

### PLAN-18 — Brownfield plans are bounded to declared targets
EXISTING_PROJECT/BROWNFIELD does not imply repository normalization. A plan may alter only explicitly admitted targets and must preserve unrelated architecture/files/history.

Missing GEF-managed artifacts may be proposed only by an owning admitted workflow. The transaction planner does not recursively discover or rewrite unrelated files for naming conformity.

### PLAN-19 — Plan errors are typed, compact and secret-safe
Plan construction/validation emits M01-compatible typed categories/reason codes. Representative reason families include:
- invalid plan contract/version;
- missing/conflicted target binding;
- stale/missing expected pre-state;
- forbidden/unadmitted mutation surface;
- duplicate/cyclic/contradictory intents;
- unsupported intent kind;
- authorization required/denied;
- recovery requirement unsatisfied;
- incompatible policy/contract version.

Errors/plan evidence never echo secrets, complete provider payloads, large file contents or unnecessary absolute paths.

### PLAN-20 — Planning is bounded and does not become repository-wide mutation analysis by default
S01 plan compilation consumes already-bounded admitted intent and state. It does not recursively inventory the repository, inspect every file, enumerate software, call hosted providers or compute unrelated hashes simply because a mutation may happen later.

If an admitted operation requires wider discovery, M04/owning modules expand the exact required fact graph before plan compilation.

### PLAN-21 — M01 lifecycle integration is explicit
For mutation-capable invocations, M05 Plan occupies the logical `PLAN` / `VALIDATE PLAN` portion of the M01 lifecycle envelope.

No handler may enter side-effecting execution until:
- plan schema/contract is valid;
- plan digest integrity is valid;
- target and expected pre-state are revalidated as required;
- mutation surface is admitted;
- security/policy/authorization prerequisites pass;
- recovery readiness prerequisites required before first effect are satisfiable;
- cancellation/deadline state permits execution.

Physical zero-cost gates may collapse for latency, but receipts must prove the logical gates were satisfied.

### PLAN-22 — Plan representation is compact enough for context compilation
Normal downstream execution/review contexts carry the canonical compact plan or a digest-bound projection, not raw source documents or full repository state.

Large proposed content should be referenced by bounded staged/content artifact identity or fingerprint when the owning operation can do so safely; the plan should not become a duplicate archive of target files.

This supports later M14/M15/M24/M25 context/evidence compilers without making them M05 dependencies.

## Plan validation invariants
A plan candidate is executable-in-principle only if all applicable invariants hold:
1. supported plan contract version;
2. canonical target binding structurally valid;
3. required exact/compatible pre-state bindings present;
4. mutation surface non-ambiguous and admitted;
5. every intent kind supported by a declared owner/adapter contract;
6. intent IDs unique and stable;
7. dependency graph acyclic;
8. competing target effects deterministically resolved;
9. computed security class is not below any contained effect;
10. required authorization declarations are present;
11. every managed mutation has recovery classification;
12. mandatory verification obligations are declared;
13. policy/contract refs are versioned where semantics depend on them;
14. canonical serialization reproduces the same digest;
15. no secret/raw recovery payload/unbounded local material is embedded.

Failure of any mandatory invariant blocks S03 execution.

## Security and reliability invariants
- default-deny mutation surface;
- exact target identity before write authority;
- expected pre-state rather than name/path trust;
- no arbitrary callbacks/shell commands in plan data;
- no security-class downgrade by decomposition;
- authorization distinct from capability;
- recovery expectation known before first effect;
- irreversible/external limitations stated truthfully;
- immutable digest-bound plans;
- secret-safe compact artifacts;
- stale/tampered plan fails closed;
- brownfield unrelated surfaces remain untouched.

## Token/time economy invariants
- plan compilation consumes bounded admitted intent instead of rediscovering the repository;
- deterministic canonical digest lets later stages refer to the plan compactly;
- target/pre-state bindings reuse M04/M02/M03 facts;
- dependency edges make safe concurrency explicit without executor rediscovery;
- no-op detection can stop the pipeline before staging;
- typed plan conflicts/gaps avoid repeated model interrogation;
- large contents/recovery data are referenced rather than copied when safe;
- irrelevant environment/provider/tool facts are excluded.

## Required future proof
Implementation must eventually prove:
1. plan generation is mutation-free and has no hidden staging/provider effect;
2. controlled identical semantic inputs produce byte/canonical-equivalent plan bodies and identical `planDigest`;
3. random run/journal IDs, clocks and temp paths do not alter semantic plan digest;
4. digest changes when any outcome-relevant target/pre-state/intent/order/verification/recovery/policy field changes;
5. malformed/unsupported plan versions fail closed;
6. missing/conflicted target identity blocks planning/execution;
7. relevant expected-pre-state change marks a plan stale before first effect;
8. unrelated changes can preserve plan validity when dependency scope proves independence;
9. mutation surface cannot expand at execution time without a new plan;
10. arbitrary callback/shell-command payloads cannot enter trusted intent execution;
11. duplicate IDs, dependency cycles and unordered competing target writes are rejected;
12. security class equals at least the highest contained effect and cannot be caller-downgraded;
13. S4/irreversible requirements surface explicit authorization/disclosure rather than executing implicitly;
14. managed write intents cannot become executable without recovery classification/requirements;
15. mandatory verification obligations cannot be dropped by S03;
16. external saga declarations cannot be represented as locally atomic rollback;
17. no-op plans trigger no staging/recovery mutation;
18. brownfield planning touches only admitted target surfaces;
19. plan/errors/receipts contain no plaintext secret or unbounded file/provider payload;
20. plan compiler performs no broad repository/provider/tool discovery by default;
21. plan integrates with M01 cancellation/deadline/preflight gates before side effects;
22. M02 config migration and M03 identity transition can be represented through typed delegated intents without allowing ordinary transaction planning to bypass their own invariants;
23. plan contract fixtures cover compatible additive evolution and fail-closed incompatible major versions;
24. deterministic tests cover Windows/Linux/macOS-neutral logical plan semantics without embedding platform-specific path assumptions.

## Resolved freeze decisions
1. Semantic plan identity: **deterministic `planDigest`; random M01 run ID and transaction/journal attempt identity stay separate**.
2. Plan mutation authority: **target + expected pre-state + admitted mutation surface are all required; path/name alone never grants write authority**.
3. Intent representation: **typed declarative data, never arbitrary callbacks or shell command strings**.
4. Ordering: **explicit deterministic dependency/order contract; cycles and outcome-affecting ambiguity fail closed**.
5. Recovery: **recovery/compensation requirement is declared in the plan before mutation; physical capture/execution belongs to later sessions/M06/M36**.
6. External effects: **saga declarations remain separate from local transaction atomicity**.
7. Validity: **dependency-bound revalidation, not arbitrary universal TTL**.
8. Replanning: **immutable old plan + new digest; never in-place semantic rewrite**.
9. No-op: **first-class zero-write outcome**.
10. Brownfield: **bounded admitted targets only; no forced whole-project normalization**.
11. M06 boundary: **M05 owns logical transaction semantics; M06 owns filesystem path/staging/atomic replacement safety**.
12. Integrity ownership: **M05 consumes an injected/versioned digest capability; broad integrity/hash policy remains delegated to M37**.

## Freeze record
Planning contract is frozen for exact-head review on PR `#88`. The immutable reviewed head is recorded by the PR review itself rather than embedded here, avoiding a self-referential evidence commit.

## Session completion rule
M05-S01 is frozen after exact-head semantic review and merge. Planning earns `0/20` M05 production weight. After checkpoint promotion, the next legal planning session is `GBS-M05-S02 — Dry Run`. No M05 implementation Work Order may be compiled or admitted until S01-S05 and the M05 module gate are complete.

STOP CONDITION: `M05_S01_FROZEN`.
