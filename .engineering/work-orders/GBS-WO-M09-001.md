# GBS-WO-M09-001 — Implement Source Pack Engine

Status: `ADMITTED`
Risk: `ELEVATED`
Module: `GBS-M09 — Source Pack Engine`
Canonical implementation package: `packages/source-pack`

## Source Lock
Compilation base: `50b0e6a064f369d4babd5793e82d02b1a45044fa`.
Compilation PR: `#167`.
Compilation exact reviewed head: `e1aebb4c621ed92288bd24eddf4d9352ed66cb03`.
Compilation semantic audit review: `5193328719` (`APPROVED` verdict recorded as COMMENT because GitHub forbids self-APPROVE).
Compilation merge / exact admitted implementation base: `e68830f4edd84c0f989877abeffdf8e720c28dde`.

Mandatory frozen sources:
- `.engineering/M09-MODULE-GATE.md`
- `.engineering/ledgers/M09-SOURCE-PACK-LEDGER-SYNC.md`
- M09 S01-S05 frozen planning files
- `planning/modules/area-c-source-pack-and-planning/m09-source-pack-engine/M09-INNOVATION-REGISTER.md`
- `.engineering/BACKLOG.md`
- `.engineering/CHECKPOINT.md`
- `.engineering/CHECKPOINT.json`

Lower-level authority contracts M03/M05/M06/M07/M08 remain binding and MUST NOT be weakened.

## Objective
Implement the smallest deterministic, read-only Source Pack Engine satisfying all frozen M09 sessions and Module Gate obligations.

## Required implementation
Implement the full frozen surface: strict/versioned Source Pack schema; project/source identity; document-section-fact-dependency topology; bounded Source Topology Mesh; Authority Vector Envelope; Canonical Requirement Matrix and frozen resolution states; admitted-alias representation; Applicability Lattice and Condition Witnesses; Dormant Source Pointer; domain-specific authority resolution and Authority Resolution Proof; Conflict Shadow Graph; disposable Authority Neighborhood Cache; exact M07 template resolution with no fallback; `DRIFT_RELATION`; four integrity layers; injected SHA-256 Semantic Integrity Spine; Drift Shockwave Map; semantic Integrity Epoch; constitution fingerprint; Conformance Receipt Seed; immutable snapshots; bounded/cancellable/startup-pure operation; typed fail-closed diagnostics.

## Forbidden Scope
No filesystem/Git/provider mutation; no runtime/package/build execution; no ambient environment/home/global configuration; no network; no secret dereference; no floating/latest/closest template; no timestamp/path/chat-history authority; no M13 alias admission/migration; no M14 context selection; no M24+ final assurance verdict; no M37 trust-policy expansion; no M51 compatibility policy; no M63 quantitative thresholds; no Codex absent separately governed exception/ADR.

## Implementation constraints
Use explicit supplied source sets only. Canonicalize semantic collections. Exclude host path, locale, wall clock and enumeration order from semantic identity. Inject digest capability with no weak fallback. Fail closed on duplicates/conflicts/unknown states. Enforce finite budgets and cancellation. Derived cache never becomes canonical truth. Durable publication must route through M05/M06.

## Required evidence
Exact final implementation head must prove strict schema/project validation; hostile structured-input rejection where applicable; topology invariance/cycles/budgets; domain authority and no newest-wins; requirement matrix; alias rules; applicability states; witness invalidation; dormant non-authority; reproducible ARP; conflict shadow; exact M07 template success and mismatch/fallback refusal; drift; independent integrity-layer failures; selective/conservative invalidation; epoch/fingerprint/receipt determinism; stale/project/version handling; cancellation; startup purity; M07/M08 regressions; full ELEVATED regression; Ubuntu/Windows/macOS focused matrix; dependency/security audit.

Evidence Bundle must bind admitted base SHA, exact reviewed head/tree, changed files, exact-head workflow IDs/conclusions, dependency/security audit, semantic audit review, severity inventory and implementation merge SHA. Previous-head green evidence is invalid as final proof.

## Acceptance
Only exact-final-head green evidence with no unresolved HIGH/CRITICAL defect and no scope/authority leakage may receive `APPROVED`. Otherwise `CORRECTION_REQUIRED` or `BLOCKED` prevents merge/promotion.

## Admission
Implementation is authorized only from exact base `e68830f4edd84c0f989877abeffdf8e720c28dde`. Any implementation branch based elsewhere is invalid and must be recreated/rebased before code changes are accepted.

## Production Accounting
M09 weight: `19`; admitted credit remains `0 / 19`. Project production remains `156 / 1088 = 14.34%` until implementation evidence and separate MODULE_DONE promotion pass.

STOP CONDITION: `GBS_WO_M09_001_ADMITTED_IMPLEMENT_FROM_E68830F4EDD84C0F989877ABEFFDF8E720C28DDE`.