# Pipeline Integrity Baseline

Work Order: `GBS-MAINT-SEC-002`.

## Immutable references
The repository uses exact Git commit SHAs for external GitHub Actions. The new `Pipeline integrity` job runs on every PR and main push, rejecting mutable tags/branches and unpinned Docker Action images. Local actions referenced through `./` remain permitted. It is intentionally always-on so the check can be required by the main ruleset without deadlocking ordinary product PRs.

Verified migration pins:
- `actions/checkout` v4.4.0 -> `11d5960a326750d5838078e36cf38b85af677262`; existing v7 workflows remain on v7.0.1 -> `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- `actions/setup-node` v4.4.0 -> `49933ea5288caeca8642d1e84afbd3f7d6820020`; existing v7 workflows remain on v7.0.0 -> `820762786026740c76f36085b0efc47a31fe5020`.
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

## Compatibility correction
The first staged candidate would have upgraded every historical v4 Action to v7 while pinning. Before merge, this was corrected: immutable pinning now preserves the major line each workflow already used. This keeps SEC-002 a supply-chain hardening change rather than a hidden runtime upgrade.

## Required-check liveness
A required status check must be emitted for every PR subject to the ruleset. Therefore `Pipeline integrity` has no path filter. Security scanners also run for every PR to `main`; CodeQL and Codecov remain conditional/advisory and must not be made globally required while their path filters remain.

## Semantic YAML enforcement
The integrity gate parses workflow and local-action YAML semantically with Ruby Psych rather than relying on line-oriented regexes. This covers block mappings, flow-style mappings, quoted scalars, comments and multiline formatting. Every recursive `uses` value is validated. `permissions: write-all` and `pull_request_target` are rejected from parsed mappings.

Local actions are allowed only under `.github/actions/<name>/` and must resolve to a directory containing `action.yml` or `action.yaml`. Their metadata is included in the semantic scan, closing the transitive mutable-action gap. YAML parse failures and workflow/action metadata larger than 512 KiB fail closed.

This correction supersedes the earlier regex-only scanner described by the first SEC-002 candidate.

## Greptile correction CR-02: hidden paths and semantic key locations

The semantic scanner now uses `File::FNM_DOTMATCH` for workflows and local-action metadata, including hidden directories. A local Action reference must target a **direct, non-hidden, non-symlinked** directory `.github/actions/<name>/` containing `action.yml` or `action.yaml`; nested aliases are rejected. A semantic `uses` reference is evaluated only at workflow job/step and composite-action `runs.steps[]` locations, not when a benign Action input happens to be named `with.uses`. Equivalent context restrictions apply to `permissions: write-all` and `pull_request_target`. All changes require an exact-head passing `Pipeline integrity` and baseline CI run; no Codex review is requested. Local reusable workflows remain outside this bounded local-action path allowance until separately governed.

## Greptile correction CR-03: complete workflow trigger parsing and policy fixtures

A root workflow `on` declaration may be a scalar, YAML list or map, and Ruby Psych can deserialize an unquoted `on` key as the boolean `true`. This integrity gate now rejects `pull_request_target` in **all three supported forms**, while continuing to reject unpinned external Actions, unpinned Docker images and `permissions: write-all` at their semantic locations. Nine inline policy fixtures run at every integrity check, including negative cases for quoted/commented permissions and flow-style mutable Actions and a positive case for an ordinary Action input named `uses`. A fixture passing demonstrates parser-policy behavior, not comprehensive GitHub Actions runtime validation. The actual repository scan runs after the fixtures and must succeed on the exact candidate head; the previous head's green checks cannot be reused as final approval.
