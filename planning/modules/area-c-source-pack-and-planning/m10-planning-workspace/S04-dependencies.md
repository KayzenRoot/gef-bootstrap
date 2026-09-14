# GBS-M10-S04 — Dependencies

Status: `FROZEN`
Module: `GBS-M10 Planning Workspace`
Classification: `CORE_REQUIRED`
Authority domain: `PLANNING`

## Objective
Define explicit planning dependency semantics, deterministic ordering and selective invalidation while preserving Architecture, Source Pack and future Proof Graph ownership.

## Dependency kinds
- `AREA_CONTAINS_MODULE`;
- `MODULE_CONTAINS_SESSION`;
- `REQUIRES_BEFORE` — ordering dependency;
- `CONSUMES_CONTRACT` — semantic dependency with source reference;
- `PRODUCES_FOR` — directional planning relation;
- `INFORMATIONAL` — non-ordering relation.

Ordering edges (`REQUIRES_BEFORE`) MUST form a DAG. Containment MUST form a valid workspace hierarchy. Informational edges may form cycles but are excluded from execution ordering.

## Planning Dependency Graph
The **Planning Dependency Graph (PDG)** is a deterministic adjacency representation over stable IDs. It supports:
- duplicate/missing endpoint detection;
- topological ordering for ordering edges;
- cycle diagnostics with involved stable IDs;
- bounded ancestor/descendant traversal;
- affected-session/module calculation after upstream change;
- explicit unknown-coverage state.

## Dependency Cut Set
A **Dependency Cut Set (DCS)** is the smallest known affected descendant set for a changed stable dependency subject. If dependency coverage is incomplete or ambiguous, M10 returns `CONSERVATIVE_WIDENING_REQUIRED` rather than falsely narrow impact.

## Critical Planning Path
A **Critical Planning Path Projection (CPP)** computes longest ordering depth from declared `REQUIRES_BEFORE` edges only. It is an explanatory scheduling aid, not ETA authority and not M63 performance policy.

## Source relationship
M09 authority/source dependency facts may be referenced by exact source identity. M10 cannot reinterpret Source Pack authority resolution. M25 later owns release-grade proof graph semantics. M28 owns authoritative test-impact analysis.

## Technology candidates
| Mechanism | Classification | Disposition |
|---|---|---|
| deterministic DAG/topological sort | `NECESSARY` | Implement with bounded traversal and stable tie-break by stable ID. |
| Dependency Cut Set | `NECESSARY` | Implement narrow impact + conservative widening. |
| Critical Planning Path Projection | `IMPORTANT` | Implement pure explanatory projection without ETA claims. |
| incremental graph recomputation | `IMPORTANT` | Interface-ready; full caching deferred until benchmark evidence. |
| external graph database | `FUTURE` | No baseline dependency; in-memory graph is sufficient. |
| learned dependency prediction | `EXPERIMENTAL_GATED` | May suggest candidates later, never create canonical dependency silently. |

## Security/reliability
Traversal has explicit node/edge budgets and cancellation hook. Malformed/prototype-hostile input fails closed. No repository execution, package loading, network access or ambient-environment discovery is allowed.

## Proof obligations
DAG ordering determinism, cycle diagnostics, informational-cycle tolerance, missing endpoints, cut-set correctness, conservative widening, traversal budgets/cancellation, and CPP reproducibility.

Open questions: `0`.

STOP CONDITION: `GBS_M10_S04_FROZEN`.