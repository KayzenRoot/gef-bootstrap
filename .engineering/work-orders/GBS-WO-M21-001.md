# GBS-WO-M21-001 — Implement Progress Engine

Status: `ADMITTED_READY_FOR_IMPLEMENTATION`
Risk: `HIGH`
Assurance intensity: `HIGH_ASSURANCE`
Module: `GBS-M21 — Progress Engine`
Canonical package: `packages/progress-engine`
Canonical weight: `18`
Planning gate: `.engineering/gates/M21-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#218`
Planning reviewed head: `a2503f885020975907f3cec06cabf474beeacecf`
Planning reviewed tree: `fb1aea33833fa593b37b4848c0d19858b4056849`
Planning semantic audit: `5205201788`
Planning freeze merge: `2b7531c62c438ac9cf8c3382b39621e13be05b8f`
Admission PR: `#219`
Admission reviewed head: `882051eeea5ccc8f4494e680e7992f4018d02f81`
Admission reviewed tree: `50a8677d85fda6efe8fbf254dfe615973989c20b`
Admission semantic audit: `5205215396`
Admission merge / sole legal execution base: `4d037111084d3f119ead388cbb6860b44e5a4071`

## Objective
Implement a deterministic, evidence-bound, reversible Progress Engine that computes exact project/module/area/phase progress from the approved denominator without intuitive credit, double counting, stale-credit retention or downstream ownership leakage.

## Required implementation
Implement all 32 frozen M21 mechanisms:
- PBC21, DIM21, PAB21, CEG21, WCU21, SDB21, EAB21, DMW21;
- WPV21, HPG21, ADCL21, PRE21, PCA21, PPP21, CCW21, PQP21;
- PIV21, CRT21, PDS21, DDG21, SCQ21, CDG21, PSW21, PRR21;
- PSC21, PIR21, PSD21, PCE21, DPMH21, EBH21, SPH21, PSS21.

## Architecture constraints
1. TypeScript/Node, library-first, startup-pure semantic core.
2. No direct filesystem/network/Git/provider/process access in semantic logic.
3. M21 consumes explicit canonical projections and accepted evidence/proof-state bindings; it never decides underlying evidence sufficiency.
4. Canonical progress math uses exact integer/rational numerator/denominator representation, never binary floating point as credit authority.
5. Atomic denominator units are unique; graph aliases/multiple paths cannot duplicate credit.
6. Full module credit requires externally accepted completion/evidence state. Partial credit requires explicit allocated sub-units and accepted binding.
7. Missing required denominator observations cannot be omitted to inflate completion.
8. Optional tracks excluded from the production denominator cannot contribute to its numerator.
9. Invalidated/stale/conflicted credit is retractable/quarantined and contributes zero active earned weight.
10. Legitimate progress decreases are preserved and receipted rather than smoothed away.
11. Denominator changes create a new epoch and require an explicit mutation witness with before/after completion impact.
12. Split-brain/divergent progress states fail closed; no newest-wins policy.
13. M21 does not own ETA (M22), project status (M23), evidence/proof decisions (M24/M25/M27), telemetry (M43), or benchmark baselines (M45).
14. M20/M22/M23 handoffs are read-only, owner-labeled and integrity-bound.
15. Traversals/queries are bounded and cancellable; incomplete dependency knowledge widens invalidation conservatively.
16. Injected SHA-256 only; invalid/failing digest capability fails closed.

## Expected package surface
- `packages/progress-engine/package.json`
- `packages/progress-engine/tsconfig.json`
- `packages/progress-engine/src/types.ts`
- bounded S01-S04 implementation units and `src/public.ts`
- no CLI/rendering/provider ownership.

## HIGH_ASSURANCE proof families
- baseline/denominator/authority construction and tamper tests;
- over-credit, negative weight, duplicate-unit and optional-track contamination attacks;
- partial-credit explicit-allocation tests;
- property-based numerator conservation across randomized legal partitions;
- independent recomputation oracle fixtures;
- hierarchical graph cycle/diamond/alias/double-count attacks;
- exact fraction and presentation-rounding separation tests;
- missing-unit/completeness tests;
- denominator mutation/epoch compatibility and mix-and-match tests;
- selective invalidation, conservative widening and stale-credit quarantine tests;
- retraction transaction tamper/replay/idempotency tests;
- progress split-brain and regression-receipt tests;
- snapshot/integrity receipt independent recomputation;
- M20 delegated metric, M22 baseline and M23 status handoff ownership tests;
- stale snapshot/handoff binding tests;
- cancellation/budget/digest failure/startup purity;
- Ubuntu/Windows/macOS focused matrix;
- full repository regression and dependency audit;
- Security CodeQL when triggered;
- exact-head semantic review with zero unresolved CRITICAL/HIGH.

## Out of scope
Scope/DoD definition, checkpoint promotion, response formatting, ETA estimation, project-status calculation, evidence/proof generation/acceptance, telemetry collection, benchmark generation, Git/provider mutation and operator presentation.

## Evidence and acceptance
Exact admitted base/head/tree; focused and property-test counts; platform matrix; full regression; dependency audit; CodeQL when triggered; independent calculation-oracle evidence; semantic review; zero unresolved CRITICAL/HIGH; implementation merge; separate Evidence Bundle/MODULE_DONE promotion.

## Admission binding
PR #219 passed exact-head semantic review and merged as `4d037111084d3f119ead388cbb6860b44e5a4071`. This Work Order is now admitted. Implementation branches must descend from that admission merge or a reviewed `main` descendant preserving the admitted contract. No production credit is earned by admission.

STOP CONDITION: `GBS_WO_M21_001_ADMITTED_READY_FOR_IMPLEMENTATION`.
