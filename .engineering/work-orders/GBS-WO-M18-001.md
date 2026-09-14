# GBS-WO-M18-001 — Implement Resume Engine

Status: `ADMITTED_READY_FOR_IMPLEMENTATION`
Risk: `ELEVATED`
Module: `GBS-M18 — Resume Engine`
Canonical package: `packages/resume-engine`
Canonical weight: `18`
Compilation base: `6f86f8e7805b96c8632d2457b6c14e32123b6a14`
Admission PR: `#191`
Admission reviewed head: `c32b381f9de816568cc77ed31e7c4a93e59dd8d0`
Admission merge / sole legal execution base: `54e1bdf6555b6170cc288617370592a072d6cf95`

## Required implementation
Implement Resume Intent Capsule, Lineage Continuity Proof, Resume Authority Boundary, Conversation Independence Rule, Resume Minimum Sufficient Context, Hot-State Rehydrator, Resume Read Plan, Negative Rehydration Cache, Context Temperature Map, Resume Drift Vector, Safe Re-entry Gate, Delta Rehydration Graph, Orphan Work Detector, Resume Conflict Quarantine, Resume Receipt, Resume Semantic Digest, Continuity Loss Sentinel, Resume Efficiency Receipt and Safe Handback Contract.

## Constraints
Resume derives from canonical checkpoint and authority bindings, never conversation memory alone; minimal reads are preferred only after sufficiency proof; source/policy/checkpoint drift causes bounded delta rehydration or replan, never silent continuation; orphan work and lineage mismatch quarantine; statuses include READY, EXPANSION_REQUIRED, DRIFT_REQUIRES_REPLAN, POLICY_BLOCKED, LINEAGE_MISMATCH, PROJECT_MISMATCH, INDETERMINATE; deterministic injected SHA-256; bounded/cancellable reads.

## Evidence and acceptance
Exact admitted base/head/tree, cold/warm resume, drift, lineage, orphan, budget and conversation-independence tests; platform matrix; full regression; audit/security; semantic review; zero unresolved HIGH/CRITICAL; separate MODULE_DONE promotion.

## Admission binding
The M14-M18 train is admitted by PR #191 / merge `54e1bdf6555b6170cc288617370592a072d6cf95`. M16 and M17 are MODULE_DONE. All upstream dependency gates for M18 are satisfied; M18 is now the legal active implementation stage and must descend from the promoted reviewed `main` descendant that preserves the admitted contracts.

STOP CONDITION: `GBS_WO_M18_001_ADMITTED_READY_FOR_IMPLEMENTATION`.
