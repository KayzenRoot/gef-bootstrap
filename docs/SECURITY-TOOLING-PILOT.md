# Free security-tooling pilot: GBS-MAINT-SEC-001

Status: PROPOSED on pilot PR. This document is an operator runbook, not proof that external services are installed or working.

## Audited repository baseline

- Repository: `KayzenRoot/gef-bootstrap`, public, personal account.
- V1 `main` is production-accepted; V1.1 work is separate under `release/1.1`. This pilot never promotes either release.
- Existing: `.github/workflows/security-codeql.yml` (CodeQL), `.github/workflows/repository-validation.yml` (typecheck, tests and npm audit), and `.github/dependabot.yml` (weekly npm and GitHub Actions updates). These are preserved unchanged.
- At inspection, V1.1 PR #302 had successful CodeQL and existing CI checks on its candidate, but its check-runs did not establish CodeRabbit, SonarQube or Codecov operation for this pilot. Owner reports that external service accounts have been created, installed and logged into Chrome. **OWNER-REPORTED, NOT VERIFIED** until independent PR checks/dashboards prove operation.

## New zero-subscription-cost jobs

| Check | Source | Role | Gate behavior |
| --- | --- | --- | --- |
| `Free Security Pilot / Trivy filesystem and configuration` | `aquasecurity/trivy-action` v0.36.0, pinned | Read-only filesystem vulnerability/misconfiguration scan, HIGH/CRITICAL | Exit nonzero on reported findings |
| `Free Security Pilot / Gitleaks secrets` | `gitleaks/gitleaks-action` v3.0.0, pinned | Secret scan on PRs, main and manual/scheduled runs | Exit nonzero on findings; comments and automatic SARIF/artifact publication disabled |

Both checks run on PRs targeting `main`, pushes to `main`, Mondays 05:19 UTC and manual workflow dispatch. New workflow token permissions are read-only. Trivy's upstream vulnerability database requires internet access at scan time and may be temporarily unavailable or rate-limited; an unavailable scan is not a PASS.

Gitleaks' upstream Action is free without a license key for a repository owned by an individual user; an organization-owned clone requires checking its organization license terms. Neither job uses a user-supplied PAT or paid SaaS account. These scanners supplement rather than replace CodeQL, tests and the native dependency audit.

## External app integration: observe first, do not assume

1. **CodeRabbit:** On the pilot PR, check the PR Conversation/Files Changed for an actual automated CodeRabbit review or the CodeRabbit dashboard. The owner must confirm the GitHub App covers this repository and that its public-repository free plan is active. Absent a result, label `NOT_VERIFIED`; do not invent a review or require a nonexistent check.
2. **SonarQube Cloud:** From the owner-authorized dashboard at https://sonarcloud.io/ verify this exact project is imported on the free plan. Bind the same pilot PR and confirm a real analysis and Quality Gate result before considering a merge rule.
3. **Codecov:** The existing root Node test script does not establish an LCOV/XML coverage upload. Set up Codecov only after a separate bounded, tested change adds coverage generation and official upload; verify plan limits and private-repository restrictions. Do not add a required Codecov check prematurely.
4. **Renovate:** Existing Dependabot already manages npm and Actions. Do not run both dependency updaters indiscriminately. Keep Dependabot active for this pilot; if Renovate has access, leave its onboarding PR unmerged and disable this repo in its app scope until a separate cutover replaces/retains equivalent schedules and grouping.
5. **Sentry:** GEF Bootstrap is a repository/toolchain product, not a long-running public web service. A Sentry runtime SDK is `NOT_APPLICABLE` to this bounded maintenance PR. Decide whether a genuine production runtime needs Sentry in that product's own Work Order.
6. **Semgrep/Snyk:** Optional additional free-tier assessments subject to plan/project limits, duplication checks and explicit repo-specific need. Do not force all services into blocking checks without measured value.

## First PR validation procedure

1. Open the pilot PR and verify changed files are limited to the Work Order, Context Lock, this document and `.github/workflows/free-security-pilot.yml`.
2. Open GitHub Actions and filter by the pilot PR head SHA. Verify both Gitleaks and Trivy completed with observable results. Check CodeQL/repository validation independently.
3. If the workflow fails for rate limits, licensing, permission or infrastructure, record the exact error and use a bounded correction on the same PR. Never call a failed/unavailable scan clean.
4. If Trivy reports HIGH/CRITICAL vulnerabilities, validate reachability and exploitability under the frozen Security policy. If Gitleaks identifies a possible real credential, do **not** paste the value into an issue, PR or chat; rotate/revoke the actual credential using the appropriate provider and assess historical exposure without rewriting history unless separately approved.
5. If a check passes, collect its exact head SHA, run URL, job outcome and relevant version information. A clean scanner result is not proof of absence of vulnerabilities or secret exposure.
6. Independent reviewer issues APPROVED / CORRECTION REQUIRED / BLOCKED. Only after approved exact-head evidence may a separate authorized merge and checkpoint delta promotion proceed. No automatic merge from this pilot.

## Promotion to reusable template (future, separate increment)

After pilot audit, consider copying the verified workflow to other **public** repositories, adapting package types, manifests, risk, CI costs and existing scans. Do not replicate mechanically to private repositories where Actions minutes, app plans and GHAS features differ. Preserve existing project-specific canonical sources and active Work Orders. Update protections only after the exact check names exist and execute successfully.

## Cost / permission boundary

- Public standard GitHub-hosted runners and native public CodeQL are available without a separate subscription, subject to GitHub policies and quotas.
- Third-party Gitleaks and Trivy Actions are currently used without paid subscriptions. Their scanning scope and limits remain subject to upstream changes.
- No checkout credential persistence, no privileged repository write token, no user secrets, no auto-merge, no existing workflow deletion and no paid service activation.
- Owner's Chrome sessions cannot be assumed accessible from the GitHub connector. Verify external app configuration in authorized dashboards, never infer it from login reports.

## Checkpoint Delta proposed, NOT PROMOTED

When this Work Order is independently approved and merged, append a scoped maintenance record containing Work Order ID, base/head/merge SHAs, verified jobs and logs, security finding dispositions, any accepted non-blocking integration gaps, and the next authorized scope. Retain frozen V1 `1088/1088` historical acceptance and the separate V1.1 development record without reinterpretation.
