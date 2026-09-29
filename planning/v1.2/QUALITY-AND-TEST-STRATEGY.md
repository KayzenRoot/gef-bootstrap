# V1.2 defect prevention, testing and release assurance design

Status: PROPOSED research. Existing frozen Security/Test/Benchmark plans and DoD have authority until V1.2 future approval. Do not weaken inherited T0–T7, shadow assurance or HIGH_ASSURANCE obligations.

## Objective and governing measure
Reduce escaped material defects and rework while maximizing comparable accepted product work per wall-clock Codex hour. The target is not raw test count, coverage percentage or minimum number of PRs. Quantify failure-detection sensitivity (including a blinded seeded-defect corpus), false positives, CPU/CI minutes, real fix time and field regressions. Never promise zero bugs.

## Shift defect prevention earlier
- Contract-first acceptance: bind admitted requirement and architecture invariant to named positive, negative and edge-case tests before Codex coding. Reuse existing contract and proof map.
- Preflight: fixed runtime/lockfile/config, source fingerprints, test discovery, no outstanding untriaged mandatory alerts. Typecheck/package builds must be authentic.
- Design threat review: input validation, privilege/auth, injection, unsafe serialization, concurrency, IO failure, partial writes, crash recovery, idempotency and schema evolution.
- Static AST fitness rules: allowed imports, dependency direction, secret handling, unsafe shell usage and forbidden runtime/adapters. Verified tests for rules prevent false positives and unsafe autofixes.
- Whole app: unit tests don't replace integration, consumer-provider contract, E2E accessibility, security or deployment smoke when applicable.

## Progressive assurance ladder
P0 BASELINE/CONTEXT: source/decision/config/lockfile/toolchain/runtime/CI identity check, known risks, required current-green existing baseline.
P1 FAST STATIC: changed-file formatting/lint, schema checks, typecheck/build for impacted packages, AST rules and workflow security when workflows change.
P2 FOCUSED BEHAVIOR: directly changed unit/property tests; retain seed and minimized counterexample on failure; tests adjacent to changed contracts.
P3 IMPACT CLOSURE: existing M28 dependency/contract call graph selects dependent package/integration tests; unknown edges enlarge scope.
P4 BOUNDARY ASSURANCE: database transaction/migration rollback, API consumer compatibility, browser user journey, cross-platform filesystem and concurrency as change warrants.
P5 ADVERSARIAL: code and dependency security, explicit abuse and negative path tests, selective mutation of critical changed branches, deterministic fault-injection.
P6 BROAD REFERENCE: shadow selective-vs-broad experiments for safe sample; security policy / contract / test impact / unknown changes and production release require applicable broad/full exact-head validation.
P7 ACCEPTANCE: CodeQL/security results, performance and threat obligations, final exact-head receipts and independent reviewer where required, approved canonical checkpoint.

## Risk-driven minimums (inherits original project rules)
LOW: P0–P2 on changed surface and sufficient dependent closure; expand for unknowns.
STANDARD: P0–P4 including unit, lint, typecheck/build, relevant integration plus declared regression.
ELEVATED: STANDARD + transaction/migration, resilience/recovery, broad relevant regressions and cross-platform/security proofs; ensure Roll-forward/Rollback path.
HIGH_ASSURANCE: ELEVATED plus independently reviewed proof obligations, stronger negative tests, invariant and state transition models, signed/verifiable provenance, disaster-recovery exercise or dry-run; no automatic approval shortcut.
Release candidate: all acceptance-required exact-head suites regardless of earlier incremental PASS. Change to final candidate invalidates its affected proof.

## Techniques
- Property-based testing: fast-check or equivalent for supported JS/TS; prove invariants e.g. inverse/round-trip, idempotency, duplicate delivery, canonicalization, authorization separation. Store replay seed, shrunk input and environment digest. Bounded run counts in PR, deeper campaigns scheduled/off critical path without silently ignoring blockers.
- Mutation testing: StrykerJS focused per critical or changed module; incremental report must be bound by GEF to lockfile, toolchain, runner, env, code, fixtures, snapshot and config fingerprint because upstream change detection has limitations. Forced reruns for changed environment. Mutation score is not a replacement for semantic proof or a universal merge threshold.
- Contract tests: API schemas and consumer/provider test oracles using OpenAPI/Zod/Pact or project-supported interfaces; include breaking-change classification and migration replay, do not install all frameworks indiscriminately.
- Regression/corpus: store every high-value reproduced field defect as small deterministic test with exact expected behavior. Use differential tests across old/new implementation when approved and semantically applicable.
- Concurrency and fault-injection: controlled scheduling, virtual time, fake networks, duplicate message events and interrupted transactions; exact seeds/fixtures permit replay. No chaos in live projects by default.
- Frontend: Playwright smoke of core flows, deterministic accessibility assertions and visual snapshots only where design spec approved; tracing only on first retry or retained on failure to control storage.
- Fuzzing beyond property tests: bounded campaign for critical parser/serialization inputs, only on matching language/platform; benchmark cost before adopting.
- Static security: existing CodeQL/Trivy/Gitleaks, npm audit and dependency review where enabled, plus semantic workflow check by actionlint/zizmor and optional Semgrep CE rule pack. Do not count overlapping scanner alerts as independent evidence.
- Dead-code analysis: Knip produces hints only; automatic removal limited to VERIFIED_DEAD confirmed with runtime import/CLI/plugin/fixture analysis and targeted regression.

## Smart selection and anti-flake protocol
1. Compare exact Git baseline/head and config/env/lockfile; produce deterministic changed symbol/contract and test impact graph.
2. Select minimum safe affected test closure and forced risk floors; explain excluded suites through immutable-current proof receipts.
3. Run preflight/static and focused cases first; schedule independent CPU-intensive suites only when isolation permits.
4. On failure preserve raw logs and fingerprint; diagnose via Causal Repair; fix narrow surface; recheck failure and dependent closure; trigger broad tests for systemic/new knowledge.
5. Flake suspicion requires repeated evidence under unchanged candidate and controlled seed/clock, recorded as FLAKY_SUSPECTED, not “pass”; quarantine only discretionary tests with expiry and linked remediation issue.
6. Before merge/release run exact-head required suites and independently verify all receipts point to candidate SHA, tree/config/toolchain. No stale green reuse.

## Shadow Assurance and anti-optimism tests
Representative corpus must include LOW, STANDARD, ELEVATED and HIGH_ASSURANCE/security where applicable, with injected cross-module dependency, renamed test, changed tooling, dynamic import, migration/transaction and secret leak. Compute TP/FN and material missed defect counts for selective-vs-reference. A missed blocker/HIGH/CRITICAL or contract/security/recovery failure automatically demotes relevant optimization to SHADOW; investigate root cause then repeat full comparison. No cherry-picked benchmark workload.

## Run budget controller
The controller schedules cheapest useful proof first and records estimated vs actual per suite. Stop wasteful retried identical commands; a time budget never overrides mandatory safety/acceptance. Heavy optional mutation/fuzz may execute on cron/disposable self-hosted isolated worker only when availability, trust and artifact retention meet security policy. Cache build outputs only with hash of source/lockfile/config/runtime/tool version; never share untrusted PR cache credentials with privileged jobs. Prefer path/file filters inside tests where safe, but every globally required GitHub status check must always report.

## Evidence Bundle acceptance
Stable WO ID, Git baseline SHA, exact reviewed HEAD and tree SHA, changed files, canonical decision/contract fingerprints, risk class, every required job/check name and URL with terminal result, test count and independent failure list, property seeds, mutation scope/survivors, contract matrix, security findings and suppressions with expiry, performance data, corrected-error fingerprints, remaining risks and proposed checkpoint delta. Rejection/missing/unavailable is explicit, not PASS. Final technical review in pt-BR.

## Representative validation suites
- Negative: malicious proof receipt, wrong HEAD, partial green, toolchain drift, changed migration, unlisted dynamic edge, CI-only skip, expired waiver, parallel race, missing benchmark.
- Safety: unrecoverable partial write, Windows rights denial, non-atomic install, secret committed then deleted, untrusted fork workflow, policy exception bypass.
- Positive: isolated small change, multi-wave safe batch, process-resume preserving green proofs, genuine rollback, reproducible cross-platform install, real app E2E.
- Pilot comparison must measure not only CI time but also review effort, escaped defects and real app readiness.
