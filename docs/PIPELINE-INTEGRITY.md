# Pipeline Integrity Baseline

Work Order: `GBS-MAINT-SEC-002`.

## Immutable references
The repository uses exact Git commit SHAs for external GitHub Actions. The new `Pipeline integrity` job rejects mutable tags/branches and unpinned Docker Action images. Local actions referenced through `./` remain permitted.

Verified migration pins:
- `actions/checkout` v7.0.1 -> `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- `actions/setup-node` v7.0.0 -> `820762786026740c76f36085b0efc47a31fe5020`.
- `github/codeql-action` v4.38.2 line -> `2892aa5e19bbd11bc0cff5427e3b750a04d9e3c2`.

Existing exact pins such as Codecov, Trivy and the security-pilot checkout remain valid unless a separate upgrade is admitted. Dependabot continues to propose GitHub Actions updates; a human/automated governed review must verify any proposed new commit SHA before merge.

## Forbidden pipeline patterns
- `pull_request_target` in repository workflows.
- top-level/job `permissions: write-all`.
- external Actions referenced by mutable tag/branch.
- Docker Actions without an immutable `sha256` digest.

## Ownership and branch rules
`.github/CODEOWNERS` marks CI/governance paths for `@KayzenRoot`. This metadata is **not an enforcement guarantee** until the active main ruleset requires code-owner review.

After this PR passes and merges, the administrative follow-up is to add exact successful check names to the required-status-check rule:
- `Repository validation` (already required)
- `Pipeline integrity`
- `Gitleaks secrets`
- `Trivy filesystem and configuration`

Do not add a required check before observing its exact check name successfully, or merges can be accidentally deadlocked.

## Codex quota
Automatic Codex PR review is intentionally disabled by the owner. Pipeline Integrity, GitHub Actions, Trivy, Gitleaks, CodeQL, Codecov, CodeRabbit and Greptile operate independently of the exhausted Codex code-review quota, subject to each service's own plan/limits.
