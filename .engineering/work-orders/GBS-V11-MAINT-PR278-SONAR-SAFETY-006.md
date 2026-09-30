# GBS-V11-MAINT-PR278-SONAR-SAFETY-006 — Remove bounded cumulative Sonar safety and deterministic-cleanliness findings

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: GBS-V11-MAINT-POST-WO009-001. Target: release/1.1. Exact base: `08bd9f18ca3993ff450785a1aeeeaf3c71fef50f`. Branch: `gbs/v11/maint-pr278-sonar-safety-006`. Owner: KayzenRoot. Assurance: ELEVATED.

## Proven input

PR #278 is ancestry-reconciled and mergeable, but its cumulative Sonar Quality Gate at the exact release head still fails: Security B, Reliability D and 3.1% new-code duplication. Read-only cumulative diagnostics job `109459863174` exposed the current 50 annotation metadata items. This increment addresses only simple, behavior-preserving findings that are independently reviewable.

## Authorized corrections

1. Package construction no longer launches `npm` through a shell or PATH lookup. Resolve the npm CLI as an absolute existing script from the active Node/npm installation and invoke it with `process.execPath` plus argv. Preserve `--ignore-scripts`, package destination and 300s timeout.
2. Remove unused filesystem authorization/overwrite imports and the unused physical-port root descriptor left by prior refactoring. Remove the unused private-area argument/void expression from the resolver while keeping the same target root, case semantics and resolver result.
3. Apply the existing locale-aware `compareKeys` comparator to metric-key and required-metric normalization; remove two ignored destructuring bindings by cloning and deleting the digest field before canonical hashing.

## Gates and exclusions

No dependency, lockfile, threshold, Sonar rule, public contract, production branch, release tag, retired integration or publication setting may change. Exact-head focused package/CLI/transaction/telemetry tests, repository validation, cross-platform V1.1 release assurance, Windows rights, upgrade/recovery, CodeQL, Gitleaks, Trivy, dependency review and Sonar are required. Candidate Sonar success is not cumulative PR #278 success. Owner audit is NOT independent and must bind the exact head before release-line merge.

STOP CONDITION: `GBS_V11_PR278_SONAR_SAFETY_006_EXACT_HEAD_VERIFIED_OR_BLOCKED`.
