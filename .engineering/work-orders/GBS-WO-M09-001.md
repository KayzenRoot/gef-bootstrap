# GBS-WO-M09-001 — Implement Source Pack Engine

Status: `COMPILED_NOT_ADMITTED`
Risk: `ELEVATED`
Module: `GBS-M09 — Source Pack Engine`
Canonical implementation package: `packages/source-pack`

## Source Lock
Compilation base: `50b0e6a064f369d4babd5793e82d02b1a45044fa`.

Mandatory frozen sources:
- `.engineering/M09-MODULE-GATE.md`
- `.engineering/ledgers/M09-SOURCE-PACK-LEDGER-SYNC.md`
- `planning/modules/area-c-source-pack-and-planning/m09-source-pack-engine/S01-source-pack-structure.md`
- `planning/modules/area-c-source-pack-and-planning/m09-source-pack-engine/S02-required-documents.md`
- `planning/modules/area-c-source-pack-and-planning/m09-source-pack-engine/S03-conditional-documents.md`
- `planning/modules/area-c-source-pack-and-planning/m09-source-pack-engine/S04-source-hierarchy.md`
- `planning/modules/area-c-source-pack-and-planning/m09-source-pack-engine/S05-integrity.md`
- `planning/modules/area-c-source-pack-and-planning/m09-source-pack-engine/M09-INNOVATION-REGISTER.md`
- `.engineering/BACKLOG.md`
- `.engineering/CHECKPOINT.md`
- `.engineering/CHECKPOINT.json`

Lower-level authority contracts M03/M05/M06/M07/M08 remain binding and MUST NOT be weakened.

## Objective
Implement the smallest deterministic, read-only Source Pack Engine satisfying all frozen M09 sessions and the Module Gate, with strict project/source identity, topology, applicability, authority resolution, exact template resolution, integrity/invalidation semantics and reproducible receipt seeds.

## In Scope
1. strict/versioned Source Pack schema and validation;
2. project binding and stable semantic source identities;
3. document/section/fact/dependency topology;
4. Source Topology Mesh validation, bounded traversal and cycle diagnostics;
5. Authority Vector Envelope without global total-rank authority;
6. Canonical Requirement Matrix and all frozen resolution states;
7. already-admitted Source Alias Bridge representation;
8. Applicability Lattice and Condition Witnesses;
9. Dormant Source Pointer non-authority semantics;
10. domain-specific authority resolution plus Authority Resolution Proof;
11. Conflict Shadow Graph retention;
12. disposable Authority Neighborhood Cache only;
13. exact M07 template resolution by ID/version/required digest, no fallback;
14. explicit `DRIFT_RELATION` representation;
15. structural/source/authority/applicability integrity layers;
16. Semantic Integrity Spine through an injected SHA-256 digest capability;
17. Drift Shockwave Map selective invalidation with conservative widening;
18. semantic Integrity Epoch independent of time;
19. deterministic constitution fingerprint;
20. Conformance Receipt Seed without final assurance verdict;
21. immutable result snapshots, bounded/cancellable operation and startup purity;
22. typed fail-closed diagnostics.

## Forbidden Scope
- no filesystem/Git/provider mutation path;
- no package-manager, build-tool, runtime or repository-module execution;
- no ambient environment/home/global config harvesting;
- no network/provider access;
- no secret dereference;
- no floating/latest/closest template resolution;
- no authority inference from timestamps, filename order, filesystem order or chat history;
- no brownfield alias admission or migration policy, owned by M13;
- no executor context selection, owned by M14;
- no final evidence/assurance verdict mechanics, owned by M24+;
- no broader trust/authorship policy expansion, owned by M37;
- no runtime compatibility policy, owned by M51;
- no quantitative performance thresholds, owned by M63;
- no Codex use absent a separately governed exception/ADR.

## Implementation Constraints
- package must be pure/read-only on import and ordinary API use;
- use explicit supplied source sets only;
- semantic collections canonicalized before digest input;
- semantic identity excludes host path, locale, wall clock and enumeration order;
- digest capability injected; no weak or ambient fallback hash;
- duplicate semantic identities fail closed unless a frozen dedup rule explicitly permits equality;
- UNKNOWN/CONTRADICTORY/INDETERMINATE never become success;
- traversal and aggregate inputs have finite budgets and cancellation checks;
- cache is derived/disposable and never canonical truth;
- durable publication, if later admitted, routes through M05/M06.

## Required Public Surface
Expose typed, documented APIs sufficient to:
- validate/build immutable Source Pack snapshots;
- evaluate requirement/applicability states;
- resolve domain authority and emit reproducible proof;
- resolve exact template sources;
- evaluate four-layer integrity;
- compute semantic epoch/fingerprint/receipt seed;
- compute dependency-bound invalidation impact;
- return typed diagnostics/results without throwing for ordinary hostile runtime input.

Public API naming may follow repository conventions, but semantics above are fixed.

## Error Families
At minimum distinguish malformed/schema/version, duplicate/prototype-hostile input, project mismatch, missing required, ambiguous, conflict, invalid binding, unsupported version, stale identity/digest, topology cycle/budget, applicability unknown/contradictory, template not found/identity/version/digest mismatch, digest capability failure, cancellation and resource exhaustion.

## Test & Evidence Contract
Implementation PR must prove on its exact final head:
- strict schema/version/project validation;
- prototype-hostile/duplicate rejection where raw structured input is accepted;
- topology order invariance, bounded traversal and cycle diagnostics;
- domain authority preservation and no newest-wins behavior;
- requirement matrix including explicit NOT_APPLICABLE provenance;
- alias admitted/unadmitted behavior;
- ACTIVE/INACTIVE/UNKNOWN/CONTRADICTORY applicability;
- witness invalidation and dormant-pointer non-authority;
- reproducible Authority Resolution Proof and conflict-shadow retention;
- exact M07 template success and all mismatch/fallback-refusal cases;
- descriptive/normative drift preservation;
- independent four-layer integrity failures;
- selective invalidation and conservative widening;
- Integrity Epoch ordering/metadata invariance;
- constitution fingerprint and receipt-seed determinism;
- project mismatch/stale/unsupported-version behavior;
- cancellation/resource budgets;
- import/startup purity;
- M07 and M08 regressions;
- full repository regression appropriate to ELEVATED risk;
- focused Ubuntu/Windows/macOS matrix;
- dependency/security audit.

## Evidence Bundle Required
The implementation audit must bind:
- admitted implementation base SHA;
- exact reviewed implementation head SHA and tree;
- changed-file inventory;
- test/workflow run IDs and conclusions for that exact head;
- dependency/security audit result;
- semantic audit review ID;
- unresolved finding inventory by severity;
- implementation merge SHA if approved.

Previous-head green evidence MUST NOT substitute for exact-final-head evidence.

## Acceptance Criteria
`APPROVED` requires all frozen M09 semantics implemented within this WO, required evidence green on the exact final head, no unresolved HIGH/CRITICAL defect, no authority/scope leakage, and no hidden side effects. Any failure yields `CORRECTION_REQUIRED` or `BLOCKED` and prevents merge/promotion.

## Admission Rule
This compiled Work Order does NOT authorize implementation. A separate admission PR must bind the exact implementation base after this compilation is exact-head audited and merged.

## Production Accounting
M09 weight: `19`.
Compilation/admission/planning credit: `0 / 19`.
Current project production remains `156 / 1088 = 14.34%` until objective M09 implementation evidence and separate MODULE_DONE promotion pass.

STOP CONDITION: `GBS_WO_M09_001_COMPILED_AWAITING_EXACT_HEAD_AUDIT_AND_ADMISSION`.