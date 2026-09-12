# Definition of Done

Status: `FROZEN`

## Binding
This project-level Definition of Done derives from `GBS-CONSTITUTION-v1.1`, frozen Project Overview, Requirements, complete-production Scope, Architecture, Security and Test & Benchmark Plan. It operationalizes the constitutional completion model from `GBS-M00-S04` for the single complete production target.

## Core rule
`DONE` exists only when an admitted obligation is satisfied and current applicable evidence proves it against the exact governed subject state where state binding matters. Agent assertion, percentage, file presence, merged PR, historical green tests or documentation claims are never sufficient by themselves.

## Completion levels
- `ITEM_DONE`
- `SESSION_DONE`
- `MODULE_DONE`
- `PROFILE_DONE`
- `PRODUCTION_CANDIDATE`
- `PRODUCTION_RELEASE_DONE`

Optional UADS/Hive/UGAS adapters are tracked independently and do not block the independent product release unless a release claim explicitly includes them.

## Universal completion dimensions
An admitted item/module is DONE only when all applicable dimensions are satisfied: scope/admission and stable IDs; requirements/acceptance; architecture/contracts; implementation/materialization where required; applicable T0–T7 proof; security/integrity; current exact-state evidence; documentation/runbook/operator updates; migration/recovery/compatibility where applicable; governed evidence/checkpoint promotion; and no unresolved blocker for the claimed surface.

## Planning-session DONE
Requires stable session ID/final status; self-contained frozen decision or named delegation; open questions closed/routed; Decisions/Technology Ledgers synchronized where applicable; scope/dependency/requirement impacts recorded; exact PR/head or equivalent immutable subject binding; semantic audit with no blocker; and promoted checkpoint with the next legal continuation.

## Engineering work-item DONE
Requires admitted backlog ID mapped to REQ/module/contract owner; exact base/head binding; intended delta matching actual delta; current required tests/evals/security checks; introduced failures resolved; evidence bundle/receipt sufficient for exact-delta review; no unauthorized scope expansion; recovery/migration proof where applicable; governed APPROVED verdict; and integrated checkpoint/progress update.

## Module DONE
A module becomes `MODULE_DONE` only when every production-admitted obligation is ITEM_DONE or has a permitted explicit non-blocking disposition; module contracts/dependency interfaces have current evidence; no dependent proof is knowingly invalidated; docs/operator contracts are current; HIGH/CRITICAL production defects are closed; evidence maps module -> REQ -> test/proof -> exact state; and completion is promoted in governed state.

## Accepted gaps
`DONE_WITH_ACCEPTED_GAPS` is allowed only when an owning frozen policy/profile explicitly permits it. The gap must be identified, classified, impact/risk stated, owned, follow-up defined, evidence current and source authority non-conflicted. It cannot violate CORE_REQUIRED or PRODUCT_INCLUDED obligations for the claimed release surface, hide HIGH/CRITICAL security/integrity defects, or manufacture independent product completion. Release/profile wording must narrow the claim so the gap is visible.

## Blocking findings
Blocking findings include HIGH/CRITICAL security/integrity defects; invalid/stale required evidence; source-authority conflict affecting the claim; failed required recovery/migration proof; incompatible public contract without governed migration/disposition; exact-head mismatch; admitted requirement left unproven; performance/engineering-cost regression above a frozen blocking budget without approved product-level disposition; or S4 behavior without the frozen authorization path.

## Reopening and invalidation
DONE is validity-bound. Relevant changes to canonical source, dependencies, contracts, security policy, supported runtime/platform, proof inputs, migration semantics or discovered defects reopen only affected completion descendants when targeted invalidation is provable. Unrelated accepted work remains DONE.

## Production Candidate
A head may be `PRODUCTION_CANDIDATE` only when every CORE_REQUIRED and PRODUCT_INCLUDED module is `MODULE_DONE`; every production-admitted EXPERIMENTAL_GATED capability passed Utility, Assurance, Validity/Stability and Engineering ROI; the product works independently of optional ecosystem adapters; release-required T0–T7 and Security T1–T12 evidence is current at one exact head; supported Windows/Linux/macOS + Node LTS matrix passes; setup/upgrade/compatibility/recovery pass; docs/runbooks are release-current; no blocker remains; and the release manifest explicitly states included/excluded optional claims.

## PRODUCTION_RELEASE_DONE
The complete independent product reaches `PRODUCTION_RELEASE_DONE` only when all conditions below are satisfied on the accepted release state.

### Product obligations
1. all CORE_REQUIRED modules are MODULE_DONE;
2. all PRODUCT_INCLUDED modules are MODULE_DONE;
3. production-admitted experimental capabilities passed all frozen gates;
4. every admitted REQ maps to satisfied acceptance and current proof;
5. no hidden excluded obligation or unauthorized scope expansion exists.

### Architecture / deterministic plane
6. implementation matches frozen hybrid Architecture;
7. application/library API plus thin CLI expose admitted deterministic operations;
8. filesystem/Git/provider boundaries and adapter isolation conform;
9. plan/stage/verify/promote/recovery semantics pass;
10. canonical/derived/operational authority rules are enforced.

### Security / integrity
11. Security T1–T12 passes;
12. no unresolved HIGH/CRITICAL security/integrity defect remains;
13. S0–S4 authorization, including action-specific S4 approval, is enforced;
14. secret/process/supply-chain/provider/adapter gates pass;
15. exact-state/tamper-evidence semantics pass.

### Test / quality / performance
16. all frozen Test & Benchmark production-release evidence conditions pass;
17. selective validation/proof-carry mechanisms used authoritatively are Shadow-Assurance promoted or bypassed by broader release validation;
18. no flaky/quarantined test leaves an admitted obligation unproven;
19. complete claimed Windows/Linux/macOS + supported Node LTS matrix passes;
20. benchmark baseline is reproducible and no frozen blocking total-safe-engineering-cost regression remains.

### Product operation / continuity
21. NEW_PROJECT workflow passes E2E;
22. EXISTING_PROJECT/BROWNFIELD passes E2E without forced destructive normalization;
23. checkpoint/resume works from fresh context without chat-history dependency;
24. upgrade/migration/compatibility/recovery paths pass for claimed versions;
25. GitHub reference profile passes simulation plus required live evidence;
26. truthful permission-gap/degraded states are demonstrated.

### Documentation / release
27. user documentation covers supported workflows;
28. engineering documentation covers architecture/contracts/extension points;
29. runbooks cover setup, diagnostics, recovery, upgrade and release;
30. release artifacts/manifests/checksums/provenance required by policy are current;
31. exact accepted release head is bound to release evidence/checkpoint;
32. no required evidence depends on unavailable external conditions unless the release claim is narrowed accordingly.

## Frozen decisions for completion governance
1. Historical frozen planning work receives progress credit only after it is mapped to specific admitted backlog/module items and reconciled against current evidence. No immediate blanket credit.
2. PRODUCT_INCLUDED is release-blocking exactly like CORE_REQUIRED for the single complete production target.
3. Non-blocking dispositions are limited to explicit policy-permitted exclusions/advisories that do not leave an admitted production obligation unproven and do not hide security/integrity/source/evidence blockers.
4. Optional adapter claims use the same item/module/profile DoD plus their additional compatibility/security gates; they remain outside independent-product completion unless explicitly included in the release claim.
5. PRODUCTION_CANDIDATE requires every production-included module at MODULE_DONE. A broad candidate gap list is not permitted.
6. Evidence freshness is dependency/validity based rather than a universal time-to-live. Evidence must be rerun when relevant inputs, environment, toolchain, contract, runtime/platform, security policy or proof dependency changes; owning Evidence/Compatibility modules may add stricter rules.
7. A material performance regression is blocking when it exceeds a frozen benchmark/engineering-cost budget or invalidates an admitted optimization claim. Correctness alone does not automatically waive it. A conscious product-level supersession may change the budget only through governed decision/change control.
8. Documentation completeness requires each admitted public behavior/contract/operator workflow to have a mapped current documentation owner/proof. Missing docs that prevent safe use, recovery, upgrade, extension or truthful operation are blocking.
9. DoD requires exact-head binding. Clean working tree, tag, release object, artifact publication/signing and related mechanics are owned by Release Governance, but any mechanics required by that frozen policy become release blockers.
10. Functional construction readiness occurs only after the ordered Source Pack is closed through DoD, the admitted weighted backlog/baseline is frozen, required decision/checkpoint state is promoted, and a checkpoint explicitly declares `READY_FOR_PRODUCTION_CONSTRUCTION`. DoD freeze alone does not authorize implementation.

## Progress baseline activation
The first trustworthy overall completion baseline becomes legal only after: this DoD is FROZEN; all complete-product modules are represented in admitted backlog; backlog items map to REQ/module/contract; E/R/I/P weights are assigned with rationale and reviewed; historical work is evidence-reconciled; and optional adapters are separately tracked unless included in the release claim.

Progress percentage is not DONE. Partial credit may use only the frozen weighted model and objective item states. Full module credit requires MODULE_DONE. Denominator manipulation, silent reclassification and optimistic percentage inflation are prohibited.

## Freeze audit
- complete-product target preserved: PASS
- CORE_REQUIRED + PRODUCT_INCLUDED release blocking: PASS
- optional adapters isolated from independent release: PASS
- exact-state/evidence validity preserved: PASS
- Security and Test/Benchmark gates inherited: PASS
- performance regression governance: PASS
- documentation/release evidence: PASS
- construction readiness gate explicit: PASS
- open DoD questions: 0

STOP CONDITION: `READY_FOR_DOD_EXACT_DELTA_REVIEW_AND_CHECKPOINT`.
