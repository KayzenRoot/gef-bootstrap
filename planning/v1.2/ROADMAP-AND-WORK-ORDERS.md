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

## Domain extension: Web3, games and hybrid app proposals
Owner-requested research is in WEB3-FACTORY-PROFILE.md, GAME-FACTORY-PROFILE.md and DOMAIN-ROUTER-AND-HYBRID-PROFILES.md. REMAINING-GAPS-AND-OPTIMIZATION-AUDIT.md records eight critical unresolved categories and optional next experiments. Add no blanket engine, smart-contract toolkit or new compulsory scope denominator before WO-000 owner classification and V1.1 exact-head acceptance.

WO-000 future admission: inspect current M09–M15/M20–M28/M38/M43–M45/M63 to identify reusable interfaces and duplication. Ask the owner which chain(s), game engine, first browser/MMO target, risk/asset exposure, approval budget, minimum playable/usable pilots and optional Web3/game integration. Choose NECESSARY/IMPORTANT/FUTURE/OUT_OF_SCOPE for each domain proposal. Profiles may be conditionally mandatory for qualifying new projects without making every tool mandatory for the core installed binary.

WO-001 architecture: extend context, Domain Router and Marathon packs with source-bound owner-confirmed WEB3_EVM, WEB3_SOLANA, GAME_2D_WEB, GAME_3D_WEB, GAME_MULTIPLAYER, GAME_MMO, GAME_WEB3 composition. Unapproved signatures or ambiguous stack STOP before code.

WO-002 quality pilots: use Foundry/Slither plus targeted Echidna only for EVM; LiteSVM/Mollusk only for Solana; replay, netcode/latency, game item/transaction invariants and anti-cheat for qualifying game projects. Paid symbolic/external audit is separately owner controlled and never claimed from automated test green.

WO-003 proof: dynamic chain fork/reorg/ABI/storage upgrade and onchain/offchain reconciliation for the specific approved stack. Game asset dependency, state replays, economy/persistence tests and renderer/platform compatibility modify impact closures. Mandatory high-assurance risk floors and final exact-head release proof remain intact.

WO-004 audit/release: supply contract security, chain deployment signer/provenance gates, profile-scoped game live-ops capacity/anti-cheat checks and meaningful status panels, not a new uncontrolled CI matrix. Mainnet/deployment high-value production is never a side effect of automatic Codex execution.

WO-005 reference pilots: one tiny local EVM dapp contract and disposable wallet/UI where applicable; one browser game with actual playable vertical slice; optional small authoritative multiplayer and independently justified Solana/hybrid pilots. Owner chooses exact number after workload/cost baseline. Test a brownfield game or Web3 repository adoption without forced tech migration. Collect meaningful per-domain telemetry and M22 cohort-specific estimates rather than using Web2 estimates as though they were game or contract performance.

WO-006 acceptance: only a profile actually proven on a representative complete app, with installation/preview, security/contract/replay/load and rollback/recovery where supported, may be marketed as released in v1.2. Any remaining chain/engine support must be clearly labeled RESEARCH or FUTURE and omitted from installer. A profile cannot inherit another domain's test-proof validity. If optional profiles threaten core release, defer them as versioned extension packs with owner approval rather than delaying the universal GEF core indefinitely.

High-impact research gates before freezing: independent external review thresholds, reproducible local/CI profiles, permission/secrets/mainnet authority, realistic CI/hardware budgets, privacy-safe real incident-to-regression flow, app-specific SLOs, game/asset license and token-related regulatory review, low-friction operator experience. User is not required to answer all of these in a single planning conversation; WO-000 contains an adaptive blocking-question interview.

## Conditional SaaS Finance and Web3 Data Security research mapping (owner expansion)
The owner has requested SaaS monetization, financial correctness, company profitability and stronger onchain/offchain confidentiality. Documented in SAAS-FINANCE-FACTORY.md, SAAS-TENANT-AND-DATA-GOVERNANCE.md, WEB3-DATA-SECURITY.md and SAAS-WEB3-REMAINING-AREAS.md. These are owner-requested RESEARCH candidates. Do not add them automatically to a frozen v1.2 denominator, declare them installed or expand core Work Orders without approval.

Future WO-000: ask short high-impact questions about first SaaS pricing/payment geography, whether the platform holds other people's funds, tenancy and enterprise data protection, first Web3 chain, custody/value-at-risk and actual confidentiality property, budget and external audit triggers. Record as APPROVED/ASSUMED/UNRESOLVED; distinguish ordinary paid SaaS from money-moving marketplace, fintech or custodial Web3. Verify applicable current official compliance rules with qualified legal/accounting specialists where relevant and do not invent release clearance.

Future WO-001: route startup domain profiles, adapt interview, design and context lock to conditional SaaS_SUBSCRIPTION, SAAS_METERED, SAAS_MULTI_TENANT, FINANCIAL_LEDGER, WEB3_CONFIDENTIAL_DATA and WEB3_CUSTODY (and prior game/Web3 composition). Subordinate to approved canonical Scope, require least-necessary technology installation and a small complete financial/tenant vertical slice where appropriate.

Future WO-002: reuse Bug Hunter/Contract Change Sentinel and test impact graph for precise subscription/proration/usage property tests, financial ledger conservation, fraudulent webhook duplicates, cross-tenant API/DB/cache/queue negative tests, EVM signing/replay/permissions and intentionally seeded confidential metadata leaks. Optional ZK/FHE and professional high-assurance audit must have explicit threat/ROI and independent gate.

Future WO-003: durable payment inbox/outbox and approved workflow, provider sandbox failure/reconciliation, tenant encrypted backup restoration and key rotation tests; proof invalidation when currency/ledger/replay signer, tenancy policy, chain, cryptographic version or provider contract changes. Do not skip the exact-head finance/security release gate due to green intermediate test receipts.

Future WO-004: exact-head reviewer packet and qualified release gates for money-moving apps and Web3 custody; provider/wallet external credentials scoped by role, no production transfers or signing from unattended Codex execution, legal/accounting/PCI/PSAV flags for actual in-scope products, no claim of compliance or external audit just from a scanner.

Future WO-005: comparable disposable pilots (subscription SaaS, metered AI SaaS, synthetic EVM confidential offchain records), with ledger/marketplace scenario only when owner needs it. Capture gross/contribution margins, provider/CI operations cost, accepted journeys/executor hour, material defect escape, tenant isolation and recovery; optionally prove ZK/FHE separately before admitting costs/dependencies.

Future WO-006: verify freshly installed default startup profile asks right SaaS/security questions, builds a real usable sandbox app, includes precise financial/inventory/chain security evidence, visibly reports profile-specific progress and honest ETA, remains reversible and does not introduce new cloud subscriptions without owner approval. Conditional packs not proven at release remain FUTURE/RESEARCH; no phantom completion credit.

Future experimental topics that should not expand core without objective need: universal multi-region active-active, institutional custody/MPC, all-chain privacy proof platform, bank-grade certification, full payments orchestration/ERP accounting, advanced country-specific fiscal logic, external legal opinions, advanced AML vendor integrations and production treasury. Each needs owner-approved independent evidence, cost and product value.
