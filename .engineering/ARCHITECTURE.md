# Architecture

Status: `IN_DISCUSSION`

## Binding
This Architecture stage derives from:
- `GBS-CONSTITUTION-v1.1`;
- frozen Project Overview;
- frozen Requirements;
- frozen complete-production Scope;
- `ADR-0001-COMPLETE-PRODUCTION-TARGET.md`.

No implementation begins from this document until Architecture is reviewed/frozen and the remaining ordered Source Pack stages permit construction.

## Architectural objective
Design one complete production-quality hybrid GEF Bootstrap that combines:

1. **Semantic Plane** — governed repository state consumed by ChatGPT/compatible planning agents for product reasoning, requirement interpretation, scope/architecture intent, assurance policy and semantic review.
2. **Deterministic Work Plane** — local product code for bounded repeatable operations such as repository inspection, mutation planning/application, validation, fingerprints, state comparison, deterministic manifests/diffs, conformance and receipts.
3. **Platform/Profile Plane** — provider/profile adapters such as GitHub and optional UADS/Hive/UGAS integrations without contaminating core semantics.
4. **Evidence & Assurance Plane** — exact-state evidence, proof validity/invalidation, impacted validation, HEDS delta review, assurance gates and recovery proof.
5. **Continuity & Knowledge Plane** — checkpoint/resume, project registry, governed engineering memory, fact/dependency maps and progressive brownfield knowledge.
6. **Observability & Optimization Plane** — token/time/search/test/retry/review telemetry, baseline/benchmark and engineering ROI.

## Architectural invariants already frozen
- Canonical project truth lives in governed repository sources, not chat memory.
- ChatGPT/planning remains the semantic reasoning authority under canonical sources.
- Deterministic tooling cannot silently decide scope, requirements, architecture intent, risk acceptance or semantic verdicts.
- Local checked-out Git repository/filesystem is the universal deterministic substrate.
- GitHub is the reference hosted profile, not a semantic dependency of core.
- New-project and brownfield adoption are both first-class.
- Assurance overrides token/time/search/test budgets.
- Exact-state evidence and targeted invalidation are required where applicable.
- The product is one complete production target, not an MVP-first architecture.
- GEF Bootstrap itself is implemented through ChatGPT + connected tools, not Codex.

## Candidate top-level component model

```text
                          PROJECT OWNER
                               │
                               ▼
                    ┌─────────────────────┐
                    │  SEMANTIC PLANE     │
                    │ ChatGPT / Planner   │
                    └──────────┬──────────┘
                               │ governed intent / packs
                               ▼
                    ┌─────────────────────┐
                    │ CONTRACT / COMPILER │
                    │ source + task +     │
                    │ execution/review    │
                    └───────┬─────┬───────┘
                            │     │
            deterministic   │     │ evidence/assurance
                 work       │     │
                            ▼     ▼
            ┌──────────────────┐  ┌────────────────────┐
            │ DETERMINISTIC    │  │ EVIDENCE &         │
            │ WORK PLANE       │  │ ASSURANCE PLANE    │
            └────────┬─────────┘  └──────────┬─────────┘
                     │                       │
                     ├──────────┬────────────┤
                     ▼          ▼            ▼
              LOCAL GIT/FS   PROFILES     CHECKPOINT /
                            GitHub,etc.    KNOWLEDGE
                     │          │            │
                     └──────────┴─────┬──────┘
                                      ▼
                              TARGET REPOSITORY
```

This is a logical architecture, not yet a language/framework or deployment decision.

## Candidate architectural layers

### A. Canonical Knowledge Layer
Owns human/auditable canonical sources, stable IDs, source authority, decisions, requirements, scope, architecture, security, DoD, checkpoint and technology ledger.

### B. Machine Contract Layer
Owns versioned schemas/contracts for project identity, current state, source facts, context capsules, execution packs, evidence, receipts, proof graph, test impact, telemetry and compatibility metadata.

### C. Semantic Compilation Layer
Owns source routing, Minimum Sufficient Context, context sufficiency, task classification, pre-resolved execution packs, review packs and governed escalation.

### D. Deterministic Kernel Layer
Owns deterministic repository inspection, preflight, mutation planning, filesystem-safe apply, rollback/recovery metadata, hashing/fingerprints, schema validation, state diff/comparison, conformance and receipts.

### E. Adapter/Profile Layer
Owns project profiles, GitHub provider behavior, generic provider contracts and optional ecosystem adapters. Core consumes provider-neutral interfaces.

### F. Assurance Layer
Owns evidence binding, proof graph, assurance policy, impacted test/validation selection, HEDS delta review and terminal-state validation.

### G. Continuity Layer
Owns current/checkpoint consistency, resume capsules, project registry and validity-bound progressive engineering memory.

### H. Observability Layer
Owns token/time/search/files/tests/retries/review telemetry, audit ledger, baseline/benchmarks and ROI/regression reporting.

### I. Distribution/Operator Layer
Owns distribution/setup, operator/interaction UX, help, diagnostics/self-doctor, upgrades, compatibility and release operations.

## Dependency direction candidate
Architecture should favor inward dependencies:

```text
Operator / Provider / Adapter
          ↓
Application Orchestration
          ↓
Domain Contracts & Policies
          ↓
Deterministic Primitives / Canonical Models
```

Core domain contracts must not import GitHub-specific semantics. Semantic-plane source contracts must not depend on a particular LLM vendor/model. Deterministic primitives should be usable from CLI, scripts, library calls or future interfaces.

## Local-first execution candidate
The deterministic work plane should operate locally against a checked-out repository by default:

```text
DETECT
  → SNAPSHOT/PREFLIGHT
  → PLAN
  → VALIDATE PLAN
  → APPLY/STAGE
  → VERIFY
  → RECEIPT
  → PROMOTE or ROLLBACK/RECOVER
```

Hosted-provider operations are separate side effects coordinated through provider adapters and truthful receipts.

## State separation candidate
Three state categories should remain explicit:

1. `CANONICAL_STATE` — approved human/governed source truth.
2. `DERIVED_STATE` — indexes, fingerprints, maps, caches and compiled capsules reproducible from canonical/repository inputs.
3. `OPERATIONAL_STATE` — current run/transaction/checkpoint/receipt status.

Derived/operational state may accelerate work but never silently supersedes canonical state.

## Deterministic mutation safety candidate
Every mutable deterministic operation should follow an inspectable transaction envelope:

```text
Target Identity
+ Expected State Binding
+ Allowed Surface
+ Planned Operations
+ Pre-change Recovery Material
+ Apply Result
+ Post-state Verification
+ Receipt
```

External side effects that cannot be atomically rolled back must declare recovery limitations before execution.

## Architecture and token economy
Architecture must reduce recurring LLM work rather than merely move prose around. Candidate principles:
- canonical sources are rich but executor context is compiled/sliced;
- stable machine contracts avoid repeated interpretation;
- deterministic work handles mechanical truth;
- validated derived state is fingerprint-bound and reusable;
- source/test/proof dependency graphs support targeted invalidation;
- correction rounds carry delta context rather than full prior context;
- provider and project-profile variation is isolated behind contracts;
- telemetry measures end-to-end savings and regressions.

## Cross-platform candidate
Architecture should target Windows, Linux and macOS for the local deterministic plane unless later environment discovery proves an explicit unsupported case. OS-specific behavior must live behind filesystem/process abstractions rather than leak into domain contracts.

## Candidate implementation-technology decision criteria
Language/framework selection will be an Architecture decision and should be evaluated against:
- filesystem/Git/process reliability;
- cross-platform packaging;
- JSON/schema/tooling ecosystem;
- startup/runtime overhead;
- testability;
- secure dependency surface;
- library + CLI/interface ergonomics;
- GitHub integration options;
- maintainability through ChatGPT-based implementation;
- deterministic behavior and reproducible builds;
- installation friction for target projects.

No language is frozen yet.

## Architecture questions to close
1. What implementation language/runtime best fits the deterministic work plane and distribution requirements?
2. Monorepo single package versus modular packages/workspaces?
3. Should the primary operator surface ship as a CLI plus library API, or library-first with thin CLI wrapper?
4. What storage model should derived/operational state use: repository-local JSON/files only, SQLite, or a layered model?
5. What exact transaction/recovery design should govern filesystem mutation?
6. How should Git operations and GitHub provider operations be separated from generic filesystem/repository primitives?
7. What process/plugin boundary should optional adapters use so UADS/Hive/UGAS cannot destabilize core?
8. What machine-contract format/versioning strategy should be canonical for schemas and receipts?
9. How should Windows/Linux/macOS packaging and updates work without turning distribution into a brittle installer problem?
10. Which architectural boundaries are independently testable so the 64-module plan can share infrastructure without collapsing assurance ownership?

## Current architecture direction
A **local-first, contract-driven modular hybrid architecture** is favored: rich canonical governance + semantic compilation + deterministic transactional kernel + provider/profile adapters + evidence/assurance + continuity/knowledge + observability, with interfaces thin and semantic authority kept outside deterministic mechanics.

STOP CONDITION: `ARCHITECTURE_DECISIONS_REQUIRED`.
