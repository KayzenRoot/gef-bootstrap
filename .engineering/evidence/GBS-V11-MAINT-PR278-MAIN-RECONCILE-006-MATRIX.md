# GBS-V11-MAINT-PR278-MAIN-RECONCILE-006 — three-way file-resolution ledger

SHA lineage: common ancestor `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`, first (release) parent `6275860c7cde1fbecccf646b87a04b9e92c8ecd0`, second (protected production history) parent `e23311e77d79b84f3c70671072a22a6f8896d13d`. Complete, nontruncated recursive Git blob inventory: {"equal":902,"releaseOnly":203,"mainOnly":29,"divergent":51}. All 51 divergent paths are individually classified below.

## V1.1 canonical governance, preserve older main via ancestry (11)

- `.engineering/ARCHITECTURE.md`
- `.engineering/BACKLOG.md`
- `.engineering/CHECKPOINT.json`
- `.engineering/CHECKPOINT.md`
- `.engineering/DECISIONS-LEDGER.md`
- `.engineering/DECISIONS-SUPERSESSION-MAP.md`
- `.engineering/DEFINITION-OF-DONE.md`
- `.engineering/DEPLOYMENT.md`
- `.engineering/PROJECT-OVERVIEW.md`
- `.engineering/REQUIREMENTS.md`
- `.engineering/SCOPE.md`

## Release workflow stronger exact-head and provider boundary (31)

- `.github/workflows/area-h-m29-m33.yml`
- `.github/workflows/m01-validation.yml`
- `.github/workflows/m06-platform.yml`
- `.github/workflows/m07-platform.yml`
- `.github/workflows/m10-platform.yml`
- `.github/workflows/m11-platform.yml`
- `.github/workflows/m12-platform.yml`
- `.github/workflows/m13-platform.yml`
- `.github/workflows/m14-platform.yml`
- `.github/workflows/m15-platform.yml`
- `.github/workflows/m16-platform.yml`
- `.github/workflows/m17-platform.yml`
- `.github/workflows/m18-platform.yml`
- `.github/workflows/m19-platform.yml`
- `.github/workflows/m20-platform.yml`
- `.github/workflows/m21-platform.yml`
- `.github/workflows/m22-platform.yml`
- `.github/workflows/m23-platform.yml`
- `.github/workflows/m24-platform.yml`
- `.github/workflows/m25-platform.yml`
- `.github/workflows/m26-platform.yml`
- `.github/workflows/m27-platform.yml`
- `.github/workflows/m28-platform.yml`
- `.github/workflows/m34-m40-integrated.yml`
- `.github/workflows/m55-m61-integrated.yml`
- `.github/workflows/repository-validation.yml`
- `.github/workflows/security-codeql.yml`
- `.github/workflows/dependency-review.yml`
- `.github/workflows/free-security-pilot.yml`
- `.github/workflows/pipeline-integrity.yml`
- `.github/workflows/scorecard.yml`

## Release workflow plus main least-privilege read scope (5)

- `.github/workflows/m08-platform.yml`
- `.github/workflows/m09-platform.yml`
- `.github/workflows/m41-m47-integrated.yml`
- `.github/workflows/m48-m54-integrated.yml`
- `.github/workflows/m62-m63-final.yml`

## Release notes with main history in parent (1)

- `CHANGELOG.md`

## Release generic adapter without old-specific export (1)

- `packages/security-reliability-integrations/src/index.js`

## Release neutral reserved M39/M40 (1)

- `planning/MASTER-MODULE-INDEX.md`

## Release neutral focused verification (1)

- `tests/m34-m40-integrated.test.mjs`

## Main-only items and retained history

Explicit active forward-port of six compatible items: `.gitignore`, `.github/CODEOWNERS`, `.github/workflows/coverage-codecov.yml`, `docs/COVERAGE-PIPELINE.md`, `docs/PIPELINE-INTEGRITY.md`, `docs/SECURITY-TOOLING-PILOT.md`. Five missing global read-only GitHub workflow token permissions are forward-ported onto existing release workflow implementations. All other current-tree paths inherit the release tree. Old audit and optional integration documents stay reachable in immutable main Git ancestry without their old product-specific names/text appearing in the V1.1 live tree. Other discretionary pilot material is deferred.

## Semantic conflict decisions

Main canonical documents still contain retired product-specific integration assumptions, whereas the release has already approved neutral adapter slots. Main also reused an active V1.1 decision number for a different historical decision. Favor V1.1's current frozen scope/checkpoint/ledger without overwriting either historical decision; the true second Git parent retains main facts. Release workflows carry matching SHA-pinned Actions plus exact-head checks, wider V1.1 routing, and safe Gitleaks diagnostics. Main's missing read-only token scopes on exactly five workflows are explicitly restored. The release's Scorecard condition is stricter than main's. The generic adapter runtime and current-tree detachment test must not be replaced by main's old optional-provider exports and tests.

The existing main Codecov pilot is advisory and fork-isolated, with OIDC only for its scoped job. Its forward-ported locked dependency installation disables implicit lifecycle scripts. No Codecov provider success or required gate is asserted.

## Merge gate

Create a genuine two-parent Git commit, not a first-parent-only content copy. Exact-head owner audit (NOT_INDEPENDENT), green required security/release checks, neutral current-tree verification and GitHub PR merge method **merge** are required. Squash/rebase would destroy the intended main ancestry. Even after Git says PR #278 is mergeable, its cumulative Sonar result is an entirely separate production blocker; no WO-010 or tags.
