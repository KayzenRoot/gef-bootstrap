# GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012 — Exact package branch tests

Status: `LOCAL_VALIDATION_PASS_AWAITING_EXACT_HEAD_CHECKS_AND_OWNER_AUDIT`
Issue/admission: [#337](https://github.com/KayzenRoot/gef-bootstrap/issues/337), owner source admission after PR #347 merge
Master: [GBS-V11-RELEASE-ONEPASS-013](GBS-V11-RELEASE-ONEPASS-013.md), Issue [#348](https://github.com/KayzenRoot/gef-bootstrap/issues/348)
Target: `release/1.1`
Owner: `KayzenRoot`
Context Lock: `.engineering/context-locks/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012.json`
Evidence: `.engineering/evidence/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012-EVIDENCE.md`

## Objective

Prove the existing fail-closed negative/error paths in the current CLI package builder with real assertions and isolated, disposable filesystem/process fixtures. Recompute native line and branch data on the exact Phase 1 candidate. Preserve the existing successful pack behavior and leave the production package workspace unchanged.

## Admission and exact source

The owner admission in Issue #337 supersedes that issue's earlier proposed/not-admitted text for this bounded tests-only scope. It binds the execution base to `release/1.1@9f6f069c977868ade34a19cddb346f7bea9a95fe`, current `main@f6738292c038eb6f0d08d1d32b3752c5c7dc417a`, merge base `e23311e77d79b84f3c70671072a22a6f8896d13d`, package script blob `10e659ccce15045ed37ffa3e82d06a8408b8f734`, current coverage test blob `2441961628d20dcc9404d2e51cc1d97b03543137`, and Source Hierarchy blob `bedc10c97d28154efe59ff43fc1d175add37f568`.

The source recheck immediately before authoring confirmed those refs and critical blobs unchanged. Recompute them immediately before every source edit and bind final test evidence to the PR's exact HEAD. Historic PR #278 metrics and its closed-PR checks are diagnostic context only.

## Required sources

- `AGENTS.md`, `tests/AGENTS.md`, `packages/AGENTS.md`.
- `.engineering/SOURCE-HIERARCHY.md`, current `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json`.
- `.engineering/SCOPE.md`, `.engineering/releases/V1.1-SCOPE.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `SECURITY.md`, `TEST-BENCHMARK-PLAN.md`, `DEFINITION-OF-DONE.md`, `DEPLOYMENT.md`, `CONSTITUTION-LOCK.md`, `CONSTITUTION-AMENDMENT-0001-HYBRID.md`, `DECISIONS-LEDGER.md`, and applicable ADR-0003 through ADR-0008.
- Parent `.engineering/work-orders/GBS-V11-MAINT-POST-WO009-001.md` and checkpoint Context Lock `.engineering/context-locks/GBS-V11-MAINT-WO009-CP-002.json`.
- Issue #334 diagnostic comment #5894818858; Issue #337 full owner admission; master Issue #348; Issue #335 and merged planning PR #336.
- `packages/cli/scripts/prepare-package.mjs`, `tests/v11-codecov-patch-coverage.test.mjs`, `.github/workflows/coverage-codecov.yml`, `docs/COVERAGE-PIPELINE.md`, root and CLI `package.json`/lockfile, applicable package and integration tests.

## Authorized change and file map

### WRITE_ALLOWED

- `tests/v11-codecov-patch-coverage.test.mjs`.
- Optionally one narrowly scoped `tests/v11-pack-branch-negative.test.mjs` to isolate direct process/argv behavior from the normal test worker.
- This Work Order, fresh branch-bound Context Lock(s), this Evidence Bundle, the master Work Order/gate matrix, and PR metadata.

### READ_ONLY / WRITE_FORBIDDEN

- `packages/cli/scripts/prepare-package.mjs` is `READ_ONLY`. No production-source refactor, injection seam, API change or package behavior change is admitted.
- Every other production/test file, package manifest/lockfile, dependency, CI/coverage workflow, threshold, policy, checkpoint, `main`, tag and release/publishing surface is `WRITE_FORBIDDEN`.
- If a legitimate branch cannot be meaningfully exercised with this tests-only boundary, document its exact branch/function and stop for an owner-authorized bounded source delta to Issue #337. Do not mask the need with fake hits or an empty assertion.

## Technical contract and test plan

The exact script exports `stage()` and `pack(destination)`, derives its package/repository roots from the script URL, stages into a unique OS temp directory, and removes successful pack staging in `finally`. Drive those real exports from a byte-verified copy under a disposable fixture tree mirroring `packages/cli/scripts/`; populate only the synthetic package/engine/schema/native/workspace/legal files needed for each case. The fixture must not touch the actual package workspace. Track and clean temp staging paths even when `stage()` throws before returning its path.

The fixture may redirect the copied script's filesystem root for isolation and may supply a scoped fake `npm_execpath`/fake npm CLI for the existing subprocess boundary. Any test-only source adaptation must be limited to the disposable copy, preserve every source line and branch, be asserted against the current source hash and exact replacement count, and preserve the production script identity in the native LCOV record. Do not change the real script or the workflow. Process-boundary cases use child processes; the test process must not alter host Node/npm installation, globally inherited environment, or the real project workspace.

Exercise and assert the real error condition/message plus cleanup/non-interference for the current source branches:

| Source line(s) | Isolated case and proof |
|---|---|
| 73 | first required package payload absent; `stage()` fails closed |
| 83 | package payload present, first engine source absent |
| 97 | engine sources present, M62/M63 supporting source absent |
| 117 | engines present, required CLI schema absent |
| 139 | native `@koromix` root absent |
| 140 | native root present but current host package absent |
| 144 | host package present but `koffi` package absent |
| 159 | native dependencies present but built runtime `dist` absent |
| 173 | complete runtime fixture present but repository LICENSE absent |
| 199 | actual platform-specific npm CLI candidate branch on genuine Windows/Linux/macOS runs |
| 203 | npm CLI cannot be resolved with an isolated executable location and scoped invalid `npm_execpath`; assert the resolver error and cleanup without changing host Node/npm |
| 219 | isolated fake npm CLI exits nonzero; assert package failure and staging cleanup |
| 222 | isolated fake npm CLI exits zero without emitting a tarball; assert no-tarball error and staging cleanup |
| 232 | direct `--pack` invocation without `--destination`; assert nonzero exit and exact usage failure in an isolated process |

Also retain a normal successful package tarball assertion and all existing rights-diagnostic tests. Negative tests must establish behavior, exact failure category, cleanup and non-interference. Do not use coverage directives, stubs that merely touch a line, or assumptions that silently skip platform behavior.

## Acceptance / validation

1. Fresh exact source/ref/blob preflight passes.
2. Native Node `22.17.0` test coverage executes the full `tests/*.test.mjs` suite after `npm ci --ignore-scripts` and `npm run build`, emits nonempty LCOV, and records actual `DA` and `BRDA` for the exact production script. Recompute current changed-line intersections; historic 14 line numbers are targets to inspect, not assumed current results.
3. Exact assertions prove every feasible admitted negative branch, normal package packing, cleanup, and no mutation of the real package workspace.
4. `npm run build`, full `npm run validate`, package/integration/security tests, and applicable release assurance complete. Report per-platform `PASS/FAIL/SKIP/NOT_RUN` for Ubuntu, Windows and macOS; a local Windows result does not substitute for CI matrix evidence.
5. Pinned Gitleaks covers the complete new commit interval; Trivy, current CodeQL/Sonar where applicable and all required exact-head workflows are observed. No unresolved CRITICAL/HIGH finding.
6. Evidence binds base, exact final head, source blobs, toolchain, actual line/branch records, test results, provider URLs, changed files, risk and remaining limitations. PR targets `release/1.1` and is left open for required exact-head owner audit.

No check, test, threshold or security gate may be weakened. A green Phase 1 unit result alone does not prove a future cumulative release-to-main Codecov patch gate; Phase 2 must prove `>=97.85%` independently.

## Required deliverables and review

One cohesive actual-diff Phase 1 PR containing only the admitted tests and governance/evidence artifacts. Owner audit follows ADR-0006 / D-0062 on the exact candidate head and is `NOT_INDEPENDENT`. This Work Order authorizes no merge.

**STOP:** `GBS_V11_MAINT_PACK_BRANCH_CORRECTION_012_SOURCE_BOUND_TESTS_ONLY_ADMITTED_EXACT_HEAD_READY_FOR_OWNER_AUDIT`. If the exact source/ref binding moves or any production-source permission is needed, stop as `BLOCKED_NEEDS_BOUNDED_OWNER_DELTA`.
