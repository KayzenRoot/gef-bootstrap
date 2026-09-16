# GBS-M26-S04 — Review Gates

Status: `FROZEN`
Module: `GBS-M26 — HEDS Delta Review`
Frozen weight: `19`
Assurance intensity: `HIGH_ASSURANCE`

## Objective
Freeze the fail-closed gates that decide whether the semantic review is complete enough to issue a HEDS verdict. Gate failure is explicit and typed; missing information never becomes approval.

## Frozen mechanisms
1. **BCG26 — Baseline Continuity Gate**: verifies that baseline, candidate and any prior HEDS receipt form an admissible predecessor chain rather than branch-mixed history.
2. **SCG26 — Source Completeness Gate**: requires enough current source coverage to support the requested review scope and records partial/unknown coverage without optimistic closure.
3. **PIG26 — Proof Invalidation Gate**: consumes M25 invalidation/proof facts and requires every invalidated proof-relevant review item to be reconsidered or explicitly unresolved.
4. **FCG26 — Finding Closure Gate**: verifies exact resolution/supersession lineage for prior blocking findings and rejects silent disappearance or ID reuse.
5. **ZHG26 — Zero High/Critical Gate**: HEDS approval requires unresolved `CRITICAL=0` and `HIGH=0`; indeterminate blocking-severity state also prevents approval.
6. **AAG26 — Authority & Ambiguity Gate**: blocks unresolved source-owner conflict, mixed authority, cross-lineage ambiguity or contradictory canonical review inputs.
7. **BMG26 — Budget & Materialization Gate**: converts traversal/history/budget exhaustion into explicit `TRUNCATED` or `INDETERMINATE` state; partial work cannot masquerade as complete review.
8. **VAG26 — Verdict Admission Gate**: combines all gate receipts deterministically and is the only M26 path allowed to admit a final HEDS verdict.

## Frozen verdict preconditions
`APPROVED` is admissible only when:
- baseline/candidate lineage is coherent;
- requested review-source coverage is sufficient;
- every discovered impacted semantic item is reviewed or safely current via exact carry-forward;
- all M25-invalidated proof-relevant review items are accounted for;
- no unresolved source/authority conflict remains;
- no unresolved/indeterminate CRITICAL or HIGH finding remains;
- review traversal/history was not silently truncated;
- the review policy binding used by every gate is current and identical.

`CORRECTION_REQUIRED` is used when trusted review determines the candidate violates a required semantic invariant or has an open blocking finding that candidate correction can address.

`BLOCKED` is used for explicit policy/authority/conflict barriers that prevent legal continuation without upstream action.

`INDETERMINATE` is used when mandatory truth is missing, stale or not safely classifiable.

`TRUNCATED` is used when bounded review cannot establish complete impact/closure within admitted limits. `TRUNCATED` can never be promoted to `APPROVED` by presentation or caller preference.

## Gate invariants
- Gate ordering cannot manufacture a different verdict.
- No gate mutates upstream state.
- M26 does not treat test success as semantic approval authority; tests are evidence inputs owned elsewhere.
- M27 assurance may later impose stronger requirements; M26 never pre-approves assurance.
- M28 test impact remains downstream and cannot be used retroactively to redefine M26 semantic impact.
- CRITICAL/HIGH zero is necessary but not sufficient for approval; source/proof/review completeness must also pass.

## HIGH_ASSURANCE proof families
Open HIGH/CRITICAL, resolved exact finding, disappearing finding, stale baseline, branch-mix, conflicting owner, incomplete source set, proof invalidation omitted from review, incomplete dependency closure, truncation at one-over-budget, cancellation between gates, gate-order permutation and resealed gate receipt tamper.

STOP CONDITION: `M26_S04_FROZEN`.
