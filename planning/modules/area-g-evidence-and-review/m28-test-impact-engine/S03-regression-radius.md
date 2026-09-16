# GBS-M28-S03 — Regression Radius

Status: `FROZEN`
Module: `GBS-M28 — Test Impact Engine`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`
Source directive: `ADR-0002`

## Objective
Freeze the Progressive Validation Ladder and regression-radius semantics that make correction loops fast without weakening final assurance. S03 decides which validation layers are implicated by current impact/risk truth and produces execution constraints; it does not execute CI or optimize the executor critical path itself.

## Frozen mechanisms
1. **PVL28 — Progressive Validation Ladder**: canonical validation levels L0-L5 with monotonic escalation semantics and explicit reached/required state.
2. **RRE28 — Regression Radius Engine**: derives the minimum current validation radius from S02 impact closure, dependency completeness, assurance requirements, risk and failures.
3. **FSR28 — Failure-Scoped Retest Plan**: after a failure, selects failed tests plus impacted closure/boundaries first while preserving any broader mandatory obligations.
4. **BIP28 — Boundary Impact Projector**: maps impacted source/contracts into integration/API/persistence/provider/runtime boundaries that require L3 validation.
5. **RWE28 — Risk Widening Engine**: raises the validation radius for security, recovery, critical data, platform, systemic-failure or incomplete-knowledge conditions; it never shrinks the radius.
6. **VCE28 — Validation Concurrency Envelope**: marks validation groups `SERIAL_REQUIRED | PARALLEL_ELIGIBLE | BLOCKED | INDETERMINATE` with shared-state/resource/dependency constraints. M63 owns scheduling optimization and M32 owns CI execution.
7. **CTG28 — Cancellation/Truncation Gate**: makes cancellation, runner interruption, bounded traversal exhaustion and partial result explicit; incomplete execution cannot become COMPLETE/PASS by omission.
8. **VPR28 — Validation Progress Receipt**: immutable receipt for planned/reached ladder level, completed/reused/unresolved categories, selected evidence identities and reason codes; it grants no M27 assurance verdict.

## Frozen validation ladder
- **L0 STRUCTURAL_STATIC**: relevant schema/format/type/build/static checks required by the changed surface.
- **L1 DIRECT**: directly mapped unit/component tests for changed source/contracts.
- **L2 IMPACTED_CLOSURE**: dependent unit/component tests selected by current graph closure.
- **L3 BOUNDARY**: affected integration/API/persistence/provider/runtime boundaries.
- **L4 RISK_EXPANSION**: broader regression/security/recovery/platform checks required by risk, failure or incomplete knowledge.
- **L5 EXACT_CANDIDATE_ASSURANCE**: final full set required by the active Work Order/M27 assurance profile on the exact final candidate identity.

Passing a lower level never implies a higher level. Reuse at an intermediate level does not manufacture L5 evidence.

## Regression-radius rules
The current radius is the maximum of:
1. direct semantic impact;
2. dependency closure;
3. affected boundary scope;
4. assurance/profile minimum ladder floor;
5. risk-driven widening;
6. uncertainty/completeness widening;
7. current failure/systemic-failure widening;
8. platform requirements.

Optimization budgets do not cap this maximum.

## Failure-scoped correction loop
After a current failure:
1. record the current failure fingerprint/evidence identity;
2. invalidate conflicting green reuse;
3. correct only the governed implementation surface;
4. rerun the failed test(s);
5. rerun the newly impacted closure;
6. rerun affected boundaries;
7. broaden to L4/L5 when policy, risk, uncertainty or systemic evidence requires it.

A full suite after every local edit is not the default. Conversely, a local PASS cannot end the loop while a broader mandatory level remains outstanding.

## Concurrency boundary
M28 may prove which checks are independent enough to be parallel-eligible, but it never starts jobs, chooses machines, changes CI workflow topology or prioritizes wall-clock execution. M63 consumes VCE28 to optimize scheduling/critical path. M32 performs CI orchestration under its own authority.

Parallel eligibility requires:
- no prerequisite relation between groups;
- no unsafe shared mutable state;
- attributable evidence per group;
- resource/provider constraints represented explicitly;
- cancellation/failure from one group cannot be hidden by another group's success.

## Required attacks and proofs
One-edge-outside-radius dependency; hidden integration boundary; partial graph knowledge; direct PASS plus dependent failure; fail-fix-fail permutation; old failure/new green and new failure/old green; concurrent shared-state flake; cancellation; test-runner crash; platform-specific branch; required L5 after local L2 success; risk profile escalation; assurance floor increase; ordering/permutation; duplicate execution groups; truncated closure.

Planning result: S03 minimizes repeated validation work only inside a monotonic, fail-closed ladder whose final obligation remains external assurance policy.

STOP CONDITION: `M28_S03_FROZEN`.