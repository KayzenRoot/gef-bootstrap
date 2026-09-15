# GBS-WO-M22-001 — Implement Estimation Engine

Status: `ADMITTED_READY_FOR_IMPLEMENTATION`
Risk: `MEDIUM`
Assurance intensity: `ELEVATED`
Module: `GBS-M22 — Estimation Engine`
Canonical package: `packages/estimation-engine`
Canonical weight: `15`
Planning gate: `.engineering/gates/M22-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#223`
Planning reviewed head: `5a38baadde66afb9af56cc11c29707908571c276`
Planning reviewed tree: `492cc5796a997f5c0d2d0d5c7243c3ee0fa3ed7f`
Planning semantic audit: `5205471859`
Planning freeze merge: `e205c45a5ae3cfd7faa7404fd13a8284a4f2a649`
Admission PR: `#224`
Admission reviewed head: `bea5d53195f29bca7e8b58a4b1903fa6387485ff`
Admission reviewed tree: `a965b400a3d02a39c5881adff77a9890abd3153e`
Admission semantic audit: `5205732573`
Admission merge / sole legal execution base: `5c0b854f81a43afc608e32063a3e70d70cf73ac9`

## Objective
Implement a deterministic, uncertainty-aware Estimation Engine that derives ETA/forecast ranges from admitted M21 progress history and explicit temporal observations without treating production weight as time, fabricating missing baselines, fitting forecasts to desired dates or absorbing progress/status/telemetry ownership.

## Required implementation
Implement all 30 frozen M22 mechanisms:
- EIC22, EAB22, PBA22, OAI22, BSG22, EBM22;
- TPS22, SNW22, TPW22, RTE22, RWV22, DPK22;
- FIE22, SCT22, UWR22, RAV22, FPB22, DCF22;
- FAV22, CBS22, MDS22, RCE22, FRR22, RPG22;
- ESC22, EIR22, ESD22, ECS22, DMH22, SEH22.

## Architecture constraints
1. TypeScript/Node, library-first, startup-pure semantic core.
2. No direct filesystem/network/Git/provider/process/system-clock access in semantic logic.
3. M22 consumes verified M21 project-level estimation baseline handoffs read-only and never recalculates progress.
4. Production weight is not temporal authority. Any work-to-time projection requires admitted empirical temporal observations.
5. Temporal observations and risk modifiers are explicit owner-labeled inputs; M22 validates bindings but never collects telemetry or invents risk truth.
6. Canonical progress/throughput/duration arithmetic uses exact integer/rational representation where authority is decided; binary floating point cannot determine canonical model identity.
7. Insufficient baseline yields `NOT_YET_BASELINED`; stale/conflicting/unknown states remain explicit and cannot be converted to ETA.
8. Throughput windows reject duplicate/replayed observations and preserve exclusions/outliers visibly.
9. Progress regressions are correction events, not negative productivity samples.
10. Denominator epoch transitions require compatible binding; incompatible history is not pooled.
11. Canonical forecast truth is an interval/scenario set with explicit uncertainty, not a naked scalar date.
12. Deadlines/targets cannot alter the forecast model, sample history, interval or confidence.
13. Forecast history is immutable; recalibration creates a new model epoch and revisions emit before/after receipts.
14. Confidence derives only from frozen sufficiency/calibration rules and cannot be caller-upgraded.
15. M20/M23 handoffs are read-only, owner-labeled, snapshot-bound and preserve unavailable states.
16. M22 does not own project status (M23), evidence/proof truth (M24/M25/M27), telemetry (M43), benchmark baselines (M45) or executor performance/critical path (M63).
17. All history/window operations are bounded and cancellable.
18. Injected SHA-256 only; invalid/failing digest capability fails closed.

## Expected package surface
- `packages/estimation-engine/package.json`
- `packages/estimation-engine/tsconfig.json`
- `packages/estimation-engine/src/types.ts`
- bounded S01-S05 implementation units plus `src/public.ts`
- no CLI/rendering/provider/telemetry collection ownership.

## ELEVATED proof families
- authority/baseline construction and tamper tests;
- missing/insufficient baseline no-fabrication tests;
- temporal owner spoofing and cross-lineage mix-and-match attacks;
- exact throughput/duration oracle fixtures;
- duplicate/replay/permutation-invariance tests;
- sparse/outlier/high-dispersion windows;
- denominator epoch transition and regression-history tests;
- interval/scenario ordering and false-precision tests;
- unknown-reserve/risk-binding attacks;
- target/deadline bias firewall tests;
- calibration optimism/pessimism, drift and undercoverage fixtures;
- forecast-vs-actual, recalibration epoch and revision replay tests;
- snapshot/integrity receipt independent recomputation;
- M20 delegated estimation and M23 status-estimation handoff ownership tests;
- stale baseline/observation/model/risk handoff rejection;
- cancellation/budget/digest failure/startup purity;
- Ubuntu/Windows/macOS focused matrix;
- full repository regression and dependency audit;
- Security CodeQL when triggered;
- exact-head semantic review with zero unresolved CRITICAL/HIGH.

## Out of scope
Progress calculation, overall project-status calculation, evidence/proof acceptance truth, telemetry collection, benchmark generation, executor critical-path/performance modeling, Git/provider mutation and operator presentation.

## Evidence and acceptance
Exact admitted base/head/tree; focused test count; arithmetic-oracle evidence; three-OS matrix; full regression; dependency audit; CodeQL when triggered; semantic review; zero unresolved CRITICAL/HIGH; implementation merge; separate Evidence Bundle/MODULE_DONE promotion.

## Admission binding
PR #224 passed exact-head semantic review and merged as `5c0b854f81a43afc608e32063a3e70d70cf73ac9`. This Work Order is admitted. Implementation branches must descend from that merge or a reviewed `main` descendant preserving the admitted contract. No production credit is earned by admission.

STOP CONDITION: `GBS_WO_M22_001_ADMITTED_READY_FOR_IMPLEMENTATION`.
