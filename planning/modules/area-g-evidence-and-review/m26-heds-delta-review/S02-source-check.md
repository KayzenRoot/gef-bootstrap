# GBS-M26-S02 — Source Check

Status: `FROZEN`
Module: `GBS-M26 — HEDS Delta Review`
Frozen weight: `19`
Assurance intensity: `HIGH_ASSURANCE`

## Objective
Freeze the source-trust and completeness layer that decides whether a discovered semantic delta is reviewable. M26 may narrow review only when source identity, ownership, provenance and dependency coverage are sufficient to justify that narrowing.

## Frozen mechanisms
1. **SCM26 — Source Coverage Manifest**: canonical set of baseline/candidate review-source projections and whether coverage for each declared review domain is complete, partial, conflicting or indeterminate.
2. **SBG26 — Source Binding Gate**: verifies exact source ID, owner, project, lineage, semantic digest and validity binding before a projection participates in review.
3. **ACG26 — Authority Consistency Gate**: preserves conflicting authorities explicitly and forbids first/newest/path-order winner selection.
4. **DPG26 — Dependency Projection Gate**: validates declared semantic dependency edges used to calculate downstream review impact; unknown endpoints make knowledge incomplete.
5. **PBG26 — Proof Binding Gate**: consumes current M25 `DPH25` only for proof-state/fingerprint/invalidation facts, verifies owner/consumer/snapshot binding and never recalculates M25 proof sufficiency.
6. **VCG26 — Validity Context Gate**: requires current validity identities for review sources and rejects stale or mixed baseline/candidate context; M24/M25 remain owners of their own validity/proof facts.
7. **SGW26 — Source Gap Witness**: immutable explanation of missing, stale, conflicting or incomplete source/dependency knowledge that prevents optimistic narrowing.
8. **MMW26 — Mix-and-Match Witness**: detects projections, proof handoffs or dependency facts assembled from different project, lineage, baseline or candidate states.

## Source-check rules
- The M25 handoff accepted by M26 must be `owner=M25_PROOF`, `consumer=M26_DELTA_REVIEW` and bound to the exact current proof snapshot.
- M26 may observe M25 invalidation facts but cannot change proof state, carry-forward or reopen owners.
- Direct M24 evidence acceptance is not required for every review subject; when evidence facts influence the review they must arrive through a current owner-authorized projection or current proof context. M26 never promotes evidence itself.
- Complete source coverage allows exact add/remove/no-change conclusions. Partial coverage may identify known changes but cannot prove the absence of additional changes.
- Incomplete dependency knowledge widens review scope; it never justifies a smaller scope.
- Owner conflicts, source conflicts and invalid lineage remain explicit, deterministic review blockers rather than heuristic tie-breaks.
- No filesystem, network, Git or provider access is implicit in the semantic core.

## Required HIGH_ASSURANCE attacks
Forged M25 consumer, stale proof snapshot, proof handoff mix-and-match, owner relabeling, same ID/divergent authority, missing source, partial source coverage, orphan dependency, dependency cycle where applicable, hidden source removal, cross-lineage source splice, resealed stale validity binding, ordering permutation, cancellation and bounded traversal.

STOP CONDITION: `M26_S02_FROZEN`.
