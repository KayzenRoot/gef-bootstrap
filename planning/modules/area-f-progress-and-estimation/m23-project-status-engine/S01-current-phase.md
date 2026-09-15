# GBS-M23-S01 — Current Phase
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Freeze M23 as the sole deterministic owner of overall project-status interpretation while keeping checkpoint/resume, progress, estimation, evidence and assurance truth in their existing owner modules. M23 combines verified read-only facts; it never manufactures upstream truth.

## Ownership boundary
M23 owns project lifecycle status, schedule-health interpretation, continuation-readiness interpretation, status transitions/revisions and status snapshots/handoffs. It does **not** own checkpoint promotion (M17), resume/re-entry truth (M18), progress calculation (M21), ETA/forecast calculation (M22), evidence/proof/assurance acceptance (M24/M25/M27), telemetry (M43), benchmark baselines (M45), executor performance (M63), Git/provider mutation (M29+) or response rendering (M20/M47).

## Technologies
- **Status Intent Capsule (SIC23)**: immutable project/lineage request binding requested status dimensions, applicable upstream identities and explicit `asOfEpochMs` only when schedule interpretation is requested.
- **Status Authority Boundary (SAB23)**: declares `PROJECT_STATUS_ONLY` authority and hard-false capabilities for checkpoint mutation, resume decisions, progress/ETA calculation, evidence acceptance, telemetry collection and response rendering.
- **Continuation Admission Gate (CAG23)**: admits M17 continuation/checkpoint facts only when project, lineage, checkpoint, readiness and next-legal-action identities agree and the canonical checkpoint is verifiable.
- **Resume Admission Gate (RAG23)**: admits optional M18 handback facts without making resume mandatory for ordinary status calculation; stale/conflicting resume state can constrain readiness but cannot rewrite M17 truth.
- **Progress Handoff Gate (PHG23)**: admits only verified M21 `StatusProgressHandoff` project snapshots and preserves exact fraction, completeness and regression visibility read-only.
- **Estimation Handoff Gate (EHG23)**: admits only verified M22 `StatusEstimationHandoff` facts and preserves forecast availability, confidence, deadline comparison and revision identity without recalculation.

## Frozen status dimensions
M23 exposes three distinct canonical dimensions. They must never be collapsed into one ambiguous label.

### Lifecycle status
`NOT_STARTED | IN_PROGRESS | AWAITING_ACCEPTANCE | BLOCKED | RECOVERY_REQUIRED | COMPLETE | INDETERMINATE | CONFLICT`

### Schedule health
`NOT_APPLICABLE | UNKNOWN | ON_TRACK | AT_RISK | LATE`

### Continuation readiness
`NOT_APPLICABLE | READY | WAITING | REPLAN_REQUIRED | BLOCKED | RECOVERY_REQUIRED | UNKNOWN | CONFLICT`

## Frozen injected-owner vocabulary
Generic injected facts cannot impersonate native M17/M18/M21/M22 sources.
- Completion outcome owner: `EXTERNAL_CANONICAL | M27_ASSURANCE`.
- Explicit external status-condition owner: `EXTERNAL_CANONICAL | M27_ASSURANCE`.
- M17/M18-derived blocker/readiness/recovery facts enter only through their verified native handoffs/contracts, never through a generic injected owner string.
- `M27_ASSURANCE` is a forward-compatible owner label only; until M27 exists, M23 cannot simulate it. Current standalone completion/condition authority is `EXTERNAL_CANONICAL` with explicit source and validity bindings.

## Source rules
1. M17 continuation/checkpoint truth is required for canonical lifecycle/readiness interpretation.
2. M21 project progress truth is required for `NOT_STARTED`, `IN_PROGRESS`, `AWAITING_ACCEPTANCE` or `COMPLETE` derivation.
3. M22 estimation truth is optional for lifecycle status and required only when schedule health is requested from forecast/deadline facts.
4. M18 resume facts are optional unless a resume/re-entry decision exists for the same checkpoint lineage.
5. Completion acceptance is an explicit owner-labeled canonical input from the frozen completion-owner vocabulary; M21 `100%` alone never authorizes `COMPLETE`.
6. Explicit external status-condition facts may only use the frozen external-condition owner vocabulary and carry `WARNING`, `BLOCKING`, `RECOVERY` or `CONFLICT` classification plus source/validity identities.
7. All upstream handoffs are read-only and snapshot-bound.

## Invariants
1. M23 never recalculates M21 progress or M22 forecast values.
2. M23 cannot promote checkpoint state or change M17 next legal action.
3. `100%` progress is insufficient for `COMPLETE` without explicit completion authority.
4. Missing ETA never makes lifecycle status `BLOCKED` by itself.
5. Schedule pressure never changes lifecycle truth or progress.
6. A stale/conflicting mandatory source cannot be silently treated as current.
7. Cross-project/cross-lineage handoff combinations fail closed.
8. A resume handback from a different checkpoint cannot constrain current readiness.
9. Presentation wording has no authority over canonical status identities.
10. Semantic APIs are startup-pure and receive time only as explicit data.
11. A generic injected fact cannot claim to be M17/M18/M21/M22 authority.

## STANDARD_PLUS obligations
- owner spoofing and cross-lineage mix-and-match tests;
- rejection of generic facts spoofing native M17/M18/M21/M22 owners;
- M17/M21 mandatory-source absence and staleness tests;
- optional M18/M22 absence tests;
- 100%-progress-without-completion-authority tests;
- injected-time/startup-purity tests;
- handoff tamper and replay tests;
- deterministic permutation tests for equivalent input sets.

STOP CONDITION: `M23_S01_FROZEN`.
