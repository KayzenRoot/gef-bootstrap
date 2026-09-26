# GBS-M14-S02 — Source Routing and Authority-Bound Selection

Status: `PLANNED_CANDIDATE`
Module: `GBS-M14 — Task & Context Compiler`
Risk: `ELEVATED`
Prerequisite: `GBS-M14-S01 — Task Model and Context Contract` FROZEN

## Purpose
Define how M14 routes an admitted task intent to the smallest set of applicable, authority-valid candidate context units before Minimum Sufficient Context optimization.

S02 is deliberately not a new Source Hierarchy engine. M09 remains the owner of source topology, authority, applicability and source validity. M14 consumes those governed outputs and decides which authority-valid units are relevant enough to become context candidates for one task.

## Input contract
Source routing consumes:
- a valid S01 Task Intent Envelope;
- exact current Source Pack identity;
- M09 semantic source entries / topology nodes;
- Source Topology Mesh relations relevant to task domains;
- Authority Vector Envelope and/or domain-specific authority-resolution result;
- Authority Resolution Proof reference when available/required;
- Applicability Lattice states and Condition Witness references;
- active admitted aliases/legacy mappings from M09/M13 when applicable;
- current checkpoint binding;
- requested task domains/capability;
- explicit risk and context budget;
- optional validity-bound negative knowledge supplied by its owning system.

Missing authority inputs are not guessed from paths, names or recency.

## M09 mechanisms reused by M14
S02 consumes rather than reimplements:
- `TECH-0045 / TECH-M09-01 — Source Topology Mesh`;
- `TECH-0046 / TECH-M09-02 — Authority Vector Envelope`;
- `TECH-0049 / TECH-M09-05 — Applicability Lattice`;
- `TECH-0052 / TECH-M09-08 — Authority Resolution Proof`;
- `TECH-0054 / TECH-M09-10 — Authority Neighborhood Cache`, only as disposable derived acceleration.

Canonical Requirement Matrix and Source Alias Bridge remain M09/M13-owned inputs where relevant. Conflict Shadow Graph remains diagnostic/drift evidence and must not be promoted into normal context as normative truth.

## New GEF-native mechanism: Task-to-Source Router (TSR)
TSR projects a Task Intent Envelope into candidate source neighborhoods.

Routing dimensions may include:
- semantic domain/class;
- task capability/purpose;
- explicit target entity/symbol/component identifiers;
- dependency topology;
- current scope/DoD/decision bindings;
- profile applicability;
- adopted legacy mappings;
- risk-required domains.

TSR returns candidates plus explicit routing reasons. It never says a source is authoritative by itself.

### TSR rules
- route from semantic identifiers/contracts, never merely filename keywords;
- exact target identifiers outrank broad topical neighborhood only for routing relevance, not authority;
- authoritative facts relevant to mandatory task obligations cannot be discarded because a cheaper source exists;
- candidates from unresolved authority domains are marked unresolved, not silently dropped;
- unknown target/entity binding triggers bounded expansion or typed ambiguity rather than fuzzy automatic commitment;
- model similarity may become a future retrieval hint but cannot be authority or sole V1 inclusion criterion.

## New GEF-native mechanism: Authority-Bound Selection Filter (ABSF)
ABSF transforms routed candidates into S01 Authority-Bound Context Units.

A candidate is automatically `ELIGIBLE` only when:
- project binding matches;
- source/source-pack fingerprint is current;
- semantic domain/class is applicable;
- required condition witnesses are satisfied/current;
- authority result is explicit enough for the requested semantic role;
- no blocking conflict/drift makes the unit unsafe for that role;
- source is not dormant/not-applicable for the current task;
- legacy alias/bridge is currently admitted when the route depends on it.

Other outcomes remain explicit: `INELIGIBLE`, `AUTHORITY_UNRESOLVED`, `STALE`, `NOT_APPLICABLE`, `BLOCKED`.

## Selection roles and authority
A single source can play different roles without changing its M09 authority state.

M14 selection roles:
- `TASK_BOUNDARY`
- `CONSTITUTIONAL_CONSTRAINT`
- `NORMATIVE_REQUIREMENT`
- `DECISION_BINDING`
- `SCOPE_DOD_BINDING`
- `ARCHITECTURE_CONTRACT`
- `DESCRIPTIVE_IMPLEMENTATION`
- `TEST_OR_VALIDATION_CONTRACT`
- `DEPENDENCY_CONTRACT`
- `NEGATIVE_KNOWLEDGE`
- `SUPPORTING_REFERENCE`

Role assignment does not promote descriptive evidence into normative truth.

## New GEF-native mechanism: Context Authority Matrix (CAM)
CAM records, for each task obligation/selection role:
- semantic domain;
- required authority class/state;
- selected candidate unit IDs;
- authority-proof/reference binding;
- applicability state/witness;
- conflict/drift state;
- whether the role is satisfied, unresolved or blocked.

CAM is the bridge between M09 authority truth and S03 context sufficiency. S03 may claim an obligation is covered only through a CAM-satisfied role or another explicitly frozen equivalent.

CAM is not a new global ranking table. Different domains may use different authoritative sources and may remain partially unresolved.

## New GEF-native mechanism: Authority Neighborhood Projection (ANP)
ANP creates a bounded task-local projection of the M09 Source Topology Mesh around routed authoritative candidates.

Properties:
- deterministic traversal from explicit seed units;
- bounded node/edge/depth budgets;
- cancellation-aware;
- includes relation type and direction;
- records why a neighbor entered the projection;
- excludes unrelated topology merely because connected transitively beyond admitted closure needs;
- remains disposable derived state;
- exact source fingerprints bind reuse.

ANP may consume M09 Authority Neighborhood Cache for acceleration, but cached ordering or presence never overrides current M09 source truth.

## Conflict handling
S02 never resolves source conflict by selection convenience.

If routed candidates expose conflicting normative authority:
- M09/M11/M13 conflict semantics remain authoritative depending on the conflict class;
- M14 records the affected CAM role as unresolved/blocked;
- conflicting candidates may be carried as diagnostic context when needed for resolution;
- neither side is promoted into ordinary normative context until owning authority resolves it;
- `CONTEXT_AUTHORITY_UNRESOLVED` or `CONTEXT_COMPILATION_BLOCKED` is emitted as appropriate.

Conflict Shadow Graph material may be referenced to explain why a narrow context cannot be trusted, but it does not become normal active truth.

## Applicability handling
M14 respects M09 Applicability Lattice and witnesses.

Rules:
- `NOT_APPLICABLE` is not an error if the owning contract validly establishes it;
- conditional applicability without a current witness is unresolved, not false;
- stale witness invalidates dependent context eligibility;
- task/profile/project differences can change applicability and therefore invalidate a cached route;
- M14 cannot rewrite applicability to shrink context.

## Negative knowledge
Validity-bound negative knowledge can prevent repeated dead-end searches, but only when it binds:
- project/source/checkpoint or other owner-defined validity scope;
- exact searched semantic target/capability;
- proof/reference explaining the absence;
- invalidation trigger.

Negative knowledge can exclude a route only within its proven scope. “Not found previously” without a validity binding has no exclusion authority.

`TECH-0028 — Negative Capability Cache` remains an IMPORTANT integration hook, not a required standalone M14 V1 subsystem.

## Context deduplication rule
Equivalent semantic units must not be injected repeatedly just because they appear through multiple documents/routes.

V1 deduplication key priority:
1. stable semantic unit identity where available;
2. exact governed semantic digest plus compatible role/authority/applicability binding;
3. explicit alias equivalence proven by governed mapping.

Text similarity alone cannot deduplicate normative obligations because similar prose may carry distinct authority or scope.

## New GEF-native mechanism: Context Redundancy Barrier (CRB)
CRB prevents duplicate semantic payload from crossing from routing into MSC construction while preserving distinct provenance/authority references.

Output per retained unit may contain:
- one canonical context payload/reference;
- all relevant provenance/source references;
- roles satisfied;
- aliases collapsed under explicit equivalence;
- duplicate IDs suppressed;
- reason a superficially similar unit was *not* deduplicated.

This directly reduces prompt/context repetition without throwing away governance provenance.

## Relevance is not authority
S02 freezes a strict separation:

`ROUTING_RELEVANCE != SOURCE_AUTHORITY != CONTEXT_SUFFICIENCY`

- relevance decides where to look;
- M09 authority decides what can govern a semantic role;
- S03 sufficiency decides whether the selected set covers the task safely.

A high-relevance descriptive source cannot displace a lower-relevance canonical normative source when both are required for different roles.

## Budget behavior
Routing budgets limit search/graph work but cannot silently weaken mandatory role coverage.

If a budget prevents enough authority-valid candidates from being evaluated:
- return `CONTEXT_BUDGET_EXCEEDED` plus unresolved roles;
- recommend the next deterministic expansion step;
- never claim a partial candidate set is sufficient merely because the budget ended.

## Caching and invalidation
Any reusable routing result must bind at least:
- project ID;
- Task Intent Envelope semantic identity;
- Source Pack semantic identity;
- relevant source fingerprints;
- checkpoint binding where task truth depends on it;
- profile binding where applicability/routing depends on it;
- alias/mapping fingerprints where used;
- policy/schema version.

Changes to relevant bindings invalidate only dependent route/projection results when dependency knowledge is complete; unknown dependency knowledge widens invalidation conservatively.

## Security/privacy rules
- do not route secret values or raw credential stores into reusable context;
- sensitivity classification can force reference-only or exclusion behavior under owning policy;
- route metadata must not leak user-private content unnecessarily;
- no cross-project cache reuse in V1;
- no network/provider lookup from pure routing primitives;
- no application-module import or code execution for discovery.

## Diagnostics reserved/refined
- `TASK_ROUTE_TARGET_AMBIGUOUS`
- `TASK_ROUTE_DOMAIN_UNSUPPORTED`
- `CONTEXT_AUTHORITY_UNRESOLVED`
- `CONTEXT_AUTHORITY_CONFLICT`
- `CONTEXT_APPLICABILITY_UNRESOLVED`
- `CONTEXT_APPLICABILITY_STALE`
- `CONTEXT_SOURCE_STALE`
- `CONTEXT_ALIAS_STALE`
- `CONTEXT_ROUTE_BUDGET_EXCEEDED`
- `CONTEXT_ROUTE_CANCELLED`
- `CONTEXT_ROUTE_CYCLE`
- `CONTEXT_NEGATIVE_KNOWLEDGE_STALE`
- `CONTEXT_DEDUP_EQUIVALENCE_UNPROVEN`

## Required future tests
- deterministic TSR candidate set independent of source enumeration order;
- exact domain/target routing;
- descriptive source never becomes normative through relevance;
- source-pack/project/profile/checkpoint mismatch invalidation;
- Authority Resolution Proof binding preserved;
- unresolved authority blocks required CAM role;
- Applicability Lattice / witness handling;
- stale conditional witness invalidates selection;
- stale legacy alias invalidates dependent route;
- ANP node/edge/depth budget and cancellation;
- conflict shadow never promoted to active normative truth;
- negative knowledge cannot over-exclude outside proven scope;
- semantic dedup removes duplicate payload while preserving provenance;
- similar-but-distinct normative contracts are not merged by text similarity;
- budget exhaustion never claims sufficiency;
- cross-platform deterministic projection.

## Technology disposition
### NECESSARY / reused frozen contracts
- M09 Source Topology Mesh;
- M09 Authority Vector Envelope;
- M09 Applicability Lattice;
- M09 Authority Resolution Proof semantics;
- S01 Authority-Bound Context Unit;
- S01 Context Dependency Closure inputs.

### NECESSARY new M14 V1 mechanisms
- Task-to-Source Router (TSR);
- Authority-Bound Selection Filter (ABSF);
- Context Authority Matrix (CAM);
- Authority Neighborhood Projection (ANP);
- Context Redundancy Barrier (CRB).

### IMPORTANT hooks only
- M09 Authority Neighborhood Cache;
- Negative Capability Cache;
- Progressive Engineering Memory.

### FUTURE / not admitted by S02
- embeddings/vector similarity as retrieval hints;
- learned reranking;
- source entropy scoring;
- graph database replacement;
- predictive prefetch;
- cross-project context reuse.

## Acceptance for S02 freeze
S02 may freeze only if:
- it consumes M09 authority rather than reimplementing it;
- routing relevance is explicitly separate from authority and sufficiency;
- unresolved conflict/applicability fails closed for mandatory roles;
- deduplication cannot erase distinct normative obligations;
- caches are validity-bound and disposable;
- routing budgets cannot manufacture sufficiency;
- no FUTURE technology becomes an implicit V1 dependency;
- no HIGH/CRITICAL planning defect remains.

## Next session
After exact-head audit and checkpoint promotion, the next legal stage is `GBS-M14-S03 — Minimum Sufficient Context and Sufficiency Proof`.

No M14 Work Order or implementation is authorized by S02 planning.

STOP CONDITION: `READY_FOR_GBS_M14_S02_EXACT_HEAD_AUDIT`.
