# GBS-V12-WO-000 Source Admission Map

**State:** `PHASE_A_IN_PROGRESS`  
**Issue:** #367  
**Execution base:** `main@203dc6a86de035b8502453100ea6e2a4788cae57`  
**Archived research input:** `planning/gef-v12-research-dossier-001@c85cc91c899b553c1c37fe53ada236b8f76de3e2`

## 1. Source treatment

The 25 V1.2 research documents are preserved inputs, not canonical authority.

Current source precedence follows `.engineering/SOURCE-HIERARCHY.md`. Current checkpoint/provider evidence outranks stale planning-state prose. Historical records remain evidence of what was true at their time and are not rewritten.

## 2. Immediate source reconciliation

### Current facts
- current package: `1.1.2`;
- V1.1.2 state: `GBS_V11_1_1_2_PRODUCTION_ACCEPTED`;
- current main base for WO-000: `203dc6a86de035b8502453100ea6e2a4788cae57`;
- active Work Order before #367: none;
- archived V1.2 PR #344: closed without merge;
- archived planning commit: `c85cc91c899b553c1c37fe53ada236b8f76de3e2`;
- current actor model: Codex sole implementation/test/CI/migration author; owner exact-head semantic audit is recorded as `NOT_INDEPENDENT`;
- Hive integration: prohibited;
- required main checks: Repository validation, Pipeline integrity, Gitleaks secrets, Trivy filesystem and configuration.

### Stale research assumptions
The archived dossier contains historical statements that V1.1 was still in progress and PR #344 remained draft. Those statements are preserved historically but are not current V1.2 admission facts.

### Governance conflict requiring rewrite
Research candidate C07 describes an "independent ChatGPT exact-head audit". Active ADR-0008/AGENTS requires owner-operated exact-head semantic audit and explicitly prohibits labeling it independent. C07 must be rewritten before canonical admission.

### Backlog historical-row caveat
`.engineering/BACKLOG.md` contains historical table/accounting sections in which later modules can appear with earlier statuses such as `PLANNED`, while the current canonical checkpoint records the accepted production line as completed through M63. WO-000 must not infer current capability state from an isolated historical backlog row. Capability existence is resolved by current checkpoint plus exact implementation/evidence/API inspection.

## 3. Candidate catalog

### C-series universal candidate core

| ID | Research candidate | WO-000 provisional disposition | Existing-engine relationship to verify |
|---|---|---|---|
| C01 | Guided project discovery | RECONCILE | likely project/source planning extension; inspect current interview/adoption surfaces |
| C02 | Canonical project planning | RECONCILE_AS_EXTENSION | research explicitly points to M09-M15 and decision/scope engines |
| C03 | Approved visual experience | RECONCILE / POSSIBLE_NEW_PROFILE_LAYER | conditional on UI-bearing target app; no external SaaS requirement |
| C04 | Marathon Engine / critical-path orchestration | RECONCILE_AS_EXTENSION | research explicitly extends M14/M15/M17/M18/M63 |
| C05 | Bug Hunter / requirement-invariant proof | RECONCILE_AS_EXTENSION_OR_DELTA | integrate with evidence/proof/assurance/test-impact engines, avoid parallel proof store |
| C06 | Delta Assurance 2.0 / causal repair / flake control | RECONCILE_AS_EXTENSION | research explicitly extends M25/M26/M28 and existing assurance |
| C07 | Review/evidence | REWRITE_REQUIRED | must use current owner-operated `NOT_INDEPENDENT` audit model |
| C08 | Engineering Intelligence | RECONCILE_AS_EXTENSION | research explicitly extends M43/M45/M63 |
| C09 | Always-on reporting | RECONCILE_AS_EXTENSION | research explicitly extends M20/M21/M22/M23 |
| C10 | Default installer/profile router | RECONCILE | extend adoption/capability detection; profile selection remains owner-confirmed |
| C11 | Release/reproducibility | RECONCILE_AS_EXTENSION | reuse existing release/security/recovery/integrity engines |
| C12 | Operations feedback | RECONCILE | conditional deployed-app feedback over existing evidence/recovery/observability capabilities |

No row above is implementation-admitted. "Extension" means the research itself directs reuse of existing GEF engines and WO-000 must inspect released interfaces before deciding the exact delta.

### D-series conditional profiles

| ID | Profile | Default WO-000 disposition |
|---|---|---|
| D01 | Web frontend/API | CONDITIONAL_NOT_IN_DENOMINATOR |
| D02 | Data-heavy app | CONDITIONAL_NOT_IN_DENOMINATOR |
| D03 | SaaS subscription/usage | CONDITIONAL_NOT_IN_DENOMINATOR |
| D04 | SaaS enterprise/tenant | CONDITIONAL_NOT_IN_DENOMINATOR |
| D05 | Financial value movement | CONDITIONAL_HIGH_ASSURANCE |
| D06 | Web3 EVM | CONDITIONAL_HIGH_ASSURANCE |
| D07 | Web3 Solana | CONDITIONAL_HIGH_ASSURANCE |
| D08 | Web3 data security | CONDITIONAL_HIGH_ASSURANCE |
| D09 | Game 2D/3D | CONDITIONAL_NOT_IN_DENOMINATOR |
| D10 | Game multiplayer/MMO | CONDITIONAL_HIGH_ASSURANCE |
| D11 | Game + Web3 | CONDITIONAL_HIGH_ASSURANCE |
| D12 | AI-native target app | CONDITIONAL_RISK_AWARE |

A D-series item enters the release denominator only after a selected real pilot/profile and explicit owner-approved acceptance contract.

### R-series experimental/deferred

| ID | Research track | Default WO-000 disposition |
|---|---|---|
| R01 | Formal/symbolic/deep fuzz campaigns | EXPERIMENT_OR_FUTURE |
| R02 | ZK/FHE/TEE/MPC/PQ onchain research | EXPERIMENT_OR_FUTURE |
| R03 | Enterprise/global/multi-region/all-chain/large-MMO scale | FUTURE_UNLESS_REAL_WORKLOAD |
| R04 | Country-specific tax/regulated financial/compliance engines | OUTSIDE_CORE / SPECIALIST_REQUIRED |
| R05 | Framework/vendor swaps and ML bug prediction | EXPERIMENT_REQUIRES_MEASURED_ROI |

## 4. Archived research file manifest

All 25 files are input evidence frozen by the WO-000 Context Lock:

1. API-PERFORMANCE-AND-DECISION-INNOVATIONS.md
2. DOMAIN-ROUTER-AND-HYBRID-PROFILES.md
3. EXPERIMENTS-AND-DECISIONS.md
4. GAME-FACTORY-PROFILE.md
5. OPERATIONS-AND-RELEASE-INNOVATIONS.md
6. OPERATOR-RESPONSE-AND-FORECAST.md
7. PRODUCT-DISCOVERY-INTERVIEW.md
8. QUALITY-AND-TEST-STRATEGY.md
9. README.md
10. REMAINING-GAPS-AND-OPTIMIZATION-AUDIT.md
11. ROADMAP-AND-WORK-ORDERS.md
12. SAAS-FINANCE-FACTORY.md
13. SAAS-TENANT-AND-DATA-GOVERNANCE.md
14. SAAS-WEB3-CROSS-DOMAIN-AND-GAPS.md
15. SAAS-WEB3-REMAINING-AREAS.md
16. STARTUP-DEFAULT-PROFILE.md
17. THROUGHPUT-OPTIMIZATIONS.md
18. TOOLING-AND-GITHUB-SETUP.md
19. UI-UX-DESIGN-FACTORY.md
20. V12-CANDIDATE-ACCEPTANCE-AND-RELEASE-GATES.md
21. V12-CANDIDATE-SCOPE-FREEZE.md
22. V12-IDEA-CLOSURE-AND-HANDOFF.md
23. VISION-AND-ARCHITECTURE.md
24. WEB3-DATA-SECURITY.md
25. WEB3-FACTORY-PROFILE.md

Exact blob SHAs are recorded in `.engineering/context-locks/GBS-V12-WO-000.json`.

## 5. Provisional WO sequence from archived research

The research snapshot proposes:
- WO-000 admission/baseline/source freeze
- WO-001 Marathon Engine + context acceleration
- WO-002 Bug Hunter + contract/property/mutation proof
- WO-003 Delta Assurance + Flake/Causal Repair
- WO-004 Review/Evidence + GitHub hardening
- WO-005 Engineering Intelligence + supported app profiles
- WO-006 release assurance and promotion

This is a starting hypothesis only. WO-000 must reduce duplicate work against released 1.1.2 capabilities before these become canonical.

## 6. Phase A work still required

Before `GBS_V12_WO_000_SOURCE_AUDIT_READY_FOR_OWNER_DECISIONS`:
1. inspect released 1.1.2 interfaces/evidence for all engines named by the research;
2. classify C01-C12 into true delta versus existing behavior;
3. identify any research tool/vendor assumptions that are obsolete, unnecessary or unsupported;
4. determine which owner questions remain material after source reconciliation;
5. prepare the Codex read-only baseline execution brief;
6. record benchmark populations and comparability rules.

## 7. No progress inflation

The 25 research files, 12 C-items, 12 D-items and 5 R-items are not a V1.2 completion denominator.

Until WO-000 freezes canonical V1.2 Scope/DoD, release progress and ETA are:
- implementation progress: `NOT_YET_ADMITTED`;
- release denominator: `NOT_YET_FROZEN`;
- ETA: `NOT_YET_BASELINED`.

**Current stop:** `GBS_V12_WO_000_PHASE_A_SOURCE_RECONCILIATION_IN_PROGRESS`
