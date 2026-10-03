# GBS-V12-WO-002 — Fresh implementation Context Lock evidence

State: IMPLEMENTATION_LOCK_CANDIDATE / NO PRODUCT IMPLEMENTATION YET
Issue: #380
Branch: feat/v1.2/wo-002-bug-proof
Implementation base: main@639b6c430fa9c722e491e8108115f8ed2e5f7556

## Proven predecessor chain

- WO-001 terminal state: GBS_V12_WO_001_PROMOTED.
- WO-002 admission PR #381 exact audited head: a5dc8faec18d68742928a350e377f1a7bd5bb460.
- WO-002 admission owner review: #5398163456, APPROVED / NOT_INDEPENDENT.
- WO-002 admission merge: fb58ca309271bbea11b5f7a60e44168dd10c58e8.
- Governance effectivity sync issue: #382.
- Governance sync PR #383 exact audited head: f365d28ad1131c034e63447f0a956e0c4eb8ddf1.
- Governance sync owner review: #5398199415, APPROVED / NOT_INDEPENDENT.
- Governance sync merge / implementation base: 639b6c430fa9c722e491e8108115f8ed2e5f7556.
- Canonical checkpoint states GBS_V12_WO_002_ADMITTED_AWAITING_FRESH_IMPLEMENTATION_LOCK.
- Universal implementation credit remains 2/10; U12-04 remains NOT_IMPLEMENTED.

## Fresh-lock scope

This scaffold changes only:
- .engineering/context-locks/GBS-V12-WO-002.json
- .engineering/evidence/GBS-V12-WO-002-IMPLEMENTATION-LOCK.md

The fresh lock binds canonical Source Pack/checkpoint fingerprints plus the exact M24-M28 implementation surfaces relevant to U12-04.

No runtime/product source, product test, CI/workflow, dependency, package, checkpoint, profile, release or deployment change is part of this lock scaffold.

## Authorization semantics

The lock is NOT implementation authority until its exact head:
1. receives owner audit APPROVED / NOT_INDEPENDENT;
2. has CRITICAL/HIGH = 0;
3. has required exact-head checks green;
4. still descends from main@639b6c430fa9c722e491e8108115f8ed2e5f7556;
5. still matches Issue #380 and the locked canonical/M24-M28 surfaces before Codex first source edit.

After those conditions, Codex alone may implement U12-04 under the same branch and Work Order. ChatGPT does not author implementation code/tests/CI/migrations.

## U12-04 target

Required:
- requirement → invariant → hypothesis → test/probe → evidence → finding trace;
- stable deterministic identities and exact-state binding;
- hypothesis distinct from reproduced defect;
- current accepted evidence gate for REPRODUCED;
- retained negative controls;
- evidence-bound false-positive lineage;
- selective invalidation;
- mix-and-match/stale/cross-lineage fail-closed;
- M28 target selection/widening reuse;
- replay/dedup, bounded failure and order determinism.

Not creditable:
- U12-03;
- U12-05..U12-10;
- C03/C12 or D01-D12 profiles.

## Lock audit validation

Before authorizing Codex:
- diff limited to the two lock/evidence files above;
- Context Lock JSON parses;
- all implementation-base fingerprints match exact main;
- Repository Validation, Pipeline Integrity, Gitleaks and Trivy exact-head green;
- no unresolved CodeRabbit finding/review thread;
- CRITICAL/HIGH = 0.

STOP before implementation:
GBS_V12_WO_002_IMPLEMENTATION_LOCK_READY_FOR_OWNER_AUDIT

Post-audit state:
GBS_V12_WO_002_ADMITTED_READY_FOR_CODEX
