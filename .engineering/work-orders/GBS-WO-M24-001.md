# GBS-WO-M24-001 — Implement Evidence Engine

Status: `COMPILED_NOT_ADMITTED`
Risk: `HIGH`
Assurance intensity: `MAX_ASSURANCE`
Module: `GBS-M24 — Evidence Engine`
Canonical package: `packages/evidence-engine`
Canonical weight: `20`
Planning gate: `.engineering/gates/M24-PLANNING-GATE.md` (`PASSED`)

## OBJECTIVE
Implement the provider-neutral Evidence Engine frozen in M24 S01-S04. The engine must validate machine evidence against exact producer authority, exact governed subject state and current validity dependencies; emit immutable evidence receipts; preserve stale/conflict/invalidation truth; provide an exact M21 acceptance handoff; and provide evidence context to future proof/assurance modules without assuming their authority.

## CONTEXT
M23 is MODULE_DONE. Production remains `412 / 1088 = 37.87%`. M12 currently verifies that required SATISFIED DoD criteria contain evidence references but does not validate the evidence objects themselves. M21 already reserves `M24_EVIDENCE` as an accepted external evidence owner for progress eligibility. M25/M27 remain future proof/assurance owners.

## REQUIRED IMPLEMENTATION
All 32 frozen mechanisms:
- S01: EIC24, EAB24, MEM24, SAI24, SSB24, ECM24, EBL24, EPM24;
- S02: EVR24, EAR24, ERR24, ESR24, ECR24, ERS24, RPG24, EIR24;
- S03: ESD24, XSB24, XRB24, DAB24, MSW24, PCE24, BIC24, CBB24;
- S04: EVG24, EFG24, ECG24, OAG24, DID24, SBW24, EAC24, DPC24.

## REQUIRED CONTRACTS
1. Machine evidence items have stable IDs, explicit kind, producer authority, exact subject binding, source/attestation identity, validity binding, claim mapping and semantic digest.
2. Producer owner strings alone are never authority; SAI24 must authorize producer + evidence kind/scope.
3. M24 cannot accept its own synthetic acceptance as independent underlying evidence.
4. MEM24 is deterministic under semantically equivalent ordering and rejects divergent duplicate IDs.
5. EPM24 blocks raw secret/private-path/unbounded-log material from portable evidence semantics.
6. Receipts are immutable and independently recomputable.
7. Acceptance state is exactly `ACCEPTED | REJECTED | STALE | CONFLICT | UNKNOWN`.
8. Receipt replay is idempotent/visible and cannot amplify evidence independence.
9. Invalidation is targeted when dependency knowledge is complete and conservatively widened when incomplete.
10. Semantic identities use injected domain-separated SHA-256; external object IDs remain typed opaque identities.
11. Exact-head evidence binds exact governed source head/tree relationship where applicable; merge-ref/provider execution identities do not silently substitute source identity.
12. Cross-project/lineage/revision/runtime/platform/policy reuse requires exact match or explicit owning compatibility witness.
13. Mix-and-match/splice attacks fail closed even when individual fragments verify separately.
14. EVG24 recomputes evidence validity from exact current authority/subject/dependency inputs.
15. Freshness is exactly `CURRENT | STALE | CONFLICT | INDETERMINATE` and dependency/state based.
16. Set completeness is exactly `COMPLETE | PARTIAL | CONFLICT | INDETERMINATE | TRUNCATED` and never implies proof/assurance.
17. EAC24 projects only M21-compatible M24-owned evidence acceptance and never weight/percentage/denominator/progress.
18. DPC24 preserves accepted/rejected/stale/conflict/unknown evidence facts and unresolved gaps while explicitly denying proof/assurance authority.
19. M12 criterion state remains read-only; M24 validates evidence refs but cannot rewrite DoD semantics.
20. All scalable traversals are bounded/cancellable with explicit incomplete/truncated state.
21. Semantic core is startup-pure with no ambient filesystem/network/process/provider/clock access.

## MAX_ASSURANCE THREAT / FAILURE MODEL
Implementation must explicitly defend against producer spoofing, evidence-kind escalation, forged/resealed payloads, cross-subject/head/tree splice, replay amplification, stale evidence resurrection, duplicate-ID split brain, invalidation narrowing under incomplete knowledge, digest-domain/algorithm confusion, exact-head/merge-ref confusion, self-attestation loops, raw secret/private-path leakage, truncation presented as completeness, authority bleed into M12/M21/M25/M27, malformed digest/provider capability and cancellation/budget failure.

## REQUIRED EVIDENCE / TESTS
- all 32 mechanism IDs represented and mapped to frozen sessions;
- deterministic/property-style manifest and evidence-set tests;
- producer authority/kind matrix including unknown/spoofed owners;
- malicious reseal/tamper fixtures at every material digest/receipt boundary;
- exact project/lineage/work-order/module/head/tree/runtime/platform/policy mix tests;
- provider merge-ref versus intended source-head tests;
- replay/split-brain/invalidation/stale resurrection tests;
- incomplete dependency conservative-widening tests;
- privacy membrane secret/private path/log tests;
- M12 integration without criterion-authority bleed;
- M21 EAC24 exact compatibility and anti-weight/anti-progress tests;
- DPC24 no-proof/no-assurance-authority tests;
- bounded/cancellable stress with explicit truncation;
- malformed digest/provider/capability failure injection;
- startup-purity test;
- focused Ubuntu/Windows/macOS CI;
- full repository regression;
- `npm audit --audit-level=low`;
- Security CodeQL;
- dedicated exact-head semantic security/integrity review;
- unresolved CRITICAL `0`, HIGH `0`.

## ADMISSION RULE
This Work Order grants no implementation authority while `COMPILED_NOT_ADMITTED`. Implementation is legal only after the M24 planning PR passes exact-head semantic audit, merges, a separate admission PR passes audit/merges, and a post-merge binding records the admission merge SHA as the sole legal execution base.

## CREDIT RULE
M24 remains `0 / 20` until implementation is merged from exact approved evidence and a separate Evidence Bundle/MODULE_DONE promotion passes. Planning/admission/PR count earns no production credit.

STOP CONDITION: `GBS_WO_M24_001_COMPILED_NOT_ADMITTED`.
