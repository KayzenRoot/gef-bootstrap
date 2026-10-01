# GBS-V11-MAINT-PR278-CODECOV-ENTRY-010 — Exact-head admission evidence

Admission base: release/1.1 dcb95a79a0d8bcb5441077c71b3499f47dd958e9; only the admitted parent maintenance may own this subordinate correction. Main production V1.0 e23311e77d79b84f3c70671072a22a6f8896d13d and v1.0.0 remain immutable.
Prior PR #329: OWNER_APPROVED NOT_INDEPENDENT on exact candidate 41c52801dbba5322ffe997dd9538ece0e6df5374 after 37/37 SUCCESS, merge dcb95a79a0d8bcb5441077c71b3499f47dd958e9.

## Evidence before source correction
Original cumulative PR #278 Codecov patch failed at 85.81% against 97.85% before source reporting test changes. After genuine in-process rights and packaging tests, current exact-head Codecov check 109490327985 still fails at 93.89%; latest provider bot reports 19 missing changed lines, 13 in prepare-package.mjs (plus one partial) and 5 in bin/gef.mjs. The coverage runner for that exact head, job 109489444834, showed prepare-package.mjs 100.00% native line coverage but CLI bin/gef.mjs 75.00% with uncovered source lines 13-16. Its Codecov action uploaded LCOV using the exact release SHA and reported accepted upload queued for processing. A mapping discrepancy remains for the packaging source and is NOT considered closed.

## This scoped change
The same CLI executable contains an imported testable function for success and fail-closed error projection. Entrypoint execution uses canonical real paths so npm bin symlinks continue to launch. The new native tests exercise successful dispatch, absent entry module, failing main and untyped failure, with injected stderr and exit-code effects. The source of production package staging is unchanged and does not receive speculative refactoring.

## Required assurance and pending provider verdict
Candidate HEAD CI/security, three-OS tests, installed-package smoke, Windows-rights oracle, upgrade/recovery, Sonar candidate, exact-head owner audit and subsequent cumulative PR #278 Codecov result: PENDING until the corresponding provider proves each. No current claim of reaching the Codecov 97.85% target. Full source and Work Order fingerprints are recorded in the Context Lock.
WO-010 product production acceptance is NOT admitted, PR #278 remains DRAFT, and no main/tag/publication changes are authorized.
