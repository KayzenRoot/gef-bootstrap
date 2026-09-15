# GBS-M22-S05 — Snapshot, Receipt & Handoff
Status: `FROZEN`
Module weight: `15`
Assurance intensity: `ELEVATED`

## Objective
Freeze self-verifying estimation snapshots and owner-safe handoffs so M20 can present ETA/forecast facts and M23 can consume them without recalculating, upgrading confidence or hiding no-estimate states.

## Technologies
- **Estimation Snapshot Capsule (ESC22)**: immutable project/lineage/calibration snapshot binding M21 baseline identity, temporal observation set, throughput model, uncertainty/risk inputs, explicit as-of value, forecast interval/scenarios, availability and confidence.
- **Estimation Integrity Receipt (EIR22)**: independently verifiable receipt binding admitted inputs, model/calibration epoch and recomputed duration/scenario outputs.
- **Estimation Semantic Digest (ESD22)**: presentation-independent semantic identity so wording/date formatting/rounding changes cannot alter estimation truth.
- **Estimation Confidence & Completeness State (ECS22)**: typed availability/confidence surface distinguishing `AVAILABLE`, `NOT_YET_BASELINED`, `STALE`, `CONFLICT`, `INDETERMINATE` and explicit confidence reasons.
- **Delegated Estimation Metric Handoff (DMH22)**: owner-bound M20 projection carrying duration range/scenarios, confidence/availability, source/validity identities and optional injected-asOf completion-range projection.
- **Status Estimation Handoff (SEH22)**: read-only M23 projection carrying forecast interval, deadline delta facts when requested, uncertainty/confidence and revision state without deciding project status.

## Frozen confidence policy
Confidence is a deterministic property of the accepted estimation state, never caller preference.
- Non-`AVAILABLE` estimation state => confidence `UNKNOWN`.
- `LOW`: estimation is AVAILABLE but has only `3-4` accepted independent samples, or throughput dispersion `Q3/Q1 > 2`, or fewer than `3` resolved forecast-vs-actual calibration receipts.
- `MEDIUM`: at least `5` accepted independent samples, exact throughput dispersion `Q3/Q1 <= 2`, no active model-drift/bias conflict, and at least `3` resolved forecast-vs-actual receipts.
- `HIGH`: at least `8` accepted independent samples, exact throughput dispersion `Q3/Q1 <= 3/2`, no active drift/bias/conflict, at least `5` resolved calibration receipts, and at least `4/5` of the most recent applicable resolved forecasts contained the actual outcome inside their canonical interval.
- If multiple rules apply, the **lowest** confidence permitted by any applicable rule wins.
- Zero/undefined Q1, incomplete calibration history, stale receipts or conflicting actuals cannot qualify for MEDIUM/HIGH.

This confidence scale is intentionally conservative. It measures model support/calibration quality, not confidence in project success.

## Handoff rules
1. M20 receives delegated estimation facts only. It cannot recalculate ETA, collapse unavailable states into numbers or upgrade confidence.
2. M23 receives forecast/deadline facts but remains sole owner of overall project-status interpretation.
3. M21 remains source of progress history; M22 snapshots cannot rewrite M21 progress truth.
4. M43/M45/M63 remain telemetry/benchmark/performance owners. Their future outputs may be consumed only through explicit contracts.
5. Absolute dates/timestamps derive only from explicit injected `asOfEpochMs`, never ambient system time.

## Invariants
1. An estimation snapshot cannot be `AVAILABLE` when the Baseline Sufficiency Gate is not available/current.
2. `NOT_YET_BASELINED`, `STALE`, `CONFLICT` and `INDETERMINATE` survive downstream handoff unchanged.
3. Confidence is derived from the frozen sufficiency/dispersion/calibration rules above and cannot be raised by presentation code or caller preference.
4. Receipt verification recomputes canonical outputs against exact input/model/calibration identities.
5. Snapshot reuse fails closed on drift in M21 baseline, observation set, model/calibration epoch, required risk inputs or estimation policy.
6. Semantic digest ignores presentation-only duration/date formatting while binding all material estimation truth.
7. Handoffs are owner-labeled and bind exact snapshot identity.
8. A deadline comparison cannot be emitted unless the forecast snapshot is valid and the deadline input is explicit.
9. Size/budget limits yield typed expansion/failure rather than dropping uncertainty, exclusions or calibration warnings.
10. Ordinary imports and semantic APIs remain startup-pure.
11. SHA-256 is injected and fail-closed; no hidden clock/network/filesystem/provider access exists in the semantic core.
12. Forecast revisions preserve history and cannot mutate prior handoff identities.
13. Confidence can decrease when new samples/calibration expose higher dispersion, drift or miss rate; monotonic confidence is forbidden.
14. A caller cannot substitute a shorter calibration window to manufacture a higher confidence tier without an explicit governed policy change.

## ELEVATED obligations
- independent receipt recomputation;
- snapshot/handoff mix-and-match attacks;
- stale M21 baseline/observation/calibration/risk-binding rejection;
- downstream no-estimate/confidence-upgrade attacks;
- exact confidence threshold boundary tests (`2->3`, `4->5`, `7->8`, dispersion `2`, dispersion `3/2`, coverage `4/5`);
- confidence regression tests when new evidence worsens calibration;
- deadline projection tamper tests;
- semantic-digest presentation invariance;
- revision-history preservation;
- budget/cancellation/startup-purity tests;
- Ubuntu/Windows/macOS focused matrix, full regression, dependency audit and CodeQL when triggered.

STOP CONDITION: `M22_S05_FROZEN`.
