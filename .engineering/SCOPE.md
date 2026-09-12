# Scope

Status: `IN_DISCUSSION`

## Binding
Scope is derived from `GBS-CONSTITUTION-v1.1`, frozen Project Overview, frozen Requirements and the Project Owner decision that GEF Bootstrap targets **one complete production version**, not a deliberately reduced V1/MVP slice.

The Master Module Index remains an inventory until this Scope freezes its classification, but schedule pressure is not a reason to remove valuable product capability.

## Product release model
GEF Bootstrap will be planned and built toward a **single complete production target** containing every capability that survives governed planning as coherent, useful, testable and justified.

There is no MVP-first or small-V1 strategy. Legacy `V1` wording in older IDs/documents remains a historical/internal label until cleanup, but it no longer means a deliberately reduced first release. The canonical completion target is the complete production release.

## Complete-target classification
- `CORE_REQUIRED` — required for product correctness, governance, assurance, continuity, hybrid operation or production viability.
- `PRODUCT_INCLUDED` — part of the complete product because utility and engineering ROI justify permanent inclusion.
- `EXPERIMENTAL_GATED` — remains in the same product plan but requires benchmark/shadow/safety evidence before production promotion.
- `OPTIONAL_ADAPTER` — supported integration/profile that cannot block independent core completion.
- `OUT_OF_SCOPE` — conflicts with product identity, duplicates another capability without value, belongs to another product or creates unjustified risk/complexity.

A capability is not deferred merely because it takes longer to build. `EXPERIMENTAL_GATED` exists for evidence maturity, not schedule pressure.

# Complete module classification

## Area A — Foundation & Governance
- `GBS-M00 Bootstrap Constitution` — `CORE_REQUIRED` — already complete.
- `GBS-M01 CLI Kernel` — `CORE_REQUIRED`, **REFRAME REQUIRED** → deterministic work-plane kernel/orchestrator. Stable ID preserved; CLI becomes one interface, not semantic authority.
- `GBS-M02 Configuration & Schema` — `CORE_REQUIRED`.
- `GBS-M03 Project Identity` — `CORE_REQUIRED`.
- `GBS-M04 Preflight & Discovery` — `CORE_REQUIRED`.

## Area B — Safe Bootstrap Engine
- `GBS-M05 Transactional Apply Engine` — `CORE_REQUIRED`.
- `GBS-M06 Filesystem Safety` — `CORE_REQUIRED`.
- `GBS-M07 Template Engine` — `PRODUCT_INCLUDED`.
- `GBS-M08 Project Profiles` — `CORE_REQUIRED`.

## Area C — Source Pack & Planning
- `GBS-M09 Source Pack Engine` — `CORE_REQUIRED`.
- `GBS-M10 Planning Workspace` — `CORE_REQUIRED`.
- `GBS-M11 Decision System` — `CORE_REQUIRED`.
- `GBS-M12 Scope & DoD Engine` — `CORE_REQUIRED`.

## Area D — GEF Engineering Model
- `GBS-M13 GEF Adoption Engine` — `CORE_REQUIRED`.
- `GBS-M14 Task & Context Compiler` — `CORE_REQUIRED`.
- `GBS-M15 Execution Pack Compiler` — `CORE_REQUIRED`.
- `GBS-M16 Policy & Guardrail Engine` — `CORE_REQUIRED`.

## Area E — Continuity
- `GBS-M17 Checkpoint Engine` — `CORE_REQUIRED`.
- `GBS-M18 Resume Engine` — `CORE_REQUIRED`.
- `GBS-M19 Project Registry` — `PRODUCT_INCLUDED`.
- `GBS-M20 Response Contract` — `PRODUCT_INCLUDED`.

## Area F — Progress & Estimation
- `GBS-M21 Progress Engine` — `CORE_REQUIRED`.
- `GBS-M22 Estimation Engine` — `PRODUCT_INCLUDED`.
- `GBS-M23 Project Status Engine` — `PRODUCT_INCLUDED`.

## Area G — Evidence & Review
- `GBS-M24 Evidence Engine` — `CORE_REQUIRED`.
- `GBS-M25 Proof Graph` — `CORE_REQUIRED`.
- `GBS-M26 HEDS Delta Review` — `CORE_REQUIRED`.
- `GBS-M27 Assurance Pipeline` — `CORE_REQUIRED`.
- `GBS-M28 Test Impact Engine` — `CORE_REQUIRED`.

## Area H — Git & GitHub
- `GBS-M29 Git Engine` — `CORE_REQUIRED`.
- `GBS-M30 GitHub Bootstrap` — `PRODUCT_INCLUDED`, first-class platform profile.
- `GBS-M31 GitHub Governance` — `PRODUCT_INCLUDED`.
- `GBS-M32 CI Bootstrap` — `PRODUCT_INCLUDED`.
- `GBS-M33 Release Governance` — `CORE_REQUIRED` for production, with GitHub-specific mechanics profile-owned.

## Area I — Security & Reliability
- `GBS-M34 Security Bootstrap` — `CORE_REQUIRED`.
- `GBS-M35 Policy Safety` — `CORE_REQUIRED`.
- `GBS-M36 Recovery Engine` — `CORE_REQUIRED`.
- `GBS-M37 Integrity Engine` — `CORE_REQUIRED`.

## Area J — Integrations
- `GBS-M38 Capability Detection` — `CORE_REQUIRED`.
- `GBS-M39 UADS Adapter` — `OPTIONAL_ADAPTER`.
- `GBS-M40 Hive Adapter` — `OPTIONAL_ADAPTER`.
- `GBS-M41 UGAS Adapter` — `OPTIONAL_ADAPTER`.
- `GBS-M42 Generic Adapter API` — `PRODUCT_INCLUDED`.

## Area K — Observability
- `GBS-M43 Telemetry Engine` — `CORE_REQUIRED`.
- `GBS-M44 Audit Ledger` — `CORE_REQUIRED`.
- `GBS-M45 Baseline & Benchmark` — `CORE_REQUIRED`.

## Area L — Artifacts & UX
- `GBS-M46 Artifact Engine` — `PRODUCT_INCLUDED`.
- `GBS-M47 CLI UX` — `PRODUCT_INCLUDED`, **REFRAME REQUIRED** → deterministic interaction/interface UX. CLI remains a likely concrete interface but not the product definition.
- `GBS-M48 Help System` — `PRODUCT_INCLUDED`.

## Area M — Distribution & Maintenance
- `GBS-M49 Installation` — `CORE_REQUIRED`, **REFRAME REQUIRED** → distribution/setup/adoption of the hybrid product, not generic runtime installation assumptions.
- `GBS-M50 Upgrade Engine` — `CORE_REQUIRED`.
- `GBS-M51 Compatibility Matrix` — `CORE_REQUIRED`.
- `GBS-M52 Self Doctor` — `PRODUCT_INCLUDED`.

## Area N — Quality
- `GBS-M53 Unit Test Framework` — `CORE_REQUIRED`.
- `GBS-M54 Integration Harness` — `CORE_REQUIRED`.
- `GBS-M55 GitHub Simulation` — `PRODUCT_INCLUDED` for the first-class GitHub profile.
- `GBS-M56 End-to-End Harness` — `CORE_REQUIRED`.
- `GBS-M57 Performance Benchmarks` — `CORE_REQUIRED`.
- `GBS-M58 Security Tests` — `CORE_REQUIRED`.

These modules may share harness infrastructure in Architecture to reduce duplication, but their proof obligations remain distinct.

## Area O — Documentation & Closure
- `GBS-M59 User Documentation` — `CORE_REQUIRED`.
- `GBS-M60 Engineering Documentation` — `CORE_REQUIRED`.
- `GBS-M61 Operational Runbooks` — `CORE_REQUIRED`.
- `GBS-M62 V1 Final Acceptance` — `CORE_REQUIRED`, **REFRAME REQUIRED** → Complete Production Acceptance / `PRODUCTION_RELEASE_DONE`. Stable ID preserved.

## Area P — Engineering Efficiency
- `GBS-M63 Executor Performance Engine` — `CORE_REQUIRED` because token/time/executor efficiency is a foundational product objective.

## Classification summary
- `CORE_REQUIRED`: 47 modules.
- `PRODUCT_INCLUDED`: 14 modules.
- `OPTIONAL_ADAPTER`: 3 modules (`M39`, `M40`, `M41`).
- `EXPERIMENTAL_GATED`: currently handled primarily at technology/capability level rather than whole-module exclusion.
- `OUT_OF_SCOPE`: 0 existing inventory modules at this stage; out-of-scope product identities remain listed below.

Total inventory remains 64 modules. The complete production plan therefore retains the entire useful module inventory, with only ecosystem-specific adapters non-blocking.

## Advanced technology policy
Previously `IMPORTANT`/`FUTURE` technologies are no longer deferred merely for release speed. They are reassessed as `PRODUCT_INCLUDED` or `EXPERIMENTAL_GATED`.

Likely `PRODUCT_INCLUDED` families include:
- Semantic Source Router;
- Canonical Fact Index;
- Authority Resolver;
- Source Capsule Compiler;
- Minimum Sufficient Context;
- Context Expansion Ladder;
- Context Sufficiency Proof;
- Repository Knowledge Map;
- Progressive Engineering Memory;
- Delta Context Capsule;
- Context Dedup Graph;
- Engineering ROI Governor;
- Knowledge Appreciation Metrics;
- Token Ledger;
- Executor Cognition Budget;
- Prompt Entropy Reducer;
- Execution Critical Path Map;
- Proof Carry-Forward Graph;
- HEDS Delta Review;
- Failure Fingerprint Memory;
- Negative Capability Cache;
- Architecture Question Cache.

Likely `EXPERIMENTAL_GATED` families include:
- Context Temperature;
- predictive context prefetch;
- Source Entropy Score;
- advanced Adaptive Context Memory;
- Historical Context Eviction when heuristics, rather than deterministic supersession, drive removal;
- any cross-project learned-memory mechanism until provenance/security/contamination controls are proven.

Experimental-gated capabilities remain in the complete product program with explicit evidence gates. They are not pushed to a hypothetical later version merely because they are difficult.

## Profiles/platforms for the complete product
Minimum complete distribution should support:
1. local checked-out Git repository/filesystem as universal deterministic substrate;
2. GitHub as first-class hosted profile;
3. generic version-control/platform abstraction sufficient for portability and future adapters;
4. NEW_PROJECT mode;
5. EXISTING_PROJECT/BROWNFIELD mode;
6. representative project profiles sufficient to validate genericity, including at least one JavaScript/TypeScript-style project, one Python-style project and one repository with nontrivial brownfield structure, subject to Architecture/Test refinement.

Additional hosted-platform adapters can remain profile additions unless the complete-product test plan proves another is required for portability confidence.

## GitHub automation boundary
For the complete product, GitHub profile support includes governed repository discovery, branch/PR lifecycle, checks/status evidence, CI integration, issues/templates where relevant, ruleset/permission gap reporting, release surfaces and exact-head evidence binding. Administrative actions unavailable to the active connector/profile must report `READY_WITH_GAPS` or equivalent, never fabricated success.

## Production quality boundary
The single complete release requires:
- semantic/governance conformance;
- deterministic work-plane correctness;
- unit/integration/E2E coverage;
- security tests and secret-safe behavior;
- mutation recovery tests;
- compatibility/upgrade tests;
- brownfield preservation tests;
- GitHub-profile simulation/integration evidence;
- performance/token/latency benchmark path;
- documentation and operational runbooks;
- final exact-state production acceptance.

## Integration boundary
UADS, Hive and UGAS adapters may ship if they are ready, but remain `OPTIONAL_ADAPTER` and cannot block the independent product's `PRODUCTION_RELEASE_DONE`. Their functionality and tests are required only when that adapter is claimed as shipped/supported.

## Construction invariant
All GEF Bootstrap planning, implementation, tests, documentation, reviews, releases and production preparation are performed through ChatGPT and connected project tools. Codex is not an implementation executor for this repository.

## Out-of-scope product identities
- general-purpose IDE/editor;
- hard-coded AI planner replacing the governed semantic/planning role;
- always-on service solely for the sake of being a service;
- destructive normalization of healthy brownfield architecture for naming conformity;
- cross-project learned knowledge overriding local canonical truth;
- fabricated universal token/time improvement guarantees.

## Baseline implications
The progress denominator will be based on the **complete production target**, not a cut-down release. `CORE_REQUIRED` and `PRODUCT_INCLUDED` work count toward the production baseline. `OPTIONAL_ADAPTER` work is tracked separately unless an adapter is explicitly included in the release claim. `EXPERIMENTAL_GATED` work counts once admitted to the production target with a defined promotion gate.

Weights must reflect engineering effort/risk and proof burden rather than equal module counts, so a tiny documentation helper cannot weigh the same as the deterministic apply/recovery engine or assurance pipeline. The exact weighting method is finalized with DoD/backlog planning.

## Remaining Scope decisions before freeze
1. Freeze the exact module renames/reframes for M01, M47, M49 and M62 while preserving IDs.
2. Decide whether the three optional ecosystem adapters ship in the first complete production artifact or remain separately installable/supported packages.
3. Freeze the precise experimental promotion gates for the advanced context/memory heuristics.
4. Decide whether another hosted VCS platform must be implemented in the complete release or whether the generic abstraction + GitHub reference profile sufficiently proves portability.
5. Freeze the production weighting model together with DoD/backlog.

## Current decision
GEF Bootstrap targets **one complete, production-quality hybrid product**. The plan keeps all 64 useful inventory modules in the program, with three ecosystem-specific adapters non-blocking and advanced uncertain heuristics evidence-gated rather than schedule-deferred.

STOP CONDITION: `READY_FOR_COMPLETE_SCOPE_CLOSURE_DECISIONS`.
