# GBS-M18-S03 — Drift Reconciliation & Safe Re-entry
Status: `FROZEN_CANDIDATE`

## Objective
Detect what changed while execution was paused and re-enter only when continuation remains valid.

## Technologies
- **Resume Drift Vector (RDV)**: new NECESSARY compares checkpoint bindings with current source/profile/policy/work state.
- **Safe Re-entry Gate (SRG)**: new NECESSARY blocks continuation on authority ambiguity, invalidated evidence, incompatible policy or stale work base.
- **Delta Rehydration Graph (DRG)**: new NECESSARY reloads only nodes affected by drift.
- **Orphan Work Detector (OWD)**: new NECESSARY identifies work/branches/evidence no longer reachable from canonical continuation.
- **Resume Conflict Quarantine (RCQ)**: new NECESSARY preserves divergent state without silently adopting it.

No newest-wins reconciliation. Resolution returns to the owning module/authority.

STOP CONDITION: `M18_S03_FROZEN_CANDIDATE`.