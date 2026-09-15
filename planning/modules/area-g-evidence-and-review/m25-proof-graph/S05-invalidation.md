# GBS-M25-S05 — Invalidation, Snapshot & Handoff

Status: `FROZEN`
Module: `GBS-M25 — Proof Graph`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze selective proof invalidation, reopen projection, immutable proof snapshots and downstream handoffs.

## Frozen mechanisms
1. **CIG25 — Completion Invalidation Graph**: maps changed proof dependencies to affected proof claims/completion candidates without changing owner state.
2. **PIV25 — Proof Invalidation Vector**: records changed dependencies, directly/transitively affected nodes and whether impact was widened.
3. **TIS25 — Targeted Invalidation Selector**: preserves unaffected proof branches when dependency knowledge is complete.
4. **UDW25 — Unknown-Dependency Widening**: widens impact conservatively when narrow impact cannot be established.
5. **RCP25 — Reopen Candidate Projection**: read-only list of affected claim/criterion/completion IDs for their owning modules.
6. **PSC25 — Proof Snapshot Capsule**: immutable namespace/graph/result/fingerprint/predecessor snapshot.
7. **PIR25 — Proof Integrity Receipt**: independently recomputes snapshot and result bindings.
8. **PRG25 — Proof Replay Guard**: duplicate history stays visible and cannot add proof strength.
9. **PSW25 — Proof Split-State Witness**: preserves divergent successors from one predecessor as conflict.
10. **DPH25 — Downstream Proof Handoff**: supplies proof states, selected support, fingerprints, invalidation and unresolved gaps to M26/M27/governance while denying their authority.

## Invalidation rules
Relevant changes include M24 evidence validity/acceptance, used claim mappings, obligation declaration, proof policy, namespace/owner source identity, selected nested proof fingerprints and any dependency bound by S03.

With complete dependency knowledge, invalidation follows reverse dependency reachability. With incomplete knowledge, `widened=true` and impact expands to the smallest safe known ancestor/root set.

M25 may identify a completed subject as a reopen candidate only when its completion claim depends on an affected proof. The owning governance module performs any real state transition.

## Snapshot contract
PSC25 binds project/lineage/proof policy, root claims and obligations, PIM25/PDG25 identities, current M24 context identity, per-claim proof state, selected support, validity fingerprints, coverage/invalidation state, predecessor semantic digest, semantic digest and snapshot digest.

PIR25 recomputes material derived fields instead of trusting stored values.

## History rules
- identical duplicate history is visible and idempotent;
- divergent records with one stable history identity are conflict;
- divergent current successors from one predecessor are conflict;
- bounded history exposes truncation and processed/total counts;
- proof state may regress after upstream validity changes, with an attributable receipt.

## Downstream boundary
DPH25 may describe proof facts to M26/M27 and governance owners. It cannot decide assurance, rewrite DoD, calculate production weight, alter lifecycle status or promote a checkpoint.

## Technology alignment
CIG25 materializes the M25-owned portion of `TECH-0042 — Completion Invalidation Graph`: only affected completion/proof descendants are candidates for reopening when dependency knowledge permits targeted impact.

## Required proof families
Targeted invalidation, conservative widening, unrelated-change preservation, nested propagation, reopen projection, upstream validity change, obligation/policy change, duplicate/divergent history, bounded history, snapshot recomputation and no-authority handoff.

STOP CONDITION: `M25_S05_FROZEN`.
