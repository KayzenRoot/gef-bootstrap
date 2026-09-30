# GBS-V11-WO-010 — V1.1 production acceptance and release preparation

**Issue:** [#351](https://github.com/KayzenRoot/gef-bootstrap/issues/351)

**Master:** Issue #348 / `GBS-V11-RELEASE-ONEPASS-013`

**Implementation PR:** #350, same branch `codex/gbs-v11-release-integration-014`

**Admission:** OWNER-ADMITTED after Gate 2 review #5368812257 (`OWNER_APPROVED / NOT_INDEPENDENT`)

**Starting HEAD:** `8529883a048eb58aa131c68800b22fba87ce8da2`

**Starting main:** `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`

**Release source:** `4b2f66724ea5df94ddd8fda2d8088b12b9708c10`
**Risk:** ELEVATED for release, registry and irreversible promotion actions.

## Objective and current boundary

Execute the pre-merge production acceptance matrix from Issue #351 against a fresh exact head of PR #350. Build and inspect a real npm tarball; prove install, CLI/library use, upgrade, recovery and removal on Windows, Linux and macOS; complete security, dependency, provenance, manifest, checksum and documentation evidence; and perform every non-destructive npm trusted-publishing preflight available.

This Work Order records production-acceptance preparation only. The current execution stops before merge, tag, GitHub Release and npm publication. V1.0 remains the promoted production release at `1088/1088`; no V1.1 production credit or stable-channel claim is made. A fresh owner exact-head audit is still required after this candidate is prepared.

## Authority and exact-state lock

The owner admission and complete acceptance requirements are in Issue #351. Gate 2's Codecov Option B remains exactly governed by Issue #348: numeric patch coverage must be at least 97.85% when defined; zero eligible lines may be `N/A_ZERO_DENOMINATOR` only with exact base/head, successful LCOV upload, successful provider patch status explicitly reporting zero lines/not affected, visible project/head coverage, unchanged thresholds/exclusions/definition, and all other exact-head gates green. N/A is never 100%.

Use `.engineering/context-locks/GBS-V11-WO-010.json`. Re-fetch and rebind PR #350, `main`, and `release/1.1` before changes. Stop if the branch, base, owner admission, ancestry, or canonical source bindings conflict.

## Required pre-merge acceptance

All rows apply to the exact final PR head; unrun or stale evidence is `NOT_RUN`, never inferred as a pass.

| Area | Required proof |
|---|---|
| Release truth | version 1.1.0, immutable V1.0 history, exact ancestry/decision lineage, D-0062 branch qualification, D-0063 adoption and D-0064 unallocated |
| Package | clean lockfile install/build/validate, real `npm pack` tarball, contents allowlist, LICENSE/README/schemas/dist/bin/vendor/native payload, tarball SHA-256, source/version manifest, installed `gef --help`, `--version`, doctor/status and supported library import |
| Platforms | genuine Ubuntu, Windows and macOS package install/use/remove, NEW_PROJECT init, EXISTING_PROJECT/BROWNFIELD adopt, unsupported runtime, paths/permissions/symlinks/native Koffi behavior as applicable |
| Upgrade/recovery | preview/dry-run, compatibility, V1.0-to-V1.1 state migration, user-state preservation, interrupted/failed recovery, rollback/roll-forward only as supported, denied permissions/missing capability/offline dependency, unsupported downgrade, and no silent CLI self-update |
| Security/supply chain | exact-head Gitleaks full PR history, Trivy, CodeQL, Dependency Review, Pipeline Integrity, Sonar quality/duplication, Codecov Option B, dependency audit, zero unresolved release-blocking CRITICAL/HIGH, archive-content scan, OIDC/provenance plan |
| Documentation | Changelog, installation, quickstart, operations runbook and package README match tested behavior; proprietary All Rights Reserved terms and known limitations remain explicit; no speedup claim beyond WO-008 `NO_CHANGE` |
| Registry preflight | check npm identity, `@gef-bootstrap` scope/ownership, `@gef-bootstrap/cli@1.1.0`, public access mode and the exact GitHub trusted publisher/workflow binding without publishing or exposing credentials |

Existing release assurance runs the full V1.1 suite on Ubuntu/macOS/Windows, including `DIST-SMOKE`, package install/use, `UPG-MIG` and `COMPAT` coverage. Correction Delta #6 (Issue #351 comment 5916761162) adds an exact-head Linux package producer plus Ubuntu/Windows/macOS consumers that install, exercise and remove the **same checksum-bound tarball**, including V1.0-to-V1.1 migration and preservation. The original per-host full-suite matrix remains unchanged. Run `npm run validate` and focused package/recovery tests locally as well.

## Bounded writes

Follow the WRITE_ALLOWED and WRITE_FORBIDDEN lists in Issue #351 and the exact exceptions recorded in the Context Lock. Expected writable surfaces are this Work Order and Context Lock; WO-010 evidence and release manifest; the existing master Work Order, Gate Matrix and checkpoint; the explicitly named release/install documentation; narrowly scoped `tests/v11-*`; the CLI publication metadata only if public namespace ownership and publication authority are verified; and the tag/manual trusted-publishing workflow. Correction Deltas #1-#5 (Issue #351 comments 5916191651, 5916319765, 5916451275, 5916464847 and 5916540441) permit only their listed config, docs, workflow and test paths. Correction Delta #6 (comment 5916761162) permits `.github/workflows/v11-release-assurance.yml` solely to make same-artifact matrix evidence runnable pre-merge. It adds no OIDC privilege or publication trigger. The prototype-pollution fix is the only runtime-source exception and remains limited to `packages/config/src/index.ts`.

Root `package.json` and lockfile remain read-only unless an exact package requirement proves a deterministic metadata change. Do not rename `@gef-bootstrap/cli`, convert its proprietary rights, weaken CI/Codecov/security, or edit runtime without an objective defect and a precise same-Issue Correction Delta. Ordinary defects stay in this WO/PR; do not create another Work Order. Before an authorized bug fix, append to Issue #351 the failing check, root cause, exact path/symbol, minimal fix and regression proof.

## Registry and publication boundary

Correction Delta #7 (Issue #351 comment 5917327074) permits packages/cli/scripts/prepare-package.mjs to stage lockfile-integrity-verified Koffi prebuilds for the supported OS/CPU targets. The generated tarball manifest receives the corresponding native optional and bundled dependency entries; source package metadata and package-lock.json stay unchanged. The delta also permits the existing publisher and harness regression paths listed in the Context Lock to assert those binaries and use script-disabled, lockfile-backed installation.

Correction Delta #8 (Issue #351 comment 5917518687) permits the same package-preparation, publisher and harness paths to include the complete reachable internal @gef-bootstrap workspace runtime closure. Its staged dependencies and bundle list make the tarball installable offline without resolving private workspace packages from the public registry; source package metadata and package-lock.json remain unchanged.

Correction Delta #9 (Issue #351 comment 5917645177) permits only the two package-builder Git-blob identity constants in `tests/v11-codecov-patch-coverage.test.mjs` and `tests/v11-pack-branch-negative.test.mjs` to advance to the exact current builder blob. It preserves every assertion and all Codecov, coverage-threshold, exclusion, workflow, and branch-negative semantics.

Correction Delta #10 (Issue #351 comment 5917689147) permits only the distribution expectations in `tests/v11-wo-002-dist-smoke.test.mjs` and `tests/v11-wo-003-dist-smoke.test.mjs` to describe the complete internal runtime closure and portable Koffi native payload already authorized by Deltas #7 and #8. It preserves source package metadata, runtime behavior, security assertions, and platform-native loading requirements.

Correction Delta #11 (Issue #351 comment 5917783307) permits only the package-builder fixture in `tests/v11-codecov-patch-coverage.test.mjs` to supply the root lock and complete internal runtime set required by lockfile-verified native staging, and to replace obsolete host-local prebuild absence cases with fail-closed missing/invalid-lock cases. Existing Codecov and branch-negative assertions remain unchanged.

Correction Delta #12 (Issue #351 comment 5918081266) permits the POSIX assertion in `tests/v11-wo-003-dist-smoke.test.mjs` to require the portable Windows prebuild to remain present in the installed universal tarball. POSIX doctor/status behavior remains on the effective-write proof and does not load the Windows adapter.

Correction Delta #13 (Issue #351 comment 5918415058) permits the existing `.github/scripts/run-v11-unprivileged-validation.ps1` helper to run the bounded WO-010 artifact smoke under its standard non-Administrator identity, and routes only the Windows same-artifact consumer in `.github/workflows/v11-release-assurance.yml` through that mode. Its workflow guard in `tests/v11-wo-010-publish-workflow.test.mjs` must preserve exact source/event/ref and receipt binding. The helper's default full-validation behavior, Git machine-trust policy, runtime, tarball, matrix, and publication controls remain unchanged.

Correction Delta #14 (Issue #351 comment 5918809234) permits the exact-artifact-smoke mode of `.github/scripts/run-v11-unprivileged-validation.ps1` to apply its already validated receipt/source/event/ref and isolated tool/profile/temp environment inside a clean bootstrap process before loading the existing smoke harness. This preserves the default full-validation path, standard Windows user, exact tarball, matrix, Git trust policy, runtime and publication controls.

## Correction Delta #15 — exact-head Sonar lockfile and package-builder findings

Issue #351 corrections: primary comment 5919409800 and smoke-scope addendum 5919562332.

The exact-head Sonar Quality Gate identified two lockfile-install vulnerabilities in .github/workflows/v11-publish.yml, two PATH-resolved tar vulnerabilities in packages/cli/scripts/prepare-package.mjs, and a critical sort finding in the bundle-dependency manifest. The bounded fix changes consumer installation to npm ci after lockfile generation, invokes the supported platform tar through an absolute system path with fail-closed availability checks, and makes existing UTF-16 code-unit package-name ordering explicit without changing order.

Scope is limited to the publisher workflow, package-preparation script, existing WO-010 publisher/artifact-smoke tests, the two admitted package-builder Git-blob identity constants in tests/v11-codecov-patch-coverage.test.mjs and tests/v11-pack-branch-negative.test.mjs, this Work Order, and its Context Lock. No package metadata, dependency, runtime behavior, workflow trigger/permission, coverage, or security policy changes.

Regression proof: focused package-builder/publisher guards, full npm run validate, and fresh exact-head package, cross-platform, security, quality and required PR checks. Delta #15 does not waive Gitleaks, Sonar, npm owner configuration, or the exact-head audit stop conditions.

## Correction Delta #16 — bundled Koffi optional-dependency lock mismatch

Issue #351 correction: comment 5919878202.

The checksum-bound real tarball from PR #350 HEAD `e8fb71cdcfde953365829fba868d7ecab21e9535` failed the consumer's `npm ci`: its generated package lock omitted optional Koffi platform packages beyond the four native prebuilds bundled for Linux x64, Windows x64 and macOS x64/arm64, while the copied nested Koffi manifest still declared those additional platforms. npm correctly rejected the inconsistent lock.

The correction is limited to `packages/cli/scripts/prepare-package.mjs`, `tests/v11-codecov-patch-coverage.test.mjs`, `tests/v11-pack-branch-negative.test.mjs`, `tests/v11-wo-010-publish-workflow.test.mjs`, this Work Order and `.engineering/context-locks/GBS-V11-WO-010.json`. The package builder narrows only the staged Koffi manifest's `optionalDependencies` to the four entries already verified against the root lockfile and bundled into the portable tarball. The source Koffi metadata, package identity, root package manifest/lockfile, runtime code, lifecycle policy and supported-platform behavior remain unchanged. Existing package-builder blob identity assertions are refreshed only as admitted.

Regression proof requires a fixture containing supported and unsupported Koffi optional entries, exact staged metadata assertions, a receipt-bound real-tarball `npm ci --offline --ignore-scripts` and native Koffi load on Windows/Linux/macOS, focused package tests, `npm run build`, `npm audit --audit-level=high`, `npm run validate`, and fresh exact-head checks. Delta #16 does not waive any security, npm-owner-configuration or audit stop condition.

Trusted publishing is the required path where npm supports OIDC; do not substitute a long-lived token. Do not remove `private: true` from `packages/cli/package.json` unless the exact public scope/package ownership and trusted publisher are verified. Preserve `UNLICENSED` and the existing All Rights Reserved LICENSE unless package tooling proves a minimal truthful metadata adjustment is necessary.

If identity, namespace ownership or the package's trusted publisher cannot be verified/configured, finish all safe pre-publication work and record one concise `OWNER_ACTION_REQUIRED` block naming the exact npm scope/package settings. Do not publish a placeholder/staged package, use a token, or infer ownership from a public 404.

## Stop conditions

Pre-merge audit readiness requires every applicable acceptance row green on the exact current PR head and no unresolved release-blocking CRITICAL/HIGH. Update the Evidence Bundle and Gate Matrix, keep PR #350 DRAFT, then stop at:

`GBS_V11_WO_010_EXACT_HEAD_READY_FOR_PRODUCTION_ACCEPTANCE_AUDIT`

If external npm namespace/OIDC setup remains unverified after safe pre-publication work, stop at:

`OWNER_ACTION_REQUIRED_NPM_SCOPE_OR_OIDC`

No merge, tag, GitHub Release or npm publication occurs in this execution.
