# GBS-M20-S03 — Verdict, Blockers & Next Action
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Standardize response verdict, blockers and next-action projection so the response reflects governed continuation truth and never hides conflict, recovery state or unresolved blockers behind optimistic prose.

## Technologies
- **Response Verdict Algebra (RVA20)**: typed verdicts `SUCCESS`, `PARTIAL`, `BLOCKED`, `INDETERMINATE`, `RECOVERY_REQUIRED` and `CONFLICT`, preserving non-success distinctions.
- **Blocker Projection Set (BPS20)**: deterministic projection of applicable blockers with source identity, severity/classification and disposition state; omission requires explicit non-applicability or resolved state.
- **Next Necessary Action Capsule (NNAC20)**: binds exactly one canonical next necessary action or explicit `NONE/UNKNOWN`, derived from verified continuation/owning source rather than model preference.
- **Condition Precedence Lattice (CPL20)**: fail-closed precedence where recovery/partial-effect and authority/state conflict outrank generic success or informational states.
- **State Conflict Witness (SCW20)**: captures disagreement among canonical response inputs such as checkpoint/current state, resume handoff, registry handoff or delegated metric sources.

## Invariants
1. A blocking/recovery/conflict condition cannot be flattened into `SUCCESS`.
2. Response verdict does not manufacture module/project completion status; it projects input conditions only.
3. `nextNecessaryAction` is singular and canonical when known; alternative suggestions may be informational but cannot replace it.
4. Conflicting canonical sources yield `CONFLICT`/`INDETERMINATE` rather than arbitrary winner selection.
5. Blocker omission is deterministic and auditable.
6. Recovery-required/partial-effect semantics preserve the stronger safety condition already established by the work plane.

## Required tests
Verdict precedence, multiple blockers, stale blocker, conflicting checkpoint/handoff, missing next action, attempted optimistic override and deterministic blocker order.

STOP CONDITION: `M20_S03_FROZEN`.
