# GBS-M19-S02 — Index, Query & Collision
Status: `FROZEN`
Module weight: `14`
Assurance intensity: `STANDARD_PLUS`

## Objective
Provide deterministic lookup and collision handling across registered projects without performing broad repository discovery or guessing identity equivalence.

## Technologies
- **Project Registry Index (PRI19)**: deterministic indexes by project ID, lineage ID and admitted repository-identity keys.
- **Repository Knowledge Map (RKM19)**: promotes the previously proposed Repository Knowledge Map into an M19-owned compact routing map for domains, contracts, dependencies, tests and proof references. It remains non-authoritative and validity-bound.
- **Registry Collision Witness (RCW19)**: explicit evidence object for duplicate/suspected-collision findings, preserving all competing candidates rather than choosing by order or recency.
- **Deterministic Registry Query Plan (DRQP19)**: bounded ordered query plan that selects the smallest sufficient index set for the request.
- **Registry Match Lattice (RML19)**: match states `EXACT`, `POSSIBLE`, `CONFLICT`, `ABSENT`, `UNKNOWN`; only `EXACT` may resolve automatically.
- **Alias Admission Capsule (AAC19)**: aliases are accepted only when separately bound to canonical project/lineage identity; aliases never create identity.
- **Negative Registry Knowledge (NRK19)**: validity-bound known absences/capability gaps can suppress repeated searches while their bindings remain current.

## Invariants
1. Query result ordering is deterministic and never used as authority.
2. Duplicate project IDs, lineage conflicts or contradictory repository identities produce `CONFLICT` and quarantine candidates.
3. `POSSIBLE` is never auto-upgraded to `EXACT`.
4. Negative knowledge is invalidated by relevant registry/source identity changes.
5. Query budgets may reduce work only after correctness-preserving sufficiency is proven.
6. Repository Knowledge Map entries carry source validity bindings and cannot substitute for canonical files.

## Required tests
Exact lookup, alias lookup, collision, duplicate IDs, ambiguous repository identity, negative-cache validity, deterministic ordering, budget boundary and hostile/prototype-shaped identifiers.

STOP CONDITION: `M19_S02_FROZEN`.
