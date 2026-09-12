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
