# GBS-V11-WO-007 — Proof Reuse + Targeted Invalidation

Status: `ADMISSION_CANDIDATE`
Release line: `1.1.x`
Assurance: `ELEVATED`
Implementation branch after admission: `feat/1.1/wo-007-proof-reuse`

## OBJECTIVE

Implement the V1.1 governed Test Proof Reuse orchestration on top of the existing M28 Test Proof Reuse Receipt (TPRR) primitives without creating a second proof/evidence authority.

The increment must:
- consume existing M28 `createReuseReceipt` / `validateReuse` semantics;
- consume an exact WO-006 Incremental Validation Plan projection;
- permit suppression only for tests whose receipts are independently `REUSABLE` under current exact bindings;
- apply targeted invalidation for changed-source impact;
- conservatively invalidate current-failure overlap;
- refuse reuse on stale source/test/config/fixture/toolchain/runtime/platform/policy/candidate/dependency/conflict/indeterminate states;
- preserve required final exact-head assurance;
- produce a deterministic read-only Proof Reuse Plan and handoff;
- make production-credit manufacture structurally impossible.

M24 remains evidence-acceptance owner. M25 remains general proof-graph owner. M27 remains assurance owner. M28 owns concrete test proof reuse compatibility only.

## AUTHORITY

Read in order:
1. `.engineering/CHECKPOINT.md` + `.engineering/CHECKPOINT.json`
2. `.engineering/DECISIONS-LEDGER.md`
3. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md`
4. `.engineering/decisions/ADR-0005-LEGACY-ECOSYSTEM-DETACHMENT.md`
5. `.engineering/releases/V1.1-SCOPE.md`
6. `.engineering/ARCHITECTURE.md`
7. `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md` sections 10-12 and 16
8. `.engineering/releases/V1.1-TEST-MATRIX.md` PROOF-INV rows
9. `.engineering/ledgers/M28-TEST-IMPACT-ENGINE-LEDGER-SYNC.md`
10. M28 Test Impact Engine implementation/public contracts
11. WO-006 Incremental Validation public implementation/evidence
12. this Work Order + Context Lock

Repository code/tests at the exact admitted base outrank recollection.

## OWNERSHIP

Canonical concrete test-proof reuse authority remains `@gef-bootstrap/test-impact-engine` / M28.

Implement a bounded V1.1 orchestration layer inside that package, preferably:
- `packages/test-impact-engine/src/v11-proof-reuse.ts`
- `packages/test-impact-engine/src/public.ts`
- `packages/test-impact-engine/src/types.ts` only where shared public types are necessary
- `tests/v11-wo-007-proof-reuse.test.mjs`
- dedicated cross-platform workflow
- `.engineering/evidence/GBS-V11-WO-007-EVIDENCE.md`

Do not duplicate M24 evidence acceptance, M25 proof-graph evaluation, M27 assurance verdicts, or M28 receipt validation.

## INPUT CONTRACT

The pure planner consumes explicit deterministic inputs:
- exact candidate digest;
- current M28 `TestMap`;
- exact WO-006 validation-plan projection:
  - state;
  - selected tests;
  - validation level;
  - intermediate suppression state;
  - finalSweepRequired;
  - plan digest / handoff digest;
- prior immutable TPRRs;
- exact current binding set per candidate test;
- changed source IDs;
- current failure fingerprints;
- dependency-knowledge completeness;
- policy/profile/platform identity;
- optional explicit reason codes already produced by owner-authorized upstream truth.

No filesystem, Git, network, provider, process or clock observation belongs in this planner.

## OUTPUT CONTRACT

Return a deterministic immutable Proof Reuse Plan containing at least:
- state: `READY | NO_REUSE | INDETERMINATE | BLOCKED`;
- selected tests inherited from WO-006;
- `reusedTests`;
- `testsToRun`;
- decision per selected test:
  - `REUSABLE`
  - M28 non-reusable state;
  - targeted invalidation reason if a changed closure overlaps;
  - failure invalidation reason if a current failure overlaps;
  - upstream suppression-prohibited reason;
- `finalSweepRequired`;
- `manufacturesProductionCredit:false`;
- exact candidate/map/plan/policy/profile/platform bindings;
- deterministic plan digest;
- read-only handoff with no mutation/checkpoint/assurance authority.

The plan may suppress only repeated intermediate test invocation. It never suppresses a required final exact-head sweep and never turns historical PASS into production credit.

## TARGETED INVALIDATION

Use existing M28 map semantics to derive affected test closure.

Rules:
1. changed source invalidates receipts for tests whose source/dependency closure contains the change;
2. receipts outside the proven affected closure remain eligible for independent exact-binding validation;
3. incomplete dependency knowledge invalidates reuse conservatively for the affected selection;
4. unmapped changed source prohibits reuse for the relevant plan;
5. current failure invalidates:
   - the failed test receipt;
   - downstream test receipts transitively depending on the failed test;
   - any ambiguous overlap when dependency knowledge is incomplete;
6. a newer/current failure always dominates an older green receipt;
7. a receipt with a digest/integrity conflict is never reusable.

## FAIL-CLOSED RULES

1. WO-006 plan not `READY` or `intermediateSuppression != DEFER_TO_PROOF_REUSE` => no receipt may suppress execution.
2. Only M28 `validateReuse(...).reusable === true` may enter `reusedTests`.
3. Every non-`REUSABLE` M28 state suppresses nothing.
4. Changed-source overlap invalidates reuse even when stale receipt fields have not yet been externally recomputed.
5. Current failure overlap invalidates reuse even when the old receipt is otherwise exact.
6. Unknown dependency endpoint / incomplete dependency knowledge => conservative no-reuse for uncertain overlap.
7. Missing receipt or missing current binding => test remains in `testsToRun`.
8. Duplicate/conflicting receipt identity => `INDETERMINATE` or `BLOCKED`; never choose one optimistically.
9. Cross-platform receipt mismatch is non-reusable.
10. stale toolchain/runtime/config/fixture/policy/candidate binding is non-reusable.
11. `finalSweepRequired` is inherited and can never be cleared.
12. L5 selected tests are never suppressed as final exact-head proof. Intermediate reuse metadata may be reported, but `testsToRun` for the final sweep remains the full selected set.
13. no output field can increment production credit; `manufacturesProductionCredit` is always `false`.

## PROOF-INV MANDATORY CASES

Own all frozen Test Matrix cases:
- `PROOF-INV-01`: every non-`REUSABLE` TPRR state suppresses nothing;
- `PROOF-INV-02`: targeted invalidation invalidates only receipts whose proven closure contains the change;
- `PROOF-INV-03`: reused proof cannot increment/manufacture production credit;
- `PROOF-INV-04`: stale toolchain/platform mismatch refuses reuse;
- `PROOF-INV-05`: current failure invalidates overlapping proofs conservatively.

Additional required tests:
- exact reusable receipt can suppress an intermediate repeat;
- missing receipt/current binding remains runnable;
- duplicate/conflicting receipts fail closed;
- candidate mismatch refuses reuse;
- acceptedPass=false refuses reuse;
- receipt digest tamper refuses reuse;
- changed-source permutation/repeat is deterministic;
- current-failure permutation/repeat is deterministic;
- L5/final sweep cannot be suppressed;
- WO-006 suppression-prohibited plan disables all reuse;
- incomplete map/dependency knowledge disables uncertain reuse;
- read-only handoff grants no mutation/assurance/checkpoint authority;
- legacy M28 tests remain green.

## OUT OF SCOPE

- evidence acceptance: M24;
- general proof-graph recomputation/carry-forward: M25;
- assurance verdict: M27;
- incremental selection itself: WO-006;
- telemetry/benchmarking: WO-008;
- integrated release assurance/docs: WO-009;
- production acceptance/promotion: WO-010;
- running tests or mutating source;
- filesystem/Git/network/process/provider observation;
- legacy ecosystem-specific adapters;
- main/tag/publication mutation.

## ACCEPTANCE CRITERIA

1. V1.1 proof reuse orchestration reuses M28 TPRR primitives and does not create a second proof authority.
2. PROOF-INV-01..05 have exact tests/evidence.
3. Only exact `REUSABLE` receipts can suppress repeated intermediate invocation.
4. Targeted changed-source invalidation is neither broader than necessary under complete knowledge nor narrower than safe.
5. Current failure dominates historical green reuse and invalidates downstream overlap.
6. Incomplete dependency knowledge prevents optimistic reuse.
7. All stale/conflict/indeterminate receipt states suppress nothing.
8. Missing/duplicate/conflicting receipts fail closed.
9. L5/final sweep remains fully executable and cannot be skipped by reuse.
10. `manufacturesProductionCredit` is always false.
11. Output is deterministic under semantically unordered input permutations.
12. Handoff remains read-only.
13. Windows/Linux/macOS PROOF-INV suite passes.
14. Full M28 regression/typecheck/repository validation/dependency audit pass.
15. Objective audit reports CRITICAL=0/HIGH=0.
16. `main`, `v1.0.0`, publication and production acceptance remain unchanged.

## VALIDATION LADDER

- L1: focused TPRR orchestration tests.
- L2: M28 reuse/invalidation regression.
- L3: WO-006 plan boundary, failure overlap, duplicate/conflict negatives.
- L4: repository validation + dependency audit.
- L5: exact-head cross-platform PROOF-INV assurance plus applicable existing workflows.

## STOP CONDITION

Stop after implementation, validation, evidence and PR update. Do not merge without objective audit.

STOP CONDITION: `GBS_V11_WO_007_READY_FOR_OBJECTIVE_AUDIT`
