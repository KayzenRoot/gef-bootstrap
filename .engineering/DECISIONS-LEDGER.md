# Decisions Ledger

Status: `ACTIVE`

## D-0001 — Session-by-session planning
- Decision: Plan GEF Bootstrap module by module and session by session before implementation.
- Status: APPROVED

## D-0002 — Independent product boundary
- Decision: New GEF Bootstrap improvements remain in this project and are not automatically pushed into UADS, Hive, or UGAS. Those systems may later be optional integrations.
- Status: APPROVED

## D-0003 — GEF V1 default
- Decision: Projects initialized by this bootstrap target the GEF V1 prompt/review engineering model by default.
- Status: APPROVED

## D-0004 — Instruction-first, no product runtime
- Decision: GEF Bootstrap is a versioned instruction/governance repository, not a standalone application or CLI product. Its primary artifacts are protocols, templates, schemas, review/prompt contracts, planning structures and reusable bootstrap instructions consumed by ChatGPT, Codex and future executors.
- Status: APPROVED

## D-0005 — Optimization objective
- Decision: The primary optimization target is total safe engineering cost per change: Codex token consumption, active execution time, repository exploration, local test volume/duration, correction rounds and review effort, while preserving correctness, security and required assurance.
- Status: APPROVED

## D-0006 — Reasoning/execution split
- Decision: ChatGPT should resolve architecture, root cause and implementation strategy as far as safely possible, then compile a bounded GEF execution instruction so Codex executes rather than rediscovers frozen engineering decisions.
- Status: APPROVED

## D-0007 — Selective validation with assurance protection
- Decision: Implementation-time testing should begin with the smallest safe impacted set and expand according to dependency impact, risk and uncertainty. Aggressive test skipping/proof reuse requires shadow assurance before becoming authoritative.
- Status: APPROVED

## D-0008 — Bootstrap materializes governance into the target repository
- Decision: Although GEF Bootstrap has no standalone runtime/CLI, invoking its canonical project-start instruction against a target repository must create or update the governed files, directories, templates, checkpoint state, prompt/review contracts and other approved bootstrap artifacts required for that target project to follow GEF recommendations. The Bootstrap repository is the instruction source; the target repository receives the materialized project-specific artifacts.
- Status: APPROVED

## D-0009 — Token efficiency is a first-class architectural invariant
- Decision: GEF Bootstrap must treat model-token economy, especially paid executor/Codex tokens, as a first-class design invariant across source resolution, context construction, prompt compilation, execution, validation, evidence and review. Every applicable module must actively look for safe opportunities to remove duplicated context, repeated reasoning, unnecessary repository reads/searches, verbose executor output and redundant validation. The project may grow substantially in planning depth and deterministic metadata if that reduces recurring executor cost. Token reduction never overrides correctness, security, data integrity or required assurance.
- Status: APPROVED

## D-0010 — Executor cognition minimization
- Decision: The preferred execution contract minimizes open-ended executor reasoning. ChatGPT/planning sources should pre-resolve intent, architecture, root cause, target files/symbols, transformation recipe, invariants, forbidden shortcuts, tests and STOP conditions whenever evidence permits. Codex should spend tokens primarily on bounded implementation and proof, escalating rather than rediscovering when assumptions fail.
- Status: APPROVED

## D-0011 — Token optimization must be measured end-to-end
- Decision: Optimization is not accepted merely because a prompt is shorter. GEF must measure or estimate with explicit confidence the total token path per governed change, including source/context loading, prompt input, executor reasoning/output, retries, review rereads and correction rounds, and compare it with quality/defect outcomes. Targets and measured gains must remain distinct.
- Status: APPROVED

## D-0012 — Executor latency is a first-class performance objective
- Decision: GEF Bootstrap must optimize not only token consumption but also wall-clock completion time for each bounded Codex interaction. Applicable modules must reduce avoidable repository discovery, file I/O, reasoning branches, test volume, retries, serial waits and unnecessary output. Execution packs should carry explicit latency/performance budgets where meaningful, and performance regressions must be measured against baselines without trading away required correctness or assurance.
- Status: APPROVED

## D-0013 — Brownfield adoption is a first-class bootstrap path
- Decision: GEF Bootstrap must support both NEW_PROJECT and EXISTING_PROJECT adoption as first-class operating modes. An existing complex repository may adopt GEF incrementally without restarting product planning, rewriting working architecture, discarding active work, or forcing full historical normalization before receiving benefits. Adoption must inventory current truth, build a compatibility/gap map, establish a pre-adoption baseline, introduce governance and optimization in safe slices, and preserve project-specific source authority. Existing projects must be able to gain prompt, context, review, token and execution-speed improvements as early as safely possible.
- Status: APPROVED

## D-0014 — Brownfield optimization uses progressive normalization
- Decision: Existing-project adoption must prefer progressive normalization over big-bang migration. GEF may initially index and alias existing documents, tests, checks and conventions, then normalize only where the expected reduction in recurring token/time cost, ambiguity or risk justifies the change. Shadow assurance is required before aggressive proof/test reuse becomes authoritative in an adopted project.
- Status: APPROVED

## D-0015 — Descriptive truth and normative truth remain distinct
- Decision: In existing or drifted projects, GEF must record separately what is actually implemented/observed and what is approved/required. Code or tests may establish descriptive truth for a specific SHA; Scope, Requirements, Architecture and frozen Decisions establish normative truth for their domains. A mismatch creates an explicit drift record and must never silently rewrite either side.
- Status: APPROVED

## D-0016 — Minimum Sufficient Context governs executor context
- Decision: Executor context must target the smallest verifiably sufficient set of authoritative facts, contracts, dependencies, risks and proof obligations. Context may expand only on evidence-backed triggers or assurance requirements. Token budgets never override required correctness, security, data integrity or high-assurance inspection.
- Status: APPROVED

## D-0017 — Governed knowledge should appreciate over time
- Decision: Approved work should enrich validity-bound reusable engineering knowledge so comparable future work requires less rediscovery, fewer reads/searches, less repeated reasoning and less review rereading. Reuse remains subordinate to current canonical sources and must be invalidated by relevant source, dependency, toolchain or policy changes.
- Status: APPROVED

## D-0018 — Innovation discoveries are governed separately from frozen decisions
- Decision: Material technologies, optimization mechanisms and engineering ideas discovered during planning must be recorded in the Technology & Innovation Ledger with an explicit lifecycle state and owner. Candidate/proposed technologies do not become executor requirements until frozen by their owning planning scope.
- Status: APPROVED

## D-0019 — Engineering ROI governs optimization complexity
- Decision: Permanent optimization complexity should be justified by expected end-to-end benefit across token cost, executor latency, validation time, review effort, retry avoidance, defect avoidance and maintenance burden. Optimization that merely moves cost elsewhere is not considered successful.
- Status: APPROVED

## D-0020 — S01 purpose and principles are frozen
- Decision: GBS-M00-S01 is frozen with P1–P27 as the constitutional purpose/principle baseline. Detailed source hierarchy, context routing, assurance matrices and implementation mechanisms remain delegated to their owning later sessions/modules and are not implied as fully designed by this freeze.
- Status: APPROVED

## D-0021 — Source authority is domain-specific
- Decision: GEF V1 uses constitutional authority domains rather than one naive total source order. The universal domains are REPOSITORY_STATE, PROJECT_STATE, DECISION, SCOPE, REQUIREMENT, ARCHITECTURE, SECURITY, COMPLETION, EXECUTION, VALIDATION, PLANNING, FUTURE_WORK, INNOVATION and CONVERSATION. Project profiles may add subdomains but may not silently redefine base-domain semantics.
- Status: APPROVED

## D-0022 — Canonical facts are addressable and validity-bound
- Decision: Canonical sources may expose stable fact IDs with minimum metadata sufficient to locate, fingerprint, relate, apply and invalidate them. V1 minimum metadata is id, domain, status, source, locator, fingerprint, dependencies and applicability; supersession, compact values and validated bindings are conditional. Fact references never replace canonical truth.
- Status: APPROVED

## D-0023 — Source validity uses hybrid fact/dependency fingerprints
- Decision: Source validity is tracked at the smallest safe authoritative granularity through a DOCUMENT -> SECTION -> FACT -> DEPENDENCY SET hierarchy. Relevant upstream changes invalidate dependent capsules, execution packs, proofs or review state without forcing unrelated project-wide invalidation. Unknown dependencies widen context/validation.
- Status: APPROVED

## D-0024 — Assurance overrides optimization budgets
- Decision: Token, search, file, test and latency budgets never override the required assurance floor. High-assurance signals such as security boundaries, money, signing, privileged authorization, secrets, destructive/irreversible operations and critical data integrity require appropriate context expansion/fail-closed behavior. Formal assurance classes remain delegated to GBS-M27/security.
- Status: APPROVED

## D-0025 — Machine current state and human checkpoint are governed views, not competing truth
- Decision: Machine current state and the human Checkpoint represent the same progression state at different densities. Shared fields must remain consistent and disagreement yields STATE_CONFLICT. GEF Bootstrap planning continues using .engineering/CHECKPOINT.md and .engineering/CHECKPOINT.json; a target-repository .gef/current.json path/schema is not frozen by S02 and belongs to continuity modules.
- Status: APPROVED

## D-0026 — Source hierarchy application requires conformance evidence
- Decision: A future bootstrap materialization must prove source-hierarchy application through a conformance receipt capable of showing authority mapping, source discovery, conflict/missing-source detection, fact addressability, fingerprints/dependency validity, brownfield drift preservation, MSC construction, expansion policy and fail-closed configuration. Decorative SUCCESS is insufficient.
- Status: APPROVED

## D-0027 — Inventory is not V1 commitment
- Decision: The Master Module Index is an inventory/roadmap, not proof that every area/module/session belongs to V1. Only admitted NECESSARY scope contributes to V1 completion obligations; IMPORTANT/FUTURE/OUT_OF_SCOPE inventory remains outside the V1 denominator unless explicitly promoted.
- Status: APPROVED

## D-0028 — NECESSARY scope requires a traceable primary admission basis
- Decision: Every NECESSARY item must have exactly one primary constitutional admission basis and may have additional supporting bases. Vague claims such as professional, enterprise, best practice or nice to have are not sufficient admission bases.
- Status: APPROVED

## D-0029 — IMPORTANT scope never auto-enters V1
- Decision: IMPORTANT items require explicit governed promotion to NECESSARY before entering V1, even when time/token/implementation capacity remains. Promotion must identify the new admission basis and scope/DoD/baseline impact.
- Status: APPROVED

## D-0030 — Scope expansion is fail-closed for executors
- Decision: Executors may continue only for bounded in-scope clarification, demonstrably required dependency or defect/conformance repair against an approved obligation. Product-scope expansion requires governed planning approval; executors route/stop rather than authorize it.
- Status: APPROVED

## D-0031 — Scope carrying cost is qualitative in V1
- Decision: V1 evaluates permanent scope obligations using LOW/MEDIUM/HIGH qualitative carrying-cost dimensions for context, maintenance, validation, review and migration surfaces. Numeric scoring is deferred until telemetry/baseline evidence can support it.
- Status: APPROVED

## D-0032 — V1 scope classification is hierarchical
- Decision: Module is the normal V1 classification unit. Area defaults/grouped classifications may reduce repetition; sessions inherit module classification unless an explicit override is necessary. The project must not create hundreds of low-value per-session classification records by default.
- Status: APPROVED

## D-0033 — Legacy runtime/CLI names are refactor-required, not silently canonical
- Decision: Scaffold IDs remain stable while legacy runtime/CLI-oriented names/responsibilities such as M01, M47, M49 and runtime-assuming quality modules are marked REFACTOR_REQUIRED. Detailed rename/reframing occurs in Scope/Architecture planning without renumbering or destructive history rewrite.
- Status: APPROVED

## D-0034 — DONE is evidence-bound and layered
- Decision: No agent claim, percentage, file presence, open PR or historical green test is sufficient for completion. DONE requires satisfied admitted obligations, current applicable evidence, blocker disposition permitted by policy and promoted governed state. Completion is evaluated at item, module, bootstrap-application and V1 levels without conflating them.
- Status: APPROVED

## D-0035 — Planning session completion has a minimum evidence contract
- Decision: A FROZEN planning session must have a stable ID/final status, self-contained documented decision, routed/closed open questions, synchronized Decisions/Technology Ledgers where applicable, recorded scope/dependency impact, repository binding when applicable, audit verdict and promoted checkpoint identifying the next legal continuation point.
- Status: APPROVED

## D-0036 — Completion evidence binds to exact subject state
- Decision: Where proof depends on repository/configuration state, exact-head or equivalent exact-state binding is mandatory. For external/non-repository subjects, evidence binds to an equivalent immutable/versioned identity. Later relevant change invalidates only dependent proofs where the dependency graph permits.
- Status: APPROVED

## D-0037 — DONE_WITH_ACCEPTED_GAPS is policy-gated
- Decision: DONE_WITH_ACCEPTED_GAPS is not a universal terminal state. It is allowed only where an owning policy/profile explicitly permits it and the gap is identified, classified, owned/dispositioned, non-blocking and does not violate a NECESSARY security/assurance/completion obligation. Blocking defects, invalid evidence and unresolved source conflicts cannot be hidden as accepted gaps.
- Status: APPROVED

## D-0038 — READY_FOR_PLANNING requires a usable governed planning surface
- Decision: A Bootstrap application may report READY_FOR_PLANNING only when project identity, applicable governance/source skeleton or brownfield mappings, authority/gap representation, planning/checkpoint/resume protocol, adoption mode, applicable Git/GitHub governance or truthful permission gaps, absence of planning blockers and a bound conformance receipt are all present. Otherwise use a truthful gap/block state.
- Status: APPROVED

## D-0039 — V1 must be measurable without fabricating optimization gains
- Decision: V1 final acceptance requires telemetry and a reproducible baseline/benchmark path for token/time/engineering-cost outcomes. Universal percentage improvement is not a release prerequisite before representative baseline data exists. When comparable baseline data is available, results and regressions must be reported truthfully with confidence; optimization targets remain targets until proven.
- Status: APPROVED

## D-0040 — Optional integrations never silently block independent core completion
- Decision: UADS, Hive, UGAS and other ecosystem integrations remain optional unless explicitly admitted into a target profile or future core scope. Their absence/failure may block the corresponding adapter/profile but cannot block independent GEF Bootstrap core completion under the current product boundary.
- Status: APPROVED

## D-0041 — CONST-F1 through CONST-F8 are stable constitutional group IDs
- Decision: GEF Bootstrap V1 uses CONST-F1 through CONST-F8 as stable compact reference groups for product boundary, engineering model, optimization objective, brownfield adoption, source truth, scope, completion and continuity/auditability. Individual D-* entries and frozen session documents remain the detailed canonical records; group IDs never replace them.
- Status: APPROVED

## D-0042 — Frozen constitutional changes require governed reopening and supersession
- Decision: A frozen constitutional decision may be reopened only for governed triggers such as source drift, proven contradiction, security/integrity defect, invalidated foundational dependency, governed scope/version supersession, measured failure against its objective, or an explicit product-owner decision. Product-owner direction is sufficient to initiate reopening but becomes effective only through a recorded superseding planning decision, impact analysis, audit and checkpoint promotion. New-chat/model preference or executor convenience are insufficient.
- Status: APPROVED

## D-0043 — Constitution is versioned and fingerprintable without fabricated hashes
- Decision: M00 closure establishes `GBS-CONSTITUTION-v1.0`. A deterministic constitution fingerprint is required from later Source Pack/Integrity mechanisms; until that exists, repository exact-state binding plus the version ID identifies the current frozen Constitution. Placeholder or invented fingerprints are prohibited.
- Status: APPROVED

## D-0044 — M00 completion freezes outcomes while delegating implementation mechanics
- Decision: GBS-M00 is complete only when S01-S05 are frozen with required evidence, ledgers synchronized, constitutional groups contradiction-free, later mechanics explicitly delegated, exact-head review clean, checkpoint promoted and no accidental functional implementation introduced. M00 freezes constitutional outcomes/invariants, not detailed schemas, filenames, algorithms or later module mechanics.
- Status: APPROVED

## D-0045 — Source Pack canonical documents are not prematurely populated by M00
- Decision: S05 does not pre-fill SOURCE-HIERARCHY, SCOPE or DEFINITION-OF-DONE with detailed product conclusions. Those documents are materialized in their ordered Source Pack/owning-module sequence from the frozen Constitution, preventing duplicated authority and drift.
- Status: APPROVED

## D-0046 — Canonical Project Overview mission and role model
- Decision: GEF Bootstrap's canonical mission is to turn repeated AI-assisted software-engineering discovery/reasoning into governed, validity-bound, reusable project knowledge so new and existing repositories can be planned, executed, reviewed and resumed with less token cost, less executor latency and stronger evidence without weakening correctness or assurance. The product recognizes logical Project Owner, Planning Agent, Executor and Reviewer/Auditor roles; one actor may hold multiple roles but responsibilities remain distinct.
- Status: APPROVED

## D-0047 — Core remains instruction-first; deterministic CLI/tooling may be an optional mechanical layer
- Decision: GEF Bootstrap does not become a hard-coded planner or standalone runtime/CLI product. A future thin CLI/script/tooling layer may be admitted when it provides measurable ROI for deterministic tasks such as materialization, schema validation, fingerprints, repository inspection and conformance receipts. Such tooling is subordinate to governed canonical sources and must never silently become semantic authority for architecture, scope admission or review.
- Status: APPROVED

## D-0048 — GitHub is the primary platform profile, not a universal semantic dependency
- Decision: GEF core expects version-controlled repository identity and governed change/evidence/continuity surfaces, but GitHub itself is not constitutionally mandatory. GitHub is the primary first-class platform profile for the current product; equivalent non-GitHub platforms may conform when they satisfy the applicable governed contracts.
- Status: APPROVED

## D-0049 — Brownfield adoption must deliver operational value before full normalization
- Decision: An existing project bootstrap must provide safe operational value before full normalization, including baseline/identity, active-area source mapping, bounded context/search behavior, compact evidence/delta review, checkpoint continuity and shadow-mode proof/test optimization. Merely copying templates is insufficient brownfield adoption.
- Status: APPROVED

## D-0050 — Optimization telemetry is required; percentage gains remain benchmark claims until proven
- Decision: V1 must be capable of measuring or explicitly accounting for observable token, executor-time, repository-discovery, validation, retry/correction, review/evidence and proof-reuse behavior, while distinguishing measured values, estimates and unavailable telemetry. Specific improvement percentages remain benchmark targets until representative evidence proves them.
- Status: APPROVED

## D-0051 — Project Overview is frozen
- Decision: `.engineering/PROJECT-OVERVIEW.md` is frozen as the canonical product overview derived from `GBS-CONSTITUTION-v1.0`, including mission, logical roles, universal/profile boundaries, platform boundary, minimum brownfield value, optimization measurement requirements and explicit non-goals. Detailed requirements, scope and architecture remain delegated to their ordered Source Pack stages.
- Status: APPROVED

## D-0052 — `main` is the latest PRODUCTION_APPROVED release channel
- Decision: `main` is the currently production-approved release and the only branch permitted to represent production. V1.1 development occurs on `release/1.1` and subordinate branches and is integration-only until production acceptance. Promotion is exact-head and evidence-bound; release tags are immutable. A V1.0 defect is corrected on a `1.0.x` hotfix lineage and forward-ported into `release/1.1` where still applicable. Detailed contract: `ADR-0003-D1`/`D2`.
- Status: PROPOSED_FOR_WO_001_AUDIT

## D-0053 — External executor authority for this repository is bounded and V1.1-scoped
- Decision: `ADR-0002-D8` (Codex must not build this repository) is superseded for the V1.1 release line only, by `ADR-0003-D3`, after an explicit conflict report. The external executor may work on `release/1.1` and subordinate branches under mandatory bounds: admitted Work Order required, no merge/tag/publish/force-push/history rewrite, no modification of V1.0.0 acceptance history or production checkpoint state, external objective audit, and no self-approval. The permanent implementation model remains an owner decision for V1.1 closure.
- Status: PROPOSED_FOR_WO_001_AUDIT

## D-0054 — The V1.1 CLI is admitted as the thin mechanical layer of D-0047
- Decision: The `gef` CLI surface admitted by `V1.1-SCOPE.md` NECESSARY #1 is the thin deterministic tooling layer contemplated by `D-0047`, not a reversal of `D-0004`. It is a transport/rendering surface over the application API, holds no business logic, and is never semantic authority for architecture, scope admission, requirements, risk acceptance or review verdicts. Admission carries a measurable-ROI obligation under the V1.1 benchmark protocol. Detailed contract: `ADR-0003-D4`.
- Status: PROPOSED_FOR_WO_001_AUDIT

## D-0055 — Distribution claims distinguish designed from proven
- Decision: V1.1 may design an installable distribution model, but no publication, package registration, binary artifact or install command may be described as available until proven by release evidence. The source-workspace path remains the supported distribution until proven otherwise. Detailed contract: `ADR-0003-D5`.
- Status: PROPOSED_FOR_WO_001_AUDIT

## D-0056 — Execution Capsules are deterministic, fingerprinted and fail closed
- Decision: The V1.1 Execution Capsule is a compiled, deterministic, fingerprinted projection of the existing acceleration mechanisms (`ENM`, `DCC`, `IST`/`FIC`/`BPIC`, validation ladder, `TPRR`, `SDS`), not a competing source of truth. Repeat compilation from identical inputs must be byte-identical. `certainty: INSUFFICIENT` cannot produce a compiled capsule. Drift invalidates by drift class with no optimistic continuation. Contract: `.engineering/releases/V1.1-EXECUTION-CAPSULE-CONTRACT.md`; schema: `urn:gef:schema:execution-capsule:1`.
- Status: PROPOSED_FOR_WO_001_AUDIT

## D-0057 — Incremental validation may narrow execution but never assurance or credit
- Decision: Validation selection may reduce repeated intermediate work only when the selector can positively prove a test unaffected; uncertain impact widens or escalates and never narrows. Proof reuse requires valid lineage, fingerprints, dependency impact, configuration, toolchain, platform, fixture, policy and validity bindings, and may never manufacture production credit, participate in production accounting or waive a required exact-head sweep. Contract: `.engineering/releases/V1.1-INCREMENTAL-VALIDATION-PROOF-REUSE-CONTRACT.md`.
- Status: PROPOSED_FOR_WO_001_AUDIT

## D-0058 — Incomparable benchmark populations are reported as incomparable
- Decision: Performance claims require matching population identity across workload, base state, toolchain, platform, assurance policy, cache/proof posture and measurement boundary. A mismatch forbids any speedup claim. Metrics distinguish MEASURED, ESTIMATED and UNAVAILABLE. A quality-gate failure voids an apparent gain. Contract: `.engineering/releases/V1.1-PERFORMANCE-BENCHMARK-PROTOCOL.md`.
- Status: PROPOSED_FOR_WO_001_AUDIT

## D-0059 — V1.1 foundation decisions are promoted after objective audit
- Decision: The proposal states recorded by D-0052 through D-0058 are historical. Objective re-audit of `GBS-V11-WO-001` at exact head `989dacef39a4d4bcbd6c3e8ef73ae7d54df6e635` returned `APPROVED` with CRITICAL=0/HIGH=0, and PR #279 merged that audited candidate into `release/1.1` as `c5890620a98f2b23c794d65234824ad2ea084036`. This governance increment performs the checkpoint-promotion step required by D-0042. On merge of the checkpoint-promotion PR into `release/1.1`, D-0052 through D-0058 and ADR-0003-D1 through D5 become effective for the V1.1 release line under their declared bounds. In particular, ADR-0003-D3 authorizes external-executor implementation only on `release/1.1` and subordinate branches, only for admitted Work Orders, and never authorizes merge/tag/publish/force-push/history rewrite or mutation of `main`/V1.0.0 accepted history.
- Status: APPROVED
