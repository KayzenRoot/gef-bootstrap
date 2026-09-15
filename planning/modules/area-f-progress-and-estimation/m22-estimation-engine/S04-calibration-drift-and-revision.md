# GBS-M22-S04 — Calibration, Drift & Revision
Status: `FROZEN`
Module weight: `15`
Assurance intensity: `ELEVATED`

## Objective
Freeze an estimation feedback loop that measures forecast error, detects persistent optimism/pessimism or model drift, and creates auditable recalibration/revision epochs without rewriting historical forecasts.

## Technologies
- **Forecast-vs-Actual Variance Receipt (FAV22)**: immutable comparison between a historical forecast interval/scenario identity and later owner-labeled actual elapsed/progress observation.
- **Calibration Bias Sentinel (CBS22)**: deterministic detector for repeated directional miss patterns such as systematic optimism, pessimism or interval undercoverage.
- **Model Drift Sentinel (MDS22)**: detects material change in throughput distribution, denominator/progress regime, observation policy or error profile that makes the current calibration stale.
- **Recalibration Epoch (RCE22)**: explicit model-version epoch created after governed drift/bias trigger, binding the exact admitted sample window and calibration policy used thereafter.
- **Forecast Revision Receipt (FRR22)**: before/after receipt explaining a forecast revision, changed input/model bindings, interval impact and reason codes without erasing the prior forecast.
- **Revision & Replay Guard (RPG22)**: prevents duplicate actual observations, repeated recalibration, replayed revision events and branch-mix revisions from manufacturing model history.

## Invariants
1. Historical forecast snapshots are immutable and remain auditable after recalibration.
2. Actual outcomes are explicit owner-labeled observations; M22 does not self-assert completion time.
3. Forecast error is computed against the exact forecast version that existed before the actual outcome became known.
4. Backfilled actuals cannot retroactively mutate or improve the historical forecast.
5. Repeated directional error may lower confidence/widen intervals or trigger recalibration; it cannot be ignored to preserve a prettier ETA.
6. Recalibration creates a new epoch/model identity. Old and new models cannot be silently mixed.
7. Model drift may be caused by throughput-regime change, denominator transition, observation-policy change or calibration degradation; each reason is explicit.
8. Revisions bind before/after forecast identities and reasons; newest-wins without lineage proof is forbidden.
9. Replayed actual/revision events are idempotent or rejected and cannot count twice.
10. Conflicting actual observations yield `CONFLICT`/`INDETERMINATE`, never arbitrary winner selection.
11. A stale current M21 baseline invalidates forecast reuse before any recalibration output is emitted.
12. Calibration history is bounded/cancellable; truncation must be explicit and cannot masquerade as complete historical evidence.

## ELEVATED obligations
- systematic optimism/pessimism fixtures;
- interval undercoverage and regime-shift tests;
- backfill/no-retroactive-rewrite attacks;
- revision branch/split-brain tests;
- replay/idempotency tests;
- recalibration-epoch mix-and-match tests;
- conflicting actual-observation tests;
- bounded-history and cancellation tests.

STOP CONDITION: `M22_S04_FROZEN`.
