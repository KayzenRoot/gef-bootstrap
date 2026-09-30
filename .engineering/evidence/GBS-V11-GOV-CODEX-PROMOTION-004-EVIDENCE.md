# Evidence Bundle — GBS-V11-GOV-CODEX-PROMOTION-004

Status: `CORRECTION_DELTA_IN_PROGRESS`; this bundle records the admitted exact one-helper delta and read-only master-phase preparation. Final gate disposition and live exact-HEAD check links are maintained in PR #347. No merge has occurred.

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

The original promotion write set remains 19 documentation paths. The owner-approved Correction Delta adds only tests/helpers/v11-context-lock-refresh-assertions.mjs, for 20 total paths across the candidate; the six consumer tests remain read-only:

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
- Prior exact-head provider baseline, before this Correction Delta, from Repository Validation job 109672960014: 1,602 outcomes = 1,591 PASS, 7 FAIL, 4 SKIPPED. All seven failures routed through the shared helper; the six consuming test files are unchanged.
- Correction Delta local proof on the candidate tree: Node v24.19.0; npm run validate PASS (typecheck PASS; 1,602 tests PASS, 0 FAIL, 0 SKIPPED); six consumer suites PASS (41/41); direct branch check PASS for current CLOSED_NOT_MERGED state, strict historical fallback and fail-closed unknown marker; legacy-detachment suite PASS (1/1). Full validation is rerun after this evidence update.
- The earlier Gitleaks result covered the original 19-path promotion only and is not reused. The new exact commit-range Gitleaks and Trivy conclusions must come from Free Security Pilot on the pushed final HEAD; see the live PR checks page and exact run links in the PR description.
- Exact-final-HEAD Repository Validation, Pipeline Integrity, Dependency Review, Free Security Pilot (Gitleaks and Trivy), M41-M63 integrated assurance and V1.1 Ubuntu/macOS/Windows release assurance are bound after push. The PR description records each actual conclusion and URL; no result transfers from the previous HEAD, PR #342 or PR #278.

## Impact, risk and stop

Runtime/API compatibility and production source are unchanged; only the admitted test helper and current Work Order, Context Lock and Evidence Bundle changed. The principal remaining gate is completion of exact-final-HEAD provider checks followed by owner re-audit. No audit verdict or independent review is claimed.

The prior STOP CONDITION GBS_V11_GOV_CODEX_PROMOTION_004_EXACT_HEAD_READY_FOR_OWNER_AUDIT was blocked by the seven shared-helper assertions. The current Correction Delta stop is GBS_V11_GOV_CODEX_PROMOTION_004_CHECKPOINT_TEST_DELTA_READY_FOR_REAUDIT. Its reachability depends on all local validations and current exact-HEAD GitHub checks; consult the live PR description/checks before any audit or merge. No merge, publication, issue #337 admission or WO-010 admission is claimed.


## Master Issue #348 — read-only preparation for later phases

This is a source-path plan only. The complete governing plan is Issue [#348](https://github.com/KayzenRoot/gef-bootstrap/issues/348), GBS-V11-RELEASE-ONEPASS-013. The candidate source blobs below are pinned in the updated Context Lock against the observed release source SHA 637c24c9d3ef1d9c3197912dd8f7e7b0e6b8f90a. They are planning snapshots, not future execution locks or write authorization. Canonical master Work Order/Context Lock versioning is deferred until Gate 0 is audited, merged, and the merged release tip is reverified, as Issue #348 requires.

Observed preparation snapshot: main f6738292c038eb6f0d08d1d32b3752c5c7dc417a; release/1.1 637c24c9d3ef1d9c3197912dd8f7e7b0e6b8f90a; current PR #347 before correction 9b8d8b7f976991706793c4159ceba1fdd24ad88a. Current main/release merge-base e23311e77d79b84f3c70671072a22a6f8896d13d; divergence 2 main-only / 75 release-only. The exact conflict paths are the 14 source-bound entries in the Context Lock; .engineering/CHECKPOINT.md is an additional semantic overlap although it textually merges. Recompute after Gates 0 and 1.

### Phase 1 — Issue #337 package-branch coverage correction

Stable child identity GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012 remains PROPOSED / NOT_ADMITTED. Its future artifact paths are .engineering/work-orders/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012.md, .engineering/context-locks/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012.json and .engineering/evidence/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012-EVIDENCE.md. They are not created in this correction.

Read-only source map at the captured release SHA:
- packages/cli/scripts/prepare-package.mjs: parseArguments; stagePayload; stageEngines; stageSchemaAssets; stageNativeRuntime; stageWorkspaceRuntime; stageLegalPayload; stage; resolveNpmCli; pack. This production script is READ_ONLY by default; any source refactor/injection needs separate exact approval.
- tests/v11-codecov-patch-coverage.test.mjs: first candidate test target after source-bound Issue #337 admission. It currently verifies successful real package packing plus unrelated rights diagnostic cases.
- tests/v11-wo-004-package-smoke.test.mjs and tests/v11-wo-002-cli-e2e.test.mjs: existing package/CLI regression proofs, READ_ONLY unless narrowly admitted.
- packages/cli/package.json, .github/workflows/coverage-codecov.yml and docs/COVERAGE-PIPELINE.md: read-only metadata, CI/OIDC policy and provider-method sources.
- Historical branch targets remain diagnostic only: lines 73, 83, 97, 117, 139, 140, 144, 159, 173, 199, 203, 219, 222 and 232. Recompute actual changed-line/branch intersections on the newly admitted candidate. Do not promise synthetic hits or modify CI/thresholds.

Dependency: Gate 0 actual owner-audited merge and exact release receipt, then fresh source-bound admission of existing Issue #337. Required proof stays as Issue #348 specifies: native Node 22.17.0 LCOV DA/BRDA, negative-path behavior, build/validate, package smoke, Ubuntu/Windows/macOS, security and exact-head review; later cumulative Codecov >=97.85% and Sonar remain separate Gate 2 requirements.

### Phase 2 — fresh cumulative release-to-main integration

No implementation branch or write allowlist is prepared before Gates 0 and 1. The current conflict map names .engineering/ARCHITECTURE.md, .engineering/CHECKPOINT.json, .engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md, .engineering/CONSTITUTION-LOCK.md, .engineering/DECISIONS-LEDGER.md, .engineering/DEFINITION-OF-DONE.md, .engineering/EXECUTOR-ACCELERATION-CONTRACT.md, .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md, .engineering/PROJECT-OVERVIEW.md, .engineering/REQUIREMENTS.md, .engineering/SCOPE.md, .engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md, AGENTS.md and README.md. Preserve branch-qualified D-0062/ADR-0006 on release and D-0062/ADR-0007 on main, and D-0063 only after Gate 0. Recompute merge-tree and stage blobs after Gate 1; document conflict intent before any authorized integration mutation. Review semantic overlaps in .engineering/CHECKPOINT.md, SOURCE-HIERARCHY, SECURITY, Architecture, DoD, Scope, Requirements, README and runbooks even when Git auto-merges them. Target one real-diff PR to main only after separate write-scope admission.

Planned artifacts after Gate 0: .engineering/work-orders/GBS-V11-RELEASE-ONEPASS-013.md, a fresh .engineering/context-locks/GBS-V11-RELEASE-ONEPASS-013.json, phase Evidence Bundles under .engineering/evidence/, and a machine-readable .engineering/evidence/GBS-V11-RELEASE-ONEPASS-013-GATE-MATRIX.json. Do not create the canonical master files before their required timing gate.

### Phase 3 — WO-010 production acceptance and release

WO-010 remains NOT_ADMITTED. The captured tree contains no versioned .engineering/work-orders/GBS-V11-WO-010.md. Candidate source inventory and release proof surfaces are recorded with blobs in the Context Lock: root and CLI package.json, package-lock.json, LICENSE, CHANGELOG.md, root/CLI READMEs, docs/INSTALLATION.md, docs/QUICKSTART.md, docs/V1.1-OPERATIONS-RUNBOOK.md, release plan/distribution architecture/compatibility and test matrices, package preparation script, and V1.1/security/dependency workflows. These are inventory references only; the package manifests currently state private=true and license=UNLICENSED. Registry ownership, legal distribution/license consent and trusted-publishing identity remain unverified and require owner decisions. No package, tag, main promotion, or external publication is authorized.

Dependency: Gate 2 current exact-head cumulative Codecov/Sonar/security/ancestry/conflict proof and separate owner acceptance. Prepare the complete WO-010 acceptance/evidence contract then; do not alter manifests, lockfiles, release source, workflows or tests now.

### Gate dashboard at this preparation boundary

| Gate | State | Next legal boundary |
|---|---|---|
| 0 — promotion correction | Correction Delta in progress on PR #347; no merge | Exact-head checks, then owner re-audit |
| 1 — Issue #337 | NOT_EXECUTABLE; child not admitted | Gate 0 merged, then fresh source admission |
| 2 — cumulative integration | NOT_EXECUTABLE | Gates 0 and 1 merged, then fresh conflict map and exact-head audit |
| 3 — WO-010/release | NOT_ADMITTED | Gate 2 plus separate owner acceptance and external legal/registry decisions |

V1.0 accepted history remains 1088/1088. V1.1 main Work Orders 9/10 is not an overall release-completion percentage. No Codecov or Sonar result from closed PR #278 is reused.
