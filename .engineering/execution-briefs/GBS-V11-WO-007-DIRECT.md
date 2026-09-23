# Direct Execution Brief — GBS-V11-WO-007

State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`
Authority: `ADR-0003-D3`
Assurance: `ELEVATED`
Work Order: `.engineering/work-orders/GBS-V11-WO-007.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-007.json`
Implementation branch: `feat/1.1/wo-007-proof-reuse`

## EXACT BASE

Create the implementation branch only from the exact WO-007 admission merge on `release/1.1`. Historical pre-admission base: WO-006 merge `5ceb8c6e77b122fcef50d85a26458fb95b388480`.

If `release/1.1` advances before branch creation, STOP as `STALE_CONTEXT`.

## MINIMUM READ SET

1. WO-007 Work Order
2. WO-007 Context Lock
3. Checkpoint
4. Test Matrix PROOF-INV rows
5. Executor Acceleration Contract sections 10-12 and 16
6. M28 ledger sync
7. M28 public/types/s01-s04
8. WO-006 incremental-validation implementation
9. existing M28 tests

No repository-wide rediscovery unless a concrete compiler/test/dependency failure requires it.

## IMPLEMENTATION TARGET

Extend the existing M28 Test Impact Engine. Prefer:
- `packages/test-impact-engine/src/v11-proof-reuse.ts`
- minimal public/types exports
- `tests/v11-wo-007-proof-reuse.test.mjs`
- cross-platform PROOF-INV workflow
- evidence bundle

Do not create a second evidence, proof or assurance engine.

## CORE RULES

- Reuse existing `validateReuse`; do not duplicate receipt compatibility logic.
- Only `REUSABLE` may suppress a repeated intermediate invocation.
- A WO-006 plan with suppression `PROHIBITED` disables all reuse.
- Changed-source impact invalidates only the proven overlapping test closure when dependency knowledge is complete.
- Unknown changed source/dependency knowledge disables uncertain reuse conservatively.
- Current failure invalidates the failed test and transitive downstream test dependents.
- New/current failure dominates old green receipt.
- Missing receipt/current binding means the test runs.
- Duplicate/conflicting receipts fail closed.
- L5/final exact-head sweep cannot be suppressed.
- Output always carries `manufacturesProductionCredit:false`.
- Output/handoff remain read-only.
- M24 evidence acceptance, M25 general proof, M27 assurance remain external owners.

## MANDATORY CASES

- PROOF-INV-01 all non-REUSABLE states suppress nothing
- PROOF-INV-02 targeted change invalidates only overlapping closure
- PROOF-INV-03 production credit cannot be manufactured
- PROOF-INV-04 stale toolchain/platform mismatch refuses reuse
- PROOF-INV-05 current failure invalidates overlapping proofs conservatively

Also prove exact reusable suppression, missing/duplicate receipts, digest tamper, candidate mismatch, acceptedPass=false, permutation determinism, L5 final-sweep preservation, WO-006 suppression gate, incomplete dependency knowledge and read-only handoff.

## HARD BOUNDARIES

Do not:
- accept underlying evidence;
- compute general M25 proof verdicts;
- issue M27 assurance verdicts;
- implement WO-008+;
- run tests or mutate source;
- mutate main/tag;
- publish;
- add filesystem/Git/network/process/provider authority;
- reintroduce removed legacy ecosystem bindings.

STOP CONDITION: `GBS_V11_WO_007_READY_FOR_OBJECTIVE_AUDIT`
