# GBS-M24-S02 — Evidence Receipts
Status: `FROZEN`
Module weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze immutable receipts for evidence validation, acceptance, rejection, staleness, conflict, invalidation and replay so an evidence decision can be independently verified against the exact evidence item, subject state, producer authority and validity dependencies that existed when the decision was made.

## Frozen mechanisms
1. **EVR24 — Evidence Validation Receipt**: records evidence item/manifest identity, subject binding, producer authority result, structural/semantic validation and reason codes.
2. **EAR24 — Evidence Acceptance Receipt**: emitted only from a verified EVR24 plus current validity inputs; binds claim IDs and exact accepted evidence identity.
3. **ERR24 — Evidence Rejection Receipt**: immutable negative decision for invalid/unauthorized evidence without mutating or deleting the original item.
4. **ESR24 — Evidence Staleness Receipt**: records exact changed dependency/subject identities that made previously valid evidence stale.
5. **ECR24 — Evidence Conflict Receipt**: records divergent evidence/authority facts that cannot be safely collapsed to a winner.
6. **ERS24 — Evidence Receipt Set**: deterministic bounded aggregation of receipts with completeness/truncation state and semantic identity.
7. **RPG24 — Receipt Replay Guard**: identical receipt replay is idempotent/visible; same stable receipt/evidence identity with divergent payload is conflict.
8. **EIR24 — Evidence Invalidation Receipt**: immutable targeted invalidation binding before evidence validity, changed dependency identities and affected claims/evidence descendants.

## Evidence decision state
Canonical M24 evidence acceptance state:
`ACCEPTED | REJECTED | STALE | CONFLICT | UNKNOWN`.

`UNKNOWN` means required authority/subject/dependency truth is insufficient or indeterminate. It never means accepted-by-default.

## Receipt chain rules
1. EAR24 requires verified MEM24/SAI24/SSB24 and a successful EVR24.
2. Acceptance must bind the exact evidence semantic digest and exact current validity/dependency binding.
3. Rejection and staleness preserve the original evidence item for audit; they never rewrite it.
4. Conflicting evidence with equal authority is preserved as conflict unless a governed supersession/invalidating fact resolves it.
5. Receipt ordering or timestamp recency cannot select a winner.
6. Revalidation produces a new receipt; historical receipts remain immutable.
7. Same evidence may support multiple claims only when ECM24 explicitly maps those claims; this does not create multiple independent evidence items.
8. A single evidence item cannot be counted as multiple independent observations merely because it has several refs/receipts.
9. Receipt sets report `COMPLETE | PARTIAL | TRUNCATED | CONFLICT | INDETERMINATE`; bounded omission is never silently treated as complete history.

## Invalidation rules
- validity changes invalidate only affected evidence/claims when dependency knowledge is complete;
- incomplete dependency knowledge widens invalidation conservatively and records the widening;
- an invalidation cannot itself assert that a rerun passed;
- stale evidence can become accepted again only through new/revalidated current evidence and a new acceptance receipt;
- evidence descendants supplied to M25/M27 must retain invalidation lineage.

## M21 acceptance handoff
M24 may derive the M21-compatible acceptance fact only from a current EAR24/ESR24/ECR24 state:
- owner is exactly `M24_EVIDENCE`;
- `unitId` is explicitly claim-mapped and denominator-relevant;
- state projects exactly to `ACCEPTED | REJECTED | STALE | CONFLICT | UNKNOWN`;
- `sourceIdentityDigest` binds accepted evidence identity/receipt set;
- `validityBindingDigest` binds current subject/dependency validity;
- M24 never supplies earned weight or denominator arithmetic.

## MAX_ASSURANCE failure model
Tests must cover:
- forged acceptance receipt over invalid evidence;
- acceptance receipt reused with another subject/head/tree;
- rejection/acceptance same evidence ID split brain;
- replay amplification pretending identical receipt is independent evidence;
- invalidation omission and stale resurrection;
- incomplete dependency graph narrowing invalidation unsafely;
- receipt-set truncation represented as complete;
- conflicting authority resolved by order/recency;
- receipt reason/source tamper under resealed outer digest;
- acceptance-to-M21 relabeling or state upgrade;
- cancellation/budget exhaustion mid-history traversal.

## Invariants
1. Receipt identity changes when any material decision/source/validity fact changes.
2. Historical receipts never gain authority merely because they are newer.
3. `ACCEPTED` cannot be emitted from UNKNOWN/CONFLICT/STALE validation.
4. Receipt verification independently recomputes canonical receipt semantics.
5. Invalidated evidence cannot remain current in an aggregate set.
6. Replay detection is bounded and deterministic.
7. No receipt contains raw secret/log payloads.

STOP CONDITION: `M24_S02_FROZEN`.
