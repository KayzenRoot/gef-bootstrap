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
| `Free Security Pilot / Gitleaks secrets` | official Gitleaks CLI v8.30.1 with verified SHA-256 release digest | Scan all reachable commits in the exact PR/push range, including merged side branches; full history weekly/manually | Exit nonzero on findings or invalid commit range; redacted output; no exported report, artifact or PR comment |

Both checks run on PRs targeting `main`, pushes to `main`, Mondays 05:19 UTC and manual workflow dispatch. New workflow token permissions are read-only. **PR checkout is pinned to `github.event.pull_request.head.sha`** for both scanners; non-PR runs use `github.sha`. Only superseded PR runs may be cancelled: main pushes, manual dispatches and scheduled runs each receive a distinct concurrency group, so rapid pushes cannot cancel earlier push-range secret scans. Trivy's upstream vulnerability database requires internet access at scan time and may be temporarily unavailable or rate-limited; an unavailable scan is not a PASS.

The Gitleaks CLI is installed from the official GitHub v8.30.1 Linux x64 release, after verifying the exact SHA-256 digest published in its release metadata: `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`. This open-source CLI does not use the commercial Action license or the Action's 30-commit API limit. For PRs, both endpoints are verified and the merge base is determined explicitly, then the entire `merge_base..PR_HEAD_SHA` DAG is scanned. For pushes, the entire `before..after` range is scanned; the all-zero initial `before` falls back to full-history scanning. Weekly/manual runs scan all fetched refs. Merge patches use `--diff-merges=separate`, with neither `--first-parent` nor `--no-merges`, ensuring merged side branches are traversed. Any invalid range or missing required commit fails closed. The CLI redacts findings; no report, upload, job summary or PR comments are published by the workflow. Neither job requires a personal access token or a paid SaaS account. These scanners supplement rather than replace CodeQL, tests and the native dependency audit.

## External app integration: observe first, do not assume

1. **CodeRabbit:** PR #303 proves this GitHub App is active, and its initial-head review found no actionable comments. Its review of the first correction identified a missing full-merge-history scan; the CLI replacement addresses the finding, but the final corrected head needs a fresh verdict before completion. The owner must verify no-charge public-project billing in the external dashboard; an active review alone does not prove free billing.
2. **SonarQube Cloud:** From the owner-authorized dashboard at https://sonarcloud.io/ verify this exact project is imported on the free plan. Bind the same pilot PR and confirm a real analysis and Quality Gate result before considering a merge rule.
3. **Codecov:** The existing root Node test script does not establish an LCOV/XML coverage upload. Set up Codecov only after a separate bounded, tested change adds coverage generation and official upload; verify plan limits and private-repository restrictions. Do not add a required Codecov check prematurely.
4. **Renovate:** Existing Dependabot already manages npm and Actions. Do not run both dependency updaters indiscriminately. Keep Dependabot active for this pilot; if Renovate has access, leave its onboarding PR unmerged and disable this repo in its app scope until a separate cutover replaces/retains equivalent schedules and grouping.
5. **Sentry:** GEF Bootstrap is a repository/toolchain product, not a long-running public web service. A Sentry runtime SDK is `NOT_APPLICABLE` to this bounded maintenance PR. Decide whether a genuine production runtime needs Sentry in that product's own Work Order.
6. **Semgrep/Snyk:** Optional additional free-tier assessments subject to plan/project limits, duplication checks and explicit repo-specific need. Do not force all services into blocking checks without measured value.

## Correction Delta CR-01: exact PR head and non-cancelling push coverage

Independent Codex review of initial head `d5c68672c70e6e04900e89370a505b962f20d888` identified two high-priority workflow faults: default checkout would scan the synthetic PR merge tree instead of the evidenced head; and cancellation by `refs/heads/main` would interrupt a previous push-range secret scan. Corrective implementation pins both checkouts to the PR head, makes push/schedule/manual concurrency groups unique while allowing only superseded PR runs to cancel, fails closed for Gitleaks' 30-commit PR API pagination limit, and disables the action's job summary, which otherwise links to exposed secret locations. Initial-head PASS results remain historical only; re-run all required checks on the corrected exact head before approval. This is a correction within the same Work Order and PR, not a new phase.

## Correction Delta CR-02: scan PRs retargeted to `main`

The second Codex review of corrected head `f5518d17e07eaf28a4d2469fc8cd4b67eabc52bd` identified that the default `pull_request` activity set omits `edited`. Retargeting an existing PR from another branch to `main` therefore could bypass both scanner jobs until the PR's next push. The workflow now explicitly accepts `opened`, `synchronize`, `reopened`, `edited` and `ready_for_review`, combined with `branches: [main]`. This ensures retargeting to the protected base triggers scanning; other edits to existing main-targeting PRs can also rerun the scanners. The fix uses the same Work Order and requires fresh exact-head CI/review evidence. This is a trigger-contract correction, not a claim that a real retarget event was exercised in this pilot.

## Correction Delta CR-03: complete DAG secret scanning

CodeRabbit's first-correction review proved that the pinned Gitleaks Action's `--no-merges --first-parent` flags omit reachable side-branch commits introduced by merge commits, even with full-history checkout. The Action has been replaced by the **official Gitleaks CLI v8.30.1**, installed only after validating its GitHub release SHA-256. The new scanner computes a checked exact-head PR merge-base range, a main push `before..after` range, or a full-history scheduled/manual range. `--diff-merges=separate` includes merge diffs and side branches; no first-parent or no-merges exclusion is used. The old 30-commit Action pagination guard, Action-only licensing and Action-generated reports/summaries no longer apply. CR-01's former Gitleaks Action-specific measures remain historical context only. This corrected scanner must pass actual GitHub Actions tests on the final head and undergo new exact-head external review before approval.

## Correction Delta CR-04: protect scanner policy from PR overrides

The last corrected-head CodeRabbit review established a real policy-bypass risk: when a PR introduces or changes `.gitleaks.toml`, the Gitleaks CLI automatically loads that untrusted file and may silently suppress findings. The pilot now obtains the official default Gitleaks v8.30.1 policy from upstream's **immutable source commit** `83d9cd684c87d95d656c1458ef04895a7f1cbd8e`, validates SHA-256 `e163e53b9e7e8a8511e77271e2b323ed057759542a6d988258afe3a1fa329caf`, and stores it under `RUNNER_TEMP` outside the PR checkout. An empty, protected `.gitleaksignore` is also created outside the checkout. The scan specifies both paths explicitly using `--config` and `--gitleaks-ignore-path`, and enables `--ignore-gitleaks-allow` so inline PR annotations cannot disable detection. The output remains redacted and is not uploaded. This is separate from Trivy suppression-file assessment, for which equivalent exact-version behavior must be established before making a similar claim.

The CR-04 candidate requires fresh exact-head CI logs confirming both policy checksum and binary checksum, actual scanner results, and review of new external findings. Scans of an untrusted candidate cannot substitute for protecting the trusted workflow definition itself: branch protections and code ownership for security workflows remain a separate follow-up if desired.

## Correction Delta CR-05: prevent untrusted Trivy suppressions

The pinned Trivy Action accepts explicit `trivy-config` and `trivyignores` inputs, which it passes to the scanner as `TRIVY_CONFIG` and `TRIVY_IGNOREFILE`. The pilot now creates an empty trusted YAML configuration and empty ignore file under `RUNNER_TEMP` outside the PR checkout before launching Trivy. It fails closed if an untrusted candidate pre-creates `trivyignores`, the temporary combined ignore-file output path used by the pinned Action. This prevents a candidate's `.trivyignore` or `trivy.yaml` from silently weakening this pilot's intended scan policy. Exact-version behavior was verified against the pinned Trivy Action's `action.yaml` and `entrypoint.sh`, and actual execution on the corrected head must pass before approval. These protections do not prevent an attacker with permission to edit the CI workflow itself; enforce CODEOWNERS and branch rules separately.

## First PR validation procedure

1. Open the pilot PR and verify changed files are limited to the Work Order, Context Lock, this document and `.github/workflows/free-security-pilot.yml`.
2. Open GitHub Actions and filter by the pilot PR head SHA. Verify both Gitleaks and Trivy completed with observable results. Check CodeQL/repository validation independently.
3. If the workflow fails for rate limits, licensing, permission or infrastructure, record the exact error and use a bounded correction on the same PR. Never call a failed/unavailable scan clean.
4. If Trivy reports HIGH/CRITICAL vulnerabilities, validate reachability and exploitability under the frozen Security policy. If Gitleaks identifies a possible real credential, do **not** paste the value into an issue, PR or chat; rotate/revoke the actual credential using the appropriate provider and assess historical exposure without rewriting history unless separately approved.
5. If a check passes, collect its exact head SHA (not the synthetic PR merge SHA), run URL, job outcome, Gitleaks CLI version/checksum and the actual scanned Git range. Verify the new full-DAG implementation rather than inferring coverage from the old Gitleaks Action's green results. A clean scanner result is not proof of absence of vulnerabilities or secret exposure.
6. Independent reviewer issues APPROVED / CORRECTION REQUIRED / BLOCKED. Only after approved exact-head evidence may a separate authorized merge and checkpoint delta promotion proceed. No automatic merge from this pilot.

## Promotion to reusable template (future, separate increment)

After pilot audit, consider copying the verified workflow to other **public** repositories, adapting package types, manifests, risk, CI costs and existing scans. Do not replicate mechanically to private repositories where Actions minutes, app plans and GHAS features differ. Preserve existing project-specific canonical sources and active Work Orders. Update protections only after the exact check names exist and execute successfully.

## Cost / permission boundary

- Public standard GitHub-hosted runners and native public CodeQL are available without a separate subscription, subject to GitHub policies and quotas.
- The open-source Gitleaks CLI uses an official SHA-256-verified release binary, while Trivy uses a commit-SHA-pinned third-party Action. Neither requires a paid subscription for this public-repository pilot; upstream releases and vulnerability-database availability can change.
- No checkout credential persistence, no privileged repository write token, no user secrets, no auto-merge, no existing workflow deletion and no paid service activation.
- Owner's Chrome sessions cannot be assumed accessible from the GitHub connector. Verify external app configuration in authorized dashboards, never infer it from login reports.

## Checkpoint Delta proposed, NOT PROMOTED

When this Work Order is independently approved and merged, append a scoped maintenance record containing Work Order ID, base/head/merge SHAs, verified jobs and logs, security finding dispositions, any accepted non-blocking integration gaps, and the next authorized scope. Retain frozen V1 `1088/1088` historical acceptance and the separate V1.1 development record without reinterpretation.
