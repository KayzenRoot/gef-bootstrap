# GBS-M13-S04 — Compatibility and Progressive Normalization

Status: `FROZEN_CANDIDATE`
Module: `GBS-M13 — GEF Adoption Engine`

## Purpose
Define how adopted projects remain compatible with existing repository conventions while GEF progressively introduces normalized semantic contracts. This session explicitly avoids turning M13 into the runtime/platform compatibility owner; M51 remains authoritative for exact tool/runtime compatibility.

## Compatibility dimensions
M13 evaluates adoption compatibility only across governance integration dimensions:
- canonical-source coexistence;
- naming/path coexistence;
- project-profile binding coexistence;
- legacy alias/projection coexistence;
- checkpoint/progression coexistence;
- decision/scope/DoD coexistence;
- CI/process coexistence as descriptive evidence;
- mutation-surface coexistence.

Runtime/tool/version support is referenced from M51 when available, not reinvented here.

## Progressive normalization model
Normalization is per semantic domain and uses states:
- `LEGACY_UNMAPPED`
- `LEGACY_MAPPED`
- `DUAL_BOUND`
- `GEF_CANONICAL_WITH_LEGACY_READ`
- `GEF_CANONICAL`
- `BLOCKED`

Transitions require exact mapping evidence and cannot be inferred from elapsed time.

`DUAL_BOUND` explicitly allows old and new representations to coexist while authority remains resolvable through domain rules.

## New GEF-native technology: Normalization Frontier (NF)
A deterministic boundary separating domains already governed by GEF from domains still legacy/unmapped.

The frontier is represented as a set of semantic domain bindings rather than a repository-wide version number. It allows the system to answer:
- what GEF may rely on now;
- what still requires legacy discovery;
- which next normalization step unlocks the most governed capability;
- what must not yet be rewritten.

## New GEF-native technology: Compatibility Bridge Contract (CBC)
A typed bridge between a legacy representation and a GEF semantic contract.

Fields:
- source semantic identity;
- target semantic class;
- mapping version;
- mapping direction (`READ_ONLY`, `BIDIRECTIONAL_PLANNED`, `MIGRATION_ONLY`);
- lossless/lossy declaration;
- conflict behavior;
- invalidation fingerprints;
- owner;
- review trigger.

`BIDIRECTIONAL_PLANNED` is descriptive only until an owning mutation module admits implementation.

## New GEF-native technology: Semantic Equivalence Probe (SEP)
A deterministic validator that tests whether two representations are equivalent for a declared semantic subset.

SEP does not use similarity scoring as authority. It evaluates explicit normalized fields/invariants and returns:
- `EQUIVALENT`
- `NON_EQUIVALENT`
- `INDETERMINATE`
- `UNSUPPORTED_MAPPING`

Indeterminate never promotes normalization.

## New GEF-native technology: Progressive Normalization Budget (PNB)
Each adoption increment receives a bounded normalization budget expressed in governed work units rather than wall-clock prediction.

The budget may cap:
- domains touched;
- files/semantic sources mapped;
- alias count;
- migrations proposed;
- unresolved drift introduced;
- dependency expansion.

When exceeded, the engine returns `NORMALIZATION_BUDGET_EXCEEDED` and requires a newly admitted increment rather than quietly widening scope.

## New GEF-native technology: Reversibility Index (RI)
A qualitative deterministic classification of a proposed normalization change:
- `REVERSIBLE_BY_DELETE`
- `REVERSIBLE_BY_ALIAS_RESTORE`
- `REVERSIBLE_BY_TRANSACTION_ROLLBACK`
- `REQUIRES_MIGRATION_ROLLBACK`
- `IRREVERSIBILITY_UNKNOWN`

RI is not a probability. Unknown irreversibility blocks automatic promotion for destructive steps.

## Coexistence rules
- legacy and GEF files may coexist indefinitely if authority is explicit;
- path conventions are not authority;
- aliases must carry exact fingerprints and admission reference;
- a GEF canonical source may be introduced without deleting a legacy descriptive source;
- duplicate normative sources in one domain require explicit supersession or conflict;
- normalization cannot silently change user-facing behavior;
- normalization cannot change production denominator/weights;
- deferred cleanup remains visible through LDQ.

## Compatibility anti-patterns forbidden
- “move everything to `.engineering`” as a universal migration strategy;
- replacing working CI solely for stylistic consistency;
- mass-renaming folders before capability value exists;
- inferring compatibility from package-lock presence;
- treating absence of errors as proof of semantic equivalence;
- auto-deleting legacy docs once a GEF file appears;
- scoring-based auto-resolution of authority conflict.

## Failure classes
- `COMPATIBILITY_BRIDGE_STALE`
- `SEMANTIC_EQUIVALENCE_FAILED`
- `SEMANTIC_EQUIVALENCE_INDETERMINATE`
- `NORMALIZATION_BUDGET_EXCEEDED`
- `IRREVERSIBILITY_UNKNOWN`
- `DUAL_BINDING_CONFLICT`
- `NORMALIZATION_FRONTIER_INVALID`
- `UNSUPPORTED_MAPPING_VERSION`

## Technology candidates intentionally deferred
- AST-assisted config migration: `IMPORTANT/FUTURE`, likely later adapter/tool-specific owner.
- tree-sitter structural mapping: `IMPORTANT/FUTURE` where deterministic parsing materially helps.
- declarative bidirectional lenses: `IMPORTANT/FUTURE` pending proof of value.
- graph database for compatibility mappings: `FUTURE`, no need in V1 core.
- embeddings for legacy matching: `FUTURE`, retrieval aid only and never authority.

## Required future tests
- dual-bound source coexistence;
- lossy mapping rejection without decision;
- stale bridge invalidation;
- equivalence pass/fail/indeterminate;
- normalization budget exhaustion;
- reversibility unknown blocking;
- no destructive cleanup side effect;
- exact deterministic frontier across host OS.

STOP CONDITION: `READY_FOR_GBS_M13_S05_ADOPTION_RECEIPT_AND_PROMOTION`.