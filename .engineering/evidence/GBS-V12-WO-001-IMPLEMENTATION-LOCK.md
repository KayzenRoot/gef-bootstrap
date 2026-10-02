# GBS-V12-WO-001 — Fresh implementation Context Lock evidence

State: IMPLEMENTATION_LOCK_CANDIDATE / NO PRODUCT IMPLEMENTATION YET
Issue: #372
Branch: feat/v1.2/wo-001-guided-planning-marathon
Implementation base: main@8e63ae5a2733139080063eab9434639c772a04ec

## Proven predecessor chain

- WO-000 terminal state: GBS_V12_WO_000_ADMITTED_NO_IMPLEMENTATION.
- WO-001 admission PR #373 exact audited head: 9d9788fc03c0b19eab09c7fdd0c231ca7891d1c9.
- WO-001 admission owner review: #5395657110, APPROVED / NOT_INDEPENDENT.
- WO-001 admission merge: 3b576e7b090a7f49ea7397b2c3840147158d2a72.
- Governance effectivity sync issue: #374.
- Governance sync PR #376 exact audited head: 4614d4e2070fe11f5ae23280ad3f4a9618e36cc7.
- Governance sync owner review: #5396175403, APPROVED / NOT_INDEPENDENT.
- Governance sync merge / implementation base: 8e63ae5a2733139080063eab9434639c772a04ec.
- Canonical checkpoint now states GBS_V12_WO_001_ADMITTED_AWAITING_FRESH_IMPLEMENTATION_LOCK.
- Universal implementation credit remains 0/10 and implementationStarted=false.

## Fresh-lock scope

This scaffold changes only:
- .engineering/context-locks/GBS-V12-WO-001.json
- .engineering/evidence/GBS-V12-WO-001-IMPLEMENTATION-LOCK.md

The fresh lock binds canonical Source Pack/checkpoint fingerprints plus the exact M09-M18 implementation surfaces relevant to U12-01/U12-02 and candidate U12-03.

No runtime/product source, test, CI/workflow, dependency, package, checkpoint, profile, release or deployment change is part of this lock scaffold.

## Authorization semantics

The lock is NOT implementation authority until its exact head:
1. receives owner audit APPROVED / NOT_INDEPENDENT;
2. has CRITICAL/HIGH = 0;
3. has required exact-head checks green;
4. still descends from main@8e63ae5a2733139080063eab9434639c772a04ec;
5. still matches Issue #372 and the locked canonical/implementation surfaces before Codex first source edit.

After those conditions, Codex alone may implement under the same branch and Work Order. ChatGPT does not author implementation code/tests/CI/migrations.

## Target obligations

Required:
- U12-01 Guided discovery contract.
- U12-02 Canonical planning impact/completeness.

Conditional completion:
- U12-03 bounded Marathon orchestration only if every canonical acceptance case is proven in this WO.

No U12-04..U12-10 credit is available in this WO.

## Lock audit validation

Before authorizing Codex:
- diff limited to the two governance/evidence files above;
- Context Lock JSON parses;
- all implementation-base fingerprints match exact main;
- Repository Validation, Pipeline Integrity, Gitleaks and Trivy are exact-head green;
- no unresolved CodeRabbit finding or review thread;
- CRITICAL/HIGH = 0.

STOP before implementation:
GBS_V12_WO_001_IMPLEMENTATION_LOCK_READY_FOR_OWNER_AUDIT

Post-audit state:
GBS_V12_WO_001_ADMITTED_READY_FOR_CODEX
