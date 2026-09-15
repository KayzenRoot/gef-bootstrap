# GBS-WO-M25-001 — Correction Delta

Status: `CLOSED_PENDING_EXACT_HEAD_AUDIT`
Module: `GBS-M25 — Proof Graph`
Implementation PR: `#242`
Assurance: `MAX_ASSURANCE`

## Correction history
1. **Initial CI typecheck**: the first implementation head failed centrally because `ProofEvaluation` required `sourceAuthorityDigest` while the graph core did not return it. No semantic acceptance was claimed from that head.
2. **Authority-binding redesign**: instead of accepting a caller-supplied authority digest, the public safe evaluation wrapper now derives `sourceAuthorityDigest` canonically from the exact claim/obligation owner and source identities in the verified manifest. The authority-bound evaluation digest seals that value.
3. **Snapshot binding**: PSC25 now carries the derived source-authority digest and independently recomputes it with proof evaluation. Owner/source drift therefore changes snapshot semantics.
4. **HIGH finding — carry-forward source drift**: semantic audit found that equal IDs/support could previously leave a carry-forward compatibility key unchanged after canonical claim/obligation source identity changed. Fixed by binding the reuse fingerprint to claim digest, obligation digest and derived source-authority digest.
5. **Regression proof**: `tests/m25-source-authority-carry-forward.test.mjs` proves that canonical source-authority change changes the compatibility key and forces recomputation rather than `REUSE_FULL`.
6. **Trust-boundary hardening retained**: DPC24 is recomputed from M24 provenance; graph derived fields are rebuilt; predecessor snapshots are verified before reuse; invalidation is derived from the proof graph plus current M24 facts; opaque non-recomputable invalidation digests are rejected; downstream handoff is generated only from a verified snapshot and fresh proof reevaluation.

## Current mechanical evidence before final documentation head
- focused M25: `23 / 23 PASS` on Ubuntu, Windows and macOS;
- full repository regression: `984 / 984 PASS`;
- dependency audit: `0 vulnerabilities`;
- Security CodeQL: `PASS`;
- registry: `42 / 42` frozen mechanisms represented exactly once.

The final documentation head must be revalidated before semantic approval. No production credit is granted by this record.

Unresolved findings after correction: CRITICAL `0`; HIGH `0`.

STOP CONDITION: `GBS_WO_M25_001_CORRECTION_DELTA_CLOSED_PENDING_EXACT_HEAD_AUDIT`.
