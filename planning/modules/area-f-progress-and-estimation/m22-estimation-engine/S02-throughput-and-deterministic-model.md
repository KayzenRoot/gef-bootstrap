# GBS-M22-S02 — Throughput & Deterministic Model
Status: `FROZEN`
Module weight: `15`
Assurance intensity: `ELEVATED`

## Objective
Freeze deterministic empirical throughput modeling from admitted progress/time observations without pretending production weight is intrinsically temporal or allowing outliers/ordering to manufacture precision.

## Technologies
- **Temporal Progress Sample (TPS22)**: exact before/after M21 progress identities plus positive safe-integer elapsed milliseconds, denominator compatibility and source binding.
- **Sample Normalization Witness (SNW22)**: canonicalizes units/order, rejects zero-duration positive-work impossibilities, detects duplicate/replayed samples and records exclusions.
- **Throughput Window (TPW22)**: bounded, lineage/epoch-bound sample window preserving immutable observation identities and explicit window policy.
- **Robust Throughput Estimator (RTE22)**: deterministic robust center/range over accepted throughput samples using frozen integer/rational arithmetic and deterministic nearest-rank statistics, not floating authority.
- **Remaining Work Vector (RWV22)**: exact M21-derived remaining fraction/weight identity for the current project baseline without reinterpreting its weight as time.
- **Duration Projection Kernel (DPK22)**: converts remaining work through the admitted empirical throughput model into a duration distribution/range only when BSG22 says estimation is available.

## Canonical estimation principle
Observed throughput is derived from actual progress delta divided by explicit elapsed milliseconds. Duration projection is then based on current remaining work divided by an admitted throughput model. Weight affects ETA only through empirically observed throughput history.

## Frozen robust model policy
- Each accepted sample carries an exact positive work delta and positive integer elapsed milliseconds.
- Canonical sample throughput is represented as an unreduced or reduced exact rational work-per-millisecond value with deterministic digest.
- Accepted samples are ordered by exact cross-multiplication, never floating-point conversion.
- Robust model uses deterministic nearest-rank quartiles over the sorted sample throughput set: lower `Q1`, base `Q2/median`, upper `Q3` throughput.
- Duration interval reverses throughput direction: faster `Q3` yields lower duration bound, median yields base duration, slower `Q1` yields upper duration bound.
- Duration conversion rounds conservatively to whole milliseconds: lower/base/upper projected duration use deterministic integer ceiling where fractional milliseconds remain, preventing optimistic truncation.
- No sample is silently removed as an outlier. Exclusion requires explicit frozen policy/reason and remains visible in the normalization witness.

## Invariants
1. All canonical progress and throughput math is exact integer/rational; binary floating point cannot decide model authority.
2. A sample with no valid positive elapsed duration cannot establish throughput.
3. Negative elapsed duration, impossible progress ordering or project/lineage mismatch fails closed.
4. Duplicate/replayed samples contribute at most once.
5. Samples spanning incompatible denominator epochs are not merged without explicit translation compatibility.
6. A progress regression does not become negative productivity; it is preserved as a separate correction event and invalidates naive monotonic deltas.
7. Robust statistics and quantile ordering are deterministic across input permutations.
8. Sample windows are bounded/cancellable and expose excluded/outlier samples rather than silently deleting them.
9. Remaining-work identity comes from M21 and cannot be locally recomputed from narrative/project activity.
10. Zero remaining work may produce zero remaining duration only on a current COMPLETE project baseline, not on incomplete/stale state.
11. Q1/Q2/Q3 selection uses exact throughput ordering and cannot depend on locale, platform or floating rounding.
12. Conservative duration rounding cannot shorten the canonical bound below the exact rational projection.

## ELEVATED obligations
- independent arithmetic-oracle fixtures;
- deterministic nearest-rank quartile/median boundary tests for odd/even sample counts;
- duplicate/replay attacks;
- outlier and sparse-window tests;
- denominator mutation samples;
- zero/negative/impossible-duration attacks;
- exact cross-multiplication ordering tests with close ratios;
- conservative integer-ceiling duration tests;
- permutation invariance and bounded-window stress tests.

STOP CONDITION: `M22_S02_FROZEN`.
