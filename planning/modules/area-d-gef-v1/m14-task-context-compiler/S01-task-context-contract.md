# GBS-M14-S01 — Task Model and Context Contract

Status: `PLANNED_CANDIDATE`
Module: `GBS-M14 — Task & Context Compiler`
Risk: `ELEVATED`

## Purpose
Define the authoritative task/context contract for M14: how a governed unit of work is represented, how candidate engineering truth becomes selectable context, and what invariants every later context compilation step must preserve.

M14 exists to reduce executor rereads, tokens, discovery branches and repeated reasoning without sacrificing correctness, source authority, dependency coverage, risk coverage or resumability. It compiles context; it does not execute work.

## Five-session topology
M14 is a five-session module. S01 freezes the module-local planning topology:

1. `S01 — Task Model and Context Contract`
2. `S02 — Source Routing and Authority-Bound Selection`
3. `S03 — Minimum Sufficient Context and Sufficiency Proof`
4. `S04 — Context Expansion, Safety Gates and Reuse`
5. `S05 — Context Receipt, Regression and Module Promotion`

The titles are module-local planning decisions introduced here. They do not alter the Master Module Index count or production denominator.

## Ownership boundary
M14 owns:
- deterministic representation of a context-compilation request;
- task-to-governance-domain projection from explicit supplied task metadata;
- selection of authority-bound source facts for context;
- context dependency closure and exclusion reasoning;
- Minimum Sufficient Context computation;
- context sufficiency/expansion diagnostics;
- reusable context-selection receipts and invalidation inputs.

M14 does **not** own:
- Source Hierarchy or canonical-source resolution semantics: M00/M09;
- product/architecture decisions or conflict authority: M11;
- Scope/DoD classification/evaluation: M12;
- adoption/legacy alias admission: M13;
- executable Work Order / execution-pack compilation: M15;
- generic policy runtime: M16;
- checkpoint mutation: M17;
- progress accounting: M21;
- final evidence/proof/assurance: M24/M25/M27;
- Git/GitHub operations: M29+;
- telemetry/benchmark truth: M43/M45;
- quantitative executor-performance thresholds: M63.

## Canonical input principle
M14 consumes already-governed inputs. It must never repair authority by preference, recency, file order, conversational order, majority vote or model confidence.

When required authority is unresolved, M14 emits an unresolved context compilation result or requests expansion/resolution through the owning module. It does not invent the missing fact.

## Task Context Intent
Every context compilation begins with an explicit `TaskContextIntent` containing at minimum:
- project identity;
- task/work-item identity;
- task objective reference or supplied bounded objective;
- requested capability or task class;
- in-scope semantic domains;
- explicit out-of-scope domains when known;
- current Source Pack identity;
- relevant checkpoint identity/reference;
- selected project-profile identity/digest when applicable;
- risk class;
- caller context budget;
- required output purpose (`PLANNING`, `REVIEW`, `EXECUTION_PREPARATION`, `DIAGNOSIS`, or other admitted enum);
- cancellation/budget inputs;
- policy/schema version.

The intent is a request descriptor, not permission to execute or mutate anything.

## New GEF-native mechanism: Task Intent Envelope (TIE)
The Task Intent Envelope is the immutable, deterministic projection of the context-compilation request.

Properties:
- exact project/task/source/checkpoint/profile/policy binding;
- stable semantic identity from canonical normalized fields;
- explicit risk and requested-purpose binding;
- set-like domains normalized deterministically;
- no prompt prose, timestamp or machine-local path may become semantic authority;
- stale project/source/checkpoint/profile bindings invalidate dependent context output.

TIE prevents an old context slice from being reused for a different task merely because the prose looks similar.

## Context unit model
M14 operates on semantic context units rather than arbitrary file blobs.

A `ContextUnit` must be addressable by:
- stable unit identity;
- semantic class/domain;
- source identity and source fingerprint;
- authority status supplied/resolved through M09 contracts;
- project binding;
- content/reference digest;
- dependency references;
- applicability state;
- sensitivity/privacy classification reference when available;
- validity/invalidation inputs;
- provenance references;
- estimated governed work size supplied or deterministically measured without making size an authority signal.

A unit may point to a document section, fact, decision, contract, code symbol/region, test contract, generated governed summary or other admitted semantic representation. M14 should prefer references/digests over unnecessary raw bodies when a downstream consumer does not need the body.

## New GEF-native mechanism: Authority-Bound Context Unit (ABCU)
An ABCU is a `ContextUnit` whose authority, source fingerprint and applicability are explicit enough to be safely considered for inclusion.

States:
- `ELIGIBLE`
- `INELIGIBLE`
- `AUTHORITY_UNRESOLVED`
- `STALE`
- `NOT_APPLICABLE`
- `BLOCKED`

Only `ELIGIBLE` units may enter a narrow compiled context automatically. Other states remain visible as diagnostics or expansion blockers.

ABCU does not duplicate M09 authority resolution. It consumes M09/source-authority outcomes and binds them into the context selection problem.

## Required-context classes
S01 freezes five logical context classes:

1. `CONSTITUTIONAL` — non-negotiable project/GEF constraints relevant to the task;
2. `NORMATIVE` — active approved requirements, decisions, scope, DoD, architecture/contracts relevant to the task;
3. `DESCRIPTIVE` — current code/test/config/runtime/repository evidence needed to understand present state;
4. `DEPENDENCY` — upstream/downstream contracts and invariants required to avoid local-but-invalid change;
5. `NEGATIVE` — validity-bound proof that a source/capability/dependency is absent or intentionally excluded, preventing repeated searches.

These are selection roles, not a replacement for Source Pack semantic classes.

## New GEF-native mechanism: Context Dependency Closure (CDC)
CDC computes the smallest bounded dependency closure required by the selected task domains and context units.

Rules:
- closure follows declared/validated dependency edges only;
- unknown dependency knowledge cannot be treated as no dependency;
- cycles must be detected and surfaced;
- caller budgets can narrow safe defaults only when doing so does not silently drop a required edge;
- node/edge/depth limits and cancellation are mandatory;
- optional or merely related history stays outside the closure unless another rule admits it;
- broad cleanup and unrelated project history are never included just because they are nearby.

If closure cannot be completed safely under budget, result is `CONTEXT_EXPANSION_REQUIRED` or `CONTEXT_COMPILATION_BLOCKED`, never a silently incomplete context.

## Minimum Sufficient Context invariant
`TECH-0016 Minimum Sufficient Context` is adopted as `NECESSARY` for M14/M15.

MSC means the smallest authority-valid context set that still covers:
- task objective and boundaries;
- applicable constitutional constraints;
- active normative truth;
- required descriptive current-state evidence;
- dependency closure;
- risk-specific obligations;
- known blockers/conflicts;
- downstream consumer prerequisites.

“Minimum” never outranks “sufficient”. Context minimization is an optimization objective only after correctness coverage is satisfied.

## Context Sufficiency Proof invariant
`TECH-0017 Context Sufficiency Proof` is adopted as `NECESSARY` for M14.

Every successfully compiled narrow context must be able to explain:
- which obligations/domains were required;
- which context units satisfy each obligation;
- which dependency edges were closed;
- what was intentionally excluded and why;
- what validity fingerprints bind the proof;
- whether dependency knowledge is complete enough for narrow-context use;
- whether a wider safety gate was triggered.

S03 will freeze the exact proof contract and algorithm.

## Full-context safety invariant
`TECH-0030 Full-Context Safety Gate` is adopted as `NECESSARY` for M14, with assurance ownership remaining external.

Narrow context must not be used automatically when any admitted trigger requires broader inspection, including at minimum:
- HIGH_ASSURANCE work where narrow evidence cannot satisfy obligations;
- unresolved source-authority conflict;
- unknown or incomplete dependency closure on a correctness-critical path;
- destructive/irreversible operation preparation;
- security/authentication/financial/signing or other owner-defined high-risk domain requiring wider evidence;
- stale checkpoint/source/profile binding;
- prior context regression affecting a required domain;
- explicit caller or policy requirement for broader inspection.

The gate selects a safer inspection posture; it does not itself grant execution authority.

## New GEF-native mechanism: Context Expansion Ladder (CXL)
When MSC cannot be proven, M14 expands deterministically through bounded stages rather than jumping immediately to “read everything”.

Candidate stages, to be frozen in S04:
1. `LOCAL_REQUIRED`
2. `DEPENDENCY_CLOSURE`
3. `DOMAIN_WIDE`
4. `CROSS_DOMAIN_REQUIRED`
5. `SAFETY_WIDE`
6. `BLOCKED_FOR_AUTHORITY_OR_DECISION`

Each expansion step must state the trigger and added semantic obligations. Expansion by model curiosity is forbidden.

## Efficiency rules
M14 should reduce repeated executor discovery by:
- resolving authoritative context before M15 builds an execution pack;
- carrying validity-bound negative knowledge when safe;
- deduplicating equivalent semantic context by stable identity/digest rather than prose similarity alone;
- preferring delta/references to unchanged accepted context when the consumer contract permits it;
- caching only with exact invalidation bindings;
- separating mandatory context from optional supporting context;
- exposing why each included context unit is present.

M14 may optimize tokens and reads, but M43/M45 measure system effects and M63 owns quantitative executor-performance gates.

## Technology dispositions from central ledger
### NECESSARY for M14 V1
- `TECH-0016 — Minimum Sufficient Context`
- `TECH-0017 — Context Sufficiency Proof`
- `TECH-0030 — Full-Context Safety Gate`
- `TECH-0036 — Authority Resolver` integration, without stealing M09 authority ownership

### IMPORTANT integration hooks, not mandatory subsystems in S01
- `TECH-0014 — Progressive Engineering Memory`
- `TECH-0028 — Negative Capability Cache`

### FUTURE / experimental, explicitly not auto-admitted
- `TECH-0019 — Source Entropy Score`
- `TECH-0031 — Adaptive Context Memory`
- `TECH-0032 — Context Quality Optimizer`
- `TECH-0033 — Historical Context Eviction`

No vector database, embeddings, learned relevance scorer, graph database or LLM judge becomes a V1 dependency from S01.

## Determinism and security constraints
- explicit supplied inputs only;
- startup/import purity;
- no filesystem, network, process, Git or provider side effects from context compilation primitives;
- no environment/home/global-tool state as semantic authority;
- injected SHA-256 digest capability, no weak fallback;
- immutable return snapshots;
- stable code-point ordering for set-like projections;
- hostile/malformed runtime input receives typed diagnostics, not uncaught exceptions where reasonably preventable;
- secret/raw credential material is never copied into reusable context receipts;
- private/sensitive context must be represented only to the degree allowed by the owning security/privacy policy;
- cross-project context reuse is forbidden unless a future explicitly governed mechanism proves provenance/isolation.

## Initial diagnostic vocabulary
S01 reserves at least:
- `TASK_CONTEXT_INTENT_INVALID`
- `TASK_CONTEXT_BINDING_STALE`
- `CONTEXT_UNIT_INVALID`
- `CONTEXT_AUTHORITY_UNRESOLVED`
- `CONTEXT_UNIT_STALE`
- `CONTEXT_DEPENDENCY_MISSING`
- `CONTEXT_DEPENDENCY_CYCLE`
- `CONTEXT_BUDGET_EXCEEDED`
- `CONTEXT_EXPANSION_REQUIRED`
- `CONTEXT_SUFFICIENCY_INDETERMINATE`
- `FULL_CONTEXT_SAFETY_REQUIRED`
- `CONTEXT_COMPILATION_BLOCKED`
- `CROSS_PROJECT_CONTEXT_FORBIDDEN`

Exact implementation codes may be refined before Module Gate but semantics cannot be weakened silently.

## Required future tests
- deterministic TIE identity independent of set-like input ordering;
- project/source/checkpoint/profile mismatch invalidation;
- ABCU eligibility requires explicit authority/fingerprint/applicability;
- no recency/model-confidence authority;
- deterministic CDC closure;
- missing dependency / cycle / node-edge-depth budget / cancellation;
- minimal set excludes unrelated history;
- unknown dependency knowledge cannot prove sufficiency;
- high-risk safety gate expansion;
- cross-project reuse rejection;
- immutable output;
- no filesystem/network/process side effect;
- same semantic input produces equal result on Ubuntu/Windows/macOS.

## Acceptance for S01 freeze
S01 is ready to freeze only when:
- ownership does not overlap M09/M11/M12/M13/M15/M16/M17/M24+/M63;
- MSC remains correctness-first, not token-first;
- task and context identities are exact-bound and invalidatable;
- dependency closure is bounded/cancellable/fail-closed;
- safety expansion cannot be bypassed by a narrow caller budget;
- technology dispositions do not expand V1 with FUTURE candidates;
- no unresolved HIGH/CRITICAL planning defect remains.

## Next session
After S01 exact-head audit and checkpoint promotion, the next legal planning stage is `GBS-M14-S02 — Source Routing and Authority-Bound Selection`.

No M14 Work Order or implementation is authorized by S01 planning.

STOP CONDITION: `READY_FOR_GBS_M14_S01_EXACT_HEAD_AUDIT`.
