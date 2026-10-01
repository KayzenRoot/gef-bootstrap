# Direct Execution Brief — GBS-V11-WO-006

State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`
Authority: `ADR-0003-D3`
Assurance: `ELEVATED`
Work Order: `.engineering/work-orders/GBS-V11-WO-006.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-006.json`
Implementation branch: `feat/1.1/wo-006-incremental-validation`

## EXACT BASE

Create the implementation branch only from the exact WO-006 admission merge on `release/1.1`. The historical pre-admission base is WO-005 merge `d20c0499556bbaf1304a88d869bdd2159537df3e`.

If `release/1.1` advances before branch creation, STOP as `STALE_CONTEXT`.

## MINIMUM READ SET

1. WO-006 Work Order
2. WO-006 Context Lock
3. Checkpoint
4. V1.1 Test Matrix INC-VAL rows
5. Executor Acceleration Contract sections 9-12 and 16
6. M28 public/types/s01-s04
7. WO-005 Execution Capsule public contract/implementation
8. existing M28 tests

No repository-wide rediscovery unless a concrete type/test/dependency failure requires it.

## IMPLEMENTATION TARGET

Extend the existing M28 Test Impact Engine with a V1.1 orchestration layer. Do not create another source-to-test selector.

Prefer:
- `packages/test-impact-engine/src/v11-incremental-validation.ts`
- minimal public/types exports
- `tests/v11-wo-006-incremental-validation.test.mjs`
- cross-platform INC-VAL workflow
- evidence bundle

## CORE RULES

- Pure deterministic/read-only planner.
- Reuse `selectImpactedTests`, `progressiveValidationLevel`, uncertainty widening and M28 handoff semantics.
- Known mapped changes may stay narrow only when certainty/assurance permit.
- Unknown source/dependency/dynamic surface => at least L4.
- selector confidence INDETERMINATE => no suppression, at least L4.
- BROWNFIELD_UNPROVEN => full relevant suite, no suppression.
- Capsule mandatory tests are unioned with selected tests; missing mandatory test => INDETERMINATE.
- Capsule not COMPILED/SUFFICIENT => no selective plan.
- L5/finalSweepRequired can never be downgraded.
- Output authority remains READ_ONLY_TEST_IMPACT.
- Proof reuse eligibility is NOT decided here. Return `DEFER_TO_PROOF_REUSE` only when selection itself is sufficiently certain; otherwise `PROHIBITED`.

## MANDATORY CASES

- INC-VAL-01 unmapped changed source -> L4+
- INC-VAL-02 selector confidence INDETERMINATE -> no suppression
- INC-VAL-03 unknown dependency endpoint -> widen
- INC-VAL-04 L5 requirement survives earlier L1/L2
- INC-VAL-05 unproven brownfield -> full suite, no suppression

Also prove determinism/permutation, platform filtering, dynamic widening, mandatory-test union/missing-test failure, capsule state/certainty gate, read-only handoff and M28 regression.

## HARD BOUNDARIES

Do not:
- implement TPRR/proof eligibility or suppress a test because an old proof exists;
- implement WO-007+;
- mutate main/tag;
- publish;
- add filesystem/Git/network/process/provider authority;
- reintroduce removed legacy ecosystem bindings.

STOP CONDITION: `GBS_V11_WO_006_READY_FOR_OBJECTIVE_AUDIT`
