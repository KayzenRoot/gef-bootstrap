# GBS-V11-MAINT-PR278-DUPLICATION-008 — Bounded removal of proven cumulative Sonar duplication

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: `GBS-V11-MAINT-POST-WO009-001`. Exact base: `e006fc53efa5bbd7d01cb485b3407353b27b9173`. Branch: `gbs/v11/maint-pr278-duplication-refactor-008`. Owner: KayzenRoot. Risk: ELEVATED (CLI diagnostic error projection and security-sensitive filesystem regression tests).

## OBJECTIVE
Reduce cumulative PR #278 new-code duplication without changing observable CLI errors, alias fallback behavior, runtime contracts or Sonar rules. The prior exact Sonar diagnostic job `109472537023` identified repeated engine failure projections in `packages/cli/src/registry.ts` (blocks starting 1626 and 2156, 17 lines) and duplicated `createAlias` behavior across the WO-002 private authority and ownership tests (19 lines each). Refactor only these demonstrated repeats and recheck the cumulative gate after integration.

## CONTEXT AND SOURCE CHECK
Prioritize checkpoint JSON and MD, Decisions Ledger and ADR-0005/ADR-0006, frozen Scope, Architecture, Security, DoD and Test Plan, parent maintenance Work Order and its evidence. PR #327 was approved at exact head `bcfc919a790eb73283f73fc678beddd7e94892cf` with 30/30 SUCCESS and integrated into `release/1.1` as `e006fc53efa5bbd7d01cb485b3407353b27b9173`. Historical production `main` remains `e23311e77d79b84f3c70671072a22a6f8896d13d`. PR #278 remains draft and is NOT a production claim.

## SCOPE
NECESSARY: extract a single shared engine-unavailable error constructor inside CLI registry and preserve the two verb-specific summary strings through thin wrappers; extract identical cross-platform alias test helper into `tests/helpers/directory-alias.mjs` and replace local duplicates by imports. Changes to the three existing files, new test helper and this Work Order/Context Lock/Evidence only.

## OUT OF SCOPE
Other duplicates, change to filesystem transaction authorization, runtime public API, new features, patch coverage remediation, diagnostics workflow, dependency/lockfile changes, Sonar or Codecov thresholds, active retired provider, main/tag and release publication. Distinct Codecov coverage failure gets its own correction if duplication is closed.

## FILES/SOURCES TO READ
- `.engineering/CHECKPOINT.md`
- `.engineering/CHECKPOINT.json`
- `.engineering/DECISIONS-LEDGER.md`
- `.engineering/SCOPE.md`
- `.engineering/ARCHITECTURE.md`
- `.engineering/DEFINITION-OF-DONE.md`
- `.engineering/SECURITY.md`
- `.engineering/TEST-BENCHMARK-PLAN.md`
- `.engineering/work-orders/GBS-V11-MAINT-POST-WO009-001.md`
- `.engineering/decisions/ADR-0005-LEGACY-ECOSYSTEM-DETACHMENT.md`
- `.engineering/decisions/ADR-0006-OWNER-OPERATED-REVIEW-AND-MERGE.md`
- `packages/cli/src/registry.ts`
- `tests/v11-wo-002-private-authority.test.mjs`
- `tests/v11-wo-002-ownership.test.mjs`

## REQUIREMENTS / ARCHITECTURE RULES / CONSTRAINTS
1. Error fields (id, category, reason, severity, retryability, recoverability, terminal, commandId, runId, metadata and remediation) remain byte-for-byte logically identical, and the CLI vs diagnostic summaries remain distinct.
2. `createAlias` fallback must still try directory symlink first, reject non-permission errors, then junction, returning the same unknown marker if unavailable. Test helper must never enter shipped runtime or create a provider dependency.
3. No scope expansion, security boundary relaxation or modification of admitted contracts. Preserve reserved neutral M39/M40 and fully detached Hive dependency.
4. Context Lock source fingerprints fail closed on material source drift; owner audit is NOT_INDEPENDENT.

## ACCEPTANCE CRITERIA / TESTS
- Diff limited to authorized paths and exact admission base.
- Structural source audit verifies both error wrappers call one constructor and both tests import the same helper; no new package dependency.
- Focused CLI error/projection and WO-002 ownership, authorization, private containment suites pass in Ubuntu, Windows and macOS. Full mandatory repository validation, build/typecheck, cross-platform V1.1 release assurance, CodeQL, Trivy, Gitleaks, Windows rights and upgrade/recovery pass at exact PR head. Sonar incremental gate must pass.
- Owner audit records exact SHA, tests, scope, findings, and CRITICAL/HIGH = 0 before any release-line merge.
- The separate cumulative PR #278 Sonar/Codecov quality gates are remeasured on its post-merge exact head; do not claim release completion based on the narrower candidate Sonar.

## DELIVERABLES / REVIEW FORMAT
Code, helper, Work Order, Context Lock, Evidence Bundle, GitHub PR, owner audit in Brazilian Portuguese, and a proposed Checkpoint Delta after objective approval. If cumulative duplication still exceeds 3%, address only evidence-proven remaining blocks in the next correction; keep WO-010 blocked until all release prerequisites close.

STOP CONDITION: `GBS_V11_PR278_DUPLICATION_008_EXACT_HEAD_VALIDATED_OR_CORRECTION_REQUIRED`.
