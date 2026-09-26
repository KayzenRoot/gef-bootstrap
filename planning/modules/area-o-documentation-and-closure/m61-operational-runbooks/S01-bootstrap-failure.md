# M61 S01 — Bootstrap Failure

Status: `FROZEN`
Mechanism: `BFR61 — Bootstrap Failure Runbook`

Operational decision tree starts with STOP, preserve evidence, identify phase/receipt, run read-only doctor and classify `PRECHECK | STAGE | VERIFY | COMMIT | UNKNOWN`. It provides safe checks, evidence to collect, rollback eligibility and escalation conditions.

Never recommend deleting user work, force-resetting Git, disabling security checks or rerunning a mutating command until ambiguous prior outcome is reconciled.

Acceptance: every M49/M56 bootstrap failure class maps to a stable diagnostic/runbook path, commands are safe/read-only unless explicitly labeled, and exit criteria state `RECOVERED | RETRY_SAFE | MANUAL_ACTION_REQUIRED | INDETERMINATE`.

STOP CONDITION: `M61_S01_FROZEN`.