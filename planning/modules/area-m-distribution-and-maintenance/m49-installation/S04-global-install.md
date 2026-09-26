# M49 S04 — Global Install
Status: FROZEN

**GIR49 Global Install Receipt** unifies platform plans: source/version digest, target, files, environment changes, previous-state preservation and verification result. Global/system-wide install is a separate elevated mode, never the default. Install is transactional: PRECHECK → STAGE → VERIFY → COMMIT, with rollback on pre-commit failure.

Acceptance: deterministic plan/dry-run, integrity before commit, idempotency, preservation/rollback, machine-readable receipt.