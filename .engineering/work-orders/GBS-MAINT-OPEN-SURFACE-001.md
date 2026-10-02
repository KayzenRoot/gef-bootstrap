# GBS-MAINT-OPEN-SURFACE-001 — Repository open-surface reconciliation

**Issue:** #365  
**State:** OWNER_AUTHORIZED / PHASED_EXECUTION  
**Risk:** ELEVATED governance / dependency hygiene  
**Admission base:** `main@af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`

## Objective

Reconcile every currently open GitHub Issue and Pull Request into a truthful terminal disposition under one maintenance Work Order. Preserve history/evidence, do not merge stale branches, do not weaken required checks, and do not auto-admit V1.2 implementation.

## Authority boundary

- Existing `GBS-V11-WO-012` remains the release authority for PR #364 until `GBS_V11_1_1_2_PRODUCTION_ACCEPTED` is merged.
- This maintenance Work Order coordinates the repository-wide queue and becomes the sole active maintenance item after WO-012 closes.
- Codex remains sole author of code/tests/CI/migrations.
- ChatGPT may author governance/planning docs, close objectively superseded GitHub items, coordinate provider state and perform exact-head audits.

## Phase 0 — V1.1.2 terminal closeout

Finish PR #364 cleanly:
- canonical production checkpoint promotion;
- keep required main ruleset contexts green;
- require `codecov/patch` green too for a clean repository surface, despite it being non-required;
- no threshold lowering/exclusions/padding;
- if checkpoint promotion alone does not exercise the new accepted-state branches sufficiently, Codex may add only causal coverage inside the already-authorized WO-012 test/helper paths;
- exact-head owner audit, ready-state retriggers, merge, close #361.

## Phase 1 — V1.1 / maintenance cleanup

Close with evidence:
- PR #360;
- Issues #357, #312, #334, #335, #338, #340, #345, #304.

Dispositions:
- #360 superseded by immutable V1.1.2;
- #357 completed/superseded by WO-012;
- #312 dated non-canonical handoff superseded by current checkpoint;
- #334 old PR #278 Codecov diagnostic superseded by later release line;
- #335/#338/#340/#345 completed/superseded because D-0063/ADR-0008 is effective and release adoption is recorded;
- #304 completed: ruleset/pipeline/security/Codecov/Sonar integration is observable.

## Phase 2 — historical module ghosts

Canonical Backlog records M05, M08, M16 and M22 as `MODULE_DONE`.

Close Issues:
`#102, #139, #140, #141, #142, #143, #144, #145, #146, #147, #148, #149`.

Close stale PRs without merging:
- #200, superseded by canonical M16 implementation PR #202 / merge `61f9c2839335346083169b8a2fe49a3b1e797dba`;
- #226, superseded by canonical M22 implementation merge `48548157573cf221e7105d82a0b2f8189588d1d6`.

## Phase 3 — dependency bot disposition

Close broken/stale bot PRs:
- #195 TypeScript 7.0.2: major toolchain transition, broad current failures, not safe maintenance;
- #353 grouped GitHub Actions update: 38 workflow changes, current validation/release-assurance failures.

Current V1.1.2 release evidence has no high npm vulnerability requiring these failing branches to be merged. Future dependency refresh remains FUTURE within this Work Order record, with no extra open Issue required.

## Phase 4 — V1.2 planning preservation

After Phase 0:
- refresh only stale V1.1 precondition wording in planning PR #344;
- keep all 25 `planning/v1.2/**` files `PLANNING_ONLY / NOT_IMPLEMENTATION_AUTHORITY`;
- exact-head checks + owner audit;
- squash-merge #344 if clean;
- close #346 as gate satisfied/superseded by merged planning archive and this Work Order;
- do not admit V1.2 implementation automatically.

## Closure policy

Every closed item receives a short evidence comment pointing to Issue #365 and the canonical replacement/completion proof. Do not delete branches or historical evidence.

## Acceptance criteria

- #364 merged as `GBS_V11_1_1_2_PRODUCTION_ACCEPTED` with required ruleset contexts and Codecov patch green.
- #361 closed.
- stale V1.1/maintenance Issues/PRs above closed truthfully.
- module ghosts closed without merging stale branches.
- #195/#353 closed, not force-merged.
- #344 planning archive merged cleanly, #346 closed, no V1.2 implementation admitted.
- final GitHub inventory has no stale open Issue/PR; during execution only #365 and its reconciliation PR may remain open.
- final evidence records before/after inventory and all dispositions.

## Prohibited

No threshold reduction, required-check removal, failing/stale merge, force-push, history rewrite, tag movement, npm republish, consumer rollout, V1.2 implementation or historical evidence deletion.

## STOP CONDITIONS

Intermediate: `GBS_MAINT_OPEN_SURFACE_001_READY_FOR_FINAL_OWNER_AUDIT`

Terminal: `GBS_MAINT_OPEN_SURFACE_001_REPOSITORY_QUEUE_RECONCILED`
