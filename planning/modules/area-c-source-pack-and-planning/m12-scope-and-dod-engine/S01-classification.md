# GBS-M12-S01 — Classification

Status: `FROZEN`
Module: `GBS-M12 Scope and DoD Engine`
Classification: `CORE_REQUIRED`
Authority domain: `SCOPE`

## Objective
Define strict, deterministic scope-item classification without allowing M12 to infer product inclusion from planning enthusiasm, implementation existence, recency, dependency presence or model confidence.

## Two distinct taxonomies
M12 freezes two intentionally separate vocabularies:

### Product-target classification
Owned by canonical Scope:
- `CORE_REQUIRED`
- `PRODUCT_INCLUDED`
- `EXPERIMENTAL_GATED`
- `OPTIONAL_ADAPTER`
- `OUT_OF_SCOPE`

This answers: **is the capability part of the frozen product target, and under what inclusion mode?**

### Work-admission classification
Used for proposed work/capabilities relative to the current target:
- `NECESSARY`
- `IMPORTANT`
- `FUTURE`
- `OUT_OF_SCOPE`

This answers: **may the proposed change enter the current increment/version automatically?** It never rewrites the product-target classification by itself.

Conflating these taxonomies is invalid because `CORE_REQUIRED` is a product-scope statement while `NECESSARY` is an admission decision for a concrete increment.

## Scope item record
A validated scope item contains:
- stable `scopeItemId`;
- `name` and semantic `subjectKey`;
- product-target classification;
- rationale;
- owner/authority reference;
- requirement/source references and optional fingerprints;
- explicit dependency/item references;
- optional experiment/adapter gate metadata where classification requires it.

Missing classification or owner is a typed gap. M12 never invents a default inclusion state.

## Scope Registry Index
The **Scope Registry Index (SRI)** is a rebuildable derived map keyed by stable item ID and subject. It accelerates exact lookup and drift comparison but is not canonical truth.

## Scope Capsule
A **Scope Capsule (SC)** is a compact deterministic projection containing item identity, product classification, rationale, authority/source bindings and dependencies. It supports review/resumption without importing unrelated repository context.

## Scope Identity Seal Input
A **Scope Identity Seal Input (SISI)** provides canonical digest material for semantic scope identity. Display formatting, timestamps, host paths and conversation text are excluded. Cryptographic hashing/signing remains externally owned.

## Transition policy
Classification changes are explicit semantic changes, not metadata edits. A transition must be represented and auditable. Examples:
- `EXPERIMENTAL_GATED -> PRODUCT_INCLUDED` requires satisfied approved gate evidence;
- `OPTIONAL_ADAPTER -> CORE_REQUIRED` is a target expansion and cannot occur silently;
- any included classification -> `OUT_OF_SCOPE` is a target contraction requiring governed review;
- existence of implementation never promotes an item into Scope.

## Technology classification
| Mechanism | Work class | Disposition |
|---|---|---|
| Scope Registry Index | `NECESSARY` | Implement deterministic disposable index. |
| Scope Capsule | `NECESSARY` | Implement immutable compact projection. |
| Scope Identity Seal Input | `NECESSARY` | Implement digest-ready projection. |
| Classification Transition Guard | `NECESSARY` | Reject ungoverned/invalid transitions. |
| JSON Schema 2020-12 interchange schema | `IMPORTANT` | Architecture-compatible; typed TS baseline sufficient now. |
| OPA/Rego or Cedar policy adapter | `IMPORTANT/FUTURE` | Potential external policy representation; no baseline dependency. |
| learned scope classification | `EXPERIMENTAL_GATED` | Suggestion-only; never authoritative classification. |

## Proof obligations
Strict validation; duplicate/prototype-hostile IDs rejected; product/work taxonomies cannot be substituted; deterministic SRI/SC/SISI; invalid transition diagnostics; no implicit inclusion; no repository/network mutation; no DoD/progress/checkpoint authority.

Open questions: `0`.

STOP CONDITION: `GBS_M12_S01_FROZEN`.