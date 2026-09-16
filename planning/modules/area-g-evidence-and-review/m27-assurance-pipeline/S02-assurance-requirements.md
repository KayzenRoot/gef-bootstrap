# GBS-M27-S02 — Assurance Requirements

Status: `FROZEN`
Module: `GBS-M27 — Assurance Pipeline`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Compile an assurance class into an exact, deterministic requirement profile. M27 defines what must be proven for acceptance; it does not choose concrete tests, mutate upstream evidence/proof/review state or operate CI/Git.

## Frozen mechanisms
1. **ARM27 — Assurance Requirement Matrix**: canonical class-to-requirement matrix with monotonic requirement inclusion.
2. **APM27 — Assurance Profile Manifest**: immutable instance of requirements for one exact work/candidate/policy binding.
3. **OBG27 — Obligation Binding Gate**: verifies every required assurance obligation has a declared owner, proof/evidence class and acceptance rule.
4. **PCG27 — Policy Compatibility Gate**: blocks mixed/stale assurance policies and forbids newest-wins policy selection.
5. **DAB27 — DoD Assurance Binding**: binds assurance requirements to applicable DoD/acceptance obligations without M27 rewriting DoD state.
6. **PHG27 — Proof Handoff Gate**: verifies current M25 proof handoff identity/consumer and imports proof state read-only.
7. **HHG27 — HEDS Handoff Gate**: verifies current M26 HEDS handoff identity/consumer and imports semantic-review verdict/findings read-only.
8. **RCS27 — Requirement Closure Snapshot**: deterministic snapshot of required, satisfied, unresolved, blocked and not-applicable assurance obligations.

## Requirement dimensions
The requirement matrix may require, by class and risk profile:
- source/context sufficiency;
- evidence acceptance;
- proof sufficiency/currentness;
- semantic-review clearance;
- static/type/build checks;
- unit/component/integration/E2E categories;
- platform/runtime coverage;
- security analysis;
- recovery/integrity validation;
- exact-head full sweep;
- independent semantic/integrity review;
- explicit CRITICAL/HIGH finding floor;
- startup purity/boundedness/cancellation where applicable.

M27 expresses validation categories and assurance obligations. M28 later selects concrete impacted tests. CI orchestration belongs to M32; Git/head operations belong to M29.

## Monotonic class invariant
A stronger class inherits all mandatory weaker-class obligations unless an obligation is explicitly replaced by a stronger equivalent. No class transition may erase an applicable safety obligation merely by renaming it.

## Current upstream contracts
- M25 proof context must be current and bound to the exact candidate/work context when used.
- M26 HEDS handoff must be current; `CORRECTION_REQUIRED`, `BLOCKED`, `INDETERMINATE` or `TRUNCATED` cannot be translated into assured state.
- missing optional upstream capability remains explicit and may widen requirements rather than fabricate a pass.

## Implementation seed plan
Canonical package target: `packages/assurance-pipeline`.
Planned files: `src/types.ts`, `src/utils.ts`, `src/registry.ts`, `src/s01-classification.ts`, `src/s02-requirements.ts`, `src/s03-admission.ts`, `src/s04-gates.ts`, `src/s05-verdict.ts`, `src/public.ts`, package/tsconfig, focused/hardening/startup-purity tests and `.github/workflows/m27-platform.yml`.

## MAX_ASSURANCE proof families
Class monotonicity property tests, requirement permutation, policy mix-and-match, M25 stale/forged handoff, M26 stale/forged handoff, HEDS non-approved state, obligation owner conflict, DoD binding drift, missing mandatory requirement, cancellation and bounded materialization.

STOP CONDITION: `M27_S02_FROZEN`.
