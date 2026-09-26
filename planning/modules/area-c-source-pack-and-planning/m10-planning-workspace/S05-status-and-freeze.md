# GBS-M10-S05 — Status and Freeze

Status: `FROZEN`
Module: `GBS-M10 Planning Workspace`
Classification: `CORE_REQUIRED`
Authority domain: `PLANNING`

## Objective
Freeze a truthful status model for planning artifacts and define deterministic freeze/readiness evaluation without manufacturing implementation, review, checkpoint or production-completion authority.

## Status vocabulary
Workspace/entity planning statuses:
- `PLANNED`
- `ACTIVE`
- `FROZEN`
- `REVIEWED`
- `PROMOTED`
- `BLOCKED`
- `STALE`
- `SUPERSEDED`

Module-level planning readiness may additionally report `PLANNED_READY_FOR_IMPLEMENTATION` only after every owned session is frozen/reviewable, dependency validation passes, no blocking source gap exists and the Module Gate is separately approved. M10 code can compute a readiness candidate but cannot grant implementation admission.

## Freeze conditions
A session freeze candidate requires:
1. stable ID/owner/ordinal;
2. objective and stop condition;
3. canonical inputs identified;
4. dependencies valid;
5. open blocking questions = 0;
6. technology proposals classified without silent scope expansion;
7. required decision/delegation routing recorded;
8. no `SOURCE_CONFLICT`, unresolved owner mismatch or invalid binding.

A module freeze candidate additionally requires all sessions frozen, a valid containment/dependency graph and no stale required session.

## Freeze Receipt Seed
A **Planning Freeze Receipt Seed (PFRS)** is a deterministic, digest-ready record containing workspace/module/session identity, semantic freeze projection, source bindings, dependency projection, readiness result and diagnostics. It is not final Evidence Engine proof and does not replace M24+.

## Status Monotonicity Guard
A **Status Monotonicity Guard (SMG)** rejects illegal optimistic transitions such as `PLANNED -> PROMOTED`, `STALE -> PROMOTED`, or representing `MODULE_DONE` from local planning state. Revalidation may legitimately move a previously frozen entity to `STALE` when inputs change.

## Technology candidates
- Planning Freeze Receipt Seed: `NECESSARY` supporting mechanism.
- Status Monotonicity Guard: `NECESSARY`.
- canonical JSON/JCS-compatible projection for future signing: `IMPORTANT`; implement stable serialization shape without adding signing scope.
- CRDT collaborative planning: `FUTURE`; no current multi-writer requirement justifies complexity.
- LLM-generated freeze verdict: `OUT_OF_SCOPE` as deterministic authority; semantic review may use ChatGPT but deterministic preconditions remain machine-checkable.

## Implementation gate summary
All five M10 sessions are now frozen. Implementation must remain pure/read-only, deterministic, bounded, startup-pure and independent from CLI/provider/network. It may expose planning models, validation, dependency graph, status transitions, freeze candidates and receipt seeds. It must not write canonical sources, promote checkpoints, decide Scope/DoD, create decisions or award production progress.

## Required evidence families
- strict model validation;
- stable ordering/canonical projection;
- area/module/session containment;
- dependency graph and cycle behavior;
- state transition legality;
- freeze preconditions and stale invalidation;
- no production-completion authority;
- bounded/cancellable traversal;
- startup/import purity;
- full regression tests.

Open questions: `0`.

STOP CONDITION: `GBS_M10_S05_FROZEN`.