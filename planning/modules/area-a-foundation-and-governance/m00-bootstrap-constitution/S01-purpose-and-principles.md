# GBS-M00-S01 — Purpose & Principles

Status: `IN_DISCUSSION`

## Purpose
GEF Bootstrap exists to transform a newly created or existing GitHub repository into a governed project workspace that is ready for structured planning before product implementation begins.

The intended user experience is that a user can request **"iniciar projeto"** (or invoke the equivalent CLI command) and receive a complete, validated project engineering baseline instead of manually recreating planning, review, prompt, checkpoint and GitHub structures for every project.

## Bootstrap boundary
`iniciar projeto` means **initialize the project operating system**, not implement product features.

Before functional planning begins, the bootstrap must prepare the repository and project so that subsequent planning and implementation already follow the agreed engineering model.

## Mandatory bootstrap outcomes
The initialized project must be prepared to provide, at minimum:

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

7. **Prompt and review structure**
   - implementation work uses the GEF V1 Execution/Correction Pack model;
   - reviews use the GEF V1 HEDS Delta/exact-head model;
   - architecture/root-cause decisions are resolved before bounded execution whenever possible;
   - executor prompts must not force rediscovery of already frozen architecture;
   - generated artifacts may include Markdown, JSON and PDF where the project workflow requires them.

8. **Git/GitHub project governance baseline**
   - branch/PR workflow;
   - issue/PR templates when applicable;
   - review and merge policy;
   - CI/check placeholders or concrete workflows only when supported by real toolchain commands;
   - security/integrity guardrails;
   - truthful reporting of permission/configuration gaps.

9. **Progress, telemetry and evidence baseline**
   - progress must be derived from approved scope/DoD/backlog rather than intuition;
   - ETA must expose confidence and be recalibrated from observed delivery data;
   - evidence must bind to repository/project state and exact head when applicable;
   - efficiency claims must distinguish targets from measured results.

10. **Optional integrations, never hidden dependencies**
    - UADS, Hive, UGAS and future systems may be detected and integrated through adapters;
    - GEF Bootstrap remains independently usable without them;
    - improvements developed here are not automatically pushed into those projects.

## Proposed first-class entry intent
Conceptually, the bootstrap exposes one primary intent:

```text
INICIAR PROJETO
    -> identify repository/project
    -> preflight
    -> plan bootstrap changes
    -> prepare canonical project baseline
    -> activate GEF V1 governance
    -> prepare continuity/review/prompt/progress mechanisms
    -> validate
    -> emit bootstrap receipt
    -> READY_FOR_PLANNING
```

The exact CLI command, aliases, runtime and interaction model are intentionally deferred to later sessions.

## Core principles proposed for freeze

### P1 — Planning before implementation
Bootstrap prepares the engineering environment before functional product implementation starts.

### P2 — GEF V1 by default
Every project initialized by GEF Bootstrap adopts the GEF V1 prompt/review engineering model unless an explicit, governed compatibility decision says otherwise.

### P3 — Deterministic where deterministic is possible
Repository inspection, file generation, hashes, schema validation, state calculation, evidence formatting and other mechanical work should migrate to deterministic software rather than consume LLM reasoning.

### P4 — Source truth over conversation memory
Checkpoint, approved decisions, scope, DoD, architecture, requirements, Git state and evidence outrank conversational recollection.

### P5 — Resume must be a product capability
Cross-chat continuation is not an informal convenience. The bootstrap must create enough governed state to reconstruct where the project is, what is frozen and what must happen next.

### P6 — No fabricated progress
Percentages, ETA, tests, gates and evidence must be measured or explicitly marked as unavailable/estimated with confidence.

### P7 — Safe, idempotent and recoverable
Bootstrap should be designed so repeated execution does not duplicate or corrupt project state, and interrupted/failed application can be diagnosed and recovered.

### P8 — Preserve existing projects
Adoption into an existing repository must not silently overwrite decisions, active work, governance or product architecture.

### P9 — Minimal manual work
When authorized tooling can perform repository/GitHub setup safely, the bootstrap should do it rather than produce avoidable manual instructions.

### P10 — Explicit gaps beat fake success
Missing permissions, unsupported toolchains, absent checks or unresolved source conflicts produce an explicit gap/block state, never a false `SUCCESS`.

### P11 — Independent core, optional ecosystem
The bootstrap may integrate with UADS, Hive, UGAS and future systems, but the core must remain independently installable and operable.

### P12 — Versioned evolution
Bootstrap behavior, schemas, templates, GEF compatibility and migrations are versioned. Upgrades must be explicit and reversible where feasible.

## Current decision state
The user has explicitly established that project initialization must configure, before planning begins:
- repository/project baseline;
- planning structure;
- configuration files;
- chat continuation/checkpoint files;
- review structure;
- prompt structure governed by GEF V1;
- standardized project-status responses.

The detailed implementation of each outcome is deferred to its dedicated module/session. This session defines **why the product exists and what every successful bootstrap must conceptually accomplish**.

## Open points for this session
Before freezing S01, discuss whether the bootstrap should also guarantee any additional universal product-level principles that must apply to every future project, regardless of technology stack.
