# GBS-V11-MAINT-CODEQL-002 — Narrow CodeQL HIGH remediation before WO-009

Status: ADMITTED. Target: release/1.1. Exact base: `5ea917ae50cc8ce45022b76695c1b8cc2c2fc37d`. Owner/executor: KayzenRoot. Assurance: ELEVATED. Branch: `gbs/v11/maint/codeql-cleartext-002`. This is a narrowly scoped prerequisite to admitted `GBS-V11-WO-009`, not WO-010 or V1.1 production acceptance.

## Problem and verified source

The GitHub Code Scanning API, queried read-only by the exact-head WO-009 workflow run `36562294791`, identifies CodeQL alert #2 as `js/clear-text-logging`, HIGH, OPEN on `refs/heads/release/1.1`, source `packages/cli/scripts/rights-diagnostics.mjs`. The baseline prints the value of `process.env["USERNAME"]`. The integrated WO-009 candidate `#316` already contains the fix, but the release baseline remains vulnerable until that fix is merged. Three separate Scorecard HIGH findings #14/#13/#3 concern `main` repository configuration and are not this CodeQL source alert.

## Authorized change

Apply exactly the already-reviewed WO-009 removal of the environment-value log; include the SEC-INT-07 synthetic sentinel regression and the CodeQL workflow's V1.1 JavaScript/TypeScript coverage. Do not hide the alert, alter thresholds, add a dependency, publish, touch `main` or `v1.0.0`, or implement unrelated modules. Preserve frozen Work Orders 002-008, M18/M20 and all release governance.

## Gates and stop condition

1. PR targets only `release/1.1`; source and security workflow changes are exact copies of WO-009 candidate, with documented fixed source.
2. Run focused SEC-INT-07 tests and all triggered repository/security and V1.1 gates at the exact candidate head. No failed, stale or pending mandatory check.
3. Record an owner-operated, non-independent exact-head audit with no applicable unresolved CRITICAL/HIGH in the candidate; the pre-existing release alert is the precise defect remediated by this PR.
4. Only after audited implementation merges into `release/1.1`, verify new release-line CodeQL scan and provider alert #2 state and evidence; no claim of closure based solely on a green scan or candidate source search.
5. Refresh the WO-009 Context Lock and source fingerprints against the new release head, without force-push, then continue PR #316.

STOP CONDITION: `GBS_V11_MAINT_CODEQL_002_MERGED_RELEASE_ALERT_VERIFIED`.
