# GBS-M10-S02 — Modules

Status: `FROZEN`
Module: `GBS-M10 Planning Workspace`
Classification: `CORE_REQUIRED`
Authority domain: `PLANNING`

## Objective
Define deterministic module planning records and their relation to Areas, canonical classifications, requirements and downstream sessions without allowing M10 to originate or mutate product scope.

## Module planning record
A module planning record contains stable `moduleId`, owning `areaId`, canonical display name, planning status, ordered session IDs, declared dependency IDs, source/requirement references supplied by canonical authorities, classification reference, proof-owner hints and optional notes.

The record MUST distinguish:
- copied/reference metadata from canonical sources;
- planning-owned structure;
- derived validation state.

Classification (`CORE_REQUIRED`, `PRODUCT_INCLUDED`, etc.) is a reference to Scope and cannot be altered by M10.

## Module Contract Facet
M10 introduces a **Module Contract Facet (MCF)**, a compact planning projection containing only facts needed to schedule/validate module planning: stable ID, Area, upstream/downstream references, session set, canonical classification reference and source fingerprints. It is explicitly not a replacement for full canonical docs.

## Dependency Admission Envelope
A **Dependency Admission Envelope (DAE)** records a claimed planning dependency together with relation type (`REQUIRES`, `CONSUMES_CONTRACT`, `PRODUCES_FOR`, `ORDER_ONLY`) and evidence/source reference when known. Unknown or unresolved dependency targets fail planning validation rather than being silently dropped.

## Rules
1. Module IDs are globally unique inside one workspace.
2. Every module belongs to exactly one Area in the planning projection.
3. Every session referenced by a module must identify the same module owner.
4. Planning status cannot imply production completion.
5. Module dependency edges must be explicit; inferred lexical/path ordering is forbidden.
6. Cycles are permitted only when relation semantics explicitly allow a non-ordering informational edge; executable/order dependencies must form a DAG.
7. Missing canonical classification/source references produce typed gaps, not invented defaults.
8. M10 cannot mark `MODULE_DONE`; it may only represent an upstream promoted completion state with provenance.

## Technology candidates
| Mechanism | Classification | Disposition |
|---|---|---|
| Module Contract Facet | `NECESSARY` | Implement deterministic compact projection. |
| Dependency Admission Envelope | `NECESSARY` | Implement typed relations and fail-closed validation. |
| RFC 6901 JSON Pointer source locators | `IMPORTANT` | Supported as opaque normalized locator form when supplied; full pointer resolver deferred to owning contract layer. |
| Content-addressed module capsules | `IMPORTANT` | Digest-ready projection now; persistence/cache later. |
| Graph database | `FUTURE` | Not justified for baseline; deterministic in-memory maps/DAG sufficient. |

## Test obligations
Validate duplicate IDs, orphan modules, cross-area mismatch, unknown session references, classification preservation, deterministic MCF, dependency relation validation, ordering cycles, and startup purity.

## Boundary
M10 represents planning dependencies only. Architecture dependency authority remains Architecture; admitted scope remains Scope; decision causality remains M11; production progress remains M21.

Open questions: `0`.

STOP CONDITION: `GBS_M10_S02_FROZEN`.