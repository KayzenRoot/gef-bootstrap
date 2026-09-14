# GBS-WO-M13-001 — Implement GEF Adoption Engine

Status: `COMPILED_NOT_ADMITTED`
Risk: `ELEVATED`
Module: `GBS-M13 — GEF Adoption Engine`
Canonical implementation package: `packages/adoption-engine`
Canonical weight: `20`

## Source Lock
Compilation base: `c1ad7c8b73efac59e6f072bdf6f9e2ee6f7e9d34`.

Mandatory frozen sources:
- `.engineering/M13-MODULE-GATE.md`
- `.engineering/M13-PLANNING-FREEZE.md`
- `.engineering/ledgers/M13-ADOPTION-LEDGER-SYNC.md`
- M13 S01-S05 planning files and innovation register
- `.engineering/BACKLOG.md`
- `.engineering/CHECKPOINT.md`
- `.engineering/CHECKPOINT.json`

M00-M12 frozen contracts remain binding and MUST NOT be weakened.

## Objective
Implement the smallest deterministic, read-only GEF Adoption Engine satisfying frozen M13 planning: explicit adoption modes, first-class brownfield adoption, progressive governance maturity, bounded compatibility/normalization, capability-scoped adoption receipts and regression detection.

## Required implementation
1. explicit adoption mode validation and transition model;
2. Adoption Intent Capsule;
3. Governance Maturity Vector;
4. Adoption Safety Envelope;
5. new-project Empty-State Ambiguity Detector;
6. Bootstrap Seed Graph;
7. Minimal Governance Kernel completeness evaluation;
8. Bootstrap Provenance Chain projection;
9. Brownfield Truth Reconciler;
10. Progressive Governance Envelope;
11. Legacy Compatibility Membrane;
12. Adoption Slice Planner;
13. Legacy Debt Quarantine;
14. Drift Resolution Ladder validation;
15. Normalization Frontier;
16. Compatibility Bridge Contract;
17. Semantic Equivalence Probe;
18. Progressive Normalization Budget;
19. Reversibility Index;
20. Capability Unlock Matrix;
21. Adoption Proof Spine;
22. Governance Delta Receipt;
23. Adoption Regression Sentinel;
24. immutable deterministic Adoption Receipt.

## Forbidden scope
- no direct filesystem/Git/GitHub/provider mutation;
- no package install/build/project-code execution from adoption APIs;
- no network access;
- no secret dereference or environment harvesting;
- no product-intent decision authority;
- no Source Hierarchy replacement;
- no Scope/DoD redefinition;
- no task/context or execution-pack compilation;
- no generic policy-runtime implementation;
- no checkpoint/progress mutation;
- no final evidence/assurance/release verdict;
- no runtime/platform compatibility policy;
- no automatic destructive normalization;
- no newest-wins/timestamp/path/file-order/model-confidence authority;
- no Codex use absent separately governed exception/ADR.

## Implementation constraints
- strict TypeScript and repository conventions;
- import/startup purity;
- immutable return snapshots;
- explicit supplied inputs only;
- exact project/source/profile/policy binding;
- deterministic semantic canonicalization;
- injected SHA-256 digest capability, no weak fallback;
- caller budgets may only narrow safe defaults;
- graph operations bounded, cycle-safe and cancellable;
- unknown/ambiguous/indeterminate states fail closed for dependent capabilities;
- lossy mappings require explicit approval reference;
- partial adoption never collapses into full adoption;
- receipts contain references/digests instead of secret/raw environment material;
- no new runtime dependency without separately governed need.

## Public surface expectations
Expose typed APIs sufficient to:
- create/validate adoption intent capsules;
- validate adoption state transitions;
- build/evaluate per-domain maturity vectors;
- assess newness ambiguity;
- reconcile brownfield descriptive/normative truth into drift records;
- validate legacy mappings/bridges;
- compute minimum safe adoption slices;
- enforce normalization budgets and reversibility rules;
- evaluate explicit semantic equivalence subsets;
- evaluate capability prerequisites/unlocks;
- build proof-spine/delta/receipt projections;
- detect adoption regressions;
- return typed diagnostics for ordinary hostile/malformed runtime input.

Exact public naming may follow repository conventions; semantics are frozen.

## Required tests
Exact final head must prove:
- missing/ambiguous mode fail-closed;
- exact project/source/profile mismatch rejection;
- state transition validation;
- deterministic capsule/receipt/delta identities;
- true-new vs sparse-ambiguous distinction;
- seed-graph determinism/cycle/budget/cancellation;
- MGK completeness;
- descriptive vs normative truth separation;
- all frozen drift classes and no newest-wins;
- partial governance by domain;
- stale legacy alias/bridge invalidation;
- lossy mapping approval enforcement;
- minimal adoption slice excludes unrelated cleanup;
- debt quarantine persistence;
- frontier/dual-binding semantics;
- equivalence pass/fail/indeterminate/unsupported;
- normalization budget enforcement;
- unknown irreversibility blocks destructive promotion;
- capability unlock/denial reasons;
- selective proof invalidation with conservative widening;
- adoption regression detection;
- receipt validity states;
- no secret/raw environment material;
- startup purity;
- M09/M10/M11/M12 regressions;
- full repository regression appropriate to ELEVATED risk;
- focused Ubuntu/Windows/macOS matrix;
- dependency/security audit.

## Evidence Bundle
Must bind:
- exact admitted implementation base SHA;
- exact reviewed implementation head SHA and tree;
- changed files;
- workflow IDs and conclusions for exact head;
- platform-matrix results;
- cross-module regression results;
- dependency/security result;
- semantic audit review ID;
- unresolved findings by severity;
- merge SHA if approved.

Previous-head green evidence is not final evidence.

## Acceptance
`APPROVED` requires all frozen M13 semantics within scope, exact-final-head evidence green, no unresolved HIGH/CRITICAL defect and no authority leakage. Otherwise result is `CORRECTION_REQUIRED` or `BLOCKED` and merge/promotion stops.

## Admission rule
This compiled Work Order does NOT authorize implementation. A separate admission PR must bind the exact compilation merge as the only legal implementation base.

## Production accounting
M13 remains `0 / 20`; project remains `226 / 1088 = 20.77%` until implementation and separate MODULE_DONE promotion.

STOP CONDITION: `GBS_WO_M13_001_COMPILED_AWAITING_EXACT_HEAD_AUDIT_AND_ADMISSION`.