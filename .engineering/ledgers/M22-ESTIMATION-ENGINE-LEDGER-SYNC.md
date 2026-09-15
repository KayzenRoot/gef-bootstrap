# M22 Estimation Engine — Ledger Sync
Status: `FROZEN`
Module: `GBS-M22 — Estimation Engine`
Frozen weight: `15`
Assurance intensity: `ELEVATED`
Planning sessions: `5 / 5 FROZEN`

## Canonical basis
M00/M20 require ETA/confidence only when valid, with explicit unavailable states instead of fabricated values. M21 now supplies exact, read-only project progress history to M22. The Backlog explicitly states that production weights are burden, not days. M22 therefore owns empirical ETA/forecast estimation from admitted progress/time observations, not arbitrary weight-to-time conversion.

## Frozen M22 mechanisms
- S01 authority/baseline/sufficiency: `EIC22`, `EAB22`, `PBA22`, `OAI22`, `BSG22`, `EBM22`.
- S02 throughput/model: `TPS22`, `SNW22`, `TPW22`, `RTE22`, `RWV22`, `DPK22`.
- S03 uncertainty/scenarios/risk: `FIE22`, `SCT22`, `UWR22`, `RAV22`, `FPB22`, `DCF22`.
- S04 calibration/drift/revision: `FAV22`, `CBS22`, `MDS22`, `RCE22`, `FRR22`, `RPG22`.
- S05 snapshot/receipt/handoff: `ESC22`, `EIR22`, `ESD22`, `ECS22`, `DMH22`, `SEH22`.

Total frozen M22 mechanisms: `30`.

## Ownership constraints
- M21 remains Progress Engine owner; M22 consumes its exact project-level baseline handoff read-only.
- M23 remains overall Project Status owner and may consume M22 forecast facts later.
- M24/M25/M27 remain evidence/proof/assurance owners.
- M43 remains telemetry/observation collection owner.
- M45 remains benchmark/baseline-comparison owner.
- M63 remains executor-performance and execution-critical-path owner.
- M20/M47 remain response/operator presentation owners.

Until future owner modules exist, M22 may accept only explicit injected owner-labeled temporal/risk projections or fixtures matching its frozen contracts. It must not simulate those owners.

## Technology handling
No existing Technology Ledger candidate is silently promoted into M22 merely to increase mechanism count. The 30 M22 mechanisms are canonical module-local technologies frozen by S01-S05 because they directly reduce ETA fabrication, false precision, calibration drift, replay risk or downstream ownership leakage. Their detailed contracts live in the Source Pack; this ledger preserves identity and routing.

## ELEVATED additions
Compared with STANDARD_PLUS, M22 requires deeper cross-module baseline contracts, explicit staleness/denominator-epoch handling, revision/replay protection, calibration drift/bias analysis, deadline-bias resistance, broader edge-case coverage and immutable forecast-history proofs.

## Core truth rules
- production weight is never temporal authority by itself;
- no admissible temporal baseline means `NOT_YET_BASELINED`;
- canonical forecasts are uncertainty-aware ranges/scenarios;
- target dates cannot bend the model;
- past forecasts are immutable;
- systematic miss patterns must affect calibration/confidence rather than be hidden;
- downstream modules cannot upgrade M22 no-estimate/confidence states.

STOP CONDITION: `M22_LEDGER_SYNC_FROZEN`.
