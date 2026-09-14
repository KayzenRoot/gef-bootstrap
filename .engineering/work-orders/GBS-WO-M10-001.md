# GBS-WO-M10-001 — Implement Planning Workspace

Status: `ADMITTED`
Risk: `STANDARD`
Module: `GBS-M10`

## OBJECTIVE
Implement the frozen M10 Planning Workspace as a deterministic, startup-pure TypeScript package with exact planning structure, dependency, status and freeze semantics.

## CONTEXT
Canonical authority is domain-specific. Repository state describes what exists; Scope owns classification; Decisions/ADRs own decisions; Architecture owns dependency boundaries; DoD owns completion; planning owns only unpromoted workspace organization. M09 is complete and its source-pack authority is not duplicated here.

## SCOPE
- `packages/planning-workspace/**`;
- M10 tests and focused workflow;
- M10 planning/gate/evidence documents;
- minimal root build/typecheck integration;
- post-audit checkpoint delta only after objective evidence.

## OUT OF SCOPE
Repository mutation; provider/network access; CLI business logic; decision/ADR creation; Scope/DoD adjudication; checkpoint promotion mechanics; production progress computation; proof-graph/assurance verdicts; graph database; embeddings; CRDT; Codex execution.

## FILES / SOURCES TO READ
`.engineering/SOURCE-HIERARCHY.md`, `SCOPE.md`, `DEFINITION-OF-DONE.md`, `ARCHITECTURE.md`, `REQUIREMENTS.md`, `TEST-BENCHMARK-PLAN.md`, `CHECKPOINT.md/json`, `M10-MODULE-GATE.md`, all five M10 session files, `planning/MASTER-MODULE-INDEX.md`, and relevant public package patterns.

## REQUIREMENTS
1. versioned public model;
2. stable IDs + strict validation;
3. immutable output snapshots;
4. deterministic normalized ordering;
5. ATI/ABS projection;
6. MCF/DAE;
7. Session Capsule/FFI;
8. PDG topological ordering + cycles + budgets/cancellation;
9. DCS conservative widening;
10. CPP explanatory projection;
11. transition guard;
12. freeze candidate evaluation;
13. PFRS deterministic seed;
14. typed diagnostics;
15. startup purity and no ambient side effects.

## ARCHITECTURE RULES
TypeScript strict ESM, library/API first. No core-to-GitHub/CLI dependency. No semantic authority reconstructed from cache. Planning projections are derived/disposable. Digest material is exposed canonically; cryptographic digest implementation is injected/owned elsewhere.

## CONSTRAINTS
No new runtime dependency unless objectively required. No force-push/history rewrite. UNKNOWN never becomes ALLOW/DONE. Stable-ID sorting is permitted only as deterministic tie-break where semantics do not prescribe an ordinal.

## ACCEPTANCE CRITERIA
All frozen session obligations are represented by code/tests; invalid models fail closed; cycle/staleness/freeze behavior is truthful; M10 cannot emit production completion; import has no side effect; root build/typecheck/test passes; focused cross-platform workflow passes; exact PR head is audited with no HIGH/CRITICAL finding.

## TESTS
Unit/contract tests for model validation, containment, graph, transitions, freeze, projection determinism, malformed/prototype-hostile data, cancellation/budget and purity. Run full `npm test` / `npm run validate` in CI plus focused OS matrix.

## DELIVERABLES
Package, tests, CI workflow, Evidence Bundle, exact-head audit, checkpoint delta and merged PR.

## REVIEW FORMAT
Brazilian Portuguese final review: scope delta; base/head SHA; tests/checks; findings by severity; ownership-boundary audit; evidence validity; verdict.

## STOP CONDITION
`M10_MODULE_DONE` only after exact-head APPROVED audit, successful merge, promoted checkpoint and no known HIGH/CRITICAL defect.