# GBS-M09-S05 — Source Pack Integrity

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze integrity, invalidation and conformance semantics for Source Packs. Integrity means that the pack can prove what canonical state it represents and detect relevant drift. It does not mean the pack itself becomes canonical truth.

## Integrity layers
A Source Pack has four independent integrity layers:
1. `STRUCTURAL_INTEGRITY` — schema, IDs, relations and invariants are valid;
2. `SOURCE_INTEGRITY` — referenced canonical subjects still match their exact bindings;
3. `AUTHORITY_INTEGRITY` — active authority resolution remains valid;
4. `APPLICABILITY_INTEGRITY` — conditional witnesses remain valid.

A single boolean valid flag is insufficient.

## TECH-M09-11 — Semantic Integrity Spine
GEF introduces Semantic Integrity Spine, SIS. The spine is a deterministic set of digest-bound nodes for pack identity, canonical entries, authority resolutions, applicability witnesses and dependency groups. It provides Merkle-like selective invalidation semantics without requiring one specific tree shape or cryptographic implementation in the semantic contract.

A changed leaf invalidates only dependent spine nodes when dependency information is complete. Unknown dependency coverage widens invalidation.

## TECH-M09-12 — Drift Shockwave Map
GEF introduces Drift Shockwave Map, DSM. When an upstream source changes, DSM computes the deterministic set of Source Pack entries, authority proofs, applicability witnesses and derived indexes that become stale. It reports the blast radius before later modules rebuild context or proofs.

DSM is mechanical dependency propagation, not semantic impact judgment. Unknown edges expand conservatively.

## TECH-M09-13 — Integrity Epoch
Every materially valid Source Pack state has an `integrityEpoch` identity derived from semantic bindings, not wall-clock time. Two independently constructed equivalent packs may share the same epoch identity. A timestamp may be display metadata but never determines freshness.

## TECH-M09-14 — Conformance Receipt Seed
M09 defines the Source Pack portion of the future Source Hierarchy Conformance Receipt required by D-0026. The receipt seed records:
- project binding;
- Source Pack semantic identity;
- required-source resolution summary;
- conditional applicability summary;
- authority-resolution summary;
- unresolved conflict/missing-source diagnostics;
- integrity-layer states;
- exact template-resolution summary;
- brownfield alias/drift summary when applicable;
- deterministic construction policy version.

Final evidence ownership remains with later assurance/bootstrap validation modules.

## Constitution fingerprint closure
M00 deferred deterministic constitution fingerprinting to Source Pack/Integrity. M09 freezes the semantic contract: the constitution fingerprint is computed from the exact active constitutional source set and normalized canonical content through the injected digest capability. No placeholder or invented fingerprint is permitted. Display metadata and unrelated repository files are excluded.

## Validation states
Integrity evaluation returns one of:
- `VALID`
- `STALE`
- `INCOMPLETE`
- `CONFLICTED`
- `UNSUPPORTED_VERSION`
- `PROJECT_MISMATCH`
- `INDETERMINATE`

Only `VALID` can support normal downstream reuse. `INDETERMINATE` is conservative and cannot be coerced to valid.

## Incremental rebuild
A stale pack should rebuild the smallest safely affected topology slice when dependencies are known. Full rebuild is required when project identity, Source Pack schema major version, authority policy version or insufficient dependency knowledge makes selective reconstruction unsafe.

## Atomic publication boundary
M09 may construct a candidate pack in memory/derived staging, but durable publication must use the existing M05/M06 transactional and filesystem authority. M09 cannot create an alternate write path.

## Portability
Integrity semantics are independent of operating system, path separator, filesystem enumeration order, locale and wall-clock. Canonical normalization rules must be explicit and tested before they affect fingerprints.

## Failure behavior
Integrity mismatch never triggers automatic canonical-source rewrite. The pack becomes stale/conflicted and reports diagnostics. Repair belongs to the owning source or governed operation.

## Proof obligations
Future implementation must prove selective invalidation, conservative widening for unknown dependencies, equivalent-pack epoch stability, constitution fingerprint determinism, stale detection, project mismatch rejection, exact-template mismatch detection, conformance-receipt reproducibility and no alternate mutation path.

## M09 Module Gate requirements
Before any M09 implementation Work Order may be compiled:
- S01-S05 must be exact-head audited and frozen;
- Technology Ledger must record M09 inventions and ownership;
- Decisions Ledger must record material frozen M09 decisions;
- checkpoint human/machine views must agree;
- no HIGH/CRITICAL planning defect may remain;
- production credit remains unchanged during planning.

No production credit is earned by this planning session.

STOP CONDITION: `READY_FOR_GBS_M09_MODULE_GATE` after governed promotion.