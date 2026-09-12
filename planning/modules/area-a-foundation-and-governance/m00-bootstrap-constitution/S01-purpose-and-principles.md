# GBS-M00-S01 — Purpose & Principles

Status: `IN_DISCUSSION`

## Purpose
GEF Bootstrap exists to prepare a newly created or existing GitHub repository to be developed under a governed, instruction-first engineering system optimized for **construction speed, low executor token consumption, narrow repository exploration, selective validation, strong review quality, and safe continuation across chats**.

GEF Bootstrap is **not** a product-runtime CLI and is **not** an application that ships functional source code of its own. Its repository is a versioned body of engineering instructions, protocols, templates, schemas, decision rules, planning structures, review contracts, prompt contracts and reusable project-bootstrap artifacts that ChatGPT and Codex can follow.

The intended user experience is that a user can request **"iniciar projeto"** and ChatGPT can apply the canonical bootstrap instructions to the target repository, creating the governed project baseline before functional product planning and implementation begin.

## Primary optimization target
The system is designed around a deliberate division of labor:

1. **ChatGPT performs the expensive engineering reasoning once**
   - understands the approved project sources;
   - resolves architecture and root-cause questions when possible;
   - decides the narrow implementation strategy;
   - identifies exact files/symbols/tests likely to matter;
   - freezes the conclusions needed by the executor;
   - compiles the result into a bounded GEF execution instruction.

2. **Codex executes a pre-resolved engineering recipe**
   - reads only the smallest safe context;
   - avoids rediscovering frozen architecture;
   - avoids broad repository searches by default;
   - changes only the prescribed scope;
   - runs the smallest safe validation set first;
   - returns compact machine-oriented evidence;
   - stops when scope, source or evidence assumptions become invalid.

The product therefore optimizes not merely prompt length, but **total engineering cost per safe change**.

## Core success dimensions
The GEF Bootstrap must explicitly optimize and later measure:

- executor input tokens;
- executor output tokens;
- executor active time;
- repository searches;
- files opened;
- files modified;
- correction rounds;
- local test count;
- local test duration;
- hosted CI duration;
- review reread/reanalysis;
- repeated reasoning eliminated by frozen decisions/proof carry-forward;
- defect/regression escape rate;
- final engineering quality and evidence confidence.

Speed or token reduction never overrides correctness, security, data integrity or required assurance.

## Bootstrap boundary
`iniciar projeto` means **initialize the project's engineering operating model**, not implement product features.

The bootstrap prepares the target repository so subsequent planning, prompt compilation, execution, review, testing, progress tracking and continuation already follow the agreed model.

GEF Bootstrap itself remains an instruction/governance repository. Any scripts or deterministic utilities required by a target project may be specified by the bootstrap and created in that target project when justified, but they are not automatically part of the GEF Bootstrap product itself.

## Mandatory bootstrap outcomes
The initialized target project must be prepared to provide, at minimum:

1. **Repository baseline**
   - inspect repository state and identity;
   - establish project fingerprint/profile;
   - preserve existing work when adopting an existing project;
   - create only governed, traceable bootstrap changes.

2. **Canonical Source Pack**
   - source hierarchy;
   - project overview;
   - requirements;
   - scope;
   - architecture;
   - security;
   - test/benchmark plan;
   - deployment/distribution;
   - backlog;
   - Definition of Done;
   - Decisions Ledger/ADRs;
   - checkpoint/current state;
   - conditional canonical documents when required by the project.

3. **Planning workspace**
   - areas, modules and sessions;
   - stable IDs;
   - dependency and status tracking;
   - lifecycle from planned discussion to frozen decision;
   - no product implementation before applicable planning is approved.

4. **GEF V1 engineering model by default**
   - Task Classes and Context Radius;
   - bounded context/execution;
   - Execution Packs and Correction Packs;
   - prescribed patch recipes and budgets;
   - Machine Evidence first;
   - HEDS Delta review;
   - proof carry-forward/invalidation;
   - exact-head verdict semantics;
   - fail-closed behavior and forbidden shortcuts.

5. **Checkpoint and chat-continuity mechanism**
   - human-readable checkpoint;
   - machine-readable current state;
   - active phase/module/session/work order;
   - completed/frozen decisions;
   - open findings and pending decisions;
   - next necessary action;
   - response contract;
   - enough canonical context to resume safely in another chat without depending only on conversational memory.

6. **Standard response contract**
   - project phase and current work;
   - what was completed;
   - what remains;
   - current verdict/status;
   - next necessary action;
   - project completion estimate when a valid baseline exists;
   - current-phase completion;
   - ETA range and confidence when evidence supports an estimate;
   - explicit `NOT_YET_BASELINED`/equivalent instead of invented percentages or dates.

7. **Prompt compilation contract**
   - ChatGPT resolves as much engineering uncertainty as safely possible before execution;
   - implementation work uses GEF V1 Execution/Correction Packs;
   - prompts include accepted/frozen decisions, one bounded goal, resolved engineering decision, patch map, prescribed algorithm, forbidden shortcuts, required tests, budgets and STOP conditions;
   - executor prompts must not force rediscovery of already frozen architecture;
   - outputs should be compact and structured where practical;
   - generated artifacts may include Markdown, JSON and PDF where the project workflow requires them.

8. **Review contract**
   - reviews use HEDS Delta/exact-head semantics;
   - review focuses first on changed inputs and invalidated proofs rather than rereading the whole project;
   - accepted findings and unaffected proofs may carry forward only when their validity inputs remain compatible;
   - semantic review remains strong enough to detect regressions, unsafe shortcuts, contract violations, architecture drift and hidden defects;
   - HIGH/CRITICAL defects block advancement.

9. **Selective validation strategy**
   - coding-time validation starts with the smallest safe impacted set, not the entire suite by reflex;
   - source/module-to-test relationships should be mapped when evidence supports them;
   - tests/evals are selected by changed behavior, dependencies, risk and uncertainty;
   - unchanged valid proofs may carry forward;
   - uncertainty expands the validation radius;
   - full-suite/hosted validation remains available for release, high assurance, unknown impact or policy-mandated gates;
   - test reduction is promoted only after shadow comparison proves no material loss of assurance.

10. **Git/GitHub project governance baseline**
    - branch/PR workflow;
    - issue/PR templates when applicable;
    - review and merge policy;
    - CI/check policy grounded in real commands and repository capabilities;
    - security/integrity guardrails;
    - truthful reporting of permission/configuration gaps.

11. **Progress, telemetry and evidence baseline**
    - progress must be derived from approved scope/DoD/backlog rather than intuition;
    - ETA must expose confidence and be recalibrated from observed delivery data;
    - evidence must bind to repository/project state and exact head when applicable;
    - efficiency claims must distinguish targets from measured results;
    - the optimization system must compare before/after execution cost and quality.

12. **Optional integrations, never hidden dependencies**
    - UADS, Hive, UGAS and future systems may be detected or referenced through governed adapters/instructions;
    - GEF Bootstrap remains independently usable without them;
    - improvements developed here are not automatically pushed into those projects.

## First-class entry intent
Conceptually, the bootstrap exposes one primary intent:

```text
INICIAR PROJETO
    -> identify repository/project
    -> source/preflight inspection
    -> establish canonical project baseline
    -> create planning/governance structure
    -> activate GEF V1 prompt/review contracts
    -> prepare checkpoint/chat continuation
    -> prepare progress/telemetry/evidence contracts
    -> prepare Git/GitHub governance instructions
    -> validate bootstrap state
    -> emit truthful bootstrap receipt
    -> READY_FOR_PLANNING
```

This is an **instruction intent**, not a requirement for a local executable CLI.

## Core principles proposed for freeze

### P1 — Planning before implementation
Bootstrap prepares the engineering environment before functional product implementation starts.

### P2 — GEF V1 by default
Every project initialized by GEF Bootstrap adopts the GEF V1 prompt/review engineering model unless an explicit, governed compatibility decision says otherwise.

### P3 — Reason once, compile once, execute narrowly
ChatGPT should perform the expensive architectural/root-cause reasoning before execution whenever safely possible. Codex receives a narrow, pre-resolved engineering recipe instead of being asked to rediscover the project.

### P4 — Optimize total engineering cost, not prompt length alone
Success is measured across tokens, executor time, searches, files read, tests, correction rounds, review effort and defect prevention.

### P5 — Source truth over conversation memory
Checkpoint, approved decisions, scope, DoD, architecture, requirements, Git state and evidence outrank conversational recollection.

### P6 — Resume must be a product capability
Cross-chat continuation is not an informal convenience. The bootstrap must create enough governed state to reconstruct where the project is, what is frozen and what must happen next.

### P7 — Review quality is non-negotiable
Optimization may reduce rereading and duplicated validation, but must not weaken semantic review, regression detection, security review or exact-head assurance.

### P8 — Test only what is safely necessary first
During bounded implementation, begin with focused/impacted tests and expand based on dependency impact, risk, uncertainty or policy. Full suites are not the default local reflex.

### P9 — Proof reuse requires validity
A prior proof/test/review may carry forward only when all relevant inputs and its validity fingerprint remain compatible.

### P10 — Shadow assurance before aggressive test skipping
Any mechanism that skips tests or reuses proofs must first demonstrate, through shadow comparison against fuller validation, that assurance is not materially degraded.

### P11 — No fabricated progress or evidence
Percentages, ETA, tests, gates, proof status and success states must be measured or explicitly marked unavailable/estimated with confidence.

### P12 — Preserve existing projects
Adoption into an existing repository must not silently overwrite decisions, active work, governance or product architecture.

### P13 — Minimal manual and redundant work
If an authorized tool or deterministic repository command can safely produce a result, the process should not spend LLM reasoning or require user repetition unnecessarily.

### P14 — Explicit gaps beat fake success
Missing permissions, unsupported capabilities, absent checks or unresolved source conflicts produce an explicit gap/block state, never a false `SUCCESS`.

### P15 — Instruction-first, tool-agnostic core
GEF Bootstrap is a versioned engineering instruction system. It may guide ChatGPT, Codex and future executors, but its canonical knowledge must not depend on one specific executor product.

### P16 — Independent core, optional ecosystem
The bootstrap may cooperate with UADS, Hive, UGAS and future systems, but the core remains independent.

### P17 — Versioned evolution
Protocols, templates, schemas, GEF compatibility and migration instructions are versioned. Behavioral changes must be explicit.

### P18 — Immediately resumable and auditable
After bootstrap or any approved increment, another authorized agent should be able to determine from repository sources what the project is, what is frozen, what remains open, what evidence exists and what must happen next.

### P19 — Master prompt is a final delivery artifact, not an early design driver
The project will eventually publish a canonical master bootstrap prompt that orchestrates application of this repository's instructions into a target project. However, its exact invocation model, preferred executor, packaging, UX and operational usage are deliberately deferred until the Bootstrap's protocols, templates, schemas, profiles and validation rules are complete enough to compile that prompt from stable sources.

### P20 — Bootstrap intelligence stays repository-driven
The future master prompt must reference and orchestrate the versioned intelligence in `gef-bootstrap`; it must not duplicate the entire body of bootstrap knowledge into a permanently bloated prompt. The repository remains the canonical source, and the master prompt is an entry/orchestration artifact.

## Product-level optimization technologies to develop in later sessions
The following concepts are candidates for dedicated design, not yet frozen implementations:

- **Prompt Compiler / Execution Pack Compiler**: convert approved engineering decisions into bounded executor instructions.
- **Context Radius / Context Slice**: give Codex the smallest safe repository context.
- **Repository Knowledge Map**: reusable map of modules, symbols, contracts and ownership to reduce repeated searching.
- **Decision Freeze Capsule**: inject only decisions relevant to the current change.
- **Search Budget / File Budget / Patch Budget**: prevent uncontrolled executor exploration.
- **Test Impact Map**: map changes to likely affected tests/evals.
- **Progressive Assurance Ladder**: focused checks first, broader checks only when required.
- **Proof Carry-Forward Graph**: reuse valid prior evidence without blind retesting.
- **Evidence Validity Fingerprint**: decide when a carried proof becomes invalid.
- **HEDS Delta Review**: review changed semantics and invalidated evidence rather than reread everything.
- **Failure Fingerprint Memory**: reuse known root causes/fixes and avoid repeating unsuccessful diagnostics.
- **Negative Capability Cache**: remember verified absences to prevent repeated repository searches.
- **Architecture Question Cache**: preserve resolved architectural questions.
- **Shadow Assurance**: measure proposed skipped tests/proofs against full validation before granting authority.
- **Exact-Head Gate Receipts**: bind hosted evidence to the exact candidate without source-only evidence commits.

## Current decision state
The user has explicitly established that:

- GEF Bootstrap is an **instruction/governance project**, not an application/code product;
- its primary business value is faster safe software construction with lower Codex token/time consumption;
- ChatGPT should do the higher-level reasoning and provide Codex with a highly prescribed implementation recipe;
- reviews must remain rigorous and focused on preventing bugs/regressions;
- test execution must become impact-aware so coding does not repeatedly run thousands of irrelevant tests;
- test/review optimization must preserve assurance and expand when risk/uncertainty requires;
- project initialization must configure planning, canonical sources, checkpoint/chat continuation, prompt/review standards, GitHub workflow, progress and evidence conventions;
- a canonical Master Bootstrap Prompt will be designed and finalized **after** the Bootstrap body is complete enough to support it;
- operational questions such as exactly how the user invokes the Bootstrap and whether ChatGPT, Codex or another compatible agent is the preferred bootstrap orchestrator are intentionally deferred until final acceptance/closure.

The detailed mechanics are deferred to their dedicated modules/sessions. This session defines **why the product exists, what it optimizes, and the universal principles every target project should inherit**.

## Deferred until finalization
Do not prematurely optimize the project around the final invocation UX. The following are intentionally deferred until the Bootstrap is complete enough to evaluate them against real protocols and artifacts:

- exact Master Bootstrap Prompt wording;
- whether ChatGPT, Codex or another agent is the preferred first executor;
- how the user supplies the target repository;
- whether the master artifact is Markdown, PDF, another packaging format, or multiple compatible forms;
- final bootstrap invocation instructions and user workflow.

These decisions must be made during final acceptance using the completed Bootstrap as evidence, not speculation at project start.
