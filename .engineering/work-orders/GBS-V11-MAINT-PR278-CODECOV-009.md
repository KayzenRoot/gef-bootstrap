# GBS-V11-MAINT-PR278-CODECOV-009 — Source-backed cumulative patch coverage

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: GBS-V11-MAINT-POST-WO009-001. Owner: KayzenRoot. Assurance: ELEVATED.
Target: release/1.1. Exact admission base: 849d79d1743b4628179bcac21b9884aaf2649825. Implementation branch: gbs/v11/maint-pr278-codecov-source-009.

## Objective and provider evidence
PR #278 is the cumulative release-to-main candidate, but remains DRAFT. After the approved PR #328 duplicate-source correction merged into release/1.1, the cumulative Sonar gate on exact release head 849d79d1743b4628179bcac21b9884aaf2649825 is SUCCESS. The Codecov patch check on the same release head is FAILURE: 85.81% diff-hit against provider target 97.85%. The latest provider detail listed 42 missing diff lines, predominantly 23 in packages/cli/scripts/rights-diagnostics.mjs, 13 in packages/cli/scripts/prepare-package.mjs (plus a partially hit line), and 5 in packages/cli/bin/gef.mjs.

## Authorized source and test changes
1. Make the existing read-only Windows rights reporter importable and injectable without changing its direct invocation outputs or altering its role as evidence (never a trust decision). Retain exact ABSENT, DELETE, FILE_DELETE_CHILD and content-writable reporting, and POSIX not-applicable output with exit code zero.
2. Add one directly executed Node test module covering POSIX short-circuit; Windows missing and writable candidates; failed content-open; exact right-probe arguments; and genuine in-process npm packing of the CLI into a disposable directory using the existing exported pack() function.
3. Keep production package staging unchanged. Do not invent line hits, bypass the real filesystem checks, or substitute child-process success for native source coverage. This change must preserve existing installed-package smoke tests and unprivileged Windows assurance.

## Context sources and architecture rules
Read the canonical CHECKPOINT.md/JSON, Decisions Ledger, frozen Scope, Architecture, Security, Test Plan and DoD, the parent maintenance Work Order, ADR-0005, ADR-0006, Codecov workflow and coverage runbook. The Context Lock binds the observed file and policy fingerprints. Do not restore retired providers or active dependencies. Preserve reserved neutral M39/M40 slots and the production V1.0 1088/1088 baseline.

## Explicit exclusions
No edits to production main, the v1.0.0 tag, CI workflow, dependencies, lockfile, Sonar/Codecov thresholds, Codecov account settings, security policies, unrelated modules or package publication. This Work Order does not admit WO-010 or certify V1.1 production readiness.

## Acceptance criteria
All changes restricted to rights-diagnostics.mjs, the new focused test, Work Order, exact Context Lock and Evidence Bundle. Verify same direct CLI output on the host and same Windows oracle calls; no process.platform monkeypatching or ambient filesystem modification. Existing package smoke and regression suites continue to pass. Require full build/typecheck, retired-ecosystem absence guard, repository validation, three-OS V1.1 release assurance, Windows-rights oracle, upgrade/recovery, CodeQL, Gitleaks, Trivy and incremental Sonar at one exact candidate HEAD. Before release-line merge, KayzenRoot must issue a labeled OWNER_APPROVED (NOT_INDEPENDENT) audit of the entire diff, exact-head checks and new CRITICAL/HIGH inventory.
After merge, remeasure the separate cumulative PR #278 Sonar and Codecov checks at its new exact SHA. A passing incremental Sonar or passing native test suite is not proof of Codecov provider acceptance. If the cumulative gate still fails, retain STOP status and define only the next evidence-bound correction.

## Deliverables and review format
Code, real regression coverage, exact source fingerprints, evidence log, reviewed PR and checkpoint delta. Do not promote canonical checkpoint state until acceptance is provider-bound.

STOP CONDITION: GBS_V11_CODE_COVERAGE_BOUNDED_EXACT_HEAD_AND_PROVIDER_VERIFIED.
