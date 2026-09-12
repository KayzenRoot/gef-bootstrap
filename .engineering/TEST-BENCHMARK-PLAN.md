# Test & Benchmark Plan

Status: `IN_DISCUSSION`

## Binding
Derived from frozen Constitution v1.1, Project Overview, Requirements, complete-production Scope, Architecture and Security.

No functional implementation begins from this document until this plan is frozen and the remaining Source Pack stages permit construction.

## Objective
Define the evidence system that proves GEF Bootstrap is correct, safe, recoverable, portable and measurably efficient across its semantic contracts, deterministic work plane, provider profile and brownfield/new-project modes.

Testing must optimize total safe engineering cost. We do not run every test after every bounded change by default, but we also do not use selective testing as a shortcut around assurance.

## Planned proof layers
- `T0_STATIC` — formatting/schema/type/static contract checks.
- `T1_UNIT` — pure domain/kernel component behavior.
- `T2_FOCUSED_INTEGRATION` — directly impacted package/boundary integration.
- `T3_IMPACTED_SYSTEM` — dependency/contract-impacted suites.
- `T4_E2E_PROFILE` — new-project, brownfield, recovery and GitHub-profile workflows.
- `T5_SECURITY` — Security T1–T12 threat-control evidence.
- `T6_PERFORMANCE` — token/time/search/files/tests/retries/review/latency benchmarks.
- `T7_RELEASE_MATRIX` — supported Node/OS/package/release acceptance matrix.

Higher-risk operations require the applicable lower layers plus risk-specific evidence.

## Test ownership boundaries
1. contracts/schemas
2. provider-neutral core policy
3. deterministic kernel/transaction/recovery
4. local Git integration
5. GitHub reference provider
6. adapter protocol/isolation
7. evidence/assurance/proof graph/test impact
8. checkpoint/resume/continuity
9. observability/benchmark accounting
10. application API/CLI
11. new-project/brownfield E2E
12. security and performance cross-cutting suites

Tests must map evidence back to stable REQ/module/contract IDs. Package coverage alone is not completion proof.

## Selective validation model
Change validation will use:

```text
CHANGE
→ source/symbol impact
→ dependency impact
→ contract/schema impact
→ security class/risk
→ uncertainty
→ prior proof validity
→ SELECT MINIMUM SAFE TEST SET
```

Any unresolved uncertainty, source conflict, broad dependency impact, security-sensitive mutation or release acceptance expands the validation radius. Release acceptance uses the full required release matrix regardless of local selective-test savings.

## Shadow Assurance
Before any aggressive test skipping/proof carry-forward becomes authoritative, GEF must compare the proposed selective plan against broader/full validation over representative changes. A skipped-proof rule is promoted only when shadow evidence shows no unacceptable assurance loss.

## Core scenario families
### New project
- empty/minimal repo bootstrap;
- existing package/toolchain detection;
- governed Source Pack materialization;
- repeated/idempotent application;
- Git/GitHub governance with permission gaps.

### Brownfield
- JS/TS representative repo;
- Python representative repo;
- nontrivial mixed/legacy repo;
- dirty worktree/conflicting governed artifacts;
- preexisting architecture preserved;
- progressive adoption without historical rewrite;
- drift between descriptive and normative truth.

### Deterministic mutation/recovery
- plan only;
- successful stage/verify/promote;
- interruption at each transaction phase;
- recovery after partial failure;
- wrong target/pre-state rejection;
- symlink/path escape;
- concurrent/stale plan conflict;
- large/binary/unexpected file cases.

### Contracts/versioning
- valid fixtures;
- malformed contracts;
- compatible additive changes;
- incompatible major versions;
- migrations and rollback/failure;
- unknown assurance/security fields fail safely.

### Provider/adapters
- GitHub capability discovery;
- missing permission truthful gap;
- PR/check/issue/release receipt binding;
- adapter compatible/incompatible version;
- crash/timeout/resource bound;
- capability ceiling and S4 denial.

## Security evidence
Production security tests must cover the frozen T1–T12 threat model, including secret leakage/publication, path/symlink escape, destructive-operation denial, command injection, dependency/supply-chain gates, provider least privilege, adapter isolation, stale/tampered state/evidence, recovery exposure and bounded resource behavior.

No unresolved HIGH/CRITICAL product-security defect is allowed for the claimed production surface.

## Cross-platform release matrix
At production release the deterministic plane must be exercised on:
- Windows;
- Linux;
- macOS;
- supported Node.js LTS line(s) frozen by Compatibility Matrix.

Matrix optimization is allowed during development, but release evidence must cover the claimed support set. Path case, separator, symlink/reparse-point, permissions, line endings, process invocation and atomic-replace differences receive explicit fixtures/scenarios.

## Benchmark dimensions
The benchmark system measures the whole engineering path where observable:
- executor/planner input tokens;
- output/evidence tokens;
- duplicated/re-read context;
- searches/queries;
- files opened/read/changed;
- active execution time;
- validation time;
- provider/CI wait time;
- retries/correction rounds;
- review reread effort;
- proof carry/invalidation behavior;
- defect/regression escapes;
- evidence confidence and gaps.

Targets/estimates/measurements are stored distinctly. No universal percentage saving becomes a factual claim without representative measured evidence.

## Benchmark baselines
At least three representative baseline families are required:
1. bounded change in a JS/TS project;
2. bounded change in a Python project;
3. brownfield change with nontrivial source/context/test surface.

Where feasible each benchmark compares:
- conventional/full-context/full-validation workflow;
- GEF governed workflow;
- same or equivalent acceptance objective;
- assurance outcome/regressions;
- total measured engineering cost.

Benchmark fixtures must be versioned and repeatable enough for regression comparison. Changes to fixtures/toolchain/model/runtime are recorded rather than silently mixed with prior results.

## Performance regression policy
A performance/optimization feature cannot be promoted solely because one metric improves. Regression review considers total safe engineering cost including token, time, search, test, maintenance complexity and defect risk.

Experimental-gated technologies must satisfy their Scope Utility, Assurance, Validity/Stability and Engineering ROI gates against representative benchmark/shadow evidence.

## Flake and nondeterminism policy candidate
- deterministic suites should not rely on arbitrary sleeps;
- time/network/provider behavior uses controlled fixtures/fakes where possible;
- live provider tests are separated from deterministic simulation;
- a flaky test is tracked as a defect, not normalized by unlimited retry;
- bounded retry may diagnose known environmental instability but cannot convert unknown failure into PASS;
- benchmark noise requires repeated samples and reported dispersion when material.

## Coverage policy candidate
No universal line-coverage percentage alone defines quality. Coverage requirements are risk/contract based:
- critical transaction/security/contract state machines require branch/path coverage of meaningful terminal paths;
- public machine contracts require positive and negative fixtures;
- recovery and fail-closed paths require direct tests;
- coverage reports are evidence/supporting diagnostics, not DoD by themselves.

## Test data and fixtures candidate
Fixtures must avoid real secrets, personal data and proprietary user repository content unless explicitly sanitized and approved. Synthetic/curated repositories should represent pathological cases without creating sensitive test assets.

## CI topology candidate
Fast deterministic checks run first. Impacted suites then run in parallel where safe. Hosted-provider/security/performance/release matrices run according to assurance class and lifecycle gate. Obsolete runs may be canceled when a newer commit invalidates them, but exact-head release evidence is always required.

## Questions to close
1. Freeze the exact T0–T7 assurance/test ladder and minimum mapping by security class/change class.
2. Define default selective-test expansion and full-suite/release triggers.
3. Freeze Shadow Assurance promotion criteria for proof carry/test skipping.
4. Define deterministic-vs-live GitHub/provider test split.
5. Freeze representative benchmark fixture set and comparison methodology.
6. Define performance sample/repetition/noise/regression thresholds without inventing universal gains.
7. Freeze flake quarantine/retry policy.
8. Define coverage/contract-path expectations for critical modules.
9. Freeze supported release matrix evidence strategy for Windows/Linux/macOS + Node LTS.
10. Define the exact test/evidence conditions required before `PRODUCTION_RELEASE_DONE`.

## Current direction
GEF testing is evidence-driven, impact-selective during development, shadow-validated before aggressive skipping, and exhaustive for the applicable production release gate. Benchmarks measure total safe engineering cost rather than celebrating a single faster/token-cheaper substep.

STOP CONDITION: `TEST_BENCHMARK_DECISIONS_REQUIRED`.
