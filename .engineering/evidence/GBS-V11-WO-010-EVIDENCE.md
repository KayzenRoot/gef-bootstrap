# GBS-V11-WO-010 — Prepublication acceptance evidence

Issue #351; Master Issue #348; PR [#350](https://github.com/KayzenRoot/gef-bootstrap/pull/350); branch `codex/gbs-v11-release-integration-014`.

Gate 2 admission: review #5368812257, `OWNER_APPROVED / GATE 2 COMPLETE / NOT_INDEPENDENT`, admitted source head `8529883a048eb58aa131c68800b22fba87ce8da2`. WO-010 implementation/code candidate tested below is `59df2d1feadb18f5f5997f748f79339adb701f43`; base/main is `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`; release source is `4b2f66724ea5df94ddd8fda2d8088b12b9708c10`; merge base is `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`. The evidence snapshot is a docs/checkpoint-only follow-up to that tested implementation head.

## Real package, manifest, checksums and provenance

- Exact-head package candidate: [run 36779630179 / job 110106182892](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36779630179/job/110106182892), `SUCCESS`. The receipt binds source commit `59df2d1feadb18f5f5997f748f79339adb701f43`, event `pull_request`, ref `refs/pull/350/merge`, Linux x64 producer and the tarball digest.
- Tarball: `gef-bootstrap-cli-1.1.0.tgz`, 2,737,245 bytes, SHA-256 `17f22607f9fc7655ab786304256509bc1b646adc0b3a4f11c81dec17ef37b898`. The downloaded run receipt matched the locally recomputed SHA-256. GitHub artifact ID `11126264348` (2,546,528 bytes; provider archive digest `sha256:2c92f9057a108a9491cfd1c762113e2b61ff38d78244b36d24715f2515ad7a2b`).
- Inspection of that exact tarball: 379 entries; all stayed inside the reviewed package/file/bundle allowlist; no sensitive filename was present; required CLI, README, LICENSE, schemas and vendor paths were present. Package is `@gef-bootstrap/cli@1.1.0`, `private: true`, `license: UNLICENSED`. The staged Koffi manifest contains exactly the four lock-verified native optionals bundled for Linux x64, Windows x64 and macOS x64/arm64.
- `package/vendor/MANIFEST.json`: 23 artifact entries; all 13 SHA-256 entries were recomputed against extracted tarball files and matched. All five native package SHA-512 integrity entries match the root lockfile. The other entries bind bundled runtime package names and versions.
- One receipt-bound tarball with SHA-256 `17f22607f9fc7655ab786304256509bc1b646adc0b3a4f11c81dec17ef37b898` was installed, exercised, migrated and removed on Ubuntu, Windows and macOS in [run 36779630179](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36779630179): Ubuntu job 110107056220, Windows job 110107056542, macOS job 110107056349, all `SUCCESS`. Windows used the standard non-Administrator identity. The harness bound source SHA, event/ref and receipt checksum; it exercised CLI/library use and V1.0-to-V1.1 migration with state preservation, then uninstalled the package. I also ran this same downloaded receipt-bound artifact locally on Windows x64; `npm ci --offline --ignore-scripts`, native Koffi load, CLI/library use, migration and uninstall passed.
- Full V1.1 release assurance passed on Ubuntu, Windows and macOS in [run 36779630179](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36779630179), jobs 110106182897, 110106182847 and 110106182803. Separate upgrade/recovery assurance passed on all three platforms in [run 36779629909](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36779629909), jobs 110106180466, 110106180935 and 110106180892. Repository Validation passed at [run 36779630315 / job 110106182351](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36779630315/job/110106182351).
- Local checks: clean `npm ci --no-audit --no-fund` (33 packages); `npm run build`; `npm audit --audit-level=high` (0 vulnerabilities); focused package/publisher suite 11/11; `npm run validate` (1610/1610, 0 failed, 0 skipped); receipt-bound same-artifact Windows smoke; `git diff --check`; staged secret-pattern scan (no matches). Node `v24.19.0`, npm `11.17.0`.
- The publisher workflow prepares npm Trusted Publishing through GitHub OIDC and keeps `id-token: write` limited to the exact-tag publish job. This candidate has no registry attestation because it was not published; the run receipt is source/event/ref and tarball-digest provenance for the prepublication artifact only.

## Exact-head coverage, security and supply-chain results

All 147 PR check contexts completed on implementation HEAD `59df2d1feadb18f5f5997f748f79339adb701f43`: 146 `SUCCESS`, 1 `FAILURE`, 0 pending. These are current-candidate results; earlier-head checks are not credited.

- Codecov Option B: exact-head LCOV upload [run 36779630067 / job 110106182182](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36779630067/job/110106182182) passed for commit `59df2d1feadb18f5f5997f748f79339adb701f43`. Provider `codecov/patch` check [110107481751](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap/pull/350) passed with “Coverage not affected when comparing f673829...59df2d1”; the upload emitted the [exact commit report](https://app.codecov.io/github/kayzenroot/gef-bootstrap/commit/59df2d1feadb18f5f5997f748f79339adb701f43). Per the owner-approved Option B, record `N/A_ZERO_DENOMINATOR`, never 100% or a numeric percentage.
- Trivy filesystem/configuration: `SUCCESS`; CodeQL: `SUCCESS` at [run 110107226706](https://github.com/KayzenRoot/gef-bootstrap/runs/110107226706), with exact-head tracked-alert evidence also `SUCCESS` at [run 36779630179 / job 110106182963](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36779630179/job/110106182963). CodeQL surfaced one MEDIUM alert; the tracked-alert check passed. Dependency Review and Pipeline Integrity: `SUCCESS`.
- SonarCloud Quality Gate: `SUCCESS` at [PR #350 analysis](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=350). Cumulative Sonar diagnostics and duplicate-block inventory also passed in run 36779630179. This corrects the prior candidate's Sonar result; no unrelated source or Sonar policy changes were made.
- Gitleaks: `FAILURE` at [run 36779630093 / job 110106182402](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36779630093/job/110106182402). The full PR interval scan reports one redacted `generic-api-key` finding at historical `.engineering/work-orders/GBS-V11-WO-010.md:40`, introduced at commit `e6bb4403537a39d4db8fb3799deb85e49400140a`. The scanner did not disclose the matched value; the previously recorded owner correction replaced the wording in current content, but the historical commit remains in the PR interval. Clearing the historical result would require a history rewrite or scanner-policy change, neither authorized.
- Exact-head check inventory: [PR #350 checks](https://github.com/KayzenRoot/gef-bootstrap/pull/350/checks). CodeRabbit's context says review skipped because the PR is draft; it is not an audit or owner approval.

## Documentation and npm trusted-publishing preflight

The documented release/install surfaces (`CHANGELOG.md`, `docs/INSTALLATION.md`, `docs/QUICKSTART.md`, `docs/V1.1-OPERATIONS-RUNBOOK.md`, and `packages/cli/README.md`) and tag-only publisher workflow remain in the same WO/PR and are included by the exact-head repository tests/release assurance. Existing proprietary All Rights Reserved terms remain in force; package visibility and license metadata were not changed.

Fresh non-destructive registry checks:

- `npm whoami --registry=https://registry.npmjs.org/`: `ENEEDAUTH`; no authenticated npm identity is available in this environment.
- `npm access list packages @gef-bootstrap`: HTTP 404, `Scope not found`.
- `npm view @gef-bootstrap/cli@1.1.0 version`: HTTP 404, package not found.
- Package-level npm Trusted Publisher/OIDC settings and registry ownership therefore could not be verified. No token was read, created or used; publication was `NOT_ATTEMPTED`.

**Owner action:** an npm account controlled by the owner must establish or verify the `@gef-bootstrap` scope and `@gef-bootstrap/cli` package, confirm public-release rights, and configure npm Trusted Publishing for `KayzenRoot / gef-bootstrap / v11-publish.yml / npm-publish`. Do not substitute a long-lived token.

## Disposition and boundary

Stop token: `OWNER_ACTION_REQUIRED_NPM_SCOPE_OR_OIDC`, because required npm identity/scope/OIDC configuration is external and unavailable. The exact-head Gitleaks failure is an additional blocker, so this candidate is **not** `GBS_V11_WO_010_EXACT_HEAD_READY_FOR_PRODUCTION_ACCEPTANCE_AUDIT` and WO-010 is not accepted. Sonar is green on this head. The live exact PR check inventory and any evidence-only follow-up tip must be revalidated by the owner during reauditoria; no earlier-head result is transferred.

PR #350 remains open and draft. No merge to `main`, `v1.1.0` tag, GitHub Release, staging publish or npm publication occurred. V1.0 production remains accepted at 1088/1088; no V1.1 production credit or stable-channel claim is made.
