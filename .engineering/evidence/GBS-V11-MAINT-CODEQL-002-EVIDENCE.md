# GBS-V11-MAINT-CODEQL-002 — Evidence Bundle

Status: IMPLEMENTED_PENDING_EXACT_HEAD_CHECKS. Owner: KayzenRoot. Scope: direct clear-text log remediation, SEC-INT-07, CodeQL workflow path coverage. Exact parent `5ea917ae50cc8ce45022b76695c1b8cc2c2fc37d`. Production main `e23311e77d79b84f3c70671072a22a6f8896d13d` untouched. No external context provider dependency introduced.

## Original vulnerability

Provider-backed API in WO-009 [run 36562294791](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36562294791) reports HIGH CodeQL #2, rule `js/clear-text-logging`, OPEN on `refs/heads/release/1.1` at `packages/cli/scripts/rights-diagnostics.mjs`. The old source printed an environment value. Candidate source deletes that output. SEC-INT-07 runs a synthetic `USERNAME` sentinel through the CLI and rejects any stdout/stderr disclosure. CodeQL trigger coverage includes `release/1.1`, packages .ts/.js/.mjs, and tests.

## Exact-head gates

PR and candidate: to be bound by GitHub PR. Focused test: NOT_RUN. Repository validation, CodeQL, Gitleaks, Trivy and all triggered V1.1 suites: NOT_RUN. Owner audit: NOT_RUN. No premature HIGH=0 claim; post-merge release scanning and alert #2 closure are compulsory.

## Expected handoff

After all candidate checks and owner audit pass, merge only this focused security maintenance to release, verify release CodeQL issue state, then refresh WO-009 lock and re-run its PR exact-head assurance. No changes to main or protected V1.0 tag.
