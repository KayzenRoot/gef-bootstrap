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
4. Fingerprint granularity: document, section, fact, dependency graph, or hybrid.
5. When full-source reading is mandatory regardless of token cost.
6. How source authority interacts with code-vs-spec drift during existing-project adoption.
7. Whether Source Entropy Score becomes a formal V1 mechanism or remains a later optimization.

## Current direction
The session currently favors a **domain-aware, fact-addressable, fingerprinted source hierarchy** that compiles minimal Source Capsules and expands only on evidence-backed triggers.

No final hierarchy is frozen yet.
