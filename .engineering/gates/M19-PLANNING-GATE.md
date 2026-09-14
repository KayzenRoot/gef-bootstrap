# M19 Planning Gate
Status: `PASSED_CANDIDATE`
Module: `GBS-M19 — Project Registry`
Sessions: `4/4`
Frozen weight: `14`
Assurance intensity: `STANDARD_PLUS`

## Frozen source set
- `planning/modules/area-e-continuity/m19-project-registry/S01-registry-model-and-authority.md`
- `planning/modules/area-e-continuity/m19-project-registry/S02-index-query-and-collision.md`
- `planning/modules/area-e-continuity/m19-project-registry/S03-concurrency-freshness-and-repair.md`
- `planning/modules/area-e-continuity/m19-project-registry/S04-persistence-portability-and-handoff.md`
- `.engineering/ledgers/M19-PROJECT-REGISTRY-LEDGER-SYNC.md`
- `.engineering/ASSURANCE-INTENSITY.md`

## Required implementation families
1. Registry model and authority: PRE, RIE, RAB19, RPC19, RSA19, RMI19.
2. Index/query/collision: PRI19, RKM19, RCW19, DRQP19, RML19, AAC19, NRK19.
3. Concurrency/freshness/repair: RSV19, RCAS19, RPF19, RSBD19, SEQ19, RFV19, RRP19, NDC19, TLR19.
4. Persistence/portability/handoff: RSP19, RSC19, RAR19, RPP19, PLR19, RPE19, RCM19, RSG19, RHC19, RIR19.

## Authority/ownership checks
- M03 remains canonical project/repository identity owner.
- M04 remains repository/preflight discovery owner.
- M05/M06 remain physical mutation/filesystem-safety owners.
- M17/M18 remain checkpoint/resume owners.
- M21/M23 remain progress/status owners.
- M24/M25/M37 remain evidence/proof/integrity owners.
- M29+ remain Git/provider execution owners.
- M43 remains telemetry owner.

## Forbidden shortcuts
Newest-wins resolution, timestamp authority, registry-created identity, broad filesystem/network discovery, hidden collision resolution, path/credential leakage into portable evidence, stale negative-cache authority, blind overwrite, split-brain auto-merge and completion credit from planning alone.

## Acceptance gate for implementation
Exact admitted base/head/tree; deterministic injected SHA-256; bounded/cancellable traversals; focused adversarial tests; collision/CAS/split-brain/tombstone/privacy/portability tests; Ubuntu/Windows/macOS matrix; full repository regression; dependency audit; semantic review; zero unresolved CRITICAL/HIGH; separate MODULE_DONE promotion.

Planning verdict: `READY_FOR_WORK_ORDER_ADMISSION_REVIEW`.

STOP CONDITION: `M19_PLANNING_FROZEN_CANDIDATE_READY_FOR_ADMISSION`.
