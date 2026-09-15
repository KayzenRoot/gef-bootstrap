# GBS-WO-M25-001 — Implement Proof Graph

Status: `IMPLEMENTED_PENDING_EXACT_HEAD_AUDIT`
Risk: `HIGH`
Assurance intensity: `MAX_ASSURANCE`
Module: `GBS-M25 — Proof Graph`
Canonical package: `packages/proof-graph`
Canonical weight: `20`
Planning gate: `.engineering/gates/M25-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#239`
Planning reviewed head: `db89e6a021cfc46cf89c62a1f8db36dc78baaf8b`
Planning reviewed tree: `22c5d75b4a880d2d2bfdd2d518ea8e197854cdc9`
Planning review: `5213821206`
Planning merge: `70fbfafa71e20e684ab9dbe740aede772d4cbe02`
Admission PR: `#240`
Admission reviewed head: `001353587f8784d70502ef80cef3af686980a26a`
Admission reviewed tree: `f55f178361b4a584e1ee2281c5db193dcd9cb117`
Admission review: `5213839166`
Admission merge / admitted execution base: `2a9eba4ca11cec9463cb501ec7f64b26f1d96825`
Admission binding PR: `#241`
Admission binding merge: `e00aa192902cd93323121357ecc6308c573c21be`
Implementation PR: `#242`
Correction delta: `.engineering/evidence/GBS-WO-M25-001-CORRECTION-DELTA.md`

## OBJECTIVE
Implement the deterministic provider-neutral proof graph frozen in M25 S01-S05. It evaluates owner-declared proof obligations from current M24 evidence facts and nested proof dependencies, preserves exact proof states, supports validity-bound carry-forward, selectively invalidates affected proof descendants and emits read-only downstream context.

## REQUIRED IMPLEMENTATION
All 42 frozen mechanisms:
- S01: PIC25, PAB25, CCI25, PNI25, PEI25, POD25, PNS25, PIM25;
- S02: PDG25, DAG25, SER25, ESG25, CSG25, PRC25, ADC25, DCW25;
- S03: EVF25, OBF25, DCF25, PSF25, VCG25, PFW25, FCW25, FIR25;
- S04: PCG25, PCK25, CFC25, CFD25, CFW25, PCS25, SAR25, CFR25;
- S05: CIG25, PIV25, TIS25, UDW25, RCP25, PSC25, PIR25, PRG25, PSW25, DPH25.

## CORE CONTRACTS
Proof states are `PROVEN | UNPROVEN | STALE | CONFLICT | INDETERMINATE | TRUNCATED`. Canonical claim meaning/ownership remains upstream. M24 evidence validity remains authoritative and is consumed through recomputable provenance. Sufficiency expressions remain owner-declared `ALL | ANY | AT_LEAST`. Replay cannot add support. Cycles and namespace divergence fail closed. Full carry-forward is validity/source-authority bound; partial reuse forces affected ancestor recomputation. Invalidation is targeted only with complete knowledge and otherwise widens. Snapshot/history are independently recomputable. DPH25 has no DoD/progress/status/checkpoint/assurance authority. Core semantics remain deterministic, startup-pure, bounded/cancellable and use injected domain-separated SHA-256.

## IMPLEMENTATION STATE
- package/workspace/lockfile wiring complete;
- 42/42 mechanism registry complete;
- M24 provenance recomputation implemented;
- graph/sufficiency/fingerprint/carry-forward/invalidation/snapshot/history/handoff implemented;
- source-authority drift bound into evaluation, snapshot and carry-forward compatibility;
- focused test matrix and full regression implemented;
- first CI type error and carry-forward source-authority HIGH finding are closed in the Correction Delta.

## REQUIRED FINAL EVIDENCE
Before merge the exact final head must pass focused Ubuntu/Windows/macOS tests, full repository regression, `npm audit --audit-level=low`, Security CodeQL and dedicated MAX_ASSURANCE semantic/integrity review with unresolved CRITICAL `0` and HIGH `0`.

## CREDIT RULE
Implementation/audit work grants no production credit. M25 remains `0 / 20`; production remains `432 / 1088 = 39.71%` until approved implementation merge and separate Evidence Bundle + MODULE_DONE promotion.

STOP CONDITION: `GBS_WO_M25_001_IMPLEMENTED_PENDING_EXACT_HEAD_AUDIT`.
