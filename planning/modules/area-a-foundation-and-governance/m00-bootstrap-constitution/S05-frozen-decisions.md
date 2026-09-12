# GBS-M00-S05 — Frozen Decisions

Status: `IN_DISCUSSION`

## Purpose
Close the Bootstrap Constitution by defining which decisions from S01–S04 are constitutionally frozen, how they may be referenced compactly, and the only legal mechanisms for reopening or superseding them.

This session does **not** restate every detail from prior sessions. Its job is to create a small constitutional lockfile so future planning and executors know what is already settled and do not spend tokens reopening resolved foundations.

## Core objective

```text
FROZEN CONSTITUTION
  -> compact decision identities
  -> explicit ownership
  -> validity/supersession rules
  -> dependency impact
  -> reopen gate
  -> downstream planning can proceed without rediscovery
```

The desired effect is both governance and token economy: once a constitutional decision is frozen, later agents consume the stable reference/compact value unless a governed trigger requires expansion to the canonical source.

## Candidate constitutional freeze groups

### F1 — Product identity and boundary
- GEF Bootstrap is instruction-first governance, not a standalone CLI/runtime product.
- It materializes governed project artifacts into target repositories through compatible agents/executors.
- UADS, Hive, UGAS and other ecosystems remain optional integrations unless future scope explicitly changes that boundary.

### F2 — Default engineering model
- GEF V1 is the default engineering model for initialized projects.
- ChatGPT/planning sources resolve expensive engineering reasoning as far as safely possible.
- Executors such as Codex receive bounded, pre-resolved execution contracts and escalate instead of rediscovering frozen architecture.

### F3 — Primary optimization objective
- total safe engineering cost/change is the optimization target;
- token economy and executor wall-clock latency are first-class;
- correctness, security, integrity and required assurance outrank optimization budgets;
- optimization claims must be measured end-to-end and targets must not masquerade as measured facts.

### F4 — Brownfield is first-class
- NEW_PROJECT and EXISTING_PROJECT are first-class adoption paths;
- brownfield adoption is progressive, preservation-first and non-destructive;
- working projects do not restart planning or rewrite architecture just to adopt GEF naming;
- aggressive proof/test reuse requires evidence/shadow assurance before promotion.

### F5 — Source truth model
- authority is domain-specific, not newest-wins;
- descriptive truth and normative truth remain separate;
- canonical facts are addressable and validity-bound;
- hybrid fact/dependency fingerprints support targeted invalidation;
- executor context targets Minimum Sufficient Context and expands only for evidence-backed/assurance reasons;
- source conflicts/missing authority fail closed.

### F6 — Scope model
- inventory is not commitment;
- V1 admission uses NECESSARY / IMPORTANT / FUTURE / OUT_OF_SCOPE;
- NECESSARY requires one traceable primary admission basis;
- IMPORTANT never auto-enters V1;
- FUTURE does not count against V1 completion;
- executors cannot authorize product-scope expansion;
- scope cannot be manipulated to fabricate progress/ETA.

### F7 — Completion model
- DONE is evidence-bound, layered and exact-state where applicable;
- 100% progress or agent assertion never creates DONE;
- accepted gaps are policy-gated;
- blocking defects/invalid evidence cannot be hidden as gaps;
- completion may reopen through targeted validity invalidation;
- READY_FOR_PLANNING requires a usable governed planning surface and conformance evidence;
- V1 must be measurable/benchmarkable without fabricated improvement percentages.

### F8 — Continuity and auditability
- human Checkpoint and machine-current state are consistent governed views, not competing truth;
- every frozen planning increment ends with review + checkpoint promotion;
- new chats should resume from governed state rather than reconstructing from conversation history;
- material innovations remain in Technology & Innovation Ledger until owned/frozen.

## Constitutional reference model
Downstream material should normally reference frozen groups and/or decision IDs rather than duplicating long prose.

Example:

```text
requires:
  - CONST-F3
  - D-0016
  - D-0024
```

A compact reference never supersedes the canonical session/Decision Ledger. It is an address and dependency declaration.

## Reopen Gate
A frozen constitutional decision may be reopened only when at least one governed trigger exists:

- `SOURCE_DRIFT`: authoritative external/source reality changed materially;
- `CONTRADICTION_DISCOVERED`: frozen decisions are proven internally incompatible;
- `SECURITY_OR_INTEGRITY_DEFECT`: keeping the decision creates an unacceptable material risk;
- `DEPENDENCY_INVALIDATED`: a foundational dependency the decision relied on is no longer valid;
- `V1_SCOPE_SUPERSESSION`: a governed later scope/version explicitly requires replacement;
- `MEASURED_FAILURE`: benchmark/evidence shows the frozen rule defeats its stated constitutional objective;
- `EXPLICIT_USER_PRODUCT_DECISION`: product owner intentionally changes the product boundary or objective through governed planning.

The reopen request must identify the affected decision/group, evidence, downstream impact and proposed owner. General preference, novelty, executor convenience or a new chat are not valid reopen triggers.

## Supersession rule
Frozen constitutional material is never edited into historical ambiguity. A superseding decision must:

1. identify the old decision/group;
2. state the new decision;
3. record reason/evidence;
4. identify effective version/binding;
5. mark affected downstream facts/modules/proofs/checkpoints;
6. trigger targeted invalidation/replanning where needed;
7. preserve the old record as historical truth.

## Constitutional Stability Contract
The project should optimize for **stable foundations with evolvable mechanisms**.

The Constitution freezes outcomes and invariants, not every later schema, filename, algorithm or internal representation. For example:
- MSC is frozen as a requirement; exact Source Capsule schema belongs to M14/M15;
- evidence-bound DONE is frozen; Completion Manifest schema belongs to Evidence/Progress modules;
- brownfield progressive adoption is frozen; exact maturity schema belongs to M13;
- instruction-first product boundary is frozen; legacy scaffold module names may still be refactored without changing IDs.

This prevents two opposite failures: reopening fundamentals constantly, or freezing implementation details too early.

## Candidate Frozen Decision Capsule
A compact machine/human index may later expose:

```text
constitutionVersion
frozenGroups[]
decisionIds[]
owners[]
sourceRefs[]
fingerprints[]
supersessionState
reopenTriggers[]
```

Exact schema belongs to later Decision/Source Pack modules. S05 only decides whether such a compact constitutional reference is required.

## Token-economy rule
Frozen decisions are one of the largest opportunities to eliminate repeated reasoning.

Later agents should not receive the full constitutional prose by default. The preferred flow is:

```text
task
 -> relevant frozen decision IDs/groups
 -> compact values
 -> fingerprint validity
 -> execute
```

Expand to the full canonical session only if validity, ambiguity, conflict or assurance requires it.

## Questions to close before M00 freeze
1. Should F1–F8 become stable constitutional group IDs in V1, or remain only a human summary while individual D-* IDs are canonical?
2. Is `EXPLICIT_USER_PRODUCT_DECISION` alone sufficient to reopen a frozen rule, or must it always create a superseding planning record before effect?
3. What minimum metadata is required for a Frozen Decision Capsule without duplicating the Decisions Ledger?
4. Should the Constitution itself receive a version identifier/fingerprint at M00 closure?
5. What exact condition marks `GBS-M00 — Bootstrap Constitution` as MODULE_DONE under S04?
6. Which unresolved matters must be explicitly delegated to later modules before M00 can close?
7. After S05, should we immediately materialize/update `.engineering/SOURCE-HIERARCHY.md`, `SCOPE.md` and `DEFINITION-OF-DONE.md`, or should those wait for their dedicated Source Pack planning sequence to avoid pre-filling conclusions?

## Current direction
S05 is moving toward a **small constitutional lockfile of stable outcomes and invariants, referenced by IDs, validity-bound, reopenable only through explicit evidence-backed supersession, and deliberately separated from evolvable implementation mechanics**.
