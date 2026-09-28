# GBS-MAINT-PLATFORM-002 — Scorecard Workflow Permissions

Status: ADMITTED_FOR_IMPLEMENTATION under the user-supplied GEF Bootstrap master execution order; candidate PR is not merged.
Risk: ELEVATED (GitHub Actions token permissions; no product-runtime change).
Repository: KayzenRoot/gef-bootstrap.
Base: `main` at `9c9170f98ee6385e11b2dbf8e1f7584222230cd8`.
Execution branch: `gbs/maint/platform-002-scorecard-permissions`.
Target: `main`.

## AUTHORITY AND BOUNDARY

This narrow maintenance Work Order is admitted by the user-supplied master execution order, which requires Scorecard findings to be inspected and relevant in-scope findings to be corrected. It is subordinate to `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, `.engineering/GBS-V1-MAINTENANCE-BOUNDARY.md`, the active Context Lock, and the existing repository governance.

The work changes GitHub workflow token permissions only. It does not change product source, behavior, requirements, tests, release content, branch protection, review policy, app installation scope, or historical V1 checkpoints. Do not alter `D:\Projects\gef\` or other repositories.

## OBSERVED FINDINGS

OpenSSF Scorecard run `36481787729` analyzed the exact main SHA `9c9170f98ee6385e11b2dbf8e1f7584222230cd8`, completed successfully, and uploaded its SARIF to this repository's code-scanning view without publishing to the public Scorecard API.

Relevant Token-Permissions findings:

- Alert #10: `.github/workflows/security-codeql.yml` declares `security-events: write` at workflow scope.
- Alerts #5–#9: `.github/workflows/m08-platform.yml`, `m09-platform.yml`, `m41-m47-integrated.yml`, `m48-m54-integrated.yml`, and `m62-m63-final.yml` have no explicit workflow-level token permissions.

All five assurance workflows are active pull-request test workflows using checkout, setup-node, and tests. The repository's current `default_workflow_permissions` is `read`; this Work Order makes the least privilege explicit in each workflow so it does not depend on a repository setting remaining unchanged.

## OBJECTIVE

1. Set workflow-level `permissions: contents: read` on the five active pull-request test workflows named above.
2. Keep `security-codeql.yml` workflow-level permissions read-only, and scope `actions: read`, `contents: read`, and `security-events: write` to the `analyze` job, which performs the SARIF upload.
3. Preserve every existing trigger, job name, runner, matrix, Action SHA, test command, CodeQL category, and concurrency rule.
4. Re-run exact-head validation and Scorecard after merge to confirm the Token-Permissions findings are resolved.

## OUT OF SCOPE

- Changing CODEOWNERS approval, required reviewer count, stale-review dismissal, strict/up-to-date branch requirements, bypass actors, or any ruleset configuration.
- Treating Scorecard's age, Code-Review, Fuzzing, SAST-history, CI-Tests, CII-Best-Practices, or Branch-Protection scores as vulnerabilities or modifying project architecture to inflate a score.
- Product code, dependencies, tests, releases, V1 checkpoint history, or behavior changes.
- Paid features, new app permissions, public Scorecard API publication, or changes to other repositories.

## ACCEPTANCE

- Each of the six affected workflows parses and passes Pipeline Integrity.
- Five test workflows grant only `contents: read` at workflow scope.
- CodeQL retains the documented minimum `actions: read`, `contents: read`, and `security-events: write` on its analysis job; the write permission is absent at workflow scope.
- Existing Repository Validation, Pipeline Integrity, Gitleaks, Trivy, CodeQL, and relevant regression jobs pass for the exact PR head.
- No product source changes and no ruleset mutation are present.
- A new manual Scorecard run on the post-merge main SHA confirms the Token-Permissions findings are no longer open for the affected workflows. Other Scorecard findings remain classified with their rationale in the Evidence Bundle.

## VALIDATION AND STOP CONDITION

Run local YAML/repository validation and inspect the exact diff before commit. Bind every GitHub result to the exact candidate SHA. Do not reuse evidence after a head change. If any proposed permission change breaks an existing supported CodeQL or CI operation, stop and report the specific operation rather than broadening permissions without evidence.

Merge only after an owner audit of exact-head diff and checks, using the repository's standard PR path and no administrative bypass. Record the post-merge SHA, exact Scorecard result, and remaining findings in the Evidence Bundle.
