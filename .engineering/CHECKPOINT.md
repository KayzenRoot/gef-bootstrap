# Checkpoint

Status: `READY_FOR_GBS_WO_M05_001`

- Project: GEF Bootstrap
- Phase: `PRODUCTION_CONSTRUCTION`
- Completed modules: `GBS-M00`, `GBS-M01`, `GBS-M02`, `GBS-M03`, `GBS-M04`
- Active module: `GBS-M05 — Transactional Apply Engine`
- Active module status: `IMPLEMENTATION_ADMITTED`
- M05-S01..S05: `FROZEN`
- M05 Module Gate: `PLANNED_READY_FOR_IMPLEMENTATION`
- Active Work Order: `GBS-WO-M05-001`
- Work Order status: `ADMITTED`
- Admission PR: `#100`
- Admission reviewed head: `2bb4e043e991f4c4dead8081a473a8fcfccb6e34`
- Admission merge: `2178960f3139aa9c3528257cb0f49ec78d7ad229`
- Next legal stage: `IMPLEMENT_GBS_WO_M05_001`
- Production: `87 / 1088 = 8.00%`
- Remaining: `1001 / 1088 = 92.00%`
- M05 earned: `0 / 20`
- Potential after approved M05 MODULE_DONE: `107 / 1088 = 9.83%`
- Denominator change: `NONE`

## Execution contract
Implement only `GBS-WO-M05-001`. Primary placement is the existing `packages/kernel` boundary, with persisted/interchange contracts in `packages/contracts` only when Architecture A8 requires them. Reuse M01 lifecycle/errors and M02-M04 semantics rather than forking them.

All M06-owned physical filesystem guarantees remain behind explicit injected fail-closed ports. Real path/symlink/case/staging/fsync/atomic-replace logic is still blocked for M06. M29 Git, M30+ provider effects and M36 durable/orphan recovery remain delegated.

## Assurance contract
M05 transaction/recovery semantics require full currently applicable deterministic repository validation plus focused failure injection for plan/dry-run/apply/commit barrier/rollback/idempotency. Exact-head CI and semantic review are required before merge/promotion.

M06 remains blocked. M05 earns no weight until implementation evidence and separate MODULE_DONE promotion. Codex remains outside Bootstrap construction absent a separately governed exception/ADR.

STOP CONDITION: `READY_FOR_GBS_WO_M05_001`.
