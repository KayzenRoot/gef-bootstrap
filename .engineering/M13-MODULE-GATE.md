# GBS-M13 — Module Gate

Status: `PLANNED_READY_FOR_IMPLEMENTATION`
Module: `GBS-M13 — GEF Adoption Engine`
Risk: `ELEVATED`
Canonical weight: `20`
Implementation surface: `packages/adoption-engine`

## Gate inputs
- planning PR #177 reviewed exact head `2256ebb4e5c7c77d8e5aa28e76acddb78ba9af07`;
- planning semantic audit `5195569395`;
- planning merge `7254ad200ac0b5d51a6daf1be0204414862ae487`;
- freeze/ledger PR #178 exact head `79a763754aa588266302e09493b2f73428e71858`;
- freeze audit `5195589842`;
- freeze merge `8384e9ceef92c0a0407df756c8f26489a69f78f2`;
- `.engineering/M13-PLANNING-FREEZE.md`;
- `.engineering/ledgers/M13-ADOPTION-LEDGER-SYNC.md`;
- M13 S01-S05 and innovation register;
- M00-M12 frozen contracts and current checkpoint.

## Gate verdict
`PLANNED_READY_FOR_IMPLEMENTATION`

No unresolved HIGH/CRITICAL planning defect is known. The module has a bounded deterministic V1 surface and clear ownership boundaries.

## Required implementation surface
The M13 implementation must provide pure/read-only planning/projection APIs for:

1. explicit adoption mode validation/admission;
2. Adoption Intent Capsule construction and semantic identity;
3. Governance Maturity Vector construction/transition validation;
4. Adoption Safety Envelope validation;
5. new-project ambiguity assessment and Bootstrap Seed Graph;
6. Minimal Governance Kernel completeness checks;
7. Bootstrap Provenance Chain projection;
8. Brownfield Truth Reconciler truth-pair/drift projection;
9. Progressive Governance Envelope per-domain maturity;
10. Legacy Compatibility Membrane validation;
11. Adoption Slice Planner minimum-safe-slice projection;
12. Legacy Debt Quarantine records;
13. Drift Resolution Ladder validation without deciding intent;
14. Normalization Frontier transitions;
15. Compatibility Bridge Contract validation;
16. Semantic Equivalence Probe for explicit normalized subsets;
17. Progressive Normalization Budget enforcement;
18. Reversibility Index classification from explicit inputs;
19. Capability Unlock Matrix evaluation;
20. Adoption Proof Spine and Governance Delta Receipt;
21. Adoption Regression Sentinel;
22. deterministic immutable Adoption Receipt projection.

## Non-negotiable safety properties
- no direct filesystem mutation;
- no Git/GitHub/provider mutation;
- no dependency install/build/project-code execution;
- no network access;
- no environment/home/global-tool state as semantic authority;
- no secret dereference or receipt embedding;
- no automatic product-intent decision;
- no newest-wins/timestamp/file-order authority;
- no broad destructive normalization;
- no cross-project receipt/capsule reuse;
- no lossy mapping promotion without explicit approval reference;
- `PARTIAL` adoption cannot be represented as full adoption;
- unknown/ambiguous/indeterminate states fail closed for affected capability;
- no checkpoint/progress/evidence/assurance/release authority.

## Required technical properties
- strict TypeScript under repository compiler settings;
- immutable snapshots/results;
- deterministic canonicalization independent of array/fs enumeration order where semantics are set-like;
- injected SHA-256 digest capability, no weak fallback;
- finite caller-narrowable budgets only;
- cancellation checks for graph/iterative operations;
- cycle-safe graph validation;
- exact project/source/profile/policy bindings;
- typed diagnostics for ordinary hostile/malformed runtime input;
- startup-pure import;
- no new runtime dependency unless separately justified and admitted.

## Mandatory test families
### Adoption policy
- missing/ambiguous mode rejection;
- explicit mode acceptance;
- project binding mismatch;
- unsupported transition;
- stale source-pack/profile binding.

### New project
- true new project;
- sparse-but-ambiguous project emits `NEWNESS_UNCERTAIN`;
- deterministic Bootstrap Seed Graph;
- graph cycle/budget/cancellation;
- skeleton source never masquerades as approved decision;
- MGK completeness.

### Brownfield
- descriptive vs normative truth preserved separately;
- all frozen drift classes;
- no newest-wins resolution;
- partial-domain governance;
- exact/stale legacy aliases;
- lossy bridge requires approval;
- smallest safe adoption slice excludes unrelated cleanup;
- quarantined debt remains visible.

### Compatibility/normalization
- Normalization Frontier transitions;
- `DUAL_BOUND` coexistence;
- equivalence `EQUIVALENT/NON_EQUIVALENT/INDETERMINATE/UNSUPPORTED_MAPPING`;
- normalization budget exhaustion;
- unknown irreversibility blocks destructive promotion.

### Receipt/capabilities
- deterministic receipt identity;
- `VALID/PARTIAL/STALE/BLOCKED/PROJECT_MISMATCH/SOURCE_PACK_MISMATCH/POLICY_VERSION_UNSUPPORTED/INDETERMINATE`;
- capability unlock/denial reasons;
- selective proof-spine invalidation with conservative widening;
- governance regression detection;
- no secret/raw environment payload.

### Platform/regression
- focused Ubuntu/Windows/macOS matrix;
- M09 Source Pack regressions;
- M10 Planning Workspace regressions;
- M11 Decision System regressions;
- M12 Scope & DoD regressions;
- repository-wide regression appropriate to ELEVATED risk;
- `npm audit --audit-level=low` or repository-equivalent dependency/security check.

## Evidence contract
Implementation audit must bind:
- exact admitted base SHA;
- exact final implementation head and tree;
- changed-file inventory;
- workflow IDs/conclusions for exact final head;
- focused platform matrix;
- cross-module regression evidence;
- dependency/security result;
- semantic audit review ID;
- unresolved findings by severity;
- implementation merge SHA if approved.

Previous-head green runs are not final evidence.

## Ownership boundaries verified
- M05/M06: writes/transaction/filesystem safety;
- M09: Source Pack/source authority;
- M11: decisions/product intent;
- M12: Scope/DoD semantics;
- M14: Task & Context Compiler;
- M15: Execution Pack Compiler;
- M16: generic Policy & Guardrail Engine;
- M17/M21: checkpoint/progress;
- M24+: evidence/proof/assurance;
- M29+: Git/GitHub mechanics;
- M36: recovery;
- M37: general integrity;
- M44: audit ledger;
- M51: runtime/platform compatibility;
- M62: production acceptance.

## Production accounting
M13 remains `0 / 20` until implementation is exact-head audited, merged and separately promoted `MODULE_DONE`.

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.

STOP CONDITION: `READY_FOR_GBS_WO_M13_001_COMPILE`.