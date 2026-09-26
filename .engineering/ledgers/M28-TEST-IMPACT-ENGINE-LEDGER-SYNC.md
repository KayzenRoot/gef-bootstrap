# M28 Test Impact Engine — Ledger Sync

Status: `FROZEN`
Module: `GBS-M28 — Test Impact Engine`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Source synchronization
M28 planning is reconciled with current Checkpoint, Source Hierarchy, Scope/Architecture ownership, M24 evidence authority, M25 proof authority, M26 HEDS authority, M27 assurance authority, future M29 Git authority, M32 CI authority, M53-M58 validation framework/test owners, M63 executor-performance ownership, ADR-0002 and the Executor Acceleration Technology Sync.

No denominator change is introduced. Planning grants no production credit.

## Technology synchronization
The owner-directed candidates are reconciled as follows:
- `TECH-0055 — Test Proof Reuse Receipt (TPRR)` is adopted as TPR28 + TRV28 + RUG28. M24 remains evidence-acceptance owner and M25 proof owner.
- `TECH-0056 — Progressive Validation Ladder (PVL)` is adopted as PVL28 + RRE28. M27 retains assurance-floor/final-verdict authority.
- `TECH-0057 — Failure-Scoped Retest Loop (FSRL)` is adopted as FFI28 + FSR28. M28 selects the retest obligation; M63 may schedule it.
- `TECH-0058 — Exact-Head Full Sweep Gate (EHFG)` is shared with M27/M32 and adopted on the M28 side as EH28. M27 decides whether L5 is required, M28 supplies the concrete exact-candidate set, M32 executes it. Before M29, identity remains provider-neutral; future Git head/tree is additive owner-authorized context.
- `TECH-0059 — Validation Wave Scheduler (VWS)` is split by authority: M28 owns VCE28/VWS28 wave constraints/specification; M63 owns scheduling/concurrency/critical-path optimization; M32 owns CI execution.

No technology candidate authorizes selective validation when graph/proof knowledge is insufficient.

## Frozen mechanisms
- S01: TIC28, SFP28, TFP28, STM28, TDM28, PRC28, DKC28, TMG28.
- S02: AHG28, ICD28, TSP28, TPR28, TRV28, RUG28, FFI28, TSR28.
- S03: PVL28, RRE28, FSR28, BIP28, RWE28, VCE28, CTG28, VPR28.
- S04: UCL28, UEW28, DTS28, XCG28, EH28, VWS28, TIR28, TIH28.

Total: `32` mechanisms.

## Ownership synchronization
- source owners retain source/contract truth;
- M24 retains evidence validation/acceptance;
- M25 retains proof sufficiency/carry-forward/invalidation;
- M26 retains semantic delta review/findings;
- M27 retains assurance taxonomy/floor/requirements/final verdict;
- M28 owns test identity, source/test map, concrete impact/selection, compatible proof-reuse receipts, regression radius, uncertainty widening and test-impact handoff;
- M29 retains Git semantics;
- M32 retains CI execution/orchestration;
- M53-M58 retain their framework/harness/security-test implementation ownership;
- M63 retains scheduling/concurrency/critical-path optimization;
- M17/M21/M23 retain checkpoint/progress/status;
- M33/M62 retain release/final production acceptance.

## Frozen validation ladder
`L0 STRUCTURAL_STATIC < L1 DIRECT < L2 IMPACTED_CLOSURE < L3 BOUNDARY < L4 RISK_EXPANSION < L5 EXACT_CANDIDATE_ASSURANCE`.

A lower-level PASS never implies a higher-level PASS. Reuse never manufactures evidence. Unknown/conflicting/truncated dependency knowledge cannot reduce the radius.

## Implementation seed map
Planned canonical package: `packages/test-impact-engine`.

Planned bounded files:
- `packages/test-impact-engine/package.json`
- `packages/test-impact-engine/tsconfig.json`
- `packages/test-impact-engine/src/types.ts`
- `packages/test-impact-engine/src/utils.ts`
- `packages/test-impact-engine/src/registry.ts`
- `packages/test-impact-engine/src/s01-source-test-map.ts`
- `packages/test-impact-engine/src/s02-selection-reuse.ts`
- `packages/test-impact-engine/src/s03-regression-radius.ts`
- `packages/test-impact-engine/src/s04-uncertainty-handoff.ts`
- `packages/test-impact-engine/src/public.ts`
- `tests/m28-test-impact-engine.test.mjs`
- `tests/m28-hardening.test.mjs`
- `tests/m28-startup-purity.test.mjs`
- `.github/workflows/m28-platform.yml`
- workspace package/build/typecheck metadata only as required for registration.

This is a planning seed only. No source file is created before implementation admission.

## Engineering rules
Canonical ordering; stable test IDs; explicit mapping provenance; owner-authorized source fingerprints; current test/config/fixture/toolchain/runtime/platform binding; fail-closed TPRR reuse; current failure dominates old green proof; monotonic impact/radius widening; no caller budget downgrade; bounded/cancellable graph traversal; injected domain-separated SHA-256; startup-pure semantic core; no ambient filesystem/network/Git/clock; exact-candidate handoff is immutable and independently recomputable; downstream handoff is read-only and authority-denying.

## Production accounting
- denominator: `1088` unchanged;
- earned before M28: `491`;
- M28 planning credit: `0 / 20`;
- production remains `491 / 1088 = 45.13%` until evidence-bound MODULE_DONE promotion.

STOP CONDITION: `M28_LEDGER_SYNC_FROZEN`.