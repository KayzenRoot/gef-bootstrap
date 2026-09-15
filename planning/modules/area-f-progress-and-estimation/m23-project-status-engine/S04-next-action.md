# GBS-M23-S04 — Next Action
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Freeze continuation-readiness, next-action and schedule-health interpretation without allowing M23 to invent work, mutate M17 continuation truth or let deadlines contaminate lifecycle/blocker semantics.

## Technologies
- **Continuation Readiness Resolver (CRR23)**: deterministic resolver for `NOT_APPLICABLE | READY | WAITING | REPLAN_REQUIRED | BLOCKED | RECOVERY_REQUIRED | UNKNOWN | CONFLICT` from admitted M17 readiness, optional M18 handback and M23 condition state.
- **Next Legal Action Binding (NAB23)**: read-only binding to M17 `nextLegalAction`; M23 may expose or validate it but cannot replace, reorder or synthesize a different action.
- **Next Action Consistency Witness (NAC23)**: compares M17 canonical action with applicable M18 handback/requested action and explicit continuation facts; divergent current actions for the same checkpoint become `CONFLICT` or `REPLAN_REQUIRED` according to source semantics.
- **Deadline Interval Classifier (DIC23)**: interprets only the already-computed M22 `DeadlineComparison` interval; it never recalculates ETA or changes M22 confidence.
- **Schedule Health Resolver (SHR23)**: deterministic resolver for `NOT_APPLICABLE | UNKNOWN | ON_TRACK | AT_RISK | LATE` using frozen interval rules.
- **Status Independence Firewall (SIF23)**: mechanically separates lifecycle, schedule health and continuation readiness so schedule risk cannot create completion, blockers or progress changes.

## Frozen continuation-readiness policy
Precedence:
1. source/action conflict => `CONFLICT`;
2. recovery condition => `RECOVERY_REQUIRED`;
3. active blocker or unresolved capability/blocker gap => `BLOCKED`;
4. applicable M18 `DRIFT_REQUIRES_REPLAN`/lineage drift => `REPLAN_REQUIRED`;
5. lifecycle `COMPLETE` with no higher-priority reopened/recovery/blocker/conflict condition => `NOT_APPLICABLE`;
6. lifecycle `AWAITING_ACCEPTANCE` with no higher-priority constraint => `WAITING`;
7. current M17 readiness certificate is ready, bindings are current and next legal action is present => `READY`;
8. otherwise => `UNKNOWN`.

M18 is advisory to re-entry consistency only. It can make readiness stricter when a same-checkpoint resume fact proves drift/blocking, but it cannot replace M17 canonical next action.

## Frozen schedule-health policy
Schedule health exists only when a deadline comparison is explicitly applicable.
- no deadline requested/configured => `NOT_APPLICABLE`;
- deadline requested but M22 forecast/deadline comparison is unavailable/stale/conflicting/indeterminate => `UNKNOWN`;
- `upperDeltaMs >= 0` => `ON_TRACK` because even the conservative completion bound is on/before the deadline;
- `lowerDeltaMs < 0` => `LATE` because even the optimistic completion bound is after the deadline;
- otherwise => `AT_RISK` because the canonical forecast interval straddles the deadline.

The deltas above are consumed exactly as emitted by M22 (`deadline - forecast completion`). M23 does not recompute them.

## Invariants
1. M23 never invents a next action when M17 has none/current state is indeterminate.
2. M18 action disagreement cannot silently supersede M17.
3. `LATE` or `AT_RISK` cannot by itself set lifecycle `BLOCKED`.
4. `UNKNOWN` ETA/schedule cannot erase a valid `READY` continuation state when schedule is not a readiness prerequisite.
5. `AWAITING_ACCEPTANCE` normally yields readiness `WAITING`, not `READY`.
6. Current `COMPLETE` lifecycle has readiness `NOT_APPLICABLE` unless a higher-priority reopen/recovery/blocker/conflict fact makes continuation relevant again.
7. Schedule-health classification is deterministic at exact zero boundaries.
8. Deadline input cannot alter M22 forecast or M21 progress.
9. Next-action/status outputs remain bound to exact checkpoint/source identities.
10. Ambient system time is forbidden; any as-of/deadline temporal value comes from admitted upstream inputs.
11. Response/UI code cannot upgrade readiness or schedule health.

## STANDARD_PLUS obligations
- exact schedule boundaries for conservative/optimistic deltas including zero;
- no-deadline versus unavailable-forecast distinction;
- late/at-risk cannot create lifecycle blocker tests;
- M17/M18 action divergence and replan tests;
- waiting-for-acceptance readiness tests;
- completed-project `NOT_APPLICABLE` readiness tests;
- missing/stale readiness and capability-gap tests;
- status-dimension independence metamorphic tests.

STOP CONDITION: `M23_S04_FROZEN`.
