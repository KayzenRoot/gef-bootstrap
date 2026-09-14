# GBS-WO-M17-001 — Implement Checkpoint Engine

Status: `COMPILED_NOT_ADMITTED`
Risk: `HIGH`
Module: `GBS-M17 — Checkpoint Engine`
Canonical package: `packages/checkpoint-engine`
Canonical weight: `17`
Compilation base: `6f86f8e7805b96c8632d2457b6c14e32123b6a14`

## Required implementation
Implement Canonical Continuation Capsule, Checkpoint State Vector, Authority Snapshot Index, Continuation Invariant Set, Semantic Compare-And-Swap, Checkpoint Promotion Transaction, Split-Brain Continuation Detector, Promotion Fence Token, Checkpoint Mutation Receipt, Checkpoint Dependency Graph, Selective Continuation Invalidation, Checkpoint Rollback Pointer, Stale Claim Quarantine, Continuity Regression Sentinel, Continuation Minimum Sufficient State, Historical Pointer Compaction, Checkpoint Portability Envelope, Cold-History Eviction Map, Checkpoint Size Guard, Checkpoint Admission Receipt, Resume Readiness Certificate, Checkpoint Freshness Vector and Continuation Handoff Contract.

## Constraints
No blind overwrite; CAS and fence tokens protect promotion; split-brain/divergence fail closed; immutable lineage and rollback pointer; selective invalidation conservatively widens when dependency knowledge is incomplete; compaction cannot erase required authority/proof; bounded/cancellable operations; deterministic injected SHA-256.

## Evidence and acceptance
Exact admitted base/head/tree, concurrency/divergence/rollback/compaction/portability tests, platform matrix, full regression, audit, semantic review, zero unresolved HIGH/CRITICAL, separate MODULE_DONE promotion.

Admission rule: separate admission merge required before implementation; its SHA is sole legal execution base.

STOP CONDITION: `GBS_WO_M17_001_COMPILED_AWAITING_ADMISSION`.