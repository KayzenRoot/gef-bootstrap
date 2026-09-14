# GBS-M16-S02 — Policy Evaluation & Composition
Status: `FROZEN_CANDIDATE`

## Objective
Evaluate multiple applicable policies deterministically and preserve conflicting obligations.

## Technologies
- **Obligation Composition Graph (OCG)**: new NECESSARY technology composes required controls by dependency.
- **Conflict-Preserving Policy Join (CPPJ)**: new NECESSARY technology never silently chooses between incompatible authorities.
- **Applicability Witness Set (AWS)**: new NECESSARY evidence for why each policy applies/does not apply.
- **Policy Decision Receipt (PDR)**: deterministic result with inputs, obligations, denials, unknowns and provenance.
- **Guardrail Short-Circuit Firewall (GSF)**: new NECESSARY technology permits early deny/block, never early allow before all mandatory domains are evaluated.

General-purpose OPA/CEL integration may be adapters later; v1 semantics remain internal, typed and deterministic.

STOP CONDITION: `M16_S02_FROZEN_CANDIDATE`.