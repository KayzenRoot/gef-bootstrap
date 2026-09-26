# GBS-M25-S02 — Dependencies & Sufficiency

Status: `FROZEN`
Module: `GBS-M25 — Proof Graph`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze deterministic dependency-graph construction and proof sufficiency evaluation without changing evidence truth or upstream claim meaning.

## Frozen mechanisms
1. **PDG25 — Proof Dependency Graph**: typed graph of canonical claims, obligations and evidence nodes.
2. **DAG25 — Acyclicity Guard**: detects cycles and ambiguous recursive dependency closure before evaluation.
3. **SER25 — Sufficiency Expression Resolver**: evaluates owner-declared `ALL | ANY | AT_LEAST` expressions.
4. **ESG25 — Evidence Support Gate**: allows only current M24-accepted evidence to satisfy an evidence atom.
5. **CSG25 — Claim Support Gate**: permits nested claim support only when the referenced claim is itself resolved under the same namespace/policy contract.
6. **PRC25 — Proof Reachability Calculator**: computes deterministic reachable dependency closure from requested root claims.
7. **ADC25 — Anti-Double-Count Guard**: prevents one semantic evidence/proof node from creating duplicate threshold credit inside the same obligation.
8. **DCW25 — Dependency Coverage Witness**: records required, observed, missing, unused and truncated dependency references.

## Graph semantics
Node kinds are `CLAIM`, `OBLIGATION`, and `EVIDENCE`. Edges are typed and deterministic. Obligation expressions are owned by the declaring upstream source; M25 evaluates but does not rewrite them.

Evidence leaves are derived from current M24 truth:
- current accepted evidence may resolve as `PROVEN` support;
- rejected evidence does not support the obligation and resolves as `UNPROVEN` for positive support;
- stale evidence resolves as `STALE`;
- conflict evidence resolves as `CONFLICT` when the affected support is required/selected;
- unknown evidence resolves as `INDETERMINATE`;
- missing evidence remains explicit rather than becoming success.

M25 never converts a rejected or absent evidence item into proof of a different proposition unless the owning obligation explicitly declares that proposition and its supporting evidence.

## Expression rules
### ALL
`PROVEN` only when every required distinct dependency is proven. Required stale/conflict/indeterminate/truncated/unproven dependencies prevent proof.

### ANY
`PROVEN` when at least one valid distinct branch proves the obligation. Unused alternatives remain observable diagnostics but do not downgrade a satisfied branch unless the obligation/graph identity itself is conflicting.

### AT_LEAST
`PROVEN` when at least the declared threshold of distinct support nodes resolve proven. Replayed/duplicated identities count once.

Threshold must be an integer greater than zero and cannot exceed the declared dependency count.

## Resolution precedence
Structural namespace/identity conflict always yields `CONFLICT`. When an expression is not satisfied, the resolver preserves the most material blocking state among dependencies rather than flattening everything to false: `CONFLICT`, `STALE`, `TRUNCATED`, `INDETERMINATE`, then `UNPROVEN`.

A satisfied `ANY` or `AT_LEAST` expression may remain `PROVEN` when adverse states exist only on unused alternatives, provided the selected support set and obligation identity are conflict-free and the unused states are still reported.

## Dependency integrity
- cycles are never resolved by iteration/newest-wins;
- cross-project/lineage edges are forbidden;
- a nested claim cannot silently use a different proof-policy digest;
- unknown dependency type fails closed;
- graph construction is order-independent for set-like declarations;
- selected support set is emitted explicitly so sufficiency can be independently recomputed;
- graph traversal is bounded/cancellable with explicit `TRUNCATED`/`INDETERMINATE` results.

## MAX_ASSURANCE proof families
Required tests include graph permutation determinism, cycles/self-cycles, diamond graphs, nested ALL/ANY/threshold expressions, duplicate support, replayed M24 receipts, missing leaves, stale/conflict/unknown leaves, unused adverse alternatives, cross-lineage edges, large bounded graphs and cancellation.

STOP CONDITION: `M25_S02_FROZEN`.
