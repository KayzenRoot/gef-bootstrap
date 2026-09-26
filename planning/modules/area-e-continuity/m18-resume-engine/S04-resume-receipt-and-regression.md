# GBS-M18-S04 — Resume Receipt & Regression
Status: `FROZEN_CANDIDATE`

## Objective
Emit a replayable resume result and detect continuity regressions.

## Technologies
- **Resume Receipt (RR)**: immutable checkpoint, RIC, LCP, RMSC, drift, policy and next-action bindings.
- **Resume Semantic Digest (RSD)**: new NECESSARY normalized digest for deterministic replay.
- **Continuity Loss Sentinel (CLS)**: new NECESSARY detects missing blockers, lost obligations, authority downgrade, unexplained stage jump and reintroduced stale state.
- **Resume Efficiency Receipt (RER)**: new IMPORTANT records reads/expansions/cache hits for later M43/M45/M63 analysis without making performance an authority signal.
- **Safe Handback Contract (SHC)**: resumed state exposes exactly one legal next stage or explicit blocked alternatives.

Validity: `READY`, `EXPANSION_REQUIRED`, `DRIFT_REQUIRES_REPLAN`, `POLICY_BLOCKED`, `LINEAGE_MISMATCH`, `PROJECT_MISMATCH`, `INDETERMINATE`.

STOP CONDITION: `M18_PLANNING_COMPLETE_READY_FOR_GATE`.