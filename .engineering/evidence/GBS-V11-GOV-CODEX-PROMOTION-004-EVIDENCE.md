# Evidence Bundle — GBS-V11-GOV-CODEX-PROMOTION-004

Status: `BLOCKED_REQUIRED_VALIDATION_FAILURE`. This candidate is not represented as ready or independently audited. No merge has occurred.

## Authority and exact baseline

- Admission: Issue [#345](https://github.com/KayzenRoot/gef-bootstrap/issues/345), execution bounded to this Work Order; owner audit is `NOT_INDEPENDENT`.
- Target: `release/1.1` at base `637c24c9d3ef1d9c3197912dd8f7e7b0e6b8f90a`, tree `660f28a10215bbbfcd42d31797c77d2e97d3b6a9`.
- Main source: `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`, tree `0413bf3e8d706738f73c93578c81630ce027f4ec`.
- Merge base: `e23311e77d79b84f3c70671072a22a6f8896d13d`; current divergence: 2 main-only / 75 release-only.
- Prior PR [#342](https://github.com/KayzenRoot/gef-bootstrap/pull/342) is closed/merged at the release base above; its pre-merge checks are not reused.
- Work Order and Context Lock were committed first as `bcdb35e62472bbedfbcc0703e3eaeafc036fc324`, whose sole parent is the exact release base. That commit contains only the Work Order and Context Lock; the Context Lock records the Work Order blob and SHA-256.

## Source, decision and conflict verification

- Context Lock JSON parsed. Recomputed 49 source entries / 147 comparisons: 147/147 match; 109 values are non-ABSENT. The branch-tree provenance entry for D-0062@main / ADR-0007 was checked against the exact main tree.
- Exact branch refs, merge base, divergence and merge-tree result were rechecked against the locked commits. The 14 conflicts match the Lock: 12 content conflicts and 2 add/add conflicts. `.engineering/CHECKPOINT.md` remains a semantic overlap despite textual auto-merge.
- Keep the branch-qualified decisions intact: release D-0062 / ADR-0006 remains the effective authority until the governed promotion merge; main D-0062 / ADR-0007 retains its separate historical meaning and provenance. D-0063 / ADR-0008 release applicability is conditional on the real merge of this exact-head owner-audited PR. D-0064 / ADR-0009 is unallocated.
- No main/release merge, rebase, cherry-pick or conflict resolution was performed.

## Historical PR #278 diagnosis and checkpoint delta

- PR [#278](https://github.com/KayzenRoot/gef-bootstrap/pull/278) is `CLOSED_NOT_MERGED`, historical head `bbd83a179dd4c11f2f8653251db2b574d0266880`, original base `e23311e77d79b84f3c70671072a22a6f8896d13d`.
- Issue [#334, evidence comment 5894818858](https://github.com/KayzenRoot/gef-bootstrap/issues/334#issuecomment-5894818858) proves the cause on that exact historical head: LCOV DA hit 238/238 lines, while 14/37 BRDA outcomes were unhit on lines 73, 83, 97, 117, 139, 140, 144, 159, 173, 199, 203, 219, 222 and 232. Codecov's branch-aware changed-line view showed 13 uncovered and one partial line (139). Native 100% line coverage did not mean all branch outcomes were exercised; the pack test took the success path. This is not an SHA or source-path mismatch.
- The old PR's Codecov patch result was 95.69% against 97.85%; its Sonar Quality Gate was FAILURE. Both remain historical evidence for the closed PR only and do not describe current release-head checks.
- Issue [#337](https://github.com/KayzenRoot/gef-bootstrap/issues/337), proposed Work Order `GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012`, remains OPEN / PROPOSED / NOT_ADMITTED. The current open-PR search found no replacement cumulative release-to-main PR. WO-010 remains NOT_ADMITTED pending fresh exact-head cumulative Codecov >=97.85%, Sonar, security, ancestry/conflict and merge gates.
- CHECKPOINT.md and CHECKPOINT.json now carry matching promotion state, historical diagnosis, issue/admission facts and next action. The future merge SHA is null/unknown and must be recorded only after the provider confirms an actual merge. The V1.0 1088/1088 accepted history and existing WO-009 evidence are preserved.

## Changed files and meaning

The actual candidate write set is limited to the 19 admitted paths:

1. `AGENTS.md`
2. `.engineering/ARCHITECTURE.md`
3. `.engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md`
4. `.engineering/CONSTITUTION-LOCK.md`
5. `.engineering/DEFINITION-OF-DONE.md`
6. `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md`
7. `.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md`
8. `.engineering/PROJECT-OVERVIEW.md`
9. `.engineering/REQUIREMENTS.md`
10. `.engineering/SCOPE.md`
11. `.engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md`
12. `.engineering/DECISIONS-LEDGER.md`
13. `.engineering/DECISIONS-SUPERSESSION-MAP.md`
14. `README.md`
15. `.engineering/CHECKPOINT.md`
16. `.engineering/CHECKPOINT.json`
17. `.engineering/work-orders/GBS-V11-GOV-CODEX-PROMOTION-004.md`
18. `.engineering/context-locks/GBS-V11-GOV-CODEX-PROMOTION-004.json`
19. `.engineering/evidence/GBS-V11-GOV-CODEX-PROMOTION-004-EVIDENCE.md`

The 14 normative documents update only ADR-0008 / D-0063 release actor/handoff applicability and directly related status labels. The two checkpoint views record the same conditional adoption and factual next action. The Work Order and Context Lock are the first commit; this file is the scoped evidence artifact. No code, tests, fixtures, CI/workflows, dependencies, security/coverage policy, Source Hierarchy, existing ADR-0003..0007, tags, publication or main files changed.

Final candidate HEAD/tree and provider check URLs are bound in the associated PR description after the final push. They are intentionally not guessed here.

## Validation results

- Exact baseline/ref/fingerprint/first-commit/conflict checks: PASS (49 sources; 147/147 fingerprints; 14/14 conflicts).
- Checkpoint JSON parsing and shared Markdown/JSON action/adoption/Issue #334/#337/WO-010 coherence: PASS.
- `git diff --check`: PASS.
- Focused legacy detachment + WO-008/009 continuity tests: 13/13 PASS.
- `npm run validate`: FAIL, exit 1. Typecheck completed and the test runner executed 1,602 tests: 1,595 passed, 7 failed, 0 skipped. All seven failures are legacy checkpoint assertions that still require the obsolete `RESOLVE_PR278_SONAR_AND_MERGE_CONFLICT_UNDER_GBS_V11_MAINT_POST_WO009_001` value after the required factual next-action correction. They occur in checkpoint/WO-002/003/005/006/007/009 assertions, including `tests/helpers/v11-context-lock-refresh-assertions.mjs:49`. Those tests are outside the admitted write set and remain unchanged; the required full validation therefore blocks the STOP condition.
- Gitleaks 8.30.1 directory scan of all 19 exact candidate paths: PASS, zero findings; config SHA-256 `e163e53b9e7e8a8511e77271e2b323ed057759542a6d988258afe3a1fa329caf`; `.gitleaksignore` is empty and no finding was waived or suppressed. The full Git commit-range scan is run after the final candidate commit and recorded with its exact range in the associated PR description.
- Exact-final-HEAD GitHub workflows: record each current conclusion and URL in the associated PR description after the push. PR #342 and closed PR #278 results are not transferable.

## Impact, risk and stop

Runtime/API compatibility: no code or dependency changes. Security policy and controls: unchanged. V1.0 acceptance: unchanged. Main risk/blocker: required validation has seven static assertions bound to the old stale action; changing tests or retaining the stale machine action would violate the admitted checkpoint correction or forbidden-path boundary. Draft status is retained pending owner audit/correction decision; no audit verdict or independent review is claimed.

Execution STOP CONDITION requested by Issue #345: `GBS_V11_GOV_CODEX_PROMOTION_004_EXACT_HEAD_READY_FOR_OWNER_AUDIT` is **NOT REACHED** because `npm run validate` fails as recorded above. Candidate stop: `BLOCKED_REQUIRED_VALIDATION_FAILURE`; no merge, publication or promotion is claimed.
