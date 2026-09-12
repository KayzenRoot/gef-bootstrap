# GBS-M00-S04 — Definition of Done

Status: `IN_DISCUSSION`

## Purpose
Define the constitutional meaning of **DONE** for GEF Bootstrap so completion is evidence-bound, scope-aware, exact-head when applicable, and resistant to cosmetic or percentage-driven closure.

This session defines the completion contract. It does not yet populate the final product `.engineering/DEFINITION-OF-DONE.md`; that canonical document is materialized after this session is reviewed/frozen and later refined by owning modules.

## Core doctrine
A work item, session, module, bootstrap application or V1 release is not done because:
- an agent says it is done;
- code/docs exist;
- a PR is open;
- tests were once green;
- a percentage reached 100%;
- the expected files are present.

DONE requires all applicable admitted obligations to be satisfied with current evidence.

```text
DONE = admitted obligation
     + acceptance satisfied
     + required evidence valid
     + blockers resolved/accepted by policy
     + state/checkpoint promoted
```

## Completion levels
Candidate hierarchy:

### ITEM_DONE
A bounded task/session/work item has satisfied its own acceptance criteria and proof obligations.

### MODULE_DONE
All admitted NECESSARY obligations owned by a module are complete, including required documentation/evidence and unresolved-blocker policy.

### BOOTSTRAP_APPLICATION_DONE
A target repository has received the applicable Bootstrap materialization and the required conformance receipts prove the initialized state is usable.

### V1_DONE
Every admitted NECESSARY V1 obligation is complete under the release-level DoD. IMPORTANT/FUTURE inventory does not block V1 unless explicitly promoted.

## Evidence-first completion
Every `DONE` state must point to evidence appropriate to the obligation. Examples:

```text
planning decision -> frozen session + Decisions Ledger + review/merge binding
repository change -> exact SHA/diff + required validation
GitHub governance -> observable rules/checks or explicit READY_WITH_GAPS
source hierarchy -> Source Hierarchy Conformance Receipt
executor workflow -> execution evidence + HEDS review + exact-head binding
release -> release-level required proofs + unresolved-risk disposition
```

No evidence means `UNPROVEN`, not DONE.

## Exact-head principle
Where repository state matters, proof is valid only for the candidate state it actually tested/reviewed.

A new source change after validation may invalidate exact-head proofs. Evidence-only metadata stored outside the source head may remain valid when it is explicitly bound to the reviewed SHA.

## Completion and scope
S03 rules apply directly:
- only admitted NECESSARY work blocks V1 completion;
- FUTURE/OUT_OF_SCOPE never blocks V1;
- IMPORTANT blocks only after explicit promotion;
- scope demotion cannot be used to fabricate DONE;
- promotion of new NECESSARY work may reopen/rebaseline completion legitimately.

## Completion and brownfield adoption
For an existing project, Bootstrap completion must distinguish:

```text
BOOTSTRAP_SUPPORT_READY
TARGET_PROJECT_BASELINE_ESTABLISHED
DOMAIN_GOVERNED
DOMAIN_OPTIMIZED
PROJECT_FULLY_NORMALIZED
```

A target project does not need full historical normalization to be successfully bootstrapped if the approved adoption mode allows progressive governance. The receipt must truthfully state the achieved maturity/gaps rather than calling partial adoption globally complete.

## Completion terminal states
Candidate universal states:

- `DONE`
- `DONE_WITH_ACCEPTED_GAPS` only where policy explicitly permits non-blocking gaps
- `READY_WITH_GAPS`
- `INCOMPLETE`
- `BLOCKED`
- `SOURCE_CONFLICT`
- `EVIDENCE_INVALID`
- `REOPENED`

`SUCCESS` alone is too vague for governed completion.

## Accepted gaps
A gap may be non-blocking only if:
- the applicable DoD/policy allows it;
- its risk is classified;
- owner and follow-up/disposition are recorded;
- it does not violate a NECESSARY security/assurance/completion obligation;
- the resulting state is named truthfully.

HIGH/CRITICAL unresolved defects are never hidden inside an accepted-gap state.

## Reopen semantics
DONE is not eternal. A completed item may reopen when:
- relevant canonical source changes;
- proof validity fingerprint changes;
- a regression invalidates acceptance;
- an admitted dependency changes;
- a superseding decision changes the obligation;
- previously unknown HIGH/CRITICAL defect is discovered.

Reopen should invalidate only affected descendants where dependency evidence permits, not the whole project by reflex.

## DoD layering
The system should avoid one gigantic checklist. Candidate layered model:

```text
CONSTITUTIONAL DoD
  -> V1 RELEASE DoD
      -> MODULE DoD
          -> SESSION/WORK-ORDER acceptance
              -> PROJECT/PROFILE-specific additions
```

Lower layers may add obligations but may not silently weaken higher-layer mandatory gates.

## Required completion dimensions candidate
Depending on scope/risk, DONE may require evidence across:
- scope/requirements acceptance;
- architecture/decision compliance;
- implementation/materialization;
- validation/tests/evals;
- security/integrity;
- evidence/exact-head binding;
- documentation/runbook;
- Git/GitHub governance;
- rollback/recovery when applicable;
- observability/telemetry where required;
- performance/token objectives where they are admitted obligations;
- checkpoint/current-state promotion.

Not every task needs every dimension. The applicable set must be derived from task/module/risk/scope rather than blindly running the maximal checklist.

## Token-economy rule
DoD itself can become expensive context. Therefore:
- keep constitutional DoD compact;
- address detailed gates by stable IDs;
- compile only applicable DoD obligations into Execution/Review Packs;
- reuse still-valid completion proofs;
- do not inject the full release checklist into every bounded task;
- invalidate only affected proof obligations when possible.

## Candidate completion manifest
A machine-oriented completion record may eventually carry:

```text
subjectId
scopeBinding
requiredDoDIds
satisfiedDoDIds
proofRefs
invalidatedProofs
openBlockers
acceptedGaps
reviewedHead
verdict
completedAtBinding
```

Exact schema belongs to evidence/progress modules.

## Anti-false-DONE invariants
- Agent claim is never sufficient evidence.
- 100% progress does not create DONE.
- DONE cannot outrank unresolved HIGH/CRITICAL defect.
- Stale proof cannot satisfy current obligation.
- Scope cannot be demoted merely to reach DONE.
- Missing required permissions/checks produce truthful gaps/blockers.
- Brownfield partial adoption cannot masquerade as full normalization.
- Detailed future inventory does not block V1 unless admitted.
- A compact receipt must remain traceable to underlying proof.
- Reopening one affected obligation should not automatically reset unrelated completed work.

## Questions to close before freeze
1. Should `DONE_WITH_ACCEPTED_GAPS` exist as a universal state, or should only specific profiles/policies permit it?
2. What is the minimum constitutional evidence every completed planning session must have?
3. Should exact-head binding be mandatory for all repository-changing work or only implementation/release paths?
4. How do we define non-blocking WARNING/LOW findings versus blocking HIGH/CRITICAL findings without prematurely designing the full assurance taxonomy?
5. What minimum conditions make a Bootstrap application `READY_FOR_PLANNING` versus merely `READY_WITH_GAPS`?
6. Should V1 completion require measured token/time improvement, or only the capability/telemetry to measure until a baseline exists?
7. How should DoD interact with optional integrations such as UADS/Hive/UGAS so their absence never blocks an otherwise independent core?

## Current direction
S04 is moving toward **evidence-bound, layered, exact-state completion where only admitted obligations block, partial brownfield adoption is named truthfully, and DoD is compiled narrowly enough not to become its own token tax**.
