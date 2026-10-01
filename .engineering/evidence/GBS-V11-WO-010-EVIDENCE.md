# GBS-V11-WO-010 clean replacement evidence

Issue #351; Master Issue #348. Gate 2 admission review #5368812257 approved Option B on source head `8529883a048eb58aa131c68800b22fba87ce8da2`. Correction Delta #17 is anchored to PR #350 review #5372870208.

## Exact candidate

- Replacement PR: [#352](https://github.com/KayzenRoot/gef-bootstrap/pull/352), OPEN/DRAFT.
- Branch: `codex/gbs-v11-wo010-clean-replacement-delta17`.
- Candidate implementation HEAD measured below: `f3777fe5824ca061803bb2b45c988861156f55c7`.
- Main base: `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`; admitted release/1.1: `4b2f66724ea5df94ddd8fda2d8088b12b9708c10`; merge base: `e23311e77d79b84f3c70671072a22a6f8896d13d`.
- Fresh normal two-parent integration commit: `4e428d4c8657c19e05a30da3ba0064190007ab5f`, tree `01acb6c2379304235b6213e3e9c7a2f87078069b`, parents main then release/1.1.
- Gate 2 recreated in commit `72db9380e7ac0afa8b5c339f72f09238f826f2a6`, tree `6e78975f0c552edfe80e472f6198dd884209b26e`, matching the admitted Gate 2 source tree and retaining `ownerDecision: OPTION_B_APPROVED`.
- The PR #350 implementation and descendants are not ancestors of PR #352. PR #350 remains OPEN/DRAFT and untouched.

## Historical PR #350

PR #350 remains preserved as historical only. Review #5372870208 blocked its final head following a full-interval Gitleaks finding. The replacement does not copy the finding value or its triggering wording. Historical implementation head: `59df2d1feadb18f5f5997f748f79339adb701f43`; final docs-only head: `3cd5ba3f7e3e5cd4c81472f521b8b8a596ad68fe`. No prior tarball receipt or checksum is credited to this candidate.

## Local exact-source validation

All commands below ran on Windows x64 with Node `v24.19.0` and npm `11.17.0`, against source commit `f3777fe5824ca061803bb2b45c988861156f55c7` in an ordinary clone.

- `npm ci --ignore-scripts --no-audit --no-fund`: PASS; 33 packages installed.
- `npm run build`: PASS.
- Directed Gate 2 admission/detachment tests: PASS, 13/13.
- Package-builder branch tests: PASS, 4/4.
- Other directed publisher/distribution/security tests: 27 passed; the receipt-bound smoke was then run separately against the real CI artifact.
- `npm run validate`: PASS, 1,610/1,610 tests, zero failed, cancelled, skipped, or todo; duration 242.2 seconds.
- `npm audit --audit-level=high`: PASS, zero vulnerabilities.
- `tests/v11-wo-010-artifact-smoke.mjs` with the real Linux-produced CI tarball and its source/ref-bound receipt: PASS on Windows x64; installed, invoked, migrated a V1.0 project, preserved state/receipts, and uninstalled.

## Real package and platform evidence

The [V1.1 release assurance run](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36794981622) is tied to source HEAD `f3777fe5824ca061803bb2b45c988861156f55c7`. Its exact-source receipt records event `pull_request`, ref `refs/pull/352/merge`, package `@gef-bootstrap/cli@1.1.0`, tarball SHA-256 `17f22607f9fc7655ab786304256509bc1b646adc0b3a4f11c81dec17ef37b898`, size 2,737,245 bytes, and 379 archive entries. The archive includes `package.json`, `LICENSE`, `README.md`, and `vendor/MANIFEST.json`.

- Release assurance: Ubuntu, macOS, and Windows all SUCCESS.
- The same SHA-bound tarball install/use/upgrade/removal matrix: Ubuntu, macOS, and Windows all SUCCESS.
- Provider artifact integrity and release manifest checks: SUCCESS in the exact-head release workflow.
- Upgrade preview/apply preserved the fixture's V1.0 state and receipt bytes in the local Windows exact-tarball smoke; full platform recovery/upgrade matrix passed in the release workflow.

## Security, coverage, and supply chain

On this candidate, all 149 PR checks completed SUCCESS. Relevant evidence: [Gitleaks and Trivy](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36794981392), [Pipeline Integrity](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36794981532), [Dependency Review](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36794981523), [CodeQL](https://github.com/KayzenRoot/gef-bootstrap/runs/110156611181), [SonarCloud](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=352), [Codecov](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap/pull/352), and [release assurance](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36794981622).

- Pinned Gitleaks 8.30.1 full `main..candidate` interval scan passed before PR creation with zero findings; the repository Gitleaks PR check also passed. The historical baseline findings are unchanged and outside the replacement diff.
- Trivy, CodeQL, Dependency Review, Pipeline Integrity, Socket, and exact-head release security/integrity jobs: PASS.
- Codecov `codecov/patch`: SUCCESS; the provider comment reports every modified, coverable line covered. The owner-approved Gate 2 decision remains `OPTION_B_APPROVED`. No coverage threshold, exclusion, workflow, or semantics was changed.
- Sonar quality gate and duplicate-block checks: PASS; zero security hotspots. Sonar reported 122 new issues on this integrated diff; this is disclosed for the owner audit and was not altered merely to reduce the count.
- No PR #350 commit is in the replacement ancestry. No token was used; no publish or registry mutation was attempted.

## npm preflight and stop

The owner reports that the npm package was created and GitHub was connected to npm. An anonymous package lookup using isolated empty npm configuration returned HTTP 404; this does not distinguish a private package from an absent package and cannot verify scope ownership or the package-level Trusted Publisher setting. The GitHub Actions OIDC publication design is documented, but its npm-side binding and account identity are **not independently verified**. No npm credential was used. Owner action is required to provide auditable confirmation of the `@gef-bootstrap` scope/package and GitHub OIDC Trusted Publisher binding.

**Current stop:** `OWNER_ACTION_REQUIRED_NPM_SCOPE_OR_OIDC`. The exact-source implementation, package, platform, security, and CI evidence are ready for review; owner audit remains pending. No merge to `main`, tag, GitHub Release, npm publish, or WO-010 production admission is authorized.
