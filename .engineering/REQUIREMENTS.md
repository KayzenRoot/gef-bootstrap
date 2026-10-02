# Requirements

Status: `FROZEN`

## Binding
Derived from `GBS-CONSTITUTION-v1.1`, `CONSTITUTION-AMENDMENT-0001-HYBRID` and frozen `.engineering/PROJECT-OVERVIEW.md`. These define V1 capability, not implementation architecture, language, final schemas or detailed Scope ownership.

## Construction constraint
ADR-0008 / D-0063 makes Codex the sole code/test/CI/migration executor for this repository and new GEF-governed projects, effective on `main` at PR #332 merge `419b9cd713d4817c05582287ec10793fc7fdc130` and on `release/1.1` at PR #347 merge `9f6f069c977868ade34a19cddb346f7bea9a95fe`. Only admitted exact-base Work Orders authorize implementation. ChatGPT owns planning, approved governance documents, GitHub coordination, objective review and evidence-based reporting. D-0062 remains branch-qualified as main ADR-0007 and release ADR-0006.

## Requirement classes
`GOV`, `CONT`, `FUNC`, `DET`, `ASSURE`, `BROWN`, `PERF`, `OBS`, `PLAT`, `SEC`, `COMPAT`.

## Governance and continuity
- `REQ-GOV-001` Repository-backed source truth: canonical state is versioned repository truth, not chat history.
- `REQ-GOV-002` Governed target materialization: create/map/update governed target surfaces, including brownfield aliasing when copying would duplicate truth.
- `REQ-GOV-003` Governed workflow: support Analyze → Source Check → bounded execution → evidence → semantic review → checkpoint/promotion or equivalent.
- `REQ-GOV-004` Source authority/conflicts: domain authority, validity/supersession and fail-closed missing/conflicting truth.
- `REQ-GOV-005` Scope control: inventory is distinct from admitted scope; executors cannot silently expand product scope.
- `REQ-GOV-006` Evidence-bound completion: DONE/READY requires applicable current proof, not assertion/percentage/stale evidence.
- `REQ-GOV-007` Logical roles: Project Owner, Planning Agent, Executor, Reviewer/Auditor responsibilities remain distinct even if one actor holds several roles.
- `REQ-GOV-008` Innovation preservation: technologies/ideas have governed lifecycle without automatic requirement admission.
- `REQ-CONT-001` Resume without chat dependency: sufficient checkpoint/current state exists for a fresh context to continue legally.
- `REQ-CONT-002` Targeted invalidation: relevant changes invalidate dependent state without resetting unrelated accepted work when narrower invalidation is provable.

## Context, execution, evidence and review
- `REQ-FUNC-001` Minimum Sufficient Context: compile the smallest verifiably sufficient authoritative context with governed expansion.
- `REQ-FUNC-002` Pre-resolved bounded execution: provide objective, bounds, constraints, targets/discovery limits, transformation intent, validation, budgets and STOP/escalation conditions where evidence permits.
- `REQ-FUNC-003` Compact machine evidence: structured evidence sufficient for exact-state review without unnecessary reasoning narration.
- `REQ-FUNC-004` Delta semantic review: review changed semantics and invalidated proof/context rather than full reread/reproof by default.
- `REQ-FUNC-005` Selective impacted validation: smallest safe validation set based on change/dependency/contract/risk/uncertainty, expanding when required.

## Hybrid deterministic work plane
- `REQ-DET-001` Physical V1 work plane: V1 ships an implemented tool-agnostic deterministic capability set. Standalone CLI is optional.
- `REQ-DET-002` Mechanical authority only: deterministic outputs from known inputs are allowed; product intent, requirements, architecture, scope admission, risk acceptance and semantic review remain semantic/governed decisions.
- `REQ-DET-003` Inspectable mutation: plan/preview before mutation, explicit changed paths, deterministic result, idempotent rerun where feasible, fail-safe ambiguity/conflict handling.
- `REQ-DET-004` Machine receipts: governed operations emit machine-readable receipts for evidence/audit/invalidation/checkpoint use.
- `REQ-DET-005` Derived-state subordination: caches/indexes/generated state/receipts remain validity-bound and cannot override canonical truth.
- `REQ-DET-006` Minimum physical operations: inspect repository/Git state; plan governed mutations; materialize/update approved text artifacts; validate admitted schemas/contracts; compute content/state fingerprints; compare expected/observed governed state; emit deterministic diffs/change manifests; run conformance checks; emit machine receipts.
- `REQ-DET-007` Filesystem-first substrate: local checked-out version-controlled repository/filesystem is universally supported. GitHub API mutation is first-class profile capability, not the sole execution path.

## Assurance
- `REQ-ASSURE-001` Assurance overrides optimization budgets.
- `REQ-ASSURE-002` Terminal states are truthful ready/gap/block/conflict/evidence-invalid outcomes, never decorative success.
- `REQ-ASSURE-003` State-dependent evidence binds to exact subject state and detects relevant staleness.

## Brownfield
- `REQ-BROWN-001` Existing projects are first-class and do not restart planning or rewrite working architecture merely for naming conformity.
- `REQ-BROWN-002` Implemented/observed and approved/intended truth remain distinct with explicit drift.
- `REQ-BROWN-003` Governance maturity is progressive; aggressive proof/test reuse requires shadow assurance before promotion.
- `REQ-BROWN-004` Early value before full normalization includes baseline/identity, active-area source mapping, bounded context/search, compact evidence/delta review, checkpoint continuity and safe shadow optimization.

## Performance and observability
- `REQ-PERF-001` Token accounting across relevant source/execution/retry/review/correction stages, with measured/estimated/unavailable distinguished.
- `REQ-PERF-002` Executor duration accounting and observable discovery/validation/retry contributors.
- `REQ-PERF-003` Executor cognition minimization through pre-resolved context and bounded escalation.
- `REQ-PERF-004` Engineering ROI evaluates total safe cost, not displaced cost.
- `REQ-OBS-001` Reproducible telemetry path for token, duration, repository discovery, validation, retries/corrections, review/evidence and proof/cache/carry-forward behavior where observable.
- `REQ-OBS-002` Targets, estimates and measurements remain distinct; unproven percentage gains are not facts.

## Platform/profile
- `REQ-PLAT-001` GitHub first-class profile using applicable PR/check/Actions/issues/ruleset/governance surfaces and truthful permission gaps.
- `REQ-PLAT-002` Core semantic portability to equivalent version-controlled platforms satisfying identity/change/evidence/continuity contracts.
- `REQ-PLAT-003` External ecosystem integrations remain optional unless future governed scope admits them.

## Security, recovery and compatibility
- `REQ-SEC-001` Destructive/irreversible operations require explicit safety policy, scope validation and risk-appropriate recovery behavior.
- `REQ-SEC-002` Secret-safe artifacts/telemetry/evidence/tooling; detected secret-risk is surfaced rather than normalized.
- `REQ-SEC-003` Machine representations/caches/indexes/receipts support integrity/validity checks against canonical sources.
- `REQ-SEC-004` Universal mutation gates verify target identity/path, expected source state where applicable, allowed mutation surface and conflict/staleness; destructive operation is never the default path.
- `REQ-SEC-005` Recoverable GEF-managed mutation: enough pre-change/inverse information exists to restore affected managed state after failed/interrupted operation when technically possible; external irreversibility is reported truthfully.
- `REQ-COMPAT-001` Constitution, schemas, profiles and machine contracts expose explicit versions and compatibility semantics.
- `REQ-COMPAT-002` Supported upgrades have preview/apply/verify/recovery path.
- `REQ-COMPAT-003` Incompatibility is explicit and requires a stated migration rather than false compatibility.

## Applicability and admission
Scope classifies each requirement as `UNIVERSAL_V1`, `PROFILE_CONDITIONAL`, `MODE_CONDITIONAL`, `FUTURE` or `OUT_OF_SCOPE`. GitHub-specific behavior and optional ecosystem adapters are profile-conditional. Brownfield requirements activate in EXISTING_PROJECT mode but V1 must ship that capability. No duplicate priority/severity system is introduced here.

Prompt compilation, review compilation and bootstrap materialization remain capabilities under GOV/FUNC/DET rather than separate requirement families unless later Architecture proves a materially different lifecycle/assurance boundary.

Every NECESSARY requirement must ultimately map: `REQ-ID -> Scope owner/classification -> Architecture/contract owner -> acceptance criterion -> proof/evidence -> DoD obligation`.

## Change control
This is the initial frozen V1 requirement baseline. A later REQ requires unique ID, canonical basis, applicability, dependency/impact analysis, Scope/Architecture/DoD impact, review and checkpoint promotion. It does not silently enter the V1 completion denominator until Scope admits it.

## Explicit non-requirements
No specific CLI framework, always-on daemon/service, fixed language before Architecture, mandatory external ecosystem integration, GitHub semantics for all platforms, cross-project memory authority, universal percentage gain guarantee, full brownfield normalization before use, or premature final Source Capsule/Execution Pack schema.

## Closed design questions
1. Applicability is assigned by Scope; no duplicate requirement priority system.
2. Prompt/review/materialization compilers remain under GOV/FUNC/DET to reduce duplication.
3. Physical V1 work plane includes repository inspection, plan/materialize, validation, fingerprints, state comparison, deterministic diff/manifests, conformance and receipts.
4. Local checked-out repository/filesystem is universal; GitHub API is a first-class profile.
5. Recoverable managed mutation is mandatory; Architecture chooses transactional staging, backup/restore, inverse plans or compatible combination and states external limits.
6. Identity/path/state/surface/conflict plus secret/integrity safety are universal; platform-specific security remains profile-owned.
7. Baseline freezes now; later additions use governed REQ change control plus Scope admission.

## Freeze audit
- Constitution v1.1 compatibility: PASS
- hybrid semantic/deterministic boundary: PASS
- physical deterministic V1 capability: PASS
- Owner-directed Codex-only implementation and GitHub-first planning under ADR-0008 / D-0063 are effective on `main` at PR #332 merge `419b9cd713d4817c05582287ec10793fc7fdc130` and on `release/1.1` at PR #347 merge `9f6f069c977868ade34a19cddb346f7bea9a95fe`; no historical reclassification.
- brownfield first-class capability: PASS
- token/latency optimization: PASS
- security/recovery floor: PASS
- platform portability: PASS
- no language/framework architecture frozen: PASS
- no accidental Scope/DoD admission: PASS
- open requirement questions: 0

STOP CONDITION: `READY_FOR_REQUIREMENTS_EXACT_DELTA_REVIEW_AND_CHECKPOINT`.

# V1.2 canonical Source Pack addendum — admitted by GBS-V12-WO-000

**State:** EFFECTIVE CANONICAL V1.2 SOURCE PACK from PR #369 squash merge `45d5508cd03d86725b01f0381b03b5922a45d9ee`. The obligations below are admitted requirements but remain NOT_IMPLEMENTED until separately governed Work Orders satisfy them. Existing V1/V1.1 requirements and V1.1.2 acceptance remain preserved.

## Universal V1.2 delta obligations

Each obligation is a release gate with a finite acceptance contract and exact-head evidence. All ten are required for a V1.2 universal-core claim; all remain NOT_IMPLEMENTED until their separately admitted implementation Work Orders satisfy them.

| ID | Audited map | Canonical obligation |
|---|---|---|
| U12-01 | C01 | Guided discovery records source-backed answers, asks only unresolved questions, supports bounded 5-7 question rounds where needed, and keeps brownfield discovery gap-only. Answer capsules are attributable, version-bound, and invalidated when their source changes. |
| U12-02 | C02 | Canonical plans expose requirement-to-proof links, owner-change impact, missing critical-path obligations, dependencies, and truthful unknowns; no completion claim is inferred from plan shape alone. |
| U12-03 | C04 | Long-running work uses dependency-ordered waves over M14-M18; checkpoint/resume is exact-state bound, and repeated execution cannot duplicate a promoted side effect. No second executor is introduced. |
| U12-04 | C05 | Bug Hunter links requirement, invariant, hypothesis, test and finding; evidence distinguishes reproduced defects from hypotheses and retains negative/false-positive controls. It extends M24-M28 rather than replacing their proof graph. |
| U12-05 | C06 | Delta Assurance retains the first failure, binds causal repair to the affected proof set, records flake observations, and escalates uncertain impact. Retry or selection cannot suppress a required failure or weaken the full assurance sweep. |
| U12-06 | C07 | Review/evidence binds author, reviewer, role, exact head, findings and resolution. Owner-operated ChatGPT semantic audit is always labeled NOT_INDEPENDENT and never satisfies the independent specialist gate. |
| U12-07 | C08 | Intelligence reports measured, estimated, and unavailable metrics separately; optimization claims require comparable workload, population, toolchain, platform, policy and quality gates. Missing token, cost, defect or ETA telemetry remains unavailable. |
| U12-08 | C09 | Operator responses are continuously truthful and available in pt-BR, with machine-readable status, next legal action, blockers, uncertainty and evidence references kept consistent. |
| U12-09 | C10 | Setup and brownfield routing use explicit owner-confirmed profiles and detected evidence; doctor reports applicable prerequisites, cost/entitlement and permission gaps without silently installing paid tools or selecting a domain profile. |
| U12-10 | C11 | Release artifacts and application-profile proofs bind reproducible inputs, exact source, build, compatibility and provenance. Build-once/proof-many is a measured claim, not an assumption. |

## Conditional requirement rule

C03, C12, and D01-D12 activate only through a separately admitted profile acceptance contract. The first SaaS pilot is the first profile selected for validation, not a transfer of its obligations into U12-01..U12-10. Each profile contract declares included capabilities, exclusions, test fixtures, evidence, compatibility and release denominator before implementation begins.

Subscription lifecycle and entitlement tests use deterministic fixtures or non-charging test facilities. No live charge, payout, custody, escrow or real-money transfer is admitted by the SaaS pilot.

## Assurance and resource constraints

All existing test, coverage, security and branch-protection floors remain unchanged. No new numerical benchmark target is implied by this proposal. Paid tools, paid CI expansion and paid external services remain at an initial budget of US$ 0; any later spend requires a separate owner-approved decision supported by evidence. HIGH_ASSURANCE surfaces require the independent specialist gate in the proposed ADR-0010 before production.
