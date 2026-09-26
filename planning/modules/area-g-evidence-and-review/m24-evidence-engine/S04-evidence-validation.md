# GBS-M24-S04 — Evidence Validation
Status: `FROZEN`
Module weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze the final validation, freshness, conflict, completeness and downstream handoff semantics for M24. Validation must produce truthful bounded evidence states without upgrading incomplete/conflicting/stale inputs and without taking over M25 proof sufficiency or M27 assurance authority.

## Frozen mechanisms
1. **EVG24 — Evidence Validation Gate**: independently verifies manifest/item structure, producer authority, subject/revision binding, receipts and current validity before any acceptance output.
2. **EFG24 — Evidence Freshness Gate**: returns `CURRENT | STALE | CONFLICT | INDETERMINATE` from dependency/subject observations, never universal time alone.
3. **ECG24 — Evidence Completeness Gate**: evaluates whether the evidence set requested by the caller is completely observed; missing required items remain explicit, but completeness alone is not proof sufficiency.
4. **OAG24 — Owner & Authority Guard**: prevents producer-owner spoofing, M24 self-attestation loops and evidence-kind authority escalation.
5. **DID24 — Dependency Invalidation Detector**: maps changed validity/subject/producer dependencies to affected evidence and claims, widening conservatively when knowledge is incomplete.
6. **SBW24 — Evidence Split-Brain Witness**: detects divergent current evidence decisions/producer attestations over the same stable evidence/subject identity without newest-wins resolution.
7. **EAC24 — Evidence Acceptance Contract**: emits the exact read-only M21-compatible acceptance binding owned by `M24_EVIDENCE`; never emits weight/progress.
8. **DPC24 — Downstream Proof Context Handoff**: emits verified evidence-node identities, claim mappings, receipt/validity identities and unresolved gaps/conflicts for future M25/M27 without computing proof graph or assurance verdict.

## Validation state model
Evidence item acceptance state:
`ACCEPTED | REJECTED | STALE | CONFLICT | UNKNOWN`.

Freshness state:
`CURRENT | STALE | CONFLICT | INDETERMINATE`.

Evidence-set completeness state:
`COMPLETE | PARTIAL | CONFLICT | INDETERMINATE | TRUNCATED`.

These dimensions are related but independent. Example: a structurally complete set can still contain conflict; a current evidence item can be rejected; an accepted item can later become stale.

## Validation pipeline
1. Validate EIC24/EAB24 and required authority expectations.
2. Verify MEM24 and SAI24.
3. Verify SSB24/XRB24/PCE24 and digest-domain rules.
4. Detect duplicate/replay/splice/split-brain conflict.
5. Recompute current binding integrity/freshness.
6. Verify receipt lineage and invalidation state.
7. Evaluate requested-set completeness without inventing missing evidence.
8. Derive item acceptance state and canonical reason codes.
9. Emit EAC24 only for explicitly mapped denominator unit claims.
10. Emit DPC24 preserving accepted/rejected/stale/conflict/unknown facts and gaps.

## M12 integration rule
M12 remains the DoD evaluator. M24 may validate the identities referenced by a DoD criterion and emit a criterion-evidence validation context, but:
- M24 cannot change criterion `required/applicable/status`;
- M24 cannot turn an UNSATISFIED/BLOCKED M12 criterion into SATISFIED;
- M12 `SATISFIED` plus unverified/stale required evidence cannot be promoted by M24 as accepted completion evidence;
- evidence invalidation can make downstream completion claims stale/reopenable, but the actual DoD reevaluation remains with M12/owning governance.

## M21 integration rule
EAC24 is the only M24 projection intended to mint M24-owned evidence acceptance for progress consumption. It must exactly populate the M21 acceptance semantics while preserving M21 as calculation owner. No `earnedWeight`, percentage, denominator or progress status may appear in EAC24.

## M25/M27 boundary
DPC24 carries evidence facts and unresolved gaps. M25 decides proof graph relationships/sufficiency; M27 decides assurance. M24 may report `evidence set COMPLETE` but never `claim proven` or `assurance passed` solely from that completeness state.

## MAX_ASSURANCE dedicated semantic security/integrity pass
Before implementation merge, audit must explicitly inspect:
- trust root/producer authority spoofing;
- evidence self-signing/acceptance loops;
- cross-subject/head/tree splice;
- replay amplification;
- stale evidence resurrection;
- conflicting current evidence;
- invalidation under incomplete dependency knowledge;
- exact-head/provider merge-ref confusion;
- algorithm/domain confusion;
- private/secret evidence leakage;
- truncation/completeness confusion;
- M12/M21/M25/M27 authority bleed;
- independently recomputable receipts/gates/handoffs.

## Required proof families
MAX_ASSURANCE implementation acceptance requires at minimum:
- deterministic/property-style manifest and set permutation tests;
- producer authority and kind matrix tests;
- malicious reseal/tamper fixtures at every digest boundary;
- exact subject/revision mix-and-match fixtures;
- replay/split-brain/supersession/invalidation tests;
- stale runtime/platform/policy/source dependency tests;
- missing/partial/truncated set tests;
- M12 evidence-ref integration tests;
- exact M21 EAC24 compatibility and anti-upgrade tests;
- DPC24 no-proof/no-assurance-authority tests;
- bounded/cancellable large-set/history stress;
- malformed digest/capability/provider failure injection;
- startup-purity tests;
- Ubuntu/Windows/macOS focused matrix;
- full repository regression;
- `npm audit --audit-level=low`;
- Security CodeQL;
- dedicated semantic security/integrity audit on exact head;
- unresolved CRITICAL `0`, HIGH `0`;
- separate Evidence Bundle and MODULE_DONE promotion.

## Invariants
1. No single boolean `valid` may bypass recomputation of material bindings.
2. Missing required evidence never collapses to accepted/complete/proven.
3. Conflict cannot be downgraded to stale/unknown by presentation.
4. EAC24 acceptance requires current exact evidence binding.
5. DPC24 cannot remove rejected/stale/conflict facts that are material to a claim.
6. Validation is order-independent where semantics are set-like and order-preserving where lineage is semantic.
7. All scalable validation traversals are bounded/cancellable with explicit truncation/indeterminate output.
8. No hidden I/O, ambient clock or provider call exists in semantic core.

STOP CONDITION: `M24_S04_FROZEN`.
