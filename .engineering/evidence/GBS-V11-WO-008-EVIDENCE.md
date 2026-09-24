# GBS-V11-WO-008 — Evidence Bundle

Status: `IMPLEMENTED; OBJECTIVE AUDIT READINESS IS GATED BY EXACT PR CHECKS`
Release line: `1.1.x`
Assurance: `STANDARD`
Stop condition: `GBS_V11_WO_008_READY_FOR_OBJECTIVE_AUDIT`

## 1. Exact binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Work Order | `GBS-V11-WO-008 — Performance Telemetry + Benchmark` |
| Implementation branch | `feat/1.1/wo-008-performance-telemetry` |
| Exact admitted base | `33671ba9a3d4962cea4371f5610bda23e4889e11` |
| Implementation, test and benchmark source head | `cd2d2c6038260573a20b6d8135a76954decb8c80` |
| Source tree fingerprint | `195eaef31397f489d4c62662f825b0f4de15f82b` |
| Pull request | [#296 — WO-008 implementation](https://github.com/KayzenRoot/gef-bootstrap/pull/296) |
| PR target | `release/1.1` |
| Final evidence head | The evidence/report commit on PR #296; its exact SHA and checks are shown by the PR after this commit. No implementation source changes follow the source head above. |

The source head is the exact code measured in `benchmarks/v1.1/cli-roi-result.json`. The evidence commit adds that result and this bundle. It does not change implementation code. Its own Actions runs must pass before the stop condition is declared ready.

The evidence commit also adds one test that verifies the persisted ROI records and recomputes the report. That brings the final focused set to 107 tests; the implementation-head hosted runs below cover the prior 106, and the evidence-head CI run must cover the added artifact-verification test.

## 2. Scope and authority

Implemented the admitted telemetry layer within M62-M63. It uses the existing M41 `compareBenchmark`, M55-M61 `benchmarkSummary`/`performanceGate`, and M63 `performanceRegression` primitives. The new records and reports are derived, immutable, redacted, deterministic and read-only.

No changes were made to WO-005/006/007 behavior, checkpoint state, `main`, or `v1.0.0`. No merge, tag, publication, objective approval or production acceptance was performed. Additional ecosystem-specific bindings remain outside this Work Order under D-0061 and ADR-0005; implementing them requires a separately admitted decision and Work Order.

## 3. TELEM acceptance mapping

| Case | Evidence | Result |
|---|---|---|
| TELEM-01 | `tests/v11-wo-008-performance-telemetry.test.mjs` | Node, OS, cache posture and boundary mismatches return `INCOMPARABLE`; no delta is emitted. |
| TELEM-02 | Same | Missing required `M-VAL-01` returns `INDETERMINATE`. |
| TELEM-03 | Same; `benchmarks/v1.1/cli-roi-result.json` | `M-TOK-03` is `{value:null, source:"UNAVAILABLE"}`. No token total or token gain is inferred. |
| TELEM-04 | Same | Failed quality evidence prevents an optimization claim and cannot produce `IMPROVED`. |
| TELEM-05 | Same | Re-capture creates a new immutable baseline, retains its parent and preserves the prior record. |
| TELEM-06 | Same; benchmark recipe and captured report | CLI ROI emits improved/adverse/incomparable test outcomes; the measured representative result is `NO_CHANGE`. |

Additional cases cover cold/cold and warm/warm, refusal to compare cold with warm, repeated-sample permutation determinism, median/p90/p95/min/max, invalid/negative/non-finite samples, zero denominators, stale WO-005/006/007 bindings, public-output redaction and the non-suppressible final sweep.

## 4. Representative CLI ROI measurement

`benchmarks/v1.1/README.md` documents the source-workspace/manual route through the public `runCli` API. `cli-roi.mjs` compares that route with the real `gef init --target … --json` CLI process. Both use the same empty target fixture, population P1-P8, invocation boundary and seven fresh child-process samples, with alternating run order. The script verifies that both paths produce the same plan digest.

The quality gate was `PASS` for source head `cd2d2c6…` after its build, audit, cross-platform TELEM matrix, packed-install checks and existing regressions passed. The persisted report digest is `d7de0842b128ad36f671390267034e00a13383de32909fd2b408875c9894d546`.

| Metric | Source-workspace/manual | CLI | Interpretation |
|---|---:|---:|---|
| `M-LAT-01` median | 72.668 ms | 71.477 ms | `NO_CHANGE`; delta −1.64% |
| `M-LAT-01` p90 / p95 | 74.220 / 74.220 ms | 74.928 / 74.928 ms | Distributions overlap; no eligible optimization claim |
| `M-LAT-01` range | 62.524–78.062 ms | 67.457–81.212 ms | Seven measured samples per path |
| `M-TOK-03` | `UNAVAILABLE` | `UNAVAILABLE` | The runner does not receive ChatGPT Work token counts |

P1-P8 match exactly on the measured source head: greenfield init plan; fixed empty-target fixture; commit/tree; Node/npm/TypeScript; Linux version/architecture; STANDARD policy with final sweep required; cold with no proof reuse; process start through JSON envelope. `M41` classifies the latency comparison as `STABLE`. The report has `optimizationClaimEligible:false`. It measures the operator-entry boundary for one deterministic command; it does not claim end-to-end ChatGPT/Codex productivity, token savings, or WO-005/006/007 acceleration gains.

## 5. Local validation

| Command | Result |
|---|---|
| `npm ci` | PASS; 33 packages installed |
| `npm run build -- --force` | PASS |
| `npm run typecheck` | PASS |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| Focused telemetry, M41/M55/M62, WO-005/006/007 and packed-install suites | PASS; 107/107 tests |
| CLI/manual ROI smoke | PASS; both returned the same successful init plan digest |
| `npm run validate` in this executor | Typecheck passed. Root-owned machine Git is intentionally refused by the high-assurance trust policy in privilege-sensitive integration cases; hosted full repository regressions below pass on the implementation head. |

On evidence head `5b1ea4e…`, the M55 and M62 complete regression jobs each found one failure in `tests/v11-legacy-ecosystem-detachment.test.mjs`: the repository-wide source/documentation scan matched a reserved ecosystem name in this evidence prose. No implementation binding or telemetry test failed. The prose now uses the neutral phrase “Additional ecosystem-specific bindings.” Both that isolation test and all 14 telemetry tests pass locally, and the corrected evidence head `d91fadc0ceef245651dde0061e26af557280ce7e` passed all eight hosted workflows listed below.

The local full-suite limitation is environmental and was present at the admitted base. The accepted-base hosted Repository Validation run was [35895287991](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/35895287991).

## 6. Hosted assurance on the corrected evidence head

All listed runs were attached to exact evidence head `d91fadc0ceef245651dde0061e26af557280ce7e` and concluded successfully. The implementation source remains `cd2d2c6038260573a20b6d8135a76954decb8c80`; the intervening changes only record and correct evidence prose.

| Workflow | Run | Result | Elapsed from run start to completion |
|---|---:|---|---:|
| WO-008 Performance Telemetry | [36054702208](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36054702208) | Ubuntu, Windows, macOS PASS | 27 s |
| m01-validation | [36054702246](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36054702246) | PASS | 50 s |
| M41-M47 Integrated Assurance | [36054702400](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36054702400) | focused matrix + full regression PASS | 43 s |
| M48-M54 Integrated Assurance | [36054702223](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36054702223) | PASS | 60 s |
| M55-M61 Integrated Assurance | [36054702373](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36054702373) | focused matrix + full regression PASS | 58 s |
| M62-M63 Final Assurance | [36054702207](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36054702207) | focused matrix + full `npm test` regression PASS | 59 s |
| WO-004 Upgrade Recovery Assurance | [36054702322](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36054702322) | Windows, macOS, Ubuntu PASS | 101 s |
| WO-003 Windows Rights Oracle | [36054702220](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36054702220) | Windows package/install and audit PASS | 229 s |

The new TELEM matrix omits `npm ci` and TypeScript builds because its source-only ESM test has no third-party dependency. Existing workflows still own engine builds, audits, complete regressions and packaged-install proof. On the admitted base, 37 observed workflow runs had median duration 124 s, p90 212 s and maximum 304 s. On this PR, all eight workflows ran concurrently and the slowest completed in 3 min 49 s; no 15–20 minute run was observed. Existing broad `.engineering/**` path filters still fan documentation changes into several assurance workflows; changing those filters requires a separate governed CI review so coverage is not accidentally lost. The exact current PR-head check set remains the source of truth after this evidence-only update.

## 7. Distribution correction

Exporting telemetry from the M62 index exposed that the CLI package assembler copied only the engine index. The packed-install tests failed because the new support module was missing. `packages/cli/scripts/prepare-package.mjs` now stages `v11-performance-telemetry.mjs` beside the vendored M62 index and records its SHA-256 in `vendor/MANIFEST.json`. The WO-003 distribution test asserts file presence and manifest digest; Linux full regression and Windows packed-install workflows pass.

## 8. Audit and checkpoint delta

Objective audit has **not** been performed by the executor. `CRITICAL` and `HIGH` counts are therefore **not self-assessed**. The independent reviewer should audit the final PR #296 head, which is the source implementation head plus this evidence-only report, and record one disposition: `APPROVED`, `CORRECTION_REQUIRED` or `BLOCKED`.

No checkpoint delta is applied. After an external `APPROVED` audit and the separately authorized merge, the proposed delta is to append WO-008 under `v11.completedWorkOrders` with PR #296, exact audited head, objective review ID, severity counts, assurance run IDs and implementation merge SHA. V1 production state, `main`, and `v1.0.0` remain unchanged.

STOP CONDITION: `GBS_V11_WO_008_READY_FOR_OBJECTIVE_AUDIT` after the final evidence-head checks pass.
