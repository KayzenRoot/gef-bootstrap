# M26 Planning Gate
Status: `PASSED`
Module: `GBS-M26 — HEDS Delta Review`
Sessions: `5 / 5 FROZEN`
Frozen weight: `19`
Assurance intensity: `HIGH_ASSURANCE`

## Frozen source set
- `planning/modules/area-g-evidence-and-review/m26-heds-delta-review/S01-delta-discovery.md`
- `planning/modules/area-g-evidence-and-review/m26-heds-delta-review/S02-source-check.md`
- `planning/modules/area-g-evidence-and-review/m26-heds-delta-review/S03-semantic-review.md`
- `planning/modules/area-g-evidence-and-review/m26-heds-delta-review/S04-gates.md`
- `planning/modules/area-g-evidence-and-review/m26-heds-delta-review/S05-verdict.md`
- `.engineering/ledgers/M26-HEDS-DELTA-REVIEW-LEDGER-SYNC.md`

## Mechanism families
1. HIC26, HAB26, BSI26, CSI26, RSP26, SDL26, DCI26, XLG26.
2. SCM26, SBG26, ACG26, DPG26, PBG26, VCG26, SGW26, MMW26.
3. SDM26, IFP26, ORF26, RCI26, RCF26, SFC26, SFS26, DTR26.
4. BCG26, SCG26, PIG26, FCG26, ZHG26, AAG26, BMG26, VAG26.
5. HVC26, HIR26, HSD26, HFR26, HTR26, HRG26, HSW26, DHH26.

Total frozen mechanisms: `40`.

## Authority boundary
M26 owns semantic delta discovery/review, review-scope impact projection, HEDS findings, gates and verdict history. M24 keeps evidence validity/acceptance; M25 keeps proof graph/sufficiency/carry-forward/invalidation; M27 keeps assurance; M28 keeps test-impact/test-selection; M29 keeps Git semantics; M17 keeps checkpoint promotion; M21 progress and M23 status remain unchanged.

M26 accepts M25 proof context only through a current `DPH25` handoff with `owner=M25_PROOF` and `consumer=M26_DELTA_REVIEW`. It may use proof invalidation to shape semantic review scope but cannot alter proof state.

## HEDS model
The semantic core compares exact owner-labeled baseline/candidate projections. Semantic delta is `ADDED | REMOVED | MODIFIED | UNCHANGED`, with authority/binding changes retained even when payload semantics appear equal. Formatting/provider transport noise is non-semantic unless an owner declares otherwise.

Review effort is dependency-aware: changed semantics and invalidated review/proof closure are reviewed; unchanged accepted review results may carry forward only under exact current compatibility. Incomplete coverage/dependency knowledge widens review scope rather than narrowing it.

## Verdict model
Final HEDS states are `APPROVED | CORRECTION_REQUIRED | BLOCKED | INDETERMINATE | TRUNCATED`.

`APPROVED` requires complete admissible review scope, current source/proof bindings, no unresolved authority conflict, no silent truncation and unresolved CRITICAL/HIGH findings equal to zero. Zero CRITICAL/HIGH is necessary but not sufficient.

## HIGH_ASSURANCE acceptance
Implementation must cover deterministic baseline/candidate/source identities, cross-lineage and mix-and-match attacks, semantic vs presentation-only changes, complete/partial source coverage, M25 handoff verification, dependency widening, impact-frontier and review de-duplication, exact/stale carry-forward, finding severity/state integrity, finding disappearance/supersession, all review gates, verdict recomputation, replay/split-brain/history truncation, downstream M27/M28 authority denial, injected digest, bounded/cancellable traversal, startup purity, property/permutation tests where useful, Ubuntu/Windows/macOS focused CI, full regression, dependency audit, CodeQL when triggered, exact-head semantic audit, CRITICAL `0`, HIGH `0`, and separate MODULE_DONE promotion.

Planning verdict: `READY_FOR_WORK_ORDER_ADMISSION_REVIEW`.
Implementation remains forbidden until separate admission audit/merge and execution-base binding.

STOP CONDITION: `M26_PLANNING_FROZEN_READY_FOR_ADMISSION`.
