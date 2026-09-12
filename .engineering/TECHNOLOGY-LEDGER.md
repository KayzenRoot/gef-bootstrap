# Technology & Innovation Ledger

Status: `ACTIVE`

Purpose: preserve optimization ideas, invented mechanisms and reusable engineering technologies so they are never lost in chat history or confused with frozen architectural decisions.

## Status model
- `CANDIDATE`: worth investigation; not an approved requirement.
- `PROPOSED`: design direction selected; still subject to session freeze/audit.
- `FROZEN`: approved canonical mechanism for its owning scope.
- `DEFERRED`: preserved for later scope/version.
- `REJECTED`: considered and explicitly not adopted.
- `SUPERSEDED`: replaced by another technology/decision.

## Ledger rules
1. Every material technology discovered during planning must be recorded before its session closes.
2. A technology entry must identify discovery session and intended owner module/session where known.
3. Technology status never outranks Decisions, Scope, Architecture, Requirements or DoD.
4. `CANDIDATE`/`PROPOSED` items must never be silently treated as executor requirements.
5. When frozen, the canonical implementation contract belongs in the owning source; this ledger keeps identity, lineage and routing.
6. Supersession and rejection remain traceable.

## Entries

### TECH-0001 — Semantic Source Router
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14 Task & Context Compiler / GBS-M09 Source Pack Engine
- Goal: route a task to the minimum authoritative source facts before broad reads.

### TECH-0002 — Canonical Fact Index
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M09 / GBS-M14
- Goal: machine-readable fact IDs, domains, locations, dependencies, status and fingerprints.

### TECH-0003 — Context Dedup Graph
- Status: PROPOSED
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S01/S02
- Intended owner: GBS-M14
- Goal: prevent the same governed fact from being injected repeatedly through multiple documents/prompt sections.

### TECH-0004 — Source Capsule Compiler
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14 / GBS-M15
- Goal: compile the Minimum Sufficient Context for bounded execution.

### TECH-0005 — Delta Context Capsule
- Status: PROPOSED
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S01/S02
- Intended owner: GBS-M14 / GBS-M26
- Goal: correction/review rounds carry only changed/invalidated facts plus required frozen constraints.

### TECH-0006 — Context Expansion Ladder
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14
- Goal: expand from fact/symbol/file/module/domain/cross-domain/project only on verified triggers.

### TECH-0007 — Context Escalation Receipt
- Status: CANDIDATE
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14 / GBS-M24
- Goal: record why context widened so future executions can avoid rediscovering the same dependency.

### TECH-0008 — Repository Knowledge Map
- Status: PROPOSED
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S01/S02
- Intended owner: GBS-M14 / GBS-M19
- Goal: compact incremental map of domains, symbols, contracts, dependencies, tests and proofs.

### TECH-0009 — Negative Context Cache
- Status: CANDIDATE
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14
- Goal: cache fingerprint-bound evidence that a source/domain is irrelevant to a governed task family.

### TECH-0010 — Hot/Warm/Cold Context Tiers
- Status: CANDIDATE
- V1 classification: FUTURE
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14
- Goal: prioritize likely-needed context without confusing retrieval temperature with authority.

### TECH-0011 — Context Temperature
- Status: CANDIDATE
- V1 classification: FUTURE
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14 / GBS-M43
- Goal: retrieval-priority signal based on validated reuse/relevance history.

### TECH-0012 — Brownfield Truth Reconciler
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M13
- Goal: preserve separate descriptive truth (what exists) and normative truth (what is approved) and emit drift instead of silently choosing one.

### TECH-0013 — Progressive Governance Envelope
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M13
- Goal: allow per-domain progressive governance maturity during existing-project adoption.

### TECH-0014 — Progressive Engineering Memory
- Status: PROPOSED
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S01/S02
- Intended owner: cross-cutting; GBS-M14/M19/M25/M43
- Goal: each approved increment makes comparable future work cheaper by preserving validity-bound resolved knowledge, dependency/test maps, negative knowledge and proofs.

### TECH-0015 — Knowledge Appreciation Metrics
- Status: CANDIDATE
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S02
- Intended owner: GBS-M43 / GBS-M45
- Goal: measure whether repeated work requires progressively fewer searches, tokens, rereads and reasoning.

### TECH-0016 — Minimum Sufficient Context (MSC)
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14 / GBS-M15
- Goal: minimize context subject to required correctness, contracts, dependencies, risk and assurance coverage.

### TECH-0017 — Context Sufficiency Proof
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14
- Goal: structured pre-execution proof that the selected context is sufficient or that expansion is required.

### TECH-0018 — Prompt Completeness Certificate
- Status: CANDIDATE
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S02
- Intended owner: GBS-M15
- Goal: deterministic readiness summary before expensive executor invocation; expected to remain an Execution Pack output rather than a standalone subsystem unless later evidence justifies otherwise.

### TECH-0019 — Source Entropy Score
- Status: CANDIDATE
- V1 classification: FUTURE
- Discovered: GBS-M00-S02
- Intended owner: GBS-M09 / GBS-M14 / GBS-M43
- Goal: test whether ambiguity/duplication/conflict signals predict retries, wasted context or corrections before formalizing a score.

### TECH-0020 — Token-Amortized Canonicalization
- Status: PROPOSED
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S02
- Intended owner: GBS-M09 / GBS-M13 / GBS-M45
- Goal: justify one-time normalization/indexing cost when it reduces recurring token/time cost across future work.

### TECH-0021 — Token Ledger
- Status: PROPOSED
- Discovered: GBS-M00-S01
- Intended owner: GBS-M43 / GBS-M45
- Goal: attribute token spend to source loading, prompt, execution, retry, review and correction.

### TECH-0022 — Executor Cognition Budget
- Status: PROPOSED
- Discovered: GBS-M00-S01
- Intended owner: GBS-M15 / GBS-M63
- Goal: cap open-ended discovery/reasoning and escalate when prescribed execution cannot safely proceed.

### TECH-0023 — Prompt Entropy Reducer
- Status: PROPOSED
- Discovered: GBS-M00-S01
- Intended owner: GBS-M15
- Goal: remove ambiguous alternatives and redundant prose while preserving constraints and proof obligations.

### TECH-0024 — Execution Critical Path Map
- Status: PROPOSED
- Discovered: GBS-M00-S02
- Intended owner: GBS-M63
- Goal: optimize wall-clock execution by identifying serial discovery, validation and wait bottlenecks and safe parallelism.

### TECH-0025 — Proof Carry-Forward Graph
- Status: PROPOSED
- Discovered: GBS-M00-S01
- Intended owner: GBS-M25
- Goal: reuse only proofs whose relevant inputs and validity fingerprint remain compatible.

### TECH-0026 — HEDS Delta Review
- Status: PROPOSED
- Discovered: GBS-M00-S01
- Intended owner: GBS-M26
- Goal: review changed semantics and invalidated proofs rather than rereading previously accepted material.

### TECH-0027 — Failure Fingerprint Memory
- Status: PROPOSED
- Discovered: GBS-M00-S01
- Intended owner: GBS-M19 / GBS-M43
- Goal: avoid repeating known failed diagnostics or rediscovery when the failure fingerprint remains applicable.

### TECH-0028 — Negative Capability Cache
- Status: PROPOSED
- Discovered: GBS-M00-S01
- Intended owner: GBS-M19 / GBS-M14
- Goal: remember verified absences/capability gaps with validity bindings so future agents do not repeat the same searches.

### TECH-0029 — Architecture Question Cache
- Status: PROPOSED
- Discovered: GBS-M00-S01
- Intended owner: GBS-M11 / GBS-M19
- Goal: preserve resolved architecture questions and their decision/source references so executors do not reopen them.

### TECH-0030 — Full-Context Safety Gate
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14 / GBS-M27
- Goal: force broader inspection when assurance requirements, unknown dependencies, source conflicts or high-risk domains make narrow context unsafe.

### TECH-0031 — Adaptive Context Memory
- Status: CANDIDATE
- V1 classification: FUTURE
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14 / GBS-M19
- Goal: candidate umbrella for cold pointers, hot/warm/cold tiers, context temperature, predictive prefetch, negative context and historical eviction to avoid proliferating independent mechanisms.

### TECH-0032 — Context Quality Optimizer
- Status: CANDIDATE
- V1 classification: FUTURE
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14 / GBS-M43
- Goal: candidate umbrella for deduplication, ambiguity detection and source/prompt entropy signals.

### TECH-0033 — Historical Context Eviction
- Status: CANDIDATE
- V1 classification: FUTURE
- Discovered: GBS-M00-S02
- Intended owner: GBS-M14 / GBS-M19
- Goal: keep resolved history auditable while removing it from hot executor context after canonical active facts replace it.

### TECH-0034 — Engineering ROI Governor
- Status: PROPOSED
- V1 classification: IMPORTANT
- Discovered: GBS-M00-S01/S02
- Intended owner: GBS-M45 / GBS-M63
- Goal: evaluate optimization investment against total recurring token, executor-time, validation, review, retry, defect and maintenance cost rather than optimizing a single metric in isolation.

### TECH-0035 — Cross-Project Engineering Memory
- Status: DEFERRED
- V1 classification: FUTURE
- Discovered: GBS-M00-S02
- Intended owner: future scope
- Goal: reuse engineering knowledge across projects without granting it authority over project-local sources; deferred because provenance, contamination, staleness, security and privacy require dedicated design.

### TECH-0036 — Authority Resolver
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M09 / GBS-M14
- Goal: resolve the applicable authority domain and active canonical fact without relying on newest-wins or conversational precedence.

### TECH-0037 — Source Hierarchy Conformance Receipt
- Status: PROPOSED
- V1 classification: NECESSARY
- Discovered: GBS-M00-S02
- Intended owner: GBS-M24 / bootstrap validation
- Goal: prove that source hierarchy materialization is usable, conflict-aware, fingerprinted, brownfield-safe and fail-closed rather than reporting decorative success.

## S02 closure audit
- Material discoveries captured: PASS
- V1 routing classification recorded: PASS
- Candidate ideas separated from constitutional decisions: PASS
- Detailed implementations remain delegated to owning modules: PASS
- Cross-project memory remains deferred: PASS
- Overlapping context mechanisms remain candidates for consolidation: PASS
