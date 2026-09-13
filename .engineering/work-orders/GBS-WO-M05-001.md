# GBS-WO-M05-001 — Implement Transactional Apply Engine

Status: `ADMISSION_CANDIDATE`
Risk: `ELEVATED`

## OBJECTIVE
Implement the provider-neutral logical transaction engine of `GBS-M05 — Transactional Apply Engine` from frozen S01-S05 and the approved M05 Module Gate. Reuse M01 lifecycle/errors, M02 migration semantics, M03 identity/state binding and M04 preflight/expected-state handoff.

The implementation must make managed mutation mechanically inspectable and fail-closed while preserving the architectural boundary that real filesystem safety belongs to M06.

## CONTEXT
Canonical compilation base: `02ce79a676e9f0527aa2d7e9d052e8972ab9f3ff`.

Context Lock fingerprints:
- S01 Transaction Plan: `7ee8396f81c1201e0aec909518badf13d8fe2593`
- S02 Dry Run: `01dd96173c3435dcd8981e73be5561266635aa00`
- S03 Apply: `9296fa1d8af51257e8d4a5e90fd6b551de851edf`
- S04 Rollback: `7cdcc90333a9cad00802a9abbbe1a1dcc87e0b48`
- S05 Idempotency: `d80a78e4b939f2a6cbfca2f6350367fa50b38a66`
- M05 Module Gate: `1727d60ef00c1835257dfe6d51e41b1f43a578f7`
- root package manifest: `33f1fe6387e5add6274ed7839c9ba4879280b3fb`

If main/base, checkpoint, Scope, Architecture, Security, DoD, Test/Benchmark Plan, S01-S05, Module Gate, relevant M01-M04 public contracts or root build topology changes before implementation admission/exact-head review, mark this Work Order `STALE` and recompile/reconcile it before code execution.

The implementation base SHA is assigned only by the separate admission checkpoint after this Work Order is reviewed and merged.

## SCOPE
Implement only M05-owned provider-neutral logical transaction capability, primarily in `packages/kernel`, with `packages/contracts` used only where a persisted/interchange/public machine contract requires Architecture A8 treatment.

The admitted implementation surface includes:
- canonical/versioned transaction-plan model;
- deterministic plan canonicalization and `planDigest`;
- typed mutation-intent model, deterministic intent identity/order and conflict/DAG validation;
- exact target/pre-state/mutation-surface/security/recovery/verification declaration validation;
- zero-side-effect Dry Run orchestration, state-bound findings/outcomes and deterministic report digest;
- Apply logical state machine and transaction-instance/journal model;
- final pre-state/authorization/cancellation/recovery/staging/verification/commit-barrier/post-state orchestration through injected ports;
- explicit distinction between private operational state, target-visible managed effects and external saga effects;
- compact exact-state-bound Apply receipts;
- rollback eligibility/effect map, exact recovery-material checks, anti-clobber current-state ownership rules, reverse dependency restoration decisions and rollback receipts;
- idempotency scope/effect-state model, duplicate suppression, prior-result/no-op decisions and bounded retry eligibility;
- deterministic fake/in-memory test adapters needed to prove M05 semantics;
- minimal additive exports/integration required by current package architecture;
- focused and broad applicable validation required by the M05 Module Gate.

## OUT OF SCOPE
Do **not** implement or pull forward:
- M06 real filesystem containment, path traversal protection, symlink/junction/reparse handling, case-collision policy, permissions, staging-root selection, fsync/durability or atomic replace/remove/move primitives;
- M07 template engine;
- M08 project profiles;
- M13 project adoption/normalization;
- M17-M19 checkpoint/resume/registry storage engines;
- M24-M28 evidence/proof/test-impact systems;
- M29 local Git mutation commands/history mechanics;
- M30-M33 GitHub/provider mutation/governance/CI/release engines;
- M34-M37 full security/recovery/integrity platforms beyond consuming frozen contracts/ports;
- M38 generic capability registry;
- M43-M45/M57/M63 telemetry, audit, benchmark or quantitative performance-threshold ownership;
- background daemon/scheduler for retries, leases or orphan recovery;
- arbitrary callbacks, shell-command transaction intents or repository-supplied executable code;
- opportunistic brownfield cleanup, formatting, dependency upgrades or naming normalization;
- Codex for Bootstrap implementation.

## FILES / SOURCES TO READ
Read before changes:
1. current `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json`;
2. `.engineering/M05-MODULE-GATE.md`;
3. frozen M05 S01-S05 planning files;
4. `.engineering/ARCHITECTURE.md`, `.engineering/SECURITY.md`, `.engineering/REQUIREMENTS.md`, `.engineering/DEFINITION-OF-DONE.md`, `.engineering/TEST-BENCHMARK-PLAN.md`, Scope and Source Hierarchy;
5. `packages/kernel/src/*`, especially lifecycle/errors/ports/runtime exports;
6. `packages/contracts` current version/schema patterns;
7. M02 config migration implementation/tests;
8. M03 identity transition/binding implementation/tests;
9. M04 preflight expected-state implementation/tests;
10. root package/workspace/tsconfig/lockfile and all current tests.

Inspect the dependency graph before choosing exact filenames. Prefer extending `packages/kernel` coherently. A new top-level production package is prohibited unless concrete dependency analysis proves the frozen architecture cannot be satisfied in the approved placement and the Module Gate is formally amended before implementation continues.

## REQUIREMENTS
All frozen S01-S05 clauses, invariants, required future-proof families and the approved M05 Module Gate are binding acceptance requirements. They are referenced by fingerprints above and are not reinterpreted by the executor.

The implementation must additionally preserve these cross-module invariants:
- M01 remains the canonical invocation lifecycle/terminal/error authority;
- M02 migrations retain their own version/stale/apply/acknowledgement invariants when represented as delegated typed intents;
- M03 identity remains the authority for project/repository target binding; path/name is never identity authority;
- M04 facts/expected-state evidence may be reused only while declared dependencies remain valid;
- authorization remains distinct from capability and idempotency identity;
- S4 behavior is never implicitly authorized;
- unknown/partial effect is never a blind-retry state;
- original terminal receipts are immutable; recovery/retry create linked evidence;
- external Git/provider effects remain sagas and cannot be claimed locally atomic;
- brownfield mutations/restoration touch only admitted exact surfaces;
- missing M06-owned physical safety capability yields a typed BLOCKED/GAP result, never an unsafe fallback.

## IMPLEMENTATION ARCHITECTURE RULES
- TypeScript strict ESM, library/application API first.
- Implement primarily under `packages/kernel/src/`.
- Persisted/interchanged/public JSON contracts crossing boundaries must carry explicit versions and follow `packages/contracts` / JSON Schema 2020-12 policy where applicable.
- Domain logic receives filesystem/recovery/journal/state/authorization/provider-effect observations via explicit injected ports.
- No ambient filesystem/network/shell side effect in pure plan/dry-run/idempotency decision functions.
- Random run/transaction IDs, clocks and machine-local temp paths never alter deterministic semantic `planDigest`.
- All outcome-affecting plan fields participate in deterministic canonicalization/digest.
- Public exports remain minimal and additive.
- Existing M01 typed error/lifecycle projection is reused rather than forked.
- Transaction journal/receipt types are operational/evidence carriers, never canonical project truth.
- Real M06 physical guarantees must be represented as required capabilities at the port boundary and fail closed when absent.
- Fakes/in-memory adapters are test infrastructure, never presented as production filesystem safety.

## SECURITY / RELIABILITY CONSTRAINTS
- Security class is the highest contained effect and cannot be caller-downgraded.
- No target-visible managed effect before the explicit logical commit barrier.
- Recovery material/readiness required by the plan must be established before the effect it protects.
- Final relevant state/authorization revalidation occurs as late as the owning ports permit before promotion.
- Unsafe/unknown concurrency control blocks rather than assumes exclusivity.
- Mandatory post-state verification is required before mechanical success.
- Rollback restores only exact recovery-bound pre-state when current-state ownership proves it will not overwrite later work.
- Rollback of created/updated/deleted/moved targets is guarded individually.
- Secret-bearing values/raw recovery bodies/full provider payloads must not enter normal receipts/logs/errors.
- Mutation auto-retry defaults OFF.
- Effect detection precedes retry after any possible effect.
- `UNKNOWN_EFFECT`, partial apply and partial rollback block blind replay.
- Repeated same request after verified success must not create a second effect.
- Process restart does not manufacture `NO_EFFECT`; durable recovery is M36-owned.

## PERFORMANCE / EXECUTOR-EFFICIENCY CONSTRAINTS
- Preserve smallest-sufficient state/fact acquisition rather than rescanning whole repositories.
- Perform cheap plan/digest/conflict blockers before expensive staging or validation.
- Reuse exact valid observations within one attempt.
- Run independent read-only/preparation checks concurrently only after prerequisites and within bounded resources.
- No-op, already-applied and in-flight duplicate paths must short-circuit target mutation.
- Journal/effect boundaries must allow recovery/review from the smallest unresolved surface.
- Quantitative thresholds remain M63-owned; do not invent promised percentage gains.

## ACCEPTANCE CRITERIA
1. Canonical plan serialization is deterministic under controlled inputs.
2. `planDigest` is stable for identical semantic plans and changes for every tested outcome-relevant semantic delta.
3. Run/transaction IDs, clocks, display text and temp paths do not alter semantic plan identity.
4. Invalid/unsupported plan contracts, missing target bindings, contradictory intents, cycles, duplicate intent IDs and surface expansion fail closed.
5. Dry Run performs zero mutation/staging/recovery/provider side effects.
6. Dry Run results remain state-bound evidence and never authorize Apply or skip Apply-time revalidation.
7. Apply cannot create private operational state before minimum execution gates pass.
8. Apply cannot cross target-visible `COMMIT_BARRIER` without all mandatory gates.
9. Required recovery material is established before the corresponding destructive/overwrite promotion.
10. Staged/pre-promotion verification failure prevents target-visible mutation.
11. Relevant stale/concurrent state at the commit barrier blocks rather than overwrites.
12. Target-visible intents execute in deterministic dependency order; unsafe concurrency is rejected/serialized.
13. Every observed promoted effect is represented sufficiently for later effect detection/recovery.
14. Mandatory post-state verification failure cannot produce success.
15. Apply receipts bind exact plan/pre/post/change/verification truth and remain secret-safe.
16. Private-only abort is distinguishable from target rollback/recovery.
17. Rollback uses actual applied-effect truth, not planned-but-never-applied intents.
18. Rollback recovery material is exact/integrity-bound; approximation/inference is rejected.
19. Rollback does not overwrite current state that diverged after the transaction.
20. Create/update/delete/move rollback guard cases are mechanically tested.
21. Rollback verifies exact restored state before `RESTORED`.
22. Partial rollback preserves already verified restoration progress and reports unresolved effects truthfully.
23. External effects remain separately referenced/compensated sagas; local restoration never claims global atomic reversal.
24. Same request after verified success yields ALREADY_APPLIED/prior-result semantics with no duplicate effect while validity predicates hold.
25. Desired state already present without historical execution proof may yield truthful NOOP without fabricated authorship when owner semantics allow.
26. Equivalent in-flight duplicate does not launch an overlapping mutation attempt.
27. `UNKNOWN_EFFECT`, partial apply, partial rollback and ambiguous provider effect block blind retry.
28. Fully restored/no-effect prior attempts may admit a fresh attempt only after current state/auth/security revalidation and new attempt identity.
29. Automatic retry remains disabled unless an explicit bounded retry policy/failure class opts in.
30. Retry attempt histories are immutable/linked; old plan semantics are never mutated under the same digest.
31. Missing M06 physical-safety capability produces typed blocked/gap outcome rather than unsafe production mutation.
32. Brownfield tests prove unrelated files/state are untouched by plan/apply/rollback/idempotency flows.
33. M02 migration and M03 identity-transition delegated-intent compatibility remains green.
34. Existing M01-M04 regressions remain green.
35. Strict TypeScript typecheck/build passes.
36. Full currently applicable repository tests pass with no skipped critical M05 transaction/recovery path.
37. Locked install/audit shows no new blocking dependency issue.
38. Hosted CI validates the exact reviewed implementation head.
39. Exact-head semantic audit finds no HIGH/CRITICAL defect against M05 frozen sources, Scope, Architecture, Security and DoD.
40. Evidence bundle maps all frozen M05 future-proof/proof families to tests/code/exact-state evidence or a permitted explicit non-blocking disposition.

## TEST / FAILURE-INJECTION REQUIREMENTS
Prefer a bounded `tests/m05.test.mjs` plus additional focused files only if size/clarity materially improves proof ownership.

Tests must include at least:
- plan canonicalization/digest/conflict/DAG/security-floor cases;
- Dry Run READY/NOOP/BLOCKED/CONFLICT/STALE/INDETERMINATE and zero-side-effect assertions;
- Apply failure injection before private effects, after journal/recovery preparation, during staging, staged verification, at commit barrier, during promotion and after promotion before/at post-state verification;
- commit-barrier stale/race denial;
- deterministic promotion order and safe/unsafe concurrency cases;
- rollback create/update/delete/move anti-clobber cases;
- already-restored, partial-restored, invalid recovery material and escalation cases;
- cancellation/timeout semantics before and after target-visible effects;
- duplicate/in-flight/prior-result/no-op/idempotency cases;
- crash/timeout with unknown effect => no blind retry;
- verified rollback/no-effect => fresh retry eligibility only after revalidation;
- provider/external ambiguous-effect simulations through fake ports;
- secret-safety assertions for errors/journals/receipts;
- brownfield bounded-surface fixtures;
- M02/M03 compatibility and M01-M04 regression.

Run at minimum on the accepted implementation head:
- `npm ci --ignore-scripts`
- dependency vulnerability audit appropriate to current Node/npm policy
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run validate`

Because M05 transaction/recovery semantics are a broad-validation trigger, do not replace the current full deterministic repository validation with only focused M05 tests.

## DELIVERABLES
- reconciled kernel/package placement with no unauthorized new top-level package;
- M05 production code and minimal public exports;
- persisted/interchange contract/schema additions only where architecturally required;
- deterministic test ports/fakes;
- focused M05 tests and regression updates;
- package/workspace/lockfile changes only when objectively required;
- implementation PR bound to the admission checkpoint base;
- Context Lock or equivalent exact-base/frozen-source freshness evidence;
- Evidence Bundle containing admitted base, exact reviewed head/tree, changed files, tests/checks, dependency/security observations, transaction/recovery/idempotency proof mapping, corrected findings, residual deferred ownership and proposed Checkpoint Delta.

## REVIEW FORMAT
Brazilian Portuguese. Include:
- concise summary and exact admitted base/head/tree;
- changed files and ownership boundaries;
- S01-S05 / Module Gate acceptance mapping;
- transaction state machine / commit-barrier proof;
- rollback anti-clobber/recovery proof;
- idempotency/no-double-effect/retry-denial proof;
- M06 fail-closed port-boundary proof;
- checks/tests/CI/audit results;
- findings by severity;
- residual risks/deferred ownership;
- Evidence Bundle references;
- proposed checkpoint/progress delta;
- verdict `APPROVED`, `CORRECTION_REQUIRED` or `BLOCKED`.

## STOP CONDITION
Stop only at `M05_IMPLEMENTATION_READY_FOR_EXACT_HEAD_AUDIT`, `CORRECTION_REQUIRED` or `BLOCKED`.

Do not begin M06. Do not award M05 production weight before exact-head implementation evidence, semantic approval, merge and separate MODULE_DONE promotion. Do not use Codex for Bootstrap construction.
