# GBS-WO-M19-001 — Implement Project Registry

Status: `MODULE_DONE`
Risk: `MEDIUM`
Assurance intensity: `STANDARD_PLUS`
Module: `GBS-M19 — Project Registry`
Canonical package: `packages/project-registry`
Canonical weight: `14`
Planning gate: `.engineering/gates/M19-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#208`
Planning freeze merge: `074a45b1cfda7400dd87e7941218f390570d594a`
Admission PR: `#209`
Admission reviewed head: `f255c78ee9fca2a83fe9ea90470918e3a9b43aa8`
Admission semantic audit: `5203267235`
Admission merge / sole legal execution base: `ab2de11ee0e285e16b220ea5f788692ed018021a`
Implementation PR: `#211`
Reviewed implementation head: `0682d7f33427ee9e07368a300afc13f516cd6a66`
Reviewed implementation tree: `48613e9babfd82f65659ef770138f83515a0ddd7`
Implementation semantic audit: `5203667272`
Implementation merge: `e525a3cbe24dd27bca6ddd9f2eeaa5f1e766957f`
Evidence: `.engineering/evidence/GBS-WO-M19-001-EVIDENCE.md`

## Objective
Implement a deterministic, persistent, collision-safe project registry that indexes known projects for routing/resume efficiency while remaining subordinate to canonical M03 identity and M17/M18 continuation truth.

## Required implementation
Implement all frozen M19 mechanism families:
- PRE, RIE, RAB19, RPC19, RSA19, RMI19;
- PRI19, RKM19, RCW19, DRQP19, RML19, AAC19, NRK19;
- RSV19, RCAS19, RPF19, RSBD19, SEQ19, RFV19, RRP19, NDC19, TLR19;
- RSP19, RSC19, RAR19, RPP19, PLR19, RPE19, RCM19, RSG19, RHC19, RIR19.

## Architecture constraints
1. TypeScript/Node, library-first, deterministic pure functions where possible.
2. Direct filesystem/network/Git/provider access is forbidden in the semantic core.
3. Persistence occurs only through an injected `RegistryStorePort` and exact semantic compare-and-swap.
4. Registry may consume M03 identity projections and M17 checkpoint pointers but must not create/repair canonical identity or checkpoint state.
5. `EXACT` is the only automatic match success. `POSSIBLE`, `CONFLICT`, `UNKNOWN` and stale states fail closed for automatic selection.
6. No timestamp/newest-wins conflict resolution.
7. Split-brain successors, stale bases and identity conflicts are preserved/quarantined, never silently merged.
8. Private local locator material is separated from portable/shareable registry projections.
9. Credential/secret-like material is forbidden from persisted portable snapshots and receipts.
10. Negative knowledge/failure fingerprints are validity-bound and conservatively invalidated.
11. Historical compaction must retain collision/tombstone/provenance material required for safe identity decisions.
12. All traversals/budgets are bounded and cancellable where work can scale.
13. Digest provider is injected SHA-256 with fail-closed validation. No fallback hash.
14. Package import and ordinary semantic API use must remain startup-pure.

## Expected package surface
- `packages/project-registry/package.json`
- `packages/project-registry/tsconfig.json`
- `packages/project-registry/src/types.ts`
- bounded S01-S04 implementation units and `src/public.ts`
- no direct CLI ownership and no hidden side effects.

## Required proof families
- entry construction/verification and authority-boundary tests;
- exact/possible/conflict/absent/unknown lookup tests;
- alias admission and collision witness tests;
- deterministic query/index ordering and bounded-query tests;
- CAS race, stale-base and split-brain tests;
- stale quarantine, freshness and repair tests;
- tombstone resurrection prevention;
- negative knowledge/failure-fingerprint invalidation;
- snapshot/admission receipt tamper tests;
- privacy projection and secret/path leakage tests;
- portability/import mismatch tests;
- compaction preservation and size-guard tests;
- store-port failure/cancellation tests;
- startup purity and no ambient I/O tests;
- Ubuntu/Windows/macOS focused matrix;
- full repository regression and dependency audit.

## Out of scope
Broad repository discovery, canonical identity transition, filesystem safety engine, checkpoint promotion/resume semantics, progress/status computation, evidence/proof graph, Git/provider mutation, telemetry collection and operator UX.

## Accepted evidence
- focused M19: `62/62` PASS on Ubuntu, Windows and macOS;
- full repository regression: `684/684` PASS;
- dependency audit: `0 vulnerabilities`;
- Security CodeQL: SUCCESS;
- exact-head triggered workflows: `16/16` SUCCESS;
- semantic audit: `CRITICAL 0 / HIGH 0`.

## Completion binding
The implementation is accepted only at exact reviewed head `0682d7f33427ee9e07368a300afc13f516cd6a66`, tree `48613e9babfd82f65659ef770138f83515a0ddd7`, semantic review `5203667272`, and implementation merge `e525a3cbe24dd27bca6ddd9f2eeaa5f1e766957f`. Production credit is granted only by the separate MODULE_DONE promotion that merges this Work Order closure with its Evidence Bundle and synchronized checkpoint/backlog state.

STOP CONDITION: `GBS_WO_M19_001_MODULE_DONE`.
