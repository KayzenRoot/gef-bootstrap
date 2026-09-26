# GBS-M17-S03 — Invalidation & Rollback
Status: `FROZEN_CANDIDATE`

## Objective
Downgrade only checkpoint claims invalidated by changed evidence/authority while preserving valid history.

## Technologies
- **Checkpoint Dependency Graph (CDG)**: new NECESSARY links claims to source/policy/evidence/work-order inputs.
- **Selective Continuation Invalidation (SCI)**: new NECESSARY invalidates dependent state, conservative when dependency knowledge is incomplete.
- **Checkpoint Rollback Pointer (CRP)**: new NECESSARY references last admissible predecessor; rollback is a new audited promotion, never history rewrite.
- **Stale Claim Quarantine (SCQ)**: new NECESSARY retains invalidated claims for audit but excludes them from active continuation.
- **Continuity Regression Sentinel (CRS17)**: detects unexplained maturity/progress/authority rollback.

STOP CONDITION: `M17_S03_FROZEN_CANDIDATE`.