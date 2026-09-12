# Requirements

Status: `FROZEN`

## Binding
These requirements derive from `GBS-CONSTITUTION-v1.1`, `CONSTITUTION-AMENDMENT-0001-HYBRID` and the frozen `.engineering/PROJECT-OVERVIEW.md`.

They define what GEF Bootstrap V1 must be capable of doing. They do not freeze implementation architecture, programming language, final schemas or detailed Scope ownership.

## Project construction constraint
GEF Bootstrap itself is built through ChatGPT and connected project tools. Codex is not used as an implementation executor for this repository. This does not prohibit target repositories from using Codex or other executors under GEF governance.

## Requirement model
Every frozen requirement has a stable ID and class. Scope will assign applicability and primary admission basis; Architecture will assign implementation ownership; DoD/Test planning will bind acceptance and proof.

Classes: `GOV`, `CONT`, `FUNC`, `DET`, `ASSURE`, `BROWN`, `PERF`, `OBS`, `PLAT`, `SEC`, `COMPAT`.

## Universal V1 requirements

### REQ-GOV-001 — Repository-backed source truth
GEF Bootstrap must operate from versioned governed repository sources rather than chat history as canonical state.

### REQ-GOV-002 — Governed target materialization
GEF Bootstrap must provide governed contracts for a compatible agent and deterministic work plane to create, map or update the applicable governed surface in a target repository, including brownfield alias/mapping when copying would duplicate truth.

### REQ-GOV-003 — GEF V1 governed workflow
Initialized projects must support a governed lifecycle equivalent to Analyze → Source Check → bounded execution → evidence → semantic review → checkpoint/promotion.

### REQ-GOV-004 — Source authority and conflict handling
GEF must define domain-specific authority, addressable governed facts/decisions, validity/supersession semantics and fail-closed behavior for missing/conflicting authority.

### REQ-GOV-005 — Scope admission and expansion control
GEF must distinguish inventory from admitted scope and prevent executors from silently authorizing product-scope expansion.

### REQ-GOV-006 — Evidence-bound completion
DONE/READY states must bind to applicable obligations, subject state and proof. Agent assertion, percentages or stale evidence are insufficient.

### REQ-GOV-007 — Logical role contract
GEF must represent Project Owner, Planning Agent, Executor and Reviewer/Auditor responsibilities without requiring separate human accounts/models.

### REQ-GOV-008 — Innovation preservation
Material technologies/ideas must be preservable with lifecycle/ownership metadata without becoming requirements merely because they were discussed.

### REQ-CONT-001 — Resume without chat dependency
A governed target repository must expose sufficient checkpoint/current state to resume work in a fresh context without reconstructing the project from scratch.

### REQ-CONT-002 — Targeted invalidation
Relevant source/dependency changes must invalidate affected context/proofs/completion without resetting unrelated accepted work when narrower invalidation is provable.

### REQ-FUNC-001 — Minimum Sufficient Context compilation
GEF must support the smallest verifiably sufficient authoritative context for bounded execution, with governed expansion when evidence or assurance requires it.

### REQ-FUNC-002 — Pre-resolved bounded execution contract
Planning must be able to provide resolved objective, bounded scope, targets/discovery bounds, constraints, transformation intent, validation obligations, budgets and STOP/escalation conditions where evidence permits.

### REQ-FUNC-003 — Compact machine evidence
Execution/materialization must return structured evidence sufficient for exact-state review without unnecessary reasoning narration.

### REQ-FUNC-004 — Delta-oriented semantic review
GEF must support reviewing semantic delta and invalidated proof/context instead of full reread/reproof by default.

### REQ-FUNC-005 — Selective impacted validation
GEF must support the smallest safe validation set based on change, dependency, contract, risk and uncertainty impact, with mandatory escalation when needed.

## Hybrid deterministic work plane

### REQ-DET-001 — Deterministic work plane ships in V1
V1 must physically include a tool-agnostic deterministic work-plane implementation sufficient for admitted mechanical operations. A standalone CLI is optional; CLI, scripts, libraries or another bounded interface may implement the contract.

### REQ-DET-002 — Mechanical authority only
The work plane may be authoritative for deterministic outputs from known inputs but must not silently decide product intent, requirements, architecture, scope admission, risk acceptance or semantic review.

### REQ-DET-003 — Idempotent and inspectable mutation
Applicable materialization/mutation must support plan/preview before mutation, explicit changed paths, deterministic result reporting, idempotent rerun where feasible and fail-safe handling of ambiguous/incompatible state.

### REQ-DET-004 — Machine-readable receipts
Governed deterministic operations must emit machine-readable receipts sufficient for evidence, audit, invalidation and checkpoint promotion.

### REQ-DET-005 — Derived state cannot override canonical truth
Generated files, caches, indexes and receipts remain validity-bound to canonical inputs and cannot silently replace higher-authority sources.

### REQ-DET-006 — Minimum physical V1 operation set
The deterministic work plane must physically ship with capabilities to: inspect repository/Git state; plan governed file mutations; materialize/update approved text artifacts; validate admitted schemas/contracts; compute content/state fingerprints; compare expected versus observed governed state; emit deterministic diffs/change manifests; run conformance checks; and emit machine receipts. Architecture may combine these operations behind fewer interfaces.

### REQ-DET-007 — Filesystem-first repository operation
V1 must support operating on a local checked-out version-controlled repository/filesystem as the universal deterministic substrate. GitHub API mutation remains a first-class profile capability, not the only physical execution path.

## Assurance requirements

### REQ-ASSURE-001 — Assurance overrides optimization
Token, time, search, file and test budgets never suppress context/proof required for correctness, security, integrity or higher assurance.

### REQ-ASSURE-002 — Truthful terminal states
Materialization/review must expose truthful ready/gap/block/conflict/evidence-invalid states rather than decorative success.

### REQ-ASSURE-003 — Exact-subject-state evidence
Where proof depends on repository/configuration state, verdicts/proofs bind to exact subject state and relevant staleness is detectable.

## Brownfield requirements

### REQ-BROWN-001 — First-class existing-project adoption
Existing projects must be adoptable without restarting planning, rewriting working architecture for naming conformity, discarding active work or requiring full historical normalization before value.

### REQ-BROWN-002 — Descriptive/normative truth mapping
Brownfield adoption must distinguish implemented/observed truth from approved/intended truth and represent drift explicitly.

### REQ-BROWN-003 — Progressive maturity
Governance/optimization must be promotable progressively by domain/work area, with shadow assurance before aggressive proof/test skipping/reuse becomes authoritative.

### REQ-BROWN-004 — Early operational value
Before full normalization, adoption must deliver a safe subset including baseline/identity, active-area source mapping, bounded context/search behavior, compact evidence/delta review, checkpoint continuity and shadow-mode optimization.

## Performance and observability

### REQ-PERF-001 — Token accounting
GEF must measure or explicitly classify unavailable/estimated model-token cost across relevant source, execution, retry, review and correction stages.

### REQ-PERF-002 — Executor latency accounting
GEF must measure or classify unavailable/estimated executor duration and observable discovery, validation and retry contributors.

### REQ-PERF-003 — Executor cognition minimization
GEF must reduce unnecessary open-ended executor rediscovery using pre-resolved governed context and bounded escalation.

### REQ-PERF-004 — Engineering ROI protection
Optimization must be evaluated against total safe engineering cost and cannot merely move cost into maintenance, validation, review or defect risk.

### REQ-OBS-001 — Optimization telemetry
V1 must provide a reproducible path to capture/account for token cost, duration, repository discovery, validation effort, retries/corrections, review/evidence and proof/cache/carry-forward behavior where observable.

### REQ-OBS-002 — Targets versus measurements
Benchmark targets, estimates and measured outcomes remain distinguishable. Unproven percentage improvements cannot be reported as facts.

## Platform/profile requirements

### REQ-PLAT-001 — GitHub first-class profile
V1 must define a first-class GitHub profile using applicable PR/check/Actions/issues/ruleset/governance surfaces while representing unavailable permissions honestly.

### REQ-PLAT-002 — Core semantic portability
Core semantics cannot require GitHub-specific behavior when an equivalent version-controlled platform satisfies repository identity, governed change/evidence and continuity contracts.

### REQ-PLAT-003 — Optional ecosystem adapters
UADS, Hive, UGAS and other integrations remain optional adapters/profiles unless explicitly admitted into future core scope.

## Security, recovery and compatibility baseline

### REQ-SEC-001 — Fail-safe destructive operations
Any deterministic operation capable of destructive/irreversible repository or environment change requires explicit safety policy, scope validation and risk-appropriate recovery behavior.

### REQ-SEC-002 — Secret-safe operation
GEF artifacts, telemetry, evidence and deterministic tooling must avoid intentionally persisting credentials/secrets and surface detected secret-risk conditions.

### REQ-SEC-003 — Integrity validation
Governed machine representations, caches, indexes and receipts must support integrity/validity checks against canonical sources.

### REQ-SEC-004 — Universal mutation safety gates
Before governed mutation, V1 must verify target identity/path, expected source state where applicable, allowed mutation surface and conflict/staleness conditions. Destructive operations require an explicit elevated path and cannot be the default behavior.

### REQ-SEC-005 — Recoverable deterministic mutation
For governed mutations, V1 must produce enough pre-change state and/or inverse information to restore the affected GEF-managed surface after a failed/interrupted operation when technically possible. Architecture may choose transactional staging, backup/restore, inverse plans or a profile-dependent combination. Recovery guarantees must be stated truthfully when external side effects are not reversible.

### REQ-COMPAT-001 — Versioned contracts
Constitution, schemas, profiles and machine contracts must expose explicit versions and compatibility semantics sufficient for safe evolution.

### REQ-COMPAT-002 — Upgrade/migration path
GEF must define a governed path to preview, apply, verify and recover from supported contract/profile upgrades without silently corrupting target state.

### REQ-COMPAT-003 — Backward compatibility truthfulness
When compatibility cannot be preserved, GEF must state the incompatibility and required migration rather than pretending older state remains valid.

## Scope-time applicability rules
Scope will classify requirements as `UNIVERSAL_V1`, `PROFILE_CONDITIONAL`, `MODE_CONDITIONAL`, `FUTURE` or `OUT_OF_SCOPE`. The universal product baseline above is a capability baseline; a capability may have profile/mode-specific activation. GitHub-specific behavior and optional ecosystem adapters are profile-conditional by definition. Brownfield requirements activate in EXISTING_PROJECT mode but V1 must ship the capability. No second priority/severity system is introduced here; Scope classification owns admission priority to avoid duplicate governance.

## Compiler/materializer family decision
Prompt compilation, review compilation and bootstrap materialization remain explicit capabilities under existing GOV/FUNC/DET contracts rather than separate top-level requirement families. If later Architecture demonstrates materially different assurance or lifecycle boundaries, it may split implementation ownership without duplicating requirements.

## Verification contract
Every NECESSARY requirement must eventually map:

```text
REQ-ID
-> Scope owner/classification
-> Architecture/contract owner
-> acceptance criterion
-> proof/evidence source
-> DoD obligation
```

Minimum requirement metadata is intentionally small: stable ID, class, applicability, primary admission basis, verification method/delegation, dependencies and status. Richer machine schemas belong to the owning Source Pack/schema modules.

## Requirement baseline change control
This file freezes the initial V1 requirement baseline. Later legitimate requirements may be added only through governed change control with: unique REQ-ID; constitutional/source basis; applicability; dependency/impact analysis; Scope/Architecture/DoD impact; review; and checkpoint promotion. A new requirement does not silently enter the V1 completion denominator until Scope admits it.

## Explicit non-requirements
V1 does not require a specific CLI framework, always-on daemon/service, fixed programming language before Architecture, mandatory UADS/Hive/UGAS integration, GitHub semantics for all platforms, cross-project memory authority, universal percentage improvement guarantees, full brownfield normalization before use, or prematurely fixed Source Capsule/Execution Pack schemas.

## Closed questions
1. Applicability: capability baseline frozen here; Scope assigns universal/profile/mode activation without a duplicate priority system.
2. Compiler families: remain under GOV/FUNC/DET to reduce duplication.
3. Physical deterministic minimum: repository inspection, plan/materialize, schema/contract validation, fingerprints, state comparison, deterministic diff/manifests, conformance checks and receipts.
4. Physical substrate: local checked-out repository/filesystem is universal; GitHub API is first-class profile capability.
5. Recovery: recoverable GEF-managed mutation is required, with implementation mechanism chosen by Architecture and truthful limits for external irreversibility.
6. Security: identity/path/state/surface/conflict gates and secret/integrity safety are universal; platform-specific controls remain profile-owned.
7. Baseline: freeze now; future additions require governed REQ change control and Scope admission.

## Freeze audit
- Constitution v1.1 compatibility: PASS
- hybrid semantic/deterministic boundary: PASS
- physical deterministic V1 capability: PASS
- Codex self-construction prohibition preserved: PASS
- brownfield first-class capability: PASS
- token/latency optimization requirements: PASS
- security/recovery floor: PASS
- platform portability: PASS
- no language/framework architecture frozen: PASS
- no accidental Scope/DoD admission: PASS
- open requirement questions: 0

STOP CONDITION: `READY_FOR_REQUIREMENTS_EXACT_DELTA_REVIEW_AND_CHECKPOINT`.
