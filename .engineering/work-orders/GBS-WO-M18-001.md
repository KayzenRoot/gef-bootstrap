# GBS-WO-M18-001 — Implement Resume Engine

Status: `COMPILED_NOT_ADMITTED`
Risk: `ELEVATED`
Module: `GBS-M18 — Resume Engine`
Canonical package: `packages/resume-engine`
Canonical weight: `18`
Compilation base: `6f86f8e7805b96c8632d2457b6c14e32123b6a14`

## Required implementation
Implement Resume Intent Capsule, Lineage Continuity Proof, Resume Authority Boundary, Conversation Independence Rule, Resume Minimum Sufficient Context, Hot-State Rehydrator, Resume Read Plan, Negative Rehydration Cache, Context Temperature Map, Resume Drift Vector, Safe Re-entry Gate, Delta Rehydration Graph, Orphan Work Detector, Resume Conflict Quarantine, Resume Receipt, Resume Semantic Digest, Continuity Loss Sentinel, Resume Efficiency Receipt and Safe Handback Contract.

## Constraints
Resume derives from canonical checkpoint and authority bindings, never conversation memory alone; minimal reads are preferred only after sufficiency proof; source/policy/checkpoint drift causes bounded delta rehydration or replan, never silent continuation; orphan work and lineage mismatch quarantine; statuses include READY, EXPANSION_REQUIRED, DRIFT_REQUIRES_REPLAN, POLICY_BLOCKED, LINEAGE_MISMATCH, PROJECT_MISMATCH, INDETERMINATE; deterministic injected SHA-256; bounded/cancellable reads.

## Evidence and acceptance
Exact admitted base/head/tree, cold/warm resume, drift, lineage, orphan, budget and conversation-independence tests; platform matrix; full regression; audit/security; semantic review; zero unresolved HIGH/CRITICAL; separate MODULE_DONE promotion.

Admission rule: implementation unauthorized until separate admission merge; its SHA is sole legal execution base.

STOP CONDITION: `GBS_WO_M18_001_COMPILED_AWAITING_ADMISSION`.