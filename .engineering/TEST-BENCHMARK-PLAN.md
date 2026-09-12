# Test & Benchmark Plan

Status: `FROZEN`

## Binding
Derived from frozen Constitution v1.1, Project Overview, Requirements, complete-production Scope, Architecture and Security.

No functional implementation begins until the remaining ordered Source Pack stages permit construction.

## Objective
Define the evidence system that proves GEF Bootstrap is correct, safe, recoverable, portable and measurably efficient across semantic contracts, deterministic work plane, provider profile and brownfield/new-project modes.

Testing optimizes total safe engineering cost. Selective validation is allowed only when assurance is preserved and uncertainty is bounded.

# Frozen proof ladder
- `T0_STATIC` — formatting/schema/type/static contract checks.
- `T1_UNIT` — pure domain/kernel component behavior.
- `T2_FOCUSED_INTEGRATION` — directly impacted package/boundary integration.
- `T3_IMPACTED_SYSTEM` — dependency/contract-impacted suites.
- `T4_E2E_PROFILE` — new-project, brownfield, recovery and GitHub-profile workflows.
- `T5_SECURITY` — frozen Security T1–T12 threat-control evidence.
- `T6_PERFORMANCE` — token/time/search/files/tests/retries/review/latency benchmarks.
- `T7_RELEASE_MATRIX` — supported Node/OS/package/release acceptance matrix.

Higher-risk changes inherit lower applicable proof layers.

## Minimum mapping by security/change class
- `S0_READ_ONLY`: T0 always; T1/T2 when logic/contracts change.
- `S1_MANAGED_WRITE`: T0 + T1 + directly impacted T2; transaction/recovery path when mutation semantics change.
- `S2_REPOSITORY_CHANGE`: T0–T3 minimum plus local Git integration for affected behavior.
- `S3_PROVIDER_CHANGE`: T0–T4 minimum plus provider simulation/contract proof and live evidence when release claim depends on real provider behavior.
- `S4_ELEVATED_DESTRUCTIVE`: all applicable T0–T5 proof before implementation/promotion plus explicit authorization; production release requires applicable T6/T7 as well.

Security class is a floor, not a ceiling. Contract breadth, uncertainty or dependency impact may expand the proof set.

# Selective validation
Validation selection uses:

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

## Mandatory expansion triggers
Selective validation expands when any of these occur:
- source authority conflict or unresolved uncertainty;
- public schema/contract compatibility change;
- transaction/recovery/security policy change;
- dependency graph cannot bound impact confidently;
- provider or adapter protocol change with cross-boundary effects;
- release/upgrade/migration behavior changes;
- repeated unexplained failure or flake in selected suite;
- evidence/proof invalidation reaches outside the selected radius;
- production acceptance/release candidate.

## Full/broad validation triggers
Broad/full applicable validation is required for:
- production release candidate;
- supported Node LTS compatibility promotion;
- supported OS matrix change;
- major contract/schema migration;
- security boundary or S4 behavior change;
- transaction engine/recovery semantics with broad dependency impact;
- test-impact engine itself when its selection algorithm changes materially;
- any change whose impact cannot be bounded with sufficient evidence.

# Shadow Assurance
Aggressive test skipping/proof carry-forward is never authoritative on first introduction.

Promotion requires:
1. a representative change set spanning at least low, standard, elevated and one high-assurance/security-sensitive class where applicable;
2. selective plan and broader reference validation executed against equivalent exact heads;
3. zero missed blocker/HIGH/CRITICAL defect in the shadow sample;
4. no material contract/security/recovery failure hidden by the selective plan;
5. explicit measurement of tests/time/tokens saved versus assurance result;
6. invalidation rules and fallback-to-broader-validation behavior tested;
7. an auditable promotion record.

Any missed material defect automatically demotes the affected skipping/carry rule back to shadow mode until root cause and corrected evidence are established.

# Test ownership boundaries
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

# Core scenario families
## New project
- empty/minimal repository bootstrap;
- existing package/toolchain detection;
- governed Source Pack materialization;
- repeated/idempotent application;
- Git/GitHub governance with permission gaps.

## Brownfield
- JS/TS representative repository;
- Python representative repository;
- nontrivial mixed/legacy repository;
- dirty worktree/conflicting governed artifacts;
- preexisting architecture preserved;
- progressive adoption without historical rewrite;
- drift between descriptive and normative truth.

## Deterministic mutation/recovery
- plan only;
- successful stage/verify/promote;
- interruption at each transaction phase;
- recovery after partial failure;
- wrong target/pre-state rejection;
- symlink/path escape;
- concurrent/stale plan conflict;
- large/binary/unexpected-file behavior.

## Contracts/versioning
- valid positive fixtures;
- malformed/negative fixtures;
- compatible additive evolution;
- incompatible major versions;
- migrations plus rollback/failure;
- unknown assurance/security fields fail safely.

## Provider/adapters
- GitHub capability discovery;
- missing permission truthful gap;
- PR/check/issue/release receipt binding;
- compatible/incompatible adapter versions;
- crash/timeout/resource bound;
- capability ceiling and S4 denial.

# Deterministic vs live provider testing
Provider tests use two layers:

1. **Deterministic simulation/contract layer** — mandatory for routine CI and must cover request/response contracts, permission states, rate/error behavior, receipts and side-effect planning without live network dependence.
2. **Governed live integration layer** — required for production claims that depend on actual GitHub behavior and for release acceptance of the GitHub reference profile. Live tests use dedicated safe fixtures/repos/accounts/permissions where possible and never require destructive S4 behavior merely to prove connectivity.

A live-provider outage may mark evidence unavailable/blocked; simulation success cannot be misreported as equivalent live proof when live proof is required.

# Security evidence
Production security tests cover all frozen Security threat classes T1–T12, including wrong-target mutation, path/symlink escape, destructive-operation denial, secret/publication safety, process injection, supply chain, adapter isolation, provider least privilege, stale/tampered state, forged evidence/checkpoints, recovery artifact exposure and resource bounds.

No unresolved HIGH/CRITICAL product-security defect is allowed for the claimed production surface.

# Benchmark fixture set
At minimum, versioned representative fixtures cover:
1. `BENCH-JSTS-BOUNDED` — bounded change in a JS/TS project;
2. `BENCH-PY-BOUNDED` — bounded change in a Python project;
3. `BENCH-BROWNFIELD-COMPLEX` — nontrivial brownfield change with wider source/context/test surface;
4. `BENCH-RECOVERY` — mutation + interruption/recovery path;
5. `BENCH-CONTEXT-HEAVY` — context/search-heavy task to measure source routing and MSC behavior;
6. `BENCH-REVIEW-DELTA` — correction/review scenario measuring reread/proof carry savings.

Each fixture records version, repository snapshot/fingerprint, toolchain/runtime, task objective, acceptance criteria and expected assurance class.

## Comparison methodology
Where feasible, compare:
- reference/conventional workflow;
- GEF governed workflow;
- equivalent objective and acceptance criteria;
- same fixture/version and comparable tool/runtime conditions;
- assurance result and defect/regression outcome;
- total safe engineering cost.

Metrics include input/output tokens, duplicated/re-read context, searches, files opened, active execution time, validation time, provider/CI wait, retries/corrections, review reread, proof carry/invalidation, defects/regressions and evidence gaps.

Targets, estimates and measured results are stored distinctly. No universal percentage-saving claim is accepted without representative measured evidence.

# Performance sampling and regression
Performance benchmarks use repeated samples when timing/noise is material.

Baseline policy:
- deterministic micro/component benchmark: minimum 5 measured repetitions after warm-up where applicable;
- end-to-end benchmark: minimum 3 measured runs when practical, otherwise explicitly mark sample count/confidence limitation;
- report median plus spread indicator (min/max or percentile/IQR as appropriate);
- environment/tool/runtime/fixture changes invalidate direct comparison unless normalized/rebaselined.

Regression policy is multi-dimensional. A candidate fails performance promotion when it causes a statistically/operationally material regression in total safe engineering cost or a security/correctness regression, even if one metric improves.

Initial alert thresholds for repeatable deterministic metrics are **advisory 10%** and **blocking 20%** regression versus compatible baseline, unless the owning benchmark defines a tighter risk-based threshold. These percentages are regression guardrails, not promised product gains. Any correctness/security regression is blocking regardless of speed.

# Flake policy
A flaky test is a defect.

- unknown failure cannot become PASS through retries;
- at most one diagnostic retry is allowed automatically for a test already classified as environment-sensitive;
- retry result is reported separately from first-attempt result;
- quarantined tests require owner, reason, issue/record, expiration/review date and replacement release evidence when the test covers a release obligation;
- HIGH/CRITICAL security, transaction/recovery or migration proof cannot be waived solely because the test is flaky;
- repeated flake above the owning threshold blocks promotion of the affected proof until disposition.

# Coverage and contract-path expectations
No universal line-coverage percentage defines quality.

Critical components require meaningful path/branch evidence:
- transaction state machine: success, rejection, interruption and recovery terminal paths;
- security gates: allow/deny/error paths and bypass-negative tests;
- public machine contracts: positive, malformed, compatibility and unknown-version fixtures;
- migrations/upgrades: forward success, incompatibility detection and recovery/failure;
- proof/invalidation/test-impact logic: carry, invalidate, uncertainty-escalation and stale-proof rejection;
- provider/adapters: permission gap, timeout/error, incompatible version and receipt verification.

Coverage reports remain diagnostic evidence and may expose untested branches, but percentage alone cannot close a REQ/DoD obligation.

# Cross-platform release matrix
Production release evidence covers:
- Windows;
- Linux;
- macOS;
- every Node.js LTS line explicitly claimed supported by the Compatibility Matrix;
- package/library API and CLI entrypoints;
- installation/setup, upgrade/migration and recovery where platform-relevant.

Path case, separator, symlink/reparse point, permissions, line endings, process invocation and atomic-replace differences receive explicit scenarios.

Development CI may optimize the matrix for bounded changes, but `PRODUCTION_RELEASE_DONE` requires exact-head evidence for the complete claimed matrix or a documented unavailable environment that narrows the release claim before publication.

# CI topology
Fast deterministic checks run first. Impacted suites run in parallel where safe. Provider/security/performance/release matrices activate by change/risk/lifecycle gate. Obsolete runs may be canceled after a newer commit invalidates them. Release evidence must bind to the exact accepted head.

# Test data and fixture safety
Fixtures use synthetic/curated data by default. Real secrets, personal data and proprietary user repository content are prohibited unless explicitly sanitized, justified and approved. Security fixtures use fake tokens/credentials that cannot authorize real systems.

# Conditions for PRODUCTION_RELEASE_DONE
Testing/benchmark evidence is sufficient only when all are true:
1. all admitted requirements/DoD proof obligations map to current test/evidence sources;
2. T0–T4 applicable product suites PASS on exact release head;
3. all applicable Security T1–T12 evidence PASS with no unresolved HIGH/CRITICAL defect;
4. transaction/recovery and migration/upgrade critical paths PASS;
5. GitHub reference-profile simulation PASS and required live integration evidence is current;
6. complete claimed Windows/Linux/macOS + Node LTS release matrix PASS;
7. performance/engineering-cost benchmark baseline is reproducible and no blocking regression is open;
8. selective validation/proof carry rules used for release have passed Shadow Assurance promotion or are bypassed by broader release validation;
9. flaky/quarantined tests do not leave an admitted release obligation unproven;
10. evidence/receipts/checkpoints bind to the exact accepted release state;
11. any unavailable external proof truthfully narrows the release claim or blocks release rather than being silently ignored.

# Frozen Test & Benchmark decisions
1. T0–T7 ladder and security/change-class floors are frozen.
2. selective validation expands on uncertainty, broad contract/security/recovery impact and release gates.
3. Shadow Assurance requires zero missed blocker/HIGH/CRITICAL defect in representative promotion samples.
4. GitHub testing is deterministic simulation first plus governed live proof for real-provider release claims.
5. six representative benchmark fixture families form the initial complete baseline set.
6. repeated sampling + multi-dimensional regression policy is frozen; 10% advisory / 20% blocking are initial deterministic regression guardrails, not promised gains.
7. flaky tests are defects; unlimited retry cannot manufacture PASS.
8. critical state machines/contracts/security/recovery require meaningful path/branch evidence, not arbitrary line-coverage targets.
9. production release covers the complete claimed Windows/Linux/macOS + supported Node LTS matrix.
10. `PRODUCTION_RELEASE_DONE` requires exact-head current evidence satisfying all eleven release-evidence conditions above.

## Freeze audit
- frozen Constitution/Requirements/Scope/Architecture/Security compatibility: PASS
- selective testing with assurance escalation: PASS
- no full-suite-every-change requirement: PASS
- no assurance shortcut through test skipping: PASS
- Shadow Assurance promotion/demotion policy: PASS
- deterministic/live provider split: PASS
- representative benchmark set: PASS
- regression/noise methodology: PASS
- flake policy: PASS
- critical path/contract proof model: PASS
- cross-platform release matrix: PASS
- production acceptance evidence gate: PASS
- implementation remains NOT_STARTED: PASS
- open Test/Benchmark questions: 0

STOP CONDITION: `READY_FOR_TEST_BENCHMARK_REVIEW_AND_CHECKPOINT`.
