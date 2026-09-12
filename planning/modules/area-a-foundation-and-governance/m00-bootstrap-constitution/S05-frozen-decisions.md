# GBS-M00-S05 — Frozen Decisions

Status: `FROZEN`

## Purpose
Close the Bootstrap Constitution by defining which outcomes from S01–S04 are constitutionally frozen, how they are referenced compactly, and the only legal mechanisms for reopening or superseding them.

This session creates a small constitutional lockfile. It does not duplicate the full prose of prior sessions or prematurely materialize later Source Pack documents.

## Core objective

```text
FROZEN CONSTITUTION
  -> stable group identities
  -> compact decision references
  -> version/fingerprint
  -> explicit ownership
  -> validity/supersession rules
  -> reopen gate
  -> downstream planning proceeds without rediscovery
```

## Stable constitutional groups
F1–F8 are stable constitutional group IDs in V1. Individual `D-*` decisions remain the canonical detailed decisions; the group IDs are compact dependency/reference surfaces.

### CONST-F1 — Product identity and boundary
- GEF Bootstrap is instruction-first governance, not a standalone CLI/runtime product.
- It materializes governed project artifacts into target repositories through compatible agents/executors.
- UADS, Hive, UGAS and other ecosystems remain optional integrations unless future governed scope explicitly changes that boundary.

### CONST-F2 — Default engineering model
- GEF V1 is the default engineering model for initialized projects.
- ChatGPT/planning sources resolve expensive engineering reasoning as far as safely possible.
- Executors such as Codex receive bounded, pre-resolved execution contracts and escalate instead of rediscovering frozen architecture.

### CONST-F3 — Primary optimization objective
- total safe engineering cost/change is the optimization target;
- token economy and executor wall-clock latency are first-class;
- correctness, security, integrity and required assurance outrank optimization budgets;
- optimization claims are measured end-to-end and targets never masquerade as measured facts.

### CONST-F4 — Brownfield is first-class
- NEW_PROJECT and EXISTING_PROJECT are first-class adoption paths;
- brownfield adoption is progressive, preservation-first and non-destructive;
- working projects do not restart planning or rewrite architecture merely to adopt GEF naming;
- aggressive proof/test reuse requires evidence/shadow assurance before promotion.

### CONST-F5 — Source truth model
- authority is domain-specific, not newest-wins;
- descriptive truth and normative truth remain separate;
- canonical facts are addressable and validity-bound;
- hybrid fact/dependency fingerprints support targeted invalidation;
- executor context targets Minimum Sufficient Context and expands only for evidence-backed/assurance reasons;
- source conflicts/missing authority fail closed.

### CONST-F6 — Scope model
- inventory is not commitment;
- V1 admission uses NECESSARY / IMPORTANT / FUTURE / OUT_OF_SCOPE;
- NECESSARY requires one traceable primary admission basis;
- IMPORTANT never auto-enters V1;
- FUTURE does not count against V1 completion;
- executors cannot authorize product-scope expansion;
- scope cannot be manipulated to fabricate progress/ETA.

### CONST-F7 — Completion model
- DONE is evidence-bound, layered and exact-state where applicable;
- 100% progress or agent assertion never creates DONE;
- accepted gaps are policy-gated;
- blocking defects/invalid evidence cannot be hidden as gaps;
- completion may reopen through targeted validity invalidation;
- READY_FOR_PLANNING requires a usable governed planning surface and conformance evidence;
- V1 must be measurable/benchmarkable without fabricated improvement percentages.

### CONST-F8 — Continuity and auditability
- human Checkpoint and machine-current state are consistent governed views, not competing truth;
- every frozen planning increment ends with review + checkpoint promotion;
- new chats resume from governed state rather than reconstructing from conversation history;
- material innovations remain in Technology & Innovation Ledger until owned/frozen.

## Constitutional reference model
Downstream material normally references frozen groups and/or decision IDs rather than duplicating long prose.

```text
requires:
  - CONST-F3
  - CONST-F5
  - D-0016
  - D-0024
```

A group reference is an address/dependency declaration, never a replacement for the canonical session and Decisions Ledger.

## Reopen Gate
A frozen constitutional decision/group may be reopened only when at least one governed trigger exists:

- `SOURCE_DRIFT`
- `CONTRADICTION_DISCOVERED`
- `SECURITY_OR_INTEGRITY_DEFECT`
- `DEPENDENCY_INVALIDATED`
- `V1_SCOPE_SUPERSESSION`
- `MEASURED_FAILURE`
- `EXPLICIT_USER_PRODUCT_DECISION`

`EXPLICIT_USER_PRODUCT_DECISION` is sufficient to initiate reopening, but is never self-applying. Before the frozen rule changes effect, a superseding planning record/decision must be created, impacts identified, audit performed and affected checkpoint/state promoted.

General preference, novelty, executor convenience, model suggestion or a new chat are not valid reopen triggers.

## Supersession rule
Frozen constitutional material is never edited into historical ambiguity. A superseding decision identifies the old decision/group, states the replacement, records reason/evidence, defines effective version/binding, marks downstream impacts, triggers targeted invalidation/replanning and preserves the old record as historical truth.

## Constitutional Stability Contract
The Constitution freezes outcomes and invariants, not every later schema, filename, algorithm or internal representation.

Examples:
- MSC is frozen; exact Source Capsule schema belongs to M14/M15;
- evidence-bound DONE is frozen; Completion Manifest schema belongs to Evidence/Progress modules;
- brownfield progressive adoption is frozen; exact maturity schema belongs to M13;
- instruction-first product boundary is frozen; legacy scaffold names may still be refactored without changing IDs.

## Frozen Decision Capsule requirement
A compact constitutional reference surface is required, while its exact serialization/schema is delegated to later Decision/Source Pack modules.

Minimum semantic metadata includes constitution version/fingerprint, frozen group ID, status, canonical source refs, decision IDs, owner scope, applicability, supersession state, validity fingerprint and reopen triggers.

The compact surface must not duplicate full Decisions Ledger prose.

## Constitution version and fingerprint
M00 closure establishes:

```text
constitutionVersion: GBS-CONSTITUTION-v1.0
```

A deterministic constitution fingerprint is required later from the owning Source Pack/Integrity mechanism. Until that mechanism exists, repository exact-state binding plus the version ID identifies the frozen Constitution. No fabricated hash is recorded.

## M00 MODULE_DONE contract
`GBS-M00 — Bootstrap Constitution` is MODULE_DONE only when:

1. S01–S05 are FROZEN;
2. every session satisfies the S04 planning-session evidence contract;
3. material constitutional decisions are present in Decisions Ledger;
4. material inventions are routed in Technology & Innovation Ledger when applicable;
5. CONST-F1–F8 have no unresolved contradiction;
6. unresolved mechanics are explicitly delegated to owning later modules;
7. S05 exact-head review has no unresolved blocker;
8. checkpoint is promoted to the next legal planning point;
9. no functional product implementation was accidentally introduced during M00.

M00 completion proves the constitutional planning module only. It does not imply Bootstrap V1, Scope, Requirements or Architecture are complete.

## Explicit delegations
Detailed Source Pack/materialization, decision lifecycle, Scope/DoD engine, brownfield schema, context/execution compilers, guardrails, continuity state, progress/ETA, evidence/assurance/test impact, Git/GitHub/CI/release, security/recovery/integrity, integrations, telemetry/benchmarks, artifact/agent interaction, distribution reframing, quality/conformance harnesses, final documentation and executor performance remain delegated to their owning modules M09–M63 as applicable.

Legacy runtime/CLI-oriented scaffold responsibilities remain `REFACTOR_REQUIRED`; stable IDs are preserved.

## Source Pack materialization timing
S05 does not pre-fill `.engineering/SOURCE-HIERARCHY.md`, `.engineering/SCOPE.md` or `.engineering/DEFINITION-OF-DONE.md` with detailed product conclusions. Those documents belong to the ordered Source Pack/owning-module sequence and must be generated from the frozen Constitution plus later decisions.

Until then, S01–S05 + Decisions Ledger + Constitution Lock + Checkpoint are the canonical constitutional source.

## Token-economy rule
Default downstream flow:

```text
task
 -> relevant CONST-F* and D-* IDs
 -> compact values
 -> validity/fingerprint check
 -> execute
```

Expand to full canonical sessions only when validity, ambiguity, conflict or assurance requires it.

## Freeze audit
- S01–S04 consistency: PASS
- Decisions Ledger synchronization through D-0045: PASS
- Constitution Lock materialized: PASS
- constitutional group boundaries: PASS
- product-owner change authority preserved: PASS
- undocumented drift prevented: PASS
- version identity defined without fabricated hash: PASS
- M00 MODULE_DONE criteria explicit: PASS
- unresolved mechanics delegated: PASS
- premature Source Pack materialization prevented: PASS
- accidental functional implementation: NONE

STOP CONDITION: `READY_FOR_GBS-M00-S05_REVIEW_AND_MODULE_CHECKPOINT`.