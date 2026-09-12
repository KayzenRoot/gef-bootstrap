# Project Overview

Status: `FROZEN`

## Project
**GEF Bootstrap**

## Constitutional binding
This overview is derived from `GBS-CONSTITUTION-v1.0` and remains compatible with `CONST-F1` through `CONST-F8`. It summarizes the product boundary for downstream planning; it does not supersede the Constitution or Decisions Ledger.

## Mission
**Turn repeated AI-assisted software-engineering discovery and reasoning into governed, validity-bound, reusable project knowledge so new and existing repositories can be planned, executed, reviewed and resumed with less token cost, less executor latency and stronger evidence without weakening correctness or assurance.**

This sentence is the preferred canonical mission for README-level/product-level summaries. Shorter marketing wording may be derived later without changing its meaning.

## Product definition
GEF Bootstrap is a **versioned instruction/governance repository** used by ChatGPT, Codex and compatible future agents to initialize or progressively govern software projects under the GEF V1 engineering model.

It is not a standalone runtime application or CLI product. Its primary value is the governed knowledge, protocols, schemas, templates, planning structures, evidence contracts, review rules and reusable bootstrap instructions that compatible agents materialize into a target repository.

## Tooling boundary
GEF Bootstrap may later include or integrate a **thin deterministic automation layer** such as a CLI, script or compatible tool when that layer demonstrably reduces repetitive mechanical work.

Such tooling may materialize approved files/templates, validate schemas/contracts, compute fingerprints/hashes, inspect repository state, run deterministic conformance checks and generate machine receipts from known inputs.

Such tooling must **not** become the owner of product reasoning, architecture choice, scope admission or semantic review merely because it is executable code. The governed repository and its canonical sources remain the product brain; automation is an optional mechanical execution surface.

## Problem being solved
AI-assisted software construction repeatedly pays expensive costs that should not need to be paid again:

- rereading broad repository context;
- rediscovering previously settled architecture;
- repeatedly searching for files/symbols/contracts;
- running unnecessarily broad test suites;
- producing verbose evidence/review output;
- reopening already accepted decisions;
- losing continuity between chats/executors;
- treating existing projects as if they must restart planning from zero;
- confusing progress claims with objectively proven completion.

GEF Bootstrap aims to convert those recurring costs into reusable governed project knowledge.

## Primary objective
Minimize **total safe engineering cost per accepted change** while preserving or improving correctness and assurance.

The cost model includes, where measurable:

```text
model/executor tokens
+ executor wall-clock time
+ repository searches/files opened
+ validation/test time
+ CI waiting
+ retries/correction rounds
+ semantic review effort
+ evidence production cost
+ escaped-defect cost/risk
```

Token economy and Codex/executor latency are first-class design objectives. They never override correctness, security, integrity or required assurance.

## Canonical roles
GEF Bootstrap recognizes four explicit roles. One person/agent may hold more than one role, but the responsibilities remain distinct.

### Project Owner
Owns product intent, boundary and deliberate product-direction changes. May initiate governed constitutional/scope supersession but does not bypass the evidence/review process.

### Planning Agent
Reads canonical source truth, resolves ambiguity, performs high-cost engineering reasoning, proposes/finalizes governed planning and compiles bounded execution/review context.

### Executor
Applies an approved bounded change or materialization recipe, performs required local proof, reports compact evidence and stops/escalates when source/scope/assumptions fail.

### Reviewer / Auditor
Evaluates exact-state evidence, semantic delta, invalidated proofs, scope/architecture/DoD conformance and produces a governed verdict independent from executor self-claim.

These roles are logical contracts, not mandatory separate human accounts or separate models in every project.

## Core operating model
Preferred flow:

```text
SOURCE TRUTH
  -> governed planning / reasoning
  -> frozen decisions
  -> Minimum Sufficient Context
  -> bounded Execution Pack
  -> executor implementation/materialization
  -> impacted validation/evidence
  -> delta semantic review
  -> checkpoint/proof promotion
  -> reusable engineering knowledge
```

The preferred division of labor is to resolve high-cost reasoning once in governed planning when safely possible, then provide executors with narrow pre-resolved instructions instead of asking them to rediscover architecture or product intent.

## Supported adoption modes
### New project
GEF Bootstrap establishes the governed planning surface before product implementation begins.

### Existing / brownfield project
GEF Bootstrap inventories and maps current truth, preserves working architecture and active work, introduces governance progressively, and delivers early safe improvements without demanding a destructive rewrite or full historical normalization first.

New-project and existing-project adoption are first-class modes.

## Universal target contract
Every successfully bootstrapped target project, regardless of profile, must have enough governed state to provide:

- stable project/repository identity;
- recoverable authoritative source mapping;
- explicit adoption mode and known gaps/conflicts;
- governed planning/decision/checkpoint/resume path;
- GEF execution/review/evidence policy sufficient for bounded work;
- truthful readiness/conformance state;
- a route for scope, completion and source conflicts to fail closed rather than be improvised.

## Profile/adoption-mode conditional outcomes
The following are materialized or mapped when applicable to the target profile, platform and maturity:

- detailed Requirements/Scope/Architecture/Security/Test/Deployment sources;
- Git/GitHub workflows, rulesets, labels, issue/PR templates and CI contracts;
- progress/baseline/telemetry structures;
- proof/test-impact machinery;
- brownfield domain maturity/normalization structures;
- optional ecosystem adapters;
- platform-specific automation/installation helpers.

Exact artifacts remain owned by later modules. This overview does not freeze their filenames or schemas beyond already frozen constitutional decisions.

## Platform boundary
A version-controlled repository is part of the expected operating model, but **GitHub is not a universal semantic dependency of the GEF core**.

GitHub is the primary first-class platform profile for this project because it provides PRs, checks, Actions, issues, rulesets and evidence surfaces used by our current workflow. A non-GitHub repository may still conform to the GEF core if it supplies equivalent governed repository identity, change-review/evidence and checkpoint capabilities required by the applicable profile.

GitHub-specific capabilities therefore belong to dedicated platform/governance modules rather than the constitutional definition of GEF itself.

## Minimum brownfield value
Before full normalization, an existing project must be able to receive at least a safe subset of immediate GEF value:

1. repository/project identity and pre-adoption baseline;
2. source/authority and gap mapping for the active work area;
3. bounded prompt/context routing instead of unrestricted rediscovery;
4. search/file/read budgets and explicit expansion triggers;
5. compact evidence and delta-oriented review for governed increments;
6. checkpoint/resume continuity;
7. shadow-mode test/proof optimization until confidence permits promotion.

A brownfield bootstrap that merely copies templates but provides none of these operational benefits is not sufficient.

## Optimization requirements versus targets
### Product requirements
GEF V1 must be capable of measuring or explicitly accounting for, where observable:
- model/executor token cost;
- executor wall-clock/active duration;
- repository searches/files/context loaded;
- validation/test effort;
- retries/correction rounds;
- review/evidence effort;
- proof/cache/carry-forward behavior;
- correctness/assurance outcomes relevant to optimization safety.

The system must distinguish measured values, estimates and unavailable telemetry.

### Benchmark targets
Specific percentage reductions for tokens, time, searches, tests or review are benchmark targets until representative evidence proves them. No target percentage is a constitutional truth merely because it appears in planning.

## Foundational invariants
1. Source truth outranks conversational memory.
2. Authority is domain-specific; newer is not automatically more authoritative.
3. Descriptive truth and normative truth remain distinct.
4. Executor context targets Minimum Sufficient Context.
5. Context expansion requires evidence-backed or assurance-backed reason.
6. Assurance requirements override token/time/search/test budgets.
7. Inventory is not V1 commitment.
8. Executors cannot authorize product-scope expansion.
9. DONE is evidence-bound, not claim-bound.
10. Brownfield adoption is progressive and preservation-first.
11. Frozen constitutional decisions reopen only through governed supersession.
12. Optional ecosystem integrations cannot silently become core dependencies.
13. Every accepted increment should make comparable future work cheaper to understand.
14. Deterministic automation may mechanize governed work but must not silently become semantic authority.

## Product boundary
### In the core product
- governance/instruction assets required to initialize and guide GEF projects;
- planning/source-pack contracts;
- GEF V1 adoption rules;
- context/prompt/execution/review optimization design;
- evidence/assurance/continuity/progress/governance contracts;
- target-repository materialization instructions;
- new-project and brownfield adoption paths;
- platform governance planning/conformance where applicable;
- measurement/baseline path for engineering-cost optimization.

### Explicit non-goals for the current core
- becoming a general-purpose software-development IDE;
- replacing ChatGPT/planning agents with a hard-coded planner;
- becoming a standalone always-running daemon/service;
- requiring UADS, Hive, UGAS or another proprietary ecosystem to function;
- rewriting target-project architecture solely to fit GEF naming;
- fully normalizing a brownfield repository before value can be delivered;
- storing project-specific product architecture in the Bootstrap repository;
- granting cross-project learned knowledge authority over local canonical sources;
- optimizing tokens/time by weakening required assurance;
- promising universal improvement percentages without representative evidence;
- turning a future CLI/tooling layer into the semantic source of truth.

## Integration boundary
UADS, Hive, UGAS and future ecosystems may provide adapters/capabilities, but the independent GEF Bootstrap core must remain usable and completable without them unless a future governed scope decision explicitly changes this boundary.

## Success model
GEF Bootstrap succeeds when it can initialize or progressively govern a target repository so that:

- authoritative planning state is recoverable without chat-history dependence;
- bounded work can be compiled from governed sources;
- executor rediscovery and unnecessary context/test cost can be reduced safely;
- reviews inspect semantic delta and invalidated proof rather than rereading accepted material by default;
- completion/gaps are reported truthfully with evidence;
- new and existing projects can continue from a stable checkpoint;
- token/time improvements are measurable against reproducible baselines when data exists.

No universal percentage improvement is asserted by this overview. Optimization targets remain targets until representative measurement proves them.

## Current project stage
- Constitution: `GBS-M00 MODULE_DONE`
- Constitution version: `GBS-CONSTITUTION-v1.0`
- Source Pack: `IN_PLANNING`
- Project Overview: `FROZEN`
- Requirements: `UNPLANNED`
- Scope: `UNPLANNED`
- Architecture: `UNPLANNED`
- Functional implementation: `NOT_STARTED`
- Overall completion: `NOT_YET_BASELINED`
- ETA: `NOT_YET_RELIABLE`

## Frozen decision summary
Project Overview freezes a universal **instruction-first, repository-native, agent-consumed engineering bootstrap** with explicit Project Owner / Planning Agent / Executor / Reviewer roles, a small universal target contract, profile-conditional platform artifacts, GitHub as the primary first-class platform profile rather than a core semantic dependency, immediate safe brownfield value, measurable optimization requirements, evidence-only benchmark claims and explicit non-goals preventing a future CLI/tool layer from replacing governed reasoning.

## Freeze audit
- Constitution compatibility: PASS
- mission clarity: PASS
- role separation: PASS
- universal/profile boundary: PASS
- GitHub platform boundary: PASS
- brownfield minimum value: PASS
- optimization requirements vs benchmark targets: PASS
- CLI/tooling boundary: PASS
- explicit non-goals: PASS
- accidental Requirements/Architecture implementation: NONE

STOP CONDITION: `READY_FOR_PROJECT_OVERVIEW_REVIEW_AND_CHECKPOINT`.