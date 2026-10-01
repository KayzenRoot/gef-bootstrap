# GBS-V11-GOV-CODEX-FORWARDPORT-001 — planning-only Work Order

Status: PLANNING_READY_FOR_REAUDIT; NOT ADMITTED FOR RELEASE-LINE MUTATION; evidence revalidated 2026-09-29; owner audit not yet performed. GitHub issue: [#335](https://github.com/KayzenRoot/gef-bootstrap/issues/335). Owner: KayzenRoot. Risk: STANDARD governance with release-lineage impact.

## OBJECTIVE

Prepare, but do not execute, the governed forward-port of main's approved ADR-0008/D-0063 Codex-only authorship and GitHub-first planning rules to release/1.1. Preserve release's accepted decisions, V1.1 state and owner-operated audit/merge gates. Reconcile branch-qualified D-0062 history without rewriting either branch. PR #278 is closed without merge and is no longer the integration vehicle.

## CONTEXT LOCK — EXACT REFS

- `main`: `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`, tree `0413bf3e8d706738f73c93578c81630ce027f4ec`.
- `release/1.1`: `bbd83a179dd4c11f2f8653251db2b574d0266880`, tree `bb141e900f953d725c4bc6272c640ece1fbeaf92`.
- Merge base: `e23311e77d79b84f3c70671072a22a6f8896d13d`; main has 2 unique commits and release has 62.
- Main's governance promotion followed #332 and #333; the current main SHA is the promoted state. Re-fetch all refs and source fingerprints before any future admission.
- PR #278 is `CLOSED`, `mergedAt=null`, base `e23311e77d79b84f3c70671072a22a6f8896d13d`, head `bbd83a179dd4c11f2f8653251db2b574d0266880`. No replacement cumulative release-to-main PR was present in the current open-PR listing.
- PR #336 remains OPEN/DRAFT, based on release/1.1. The exact head reviewed in review 5356233070 was 73f26501ad54375fd396f2155979c58b1b05b0f3; all 31/31 listed checks succeeded there ([check results](https://github.com/KayzenRoot/gef-bootstrap/pull/336/checks), [Windows release assurance](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36604896124)). Those results are head-bound and do not apply to the Correction Delta commit; validate the resulting exact head before re-audit.
- Canonical blob fingerprints and semantic merge map are recorded in `.engineering/lineage/GBS-V11-GOV-CODEX-FORWARDPORT-001.md`.

## OBJECTIVE EVIDENCE — ISSUE #334 AND PROPOSED ISSUE #337

Issue [#334, diagnostic evidence comment](https://github.com/KayzenRoot/gef-bootstrap/issues/334#issuecomment-5894818858) proves the LCOV/Codecov mapping discrepancy on the exact release SHA above: 238/238 `DA` lines were hit; 14 of 37 `BRDA` branches were not taken, on lines 73, 83, 97, 117, 139, 140, 144, 159, 173, 199, 203, 219, 222, 232. Native output was 100.00% line and 62.16% branch coverage; the same-head Codecov report showed 13 uncovered lines and one partial among those branch-gap lines, 94.12% for the file and 95.69% patch coverage against 97.85%. The cause is line coverage versus uncovered branch outcomes, not a SHA or source-path mismatch.

Issue [#337](https://github.com/KayzenRoot/gef-bootstrap/issues/337) is `PROPOSED / NOT ADMITTED`. It proposes separately admitted negative-path branch tests and leaves the package source read-only by default. It grants no write authority. Keep it independent of this planning PR; WO-010 remains not admitted.

## SCOPE

This planning update records the exact ref lock, canonical fingerprints, two literal merge conflicts, one-sided decision sources, deletion hazard and semantic reconciliation inventory. The path matrix is in the companion lineage document. Before a future source change, refresh every ref and blob fingerprint, then repeat the base/main/release semantic comparison and obtain separate admission.

## OUT OF SCOPE

Any production source, test, workflow, threshold, coverage configuration, checkpoint, canonical source or release-state mutation; release publication/tag; branch reset or forced merge; history rewrite; automatic WO-010 admission; reopening or replacing PR #278 in this planning Work Order; claiming release acceptance.

## ARCHITECTURE AND GOVERNANCE RULES

- Keep `D-0062@main` / ADR-0007 and `D-0062@release/1.1` / ADR-0006 branch-qualified with their original meanings.
- Preserve main's `D-0063` / ADR-0008 as a main decision until a separate release forward-port is admitted.
- D-0064 is only a possible future identity for the release owner-audit meaning; do not allocate it before collision checking and explicit audited approval.
- Preserve release-only ADR-0003 through ADR-0006, accepted WO-001 through WO-009, adapter-neutral boundaries and the V1.1 overlay. Preserve main's V1.0 accepted 1,088/1,088 state without rewriting it.
- Keep planning, implementation, exact-head audit and checkpoint promotion as distinct gates.

## FILES / SOURCES TO READ

MUST_READ before any later forward-port or admission; use the exact branch versions and Context Lock:

- Both main and release/1.1 copies of AGENTS.md; .engineering/SOURCE-HIERARCHY.md; .engineering/CHECKPOINT.md and .engineering/CHECKPOINT.json; .engineering/CONSTITUTION-LOCK.md; .engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md; .engineering/DECISIONS-LEDGER.md; .engineering/PROJECT-OVERVIEW.md; .engineering/REQUIREMENTS.md; .engineering/SCOPE.md; .engineering/ARCHITECTURE.md; .engineering/SECURITY.md; .engineering/TEST-BENCHMARK-PLAN.md; .engineering/DEFINITION-OF-DONE.md; and .engineering/EXECUTOR-ACCELERATION-CONTRACT.md.
- ADR-0001, ADR-0002, ADR-0003, ADR-0005, ADR-0006, ADR-0007 and ADR-0008, as present on each branch; also main's .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md.
- Issue #335; PRs #332 and #333 with their evidence; release maintenance PRs #278 and #330; Issue #334 and its exact-SHA diagnostic evidence; and PR #336 with its current exact-head review and checks.
- Read release .engineering/execution-handoffs only if a specific source conflict requires it.

For this Correction Delta, the exact-state lineage/conflict map at .engineering/lineage/GBS-V11-GOV-CODEX-FORWARDPORT-001.md is READ_ONLY and supplies the recorded blob fingerprints and conflict inventory. No other source is added by this section.

## CONSTRAINTS

- Phase remains PLANNING_ONLY. This Work Order and PR #336 confer no release/1.1 implementation or forward-port authority. Any future source synchronization requires a separate governed admission, current Context Lock and exact-head audit.
- For this Correction Delta, only .engineering/work-orders/GBS-V11-GOV-CODEX-FORWARDPORT-001.md is WRITE_ALLOWED in the repository. Updating PR #336's description/evidence is allowed for this task. The companion lineage map and every other repository path are READ_ONLY.
- WRITE_FORBIDDEN: every repository path except this Work Order, including AGENTS.md, Source Hierarchy, both Checkpoints, Constitution/Amendment, Decisions Ledger/Supersession Map, Project Overview, Requirements, Scope, Architecture, Security, Test Plan, DoD, Executor Acceleration Contract, GitHub-first workflow, ADRs, evidence and execution handoffs; all product source, tests, CI/workflows, migrations, thresholds and coverage configuration; accepted Work Orders and V1.0 history; release state, tags and publication. Do not allocate D-0064, rewrite/delete branch history or aliases, replace either checkpoint or ledger wholesale, admit WO-010, reopen/replace PR #278, force-push, reset a branch or merge.
- Keep D-0062@main / ADR-0007 and D-0062@release/1.1 / ADR-0006 branch-qualified. D-0064 remains only a candidate pending a fresh collision check and explicit audited approval. Do not alter decision meanings, recorded fingerprints, approved scope or the separate Issue #337 proposal.
- Preserve owner-operated exact-head review, NOT_INDEPENDENT classification, branch protections, and all required checks. Do not claim completion or inherit any result from a different head.

## ACCEPTANCE CRITERIA

For this planning Correction Delta:

1. This Work Order contains explicit FILES / SOURCES TO READ, CONSTRAINTS, ACCEPTANCE CRITERIA and TESTS sections, and can be invoked without inferring those fields from chat.
2. The read list and write prohibition stay within Issue #335 and the exact-state lineage map; the current correction changes only this Work Order.
3. Its context references agree with the revalidated main/release SHAs and the map's base/main/release fingerprints. The map names both literal conflicts (.engineering/CHECKPOINT.json and .engineering/DECISIONS-LEDGER.md), records their branch provenance, and exposes the D-0062 collision and ADR-0007 deletion hazard without overwriting either decision or allocating D-0064.
4. It states PR #278 is CLOSED_NOT_MERGED; Issue #334's line-versus-branch cause is proved on its exact SHA; and Issue #337 remains a separate PROPOSED / NOT ADMITTED correction.
5. PR #336 remains a real-diff planning-only draft. Required checks must be SUCCESS on the exact Correction Delta head, the PR evidence must record that head and its checks, and only then is the Work Order ready for owner re-audit.
6. The STOP state is GBS_V11_CODEX_GITHUB_FIRST_FORWARDPORT_PLAN_READY_FOR_REAUDIT. This stop requests re-audit only; it does not admit source mutation, forward-port, WO-010, checkpoint promotion or merge.

Any future cumulative integration must use a new exact Context Lock and re-evaluate its current Codecov, Sonar and security checks on that integrated head. Historical PR #278 results are not inherited.

## TESTS

- For this Markdown-only Correction Delta, run git diff --check and verify the changed-path allowlist, required section headings, and consistency of all referenced SHAs with the Issue #335 Context Lock and the companion lineage map.
- Run the repository's current required GitHub checks on the exact commit produced by this Correction Delta, including exact-head documentation/repository validation and applicable required CI/security checks. Record the candidate SHA, check count, outcomes and evidence links in PR #336. A pass on review head 73f26501ad54375fd396f2155979c58b1b05b0f3 is historical input only and cannot substitute.
- No product source, test, CI/workflow or coverage-configuration files or behavior may be changed, and no tests may be added. Existing jobs included in the required GitHub checks may execute and must be reported; do not run unrelated product tests for this docs-only correction. For any separately admitted integrated forward-port, run the required cross-branch validation and re-evaluate Codecov, Sonar and security only on its new exact integrated state.
- Owner semantic audit follows successful exact-head checks and remains NOT_INDEPENDENT. Do not perform or claim that audit in this Correction Delta.

## VALIDATION AND EVIDENCE STATUS

The exact refs and source fingerprints, PR #278 closure, Issue #334 proof, Issue #337 admission state and merge-tree conflicts are recorded in the companion map. Review head 73f26501ad54375fd396f2155979c58b1b05b0f3 had 31/31 listed checks SUCCESS. The Correction Delta changes the Work Order and therefore requires fresh checks on its resulting exact head; do not inherit review-head results. Record the new SHA and CI evidence in PR #336. After those checks pass, the next gate is owner re-audit, NOT_INDEPENDENT. No release mutation, admission or merge is implied.

## DELIVERABLES

Issue #335 planning record; this versioned Work Order; the companion exact-state lineage and conflict map; planning-only draft PR #336 with current evidence and exact head. A future implementation or canonical checkpoint delta requires its own admission, Context Lock, Evidence Bundle, exact-head checks and audit.

## REVIEW FORMAT

Português brasileiro; exact main/release/base and candidate SHAs, changed paths, verified versus proposed facts, conflict/lineage result, new-head check status, severity and unresolved gate. Use `APPROVED / CORRECTION REQUIRED / BLOCKED` only after the required audit actually runs.

## STOP CONDITION

GBS_V11_CODEX_GITHUB_FIRST_FORWARDPORT_PLAN_READY_FOR_REAUDIT. This Work Order remains PLANNING_ONLY / NOT ADMITTED. Return to owner re-audit after the Correction Delta's exact-head checks pass. No source mutation, forward-port, checkpoint promotion or merge is authorized.
