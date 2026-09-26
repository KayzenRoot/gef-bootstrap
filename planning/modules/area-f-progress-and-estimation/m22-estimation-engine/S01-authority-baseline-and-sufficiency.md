# GBS-M22-S01 — Authority, Baseline & Sufficiency
Status: `FROZEN`
Module weight: `15`
Assurance intensity: `ELEVATED`

## Objective
Freeze the authority model for ETA/forecast estimation so M22 can estimate only from current M21 progress history plus explicit owner-labeled temporal observations. Production weight is never treated as time by itself, and missing temporal evidence yields a typed no-estimate state rather than a fabricated duration.

## Ownership boundary
M22 owns deterministic ETA/forecast estimation and its uncertainty/calibration semantics. It does not calculate progress (M21), decide overall project status (M23), decide evidence/proof sufficiency (M24/M25/M27), collect telemetry (M43), define benchmark baselines (M45), calculate executor critical paths/performance thresholds (M63), or format final operator responses (M20/M47).

## Technologies
- **Estimation Intent Capsule (EIC22)**: immutable request binding project/lineage, estimation horizon, applicable progress baseline, injected `asOfEpochMs` identity and requested output family.
- **Estimation Authority Boundary (EAB22)**: declares M22 as `ESTIMATION_ONLY`, forbids progress/status/evidence/telemetry authority and forbids treating production weight as duration without empirical calibration.
- **Progress Baseline Admission Gate (PBA22)**: admits only verified M21 `EstimationBaselineHandoff` snapshots that are project-level, complete, same-lineage and semantically ordered.
- **Temporal Observation Authority Index (OAI22)**: owner-labeled index of elapsed-duration observations supplied by `M43_TELEMETRY` or `EXTERNAL_CANONICAL`; M22 verifies bindings but never collects observations itself.
- **Baseline Sufficiency Gate (BSG22)**: determines `AVAILABLE`, `NOT_YET_BASELINED`, `STALE`, `CONFLICT` or `INDETERMINATE` from sample count, coverage, ordering, freshness and binding agreement.
- **Estimation Binding Manifest (EBM22)**: canonical binding of progress history, temporal observation set, denominator epoch, estimation policy, risk-input identity and calibration epoch.

## Frozen temporal and sufficiency policy
- Canonical elapsed durations are positive safe-integer **milliseconds**.
- Absolute time projection uses an explicit safe-integer `asOfEpochMs`; the process/system clock is never consulted by semantic APIs.
- A baseline requires at least **3 independent accepted positive-progress temporal samples** before `AVAILABLE` is legal.
- `0-2` valid samples are `NOT_YET_BASELINED` regardless of how plausible a caller-provided ETA appears.
- Duplicate/replayed observations do not increase independent sample count.
- Three samples are only minimum availability, not high confidence. Confidence is further constrained by dispersion and later calibration state.

## Invariants
1. M22 cannot estimate from module weight alone; weight-to-time conversion requires accepted empirical observations.
2. M21 progress facts are read-only and cannot be recalculated or upgraded by M22.
3. Temporal observations must be explicit, positive for productive samples, ordered and authority-labeled; ambient wall clock is forbidden.
4. Missing/insufficient samples yield `NOT_YET_BASELINED`, never a guessed ETA.
5. Progress snapshots and temporal observations must share project/lineage and compatible denominator epochs.
6. Progress regressions remain valid historical events and cannot be silently removed from estimation history.
7. Denominator mutation invalidates direct reuse unless an explicit compatible M21 transition/witness is supplied.
8. Conflicting temporal/progress lineage fails closed.
9. As-of time is injected data, not read from process/system clock.
10. Every estimation output remains bound to exact baseline/input identities.
11. The minimum-sample threshold cannot be bypassed by duplicates, resealed observations or caller-provided confidence.
12. Invalid/non-safe-integer temporal values fail closed rather than being rounded into admissible observations.

## ELEVATED obligations
- baseline mix-and-match and cross-lineage attacks;
- insufficient-sample/no-fabrication tests around the `2 -> 3` boundary;
- stale/conflicting observation tests;
- progress-regression history tests;
- denominator-epoch transition tests;
- owner spoofing/resealed-input attacks;
- duplicate/replay independence tests;
- deterministic permutation tests for semantically equivalent observation sets;
- invalid/overflow temporal-value and ambient-clock purity tests.

STOP CONDITION: `M22_S01_FROZEN`.
