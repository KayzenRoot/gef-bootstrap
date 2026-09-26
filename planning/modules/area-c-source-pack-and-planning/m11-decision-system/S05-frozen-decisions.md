# GBS-M11-S05 — Frozen Decisions

Status: `FROZEN`
Module: `GBS-M11 Decision System`
Classification: `CORE_REQUIRED`
Authority domain: `DECISION`

## Objective
Define when decision data is structurally eligible to be treated as frozen/current and how source changes invalidate that eligibility without granting M11 checkpoint, assurance or product-completion authority.

## Freeze candidate conditions
A decision may produce `FREEZE_READY_CANDIDATE` only when:
1. stable identity, domain and subject are valid;
2. statement/rationale/authority reference are present;
3. required canonical source bindings are present and not known stale;
4. ADR links are consistent when declared;
5. supersession graph is valid and acyclic;
6. no unresolved conflict affects the subject;
7. no unknown lineage coverage blocks current resolution;
8. status transition into `FROZEN` is legal.

M11 evaluates eligibility; the canonical repository/governance workflow owns actual durable publication.

## Frozen Decision Receipt Seed
A **Frozen Decision Receipt Seed (FDRS)** is deterministic digest-ready evidence containing decision capsule, lineage projection, conflict result, source bindings, ADR integrity status and freeze-candidate diagnostics. It explicitly declares `DECISION_ELIGIBILITY_ONLY` and is not M24 Evidence Engine proof or M17 checkpoint promotion.

## Decision Staleness Vector
A **Decision Staleness Vector (DSV)** identifies which source/ADR/ancestor bindings changed and which decision subjects must be re-evaluated. Narrow invalidation is preferred when dependency coverage is explicit; otherwise M11 returns conservative widening.

## Frozen Snapshot Guard
A **Frozen Snapshot Guard (FSG)** ensures a frozen decision snapshot is immutable within one validated ledger. Editing semantic content in place while preserving the same frozen ID is invalid; replacement requires a new stable ID plus explicit supersession when appropriate.

## Promotion boundary
`FROZEN` is a decision semantic status, not `MODULE_DONE`, implementation completion, deployment approval or checkpoint promotion. Consumers must still obey Source Hierarchy and their own domain authorities.

## Technology classification
- Frozen Decision Receipt Seed: `NECESSARY`;
- Decision Staleness Vector: `NECESSARY`;
- Frozen Snapshot Guard: `NECESSARY`;
- content-addressed immutable decision snapshot store: `IMPORTANT`, interface-compatible but persistence deferred;
- transparency log/Merkle proof: `IMPORTANT/FUTURE`, M44/M37 stronger owners;
- cryptographic signing/Sigstore: `FUTURE`, no baseline key lifecycle is approved;
- LLM freeze authority: `OUT_OF_SCOPE`; semantic assistance cannot replace deterministic gates/governed decision authority.

## Module implementation summary
All five M11 sessions are frozen. Baseline implementation is a startup-pure, read-only TypeScript library with strict decision/ADR validation, deterministic lineage/conflict resolution and freeze eligibility. It must not mutate canonical documents, infer missing decisions, choose conflict winners, change Scope/DoD, promote checkpoints or compute product progress.

## Required evidence
Validation, DLI/DC/DISI, ADR envelope/link consistency, DAG/supersession closure, fail-closed effective resolution, conflict/shadow/isolation behavior, staleness, frozen immutability, bounded traversal/cancellation, malformed/prototype-hostile input, import purity and full regression.

Open questions: `0`.

STOP CONDITION: `GBS_M11_S05_FROZEN`.