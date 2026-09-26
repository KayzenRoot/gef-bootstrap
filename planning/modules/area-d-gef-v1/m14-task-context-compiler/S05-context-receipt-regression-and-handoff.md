# GBS-M14-S05 — Context Receipt, Regression & Handoff
Status: `FROZEN_CANDIDATE`

## Objective
Make compiled context immutable, replayable, invalidatable and safe for M15 consumption.

## Frozen mechanisms
- **Task Context Capsule (TCC)**: immutable output binding task, project, source pack, policy/profile, selected units, authority proofs, CSP, expansion trace and exclusions.
- **Context Semantic Digest (CSD)**: new NECESSARY technology. Digest over normalized semantic bindings rather than timestamps/path order.
- **Selective Context Invalidation Graph (SCIG)**: new NECESSARY technology. Invalidates only capsule portions whose bound source/decision/dependency fingerprints changed; conservative expansion when dependency knowledge is incomplete.
- **Context Regression Sentinel (CRS)**: new NECESSARY technology. Detects authority downgrade, lost obligation coverage, new conflicts, stale aliases, dependency growth and unsafe aperture shrinkage.
- **Execution Handoff Contract (EHC)**: M15 may consume only `SUFFICIENT` non-stale TCCs; M15 cannot silently add authority-bearing context.

## Receipt validity
`VALID`, `STALE`, `PARTIAL`, `BLOCKED`, `PROJECT_MISMATCH`, `SOURCE_PACK_MISMATCH`, `POLICY_UNSUPPORTED`, `INDETERMINATE`.

## M14 closure
S01-S05 together define task intent, authority-bound routing, MSC proof, safe expansion and immutable handoff. Implementation must remain deterministic/read-only and startup-pure.

STOP CONDITION: `M14_PLANNING_COMPLETE_READY_FOR_GATE`.