# M36 S02 — Transactional Recovery
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **TRJ36 Transaction Journal** append-only intent/prepare/commit/rollback states.
- **CBB36 Commit Boundary Binder** identifies the last safely reversible boundary.
- **IRP36 Idempotent Recovery Planner** emits repeat-safe recovery actions.
- **WAL36 Write-Ahead Intent Ledger** requires durable intent before mutation.
- **RCG36 Recovery Conflict Gate** blocks divergent or ambiguous journals.
- **RTR36 Recovery Transaction Receipt** binds recovery plan to exact state.

Recovery planning is deterministic. Replaying a completed recovery is a no-op; partial/unknown commit state escalates rather than guessing.