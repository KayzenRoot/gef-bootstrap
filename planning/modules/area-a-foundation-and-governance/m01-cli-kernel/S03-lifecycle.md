# GBS-M01-S03 — Deterministic Lifecycle

Status: `FROZEN_CANDIDATE`

## Objective
Freeze the lifecycle contract for every deterministic work-plane invocation, from request acceptance through preflight, execution, verification, receipt emission and terminal classification, including cancellation, compensation and recovery handoff.

## Binding decisions
- M01-S01 runtime contract is FROZEN.
- M01-S02 command router contract is FROZEN.
- Execution is request-scoped, library-first and bounded.
- Router resolves exactly one canonical command/use-case.
- Mutation safety, recovery and evidence are delegated to owning modules, while lifecycle exposes stable handoff points.

## Frozen lifecycle
```text
RECEIVED
  -> VALIDATING
  -> PREFLIGHTING
  -> READY
  -> EXECUTING
  -> VERIFYING
  -> RECEIPTING
  -> SUCCEEDED
```

Non-success terminal families:
```text
BLOCKED(reason)
CANCELLED(reason)
TIMED_OUT(reason)
FAILED(reason)
RECOVERY_REQUIRED(reason)
PARTIAL_EXTERNAL_EFFECT(reason)
```

`RECOVERING` and `RECOVERED` are recovery-process classifications, not replacements for the immutable terminal record of the original invocation.

## Core rule
A lifecycle state is operational truth, never semantic approval by itself. `SUCCEEDED` means the deterministic use-case completed its declared mechanical contract and applicable verification. It does not imply broader architecture/review/DoD acceptance.

## Invocation identity
Every invocation receives a stable run/correlation ID at acceptance. Child orchestrated operations receive explicit parent linkage.

Lifecycle records bind, as applicable:
- run ID and parent run ID;
- canonical command ID/version;
- target/project binding;
- expected state/fingerprint;
- injected-clock timestamps;
- policy/authorization references;
- transaction/recovery reference;
- result/error classification;
- receipt/evidence reference.

## Preflight boundary
No mutation-capable handler enters `EXECUTING` until applicable preflight obligations pass, including contract validation, capability/policy checks, target binding, expected-state checks, mutation plan/recovery readiness, resource budget and cancellation status.

Preflight failures terminate before side effects whenever technically possible.

## Mutation lifecycle envelope
```text
DETECT
-> SNAPSHOT/PREFLIGHT
-> PLAN
-> VALIDATE PLAN
-> APPLY/STAGE
-> VERIFY
-> RECEIPT
-> PROMOTE
```

Where atomic rollback is impossible, lifecycle reports truthful external-effect/recovery state rather than pretending rollback occurred.

## Phase collapsing rule
Read-only or zero-cost phases may be physically collapsed for efficiency, but the logical lifecycle remains preserved in machine evidence. A command may move directly from validated/preflight-complete state into execution internally, but receipts must make it possible to prove which logical gates were satisfied.

This permits low-latency execution without sacrificing auditability.

## BLOCKED classification
`BLOCKED` is one terminal lifecycle family with typed reason codes, not dozens of distinct lifecycle states.

Typical reason families include capability missing, policy block, authorization required/denied, target conflict, incompatible version, stale state, unsupported environment, budget/precondition failure and external dependency unavailable.

The detailed shared taxonomy remains owned by M01-S05.

## Cancellation and timeout
Cancellation and timeout are cooperative and phase-aware.

Rules:
- before side effects: terminate cleanly as `CANCELLED`/`TIMED_OUT`;
- during reversible staged work: stop and route to compensation/recovery as required;
- after irreversible/external effect: preserve the effect in terminal classification and emit recovery/repair obligations;
- cancellation never erases evidence already required to explain what occurred.

## Recovery identity rule
Immediate automatic compensation that is part of the same transaction/invocation may remain under the original run ID with clearly separated recovery phases.

Any later, manual, resumed or independently scheduled recovery uses a new run ID linked to the original terminal record. The original receipt is never rewritten to pretend the original execution ended differently.

## Idempotency and retry
Automatic retry is prohibited by default for mutation commands unless the command contract explicitly declares an idempotency/retry model.

A retry policy must define retryable failure classes, maximum attempts, idempotency key/state binding where applicable, backoff/budget ownership, effect-detection before another attempt and evidence linking attempts.

Semantic failures, policy blocks, authorization denials, state conflicts and validation failures are never blind auto-retry candidates.

## Process restart rule
Baseline automatic retries never cross a process restart. A restart invalidates in-memory retry ownership.

Durable retry/resume/recovery across process boundaries belongs to later recovery/state modules and requires an explicit persisted contract, exact-state binding and evidence trail.

## Orchestration lifecycle
Application orchestrators may compose multiple typed use-cases, but must expose explicit child operation boundaries, inherited budgets, parent/child correlation, cancellation, compensation and evidence aggregation. Hidden recursive router dispatch remains prohibited.

Independent child work may continue after sibling failure only when orchestration policy explicitly declares independence and doing so cannot violate transaction/recovery semantics.

## Terminal state discipline
Exactly one terminal lifecycle classification is emitted for the original invocation.

Terminal receipts are append-only and immutable after publication. Corrections, recovery, supersession or explanatory amendments create linked follow-up records with their own identity and provenance.

## Receipt timing
A successful mutation is not terminal until post-state verification and required receipt materialization complete. Evidence-only follow-up source commits are prohibited when external receipts can represent proof without mutating the reviewed source head.

## Failure containment
Unexpected internal faults are caught at application/operator boundaries, sanitized, classified and linked to diagnostic evidence. Handler failure cannot trigger unrelated queued work unless orchestration policy explicitly permits independence.

## Token/time economy
Lifecycle structure makes phase, state and failure location machine-visible so correction flows can resume from the smallest still-valid boundary rather than replaying the whole operation. Logical phase receipts prevent repeated model questions such as whether preflight ran, whether mutation started, whether verification completed or whether recovery is required.

## Frozen decisions
1. Request-scoped lifecycle uses explicit logical machine states and exactly one terminal classification for the original run.
2. `SUCCEEDED` is mechanical success, not semantic/DoD approval.
3. Mutation handlers cannot execute before applicable preflight gates pass.
4. `BLOCKED` is a terminal family with typed reason codes, not a proliferation of lifecycle states.
5. Read-only/zero-cost phases may collapse physically for speed, while logical phase completion remains provable in receipts.
6. Cancellation/timeout is phase-aware and preserves truthful external effects.
7. Immediate in-transaction compensation may remain under the same run ID; later/manual recovery uses a linked new run.
8. Mutation retries are opt-in and require explicit idempotency/effect-detection contracts.
9. Semantic/policy/state-conflict failures are never blindly retried.
10. Baseline automatic retry never crosses a process restart; durable retry/resume requires later persisted recovery contracts.
11. Orchestrated child operations carry explicit parent correlation, budgets, cancellation and compensation/evidence contracts.
12. Successful mutation requires verification + receipt before terminal success.
13. Terminal receipts are append-only/immutable; later corrections/recovery create linked records.
14. Lifecycle state is compact operational truth designed to reduce rediscovery, replay and correction-token cost.

## Delegated ownership
- M05/M06: transaction application and filesystem safety details
- M24/M25: evidence/proof structures
- M34-M37: detailed security, recovery and integrity behavior
- M01-S04: process exit-code mapping
- M01-S05: shared typed error/reason taxonomy
- M43: lifecycle telemetry schema/storage
- M63: lifecycle latency budgets and benchmark evidence

## Resolved freeze questions
1. `BLOCKED` as terminal family with typed reason codes: **RESOLVED YES**.
2. Zero-cost/read-only physical phase collapsing with logical proof retained: **RESOLVED YES**.
3. Immediate compensation same run; later/manual recovery linked new run: **RESOLVED YES**.
4. Terminal receipts append-only/immutable; corrections linked: **RESOLVED YES**.
5. Baseline automatic retries do not cross process restarts: **RESOLVED YES**.

## Session completion gate
Planning content is frozen-candidate. Final `FROZEN` requires exact-head review, merge and checkpoint advancement to `GBS-M01-S04`. No functional implementation is introduced by this planning session.

STOP CONDITION: `M01_S03_EXACT_HEAD_REVIEW_REQUIRED`.
