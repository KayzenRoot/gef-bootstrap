# M62 S01 — Requirements Audit
Status: `FROZEN`

## Objective
Prove release requirements are satisfied by accepted evidence, never by activity, intent, or self-assertion.

## RAG62 — Requirement Acceptance Graph
Each release-blocking requirement maps to canonical source, owning module, accepted evidence, exact reviewed head and current validity. States: `SATISFIED | UNSATISFIED | CONFLICT | UNKNOWN | STALE`.

## Rules
- Missing, stale, conflicting or non-exact evidence cannot become SATISFIED.
- Optional adapters do not silently become release blockers.
- Requirement closure cannot rewrite owner checkpoints or historical evidence.
- Acceptance is deterministic and produces a gap list.

## Acceptance
100% release-blocking requirements have current evidence bindings; no UNKNOWN/CONFLICT/UNSATISFIED remains for final release.