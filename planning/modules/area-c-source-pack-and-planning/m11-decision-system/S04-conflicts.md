# GBS-M11-S04 — Conflicts

Status: `FROZEN`
Module: `GBS-M11 Decision System`
Classification: `CORE_REQUIRED`
Authority domain: `DECISION`

## Objective
Define deterministic detection and reporting of contradictory current-decision candidates without allowing M11 to invent a semantic resolution.

## Conflict model
A conflict exists when the same `(domain, subjectKey)` has multiple eligible `FROZEN` decisions that are not ordered by valid supersession lineage, or when canonical decision/ADR relationships disagree in a way that prevents trusted resolution.

Conflict classes:
- `PARALLEL_FROZEN_LEAVES`;
- `SUBJECT_MISMATCH_SUPERSESSION`;
- `MISSING_SUPERSESSION_TARGET`;
- `ADR_LINK_MISMATCH`;
- `STALE_SOURCE_BINDING`;
- `UNKNOWN_LINEAGE_COVERAGE`;
- `DUPLICATE_SEMANTIC_IDENTITY`.

## Decision Conflict Set
A **Decision Conflict Set (DCS)** groups conflicting stable IDs, subject identity, conflict class and provenance diagnostics in deterministic order. It contains no proposed winner.

## Decision Shadow Set
A **Decision Shadow Set (DSS)** reports historical/superseded records that might look current to a naive consumer but are explicitly shadowed by valid lineage. This supports safe UI/API presentation and prevents accidental resurrection of old decisions.

## Conflict Isolation Boundary
A **Conflict Isolation Boundary (CIB)** computes which subjects are trustworthy despite unrelated conflicts elsewhere. Consumers may continue for unaffected subjects if their dependency coverage is explicit. Unknown dependency coverage widens conservatively instead of globally guessing safety.

## Resolution policy
M11 may diagnose a conflict and generate a structured `RESOLUTION_REQUIRED` payload. Resolution itself requires a new governed decision/ADR or repair of malformed canonical data. LLM ranking, majority voting, newest timestamp, Git recency and source-file order are prohibited as authoritative tie-breakers.

## Technology classification
- deterministic conflict sets: `NECESSARY`;
- Decision Shadow Set: `NECESSARY` to prevent historical resurrection;
- Conflict Isolation Boundary: `IMPORTANT`, implement pure subject-level isolation because it improves availability without weakening safety;
- semantic-text similarity: `EXPERIMENTAL_GATED`, suggestion-only duplicate/conflict discovery;
- SMT/SAT contradiction solver: `FUTURE`, useful only after formal policy language exists;
- human-in-the-loop conflict dashboard: `FUTURE`, UI belongs later.

## Proof obligations
Parallel leaves conflict; linear lineage does not; malformed/missing edges diagnose; ADR mismatch diagnose; no auto-winner; stable deterministic conflict ordering; isolated unrelated subject remains usable only with explicit coverage; unknown widens conservatively.

Open questions: `0`.

STOP CONDITION: `GBS_M11_S04_FROZEN`.