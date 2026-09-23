# GBS-V11-WO-006 — Test Impact + Incremental Validation

Status: `ADMISSION_CANDIDATE`
Release line: `1.1.x`
Assurance: `ELEVATED`
Implementation branch after admission: `feat/1.1/wo-006-incremental-validation`

## OBJECTIVE

Implement the V1.1 incremental-validation orchestration on top of the existing M28 Test Impact Engine without creating a second source-to-test authority.

The increment must:
- consume the existing M28 source/test map, impact selector, uncertainty widening and progressive validation ladder;
- consume a bounded Execution Capsule validation projection from WO-005;
- select the minimum proven validation set for known impact;
- escalate to broader validation when mapping, dependency, selector confidence or brownfield assurance is incomplete;
- preserve a required L5 exact-head sweep regardless of earlier L1/L2 success;
- produce a deterministic read-only validation plan and handoff;
- never infer proof reuse eligibility. WO-007 owns proof-reuse decisions.

## AUTHORITY

Read in order:
1. `.engineering/CHECKPOINT.md` + `.engineering/CHECKPOINT.json`
2. `.engineering/DECISIONS-LEDGER.md`
3. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md`
4. `.engineering/decisions/ADR-0005-LEGACY-ECOSYSTEM-DETACHMENT.md`
5. `.engineering/releases/V1.1-SCOPE.md`
6. `.engineering/ARCHITECTURE.md`
7. `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md` sections 9-12 and 16
8. `.engineering/releases/V1.1-TEST-MATRIX.md` INC-VAL rows
9. M28 Test Impact Engine implementation/public contracts
10. WO-005 Execution Capsule public contract and implementation
11. this Work Order + Context Lock

Repository code/tests at the exact admitted base outrank recollection.

## OWNERSHIP

Canonical Test Impact authority remains `@gef-bootstrap/test-impact-engine` / M28.

Implement a bounded V1.1 orchestration layer inside that package, preferably:
- `packages/test-impact-engine/src/v11-incremental-validation.ts`
- `packages/test-impact-engine/src/public.ts`
- `packages/test-impact-engine/src/types.ts` only for shared public types
- `tests/v11-wo-006-incremental-validation.test.mjs`
- dedicated cross-platform workflow
- `.engineering/evidence/GBS-V11-WO-006-EVIDENCE.md`

Do not duplicate `buildTestMap`, `selectImpactedTests`, `progressiveValidationLevel`, `widenForUncertainty`, `createTestImpactResult`, or `createTestImpactHandoff`.

## INPUT CONTRACT

The orchestration consumes explicit deterministic inputs:
- exact candidate digest;
- current platform;
- existing M28 `TestMap`;
- changed source IDs;
- assurance floor/policy/profile bindings;
- selector confidence: `CERTAIN | INDETERMINATE`;
- brownfield posture: `GREENFIELD | BROWNFIELD_SHADOW_PROVEN | BROWNFIELD_UNPROVEN`;
- a minimal WO-005 capsule validation projection:
  - capsule state/certainty;
  - capsule fingerprint;
  - selected test IDs;
  - capsule ladder level;
  - escalation rules;
  - finalSweepRequired.

No filesystem, Git, process, network, clock or provider observation belongs in the pure planner.

## OUTPUT CONTRACT

Return a deterministic immutable Incremental Validation Plan containing at least:
- state: `READY | WIDENED | INDETERMINATE | BLOCKED`;
- selected test IDs;
- selected validation level;
- assurance floor;
- uncertainty;
- reasons;
- `intermediateSuppression`: `DEFER_TO_PROOF_REUSE | PROHIBITED`;
- `fullSuiteRequired`;
- `finalSweepRequired`;
- exact candidate/capsule/map/policy/profile/platform bindings;
- deterministic digest;
- read-only M28 handoff or equivalent exact result identity.

The plan authorizes validation selection only. It grants no mutation or proof-reuse authority.

## FAIL-CLOSED RULES

1. Capsule not `COMPILED/SUFFICIENT` => no selective suppression; state `INDETERMINATE` or `BLOCKED`.
2. Changed source not present in the map => widen to at least L4 and full platform-relevant suite.
3. `map.complete=false` or unknown dependency endpoint => widen to at least L4.
4. selector confidence `INDETERMINATE` => no suppression and at least L4.
5. dynamic test surface => at least L4.
6. `BROWNFIELD_UNPROVEN` => full suite and no suppression.
7. capsule-mandated test not present in the map => `INDETERMINATE`, no suppression; never silently drop it.
8. capsule/policy assurance floor can only raise validation level, never lower it.
9. L5 requirement survives all L1/L2/L3 passes.
10. `finalSweepRequired=true` from capsule can never be removed.
11. cancellation/truncation/unknown evidence never becomes a smaller test radius.
12. output handoff remains read-only.

## INC-VAL MANDATORY CASES

Own all frozen Test Matrix cases:
- `INC-VAL-01`: unmapped changed source -> L4 minimum, never smaller set;
- `INC-VAL-02`: selector confidence INDETERMINATE -> no suppression;
- `INC-VAL-03`: unknown dependency endpoint -> widened selection;
- `INC-VAL-04`: L1/L2 success with L5 required -> L5 still demanded;
- `INC-VAL-05`: brownfield without shadow assurance -> full suite, no suppression.

Additional required tests:
- deterministic repeat/permutation;
- known mapped change selects direct/closure minimum when assurance permits;
- platform filtering follows existing M28 semantics;
- dynamic tests widen;
- capsule-selected mandatory tests are unioned, never dropped;
- missing capsule-selected test fails closed;
- invalid capsule state/certainty blocks selective plan;
- M28 read-only handoff authority preserved;
- no proof receipt is marked reusable by this WO;
- M28 legacy tests remain green.

## OUT OF SCOPE

- proof-reuse eligibility/invalidation and TPRR suppression decisions: WO-007;
- telemetry/benchmarking: WO-008;
- integrated release assurance/docs: WO-009;
- production promotion: WO-010;
- mutation/execution of tests itself;
- filesystem/Git/network/process/provider observation;
- broad M28 redesign;
- legacy ecosystem-specific adapters;
- main/tag/publication mutation.

## ACCEPTANCE CRITERIA

1. V1.1 orchestration uses existing M28 primitives rather than a parallel selector.
2. INC-VAL-01..05 have exact tests/evidence.
3. Mapped known changes may remain L1/L2/L3 only when assurance and certainty permit.
4. Unknown map/dependency/confidence widens to L4 or stricter.
5. Brownfield unproven posture selects full relevant suite and prohibits suppression.
6. L5/final sweep cannot be downgraded.
7. Missing mandatory capsule tests are never silently omitted.
8. Output is deterministic under unordered input permutations.
9. Handoff is read-only and carries exact candidate/result binding.
10. No WO-007 proof-reuse verdict is implemented.
11. Windows/Linux/macOS INC-VAL suite passes.
12. Full M28 regression/typecheck/repository validation/dependency audit pass.
13. Objective audit reports CRITICAL=0/HIGH=0.
14. `main`, `v1.0.0`, publication and production acceptance remain unchanged.

## VALIDATION LADDER

- L1: focused V1.1 incremental-selection unit tests.
- L2: M28 integration/regression tests.
- L3: capsule-projection and handoff boundary negatives.
- L4: repository validation and dependency audit.
- L5: exact-head cross-platform INC-VAL assurance plus applicable existing workflows.

## STOP CONDITION

Stop after implementation, validation, evidence and PR update. Do not merge without objective audit.

STOP CONDITION: `GBS_V11_WO_006_READY_FOR_OBJECTIVE_AUDIT`
