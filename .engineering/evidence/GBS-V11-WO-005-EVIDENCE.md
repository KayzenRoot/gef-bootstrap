# GBS-V11-WO-005 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-005.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-005.json`
Execution Handoff: `.engineering/execution-handoffs/GBS-V11-WO-005.json`
Implementation PR: #290
Stop condition: `GBS_V11_WO_005_READY_FOR_OBJECTIVE_AUDIT`
Audit disposition: **implementation evidence only; independent objective audit remains required**

## 1. Exact lineage

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Admitted implementation base | `89018bbd417be204e0d9bdae6cf42f3cc2c44e3d` |
| Implementation branch | `feat/1.1/wo-005-execution-capsule` |
| Substantive candidate head before this evidence-only commit | `aa1810d52a5893d28d7b708b5ef94909b23c7724` |
| Governance PR / review | #289 / `5291367004`, APPROVED 0/0 |
| Production `main` | `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`, not modified |
| `v1.0.0` tag object | `aac89f9c3f0c884474958025bf14828bc338b5ee`, not moved |
| D-0061 / ADR-0005 | legacy ecosystem detachment preserved |

The evidence file itself is non-semantic product evidence. Final objective audit MUST bind the final PR head containing this file and require all applicable checks green at that head.

## 2. Delivered implementation

- Added pure deterministic `compileExecutionCapsule` under existing M15 Execution Pack Compiler ownership.
- Added canonical serializer `serializeExecutionCapsuleCanonical`.
- Added `verifyExecutionCapsuleFingerprint` and contract validator.
- Reused injected SHA-256 `OperationOptions`; no ambient crypto, filesystem, Git, network, process, provider or clock observation.
- Projection consumes an admitted M14 context/handoff and an already compiled M15 pack/receipt.
- M15 graph/tool/validation/semantic seals are recomputed before projection. A copied/tampered pack or mismatched receipt fails closed.
- Every frozen M15 receipt binding (pack/task/context/policy/capability plus graph/tool/validation/semantic digests) is checked against the sealed pack before projection.
- Runtime capsule validation enforces the frozen output shape, nested additional-property boundaries, enums, raw lowercase SHA-256 fields, date-time metadata, production-branch prohibition and proof-credit boundary.
- `capsuleId` is derived from a full SHA-256 of the semantic execution projection, including resulting state/certainty and navigation/test/proof bindings; volatile metadata and expiry do not alter identity.
- Navigation is explicit and search-suppressed.
- Affected files/dependencies, constraints, acceptance proof obligations, selected tests, proof references and STOP CONDITION are carried deterministically.
- Proof references are structurally sealed with `manufacturesProductionCredit:false`.
- L5 cannot suppress the final exact-head sweep.
- Unknown dependency closure or unresolved questions produce `INDETERMINATE`, never fabricated certainty.
- D-0061/ADR-0005 removed ecosystem bindings are not reintroduced.

## 3. CTX-DET mapping

| ID | Objective evidence |
|---|---|
| CTX-DET-01 | repeat compilation is byte-identical and fingerprint-identical |
| CTX-DET-02 | semantic scope change changes capsule fingerprint |
| CTX-DET-03 | volatile metadata / expiry changes do not alter semantic fingerprint |
| CTX-DET-04 | incomplete dependency knowledge => `INDETERMINATE` + `INSUFFICIENT`, never `COMPILED` |
| CTX-DET-05 | `COMPILED`, `INDETERMINATE`, `STALE`, `REJECTED` all validated |
| CTX-DET-06 | SDS drift classes map deterministically to state/action |
| CTX-DET-07 | empty constraints or escalation fail closed |
| CTX-DET-08 | production-branch mutation / `main` target is rejected |

Focused source: `tests/v11-wo-005-execution-capsule.test.mjs`.

## 4. Additional negative and integrity proofs

- permutations of semantically unordered sets compile to identical canonical output;
- stale or digest-mismatched M14 handoff cannot become `COMPILED`;
- M15 receipt mismatch is rejected;
- M15 policy/capability/task/context binding mismatch is rejected, not only digest mismatch;
- output-schema validator rejects undeclared properties and malformed nested values;
- schema SHA fields reject prefixed/uppercase non-conforming representations;
- M15 pack content tamper is detected by recomputed sealed digests;
- write-allowed/write-forbidden intersection is rejected;
- proof references cannot manufacture production credit;
- L5 cannot set `finalSweepRequired:false`;
- unresolved questions degrade to `INDETERMINATE`;
- affected-file projection must cover all M15 instruction targets;
- MUST_READ projection must cover admitted M14 semantic payloads;
- M15 startup-purity test proves the public exports introduce no import-time side effect.

## 5. Substantive-head assurance

Exact substantive head: `aa1810d52a5893d28d7b708b5ef94909b23c7724`

| Workflow | Run | Result |
|---|---:|---|
| m01-validation | `35869557331` | SUCCESS |
| M41-M47 Integrated Assurance | `35869557228` | SUCCESS |
| M48-M54 Integrated Assurance | `35869557261` | SUCCESS |
| M55-M61 Integrated Assurance | `35869557314` | SUCCESS |
| M62-M63 Final Assurance | `35869557247` | SUCCESS |
| M15 Execution Pack Compiler | `35869557223` | SUCCESS |
| WO-005 Execution Capsule Assurance | `35869557233` | SUCCESS |

WO-005 dedicated matrix `35869557233` executed CTX-DET + M14/M15 integration on:
- Ubuntu: SUCCESS
- Windows: SUCCESS
- macOS: SUCCESS

## 6. Changed product surfaces

- `packages/execution-pack-compiler/src/execution-capsule.ts`
- `packages/execution-pack-compiler/src/public.ts`
- `tests/m15-startup-purity.test.mjs`
- `tests/v11-wo-005-execution-capsule.test.mjs`
- `.github/workflows/wo-005-execution-capsule.yml`
- this evidence file

Governance/handoff files for the increment are separately bound by the admission lineage.

## 7. Findings and boundaries

Implementation self-evidence does not issue an objective approval.

Known unresolved CRITICAL findings: 0.
Known unresolved HIGH findings: 0.

Still required:
1. final exact-head CI after this evidence commit;
2. independent objective audit of the final PR head;
3. no merge unless objective audit returns APPROVED with CRITICAL=0/HIGH=0.

Not implemented here:
- WO-006 incremental validation selection;
- WO-007 proof-reuse eligibility;
- WO-008 performance telemetry;
- WO-009 integrated release assurance/docs;
- WO-010 production promotion.

Production/publication boundary remains closed. `main`, `v1.0.0`, registry publication and production acceptance are unchanged.

STOP CONDITION: `GBS_V11_WO_005_READY_FOR_OBJECTIVE_AUDIT`
