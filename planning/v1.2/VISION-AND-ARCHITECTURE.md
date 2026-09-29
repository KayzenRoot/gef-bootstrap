# GEF Bootstrap V1.2 — vision and proposed architecture

Status: RESEARCH / DESIGN CANDIDATE; not frozen, admitted, implemented or deployed. Owner vision: startup-grade flagship for producing complete apps quickly with high code quality, aggressive defect detection and minimal repetitive intervention. This is an additive delta to accepted GEF mechanisms, NOT a rewrite.

## Operator experience: start an app
1. A new app: declare product goal, constraints, platforms, security class, repository and budget. GEF produces versioned Source Pack, prioritized NECESSARY requirements, approved design/contracts and measurable Definition of Done before coding.
2. Existing app: inspect Git, config, runtime, dependency graph and passing baseline first; select active-area source map without forcing whole-repository cleanup or restructuring.
3. Planning compiles a Marathon Work Order containing multiple safe dependency-ordered waves and short stable GitHub pointers. Codex is the only implementer/test/CI/migration author.
4. Codex inspects the actual checkout first, validates Context Lock, implements the admitted waves, records intermediate commits/evidence, diagnoses own failures and sends one consolidated reviewable PR.
5. GitHub Actions provide independent deterministic checks where supported; ChatGPT reads exact-head diff, evidence and risk, issues objective audit in pt-BR and authorizes only governed next actions.
6. All requirements close only on evidence, reproducible installation/preview, end-to-end application smoke, supported deployment/recovery and all admitted DoD gates. An approved checkpoint is never merely the executor's assertion.

## Existing engines to EXTEND rather than rebuild
- M14 Task & Context Compiler: minimal valid contextual source/decision graph, source binding/fingerprints.
- M15 Execution Pack Compiler and documented Executor Marathon Pack: precise navigation/file-intent capsules, work DAG and long-horizon handoff.
- M16 policy/guardrails, M17 checkpoint and M18 resume: no self-admission, atomic completed work retained after failures.
- M24 Evidence Engine, M25 Proof Graph, M26 HEDS Delta Review, M27 Assurance Pipeline, M28 Test Impact Engine: source/test proof impact, exact-state receipts, risk expansion.
- M29–M33 Git/GitHub profile; M34–M37 Security/Integrity; M43–M45 telemetry/benchmark; M53–M58 test harness; M63 Executor Performance.
No new product layer may duplicate their authority or weaken original acceptance criteria.

## Proposed first-party mechanisms (provisional names)
### 1. Marathon Engine: large but bounded execution
Extend M14/M15/M63. Compile a single Work Order into an ordered graph of atomic, independently testable waves: dependent waves SERIAL_REQUIRED; disjoint proven surfaces PARALLEL_SAFE; small tightly dependent edits FUSED_SERIAL. Predeclared implementation seed and file-intent capsules use exact allowed paths/contracts. Each successful wave emits commit and proof receipt. Do not auto-open next wave when a predecessor needs architectural decision or HIGH/CRITICAL correction. Code review boundary is a complete auditable domain, NOT each trivial commit.

### 2. Bug Hunter: contract-driven error discovery
Attach tests to public contracts, invariants, states, threat assumptions and boundary transitions. Run static and type checks before expensive execution, targeted property tests with reproducible seeds/shrunk examples, selective mutation to detect weak assertions, parameter-boundary/failure cases and AST custom rules. LLM reasoning proposes suspicious scenarios and reviewer hypotheses, but only deterministic tests and real evidence establish failure. Security and concurrency invariants receive higher priority.

### 3. Delta Assurance 2.0: proof validity over test volume
Extend M25/M26/M28. Build graph of source symbols -> contracts -> dependent call sites -> relevant tests -> toolchain/config/env -> exact result. On each edit invalidate only affected proof descendants, test the changed closure, and continue to exact-head full-risk assurance. Unknown dynamic links cause conservative expansion; a stale green result is never reused. Reuse decisions produce inspectable receipts. First rollout in SHADOW against broader reference tests.

### 4. Causal Repair: no blind retry loops
Each failure has fingerprint (test ID, exit status, stack/diagnostic, config, runtime, tree SHA and reproducible seed). Codex states a causal hypothesis, changes a bounded cause, reruns failed test + impacted closure, compares fingerprints, and escalates to broader proof when causal scope expands. Repeating unchanged input without a changed hypothesis is not progress. Cap unsuccessful repair iterations then BLOCKED with evidence. Never delete failing tests to declare green.

### 5. Autonomous Review: consolidated evidence without fake independence
Collect static findings, unit/integration/e2e results, coverage delta, mutation survivors, security findings, contract compatibility and performance data in an exact-head Evidence Bundle. Deduplicate symptoms only with transparent source references and preserved raw artifacts. Prioritize material findings; ChatGPT audits against Source Pack and user-visible risk. For HIGH_ASSURANCE use required independent reviewer/proof obligations. A Codex self-review is useful preflight but NOT an independent verdict.

### 6. Engineering Intelligence: adaptive measured optimization
Extend M43/M45/M63. A comparable-cohort metric ledger reports accepted work/time, tokens only when actually observable, context reads, failing-test root causes, first-pass quality, cache validity, CI minutes, repeat runs, late regressions and review effort. Use these to suggest improved future waves and budgets. No learned model may silently shrink a mandatory risk floor; unmeasured gains remain UNVERIFIED.

### 7. Contract Change Sentinel
For supported public APIs, events, schemas and database models, compute structural change fingerprints; classify backwards-compatible, breaking, unknown or migration-required. Generate contract compatibility probes and consumer/provider smoke tests. Reject unsupported automated compatibility assertions; owner approves intentional breaking changes.

### 8. Invariant Map and Requirement-to-Proof Compiler
Bind requirement and acceptance criterion IDs to concrete invariants, public operations, errors, threats and tests. Track UNPROVEN separately from PASS, FAIL and NOT_APPLICABLE. A feature is not DONE because code exists or coverage rose; every required behavior must map to proof. This extends existing M24/M25 instead of inventing parallel canonical state.

### 9. Failure Injection Lab
Admit bounded chaos/fault injection only in disposable test environments: I/O errors, lock contention, process interruption, retried requests, duplicate events, partial persistence, token expiry, simulated provider timeouts and rollback. Never inject into real user/production data. Preserve seed, deterministic clock, test fixture and recovery receipts. Elevated/full security review for migrations and privileged auth.

### 10. Flake Registry and Determinism Firewall
Classify intermittent tests by stable identity, environment, historical seeds and reproducibility. Standardize virtual time, deterministic random seeds, disposable storage and network simulation where safe. Distinguish true race/timeout regression from infrastructure transient and conceal neither. Quarantine only nonmandatory tests under documented, time-limited exception; mandatory security/regression failure stays red.

### 11. Architecture Fitness Sentinel
Encode already-approved architectural invariants as measurable structural rules: prohibited imports, provider isolation, layer direction, migration ordering, forbidden implicit network activity, privileged boundaries and generated/vendor exclusions. Use AST/source dependency tools before requiring expensive semantic review. New rules require approval and regression fixtures; no tool decides architecture intent.

### 12. Preview and Product Smoke Orchestrator
For eligible web app profiles, start only an isolated, disposable local preview; exercise real user journeys, capture failure-focused Playwright traces, accessibility checks and screen snapshots where applicable. Contract on appearance and interactions derives from approved UI/UX spec. No assumption all apps are web apps and no mandatory paid cloud runtime.

### 13. Supply Chain and Workflow Sentinel
Verify lockfile integrity, dependency/audit alerts, secrets leakage, action SHA pins, workflow permission minimization, no untrusted code in privileged contexts, artifact provenance and actionable severity. Reuse existing CodeQL/Trivy/Gitleaks/Scorecard and trial actionlint/zizmor; prevent endless overlapping scanners. Public GH repository billing is not proof of all third-party free plans.

### 14. Context and Search Waste Sentinel
Build read-once file/AST navigation index, changed-area cache, known-negative-search ledger and compact context capsules. Reopen files only on meaningful fingerprints/detected contradictions. Track source-read/search reuse with objective counters; source-check any stale capsule before use. No permanent dependency on third-party memory systems.

## Technical architecture (provisional)
- Semantic plane: existing governed source hierarchy, approved design reasoning, ChatGPT planning/audit; proposed contract/proof maps store trace IDs, never supersede ADRs.
- Deterministic work plane: existing TypeScript/Node modular core; proposed opt-in test adapters and reproducible pure analysis; no second executor.
- Execution integration: issue-backed packs supplied to Codex; accepted intermediate waves written by Codex only; independent reviewer has read-only access to exact SHA.
- Evidence/assurance plane: immutable-by-reference content digests, dependency-aware proof invalidation, shadow optimizers and forced full-risk release gates.
- Platform/profile plane: GitHub as primary optional dev platform, no application runtime requirement; npm/Node, web, APIs and persistence tools installed only for matching profiles.
- Continuity plane: checkpoint after APPROVED, not after coder self-report. Stale source fingerprint invalidates next wave.
- Observability: capture measured, inferred and unavailable separately; privacy-by-default logs and redacted secrets.

## Engineering limits and risk
- Long-running execution is beneficial only if the change boundary stays reviewable, testable and revertible. Split on contract boundary, destructive migration or unresolved dependency.
- Do not auto-merge security-sensitive, finance/trading, cryptographic signing, privileged auth or irreversible changes without formal policy and required independent proof. Never skip specified proof obligations for time.
- Incremental mutation can miss changes in environment/dependencies; bind its report to the full environment and force re-evaluation after relevant drift.
- Any test-impact change itself requires broad reference verification. A hidden dependency or missed materially blocking defect disables the selective shortcut.
- Prefer stable platform/tooling choices and empirically test a linter/runner swap before making it mandatory; “newer” is not evidence of “faster” on our repo.
- New applications are strict Source Pack first. Brownfield projects keep their existing flow unless explicit adoption and approved incremental normalization.
