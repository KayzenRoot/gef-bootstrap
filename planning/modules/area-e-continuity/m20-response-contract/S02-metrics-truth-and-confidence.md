# GBS-M20-S02 — Metrics Truth & Confidence
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Define how progress, ETA, completion, current-phase and other metrics may appear in responses without allowing M20 to estimate, interpolate or fabricate values.

## Technologies
- **Delegated Metric Claim (DMC20)**: typed metric projection whose value, unit, owner module, exact source identity and observation/baseline binding are explicit.
- **Metric Ownership Matrix (MOM20)**: deterministic map preventing response code from computing metrics owned by M21 Progress, M22 Estimation, M23 Project Status or other canonical producers.
- **Baseline Availability Witness (BAW20)**: proof that a numeric/range estimate has an applicable baseline; absence produces `NOT_YET_BASELINED` rather than a guessed value.
- **Confidence Envelope (CE20)**: normalized confidence state for externally produced estimates, preserving owner-provided range/confidence rather than inferring certainty from formatting.
- **Unavailable Metric Algebra (UMA20)**: explicit `AVAILABLE`, `NOT_YET_BASELINED`, `NOT_APPLICABLE`, `STALE`, `CONFLICT`, `UNKNOWN` states with no implicit numeric fallback.

## Invariants
1. M20 never computes progress, ETA or project-status values.
2. A metric may be emitted as numeric/range only when its owning producer and required baseline/validity bindings are present.
3. Missing baseline cannot become `0`, `100`, a date, duration or synthetic percentage.
4. Confidence is never upgraded by M20.
5. Stale/conflicting metrics retain typed non-success state and provenance.
6. Formatting/rounding may only follow an explicit owner-provided presentation precision or lossless deterministic rule.

## Required tests
Owner mismatch, missing baseline, stale metric, conflicting values, unknown state, confidence downgrade/preservation, no-fabrication property and deterministic ordering.

STOP CONDITION: `M20_S02_FROZEN`.
