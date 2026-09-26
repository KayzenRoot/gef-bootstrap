# GBS-M28-S02 — Impacted Tests

Status: `FROZEN`
Module: `GBS-M28 — Test Impact Engine`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`
Source directive: `ADR-0002`

## Objective
Freeze deterministic concrete test selection and proof-preserving reuse. S02 converts current semantic/source deltas, the verified S01 map and the active assurance requirements into the minimum sufficient intermediate test set, while recording why every relevant test is `RUN`, `REUSE` or widened into execution.

Selection minimizes repeated work only when current proof permits it. No cached PASS, filename, unchanged display name or caller preference can suppress a required test.

## Frozen mechanisms
1. **AHG28 — Assurance Handoff Gate**: verifies the current read-only DAH27 binding for consumer `M28_TEST_IMPACT` and imports assurance class/profile/candidate/config/runtime/toolchain requirements without granting M28 assurance-verdict authority.
2. **ICD28 — Impact Closure Deriver**: expands changed source/contract subjects through S01 source/test and dependency edges into the deterministic impacted closure.
3. **TSP28 — Test Selection Plan**: emits the concrete set of tests/validation surfaces required now, including selection reason, ladder target, platform scope and dependency provenance.
4. **TPR28 — Test Proof Reuse Receipt**: immutable compatibility receipt for a prior accepted PASS, binding current test/source/dependency/config/fixture/toolchain/runtime/platform/policy identities and prior accepted evidence identity.
5. **TRV28 — Test Proof Reuse Validator**: independently recomputes TPR28 validity against current bindings and owner-authorized M24 evidence truth; M28 does not validate the underlying evidence itself.
6. **RUG28 — Reuse Eligibility Gate**: only `REUSABLE` receipts may suppress an otherwise repeated intermediate invocation; every stale/conflict/unknown state becomes non-reusable and widens as required.
7. **FFI28 — Failure Fingerprint Intake**: consumes current owner-authorized failure identity so a newer failure invalidates conflicting green reuse and feeds S03 failure-scoped retest planning.
8. **TSR28 — Test Selection Receipt**: immutable independently recomputable receipt listing `RUN`, `REUSE`, unresolved/widened tests, reason codes, assurance binding and selected-set digest.

## TPRR binding contract
A `TPR28` receipt MUST bind:
- stable test identity;
- test-content digest;
- impacted source/contract semantic digests;
- dependency-closure digest;
- relevant configuration digest;
- fixture/data identity when applicable;
- toolchain/runtime compatibility fingerprint;
- platform identity/relevance where applicable;
- prior PASS result/evidence identity accepted by M24 or an explicitly equivalent current evidence authority;
- applicable assurance policy/profile identity;
- candidate lineage/context identity;
- validity state and receipt digest.

Canonical reuse states:
`REUSABLE | STALE_SOURCE | STALE_TEST | STALE_CONFIG | STALE_FIXTURE | STALE_TOOLCHAIN | STALE_RUNTIME | PLATFORM_MISMATCH | DEPENDENCY_UNKNOWN | POLICY_DRIFT | CURRENT_FAILURE | CONFLICT | INDETERMINATE | TRUNCATED`.

Only `REUSABLE` suppresses that repeated intermediate test. Every other state is fail-closed.

## Selection algorithm rules
1. Admit current S01 graph only through TMG28.
2. Admit active assurance context only through AHG28 or an equivalent owner-authorized assurance binding defined by the Work Order.
3. Changed semantics select directly mapped tests.
4. Dependency closure expands selection transitively and boundedly.
5. Platform relevance expands tests to required platform instances.
6. Mandatory broader suites named by assurance policy remain selected even when no local edge independently selects them.
7. A relevant test may become `REUSE` only through current TPR28 + TRV28 + RUG28 success.
8. An absent/invalid receipt does not automatically run every repository test; it runs the test when it falls inside the current impact/risk/assurance radius.
9. A current failure dominates older green proof.
10. Duplicate selected identities collapse without losing distinct platform/config obligations.
11. Unresolved graph knowledge is routed to S04 widening, never interpreted as no impact.

## Evidence and proof boundary
M28 references prior accepted evidence but does not become M24. It may determine compatibility of a prior test proof with current impact bindings; it may not turn rejected/stale evidence into accepted evidence or create a PASS that did not occur.

M25 proof carry-forward may be referenced where applicable, but M28 never mutates proof claims. M26 semantic deltas may inform the changed-subject set but do not select tests. M27 assurance requirements can widen/mandate tests but M28 cannot downgrade them.

## Required attacks and proofs
Stale green receipt; same name/new test body; same ID/divergent test; fixture/config drift; toolchain/runtime upgrade; platform mismatch; hidden dependency; conflicting dependency graph; forged PASS/evidence ID; rejected M24 evidence referenced as green; current failure plus old PASS; assurance-profile drift; cross-project/cross-lineage receipt splice; duplicate platform invocation; permutation invariance; cancellation/truncation and oversized impact closure.

Planning result: S02 may reduce repeated intermediate validation only when it can produce an auditable current selection/reuse receipt.

STOP CONDITION: `M28_S02_FROZEN`.