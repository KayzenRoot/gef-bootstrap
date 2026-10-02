# GBS-V12-WO-000 V1.1.2 Baseline

**Outcome:** `BASELINE_CAPTURED_NO_V12_COMPARISON`\
**Quality gate:** `PASS`\
**Source commit:** `203dc6a86de035b8502453100ea6e2a4788cae57`\
**Source tree:** `6b66139b7df03c0041a0c785057afb29d9a47428`\
**Package:** `@gef-bootstrap/cli@1.1.2`\

This is a reproducible capture of the accepted V1.1.2 baseline before V1.2 implementation. It assigns no V1.2 completion or performance-improvement claim.

## Source and execution environment

The freshness gate passed: fetched `origin/main` equaled the pinned source SHA, the commit tree matched the brief, and the root package version was `1.1.2`. Measurements ran in an isolated full detached clone at that exact commit. The PR branch was used only to receive these two evidence receipts.

| Attribute | Observed value |
|---|---|
| OS | Windows 11 Pro, release `10.0.26300`, build `26300` |
| Architecture | `x64` |
| Node.js | `v24.19.0` |
| npm | `11.17.0` |
| TypeScript | `6.0.3` |
| Dependency install | `npm ci --ignore-scripts` — PASS; 33 packages added, 62 audited |

## Quality gate

| Command | Result | Measurement |
|---|---|---|
| `npm run build -- --force` | PASS | 18,365 ms wall time |
| `npm run typecheck` | PASS | 813 ms wall time |
| `npm run validate` | PASS | 1,632 passed, 0 failed; 297,837.5615 ms Node duration; 299,776 ms wall time |
| `npm audit --audit-level=high` | PASS | 0 vulnerabilities; 1,926 ms wall time |
| `git diff --check` | PASS | 69 ms wall time |
| `git status --porcelain` | PASS | Empty after all commands and measurements; no tracked source mutation |

## Focused capability baseline

The six required existing test files passed **84/84** tests (`5,705.92 ms` test-runner duration; `5,819 ms` wall time):

- WO-002 CLI end-to-end behavior;
- WO-005 execution capsule;
- WO-006 incremental validation;
- WO-007 proof reuse;
- WO-008 performance telemetry;
- WO-012 adoption preflight.

| Dimension | V1.1.2 baseline evidence | Current finding |
|---|---|---|
| B1 — Greenfield bootstrap | WO-002 CLI E2E and matched `GREENFIELD_INIT_PLAN` benchmark | CLI and source-workspace manual paths returned a ready plan with equal plan digests in all seven matched repetitions. |
| B2 — Brownfield adoption | WO-002 CLI E2E and WO-012 adoption preflight tests | Safe adoption paths are covered. **Timing: `NOT_YET_BASELINED`**; no existing repeatable brownfield timing harness was found. |
| B3 — Execution-pack / Marathon precursor | WO-005 capsule tests; M14/M15 handoff and sealed-pack public semantics; M63 telemetry primitive | Deterministic capsule identity, handoff/receipt binding and final-sweep protections are covered. This records capability presence only, not V1.2 completion. |
| B4 — Incremental validation / proof reuse | WO-006 and WO-007 tests; M25–M28 selector surfaces | Narrow selection requires proven mappings; unknown or unproven conditions widen/fail closed. Reuse requires current compatible receipts, cannot manufacture production credit, and cannot suppress the final exact-head sweep. |
| B5 — Performance telemetry | WO-008 tests and the existing immutable CLI ROI benchmark | P1–P8 population identity, quality-gate invalidation, incomparability, deterministic samples, and unavailable-token semantics pass. |
| B6 — Adoption compatibility safety | WO-012 adoption preflight tests | Unknown generated-file classification and ambiguous impact contracts fail closed before mutation; a valid contract permits adoption; no local contract preserves normal adoption. No consumer repository was modified. |

## Existing matched CLI ROI benchmark

The unmodified `.engineering/benchmarks/v1.1/cli-roi.mjs` ran with its quality-gate input set to `PASS` and exited successfully. The benchmark compared only identical P1–P8 populations, alternated invocation order, and preserved all seven repetitions per mode.

- Population identity: `c74bfff6a7a6ccf2efc13709c269e44cacb5d515276a92e49cc913cc30d68a03`
- Workload: greenfield `gef init --plan`, empty-target fixture
- Modes: `SOURCE_WORKSPACE_MANUAL` and `CLI`
- Timing region: process start to JSON envelope output
- Quality-gate digest: `6ba6d8677c6ddb5df29607ac019eeb526954399569488797f4740b93866734f0`

| Repetition | Source-workspace manual (ms) | CLI (ms) |
|---:|---:|---:|
| 1 | 140.03289999999998 | 147.38770000000002 |
| 2 | 137.47119999999995 | 135.43409999999994 |
| 3 | 155.99289999999996 | 141.34029999999996 |
| 4 | 157.6839 | 155.18979999999988 |
| 5 | 188.23519999999985 | 156.12549999999987 |
| 6 | 168.82760000000007 | 154.01119999999992 |
| 7 | 161.0695999999998 | 161.4086000000002 |

| Mode | Median | P90 | P95 | Min | Max |
|---|---:|---:|---:|---:|---:|
| Source-workspace manual | 157.6839 ms | 168.82760000000007 ms | 168.82760000000007 ms | 137.47119999999995 ms | 188.23519999999985 ms |
| CLI | 154.01119999999992 ms | 156.12549999999987 ms | 156.12549999999987 ms | 135.43409999999994 ms | 161.4086000000002 ms |

The benchmark report verdict is `NO_CHANGE` (`COMPARABLE`), with `optimizationClaimEligible=false`. Token counts are `UNAVAILABLE`. The emitted M41 primitive state is recorded as returned (`IMPROVED`), but it does not change the aggregate CLI ROI verdict and is not a V1.2 claim.

## Limitations and execution note

- Brownfield adoption time remains `NOT_YET_BASELINED`.
- Token counts remain `UNAVAILABLE`.
- This is a single Windows environment; no cross-platform latency comparison was performed.
- No V1.2 candidate exists, so V1.2 comparison is `NOT_PERFORMED`.
- An initial linked-worktree attempt was excluded: two existing WO-003 tests read `.git/index` directly, which is unavailable at that path when `.git` is a linked-worktree pointer. The final runs used a full detached clone of the same pinned commit, with `core.autocrlf=false`; the tracked status was empty after all checks.
- The existing benchmark exited successfully and emitted Node `DEP0190` during its npm-version probe on Windows; the benchmark output and all samples were accepted.

No runtime, product, tests, workflows, package manifests, checkpoint, or Source Pack were changed by this execution.
