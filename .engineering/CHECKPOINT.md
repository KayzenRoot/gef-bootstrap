# Checkpoint

Status: `READY_TO_COMPILE_GBS_WO_M05_001`

- Project: GEF Bootstrap
- Phase: `PRODUCTION_CONSTRUCTION`
- Completed modules: `GBS-M00`, `GBS-M01`, `GBS-M02`, `GBS-M03`, `GBS-M04`
- Active module: `GBS-M05 — Transactional Apply Engine`
- Active module status: `PLANNED_READY_FOR_IMPLEMENTATION`
- M05-S01..S05: `FROZEN`
- M05 Module Gate: `PLANNED_READY_FOR_IMPLEMENTATION`
- M05 Gate PR: `#98`
- M05 Gate reviewed head: `13d71b65879078fc7e36a00107d5bfbaf29947d6`
- M05 Gate merge: `fb8d81ec1498ed21098d40632db3283c147f6f64`
- Active Work Order: `NONE`
- Active Work Order status: `NONE`
- Next legal stage: `COMPILE_GBS_WO_M05_001`
- Production: `87 / 1088 = 8.00%`
- Remaining: `1001 / 1088 = 92.00%`
- M05 earned: `0 / 20`
- Potential after approved M05 MODULE_DONE: `107 / 1088 = 9.83%`
- Denominator change: `NONE`

## Approved implementation boundary
M05 may now compile exactly one bounded implementation Work Order for the provider-neutral logical transaction engine. Primary implementation placement is `packages/kernel`, with `packages/contracts` used only for persisted/interchange/public machine contracts when required.

M06-owned filesystem containment/symlink/case/staging/fsync/atomic-replace semantics must remain behind explicit injected ports and fail closed when unavailable. M29 Git effects, M30+ hosted-provider effects and M36 durable/orphan recovery remain delegated. No unsafe fallback may substitute for an unavailable owner capability.

## Work Order rule
Gate approval does not itself authorize code changes. `GBS-WO-M05-001` must be compiled, exact-head reviewed, merged/admitted and reflected in the checkpoint before implementation begins.

M05 implementation evidence must include broad currently applicable deterministic validation plus focused transaction/interruption/rollback/idempotency proof, exact-head CI and semantic review. Planning/gate readiness earns no production weight.

Codex remains unauthorized for Bootstrap construction absent a separately admitted benchmark exception/ADR.

STOP CONDITION: `READY_TO_COMPILE_GBS_WO_M05_001`.
