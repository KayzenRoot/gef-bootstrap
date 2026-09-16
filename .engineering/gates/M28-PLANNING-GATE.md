# M28 Planning Gate

Status: `PASSED`
Module: `GBS-M28 — Test Impact Engine`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`
Planning sessions: `4`
Frozen mechanisms: `32`

## Source check
Reviewed before freeze:
- `.engineering/CHECKPOINT.md` / `.engineering/CHECKPOINT.json`;
- `.engineering/SOURCE-HIERARCHY.md`;
- `.engineering/DECISIONS-LEDGER.md`;
- `.engineering/decisions/ADR-0002-PLANNING-TO-EXECUTION-ACCELERATION.md`;
- `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md`;
- `.engineering/ledgers/EXECUTOR-ACCELERATION-TECHNOLOGY-SYNC.md`;
- M24/M25/M26 ownership boundaries;
- M27 frozen planning, implementation public contracts and DAH27 boundary;
- M28 S01-S04 owner-directed seed files;
- future M29/M32/M53-M58/M63 ownership boundaries.

## Gate results
- [x] M28 scope is bounded to test identity/map, impact/selection, compatible reuse receipts, regression radius, uncertainty widening and read-only test-impact handoff.
- [x] Concrete test selection is owned by M28; assurance class/final verdict remains M27-owned.
- [x] Evidence acceptance remains M24-owned; proof sufficiency remains M25-owned; HEDS remains M26-owned.
- [x] Git semantics remain M29-owned; CI execution/orchestration remains M32-owned.
- [x] Scheduling/concurrency/critical-path optimization remains M63-owned; M28 only specifies safe wave constraints.
- [x] TECH-0055..TECH-0059 are reconciled without duplicate authority.
- [x] TPRR reuse is fail-closed and cannot manufacture a PASS.
- [x] Current failure dominates older green proof.
- [x] Unknown/conflicting/truncated graph knowledge widens validation.
- [x] Progressive Validation Ladder is monotonic L0-L5.
- [x] Exact-candidate L5 is preserved; intermediate reuse cannot replace required final-candidate evidence.
- [x] Provider-neutral candidate identity is preserved before M29.
- [x] Platform/config/fixture/runtime/toolchain drift invalidation is explicit.
- [x] Cross-project/cross-lineage/cross-policy receipt splicing is blocked.
- [x] Graph traversal is deterministic, bounded and cancellable.
- [x] Digest contract is injected domain-separated SHA-256 and fails closed.
- [x] Startup-pure semantic core is required.
- [x] Implementation topology is bounded and precompiled.
- [x] Brownfield behavior preserves existing tests/conventions and represents unknown discovery explicitly.
- [x] Required adversarial/property tests are frozen across all four sessions.
- [x] No denominator/progress credit is created by planning.

## Required implementation evidence
Implementation acceptance must prove at least:
- registry `32 / 32`;
- deterministic/permutation-invariant map and impact results;
- source/test/config/fixture/runtime/toolchain/platform drift invalidation;
- missing/partial/conflicting graph widening;
- stale/forged/cross-context TPRR denial;
- accepted compatible TPRR reuse;
- current failure invalidates older green reuse;
- PVL L0-L5 monotonicity and assurance-floor preservation;
- failure-scoped retest behavior without suppressing broader mandatory levels;
- dynamic test surface detection;
- exact-candidate mutation invalidation;
- VWS28 no-obligation-loss and downstream authority denial;
- bounded/cancellable oversized graph behavior;
- injected digest failure behavior;
- startup purity;
- focused Ubuntu/Windows/macOS CI;
- full repository regression;
- dependency/security audit and CodeQL when applicable;
- exact-head MAX_ASSURANCE semantic/integrity audit with unresolved CRITICAL/HIGH equal to zero;
- separate MODULE_DONE promotion.

## Planning verdict
`PASSED`.

Planning is frozen but grants no implementation authority until a compiled Work Order is separately audited/merged and admission is separately audited/merged against an exact execution base.

STOP CONDITION: `M28_PLANNING_GATE_PASSED`.