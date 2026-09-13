# Checkpoint

Status: `READY_FOR_GBS_M06_S01`

- Project: GEF Bootstrap
- Phase: `PRODUCTION_CONSTRUCTION`
- Completed modules: `GBS-M00`, `GBS-M01`, `GBS-M02`, `GBS-M03`, `GBS-M04`, `GBS-M05`
- Active module: `GBS-M06 — Filesystem Safety`
- Active module status: `PLANNING`
- M05-S01..S05: `FROZEN`
- M05 Module Gate: `MODULE_DONE_APPROVED`
- Completed Work Order: `GBS-WO-M05-001`
- Work Order status: `APPROVED_MODULE_DONE`
- Implementation PR: `#103`
- Implementation reviewed head: `0eea9b410755410cb8ae2e34042e6ccb87fae4c6`
- Implementation tree: `d740f3ef4f6ed3ea4a322b8969d8eaf5f5befa65`
- Implementation merge: `3c93e4da5c12bd2ce5ed4ebfb8b809a256815c93`
- CI run: `34735379266`
- M06-S01 Allowed Paths: `PLANNED`
- M06-S02 Overwrite Policy: `PLANNED`
- M06-S03 Symlink Safety: `PLANNED`
- M06-S04 Atomic Writes: `PLANNED`
- Next legal stage: `GBS-M06_S01_ALLOWED_PATHS`
- Production: `107 / 1088 = 9.83%`
- Remaining: `981 / 1088 = 90.17%`
- M05 earned: `20 / 20`
- M06 earned: `0 / 18`
- Denominator change: `NONE`

## Continuation contract
Begin only `GBS-M06-S01 — Allowed Paths` planning. Do not implement filesystem mutation until all M06 planning sessions, Module Gate and a separate admitted Work Order authorize implementation.

M06 now owns the real physical filesystem layer previously represented only through M05 fail-closed ports: approved roots/containment, overwrite policy, symlink/junction/reparse safety and atomic write/replace semantics. M05 transaction semantics remain frozen and are consumed, not rewritten.

## Assurance contract
M06 must preserve Windows/Linux/macOS differences explicitly, default-deny path authority, brownfield unrelated-file preservation, exact target/state binding, secret-safe diagnostics and no opportunistic cleanup. Physical claims require mechanical tests; availability of a path API is not proof of safe containment or atomicity.

Codex remains outside Bootstrap construction absent a separately governed benchmark exception/ADR.

STOP CONDITION: `READY_FOR_GBS_M06_S01`.
