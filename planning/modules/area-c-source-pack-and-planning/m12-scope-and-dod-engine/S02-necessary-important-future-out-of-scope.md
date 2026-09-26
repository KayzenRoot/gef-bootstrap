# GBS-M12-S02 — Necessary / Important / Future / Out of Scope

Status: `FROZEN`
Module: `GBS-M12 Scope & DoD Engine`
Session: `S02`
Risk: `STANDARD`

## Objective
Freeze the admission semantics attached to M12 work classifications so useful ideas can be retained without silently expanding the current production target.

## Canonical meanings
### NECESSARY
Work is `NECESSARY` only when current canonical obligations make it required for correctness, safety, compatibility, an admitted Requirement, frozen Architecture/contract, frozen DoD, or an accepted/frozen Decision. A source binding is mandatory.

Admission behavior: eligible for automatic admission to the current governed increment, subject to normal Work Order and dependency/risk gates. Classification alone does not execute or complete it.

### IMPORTANT
Work has demonstrated engineering/product value but is not required by the current canonical completion obligations.

Admission behavior: retained as a governed candidate. It does **not** enter the current increment automatically. Explicit canonical approval/replanning is required before implementation.

### FUTURE
Work belongs to a later module/version/owner, or requires maturity/evidence not currently available.

Admission behavior: defer without losing provenance. It is not a defect in the current increment unless another canonical source says otherwise.

### OUT_OF_SCOPE
Work conflicts with frozen Scope/product identity, violates ownership boundaries, duplicates another owner without justified integration, or otherwise lacks legal admission.

Admission behavior: reject from the current work surface. Re-entry requires canonical change through the owning governance path, never an M12 local override.

## Admission decision matrix
| Classification | Current automatic admission | Requires explicit governance | Can block current DoD by itself |
|---|---|---|---|
| NECESSARY | YES | Work Order/risk gates still apply | YES, when tied to admitted obligation |
| IMPORTANT | NO | YES | NO |
| FUTURE | NO | YES, to pull forward | NO |
| OUT_OF_SCOPE | NO | canonical scope/decision change | NO |
| UNRESOLVED evaluation | NO | resolve source/evidence conflict | YES when it may conceal a necessary obligation |

## Guardrails
1. Benefit, popularity, novelty, low implementation cost or user enthusiasm do not convert `IMPORTANT` into `NECESSARY`.
2. Schedule pressure does not convert a current obligation into `FUTURE`.
3. An explicit later owner is respected; M12 cannot steal ownership.
4. `OUT_OF_SCOPE` is not a deletion mechanism. The candidate and rationale remain explainable/auditable where the caller persists them.
5. Classification is validity-bound to referenced canonical state. Changed fingerprints can make a previous result stale.
6. Reclassification must produce an explicit before/after delta; in-place silent relabeling is prohibited.
7. M12 never changes the frozen 61-module / 1088-weight denominator. Any denominator recalibration requires its separate governed process.

## Scope Admission Firewall
The implementation will expose a pure admission function that maps classification to policy:
- `NECESSARY` -> `AUTO_ADMIT_ELIGIBLE`;
- `IMPORTANT` -> `HOLD_FOR_EXPLICIT_APPROVAL`;
- `FUTURE` -> `DEFER_TO_FUTURE_OWNER`;
- `OUT_OF_SCOPE` -> `REJECT_CURRENT_SCOPE`.

The firewall is intentionally simple and deterministic. It is not a generic policy engine; M16 owns broader policy/guardrails.

## Reclassification Delta
A pure comparison helper must expose:
- previous/current class;
- whether admission posture changed;
- whether the change increases current-scope obligations;
- whether the change removes a required obligation;
- whether explicit governance is required.

This makes scope creep and scope erosion visible before mutation.

## New technology candidates
- **Open Policy Agent/Rego**: IMPORTANT/FUTURE candidate for M16 policy surfaces, not required in M12.
- **CEL**: IMPORTANT candidate for small deterministic policy expressions where portability matters.
- **Policy-as-data signed bundles**: FUTURE candidate owned jointly by M16/M37/M44, requiring integrity/evidence design.
- **Constraint provenance graph**: IMPORTANT candidate for future explainability, with nodes linking candidate -> classification predicate -> canonical source.
- **Differential policy testing / property-based generators**: IMPORTANT candidate for M53/M54 to harden classification invariants.
- **Decision tables compiled to code**: IMPORTANT candidate if future scale makes hand-coded rules hard to audit.

No proposal is promoted merely by appearing here.

## Acceptance
Tests must show only NECESSARY is auto-admit eligible, schedule pressure cannot downgrade necessary work, OUT_OF_SCOPE cannot be locally overridden, reclassification deltas flag expansion/erosion and the canonical denominator remains external/read-only.

No known HIGH/CRITICAL planning finding.

STOP CONDITION: `GBS_M12_S02_FROZEN`.
