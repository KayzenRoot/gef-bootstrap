# GBS-M27-S04 — Assurance Execution & Gates

Status: `FROZEN`
Module: `GBS-M27 — Assurance Pipeline`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze the fail-closed gate layer that decides whether the required assurance profile has been executed completely enough to admit a final assurance verdict. Gate success is about fulfilled obligations, not raw test count.

## Frozen mechanisms
1. **AEP27 — Assurance Execution Plan**: deterministic obligation plan describing required validation categories, owners, sequence constraints, parallel-safe groups and final exact-head requirements without choosing concrete M28 tests.
2. **LFG27 — Assurance Ladder Floor Gate**: enforces the minimum validation ladder required by assurance class/risk and prevents a caller from stopping after a lower intermediate level.
3. **EHF27 — Exact-Head Full Sweep Gate**: adopts the owner directive `TECH-0058`; verifies final required assurance evidence is bound to the exact final candidate identity/config/runtime scope and cannot be satisfied by an earlier implementation state.
4. **RPG27 — Runtime & Platform Gate**: verifies required runtime/platform coverage identities are present when the assurance profile demands them; no host-default inference.
5. **SAG27 — Security Assurance Gate**: verifies mandatory security-analysis obligations and findings without M27 replacing M34/M35/M58 ownership.
6. **CFG27 — Context Freshness Gate**: rechecks source/proof/review/policy/candidate freshness immediately before verdict admission and rejects TOCTOU-style drift.
7. **BMG27 — Budget & Materialization Gate**: converts bounded execution/history/materialization exhaustion into typed `TRUNCATED` or `INDETERMINATE`; budgets never create success.
8. **VAG27 — Assurance Verdict Admission Gate**: the only M27 path allowed to admit final assured state, combining all current gate receipts deterministically.

## Validation ladder contract
M27 owns the required floor, not concrete test selection:
- `STANDARD`: current required static/direct validation and applicable acceptance obligations;
- `STANDARD_PLUS`: STANDARD plus affected contract/integration validation;
- `ELEVATED`: broader impacted/boundary/platform/recovery checks as required by profile;
- `HIGH_ASSURANCE`: risk/security expansion plus final exact-candidate assurance sweep;
- `MAX_ASSURANCE`: strongest applicable evidence/proof/review/security/platform/integrity obligations plus exact-candidate full sweep and independent semantic/integrity review.

The exact list of tests used to fulfill these categories is M28-owned. M32 may schedule CI. M27 checks that required categories and accepted evidence are satisfied.

## Exact-head semantics
Until M29 exists, M27 binds provider-neutral canonical candidate identity plus configuration/runtime/toolchain identities supplied by declared owners. When M29 is available, Git head/tree may become an additional owner-authorized binding, never an ambient dependency of the semantic core.

Any production-semantic candidate change after final exact-head evidence invalidates the affected final assurance evidence. Presentation/governance-only changes may be reusable only with an explicit compatibility witness from the relevant owner; M27 never assumes compatibility from filename or caller claim.

## Gate precedence
`TRUNCATED` > explicit policy/authority `BLOCKED` > mandatory truth `INDETERMINATE` > corrective failure `CORRECTION_REQUIRED` > `ASSURED`.

No gate ordering or input enumeration may change the outcome.

## MAX_ASSURANCE attack families
Stopping below required ladder, reusing prior-head final sweep, config/runtime drift, platform omission, security obligation omission, stale source/proof/review just before verdict, one-over-budget truncation, cancellation between gates, gate-order permutation, resealed gate receipt tamper and unsupported authority upgrade.

STOP CONDITION: `M27_S04_FROZEN`.
