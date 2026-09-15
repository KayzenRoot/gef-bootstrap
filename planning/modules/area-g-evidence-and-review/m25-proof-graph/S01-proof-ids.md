# GBS-M25-S01 — Proof IDs & Authority

Status: `FROZEN`
Module: `GBS-M25 — Proof Graph`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze the identity and authority model for M25. M25 owns proof relationship, reachability and sufficiency. It does not own canonical product claims, evidence validity, DoD status, progress, project status, checkpoint promotion or assurance.

Accepted evidence is an input fact, never an automatic synonym for a proven claim.

## Frozen mechanisms
1. **PIC25 — Proof Intent Capsule**: binds project, lineage, requested claim IDs, proof purpose, source authority and proof-policy identity.
2. **PAB25 — Proof Authority Boundary**: declares `PROOF_RELATIONSHIP_AND_SUFFICIENCY_ONLY` and denies upstream/downstream owner authority.
3. **CCI25 — Canonical Claim Identity**: accepts stable claim IDs supplied by an owning canonical source; M25 cannot create product truth merely by naming a claim.
4. **PNI25 — Proof Node Identity**: deterministic identity for `CLAIM | EVIDENCE | OBLIGATION` nodes.
5. **PEI25 — Proof Edge Identity**: deterministic identity for typed dependency edges, binding edge type and endpoints.
6. **POD25 — Proof Obligation Declaration**: read-only owner-bound declaration of what is required to prove a claim.
7. **PNS25 — Proof Namespace Seal**: binds graph material to exact project, lineage and proof-policy namespace.
8. **PIM25 — Proof Identity Manifest**: canonical identity set with duplicate/conflict ledgers and independently recomputable digest.

## Authoritative inputs
M25 may consume current M24 DPC24 context only with enough M24 provenance to reproduce or verify the handoff; M24 manifests/claim mappings/evaluation context; M12 DoD criterion identities as read-only semantics; stable requirement, Work Order, checkpoint or module-governance claims with exact owner/source identity; and injected digest/cancellation/budget services.

A standalone handoff object is not sufficient merely because it contains a digest.

## Obligation contract
An obligation binds claim ID, owner/source identity, project/lineage, source-policy digest, dependency atoms, expression mode `ALL | ANY | AT_LEAST`, threshold when applicable, owner-supplied applicability/required flags and validity dependencies.

Core M25 does not infer propositions from missing evidence. Any specialized claim semantics must be explicit in the owning upstream obligation.

## Frozen proof states
`PROVEN | UNPROVEN | STALE | CONFLICT | INDETERMINATE | TRUNCATED`.

These are proof states only. They never directly mutate M12, M21, M23 or M27 state.

## Identity invariants
- semantic identities use injected domain-separated SHA-256;
- external/provider identities remain typed external identities;
- set-like inputs are canonicalized while lineage order is preserved;
- divergent objects with one stable ID remain conflict;
- replay/duplication cannot add proof strength;
- presentation wording is excluded from semantic identity;
- project/lineage mismatch fails closed;
- owner labels alone do not create authority.

## MAX_ASSURANCE proof families
Required S01 tests include owner/identity mismatch, divergent same-ID inputs, cross-project/lineage mixing, unrecomputable M24 handoff input, digest-domain mismatch, duplicate/replay identity, malformed stable IDs, budget/cancellation and startup purity.

STOP CONDITION: `M25_S01_FROZEN`.
