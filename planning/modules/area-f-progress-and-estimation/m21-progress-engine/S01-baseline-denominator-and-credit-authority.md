# GBS-M21-S01 — Baseline, Denominator & Credit Authority
Status: `FROZEN`
Module weight: `18`
Assurance intensity: `HIGH_ASSURANCE`

## Objective
Freeze the authority model for project progress so every percentage or earned-weight value is derived from an approved denominator and evidence-bound credit, never activity, intuition, PR count, elapsed time or conversational optimism.

## Ownership boundary
M21 owns deterministic progress calculation and rollup over supplied canonical scope/DoD/backlog/evidence-status projections. It does not define scope/DoD (M12), decide evidence validity/proof sufficiency (M24/M25/M27), estimate time (M22), calculate project status (M23), mutate checkpoints (M17), or format final operator responses (M20/M47).

## Technologies
- **Progress Baseline Capsule (PBC21)**: immutable binding of project/lineage, denominator identity, scope/DoD identities, baseline epoch and applicable progress policy.
- **Denominator Integrity Manifest (DIM21)**: canonical set of release-blocking credit units, weights, parent rollup coordinates and optional-track exclusions with deterministic digest.
- **Progress Authority Boundary (PAB21)**: explicit declaration that M21 calculates only from admitted canonical projections and cannot mint scope, proof or completion authority.
- **Credit Eligibility Gate (CEG21)**: admits credit only for a unit whose allocation is in the denominator and whose required evidence/proof-state projection is accepted by its owning authority.
- **Weighted Credit Unit (WCU21)**: stable atomic progress unit carrying unit ID, parent coordinates, maximum weight, earned weight and evidence-binding identity.
- **Scope/DoD Binding (SDB21)**: binds progress eligibility to the applicable approved scope and Definition-of-Done identities.
- **Evidence Acceptance Binding (EAB21)**: typed reference to externally decided evidence/proof acceptance; M21 verifies binding identity but never decides evidentiary sufficiency itself.
- **Denominator Mutation Witness (DMW21)**: before/after witness required whenever an approved denominator changes, recording added/removed/reweighted units and the resulting completion impact.

## Invariants
1. `earnedWeight <= maxWeight` for every atomic unit and for every aggregate.
2. Production progress denominator is explicit, immutable for an epoch and identity-bound.
3. `MODULE_DONE` may earn full module weight only when the externally supplied accepted-evidence state permits it.
4. Partial credit is legal only for explicit admitted sub-units with allocated weight and accepted proof binding.
5. Planning activity, files changed, PR count, commits, token use, elapsed time and narrative claims never earn production weight by themselves.
6. Optional tracks excluded from a denominator cannot leak into its numerator.
7. Scope/DoD/denominator identity mismatch fails closed and cannot be repaired by M21.
8. Denominator changes create a new epoch/witness; historical percentages are not silently recomputed as if the old baseline never existed.
9. Zero denominator is an invalid production baseline, not `0%` or `100%`.
10. Every output value retains exact numerator/denominator provenance rather than only a rounded display percentage.

## HIGH_ASSURANCE obligations
- property tests over arbitrary legal weight partitions;
- adversarial over-credit/negative-weight/duplicate-unit inputs;
- denominator epoch mix-and-match rejection;
- proof-binding tamper tests;
- optional-track contamination tests;
- deterministic permutation tests.

STOP CONDITION: `M21_S01_FROZEN`.
