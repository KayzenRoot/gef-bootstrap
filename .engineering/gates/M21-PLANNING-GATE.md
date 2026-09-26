# M21 Planning Gate
Status: `PASSED`
Module: `GBS-M21 — Progress Engine`
Sessions: `4 / 4 FROZEN`
Frozen weight: `18`
Assurance intensity: `HIGH_ASSURANCE`

## Frozen source set
- `planning/modules/area-f-progress-and-estimation/m21-progress-engine/S01-baseline-denominator-and-credit-authority.md`
- `planning/modules/area-f-progress-and-estimation/m21-progress-engine/S02-weighted-calculation-and-hierarchical-rollup.md`
- `planning/modules/area-f-progress-and-estimation/m21-progress-engine/S03-invalidation-retraction-and-drift.md`
- `planning/modules/area-f-progress-and-estimation/m21-progress-engine/S04-snapshot-receipt-and-handoff.md`
- `.engineering/ledgers/M21-PROGRESS-ENGINE-LEDGER-SYNC.md`
- `.engineering/ASSURANCE-INTENSITY.md`

## Required implementation families
1. Baseline/authority: PBC21, DIM21, PAB21, CEG21, WCU21, SDB21, EAB21, DMW21.
2. Calculation/rollup: WPV21, HPG21, ADCL21, PRE21, PCA21, PPP21, CCW21, PQP21.
3. Invalidation/retraction/drift: PIV21, CRT21, PDS21, DDG21, SCQ21, CDG21, PSW21, PRR21.
4. Snapshot/receipt/handoff: PSC21, PIR21, PSD21, PCE21, DPMH21, EBH21, SPH21, PSS21.

Total: `32` frozen mechanisms.

## Authority and conservation checks
- M12 remains Scope/DoD owner.
- M17 remains checkpoint promotion owner.
- M20 consumes delegated progress but cannot recalculate it.
- M22 remains ETA/forecast owner.
- M23 remains project-status owner.
- M24/M25/M27 remain evidence/proof/assurance acceptance owners.
- M43/M45 remain telemetry/baseline-benchmark owners.
- canonical progress math reduces to unique atomic denominator units;
- numerator cannot exceed denominator;
- duplicate references/paths cannot increase earned weight;
- invalidated credit is retractable and historical snapshots remain immutable;
- denominator epoch changes require a governed mutation witness.

## Forbidden shortcuts
Intuitive percentages, activity-based credit, PR/commit/file-count credit, implicit partial credit, optional-track contamination, binary-floating canonical credit math, parent+child double counting, missing-unit omission, stale credit retention, newest-wins split-brain resolution, monotonic-progress assumptions, retroactive history rewriting, downstream recalculation by M20/M22/M23, silent denominator rebaselining and optimistic treatment of incomplete observations.

## HIGH_ASSURANCE acceptance gate
Implementation requires:
- deterministic injected SHA-256 and startup purity;
- exact rational/integer canonical math;
- property-based conservation tests across randomized legal partitions;
- independent calculation oracle fixtures;
- cycle/diamond/alias/double-count attacks;
- partial-credit boundary and allocation-overflow attacks;
- denominator epoch mutation/mix-and-match tests;
- selective invalidation plus conservative widening tests;
- retraction/replay/idempotency tests;
- split-brain progress tests;
- snapshot/receipt/handoff tamper and stale-binding tests;
- legitimate progress regression tests;
- bounded/cancellable graph/query behavior;
- Ubuntu/Windows/macOS focused matrix;
- full repository regression and dependency audit;
- Security CodeQL when triggered;
- exact-head semantic review;
- unresolved CRITICAL `0`, HIGH `0`;
- separate Evidence Bundle and MODULE_DONE promotion.

Planning verdict: `READY_FOR_WORK_ORDER_ADMISSION_REVIEW`.

STOP CONDITION: `M21_PLANNING_FROZEN_READY_FOR_ADMISSION`.
