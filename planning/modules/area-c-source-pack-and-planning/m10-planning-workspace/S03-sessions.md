# GBS-M10-S03 — Sessions

Status: `FROZEN`
Module: `GBS-M10 Planning Workspace`
Classification: `CORE_REQUIRED`
Authority domain: `PLANNING`

## Objective
Define the smallest governed planning unit used to freeze coherent decisions before implementation. Session records must be deterministic, self-contained enough for review, and validity-bound to their canonical inputs.

## Session record
Required planning fields:
- stable `sessionId` and owning `moduleId`;
- ordinal within module;
- title and objective;
- status;
- canonical input references/fingerprints;
- dependencies;
- decision/delegation summary;
- classified technology proposals;
- open-question count;
- stop condition;
- optional reviewed-head binding after audit.

## Session state machine
`PLANNED -> ACTIVE -> FROZEN -> REVIEWED -> PROMOTED`.

Additional terminal/exception states: `BLOCKED`, `STALE`, `SUPERSEDED`.

Transitions are validated, not guessed. `FROZEN` requires zero unresolved blocking questions and a stop condition. `REVIEWED` requires immutable review-subject identity. `PROMOTED` is a representation of an upstream governed promotion, not permission for M10 to mutate checkpoint authority.

## Session Capsule
A **Session Capsule (SC)** is a minimum deterministic projection used to resume/review one session without rereading the entire repository: ID, owner, objective, status, input fingerprints, dependency IDs, decisions/delegations and stop condition. The capsule is derived and disposable; canonical sources always win.

## Freeze Fingerprint
A **Freeze Fingerprint Input (FFI)** canonicalizes semantically relevant frozen-session fields for external digesting. Wall-clock time, host paths, display-only formatting and conversation text are excluded.

## Staleness
A session becomes `STALE` when a bound canonical source/dependency changes in a semantically relevant way. Narrow invalidation is preferred; unknown dependency coverage widens conservatively. M10 reports staleness and affected descendants but does not rewrite stronger canonical authority.

## Technology candidates
- Session Capsule: `NECESSARY`, implement deterministic projection.
- Freeze Fingerprint Input: `NECESSARY`, implement canonical digest input.
- RFC 6902 JSON Patch for review deltas: `IMPORTANT`, record as future transport/inspection optimization, not required to finish M10.
- semantic embeddings for session retrieval: `EXPERIMENTAL_GATED`, never authority, only retrieval candidate after utility/assurance gates.
- event-sourced session history: `FUTURE`, current Git history + canonical snapshots are sufficient.

## Proof obligations
State-transition table, illegal transition rejection, stable capsule under metadata/order noise, semantic-change fingerprint sensitivity, dependency-driven staleness, conservative unknown invalidation, startup purity and no checkpoint mutation.

Open questions: `0`.

STOP CONDITION: `GBS_M10_S03_FROZEN`.