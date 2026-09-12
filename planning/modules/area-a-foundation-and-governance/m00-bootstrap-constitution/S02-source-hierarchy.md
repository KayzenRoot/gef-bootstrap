# GBS-M00-S02 — Source Hierarchy

Status: `IN_DISCUSSION`

## Purpose
Define how GEF Bootstrap and initialized projects determine authoritative truth with the smallest safe context cost.

Source resolution must prevent ChatGPT/Codex from repeatedly reading broad project documentation or independently resolving already-governed conflicts. It must distinguish **authority**, **freshness**, **applicability**, **evidence state**, and **task relevance**.

## Governing objective
The default source-resolution path is:

```text
TASK
  -> identify required facts/contracts
  -> resolve authoritative source class
  -> select current applicable fact versions
  -> detect conflicts/staleness
  -> deduplicate overlapping material
  -> compile minimal Source Capsule
  -> execute or STOP
```

Full-document loading is an escalation path, not the default, when a smaller verifiable representation can safely satisfy the same engineering obligation.

## Source classes
Initial canonical classes proposed for freeze:

| Class | Primary authority |
|---|---|
| Repository fact | Git tree, exact code/configuration, immutable Git metadata |
| Current governed state | machine current state + approved human checkpoint |
| Engineering decision | Frozen Decision / ADR |
| Product boundary | Scope |
| Completion obligation | Definition of Done |
| Technical structure/contracts | Architecture |
| Required product behavior | Requirements |
| Current bounded change | approved Work Order / Task Manifest |
| Validation result | exact-head Machine Evidence / gate receipt |
| Planning detail | approved module/session planning |
| Future work | Backlog |
| Conversational context | chat/prose, non-canonical unless promoted |

## Authority is not freshness
A newer low-authority source cannot silently supersede a higher-authority source outside its domain.

Example:

```text
Checkpoint says architecture = B
Frozen ADR says architecture = A
```

The checkpoint may report active state, but cannot silently create/supersede architecture. Result: `SOURCE_CONFLICT` unless an authorized superseding decision exists.

## Authority is domain-specific
There is no single universal linear ranking for every fact.

Examples:
- Git/code is authoritative for what is physically implemented at a given SHA, but not automatically for what the approved architecture says should be implemented.
- Scope is authoritative for whether a product capability is approved, but not for the exact current test result.
- DoD defines completion obligations, but does not supersede an ADR on architecture.
- Checkpoint identifies current governed state, but references rather than silently rewrites frozen decisions.

Therefore source resolution uses a **Source Authority Matrix** rather than a naive global list.

## Proposed Source Authority Matrix

| Question | Preferred canonical authority | Supporting evidence |
|---|---|---|
| What exists at HEAD? | Git/code/config | exact SHA/diff |
| What phase/work is active? | CURRENT + approved Checkpoint | Git/PR state |
| What engineering decision is frozen? | Decision Ledger / ADR | supersession chain |
| Is capability allowed? | Scope | approved decision reference |
| What is required to call this complete? | DoD | evidence/proofs |
| What technical contract should hold? | Architecture | ADRs |
| What behavior is required? | Requirements | acceptance criteria |
| What exactly may executor change now? | Work Order / Task Manifest | Scope + Architecture |
| Did validation pass for this candidate? | exact-head Machine Evidence / gate receipt | test/check output |
| What should happen next? | Checkpoint + governed backlog/dependencies | current findings |

## Fact-level resolution
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

A fact reference must never replace the canonical source. It is an address into that source and must carry enough version/fingerprint information to detect staleness.

## Source Query Plan
Before assembling expensive executor context, the planning/orchestration layer should identify the facts required by the task.

Example:

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

The system then loads only the required authoritative facts plus dependencies, rather than blindly injecting Scope + Requirements + Architecture + Decisions + Checkpoint in full.

## Minimal Source Capsule
The output of source resolution should be a compact, auditable representation containing only what the bounded executor needs.

Candidate fields:

```text
sourceCapsuleVersion
projectFingerprint
baseSha/headSha where applicable
task/workOrder
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

A capsule is valid only while its referenced source fingerprints remain compatible.

## Token-aware source rules
1. Do not inject an entire canonical document when an authoritative fact slice is sufficient.
2. Do not repeat the same frozen fact in multiple prompt sections.
3. Prefer stable IDs + compact resolved value + source pointer over duplicated prose.
4. Do not ask Codex to search for a fact already resolved by ChatGPT/governance.
5. Cache verified stable facts only with validity fingerprints.
6. Reuse a compatible Source Capsule across correction rounds using delta updates.
7. Expand context only for a documented dependency, conflict, uncertainty, invalid fingerprint or assurance requirement.
8. Never compress away a constraint, uncertainty or proof obligation required for correctness.
9. Separate human canonical documentation from machine-compact execution context.
10. Measure source/context tokens so savings are demonstrated rather than assumed.

## Conflict protocol
Candidate resolution outcomes:

- `SOURCE_MATCH`: authoritative sources agree and are current.
- `SOURCE_STALE`: selected source/capsule fingerprint is no longer current.
- `SOURCE_CONFLICT`: applicable authoritative sources disagree or supersession is ambiguous.
- `SOURCE_MISSING`: required authoritative fact does not exist.
- `SOURCE_SCOPE_GAP`: task requires an unapproved product/architecture expansion.
- `SOURCE_EXPANSION_REQUIRED`: minimal context is insufficient and a wider governed radius is required.

Codex must not resolve `SOURCE_CONFLICT`, `SOURCE_MISSING`, or `SOURCE_SCOPE_GAP` through improvisation.

## Supersession rules
A governed source may be superseded only by a source authorized for the same decision domain and through an explicit supersession mechanism.

Required properties should include:
- superseded fact/decision ID;
- superseding ID;
- approval state;
- effective version/date or commit binding when relevant;
- reason;
- affected downstream facts/proofs;
- invalidation marker.

Historical sources remain traceable but must not be injected as active truth.

## Proposed token-optimization technologies
### 1. Semantic Source Router
Maps task intent to authoritative fact classes before reading broad documentation.

### 2. Canonical Fact Index
Small machine-readable index of fact IDs, source locations, domains, fingerprints and dependencies.

### 3. Context Dedup Graph
Detects repeated/overlapping facts across documents and prevents duplicate injection.

### 4. Source Capsule Compiler
Builds the minimum authoritative context packet for the current task.

### 5. Delta Capsule
For correction/review rounds, sends only changed facts, invalidations and still-required frozen constraints.

### 6. Cold Source Pointer
Keeps low-probability detail addressable outside active context and loads it only after an expansion trigger.

### 7. Authority Resolver
Uses domain + status + supersession + applicability rather than asking an LLM to choose between conflicting prose.

### 8. Context Expansion Gate
Requires a concrete reason before widening the source radius and records why the additional token cost is justified.

### 9. Source Entropy Score
Candidate metric estimating ambiguity/duplication/conflict in the selected source set. High entropy triggers normalization or clarification before expensive execution.

### 10. Token-Amortized Canonicalization
Allows one-time investment in stable IDs, indexes and distilled machine facts when expected recurring token savings across future changes justify it.

## Fingerprint model
The preferred direction is a **hybrid fingerprint hierarchy**, not one hash for an entire project document.

Candidate levels:

```text
DOCUMENT
  -> SECTION
      -> FACT
          -> DEPENDENCY SET
```

Each Source Capsule should depend only on the smallest authoritative units that actually support the task.

Example:

```text
ARCH-PAY-014 changes
  -> payment source capsules INVALIDATED
  -> payment proofs MAY_INVALIDATE
  -> payment test impact recalculated

ARCH-AUTH-004 unchanged
  -> auth capsule remains VALID
  -> auth proofs remain eligible for carry-forward
```

This prevents an unrelated edit in a large architecture document from forcing Codex to reload or reconsider the whole document.

### Fingerprint requirements
A governed fact fingerprint should be capable of representing, directly or by reference:
- fact ID;
- canonical source location;
- normalized fact content hash;
- governing source/version;
- dependency IDs;
- supersession state;
- applicability/profile where needed;
- toolchain/config fingerprint only when validity depends on it.

A dependency fingerprint changes when any relevant upstream fact changes, even if the local prose is byte-identical.

## Dependency invalidation
Invalidation should propagate through explicit relationships, not through project-wide pessimism.

Candidate graph:

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

Only descendants of a changed relevant node are invalidated by default. Unknown dependencies widen the radius and may force broader validation.

## Mandatory full-source read triggers
Token economy must yield to full or broader source reading when any of the following applies:

1. the task changes the canonical source itself;
2. fact extraction/fingerprint confidence is insufficient;
3. dependency relationships are unknown or materially incomplete;
4. an authoritative conflict cannot be resolved from fact metadata;
5. source semantics depend on surrounding text that cannot be safely sliced;
6. security, money, signing, privileged authorization, destructive/irreversible behavior or another HIGH_ASSURANCE domain requires broader inspection;
7. adoption of an existing repository reveals undocumented behavior or code/spec drift;
8. a previous capsule or optimization produced a missed dependency/false negative;
9. policy explicitly requires whole-document or whole-domain review;
10. an agent can state a concrete engineering reason why the narrow context is insufficient.

The expansion reason should be recorded so repeated unnecessary expansions can later be optimized away.

## Existing-project / brownfield source resolution
Existing projects are expected to begin with imperfect source structure. GEF must not require the repository to be rewritten before it can benefit from token-aware execution.

### Brownfield source modes
Candidate stages:

```text
B0 DISCOVER
  inventory actual repo/docs/tests/checks

B1 MAP
  map existing sources to GEF authority domains

B2 ALIAS
  create lightweight pointers/aliases to existing canonical sources

B3 BASELINE
  bind current code/tests/decisions to pre-adoption fingerprints

B4 SHADOW
  generate Source Capsules/Test Impact/proof reuse in shadow mode

B5 PROMOTE
  enable authoritative optimized behavior only after evidence supports it

B6 NORMALIZE
  progressively normalize high-value/high-ambiguity areas when ROI justifies it
```

### Brownfield preservation rules
- Existing working architecture is not rewritten merely to match GEF naming.
- Existing canonical documents may be aliased rather than copied.
- Existing CI/test commands are discovered before new ones are proposed.
- Existing active PRs/branches/work are preserved unless a conflict makes continuation unsafe.
- Missing documentation becomes an explicit gap, not an invitation to invent history.
- Code behavior may be mapped as observed truth while architecture intent remains `UNKNOWN` until supported.
- The earliest safe GEF benefits should be enabled first: prompt narrowing, source routing, delta review, search budgets and compact evidence.
- Aggressive test skipping/proof reuse remains shadow-only until validated.

This makes `EXISTING_PROJECT` a native bootstrap mode rather than a degraded version of `NEW_PROJECT`.

## Performance interaction with source hierarchy
Source hierarchy must also reduce wall-clock executor latency, not only tokens.

A Source Capsule should aim to reduce:
- repository search calls;
- files opened;
- serial discovery steps;
- repeated source conflict reasoning;
- repeated architecture interpretation;
- unnecessary test discovery;
- correction loops caused by ambiguous prompts.

The future GBS-M63 Executor Performance Engine will benchmark whether source routing and capsules actually reduce active Codex completion time.

## Safety invariants
- Conversation never silently outranks canonical repository sources.
- Newer does not automatically mean more authoritative.
- Code drift does not silently rewrite approved architecture.
- A compact capsule cannot become canonical truth by itself.
- Missing authority is not permission.
- UNKNOWN never becomes ALLOW.
- Stale fingerprints invalidate cached context.
- Source compression must remain auditable back to canonical material.

## Open design questions for this session
1. Exact domain taxonomy for the Source Authority Matrix.
2. Whether CURRENT and CHECKPOINT are separate authority classes or two views of one governed state.
3. Minimum metadata required for Canonical Fact IDs.
4. Exact hybrid fingerprint granularity and normalization rules.
5. Which high-assurance domains always require broader source reading.
6. Detailed code-vs-spec drift resolution during existing-project adoption.
7. Whether Source Entropy Score becomes a formal V1 mechanism or remains a later optimization.
8. Threshold/criteria for normalizing an existing source instead of aliasing it.

## Current direction
The session currently favors a **domain-aware, fact-addressable, dependency-fingerprinted source hierarchy** that compiles minimal Source Capsules, preserves existing-project truth through progressive brownfield mapping, and expands context only on evidence-backed triggers.

No final hierarchy is frozen yet.
