# GBS-WO-M26-001 — Implement HEDS Delta Review

Status: `ADMITTED_READY_FOR_IMPLEMENTATION`
Risk: `HIGH`
Assurance intensity: `HIGH_ASSURANCE`
Module: `GBS-M26 — HEDS Delta Review`
Canonical package: `packages/heds-delta-review`
Canonical weight: `19`
Planning gate: `.engineering/gates/M26-PLANNING-GATE.md` (`PASSED`)
Ledger sync: `.engineering/ledgers/M26-HEDS-DELTA-REVIEW-LEDGER-SYNC.md` (`FROZEN`)
Planning freeze PR: `#244`
Planning reviewed head: `e213e4e5a6c69a4d1fdf2c1a3e7914e5bcd47add`
Planning reviewed tree: `c3e86b22595b8f4e22baa4a645c406add4a5e1a7`
Planning review: `5220920658`
Planning merge: `633d840b0bf1f088e1e3d6bd12050c17e4a95228`
Admission PR: `#245`
Admission reviewed head: `699e55ba814c14f4dcce8754c40c10da3b82c3ae`
Admission reviewed tree: `b77ea8d41677cd5613aa07000561328d76b040c2`
Admission review: `5220933933`
Admission merge / execution base: `0d00209728c63f501c1d2e940e69e0c57ec7585d`

## OBJECTIVE
Implement the deterministic provider-neutral HEDS semantic delta-review engine frozen in M26 S01-S05. It compares exact canonical baseline/candidate semantic projections, validates source/proof context, narrows review to changed or invalidated semantic closure, records immutable findings and gates, and emits an independently recomputable HEDS verdict plus read-only downstream handoff.

## REQUIRED IMPLEMENTATION
All `40` frozen mechanisms:
- S01: HIC26, HAB26, BSI26, CSI26, RSP26, SDL26, DCI26, XLG26;
- S02: SCM26, SBG26, ACG26, DPG26, PBG26, VCG26, SGW26, MMW26;
- S03: SDM26, IFP26, ORF26, RCI26, RCF26, SFC26, SFS26, DTR26;
- S04: BCG26, SCG26, PIG26, FCG26, ZHG26, AAG26, BMG26, VAG26;
- S05: HVC26, HIR26, HSD26, HFR26, HTR26, HRG26, HSW26, DHH26.

## CORE CONTRACTS
HEDS compares canonical semantic projections rather than arbitrary text. Baseline/candidate/project/lineage/source identity is exact and fail-closed. Semantic classes are `ADDED | REMOVED | MODIFIED | UNCHANGED`, with authority/binding deltas preserved. M25 `DPH25` is current proof context for `M26_DELTA_REVIEW`; M26 never mutates proof. Incomplete source/dependency knowledge widens review. Review carry-forward requires current semantic/source/proof/policy compatibility. Findings preserve exact severity/state and resolution lineage. Final verdicts are `APPROVED | CORRECTION_REQUIRED | BLOCKED | INDETERMINATE | TRUNCATED`; zero CRITICAL/HIGH is necessary but not sufficient. Verdict/history are independently recomputable, and DHH26 grants no assurance/test-selection/checkpoint/progress/status authority.

## OUT OF SCOPE
Raw Git/provider diff belongs to M29; evidence validity to M24; proof decisions to M25; assurance to M27; test impact/selection to M28; checkpoint to M17; progress/status to M21/M23; durable audit storage to M44.

## REQUIRED EVIDENCE
Implementation acceptance requires registry `40/40`, deterministic identity/delta behavior, source/lineage/owner attacks, coverage widening, exact M25 handoff verification, nested/diamond impact closure, review carry-forward invalidation, finding lineage/disappearance attacks, all gates/verdicts, independent integrity recomputation, replay/split-brain/regression/truncation, M27/M28 authority-denial, property/permutation tests where useful, cancellation/bounds, startup purity, focused Ubuntu/Windows/macOS CI, full regression, `npm audit --audit-level=low`, Security CodeQL when triggered and exact-head HIGH_ASSURANCE semantic/integrity review with CRITICAL `0`, HIGH `0`.

## EXECUTION BASE
The admitted implementation base is `0d00209728c63f501c1d2e940e69e0c57ec7585d`. Implementation branches must descend from this merge or a reviewed main descendant preserving the admitted contract.

## CREDIT RULE
Admission grants execution authority only. M26 remains `0 / 19`; production remains `452 / 1088 = 41.54%` until implementation is merged from approved evidence and separately promoted MODULE_DONE.

STOP CONDITION: `GBS_WO_M26_001_ADMITTED_READY_FOR_IMPLEMENTATION`.
