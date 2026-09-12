# GBS-M01-S03 — Deterministic Lifecycle

Status: `IN_DISCUSSION`

## Objective
Freeze the lifecycle contract for every deterministic work-plane invocation, from request acceptance through preflight, execution, verification, receipt emission and terminal classification, including cancellation, compensation and recovery handoff.

## Binding decisions
- M01-S01 runtime contract is FROZEN.
- M01-S02 command router contract is FROZEN.
- Execution is request-scoped, library-first and bounded.
- Router resolves exactly one canonical command/use-case.
- Mutation safety, recovery and evidence are delegated to their owning modules but lifecycle must expose stable handoff points.

## Candidate lifecycle
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

Non-success branches may enter:
```text
BLOCKED
CANCELLED
TIMED_OUT
FAILED
RECOVERY_REQUIRED
RECOVERING
RECOVERED
PARTIAL_EXTERNAL_EFFECT
```

## Core rule
A lifecycle state is an operational classification, never proof of semantic correctness by itself. `SUCCEEDED` means the deterministic use-case completed its declared mechanical contract and applicable verification, not that a broader product/review/DoD claim is automatically satisfied.

## Invocation identity
Every invocation receives a stable run/correlation ID at acceptance. Child orchestrated operations receive explicit parent linkage rather than inventing unrelated roots.

Lifecycle records must be able to bind:
- run ID;
- canonical command ID/version;
- target/project binding where applicable;
- expected state/fingerprint when applicable;
- start/end timestamps through injected clock;
- policy/authorization references;
- transaction/recovery reference where mutation occurs;
- result/error classification;
- receipt/evidence reference.

## Preflight boundary
No mutation-capable handler enters `EXECUTING` until required preflight obligations have passed, including applicable contract validation, capability/policy checks, target binding, expected-state checks, mutation plan/recovery readiness and resource/cancellation checks.

Preflight failures terminate before side effects whenever technically possible.

## Mutation lifecycle
Mutation-capable operations follow the architectural envelope:
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

Where atomic rollback is impossible, the lifecycle must report the truthful external-effect/recovery state rather than pretending rollback succeeded.

## Cancellation and timeout
Cancellation and timeout are cooperative and phase-aware.

Rules:
- before side effects: terminate cleanly as `CANCELLED`/`TIMED_OUT`;
- during reversible staged work: stop and route to compensation/recovery as required;
- after irreversible/external effect: preserve the effect in the terminal classification and emit recovery/repair obligations;
- cancellation never erases evidence already required to explain what occurred.

## Idempotency and retry
Automatic retry is prohibited by default for mutation commands unless the command contract explicitly declares an idempotency/retry model.

A retry policy must define:
- retryable failure classes;
- maximum attempts;
- idempotency key or equivalent state binding where applicable;
- backoff/budget ownership;
- effect-detection rule before another attempt;
- evidence linking attempts.

Semantic failures, policy blocks, authorization denials, state conflicts and validation failures are not auto-retry candidates.

## Orchestration lifecycle
Application orchestrators may compose multiple typed use-cases, but must expose explicit child operation boundaries, inherited budgets, correlation, cancellation and compensation behavior. Hidden recursive router dispatch remains prohibited.

## Terminal state discipline
Exactly one terminal lifecycle classification must be emitted for the invocation. The terminal record may reference additional recovery/evidence state but cannot be silently rewritten after publication. Later recovery produces a linked follow-up record.

## Receipt timing
A successful mutation is not terminal until post-state verification and required receipt materialization complete. Evidence-only follow-up source commits are prohibited where an external receipt can represent the proof without mutating the reviewed source head.

## Failure containment
Unexpected internal faults are caught at application/operator boundaries, sanitized, classified and linked to diagnostic evidence. A handler failure cannot cause unrelated queued work to start unless orchestration policy explicitly permits independence.

## Token/time economy
Lifecycle structure reduces recurring model work by making phase, state and failure location machine-visible. Correction flows should be able to resume from the smallest valid boundary rather than replaying the whole operation. Deterministic phase receipts should prevent repeated questions such as whether preflight ran, whether mutation started, or whether verification finished.

## Candidate frozen decisions
1. Request-scoped lifecycle with explicit machine states and exactly one terminal classification.
2. `SUCCEEDED` is mechanical success, not automatic semantic/DoD approval.
3. Mutation handlers cannot execute before applicable preflight gates pass.
4. Cancellation/timeout behavior is phase-aware and preserves truthful external effects.
5. Mutation retries are opt-in and require explicit idempotency/effect-detection contracts.
6. Semantic/policy/state-conflict failures are never blindly retried.
7. Orchestrated child operations carry explicit parent correlation, budgets and compensation contracts.
8. Successful mutation requires verification + receipt before terminal success.
9. Immutable terminal receipt records are linked by follow-up recovery records rather than rewritten.
10. Lifecycle state is compact operational truth intended to reduce rediscovery and replay.

## Open questions before freeze
1. Should `BLOCKED` be terminal or a family with typed reason codes? Current direction: terminal family with typed reason codes, not dozens of lifecycle states.
2. Should read-only commands be allowed to skip explicit `READY` and enter execution after validation/preflight? Current direction: lifecycle may internally collapse zero-cost phases but receipts preserve logical phase completion.
3. Should recovery occur inside the same run ID or a linked recovery run? Current direction: automatic immediate compensation may remain in the same invocation; later/manual recovery is a linked new run.
4. Should receipts be append-only/immutable after terminal classification? Current direction: yes; corrections create linked records.
5. Should automatic retries ever cross a process restart? Current direction: no baseline support; durable retry/recovery belongs to later recovery modules and explicit contracts.

## Session completion gate
S03 may become FROZEN only when the five open questions are resolved, exact-head review passes, no conflict exists with S01/S02/Security/Architecture, checkpoint advances to GBS-M01-S04, and no functional implementation is introduced by this planning session.

STOP CONDITION: `M01_S03_REVIEW_REQUIRED`.
