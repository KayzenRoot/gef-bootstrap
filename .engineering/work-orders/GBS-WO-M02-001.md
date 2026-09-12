# GBS-WO-M02-001 — Implement Configuration & Schema Foundation

Status: `ADMITTED`

## OBJECTIVE
Implement the production foundation of `GBS-M02 — Configuration & Schema` from frozen S01-S05 contracts, integrating with the completed M01 kernel while preserving all M03+ ownership boundaries.

## CONTEXT / SOURCE BINDING
Base source is `main` after M02-S05 merge `97160b7fa8a3c5246f18a3e3e25086f4a02406f7` plus this module-gate admission PR once merged.

Read and obey: frozen Architecture, Security, Test & Benchmark Plan, DoD, Deployment, Source Hierarchy, Backlog Baseline, Planning Protocol, M01 module/evidence contracts, M02 S01-S05 and `.engineering/M02-MODULE-GATE.md`.

## SCOPE
Implement only M02-owned capability:
- global/project config discovery and loading;
- precedence/provenance resolution;
- global and project JSON Schema 2020-12 contracts and deterministic validator registry;
- structured validation diagnostics;
- defaults catalogue/resolution and independent fingerprint;
- config compatibility classification;
- migration graph planning/preview/apply orchestration contracts, with filesystem mutation delegated through existing/future ports rather than implementing M05/M06 internals;
- exact-state/fingerprint checks and compact migration/config receipts required by M02 contracts;
- focused test fixtures and CI evidence.

## OUT OF SCOPE
Do not implement M03 project identity semantics, M04 discovery engine, M05/M06 transactional/filesystem engines, generic evidence/proof graph, Git engine, provider-specific GitHub behavior, telemetry storage, full upgrade engine, release governance or generic operator UX.

## ARCHITECTURE RULES
1. Library-first TypeScript/Node LTS, thin interfaces.
2. No alternate command router/lifecycle/error model. Reuse M01 contracts.
3. Canonical persisted config is JSON only.
4. Remote `$ref` resolution prohibited.
5. No secrets stored in configuration.
6. No generic environment-variable shadow layer.
7. Defaults are deterministic and environment-independent.
8. Explicit values preserve provenance/intent.
9. Persisted migrations never auto-apply.
10. Security/assurance floors cannot be downgraded by config/defaults/migrations.

## ACCEPTANCE CRITERIA
1. Missing global config is valid and does not trigger broad search.
2. Platform-aware known-path resolver is abstracted/testable.
3. `.gef/project.json` formal adoption/config behavior works without blanket ignoring `.gef/`.
4. `.gef/private/` operational boundary is explicit and not treated as canonical project config.
5. Precedence is exactly `PRODUCT_DEFAULTS < GLOBAL_CONFIG < PROJECT_CONFIG < EXPLICIT_INVOCATION_OVERRIDE` with provenance retained.
6. Global/project documents validate against canonical JSON Schema 2020-12 schemas with stable URNs.
7. Core unknown fields fail closed; admitted unknown extensions remain inert.
8. Validation diagnostics are stable, bounded, redaction-safe and projected through M01 typed errors.
9. Schema registry rejects duplicate/ambiguous IDs and performs no remote fetch.
10. Default catalogue is mechanically aligned to owned fields and supports `NO_DEFAULT`.
11. Explicit values equal to defaults remain explicit in provenance/normalization.
12. Defaults never derive directly from machine/environment observations.
13. Schema/default/migration-graph fingerprints are deterministic and independently invalidatable.
14. Compatibility classifications include NATIVE, MIGRATABLE, READ_ONLY_COMPATIBLE, TOO_NEW, TOO_OLD_UNSUPPORTED and INVALID_OR_AMBIGUOUS.
15. Migration path selection is deterministic; cycles/ambiguity fail closed.
16. Migration preview is mutation-free and binds to exact source fingerprints.
17. Persisted migration apply requires explicit action and target validation.
18. Migration preserves explicit intent, supports idempotency and refuses implicit destructive downgrade.
19. ELEVATED/HIGH_ASSURANCE default-behavior changes require acknowledgement before governed use.
20. Brownfield adoption does not persist redundant defaults or reinterpret unrelated config files.
21. Strict typecheck passes.
22. Focused unit/integration/security tests pass with no skipped critical acceptance path.
23. Hosted exact-head CI evidence exists and no HIGH/CRITICAL semantic finding remains.

## TESTS
At minimum cover: precedence/provenance, known-path behavior, missing global file, project adoption marker, schema positive/negative fixtures, unknown keys/extensions, redaction, local `$ref`, duplicate registry IDs, bounded pathological input, defaults/NO_DEFAULT, explicit-value preservation, deterministic fingerprints, version classification, migration graph/cycle detection, preview no-mutation, stale fingerprint block, explicit apply, idempotency, downgrade unsupported, acknowledgement gate and brownfield neutrality.

## DELIVERABLES
- production code in appropriate modular packages/workspaces;
- canonical schemas/fixtures;
- tests;
- CI-compatible validation;
- machine/human evidence bundle;
- implementation PR;
- final M02 module gate update and checkpoint only after exact-head approval.

## REVIEW FORMAT
Report exact base/head, changed files, tests/typecheck/CI, failures fixed, acceptance mapping, risks, evidence refs and HEDS verdict. Verdict must be `APPROVED`, `CORRECTION REQUIRED` or `BLOCKED`.

## STOP CONDITION
`M02_IMPLEMENTATION_EXACT_HEAD_EVIDENCE_REQUIRED`.
