# GBS-M21-S03 — Invalidation, Retraction & Drift
Status: `FROZEN`
Module weight: `18`
Assurance intensity: `HIGH_ASSURANCE`

## Objective
Make progress reversible and truthful. Credit must be retractable when evidence, scope, DoD, denominator or dependency validity changes, while preserving an audit trail and preventing stale percentages from surviving invalidation.

## Technologies
- **Progress Invalidation Vector (PIV21)**: maps changed validity inputs to directly affected atomic credit units and records invalidation reason/source.
- **Credit Retraction Transaction (CRT21)**: deterministic before/after transaction that removes invalid earned weight without rewriting historical snapshots.
- **Progress Drift Sentinel (PDS21)**: compares current scope/DoD/denominator/evidence bindings with the bindings used by a progress snapshot and marks stale/conflicting dimensions.
- **Denominator Drift Guard (DDG21)**: blocks reuse of progress across denominator epochs unless an explicit governed translation/mutation witness proves compatibility.
- **Stale Credit Quarantine (SCQ21)**: isolates credit whose proof/binding is stale, missing, conflicted or unknown so it cannot remain in the active numerator.
- **Credit Dependency Graph (CDG21)**: bounded dependency graph linking credit units to scope, DoD, evidence/proof and parent rollup bindings for selective invalidation.
- **Progress Split-Brain Witness (PSW21)**: detects divergent successor snapshots or incompatible simultaneous denominator/progress states; no timestamp/newest-wins resolution.
- **Progress Regression Receipt (PRR21)**: explicit receipt for legitimate progress decrease, including retracted units, before/after fractions and reason codes.

## Invariants
1. Progress is not monotonic across invalidation. A valid regression is preferable to preserving stale credit.
2. Evidence/proof invalidation retracts only credit whose validity dependency is affected, unless dependency knowledge is incomplete, in which case invalidation widens conservatively.
3. Scope or DoD changes cannot leave credit silently bound to obsolete completion criteria.
4. Denominator epoch changes invalidate old percentage reuse unless an explicit compatibility/mutation witness exists.
5. Retraction never mutates historical snapshots; it creates a new lineage-bound state.
6. Quarantined credit is visible to diagnostics but contributes zero active earned weight.
7. Split-brain progress states yield `CONFLICT`/`INDETERMINATE`, never arbitrary winner selection.
8. A rollback/reversion of repository work does not itself decide progress loss; the governing evidence/proof validity projection determines credit eligibility.
9. Invalidation reason/source are mandatory and digest-bound.
10. Selective invalidation work is bounded and cancellable; incomplete dependency traversal widens rather than under-invalidates.

## HIGH_ASSURANCE obligations
- accepted-credit invalidation causes exact numerator decrease;
- stale evidence cannot survive through alias/reference indirection;
- incomplete dependency graph widens invalidation;
- denominator epoch mix-and-match fails closed;
- divergent successors produce split-brain witness;
- retraction transaction tamper and replay tests;
- repeated invalidation is idempotent;
- regression receipt independently recomputes before/after fractions.

STOP CONDITION: `M21_S03_FROZEN`.
