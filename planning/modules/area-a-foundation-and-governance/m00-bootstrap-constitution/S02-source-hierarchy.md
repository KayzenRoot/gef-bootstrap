# GBS-M00-S02 — Source Hierarchy

Status: `IN_DISCUSSION`

## Purpose
Define how GEF Bootstrap and initialized projects determine authoritative truth with the smallest safe context cost.

The hierarchy must distinguish **authority, freshness, applicability, evidence state, descriptive truth, normative truth, task relevance and assurance requirements**. Source resolution should prevent ChatGPT/Codex from repeatedly rereading broad project documentation or independently re-resolving already-governed conflicts.

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

## Authority is domain-specific
There is no universal total ordering of all project sources. Authority depends on the question being asked.

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

A source is authoritative only inside the domain it is authorized to govern.

## Descriptive truth and normative truth
GEF keeps separate:

- **Descriptive truth**: what exists/behaves at a specific repository state.
- **Normative truth**: what the approved project says should exist/behave.

Example:

```text
IMPLEMENTED_STATE = B
APPROVED_STATE    = A
DRIFT              = TRUE
```

Code/tests may establish descriptive truth. Scope/Requirements/Architecture/Decisions govern normative truth for their domains. Code drift never silently rewrites approved architecture, and stale documentation never silently overrides exact implemented state.

## Drift classification
Initial candidate classes:

- `DRIFT_NONE`
- `DOCUMENTATION_DRIFT`
- `IMPLEMENTATION_DRIFT`
- `TEST_DRIFT`
- `GOVERNANCE_DRIFT`
- `ARCHITECTURAL_DRIFT`
- `INTENT_UNKNOWN`
- `CONFLICTING_INTENT`
- `LEGACY_ACCEPTED`

A drift record should capture at least:

```text
id
domain
type
observedState
normativeState
sources
confidence
risk
affectedFacts
affectedDomains
resolutionState
resolutionDecision
createdAtBinding
resolvedAtBinding
```

Possible governed resolutions include `FIX_IMPLEMENTATION`, `UPDATE_SPEC`, `CREATE_ADR`, `ACCEPT_LEGACY`, `DEFER`, and `BLOCK`. No drift is auto-corrected merely because one source appears newer.

## Canonical Fact Envelope
Long canonical documents should expose stable addressable facts where practical.

Candidate ID families:
- `DEC-*` / `ADR-*`
- `SCOPE-*`
- `REQ-*`
- `ARCH-*`
- `DOD-*`
- `SEC-*`
- `TEST-*`
- `WO-*`
- `PROOF-*`

Minimum fact metadata direction:

```text
Fact ID
Domain
Status
Canonical Source
Canonical Location
Compact Value
Fingerprint
Dependencies
Supersedes
Applicability
Last Validated Binding
```

The fact reference is an address into canonical truth, never a replacement for it.

## Fingerprint model
Preferred direction is a hybrid hierarchy:

```text
DOCUMENT
  -> SECTION
      -> FACT
          -> DEPENDENCY SET
```

A Source Capsule should depend only on the smallest authoritative units that support the current task.

A governed fact fingerprint should be able to represent, directly or by reference:
- fact ID;
- canonical location;
- normalized content hash;
- source/version;
- dependency IDs;
- supersession state;
- applicability/profile;
- toolchain/config only when validity depends on them.

A dependency fingerprint changes when relevant upstream facts change even if local prose is unchanged.

## Dependency invalidation
Invalidation should propagate through explicit relationships rather than project-wide pessimism.

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

## Minimum Sufficient Context (MSC)
Executor context should be the smallest **verifiably sufficient** set of authoritative facts, contracts, dependencies, risks and proof obligations.

Conceptually:

```text
MSC = min(Context)
subject to
Assurance(Context) >= Required Assurance
```

The goal is not the smallest prompt. It is the smallest prompt that still protects correctness, security, data integrity and required assurance.

## Source Query Plan
Before assembling expensive context, identify required facts/dependencies for the task. Example:

```text
TASK: modify refresh-token rotation
NEEDS:
  SCOPE-AUTH-001
  REQ-AUTH-022
  ARCH-AUTH-004
  ADR-017
  WO-0042
  PROOF-AUTH-ROTATION
```

Resolve these facts first rather than injecting full Scope + Requirements + Architecture + Decisions + Checkpoint by reflex.

## Source Capsule
Candidate compact fields:

```text
sourceCapsuleVersion
projectFingerprint
baseSha/headSha
workOrder/task
factIds
resolvedValues
sourcePointers
sourceFingerprints
frozenConstraints
openUnknowns
conflicts
contextRadius
expansionTriggers
```

A capsule is valid only while referenced source/dependency fingerprints remain compatible. It never becomes canonical truth merely because it is convenient.

## Context Sufficiency Proof
Before expensive execution, selected context should be checked for:

```text
target known
contract known
dependencies sufficiently known
scope known
invariants known
validation path known
risk classified
sources current
assurance floor satisfied
```

Outcomes:
- `CONTEXT_SUFFICIENT`
- `CONTEXT_INSUFFICIENT`
- `SOURCE_EXPANSION_REQUIRED`

## Context Expansion Ladder
Default expansion direction:

- `E0` fact
- `E1` symbol
- `E2` file
- `E3` module
- `E4` domain
- `E5` cross-domain
- `E6` project

Start at the smallest safe level. Widen only for an evidence-backed trigger such as:

- `DEPENDENCY_FOUND`
- `SOURCE_CONFLICT`
- `UNKNOWN_CONTRACT`
- `FINGERPRINT_INVALID`
- `TEST_IMPACT_UNKNOWN`
- `CROSS_DOMAIN_CHANGE`
- `SECURITY_BOUNDARY`
- `DATA_INTEGRITY_RISK`
- `PUBLIC_API_CHANGE`
- `MIGRATION_REQUIRED`

"I want to understand the repository better" is not, by itself, an executor expansion trigger.

## Mandatory broader-read triggers
Token economy yields when any of the following applies:

1. task changes the canonical source itself;
2. fact extraction/fingerprint confidence is insufficient;
3. dependency relationships are unknown/materially incomplete;
4. authoritative conflict cannot be resolved from metadata;
5. meaning depends on surrounding context that cannot be sliced safely;
6. security, money, signing, privileged authorization, destructive/irreversible action or another high-assurance concern requires broader inspection;
7. brownfield adoption reveals undocumented behavior or task-relevant code/spec drift;
8. prior context optimization missed a dependency/false negative;
9. policy requires broader review;
10. an agent can state a concrete engineering reason narrow context is insufficient.

Expansion reasons should be recorded so repeated unnecessary expansions can later be optimized away.

## Assurance override
Optimization budgets govern tokens/searches/files/tests/time. They never override the assurance floor.

If a task needs broader context or more validation to meet required assurance, a small file/search budget must produce an expansion/recompile state rather than unsafe execution.

Initial assurance-context direction:
- routine bounded changes: aggressive optimization allowed;
- shared/public/cross-module changes: expanded dependency validation;
- auth/security/PII/migrations/production infrastructure/financial calculations: high assurance;
- money movement, signing/private keys, irreversible migration, destructive production actions and critical authorization: strongest fail-closed behavior.

Detailed assurance classification belongs to its owning assurance/security modules; this session only freezes the source-hierarchy interaction.

## CURRENT and CHECKPOINT contract
`CURRENT` and `CHECKPOINT` are two governed views of the same progression state, not competing sources.

- machine current state: compact operational representation for agents;
- human Checkpoint: richer auditable representation for people and deep resume.

Machine state should point to decisions, not create them. Checkpoint may report that an ADR is active/approved but does not silently supersede the ADR content.

Shared fields should remain consistent, including project, phase, module/session, active work, PR/head bindings, findings and next action. A mismatch should produce `STATE_CONFLICT`, not "pick newest" behavior.

## Resume fast path
Cross-chat resume should prefer:

```text
machine current state
  -> validity/fingerprint check
      -> valid: compact Resume Capsule
      -> invalid: Checkpoint + delta/source escalation
```

This allows continuation without rereading the whole project when governed state remains compatible.

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
Existing repositories are first-class. They may begin with imperfect or conflicting source structure and should receive safe GEF benefits before full normalization.

Candidate stages:

```text
B0 DISCOVER
B1 MAP
B2 ALIAS
B3 BASELINE
B4 SHADOW
B5 PROMOTE
B6 NORMALIZE
```

Meaning:
- discover actual code/docs/tests/checks;
- map existing sources to authority domains;
- alias existing canonical sources rather than copying them;
- bind observed current behavior to fingerprints;
- run optimization/test/proof decisions in shadow;
- promote only after evidence;
- normalize high-value/high-ambiguity areas when engineering ROI justifies it.

### Brownfield preservation rules
- do not rewrite working architecture just to match GEF naming;
- discover existing CI/tests before proposing replacements;
- preserve active PRs/branches/work unless continuation is unsafe;
- missing documentation is an explicit gap, not invented history;
- observed code behavior may be descriptive truth while intent remains `UNKNOWN`;
- enable early safe benefits first: prompt narrowing, source routing, delta review, search budgets and compact evidence;
- aggressive test skipping/proof reuse remains shadow-only until validated.

## Progressive Governance Envelope
Existing projects may have different governance maturity by domain, for example:

```text
Combat     GOVERNED
Inventory  SHADOW
World      DISCOVERED
Guild      LEGACY
```

A globally "installed" Bootstrap must never imply every project domain has equal optimization confidence.

Candidate maturity direction:
- `L0 LEGACY`
- `L1 DISCOVERED`
- `L2 BASELINED`
- `L3 GOVERNED`
- `L4 OPTIMIZED`
- `L5 PROVEN_OPTIMIZED`

Exact maturity contracts belong to the brownfield adoption module.

## Progressive Engineering Memory
Approved work should make comparable future work cheaper to understand. Governed reusable knowledge can include:
- repository/domain maps;
- resolved architecture questions;
- dependency relationships;
- source/test mappings;
- known failures;
- negative capability/context knowledge;
- valid reusable proofs.

All reuse is validity-bound and subordinate to current canonical sources.

## Conflict outcomes
Candidate source-resolution states:

- `SOURCE_MATCH`
- `SOURCE_STALE`
- `SOURCE_CONFLICT`
- `SOURCE_MISSING`
- `SOURCE_SCOPE_GAP`
- `SOURCE_EXPANSION_REQUIRED`

Codex must not improvise through `SOURCE_CONFLICT`, `SOURCE_MISSING`, or `SOURCE_SCOPE_GAP`.

## Supersession
A governed fact/decision may be superseded only by an authority valid for the same domain and through an explicit mechanism carrying, where relevant:
- superseded ID;
- superseding ID;
- approval state;
- effective version/binding;
- reason;
- affected downstream facts/proofs;
- invalidation marker.

Historical material remains auditable but should not be injected as active truth after valid supersession.

## Technology routing
This session discovered or refined source/context technologies recorded in `.engineering/TECHNOLOGY-LEDGER.md`. Their ledger status does not itself freeze implementation.

Important families include:
- Semantic Source Router;
- Canonical Fact Index;
- Context Dedup Graph;
- Source Capsule Compiler;
- Delta Context Capsule;
- Context Expansion Ladder;
- Repository Knowledge Map;
- Brownfield Truth Reconciler;
- Progressive Governance Envelope;
- Progressive Engineering Memory;
- Minimum Sufficient Context;
- Context Sufficiency Proof;
- Full-Context Safety Gate;
- Adaptive Context Memory candidate family;
- Context Quality Optimizer candidate family;
- Historical Context Eviction candidate;
- Engineering ROI Governor.

Potentially overlapping mechanisms should be combined rather than proliferated into independent subsystems unless later evidence proves separate ownership is useful.

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

## Current audit state
The session design has already undergone exploratory discussion and one aggressive conceptual audit. The preserved design appears convergent, but this dedicated branch intentionally remains `IN_DISCUSSION` until the session is reviewed against S01, the Decisions Ledger, Technology Ledger and Planning Protocol.

## Remaining closure questions
1. Which Source Authority Matrix taxonomy is constitutional V1 versus extensible project profile data?
2. Exact minimum metadata required for fact IDs in V1.
3. Exact drift-record schema ownership between Source Hierarchy and brownfield adoption.
4. Which assurance classes must be encoded here versus delegated entirely to GBS-M27/security.
5. Which proposed source/context technologies are NECESSARY for V1 versus IMPORTANT/FUTURE.
6. Whether machine `CURRENT` is a new `.gef/current.json` artifact or a later materialized target-repo convention, since Bootstrap itself remains instruction-first.
7. What conformance evidence proves Source Hierarchy is correctly applied by a future Master Bootstrap Prompt.

## Current direction
S02 favors a **domain-aware, fact-addressable, dependency-fingerprinted, brownfield-safe source hierarchy** that compiles Minimum Sufficient Context, expands only on evidence-backed triggers, separates implemented truth from approved intent, and uses progressive validity-bound engineering memory to reduce recurring tokens, search and executor latency without weakening assurance.
