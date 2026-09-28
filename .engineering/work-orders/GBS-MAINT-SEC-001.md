# GBS-MAINT-SEC-001 — Zero-cost security pilot

Status: ADMITTED_FOR_PILOT; not approved or merged.
Risk: ELEVATED (security CI and third-party Actions; no product runtime, contract or release change).
Owner: GEF Bootstrap maintenance.
Base: `main` at `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`.
Branch: `gbs/maint/sec-001-free-security-pilot`.
Target PR: `main`; never target or alter `release/1.1`.

## OBJECTIVE
Add independently observable, zero-subscription-cost secret and filesystem vulnerability/misconfiguration scanning to the existing public-repository GitHub Actions baseline, without overwriting existing CodeQL, Dependabot, repository validation or V1 acceptance evidence.

## CONTEXT / SOURCE CHECK
The promoted `.engineering/CHECKPOINT.md` and `CHECKPOINT.json` record V1 production acceptance, 1088/1088, active Work Order NONE. V1.1 development proceeds on `release/1.1`; its PRs are independent. `.engineering/GBS-V1-MAINTENANCE-BOUNDARY.md` permits operational/security hardening with a new Work Order, exact-head proof and audit. Apply domain-specific authority from `.engineering/SOURCE-HIERARCHY.md`. The Context Lock for this change is `.engineering/context-locks/GBS-MAINT-SEC-001.md`.

## SCOPE (NECESSARY)
1. Add `.github/workflows/free-security-pilot.yml` with Trivy filesystem vulnerability/misconfiguration scanning and Gitleaks Git-history/PR secret scanning, independent visible jobs and minimum GitHub token permissions.
2. Pin every new external GitHub Action to a verified, immutable commit SHA.
3. Run on PRs targeting `main`, pushes to `main`, weekly schedule and manual dispatch; preserve existing CI.
4. Add `docs/SECURITY-TOOLING-PILOT.md` documenting audit status, zero-cost boundaries, external integration status and safe operator triage without secrets.

## OUT OF SCOPE
Product code, existing release scopes, frozen checkpoint/DoD/release receipts, automatic merge, modifying protected-branch settings, live deployment, adding runtime SDKs, creating external service accounts or silently activating duplicate dependency bots. No changes to V1.1 development branches. CodeRabbit/SonarQube/Codecov/Sentry dashboards are not verifiable with this GitHub code-only change.

## FILES / SOURCES TO READ
`AGENTS.md`; `.engineering/SOURCE-HIERARCHY.md`; `.engineering/CHECKPOINT.md`; `.engineering/CHECKPOINT.json`; `.engineering/DECISIONS-LEDGER.md`; `.engineering/SCOPE.md`; `.engineering/ARCHITECTURE.md`; `.engineering/SECURITY.md`; `.engineering/TEST-BENCHMARK-PLAN.md`; `.engineering/DEFINITION-OF-DONE.md`; `.engineering/GBS-V1-MAINTENANCE-BOUNDARY.md`; existing `.github/workflows/security-codeql.yml`, `repository-validation.yml` and `.github/dependabot.yml`.

## REQUIREMENTS / ARCHITECTURE / CONSTRAINTS
- Retain all existing safety/quality workflows and the V1 production baseline.
- Use read-only GitHub token permissions; no plaintext secrets, no report artifacts containing potential secret matches, no destructive Git/history operation.
- Keep third-party scanning advisory to the release history until PR runs are objectively reviewed; any verified HIGH/CRITICAL finding blocks this PR's approval until remediation or an explicitly governed disposition permitted by Security.
- Do not report external app installation as validated based on the owner's browser login alone.
- Avoid Renovate/Dependabot duplicate PRs; retain existing Dependabot until a separate authorized cutover.
- Pin new Actions to verified SHA and annotate their upstream release/tag.

## ACCEPTANCE CRITERIA
- A separate PR exists from this branch with only the bounded files.
- Static inspection proves correct triggers, read-only permissions, independent jobs, pinned Actions and no secret values.
- An actual GitHub Actions run executes both scanners on the PR candidate, and job results/logs are inspected against its exact SHA.
- Existing applicable `Repository Validation` and `Security CodeQL` remain available; no unrelated required checks are knowingly broken.
- All new HIGH/CRITICAL findings are triaged under the frozen security policy, not silently ignored.
- Tool operator guide distinguishes VERIFIED from OWNER-REPORTED/UNVERIFIED integrations and documents check-name promotion only after successful runs.
- Post-review checkpoint delta is proposed but not promoted until independent APPROVED; no auto-merge.

## TESTS / EVIDENCE
T0: YAML syntax, action/tag SHA resolution and static permission/path check.
T1/T2: verify workflow changes cannot alter product code; run existing applicable tests/checks unchanged.
T3/T4: capture PR workflow runs, commit SHA, scanner job results, logs and existing check summary; expand security assurance on findings.
Evidence Bundle: base/head SHA, changed files, tool versions/pins, run URLs/results, known gaps, security triage and proposed Checkpoint Delta.

## DELIVERABLES / REVIEW FORMAT
Work Order, Context Lock, two-scanner workflow, operator guide, GitHub PR and a reviewer verdict in PT-BR: APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Do not merge or promote the checkpoint until exact-head CI plus security review supports APPROVED. If a HIGH/CRITICAL finding appears, resolve it or record BLOCKED under current policy before advancing.
## CORRECTION DELTA CR-01 (2026-09-28)
Codex's initial-head review established two high-priority configuration faults: cancel-in-progress could discard a push-range secret scan when successive pushes occur, and default PR checkout did not bind both scanners to the exact PR head SHA. Within this same Work Order and PR, correct concurrency to cancel only superseded PR runs; make push/manual/schedule groups unique; check out `github.event.pull_request.head.sha || github.sha` in both jobs. Because the pinned Gitleaks Action reads only the first 30 PR commits, fail closed for larger PRs. Disable public action summaries containing direct links to suspected secret locations. Retain previous checks as historical evidence only; replace with passing exact-head evidence and fresh external review before APPROVED.
