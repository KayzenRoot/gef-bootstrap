# GBS-V11-WO-005 — Context Compiler + Execution Capsule

Status: `ADMISSION_CANDIDATE`
Release line: `1.1.x`
Assurance: `ELEVATED`
Implementation branch after admission: `feat/1.1/wo-005-execution-capsule`

## OBJECTIVE

Implement the V1.1 deterministic Context Compiler projection and Execution Capsule without creating a second source of truth or weakening M14/M15/M63 ownership.

The increment must:
- consume existing M14 Task Context Capsule / Execution Handoff truth;
- consume existing M15 Execution Pack truth;
- project the minimum sufficient executor-facing V1.1 Execution Capsule;
- bind exact repository/work-order/source fingerprints;
- suppress broad rediscovery by explicit navigation sets;
- carry affected files/dependencies, constraints, acceptance proof obligations, selected tests, reusable proof references and STOP CONDITION;
- fail closed on insufficient context, stale bindings, unknown dependency closure or conflicting inputs;
- implement deterministic canonical serialization and repeat-compilation identity;
- implement explicit drift/invalidation mapping.

This increment is an acceleration projection. It is not canonical architecture/scope authority and it does not select incremental tests or prove proof reuse eligibility beyond carrying already-classified inputs. Those owners remain WO-006 and WO-007.

## CONTEXT / AUTHORITY

Read authority in this order:
1. `.engineering/CHECKPOINT.md` + `.engineering/CHECKPOINT.json`
2. `.engineering/DECISIONS-LEDGER.md`
3. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md`
4. `.engineering/decisions/ADR-0005-LEGACY-ECOSYSTEM-DETACHMENT.md`
5. `.engineering/releases/V1.1-SCOPE.md`
6. `.engineering/ARCHITECTURE.md`
7. `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md`
8. `.engineering/releases/V1.1-EXECUTION-CAPSULE-CONTRACT.md`
9. `.engineering/releases/V1.1-TEST-MATRIX.md`
10. M14 Task Context Compiler implementation/contracts
11. M15 Execution Pack Compiler implementation/contracts
12. M63 acceleration primitives where semantically applicable
13. this Work Order + Context Lock

Repository code/tests at the exact admitted base outrank conversation recollection.

## OWNERSHIP / ARCHITECTURE

Implementation owner: extend `@gef-bootstrap/execution-pack-compiler` with a V1.1 Execution Capsule projection. Do not create a competing planner or duplicate M14/M15 reasoning.

Expected bounded implementation surface:
- `packages/execution-pack-compiler/src/execution-capsule.ts`
- `packages/execution-pack-compiler/src/execution-capsule-types.ts` only if type separation is clearer
- `packages/execution-pack-compiler/src/public.ts`
- `packages/execution-pack-compiler/src/types.ts` only for shared type exports if necessary
- `tests/v11-wo-005-execution-capsule.test.mjs`
- `.engineering/evidence/GBS-V11-WO-005-EVIDENCE.md`

The existing schema `.engineering/schemas/execution-capsule.schema.json` is canonical. Change it only if implementation proves a concrete contradiction, and any schema change must preserve the frozen V1.1 contract.

## INPUT CONTRACT

The compiler accepts an explicitly bounded input containing:
- repository identity, branch, exact head SHA and tree fingerprint;
- Work Order ID/source/scope digest/assurance;
- a valid admitted M14 capsule + handoff;
- a valid compiled M15 execution pack + receipt;
- navigation inputs: MUST_READ, READ_IF_TRIGGERED, WRITE_ALLOWED, WRITE_FORBIDDEN;
- affected file intents/symbols/dependencies + dependency closure digest;
- constraints;
- acceptance criteria with proof obligations;
- selected-test projection supplied by current policy, not independently re-decided here;
- proof references with already-classified states supplied by current policy;
- input fingerprints;
- drift/invalidation request;
- STOP CONDITION and unresolved open questions.

No ambient filesystem, Git, clock, network, provider or process observation belongs in the pure compiler.

## OUTPUT CONTRACT

Output conforms to `urn:gef:schema:execution-capsule:1` semantics:
- `schemaVersion: "1.0"`;
- deterministic `capsuleId` derived from stable identity fields;
- `capsuleVersion: "1.0"`;
- `releaseLine: "1.1.x"`;
- state `COMPILED | INDETERMINATE | STALE | REJECTED`;
- certainty `SUFFICIENT | INSUFFICIENT`;
- exact base binding with `productionBranchTouched: false`;
- exact Work Order binding;
- deterministic/sorted navigation;
- affected files/dependency closure;
- constraints;
- acceptance criteria/proof obligations;
- selected tests + escalation + final-sweep obligation;
- proof references with `manufacturesProductionCredit: false`;
- canonical input fingerprints and capsule fingerprint;
- invalidation class/action;
- STOP CONDITION;
- unresolved open questions.

## DETERMINISM

Required:
1. same semantic inputs -> byte-identical canonical capsule projection and same `capsuleFingerprint`;
2. semantically unordered sets are sorted by code point before hashing/output;
3. volatile fields such as wall-clock/hostname/absolute-machine metadata are not part of identity;
4. meaningful binding/source/dependency/test/proof changes alter the fingerprint;
5. `expiresAt`, when supplied as operational metadata, does not alter the semantic fingerprint;
6. `capsuleId` derives deterministically from Work Order/repository/release identity rather than random/time assignment.

Digest algorithm is injected SHA-256 through the existing M15 `OperationOptions` contract. No ambient crypto API is introduced inside the compiler.

## FAIL-CLOSED / VALIDITY

Compilation MUST NOT produce `COMPILED` when:
- M14 capsule/handoff is stale, invalid, insufficient or not ready;
- M15 pack/receipt binding is invalid or non-replayable;
- repository/work-order binding is incomplete;
- required fingerprints are missing/malformed;
- dependency closure is unknown where a safe affected set cannot be proven;
- selected tests omit their required escalation/final-sweep policy;
- any reusable proof reference is malformed;
- production branch mutation is requested;
- navigation write sets conflict with forbidden writes;
- open contradictions are present.

Insufficient truth returns `INDETERMINATE` with `certainty: INSUFFICIENT`. Contradictory/forbidden truth returns `REJECTED`. Stale bound truth returns `STALE`.

## INVALIDATION / DRIFT

Reuse the frozen SDS classes:
- `NONE`
- `LOCAL_COMPATIBLE`
- `SEED_RECOMPILE_REQUIRED`
- `CONTEXT_EXPANSION_REQUIRED`
- `CONFLICT`

Required mapping:
- NONE -> keep compiled state;
- LOCAL_COMPATIBLE -> remain valid while recording class;
- SEED_RECOMPILE_REQUIRED -> STALE / RECOMPILE;
- CONTEXT_EXPANSION_REQUIRED -> INDETERMINATE / EXPAND_CONTEXT;
- CONFLICT -> REJECTED / HALT or ESCALATE where the frozen contract requires escalation.

No optimistic continuation exists.

## REQUIRED TEST MATRIX CASES

Own all `CTX-DET-01..08` cases:
- CTX-DET-01 identical input repeat -> byte-identical capsule/fingerprint;
- CTX-DET-02 meaningful input change -> fingerprint changes;
- CTX-DET-03 volatile-only change -> fingerprint unchanged;
- CTX-DET-04 insufficient certainty cannot be COMPILED;
- CTX-DET-05 schema/state fixtures cover COMPILED, INDETERMINATE, STALE, REJECTED;
- CTX-DET-06 drift classes map to correct state/action;
- CTX-DET-07 empty constraints/escalation rejected;
- CTX-DET-08 `productionBranchTouched:true` rejected.

Additional required tests:
- permutations of unordered arrays compile identically;
- M14 digest mismatch fails closed;
- M15 receipt/pack mismatch fails closed;
- writeAllowed/writeForbidden intersection rejects;
- missing dependency closure rejects/indeterminates;
- proof reference always carries zero production credit;
- L5 always forces final sweep;
- unknown/open contradiction cannot become COMPILED;
- public export/startup purity remains side-effect free;
- prior M14/M15 tests remain green.

## OUT OF SCOPE

- selecting the minimum impacted test set: WO-006;
- deciding proof reuse eligibility/invalidation: WO-007;
- telemetry/benchmark measurements: WO-008;
- integrated release assurance/docs: WO-009;
- production promotion/tagging: WO-010;
- filesystem/network/Git/provider mutation;
- broad M14/M15 redesign;
- legacy ecosystem-specific adapter reintroduction;
- mutation of `main` or `v1.0.0`.

## ACCEPTANCE CRITERIA

1. A public pure compiler API exists under the existing Execution Pack Compiler ownership.
2. Output semantics conform to the frozen Execution Capsule schema.
3. CTX-DET-01..08 have exact tests and evidence.
4. Same semantic input compiles byte-identically.
5. Canonical sorting makes input permutation irrelevant.
6. Meaningful changes alter the semantic fingerprint.
7. Volatile-only metadata does not alter the fingerprint.
8. Invalid/insufficient/stale/contradictory M14/M15 bindings fail closed.
9. Search suppression and explicit navigation write/read sets are always present.
10. Production-branch mutation cannot be represented by a compiled capsule.
11. Reusable proof references can never manufacture production credit.
12. Drift maps deterministically to NONE/STALE/INDETERMINATE/REJECTED behavior.
13. No ambient side effects, clock, filesystem, Git, network or provider access.
14. Full M14/M15 regressions remain green.
15. Full repository validation/typecheck/dependency audit pass.
16. Exact-head objective audit reports CRITICAL=0/HIGH=0.
17. `main`, `v1.0.0`, publication and production acceptance remain unchanged.

## VALIDATION LADDER

- L1: focused execution-capsule unit tests.
- L2: M14/M15 integration and permutation/determinism tests.
- L3: startup/public-export purity and schema-negative tests.
- L4: full repository validation + dependency audit.
- L5: exact-head V1.1 assurance workflows.

## EVIDENCE BUNDLE

Create `.engineering/evidence/GBS-V11-WO-005-EVIDENCE.md` with:
- exact admitted base and implementation head;
- changed files/reasons;
- public API;
- CTX-DET-01..08 mapping;
- deterministic-repeat proof;
- permutation proof;
- meaningful-vs-volatile change proof;
- fail-closed M14/M15 binding proof;
- drift/state/action mapping;
- prior M14/M15 regression proof;
- full validation/audit results;
- findings by severity;
- explicit production/publication boundary.

## REVIEW FORMAT

Objective reviewer returns one terminal disposition: `APPROVED`, `CORRECTION_REQUIRED`, or `BLOCKED`, bound to exact implementation head.

## STOP CONDITION

Stop after implementation, validation, evidence and PR update. Do not promote `main`.

STOP CONDITION: `GBS_V11_WO_005_READY_FOR_OBJECTIVE_AUDIT`
