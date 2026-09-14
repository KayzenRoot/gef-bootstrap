# GBS-M09-S03 — Conditional Documents

Status: `FROZEN_CANDIDATE`

## Purpose
Define deterministic activation of canonical sources that are required only under explicit project conditions. Conditional sources must never be loaded merely because a similarly named file exists.

## Condition inputs
Activation may depend only on governed facts such as:
- adoption mode;
- selected project profile snapshot;
- admitted integrations;
- declared provider capabilities;
- approved risk/assurance class;
- repository topology facts already established by an owning discovery/adoption stage;
- active lifecycle stage;
- explicit project decisions.

Ambient host state and conversational guesses are not condition inputs.

## Conditional classes
Examples include provider governance, release policy, migration plan, adapter contracts, database/data-governance sources, UI/UX canon, deployment/runbook sources, localization policy, compliance artifacts and integration-specific documents. Their presence in this list does not admit new V1 scope; activation requires an already-approved obligation.

## TECH-M09-05 — Applicability Lattice
GEF introduces the Applicability Lattice, ALX. Instead of a fragile chain of if/else rules, each conditional source carries a normalized predicate over governed dimensions. Evaluation produces one of:
- `ACTIVE`
- `INACTIVE`
- `UNKNOWN`
- `CONTRADICTORY`

`UNKNOWN` and `CONTRADICTORY` never silently become inactive. They trigger explicit expansion or a block according to the owning assurance policy.

ALX predicates are declarative, versioned and side-effect free. Equivalent predicates normalize to equivalent semantic identity.

## TECH-M09-06 — Condition Witness
Every activated or intentionally inactive conditional entry carries a compact Condition Witness: the exact governed facts and bindings that produced the applicability result. A later change to one witness input invalidates only dependent conditional entries.

This creates fine-grained conditional invalidation without rereading the whole Source Pack.

## TECH-M09-07 — Dormant Source Pointer
Inactive conditional sources may be represented by a Dormant Source Pointer containing identity and activation dependencies without injecting their full content into downstream context. This preserves discoverability while reducing recurring token cost.

Dormant pointers have no active authority until their applicability state changes through governed inputs.

## Conflict rules
- contradictory activation facts yield `CONTRADICTORY`;
- missing required activation evidence yields `UNKNOWN`;
- profile and project decision disagreement is routed by domain authority, never arbitrary precedence;
- an inactive source cannot override an active canonical source;
- conditional activation cannot create new product scope.

## Brownfield behavior
Existing-project repositories may contain many conditional artifacts. Presence alone does not activate them. M13 may establish descriptive mappings and approved applicability facts. M09 consumes those facts without rewriting the repository.

## Optimization behavior
Conditional documents are ideal for cold representation. The Source Pack should expose compact dormant pointers and witnesses so M14 can avoid loading cloud, provider, release, adapter or UI sources for unrelated tasks.

## Safety boundaries
Condition evaluation is deterministic data processing. It does not execute repository configuration or perform remote discovery. Unknown conditions remain visible.

## Proof obligations
Future implementation must prove predicate normalization, stable applicability across hosts, witness-bound invalidation, dormant-pointer non-authority, unknown/contradictory fail-closed behavior and absence of activation from file presence alone.

No production credit is earned by this planning session.

STOP CONDITION: `READY_FOR_GBS_M09_S04_SOURCE_HIERARCHY` after governed promotion.