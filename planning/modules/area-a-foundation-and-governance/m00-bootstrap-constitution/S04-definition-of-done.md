# GBS-M00-S04 — Definition of Done

Status: `FROZEN`

## Purpose
Define the constitutional meaning of **DONE** for GEF Bootstrap so completion is evidence-bound, scope-aware, exact-state when applicable, and resistant to cosmetic or percentage-driven closure.

This session defines the completion contract. It does not yet populate the final product `.engineering/DEFINITION-OF-DONE.md`; that canonical document is materialized only after this session is reviewed/frozen and later refined by owning modules.

## Core doctrine
A work item, session, module, bootstrap application or V1 release is not done because an agent says so, files exist, a PR is open, tests were once green, or a progress meter reached 100%.

```text
DONE = admitted obligation
     + acceptance satisfied
     + required evidence valid
     + blockers resolved or disposition explicitly permitted
     + governed state/checkpoint promoted
```

No evidence means `UNPROVEN`, not DONE.

## Completion levels
### ITEM_DONE
A bounded task/session/work item satisfied its acceptance criteria and proof obligations.

### MODULE_DONE
All admitted NECESSARY obligations owned by the module are complete, including applicable documentation, evidence and blocker disposition.

### BOOTSTRAP_APPLICATION_DONE
A target repository received the applicable Bootstrap materialization and the required conformance receipts prove the initialized state is usable for its declared adoption mode.

### V1_DONE
Every admitted NECESSARY V1 obligation is complete under the release DoD. IMPORTANT/FUTURE inventory does not block V1 unless promoted.

## Evidence-first completion
Every DONE state points to evidence appropriate to the obligation. Typical bindings include planning decision -> frozen session + Decisions Ledger + reviewed/merged binding; repository change -> exact state/SHA + required validation; GitHub governance -> observable configuration/checks or truthful gap state; source hierarchy -> Source Hierarchy Conformance Receipt; executor workflow -> execution evidence + semantic review + state binding; release -> release-level proofs + unresolved-risk disposition.

Evidence must be attributable to the subject and candidate state it claims to prove.

## Minimum evidence for a completed planning session
Every FROZEN planning session must have at least:
1. stable session ID and explicit final status;
2. documented decision/contract sufficient to resume without chat memory;
3. unresolved questions either closed or explicitly routed to owning future scope;
4. material decisions synchronized to the Decisions Ledger;
5. material inventions/technologies synchronized to the Technology Ledger when applicable;
6. scope/dependency impacts recorded when applicable;
7. exact PR/head or equivalent repository binding when the session changed repository sources;
8. audit verdict showing no unresolved blocker for the session;
9. promoted checkpoint identifying the next legal continuation point.

A discussion transcript alone can never satisfy planning completion.

## Exact-state binding
Exact-head binding is mandatory whenever the claimed evidence depends on repository content or configuration at a particular state, including implementation, materialized governance, CI/security configuration, release candidates and repository-backed planning changes.

For purely external/non-repository evidence, the proof must instead bind to an equivalent immutable or versioned subject identifier. The principle is **exact subject state**, not Git SHA worship.

A later relevant change invalidates only the proofs whose validity dependencies changed. Evidence-only receipts stored outside the source head may remain valid when explicitly bound to the reviewed SHA/state.

## Completion and scope
S03 rules apply directly:
- only admitted NECESSARY work blocks V1;
- FUTURE/OUT_OF_SCOPE never blocks V1;
- IMPORTANT blocks only after explicit promotion;
- scope demotion cannot fabricate DONE;
- promotion of new NECESSARY work legitimately reopens/rebaselines affected completion.

## Accepted gaps policy
`DONE_WITH_ACCEPTED_GAPS` is not a universal escape hatch. It may be used only when an owning policy/profile explicitly permits that terminal state for the subject.

An accepted gap must have stable identity, risk/severity classification, reason it is non-blocking, owner/disposition or explicit permanent acceptance, evidence showing no violated NECESSARY obligation and a truthful terminal label.

A known HIGH/CRITICAL defect, violated security/assurance floor, corrupted evidence, unresolved source conflict, or missing mandatory completion obligation cannot be hidden inside `DONE_WITH_ACCEPTED_GAPS`.

## Findings and blocking behavior
S04 freezes behavior without preempting the full assurance taxonomy:
- blocking finding: violation or credible material risk to a NECESSARY obligation, security/assurance floor, integrity, required evidence or release acceptance;
- non-blocking finding: advisory improvement or bounded residual risk explicitly allowed by policy without falsifying completion.

Severity names are delegated to Assurance/Security. Until then, uncertainty that could conceal a material violation fails closed or requires escalation.

## Reopen semantics
DONE is not eternal. A completed subject reopens when relevant canonical source changes, proof validity changes, regression invalidates acceptance, an admitted dependency changes, a superseding decision changes the obligation, or a previously unknown blocking defect is confirmed.

Reopen invalidates only affected descendants where dependency evidence permits. It must not reset unrelated proven work by reflex.

## DoD layering
GEF uses layered DoD rather than one giant checklist:

```text
CONSTITUTIONAL DoD
  -> V1 RELEASE DoD
      -> MODULE DoD
          -> SESSION / WORK-ORDER acceptance
              -> PROJECT / PROFILE additions
```

Lower layers may strengthen obligations but may not silently weaken higher-layer mandatory gates.

## Required completion dimensions
Depending on scope/risk, DONE may require evidence across scope/requirements, architecture/decisions, materialization/implementation, tests/evals, security/integrity, exact-state binding, documentation/runbooks, Git/GitHub governance, rollback/recovery, observability, performance/token objectives and checkpoint promotion.

Not every task needs every dimension. The applicable set is compiled from admitted scope, task class, risk, profile and dependency impact.

## READY_FOR_PLANNING contract
A Bootstrap application may report `READY_FOR_PLANNING` only when, for its declared adoption mode/profile:
1. project/repository identity is established;
2. required Source Pack/governance skeleton is materialized or validly mapped/aliased for brownfield;
3. source authority and known gaps/conflicts are represented truthfully;
4. planning/session protocol and checkpoint/resume path are available;
5. GEF adoption mode is known;
6. required Git/GitHub governance is applied where permissions allow, with unavailable controls represented as explicit gaps rather than fake success;
7. no unresolved blocker prevents safe product planning;
8. conformance/evidence receipt binds the achieved state.

If planning is possible but non-blocking optional/environmental controls remain unavailable under policy, use `READY_WITH_GAPS`. If source conflict, missing mandatory authority, security blocker or unusable continuity remains, do not claim ready.

## Brownfield completion
Existing-project bootstrapping distinguishes `BOOTSTRAP_SUPPORT_READY`, `TARGET_PROJECT_BASELINE_ESTABLISHED`, `DOMAIN_GOVERNED`, `DOMAIN_OPTIMIZED` and `PROJECT_FULLY_NORMALIZED`.

A project may be successfully bootstrapped without full historical normalization when the approved adoption mode is progressive. The receipt names achieved maturity and remaining gaps precisely.

## V1 optimization proof requirement
GEF V1 must include the capability and telemetry needed to measure token/time/engineering-cost outcomes and must establish a reproducible baseline/benchmark path before final acceptance.

V1 does not require fabricating a universal percentage improvement before representative baseline data exists. Where comparable baseline data is available before V1 acceptance, measured results must be reported truthfully, including regressions and confidence. Optimization claims remain targets until proven.

## Optional integrations
UADS, Hive, UGAS and other ecosystem adapters are optional integrations unless independently admitted into a target profile.

Core V1 DONE must be provable with those integrations absent. Optional integration failure may block that adapter/profile, but may not block the independent Bootstrap core unless a frozen V1 scope decision explicitly changes the boundary.

## Token-economy rule
DoD itself must not become a token tax. Keep constitutional DoD compact, address detailed gates with stable IDs, compile only applicable obligations into Execution/Review Packs, reuse still-valid completion proofs, avoid injecting the full release checklist into every bounded task and invalidate only affected proof obligations.

A future Completion Manifest may carry subject ID, scope binding, required/satisfied DoD IDs, proof refs, invalidated proofs, blockers, accepted gaps, reviewed state and verdict. Exact schema belongs to evidence/progress modules.

## Anti-false-DONE invariants
- Agent claim is never sufficient evidence.
- 100% progress does not create DONE.
- DONE cannot outrank a blocking defect or invalid evidence.
- Stale proof cannot satisfy a current obligation.
- Scope cannot be demoted merely to reach DONE.
- Missing required permissions/checks produce truthful gaps/blockers.
- Brownfield partial adoption cannot masquerade as full normalization.
- Future inventory does not block V1 unless admitted.
- A compact receipt remains traceable to underlying proof.
- Reopening an affected obligation does not reset unrelated proven work.
- Optional ecosystem integrations cannot silently become core completion dependencies.

## Frozen decision summary
S04 freezes completion as **evidence-bound, layered, scope-aware, exact-state where evidence depends on repository/configuration state, selectively reopenable, and truthful about gaps/brownfield maturity**.

`DONE_WITH_ACCEPTED_GAPS` is policy-gated, not universal. Planning completion requires frozen documented decisions, synchronized ledgers, audit and checkpoint promotion. `READY_FOR_PLANNING` requires a usable governed planning surface with no blocker. V1 must be measurable and benchmarkable, but unproven percentage targets cannot masquerade as measured release facts.

## Freeze audit
- S01 principle consistency: PASS
- S02 source/evidence validity consistency: PASS
- S03 admitted-scope consistency: PASS
- Decisions Ledger synchronization: PASS
- Technology Ledger synchronization: PASS
- accepted-gap escape hatch prevented: PASS
- exact-state rule generalized beyond Git: PASS
- brownfield truthfulness: PASS
- optional integration independence: PASS
- token-aware DoD layering: PASS
- canonical DEFINITION-OF-DONE.md unchanged: PASS
- accidental product implementation: NONE

STOP CONDITION: `READY_FOR_GBS-M00-S04_REVIEW_AND_CHECKPOINT`.