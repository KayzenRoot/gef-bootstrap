# GBS-WO-M11-001 — Implement Decision System

Status: `ADMITTED`
Risk: `STANDARD`
Module: `GBS-M11`

## OBJECTIVE
Implement the frozen Decision System as a deterministic, read-only, startup-pure TypeScript library for decision ledgers, ADR integrity/linkage, supersession, conflicts and frozen-decision eligibility.

## CONTEXT
Source Hierarchy is domain-specific. The DECISION domain is explicit and cannot be reconstructed from recency or conversation. M10 is complete and owns planning only. M12 owns Scope/DoD; M17 checkpoint; M21 progress; M24+ final evidence/assurance; M37/M44 stronger integrity/audit surfaces.

## SCOPE
`packages/decision-system/**`; M11 tests/workflow; M11 planning/gate/evidence docs; minimal root workspace integration; post-audit checkpoint delta.

## OUT OF SCOPE
Repository writes, provider/network access, Markdown execution, automatic semantic decision invention, conflict winner selection, Scope/DoD mutation, checkpoint promotion, product progress, release signing, Merkle persistence, graph DB, embeddings, event sourcing, SAT/SMT policy solving, Codex execution.

## FILES/SOURCES TO READ
Source Hierarchy, Scope, DoD, Architecture, Requirements, Test/Benchmark Plan, Backlog, current Checkpoint, M11 frozen sessions, M11 Module Gate, Master Module Index and relevant package patterns.

## REQUIREMENTS
Strict versioned contracts; immutable validated snapshots; DLI/DC/DISI; ADR Integrity Envelope and bidirectional links; ADR Delta Lens; bounded DLG; explicit supersession closure; fail-closed effective resolution; conflicts/shadows/isolation; staleness; Frozen Snapshot Guard; Frozen Decision Receipt Seed; typed diagnostics; no implicit authority.

## ARCHITECTURE RULES
Strict TypeScript ESM, library/API first, deterministic and independently testable. No core→GitHub/CLI dependency. Derived indexes are disposable. Cryptographic material is digest-ready but hashing/signing is externally owned.

## CONSTRAINTS
No new runtime dependency unless objectively required. No newest-wins/timestamp/file-order/model-confidence tie-break. UNKNOWN/CONFLICT never becomes RESOLVED. Stable sorting only for deterministic representation, never authority.

## ACCEPTANCE CRITERIA
All frozen M11 obligations represented by code/tests; malformed/conflicting/unknown states fail closed; exact subject lineage is deterministic; M11 cannot mutate canonical authorities or claim MODULE_DONE; startup pure; focused cross-platform + full regression green; exact-head semantic audit no HIGH/CRITICAL.

## TESTS
Unit/contract tests for validation, projection determinism, ADR links/delta, supersession DAG/cycles, effective resolution, conflicts/shadows/isolation, incomplete coverage, freeze/staleness/immutability, traversal budgets/cancellation, prototype-hostile input and purity; full `npm test` regression.

## DELIVERABLES
Package, tests, CI workflow, Evidence Bundle, exact-head audit, merged PR, audited checkpoint promotion.

## REVIEW FORMAT
Português brasileiro: scope delta; base/head; checks; findings by severity; authority-boundary audit; evidence; verdict.

## STOP CONDITION
`M11_MODULE_DONE` only after exact-head APPROVED audit, successful merge, promoted checkpoint and zero known HIGH/CRITICAL.