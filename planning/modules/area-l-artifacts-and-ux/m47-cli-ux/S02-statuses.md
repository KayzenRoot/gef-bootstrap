# M47 S02 — Statuses
Status: FROZEN

**OSS47 Operator Status Schema** uses canonical states from owning modules and never invents friendlier success labels. `READY`, `BLOCKED`, `CORRECTION_REQUIRED`, `INDETERMINATE`, `TRUNCATED`, `MODULE_DONE` and other owner-defined states render with text/icon plus optional color.

Status displays include freshness/context and evidence availability. Stale state is visibly marked and cannot masquerade as current.

Acceptance: owner-state fidelity, stale marking, no color-only meaning, evidence linkage, machine-readable status parity.