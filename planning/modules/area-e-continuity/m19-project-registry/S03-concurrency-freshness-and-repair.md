# GBS-M19-S03 — Concurrency, Freshness & Repair
Status: `FROZEN_CANDIDATE`
Module weight: `14`
Assurance intensity: `STANDARD_PLUS`

## Objective
Keep persistent registry state coherent under concurrent writers, stale observations and interrupted updates without last-writer-wins behavior.

## Technologies
- **Registry Semantic Version (RSV19)**: content-derived registry generation bound to canonical entry set and schema version, not wall-clock time.
- **Registry Compare-And-Swap (RCAS19)**: every registry mutation requires the exact expected semantic version and fails `STALE` on mismatch.
- **Registry Promotion Fence (RPF19)**: mutation intent receives a base-bound fence token that must still match at commit boundary.
- **Registry Split-Brain Detector (RSBD19)**: detects divergent successors from the same semantic base and blocks automatic reconciliation.
- **Stale Entry Quarantine (SEQ19)**: invalid or stale entries remain audit-visible but cannot satisfy active lookup.
- **Registry Freshness Vector (RFV19)**: binding-based freshness across project identity, repository identity, checkpoint pointer and knowledge-map dependencies.
- **Registry Repair Plan (RRP19)**: deterministic, non-destructive repair proposal for stale/quarantined entries. Repair never rewrites canonical M03/M17/M18 truth.
- **Negative Diagnostic Cache (NDC19)**: validity-bound record of repeated failed diagnostics/searches so known failures are not rediscovered until their fingerprint becomes stale.
- **Tombstone Lineage Record (TLR19)**: removal is append-preserving and lineage-bound; historical identity is not silently erased.

## Invariants
1. No blind overwrite and no timestamp-based winner selection.
2. Concurrent divergent successors fail closed and preserve both candidates for audit.
3. A stale registry entry cannot authorize resume, execution or project identity transition.
4. Freshness is derived from semantic bindings, never elapsed time alone.
5. Tombstones preserve minimum lineage/provenance needed to prevent accidental identity resurrection.
6. Repair is a proposal; authoritative project/checkpoint changes return to their owning modules.
7. Cancellation/deadline boundaries are explicit for bounded traversals and mutation preparation.

## Required tests
CAS race, stale base, split brain, interrupted update, stale quarantine, freshness drift, tombstone resurrection attempt, diagnostic-cache invalidation and conservative repair widening when dependency knowledge is incomplete.

STOP CONDITION: `M19_S03_FROZEN_CANDIDATE`.
