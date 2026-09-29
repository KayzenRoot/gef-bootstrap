# V1.2 proposed delivery program and marathon Work Order contract

Status: PLANNING CANDIDATE; future Work Orders below are provisional IDs, NOT implementation admission. Reconcile exact canonical versions after V1.1 release.

## Scope classification for proposed work
NECESSARY for V1.2 candidate, subject to formal scope admission:
- Marathon Engine over M14/M15/M17/M18/M63; file capsules, bounded waves, intermediate stable commits, checkpoint receipts, exact-head final proof.
- Bug Hunter combining static diagnostics, requirement/contract-derived tests, property tests and selective mutation.
- Delta Assurance 2.0 over M25/M26/M28, validity-bound proof selection, shadow broad comparisons, compulsory risk expansion.
- Causal Repair that records a deterministic failure signature and corrected hypothesis; bounded repair budgets.
- Autonomous Review consolidating evidence and explaining why an audit boundary is appropriate; ChatGPT remains reviewer; HIGH_ASSURANCE keeps independent review requirements.
- Engineering Intelligence reporting measured outcomes with traceable baselines and no invented percentage improvements.
- Workflow hardening, production candidate acceptance, documentation, reinstall/recovery and startup app-building pilot.

IMPORTANT; admit only when explicitly justified by DoD:
- Contract Change Sentinel for public API/schema compatibility and generated consumer contract tests.
- Seed Drift Sentinel 2.0 and risk-aware change planner; do not duplicate existing SDS.
- Flake Registry and deterministic virtualized clock/randomness test harness.
- Failure Injection Lab for persistence, retry, process termination, network partitions and rollback.
- Policy rule packs for framework-specific anti-patterns via AST; portable extension API.
- Reproducible preview environments and evidence viewer for supported web profiles.

FUTURE or experimental gated:
- Bayesian-like adaptive test priority based on empirical history (ranking never substitutes risk floors).
- Historical defect predictor; explainability and fairness evaluation required; may never silently skip required tests.
- Differential build or toolchain oracle; symbolic/concolic test experiments, bounded fuzz campaigns.
- More extensive language ecosystem plugins beyond proven profiles; paid SaaS integrations.
OUT OF SCOPE until separately admitted: LLM-only pass/fail authority; fully automatic production deployment of risky changes; removing required release tests just to save CI; a second general execution platform competing with Codex; Hive-specific integration; blanket monorepo migration.

## Foundation gate GBS-V12-WO-000 — admission, no implementation
OBJECTIVE: after verified V1.1 release, baseline current repository/project behavior, read canonical Source Pack/ADRs/checkpoint; reconcile V1.1 divergent branches; define risk and benchmark populations, freeze V1.2 requirements/architecture/DoD/decision deltas.
READ: main and release commit IDs, canonical source hierarchy, checkpoint, Decisions Ledger, Scope, DoD, Architecture, Security, Test Benchmark Plan, active CI, M14/M15/M25-M28/M43/M45/M63 implementation and acceptance tests.
TEST: replay V1.1 documented acceptance on a pinned candidate (Codex executor), run representative small/large and new/brownfield baselines, measure cost, flaky rate and security state.
ACCEPT: canonical deltas approved, dependencies and stop conditions explicit, baseline evidence reproducible.
STOP: BLOCKED if V1.1 release or canonical-source lineage is unproven. No implementation permission.

## GBS-V12-WO-001 — Marathon Engine + context acceleration
OBJECTIVE: compile long multi-wave issue-backed execution packs that deliver multiple dependency-ordered atomic increments per Codex invocation while retaining reviewable stage receipts.
CONTEXT LOCK: exact base/head SHA, fingerprints of current checkpoint/Scope/DoD/Architecture/ADRs/config/lockfile, known negative searches, narrow read/write paths.
REQUIREMENTS: wave DAG and critical path, maximum safe change-surface limit, seed/file-intent capsules, safe parallelism only for disjoint proven domains, intermediate commits and reusable green proof receipts, resume without redoing accepted work, explicit stop triggers.
OUT OF SCOPE: changing product scope automatically, modifying main/protected tags, second code executor.
TESTS: DAG cycles, stale decisions, changed config, wrong wave, partial completion, resume across process crash, concurrent branch races, security no-bypass.
DELIVERABLES: implementation by Codex, integration tests, evidence bundle, exact-head CI, docs, one auditable PR.
STOP: fail closed on scope/authority conflict, unverifiable state or dependency-blocked wave.

## GBS-V12-WO-002 — Bug Hunter + contract/property/mutation proof
OBJECTIVE: derive focused tests from admitted contracts and detect missed behavioral, concurrency and security defects.
REQUIREMENTS: map invariant -> generated property -> seed -> replayable counterexample; AST anti-pattern rules with justified provenance; select mutation on changed or critical code and record surviving mutants with triage; zero speculative LLM-only proof.
TESTS: seeded property replay, tampered contract/fixture, false-positive cases, mutated rollback/race/authorization/validation behavior, independent manual seeded defects.
ACCEPT: bug discovery increases on blinded injected-defect corpus without material false-positive explosion; pre-existing tests unaffected; mutation runtimes measured.
STOP: property not supported by canonical contract or pathological test cost without review.

## GBS-V12-WO-003 — Delta Assurance + Flake/Causal Repair
OBJECTIVE: preserve mandatory assurance while removing redundant intermediate test invocations and fixing genuine failures in same Work Order.
REQUIREMENTS: compare exact toolchain/config/env and dependency graph; invalidate all affected proof descendants; shadow selective-vs-full tests; fail closed for unknown impact, public schema, auth, money, migration, recovery, CI policy and release candidate; failure fingerprint + proposed causal fix + narrow retest + impacted closure; flake evidence and quarantine only for nonmandatory tests with time-bounded exception.
TESTS: changed lockfile, malicious edited proof, false cache hit, missing dynamic imports, test-file rename, intermittent CI, novel dependency edge, missed blocker injection.
ACCEPT: zero shadow-missed HIGH/CRITICAL and explicit invalidation plus expected release full sweep.
STOP: any shadow-missed material defect demotes affected optimization immediately.

## GBS-V12-WO-004 — Autonomous Review + GitHub hardening
OBJECTIVE: reliable consolidated reviewer packet and free-first GitHub hardening under existing CODEOWNERS/ruleset arrangements.
REQUIREMENTS: exact-head evidence manifest; deduplicate scanner findings by stable signature without hiding independent results; context-aware ownership; actionlint/zizmor audit; minimum required always-on status check naming; source SHA pinned external actions and minimized permissions; prevention of untrusted PR privilege escalation.
TESTS: forged logs, skipped required workflow, force-push race, stale reviewed head, SARIF duplicates, review independence, branch-rule deadlock.
ACCEPT: human-readable audit points to all backing artifacts; no claim of independent review from Codex self-review; no required check added before continuous check-name verification.
STOP: any credential/privilege leak or HIGH/CRITICAL unknown disposition.

## GBS-V12-WO-005 — Engineering Intelligence + supported app profiles
OBJECTIVE: instrument outcomes, per-profile safe building recipes, meaningful operator UI/status and representative application pilot.
REQUIREMENTS: metrics for accepted increments/executor hour, defects escaping, total CPU/CI time, costs, proof reuse, falses, flake rate, review cycles; product-level profile chooses relevant tool adapters and supported stacks; preserve local-first and GitHub-optional runtime boundaries.
TESTS: inaccurate telemetry, partial/no data, Simpson's paradox cross-cohort guard, application smoke/e2e, cross-platform install, rollback and reproducibility.
ACCEPT: actual baseline and comparisons with same workload/population; quality not traded for time; docs exactly reflect verified behavior.
STOP: unverified gain, unsupported provider dependency or missing production evidence.

## GBS-V12-WO-006 — independent release assurance and promotion
OBJECTIVE: close admitted V1.2 DoD with exact-head audits, supported profile matrix, security threat tests, proof provenance, install/upgrade/recovery, benchmark interpretation and qualified promotion.
REQUIREMENTS: all required workflows green on EXACT reviewed release SHA, no open known HIGH/CRITICAL, portable startup pilot, versioned runbooks and complete checkpoint promotion after objective audit.
STOP: do not merge/publish/declare complete until ALL mandatory DoD proof obligations are met.

## Marathon Work Order mandatory contract
Each admitted execution pack contains, in this order:
1. Stable ID and one GitHub issue; objective and forward progress target; approved decisions and source hierarchy.
2. Context Lock with execution base SHA and critical source fingerprints, freshness test and recompile triggers.
3. Scope, out-of-scope, files/symbols MUST_READ, conditional reads, allowed/forbidden writes, dependencies and API/schema contracts.
4. Wave DAG: each wave atomic outcome, serial or independently parallel mode, specific files, proof obligation, commit/checkpoint and STOP trigger.
5. Acceptance criteria, tests required by risk, security/failure handling and release gates.
6. Causal failure retry policy, reusable exact-binding PASS receipts and plan for unknown/uncertain impact escalation.
7. Deliverables: diff, base/head/tree SHA, Evidence Bundle, CI job URLs and outputs, diagnostics, risks, checkpoint delta proposal.
8. Review format in pt-BR; audit only exact candidate SHA. Only independent APPROVED authorizes canonical checkpoint promotion; CORRECTION REQUIRED stays in same WO/PR; BLOCKED stays blocked.
9. No following increment when previous has unresolved defect/decision or invalidated evidence; no destructive operations without explicit authorization.

## Proposed success metrics (thresholds set ONLY after measured V1.1 baseline)
- Accepted production work units per wall-clock executor hour, normalized to same workload.
- Median/p95 CI CPU-minutes and wall time per accepted increment, with dollars/minutes separated.
- Overall CI repetition per correction and percentage of truly reusable proof receipts.
- Escape rate of material defects in injected tests and post-merge real incidents, with observation windows.
- False-positive triage time; flaky test incident rate; recovery time.
- Operator review events per complete audited batch and percentage requiring correction.
Any performance gain with material quality/security regression FAILS promotion.

## Owner-requested V1.2 expansion (planning only, not new admitted WOs)
The 2026-09-29 follow-on owner request makes three additional behaviors required **for owner consideration at WO-000**: (a) built-in product discovery interview and UI direction before new-project coding; (b) a compact pt-BR project/release status and empirically governed ETA panel in every substantive response; (c) installer/default-profile activation so future new projects inherit the agreed process. These are CANDIDATES for NECESSARY classification until formally admitted by future Scope/DoD; this document does not revise the frozen V1/V1.1 Scope.

Proposed deltas to existing provisional WOs:
- **WO-000 planning**: inspect actual existing M09–M15/M20–M23 and current CLI/adoption rules. Establish canonical owner interview questions, UX/source pack rules, startup profile and estimate/response semantic contracts. Do a V1.1 release cohort baseline before forecasting.
- **WO-001 orchestration**: add interview-answer/context binding, resolved design decision capsules and visual approval freshness to Marathon pack compilation, rather than a second Q/A engine.
- **WO-002 quality**: add UI state-transition/property/contract expectations where matching profiles apply. Do not burden UI-free backend profiles.
- **WO-003 delta assurance**: invalidate affected screen/visual tests and estimate snapshots when design token/Scope changes; keep proof reuse conservative and release exact-head proof.
- **WO-004 audit + GitHub**: include an exact-evidence consolidated response panel linked to M20/M21/M22/M23; in an incremental plan-only integration, define stable status check names and advisory new tools before making gates mandatory. Codex alone writes code/tests/CI.
- **WO-005 pilot and installation**: adaptive GUIDED/FAST/DEEP onboarding, gap-only brownfield questions, owner-approved wireflow/design-token generation, design system, Storybook/Playwright/a11y where applicable, actual preview, future versioned startup profile and installation/upgrade/integration tests. Evaluate 18 optimization candidates from THROUGHPUT-OPTIMIZATIONS.md and admit only those with measured ROI.
- **WO-006 production gate**: compare released V1.1 versus V1.2 on comparable NEW_PROJECT/BROWNFIELD apps, include owner interaction/rework, confirmed UI quality, accepted progress panel and honest calibrated ETA/no-baseline behavior. Demonstrate installed default profile actually runs the defined workflow without manual master prompt; support rollback and installed-app runtime independence.

Additional mandatory acceptance proposals for formal review:
1. Compact status includes exact source/checkpoint timestamps and SHA, approved weighted progress, remaining work, work status, qualified blocker counts, recent delta, next legal action and reproducible links; never silently translate unapproved planning into product completion.
2. Forecast bound to M22 and at least 3 independent valid temporal samples; with insufficient baseline use NOT_YET_BASELINED, with uncertain capacity provide executor-hours interval but no unsupported calendar date, and when scope changes flag STALE.
3. Adaptive interview asks only relevant unanswered material questions; brownfield retains current governance/approved design until explicit owner adoption; answers are documented in canonical Source Pack with correct authority and no fabricated choices.
4. Owner approves important visual directions, screen flows and UX acceptance before expensive UI coding where relevant. Design system tokens, responsive states, keyboard/accessibility, Playwright visual/journey and approved snapshots back the UI DoD. An existing healthy approved UI is preserved.
5. Proposed installer/startup profile is only considered available after packaged V1.2 acceptance, installation verification, opt-out/recovery and both NEW_PROJECT/BROWNFIELD end-to-end pilot. Never claim current bootstrap supports this profile.
6. Throughput optimizations require comparable baseline and no material quality/security regression. Open-source/proprietary tools remain optional profile-scoped; vendor free-plan availability must be verified at adoption.

These added behaviors remain within the provisional 7 WO IDs WO-000 through WO-006 for planning; actual Work Order boundaries may be split after authorized source freeze based on risk and implementation DAG, not on arbitrary prompt size.

## Operations/release follow-on research candidate mapping
Further owner request captured in `OPERATIONS-AND-RELEASE-INNOVATIONS.md` (OPS01–OPS06) and `API-PERFORMANCE-AND-DECISION-INNOVATIONS.md` (INN01–INN08), **not yet Scope-admitted**. Candidate WO-000 must reconcile this fourteen-capability research list against existing M23–M28/M29–M38/M43–M45/M63 and first dossier mechanisms, deduplicate and classify NECESSARY/IMPORTANT/FUTURE/OUT_OF_SCOPE. Do not simply increase v1.2 denominator or number of formal WOs due to new idea count.

After source audit, group by verified change surface: WO-002 may pilot Schemathesis API adversarial tests only for API app profiles; WO-003 may use Data Guardian disposable migrations and narrow recovery proofs where project risk requires; WO-004 can pilot GitHub Artifact Attestations and npm trusted publishing if actual public/private entitlement and release policy permit; WO-005 can include Production Radar/OpenTelemetry and k6/Lighthouse performance budgets in representative app pilot, plus Decision Impact Simulator over existing M11/M15/M22 and optional verified starter recipes. WO-006 must check end-to-end preview, deployment health, artifact identity, synthetic recovery and post-release feedback on exact candidate only where declared DoD requires them. Formal plan may regroup modules after proof of ROI and approval.

Research STOP: documentation may expand on this planning-only draft PR, but V1.1 remains active and no v1.2 implementation or release claims follow from a new Markdown file.
