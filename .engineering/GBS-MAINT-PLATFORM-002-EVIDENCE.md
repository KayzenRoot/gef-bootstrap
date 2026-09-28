# GBS-MAINT-PLATFORM-002 Evidence Bundle

Status: implementation in progress.
Repository: `KayzenRoot/gef-bootstrap`.
Admission base: `main` at `9c9170f98ee6385e11b2dbf8e1f7584222230cd8`.
Work Order: `.engineering/work-orders/GBS-MAINT-PLATFORM-002.md`.
Context Lock: `.engineering/context-locks/GBS-MAINT-PLATFORM-002.md`.

## Baseline

- Owner-authenticated GitHub identity: `KayzenRoot` (`114633702`).
- Main protection ruleset `23566111`: active; PRs required; required contexts are Repository validation, Pipeline integrity, Gitleaks secrets, and Trivy filesystem and configuration; no bypass actor; branch deletion and non-fast-forward blocked.
- Repository Actions default is `read`; Actions cannot approve PRs.
- Scorecard workflow: [run 36481787729](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36481787729), `workflow_dispatch`, exact SHA `9c9170f98ee6385e11b2dbf8e1f7584222230cd8`, conclusion `success`. SARIF upload succeeded to repository Code Scanning; `publish_results` remains false.
- Token-Permissions alerts #5–#10 identified the five PR-only test workflows without explicit permissions and the CodeQL workflow's workflow-level `security-events: write`.

## Triage decisions

- Remediate alerts #5–#10 through explicit least-privilege permission declarations, preserving triggers and test behavior.
- Scorecard Branch-Protection alert #3 (high): not changed. The single-owner governance intentionally has zero required independent approvals, and the main ruleset was explicitly verified. Do not increase reviewer requirements or change branch policy to improve a Scorecard number.
- Scorecard Code-Review alert #13 (high): not changed. It reports no approved changesets in its sample; the repository uses documented owner-operated audit, and the master execution order treats external AI review as complementary.
- Scorecard Maintained alert #14 (high): not actionable by workflow changes; Scorecard reports repository creation within 90 days.
- Scorecard Fuzzing alert #12, SAST-history alert #11, CI-Tests alert #16, CII-Best-Practices alert #15, and Security-Policy alert #4: review as informational follow-up; none is a confirmed exploitable vulnerability or a reason to add new test architecture or external dependencies in this narrow permission Work Order.
- CodeQL alert #1 is `js/identity-replacement`, severity `medium`, created before this pilot; it is not a CRITICAL/HIGH finding from the changed workflow diff.

## Execution log

| Operation | Commit or run | Result | Evidence / next gate |
|---|---|---|---|
| Exact base and workflow fingerprints | `9c9170f98ee6385e11b2dbf8e1f7584222230cd8` | PASS | Context Lock; create bounded changes and validate YAML/pipeline |
| Scorecard baseline | Run `36481787729` | PASS | SARIF uploaded to repository Code Scanning; triage recorded above |
| Dependency install | `npm ci` | PASS | 29 packages installed; audit reported 0 vulnerabilities |
| Local repository validation | `npm run validate` | PASS | Typecheck and 1,153 tests passed; 0 failed |
| Local YAML parse | Prettier 3.6.2 YAML parser | PASS | All six affected workflow files parsed |
| Local whitespace check | `git diff --check` | PASS | No whitespace errors in tracked workflow diff |
| In-scope permission diff | Branch `gbs/maint/platform-002-scorecard-permissions` | IN PROGRESS | Five pull-request test workflows now declare `contents: read`; CodeQL write is scoped to its analysis job |

Post-merge SHA, candidate checks, owner audit, and final Scorecard run will be appended before closeout. Do not mark this Work Order complete until those gates pass.
