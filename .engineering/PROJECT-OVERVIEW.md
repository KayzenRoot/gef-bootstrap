# Project Overview

Status: `FROZEN`

## Project
**GEF Bootstrap**

## Constitutional binding
This overview is derived from `GBS-CONSTITUTION-v1.1` and remains compatible with `CONST-F1` through `CONST-F8`. It summarizes the product boundary for downstream planning; it does not supersede the Constitution, Amendment 0001 or Decisions Ledger.

## Mission
**Turn repeated AI-assisted software-engineering discovery and reasoning into governed, validity-bound, reusable project knowledge so new and existing repositories can be planned, executed, reviewed and resumed with less token cost, less executor latency and stronger evidence without weakening correctness or assurance.**

## Product definition
GEF Bootstrap is a **hybrid engineering-governance product** composed of two deliberately separated planes:

1. a governed semantic/instruction plane, where ChatGPT/Planning Agent reasons from canonical GitHub state and owns planning semantics, source truth, scope, architecture intent, review semantics and governed change;
2. a deterministic work plane, implemented in code where mechanical automation provides safer/faster/cheaper execution for known inputs.

The governed repository remains the semantic brain of the product. The deterministic work plane is an official product component but never silently becomes semantic authority.

## Deterministic work plane
The deterministic plane may be exposed through CLI commands, scripts, libraries or other bounded interfaces. A standalone CLI binary is not itself the constitutional requirement.

The plane may perform deterministic tasks such as:
- target-repository artifact materialization;
- schema/contract validation;
- fingerprint/hash computation;
- repository-state inspection;
- deterministic diff/index generation;
- conformance/receipt generation;
- other bounded transformations from known governed inputs.

## Self-construction policy
GEF Bootstrap itself is built **entirely through ChatGPT in this project**, using the connected GitHub and available development/deployment tools. Codex is not used as an implementation executor for this repository.

This restriction is specific to building GEF Bootstrap. Target repositories initialized by GEF may use Codex or other executors under governed execution contracts.

## Problem being solved
AI-assisted software construction repeatedly pays costs that should not need to be paid again: broad rereads, rediscovery of settled architecture, repetitive searches, unnecessary test breadth, verbose evidence, reopened decisions, lost chat continuity and brownfield restarts.

GEF Bootstrap converts those recurring costs into governed reusable project knowledge and deterministic reusable mechanics.

## Primary objective
Minimize **total safe engineering cost per accepted change** while preserving or improving correctness and assurance.

The cost model includes model/executor tokens, wall-clock time, repository discovery, validation/test time, CI waiting, retries, correction rounds, semantic review, evidence cost and escaped-defect risk.

Token economy and executor latency are first-class design objectives. They never override correctness, security, integrity or required assurance.

## Canonical roles
### Project Owner
Owns product intent and deliberate direction changes.

### Planning Agent
Reads canonical source truth, resolves ambiguity, performs high-cost reasoning and compiles bounded execution/review context.

### Executor
Applies approved bounded changes/materialization recipes and returns compact evidence.

### Reviewer / Auditor
Evaluates exact-state evidence, semantic delta, invalidated proofs, conformance and produces governed verdicts.

One person/agent may hold multiple logical roles, but responsibilities remain distinct.

## Core operating model
```text
CANONICAL GITHUB STATE
  -> ChatGPT / Planning Agent reasoning
  -> frozen governed decisions
  -> Minimum Sufficient Context / execution contract
  -> deterministic work plane and/or bounded executor
  -> impacted validation/evidence
  -> semantic delta review
  -> checkpoint/proof promotion
  -> reusable engineering knowledge
```

## Supported adoption modes
### New project
Establish governed planning/materialization before product implementation.

### Existing / brownfield project
Inventory/map actual truth, preserve working architecture/active work, introduce governance progressively and deliver early safe value without full historical normalization first.

## Universal target contract
Every successfully bootstrapped target project must have enough governed state for stable identity, recoverable source authority, explicit adoption mode/gaps, planning/decision/checkpoint/resume path, bounded execution/review/evidence policy and truthful readiness/conformance outcomes.

## Profile/adoption-mode conditional outcomes
Detailed Requirements/Scope/Architecture/Security/Test/Deployment, platform workflows/rulesets, telemetry, proof/test-impact machinery, brownfield maturity structures and ecosystem adapters are materialized when applicable.

## Platform boundary
A version-controlled repository is part of the expected model. GitHub is the primary first-class platform profile, but the core semantics may be satisfied by equivalent governed platforms later.

## Minimum brownfield value
Before full normalization, existing projects must be able to receive identity/baseline, active-area source mapping, bounded context/search behavior, compact evidence/delta review, checkpoint continuity and shadow-mode optimization.

## Optimization measurement
V1 must be able to measure or explicitly classify unavailable/estimated token, time, discovery, validation, retries/corrections, review/evidence and proof/cache behavior. Specific improvement percentages remain benchmark claims until proven.

## Foundational invariants
1. Source truth outranks conversational memory.
2. Authority is domain-specific.
3. Descriptive and normative truth remain distinct.
4. Executor context targets Minimum Sufficient Context.
5. Context expansion is evidence/assurance driven.
6. Assurance outranks optimization budgets.
7. Inventory is not V1 commitment.
8. Executors cannot authorize product-scope expansion.
9. DONE is evidence-bound.
10. Brownfield adoption is progressive and preservation-first.
11. Frozen decisions change only through governed supersession.
12. Optional ecosystem integrations do not silently become core.
13. Accepted work should reduce comparable future rediscovery.
14. The deterministic work plane is a product component but is authoritative only for bounded mechanical operations.
15. ChatGPT is the construction executor for the GEF Bootstrap repository itself; Codex is not used to build this project.

## Product boundary
### Core product
- governed instruction/source assets;
- GEF planning/source-pack contracts;
- target-repository materialization behavior;
- deterministic work-plane capabilities required by admitted V1 scope;
- context/prompt/execution/review optimization;
- evidence/assurance/continuity/progress contracts;
- new-project and brownfield adoption;
- platform governance/conformance where applicable;
- measurement/baseline path.

### Current non-goals
- replacing ChatGPT/planning semantics with hard-coded planner logic;
- making a CLI interface itself the semantic source of truth;
- requiring an always-on daemon/service unless later architecture proves necessity;
- requiring UADS/Hive/UGAS to function;
- rewriting target architecture solely for GEF naming;
- full brownfield normalization before use;
- cross-project memory authority without dedicated provenance/security design;
- token/time savings that weaken assurance;
- universal improvement claims without evidence.

## Integration boundary
UADS, Hive, UGAS and future ecosystems remain optional adapters/capabilities unless a future governed scope decision changes that boundary.

## Success model
GEF Bootstrap succeeds when it can initialize or progressively govern target repositories, compile bounded work from canonical sources, safely reduce rediscovery/context/test cost, produce evidence-bound review/completion, preserve cross-chat continuity and demonstrate measurable engineering-cost behavior when data exists.

## Current project stage
- Constitution: `GBS-CONSTITUTION-v1.1` amendment pending merge/checkpoint on this branch
- Completed module: `GBS-M00 — Bootstrap Constitution`
- Source Pack: `IN_PLANNING`
- Project Overview: `FROZEN — amended for hybrid product model`
- Requirements: `IN_DISCUSSION` on separate preserved branch
- Scope: `UNPLANNED`
- Architecture: `UNPLANNED`
- Functional implementation: `NOT_STARTED`
- Overall completion: `NOT_YET_BASELINED`
- ETA: `NOT_YET_RELIABLE`

## Amendment note
This revision implements `CONSTITUTION-AMENDMENT-0001-HYBRID` under the constitutional Reopen Gate. The prior v1.0 Project Overview remains historical truth before the amendment.
