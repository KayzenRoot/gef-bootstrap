# GBS-V11-MAINT-PR278-CODECOV-ENTRY-010 — Bounded CLI fail-closed entrypoint source coverage

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: GBS-V11-MAINT-POST-WO009-001. Owner: KayzenRoot. Assurance: ELEVATED. Exact admission base: dcb95a79a0d8bcb5441077c71b3499f47dd958e9. Branch: gbs/v11/maint-pr278-cli-entry-coverage-010. Target: release/1.1.

## Verified issue and objective
On the current cumulative release-to-main PR #278, SonarCloud is SUCCESS but Codecov patch remains FAILURE: 93.89% diff-hit against the 97.85% provider target. Provider identifies 19 missing changed lines: prepare-package.mjs 13 (and one partial), bin/gef.mjs 5. Native Node coverage runner job 109489444834 reports bin/gef.mjs 75.00% line coverage with uncovered lines 13-16, but reports prepare-package.mjs 100.00% line coverage. This difference between provider and runner for the pack script must be separately reconciled without speculative coverage-padding or threshold changes.

## Scoped correction
Extract the executable shim's existing success/failure logic into a named, importable function in the same executable file, preserving direct execution for both normal paths and installed-package symlinks. Inject only the entry loader, error writer and exit-code sink at the function boundary for deterministic unit tests. Existing default implementation must still import ../dist/main.js, run main, report only the bounded error code/name and set exit code 40 on failure.
Add exactly one native in-process test module verifying successful dispatch, missing built module, failure thrown by main and untyped failure fallback. This addresses the provider-confirmed CLI shim gap while preserving end-to-end packaged process smoke tests; the true provider result after merge controls whether further work is authorized.

## Frozen sources, architecture and exclusions
Read the canonical human/machine checkpoints, Decisions Ledger, frozen Scope, Architecture, Security, DoD and Test Plan, parent maintenance Work Order, effective ADR-0005 and ADR-0006, existing bin shim, package staging PAYLOAD (which already includes bin), installed-package smoke tests, current LCOV workflow and exact-head provider evidence. Full source fingerprints are in the Context Lock.
Do not edit the package preparation script, module/build APIs, dependencies, package lock, thresholds, coverage reports, CI workflow, retired provider boundary, production main, tags or publication. Maintain neutral reserved adapter slots and V1.0 baseline. This subordinate maintenance WO is distinct from the still-NOT-ADMITTED product WO-010.

## Acceptance and STOP CONDITION
Diff restricted to bin/gef.mjs, the new in-process shim tests and the three governance/evidence files. Preserve unchanged CLI output and exit contracts on Windows/Linux/macOS, including installed symlink execution and missing dist recovery. Build/typecheck, repository validation and retired-provider guard, cross-platform V1.1 release assurance, Windows-rights oracle, upgrade/recovery, Sonar incremental, CodeQL, Gitleaks, Trivy and mandatory CI must all succeed at the exact candidate SHA. Then KayzenRoot exact-head owner audit with explicit NOT_INDEPENDENT and no applicable new CRITICAL/HIGH finding precedes a normal release/1.1-only merge. Recheck cumulative PR #278 Sonar/Codecov on the resulting release HEAD before any production acceptance claim.
Only provider-backed coverage improvement qualifies as verified. If Codecov still reports missing package preparation lines while current native LCOV is 100% line-covered, the next authorized step is a read-only exact-SHA provider/LCOV mapping diagnostic, not lowering the threshold or changing production logic on speculation.

STOP CONDITION: GBS_V11_ENTRY_COVERAGE_EXACT_HEAD_VERIFIED_PROVIDER_RECHECK_REQUIRED.
