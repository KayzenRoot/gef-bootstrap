# GBS-M12-S03 — Definition of Done

Status: `FROZEN`
Module: `GBS-M12 Scope & DoD Engine`
Session: `S03`
Risk: `STANDARD`

## Objective
Materialize the project DoD as a deterministic evaluation contract without redefining the canonical DoD, evidence engine or assurance pipeline.

## Ownership boundary
The canonical `.engineering/DEFINITION-OF-DONE.md` defines what completion means. M12 evaluates caller-supplied DoD criteria and evidence references. M24+ owns evidence/assurance semantics; M17 owns checkpoint promotion; M21 owns progress; release mechanics remain M33/M62. M12 may say a supplied criterion set evaluates complete or incomplete, but it cannot promote `MODULE_DONE` or `PRODUCTION_RELEASE_DONE` by itself.

## Criterion model
Each criterion has:
- stable `criterionId`;
- `required` boolean;
- `applicable` boolean;
- status: `SATISFIED`, `UNSATISFIED`, `BLOCKED`, `NOT_APPLICABLE`;
- canonical source references;
- evidence references when satisfaction is claimed;
- explicit rationale when not applicable.

## Evaluation rules
1. A required + applicable criterion is complete only when status is `SATISFIED` and at least one evidence reference exists.
2. `BLOCKED` or `UNSATISFIED` on a required + applicable criterion blocks DoD completion.
3. `NOT_APPLICABLE` is legal only when `applicable=false` and a non-empty rationale exists.
4. `applicable=false` with any status other than `NOT_APPLICABLE` is invalid.
5. `applicable=true` with `NOT_APPLICABLE` is invalid.
6. A required criterion cannot disappear from the denominator through evaluation. The engine evaluates the provided frozen criterion set; it does not silently remove/waive obligations.
7. Duplicate/invalid criterion IDs fail closed.
8. Evidence reference presence is necessary for a satisfied required criterion; M12 does not assert evidence truth/freshness beyond the supplied binding.
9. Non-required criteria may remain unsatisfied without making the supplied required set incomplete, but diagnostics remain visible.
10. Empty required-set completion is allowed only as a truthful result of the supplied set; it grants no project/module completion authority.

## DoD Evaluation Envelope
The engine returns an immutable object containing:
- `complete`;
- required/applicable counts;
- satisfied required count;
- blocking criterion IDs;
- invalid criterion IDs;
- diagnostics;
- explicit `authorityNotice: DOD_EVALUATION_ONLY`.

The authority notice prevents consumers from mistaking an evaluator result for checkpoint or release promotion.

## DoD Denominator Guard
A companion comparison detects criterion-set drift between baseline and candidate states:
- added/removed criterion IDs;
- changes in `required` or `applicable` posture;
- whether required obligations were removed/downscoped;
- whether new required obligations were introduced.

This helper reports change; it never authorizes it.

## Failure cases
- satisfied required criterion without evidence -> incomplete;
- duplicate criterion -> invalid/incomplete;
- malformed reserved identity -> invalid;
- required criterion marked non-applicable without rationale -> invalid;
- baseline required criterion removed in candidate -> denominator erosion finding;
- criterion changed in-place without explicit delta -> detectable via snapshot comparison;
- stale/invalid external evidence is later discovered -> caller must re-evaluate; no lifetime guarantee is fabricated here.

## Technology candidates
- **JSON Schema + generated validators**: IMPORTANT for cross-language contract interchange; hand-written strict validator remains sufficient now.
- **CUE**: FUTURE candidate for constraint-rich DoD composition and validation, gated by complexity/ROI.
- **OPA/Rego or CEL**: FUTURE candidate for policy-driven applicability after M16 authority exists.
- **Property-based testing (fast-check or equivalent)**: IMPORTANT candidate for combinatorial DoD-state testing in M53/M54.
- **Proof-carrying criterion receipts / Merkle commitments**: FUTURE candidate owned by M24/M25/M37, not M12.
- **Incremental evaluation via dependency graph invalidation**: FUTURE candidate after M25/Test Impact ownership exists.

## Acceptance
Implementation must prove strict status/applicability consistency, evidence-required satisfaction, immutable deterministic evaluation, no hidden waiver/denominator manipulation, criterion-set drift visibility and no completion-promotion authority.

No known HIGH/CRITICAL planning finding.

STOP CONDITION: `GBS_M12_S03_FROZEN`.
