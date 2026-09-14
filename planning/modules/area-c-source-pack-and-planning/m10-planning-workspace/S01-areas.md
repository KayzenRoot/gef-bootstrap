# GBS-M10-S01 — Areas

Status: `FROZEN`
Module: `GBS-M10 Planning Workspace`
Classification: `CORE_REQUIRED`
Authority domain: `PLANNING`

## Objective
Define the deterministic representation and validation semantics for planning Areas without allowing the planning workspace to supersede Scope, Requirements, Architecture, Decisions, Completion or repository truth.

## Canonical constraints
- Areas are organizational planning containers, never independent product authority.
- Stable IDs are mandatory and must survive display-name changes.
- Area ordering is explicit and deterministic; filesystem enumeration, locale, timestamp and chat order are non-authoritative.
- Every Area references admitted module IDs from the Master Module Index or reports a typed unresolved reference.
- M10 may represent canonical-source bindings but may not reinterpret their semantics.
- Existing complete-product classification remains owned by Scope.
- Planning data is read-only with respect to canonical repository sources; later durable publication must route through governed mutation infrastructure.

## Area model
Required fields:
- `schemaVersion`;
- `workspaceId`;
- `areaId` stable semantic ID;
- `name` display label;
- `ordinal` explicit deterministic position;
- `moduleIds` ordered stable module references;
- `sourceRefs` immutable source identities/fingerprints where supplied;
- `status` from the M10 status vocabulary;
- `tags` optional normalized metadata that cannot affect authority.

### Validation
Fail closed on duplicate IDs, duplicate ordinals, unknown status, malformed references, cross-workspace identity mismatch, non-finite ordinals, and prototype-hostile structured input when raw input is admitted.

## Area Topology Index
M10 introduces an **Area Topology Index (ATI)**: a derived, disposable index keyed by stable area/module IDs. It accelerates lookup and dependency queries but cannot become canonical truth. Rebuilding ATI from equivalent planning input must yield the same semantic projection.

## Area Boundary Seal
An **Area Boundary Seal (ABS)** is a deterministic digest input projection of stable area identity, ordered module membership and relevant source bindings. It is useful for invalidating only planning descendants affected by an Area membership change. Digest capability is injected by callers; M10 does not hard-code a weak hash.

## Brownfield behavior
Brownfield workspaces may preserve project-native labels and grouping. Adoption/alias admission belongs to M13. M10 only stores already-governed stable IDs/aliases provided by upstream authority and must never normalize a healthy project destructively.

## Technology candidates
| Technology/mechanism | Classification | Decision |
|---|---|---|
| Area Topology Index | `NECESSARY` supporting mechanism | Implement as disposable deterministic derived index. |
| Area Boundary Seal | `NECESSARY` supporting mechanism | Implement digest-ready canonical projection; digest injection remains external. |
| Mermaid area graph export | `IMPORTANT` | Keep as renderer/export extension; no production scope expansion in M10. |
| SQLite planning index | `FUTURE` | Architecture allows rebuildable derived SQLite later; JSON/in-memory baseline is sufficient now. |
| learned area clustering | `EXPERIMENTAL_GATED` | Not admitted; may never override stable human/governed grouping. |

## Proof obligations
- order-invariant input normalization where ordering is semantically unordered;
- explicit ordinal behavior where ordering is semantic;
- duplicate/unknown reference rejection;
- deterministic ATI reconstruction;
- ABS projection changes only on semantically relevant inputs;
- no canonical mutation/network/environment reads;
- no Scope/classification inference.

## Ownership boundary
M09 owns Source Pack identity/authority mechanics. M10 owns planning workspace structure. M11 owns project decision semantics. M12 owns Scope/DoD semantics. M17 owns promoted checkpoint/current-state mechanics. M21 owns production progress accounting.

Open questions: `0`.

STOP CONDITION: `GBS_M10_S01_FROZEN`.