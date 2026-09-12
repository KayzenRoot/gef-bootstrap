# GBS-M00-S05 — Frozen Decisions

Status: `DECIDED`

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

### Explicit product-owner change rule
`EXPLICIT_USER_PRODUCT_DECISION` is sufficient to **initiate** reopening, but it is never self-applying. Before the frozen rule changes effect, a superseding planning record/decision must be created, impacts identified, audit performed and affected checkpoint/state promoted.

This protects intentional product-owner authority without creating undocumented constitutional drift.

General preference, novelty, executor convenience, model suggestion or a new chat are not valid reopen triggers.

## Supersession rule
Frozen constitutional material is never edited into historical ambiguity. A superseding decision must:

1. identify old decision/group;
2. state new decision;
3. record reason/evidence;
4. identify effective version/binding;
5. mark affected downstream facts/modules/proofs/checkpoints;
6. trigger targeted invalidation/replanning;
7. preserve the old record as historical truth.

## Constitutional Stability Contract
The Constitution freezes outcomes and invariants, not every later schema, filename, algorithm or internal representation.

Examples:
- MSC is frozen; exact Source Capsule schema belongs to M14/M15;
- evidence-bound DONE is frozen; Completion Manifest schema belongs to Evidence/Progress modules;
- brownfield progressive adoption is frozen; exact maturity schema belongs to M13;
- instruction-first product boundary is frozen; legacy scaffold names may be refactored without changing stable IDs.

## Frozen Decision Capsule requirement
A compact constitutional reference surface is required, while its exact serialization/schema is delegated to later Decision/Source Pack modules.

Minimum semantic metadata:

```text
constitutionVersion
constitutionFingerprint
frozenGroupId
status
canonicalSourceRefs
decisionIds
ownerScope
applicability
supersessionState
validityFingerprint
reopenTriggers
```

The capsule must not duplicate full Decisions Ledger prose. It stores enough information to address, validate, route and expand the canonical decision only when necessary.

## Constitution version and fingerprint
M00 closure establishes a constitutional version identity.

Initial identity:

```text
constitutionVersion: GBS-CONSTITUTION-v1.0
```

A constitution fingerprint is required and must be deterministically derived later from the canonical frozen group/decision set by the owning Source Pack/Integrity mechanism. Until that deterministic mechanism exists, repository exact-state binding plus the version ID identifies the current frozen Constitution; no fabricated hash is recorded.

Any superseding constitutional change requires version/fingerprint evolution according to the later versioning rules.

## M00 MODULE_DONE contract
`GBS-M00 — Bootstrap Constitution` is MODULE_DONE only when:

1. S01–S05 are `FROZEN`;
2. S01–S05 each satisfy the planning-session evidence contract from S04;
3. material constitutional decisions are present in Decisions Ledger;
4. material inventions are routed in Technology & Innovation Ledger;
5. CONST-F1–F8 have no unresolved contradiction;
6. unresolved implementation/schema matters are explicitly delegated to owning later modules;
7. S05 exact-head review has no unresolved blocker;
8. checkpoint is promoted to the next legal planning point;
9. no functional product implementation was accidentally introduced during M00.

M00 completion proves the constitutional planning module only. It does not imply GEF Bootstrap V1 or product Scope/Architecture is complete.

## Explicit delegations at M00 closure
M00 intentionally leaves the following to owning later modules:

- final Source Pack structure/materialization details: M09 and related planning;
- detailed decision/ADR/capsule lifecycle: M11;
- detailed Scope and release DoD materialization: M12;
- brownfield lifecycle/maturity schema: M13;
- task/context compiler and Source Capsule schema: M14;
- Execution Pack/compiler mechanics: M15;
- guardrail mechanics: M16;
- machine current/checkpoint/resume schema: M17–M20;
- progress/ETA weighting/baseline formulas: M21–M23;
- evidence/proof/review/assurance/test-impact details: M24–M28;
- Git/GitHub/CI/release implementation policy: M29–M33;
- security/recovery/integrity mechanics: M34–M37;
- optional adapters/integrations: M38–M42;
- telemetry/audit/benchmark implementation: M43–M45;
- artifact/agent interaction/help reframing of legacy UX concepts: M46–M48;
- consumption/version upgrade/compatibility/doctor reframing of legacy distribution concepts: M49–M52;
- conformance/test harness reframing of runtime-oriented quality modules: M53–M58;
- final docs/closure: M59–M62;
- executor performance mechanics: M63.

These delegations are not defects. They prevent the Constitution from swallowing implementation architecture.

## Source Pack materialization timing
S05 does **not** pre-fill `.engineering/SOURCE-HIERARCHY.md`, `.engineering/SCOPE.md` or `.engineering/DEFINITION-OF-DONE.md` with detailed product conclusions.

Reason: those canonical Source Pack documents belong to the ordered Source Pack planning/materialization sequence and must be generated from the frozen Constitution plus their owning module decisions. Prematurely filling them would duplicate truth, create drift risk and blur constitutional versus product-level authority.

Until then, S01–S05 + Decisions Ledger + Checkpoint are the canonical constitutional source.

## Token-economy rule
Frozen decisions eliminate repeated reasoning. The default downstream flow is:

```text
task
 -> relevant CONST-F* and D-* IDs
 -> compact values
 -> validity/fingerprint check
 -> execute
```

Expand to the full canonical session only when validity, ambiguity, conflict or assurance requires it.

## Anti-reopen invariants
- A new chat never reopens a frozen decision by itself.
- A different model preference never reopens a frozen decision by itself.
- Executor convenience cannot supersede product governance.
- User-directed product change initiates governed supersession, never undocumented mutation.
- Frozen outcome does not freeze delegated implementation details.
- Superseded history remains auditable.
- Targeted invalidation is preferred over broad reset when dependencies are known.

## Decision summary
S05 decides that GEF Bootstrap V1 uses **CONST-F1–F8 as stable constitutional group IDs**, with `D-*` decisions as detailed canonical records, a versioned/fingerprintable Constitution, a governed Reopen Gate, explicit supersession, compact decision capsules and explicit delegation of non-constitutional mechanics.

The Constitution is stable enough to support downstream planning without repeated rediscovery while remaining intentionally evolvable through audited supersession.

## Closure readiness
- S01–S04 consistency: PASS
- constitutional group boundaries: PASS
- owner/product change authority preserved: PASS
- undocumented drift prevented: PASS
- version identity defined without fabricated hash: PASS
- M00 MODULE_DONE criteria explicit: PASS
- unresolved mechanics delegated: PASS
- premature Source Pack materialization prevented: PASS
- token-aware compact reference model: PASS

Next lifecycle step: synchronize Decisions/Technology Ledger, exact-delta audit, then `DOCUMENTED -> FROZEN`.