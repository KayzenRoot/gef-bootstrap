# M49 S01 — Windows
Status: FROZEN

**WIP49 Windows Install Plan** validates architecture/runtime, chooses user-scoped install by default, uses portable path rules and staged atomic publication. PATH mutation is explicit/idempotent and reversible. Existing installs/configs are preserved until integrity verification succeeds; no admin privilege is assumed.

Acceptance: clean/reinstall/idempotency, spaces/Unicode paths, no elevation by default, rollback receipt, Windows CI smoke.