# GBS-M17-S02 — Atomic Promotion & Compare-And-Swap
Status: `FROZEN_CANDIDATE`

## Objective
Prevent stale agents or concurrent workflows from overwriting newer continuation truth.

## Technologies
- **Semantic Compare-And-Swap (SCAS)**: new NECESSARY promotion requires expected checkpoint semantic identity.
- **Checkpoint Promotion Transaction (CPT)**: new NECESSARY staged validate->propose->audit->commit protocol.
- **Split-Brain Continuation Detector (SBCD)**: new NECESSARY detects divergent candidate successors from one base.
- **Promotion Fence Token (PFT)**: new NECESSARY logical lineage token, not time-based lock authority.
- **Checkpoint Mutation Receipt (CMR)**: records before/after identities, authorization and evidence.

No last-writer-wins. Conflict returns `STALE_BASE` or `DIVERGENT_SUCCESSOR`.

STOP CONDITION: `M17_S02_FROZEN_CANDIDATE`.