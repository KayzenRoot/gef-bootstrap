# GBS-M19-S04 — Persistence, Portability & Handoff
Status: `FROZEN`
Module weight: `14`
Assurance intensity: `STANDARD_PLUS`

## Objective
Define a bounded persistent registry contract that is portable, privacy-aware, compact and safe to hand to later response/status surfaces.

## Technologies
- **Registry Store Port (RSP19)**: explicit injected storage contract for load, compare-and-swap commit and snapshot retrieval. Semantic core performs no direct filesystem/network/provider access.
- **Registry Snapshot Capsule (RSC19)**: deterministic frozen projection of active/quarantined/tombstoned registry state with semantic digest and schema version.
- **Registry Admission Receipt (RAR19)**: mutation receipt binding before-version, after-version, exact mutation intent, affected project IDs and resulting snapshot digest.
- **Registry Privacy Projection (RPP19)**: separates shareable registry metadata from private local locator material; secret-like values and credential material are forbidden.
- **Private Locator Reference (PLR19)**: local physical paths may be represented only in private storage scope or by opaque locator references in portable/public evidence.
- **Registry Portability Envelope (RPE19)**: export/import envelope that preserves project/lineage/repository identity and reports capability/location gaps rather than fabricating local paths.
- **Registry Compaction Map (RCM19)**: deduplicates historical routing metadata while retaining tombstone lineage, collision witnesses and required provenance pointers.
- **Registry Size Guard (RSG19)**: explicit entry/reference/byte-count pressure assessment with fail-closed construction limits.
- **Registry Handoff Contract (RHC19)**: deterministic read-only handoff for M20 Response Contract, containing only verified registry facts and typed unresolved conditions.
- **Registry Integrity Receipt (RIR19)**: proves snapshot/entry semantic consistency at handoff without claiming M25/M37 proof ownership.

## Invariants
1. Persistence is performed only through the injected store port and exact semantic CAS.
2. Portable snapshots never embed credentials, tokens, environment values or secret-like material.
3. Public/shareable projections never require disclosure of private absolute local paths.
4. Import cannot silently rebind a project to a different repository or lineage.
5. Compaction cannot erase collision, tombstone or provenance material still needed for safe identity decisions.
6. Handoff to M20 is read-only and cannot manufacture status, progress or execution authority.
7. Schema incompatibility, missing capabilities or oversized state return explicit non-success states.

## Acceptance shape
M19 is complete only with deterministic snapshot/admission receipts, exact CAS persistence semantics, privacy/portability tests, collision/tombstone preservation, focused platform matrix, full repository regression, dependency audit, semantic review and zero unresolved HIGH/CRITICAL findings.

STOP CONDITION: `M19_S04_FROZEN`.
