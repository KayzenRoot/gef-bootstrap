# GBS-M05-S02 — Dry Run

Status: `FROZEN`

## Purpose
Freeze the provider-neutral dry-run contract for `GBS-M05 — Transactional Apply Engine`. S02 defines how a frozen S01 `TransactionPlan` is revalidated and simulated against current observable state to produce a compact, exact-state-bound preview of **what would change**, **what would block**, and **which gates remain before apply**, without creating any governed side effect.

Dry Run is not Apply. It creates no staging files, backups, locks, journals, Git/provider mutations, recovery content or authorization.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M05_S02`;
- `GBS-M05-S01 — Transaction Plan` FROZEN;
- frozen Requirements, Architecture A5, Security, DoD and Test & Benchmark Plan;
- M01 lifecycle and typed error/terminal semantics;
- M02 migration preview/apply exact-state semantics;
- M03 identity transition preview/apply semantics;
- M04 request-driven preflight and expected-state bindings;
- M06 ownership of physical filesystem containment/staging/atomic-replace mechanics;
- M36 ownership of broader persisted recovery/resume behavior.

## Ownership boundary
M05-S02 OWNS:
- side-effect-free revalidation of a frozen transaction plan against current observable dependencies;
- dry-run result/outcome vocabulary distinct from M01 invocation terminal state;
- deterministic simulation of logical intent effects where semantics are knowable without mutation;
- compact `wouldChange` manifest and before/after fingerprints/projections where safely computable;
- per-intent readiness/block/conflict/gap projection;
- verification-obligation preview and recovery-requirement feasibility projection;
- unresolved/indeterminate simulation semantics;
- dry-run state binding/fingerprint for later review/comparison;
- guarantee that a dry-run cannot authorize or silently weaken S03 Apply gates.

M05-S02 DOES NOT OWN:
- changing the S01 plan body or digest;
- creating transaction/journal/run identity beyond M01 read-only invocation identity;
- staging writes, temp directories, backup/recovery capture or filesystem locks (S03/M06);
- physical path/symlink/permission/atomic-replace validation implementation (M06), though S02 may consume a read-only M06 preview capability when it exists;
- actual Apply or commit/promotion (S03);
- rollback/compensation execution (S04/M36);
- retry/idempotency policy (S05);
- Git mutation (M29) or provider mutation (M30+);
- semantic authorization/risk acceptance (Security/M16);
- proof graph, durable evidence/audit/telemetry stores (M24/M25/M44/M43).

## Frozen dry-run contract

### DRY-01 — Dry Run is S0 read-only and side-effect free
Dry Run is an `S0_READ_ONLY` operation even when the plan it previews would later require S1-S4 execution.

It MUST NOT:
- write target files;
- create staging/backup/recovery material;
- acquire mutation locks that alter repository state;
- mutate Git/index/branches;
- call provider mutation endpoints;
- install/update tools or dependencies;
- create a durable transaction journal as if execution had begun;
- consume an authorization grant merely by previewing it.

Read-only observation, hashing, schema validation and pure/in-memory transformation are allowed when bounded and admitted.

### DRY-02 — Dry Run consumes an immutable S01 plan
Input is a valid frozen `TransactionPlan` identified by `planDigest`. Dry Run does not patch, normalize or “fix up” the plan in place.

If current state requires a changed target, intent, surface, ordering, verification, recovery or policy semantic, the result is stale/conflict/replan-required rather than a silently modified plan.

### DRY-03 — Invocation success and apply readiness are separate
M01 lifecycle truth remains distinct from dry-run outcome.

A dry-run invocation may mechanically `SUCCEED` because it correctly produced a report while that report says the plan is blocked or stale. Consumers MUST NOT infer apply readiness from M01 `SUCCEEDED` alone.

Baseline dry-run outcomes:
- `READY` — all dry-run-verifiable gates pass and no known blocker exists;
- `NOOP` — plan is valid and no governed mutation would be needed;
- `BLOCKED` — a policy/precondition/capability/recovery/verification requirement definitively blocks apply;
- `CONFLICT` — current observable state conflicts with the plan or intent set;
- `STALE` — a declared plan dependency no longer satisfies its required predicate;
- `INDETERMINATE` — required apply safety/readiness cannot be proven in dry-run with available read-only evidence.

`READY` means **dry-run ready for the next apply gate**, not semantic approval and not permission to execute.

### DRY-04 — Dry Run revalidates plan integrity first
Before simulating effects, S02 verifies at minimum:
- supported plan contract version;
- canonical plan serialization/digest integrity;
- structural validity of target/pre-state/surface/intents/order;
- no duplicate/cyclic/contradictory intent condition missed by S01 validation;
- security floor not internally inconsistent with declared effects.

Tampered/malformed plan data fails closed before deeper reads where possible.

### DRY-05 — Current-state revalidation is smallest-sufficient and exact
Dry Run requests only the current facts required to evaluate the plan’s declared dependencies and intents.

It reuses M04 observation/preflight contracts and owning-module readers. It MUST NOT broaden into a repository-wide scan merely because the plan contains mutations.

For each expected-pre-state binding, Dry Run evaluates the exact declared predicate (`EQUAL`, compatible version rule, or another owning-contract predicate). It cannot silently weaken exactness.

### DRY-06 — Stale dependency blocks simulation claims that depend on it
When a relevant declared dependency no longer satisfies the plan predicate, the dry-run outcome is `STALE` unless an owning compatibility rule explicitly proves the observed delta safe for the same plan semantics.

S02 may still report already-proven independent facts, but MUST NOT compute or present a speculative final state as if the stale dependency were current.

Unrelated changed state does not invalidate the plan when dependency scope proves independence.

### DRY-07 — Simulation is typed and intent-owner driven
Each intent kind has an admitted read-only simulation/preview contract supplied by its owning deterministic adapter/domain implementation.

Dry Run cannot execute arbitrary callbacks or repository code to discover what an intent “would do”. Unknown/unsupported required intent kinds yield `INDETERMINATE`/`BLOCKED` rather than dynamic execution.

Delegated M02/M03 operations retain their own preview invariants; S02 cannot bypass them by treating them as generic file writes.

### DRY-08 — Would-change manifest is compact and deterministic
The normal dry-run result includes a stable logical change manifest such as:

```text
DryRunReport
  schemaVersion
  dryRunContractVersion
  planDigest
  observedStateBinding
  outcome
  intentResults[]
  wouldChange[]
  verificationPreview[]
  recoveryReadiness[]
  authorizationRequirements[]
  unresolvedGaps[]
  reportDigest
```

`wouldChange` entries describe logical target/effect class and bounded before/after identity/fingerprint/projection where safely computable. They do not embed unnecessary full file contents, secrets, complete provider payloads or raw recovery data.

Stable ordering follows S01 intent/dependency order and canonical target ordering.

### DRY-09 — Dry-run report identity is state-bound and deterministic
`reportDigest` binds the dry-run semantic report to:
- `planDigest`;
- exact observed dependencies used by the dry run;
- dry-run contract version;
- policy/compatibility references that affect the reported result;
- deterministic intent results/change manifest/gaps.

Random run IDs, wall-clock timestamps, temp paths and non-semantic display prose do not change `reportDigest`.

Identical plan + identical relevant observed state + identical policy versions produce the same semantic report digest.

### DRY-10 — Report binding never replaces Apply revalidation
A green dry run is evidence about the observed state at preview time. It is not a lease on future state and is never sufficient by itself to skip S03 pre-effect revalidation.

S03 must revalidate the exact dependencies required by Apply. If state changed after the report, the report becomes stale for those conclusions.

There is no universal time-to-live that substitutes for dependency revalidation.

### DRY-11 — Physical filesystem safety may be previewed only through M06-owned read-only capability
S02 may eventually consume a read-only M06 preview for path containment, case collision, symlink/reparse behavior, same-filesystem constraints or replace feasibility.

Until that proof exists, S02 must represent the physical-safety requirement as unresolved rather than duplicating/ad-libbing M06 rules.

Dry Run does not create temp/staging paths to “test” atomic replace.

### DRY-12 — Verification preview proves availability, not success
For each S01 verification obligation, Dry Run may determine:
- `CHECKABLE_NOW` — obligation can be evaluated against current/read-only simulated state;
- `REQUIRES_STAGED_STATE` — meaningful only after S03 staging;
- `REQUIRES_POST_STATE` — meaningful only after commit/promotion;
- `REQUIRES_EXTERNAL_OBSERVATION` — provider/external verification owned elsewhere;
- `UNAVAILABLE` — required mechanism/evidence cannot currently be obtained.

Dry Run MUST NOT mark a staged/post-state verification as passed merely because its validator exists.

### DRY-13 — Recovery readiness is assessed without capturing recovery material
Dry Run can evaluate whether declared recovery requirements appear satisfiable based on read-only facts and capability/policy contracts, but it MUST NOT create backup/pre-image material.

Baseline readiness states:
- `READY_TO_CAPTURE_AT_APPLY`;
- `NOT_REQUIRED`;
- `BLOCKED_UNAVAILABLE`;
- `INDETERMINATE_UNTIL_APPLY`;
- `IRREVERSIBLE_DISCLOSURE_REQUIRED`.

A successful dry-run recovery assessment is not proof that S03 actually captured recovery material. S03 must prove capture before first managed effect where required.

### DRY-14 — Authorization requirements are surfaced, never consumed
Dry Run reports the authorization/policy requirements implied by the plan and current state. It may report whether an authorization reference is structurally present/eligible when policy allows read-only evaluation, but it does not spend, mint, persist or infer authorization.

S4 remains action-and-target-specific and requires explicit execution-time owner authorization under Security.

### DRY-15 — External saga effects are previewed as non-atomic declarations
For external effects, Dry Run may report target/capability/permission/compensation/verification readiness using read-only provider observation when explicitly required by the plan.

It must preserve the distinction between:
- provider capability available;
- authorization granted;
- forward effect not yet executed;
- compensation theoretically available;
- compensation actually proven.

It cannot describe provider effects as part of local atomic filesystem rollback.

### DRY-16 — No-op remains zero-effect
For an S01 no-op plan, Dry Run verifies the dependencies that justify no-op and returns `NOOP` only while those dependencies remain valid.

It produces no staging/recovery/journal side effect and no fabricated changed-path list.

If current state no longer matches the no-op basis, outcome becomes `STALE`/`CONFLICT`; S02 does not silently convert the old plan into a mutation plan.

### DRY-17 — Brownfield dry run does not normalize unrelated state
In EXISTING_PROJECT/BROWNFIELD mode, Dry Run observes only facts required by admitted plan targets/dependencies. Unrelated legacy files, architecture, branches, conventions or historical gaps are not treated as implicit work.

The report MUST NOT generate “would change” entries merely to make the repository resemble a greenfield template.

### DRY-18 — Indeterminate is truthful and non-promotable
When safe Apply readiness depends on information that cannot be known without a later phase or unavailable owner capability, S02 returns `INDETERMINATE` or a typed unresolved gap.

It never converts unknown into `READY` for convenience. Assurance may require broader observation, but the expansion is explicit and owned.

### DRY-19 — Conflict/block precedence is deterministic
If several findings exist, the report preserves all bounded relevant findings but exposes one deterministic primary outcome. Baseline severity/precedence:

```text
TAMPERED/INVALID PLAN -> BLOCKED
TARGET/IDENTITY CONFLICT -> CONFLICT
RELEVANT PRE-STATE MISMATCH -> STALE
DEFINITIVE POLICY/AUTH/SAFETY DENIAL -> BLOCKED
REQUIRED UNKNOWN EVIDENCE -> INDETERMINATE
NO CHANGES -> NOOP
OTHERWISE -> READY
```

The exact typed reason taxonomy remains M01/shared-policy owned; S02 freezes only outcome precedence.

### DRY-20 — Dry Run may compute pure content transformations, not execute target code
When a managed artifact’s proposed content is deterministically available from admitted input, S02 may compute an in-memory result/fingerprint/diff through a trusted deterministic transformer.

It MUST NOT import/execute arbitrary repository scripts, hooks, templates with executable code or untrusted shell commands merely to preview output.

Executable template/plugin behavior belongs to its owning later module and security boundary.

### DRY-21 — Change detail is risk-appropriate and bounded
The normal machine report favors compact manifests/fingerprints. A human/operator projection may request bounded diffs for admitted text targets when safe and useful.

Binary/large/sensitive content defaults to metadata/fingerprint/change classification rather than raw embedding. Size/output budgets are explicit. Truncation is represented truthfully, not as complete diff proof.

### DRY-22 — Dry Run cannot downgrade plan gates
S02 may discover **additional** blockers, verification requirements or safety gaps. It cannot remove a S01 security floor, authorization requirement, recovery requirement or mandatory verification obligation.

If the plan itself overstates a restriction, changing it requires governed replanning; Dry Run does not mutate semantic intent to be “more permissive”.

### DRY-23 — Dry Run integrates with M01 lifecycle efficiently
Logical flow:

```text
RECEIVED
-> VALIDATING
-> PREFLIGHTING
-> DRY-RUN REVALIDATE
-> SIMULATE
-> REPORT/RECEIPT
-> SUCCEEDED (mechanical invocation)
```

Side-effect phases are absent. Zero-cost checks may collapse physically for latency, but report evidence must preserve which gates were evaluated and which remain deferred.

Cancellation/timeout before completion produces normal M01 read-only terminal semantics. No recovery is required because S02 creates no effects.

### DRY-24 — Report is suitable for semantic/operator review without becoming authority
Dry-run output exists to reduce executor/operator uncertainty before mutation. It may be consumed by later review/context compilers, but it does not decide semantic scope, approve risk, or make itself canonical project truth.

Canonical intent remains the admitted source + immutable S01 plan. Dry-run report is derived state/evidence bound to its dependencies.

## Dry-run readiness invariants
A report may return `READY` only when all applicable conditions below hold:
1. plan contract/version/digest is valid;
2. target binding is non-conflicted;
3. all mandatory current-state predicates observable in S02 pass;
4. every required intent kind has a trusted preview contract;
5. no plan dependency is stale;
6. no definitive policy/security denial is present;
7. mutation surface remains within admitted scope;
8. no contradictory would-change result exists;
9. verification obligations are accounted for and none required-now is failed;
10. recovery requirements are either ready-to-capture, not required or explicitly deferred to an allowed later phase;
11. external effects remain clearly non-executed/non-atomic;
12. no required physical-safety proof is falsely assumed;
13. no mandatory evidence remains unknown.

`READY` still does not authorize S03 execution.

## Security and reliability invariants
- zero mutation side effects;
- plan integrity before simulation;
- exact relevant state revalidation;
- fail closed on tamper/conflict/stale mandatory state;
- no arbitrary repository code execution;
- no secret/auth/recovery payload persistence;
- no false claim of staged/post-state verification;
- no false claim that backup/recovery capture already occurred;
- no authorization consumption/inference;
- provider effects remain non-atomic sagas;
- bounded output/diffs;
- unknown mandatory safety evidence is explicit.

## Token/time economy invariants
- only plan-declared dependencies are rediscovered;
- current facts reuse M04 per-invocation observation where valid;
- deterministic report digest avoids repeated prose inspection;
- compact would-change manifests replace full-file rereads when sufficient;
- no-op exits before expensive preview work where dependencies prove it safely;
- independent read-only intent simulations may run concurrently after shared prerequisites when their dependency sets do not overlap unsafely;
- stale/block conditions short-circuit downstream simulation whose result would be invalid;
- detailed diff expansion is on-demand, not baseline.

## Required future proof
Implementation must eventually prove:
1. Dry Run performs zero repository/Git/provider/recovery/journal mutation;
2. identical plan + relevant observed state + policy versions produce identical semantic report digest;
3. report digest changes when a relied-on state/policy/result changes;
4. tampered/unsupported plan blocks before deeper simulation;
5. relevant stale pre-state yields `STALE` before any effect;
6. unrelated state changes do not invalidate independent conclusions when dependency scope proves it;
7. Dry Run requests only plan-required fact families and avoids broad repository scans;
8. unsupported intent preview fails closed without executing repository code;
9. deterministic intent ordering yields stable would-change ordering;
10. current target conflict and plan conflict remain distinguishable from staleness;
11. a green dry run cannot bypass S03 exact-state revalidation;
12. M06-owned physical safety is consumed/deferred, never duplicated or guessed;
13. staged/post-state-only verification cannot be marked PASS during dry run;
14. recovery readiness does not create backup/pre-image material;
15. missing recovery capability blocks/indeterminates according to plan requirement;
16. authorization requirements are surfaced without minting/consuming authorization;
17. S4 remains explicit execution-time authorization required;
18. provider saga preview performs zero provider mutation and never claims local atomic rollback;
19. no-op dry run produces zero would-change and becomes stale if its basis changes;
20. brownfield preview produces no unrelated normalization changes;
21. unknown mandatory evidence yields `INDETERMINATE`, never `READY`;
22. deterministic outcome precedence handles multiple findings consistently;
23. bounded pure content previews cannot invoke arbitrary callbacks/shell/repository scripts;
24. large/binary/sensitive targets use bounded metadata rather than unbounded content output;
25. Dry Run cannot downgrade S01 security/recovery/verification/authorization requirements;
26. cancellation/timeout requires no recovery because no side effect occurred;
27. parallel read-only preview is allowed only for proven-independent dependencies and remains deterministic;
28. report is compact/secret-safe and excludes temp paths, credentials, raw recovery material and unnecessary absolute paths;
29. M02 migration and M03 identity delegated previews retain their owning invariant/result semantics when surfaced through S02;
30. Windows/Linux/macOS fixtures show platform-neutral logical dry-run behavior while M06-specific filesystem differences remain delegated.

## Resolved freeze decisions
1. Dry Run class: **S0 read-only regardless of the future plan security class**.
2. Readiness vocabulary: **READY / NOOP / BLOCKED / CONFLICT / STALE / INDETERMINATE**, separate from M01 invocation terminal state.
3. Apply authority: **a green dry run never authorizes or leases future state; S03 revalidates**.
4. Mutation: **no staging, backup, lock, journal, Git/provider write or hidden repair**.
5. Simulation: **typed owner-provided preview contracts only; no arbitrary repository code execution**.
6. Filesystem boundary: **M06 physical safety may be consumed read-only or represented as unresolved, never duplicated/guessed**.
7. Verification: **current-checkable vs staged/post-state/external obligations remain explicit**.
8. Recovery: **feasibility only; material capture belongs to Apply/recovery owners**.
9. External effects: **previewed as non-executed sagas, never locally atomic**.
10. Report identity: **deterministic state-bound `reportDigest`; random run/time/temp data excluded**.
11. Brownfield: **preview admitted surfaces only, no implicit normalization**.
12. Unknown safety evidence: **INDETERMINATE, never optimistic READY**.

## Freeze record
The canonical reviewed head is recorded by the exact-head PR review/merge evidence rather than embedded here, avoiding self-referential evidence commits.

## Session completion rule
M05-S02 is frozen only after exact-head semantic review and merge. Planning earns `0/20` M05 production weight. After checkpoint promotion, the next legal planning session is `GBS-M05-S03 — Apply`. No M05 implementation Work Order may be compiled/admitted until S01-S05 and the module gate are complete.

STOP CONDITION: `M05_S02_FROZEN`.
