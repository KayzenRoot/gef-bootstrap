# GBS-M23-S03 — Blockers
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Freeze blocker/recovery/conflict interpretation so M23 can explain why a project is constrained without discovering defects itself, inventing severity or allowing stale/resolved conditions to disappear silently.

## Technologies
- **Status Condition Index (SCI23)**: canonical, owner-labeled index of condition facts with `WARNING | BLOCKING | RECOVERY | CONFLICT`, disposition `ACTIVE | RESOLVED | UNKNOWN`, source identity, validity binding, freshness and subject.
- **Blocker Aggregation Vector (BAV23)**: deterministic aggregation of active M17 blocker refs plus admitted explicit `BLOCKING` conditions, preserving source identities and duplicate/replay visibility.
- **Status Conflict Witness (SCW23)**: detects mutually exclusive current facts, same-identity divergent conditions, lineage mismatch and contradictory completion/continuation claims.
- **Recovery Dominance Gate (RDG23)**: identifies current recovery-required facts independently from ordinary blockers and prevents them from being rendered merely as warnings.
- **Blocker Reason Trace (BRT23)**: deterministic reason-code trace from lifecycle/readiness result back to exact blocker/recovery/conflict source digests; explanations are projections, not new authority.

## Frozen blocker policy
1. M23 consumes blocker facts; it does not scan code, CI, evidence or providers to discover blockers.
2. `CONFLICT` facts dominate recovery/blocking/warning facts because source truth is not safely decidable.
3. `RECOVERY` dominates ordinary `BLOCKING` for lifecycle/readiness classification.
4. An `ACTIVE` blocking condition prevents `COMPLETE` and continuation `READY`.
5. A previously active blocker cannot disappear because a newer input omits it; resolution requires an explicit current `RESOLVED` fact or an authoritative source-state replacement that proves the blocker set is complete.
6. A stale last-known active blocker remains conservatively blocking until an admissible resolution supersedes it. Staleness may be surfaced in reasons, but cannot manufacture readiness.
7. `UNKNOWN` disposition on a potentially blocking/recovery condition yields `INDETERMINATE`/`UNKNOWN` unless a stronger conservative active condition already determines the result.
8. `WARNING` never becomes `BLOCKING` merely because the schedule is late or confidence is low.
9. Duplicate identical facts are idempotent; same identity with divergent semantics is conflict.
10. Blocker ordering cannot affect canonical status.

## Invariants
1. M23 never upgrades condition severity beyond the owner-provided classification.
2. Resolved blockers remain in history but do not constrain the current snapshot.
3. Stale blocker resolution cannot clear a current blocker.
4. A condition from another project/lineage cannot constrain the current status.
5. Schedule-health facts never create blocker facts.
6. Completion acceptance cannot override an active blocker/recovery/conflict.
7. Conflict subjects and source digests remain visible in canonical status evidence.
8. Reason traces must bind the exact status snapshot inputs.

## STANDARD_PLUS obligations
- duplicate/replay and resealed-conflict tests;
- stale-active-blocker versus stale-resolution tests;
- recovery/blocking/warning precedence tests;
- omitted-blocker cannot silently resolve tests;
- cross-lineage condition attacks;
- conflict witness permutation invariance;
- reason-trace binding/tamper tests.

STOP CONDITION: `M23_S03_FROZEN`.
