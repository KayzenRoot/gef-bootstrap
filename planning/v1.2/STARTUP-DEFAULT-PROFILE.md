# V1.2 — Startup Default Profile and Bootstrap Activation Contract

Status: PROPOSED, NOT IMPLEMENTED. Must be admitted under future V1.2 Source Pack and released as a versioned profile only after V1.1 completion and all V1.2 proof gates. Installing today's GEF does NOT activate these future behaviors.

## Product owner goal
The startup should be able to install GEF on a new or an existing repository and automatically obtain: initial discovery interview, rigorous planning from canonical Source Pack, approved UX/design process where applicable, efficient long Codex execution packs, selective-but-safe tests, GitHub-first flow, consolidated ChatGPT audit and a consistent pt-BR project progress/ETA panel. Do not require manual copy/pasting master prompts or install every development tool globally.

## Proposed default profile manifest — conceptual, not a functioning config yet
```yaml
id: GEF_STARTUP_DEFAULT_V12
version: v1.2-candidate
status: PROPOSED_NOT_RELEASED
locale: pt-BR
owner_timezone: configured
project_mode: AUTO_DISCOVER
source_pack:
  new_project: CREATE_BEFORE_IMPLEMENTATION
  existing_project: PRESERVE_CURRENT_FLOW_UNTIL_OWNER_ADOPTION
  precedence: [CHECKPOINT, DECISIONS_ADRS, SCOPE, DEFINITION_OF_DONE, ARCHITECTURE, REQUIREMENTS]
interview:
  enabled_for_new_projects: true
  strategy: ADAPTIVE_GUIDED
  batch_size_target: 5-7
  ask_known_answer_again: false
  modes: [GUIDED, FAST, DEEP]
  freeze_owner_approved_decisions: true
design:
  front_end_applicability: DETECT_WITH_OWNER
  ask_brand_responsive_user_journeys_first: true
  visual_proposal_requires_owner_gate: true
  tokens_and_states_versioned: true
  accessibility_web_target: WCAG_2_2_AA_WHERE_APPLICABLE
  visual_regression_on_approved_baseline: true
executor:
  sole_code_author: CODEX
  marathon_packets: ADMITTED_DEPENDENCY_ORDERED_WAVES
  checkpoints_between_safe_waves: true
  retry_mode: FAILURE_FINGERPRINT_CAUSAL_RETEST
  stale_context_behavior: STOP_RECOMPILE
reviewer:
  role: CHATGPT_ARCHITECT_AUDITOR
  output_locale: pt-BR
  default_review: CONSOLIDATED_EXACT_HEAD
  high_assurance: REQUIRE_INDEPENDENT_EVIDENCE
validation:
  strategy: IMPACT_FIRST_MANDATORY_RISK_FLOOR
  test_skipping_optimizations: SHADOW_UNTIL_PROVEN
  final_release_gate: EXACT_HEAD_REQUIRED_FULL_ASSURANCE
github:
  mode: PRIMARY_OPTIONAL_DEVELOPMENT_PROFILE
  issues_work_orders: ISSUE_BACKED
  protected_main_mutations: ONLY_APPROVED_POLICY
  mandatory_checks: VERIFIED_ALWAYS_EMITTED_ONLY
  tools: PER_PROFILE_LEAST_PRIVILEGE
response:
  show_panel_on_substantive_development_turns: true
  default_density: COMPACT
  detail_on_review_release_or_request: true
  progress: EVIDENCE_ACCEPTED_WEIGHT_ONLY
  forecast: M22_GATED_EMPIRICAL_INTERVAL
  if_insufficient_sample: NOT_YET_BASELINED
  include_delta_and_next_legal_action: true
budget:
  optimize: ACCEPTED_USEFUL_PROGRESS_PER_EXECUTOR_HOUR
  prevent_paid_app_auto_install: true
  never_trade_quality_for_speed: true
  expose_observed_ci_cost_and_unknowns: true
```
Formal machine schema, install command and CLI switches must be chosen and implemented by Codex in an admitted future WO, consistent with current GEF CLI/config. This proposal is not copy/paste-installable code.

## Installation/adoption lifecycle (future implementation)
1. Use the actually released GEF init/adopt CLI, followed by future approved profile selection command/flag (exact interface selected later; DO NOT assume current CLI supports this manifest).
2. Verify local checkout, versions, current checkpoint, decisions, last accepted proof, repo permissions and whether project is governed. Do not modify existing governance without owner authorization.
3. NEW_PROJECT: start product interview and relevant design interview; record answers/assumptions/unknowns with stable references. EXISTING_PROJECT: import existing Source Pack and ask gap-only questions. Offer FAST mode while retaining decisions required by risk.
4. Generate/refresh Source Pack in canonical hierarchy and ask for only missing owner approvals. Create UI design/wireflow for apps requiring a UI and obtain owner design-direction approval before expensive implementation.
5. Build dependency-ordered Marathon Work Order and risk/proof matrix, establish benchmark plan, prepare issue and planning-only draft PR if meaningful; Codex implements once legal gates are satisfied.
6. Codex tests and corrects within bounded waves, commits, pushes and opens/updates implementation PR, preserving Evidence Bundle; GitHub runs actual verified checks.
7. ChatGPT audits candidate exactly, promotes checkpoint only after proof-based APPROVED, and returns progress/ETA panel in every substantive response. Unsuccessful or uncertain release gate is BLOCKED/CORRECTION_REQUIRED.
8. Release candidate requires real install/upgrade/recovery, real app smoke/preview where relevant, policy-mandated security/regression and objective completion metrics. V1.2 package itself must pass acceptance before profile is offered as functional.

## Resource and budget tiers
NO-EXTERNAL-SAAS (default): built-in Git/npm, native test runner, typecheck, existing verified GitHub Actions on supported public repos, local/free OSS lint/tests and local preview where applicable. Tool downloads require allowed repository and verified checksums.
FREE_PROVIDER_OPT_IN: SonarQube/Codecov/CodeRabbit/Greptile or optional design apps only after owner checks exact eligible free-plan terms, quota, privacy, permissions and matching current-head evidence. Missing free tier must not block core.
PAID_EXPLICIT_ONLY: enterprise scanners, paid build credits, visual cloud service, hosted remote caching or expensive inference never auto-installed/subscribed. Produce alternatives.

## Installer acceptance tests
- Fresh start with one-sentence app idea -> interview -> approved Source Pack -> visual direction where relevant -> admitted Codex pack -> evidence-bound progress report.
- Existing repo with prior approved roadmap -> gap-only questioning, baseline preserved, no silent source restructuring.
- UI-free backend -> no forced Storybook/Playwright/browser binaries.
- Existing approved UI library -> reuse; no needless redesign or paid Figma service.
- Public vs private repo -> valid billing/feature checks; no claims free private CI.
- Incomplete or contradictory source/checkpoint -> fail closed and propose exact owner decision, not auto-authorize.
- Fewer than 3 independent valid M22 temporal samples -> M21 accepted percent if proven, ETA NOT_YET_BASELINED.
- Profile uninstall/opt-out -> optional automation disabled cleanly; app runtime works independently of GitHub/GEF cloud or design provider.
- Cross-platform Windows/Linux/macOS under declared support matrix and accessibility/locale sanity checks.
- Documented security model, migration/recovery and backward compatibility before deployment validated.

## Proposed approval path
Future V1.2 WO-000 reconciles released V1.1 and freezes new profile's Scope/ADR and source authority. WO-001 extends orchestration; WO-004 integrates GitHub evidence and reporting; WO-005 should deliver installation profile, adaptive interview, UI design packs, M20-M23 panel and app pilots with risk-specific work slicing (final exact WO decomposition set only after source audit). WO-006 verifies completed profile on NEW_PROJECT and EXISTING_PROJECT pilots with quality benchmarks and real preview. Any gap prevents claiming the ready-to-install promise.
