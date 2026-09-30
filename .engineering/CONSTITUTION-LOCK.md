# GEF Bootstrap Constitution Lock

Status: `FROZEN_CANDIDATE`

Constitution version: `GBS-CONSTITUTION-v1.1`

This file is a compact reference surface. It does not replace the canonical frozen session documents, Constitution Amendment 0001 or `.engineering/DECISIONS-LEDGER.md`.

## Frozen groups

- `CONST-F1` — Product identity and boundary — **AMENDED by Constitution Amendment 0001: hybrid semantic + deterministic product**
- `CONST-F2` — Default engineering model
- `CONST-F3` — Primary optimization objective
- `CONST-F4` — Brownfield is first-class
- `CONST-F5` — Source truth model
- `CONST-F6` — Scope model
- `CONST-F7` — Completion model
- `CONST-F8` — Continuity and auditability

## Current hybrid boundary
GEF Bootstrap is a hybrid product with two governed planes:

1. **Semantic plane:** canonical repository + ChatGPT/Planning Agent. Owns product reasoning, architecture intent, scope, requirement interpretation, assurance policy and semantic review.
2. **Deterministic work plane:** code for bounded mechanical operations such as materialization, validation, fingerprints, inspection, deterministic indexes/diffs, receipts and conformance checks.

The deterministic work plane is part of the product but never silently becomes semantic authority. CLI is a possible interface, not the constitutional requirement itself.

## Self-construction constraint
Under owner-directed ADR-0008 / D-0063, **Codex is the sole code/test/CI/migration author** for GEF Bootstrap and new GEF-governed projects, effective on `main` at PR #332 merge `419b9cd713d4817c05582287ec10793fc7fdc130` and on `release/1.1` at PR #347 merge `9f6f069c977868ade34a19cddb346f7bea9a95fe`. D-0062 remains branch-qualified: main ADR-0007 records Hive retirement; release ADR-0006 governs owner audit and merge authority. ChatGPT retains semantic planning, approved governance-document authorship, GitHub coordination, objective review and evidence reporting. The hybrid product boundary and accepted V1 history remain unchanged.

## Canonical sources

- `GBS-M00-S01 — Purpose & Principles`
- `GBS-M00-S02 — Source Hierarchy`
- `GBS-M00-S03 — Scope Rules`
- `GBS-M00-S04 — Definition of Done`
- `GBS-M00-S05 — Frozen Decisions`
- `.engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md`
- `.engineering/DECISIONS-LEDGER.md`
- `.engineering/decisions/ADR-0006-OWNER-OPERATED-REVIEW-AND-MERGE.md`
- `.engineering/TECHNOLOGY-LEDGER.md`

## History
- `GBS-CONSTITUTION-v1.0` — original instruction-first constitutional freeze.
- ADR-0008 / D-0063 — approved and effective on main at PR #332 merge `419b9cd713d4817c05582287ec10793fc7fdc130`; release/1.1 adoption is effective at PR #347 merge `9f6f069c977868ade34a19cddb346f7bea9a95fe`.
- `GBS-CONSTITUTION-v1.1` — hybrid product amendment triggered by explicit Product Owner decision.
- `ADR-0008 / D-0063` — approved narrow construction-actor supersession: main PR #332 and release adoption PR #347 have both merged at their recorded SHAs; each owner audit is NOT_INDEPENDENT. The cumulative Gate 2 candidate does not constitute a V1.1 production promotion.

## Validity
The lock is valid only for the exact governed constitutional state it references. A deterministic constitution fingerprint is still required later from the owning Source Pack/Integrity mechanism. No placeholder or fabricated hash is permitted.

## Reopen triggers
Only governed evidence-backed triggers may initiate reopening:

`SOURCE_DRIFT`, `CONTRADICTION_DISCOVERED`, `SECURITY_OR_INTEGRITY_DEFECT`, `DEPENDENCY_INVALIDATED`, `V1_SCOPE_SUPERSESSION`, `MEASURED_FAILURE`, or `EXPLICIT_USER_PRODUCT_DECISION`.

An explicit product-owner decision initiates a governed supersession process; it does not silently mutate the Constitution. The owner-operated review/merge policy is the bounded, evidence-bound supersession recorded by D-0062/ADR-0006; the other frozen constitutional groups remain unchanged.

## Consumption rule
Downstream work should consume the smallest relevant set of `CONST-F*`, amendment and `D-*` references first, expanding to full canonical sources only when validity, ambiguity, conflict or assurance requires it.
