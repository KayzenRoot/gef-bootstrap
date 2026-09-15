# GBS-WO-M25-001 — Evidence Bundle

Status: `APPROVED_FOR_MODULE_DONE_PROMOTION`
Module: `GBS-M25 — Proof Graph`
Frozen weight: `20`
Assurance: `MAX_ASSURANCE`

## Governance lineage
- planning PR: `#239`
- planning reviewed head/tree: `db89e6a021cfc46cf89c62a1f8db36dc78baaf8b` / `22c5d75b4a880d2d2bfdd2d518ea8e197854cdc9`
- planning review: `5213821206`
- planning merge: `70fbfafa71e20e684ab9dbe740aede772d4cbe02`
- admission PR: `#240`
- admission reviewed head/tree: `001353587f8784d70502ef80cef3af686980a26a` / `f55f178361b4a584e1ee2281c5db193dcd9cb117`
- admission review: `5213839166`
- admission merge: `2a9eba4ca11cec9463cb501ec7f64b26f1d96825`
- admission binding PR: `#241`
- binding review: `5213889207`
- binding merge: `e00aa192902cd93323121357ecc6308c573c21be`

## Implementation identity
- implementation PR: `#242`
- reviewed head: `b59614fe4d5fbc1865f5ea4e528ac1886c098709`
- reviewed tree: `6f6f9da0e4b0085ccbc1c707bb4ffcb8af4b6622`
- MAX_ASSURANCE semantic/integrity review: `5215786425`
- implementation merge: `9801479fb0bbeddfa1de8363d1bf22b62caf51f3`
- correction delta: `.engineering/evidence/GBS-WO-M25-001-CORRECTION-DELTA.md`

## Frozen mechanism coverage
Registry coverage: `42 / 42`, one entry per frozen mechanism across S01-S05.

Implemented proof surfaces include canonical proof identity/authority, dependency graph and sufficiency, M24 evidence support, anti-double-count, fingerprints, carry-forward, shadow-assurance projection, selective/widened invalidation, reopen projection, proof snapshots/integrity, replay/split-state history and read-only downstream handoff.

## Exact-head mechanical evidence
On reviewed head `b59614fe4d5fbc1865f5ea4e528ac1886c098709`:
- focused M25 tests: `23 / 23 PASS` on Ubuntu;
- focused M25 tests: `23 / 23 PASS` on Windows;
- focused M25 tests: `23 / 23 PASS` on macOS;
- full repository regression: `984 / 984 PASS`;
- dependency audit: `0 vulnerabilities`;
- Security CodeQL: `PASS`;
- triggered exact-head workflows: `22 / 22 SUCCESS`;
- unresolved CRITICAL findings: `0`;
- unresolved HIGH findings: `0`.

## Closed corrections
The first candidate typecheck exposed a missing proof source-authority binding. The implementation was redesigned so source authority derives from exact canonical claim/obligation owner and source identities and is sealed into evaluation and PSC25 snapshots. A later semantic audit found that carry-forward could otherwise keep an equivalent reuse key across canonical source drift; compatibility now binds claim digest, obligation digest and source-authority digest, with a dedicated three-OS regression test.

## Promotion impact
- M25 earned weight: `0 -> 20`;
- production earned weight: `432 -> 452`;
- denominator: `1088` unchanged;
- completion: `452 / 1088 = 41.54%`;
- remaining: `636 / 1088 = 58.46%`;
- next module after promotion: `GBS-M26 — HEDS Delta Review`, planning only.

This Evidence Bundle grants no credit by itself. Credit becomes canonical only after the separate MODULE_DONE promotion PR is exact-head audited and merged.

STOP CONDITION: `GBS_WO_M25_001_EVIDENCE_APPROVED_FOR_MODULE_DONE_PROMOTION`.
