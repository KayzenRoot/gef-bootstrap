# GBS-M00-S02 — Source Hierarchy

Status: `FROZEN`

## Purpose
Define how GEF Bootstrap and initialized projects determine authoritative truth with the smallest safe context cost.

The hierarchy distinguishes **authority, freshness, applicability, evidence state, descriptive truth, normative truth, task relevance and assurance requirements**. Source resolution must prevent ChatGPT/Codex from repeatedly rereading broad project documentation or independently re-resolving already-governed conflicts.

## Governing objective

```text
TASK
  -> identify required facts/contracts
  -> classify authority domain
  -> resolve current applicable facts
  -> detect drift/conflict/staleness
  -> resolve dependencies
  -> select Minimum Sufficient Context
  -> deduplicate/compress
  -> prove context sufficiency
  -> compile Source Capsule
  -> EXECUTE or STOP/EXPAND
```

Full-document or broad-repository loading is an escalation path, never the default when smaller verifiable context can satisfy the same obligation.

## Constitutional V1 authority domains
There is no universal total ordering of all project sources. Authority is domain-specific.

The universal V1 domains are:

```text
REPOSITORY_STATE
PROJECT_STATE
DECISION
SCOPE
REQUIREMENT
ARCHITECTURE
SECURITY
COMPLETION
EXECUTION
VALIDATION
PLANNING
FUTURE_WORK
INNOVATION
CONVERSATION
```

| Domain | Primary authority | Supporting evidence |
|---|---|---|
| `REPOSITORY_STATE` | Git + exact code/config | SHA/diff |
| `PROJECT_STATE` | machine current state + approved Checkpoint | Git/PR state |
| `DECISION` | Decisions Ledger / ADR | supersession chain |
| `SCOPE` | Scope | approved decision references |
| `REQUIREMENT` | Requirements | acceptance criteria |
| `ARCHITECTURE` | Architecture + ADR | implementation/contracts |
| `SECURITY` | Security + governed policy/ADR | scans/proofs where relevant |
| `COMPLETION` | Definition of Done | exact evidence/proofs |
| `EXECUTION` | Work Order / Task Manifest | Scope + Architecture |
| `VALIDATION` | exact-head Machine Evidence / gate receipt | test/check output |
| `PLANNING` | approved module/session planning | decisions/dependencies |
| `FUTURE_WORK` | Backlog | planning references |
| `INNOVATION` | Technology & Innovation Ledger | owning session/module |
| `CONVERSATION` | chat/prose | non-canonical unless promoted |

A source is authoritative only inside the domain it is authorized to govern. Project profiles may add subdomains such as `ARCHITECTURE.COMBAT` or `SECURITY.SIGNING`, but may not silently redefine the semantics of the constitutional domains.

## Descriptive truth and normative truth
GEF keeps separate descriptive truth, what exists/behaves at a specific repository state, and normative truth, what the approved project says should exist/behave.

Code/tests may establish descriptive truth. Scope/Requirements/Architecture/Decisions govern normative truth for their domains. A mismatch is explicit drift. Code drift never silently rewrites approved architecture, and stale documentation never silently overrides exact implemented state.

## Drift contract and ownership
S02 freezes the semantic rule that observed and approved truth remain separate and that disagreement produces explicit drift. Recognized semantic classes include `DRIFT_NONE`, `DOCUMENTATION_DRIFT`, `IMPLEMENTATION_DRIFT`, `TEST_DRIFT`, `GOVERNANCE_DRIFT`, `ARCHITECTURAL_DRIFT`, `INTENT_UNKNOWN`, `CONFLICTING_INTENT` and `LEGACY_ACCEPTED`.

A minimal drift reference must identify the domain, observed truth, normative truth, supporting sources/bindings, confidence, risk and resolution state. Detailed discovery, schema, lifecycle, normalization, legacy acceptance and migration belong to `GBS-M13 — GEF Adoption Engine`.

No drift is auto-corrected merely because one source appears newer.

## Canonical Fact Envelope V1
Long canonical documents should expose stable addressable facts where practical. Candidate ID families include `DEC-*`, `ADR-*`, `SCOPE-*`, `REQ-*`, `ARCH-*`, `DOD-*`, `SEC-*`, `TEST-*`, `WO-*` and `PROOF-*`.

Minimum V1 metadata:

```text
id
domain
status
source
locator
fingerprint
dependencies
applicability
```

Conditional metadata when required:

```text
supersedes
supersededBy
compactValue
validatedBinding
```

The fact reference is an address into canonical truth, never a replacement for it. The objective is the minimum metadata sufficient to locate, validate, compare, invalidate and route the fact safely.

## Fingerprint model
V1 adopts a hybrid hierarchy:

```text
DOCUMENT
  -> SECTION
      -> FACT
          -> DEPENDENCY SET
```

A Source Capsule depends only on the smallest authoritative units that support the current task. A governed fact fingerprint must be able to represent, directly or by reference, the fact ID, canonical location, normalized content hash, source/version, dependency IDs, supersession state and applicability/profile. Toolchain/config fingerprints are included only when validity depends on them.

A dependency fingerprint changes when relevant upstream facts change even if local prose is unchanged.

## Dependency invalidation
Invalidation propagates through explicit relationships rather than project-wide pessimism:

```text
SOURCE FACT
   ↓
CONTRACT
   ↓
IMPLEMENTATION REGION
   ↓
TEST IMPACT
   ↓
PROOF
   ↓
SOURCE CAPSULE / EXECUTION PACK / REVIEW STATE
```

Only descendants of a changed relevant node are invalidated by default. Unknown relationships widen the context/validation radius.

## Minimum Sufficient Context
Executor context is the smallest **verifiably sufficient** set of authoritative facts, contracts, dependencies, risks and proof obligations:

```text
MSC = min(Context)
subject to
Assurance(Context) >= Required Assurance
```

The goal is not the smallest prompt. It is the smallest prompt that still protects correctness, security, data integrity and required assurance.

## Source Query Plan
Before assembling expensive context, identify required facts/dependencies for the task. Resolve those facts first rather than injecting full Scope + Requirements + Architecture + Decisions + Checkpoint by reflex.

## Source Capsule
A compact Source Capsule may carry version/project/task bindings, fact IDs, resolved values, source pointers/fingerprints, frozen constraints, unknowns/conflicts, context radius and expansion triggers. It is valid only while referenced source/dependency fingerprints remain compatible and never becomes canonical truth merely because it is convenient.

## Context Sufficiency Proof
Before expensive execution, selected context must be checked for target, contract, dependencies, scope, invariants, validation path, risk, source currency and assurance floor.

Outcomes are `CONTEXT_SUFFICIENT`, `CONTEXT_INSUFFICIENT`, or `SOURCE_EXPANSION_REQUIRED`.

## Context Expansion Ladder
Default expansion direction is `E0 fact -> E1 symbol -> E2 file -> E3 module -> E4 domain -> E5 cross-domain -> E6 project`.

Start at the smallest safe level. Widen only for evidence-backed triggers such as dependency discovery, source conflict, unknown contract, invalid fingerprint, unknown test impact, cross-domain change, security boundary, data-integrity risk, public API change or migration requirement. General curiosity about the repository is not an executor expansion trigger.

## Mandatory broader-read triggers
Token economy yields when the task changes canonical source, extraction/fingerprint confidence is insufficient, dependencies are unknown, authoritative conflict remains unresolved, surrounding context is semantically required, assurance requires broader inspection, brownfield drift is task-relevant, a prior optimization missed a dependency, policy requires broad review, or an agent records a concrete engineering reason narrow context is insufficient.

Expansion reasons should be recorded so repeated unnecessary expansions can later be optimized away.

## Assurance override
Optimization budgets govern tokens/searches/files/tests/time but never override the assurance floor. Security boundaries, money, signing, privileged authorization, secrets, destructive or irreversible operations, critical data integrity and similar high-assurance signals force appropriate expansion/fail-closed behavior.

Formal assurance classes are delegated to `GBS-M27 — Assurance` and security modules. S02 does not prematurely define their detailed taxonomy.

## CURRENT and CHECKPOINT contract
Machine current state and human Checkpoint are two governed views of progression state, not competing authorities. Machine state is compact operational representation; human Checkpoint is richer auditable representation. Shared fields must remain consistent, and disagreement yields `STATE_CONFLICT`.

GEF Bootstrap itself continues using `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json` during planning. Whether initialized target repositories materialize `.gef/current.json`, and its exact schema, is delegated to M17/M18/M19. S02 freezes the semantic contract, not that path.

## Resume fast path
Cross-chat resume should prefer machine current state -> validity/fingerprint check -> compact Resume Capsule when valid; otherwise escalate to Checkpoint plus delta/source inspection.

## Token-aware source rules
1. Do not inject a whole canonical document when an authoritative fact slice is sufficient.
2. Do not repeat the same frozen fact in multiple prompt sections.
3. Prefer stable IDs + compact value + source pointer over duplicated prose.
4. Do not ask Codex to search for a fact already resolved by governance.
5. Cache/reuse stable facts only with validity fingerprints.
6. Reuse compatible context across correction rounds through delta updates.
7. Expand only for dependency/conflict/uncertainty/invalid fingerprint/assurance reasons.
8. Never compress away constraints, uncertainty or proof obligations required for correctness.
9. Separate rich human canonical documentation from compact machine execution context.
10. Measure context/token cost end-to-end so savings are demonstrated rather than assumed.

## Brownfield / existing-project source resolution
Existing repositories are first-class. The source-resolution progression is conceptually `B0 DISCOVER -> B1 MAP -> B2 ALIAS -> B3 BASELINE -> B4 SHADOW -> B5 PROMOTE -> B6 NORMALIZE`.

GEF discovers actual code/docs/tests/checks, maps existing sources to authority domains, aliases rather than copies canonical material, binds observed behavior to fingerprints, runs risky optimization/test/proof decisions in shadow, promotes only after evidence and normalizes only where engineering ROI justifies it.

It must not rewrite working architecture merely to match GEF naming, invent missing history, discard active work, or imply uniform optimization confidence. Observed behavior may remain descriptive truth while intent is `UNKNOWN`. Early safe benefits include prompt narrowing, source routing, delta review, search budgets and compact evidence. Aggressive test skipping/proof reuse remains shadow-only until validated.

Detailed brownfield lifecycle/maturity contracts belong to M13.

## Progressive Engineering Memory
Approved work should make comparable future work cheaper to understand. Governed reusable knowledge may include repository/domain maps, resolved architecture questions, dependency relationships, source/test mappings, known failures, negative capability/context knowledge and valid reusable proofs. All reuse is validity-bound and subordinate to current canonical sources.

## Conflict outcomes
Source resolution supports at least `SOURCE_MATCH`, `SOURCE_STALE`, `SOURCE_CONFLICT`, `SOURCE_MISSING`, `SOURCE_SCOPE_GAP` and `SOURCE_EXPANSION_REQUIRED`. Codex must not improvise through conflict, missing authority or scope gaps.

## Supersession
A governed fact/decision may be superseded only by an authority valid for the same domain and through an explicit mechanism carrying relevant old/new identity, approval/effective binding, reason, downstream impact and invalidation state. Historical material remains auditable but inactive after valid supersession.

## V1 technology routing
S02 classifies source/context capabilities for scope routing without freezing detailed implementations outside owning modules.

**NECESSARY:** Semantic Source Router, Canonical Fact Index, Authority Resolver capability, Source Capsule Compiler, Minimum Sufficient Context, Context Expansion Ladder, Context Sufficiency Proof, hybrid fact/dependency fingerprints, dependency invalidation, Brownfield Truth Reconciliation capability, Progressive Governance Envelope capability and Full-Context Safety Gate capability.

**IMPORTANT:** Repository Knowledge Map, Progressive Engineering Memory, Delta Context Capsule, Context Dedup Graph, Engineering ROI Governor, Knowledge Appreciation Metrics and related bounded optimization evidence.

**FUTURE/experimental unless later promoted by evidence:** Context Temperature, predictive context prefetch, Source Entropy Score, Historical Context Eviction, advanced Adaptive Context Memory behavior and Cross-Project Engineering Memory.

Potentially overlapping mechanisms should be consolidated rather than proliferated unless evidence proves separate ownership useful.

## Source Hierarchy Conformance Receipt
A future Bootstrap materialization must prove source-hierarchy application rather than print decorative success. Evidence must be able to demonstrate authority mapping, canonical source discovery, conflict/missing-source detection, fact addressability, fingerprints/dependency validity, brownfield drift preservation, MSC construction, expansion policy and fail-closed configuration.

Permitted terminal families include `SOURCE_HIERARCHY_READY`, `READY_WITH_GAPS`, `SOURCE_CONFLICT`, `SOURCE_MISSING`, `BROWNFIELD_MAPPING_REQUIRED` and `BLOCKED`. Exact receipt schema belongs to evidence/bootstrap-validation modules.

## Safety invariants
- Conversation never silently outranks canonical repository sources.
- Newer never automatically means more authoritative.
- Code drift never silently rewrites approved intent.
- A compact capsule never becomes canonical truth by itself.
- Missing authority is not permission.
- `UNKNOWN` never becomes `ALLOW`.
- Stale fingerprints invalidate cached context.
- Source compression remains auditable to canonical material.
- Assurance requirements override optimization budgets.
- Existing-project optimization is progressive, never false-confidence global adoption.

## Frozen decision summary
S02 freezes a **domain-aware, fact-addressable, dependency-fingerprinted, brownfield-safe source hierarchy** that compiles Minimum Sufficient Context, expands only on evidence-backed triggers, separates implemented truth from approved intent, and uses validity-bound reusable knowledge to reduce recurring tokens, search and executor latency without weakening assurance.

Detailed schemas, materialization paths, assurance classes, brownfield lifecycle and implementation mechanics remain delegated to their owning modules.

## Freeze audit
- S01 consistency: PASS
- Planning Protocol boundary: PASS
- Decisions Ledger synchronization: PASS
- Technology Ledger synchronization: PASS
- descriptive/normative truth separation: PASS
- token-economy safety floor: PASS
- brownfield preservation: PASS
- assurance ownership separation: PASS
- technology scope classification: PASS
- machine-current path not prematurely frozen: PASS
- conformance evidence requirement: PASS
- accidental product implementation: NONE

STOP CONDITION: `READY_FOR_GBS-M00-S02_REVIEW_AND_CHECKPOINT`.