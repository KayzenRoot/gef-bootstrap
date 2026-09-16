# GBS-WO-M25-001 — Correction Delta

Status: `CLOSED`
Module: `GBS-M25 — Proof Graph`
Implementation PR: `#242`
Assurance: `MAX_ASSURANCE`
Reviewed head/tree: `b59614fe4d5fbc1865f5ea4e528ac1886c098709` / `6f6f9da0e4b0085ccbc1c707bb4ffcb8af4b6622`
Semantic/integrity review: `5215786425`
Implementation merge: `9801479fb0bbeddfa1de8363d1bf22b62caf51f3`

## Closed corrections
1. Initial CI exposed a central type-binding defect: `ProofEvaluation` required source authority but the first graph core result omitted it.
2. Source authority was redesigned as a canonical digest of exact claim/obligation owner and source identities rather than caller-supplied data; the authority-bound evaluation digest seals it.
3. PSC25 now binds and independently recomputes that source authority.
4. Semantic audit found a HIGH carry-forward gap: equal stable IDs/support could have preserved a reuse key after canonical source identity drift. Reuse compatibility now binds claim digest, obligation digest and source-authority digest.
5. `tests/m25-source-authority-carry-forward.test.mjs` proves the drift changes compatibility and forces recomputation.
6. M24 DPC provenance is recomputed; graph/snapshot/invalidation derived state is rebuilt; predecessor snapshots are verified; opaque invalidation digests are rejected; DPH25 is derived only from verified snapshot + current proof reevaluation.

## Final exact-head proof
- focused: `23 / 23 PASS` on Ubuntu, Windows and macOS;
- regression: `984 / 984 PASS`;
- dependency audit: `0 vulnerabilities`;
- CodeQL: `PASS`;
- exact-head workflows: `22 / 22 SUCCESS`;
- registry: `42 / 42`;
- unresolved CRITICAL: `0`;
- unresolved HIGH: `0`.

All implementation corrections are closed before MODULE_DONE promotion.

STOP CONDITION: `GBS_WO_M25_001_CORRECTION_DELTA_CLOSED`.
