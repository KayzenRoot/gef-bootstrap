# GBS-M17-S01 — Checkpoint State Model
Status: `FROZEN_CANDIDATE`

## Objective
Make continuation state a typed immutable artifact rather than conversational memory.

## Technologies
- **Canonical Continuation Capsule (CCC)**: new NECESSARY state containing project/module/stage, admitted work, source/profile/policy bindings, evidence pointers, unresolved blockers and next legal action.
- **Checkpoint State Vector (CSV)**: new NECESSARY per-domain maturity/status rather than one ambiguous status string.
- **Authority Snapshot Index (ASI)**: new NECESSARY references authoritative source identities/fingerprints without copying full content.
- **Continuation Invariant Set (CIS)**: new NECESSARY assertions that must hold before a checkpoint is admissible.

Checkpoint does not manufacture progress; M21 owns progress accounting. It records evidence-bound continuation truth.

STOP CONDITION: `M17_S01_FROZEN_CANDIDATE`.