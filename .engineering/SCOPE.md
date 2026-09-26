# Scope

Status: `FROZEN`

## Binding
Scope is derived from `GBS-CONSTITUTION-v1.1`, frozen Project Overview, frozen Requirements and the Project Owner decision that GEF Bootstrap targets **one complete production version**, not a deliberately reduced V1/MVP slice.

Schedule pressure is not a valid reason to remove useful product capability. Completeness still requires governed admission, coherent ownership, testability, maintenance justification and alignment with product mission.

## Product release model
GEF Bootstrap is planned and built toward a **single complete production target** containing every capability that survives governed planning as coherent, useful, testable and justified.

There is no MVP-first or small-V1 strategy. Legacy `V1` wording in older IDs/documents is historical/internal naming and does not mean a deliberately reduced release. Canonical completion is `PRODUCTION_RELEASE_DONE`.

## Complete-target classification
- `CORE_REQUIRED` — required for correctness, governance, assurance, continuity, hybrid operation or production viability.
- `PRODUCT_INCLUDED` — part of the complete product because utility and engineering ROI justify permanent inclusion.
- `EXPERIMENTAL_GATED` — belongs to the complete product program but requires explicit evidence before production promotion.
- `OPTIONAL_ADAPTER` — supported integration/profile whose absence cannot block independent product completion.
- `OUT_OF_SCOPE` — conflicts with product identity, duplicates without value, belongs to another product or creates unjustified risk/complexity.

A capability is never deferred merely because it takes longer to build. `EXPERIMENTAL_GATED` exists for evidence maturity, not schedule pressure.

# Complete module classification

## Area A — Foundation & Governance
- `GBS-M00 Bootstrap Constitution` — `CORE_REQUIRED` — already complete.
- `GBS-M01 Deterministic Work Plane Kernel` — `CORE_REQUIRED`; stable ID retained from legacy `CLI Kernel`.
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
- `GBS-M30 GitHub Bootstrap` — `PRODUCT_INCLUDED`, reference hosted profile.
- `GBS-M31 GitHub Governance` — `PRODUCT_INCLUDED`.
- `GBS-M32 CI Bootstrap` — `PRODUCT_INCLUDED`.
- `GBS-M33 Release Governance` — `CORE_REQUIRED`, hosted-provider mechanics remain profile-owned.

## Area I — Security & Reliability
- `GBS-M34 Security Bootstrap` — `CORE_REQUIRED`.
- `GBS-M35 Policy Safety` — `CORE_REQUIRED`.
- `GBS-M36 Recovery Engine` — `CORE_REQUIRED`.
- `GBS-M37 Integrity Engine` — `CORE_REQUIRED`.

## Area J — Integrations
- `GBS-M38 Capability Detection` — `CORE_REQUIRED`.
- `GBS-M39 Reserved External Adapter Slot` — `OPTIONAL_ADAPTER`.
- `GBS-M40 Reserved Context Adapter Slot` — `OPTIONAL_ADAPTER`.
- `GBS-M41 UGAS Adapter` — `OPTIONAL_ADAPTER`.
- `GBS-M42 Generic Adapter API` — `PRODUCT_INCLUDED`.

## Area K — Observability
- `GBS-M43 Telemetry Engine` — `CORE_REQUIRED`.
- `GBS-M44 Audit Ledger` — `CORE_REQUIRED`.
- `GBS-M45 Baseline & Benchmark` — `CORE_REQUIRED`.

## Area L — Artifacts & UX
- `GBS-M46 Artifact Engine` — `PRODUCT_INCLUDED`.
- `GBS-M47 Interaction & Operator UX` — `PRODUCT_INCLUDED`; stable ID retained from legacy `CLI UX`. CLI may be one interface, never the product definition.
- `GBS-M48 Help System` — `PRODUCT_INCLUDED`.

## Area M — Distribution & Maintenance
- `GBS-M49 Distribution & Setup` — `CORE_REQUIRED`; stable ID retained from legacy `Installation`.
- `GBS-M50 Upgrade Engine` — `CORE_REQUIRED`.
- `GBS-M51 Compatibility Matrix` — `CORE_REQUIRED`.
- `GBS-M52 Self Doctor` — `PRODUCT_INCLUDED`.

## Area N — Quality
- `GBS-M53 Unit Test Framework` — `CORE_REQUIRED`.
- `GBS-M54 Integration Harness` — `CORE_REQUIRED`.
- `GBS-M55 GitHub Simulation` — `PRODUCT_INCLUDED` for the reference hosted profile.
- `GBS-M56 End-to-End Harness` — `CORE_REQUIRED`.
- `GBS-M57 Performance Benchmarks` — `CORE_REQUIRED`.
- `GBS-M58 Security Tests` — `CORE_REQUIRED`.

Architecture may share harness infrastructure to reduce duplication; proof obligations remain distinct.

## Area O — Documentation & Closure
- `GBS-M59 User Documentation` — `CORE_REQUIRED`.
- `GBS-M60 Engineering Documentation` — `CORE_REQUIRED`.
- `GBS-M61 Operational Runbooks` — `CORE_REQUIRED`.
- `GBS-M62 Production Acceptance` — `CORE_REQUIRED`; stable ID retained from legacy `V1 Final Acceptance`; terminal state is `PRODUCTION_RELEASE_DONE`.

## Area P — Engineering Efficiency
- `GBS-M63 Executor Performance Engine` — `CORE_REQUIRED` because token/time/executor efficiency is foundational.

## Classification summary
- `CORE_REQUIRED`: 47 modules.
- `PRODUCT_INCLUDED`: 14 modules.
- `OPTIONAL_ADAPTER`: 3 modules (`M39`, `M40`, `M41`).
- `EXPERIMENTAL_GATED`: applied primarily at technology/capability level rather than whole-module exclusion.
- `OUT_OF_SCOPE`: 0 current inventory modules.

Total inventory remains 64 modules. All useful module families remain in the complete product program; only ecosystem-specific adapters are non-blocking.

## Stable module reframes
| Stable ID | Legacy name | Complete-product name |
|---|---|---|
| `GBS-M01` | CLI Kernel | Deterministic Work Plane Kernel |
| `GBS-M47` | CLI UX | Interaction & Operator UX |
| `GBS-M49` | Installation | Distribution & Setup |
| `GBS-M62` | V1 Final Acceptance | Production Acceptance |

Historical references remain valid by ID. Files/folders may be renamed later through governed migration when Architecture determines the safest repository migration path.

## Advanced technology inclusion
The complete product includes the useful governed optimization families discovered so far, including Semantic Source Router, Canonical Fact Index, Authority Resolver, Source Capsule Compiler, Minimum Sufficient Context, Context Expansion Ladder, Context Sufficiency Proof, Repository Knowledge Map, Progressive Engineering Memory, Delta Context Capsule, Context Dedup Graph, Engineering ROI Governor, Knowledge Appreciation Metrics, Token Ledger, Executor Cognition Budget, Prompt Entropy Reducer, Execution Critical Path Map, Proof Carry-Forward Graph, HEDS Delta Review, Failure Fingerprint Memory, Negative Capability Cache and Architecture Question Cache.

## Experimental promotion gates
Advanced heuristic/learned mechanisms such as Context Temperature, predictive context prefetch, Source Entropy Score, advanced Adaptive Context Memory, heuristic Historical Context Eviction and cross-project learned-memory mechanisms remain `EXPERIMENTAL_GATED` until all applicable gates pass:

1. **Utility Gate** — representative benchmark/shadow evidence shows material reduction in token, latency, search, retry or review cost, or another approved product benefit.
2. **Assurance Gate** — no unacceptable regression in correctness, security, data integrity, source authority or required assurance.
3. **Validity/Stability Gate** — stale-state, invalidation, provenance and fallback behavior are defined and tested; uncertain state fails closed or degrades safely.
4. **Engineering ROI Gate** — recurring benefit justifies maintenance, complexity, telemetry, migration and context carrying cost.

A failed gate does not delete the technology. It remains recorded and may be redesigned/retested. A technology cannot be called production-ready merely because it exists in code.

## Profiles/platforms
The complete product must support:
1. local checked-out Git repository/filesystem as universal deterministic substrate;
2. GitHub as the **reference hosted profile**;
3. a generic version-control/platform abstraction sufficient for provider portability;
4. `NEW_PROJECT` mode;
5. `EXISTING_PROJECT/BROWNFIELD` mode;
6. representative project profiles covering at least JavaScript/TypeScript-style, Python-style and nontrivial brownfield repositories, refined later by Architecture/Test planning.

A second hosted provider such as GitLab or Bitbucket is **not mandatory** for `PRODUCTION_RELEASE_DONE`. Portability is proven by provider-neutral contracts plus the GitHub reference implementation and conformance tests that prevent GitHub-specific semantics from leaking into core.

## GitHub automation boundary
The GitHub profile includes governed repository discovery, branch/PR lifecycle, checks/status evidence, CI integration, issues/templates where relevant, ruleset/permission-gap reporting, release surfaces and exact-head evidence binding. Unavailable administrative permissions produce truthful gap/block states rather than fabricated success.

## Optional adapter packaging
`M39` and `M40` are reserved optional slots; `M41 UGAS` remains an optional adapter track over the Generic Adapter API. Optional adapter absence cannot block independent `PRODUCTION_RELEASE_DONE`.

An adapter may be advertised as shipped/supported only when its own compatibility, tests, documentation and evidence pass. The complete core release must work without any of the three installed or connected.

## Production quality boundary
The single production release requires semantic/governance conformance, deterministic work-plane correctness, unit/integration/E2E evidence, security/secret-safety, mutation recovery, compatibility/upgrade proof, brownfield preservation, GitHub-profile simulation/integration, token/time/performance benchmark path, user/engineering documentation, operational runbooks and exact-state production acceptance.

## Construction invariant
All GEF Bootstrap planning, implementation, tests, documentation, reviews, releases and production preparation are performed through ChatGPT and connected project tools. Codex is not an implementation executor for this repository.

## Out-of-scope product identities
- general-purpose IDE/editor;
- hard-coded AI planner replacing governed semantic/planning authority;
- always-on service solely for the sake of being a service;
- destructive normalization of healthy brownfield architecture for naming conformity;
- cross-project learned knowledge overriding local canonical truth;
- fabricated universal token/time improvement guarantees.

## Production baseline model
The progress denominator represents the **complete production target**.

Included in the main denominator:
- all `CORE_REQUIRED` modules;
- all `PRODUCT_INCLUDED` modules;
- any `EXPERIMENTAL_GATED` capability once explicitly admitted to production with a defined gate package.

Tracked separately:
- `OPTIONAL_ADAPTER` work, unless a specific release claim explicitly includes that adapter.

Module progress is weighted rather than counted equally. The baseline uses four 1–5 dimensions:
- `E` — implementation/planning effort;
- `R` — engineering/security/operational risk;
- `I` — integration/dependency breadth;
- `P` — proof/validation burden.

```text
RAW_WEIGHT = E + R + I + P
```

Each dimension must be evidence/rationale-backed during backlog baseline creation. Equal or arbitrary weights are prohibited. Architecture and DoD may refine scoring guidance, but changing the formula after baseline freeze requires governed recalibration with before/after impact recorded.

Overall production completion becomes valid only after:
1. Scope is FROZEN;
2. production DoD is FROZEN;
3. admitted backlog maps work to modules/requirements;
4. E/R/I/P weights are assigned and reviewed;
5. completed historical work is credited only with valid evidence.

Until those conditions hold, overall percentage remains `NOT_YET_BASELINED`.

## Frozen Scope decisions
1. Single complete production target, not MVP/small-V1.
2. All 64 inventory modules retained: 47 CORE_REQUIRED, 14 PRODUCT_INCLUDED, 3 OPTIONAL_ADAPTER.
3. Stable reframes: M01/M47/M49/M62 canonical names changed; IDs remain stable.
4. Ecosystem adapters are official, separately activatable and non-blocking.
5. Experimental technologies use Utility, Assurance, Validity/Stability and Engineering ROI production gates.
6. Hosted portability is provider-neutral core + GitHub reference profile; no second hosted provider is mandatory.
7. Production weighting uses E/R/I/P 1–5 additive raw weight and activates only with frozen DoD/backlog baseline.
8. Complete-product decision and supersession rationale are recorded in `ADR-0001-COMPLETE-PRODUCTION-TARGET.md`.

## Freeze audit
- single complete production target: PASS
- all 64 inventory modules classified: PASS
- counts reconcile to 64: PASS
- hybrid semantic + deterministic product preserved: PASS
- no schedule-based feature deferral: PASS
- optional integrations non-blocking: PASS
- experimental risk/ROI gates: PASS
- portability boundary: PASS
- weighted baseline method defined without fabricating current percentage: PASS
- stable module names synchronized with Master Module Index: PASS
- governed supersession ADR present: PASS
- ChatGPT-only Bootstrap implementation rule preserved: PASS
- Architecture not prematurely selected: PASS
- implementation not started: PASS
- remaining Scope closure questions: 0

STOP CONDITION: `READY_FOR_SCOPE_REVIEW_AND_CHECKPOINT`.
