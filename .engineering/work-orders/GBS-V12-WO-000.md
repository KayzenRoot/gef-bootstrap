# GBS-V12-WO-000 - V1.2 source admission, baseline and scope freeze

**Issue:** #367  
**State:** `CANONICAL_SOURCE_PACK_READY_FOR_OWNER_AUDIT / NO_IMPLEMENTATION`  
**Execution base:** `main@203dc6a86de035b8502453100ea6e2a4788cae57`  
**Base tree:** `6b66139b7df03c0041a0c785057afb29d9a47428`  
**Current package:** `1.1.2`  
**Current release state:** `GBS_V11_1_1_2_PRODUCTION_ACCEPTED`

## Objective

Translate the preserved V1.2 research dossier into a finite, evidence-based canonical V1.2 admission proposal.

WO-000 performs:
1. source and capability reconciliation against released V1.1.2;
2. reproducible V1.1.2 benchmark/baseline planning and execution evidence;
3. classification of candidate V1.2 concepts into canonical core, conditional profile, experiment/defer or rejected/duplicate;
4. capture of only owner decisions that materially change the release denominator or risk gates;
5. proposal of canonical V1.2 Scope, Requirements, Architecture, Security, Test/Benchmark Plan, Deployment, DoD and Decision/ADR deltas;
6. exact-head owner audit before any V1.2 source promotion.

**No product/runtime implementation is authorized by WO-000.**

## Preserved research input

Research source is archived, not canonical:
- historical PR #344, closed without merge;
- branch `planning/gef-v12-research-dossier-001`;
- exact commit `c85cc91c899b553c1c37fe53ada236b8f76de3e2`;
- exactly 25 Markdown files under `planning/v1.2/**`;
- current handoff: `.engineering/handoffs/V1.2-NEXT-STATE.md`.

Never merge the stale research branch into current main.

## Canonical authority for WO-000

Resolve all conflicts through `.engineering/SOURCE-HIERARCHY.md`.

Exact current fingerprints are frozen in the WO-000 Context Lock for:
- `AGENTS.md`;
- canonical checkpoint;
- Source Hierarchy;
- Scope;
- Definition of Done;
- Architecture;
- Requirements;
- Security;
- Test Benchmark Plan;
- Deployment;
- Decisions Ledger;
- ADR-0007 and ADR-0008;
- package manifest;
- active Main Branch Protection required contexts.

## Research catalog to reconcile

### Universal candidate core C01-C12

The archived Scope Freeze labels the following as universal proposed core, subject to technical admission:
- C01 Guided project discovery
- C02 Canonical project planning
- C03 Approved visual experience
- C04 Marathon Engine / critical-path orchestration
- C05 Bug Hunter and requirement/invariant proof
- C06 Delta Assurance 2.0, causal repair and flake control
- C07 Review/evidence contract
- C08 Engineering Intelligence
- C09 Always-on reporting
- C10 Default installer and profile router
- C11 Release and reproducibility
- C12 Operations feedback

WO-000 must prove whether each is:
`NECESSARY_CORE`, `REWRITE_AS_EXISTING_ENGINE_EXTENSION`, `CONDITIONAL`, `FUTURE`, or `OUT_OF_SCOPE`.

No C-item receives implementation credit from the research snapshot.

### Conditional domain packs D01-D12

- D01 Web frontend/API
- D02 Data-heavy app
- D03 SaaS subscription/usage
- D04 SaaS enterprise/tenant
- D05 Financial value movement
- D06 Web3 EVM
- D07 Web3 Solana
- D08 Web3 data security
- D09 Game 2D/3D
- D10 Game multiplayer/MMO
- D11 Game + Web3
- D12 AI-native target app

Default disposition in WO-000: `CONDITIONAL_NOT_IN_RELEASE_DENOMINATOR` until an owner-approved pilot/profile requires it.

### Experimental/deferred tracks R01-R05

R01-R05 remain `EXPERIMENT_OR_FUTURE` by default:
formal/deep symbolic proof, advanced confidential/onchain compute, enterprise/global scale, regulated/compliance-specific engines and framework/vendor swaps.

They do not block the core V1.2 admission unless a concrete risk requirement proves otherwise.

## Known source reconciliation findings

1. Archived V1.2 text repeatedly says V1.1 is still in progress. Current canonical state is V1.1.2 `PRODUCTION_ACCEPTED`.
2. Archived PR #344 is no longer DRAFT. It is closed without merge and preserved only as research history.
3. Candidate C07 uses language implying an independent ChatGPT exact-head review. Current ADR-0008/AGENTS requires an owner-operated exact-head semantic audit and explicitly records it as `NOT_INDEPENDENT`. Any canonical C07 must be rewritten to current authority.
4. The retired integration family governed by ADR-0007 remains prohibited.
5. Codex remains the sole author of implementation code, tests, CI/build corrections and migrations. ChatGPT authors approved governance/planning artifacts, coordinates GitHub and performs the owner exact-head audit workflow.
6. Main Branch Protection currently requires exactly `Repository validation`, `Pipeline integrity`, `Gitleaks secrets`, and `Trivy filesystem and configuration`.
7. Current package manifest remains `1.1.2`; WO-000 must not change release/package identity.

## Phase A - source and capability audit

For all 25 archived research files:
- compare claims and assumptions to current V1.1.2;
- map each proposal to M00-M63 and released 1.1.x capabilities;
- identify duplicate engine proposals;
- identify true deltas;
- record stale provider/branch/version claims;
- record contradictions with active Decisions/ADRs;
- preserve accepted historical evidence without rewriting it.

Output:
- `.engineering/v1.2/GBS-V12-WO-000-SOURCE-MAP.md`
- owner-decision queue containing only unresolved material choices.

Phase A stop:
`GBS_V12_WO_000_SOURCE_AUDIT_READY_FOR_OWNER_DECISIONS`

## Phase B - reproducible V1.1.2 baseline

Codex may execute read-only/reproducible benchmark and test commands on a pinned checkout. It may create only WO-000 evidence/benchmark artifacts explicitly admitted by a later execution brief. It must not change runtime/product behavior.

Measure where reproducible:
- new-project startup/bootstrap path;
- brownfield adoption path;
- representative governed Work Order path;
- relevant M14/M15/M25-M28/M43/M45/M63 behavior;
- wall-clock and CI/runtime cost;
- proof reuse;
- flake/retry rate;
- current security/audit baseline;
- representative small/large workload cohorts.

No invented speedup percentage. If populations are not comparable, record `NOT_COMPARABLE`. If insufficient samples exist, record `NOT_YET_BASELINED`.

## Phase A/B evidence checkpoint

Source audit and baseline are complete enough to enter the owner decision gate:
- archived research audited: 25/25;
- released engine overlap classified for C01-C12;
- conditional/experimental boundaries preserved for D01-D12/R01-R05;
- V1.1.2 baseline quality gate passed;
- full validation: 1632/1632;
- focused baseline: 84/84;
- CLI ROI: NO_CHANGE / COMPARABLE;
- brownfield timing: NOT_YET_BASELINED;
- no V1.2 implementation or performance claim exists.

Checkpoint: `GBS_V12_WO_000_SOURCE_AUDIT_READY_FOR_OWNER_DECISIONS`

## Phase C - short owner blocking-decision interview

Ask only decisions that change release scope/risk:
1. first end-to-end V1.2 pilot profile;
2. core-only release versus core plus selected reference profile packs;
3. first Web3 chain only if a Web3 profile is selected;
4. first game engine/platform only if a game profile is selected;
5. paid validation/tooling/CI budget;
6. qualified independent specialist-review trigger for high-risk smart-contract, financial-value, custody or privileged operations.

Do not guess these answers.

## Phase D - canonical V1.2 Source Pack proposal

Prepare proposed V1.2 deltas, never by silently rewriting historical accepted source:
- Scope
- Requirements
- Architecture
- Security
- Test/Benchmark Plan
- Deployment
- Definition of Done
- Decisions/ADRs
- finite release denominator
- profile support matrix
- migration/adoption contract where needed
- execution sequence.

The research snapshot's provisional sequence is the starting hypothesis:
- WO-001 Marathon Engine + context acceleration
- WO-002 Bug Hunter + contract/property/mutation proof
- WO-003 Delta Assurance + Flake/Causal Repair
- WO-004 Review/Evidence + GitHub hardening, rewritten to current NOT_INDEPENDENT owner audit model
- WO-005 Engineering Intelligence + supported app profiles
- WO-006 release assurance and promotion

WO-000 may change this decomposition only when capability overlap or release-risk evidence justifies it.

## Phase D proposal completion

Owner decisions V12-D001 through V12-D005 are captured and the full reviewable Source Pack proposal exists under `.engineering/v1.2/proposed/`.

Proposed package:
- Source Pack Delta
- Scope
- Requirements
- Architecture
- Security
- Test/Benchmark Plan
- Deployment
- Definition of Done
- Decisions
- Profile Matrix
- Work Order Sequence

Internal consistency review confirms:
- WEB_APP_API is the only profile-level core release blocker;
- WEB3_EVM is second priority and non-core-release-blocking;
- LOCAL_FREE_FIRST remains the default tooling budget;
- specialist review remains additive for approved high-risk production classes;
- no second canonical context/execution/proof/status/release engine is proposed;
- no archived research branch becomes an implementation base;
- no implementation is authorized by this proposal.

Checkpoint: `GBS_V12_WO_000_CANONICAL_SOURCE_PACK_READY_FOR_OWNER_AUDIT`

## Phase E - admission gate

WO-000 may reach terminal admission only after:
- Source Pack deltas are finite and source-consistent;
- owner choices are recorded;
- baseline evidence is reproducible;
- exact-head checks pass;
- CRITICAL/HIGH blockers are zero;
- owner exact-head audit is `APPROVED / NOT_INDEPENDENT`;
- checkpoint promotion is separately reviewed.

Terminal WO-000 state:
`GBS_V12_WO_000_ADMITTED_NO_IMPLEMENTATION`

This terminal state allows preparation/admission of WO-001. It does not authorize WO-001 implementation by itself.

## Prohibited

- product/runtime implementation;
- implementation code/test/CI/migration edits by ChatGPT;
- stale PR #344 merge/revival as implementation base;
- V1/V1.1 history rewrite;
- `v1.1.2` tag movement or npm republish;
- required-check/threshold weakening;
- reintegration of the retired integration family prohibited by ADR-0007;
- unbounded feature ideation;
- guessed owner choices;
- V1.2 completion percentage derived from planning docs or file count.

## Acceptance criteria

- [ ] All 25 research files indexed by exact archived blob.
- [ ] C01-C12 each receive a source-backed final disposition.
- [ ] D01-D12 each receive a conditional admission/defer disposition.
- [ ] R01-R05 each receive an experiment/future/out-of-scope disposition.
- [ ] Every proposed new engine is checked for duplication against current GEF capability.
- [ ] V1.1.2 baseline evidence is reproducible or explicitly unavailable.
- [ ] Owner blocking decisions are recorded.
- [ ] Canonical V1.2 Source Pack delta is finite.
- [ ] Required exact-head checks pass.
- [ ] CRITICAL/HIGH = 0.
- [ ] Owner exact-head audit recorded.
- [ ] No implementation change entered this WO.

## STOP CONDITIONS

Intermediate: `GBS_V12_WO_000_SOURCE_AUDIT_READY_FOR_OWNER_DECISIONS`

Admission-ready: `GBS_V12_WO_000_CANONICAL_SOURCE_PACK_READY_FOR_OWNER_AUDIT`

Terminal: `GBS_V12_WO_000_ADMITTED_NO_IMPLEMENTATION`
