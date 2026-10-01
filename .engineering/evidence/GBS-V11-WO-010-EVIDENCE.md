# GBS-V11-WO-010 clean replacement evidence

Issue #351; Master Issue #348. Gate 2 admission review #5368812257 approved Option B on source head `8529883a048eb58aa131c68800b22fba87ce8da2`. Correction Delta #17 is anchored to PR #350 review #5372870208.

## Exact candidate

- Replacement PR: [#352](https://github.com/KayzenRoot/gef-bootstrap/pull/352), OPEN/DRAFT.
- Branch: `codex/gbs-v11-wo010-clean-replacement-delta17`.
- Candidate implementation commit: `f3777fe5824ca061803bb2b45c988861156f55c7`; npm repository metadata correction commit: `aa7c170bc57040a7a00c85b4f41d15e4bfb2ff3f`.
- Main base: `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`; admitted release/1.1: `4b2f66724ea5df94ddd8fda2d8088b12b9708c10`; merge base: `e23311e77d79b84f3c70671072a22a6f8896d13d`.
- Fresh normal two-parent integration commit: `4e428d4c8657c19e05a30da3ba0064190007ab5f`, tree `01acb6c2379304235b6213e3e9c7a2f87078069b`, parents main then release/1.1.
- Gate 2 recreated in commit `72db9380e7ac0afa8b5c339f72f09238f826f2a6`, tree `6e78975f0c552edfe80e472f6198dd884209b26e`, matching the admitted Gate 2 source tree and retaining `ownerDecision: OPTION_B_APPROVED`.
- The PR #350 implementation and descendants are not ancestors of PR #352. PR #350 remains OPEN/DRAFT and untouched.

## Historical PR #350

PR #350 remains preserved as historical only. Review #5372870208 blocked its final head following a full-interval Gitleaks finding. The replacement does not copy the finding value or its triggering wording. Historical implementation head: `59df2d1feadb18f5f5997f748f79339adb701f43`; final docs-only head: `3cd5ba3f7e3e5cd4c81472f521b8b8a596ad68fe`. No prior tarball receipt or checksum is credited to this candidate.

## Local exact-source validation

Validation ran on Windows x64 with Node `v24.19.0` and npm `11.17.0`. `npm run build`, the 11 directed package-builder/publisher tests, and `npm pack --dry-run --json --workspace @gef-bootstrap/cli` passed with the corrected manifest. A first full `npm run validate` in the linked worktree produced 2 environment-only failures because those tests read `.git/index` as a directory-backed clone path; repeating the same tracked source and manifest in a normal clone passed `1610/1610`. Exact-head GitHub Repository Validation also passed on `aa7c170bc57040a7a00c85b4f41d15e4bfb2ff3f`.

- `npm ci --ignore-scripts --no-audit --no-fund`: PASS; 33 packages installed.
- `npm run build`: PASS.
- Directed Gate 2 admission/detachment tests: PASS, 13/13.
- Package-builder branch tests: PASS, 4/4.
- Other directed publisher/distribution/security tests: 27 passed; the receipt-bound smoke was then run separately against the real CI artifact.
- `npm run validate`: PASS, 1,610/1,610 tests, zero failed, cancelled, skipped, or todo; duration 242.2 seconds.
- `npm audit --audit-level=high`: PASS, zero vulnerabilities.
- `tests/v11-wo-010-artifact-smoke.mjs` with the real Linux-produced CI tarball and its source/ref-bound receipt: PASS on Windows x64; installed, invoked, migrated a V1.0 project, preserved state/receipts, and uninstalled.

## Real package and platform evidence

The [V1.1 release assurance run](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36803639314) is tied to source HEAD `aa7c170bc57040a7a00c85b4f41d15e4bfb2ff3f`. Its exact-source receipt records event `pull_request`, ref `refs/pull/352/merge`, package `@gef-bootstrap/cli@1.1.0`, tarball SHA-256 `b6900bed8b6ce9be7f196719b9384c7a6ecadbf63ca5a82bc55d07ef38978a45`, size 2,737,237 bytes, and 379 archive entries. The downloaded exact-head artifact manifest binds that digest to source `aa7c170bc57040a7a00c85b4f41d15e4bfb2ff3f`. The packed `package/package.json` contains repository URL `https://github.com/KayzenRoot/gef-bootstrap.git`, while retaining `private: true`, name `@gef-bootstrap/cli`, version `1.1.0`, and license `UNLICENSED`.

- Release assurance: Ubuntu, macOS, and Windows all SUCCESS.
- The same SHA-bound tarball install/use/upgrade/removal matrix: Ubuntu, macOS, and Windows all SUCCESS.
- Provider artifact integrity and release manifest checks: SUCCESS in the exact-head release workflow.
- Upgrade preview/apply preserved the fixture's V1.0 state and receipt bytes in the local Windows exact-tarball smoke; full platform recovery/upgrade matrix passed in the release workflow.

## Security, coverage, and supply chain

On exact PR head `aa7c170bc57040a7a00c85b4f41d15e4bfb2ff3f`, all 149 PR check contexts were in the pass bucket, all 4 required checks passed, and no context remained failing or pending. CodeRabbit was skipped because the PR is draft. Relevant evidence: [Gitleaks and Trivy](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36803639235), [Pipeline Integrity](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36803639444), [Dependency Review](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36803639218), [CodeQL](https://github.com/KayzenRoot/gef-bootstrap/runs/110183890106), [SonarCloud](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=352), [Codecov](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap/pull/352), and [release assurance](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36803639314).

- Pinned Gitleaks 8.30.1 full `main..candidate` interval scan and exact-head PR Gitleaks check passed on the new HEAD; the historical baseline findings are unchanged and outside the replacement diff.
- Trivy, CodeQL, Dependency Review, Pipeline Integrity, Socket, and exact-head release security/integrity jobs: PASS.
- Codecov `codecov/patch`: SUCCESS; the provider comment reports every modified, coverable line covered. The owner-approved Gate 2 decision remains `OPTION_B_APPROVED`. No coverage threshold, exclusion, workflow, or semantics was changed.
- Sonar quality gate and duplicate-block checks: PASS; zero security hotspots. Sonar reported 122 new issues on the integrated implementation diff; this is disclosed for the owner audit and was not altered merely to reduce the count.
- No PR #350 commit is in the replacement ancestry. npm authentication used the owner's web login; no token or cookie contents were disclosed in chat, source, evidence, Issue, or PR. No npm publish or registry mutation was attempted.

## npm preflight and stop

Review [#5373800160](https://github.com/KayzenRoot/gef-bootstrap/pull/352#pullrequestreview-5373800160) authorized this bounded npm identity preflight and the repository metadata correction. `npm login --auth-type=web --registry=https://registry.npmjs.org/` completed with the owner authorizing in the browser. `npm whoami` returned `kayzenroot`; authenticated GitHub CLI identity returned `KayzenRoot`, matching case-insensitively. `npm team ls @gef-bootstrap:developers` lists `kayzenroot` as the sole team member, confirming membership in the scope's developers team. `npm access list packages @gef-bootstrap` exited successfully and returned no package rows. `npm view @gef-bootstrap/cli@1.1.0 version` returned E404; the package is not yet published, and this expected result is not treated as an ownership failure.

The exact-head tarball and source manifest confirm `repository.url=https://github.com/KayzenRoot/gef-bootstrap.git`. `private:true`, package name, version, and `UNLICENSED` remain unchanged. The package-level npm Trusted Publisher binding is not configured or verified; per review #5373800160 this candidate is ready for the separate first-publish decision, after which Trusted Publishing can be bound for subsequent releases. No credential contents were exposed. No `private:false`, npm publication, tag, GitHub Release, or merge was performed.

**Current stop:** `GBS_V11_WO_010_NPM_IDENTITY_VERIFIED_READY_FOR_FIRST_PUBLISH_DECISION`. PR #352 remains OPEN/DRAFT. The first-publication decision and exact-head owner audit remain pending; no merge to `main`, tag, GitHub Release, npm publish, or `private:false` change is authorized.
