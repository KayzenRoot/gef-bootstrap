# GBS-M11-S01 — Decision Ledger

Status: `FROZEN`
Module: `GBS-M11 Decision System`
Classification: `CORE_REQUIRED`
Authority domain: `DECISION`

## Objective
Define a deterministic, auditable representation of explicit project decisions. The ledger records decision authority but never manufactures a decision from recency, conversation order, filesystem order, popularity, model confidence or cache state.

## Canonical decision record
Required semantic fields:
- `schemaVersion`;
- stable `decisionId`;
- `domain` and stable `subjectKey`;
- `statement`;
- `status`;
- `rationale`;
- `owner` / decision authority reference;
- canonical `sourceRefs` / fingerprints;
- explicit ADR references when applicable;
- explicit supersession relations;
- optional consequences / affected contract references.

Statuses: `PROPOSED`, `FROZEN`, `SUPERSEDED`, `REJECTED`, `STALE`. Only a valid, conflict-free `FROZEN` record may be considered a current-decision candidate. `STALE` and conflicts fail closed.

## Decision Ledger Index
The **Decision Ledger Index (DLI)** is a disposable derived map keyed by `(domain, subjectKey)` and stable decision ID. It enables deterministic lookup, conflict grouping and lineage traversal. It is not canonical truth and must be rebuildable from the ledger.

## Decision Capsule
A **Decision Capsule (DC)** is a compact deterministic review/resume projection containing identity, subject, status, statement, rationale, source bindings, ADR links and supersession references. Display-only metadata and wall-clock ordering are excluded.

## Decision Identity Seal Input
A **Decision Identity Seal Input (DISI)** is canonical digest material for the decision’s semantically relevant fields. Cryptographic hashing/signing is injected by a stronger owner; M11 does not hard-code weak digest algorithms.

## Rules
1. IDs are globally unique inside one ledger.
2. `domain + subjectKey` defines the conflict/supersession subject, not filename or timestamp.
3. Missing authority/source bindings are typed gaps, never invented defaults.
4. Frozen records are semantically immutable; change creates a new decision and explicit supersession when appropriate.
5. Derived indexes/caches cannot override canonical source content.
6. M11 does not alter Scope, Requirements, Architecture, DoD or Checkpoint; it records decisions affecting them for those owners to consume through governed updates.

## Technology classification
| Mechanism | Class | Disposition |
|---|---|---|
| Decision Ledger Index | `NECESSARY` | Implement deterministic derived index. |
| Decision Capsule | `NECESSARY` | Implement compact immutable projection. |
| Decision Identity Seal Input | `NECESSARY` | Implement digest-ready canonical projection. |
| RFC 8785/JCS-compatible serialization | `IMPORTANT` | Keep serialization digest-ready without adding signing scope. |
| append-only transparency/Merkle log | `IMPORTANT` | Architecture-ready, but durable cryptographic audit log belongs later to M44/Integrity surfaces. |
| vector similarity for duplicate-decision suggestions | `EXPERIMENTAL_GATED` | Retrieval hint only; never decision authority. |

## Proof obligations
Strict validation; duplicate identity rejection; deterministic DLI/DC/DISI; source-binding preservation; immutable frozen projection; no ambient network/environment reads; no Scope/DoD/checkpoint mutation.

Open questions: `0`.

STOP CONDITION: `GBS_M11_S01_FROZEN`.