# GBS-M11 — Decision System Module Gate

Status: `PLANNED_READY_FOR_IMPLEMENTATION`
Risk: `STANDARD`
Canonical production weight: `17 / 1088`

## Gate basis
S01 Decision Ledger, S02 ADR, S03 Supersession, S04 Conflicts and S05 Frozen Decisions are `FROZEN`, with zero blocking planning questions.

## Required implementation surface
- versioned strict Decision Ledger + ADR contracts;
- deterministic Decision Ledger Index, Decision Capsule and digest-ready Decision Identity Seal Input;
- ADR Integrity Envelope, bidirectional decision↔ADR validation and pure ADR Delta Lens;
- bounded/cancellable Decision Lineage Graph;
- supersession closure and fail-closed Effective Decision Resolver;
- deterministic Decision Conflict Set, Decision Shadow Set and subject-level Conflict Isolation Boundary;
- freeze eligibility, Decision Staleness Vector, Frozen Snapshot Guard and Frozen Decision Receipt Seed;
- typed diagnostics, immutable snapshots and import/startup purity.

## Frozen authority boundaries
M11 owns explicit project decision representation, ADR linkage, supersession, conflict detection and decision-freeze eligibility. It does not own Scope/DoD semantics (M12), checkpoint promotion (M17), progress (M21), final evidence/assurance (M24+), audit ledger (M44), integrity engine (M37), provider/network execution or repository mutation.

M11 MUST NOT use newest-wins, timestamps, file order, Git recency, LLM confidence or majority voting as decision authority. Conflict resolution requires governed canonical repair/new decision.

## Technology dispositions
`NECESSARY`: DLI, Decision Capsule, DISI, AIE, DAL validation, DLG, Supersession Closure, EDR, conflict/shadow sets, FDRS, DSV, FSG.
`IMPORTANT`: ADR Delta Lens, Conflict Isolation Boundary, canonical/JCS-compatible projections, content-addressed snapshot compatibility.
`FUTURE/EXPERIMENTAL`: Merkle transparency storage, graph DB, event sourcing, temporal DB, semantic similarity, SAT/SMT contradiction solver, Sigstore/signing, conflict dashboard.

## Tests
Strict contracts; duplicate/prototype-hostile identities; deterministic projections; ADR mismatch; lineage cycle; cross-subject supersession; multiple leaves; no-recency resolution; incomplete coverage; conflict isolation; frozen immutability; stale binding; traversal budgets/cancellation; no completion authority; startup purity; full repository regression.

Planning/gate earns `0 / 17`; denominator remains `1088`.
No known HIGH/CRITICAL planning finding.

STOP CONDITION: `M11_PLANNED_READY_FOR_IMPLEMENTATION`.