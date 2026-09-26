# GBS-M11-S03 — Supersession

Status: `FROZEN`
Module: `GBS-M11 Decision System`
Classification: `CORE_REQUIRED`
Authority domain: `DECISION`

## Objective
Define explicit replacement semantics for decisions and ADRs so historical truth is preserved and effective-current resolution never degrades into newest-wins behavior.

## Supersession semantics
A supersession edge is explicit and directional: `newDecisionId -> supersededDecisionId`. Valid supersession requires compatible decision subject `(domain, subjectKey)` unless a separately governed cross-subject migration relation is explicitly represented. Chronology alone is non-authoritative.

A superseded decision remains historically addressable and its semantic snapshot remains immutable. Effective resolution follows explicit lineage only.

## Decision Lineage Graph
The **Decision Lineage Graph (DLG)** is a deterministic DAG over decision IDs using explicit supersession edges. It provides:
- cycle detection;
- roots/leaves;
- ancestor/descendant lineage;
- current-leaf candidates per subject;
- orphan/asymmetric edge diagnostics;
- bounded traversal and cancellation.

## Supersession Closure
A **Supersession Closure (SC)** computes the known transitive set replaced by a candidate decision. It is derived and disposable. Incomplete edge coverage returns `UNKNOWN_COVERAGE` rather than claiming an exact closure.

## Effective Decision Resolver
The **Effective Decision Resolver (EDR)** returns one of:
- `RESOLVED` with exactly one eligible frozen leaf;
- `NONE` when no eligible decision exists;
- `CONFLICT` when multiple incomparable frozen leaves exist;
- `STALE` when the only candidate is stale;
- `UNKNOWN` when lineage/coverage is insufficient.

The resolver never resolves by date, ID lexicography, commit order, model choice or confidence score.

## Decision Migration Bridge
A **Decision Migration Bridge (DMB)** is an `IMPORTANT` future-compatible relation for a deliberate subject-key/domain migration. Baseline M11 does not admit cross-subject supersession implicitly; a bridge must be supplied by governed upstream decision data.

## Technology classification
| Mechanism | Class | Disposition |
|---|---|---|
| Decision Lineage Graph | `NECESSARY` | Implement deterministic bounded DAG. |
| Supersession Closure | `NECESSARY` | Implement exact/unknown-coverage result. |
| Effective Decision Resolver | `NECESSARY` | Implement fail-closed resolution states. |
| Decision Migration Bridge | `IMPORTANT` | Contract-ready relation; automatic migration is not admitted. |
| event sourcing | `FUTURE` | Git + immutable decision snapshots are sufficient baseline. |
| temporal database | `FUTURE` | No baseline need; time is metadata, not authority. |

## Proof obligations
Cycle rejection; subject compatibility; exact explicit lineage; multiple-leaf conflict; no recency fallback; bounded/cancellable traversal; incomplete-coverage fail closed; historical record retention.

Open questions: `0`.

STOP CONDITION: `GBS_M11_S03_FROZEN`.