# GBS-M18-S02 — State Rehydration & Minimal Read
Status: `FROZEN_CANDIDATE`

## Objective
Rehydrate only the state needed for the next legal action.

## Technologies
- **Resume Minimum Sufficient Context (RMSC)**: new NECESSARY compiles continuation-specific MSC from M17 pointers plus M14 rules.
- **Hot-State Rehydrator (HSR)**: new NECESSARY loads active obligations/blockers before historical detail.
- **Resume Read Plan (RRP18)**: new NECESSARY deterministic ordered pointer plan with stop conditions.
- **Negative Rehydration Cache (NRC)**: new IMPORTANT validity-bound known absences prevent repeated searches.
- **Context Temperature Map (CTM)**: new IMPORTANT classifies active/warm/cold references without granting authority.

Resume broadens reads only when sufficiency proof fails or safety gate triggers.

STOP CONDITION: `M18_S02_FROZEN_CANDIDATE`.