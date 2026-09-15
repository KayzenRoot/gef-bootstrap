# GBS-WO-M22-001 — Admission Record

Status: `ADMITTED`
Module: `GBS-M22 — Estimation Engine`
Work Order: `.engineering/work-orders/GBS-WO-M22-001.md`
Frozen weight: `15`
Assurance intensity: `ELEVATED`
Frozen mechanisms: `30`
Planning gate: `.engineering/gates/M22-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#223`
Planning reviewed head: `5a38baadde66afb9af56cc11c29707908571c276`
Planning reviewed tree: `492cc5796a997f5c0d2d0d5c7243c3ee0fa3ed7f`
Planning semantic audit: `5205471859`
Planning freeze merge / legal planning base: `e205c45a5ae3cfd7faa7404fd13a8284a4f2a649`
Admission PR: `#224`
Admission reviewed head: `bea5d53195f29bca7e8b58a4b1903fa6387485ff`
Admission reviewed tree: `a965b400a3d02a39c5881adff77a9890abd3153e`
Admission semantic audit: `5205732573`
Admission merge / sole legal execution base: `5c0b854f81a43afc608e32063a3e70d70cf73ac9`

## Admission scope
Admission authorizes only the bounded implementation of the 30 M22 mechanisms frozen in S01-S05 and compiled into `GBS-WO-M22-001`.

## Preserved restrictions
Admission grants no production credit and does not authorize M22 to calculate canonical progress, define project status, accept evidence/proof truth, collect telemetry, define benchmark baselines, own executor critical-path/performance modeling, mutate Git/provider state or format operator presentation.

M22 must not treat production weight as time. A temporal forecast requires admitted empirical progress/time observations. Fewer than three independent valid samples remain `NOT_YET_BASELINED`. Temporal authority is explicit, owner-labeled and uses injected integer millisecond values; ambient system time is forbidden.

## Frozen estimation guarantees
- read-only M21 project-level progress baseline;
- exact integer/rational canonical arithmetic for progress, throughput and duration authority;
- deterministic nearest-rank Q1/Q2/Q3 and robust center/range semantics;
- duplicate/replay rejection and visible exclusions/outliers;
- denominator-epoch compatibility and progress-regression preservation;
- uncertainty-aware interval/scenario truth instead of scalar-only ETA;
- deadline/target bias firewall;
- objective confidence policy derived from sample sufficiency, dispersion and calibration history;
- immutable forecast history, explicit recalibration epochs and revision receipts;
- M20/M23 handoffs that preserve unavailable/confidence states without downstream upgrading;
- startup-pure, bounded/cancellable semantic core with injected fail-closed SHA-256.

## ELEVATED execution obligations
Implementation must prove baseline sufficiency/no-fabrication, owner spoofing rejection, cross-lineage/epoch mix-and-match rejection, arithmetic oracle agreement, permutation invariance, duplicate/replay resistance, sparse/outlier/high-dispersion behavior, uncertainty/scenario ordering, deadline-bias resistance, calibration drift/revision semantics, snapshot/handoff tamper resistance, startup purity, three-OS CI, full regression, dependency audit and exact-head semantic audit with CRITICAL `0` and HIGH `0`.

## Exact execution-base rule
PR #224 passed exact-head semantic audit with CRITICAL `0` / HIGH `0` and merged as `5c0b854f81a43afc608e32063a3e70d70cf73ac9`. That merge is the sole legal M22 execution base. Implementation branches must descend from it or a reviewed `main` descendant preserving this admitted contract. Earlier candidate states are non-authoritative.

## Credit rule
Admission grants execution authority only. M22 remains `0 / 15` until implementation, ELEVATED evidence, exact-head semantic review, implementation merge and separate MODULE_DONE promotion complete.

STOP CONDITION: `GBS_WO_M22_001_ADMITTED_READY_FOR_IMPLEMENTATION_BINDING`.
