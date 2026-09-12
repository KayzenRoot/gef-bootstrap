# Project Overview

Status: `IN_DISCUSSION`

## Project
**GEF Bootstrap**

## Constitutional binding
This overview is derived from `GBS-CONSTITUTION-v1.0` and must remain compatible with `CONST-F1` through `CONST-F8`. It summarizes the product boundary for downstream planning; it does not supersede the Constitution or Decisions Ledger.

## Product definition
GEF Bootstrap is a **versioned instruction/governance repository** used by ChatGPT, Codex and compatible future agents to initialize or progressively govern software projects under the GEF V1 engineering model.

It is not a standalone runtime application or CLI product. Its value is the governed knowledge, protocols, schemas, templates, planning structures, evidence contracts, review rules and reusable bootstrap instructions that compatible agents materialize into a target repository.

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

## Expected target-repository outcomes
Depending on profile and adoption mode, Bootstrap materialization should be capable of creating or mapping a governed project surface that includes applicable:

- project identity and fingerprint;
- source/authority model;
- project overview and requirements;
- scope and Definition of Done;
- architecture/security/test/deployment planning sources;
- decisions/ADR system;
- checkpoint/resume state;
- GEF adoption/policy/execution/review/evidence contracts;
- Git/GitHub governance assets;
- evidence and conformance receipts;
- progress/baseline/telemetry structures;
- prompt/execution/review artifacts;
- brownfield compatibility/gap mappings.

Exact artifacts remain owned by later modules and profiles. This overview does not freeze their filenames or schemas beyond already frozen constitutional decisions.

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

## Product boundary
### In the core product
- governance/instruction assets required to initialize and guide GEF projects;
- planning/source-pack contracts;
- GEF V1 adoption rules;
- context/prompt/execution/review optimization design;
- evidence/assurance/continuity/progress/governance contracts;
- target-repository materialization instructions;
- new-project and brownfield adoption paths;
- Git/GitHub governance planning and conformance where applicable;
- measurement/baseline path for engineering-cost optimization.

### Not automatically core
- a standalone CLI/runtime daemon/application;
- UADS/Hive/UGAS dependency;
- project-specific product architecture belonging to target projects;
- cross-project engineering memory before dedicated provenance/security design;
- experimental optimizations that have not been admitted into V1 scope.

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
- Requirements: `UNPLANNED`
- Scope: `UNPLANNED`
- Architecture: `UNPLANNED`
- Functional implementation: `NOT_STARTED`
- Overall completion: `NOT_YET_BASELINED`
- ETA: `NOT_YET_RELIABLE`

## Questions to close before freeze
1. What exact one-sentence product mission should appear in README and future Master Bootstrap Prompt?
2. Should the canonical user of the repository be described primarily as the project owner, the planning agent, the executor, or all three with explicit roles?
3. Which target-repository outcomes are universally mandatory versus profile/adoption-mode conditional?
4. Should GitHub be part of the minimum universal target contract or a first-class optional platform profile for non-GitHub repositories?
5. What minimum brownfield benefit must be achievable before full governance normalization?
6. Which optimization dimensions are constitutional requirements versus later benchmark targets?
7. What explicit non-goals should be frozen here to prevent future scope creep?

## Current direction
A universal, instruction-first engineering bootstrap that turns expensive repeated AI/software-development reasoning into **governed, validity-bound, reusable project knowledge**, allowing agents to execute narrower, faster and more provably while keeping correctness and assurance above optimization.