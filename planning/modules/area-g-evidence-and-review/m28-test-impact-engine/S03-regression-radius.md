# GBS-M28-S03 — Regression Radius

Status: `OWNER_DIRECTIVE_SEED_NOT_FROZEN`
Module: `GBS-M28 — Test Impact Engine`
Source directive: `ADR-0002`

## Planning objective
Freeze the **Progressive Validation Ladder** and regression-radius rules that keep implementation iterations fast while converging on full exact-head assurance.

## Owner-directed technology candidates
- TECH-0056 Progressive Validation Ladder (PVL);
- TECH-0057 Failure-Scoped Retest Loop (FSRL);
- TECH-0059 Validation Wave Scheduler (VWS);
- existing Execution Critical Path Map integration.

## Candidate validation ladder
- `L0 STRUCTURAL_STATIC`: relevant type/build/schema/static checks.
- `L1 DIRECT`: tests directly mapped to changed symbols/contracts.
- `L2 IMPACTED_CLOSURE`: dependent unit/component tests.
- `L3 BOUNDARY`: affected integration/API/provider/persistence tests.
- `L4 RISK_EXPANSION`: broader regression/security/platform checks on risk or incomplete knowledge.
- `L5 EXACT_HEAD_ASSURANCE`: final full suites required by Work Order/M27 assurance.

## Failure-scoped retry rule
After a failure, the next correction loop should execute:
1. failed test(s);
2. directly impacted closure;
3. affected boundary checks;
4. broader suites only when the local problem is cleared or policy/systemic evidence requires widening.

A full suite after every small edit is not the default.

## Validation wave scheduling
Independent checks MAY run concurrently when:
- tool/resource constraints permit;
- they do not mutate shared state unsafely;
- evidence remains attributable;
- failure ordering cannot hide prerequisite failure.

The scheduler should prioritize the shortest/high-signal checks that can invalidate an implementation wave before expensive suites start.

## Quality invariant
Reduced intermediate testing is valid only when the impact model is current. Final assurance remains governed separately and can require complete regression, multi-OS, CodeQL/security, integration or E2E suites.

## Required attacks for later freeze
One-over-radius dependency, hidden integration boundary, partial graph knowledge, fail-then-fix loop, concurrent flaky shared state, cancellation, test runner crash, platform-specific branch and final-head mutation after L5.

This file grants no implementation authority and earns no M28 weight.
