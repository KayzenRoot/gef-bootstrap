# M56 S03 — Interrupted Project

Status: `FROZEN`
Mechanism: `IRP56 — Interrupted Run Recovery Path`

Inject interruption at every mutating lifecycle boundary, including staged files, Git commit preparation, checkpoint publication and simulated remote operations. Restart must consume recovery journals/evidence rather than guess prior completion.

Scenarios distinguish pre-commit rollback, committed-but-response-lost reconciliation, partial local artifact publication and stale checkpoint. Recovery integrates M36 and never claims rollback beyond recorded reversibility.

Acceptance: restart is deterministic, no duplicate mutations, preserved user state, explicit `RECOVERED | MANUAL_ACTION_REQUIRED | INDETERMINATE`, and evidence shows the exact interruption/recovery boundary.

STOP CONDITION: `M56_S03_FROZEN`.