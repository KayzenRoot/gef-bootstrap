# GBS-M21-S04 — Snapshot, Receipt & Handoff
Status: `FROZEN`
Module weight: `18`
Assurance intensity: `HIGH_ASSURANCE`

## Objective
Freeze integrity-bound progress snapshots and owner-safe handoffs so M20 can present progress, M22 can estimate from an accepted baseline, and M23 can consume progress state without any downstream module recalculating or upgrading M21 truth.

## Technologies
- **Progress Snapshot Capsule (PSC21)**: immutable project/epoch snapshot containing exact project and requested hierarchical rollups, completeness state, quarantined credit summary and binding identities.
- **Progress Integrity Receipt (PIR21)**: independently verifiable receipt binding denominator manifest, atomic-credit digest set, rollup graph digest, snapshot exact fraction and invalidation state.
- **Progress Semantic Digest (PSD21)**: stable semantic identity for comparison/carry-forward independent of presentation wording/rounding.
- **Progress Completeness Envelope (PCE21)**: typed `COMPLETE`, `PARTIAL_OBSERVATION`, `STALE`, `CONFLICT`, `INDETERMINATE` state with observed/required unit counts and missing-unit references.
- **Delegated Progress Metric Handoff (DPMH21)**: M20-compatible owner-bound metric projection carrying exact numerator/denominator plus optional presentation percentage, source identity and validity binding.
- **Estimation Baseline Handoff (EBH21)**: read-only M22 handoff exposing progress history/baseline identities and accepted snapshots without generating any ETA.
- **Status Progress Handoff (SPH21)**: read-only M23 handoff containing progress/completeness/regression facts without deciding overall project status.
- **Progress Staleness Sentinel (PSS21)**: final emission/reuse check against current project, scope/DoD, denominator epoch and evidence/proof binding-set identity.

## Handoff rules
1. M20 receives delegated progress claims only; it cannot recalculate or upgrade M21 progress.
2. M22 receives exact accepted progress snapshots/baseline identities; it alone owns ETA/forecast estimation.
3. M23 receives progress facts but remains owner of project-status computation.
4. M24/M25/M27 remain owners of evidence/proof/assurance acceptance decisions consumed by M21 credit eligibility.
5. Human/display rounding is outside canonical progress math and must preserve exact numerator/denominator provenance.

## Invariants
1. A snapshot cannot report `COMPLETE` when required denominator units are missing, stale, quarantined or conflicted.
2. Progress receipts prove M21 calculation integrity, not underlying evidence/proof truth.
3. Handoff values are read-only and owner-labeled.
4. A downstream module cannot turn `PARTIAL_OBSERVATION`, `STALE`, `CONFLICT` or `INDETERMINATE` into an authoritative percentage without a new valid M21 snapshot.
5. Snapshot reuse fails when scope/DoD/denominator/evidence-binding identities drift.
6. Semantic digests ignore presentation-only rounding but bind all material progress truth.
7. Progress history preserves legitimate decreases and denominator-epoch transitions rather than smoothing them away.
8. Size/resource limits produce typed expansion/failure states rather than dropping denominator units or quarantine facts.
9. Ordinary imports and pure semantic APIs remain startup-pure.
10. All hashes are injected SHA-256 with fail-closed validation.

## HIGH_ASSURANCE obligations
- independent receipt recomputation;
- snapshot/handoff mix-and-match attacks;
- stale scope/DoD/denominator/evidence-set rejection;
- downstream owner-label tests;
- exact fraction survives display-rounding changes;
- progress-regression history preservation;
- budget/cancellation/startup-purity tests;
- Ubuntu/Windows/macOS focused matrix plus full regression, dependency audit and CodeQL when triggered.

STOP CONDITION: `M21_S04_FROZEN`.
