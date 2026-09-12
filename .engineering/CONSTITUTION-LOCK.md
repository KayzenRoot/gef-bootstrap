# GEF Bootstrap Constitution Lock

Status: `PROPOSED_FOR_S05_FREEZE`

Constitution version: `GBS-CONSTITUTION-v1.0`

This file is a compact reference surface. It does not replace the canonical frozen session documents or `.engineering/DECISIONS-LEDGER.md`.

## Frozen groups

- `CONST-F1` — Product identity and boundary
- `CONST-F2` — Default engineering model
- `CONST-F3` — Primary optimization objective
- `CONST-F4` — Brownfield is first-class
- `CONST-F5` — Source truth model
- `CONST-F6` — Scope model
- `CONST-F7` — Completion model
- `CONST-F8` — Continuity and auditability

## Canonical sources

- `GBS-M00-S01 — Purpose & Principles`
- `GBS-M00-S02 — Source Hierarchy`
- `GBS-M00-S03 — Scope Rules`
- `GBS-M00-S04 — Definition of Done`
- `GBS-M00-S05 — Frozen Decisions`
- `.engineering/DECISIONS-LEDGER.md`
- `.engineering/TECHNOLOGY-LEDGER.md`

## Validity
The lock is valid only for the exact governed constitutional state it references. A deterministic constitution fingerprint is required later from the owning Source Pack/Integrity mechanism. No placeholder or fabricated hash is permitted.

## Reopen triggers
Only governed evidence-backed triggers may initiate reopening:

`SOURCE_DRIFT`, `CONTRADICTION_DISCOVERED`, `SECURITY_OR_INTEGRITY_DEFECT`, `DEPENDENCY_INVALIDATED`, `V1_SCOPE_SUPERSESSION`, `MEASURED_FAILURE`, or `EXPLICIT_USER_PRODUCT_DECISION`.

An explicit product-owner decision initiates a governed supersession process; it does not silently mutate the Constitution.

## Consumption rule
Downstream work should consume the smallest relevant set of `CONST-F*` and `D-*` references first, expanding to full canonical sources only when validity, ambiguity, conflict or assurance requires it.
