# M50 S04 — Rollback
Status: FROZEN

**URJ50 Upgrade Recovery Journal** records preserved state, completed migration steps, artifact digests and commit point. Rollback is capability-graded `FULL | CONFIG_ONLY | REINSTALL_REQUIRED | NOT_SAFE`; the engine never promises reversal it cannot prove. Recovery is idempotent and integrates M36 semantics.

Acceptance: crash/interruption journal, honest rollback grade, restored-state verification, idempotent recovery, no destructive cleanup before verification.