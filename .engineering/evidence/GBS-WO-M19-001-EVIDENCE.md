# Evidence Bundle — GBS-WO-M19-001

Status: `APPROVED_FOR_MODULE_DONE_PROMOTION`
Module: `GBS-M19 — Project Registry`
Risk: `MEDIUM`
Assurance intensity: `STANDARD_PLUS`
Canonical weight: `14`

## Planning and admission binding
- Frozen planning: `planning/modules/area-e-continuity/m19-project-registry/S01-registry-model-and-authority.md` through `S04-persistence-portability-and-handoff.md`.
- Planning gate: `.engineering/gates/M19-PLANNING-GATE.md` (`PASSED`).
- Planning freeze PR: `#208`.
- Planning freeze merge: `074a45b1cfda7400dd87e7941218f390570d594a`.
- Work Order: `.engineering/work-orders/GBS-WO-M19-001.md`.
- Admission PR: `#209`.
- Admission reviewed head: `f255c78ee9fca2a83fe9ea90470918e3a9b43aa8`.
- Admission semantic audit: `5203267235`.
- Admission merge / sole legal execution base: `ab2de11ee0e285e16b220ea5f788692ed018021a`.
- Admission-binding PR: `#210`.
- Reviewed admitted main descendant used for implementation: `207804576ff836f67ff8eb8b985c18d14a8ef7cd`.

## Implementation identity
- Implementation PR: `#211`.
- Exact reviewed implementation head: `0682d7f33427ee9e07368a300afc13f516cd6a66`.
- Exact reviewed tree: `48613e9babfd82f65659ef770138f83515a0ddd7`.
- Final semantic review: `5203667272`.
- Review verdict: `APPROVED_FOR_IMPLEMENTATION_MERGE`.
- Implementation merge: `e525a3cbe24dd27bca6ddd9f2eeaa5f1e766957f`.

## Implemented contract
The implementation covers the complete frozen M19 registry surface: Project Registry Entry, Registry Identity Envelope, Registry Authority Boundary, Registry Provenance Chain, Registry State Algebra, Registry Mutation Intent, Project Registry Index, Repository Knowledge Map, Registry Collision Witness, Deterministic Registry Query Plan, Registry Match Lattice, Alias Admission Capsule, Negative Registry Knowledge, Registry Semantic Version, Registry Compare-And-Swap, Registry Promotion Fence, Registry Split-Brain Detector, Stale Entry Quarantine, Registry Freshness Vector, Registry Repair Plan, Negative Diagnostic Cache, Tombstone Lineage Record, Registry Store Port, Registry Snapshot Capsule, Registry Admission Receipt, Registry Privacy Projection, Private Locator Reference, Registry Portability Envelope, Registry Compaction Map, Registry Size Guard, Registry Handoff Contract and Registry Integrity Receipt.

The three promoted existing technologies remain bounded to their approved non-authoritative roles: `TECH-0008 Repository Knowledge Map`, `TECH-0027 Failure Fingerprint Memory`, and `TECH-0028 Negative Capability Cache`.

## Semantic hardening corrections
Review-driven correction deltas were incorporated before the accepted head:
1. negative registry/diagnostic caches verify their own semantic digests before suppressing work;
2. tombstone lineage is revalidated and snapshot linkage is bidirectional;
3. mutation commit requires an exact promotion fence before store access;
4. runtime registry-state and mutation-kind confusion fails closed;
5. freshness vectors are verified before quarantine/repair and missing freshness proof quarantines active state;
6. snapshot and portability schema tampering fail closed;
7. portable projections reject hidden/private-field smuggling and secret-like material;
8. ADD/UPDATE cannot create tombstoned state outside governed tombstone lineage;
9. narrow index lookup cannot mask project/lineage/repository identity collisions;
10. post-CAS observed state must exactly match the proposed verified snapshot.

Earlier green implementation heads are non-authoritative for acceptance.

## Exact-head mechanical evidence
- M19 workflow run: `34905722199`.
- Focused Ubuntu: `62 / 62` PASS.
- Focused Windows: `62 / 62` PASS.
- Focused macOS: `62 / 62` PASS.
- Typecheck: PASS on required focused matrix.
- Full repository regression: `684 / 684` PASS.
- Regression failures: `0`.
- Regression skipped/todo/cancelled: `0 / 0 / 0`.
- Dependency audit: `npm audit --audit-level=low` -> `0 vulnerabilities`.
- Security CodeQL run: `34905725338` -> SUCCESS.
- Exact-head triggered workflows: `16 / 16` SUCCESS.
- Startup purity / no ambient filesystem-network-process requirement tests: PASS.

## Semantic acceptance
The exact-head audit rechecked authority separation, canonical M03 identity reuse, collision propagation, deterministic query behavior, stale/unknown fail-closed semantics, validity-bound reusable knowledge, semantic CAS/fencing, split-brain preservation, freshness/quarantine/repair, tombstone resurrection prevention, privacy/path/secret boundaries, portability, compaction retention, store failure behavior and receipt/handoff integrity.

- `CRITICAL`: `0`
- `HIGH`: `0`
- Production code outside admitted M19 scope: `NONE`
- Denominator change: `NONE`

## Production accounting on promotion
Before M19 promotion:
- earned: `339 / 1088 = 31.16%`
- remaining: `749 / 1088 = 68.84%`

After M19 promotion:
- M19 earned: `14 / 14`
- earned: `353 / 1088 = 32.44%`
- remaining: `735 / 1088 = 67.56%`

Production credit is granted only by the separate MODULE_DONE promotion merge containing this Evidence Bundle and the synchronized canonical checkpoint/backlog delta.

STOP CONDITION: `GBS_WO_M19_001_EVIDENCE_APPROVED_FOR_MODULE_DONE_PROMOTION`.
