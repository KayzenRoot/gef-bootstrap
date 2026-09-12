# Definition of Done

Status: `IN_DISCUSSION`

## Binding
This project-level Definition of Done derives from `GBS-CONSTITUTION-v1.1`, frozen Project Overview, Requirements, complete-production Scope, Architecture, Security and Test & Benchmark Plan.

It operationalizes the constitutional completion model from `GBS-M00-S04` for the **single complete production target**. It does not weaken or replace the constitutional DoD.

## Core rule
`DONE` exists only when the admitted obligation is satisfied **and** current applicable evidence proves it against the exact governed subject state where state binding matters.

No agent claim, percentage, file presence, merged PR, historical green test, documentation statement or implementation existence is sufficient by itself.

## Completion levels
- `ITEM_DONE` — one admitted backlog/work item is complete with required proof.
- `SESSION_DONE` — a governed planning/engineering session closes all admitted obligations for that session.
- `MODULE_DONE` — all admitted module obligations are satisfied and integrated.
- `PROFILE_DONE` — a profile/adapter claim is complete for its explicitly claimed surface.
- `PRODUCTION_CANDIDATE` — complete product candidate has all required release evidence assembled at one exact head.
- `PRODUCTION_RELEASE_DONE` — terminal state for the complete independent product release.

Optional UADS/Hive/UGAS adapters are tracked independently and cannot block `PRODUCTION_RELEASE_DONE` unless a release claim explicitly includes them.

## Universal item/module completion dimensions
An admitted item/module is not DONE unless all applicable dimensions are satisfied:
1. scope/admission and stable IDs are valid;
2. requirements/acceptance criteria are satisfied;
3. architecture/contracts are respected;
4. implementation/materialization is present where required;
5. applicable T0–T7 evidence passes according to risk/impact;
6. security/integrity obligations pass;
7. exact-state evidence is current;
8. documentation/runbook/operator impact is updated where applicable;
9. migration/recovery/compatibility obligations are satisfied where applicable;
10. evidence/checkpoint/state is promoted through the governed workflow;
11. no unresolved blocker exists for the claimed surface.

## Planning-session DONE
A planning session requires at minimum:
- stable session ID and final status;
- self-contained frozen decision or explicitly delegated unresolved mechanics;
- open questions closed or routed to a named owner/module;
- Decisions Ledger synchronization where materially required;
- Technology Ledger synchronization where materially required;
- Scope/dependency/requirement impacts recorded;
- exact PR/head or equivalent immutable subject binding;
- semantic audit verdict with no blocker;
- promoted checkpoint that identifies the next legal continuation.

## Engineering work-item DONE
A code/materialization work item requires at minimum:
- admitted backlog ID mapped to REQ/module/contract owner;
- exact base/head binding;
- bounded intended delta matches actual delta;
- required tests/evals/security checks executed and current;
- failures introduced by the work resolved;
- evidence bundle/receipt sufficient for HEDS exact-delta review;
- no unapproved scope expansion;
- recovery/migration evidence where mutation or compatibility semantics require it;
- reviewer verdict `APPROVED` or equivalent governed promotion;
- checkpoint/progress state updated after integration.

## Module DONE
A module becomes `MODULE_DONE` only when:
1. every production-admitted obligation owned by the module is ITEM_DONE or has a permitted explicit non-blocking disposition;
2. module-level contracts and dependency interfaces have current evidence;
3. no dependent proof is knowingly invalidated;
4. module documentation/operator contracts are current;
5. all HIGH/CRITICAL defects affecting the module's production claim are closed;
6. evidence maps module -> REQ -> test/proof -> exact state;
7. module completion is promoted in checkpoint/progress state.

A module cannot become DONE merely because all planned files exist or all its sessions were discussed.

## DONE_WITH_ACCEPTED_GAPS
`DONE_WITH_ACCEPTED_GAPS` is permitted only when the owning policy/profile explicitly allows it and all are true:
- the gap is identified and classified;
- impact and residual risk are stated;
- owner and follow-up path exist;
- the gap does not violate a CORE_REQUIRED/NECESSARY obligation for the claimed surface;
- the gap is not a HIGH/CRITICAL security/integrity defect;
- evidence is not invalid/stale;
- source authority is not conflicted;
- release/profile wording is narrowed so the gap is not hidden.

Accepted gaps never manufacture independent product completion.

## Blocking findings
Blocking findings include at minimum:
- HIGH/CRITICAL security or integrity defect;
- invalid/stale evidence for a required release obligation;
- source authority conflict affecting the claimed result;
- failed recovery/migration proof for a required path;
- incompatible public contract without governed migration/disposition;
- exact-head release evidence mismatch;
- test/evidence gap leaving an admitted requirement unproven;
- known regression above a blocking quality/performance threshold without approved product-level disposition;
- S4 behavior executed or required without the frozen authorization path.

## Reopening and invalidation
DONE is validity-bound, not permanent history.

Relevant change to canonical source, dependency, contract, security policy, runtime/platform support, proof input, migration semantics or discovered defect reopens only the affected completion descendants when targeted invalidation is provable.

Unrelated accepted work remains DONE. Blanket reset is prohibited when narrower invalidation can be proven.

## Production Candidate gate
A head may be called `PRODUCTION_CANDIDATE` only when:
- every CORE_REQUIRED and PRODUCT_INCLUDED module is at module-complete candidate state;
- any production-admitted EXPERIMENTAL_GATED capability has passed Utility, Assurance, Validity/Stability and Engineering ROI gates;
- independent product works without UADS/Hive/UGAS installed;
- all release-required T0–T7 evidence is assembled for the exact candidate head;
- Security T1–T12 proof is current;
- supported Windows/Linux/macOS + Node LTS matrix is current;
- installation/setup, upgrade, compatibility and recovery scenarios pass for the claimed distribution surface;
- user docs, engineering docs and runbooks are release-current;
- no blocker remains;
- release manifest/checkpoint identifies all claimed surfaces and explicitly excluded optional adapter claims.

## PRODUCTION_RELEASE_DONE candidate conditions
The complete product reaches `PRODUCTION_RELEASE_DONE` only when all conditions below are satisfied on the accepted release state:

### Product obligations
1. all `CORE_REQUIRED` modules are `MODULE_DONE`;
2. all `PRODUCT_INCLUDED` modules are `MODULE_DONE`;
3. production-admitted experimental capabilities have passed all frozen promotion gates;
4. every frozen/admitted REQ maps to a satisfied acceptance criterion and current proof;
5. no silent scope expansion or hidden excluded obligation exists.

### Architecture and deterministic work plane
6. TypeScript/Node LTS modular monorepo implementation matches frozen Architecture;
7. application/library API and thin CLI expose the admitted deterministic operations;
8. filesystem/Git/provider boundaries and adapter isolation conform to architecture;
9. transaction plan/stage/verify/promote/recovery semantics pass required evidence;
10. canonical/derived/operational state authority rules are enforced.

### Security/integrity
11. Security T1–T12 evidence passes;
12. no unresolved HIGH/CRITICAL security/integrity defect remains;
13. S0–S4 authorization model is enforced, including action-specific S4 authorization;
14. secret, process, supply-chain, provider and adapter security gates pass;
15. exact-state/tamper-evidence semantics pass.

### Test/quality
16. all eleven frozen Test & Benchmark production-release evidence conditions pass;
17. selective validation/proof-carry mechanisms used in production are Shadow-Assurance promoted or bypassed by broader release validation;
18. no flaky/quarantined test leaves an admitted production obligation unproven;
19. complete claimed Windows/Linux/macOS + supported Node LTS release matrix passes;
20. benchmark baseline is reproducible and no blocking performance/engineering-cost regression remains.

### Product operation and continuity
21. NEW_PROJECT workflow passes end-to-end;
22. EXISTING_PROJECT/BROWNFIELD workflow passes end-to-end without forced destructive normalization;
23. checkpoint/resume works from fresh context without chat-history dependency;
24. upgrade/migration/compatibility and recovery paths pass for claimed supported versions;
25. GitHub reference profile passes simulation plus required live integration evidence;
26. truthful permission-gap/degraded states are demonstrated.

### Documentation/release
27. user documentation is complete for supported workflows;
28. engineering documentation covers architecture/contracts/extension points;
29. operational runbooks cover setup, diagnostics, recovery, upgrade and release;
30. release artifacts/manifests/checksums/provenance required by policy are current;
31. exact accepted release head is bound to release evidence/checkpoint;
32. no required evidence depends on an unavailable external condition unless the release claim is narrowed accordingly.

## Progress-credit rule
Progress percentage is not the same as DONE.

After backlog baseline creation, partial progress may be represented only by the frozen weighted model and objective item states. A module receives full completion credit only at `MODULE_DONE`. Historical work receives credit only after evidence is reconciled against this DoD.

No denominator manipulation, silent reclassification or optimistic percentage may make the project appear more complete.

## Candidate backlog baseline activation
The first trustworthy overall completion baseline becomes legal only after:
1. this project-level DoD is FROZEN;
2. all complete-product modules are represented in admitted backlog structure;
3. backlog items map to requirements/modules/contracts;
4. E/R/I/P weights are assigned with rationale and reviewed;
5. historical completed work is evidence-reconciled;
6. optional adapter work is tracked separately unless included in a release claim.

Only then may `overallCompletion` and ETA move from `NOT_YET_BASELINED` / `NOT_YET_RELIABLE`.

## Questions to close
1. Should Product Overview/Requirements/Scope/Architecture/Security/Test Plan frozen work receive historical progress credit immediately after backlog reconciliation, or only when mapped into specific module/item weights?
2. Should `PRODUCT_INCLUDED` modules be just as blocking as `CORE_REQUIRED` for the single complete production release? Current direction: yes.
3. What exact allowed dispositions, if any, can count as non-blocking for production-included work?
4. Should optional adapter release claims use the same module/profile DoD with extra compatibility gates? Current direction: yes.
5. Should `PRODUCTION_CANDIDATE` require every production-included module at MODULE_DONE, or allow a narrow candidate gap list? Current direction: all done, with gaps only where the owning policy explicitly permits and release claim is narrowed.
6. What evidence freshness rules should be fixed here versus delegated to Evidence/Compatibility modules?
7. How should a failed production benchmark be dispositioned when correctness is intact but efficiency regresses materially?
8. What minimum documentation completeness evidence is required before module and production completion?
9. Should release completion require a clean working tree/tag/release object, or treat those as Release Governance mechanics while exact-head binding remains mandatory here?
10. What exact event changes overall project state from planning/pre-production to production construction readiness after Source Pack closure?

## Current direction
The product DoD is intentionally strict because this project is not targeting a disposable MVP. The single production release must be functionally complete, tested, security-cleared, recoverable, documented, benchmarked and exact-state validated before `PRODUCTION_RELEASE_DONE` can exist.

STOP CONDITION: `PROJECT_DOD_DECISIONS_REQUIRED`.
