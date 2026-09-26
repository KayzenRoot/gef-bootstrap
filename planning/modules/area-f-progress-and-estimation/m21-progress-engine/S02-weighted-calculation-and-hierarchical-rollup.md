# GBS-M21-S02 — Weighted Calculation & Hierarchical Rollup
Status: `FROZEN`
Module weight: `18`
Assurance intensity: `HIGH_ASSURANCE`

## Objective
Freeze deterministic progress mathematics from accepted atomic credit units through module, area, phase and project rollups without double counting, floating ambiguity or loss of denominator provenance.

## Technologies
- **Weighted Progress Vector (WPV21)**: exact numerator/denominator vector for a bounded set of atomic credit units with deterministic semantic digest.
- **Hierarchical Progress Graph (HPG21)**: acyclic parent/child graph describing atomic unit → module → area → phase → project aggregation without creating new credit.
- **Anti-Double-Count Ledger (ADCL21)**: proves each atomic credit unit contributes at most once to a requested rollup even when multiple views/reference paths exist.
- **Progress Rollup Engine (PRE21)**: deterministic aggregation of exact integer/rational weights across graph levels.
- **Partial Credit Algebra (PCA21)**: exact handling of explicitly allocated sub-unit credit, including zero/full boundaries and monotonic-within-validity accumulation.
- **Progress Precision Policy (PPP21)**: keeps canonical math exact and applies rounding only at presentation projection, with explicit precision and rounding mode.
- **Coverage & Completeness Witness (CCW21)**: states whether all denominator units required by the requested rollup were observed and classifies missing units instead of treating them as silently zero-complete.
- **Progress Query Plan (PQP21)**: bounded plan selecting the smallest sufficient unit/graph set for project, phase, area or module progress queries.

## Canonical math
For an accepted denominator epoch:

`exactProgress = sum(unique earned atomic weight) / sum(unique maximum atomic weight)`

A displayed percentage is a projection of that exact fraction, never the canonical source value.

## Invariants
1. Every rollup is reducible to unique atomic denominator units.
2. Parent weights cannot create credit in addition to child credit.
3. Duplicate graph paths, aliases or repeated evidence references cannot increase the numerator.
4. Missing required denominator observations yield incomplete/indeterminate completeness state; they cannot be omitted to inflate progress.
5. Exact rational/integer arithmetic is used for canonical weight math; binary floating-point rounding cannot decide credit.
6. Rollup ordering is code-point deterministic and independent of input enumeration.
7. Module/area/phase/project views over the same atomic set reconcile to the same numerator/denominator.
8. Optional/non-production views are separately labeled and cannot be merged into the release-blocking denominator without a governed denominator mutation.
9. Partial sub-unit allocations must sum to no more than their containing unit maximum.
10. Query budgets fail closed with explicit expansion requirement, never with partial data presented as final progress.

## HIGH_ASSURANCE obligations
- property-based conservation tests across random rollup trees;
- diamond/alias graph double-count attacks;
- cycle detection and graph-budget exhaustion;
- exact-fraction/rounding boundary tests;
- missing-unit completeness tests;
- permutation invariance across all rollup levels;
- independent recomputation oracle for accepted fixtures.

STOP CONDITION: `M21_S02_FROZEN`.
