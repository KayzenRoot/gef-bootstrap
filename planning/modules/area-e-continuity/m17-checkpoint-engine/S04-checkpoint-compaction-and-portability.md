# GBS-M17-S04 — Checkpoint Compaction & Portability
Status: `FROZEN_CANDIDATE`

## Objective
Keep checkpoints small, portable and sufficient without losing auditability.

## Technologies
- **Continuation Minimum Sufficient State (CMSS)**: new NECESSARY analogue of MSC for resume state.
- **Historical Pointer Compaction (HPC)**: new NECESSARY replaces repeated historical payload with immutable references.
- **Checkpoint Portability Envelope (CPE)**: new NECESSARY declares schema/version/project bindings and unsupported capabilities.
- **Cold-History Eviction Map (CHEM)**: new IMPORTANT moves superseded detail out of hot continuation while retaining retrievability.
- **Checkpoint Size Guard (CSG)**: new NECESSARY bounded node/reference budgets.

Compaction may remove redundancy, never authority/evidence required for next legal action.

STOP CONDITION: `M17_S04_FROZEN_CANDIDATE`.