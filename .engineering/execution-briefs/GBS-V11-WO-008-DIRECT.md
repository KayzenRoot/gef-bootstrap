# Direct Execution Brief — GBS-V11-WO-008

State: `IMPLEMENTED_PR_296_AWAITING_OWNER_AUDIT`
Authority: `ADR-0003-D3 as boundedly superseded by D-0062/ADR-0006`
Assurance: `STANDARD`
Work Order: `.engineering/work-orders/GBS-V11-WO-008.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-008.json`
Implementation branch: `feat/1.1/wo-008-performance-telemetry`

## EXACT BASE

Create the implementation branch only from the exact WO-008 governance/admission merge on `release/1.1`. Historical pre-admission base: WO-007 merge `d5b923f1aaf0c8319fc29285c76bda89a363aadf`.
If `release/1.1` advances before branch creation, STOP as `STALE_CONTEXT`.

## MINIMUM READ SET

1. WO-008 Work Order
2. WO-008 Context Lock
3. Checkpoint
4. V1.1 Performance Benchmark Protocol
5. Test Matrix TELEM rows
6. Executor Acceleration Contract sections 14-16
7. M62-M63 final performance primitives
8. M55-M61 benchmark summary/gate
9. M41-M47 compareBenchmark
10. WO-005 Execution Capsule public surface
11. WO-006 Incremental Validation public surface
12. WO-007 Proof Reuse public surface

No repository-wide rediscovery unless a concrete compiler/test/dependency failure requires it.

## IMPLEMENTATION TARGET

Extend the existing performance owner rather than creating a second benchmark engine. Prefer:
- `packages/m62-m63-final/src/v11-performance-telemetry.mjs`
- minimal exports from the existing M62-M63 package
- `tests/v11-wo-008-performance-telemetry.test.mjs`
- cross-platform `TELEM` workflow
- repository-local benchmark fixtures/records when needed
- mandatory Evidence Bundle

## CORE RULES

- P1-P8 population identity is exact and deterministic.
- Any population mismatch => `INCOMPARABLE`; publish no speedup delta.
- Missing required metric => `INDETERMINATE`.
- Every metric carries `MEASURED | ESTIMATED | UNAVAILABLE`.
- Unavailable tokens remain `UNAVAILABLE`.
- Quality failure sets `optimizationClaimEligible:false` and cannot yield `IMPROVED`.
- Baselines are immutable; recapture creates a new lineage node.
- Repeated samples report dispersion; never select the best run as proof.
- Cold and warm proof/cache postures never cross-compare as gains.
- Bind acceleration evidence to exact WO-005/006/007 identities.
- Reuse existing M63/M57/M41 benchmark primitives where semantically compatible.
- Final exact-head assurance cannot be suppressed.
- Output and handoff are read-only.

## MANDATORY CASES

- TELEM-01 population mismatch -> INCOMPARABLE, no delta
- TELEM-02 missing required metric -> INDETERMINATE
- TELEM-03 token unavailable -> UNAVAILABLE
- TELEM-04 failed quality gate voids apparent gain
- TELEM-05 immutable baseline lineage
- TELEM-06 honest CLI ROI comparison

Also prove cold/warm separation, repeated-sample determinism, invalid sample rejection, stale acceleration-binding rejection, public-output redaction, and read-only authority boundaries.

## HARD BOUNDARIES

The exact-head semantic audit and authorized merge are performed by `KayzenRoot` under D-0062/ADR-0006. No collaborator review is required. Do not call the owner audit independent.

Do not:
- implement WO-009 or WO-010;
- mutate `main` or `v1.0.0`;
- merge before owner exact-head audit approval and all required exact-head checks pass;
- merge to `main` or mutate `v1.0.0`;
- tag, publish, force-push or rewrite history;
- manufacture a performance claim from incomparable populations;
- weaken quality/security/recovery/evidence gates;
- change WO-005/006/007 semantics;
- accept M24 evidence, decide M25 general proof or issue M27 assurance;
- add legacy ecosystem-specific adapters.

STOP CONDITION: `GBS_V11_WO_008_READY_FOR_OWNER_AUDIT_AND_MERGE`
