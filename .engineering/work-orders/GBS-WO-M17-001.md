# GBS-WO-M17-001 — Implement Checkpoint Engine

Status: `ADMITTED_READY_FOR_IMPLEMENTATION`
Risk: `HIGH`
Module: `GBS-M17 — Checkpoint Engine`
Canonical package: `packages/checkpoint-engine`
Canonical weight: `17`
Compilation base: `6f86f8e7805b96c8632d2457b6c14e32123b6a14`
Admission PR: `#191`
Admission reviewed head: `c32b381f9de816568cc77ed31e7c4a93e59dd8d0`
Admission merge / sole legal execution base: `54e1bdf6555b6170cc288617370592a072d6cf95`
Upstream release checkpoint: `GBS_M16_MODULE_DONE`

## Required implementation
Implement Canonical Continuation Capsule, Checkpoint State Vector, Authority Snapshot Index, Continuation Invariant Set, Semantic Compare-And-Swap, Checkpoint Promotion Transaction, Split-Brain Continuation Detector, Promotion Fence Token, Checkpoint Mutation Receipt, Checkpoint Dependency Graph, Selective Continuation Invalidation, Checkpoint Rollback Pointer, Stale Claim Quarantine, Continuity Regression Sentinel, Continuation Minimum Sufficient State, Historical Pointer Compaction, Checkpoint Portability Envelope, Cold-History Eviction Map, Checkpoint Size Guard, Checkpoint Admission Receipt, Resume Readiness Certificate, Checkpoint Freshness Vector and Continuation Handoff Contract.

## Constraints
No blind overwrite; CAS and fence tokens protect promotion; split-brain/divergence fail closed; immutable lineage and rollback pointer; selective invalidation conservatively widens when dependency knowledge is incomplete; compaction cannot erase required authority/proof; bounded/cancellable operations; deterministic injected SHA-256.

## Evidence and acceptance
Exact admitted base/head/tree, concurrency/divergence/rollback/compaction/portability tests, platform matrix, full regression, audit, semantic review, zero unresolved HIGH/CRITICAL, separate MODULE_DONE promotion.

## Admission binding
The M14-M18 train is admitted by PR #191 / merge `54e1bdf6555b6170cc288617370592a072d6cf95`. M16 received MODULE_DONE promotion with evidence `.engineering/evidence/GBS-WO-M16-001-EVIDENCE.md`; the upstream sequencing dependency is therefore satisfied. M17 is the active legal implementation stage and earns no production credit until separate promotion.

STOP CONDITION: `GBS_WO_M17_001_ADMITTED_READY_FOR_IMPLEMENTATION`.
