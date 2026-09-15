# GBS-WO-M25-001 — Admission Record

Status: `ADMISSION_CANDIDATE`
Module: `GBS-M25 — Proof Graph`
Work Order: `.engineering/work-orders/GBS-WO-M25-001.md`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`
Frozen mechanisms: `42`
Planning gate: `.engineering/gates/M25-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#239`
Planning reviewed head: `db89e6a021cfc46cf89c62a1f8db36dc78baaf8b`
Planning reviewed tree: `22c5d75b4a880d2d2bfdd2d518ea8e197854cdc9`
Planning semantic review: `5213821206`
Planning freeze merge / legal planning base: `70fbfafa71e20e684ab9dbe740aede772d4cbe02`

## Admission scope
Admission may authorize only the bounded implementation of the 42 mechanisms frozen in M25 S01-S05 and compiled into `GBS-WO-M25-001`.

## Preserved ownership
Admission does not authorize M25 to change M12 DoD semantics, M17 checkpoint progression, M21 progress/denominator, M23 project status, M24 evidence validity, M26 delta review or M27 assurance.

M25 remains limited to proof identity, dependency graph, proof sufficiency, validity fingerprints, carry-forward, proof invalidation projections, proof snapshots and read-only downstream handoffs.

## Frozen guarantees
- canonical claim meaning/ownership is supplied by upstream owners;
- DPC24 use requires current M24 provenance sufficient to reproduce/verify the evidence context;
- evidence acceptance/completeness never automatically means `PROVEN`;
- proof expressions remain owner-declared `ALL | ANY | AT_LEAST`;
- duplicate semantic support counts once;
- cycles and namespace mismatch cannot be treated as valid proof structure;
- fingerprint equality is comparison evidence, not authority;
- full reuse requires current relevant claim/obligation/policy/evidence/dependency inputs;
- partial reuse reevaluates affected ancestors;
- complete dependency knowledge permits targeted invalidation;
- incomplete knowledge widens impact explicitly;
- reopen projections are read-only;
- proof history preserves duplicate/divergent/truncated state;
- semantic core remains deterministic, startup-pure, bounded/cancellable and injected SHA-256 based.

## MAX_ASSURANCE obligations
Implementation must provide deterministic graph/identity tests, M24 provenance integration, ALL/ANY/AT_LEAST and nested graph coverage, cycle/duplicate/replay handling, evidence-state coverage, validity-fingerprint change coverage, full/partial/no carry-forward, targeted/widened invalidation, snapshot/history recomputation, bounded execution, startup purity, three-OS focused CI, full regression, dependency audit, CodeQL and exact-head semantic/integrity review with CRITICAL `0` and HIGH `0`.

## Execution-base rule
This candidate grants no implementation authority yet. After this admission PR passes exact-head semantic review and merges, a separate post-merge binding must record the actual admission merge SHA as the sole legal M25 execution base and promote Admission, Work Order and checkpoints to `ADMITTED_READY_FOR_IMPLEMENTATION`.

## Credit rule
M25 remains `0 / 20`. Production remains `432 / 1088 = 39.71%` until implementation evidence, implementation merge and separate MODULE_DONE promotion.

STOP CONDITION: `GBS_WO_M25_001_ADMISSION_CANDIDATE_PENDING_AUDIT`.
