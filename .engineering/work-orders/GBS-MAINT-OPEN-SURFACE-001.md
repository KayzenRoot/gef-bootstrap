# GBS-MAINT-OPEN-SURFACE-001 — Repository open-surface reconciliation

**Issue:** #365  
**State:** FINAL_RECONCILIATION_READY_FOR_PR  
**Risk:** ELEVATED governance / dependency hygiene  
**Refreshed base:** `main@ac4cd82a98383eed30ec8363c7a173b3486a7de7`

## Objective

Reconcile every currently open GitHub Issue and Pull Request into a truthful terminal disposition under one maintenance Work Order. Preserve history/evidence, do not merge stale branches, do not weaken required checks, and do not auto-admit V1.2 implementation.

## Authority boundary

- Existing `GBS-V11-WO-012` remains the release authority for PR #364 until `GBS_V11_1_1_2_PRODUCTION_ACCEPTED` is merged.
- This maintenance Work Order coordinates the repository-wide queue and becomes the sole active maintenance item after WO-012 closes.
- Codex remains sole author of code/tests/CI/migrations.
- ChatGPT may author governance/planning docs, close objectively superseded GitHub items, coordinate provider state and perform exact-head audits.

## Phase 0 — V1.1.2 terminal closeout — COMPLETE

- PR #364 exact audited head: `f2c2e28a321d4e7e5293b5d4b623da891fd04c8c`
- owner audit: `APPROVED / NOT_INDEPENDENT`, CRITICAL 0, HIGH 0
- all 43 candidate checks passed, including `codecov/patch`
- ready-state retrigger preserved the same exact head and all four required main checks passed
- squash merge: `ac4cd82a98383eed30ec8363c7a173b3486a7de7`
- post-merge main checks: `8/8 SUCCESS`
- canonical state: `GBS_V11_1_1_2_PRODUCTION_ACCEPTED`
- Issue #361: `CLOSED / COMPLETED`
- no threshold weakening, tag movement, npm republish or consumer rollout occurred.

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

## Phase 4 — V1.2 planning preservation without stale merge

PR #344 is a valuable planning snapshot but is now a stale branch: 42 commits ahead and 116 commits behind current main. Merging it would import dated V1.1 assumptions into canonical main merely to clear the queue.

Disposition:
- preserve the exact planning snapshot at branch `planning/gef-v12-research-dossier-001`, commit `c85cc91c899b553c1c37fe53ada236b8f76de3e2`;
- record the snapshot and Issue #346 gate in `.engineering/handoffs/V1.2-NEXT-STATE.md`;
- close PR #344 **without merge** as archived/superseded planning, explicitly retaining its branch/history;
- close Issue #346 as superseded by the versioned handoff and this Work Order;
- after Phase 0, the handoff may record that the V1.1 production prerequisite is satisfied, but **no V1.2 implementation is admitted automatically**;
- a future explicit owner directive must create a fresh V1.2 admission from current main and selectively import/revalidate the preserved planning snapshot.

## Closure policy

Every closed item receives a short evidence comment pointing to Issue #365 and the canonical replacement/completion proof. Do not delete branches or historical evidence.

## Acceptance criteria

- #364 merged as `GBS_V11_1_1_2_PRODUCTION_ACCEPTED` with required ruleset contexts and Codecov patch green.
- #361 closed.
- stale V1.1/maintenance Issues/PRs above closed truthfully.
- module ghosts closed without merging stale branches.
- #195/#353 closed, not force-merged.
- #344 planning snapshot preserved and closed without stale merge; #346 superseded by the versioned handoff; no V1.2 implementation admitted.
- final GitHub inventory has no stale open Issue/PR; during execution only #365 and its reconciliation PR may remain open.
- final evidence records before/after inventory and all dispositions.

## Prohibited

No threshold reduction, required-check removal, failing/stale merge, force-push, history rewrite, tag movement, npm republish, consumer rollout, V1.2 implementation or historical evidence deletion.

## STOP CONDITIONS

Intermediate: `GBS_MAINT_OPEN_SURFACE_001_READY_FOR_FINAL_OWNER_AUDIT`

Current state: all original open items are disposed; only this Work Order remains until its governance-only reconciliation PR is exact-head audited and merged.

Terminal: `GBS_MAINT_OPEN_SURFACE_001_REPOSITORY_QUEUE_RECONCILED`
