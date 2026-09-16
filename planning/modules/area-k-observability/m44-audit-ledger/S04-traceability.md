# M44 S04 — Traceability
Status: FROZEN

**ATG44 Audit Trace Graph** links Work Order, checkpoint, source pack, commit/tree, PR, CI run, evidence, review, promotion and release ids using typed edges. Dangling edges are explicit and block claims that require complete lineage.

Trace queries are read-only and bounded. The graph is derived from ledger/evidence; it cannot manufacture missing proof. Cross-project/context edges require explicit bridge receipts.

Acceptance: typed edge validation, cycle-safe bounded traversal, dangling-reference detection, exact-head lineage, cross-context denial without bridge.