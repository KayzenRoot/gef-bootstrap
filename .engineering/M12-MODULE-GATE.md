# GBS-M12 — Scope & DoD Engine Module Gate

Status: `PLANNED_READY_FOR_IMPLEMENTATION`
Risk: `STANDARD`
Canonical production weight: `18 / 1088`

## Gate basis
S01 Classification, S02 Necessary / Important / Future / Out of Scope, S03 Definition of Done and S04 Scope Drift are `FROZEN`, with zero blocking planning questions.

## Required implementation surface
- versioned strict work-classification and DoD contracts;
- deterministic, evidence-bound classification with `UNRESOLVED` fail-closed state;
- Scope Admission Firewall where only `NECESSARY` is automatically admission-eligible;
- deterministic Reclassification Delta exposing expansion/erosion risk;
- strict DoD criterion validation and immutable DoD Evaluation Envelope;
- required/evidence/applicability enforcement with no silent waiver;
- DoD criterion-set denominator drift detector;
- immutable deterministic scope snapshots;
- Scope Drift Sentinel detecting unauthorized addition/upclassification, required removal/downclassification and OUT_OF_SCOPE presence;
- explicit authorization references for permitted scope changes;
- typed diagnostics, stable ordering, startup/import purity and no canonical mutation.

## Frozen authority boundaries
M12 owns work classification semantics, admission posture mapping, evaluation of supplied DoD criteria and detection of scope/criterion drift. It does not own Source Hierarchy (M09), planning topology/status (M10), project decisions/ADRs/conflict authority (M11), GEF adoption (M13), policy engine (M16), checkpoint promotion (M17), progress/denominator accounting (M21), evidence/proof/assurance (M24+), integrity (M37), audit ledger (M44) or release acceptance (M62).

The complete-product inventory classification `CORE_REQUIRED/PRODUCT_INCLUDED/EXPERIMENTAL_GATED/OPTIONAL_ADAPTER/OUT_OF_SCOPE` is not replaced by the M12 work-admission classification `NECESSARY/IMPORTANT/FUTURE/OUT_OF_SCOPE`.

## Canonical accounting
- M12 weight: `18` from frozen Backlog Baseline (E4/R4/I5/P5).
- production denominator remains `1088`.
- planning/gate earns `0 / 18`.
- implementation may earn M12 weight only after exact-head evidence, audit, merge and checkpoint promotion establish `MODULE_DONE`.

## Technology dispositions
`NECESSARY`: discriminated TypeScript contracts, deterministic canonical projections, immutable data, diagnostics, classification/admission separation, DoD evaluation, scope/criterion drift detection.

`IMPORTANT`: JSON Schema 2020-12 interoperability, JCS-compatible projection discipline, RFC 6902 delta export, property-based/differential tests, provenance graph visualization.

`FUTURE/EXPERIMENTAL`: OPA/Rego, CEL general policy execution, CUE constraint composition, Z3/SAT contradiction solving, Merkle snapshot/proof trees, Datalog/transitive impact, WASM policy sandbox, temporal policy ledger, signed policy bundles. These remain proposals under their future owner modules and do not expand M12.

## Tests
Strict schema/version/ID validation; deterministic projections; source-bound NECESSARY; authority conflict -> UNRESOLVED; only NECESSARY auto-admit eligible; reclassification expansion/erosion; DoD required criterion evidence; applicability consistency; duplicate criteria; criterion-set removal/addition/reclassification; unauthorized scope addition/removal/up/downclassification; authorized but visible changes; OUT_OF_SCOPE blocking; immutable results; no progress/checkpoint authority; startup purity; full repository regression; focused Linux/Windows/macOS.

## Readiness verdict
All M12 planning prerequisites are internally coherent and implementation-testable. No unresolved HIGH/CRITICAL planning defect is known. Canonical denominator and ownership boundaries are preserved.

STOP CONDITION: `M12_PLANNED_READY_FOR_IMPLEMENTATION`.
