# Source Hierarchy

Status: `FROZEN`

## Purpose
Define how GEF Bootstrap resolves authority without using a naive newest-wins or one-dimensional document order.

## Core rule
Authority is **domain-specific**. A source controls only the facts that belong to its authority domain. Newer text does not automatically override an older frozen source from another domain.

## Authority domains
The canonical domains are:
- `REPOSITORY_STATE` — actual files, Git state, commits, diffs and executable repository facts;
- `PROJECT_STATE` — current promoted progression/checkpoint state;
- `DECISION` — Decisions Ledger, ADRs, constitutional amendments and supersession records;
- `SCOPE` — admitted product boundaries/classifications;
- `REQUIREMENT` — frozen obligations and acceptance requirements;
- `ARCHITECTURE` — approved system/component/contracts/dependency structure;
- `SECURITY` — security policy, threat model, authorization and assurance constraints;
- `COMPLETION` — DoD, weighted baseline, completion/invalidation rules;
- `EXECUTION` — active bounded work order/execution contract;
- `VALIDATION` — test, benchmark, evidence and assurance obligations/results;
- `PLANNING` — active planning workspace and module/session plans not yet promoted into stronger canonical domains;
- `FUTURE_WORK` — backlog/future obligations not yet active execution authority;
- `INNOVATION` — Technology Ledger candidate/proposed/frozen mechanism identity and routing;
- `CONVERSATION` — chat prose and transient discussion.

Project profiles may add subdomains but may not silently redefine these base-domain semantics.

## Canonical source routing
Within each domain, use the narrowest applicable current canonical source and its governed supersession chain.

Examples:
- actual code/files at an exact SHA control descriptive repository facts;
- current promoted `CHECKPOINT.md` + `CHECKPOINT.json` control progression state;
- Constitution/ADRs/Decisions control approved decisions in their domains;
- frozen Scope controls product admission/classification;
- frozen Requirements control obligations;
- frozen Architecture controls architecture contracts;
- frozen Security controls security policy;
- frozen Definition of Done + Backlog Baseline control completion semantics and denominator;
- frozen Test & Benchmark Plan controls required validation methodology;
- frozen Deployment controls supported distribution/release mechanics.

## Descriptive versus normative truth
Descriptive truth and normative truth must remain separate.

Example:
- code at SHA X may prove what exists;
- Architecture may prove what is approved;
- mismatch creates `DRIFT`, not silent rewriting of either source.

Brownfield adoption must preserve this distinction.

## Checkpoint/current-state rule
Human-readable and machine-readable checkpoints are governed views of the same `PROJECT_STATE`.

If shared fields disagree, state becomes `STATE_CONFLICT` and progression stops until corrected. Checkpoint does not override Scope, Requirements, Architecture, Security or DoD outside project-state fields.

## Decisions and supersession
Historical decisions remain auditable. When later governed sources supersede an earlier decision in the same domain, the explicit supersession record controls.

`.engineering/DECISIONS-SUPERSESSION-MAP.md` is the current closure map for legacy instruction-first/V1/Codex-era assumptions.

Never use simple recency as a substitute for explicit supersession.

## Conversation rule
Conversation is contextual input, never sole canonical authority for approved project state.

A chat statement may initiate planning or a governed change, but material state must be promoted into repository sources/checkpoints before it becomes durable authority.

A new chat must reconstruct state from repository checkpoints and canonical sources rather than rely on chat memory.

## Validity and exact-state binding
Where a fact or proof depends on repository/configuration state, bind it to the smallest safe exact subject state, such as commit SHA, schema version, contract fingerprint or equivalent immutable identity.

Relevant upstream change invalidates dependent facts/capsules/proofs. Unrelated accepted state must not be reset when narrower invalidation is provable.

## Conflict behavior
When two applicable canonical sources appear to conflict:
1. identify the authority domain for each fact;
2. determine whether the conflict is real or cross-domain;
3. inspect explicit supersession/ADR/amendment records;
4. if one source is stale or invalidated, mark it as such rather than silently ignoring history;
5. if authority remains ambiguous, emit `SOURCE_CONFLICT` and stop the affected progression;
6. never convert ambiguity/UNKNOWN into ALLOW or DONE.

## Missing-source behavior
If a required canonical source is absent, stale or not frozen for the requested operation, emit a truthful gap/block state and expand planning/context only as necessary.

No agent may fabricate a missing requirement, architecture choice, security policy or completion claim to keep execution moving.

## Minimum Sufficient Context
Agents should load the minimum authoritative facts needed for the task, but authority and assurance outrank token/search budgets.

Context expands when real dependencies, source conflicts, uncertainty or assurance requirements demand it.

## Source references never replace source truth
Indexes, capsules, fingerprints, caches, summaries and derived databases may accelerate retrieval. They remain derived state and cannot silently supersede the canonical source they reference.

## Closure audit result
The former linear `Checkpoint > Decisions > Scope > ...` scaffold is superseded by this domain-specific model, consistent with D-0021 through D-0026 and the frozen hybrid Architecture.

STOP CONDITION: `SOURCE_HIERARCHY_FROZEN`.
