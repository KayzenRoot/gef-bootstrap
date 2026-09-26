# GBS-M14-S04 — Safe Expansion & Full-Context Gate
Status: `FROZEN_CANDIDATE`

## Objective
Expand context deterministically when narrow context is unsafe, without degenerating into repository-wide reading.

## Frozen mechanisms
- **Full-Context Safety Gate (FCSG)**: mandatory broader inspection for high-risk domains, unknown dependencies, source conflicts, destructive operations or incomplete assurance coverage.
- **Risk-Adaptive Context Aperture (RACA)**: new NECESSARY technology. Aperture expands by risk/unknowns, not token appetite.
- **Dependency Shockwave Scanner (DSS)**: new NECESSARY technology. Bounded traversal estimates which authority domains can be invalidated by a task.
- **Unknown-Unknown Sentinel (UUS)**: new NECESSARY technology. Detects incomplete graph knowledge via dangling refs, unresolved aliases, unbound imports/contracts and authority gaps.
- **Context Expansion Ladder (CEL)**: `LOCAL -> DEPENDENCY_NEIGHBORHOOD -> AUTHORITY_DOMAIN -> CROSS_DOMAIN -> FULL_RELEVANT_SOURCE_PACK`; never raw full repository by default.
- **Expansion Budget Envelope (EBE)**: caps nodes, edges, bytes/units, domains and iterations; exhaustion is explicit.

## Gate rule
A CSP cannot be `SUFFICIENT` while a triggered FCSG obligation remains unexamined. High/critical unknowns force expansion or block.

## Security
Secrets/raw environment values are never promoted into context. Only redacted capability facts may cross the compiler boundary.

STOP CONDITION: `M14_S04_FROZEN_CANDIDATE`.