# M25 Planning Gate
Status: `PASSED`
Module: `GBS-M25 — Proof Graph`
Sessions: `5 / 5 FROZEN`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Frozen source set
- `planning/modules/area-g-evidence-and-review/m25-proof-graph/S01-proof-ids.md`
- `planning/modules/area-g-evidence-and-review/m25-proof-graph/S02-dependencies.md`
- `planning/modules/area-g-evidence-and-review/m25-proof-graph/S03-fingerprints.md`
- `planning/modules/area-g-evidence-and-review/m25-proof-graph/S04-carry-forward.md`
- `planning/modules/area-g-evidence-and-review/m25-proof-graph/S05-invalidation.md`
- `.engineering/ledgers/M25-PROOF-GRAPH-LEDGER-SYNC.md`

## Mechanism families
1. PIC25, PAB25, CCI25, PNI25, PEI25, POD25, PNS25, PIM25.
2. PDG25, DAG25, SER25, ESG25, CSG25, PRC25, ADC25, DCW25.
3. EVF25, OBF25, DCF25, PSF25, VCG25, PFW25, FCW25, FIR25.
4. PCG25, PCK25, CFC25, CFD25, CFW25, PCS25, SAR25, CFR25.
5. CIG25, PIV25, TIS25, UDW25, RCP25, PSC25, PIR25, PRG25, PSW25, DPH25.

Total frozen mechanisms: `42`.

## Authority boundary
M25 owns proof relationships, reachability and sufficiency. M12 owns DoD semantics; M17 checkpoint progression; M21 progress; M23 project status; M24 evidence validity/acceptance; M26 delta review; M27 assurance.

A DPC24 handoff is usable only with current M24 provenance sufficient to reproduce its evidence context. Evidence completeness never automatically means a claim is proven.

## Proof model
Proof states: `PROVEN | UNPROVEN | STALE | CONFLICT | INDETERMINATE | TRUNCATED`.

Sufficiency expressions are owner-declared `ALL | ANY | AT_LEAST`. Selected support is explicit. Duplicate semantic support counts once. Cyclic or mismatched graph material is not accepted as a valid proof graph.

## Validity and reuse
Fingerprints bind declared validity dependencies only. Equality is a comparison fact, not authority. Full carry-forward requires current compatible claim, obligation, policy, evidence and dependency inputs. Partial reuse preserves only current child proofs and reevaluates affected ancestors. Incomplete dependency knowledge cannot justify full reuse.

## Invalidation
Complete dependency knowledge permits targeted reverse-reachability impact. Incomplete knowledge widens impact and records that widening. M25 emits reopen candidates but does not change completion state. Proof snapshots and receipts remain independently recomputable.

## MAX_ASSURANCE acceptance
Implementation must cover deterministic identities, namespace/owner boundaries, M24 handoff recomputation, expression/graph behavior, cycles/nesting, duplicate support, evidence states, fingerprint changes, full/partial/no reuse, targeted/widened invalidation, snapshot/history integrity, bounded execution, startup purity, Ubuntu/Windows/macOS focused CI, full regression, dependency audit, CodeQL, exact-head semantic review, CRITICAL `0`, HIGH `0`, and separate MODULE_DONE promotion.

Planning verdict: `READY_FOR_WORK_ORDER_ADMISSION_REVIEW`.

STOP CONDITION: `M25_PLANNING_FROZEN_READY_FOR_ADMISSION`.
