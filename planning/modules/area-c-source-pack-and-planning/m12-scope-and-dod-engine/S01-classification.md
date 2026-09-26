# GBS-M12-S01 — Classification

Status: `FROZEN`
Module: `GBS-M12 Scope & DoD Engine`
Session: `S01`
Risk: `STANDARD`

## Objective
Define the deterministic work-classification contract consumed by governed planning without creating a second source of truth. M12 classifies candidate work against already-authoritative project state; it does not rewrite Scope, Requirements, Architecture, Decisions or DoD.

## Authority boundary
Canonical authority continues to follow the project Source Hierarchy. M12 receives source references and evidence signals from the governed state and returns a classification result. It MUST NOT decide which source outranks another, resolve decision conflicts, promote checkpoints, calculate project progress or claim final assurance.

The complete-product Scope classification (`CORE_REQUIRED`, `PRODUCT_INCLUDED`, `EXPERIMENTAL_GATED`, `OPTIONAL_ADAPTER`, `OUT_OF_SCOPE`) remains a project/module inventory concern. This session defines the separate work-admission vocabulary used by the engineering process: `NECESSARY`, `IMPORTANT`, `FUTURE`, `OUT_OF_SCOPE`.

## Classification contract
A candidate has a stable `candidateId`, title/rationale, and authority references. The classifier consumes explicit evidence predicates instead of prose confidence:
- required by current frozen Scope;
- required by an admitted current Requirement;
- required by current frozen DoD;
- required by frozen Architecture/contract;
- required by an accepted/frozen Decision;
- valuable but non-blocking for the current governed target;
- explicitly scheduled/owned by a later module/version;
- conflicts with frozen Scope or an ownership boundary.

Deterministic precedence:
1. conflict with frozen Scope/ownership boundary -> `OUT_OF_SCOPE`;
2. any valid current blocking obligation -> `NECESSARY`;
3. explicit later ownership/scheduling -> `FUTURE`;
4. demonstrated non-blocking value -> `IMPORTANT`;
5. insufficient/contradictory evidence -> `UNRESOLVED` and fail closed.

`UNRESOLVED` is an evaluation state, not a fifth classification. It prevents a guess from becoming scope.

## Required invariants
- no LLM confidence, recency, file order, Git order or majority vote may determine classification;
- every `NECESSARY` result carries at least one authoritative source reference;
- `IMPORTANT` and `FUTURE` never become current scope merely because they are useful;
- `OUT_OF_SCOPE` never becomes admitted by a local boolean override;
- ambiguous authority remains unresolved until canonical repair/decision;
- output ordering and snapshot projections are deterministic;
- caller input is not mutated; returned projections are immutable;
- M12 never edits canonical documents as a side effect.

## Failure modes
- missing candidate identity -> invalid input;
- `NECESSARY` with no source binding -> unresolved/fail closed;
- simultaneous required and scope-conflict signals -> unresolved authority conflict rather than auto-admission;
- unsupported schema version -> invalid input;
- prototype-hostile/reserved identities -> rejected;
- contradictory evidence -> explicit diagnostic.

## Technology proposals assessed
### NECESSARY now
- typed discriminated unions for classification/result states;
- deterministic canonical projection for audit/digest input;
- immutable evidence/source references;
- machine-readable diagnostics.

### IMPORTANT, not auto-admitted
- JSON Schema 2020-12 export for cross-language validation;
- RFC 8785/JCS-compatible canonical projection for future content-addressed receipts;
- CEL or JSONLogic as a possible portable policy-expression layer once M16 owns policy execution.

### FUTURE / EXPERIMENTAL
- SMT/SAT constraint checking (for example Z3) to detect contradictory policy predicates;
- provenance DAG visualization for operator explanation;
- incremental classification cache keyed by canonical source fingerprints;
- WASM policy sandbox for portable execution.

These technologies are recorded as candidates only. No external dependency is introduced by this session.

## Acceptance
The implementation must prove deterministic classification, unresolved fail-closed behavior, source-bound NECESSARY results, classification/admission separation, immutable projections and zero authority leakage into M09/M10/M11/M17/M21/M24+ ownership.

No known HIGH/CRITICAL planning finding.

STOP CONDITION: `GBS_M12_S01_FROZEN`.
