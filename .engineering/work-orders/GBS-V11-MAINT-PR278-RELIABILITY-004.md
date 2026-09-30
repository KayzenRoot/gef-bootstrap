# GBS-V11-MAINT-PR278-RELIABILITY-004 — Remaining cumulative Sonar verification and deterministic ordering

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: GBS-V11-MAINT-POST-WO009-001. Target: release/1.1. Base SHA: `d4fcf02d6bd1e44e005389b2aed0f5e3dd708549`. Branch: `gbs/v11/maint-pr278-reliability-004`. Owner: KayzenRoot. Assurance: ELEVATED.

## Evidence-bound scope

The cumulative PR #278 scan at this exact base reports Security B, Reliability D and new-code duplication displayed 3.0%, all blocking production promotion. A read-only diagnostics rerun (job 109433079205) yielded 50 metadata-only Sonar annotations, including a no-op `void` loop in `packages/cli/src/transaction.ts:431`, an implicit `.sort()` comparator in `packages/m62-m63-final/src/v11-performance-telemetry.mjs:393`, and two unused bindings in the telemetry report. A prior Sonar PR gate on individual maintenance changes does not close the cumulative gate.

## Authorized changes

1. Delete the physical stage-verification port's no-op obligation loop. Keep its content read-back, fingerprint comparison, parent engine obligation enforcement and return result unchanged. It must not manufacture obligation satisfaction or skip any parent verification.
2. Sort the measured metric IDs with the existing explicit `compareKeys` comparator, aligned with the record's fixed uppercase ASCII metric-ID grammar. Eliminate the unused required-set and no-op ignored binding in report generation while continuing to omit any supplied prior report digest before computing the new report digest.
3. Add this Work Order, exact-base Context Lock and source-bound evidence. Leave all other Sonar issues unresolved unless proven resolved by a new provider scan.

## Required gates

Focused transaction/CLI and telemetry tests, repository validation, full Ubuntu/Windows/macOS V1.1 release assurance, dependency/security checks, Sonar on this exact candidate and a distinct cumulative PR #278 analysis. Owner-only exact-head audit, explicitly NOT independent, is required prior to any release-line merge. Do not touch main, historic production tags, Sonar thresholds, provider settings, dependency lockfiles, unrelated modules or retired integrations. Do not admit WO-010 while PR #278 fails Sonar or branch mergeability.

STOP CONDITION: `GBS_V11_PR278_RELIABILITY_004_EXACT_HEAD_VERIFIED_OR_BLOCKED`.
