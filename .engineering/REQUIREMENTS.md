# Requirements

Status: `IN_DISCUSSION`

## Binding
These requirements derive from `GBS-CONSTITUTION-v1.1`, `CONSTITUTION-AMENDMENT-0001-HYBRID` and the frozen `.engineering/PROJECT-OVERVIEW.md`.

They define what GEF Bootstrap V1 must be capable of doing. They do not yet freeze implementation architecture, programming language, final schemas or final Scope admission.

## Project construction constraint
GEF Bootstrap itself is built through ChatGPT and connected project tools. Codex is not used as an implementation executor for this repository. This constraint does not prohibit target repositories from using Codex or other executors under GEF governance.

## Requirement model
Each requirement ultimately carries:

```text
id
class
applicability
primaryAdmissionBasis
verificationMethod
dependencies
status
```

Optional metadata may include profile, risk/assurance notes and supersession references.

Requirement classes:
- `FUNC` — product capability;
- `GOV` — governance/instruction behavior;
- `ASSURE` — evidence/safety/completion behavior;
- `PERF` — token/time/engineering-cost behavior;
- `CONT` — checkpoint/resume/continuity behavior;
- `BROWN` — existing-project adoption behavior;
- `PLAT` — platform/profile behavior;
- `OBS` — telemetry/measurement behavior;
- `DET` — deterministic work-plane capability;
- `SEC` — security/recovery/integrity behavior;
- `COMPAT` — version/upgrade/compatibility behavior.

Architecture and implementation details are not requirements merely because they sound useful.

## Universal V1 requirements

### REQ-GOV-001 — Repository-backed source truth
GEF Bootstrap must operate from versioned governed repository sources rather than chat history as canonical state.

Verification: a fresh planning/review context can reconstruct the legal next step from repository state without requiring the original conversation transcript.

### REQ-GOV-002 — Governed target materialization
GEF Bootstrap must define and provide enough governed instructions/contracts for a compatible agent and deterministic work plane to create, map or update the applicable governed project surface in a target repository.

It must support both new artifact materialization and brownfield alias/mapping where copying would create duplicate truth.

### REQ-GOV-003 — GEF V1 governed workflow
Initialized projects must be able to follow a governed lifecycle equivalent to Analyze → Source Check → bounded execution → evidence → semantic review → checkpoint/promotion.

### REQ-GOV-004 — Source authority and conflict handling
GEF must define domain-specific authority, addressable governed facts/decisions, validity/supersession semantics and fail-closed behavior for missing/conflicting authority.

### REQ-GOV-005 — Scope admission and expansion control
GEF must distinguish inventory from admitted scope and prevent executors from silently authorizing product-scope expansion.

### REQ-GOV-006 — Evidence-bound completion
DONE/READY states must be bound to applicable obligations, exact/appropriate subject state and proof. Agent assertion, percentages or stale evidence are insufficient.

### REQ-GOV-007 — Logical role contract
GEF must represent Project Owner, Planning Agent, Executor and Reviewer/Auditor responsibilities without requiring separate human accounts/models in every deployment.

### REQ-GOV-008 — Innovation preservation
Material technologies and ideas must be preservable with lifecycle/ownership metadata without becoming requirements simply because they were discussed.

### REQ-CONT-001 — Resume without chat dependency
A governed target repository must expose sufficient checkpoint/current state to resume work in a new chat/executor without reconstructing the project from scratch.

### REQ-CONT-002 — Targeted invalidation
Relevant source/dependency changes must invalidate affected context/proofs/completion without resetting unrelated accepted work when narrower invalidation is provable.

### REQ-FUNC-001 — Minimum Sufficient Context compilation
GEF must support selecting/compiling the smallest verifiably sufficient authoritative context for bounded execution, with governed expansion when evidence or assurance requires it.

### REQ-FUNC-002 — Pre-resolved bounded execution contract
Planning must be able to provide resolved objective, bounded scope, targets/discovery bounds, constraints, transformation intent, validation obligations, budgets and STOP/escalation conditions where source evidence permits.

### REQ-FUNC-003 — Compact machine evidence
Execution/materialization must be able to return structured evidence sufficient for exact-state review without unnecessary reasoning narration.

### REQ-FUNC-004 — Delta-oriented semantic review
GEF must support reviewing semantic delta and invalidated proof/context instead of full reread/reproof by default.

### REQ-FUNC-005 — Selective impacted validation
GEF must support the smallest safe test/validation set based on change, dependency, contract, risk and uncertainty impact, with mandatory escalation when needed.

## Hybrid deterministic work plane

### REQ-DET-001 — Deterministic work plane is a V1 capability
GEF Bootstrap V1 must include a tool-agnostic deterministic work-plane contract and an implemented deterministic capability set sufficient to automate admitted mechanical operations.

The existence of a standalone CLI binary is not itself required. CLI, scripts, libraries or another bounded interface may satisfy the architecture when they conform to the same contracts.

### REQ-DET-002 — Mechanical authority only
The deterministic work plane may be authoritative for deterministic outputs derived from known inputs, such as file materialization, schema validation, fingerprints/hashes, repository-state extraction, deterministic indexes/diffs, conformance checks and machine receipts.

It must not silently decide product intent, requirements, architecture, scope admission, risk acceptance or semantic review.

### REQ-DET-003 — Idempotent and inspectable materialization
Applicable deterministic materialization must be previewable/inspectable, idempotent where feasible, explicit about changed paths and fail safely on incompatible or ambiguous state.

### REQ-DET-004 — Machine-readable receipts
Deterministic operations that affect governed state must be able to emit machine-readable results/receipts sufficient to support evidence, audit and checkpoint promotion.

### REQ-DET-005 — Tooling cannot override canonical truth
Generated files, caches, indexes or receipts must remain validity-bound to canonical inputs and must not silently replace higher-authority governed sources.

## Assurance requirements

### REQ-ASSURE-001 — Assurance overrides optimization
Token, time, search, file and test budgets must never suppress context or proof required for correctness, security, integrity or higher assurance.

### REQ-ASSURE-002 — Truthful terminal states
Materialization/review must expose truthful states such as ready, ready-with-gaps, blocked, source-conflict, evidence-invalid or equivalent governed outcomes rather than decorative success.

### REQ-ASSURE-003 — Exact-subject-state evidence
Where proof depends on repository/configuration state, verdicts/proofs must bind to exact subject state and relevant staleness must be detectable.

## Brownfield requirements

### REQ-BROWN-001 — First-class existing-project adoption
Existing projects must be adoptable without restarting planning, rewriting working architecture for naming conformity, discarding active work or requiring full historical normalization before value.

### REQ-BROWN-002 — Descriptive/normative truth mapping
Brownfield adoption must distinguish implemented/observed truth from approved/intended truth and represent drift explicitly.

### REQ-BROWN-003 — Progressive maturity
Governance/optimization must be promotable progressively by domain/work area, with shadow assurance before aggressive proof/test skipping/reuse becomes authoritative.

### REQ-BROWN-004 — Early operational value
Before full normalization, brownfield adoption must be capable of delivering baseline/identity, active-area source mapping, bounded context/search behavior, compact evidence/delta review, checkpoint continuity and safe shadow-mode optimization.

## Performance and observability

### REQ-PERF-001 — Token accounting
GEF must measure or explicitly classify unavailable/estimated model-token cost across relevant source, prompt/execution, retry, review and correction stages.

### REQ-PERF-002 — Executor latency accounting
GEF must measure or classify unavailable/estimated executor wall-clock/active duration and identify observable avoidable discovery, validation and retry contributors.

### REQ-PERF-003 — Executor cognition minimization
GEF must reduce unnecessary open-ended executor discovery/reasoning by supplying pre-resolved governed context and requiring escalation when bounded assumptions fail.

### REQ-PERF-004 — Engineering ROI protection
Optimizations must be evaluated against total safe engineering cost and must not simply move cost into maintenance, validation, review or defect risk.

### REQ-OBS-001 — Optimization telemetry
V1 must provide a reproducible path to capture/account for token cost, duration, repository discovery, validation effort, retries/corrections, review/evidence and proof/cache/carry-forward behavior where observable.

### REQ-OBS-002 — Targets versus measurements
Benchmark targets, estimates and measured outcomes must remain distinguishable. Unproven percentage improvements must not be reported as facts.

## Platform/profile requirements

### REQ-PLAT-001 — GitHub first-class profile
V1 must define a first-class GitHub profile capable of using applicable PR/check/Actions/issues/ruleset/governance surfaces while representing unavailable permissions honestly.

### REQ-PLAT-002 — Core semantic portability
Core semantics must not require GitHub-specific behavior when an equivalent version-controlled platform can satisfy repository identity, governed change/evidence and continuity contracts.

### REQ-PLAT-003 — Optional ecosystem adapters
UADS, Hive, UGAS and other integrations remain optional adapters/profiles unless explicitly admitted into future core scope.

## Security, recovery and compatibility baseline

### REQ-SEC-001 — Fail-safe destructive operations
Any deterministic operation capable of destructive/irreversible repository or environment change must have explicit safety policy, scope validation and recovery/rollback behavior appropriate to risk.

### REQ-SEC-002 — Secret-safe operation
GEF artifacts, telemetry, evidence and deterministic tooling must avoid intentionally persisting credentials/secrets in governed output and must surface detected secret-risk conditions rather than normalizing them.

### REQ-SEC-003 — Integrity validation
Governed machine representations, caches, indexes and receipts must support integrity/validity checks against the canonical sources they summarize or derive from.

### REQ-COMPAT-001 — Versioned contracts
Constitution, schemas, profiles and machine contracts must expose explicit versions and compatibility semantics sufficient for safe evolution.

### REQ-COMPAT-002 — Upgrade/migration path
GEF must define a governed path to preview, apply, verify and recover from supported Bootstrap contract/profile upgrades without silently corrupting target-project state.

### REQ-COMPAT-003 — Backward compatibility truthfulness
When compatibility cannot be preserved, GEF must state the incompatibility and required migration rather than pretending older state remains valid.

## Requirement applicability model
Requirements will be classified during Scope into:

```text
UNIVERSAL_V1
PROFILE_CONDITIONAL
MODE_CONDITIONAL
FUTURE
OUT_OF_SCOPE
```

A capability may be universally required for the GEF Bootstrap product to support while its immediate application to every brownfield target remains progressive.

## Verification principle
Each NECESSARY requirement must ultimately map to:

```text
REQ-ID
-> admitted Scope owner
-> architecture/contract implementation path
-> acceptance criterion
-> proof/evidence source
-> DoD obligation
```

Requirements without a verification path are incomplete specification.

## Explicit non-requirements
This requirements stage does not require:
- a specific CLI framework or even a CLI interface if another deterministic interface satisfies the contracts;
- an always-on service/daemon;
- a fixed programming language/framework before Architecture;
- mandatory UADS/Hive/UGAS integration;
- GitHub semantics for all platforms;
- cross-project memory authority;
- universal percentage improvement guarantees;
- full brownfield normalization before use;
- final Source Capsule/Execution Pack schemas before owning modules design them.

## Remaining questions before freeze
1. Which requirements above are `UNIVERSAL_V1` versus profile/mode conditional at Scope time?
2. Do we need separate top-level requirement families for Prompt Compiler, Review Compiler and Bootstrap Materialization, or are the current FUNC/GOV/DET contracts sufficient and less duplicative?
3. What minimum deterministic operation set must physically ship in V1 to qualify the hybrid work plane as real rather than architectural theater?
4. Should local filesystem materialization be universally supported in V1, or can GitHub-repository mutation be the first concrete deterministic target with local support profile-conditional?
5. What recovery guarantee is realistic for V1 deterministic mutations: transactional rollback, generated inverse plan, backup/restore contract, or profile-dependent combination?
6. Which security checks are universal V1 gates versus profile-dependent?
7. At what point do we freeze this initial requirement baseline while still permitting later legitimate REQ-* additions through governed change control?

## Current direction
The requirement baseline now reflects the frozen **hybrid** product: governed semantic intelligence in ChatGPT/repository sources plus an official deterministic work plane for mechanical execution. The next design task is to define the minimum V1 deterministic operation set and recovery/security floor without prematurely choosing language/framework or turning CLI into the product definition.
