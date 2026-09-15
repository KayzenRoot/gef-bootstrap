# GBS-M23-S05 — Status Snapshot
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Freeze immutable, self-verifying project-status snapshots and history so downstream response/evidence modules can consume M23 truth without recomputation, status rewriting or loss of reopen/conflict history.

## Technologies
- **Project Status Snapshot Capsule (PSS23)**: immutable project/lineage/checkpoint snapshot binding lifecycle, schedule health, continuation readiness, next legal action, M21/M22 handoff identities, blocker/condition index, completion outcome and reason trace.
- **Project Status Integrity Receipt (PSI23)**: independently recomputable receipt proving canonical status dimensions against exact admitted input identities and frozen precedence rules.
- **Project Status Semantic Digest (PSD23)**: presentation-independent digest over all material status truth while excluding wording/UI formatting.
- **Status Transition Receipt (STR23)**: immutable before/after receipt binding prior/current snapshot digests, changed dimensions, reason codes and exact changed-source identities.
- **Status Reopen Witness (SRW23)**: required authority witness for any `COMPLETE -> non-COMPLETE` transition, binding invalidated completion identity, reopen reason and source authorization.
- **Status History Guard (SHG23)**: bounded replay/split-brain guard for transition/reopen history; duplicate identical receipts are idempotent, divergent same-identity history conflicts, and truncation is explicit.
- **Delegated Project Status Handoff (DPH23)**: owner-bound read-only projection to M20 carrying lifecycle/schedule/readiness, reason codes, source snapshot digest and validity binding without presentation authority.
- **Status Freshness Gate (SFG23)**: revalidates a snapshot against current M17/M21 plus applicable M18/M22/completion/condition identities and yields `CURRENT | STALE | CONFLICT | INDETERMINATE` without mutating history.

## Snapshot contract
A canonical PSS23 binds at minimum:
- project and lineage identity;
- M17 checkpoint/readiness/next-action identity;
- optional applicable M18 resume identity;
- M21 project-status handoff digest and exact completeness/progress identity;
- optional applicable M22 status-estimation handoff digest;
- status-condition index digest;
- completion-outcome digest or explicit absence state;
- lifecycle status;
- schedule health;
- continuation readiness;
- canonical next legal action projection;
- reason-code trace;
- predecessor status semantic digest when history exists.

## Transition/history rules
1. Status snapshots are immutable. New truth creates a new snapshot.
2. Repeated construction from semantically identical inputs yields the same semantic identity.
3. Any changed canonical dimension requires a transition receipt.
4. `COMPLETE -> non-COMPLETE` additionally requires SRW23; ordinary transition reasons are insufficient.
5. Same predecessor with divergent non-equivalent successors is split-brain unless an explicit supersession/reopen path explains the divergence.
6. Duplicate identical STR23/SRW23 entries are replay-safe and do not create extra transitions.
7. History/window limits are bounded; if prior entries are omitted due to configured bounds, state is explicitly `TRUNCATED`, never presented as complete history.
8. Snapshot reuse is denied when a mandatory source identity changes or an applicable optional source becomes materially contradictory.

## Downstream rules
1. M20 may render DPH23 but cannot recalculate status or upgrade `INDETERMINATE/CONFLICT`.
2. Future M24/M25/M27 may consume M23 snapshots as context but remain evidence/proof/assurance owners.
3. M17 remains checkpoint/next-action owner even when M23 includes those values in its snapshot.
4. M21/M22 remain metric owners; PSS23 stores their handoff identities rather than replacing their canonical snapshots.
5. Operator wording/icons/colors never participate in semantic status identity.

## Invariants
1. Integrity verification recomputes status from exact admitted inputs, not from stored labels alone.
2. Tampering with lifecycle/schedule/readiness/next action/reason trace breaks receipt verification.
3. Snapshot cannot be `COMPLETE` if its bound inputs would resolve to blocker/recovery/conflict or lack valid completion authority.
4. A stale M21 or M17 mandatory binding makes current reuse fail closed.
5. M22 staleness affects schedule health when applicable but does not retroactively rewrite lifecycle progress truth.
6. Reopen preserves historical `COMPLETE` evidence; it never edits the old snapshot in place.
7. Split-brain and history truncation remain visible to downstream consumers.
8. All history operations are bounded/cancellable.
9. SHA-256 is injected and fail-closed; semantic code performs no hidden filesystem/network/provider/system-clock access.
10. Human and machine projections must bind the same semantic snapshot digest.

## STANDARD_PLUS obligations
- independent snapshot/receipt recomputation;
- field/source mix-and-match tamper tests;
- semantic digest presentation invariance;
- lifecycle/schedule/readiness transition tests;
- COMPLETE reopen-without-witness rejection;
- duplicate transition/reopen replay tests;
- split-brain successor tests;
- bounded-history `TRUNCATED` tests;
- stale mandatory versus optional-source freshness tests;
- M20 handoff ownership/no-upgrade tests;
- cancellation/budget/digest-failure/startup-purity tests;
- Ubuntu/Windows/macOS focused matrix, full regression, dependency audit and CodeQL when triggered.

STOP CONDITION: `M23_S05_FROZEN`.
