# GBS-M26-S05 — HEDS Verdict

Status: `FROZEN`
Module: `GBS-M26 — HEDS Delta Review`
Frozen weight: `19`
Assurance intensity: `HIGH_ASSURANCE`

## Objective
Freeze the final HEDS review artifact, independent integrity proof, immutable history and downstream handoff. The verdict is a semantic review result only; it is not assurance, test selection, checkpoint promotion or completion authority.

## Frozen mechanisms
1. **HVC26 — HEDS Verdict Capsule**: final state `APPROVED | CORRECTION_REQUIRED | BLOCKED | INDETERMINATE | TRUNCATED` with baseline/candidate, delta, gate, finding and policy bindings.
2. **HIR26 — HEDS Integrity Receipt**: independently recomputes the verdict prerequisites and semantic digest rather than trusting the serialized verdict label.
3. **HSD26 — HEDS Semantic Digest**: presentation-independent identity binding reviewed baseline/candidate, source manifest, delta inventory, impact frontier, findings and gate receipts.
4. **HFR26 — HEDS Finding Register**: deterministic current + retained finding history with exact resolution/supersession lineage and no newest-wins collapse.
5. **HTR26 — HEDS Transition Receipt**: immutable predecessor/successor record for verdict changes, changed findings, changed scope and reason codes.
6. **HRG26 — HEDS Replay Guard**: exposes idempotent duplicate review/verdict history, conflicting stable IDs and explicit bounded-history truncation.
7. **HSW26 — HEDS Split-Brain Witness**: detects divergent verdict successors sharing the same predecessor/baseline-candidate review identity and forbids silent branch selection.
8. **DHH26 — Downstream HEDS Handoff**: read-only handoff for `M27_ASSURANCE | M28_TEST_IMPACT | GOVERNANCE`, carrying verdict, reviewed delta/impact identities, blocking findings and validity bindings while denying downstream authorities to M26.

## Verdict semantics
- `APPROVED`: semantic delta review complete under current bindings, all gates pass, unresolved CRITICAL/HIGH are zero.
- `CORRECTION_REQUIRED`: trusted reviewed semantics contain candidate-correctable blocking defects.
- `BLOCKED`: explicit authority/policy/conflict barrier prevents legal semantic review continuation.
- `INDETERMINATE`: mandatory source/proof/review truth is absent, stale or ambiguous.
- `TRUNCATED`: bounded execution/history cannot establish complete review; never equivalent to approval.

## History rules
- Same review/verdict ID with identical semantic digest is replay-visible and idempotent, not independent support.
- Same stable ID with divergent semantic digest is conflict.
- Same predecessor review identity with divergent successor verdict semantics is split-brain.
- A later `APPROVED` does not erase prior blocking findings; exact resolution/supersession lineage remains queryable.
- Verdict regression is allowed when upstream semantics/proofs change, but must be receipted.
- No wall-clock recency, array order or Git commit order chooses a winner among conflicting semantic histories.

## Downstream boundary
DHH26 may tell M27 what semantic review was performed and what blocking/non-blocking findings remain; M27 alone decides assurance. DHH26 may tell M28 what semantic subjects/impact frontier changed; M28 alone maps that to tests. DHH26 cannot mutate evidence, proof, source owners, progress, project status or checkpoint state.

## HIGH_ASSURANCE acceptance
Implementation must prove independent verdict recomputation, label tamper detection, finding-register integrity, resolution lineage, replay/idempotency, split-brain, verdict regression, explicit truncation, downstream owner/consumer binding, M27/M28 authority denial, permutation determinism, cancellation/bounds, injected digest failure, startup purity, Ubuntu/Windows/macOS focused CI, full regression, dependency audit, CodeQL where triggered, exact-head semantic audit, CRITICAL `0`, HIGH `0` and separate MODULE_DONE promotion.

STOP CONDITION: `M26_S05_FROZEN`.
