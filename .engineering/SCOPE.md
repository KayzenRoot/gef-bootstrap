# Scope

Status: `IN_DISCUSSION`

## Binding
Scope is derived from `GBS-CONSTITUTION-v1.1`, frozen Project Overview and frozen Requirements. The Master Module Index remains inventory, not automatic V1 commitment.

## Admission model
Classification uses `NECESSARY`, `IMPORTANT`, `FUTURE`, `OUT_OF_SCOPE`. A NECESSARY item requires one traceable primary constitutional/requirement admission basis. IMPORTANT never auto-enters V1. Sessions inherit module classification unless an explicit override is justified.

## V1 boundary under discussion
The current admission hypothesis is a **small but complete hybrid production slice**, not all 64 inventory modules. V1 must be capable of bootstrapping both NEW_PROJECT and EXISTING_PROJECT targets, must physically contain the deterministic work plane frozen in Requirements, and must be testable/releasable without depending on UADS/Hive/UGAS.

### Candidate NECESSARY capability groups
1. Canonical governance/source pack: identity, source authority, Requirements/Scope/Architecture/Security/Test/DoD/Decisions/Checkpoint contracts.
2. New-project and brownfield bootstrap/adoption.
3. GEF V1 task/context/execution/review/evidence contracts.
4. Deterministic work plane: local repo inspection, plan/materialize/update, validation, fingerprints/state comparison, deterministic diffs/manifests, conformance and receipts.
5. Safety/recovery/integrity/version compatibility required for deterministic mutation.
6. Checkpoint/resume/current-state continuity.
7. Git/GitHub first-class profile sufficient for governed branch/PR/check/evidence workflows, with truthful permission gaps.
8. Progress/DoD/baseline sufficient to make completion measurable.
9. Token/time/repository-discovery/validation/retry/review telemetry and reproducible benchmark path.
10. Tests/conformance sufficient to prove the shipped semantic contracts and deterministic plane.
11. User/engineering documentation and V1 final acceptance/release path.

### Candidate IMPORTANT / post-V1
- richer profile library beyond the minimum representative profiles;
- advanced adaptive context-temperature/prefetch heuristics before telemetry proves ROI;
- sophisticated numeric entropy/ROI scoring;
- additional non-GitHub platform adapters beyond core portability contracts;
- broad distribution/install UX beyond what is required to operate the V1 deterministic plane;
- advanced performance optimizations that lack representative baseline evidence.

### Candidate FUTURE / OUT_OF_SCOPE for V1
- UADS, Hive and UGAS adapters as core completion blockers;
- cross-project memory with authority over local sources;
- always-on daemon/service;
- general-purpose IDE;
- hard-coded AI planner replacing ChatGPT/planning agents;
- universal percentage improvement guarantees;
- mandatory full brownfield historical normalization;
- every inventory module/session solely because it exists in the index.

## Hybrid scope invariant
The deterministic plane is no longer optional tooling. V1 is not complete if only Markdown governance exists. Conversely, deterministic code alone is insufficient: it must remain subordinate to the semantic/governed plane and prove conformance to frozen requirements.

## Construction invariant
All GEF Bootstrap implementation is performed through ChatGPT and connected project tools. Codex is not an implementation executor for this repository.

## Questions for this Scope stage
1. Which of the 64 inventory modules are truly NECESSARY to satisfy the frozen requirements and which should be merged/reframed/deferred?
2. What is the smallest representative profile set needed for a credible V1 without bloating maintenance?
3. How much GitHub automation belongs in NECESSARY V1 versus IMPORTANT convenience?
4. Which telemetry/benchmark functions are required to prove the optimization objective at V1 release?
5. Which test/conformance modules can be consolidated now that the product is hybrid rather than a pure runtime/CLI or pure instruction repository?
6. Which legacy module names/responsibilities marked REFACTOR_REQUIRED should be renamed while preserving stable IDs?
7. What exact admitted backlog/weight model will create the first trustworthy overall completion baseline after Scope + DoD are frozen?

## Current stop
Do not begin Architecture or implementation yet. Resolve the Scope classification against the Master Module Index and frozen REQ set first.

STOP CONDITION: `SCOPE_CLASSIFICATION_REQUIRED`.
