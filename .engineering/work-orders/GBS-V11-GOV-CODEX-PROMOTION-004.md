# GBS-V11-GOV-CODEX-PROMOTION-004 — release adoption and factual checkpoint repair

**Status:** EXECUTION ADMITTED, bounded by the owner source/scope admission in Issue #345 and the direct execution request. Owner audit remains NOT_INDEPENDENT.
**Risk:** STANDARD governance; do not perform irreversible release operations.
**Purpose:** one exact-head audited documentation PR into release/1.1 that conditionally adopts D-0063/ADR-0008 at its real governed merge and corrects the stale checkpoint action about PR #278.

## Exact baseline and revalidation

- Target base: release/1.1 at 637c24c9d3ef1d9c3197912dd8f7e7b0e6b8f90a; tree 660f28a10215bbbfcd42d31797c77d2e97d3b6a9.
- main source: f6738292c038eb6f0d08d1d32b3752c5c7dc417a; tree 0413bf3e8d706738f73c93578c81630ce027f4ec.
- Current merge base: e23311e77d79b84f3c70671072a22a6f8896d13d; 2 main-only and 75 release-only commits. Refs were checked against both fetch and ls-remote before branch creation.
- PR #342 is CLOSED/MERGED; its actual merge commit is the target base above. Its prospective documents did not make D-0063/ADR-0008 effective on release.
- PR #278 is CLOSED and NOT MERGED, at historical head bbd83a179dd4c11f2f8653251db2b574d0266880. Its checks and coverage report are historical and cannot transfer.
- Issue #334 comment 5894818858 reports CAUSE_VERIFIED on that exact historical SHA: all 238 DA lines were hit, while 14 unhit LCOV branch outcomes map to 13 uncovered and one partial Codecov changed line; native 100% line coverage therefore did not mean 100% patch branch coverage. Do not claim these measurements or checks apply to the current release tip.
- Issue #337 is OPEN and PROPOSED / NOT ADMITTED. A replacement cumulative release-to-main PR was not found in the current open-PR search. WO-010 remains NOT_ADMITTED.
- The release merge commit 637c24c9 and main commit f6738292 had no directly attached combined statuses/workflow runs at preflight. PR #342 checks passed on its exact pre-merge head a16950fa1229c7e5857c91c0829ba1764a56d550 only; those results will not be reused for this candidate.

The complete source/blob matrix and conflict stages are in the Context Lock. If either canonical ref moves or an unresolvable authority conflict appears, stop and refresh this Work Order and Lock before further mutation.

## Authority and branch-qualified decision closure

- On release/1.1, D-0062 / ADR-0006 remains the effective owner-operated audit and merge authority.
- On main, D-0062 / ADR-0007 has a separate branch-qualified historical meaning. Preserve both decision identities and immutable provenance; do not globally remap D-0062.
- D-0063 / ADR-0008 is approved and effective on main under its own promotion. This release copy becomes effective on release only at the governed merge of this exact-head owner-audited promotion PR. Until that actual merge, do not assert release effectiveness.
- D-0064 / ADR-0009 remain unallocated.
- SOURCE-HIERARCHY is frozen and unchanged. Release-local canonical sources control this release candidate; the main/release conflict map is evidence, not authorization to merge or copy main state.

## Objective and allowed paths

Create one coherent, separately reviewable promotion PR to release/1.1. Version this Work Order and its fresh Context Lock in the first candidate commit, before any normative or checkpoint edit. Then make only the approved status/handoff and checkpoint deltas and add the Evidence Bundle.

The maximum write set is exactly these 19 paths:

1. AGENTS.md
2. .engineering/ARCHITECTURE.md
3. .engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md
4. .engineering/CONSTITUTION-LOCK.md
5. .engineering/DEFINITION-OF-DONE.md
6. .engineering/EXECUTOR-ACCELERATION-CONTRACT.md
7. .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md
8. .engineering/PROJECT-OVERVIEW.md
9. .engineering/REQUIREMENTS.md
10. .engineering/SCOPE.md
11. .engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md
12. .engineering/DECISIONS-LEDGER.md
13. .engineering/DECISIONS-SUPERSESSION-MAP.md
14. README.md
15. .engineering/CHECKPOINT.md
16. .engineering/CHECKPOINT.json
17. .engineering/work-orders/GBS-V11-GOV-CODEX-PROMOTION-004.md
18. .engineering/context-locks/GBS-V11-GOV-CODEX-PROMOTION-004.json
19. .engineering/evidence/GBS-V11-GOV-CODEX-PROMOTION-004-EVIDENCE.md

The 14 prospective normative documents may change only their narrow ADR-0008/D-0063 release actor/handoff status clauses and directly related freeze-audit labels. State that effectiveness occurs exactly at the real merge of this separately exact-head owner-audited PR into release/1.1. Before that merge, release authority remains D-0062/ADR-0006. Preserve D-0054 as historical text; all unrelated product, assurance, accepted 1088/1088 V1 history, owner, security, scope and Work Order gates remain unchanged. Keep main-only ADR-0007 provenance intact.

In the ledger and supersession map, make release applicability conditional on the governed merge, preserve D-0062@release and D-0062@main branch qualification, and do not allocate D-0064.

In both checkpoint views, synchronize the same promotion/adoption status and factual next action. Replace the stale operational instruction to resolve/merge PR #278 with the verified facts: #278 is closed without merge; #334 proved the historical LCOV line-versus-branch mapping cause on bbd83a1; #337 remains proposed and not admitted; no current replacement cumulative release-to-main PR is open; WO-010 remains not admitted until current cumulative Codecov, Sonar, security and merge gates are proven. Preserve historical #278 evidence. Describe this candidate's adoption as effective only at its future governed merge. Never invent a PR number, audit verdict or merge SHA. Where the actual merge receipt cannot be known yet, state the receipt is due only after the real merge and leave it for a narrow separately audited factual receipt if required.

No other path may be written. Product code, tests, fixtures, CI/workflows, dependency manifests, security/coverage policy, Source Hierarchy, existing ADR-0003..0007, tags, publication, main, history rewrite and force-push are forbidden.

## Conflict map and handling

At preflight, a real three-way merge-tree comparison of current main and release reported 14 conflicted paths: AGENTS.md; .engineering/ARCHITECTURE.md; .engineering/CHECKPOINT.json; .engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md; .engineering/CONSTITUTION-LOCK.md; .engineering/DECISIONS-LEDGER.md; .engineering/DEFINITION-OF-DONE.md; .engineering/EXECUTOR-ACCELERATION-CONTRACT.md; .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md; .engineering/PROJECT-OVERVIEW.md; .engineering/REQUIREMENTS.md; .engineering/SCOPE.md; .engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md; README.md. The exact stage 1/base, stage 2/main and stage 3/release blob IDs are frozen in the Context Lock. CHECKPOINT.md auto-merges textually but still has semantic overlap and is changed only under this Work Order.

This PR targets release/1.1 and does not perform a release-to-main integration. Resolve the decision meaning by branch and canonical domain: retain release ADR-0006/D-0062; preserve main ADR-0007/D-0062 by source provenance; apply the admitted D-0063 release adoption condition only in the named release clauses. Keep all other release-only overlays. Do not treat textual auto-merging as semantic compatibility.

## Required validation and evidence

- Recompute every Context Lock source fingerprint against exact merge-base, main and release commits; validate the JSON, exact source count/value count, critical blobs, and conflict stages before normative changes.
- Inspect the first commit and confirm it contains only this Work Order and Context Lock. Use a neutral sourceId metadata field; scan the entire new commit range with the pinned repository Gitleaks configuration and do not suppress findings.
- Verify every changed path and hunk against this allowlist and the 14 narrow semantic conversions. No unrelated edits.
- Run the existing release governance/document validators, the existing legacy-detachment test, git diff --check, JSON parse, checkpoint Markdown/JSON shared-field coherence, source/decision reference checks and npm run validate (typecheck plus the complete test suite). Do not add or modify tests.
- Run current exact-final-HEAD required GitHub checks: Repository Validation, Pipeline Integrity, Dependency Review, Free Security Pilot (Gitleaks and Trivy), integrated assurance and V1.1 Ubuntu/macOS/Windows release assurance. Record each run/check URL and conclusion. Do not claim green for pending, stale, missing or failed checks; do not transfer historical results.
- Record full base/head/tree IDs, first artifact commit, actual changed paths, per-file before/after meaning, refreshed fingerprints, conflict/decision map, commands/results, security results, exact-head CI URLs, known risks, conditional checkpoint delta and stop state in the Evidence Bundle and PR description.

Only repair failures that are inside this exact documentation/evidence scope. If an authoritative conflict, real secret, HIGH/CRITICAL finding, required check failure, missing required platform result or unrelated blocker cannot be resolved without changing forbidden paths or decisions, report it and stop.

## Boundaries and stop

No merge, publication, checkpoint promotion outside the conditional text in this candidate, code/test/CI implementation, cumulative release-to-main integration, Issue #337 execution or WO-010 admission.

Execution stop: GBS_V11_GOV_CODEX_PROMOTION_004_EXACT_HEAD_READY_FOR_OWNER_AUDIT.
After a real authorized merge, separately verify the actual release SHA and add only the factual post-merge receipt if canonical checkpoint state requires it; then stop at GBS_V11_GOV_CODEX_PROMOTION_004_RELEASE_ADOPTION_VERIFIED.
