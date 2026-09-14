# GBS-M14-S03 — Minimum Sufficient Context & Sufficiency Proof
Status: `FROZEN_CANDIDATE`

## Objective
Compile the smallest authority-correct context that proves execution readiness. Optimization is subordinate to correctness, risk and dependency closure.

## Frozen mechanisms
- **Context Sufficiency Proof (CSP)**: machine-readable proof over task intent, authority domains, required facts, dependency closure, unresolved conflicts, risk class and selected units.
- **Context Cut Frontier (CCF)**: new NECESSARY technology. Finds a deterministic cut in the source/dependency graph after which additional context cannot change currently required obligations.
- **Semantic Coverage Lattice (SCL)**: new NECESSARY technology. Coverage is per obligation/domain, never a scalar similarity score.
- **Context Deficit Vector (CDV)**: new NECESSARY technology. Missing authority, dependency, decision, scope, safety and evidence dimensions remain explicit.
- **Minimum Context Witness (MCW)**: new NECESSARY technology. Records why every included unit is necessary and why every excluded neighboring unit is not currently required.

## Algorithm contract
1. Bind Task Intent Envelope and project/source identities.
2. Resolve authority through M09 only.
3. Expand hard dependencies.
4. Map required obligations to selected authoritative facts.
5. Emit CDV.
6. If CDV non-empty, return `EXPANSION_REQUIRED`.
7. Otherwise minimize only redundant units while preserving SCL and CCF.
8. Emit CSP + MCW.

## Fail-closed states
`AUTHORITY_UNRESOLVED`, `DEPENDENCY_UNKNOWN`, `CONFLICT_PRESENT`, `RISK_COVERAGE_INCOMPLETE`, `SOURCE_BINDING_STALE`, `BUDGET_EXHAUSTED`, `CANCELLED`.

## Boundaries
M14 proves context sufficiency. M15 compiles executor instructions. M24+ proves execution evidence. M63 owns measured latency/token targets.

STOP CONDITION: `M14_S03_FROZEN_CANDIDATE`.