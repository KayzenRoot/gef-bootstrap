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
- No PR #350 commit is in the replacement ancestry. npm authentication used the owner's web login; no long-lived npm token was used or copied into repository files, Issue, or PR evidence. No npm publish or registry mutation was attempted.

## npm preflight and stop

Review [#5373800160](https://github.com/KayzenRoot/gef-bootstrap/pull/352#pullrequestreview-5373800160) authorized this bounded npm identity preflight and the repository metadata correction. `npm login --auth-type=web --registry=https://registry.npmjs.org/` completed with the owner authorizing in the browser. `npm whoami` returned `kayzenroot`; authenticated GitHub CLI identity returned `KayzenRoot`, matching case-insensitively. `npm team ls @gef-bootstrap:developers` lists `kayzenroot` as the sole team member, confirming membership in the scope's developers team. `npm access list packages @gef-bootstrap` exited successfully and returned no package rows. `npm view @gef-bootstrap/cli@1.1.0 version` returned E404; the package is not yet published, and this expected result is not treated as an ownership failure.

The exact-head tarball and source manifest confirm `repository.url=https://github.com/KayzenRoot/gef-bootstrap.git`. `private:true`, package name, version, and `UNLICENSED` remain unchanged. The package-level npm Trusted Publisher binding is not configured or verified; per review #5373800160 this candidate is ready for the separate first-publish decision, after which Trusted Publishing can be bound for subsequent releases. No long-lived npm token was used, and no credential values were copied into repository files or GitHub evidence. No `private:false`, npm publication, tag, GitHub Release, or merge was performed.

**Previous checkpoint stop (superseded by the owner finalization authorization below):** `GBS_V11_WO_010_NPM_IDENTITY_VERIFIED_READY_FOR_FIRST_PUBLISH_DECISION`. At that checkpoint PR #352 was OPEN/DRAFT and the first-publication decision remained pending.

## Owner finalization authorization

At authorization candidate HEAD `526b82869bde5c40e6cba03de91ad92e25d604d1`, the owner supplied the final WO-010 execution decision. Statuses recorded for this stage:

- `OWNER_FINALIZATION_AUTHORIZED`
- `NPM_IDENTITY_VERIFIED`
- `FIRST_PUBLISH_BOOTSTRAP_AUTHORIZED`

The owner-authorized sequence permits the reviewed `private:false` and public `publishConfig.access` package metadata, the tag-only existing-version/SHA-1 guard, and production acceptance only after new-HEAD required checks and the exact-main/tarball gates. This authorization supersedes the earlier first-publish-decision stop above; it does not claim merge, publication, Trusted Publisher setup, tag, or GitHub Release has occurred. The npm CLI identity check returned `kayzenroot`; `npm team ls @gef-bootstrap:developers` listed `kayzenroot`. No credential value was recorded, and no publication had occurred at this authorization checkpoint.

## Correction Delta #19 — immutable-tag release recovery PR

Issue #351 authorizes this bounded recovery after the original tag workflow failed on Node 22.14.0: `tests/v11-codecov-patch-coverage.test.mjs` imports `node:module.registerHooks`, which is unavailable in that runner. The [failed tag workflow](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36842127723) recorded 1,602 passed, 1 failed, and 4 skipped tests. This is a runner-version recovery; no product runtime or package content was changed.

- Current `main` and immutable tag `v1.1.0` both resolve to `fb2a2e6d41086e82ba03f307dc6ada18a52458ea`. The tag was not moved or recreated.
- Draft recovery PR [#354](https://github.com/KayzenRoot/gef-bootstrap/pull/354) uses branch `codex/gbs-v11-wo010-release-recovery-delta19`, based on that exact `main` SHA. Recovery implementation commit: `b58a541ffcfd325266a841dbea375d0896801b58`; focused guard correction commit: `727c0ab68fb95bb95d2de69cd4f3b79b96e6e6e8` (implementation head when its checks completed).
- The workflow uses Node 22.17.0 for each V1.1 release runtime. Its manual `RECOVERY` mode runs only from `main`, checks out `v1.1.0`, fails closed unless both the checked-out source and tag resolve to the exact commit above, rebuilds and compares the published package, and smokes the registry package. It carries only `contents: read`; no recovery dispatch or publication step was run.
- The existing WO-010 workflow guard passes 6/6 locally, and `git diff --check` passes. The guard requires all workflow `node-version` declarations to be `22.17.0`, preserves tag-push-only publication and the single publish-job OIDC permission, and asserts that recovery has no publish, tag-write, token, or OIDC path.

### Read-only npm registry observation

On 2026-10-01, public registry queries confirmed `@gef-bootstrap/cli@1.1.0`, `dist.shasum=2b9b5cf7fd8610d04238ba7b27aa6d791d796237`, and npm-normalized `repository.url=git+https://github.com/KayzenRoot/gef-bootstrap.git`. The response included registry signatures; it did not advertise `dist.attestations`, so no provenance claim is made. These were read-only lookups. No npm credential was used or recorded.

### Exact implementation-head checks

On implementation head `727c0ab68fb95bb95d2de69cd4f3b79b96e6e6e8`, all four GitHub-required checks passed: Gitleaks, Trivy, Pipeline Integrity, and Repository Validation. Codecov patch coverage passed at 100.00% against the 95.10% target. Automatic repository validation and `validate` passed. Exact-head release assurance and the same SHA-bound package smoke passed on Ubuntu, macOS, and Windows; CodeQL, Dependency Review, Socket, TypeScript analysis, and the cumulative Sonar diagnostics/duplicate-block checks passed. Evidence: [release assurance and same-artifact run](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36845761770), [security and Gitleaks run](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36845761748), [repository validation](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36845762594), [CodeQL](https://github.com/KayzenRoot/gef-bootstrap/runs/110315793148), [Dependency Review](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36845761695), [Pipeline Integrity](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36845761809), and [Codecov](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap/pull/354).

**Additional SonarCloud Quality Gate: FAIL.** The Security Rating on New Code is D (required A); its annotation points to `.github/workflows/v11-publish.yml:299`, where the workflow computes SHA-1 solely to compare npm's required legacy `dist.shasum`. No Sonar rule, threshold, configuration, or suppression was changed. This failure is disclosed for the owner audit; it is not reported as a pass.

The first documentation-sync head `b4830b425c5a0ec0ac7c4631520189f2f8961962` passed Gitleaks, Pipeline Integrity, and Trivy but Repository Validation failed eight historical admission assertions after the root Gate2 `nextLegalAction` and `stopState` were overwritten by the Delta 19 marker. The follow-up restores those canonical Gate2 values and records the release-recovery state under Gate 3/Delta 19; no tests or product files were changed.

The recovery job has not been dispatched. No merge, tag change, npm republish, or GitHub Release occurred. The corrected documentation head is distinct from the previously checked implementation head; the exact-head required checks on the current PR commit govern owner-audit readiness. The additional Sonar finding remains visible for that audit.

**Correction Delta #19 stop condition:** `GBS_V11_WO_010_RELEASE_RECOVERY_PR_READY_FOR_OWNER_AUDIT`.

## Correction Delta #20 — SHA-512 SRI release recovery integrity

Owner review [#5378094691](https://github.com/KayzenRoot/gef-bootstrap/pull/354#pullrequestreview-5378094691) identified the SonarCloud finding in recovery's comparison against npm's legacy `dist.shasum`. The authorized correction is limited to `.github/workflows/v11-publish.yml`, its existing workflow guard, and these governance records. No runtime, dependencies, Sonar configuration, thresholds, Codecov settings, or package publication behavior were changed.

- Workflow correction commit: `123f0d15855ff0942a563f269c89d512e7ac22ac`. Recovery now calculates `sha512-<base64>` with Node `crypto.createHash("sha512")`, queries npm `dist.integrity`, and compares the two strings exactly. A mismatch fails closed with `GBS_V11_WO_010_RELEASE_INCIDENT_PACKAGE_MISMATCH`. Recovery still verifies version `1.1.0` and the npm-normalized repository URL `git+https://github.com/KayzenRoot/gef-bootstrap.git`; its guard rejects SHA-1/`sha1sum`/`dist.shasum` and continues to forbid publish, tag mutation, and OIDC credentials.
- The first automatic CI run exposed a stale test assertion for the former repository comparison spelling. Guard-only correction commit `829615f6bb42dd13ba212d421477414939e8401e` updates that assertion to match the workflow's explicit fail-closed `if` condition. The previous CI failures were the same assertion in repository validation, regression, coverage, and release assurance; all passed on `829615f`.
- Read-only npm registry query on 2026-10-01 returned `dist.integrity=sha512-Cb4ZGrpIq+WsU9fKkAqCobBFSNvIqb8X4xuphFXi2PZFh2TUxWAGcnpzjeGmwcLatNoYvBvGUIrJOfHOCPh4kg==`, version `1.1.0`, and repository URL `git+https://github.com/KayzenRoot/gef-bootstrap.git`. The npm registry integrity is the expected comparison value; the rebuilt immutable-tag tarball has not yet been produced by a recovery dispatch, so no rebuilt-versus-registry match is claimed.
- `main` remains `fb2a2e6d41086e82ba03f307dc6ada18a52458ea`; annotated tag `v1.1.0` still peels to that same commit. Recovery has not been dispatched. No merge, tag movement, npm publish/republish, or GitHub Release occurred.

### Automatic checks on code head `829615f6bb42dd13ba212d421477414939e8401e`

All required and executed PR check contexts passed on that code head. Evidence: [Repository Validation](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36851479159/job/110333902564), [Node coverage LCOV](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36851479011/job/110333902692), [regression and `validate` matrix](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36851479037/job/110333901753), [Gitleaks and Trivy](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36851479391), [Pipeline Integrity](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36851479144/job/110333902462), [SonarCloud Code Analysis](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=354), [CodeQL](https://github.com/KayzenRoot/gef-bootstrap/runs/110334258633), [Dependency Review](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36851479309/job/110333903493), [Codecov patch](https://app.codecov.io/gh/KayzenRoot/gef-bootstrap/pull/354), [release assurance and exact-head package candidate](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36851479162), and [same exact tarball on Ubuntu/macOS/Windows](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36851479162). Socket, TypeScript analysis, cumulative Sonar diagnostics/duplicate checks, and focused/regression matrices also passed. CodeRabbit remains skipped because the PR is draft.

No new manual test campaign was run; this evidence comes from automatic checks. The evidence-sync commit itself must receive its own fresh automatic checks before the current PR head is treated as ready.

**Correction Delta #20 stop condition:** `GBS_V11_WO_010_RELEASE_RECOVERY_SHA512_INTEGRITY_READY_FOR_REAUDIT`.
