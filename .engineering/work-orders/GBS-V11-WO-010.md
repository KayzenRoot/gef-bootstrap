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
| Security/supply chain | exact-head Gitleaks full PR history, Trivy, CodeQL, Dependency Review, Pipeline Integrity, Sonar quality/duplication, Codecov Option B, dependency audit, zero unresolved release-blocking CRITICAL/HIGH, secret-free package, OIDC/provenance plan |
| Documentation | Changelog, installation, quickstart, operations runbook and package README match tested behavior; proprietary All Rights Reserved terms and known limitations remain explicit; no speedup claim beyond WO-008 `NO_CHANGE` |
| Registry preflight | check npm identity, `@gef-bootstrap` scope/ownership, `@gef-bootstrap/cli@1.1.0`, public access mode and the exact GitHub trusted publisher/workflow binding without publishing or exposing credentials |

Existing release assurance runs the full V1.1 suite on Ubuntu/macOS/Windows, including `DIST-SMOKE`, package install/use, `UPG-MIG` and `COMPAT` coverage. Correction Delta #6 (Issue #351 comment 5916761162) adds an exact-head Linux package producer plus Ubuntu/Windows/macOS consumers that install, exercise and remove the **same checksum-bound tarball**, including V1.0-to-V1.1 migration and preservation. The original per-host full-suite matrix remains unchanged. Run `npm run validate` and focused package/recovery tests locally as well.

## Bounded writes

Follow the WRITE_ALLOWED and WRITE_FORBIDDEN lists in Issue #351 and the exact exceptions recorded in the Context Lock. Expected writable surfaces are this Work Order and Context Lock; WO-010 evidence and release manifest; the existing master Work Order, Gate Matrix and checkpoint; the explicitly named release/install documentation; narrowly scoped `tests/v11-*`; the CLI publication metadata only if public namespace ownership and publication authority are verified; and the tag/manual trusted-publishing workflow. Correction Deltas #1-#5 (Issue #351 comments 5916191651, 5916319765, 5916451275, 5916464847 and 5916540441) permit only their listed config, docs, workflow and test paths. Correction Delta #6 (comment 5916761162) permits `.github/workflows/v11-release-assurance.yml` solely to make same-artifact matrix evidence runnable pre-merge. It adds no OIDC privilege or publication trigger. The prototype-pollution fix is the only runtime-source exception and remains limited to `packages/config/src/index.ts`.

Root `package.json` and lockfile remain read-only unless an exact package requirement proves a deterministic metadata change. Do not rename `@gef-bootstrap/cli`, convert its proprietary rights, weaken CI/Codecov/security, or edit runtime without an objective defect and a precise same-Issue Correction Delta. Ordinary defects stay in this WO/PR; do not create another Work Order. Before an authorized bug fix, append to Issue #351 the failing check, root cause, exact path/symbol, minimal fix and regression proof.

## Registry and publication boundary

Trusted publishing is the required path where npm supports OIDC; do not substitute a long-lived token. Do not remove `private: true` from `packages/cli/package.json` unless the exact public scope/package ownership and trusted publisher are verified. Preserve `UNLICENSED` and the existing All Rights Reserved LICENSE unless package tooling proves a minimal truthful metadata adjustment is necessary.

If identity, namespace ownership or the package's trusted publisher cannot be verified/configured, finish all safe pre-publication work and record one concise `OWNER_ACTION_REQUIRED` block naming the exact npm scope/package settings. Do not publish a placeholder/staged package, use a token, or infer ownership from a public 404.

## Stop conditions

Pre-merge audit readiness requires every applicable acceptance row green on the exact current PR head and no unresolved release-blocking CRITICAL/HIGH. Update the Evidence Bundle and Gate Matrix, keep PR #350 DRAFT, then stop at:

`GBS_V11_WO_010_EXACT_HEAD_READY_FOR_PRODUCTION_ACCEPTANCE_AUDIT`

If external npm namespace/OIDC setup remains unverified after safe pre-publication work, stop at:

`OWNER_ACTION_REQUIRED_NPM_SCOPE_OR_OIDC`

No merge, tag, GitHub Release or npm publication occurs in this execution.
