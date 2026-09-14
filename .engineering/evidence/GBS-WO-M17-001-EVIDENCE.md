# Evidence Bundle — GBS-WO-M17-001

Status: `APPROVED_FOR_MODULE_DONE_PROMOTION`
Module: `GBS-M17 — Checkpoint Engine`
Risk: `HIGH`
Canonical weight: `17`

## Source and admission binding
- Work Order: `.engineering/work-orders/GBS-WO-M17-001.md`
- M14-M18 admission PR: `#191`
- Admission merge / legal train base: `54e1bdf6555b6170cc288617370592a072d6cf95`
- Reviewed descendant base used for M17 implementation: M16 MODULE_DONE promotion merge `f08b3dc1c5e92f286f5dea8993c20450c50e5fe9`

## Implementation identity
- Implementation PR: `#204`
- Reviewed head: `e2120b1296d70e753d0adbf1a1edf169bf230f2d`
- Reviewed tree: `628174991d6eb30491a14ea5f115452aab24876f`
- Semantic audit review: `5202801138`
- Implementation merge: `6174547bfbd8511b8327df012ed4c1ece8282bd2`

## Delivered capability
M17 implements the full frozen S01-S05 Checkpoint Engine contract:
- Canonical Continuation Capsule, Checkpoint State Vector, Authority Snapshot Index and Continuation Invariant Set;
- Semantic Compare-And-Swap, Checkpoint Promotion Transaction, Split-Brain Continuation Detector, Promotion Fence Token and Checkpoint Mutation Receipt;
- Checkpoint Dependency Graph, Selective Continuation Invalidation, Checkpoint Rollback Pointer, Stale Claim Quarantine and Continuity Regression Sentinel;
- Continuation Minimum Sufficient State, Historical Pointer Compaction, Checkpoint Portability Envelope, Cold-History Eviction Map and Checkpoint Size Guard;
- Checkpoint Admission Receipt, Resume Readiness Certificate, Checkpoint Freshness Vector and Continuation Handoff Contract.

The package is pure and deterministic, uses injected SHA-256, bounded/cancellable operations, performs no filesystem/Git/network mutation, and binds continuity to M16 policy authority.

## Correction Deltas closed before approval
- added semantic trust-anchor verification for canonical checkpoint capsules;
- added semantic trust-anchor verification for promotion fence tokens;
- added semantic trust-anchor verification for checkpoint promotion proposals before commit;
- propagated selective invalidation through transitive `claim:<id>` dependency closure;
- unresolved claim references mark dependency knowledge incomplete and force conservative widening;
- disappearance of an accepted claim is detected as explicit `CLAIM_LOSS` regression;
- SHA-256 semantic bindings are strictly validated.

## Tests and evidence
- Focused M17 suite: `43 / 43` PASS on Ubuntu.
- Focused M17 suite: `43 / 43` PASS on Windows.
- Focused M17 suite: `43 / 43` PASS on macOS.
- Full repository regression: `567 / 567` PASS, `0` failures.
- TypeScript typecheck/build: PASS.
- `npm ci --ignore-scripts`: PASS.
- `npm audit --audit-level=low`: `0 vulnerabilities`.
- Security CodeQL: PASS.
- Triggered inherited workflows M01 and M06-M16: PASS on final reviewed head.
- Startup purity and no filesystem/network/process requirement: PASS.

## Audit verdict
- `CRITICAL`: `0`
- `HIGH`: `0`
- Verdict: `APPROVED`

## Checkpoint Delta proposed
Before promotion:
- earned production weight: `304 / 1088 = 27.94%`
- remaining production weight: `784 / 1088 = 72.06%`
- M17 earned weight: `0 / 17`

After promotion:
- earned production weight: `321 / 1088 = 29.50%`
- remaining production weight: `767 / 1088 = 70.50%`
- M17 earned weight: `17 / 17`
- denominator change: `NONE`
- M18 dependency gate on M17: `SATISFIED`
- next legal stage: `IMPLEMENT_GBS_M18`

STOP CONDITION: `GBS_WO_M17_001_EVIDENCE_APPROVED_READY_FOR_MODULE_DONE_PROMOTION`.
