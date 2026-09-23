# GBS-V11-WO-008 — Performance Telemetry + Benchmark

Status: `ADMISSION_CANDIDATE`
Release line: `1.1.x`
Assurance: `STANDARD`
Implementation branch after admission: `feat/1.1/wo-008-performance-telemetry`

## OBJECTIVE

Implement V1.1 performance telemetry and comparable benchmark orchestration that measures executor cost and acceleration outcomes without manufacturing a speedup claim from incompatible populations, missing metrics, warm/cold mixing, or failed quality gates.

Reuse the benchmark/performance primitives already accepted in M41-M47, M55-M61 and M62-M63, bind measurements to the frozen V1.1 benchmark protocol, preserve WO-005/006/007 acceleration semantics, and emit deterministic repository-local benchmark records/reports for WO-009 and WO-010.

## CONTEXT

WO-005 introduced deterministic Execution Capsules, WO-006 fail-closed Incremental Validation, and WO-007 proof reuse with targeted invalidation. WO-008 measures those acceleration surfaces. Measurement is derived evidence, never canonical truth, and cannot weaken correctness, security, recovery, evidence integrity or final exact-head assurance.

## SCOPE

- P1-P8 population identity.
- M-LAT, M-CTX, M-VAL, M-RWK, M-OUT and M-TOK metric records.
- Explicit `MEASURED | ESTIMATED | UNAVAILABLE` source labels.
- Immutable baseline capture with retained lineage.
- Repeated-sample summary and dispersion.
- Comparable baseline/candidate comparison.
- Cold-vs-cold and warm-vs-warm evidence.
- CLI ROI comparison required by ADR-0003-D4.
- Quality-gate eligibility binding.
- Deterministic read-only benchmark report/handoff.
- Cross-platform TELEM assurance.

## OUT OF SCOPE

- WO-009 integrated security/regression/documentation/runbooks.
- WO-010 production acceptance, main promotion, tag or publication.
- universal performance thresholds not backed by evidence.
- speedup claims across incomparable populations.
- changes to WO-005/006/007 semantics.
- M24 evidence acceptance, M25 general proof, M27 assurance verdicts.
- filesystem/Git/network/provider/process mutation authority in the pure comparison engine.
- legacy ecosystem-specific adapters.

## FILES / SOURCES TO READ

1. `.engineering/CHECKPOINT.md` + `.engineering/CHECKPOINT.json`
2. `.engineering/DECISIONS-LEDGER.md`
3. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md`
4. `.engineering/decisions/ADR-0005-LEGACY-ECOSYSTEM-DETACHMENT.md`
5. `.engineering/releases/V1.1-SCOPE.md`
6. `.engineering/ARCHITECTURE.md`
7. `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md` sections 14-16
8. `.engineering/releases/V1.1-PERFORMANCE-BENCHMARK-PROTOCOL.md`
9. `.engineering/releases/V1.1-TEST-MATRIX.md` TELEM rows
10. `packages/m62-m63-final/src/index.mjs`
11. `packages/m55-m61-quality/src/index.mjs`
12. `packages/m41-m47-platform/src/index.mjs`
13. WO-005 Execution Capsule implementation/evidence
14. WO-006 Incremental Validation implementation/evidence
15. WO-007 Proof Reuse implementation/evidence
16. this Work Order + Context Lock

Repository code/tests at the exact admitted base outrank recollection.

## REQUIREMENTS

### R1 — Population identity
Represent all P1-P8 dimensions explicitly: workload kind, workload instance/digest, base state, toolchain, platform, assurance policy, cache/proof posture and measurement boundary. Any mismatch makes the comparison `INCOMPARABLE`.

### R2 — Metric truthfulness
Every metric carries `{value, unit, source}` with source `MEASURED`, `ESTIMATED` or `UNAVAILABLE`. Unavailable token counts remain `UNAVAILABLE` and are never silently promoted to measured totals.

### R3 — Baseline immutability and lineage
Baseline records are immutable derived state. Re-capture creates a new identity with explicit lineage; prior records remain retained.

### R4 — Repeated samples
Report count, median, p90, p95, min and max for valid repeated numeric samples. Never cherry-pick a best run.

### R5 — Honest comparison
Verdicts: `IMPROVED | NO_CHANGE | REGRESSION | INCOMPARABLE | INDETERMINATE`. Population mismatch => `INCOMPARABLE`. Missing required metric => `INDETERMINATE`. Quality failure forces `optimizationClaimEligible:false` and prevents `IMPROVED`.

### R6 — Existing primitive reuse
Reuse or mechanically compose `performanceRegression`, `executorBudget`, `compareBenchmark`, `benchmarkSummary` and `performanceGate` where semantics fit. The V1.1 layer may strengthen population identity/truth labels but must not create a contradictory benchmark authority.

### R7 — Acceleration bindings
Bind reports to exact Execution Capsule, Incremental Validation and Proof Reuse identities when those accelerators participate. Stale/mismatched bindings fail closed.

### R8 — Cold/warm separation
Cold and warm cache/proof postures are distinct populations. Demonstrate cold-vs-cold and warm-vs-warm. Never publish a cross-posture gain.

### R9 — CLI ROI
Emit at least one representative CLI-versus-documented-source/manual-path comparison under matched P1-P8 conditions. `INCOMPARABLE` or `INDETERMINATE` remain valid visible results.

### R10 — Read-only evidence
Telemetry, summaries and reports grant no checkpoint, merge, publication, assurance, evidence-acceptance or mutation authority.

## ARCHITECTURE RULES

- Derived benchmark state follows Architecture A4 and is not canonical truth.
- Final exact-head assurance remains non-suppressible.
- M63 remains executor-performance authority; M57/M55-M61 remain benchmark summary/regression authority where applicable.
- Deterministic core functions receive explicit inputs; clock/environment observation stays in bounded adapters/fixtures.
- No legacy ecosystem binding is reintroduced.

## CONSTRAINTS

- No mutation of `main` or `v1.0.0`.
- No merge/tag/publish/force-push/history rewrite/self-approval by the executor.
- No WO-009+ implementation.
- No speedup percentage from incomparable or cherry-picked populations.
- No quality regression hidden by latency/token improvement.
- No secret/prompt/response payload in telemetry artifacts.

## ACCEPTANCE CRITERIA

1. TELEM-01..06 have exact tests/evidence.
2. P1-P8 mismatch -> `INCOMPARABLE` before numeric delta publication.
3. Missing required metrics -> `INDETERMINATE`.
4. Token unavailability remains explicit.
5. Quality failure voids apparent gain and sets `optimizationClaimEligible:false`.
6. Baselines are immutable and re-capture retains lineage.
7. Repeated samples report dispersion and reject invalid/negative samples.
8. Cold-vs-cold and warm-vs-warm are demonstrated; cross-posture gains refused.
9. CLI ROI comparison is emitted honestly.
10. WO-005/006/007 bindings are exact; stale mismatch fails closed.
11. Output is deterministic under semantically unordered input permutations.
12. Benchmark artifacts expose no secret/prompt/response payload.
13. Windows/Linux/macOS TELEM suite passes.
14. Existing M57/M63 and WO-005/006/007 regressions remain green.
15. Repository validation, applicable typecheck/build and dependency audit pass.
16. Objective audit reports CRITICAL=0/HIGH=0.
17. `main`, `v1.0.0`, publication and production acceptance remain unchanged.

## TESTS

- `TELEM-01`: population mismatch -> `INCOMPARABLE`, no delta.
- `TELEM-02`: missing required metric -> `INDETERMINATE`.
- `TELEM-03`: token counts unavailable -> `UNAVAILABLE`.
- `TELEM-04`: quality-gate failure voids gain.
- `TELEM-05`: baseline immutability and lineage.
- `TELEM-06`: honest CLI ROI comparison.
- cold/warm cross-comparison refused.
- repeated-sample permutation determinism.
- invalid/negative sample rejection.
- stale acceleration-binding rejection.
- public-output redaction.
- read-only handoff authority boundary.

## DELIVERABLES

Prefer:
- `packages/m62-m63-final/src/v11-performance-telemetry.mjs` + minimal exports;
- focused TELEM tests;
- dedicated cross-platform TELEM workflow;
- repository-local benchmark fixtures/records under `.engineering/benchmarks/v1.1/` where useful;
- `.engineering/evidence/GBS-V11-WO-008-EVIDENCE.md`;
- exact-head Evidence Bundle with baseline/head SHAs, tests, workflows, audit, risks and proposed Checkpoint Delta.

## REVIEW FORMAT

Objective review in Brazilian Portuguese with exact head SHA, scope audit, TELEM-01..06 mapping, comparability/quality findings, cross-platform and regression evidence, CRITICAL/HIGH counts, production-boundary verification and one disposition: `APPROVED | CORRECTION_REQUIRED | BLOCKED`.

## STOP CONDITION

Stop after implementation, validation, evidence and PR update. Do not merge without objective audit.

STOP CONDITION: `GBS_V11_WO_008_READY_FOR_OBJECTIVE_AUDIT`
