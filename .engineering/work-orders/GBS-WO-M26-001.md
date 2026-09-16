# GBS-WO-M26-001 — Implement HEDS Delta Review

Status: `COMPILED_NOT_ADMITTED`
Risk: `HIGH`
Assurance intensity: `HIGH_ASSURANCE`
Module: `GBS-M26 — HEDS Delta Review`
Canonical package: `packages/heds-delta-review`
Canonical weight: `19`
Planning gate: `.engineering/gates/M26-PLANNING-GATE.md` (`PASSED`)
Ledger sync: `.engineering/ledgers/M26-HEDS-DELTA-REVIEW-LEDGER-SYNC.md` (`FROZEN`)
Planning freeze PR: `#244`

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
- HEDS compares canonical semantic projections, not arbitrary text diffs;
- baseline/candidate/project/lineage/source ownership is exact and fail-closed;
- semantic change classes are `ADDED | REMOVED | MODIFIED | UNCHANGED` with authority/binding deltas preserved explicitly;
- formatting/provider transport noise is non-semantic unless an owner declares otherwise;
- M25 `DPH25` is accepted only as current proof context for `M26_DELTA_REVIEW`; M26 never mutates proof state;
- incomplete source/dependency knowledge widens review scope rather than narrowing it;
- review carry-forward requires exact current semantic/source/proof/policy compatibility;
- finding severity is `CRITICAL | HIGH | MEDIUM | LOW | INFO`; finding state is `OPEN | RESOLVED | SUPERSEDED | INDETERMINATE`;
- open/indeterminate CRITICAL or HIGH findings prohibit HEDS approval;
- final verdicts are `APPROVED | CORRECTION_REQUIRED | BLOCKED | INDETERMINATE | TRUNCATED`;
- zero CRITICAL/HIGH is necessary but not sufficient for approval;
- verdict/history are independently recomputable; replay, split-brain and truncation stay visible;
- DHH26 may inform M27/M28/Governance but grants M26 no assurance, test-selection, checkpoint, progress or project-status authority;
- semantic core is deterministic, startup-pure, bounded/cancellable and uses injected domain-separated SHA-256.

## OUT OF SCOPE
- raw Git diff/provider operations: M29;
- evidence acceptance/validity: M24;
- proof sufficiency/carry-forward/invalidation decisions: M25;
- assurance verdict: M27;
- test impact and test selection: M28;
- checkpoint promotion: M17;
- progress/status mutation: M21/M23;
- durable audit persistence: M44.

## REQUIRED EVIDENCE
Implementation acceptance requires:
- registry coverage `40/40` with unique mechanism IDs;
- deterministic baseline/candidate/source identity and semantic delta behavior;
- baseline/candidate reversal, owner spoofing, cross-lineage and mix-and-match attacks;
- complete/partial source-coverage behavior and conservative widening;
- exact M25 `DPH25` verification and stale/tampered handoff rejection;
- nested/diamond impact closure and semantic de-duplication;
- exact review carry-forward plus stale/authority/proof-policy invalidation;
- finding creation, severity, resolution/supersession lineage and silent-disappearance attacks;
- every S04 gate and every HEDS verdict state;
- independent verdict/integrity recomputation and label tamper rejection;
- replay/idempotency, split-brain, verdict regression and explicit bounded-history truncation;
- DHH26 owner/consumer and authority-denial tests for M27/M28;
- property/permutation tests where useful;
- cancellation and one-over-budget fail-closed tests;
- startup purity and no ambient filesystem/network/Git/clock in semantic API;
- focused Ubuntu/Windows/macOS CI, full repository regression, `npm audit --audit-level=low`, Security CodeQL when triggered;
- exact-head HIGH_ASSURANCE semantic/integrity review with unresolved CRITICAL `0`, HIGH `0`.

## ADMISSION RULE
This Work Order is compiled from the frozen Source Pack but is **not admitted**. No implementation branch/package mutation is authorized until a separate exact-head admission review is approved and merged. The admitted execution base must then be bound canonically before implementation starts.

## CREDIT RULE
Planning/admission grant no production credit. M26 remains `0 / 19`; production remains `452 / 1088 = 41.54%` until approved implementation evidence is separately promoted MODULE_DONE.

STOP CONDITION: `GBS_WO_M26_001_COMPILED_NOT_ADMITTED`.
