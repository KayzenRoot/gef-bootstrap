# M61 S03 — Upgrade Failure

Status: `FROZEN`
Mechanism: `UFR61 — Upgrade Failure Runbook`

Diagnose upgrade by candidate/source/preview digest, migration step, snapshot and recovery journal. Distinguish failure before mutation, migration failure, validation failure, lost response and post-commit incompatibility.

Operators first preserve evidence and run read-only compatibility/doctor checks. Rollback is offered only at the grade proven by M50 (`FULL | CONFIG_ONLY | REINSTALL_REQUIRED | NOT_SAFE`).

Acceptance: stale preview never reused, interrupted migration has deterministic restart path, non-reversible steps are explicit, and successful recovery includes target-version validation plus checkpoint/evidence reconciliation.

STOP CONDITION: `M61_S03_FROZEN`.