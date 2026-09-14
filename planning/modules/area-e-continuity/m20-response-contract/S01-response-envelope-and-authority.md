# GBS-M20-S01 — Response Envelope & Authority
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Freeze a deterministic response envelope that can present governed project truth without becoming a new source of truth or silently upgrading conversational/model assertions into canonical facts.

## Scope
M20 owns response semantics and projection contracts. It may consume verified checkpoint/resume/registry and later progress/estimate/status inputs, but it cannot compute or mutate those owning domains.

## Technologies
- **Response Contract Capsule (RCC20)**: immutable semantic response subject binding project identity, response kind, phase/current-work references, source claims, verdict input and canonical next-action reference.
- **Response Authority Boundary (RAB20)**: every output field remains subordinate to its owning canonical source; M20 formats and validates claims but never creates source authority.
- **Response Schema Envelope (RSE20)**: versioned response schema with explicit compatibility identity and deterministic digest.
- **Source-Bound Field Claim (SBFC20)**: each material field carries an owner domain, subject identity, value digest, source identity and freshness/validity binding.
- **Response Provenance Index (RPI20)**: compact deduplicated index from response fields to source-bound claims, allowing validation without repeating source text.

## Invariants
1. Conversation/model memory alone cannot establish a governed response field.
2. Response fields with missing, conflicting or stale authority remain typed non-success/unknown states.
3. The same canonical inputs produce the same semantic response independent of incidental wording or source enumeration order.
4. Response schema version is explicit and participates in the semantic digest.
5. Material field provenance is addressable and validity-bound.
6. M20 cannot mutate checkpoint, registry, progress, estimate, project-status, evidence/proof or policy state.

## Out of scope
Progress calculation (M21), ETA/estimation (M22), project-status calculation (M23), evidence/proof generation (M24/M25), telemetry (M43), artifact generation (M46), operator UI/style ownership (M47), and external provider mutation.

STOP CONDITION: `M20_S01_FROZEN`.
