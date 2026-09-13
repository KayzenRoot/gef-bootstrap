# GBS-WO-M04-001 — Implement Preflight & Discovery Foundation

Status: `ADMISSION_CANDIDATE`
Risk: `STANDARD`

## OBJECTIVE
Implement the bounded production foundation of `GBS-M04 — Preflight & Discovery` from the frozen S01-S05 contracts. Reuse M01 runtime/lifecycle, M02 configuration and M03 identity. Optimize the common path around the smallest sufficient fact graph.

## CONTEXT
Canonical base: `894a05363f3ee4cde0d4805941c9bb63aa823303`.

Context Lock fingerprints:
- S01 Environment `014c8acb0fa257f141c3830651f0a14dbf27f3db`
- S02 Git `e536cae93b5365561f6e844cd4e3344eef1e63be`
- S03 GitHub `3608211d3dc13fcd4318f70588e0b668240e49fc`
- S04 Toolchain `42bdb16679df056c040d848e78ecf1a8d07db22d`
- S05 Project State `22ccc8e94ba726f680edd0beec932797ca2e55ae`
- M04 Module Gate `33c85959ea4af0e8152ea92ad5e7440f764d5eac`
- root package manifest `5b974bba4a0619c25ff115f468098abc6cc4b780`

If base main, checkpoint, Scope, Architecture, DoD, S01-S05 or Module Gate changes before exact-head review, mark this Work Order `STALE` and recompile/rebase.

## SCOPE
Implement only M04-owned read-only discovery/preflight capability:
- injected environment observation;
- request-driven local Git observation;
- conditional hosted-profile observation;
- request-scoped logical-tool observation;
- operation-relative project-preflight requirements/snapshot;
- cheap-blocker short-circuit;
- bounded concurrency for independent reads after prerequisite binding;
- per-invocation reuse with targeted dependencies;
- expected-state bindings for later stale-state revalidation;
- compact typed readiness/gap results;
- focused tests and required workspace/build wiring.

## OUT OF SCOPE
Do not implement M05/M06 mutation/recovery, M13 adoption changes, M17-M19 continuity/registry, M21-M23 progress/status, M24/M25 proof graph, M29 Git mutation, M30-M33 hosted mutations/governance/CI/release, M38 general capability registry, M51 compatibility-policy ownership, M63 benchmark thresholds, dependency repair, broad repository inventory or semantic product decisions.

## FILES / SOURCES TO READ
Read before changes:
1. current checkpoint and `.engineering/M04-MODULE-GATE.md`;
2. Scope, Architecture, Security, DoD and Test/Benchmark Plan;
3. frozen M04 S01-S05;
4. relevant M01 runtime/lifecycle/error implementation;
5. M02 config/schema implementation/tests;
6. M03 project-identity implementation/tests;
7. root package/workspace config, lockfile and current tests.

Inspect the repository before choosing package placement. Prefer a bounded provider-neutral M04 surface only if it fits the existing dependency graph better than extending an established boundary.

## REQUIREMENTS
All frozen S01-S05 clauses and all implementation proof families in the M04 Module Gate are binding acceptance requirements for this Work Order. They are referenced by fingerprint above and are not duplicated here.

The implementation must additionally prove:
- no discovery during import/startup;
- local-only paths perform no hosted lookup;
- requested fact families drive work;
- cheap blockers avoid unnecessary later observations;
- independent reads may run concurrently only after prerequisites;
- reuse avoids duplicate stable observations;
- changed relevant dependencies invalidate only affected conclusions where narrower invalidation is provable;
- weaker cached observations cannot satisfy stronger requests;
- project/config/identity boundaries remain distinct;
- preflight remains read-only and performs no hidden repair;
- expected-state bindings cross cleanly to later execution owners;
- compact results avoid broad machine/provider/process dumps;
- controlled identical inputs produce deterministic logical readiness.

## ARCHITECTURE RULES
- TypeScript strict ESM, library/application API first.
- Environment, Git, hosted-profile and tool facts cross injected ports.
- Provider-neutral domain code does not import profile-specific implementation models.
- Reuse M02 and M03 semantics rather than forking them.
- Compatibility conclusions are supplied by owning policy, not hard-coded here.
- Process-backed probes use the existing safe process boundary.
- M04 `READY` is mechanical preflight readiness only.
- No broad capability registry, persistent registry, transaction engine or later-module ownership may be introduced.

## CONSTRAINTS
- M04 discovery is `S0_READ_ONLY`.
- No new production dependency without objective necessity and lockfile evidence.
- Preserve Windows/Linux/macOS semantics.
- External facts are injectable in tests.
- No unbounded retry, pagination, output capture, filesystem walk or software enumeration.
- No unrelated cleanup.
- Preserve existing public contracts unless additive M04 integration is required and tested.

## ACCEPTANCE CRITERIA
1. All S01-S05 future-proof obligations applicable to implementation are covered by tests or exact code evidence.
2. All 32 proof families in the M04 Module Gate are mapped to implementation evidence.
3. Environment, local Git, hosted profile and tool observations are independently requestable/reusable.
4. Project-preflight composition requests only required facts and preserves component ownership.
5. Local-only zero-hosted-call behavior is mechanically tested.
6. Cheap-blocker short-circuit is mechanically tested.
7. Per-invocation reuse and targeted invalidation are mechanically tested.
8. Stronger requirements cannot reuse weaker observations silently.
9. Expected-state bindings are explicit and testable.
10. M01-M03 regression suite remains green.
11. Strict typecheck/build passes.
12. Full repository tests pass with no skipped critical M04 path.
13. Locked install/audit shows no new blocking dependency issue.
14. Hosted CI validates the exact reviewed head.
15. Semantic audit finds no HIGH/CRITICAL defect against frozen M04 sources, Scope, Architecture, Security and DoD.

## TESTS
Prefer `tests/m04.test.mjs` unless inspection proves a clearer bounded split. Cover environment, Git, hosted profile, toolchain, project-state composition, short-circuit, bounded concurrency, reuse, targeted stale state, brownfield/unadopted/identity-bootstrap cases, compact-result hygiene, platform fixtures and M01-M03 regression.

Run at minimum:
- `npm ci --ignore-scripts`
- `npm run typecheck`
- `npm run build`
- `npm test`

## DELIVERABLES
- inspected/reconciled package placement;
- M04 production code and public exports;
- minimal additive integration only where required;
- workspace/build/lockfile changes only as required;
- focused tests;
- implementation PR aligned to this Work Order;
- Evidence Bundle with base/head SHA, changed files, tests/checks, dependency observations, performance-structure proof, corrected errors, residual risks and proposed Checkpoint Delta.

## REVIEW FORMAT
Brazilian Portuguese: summary; exact base/head; changed files/ownership; acceptance mapping; checks/tests; proof of local-only zero-hosted path, short-circuit and reuse; findings by severity; residual risks/deferred ownership; Evidence Bundle references; proposed Checkpoint Delta; verdict `APPROVED`, `CORRECTION_REQUIRED` or `BLOCKED`.

## STOP CONDITION
Stop only at `M04_IMPLEMENTATION_READY_FOR_EXACT_HEAD_AUDIT`, `CORRECTION_REQUIRED` or `BLOCKED`. Do not begin M05 and do not award M04 weight before exact-head evidence and semantic approval.
