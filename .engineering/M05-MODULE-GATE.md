# GBS-M05 — Transactional Apply Engine Module Gate

Status: `GATE_CANDIDATE`

## Planning evidence
- S01 Transaction Plan: `FROZEN` — PR `#88` — reviewed head `074a5b2bb91bc6848999946146d88028c6a503e2` — merge `f600ee4ffce03c90bf0c2ff9d28cccfd9881f424`
- S02 Dry Run: `FROZEN` — PR `#90` — reviewed head `66d9f83632a90f01ed336f4c9faad29e2681b798` — merge `868e07e5c935f4b1ca44fb81d795d8984a1ba0c3`
- S03 Apply: `FROZEN` — PR `#92` — reviewed head `d2d4836af21354bcfd2fad41eb073a5588c64840` — merge `2834011067ded8bc302dca9c8bb5023c8a04f241`
- S04 Rollback: `FROZEN` — PR `#94` — reviewed head `5a6747ff66e3e13d2fc7410991dbf1564b166857` — merge `742016a1b5542a7a6a3fac632e8cd170cbfe00df`
- S05 Idempotency: `FROZEN` — PR `#96` — reviewed head `3ccbd36059757fda380c1318df2579c56787cddc` — merge `ee5265086c49472408b68f161d66ae2e53b61bf5`
- Canonical checkpoint after S05: `READY_FOR_GBS_M05_MODULE_GATE`

## Gate objective
Determine whether M05 planning is internally complete, compatible with frozen project contracts and sufficiently bounded to compile a production implementation Work Order without pulling M06/M29/M30+/M36 ownership forward.

This gate does **not** award production credit and does **not** mark M05 `MODULE_DONE`.

## Contract synthesis
M05 owns one provider-neutral transactional mutation engine with five coherent surfaces:

1. **Plan** — immutable versioned semantic transaction plan with deterministic `planDigest`, target/pre-state/surface binding, typed intents, security floor, verification/recovery requirements and explicit external saga declarations.
2. **Dry Run** — zero-side-effect state-bound simulation/report that may return READY/NOOP/BLOCKED/CONFLICT/STALE/INDETERMINATE but never authorizes Apply.
3. **Apply** — guarded execution with final revalidation, execution-time authorization, bounded journal/recovery preparation, stage + staged verification, explicit target-visible commit barrier, deterministic promotion, mandatory post-state verification and immutable receipt truth.
4. **Rollback** — bounded managed restoration using exact recovery material and current-state ownership checks, preserving original failed Apply history and preventing rollback from overwriting later work.
5. **Idempotency** — effect-detection-first duplicate/replay/retry policy with mutation auto-retry disabled by default, no blind replay of partial/unknown effects, in-flight duplicate suppression and exact-state-bound prior-result reuse.

## Gate audit result

### Planning completeness
`PASS`.

All five ordered sessions are FROZEN and reviewed at exact immutable heads. No open design question remains inside the M05 ownership boundary.

### Architecture compatibility
`PASS`.

The planning contract implements Architecture A5's `plan → stage → verify → commit/promote → verify → receipt/recovery` envelope without collapsing external provider effects into false filesystem atomicity. It preserves Architecture A6 filesystem/Git/provider separation and keeps business logic out of CLI handlers.

### Requirements coverage
`PASS` at planning level.

M05 directly implements the transaction-engine portion of:
- `REQ-DET-003` inspectable mutation;
- `REQ-DET-004` machine receipts;
- `REQ-DET-006` plan/materialize/state-compare/diff/receipt mechanics;
- `REQ-SEC-004` universal mutation gates;
- `REQ-SEC-005` recoverable managed mutation;
- `REQ-ASSURE-002/003` truthful terminal state and exact-state evidence;
- `REQ-CONT-002` targeted invalidation/state-bound reuse where relevant;
- brownfield mutation safety from `REQ-BROWN-001/002`;
- performance/observability hooks required by `REQ-PERF-002/003` without taking M43/M63 ownership.

### Security compatibility
`PASS` at planning level.

The combined contract preserves:
- S0-S4 class floor and anti-downgrade rules;
- execution-time authorization distinct from capability;
- exact target/pre-state/surface gating;
- recovery capture before destructive managed promotion;
- secret-safe plan/journal/receipt/recovery references;
- no arbitrary shell/callback execution through transaction intents;
- fail-closed stale/conflict/unknown-effect behavior;
- explicit S4 authorization path;
- no destructive Git/history fallback;
- no external-effect false atomicity.

### Lifecycle compatibility
`PASS`.

M05 consumes M01 lifecycle truth rather than inventing a competing process lifecycle. One original invocation has one immutable terminal classification; later/manual recovery uses linked runs; retries create new attempt identity; receipts remain append-only.

### M02/M03/M04 compatibility
`PASS`.

- M02 migrations remain delegated typed transitions with their own preview/apply/version invariants.
- M03 project/repository identity remains authoritative for target binding and continuity; M05 cannot infer identity from path/name.
- M04 preflight/expected-state observations may be reused only while their dependencies remain valid; Apply always revalidates execution-critical state.

### Brownfield compatibility
`PASS`.

M05 plans/apply/rollback/idempotency are bounded to admitted target surfaces. No session authorizes repository-wide normalization, unrelated cleanup or overwrite of later user/tool edits.

## M06 dependency resolution
`PASS WITH EXPLICIT PORT BOUNDARY`.

M05 planning references physical filesystem properties that belong to M06: path containment, symlink/junction/reparse handling, case collisions, safe staging location, permissions, fsync/durability and atomic replace/remove/move primitives.

This is **not** a blocker to M05 logical implementation provided the Work Order enforces:
- M05 implementation lives primarily in `packages/kernel` plus shared persisted/interchange contracts in `packages/contracts` when required;
- all M06-owned physical behavior enters through explicit injected ports/capabilities;
- production code has no unsafe fallback that bypasses a missing M06 capability;
- when a required physical guarantee is unavailable, M05 returns a typed blocked/gap state;
- deterministic fake/in-memory adapters may prove M05 orchestration semantics without claiming production filesystem safety;
- M06 later implements/conforms the real physical adapters and integration proof.

Therefore M05 can reach MODULE_DONE for its provider-neutral logical transaction engine before M06, while the complete product remains unable to claim full physical mutation safety until M06 and later integration gates pass.

## Proposed implementation placement
`PASS`.

Use the existing architectural package rather than inventing another top-level product package:

```text
packages/kernel/src/
  transaction-plan.ts
  transaction-dry-run.ts
  transaction-apply.ts
  transaction-rollback.ts
  transaction-idempotency.ts
  transaction-types.ts
  transaction-ports.ts
  transaction-receipts.ts
```

Exact filenames may be refined by the implementation if a smaller coherent surface is better, but the code remains in `packages/kernel` unless concrete dependency analysis proves otherwise.

Persisted/interchanged JSON contracts/receipts that cross package/process/public API boundaries must follow Architecture A8 and belong in/version against `packages/contracts` as appropriate.

## Implementation surface allowed by the gate
The Work Order may implement:
- canonical transaction plan validation/canonicalization/digest;
- typed logical intent model and deterministic dependency/conflict validation;
- dry-run orchestration/report digest;
- transaction/journal state machine interfaces;
- pre-state/authorization/recovery/staging/commit/post-verify orchestration through ports;
- rollback effect/restoration decision engine through ports;
- idempotency/effect-state/retry decision engine;
- compact machine receipts and exact-state bindings;
- deterministic test fakes/adapters needed to prove the engine;
- minimal public exports from kernel/application boundaries required by existing architecture.

## Explicitly forbidden implementation expansion
The M05 Work Order MUST NOT implement:
- real filesystem containment/symlink/atomic-replace engine (M06);
- template rendering engine (M07);
- project profile system (M08);
- project adoption/normalization (M13);
- checkpoint/resume/registry persistence (M17-M19);
- evidence/proof graph/test-impact systems (M24-M28);
- local Git mutation commands (M29);
- GitHub/provider mutation APIs (M30-M33);
- full security/recovery/integrity platforms (M34-M37);
- generic capability registry (M38);
- telemetry/audit/benchmark storage (M43-M45/M57/M63);
- background daemon/scheduler for retries or orphan recovery;
- Codex execution for Bootstrap construction.

## Required implementation proof
Because M05 changes transaction/recovery semantics, proof must be stronger than a normal low-risk unit change.

The implementation Work Order must require at least:
- strict TypeScript build/typecheck;
- locked dependency installation and vulnerability audit;
- focused M05 unit tests for every state/outcome family;
- integration tests against deterministic transaction/recovery/state ports;
- interruption/failure injection at each logical Apply phase, especially before/after commit barrier;
- rollback create/update/delete/move anti-clobber tests;
- partial/unknown-effect and retry-denial tests;
- duplicate/in-flight/idempotency tests proving no double effect;
- secret-safe receipt/journal tests;
- brownfield bounded-surface tests;
- M02/M03 delegated transition compatibility tests;
- exact-head CI evidence;
- semantic review of the implementation diff;
- no unresolved HIGH/CRITICAL security/integrity finding.

Physical OS-specific path/symlink/atomic-replace proof remains M06-owned, but M05 must prove it blocks/delegates correctly when those guarantees are absent.

## Assurance/test selection
The Test & Benchmark Plan marks transaction/recovery semantics as a broad-validation trigger when impact is broad. Therefore the M05 implementation gate must not rely only on a tiny focused test set.

At minimum the accepted implementation head must run the repository's full currently applicable deterministic validation plus focused M05 failure/interruption/recovery suites. Any changed shared contract that broadens dependency impact expands validation accordingly.

## Performance contract
`PASS` at planning level.

M05 is explicitly structured to reduce repeated executor work:
- deterministic plan digests;
- bounded target/dependency scopes;
- dry-run and exact-state reuse while valid;
- cheap blockers before staging;
- dependency-ordered/concurrent independent preparation where safe;
- journaled effect boundaries for narrow recovery;
- no-op/already-applied/in-flight duplicate short-circuits;
- effect detection rather than whole-workflow replay.

Quantitative latency/token thresholds remain M63-owned and are not invented here.

## Ownership result
`PASS`.

M05 owns provider-neutral logical transaction semantics. M06 owns real filesystem safety primitives. M29 owns Git mutation. M30+ own hosted-provider mutation. M36 owns broader durable recovery/resume/orphan workflows. M37 owns global integrity policy. M43/M44 own telemetry/audit storage. M63 owns executor-performance thresholds.

## Gate verdict
- Planning completeness: `PASS`
- Architecture/Requirements/Security compatibility: `PASS`
- Neighbor ownership: `PASS`
- Required proof specification: `PASS`
- Known planning HIGH/CRITICAL findings: `NONE`
- Implementation completeness: `NOT_STARTED`
- Production evidence: `NOT_STARTED`
- M05 production weight earned: `0 / 20`
- Gate candidate verdict: `PLANNED_READY_FOR_IMPLEMENTATION`

## Progress truth
- Production denominator: `1088`
- Earned: `87`
- Remaining: `1001`
- Official completion: `8.00%`
- Official remaining: `92.00%`
- M05 weight: `20`
- M05 earned: `0`
- Potential after approved M05 MODULE_DONE: `107 / 1088 = 9.83%`
- Denominator changed: `NO`

## Next-stage rule
If this gate receives exact-head semantic approval and merge, the canonical checkpoint may authorize compilation/admission of exactly one bounded M05 implementation Work Order. Gate approval alone does not authorize implementation before that Work Order is merged/admitted.

Codex remains prohibited for Bootstrap construction unless a separate governed benchmark exception/ADR is explicitly admitted.

STOP CONDITION: `M05_MODULE_GATE_READY_FOR_EXACT_HEAD_REVIEW`.
