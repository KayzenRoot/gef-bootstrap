# GBS-M09-S02 — Required Documents

Status: `FROZEN`

## Purpose
Define the minimum canonical document classes a governed Source Pack must represent before it can claim structural completeness. Required means required by the applicable GEF lifecycle and project mode, not that every repository must use one hard-coded filename.

## Required semantic classes
The Source Pack must resolve these classes when applicable:
1. `PROJECT_IDENTITY`
2. `CONSTITUTION_GOVERNANCE`
3. `CURRENT_CHECKPOINT`
4. `DECISIONS`
5. `SCOPE`
6. `REQUIREMENTS`
7. `ARCHITECTURE`
8. `COMPLETION_DEFINITION`
9. `ACTIVE_PLANNING_STATE`
10. `EXECUTION_GOVERNANCE`
11. `SECURITY_POLICY`
12. `VALIDATION_POLICY`
13. `BACKLOG_FUTURE_WORK`
14. `INNOVATION_LEDGER`

A semantic class may map to one canonical file, a governed section, or a brownfield alias established later by M13. File naming alone never establishes authority.

## Required-source state machine
Each required class resolves to exactly one of:
- `RESOLVED_ACTIVE`
- `RESOLVED_NOT_APPLICABLE`
- `MISSING_REQUIRED`
- `AMBIGUOUS`
- `CONFLICT`
- `INVALID_BINDING`

Only the first two are non-blocking for structural completeness. `NOT_APPLICABLE` requires an explicit owning rule, never absence-by-assumption.

## TECH-M09-03 — Canonical Requirement Matrix
GEF introduces the Canonical Requirement Matrix, CRM. It maps lifecycle stage × adoption mode × profile × authority domain to required semantic classes. The matrix is deterministic and versioned. This avoids repeatedly asking an LLM which documents are necessary while still allowing M13 brownfield aliases and future profiles.

The CRM does not decide project semantics. It answers only whether a source class is required, conditional or not applicable for an already-governed context.

## TECH-M09-04 — Source Alias Bridge
GEF introduces Source Alias Bridge, SAB, for existing repositories. SAB can bind an existing canonical artifact to a GEF semantic class without copying or renaming it. Every alias records exact locator, authority domain, project binding and validity fingerprint. Alias creation policy belongs to M13; M09 only defines how an admitted alias participates in a Source Pack.

This gives brownfield projects early GEF benefits without destructive document normalization.

## Missing-source behavior
M09 never fabricates a missing canonical document and never substitutes chat history, README prose or a similarly named file merely to satisfy the matrix. Missing requirements are explicit diagnostics routed to the owning planning/adoption stage.

## Duplication behavior
Two candidates for one required semantic class are not resolved by timestamp, lexical path order or file size. If existing authority rules do not identify the active source, the state is `AMBIGUOUS` or `CONFLICT`.

## Compact projection
For downstream token economy, each resolved class exposes a compact descriptor containing class ID, active locator, authority domain, lifecycle status, exact binding and fact-index pointer. This descriptor is an index, not replacement truth.

## Cross-module boundaries
- M10 owns planning workspace details.
- M11 owns decision semantics.
- M12 owns scope and DoD semantics.
- M13 owns adoption and alias admission.
- M14 decides Minimum Sufficient Context.
- M17+ own checkpoint mechanics.
M09 only makes their canonical source classes addressable and validity-bound.

## Proof obligations
Future implementation must prove deterministic matrix evaluation, explicit not-applicable provenance, missing/ambiguous/conflict detection, no filename-based authority inference, safe brownfield alias representation and compact descriptors that always point back to canonical truth.

No production credit is earned by this planning session.

STOP CONDITION: `READY_FOR_GBS_M09_S03_CONDITIONAL_DOCUMENTS` after governed promotion.