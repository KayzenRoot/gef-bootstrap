# Requirements

Status: `IN_DISCUSSION`

## Binding
These requirements derive from `GBS-CONSTITUTION-v1.0` and the frozen `.engineering/PROJECT-OVERVIEW.md`. They define what GEF Bootstrap V1 must be capable of doing. They do not yet define implementation architecture, detailed file schemas or final Scope admission.

## Requirement model
Each requirement will ultimately carry a stable ID, type, admission basis, verification method, dependencies and applicable profiles/modes where needed.

Candidate requirement classes:
- `FUNC` — required product capability;
- `GOV` — governance/instruction behavior;
- `ASSURE` — evidence/safety/completion behavior;
- `PERF` — token/time/engineering-cost behavior;
- `CONT` — checkpoint/resume/continuity behavior;
- `BROWN` — existing-project adoption behavior;
- `PLAT` — platform/profile behavior;
- `OBS` — telemetry/measurement behavior.

Architecture and implementation details are not requirements merely because they sound useful.

## Draft V1 requirements

### REQ-GOV-001 — Instruction-first source of truth
GEF Bootstrap must operate from versioned governed repository sources rather than relying on chat history as canonical state.

Verification direction: a new planning/review context can reconstruct the legal next step from repository state without requiring the original conversation transcript.

### REQ-GOV-002 — Governed target materialization
The Bootstrap must define enough instructions/contracts for a compatible planning agent/executor to create, map or update the applicable governed project surface in a target repository.

It must support both materializing new artifacts and aliasing/mapping valid brownfield artifacts when copying would create duplicate truth.

### REQ-GOV-003 — GEF V1 default workflow
Initialized projects must be able to follow the governed Analyze → Source Check → bounded execution → evidence → semantic review → checkpoint/promotion pattern, with exact names/refinements owned by later modules.

### REQ-GOV-004 — Stable source authority and conflict handling
The product must define domain-specific source authority, addressable facts/decisions, validity/supersession semantics and fail-closed handling for missing/conflicting authoritative state.

### REQ-GOV-005 — Scope admission and expansion control
The product must distinguish inventory from admitted V1 scope and prevent executors from silently authorizing product-scope expansion.

### REQ-GOV-006 — Evidence-bound completion
The product must prevent DONE/READY claims from being accepted solely from agent assertion, percentages or stale evidence and must bind completion to applicable obligations/proofs/state.

### REQ-CONT-001 — Checkpoint/resume without chat dependency
A governed target project must expose sufficient current/checkpoint state to resume work in a new chat/executor without rediscovering the project from scratch.

### REQ-CONT-002 — Targeted invalidation
Changes to relevant canonical sources/dependencies must invalidate affected context/proofs/completion state without forcing unrelated accepted work to reset when dependency evidence permits narrower invalidation.

### REQ-FUNC-001 — Minimum Sufficient Context compilation
The product must support compiling the smallest verifiably sufficient authoritative context for bounded execution while allowing governed expansion when evidence/assurance requires it.

### REQ-FUNC-002 — Pre-resolved bounded execution contract
Where source evidence permits, planning must be able to provide an executor with resolved objective, scope, target files/symbols or discovery bounds, architecture constraints, transformation intent, validation obligations, budgets and STOP/escalation conditions.

### REQ-FUNC-003 — Compact machine evidence
Executors/materializers must be able to return compact structured evidence sufficient for exact-state review without narrating unnecessary reasoning already represented in the governed plan.

### REQ-FUNC-004 — Delta-oriented semantic review
The product must support reviewing semantic delta and invalidated proof/context rather than requiring full reread/reproof of previously accepted material by default.

### REQ-FUNC-005 — Selective impacted validation
The product must support selecting the smallest safe validation/test set based on change/dependency/contract/risk/uncertainty impact, with escalation to broader validation when required.

### REQ-ASSURE-001 — Assurance overrides optimization
Token, time, search, file and test budgets must never suppress context or proof required for correctness, security, integrity or a higher assurance obligation.

### REQ-ASSURE-002 — Truthful terminal states
Materialization/review must expose truthful terminal states such as ready, ready-with-gaps, blocked, source-conflict, evidence-invalid or equivalent governed outcomes rather than decorative success.

### REQ-ASSURE-003 — Exact-subject-state evidence
Where evidence depends on repository/configuration state, the product must bind proofs/verdicts to the exact subject state and detect relevant staleness.

### REQ-BROWN-001 — Brownfield first-class adoption
Existing projects must be adoptable without restarting planning, rewriting working architecture merely for naming conformity, discarding active work or requiring full historical normalization before receiving value.

### REQ-BROWN-002 — Brownfield truth mapping
Adoption must distinguish observed/implemented truth from approved/intended truth and represent unresolved drift explicitly rather than silently choosing one.

### REQ-BROWN-003 — Progressive governance maturity
Brownfield governance/optimization must be applicable progressively by domain/work area, with shadow assurance before aggressive proof/test skipping or reuse becomes authoritative.

### REQ-BROWN-004 — Early brownfield value
Before full normalization, adoption must be able to deliver baseline/identity, active-area source mapping, bounded context/search behavior, compact evidence/delta review, checkpoint continuity and safe shadow-mode optimization.

### REQ-PERF-001 — Token economy as measured requirement
The product must be able to measure or explicitly classify unavailable/estimated model-token cost across relevant stages such as source loading, prompt/execution, retries, review and correction.

### REQ-PERF-002 — Executor latency as measured requirement
The product must be able to measure or explicitly classify unavailable/estimated executor wall-clock/active duration and identify avoidable discovery, validation and retry contributors where observable.

### REQ-PERF-003 — Executor cognition minimization
The product must minimize unnecessary open-ended executor discovery/reasoning by supplying pre-resolved governed context and requiring escalation rather than unrestricted rediscovery when bounded assumptions fail.

### REQ-PERF-004 — Engineering ROI protection
Optimizations must be evaluated against end-to-end engineering cost and must not be accepted merely by moving cost from tokens into excessive validation, maintenance, review or defect risk.

### REQ-OBS-001 — Optimization telemetry
V1 must provide a reproducible path to capture or account for token cost, executor duration, repository discovery, validation effort, retries/corrections, review/evidence effort and proof/cache/carry-forward behavior where observable.

### REQ-OBS-002 — Targets vs measurements
The product must distinguish benchmark targets, estimates and measured outcomes. Unproven percentage improvements must never be reported as measured facts.

### REQ-PLAT-001 — GitHub first-class profile
V1 must define a first-class GitHub profile capable of using applicable PR/check/Actions/issues/ruleset/governance surfaces while representing unavailable permissions honestly.

### REQ-PLAT-002 — Core semantic portability
The independent core must not require GitHub-specific semantics when an equivalent version-controlled platform can satisfy repository identity, governed change/evidence and continuity contracts.

### REQ-PLAT-003 — Optional ecosystem adapters
UADS, Hive, UGAS and other integrations must remain optional adapters/profiles unless later explicitly admitted into core scope.

### REQ-FUNC-006 — Deterministic mechanical automation boundary
The product may support a thin CLI/script/tool layer for deterministic materialization, schema validation, fingerprinting, repository inspection and conformance receipts, but V1 must not require that tooling to become the semantic authority for product reasoning, scope admission, architecture choice or review.

### REQ-GOV-007 — Project roles contract
The product must represent the logical responsibilities of Project Owner, Planning Agent, Executor and Reviewer/Auditor without requiring those roles to be separate human accounts or separate models in every deployment.

### REQ-GOV-008 — Innovation preservation without automatic admission
Material technologies/ideas discovered during planning must be preservable with lifecycle/ownership metadata without becoming requirements merely because they were discussed or recorded.

## Cross-cutting verification principle
A requirement is not complete merely because a file or prompt mentions it. Each NECESSARY requirement must eventually map to:

```text
requirement ID
-> admitted Scope owner
-> architecture/contract implementation path where applicable
-> acceptance criterion
-> proof/evidence source
-> DoD obligation
```

Requirements without a verification path are incomplete specification.

## Explicit non-requirements at this stage
The following are deliberately not implied by this draft:
- a mandatory standalone CLI/runtime;
- a mandatory always-on service;
- a fixed programming language/framework;
- mandatory UADS/Hive/UGAS integration;
- mandatory GitHub semantics for all platforms;
- cross-project memory authority;
- universal percentage improvement guarantees;
- full brownfield normalization before use;
- a fixed final Source Capsule/Execution Pack JSON schema before owning modules design it.

## Questions to close before freeze
1. Which draft requirements are truly universal V1 NECESSARY versus profile/mode conditional?
2. Do Requirements themselves need priority/severity beyond Scope classification, or would that duplicate S03?
3. What minimum verification metadata should every REQ-* carry in V1 without making this document too heavy?
4. Should prompt compilation, review compilation and bootstrap materialization each receive a separate top-level requirement family?
5. Is deterministic tooling capability merely permitted, or should V1 explicitly require a tool-agnostic deterministic work-plane contract even if no CLI is shipped?
6. What requirements are missing for security, rollback/recovery, version upgrades and compatibility without prematurely designing their architecture?
7. At what point do we freeze the initial requirement set versus continuing to discover requirements module by module, and how should later legitimate requirements be admitted without destabilizing the baseline?

## Current direction
Requirements are converging on a small universal core plus explicit profile/mode-conditional obligations, with stable IDs, verification paths and no architecture-by-implication. The goal is to make every future Scope/DoD statement traceable to something objectively testable rather than to prose preference.
