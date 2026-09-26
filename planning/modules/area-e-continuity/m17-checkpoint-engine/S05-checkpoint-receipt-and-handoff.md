# GBS-M17-S05 — Checkpoint Receipt & Handoff
Status: `FROZEN_CANDIDATE`

## Objective
Seal checkpoint promotion and provide M18 a deterministic resume input.

## Technologies
- **Checkpoint Admission Receipt (CAR)**: immutable before/after semantic identities, lineage, policy/source bindings, blockers and next legal stage.
- **Resume Readiness Certificate (RRC)**: new NECESSARY states whether enough continuation truth exists for M18 to reconstruct work safely.
- **Checkpoint Freshness Vector (CFV)**: new NECESSARY per-binding validity, never wall-clock freshness alone.
- **Continuation Handoff Contract (CHC)**: M18 may read but not reinterpret canonical checkpoint authority.

Validity: `VALID`, `STALE_BINDING`, `DIVERGENT`, `PARTIAL`, `BLOCKED`, `PROJECT_MISMATCH`, `SCHEMA_UNSUPPORTED`, `INDETERMINATE`.

STOP CONDITION: `M17_PLANNING_COMPLETE_READY_FOR_GATE`.