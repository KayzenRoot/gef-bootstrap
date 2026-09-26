# GBS-M05-S05 — Idempotency

Status: `FROZEN`

## Purpose
Freeze the provider-neutral idempotency, replay and bounded-retry contract for `GBS-M05 — Transactional Apply Engine`. S05 defines how GEF determines whether a previously attempted mutation is safe to execute again, should collapse to a verified no-op/prior result, requires recovery first, or must block because prior effect state is uncertain.

Idempotency is an effect-safety property. It is not authorization, not permission to ignore stale state, and not a promise that every mutation can be retried.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M05_S05`;
- `GBS-M05-S01 — Transaction Plan` FROZEN;
- `GBS-M05-S02 — Dry Run` FROZEN;
- `GBS-M05-S03 — Apply` FROZEN;
- `GBS-M05-S04 — Rollback` FROZEN;
- M01 lifecycle rule: mutation retries are opt-in, require explicit idempotency/effect-detection contracts, semantic/policy/state failures are not blind retry candidates, and baseline automatic retry does not cross process restart;
- frozen Requirements, Architecture A5/A6, Security, Definition of Done and Test & Benchmark Plan;
- M06 physical filesystem safety/locking primitives;
- M36 broader durable recovery/resume/orphan-attempt ownership;
- M29/M30+ Git/provider effect-detection and idempotency capabilities where applicable.

## Ownership boundary
M05-S05 OWNS:
- idempotency semantics for M05 managed transaction attempts;
- distinction between semantic plan identity, idempotency scope and attempt identity;
- effect-state classification before replay/retry;
- safe duplicate-request handling;
- replay/no-op/prior-result outcomes;
- retry eligibility classes and bounded retry contract;
- in-flight duplicate/concurrent-attempt handling semantics;
- attempt-chain linkage and compact idempotency evidence;
- rules for reusing prior verified results without repeating effects;
- required interaction with authorization, staleness, rollback and external effect detection.

M05-S05 DOES NOT OWN:
- mutation planning (S01), dry-run semantics (S02), first Apply execution mechanics (S03) or rollback restoration mechanics (S04);
- physical filesystem lock/CAS implementation (M06);
- durable cross-process recovery scheduler/orphan-attempt discovery (M36);
- Git/provider-specific idempotency tokens or effect detection implementation (M29/M30+);
- authorization/risk acceptance policy (Security/M16);
- global cache/proof invalidation or audit storage (M24/M25/M37/M44);
- latency/backoff performance budgets beyond requiring bounded policies (M63).

## Frozen idempotency contract

### IDEMP-01 — Idempotency is effect equivalence, not repeated execution permission
An operation is idempotent only when repeating the admitted logical request under its declared idempotency contract cannot create an additional unintended effect and yields a state/result equivalent to the already accepted outcome.

A second request carrying the same plan identity MUST NOT automatically invoke S03 again.

### IDEMP-02 — Plan identity, idempotency scope and attempt identity remain distinct
S05 distinguishes:
1. `planDigest` — deterministic semantic identity of the S01 plan;
2. `idempotencyScope` — target/operation/version domain within which duplicate-effect reasoning is valid;
3. `runId` / `transactionId` — unique execution-attempt provenance.

`planDigest` is necessary evidence for same-intent comparison but is not, by itself, a reusable authorization token or proof of effect state.

### IDEMP-03 — Idempotency scope is target-bound and versioned
Idempotency comparison binds at minimum:
- canonical target/project/repository identity as applicable;
- `planDigest`;
- operation/intent contract versions;
- security/policy identities that change effect semantics;
- relevant provider/adapter operation identity where external effects exist.

An idempotency record from another repository/project/target MUST NOT suppress or authorize mutation here.

### IDEMP-04 — Effect detection precedes retry after any possible side effect
Before retrying an attempt that may have crossed the S03 first-effect boundary, S05 determines the prior effect state using journal/receipt/current-state/provider evidence.

Baseline effect states:
- `NO_EFFECT` — effect definitively did not occur;
- `FULLY_APPLIED_VERIFIED` — intended managed effect exists and required post-state verification passed;
- `FULLY_RESTORED_VERIFIED` — prior managed effect was rolled back to bound pre-state;
- `PARTIALLY_APPLIED` — some effects occurred, completion is incomplete;
- `PARTIALLY_RESTORED` — recovery is incomplete;
- `EXTERNAL_EFFECT_PRESENT` — external saga effect occurred and remains relevant;
- `IN_FLIGHT` — equivalent attempt is currently active;
- `UNKNOWN_EFFECT` — evidence cannot prove whether/how the effect occurred.

`UNKNOWN_EFFECT` is never a blind retry state.

### IDEMP-05 — Pre-effect failures may be retried only if the failure class is explicitly retryable
A failure proven to occur before any operational/target/external effect may be eligible for retry when:
- command contract opts into retry;
- failure class is declared transient/retryable;
- state/authorization/deadline are revalidated;
- bounded retry budget remains;
- retry cannot expand mutation surface or weaken assurance.

Validation errors, semantic conflicts, policy denials, authorization denials, stale plan state and unsupported contracts are not automatic retry candidates.

### IDEMP-06 — Verified already-applied state collapses to prior-result/no-op
If the same idempotency scope is proven `FULLY_APPLIED_VERIFIED` and the current state still satisfies the exact accepted post-state binding, S05 MUST NOT execute the mutation again.

It returns a duplicate/replay result such as `ALREADY_APPLIED`, linked to the original successful receipt/evidence.

This preserves one effect while allowing callers to safely repeat requests.

### IDEMP-07 — Verified desired state without prior receipt may still be no-op, not fabricated prior success
If current target state already equals the plan's desired post-state but no trustworthy prior execution receipt proves GEF caused it, S05 may classify the new request as a state-equivalent `NOOP` when the owning plan semantics allow that conclusion.

It MUST NOT fabricate an original transaction/run or claim historical authorship it cannot prove.

### IDEMP-08 — Fully restored prior attempt may become eligible for fresh Apply, not automatic replay
If S04 proves `FULLY_RESTORED_VERIFIED`, the old failed attempt remains failed/recovered.

A new Apply may be considered only after:
- plan/current pre-state still satisfies S01/S03 predicates;
- authorization is current;
- security/capability gates pass;
- retry/replay policy explicitly permits a new attempt;
- retry budget permits it.

The new attempt receives a new `runId`/transaction identity and links to the prior attempt chain.

### IDEMP-09 — Partial application requires recovery before retry
`PARTIALLY_APPLIED` blocks a new Apply attempt of the same semantic plan by default.

S04/M36 must first establish a safe known state through completion, restoration or explicit governed disposition. S05 does not “finish by retrying everything” because that could duplicate already-applied intents.

### IDEMP-10 — Partial restoration requires recovery completion/escalation before retry
`PARTIALLY_RESTORED` is not a clean pre-state. New Apply remains blocked until remaining recovery obligations are resolved or a new governed plan explicitly adopts the observed state.

### IDEMP-11 — Unknown effect state is a hard retry stop
When effect state is `UNKNOWN_EFFECT`, S05 returns `EFFECT_STATE_UNKNOWN` / `RECOVERY_REQUIRED` or equivalent and does not repeat the mutation.

A timeout, crash, lost response or missing receipt does not imply failure-before-effect. The system must detect effect or escalate.

### IDEMP-12 — In-flight duplicate requests do not launch competing mutation attempts
If an equivalent idempotency scope is currently `IN_FLIGHT`, a duplicate request MUST NOT start a second mutation transaction against the same effect surface unless an owning contract proves safe independent execution.

The duplicate returns/references an `IN_PROGRESS`/existing-attempt result or waits through an explicitly bounded coordination mechanism owned by the runtime/application layer.

S05 defines the semantic rule; M06/M36/storage layers own lock/lease persistence mechanics.

### IDEMP-13 — Concurrency scope follows affected surfaces, not only whole-project identity
Two different plans may execute concurrently only when their mutation/recovery surfaces and required state dependencies are proven independent.

Same project/repository alone does not always require global serialization, but overlapping target/effect surfaces must not be concurrently mutated unless an owning transactional primitive proves equivalence and safety.

### IDEMP-14 — Idempotency key cannot grant authorization
An idempotency token/key/record proves at most duplicate-request/effect identity under its contract.

It does not:
- authorize S1-S4 mutation;
- keep an expired authorization alive;
- waive target identity checks;
- waive current-state revalidation;
- waive recovery/verification requirements.

Execution-time Security policy remains authoritative.

### IDEMP-15 — Retry always revalidates plan/state/authorization before effects
Every eligible retry/new attempt re-enters the required S03 gates.

Prior dry-run/apply evidence may be reused only while exact dependencies remain valid. A retry does not inherit stale target/pre-state merely because the semantic plan is unchanged.

### IDEMP-16 — Retry policy is explicit and bounded
Any automatic retry-capable operation contract declares:
- retryable failure classes;
- maximum attempts;
- attempt budget/deadline ownership;
- backoff strategy or explicit no-backoff policy;
- effect-detection requirement before each subsequent attempt;
- idempotency scope/key semantics;
- terminal escalation condition.

Default mutation retry policy is `NO_AUTOMATIC_RETRY` unless the owning contract explicitly opts in.

### IDEMP-17 — Retry budget cannot override assurance
Exhausted budget stops retry. Available budget does not require retry.

A retry that would weaken assurance, obscure uncertain effects, exceed authorization or overwrite changed state is blocked regardless of remaining attempts/time.

### IDEMP-18 — Baseline automatic retries remain process-scoped
Consistent with M01, baseline automatic mutation retries do not cross a process restart.

After restart, in-memory ownership is invalid. Durable continuation/retry requires M36/state contracts to rediscover exact attempt/effect status and then re-enter S05 eligibility checks.

A process restart never turns `UNKNOWN_EFFECT` into `NO_EFFECT`.

### IDEMP-19 — Retry attempt identity is always new
Each actual re-execution receives a new M01 `runId` and, when needed, new S03 transaction identity.

Attempt records link through an immutable chain:

```text
idempotencyScope
planDigest
attempts[]
  runId
  transactionId?
  predecessorAttempt?
  effectState
  terminalOutcome
```

The chain preserves history rather than overwriting the first attempt.

### IDEMP-20 — Retry never mutates the original S01 plan in place
If current state or policy requires different intents/surface/order/recovery/verification semantics, the operation must replan and produce a new `planDigest`.

S05 cannot “adjust the old plan for retry” while retaining the old semantic identity.

### IDEMP-21 — Per-intent effect detection may narrow recovery/retry work
When a multi-intent transaction has explicit effect evidence, S05 may use per-intent states to avoid repeating already-verified effects and to direct recovery precisely.

However, S05 does not synthesize a partial new Apply plan automatically. If completion after partial application requires different semantics, it routes through governed recovery/replanning.

### IDEMP-22 — External effects require provider-owned idempotency/effect detection
For Git/provider/adapter effects, S05 consumes only explicit owning capabilities such as:
- provider-native idempotency key semantics;
- stable returned resource/effect identity;
- read-after-write effect detection;
- operation-specific duplicate lookup;
- compensation/terminal evidence.

Absence of a provider error does not prove no effect; retry after ambiguous external response requires effect detection first.

### IDEMP-23 — Provider-native idempotency tokens are namespaced and non-authoritative
Where a provider supports idempotency tokens, the token is scoped to exact provider/repository/operation semantics and stored/referenced without secrets.

It does not replace GEF plan/target/authorization/evidence checks and must not be reused across unrelated operations merely because the provider accepts the same string shape.

### IDEMP-24 — External effect already present returns duplicate-effect truth
If provider-owned evidence proves the intended external effect already occurred for the exact idempotency scope, S05 prevents duplicate forward action and returns/references the original effect identity.

Any remaining local workflow obligations continue separately. Existing external effect is not equivalent to complete whole-workflow success.

### IDEMP-25 — External unknown/partial effect blocks blind replay
If an external call timed out or failed ambiguously and the provider cannot prove whether the effect occurred, S05 blocks replay and reports an explicit external effect uncertainty/recovery gap.

S4/irreversible external actions receive no automatic retry merely because they are important to finish.

### IDEMP-26 — Idempotency records are derived operational state
Idempotency/attempt indexes accelerate duplicate detection but do not replace canonical plan, journal, receipts or current-state evidence.

A stale/tampered/missing idempotency index cannot manufacture success or suppress a required mutation. The system rebuilds/revalidates from authoritative evidence where possible or returns a gap.

### IDEMP-27 — Result reuse is exact-state-bound
Returning a prior successful result without re-executing effects is allowed only when:
- idempotency scope matches;
- original success evidence is valid;
- current relevant state still satisfies the result's validity predicates;
- no policy/contract change invalidates reuse.

If current state drifted, S05 reevaluates no-op/replan/recovery rather than returning stale success.

### IDEMP-28 — Receipts distinguish executed retry from suppressed duplicate
S05 evidence must distinguish at least:
- new execution attempt launched;
- duplicate request suppressed because original attempt still in progress;
- prior verified result reused;
- no-op because desired state already exists;
- retry blocked due to stale/conflict/policy/authorization;
- retry blocked due to partial/unknown effect;
- fresh retry admitted after verified restoration/no-effect.

This prevents token-saving shortcuts from hiding whether a mutation actually ran.

### IDEMP-29 — Same request after successful rollback is not “already applied”
When a prior Apply was fully restored, the target is back at pre-state. S05 MUST NOT return the old Apply success/effect result as if desired state remains present.

It either admits a fresh attempt under current gates or blocks/replans.

### IDEMP-30 — Idempotency cannot cross incompatible contract/policy versions silently
If plan/apply/rollback/provider semantics changed incompatibly, old idempotency evidence is not silently reused.

Compatible additive evolution may be accepted only through explicit compatibility rules. Unknown major/required semantics fail closed.

### IDEMP-31 — Brownfield duplicate handling never normalizes unrelated state
In EXISTING_PROJECT/BROWNFIELD mode, idempotency/effect detection observes only plan/effect dependencies needed to decide duplicate safety.

Unrelated legacy drift neither forces full re-execution nor becomes implicit cleanup work.

### IDEMP-32 — Retry and effect detection are bounded
Effect detection targets the smallest sufficient transaction/effect surface.

It does not full-scan the repository/provider by default. Shared state observations are reused while valid; independent read-only checks may run concurrently under bounded resource policies.

### IDEMP-33 — Idempotency evidence is secret-safe and compact
Attempt/idempotency records contain stable identities, digests, bounded state/effect references, reason/outcome codes and provider resource IDs where safe.

They exclude plaintext credentials, raw recovery bodies, full file contents and unnecessary provider payloads.

### IDEMP-34 — Terminal escalation is deterministic
Baseline retry decision precedence:

```text
INVALID/TAMPERED CONTRACT -> BLOCK
AUTH/POLICY/SECURITY DENIAL -> BLOCK
STALE/CONFLICTED PLAN STATE -> REPLAN_OR_BLOCK
IN_FLIGHT EQUIVALENT -> SUPPRESS_DUPLICATE
UNKNOWN/PARTIAL EFFECT -> RECOVERY_REQUIRED
FULLY_APPLIED_VERIFIED + VALID CURRENT POSTSTATE -> RETURN_PRIOR/ALREADY_APPLIED
DESIRED STATE EXISTS WITHOUT HISTORICAL PROOF -> NOOP_IF_OWNER_CONTRACT_ALLOWS
FULLY_RESTORED_VERIFIED -> FRESH_ATTEMPT_ELIGIBLE_AFTER_REVALIDATION
NO_EFFECT + RETRYABLE FAILURE + BUDGET -> RETRY_ELIGIBLE
OTHERWISE -> NO_AUTOMATIC_RETRY
```

All material findings remain available even when one primary decision is selected.

## Retry eligibility invariants
A mutation retry/new attempt based on prior history may proceed only when all applicable conditions hold:
1. same semantic plan or a newly admitted replacement plan is explicit;
2. exact target/idempotency scope matches;
3. prior effect state is known sufficiently for safe decision;
4. no unresolved partial/unknown effect remains;
5. current target/pre-state satisfies S03 requirements;
6. current authorization/security policy permits the new attempt;
7. retryable failure class is explicitly admitted when automatic retry is used;
8. retry budget remains;
9. no equivalent overlapping attempt is already in flight;
10. provider-specific effect/idempotency requirements pass where applicable;
11. recovery obligations from prior attempts are closed or explicitly governed;
12. M06/M36 concurrency/transaction safety prerequisites pass.

Failure of a mandatory invariant blocks mutation retry.

## Security and reliability invariants
- same plan does not automatically mean safe replay;
- effect detection precedes retry after possible effects;
- unknown/partial effect blocks blind replay;
- idempotency key is not authorization;
- retry revalidates state and authorization;
- automatic mutation retry defaults off;
- no retry across restart without durable recovery state;
- concurrent duplicates are suppressed/serialized safely;
- external provider idempotency is consumed only when explicitly guaranteed;
- prior receipt/state validity is checked before result reuse;
- attempt history is immutable and linked;
- brownfield unrelated state is untouched;
- compact evidence contains no secrets.

## Token/time economy invariants
- `planDigest` + bounded idempotency scope avoids semantic request re-analysis;
- prior exact receipts can suppress duplicate mutation when still valid;
- per-effect detection narrows recovery work;
- already-applied/already-restored/no-effect states short-circuit expensive execution;
- in-flight duplicate suppression prevents duplicate executor/CI/provider work;
- effect detection is smallest-sufficient rather than full repository scan;
- retries target explicitly retryable transient failure classes only;
- immutable attempt chains let later reviewers inspect deltas instead of reconstructing history.

## Required future proof
Implementation must eventually prove:
1. repeated identical request after verified success creates no second managed effect;
2. `planDigest` alone cannot authorize or trigger replay;
3. idempotency records cannot suppress work across different target identities;
4. pre-effect retry only occurs for explicitly retryable failures and within budget;
5. validation/policy/auth/stale/conflict failures are not blind auto-retried;
6. `FULLY_APPLIED_VERIFIED` returns prior/already-applied without mutation when current post-state remains valid;
7. matching desired state without historical receipt can become truthful no-op without fabricated authorship;
8. `FULLY_RESTORED_VERIFIED` may admit a new attempt only after full revalidation and new attempt identity;
9. partial application blocks fresh Apply until recovery/replan;
10. partial restoration blocks fresh Apply until recovery/replan;
11. unknown effect after timeout/crash never becomes blind retry;
12. equivalent in-flight duplicate launches no overlapping mutation attempt;
13. independent non-overlapping transactions may proceed without global project lock when proven safe;
14. idempotency key/token cannot bypass authorization/security checks;
15. every retry revalidates current target/pre-state/authorization;
16. automatic retry defaults to disabled absent explicit contract;
17. retry max-attempt/budget exhaustion stops additional attempts;
18. baseline automatic retry does not cross process restart;
19. each actual retry receives new run/transaction identity and links to predecessor;
20. retry cannot mutate old plan semantics under same digest;
21. per-intent effect evidence avoids duplicate effect without synthesizing unsafe partial replay;
22. provider-native idempotency/effect detection is required before external ambiguous retry;
23. provider idempotency tokens are namespaced to exact operation/target semantics;
24. proven existing external effect suppresses duplicate forward action;
25. external unknown effect blocks replay;
26. stale/tampered idempotency index cannot manufacture success or suppress required mutation;
27. prior-result reuse invalidates when relied-on current state/policy changes;
28. evidence distinguishes executed retries from suppressed duplicates/no-ops;
29. old Apply result is not reused as applied after verified rollback restored pre-state;
30. incompatible contract/policy versions invalidate silent idempotency reuse;
31. brownfield duplicate checks do not full-normalize unrelated legacy state;
32. effect detection remains bounded to relevant surfaces;
33. attempt/idempotency evidence excludes plaintext secrets and large raw payloads;
34. retry decision precedence is deterministic and preserves all material findings;
35. concurrency/interruption tests cover crash before effect, after effect before response, partial effect and recovery-complete cases;
36. local/provider duplicate scenarios prove no unintended double effect under supported contracts.

## Resolved freeze decisions
1. Core rule: **same semantic plan never means automatic replay; effect state must be classified first**.
2. Identity: **planDigest, idempotency scope and execution-attempt identity remain distinct**.
3. Default retry: **NO_AUTOMATIC_RETRY unless an owning mutation contract explicitly opts in with bounded policy**.
4. Unknown effect: **hard stop for blind retry; detect effect or escalate recovery**.
5. Verified success replay: **reuse prior result / ALREADY_APPLIED only while exact current validity predicates hold**.
6. Desired state without history: **truthful NOOP may be allowed without claiming GEF caused the existing state**.
7. Verified rollback: **may permit fresh attempt only after complete revalidation/new attempt identity**.
8. Partial state: **partial Apply or rollback requires recovery/replan before fresh execution**.
9. Concurrency: **equivalent in-flight request is suppressed; independent surfaces may run concurrently only with proof**.
10. Process restart: **baseline auto-retry never crosses restart; M36 durable recovery must rediscover exact state first**.
11. External effects: **provider-owned idempotency/effect detection required; ambiguous external response is never blind replayed**.
12. Authorization: **idempotency keys/records never grant or extend mutation authorization**.

## Freeze record
Candidate semantic review passed on PR `#96` for head `70c8c96cadb3fe7c25a1bb615a63fcdde3283ee3` with no HIGH/CRITICAL planning finding. The final `FROZEN` head must receive an exact-head semantic review before merge; that immutable reviewed-head binding is recorded in the PR review/checkpoint promotion rather than embedded self-referentially in this commit.

## Session completion rule
M05-S05 is `FROZEN` after final exact-head semantic approval and merge. Planning earns `0/20` M05 production weight. After checkpoint promotion, the next legal stage is the `GBS-M05 MODULE GATE` across S01-S05. No M05 implementation Work Order may be compiled or admitted before that module gate explicitly approves implementation readiness.

STOP CONDITION: `M05_S05_FROZEN_PENDING_FINAL_EXACT_HEAD_REVIEW`.
