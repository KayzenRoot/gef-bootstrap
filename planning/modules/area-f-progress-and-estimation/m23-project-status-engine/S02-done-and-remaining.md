# GBS-M23-S02 — Done & Remaining
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Freeze how M23 interprets current lifecycle from admitted M17/M21 facts without equating progress with acceptance, without recomputing remaining work and without allowing presentation or schedule pressure to manufacture completion.

## Technologies
- **Completion Progress Witness (CPW23)**: read-only witness over the admitted M21 project fraction, completeness state, snapshot identity and regression flag. It can classify `ZERO_PROGRESS`, `PARTIAL_PROGRESS`, `FULL_PROGRESS` or `UNKNOWN`; it never recalculates credit.
- **Completion Outcome Gate (COG23)**: admits an explicit owner-labeled completion decision with source/validity identity and state `ACCEPTED | REJECTED | STALE | CONFLICT | UNKNOWN`.
- **Remaining-State Projection (RSP23)**: projects only `NONE_REMAINING | HAS_REMAINING | UNKNOWN` from M21 exact progress/completeness. It does not create weights, tasks, backlog items or ETA.
- **Lifecycle Status Resolver (LSR23)**: deterministic resolver for `NOT_STARTED | IN_PROGRESS | AWAITING_ACCEPTANCE | BLOCKED | RECOVERY_REQUIRED | COMPLETE | INDETERMINATE | CONFLICT` using frozen precedence and admitted upstream facts.
- **Completion Regression Fence (CRF23)**: prevents a previously `COMPLETE` lifecycle from reverting silently; any reopen requires explicit invalidation/reopen authority bound to the superseded completion snapshot.

## Frozen lifecycle precedence
When multiple conditions apply, the first applicable rule wins:
1. material source/status conflict => `CONFLICT`;
2. governed recovery condition => `RECOVERY_REQUIRED`;
3. active blocking condition => `BLOCKED`;
4. mandatory M17/M21 source unavailable, stale without a conservative blocking fact, or indeterminate => `INDETERMINATE`;
5. M21 exact project progress is `1/1`, completeness is `COMPLETE`, completion outcome is current `ACCEPTED`, and no higher-priority condition applies => `COMPLETE`;
6. M21 exact project progress is `1/1`, completeness is `COMPLETE`, but completion outcome is absent/unknown/rejected/stale => `AWAITING_ACCEPTANCE`;
7. exact progress is zero and admitted continuation state has no `ACTIVE`/`DONE` work signal => `NOT_STARTED`;
8. otherwise => `IN_PROGRESS`.

## Completion rules
1. `FULL_PROGRESS` is necessary but not sufficient for `COMPLETE`.
2. Completion outcome authority must be external to M23 and explicit. Until M24/M25/M27 exist, only a canonical injected owner allowed by the Work Order may supply it; M23 must never simulate an assurance/evidence owner.
3. A rejected completion outcome keeps lifecycle at `AWAITING_ACCEPTANCE` unless a blocker/recovery/conflict dominates.
4. A stale prior acceptance cannot authorize a fresh `COMPLETE` snapshot.
5. A progress regression after prior completion requires the lifecycle to reopen when a valid reopen/invalidation witness exists; status is not monotonic.
6. `NONE_REMAINING` means M21 currently reports full exact progress. It does not mean acceptance, release, deployment or assurance is complete.

## Invariants
1. M23 cannot change M21 numerator/denominator or completeness.
2. M23 never infers remaining days from remaining progress.
3. `100%` + missing acceptance => `AWAITING_ACCEPTANCE`, never `COMPLETE`.
4. `COMPLETE` cannot coexist with an active blocking/recovery/conflict condition.
5. Zero progress with active continuation work is `IN_PROGRESS`, not `NOT_STARTED`.
6. Partial/stale/conflicting M21 completeness cannot be upgraded by M23.
7. Reopening a completed status preserves the prior completed snapshot and emits a revision/transition record.
8. Caller preference cannot choose lifecycle state.

## STANDARD_PLUS obligations
- exact `0`, partial and `1/1` boundary tests;
- `1/1` without acceptance, rejected acceptance and stale acceptance tests;
- blocker/recovery/conflict dominance tests;
- zero-progress-but-active-work test;
- progress regression after completion tests;
- forged completion owner and stale-validity attacks;
- deterministic resolver permutation tests.

STOP CONDITION: `M23_S02_FROZEN`.
