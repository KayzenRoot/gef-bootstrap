# GBS-WO-M20-001 — Implement Response Contract

Status: `ADMISSION_CANDIDATE`
Risk: `MEDIUM`
Assurance intensity: `STANDARD_PLUS`
Module: `GBS-M20 — Response Contract`
Canonical package: `packages/response-contract`
Canonical weight: `13`
Planning gate: `.engineering/gates/M20-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#213`
Planning freeze merge: `2c65f7cd1bd4f9015878acbe449118d9a873a88f`
Admission PR: `#214`

## Objective
Implement a deterministic, authority-bounded response contract that projects current governed truth to machine and human consumers without manufacturing source authority, progress, ETA, project status, confidence, evidence or success.

## Required implementation
Implement all 25 frozen M20 mechanisms:
- RCC20, RAB20, RSE20, SBFC20, RPI20;
- DMC20, MOM20, BAW20, CE20, UMA20;
- RVA20, BPS20, NNAC20, CPL20, SCW20;
- MSR20, SDM20, SFO20, RRB20, RSG20;
- MRE20, HRP20, RIR20, RCG20, SRS20.

## Architecture constraints
1. TypeScript/Node, library-first, deterministic pure functions where possible.
2. No direct filesystem/network/Git/provider/process access in semantic core.
3. Response inputs are explicit injected verified projections; conversation memory alone is never authority.
4. M20 may project progress/ETA/status metrics only as delegated owner-bound claims; it must not calculate them.
5. Missing baselines produce typed `NOT_YET_BASELINED` or equivalent, never guessed numeric/date values.
6. Recovery/conflict/blocking conditions outrank generic success.
7. Next necessary action is canonical/singular when known and cannot be replaced by model preference.
8. Compactness/dedup cannot erase mandatory truth or distinct authority/conflict semantics.
9. Portable/public response projections exclude secret-like values and private locator material.
10. Human projection cannot introduce material claims absent from verified machine semantics.
11. Stale source/checkpoint/resume/registry/delegated-claim bindings block response emission/reuse.
12. Unsupported schema/profile/capability returns typed incompatibility rather than semantic guessing.
13. Deterministic injected SHA-256 only; no fallback hash.
14. Bounded/cancellable operations where work can scale; startup-pure imports and ordinary semantic APIs.

## Expected package surface
- `packages/response-contract/package.json`
- `packages/response-contract/tsconfig.json`
- `packages/response-contract/src/types.ts`
- bounded S01-S05 implementation units and `src/public.ts`
- no direct CLI, rendering-channel or artifact-generation ownership.

## Required proof families
- response envelope construction/verification and authority-boundary tests;
- source-bound claim and provenance-index tamper tests;
- delegated metric ownership/baseline/confidence/no-fabrication tests;
- unavailable metric algebra tests;
- verdict precedence, blockers, next action and source-conflict tests;
- minimum-sufficient response, semantic dedup and mandatory-field retention tests;
- stable ordering and permutation determinism;
- redaction/secret/private-path and size-guard tests;
- machine/human semantic equivalence and extra-claim rejection;
- integrity receipt, compatibility and stale-response tests;
- M17/M18/M19 handoff binding/mix-and-match tests;
- cancellation/digest failure/startup-purity tests;
- Ubuntu/Windows/macOS focused matrix;
- full repository regression and dependency audit.

## Out of scope
Progress calculation, ETA estimation, project-status computation, evidence/proof generation, telemetry collection, artifact generation, operator presentation styling, Git/provider mutation and generic policy ownership.

## Evidence and acceptance
Exact admitted base/head/tree, focused test count, platform matrix, full regression count, dependency audit, Security CodeQL when triggered, semantic review, zero unresolved CRITICAL/HIGH, implementation merge and separate Evidence Bundle/MODULE_DONE promotion.

## Admission rule
PR #214 is the admission candidate. It grants no execution authority until exact-head audit succeeds, #214 merges, and a post-merge binding records the real admission merge SHA as the sole legal M20 execution base. Only that binding may change this status to `ADMITTED_READY_FOR_IMPLEMENTATION`.

STOP CONDITION: `GBS_WO_M20_001_ADMISSION_CANDIDATE`.
