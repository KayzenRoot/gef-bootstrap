# M56 S04 — Upgrade

Status: `FROZEN`
Mechanism: `UEP56 — Upgrade End-to-End Path`

Exercise M50 from an older supported fixture through candidate resolution, compatibility, migration DAG, preview binding, snapshot, apply, validate, doctor and recovery/rollback. Include no-op, supported upgrade, incompatible candidate, migration failure and interrupted upgrade.

Preview digest must bind the exact source/candidate/migration set; changed source invalidates apply. Non-reversible migrations must be labeled before execution and retain preserved state according to policy.

Acceptance: successful upgrade reaches deterministic target; failure never masquerades as success; rollback grade is evidence-backed; post-upgrade second run is idempotent.

STOP CONDITION: `M56_S04_FROZEN`.