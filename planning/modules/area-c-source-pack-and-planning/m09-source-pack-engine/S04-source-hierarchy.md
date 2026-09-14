# GBS-M09-S04 — Source Hierarchy

Status: `FROZEN_CANDIDATE`

## Purpose
Operationalize the constitutional domain-specific authority model inside Source Packs without inventing a naive universal source order.

## Frozen authority domains
M09 preserves the base domains established by D-0021: `REPOSITORY_STATE`, `PROJECT_STATE`, `DECISION`, `SCOPE`, `REQUIREMENT`, `ARCHITECTURE`, `SECURITY`, `COMPLETION`, `EXECUTION`, `VALIDATION`, `PLANNING`, `FUTURE_WORK`, `INNOVATION` and `CONVERSATION`. Governed profiles may add subdomains but cannot redefine base-domain semantics.

## Resolution pipeline
For a requested fact or semantic class:
1. identify authority domain;
2. filter by project and applicability binding;
3. reject invalid/superseded candidates;
4. apply domain-specific active-source rules;
5. evaluate explicit supersession;
6. detect unresolved ambiguity/conflict;
7. emit resolved fact reference or typed unresolved state;
8. preserve provenance and resolution trace.

Conversation is never silently promoted to canonical truth.

## TECH-M09-08 — Authority Resolution Proof
GEF introduces Authority Resolution Proof, ARP. Every successful source resolution can emit a compact proof object containing requested semantic key, authority domain, candidate identities considered, exclusion reasons, selected canonical identity, exact-state binding and governing rule IDs.

ARP makes authority decisions inspectable and allows later context/review stages to reuse resolution without repeating semantic search when bindings remain valid.

## TECH-M09-09 — Conflict Shadow Graph
GEF introduces Conflict Shadow Graph, CSG. Conflicting or superseded candidates are retained as compact shadow nodes linked to the active fact instead of being deleted from the knowledge surface. Shadow nodes do not enter normal executor context, but remain available for drift audit, brownfield reconciliation and invalidation.

This preserves history without paying its token cost on every interaction.

## TECH-M09-10 — Authority Neighborhood Cache
A validity-bound derived cache may retain resolved authority neighborhoods: active fact plus minimum governing sources and dependencies. Cache entries are keyed by semantic request and source fingerprints. Any relevant binding change invalidates the neighborhood. Cache is disposable and never canonical.

## Cross-domain disagreements
Different domains may legitimately describe different aspects of the same subject. For example repository state describes what exists while Architecture describes what should exist. M09 does not collapse these into one winner. It exposes a typed `DRIFT_RELATION` so M13/M11/other owners can reconcile according to their policy.

## Exact template-source resolution
M09 owns resolution of an exact M07 template reference supplied by M08 or another governed source. Resolution requires exact template identity and canonical version, plus exact digest when the reference requires it. M09 does not choose latest, compatible-enough, nearest-name or branch-head templates.

Resolution results are:
- `EXACT_MATCH`
- `NOT_FOUND`
- `IDENTITY_MISMATCH`
- `VERSION_MISMATCH`
- `DIGEST_MISMATCH`
- `AMBIGUOUS_SOURCE`

No fallback substitution is allowed.

## Source location independence
Authority is semantic, not path-based. Repository-relative paths are locators. Moving a canonical document through a governed migration may change its locator without changing its semantic authority, provided identity and migration evidence preserve lineage.

## Brownfield hierarchy
M13 may admit aliases and descriptive mappings. M09 represents them with explicit authority and provenance. Existing code/tests can establish descriptive repository truth for an exact state but cannot silently supersede normative Scope, Requirements or Architecture.

## Proof obligations
Future implementation must prove domain-correct resolution, no newest-wins behavior, exact template resolution, conflict preservation, ARP determinism, cache invalidation and explicit descriptive-vs-normative drift.

No production credit is earned by this planning session.

STOP CONDITION: `READY_FOR_GBS_M09_S05_INTEGRITY` after governed promotion.