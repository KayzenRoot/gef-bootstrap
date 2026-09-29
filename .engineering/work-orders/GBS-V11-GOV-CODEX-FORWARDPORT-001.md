# GBS-V11-GOV-CODEX-FORWARDPORT-001 — planning-only Work Order

Status: PLANNING_READY_NOT_ADMITTED. GitHub issue: #335. Owner: KayzenRoot. Risk: STANDARD governance with release-lineage impact.
Context observed 2026-09-29. Base release/1.1: `bbd83a179dd4c11f2f8653251db2b574d0266880`. Exact approved main governance promotion: `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`, docs proposal #332 (28/28), separate checkpoint promotion #333 (28/28). Refresh base + critical source fingerprints before admission.

## OBJECTIVE
Prepare governed release/1.1 adoption of the effective main ADR-0008/D-0063: Codex is sole author of code/test/CI/migrations, ChatGPT owns architecture, pre-resolved full GitHub Work Orders, qualified planning-only draft PRs, review and objective status reporting. Reconcile conflicting D-0062 branch lineages without rewriting history; remove new main-versus-release governance conflicts before cumulative PR #278 is accepted.

## CONTEXT
Main V1.0 accepted 1088/1088 and frozen tag remain immutable. Release/1.1 accepted WO-001..009, WO-010 NOT_ADMITTED. Parent maintenance `GBS-V11-MAINT-POST-WO009-001` owns current cumulative PR #278; exact release HEAD at planning: `bbd83a179dd4c11f2f8653251db2b574d0266880`. Current read-only Codecov diagnostic: issue #334; on this head cumulative `codecov/patch` FAILURE 95.69231% against 97.85%, only `prepare-package.mjs` 13 missing + one partial. This planning task neither alters those files nor asserts release completion.

## SCOPE
Before actual mutation, inspect Git tree/diff on exact current main and release, freeze the relevant source fingerprints, and create a path-by-path semantic three-way matrix (base/main/release resolution), preserving release-only accepted state. Plan narrow docs-only source sync: AGENTS, Source Hierarchy if affected, Constitution Lock/Amendment, Project Overview, Requirements, Scope, Architecture, DoD, Executor Acceleration, Decisions Ledger, new ADR-0008 and GitHub-first workflow, current checkpoint human+JSON, work-order/evidence/decision-lineage materials. Prepare a separate legal implementation/governance PR only after this plan is approved and exact source/branch gates hold; a real-diff planning-only draft PR does not authorize the full forward-port.

## OUT OF SCOPE
Production source/tests/CI, coverage behavior/thresholds, full branch replacement, false main-v1.0 reacceptance, deletion/rewriting of historical ADRs, V1.1 WO-010 release admission, package publication and tags, destructive/force-push merge.

## FILES / SOURCES TO READ
Current `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, `CHECKPOINT.md/.json`, `DECISIONS-LEDGER.md`, `CONSTITUTION-LOCK.md`, `CONSTITUTION-AMENDMENT-0001-HYBRID.md`, `PROJECT-OVERVIEW.md`, `REQUIREMENTS.md`, `SCOPE.md`, `ARCHITECTURE.md`, `DEFINITION-OF-DONE.md`, `SECURITY.md`, `TEST-BENCHMARK-PLAN.md`, `EXECUTOR-ACCELERATION-CONTRACT.md`, ADR-0001/0002/0003/0005/0006/0007/0008 as present per branch, main `GITHUB-FIRST-CODEX-WORKFLOW.md`, PRs #332/#333 and issue #331, current release PR #278/Codecov issue #334.

## REQUIREMENTS
Codex exclusively authors/fixes code/test/CI/migrations, including this repo; ChatGPT authors governed planning, full approved module issues/WOs and qualified planning-only draft PRs, exact-head semantic audit and per-response real metrics. New projects adopt via versioned Source Pack; ongoing projects through separately governed authority. GitHub issue/WO is substantive; tiny copyable prompt only points at an admitted ID and legal PR. Never conflate a planning PR with an implementation PR or 9/10 WO count with 90% production completion.

## ARCHITECTURE RULES
Preserve semantic authority in frozen docs and deterministic-plane provider-neutral runtime; no new runtime/CLI dependency. Keep main D-0062 Hive-retirement and release D-0062 owner-operated audit both historically addressable by branch/ADR/SHA. **Candidate** main-facing reconciliation maps release-owner D-0062 to unused future D-0064 while main D-0062 and D-0063 retain meanings; this must be collision-checked and separately approved before final integrated ledger. No wholesale copy. Use exact path/SHA/context lock; stale if base/source changes.

## CONSTRAINTS
This branch is PLANNING_ONLY and its diff includes only this Work Order and a verified-lineage/provisional-matrix note; no production, test, CI or canonical checkpoint mutation yet. Preserve exact branch protections, audit NOT_INDEPENDENT and no unresolved HIGH/CRITICAL. No required paid external review integration.

## ACCEPTANCE CRITERIA
Approved module plan has a bounded file/owner map, explicit D-0062 lineage reconciliation and dependency gate; exact current tree/critical source fingerprints confirmed, no fabricated path conflict claims. Planning-only draft PR has real docs diff; required exact-head repository/security checks clear before it can become approved. Future implementation PR must apply a separately audited narrow source delta with its own Evidence Bundle, production-safe human/JSON checkpoint proposal and Codecov/mergeability recheck against changed base. Work is not accepted because a planning PR exists.

## TESTS
Planning PR: doc/JSON syntax consistency (where touched), exact-head Repository validation, Pipeline integrity, Gitleaks, Trivy and applicable scoped checks; semantic owner audit with documented unresolved questions and no invented checks. Future forward-port: cross-branch three-way source tests and full required release/PR checks at its own exact head; maintain latest Codecov results as independent active blocker.

## DELIVERABLES
GitHub issue #335, this versioned Work Order, provisional lineage matrix, meaningful planning-only draft PR. After separately admitted future implementation: source diffs, exact-head CI, Evidence Bundle, approved checkpoint delta and explicit stop state. No PDF.

## REVIEW FORMAT
Português brasileiro; audited SHA, exact changed paths and findings by severity, D-0062 branch lineage record, full test/evidence status, `APPROVED / CORRECTION REQUIRED / BLOCKED` and proposed Checkpoint Delta.

## STOP CONDITION
`GBS_V11_CODEX_GITHUB_FIRST_FORWARDPORT_PLAN_READY_NOT_ADMITTED`. Implementation/merge require a separately governed Work Order state, current Context Lock and exact-head audit.
