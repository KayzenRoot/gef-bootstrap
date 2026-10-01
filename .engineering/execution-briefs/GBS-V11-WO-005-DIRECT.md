# Direct Execution Brief — GBS-V11-WO-005

State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`
Authority: `ADR-0003-D3`
Assurance: `ELEVATED`
Work Order: `.engineering/work-orders/GBS-V11-WO-005.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-005.json`
Implementation branch: `feat/1.1/wo-005-execution-capsule`

## EXACT BASE

Implementation branch must be created from the exact governance/admission merge on `release/1.1`, whose parent line begins from WO-004 merge `ab820243b6c44e2ce9c5b747a7a6a4c688d90fed`.

If `release/1.1` advances before branch creation, STOP as `STALE_CONTEXT` and regenerate the Context Lock.

## MINIMUM READ SET

1. WO-005 Work Order
2. WO-005 Context Lock
3. current Checkpoint
4. ADR-0003
5. ADR-0005
6. V1.1 Execution Capsule Contract
7. V1.1 Test Matrix CTX-DET rows
8. Executor Acceleration Contract
9. M14 public/types + S05 handoff
10. M15 public/types/compile/utils
11. existing execution-capsule JSON Schema

Do not begin with repository-wide discovery.

## IMPLEMENTATION SHAPE

Extend `@gef-bootstrap/execution-pack-compiler`. Prefer:
- `src/execution-capsule.ts`
- optional `src/execution-capsule-types.ts`
- `src/public.ts` export
- focused tests

Do not add a new planner or context authority.

## COMPILER RULES

- Pure deterministic function.
- Injected SHA-256 through existing `OperationOptions`.
- No clock/filesystem/Git/network/process/provider observation.
- Consume already-admitted M14 + M15 truth.
- Canonicalize semantically unordered arrays by code point.
- Same semantic inputs => byte-identical canonical output and same fingerprint.
- Volatile-only metadata cannot change semantic fingerprint.
- Production branch mutation is structurally refused.
- `searchSuppressed` always true for compiled capsules.
- Proof references always carry `manufacturesProductionCredit:false`.
- L5 selection forces `finalSweepRequired:true`.
- Missing constraints/escalation/dependency closure/bindings fail closed.

## STATE MAPPING

- valid/sufficient/current -> `COMPILED` + `SUFFICIENT`
- insufficient/unknown closure -> `INDETERMINATE` + `INSUFFICIENT`
- stale bindings or SEED_RECOMPILE_REQUIRED -> `STALE`
- conflict/forbidden mutation -> `REJECTED`

Drift:
- NONE -> retain compiled
- LOCAL_COMPATIBLE -> retain compiled
- SEED_RECOMPILE_REQUIRED -> STALE / RECOMPILE
- CONTEXT_EXPANSION_REQUIRED -> INDETERMINATE / EXPAND_CONTEXT
- CONFLICT -> REJECTED / HALT

## MANDATORY TESTS

Implement exact names/IDs:
- CTX-DET-01 repeat compilation byte-identical
- CTX-DET-02 semantic change changes fingerprint
- CTX-DET-03 volatile-only change does not change fingerprint
- CTX-DET-04 insufficient certainty cannot compile
- CTX-DET-05 all four states covered
- CTX-DET-06 drift mapping
- CTX-DET-07 empty constraints/escalation rejected
- CTX-DET-08 productionBranchTouched true rejected

Also:
- permutations of unordered arrays are identical;
- M14 stale/mismatch blocks;
- M15 receipt/pack mismatch blocks;
- allowed/forbidden write intersection blocks;
- dependency unknown fails closed;
- proof production credit cannot become true;
- L5 cannot disable final sweep;
- startup/public export has no side effects;
- existing M14/M15 suites remain green.

## EVIDENCE

Create `.engineering/evidence/GBS-V11-WO-005-EVIDENCE.md` and bind all proofs to exact head.

## HARD BOUNDARIES

Do not:
- mutate main/tag;
- publish;
- reintroduce removed ecosystem bindings;
- implement WO-006+;
- move authority from M14/M15 into this projection;
- infer unknown dependencies/tests/proof eligibility optimistically.

STOP CONDITION: `GBS_V11_WO_005_READY_FOR_OBJECTIVE_AUDIT`
