# GBS-M27-S03 — Assurance Admission

Status: `FROZEN`
Module: `GBS-M27 — Assurance Pipeline`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Admit only current, owner-authorized evidence/proof/review facts into assurance evaluation. Missing, stale, conflicting or insufficient upstream truth must remain explicit and can only preserve or increase the assurance burden.

## Frozen mechanisms
1. **EAG27 — Evidence Admission Gate**: consumes M24 acceptance facts read-only and rejects stale/relabelled evidence authority.
2. **PSG27 — Proof Sufficiency Gate**: consumes M25 proof state/read-only handoff and rejects stale, unresolved or conflicting proof for mandatory assurance obligations.
3. **HSG27 — HEDS Semantic Gate**: consumes M26 HEDS verdict/findings and requires semantic-review compatibility for assurance-sensitive scope.
4. **ECG27 — Evidence Coverage Gate**: compares required assurance obligations with admitted current evidence/proof/review coverage.
5. **UAG27 — Uncertainty Amplification Gate**: widens context/validation obligations when source, dependency, proof or review knowledge is incomplete.
6. **BSG27 — Blocking Severity Gate**: preserves unresolved `CRITICAL`/`HIGH` findings as hard assurance blockers and forbids severity/order masking.
7. **CAG27 — Context Admission Gate**: verifies project/lineage/candidate/policy context is coherent across all admitted upstream facts.
8. **AER27 — Assurance Evidence Receipt**: immutable independently recomputable receipt of what upstream assurance material was admitted, rejected, stale, conflicting or unresolved.

## Admission states
Each required obligation is classified as `SATISFIED | UNSATISFIED | BLOCKED | STALE | CONFLICT | INDETERMINATE | NOT_APPLICABLE`.

Only `SATISFIED` and explicitly valid `NOT_APPLICABLE` can close a required obligation. `STALE`, `CONFLICT`, `INDETERMINATE`, `BLOCKED` and `UNSATISFIED` cannot be collapsed into a generic false/true flag.

## Evidence and proof boundaries
- M27 never self-accepts raw test output as evidence; acceptance authority remains M24 or another declared canonical owner.
- M27 never recalculates M25 proof sufficiency when a current M25 decision is required.
- M27 never edits HEDS findings or upgrades a non-approved M26 verdict.
- current generic evidence may satisfy an assurance obligation only when owner/type/scope/validity bindings match the profile exactly.

## Test boundary before M28
M27 freezes required validation categories, risk/platform/security floors and exact-head obligations. It does not enumerate concrete impacted tests. M28 later maps these assurance requirements plus source/proof/review deltas to test identities and reusable test-proof receipts.

## MAX_ASSURANCE attack families
Evidence owner spoof, accepted-to-stale reseal, proof-snapshot mix, unresolved proof hidden by green test, HEDS correction state hidden by zero findings, duplicate evidence double-count, cross-lineage evidence splice, severity downgrade, conflicting canonical sources, incomplete dependency knowledge, cancellation and aggregate-budget exhaustion.

STOP CONDITION: `M27_S03_FROZEN`.
