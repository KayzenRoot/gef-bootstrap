# GEF Bootstrap 1.2 — Research Dossier (planning only)

**Status:** OWNER-REQUESTED IDEAS RECORDED / CANDIDATE FOR FUTURE ADMISSION. This is a proposed future release, NOT an approved canonical V1.2 Scope, frozen ADR, implementation Work Order, production claim or change to V1.1.
**Planning record ID:** GBS-V12-RESEARCH-001. **Date:** 2026-09-29.
**Source-check reference:** main f6738292c038eb6f0d08d1d32b3752c5c7dc417a; release/1.1 f3b9ce62fe4e7a4ef64e5ad36e4569cecca658be at first inspection. Recheck all moving refs at V1.2 admission.

## Purpose
Capture the owner's proposal to make GEF the startup's high-reliability application-building flagship: much more useful work per long Codex execution, fewer manual review interruptions, fast targeted tests and aggressive defect discovery WITHOUT relaxing evidence, security, correctness or existing decisions. Preserve all ideas from the preceding owner discussion and add engineering experiments.

## Current-state constraints and source precedence
1. On main, V1 production is accepted historically at 1088/1088. Never convert that to V1.2 progress.
2. V1.1 is separately governed, IN PROGRESS. Its current checkpoint retains release-gate concerns; its earlier PR #278 was closed without merge, so reconcile actual successor/closure receipts instead of blindly repeating stale instructions. Forward-port of Codex governance is pending or being reconciled separately (PR #341 at research time).
3. Approved D-0062/ADR-0007 retires Hive-specific development and product integration. Do NOT reintroduce Hive as a dependency or adapter. M40 stays neutral/reserved.
4. Approved D-0063/ADR-0008: Codex alone authors or corrects implementation code, tests, fixtures, CI, build scripts and migrations; ChatGPT performs architecture, planning, canonical governance docs, GitHub issue/Work Order preparation and objective evidence-based audit. Never treat Codex self-check as independent assurance.
5. The existing acceleration contract, M14 Context Compiler, M15 Execution Pack Compiler, M17/M18 continuity, M24/M25 evidence/proof graph, M26 delta review, M27 assurance, M28 test impact, M43/M45 observability and M63 executor performance MUST be reused; proposed V1.2 features are deltas or adapters, not parallel rebuilds.
6. Do not rewrite the V1/V1.1 source of truth, main checkpoints, rulesets or release tags in this research PR. A planning draft PR records ideas, not approval to implement.
7. Future V1.2 starts only after evidenced V1.1 Production Acceptance, exact-head security/quality gates, proper branch reconciliation and owner-governed admission.

## Document map
- VISION-AND-ARCHITECTURE.md: behavioral design, 14 proprietary mechanism proposals, invariants, boundaries and experience.
- QUALITY-AND-TEST-STRATEGY.md: risk matrix, smart test scheduling, fault discovery, anti-flake, shadow proof and hard release gates.
- TOOLING-AND-GITHUB-SETUP.md: baseline tools vs new/free candidates, step-by-step owner/Codex setup checklist, costs and security.
- ROADMAP-AND-WORK-ORDERS.md: classified scope, planned large Work Orders, stage-gates, handoff, benchmark and Definition-of-Done candidate.
- EXPERIMENTS-AND-DECISIONS.md: experiments, measurable gates, research dependencies, non-goals and decisions still requiring formal admission.
- OPERATOR-RESPONSE-AND-FORECAST.md: always-visible pt-BR evidence dashboard, M21/M22/M23 integration, correct percentages and conditional empirical ETA.
- PRODUCT-DISCOVERY-INTERVIEW.md: adaptive guided/fast/deep product interview, canonical question/answer capture, scope and owner-approved visual discovery.
- UI-UX-DESIGN-FACTORY.md: discovery-to-wireflow-to-design-token-to-working-preview pipeline, open-source component/browser/a11y/visual tests and design approval.
- THROUGHPUT-OPTIMIZATIONS.md: 18 additional high-leverage research candidates for critical path, vertical slices, deterministic caches, proof-aware CI and low-rework delivery.
- STARTUP-DEFAULT-PROFILE.md: future installer/adoption default activating interview, design, Codex Marathon packs, quality gates and progress reporting when V1.2 is objectively ready.
- OPERATIONS-AND-RELEASE-INNOVATIONS.md: six additional deployment/operations extensions, including Production Radar, Data Guardian, Release Guardian, artifact provenance and reproducible environments.
- API-PERFORMANCE-AND-DECISION-INNOVATIONS.md: eight further API/performance/decision/app-launch ideas with Schemathesis, k6, Lighthouse CI and optional AI-target-app assurance.

## Proposed outcomes (NOT measured claims)
- Higher objectively accepted useful progress per Codex hour and per execution, without oversized unreviewable diffs.
- Better detection of semantic, boundary, race, security, persistence, contract, workflow and cross-platform failures.
- Reduced duplicate CI work via validity-bound proof receipts and changed-surface tests, while maintaining exact-head release assurance.
- Minimal repeated discovery and prompt exchange via a single GitHub-first Work Order with ordered execution waves.
- Automatic narrow correction by Codex and ChatGPT consolidated audit at natural, traceable review boundaries.
- Profile-aware application bootstrap for new and brownfield TypeScript/Node, web, API, database and other stacks through adapter contracts rather than blanket dependencies.

## Proposal admission procedure
A. Freeze and audit V1.1; re-read real checkpoint, Scope, DoD, Architecture, Decisions Ledger, tests, CI and release receipt; reconcile main/release lineage by commit SHA.
B. Make a measured V1.1 benchmark baseline and capability inventory, including false-positive and escaped-defect measurement.
C. Classify each proposal as NECESSARY, IMPORTANT, FUTURE or OUT_OF_SCOPE. Only NECESSARY is automatically admitted. Experimental shortcuts stay SHADOW until measured.
D. Issue V1.2 canonical Source Pack delta/ADRs and acceptance criteria in the approved source hierarchy; do not overwrite accepted historical decisions.
E. Admit individually identified V1.2 implementation Work Orders. ChatGPT creates issue and precise planning-only diffs. Codex implements after Context Lock/preflight; ChatGPT audits exact SHA; only proven checkpoint deltas can be promoted.
F. Complete all release DoD gates, evidence-bound benchmarks, independently required review, deployment/installation tests and rollback proof before declaring V1.2 complete.

## Safety bar
No claim of zero bugs or guaranteed speed-up. Any missed HIGH/CRITICAL blocker by selective testing demotes the corresponding optimization to SHADOW and requires root-cause repair. No quiet acceptance of stale PASS receipts, unsupported tools, unavailable billing claims, fabricated test results, auto-generated architectural decisions or unattended destructive merges.

## Owner expansion — adaptive interview, visual quality and visible progress
The owner requested a consistent progress/forecast panel in every substantive construction response, adaptive interviews about the actual application and front-end preferences, rigorously verified UI delivery, fast critical-path construction and default activation through the eventually installed V1.2 startup profile. The five owner-expansion documents increased the original six-file dossier to eleven planning files. These are research/draft artifacts and do not grant V1.2 production, installation or implementation credit. M20–M23/M43/M45 and the existing architecture must be extended rather than replaced. Forecasts require valid M22 historical measurements; unsupported dates must show NOT_YET_BASELINED.

## Further research expansion — application operability and launch quality
The owner's request for still more innovation added two planning files to the prior eleven-document pack (now **thirteen research documents**): release/operations/data safety and API/performance/decision intelligence. These include fourteen additional candidate capabilities, but they are NOT necessarily fourteen new GEF engines or mandatory installs; duplicate-free adaptation of accepted engines is preferred and owner admission/benchmarks decide final scope. The current GEF binary does not implement these ideas, and the research PR does not modify active V1.1 workflows, package manifests, protected main or release tags.

## Domain-profile research additions
- WEB3-FACTORY-PROFILE.md: EVM/Solana architectures, smart-contract testing, wallets and approved deployment safety.
- GAME-FACTORY-PROFILE.md: browser and multiplayer game technology, server authority, gameplay/asset/visual proof and game-performance testing.
- DOMAIN-ROUTER-AND-HYBRID-PROFILES.md: evidence-based detection, domain-specific setup, app interviews, and optional combined game plus Web3 profiles.
- REMAINING-GAPS-AND-OPTIMIZATION-AUDIT.md: high-value open research decisions, release-scope control and representative validation experiments.

Total versioned research files before the SaaS/financial expansion: 17. These are candidate documents, not an approved 17-module scope. Domain toolchains are installed only if the corresponding owner-approved future profile requires them. Current GEF and V1.1 are unchanged.

## SaaS financial and Web3 data security research expansion
Four additional documents respond to the owner's request for complete SaaS financial operations, new privacy/security approaches for Web3 and an explicit audit of any neglected product areas. The research dossier now contains **22 versioned files**, not 21 released modules.
- SAAS-FINANCE-FACTORY.md: risk-classified subscriptions, usage-based monetization, financial ledger if needed, webhook orchestration, reconciliation, fraud controls, per-tenant unit economics and legal/accounting handoff. Candidates Lago, OpenMeter, Formance and Temporal are selected by risk/ROI, not installed wholesale.
- SAAS-TENANT-AND-DATA-GOVERNANCE.md: SaaS data isolation from API to RLS, cache/vector/queues, identities, MFA/passkeys, privacy lifecycle, encryption/backup and customer security evidence.
- WEB3-DATA-SECURITY.md: public-chain/offchain confidentiality, HSM/KMS/threshold authority, trusted signing intent, confidential proof/FHE pilot, economic risk, governance and cryptographic agility.
- SAAS-WEB3-REMAINING-AREAS.md: product/legal/fiscal classification, revenue operations, go-to-market/onboarding, disaster readiness, cross-border/treasury, transaction metadata, oracles/bridges, formal methods and cost-of-quality research.
All four are FUTURE CANDIDATE profiles; no new tools or financial/chain operations are authorized. Their admission must occur after the V1.1 production release evidence and formal V1.2 Source Pack decision, benchmarking and owner confirmation. Privacy/compliance documents are issue-spotting aids, not legal/tax/accounting or audit certifications.

## Additional cross-domain risk dossier
- SAAS-WEB3-CROSS-DOMAIN-AND-GAPS.md: joint fiat payment ledger/onchain ledger and provider-statement reconciliation; event idempotency and finality/reorg, value precision, privacy metadata and evolving risk controls for SaaS + Web3 hybrids. Research only, no contract deployment, regulated financial classification or user assets transferred.
