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
The GEF Bootstrap repository itself is built through ChatGPT and connected project tools. Codex is not used as an implementation executor for this repository. This does not prohibit target projects from using Codex under GEF governance.

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
- `GBS-CONSTITUTION-v1.1` — hybrid product amendment triggered by explicit Product Owner decision.

## Validity
The lock is valid only for the exact governed constitutional state it references. A deterministic constitution fingerprint is still required later from the owning Source Pack/Integrity mechanism. No placeholder or fabricated hash is permitted.

## Reopen triggers
Only governed evidence-backed triggers may initiate reopening:

`SOURCE_DRIFT`, `CONTRADICTION_DISCOVERED`, `SECURITY_OR_INTEGRITY_DEFECT`, `DEPENDENCY_INVALIDATED`, `V1_SCOPE_SUPERSESSION`, `MEASURED_FAILURE`, or `EXPLICIT_USER_PRODUCT_DECISION`.

An explicit product-owner decision initiates a governed supersession process; it does not silently mutate the Constitution. The owner-operated review/merge policy is the bounded, evidence-bound supersession recorded by D-0062/ADR-0006; the other frozen constitutional groups remain unchanged.

## Consumption rule
Downstream work should consume the smallest relevant set of `CONST-F*`, amendment and `D-*` references first, expanding to full canonical sources only when validity, ambiguity, conflict or assurance requires it.
