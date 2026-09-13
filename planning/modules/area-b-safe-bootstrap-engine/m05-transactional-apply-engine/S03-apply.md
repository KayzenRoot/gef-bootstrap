# GBS-M05-S03 — Apply

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze the provider-neutral Apply contract for `GBS-M05 — Transactional Apply Engine`. S03 defines how an immutable S01 `TransactionPlan` transitions from validated intent into bounded operational effects through revalidation, recovery preparation, staging, staged verification, commit/promotion, post-state verification, receipt emission and cleanup.

S03 defines the logical transaction state machine and safety gates. It does not own physical filesystem containment/atomic-replace mechanics, rollback restoration policy, retry/idempotency semantics, Git mutation or hosted-provider execution.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M05_S03`;
- `GBS-M05-S01 — Transaction Plan` FROZEN;
- `GBS-M05-S02 — Dry Run` FROZEN;
- frozen Requirements, Architecture A5/A6, Security, Definition of Done and Test & Benchmark Plan;
- M01 deterministic lifecycle, cancellation, timeout and terminal-state contracts;
- M02 migration apply exact-state semantics;
- M03 identity transition apply exact-state semantics;
- M04 request-driven preflight and expected-state bindings;
- M06 ownership of physical path, symlink/reparse, staging-location, permission and atomic-replace safety;
- M36 ownership of broader durable recovery/resume workflows;
- M29 ownership of local Git mutation and M30+ ownership of hosted-provider mutation.

## Ownership boundary
M05-S03 OWNS:
- logical Apply state machine for one immutable `TransactionPlan`;
- apply-attempt / transaction-instance identity linkage to M01 run identity and S01 `planDigest`;
- final pre-effect revalidation gates;
- transaction journal semantic record and phase transitions;
- recovery-material readiness/capture gate before first target-visible managed effect;
- stage → verify staged state → commit barrier → promote → verify post-state sequence;
- logical intent execution ordering/dependency semantics;
- target-visible-effect boundary and commit-barrier semantics;
- partial-application classification and handoff to S04/M36;
- post-state verification requirement before mechanical success;
- compact Apply receipt/change manifest semantics;
- cancellation/timeout handling across pre-effect, staged and post-promotion phases;
- exact-state binding between plan, observed pre-state, applied result and receipt.

M05-S03 DOES NOT OWN:
- path traversal/symlink/junction/reparse/case-collision safety, staging root selection, fsync, rename/replace primitive implementation or permission semantics (M06);
- rollback/inverse restoration execution policy after target-visible effects (M05-S04, with M36 for broader recovery/resume);
- retry/idempotency policy, idempotency keys or replay semantics (M05-S05);
- Git add/index/branch/commit/history mutation mechanics (M29);
- GitHub/provider side-effect execution (M30+ and owning provider modules);
- provider saga compensation semantics beyond truthful handoff/declaration;
- semantic authorization/risk acceptance (Security/M16);
- proof graph, durable evidence ledger, audit ledger or telemetry storage (M24/M25/M44/M43);
- global integrity/hash policy (M37), though S03 consumes versioned digest/fingerprint capabilities.

## Frozen Apply contract

### APPLY-01 — Apply is the first mutation-capable phase
Apply is the first M05 session that may create governed operational or target-visible side effects.

The effective Security class is the highest class implied by the immutable plan and any admitted execution mechanism. S01's security floor may be raised by newly discovered execution facts but never lowered by S03.

No side effect may occur merely because a plan exists or a dry run returned `READY`.

### APPLY-02 — Apply consumes the exact immutable plan
Apply input is a supported, digest-valid S01 `TransactionPlan` identified by `planDigest`.

S03 MUST NOT silently:
- add/remove/reorder semantic intents;
- widen mutation surface;
- weaken expected-pre-state predicates;
- lower security class;
- remove authorization requirements;
- remove verification obligations;
- remove recovery requirements;
- rewrite external-effect declarations.

Any semantic change requires a new plan and new digest.

### APPLY-03 — Dry Run is optional evidence, never execution authority
When a S02 `DryRunReport` is supplied, S03 may use it as state-bound derived evidence to reduce duplicate work only while its dependencies remain valid.

A prior `READY` dry run does not authorize Apply, reserve state, lock the target, waive execution-time authorization or skip final revalidation.

If the report is stale, incompatible or absent, Apply executes the required current gates directly.

### APPLY-04 — Apply attempt identity is distinct from plan identity
Each accepted Apply invocation has:
- M01 `runId` for invocation/correlation;
- immutable S01 `planDigest` for semantic intent;
- a transaction-instance/journal identity when operational transaction state is created.

The transaction-instance identity MUST NOT alter `planDigest`. Multiple attempts against one plan are distinguishable without pretending they are different semantic plans.

### APPLY-05 — Transaction state machine is explicit
Baseline logical phases:

```text
ACCEPTED
-> VALIDATING_PLAN
-> REVALIDATING_PRE_STATE
-> AUTHORIZING
-> PREPARING_TRANSACTION
-> CAPTURING_RECOVERY
-> STAGING
-> VERIFYING_STAGED
-> COMMIT_BARRIER
-> PROMOTING
-> VERIFYING_POST_STATE
-> RECEIPTING
-> CLEANUP
-> APPLIED
```

Non-success paths route truthfully to one of:

```text
BLOCKED_BEFORE_EFFECT
ABORTED_STAGED_NO_TARGET_EFFECT
RECOVERY_REQUIRED
PARTIAL_EXTERNAL_EFFECT
FAILED_POST_STATE_VERIFICATION
```

These are Apply-domain outcomes projected into the frozen M01 terminal families; they do not replace M01's canonical terminal model.

### APPLY-06 — Operational effects and target-visible effects are distinct
S03 distinguishes:
1. **read-only pre-effect work** — validation/revalidation/authorization checks;
2. **private operational effects** — transaction journal creation, bounded recovery capture, staging data and temporary transaction metadata;
3. **target-visible managed effects** — promotion/replacement/removal/move that changes the governed target surface;
4. **external effects** — provider/adapter/Git effects owned by separate execution domains.

Private operational effects do not count as successful target mutation. A failure after staging but before target promotion must not be misreported as partially applied target state if the target is unchanged.

### APPLY-07 — No operational effect before minimum execution gates
Before creating transaction journal/staging/recovery material, S03 validates at minimum:
- supported plan contract/version and canonical digest;
- target binding structurally valid;
- mutation surface admitted;
- computed security floor consistent with effects;
- required execution capability available or explicitly represented as a gap;
- authorization prerequisites satisfied for the operation class;
- cancellation/deadline has not already fired.

Where a gate can be checked cheaply and deterministically before any operational write, it SHOULD be checked there.

### APPLY-08 — Exact relevant pre-state is revalidated before effects
Apply revalidates all declared pre-state predicates whose truth is required to begin the transaction.

A relevant mismatch yields `STALE`/conflict/block before mutation whenever technically possible. S03 cannot rely solely on an older M04 snapshot or dry-run report when the dependency can have changed.

Unrelated state need not be reread when dependency scope proves independence.

### APPLY-09 — Authorization is execution-time and target-bound
Capability does not equal authorization. S03 verifies the exact authorization/policy references required by the plan and Security class.

S4 remains action-specific and target-specific. Broad automation preference, available admin permission, previous dry-run visibility or a prior unrelated approval cannot substitute for the required S4 authorization.

Authorization material is referenced safely and never copied as secret payload into plan/receipt/journal.

### APPLY-10 — Transaction journal begins before private mutation state
When the operation requires recoverable operational state, S03 creates a transaction-instance record before or atomically with the first private operational write that must later be explained/recovered.

Logical journal fields include, as applicable:

```text
transactionId
runId
planDigest
targetBinding
securityClass
phase
preStateBindings
intentsProgress[]
recoveryRefs[]
stagedRefs[]
committedEffects[]
postStateBindings[]
terminalOutcome
```

The journal is operational state, not canonical source truth. Physical persistence/location/atomic update mechanics are delegated to M06/storage owners.

### APPLY-11 — Recovery material is captured before the effect it must reverse
For every `REVERSIBLE_MANAGED` target-visible effect, required pre-image/inverse/recovery material MUST be captured and verified sufficiently before the corresponding destructive/overwriting promotion occurs.

Recovery capture is bounded to the admitted affected surface. It must not become a whole-repository backup by default.

S03 proves readiness/capture; S04 owns restoration semantics after target-visible failure.

### APPLY-12 — Staging precedes target-visible promotion
Managed writes that require staged transactional semantics are materialized into an isolated transaction staging area before target promotion.

Staging content is not canonical target state and must not be mistaken for a completed mutation. M06 owns physical staging-root containment, same-filesystem constraints and safe temporary-path mechanics.

For an intent whose owning primitive is inherently atomic and does not require materialized staged content, the owning contract may represent an equivalent verified pre-promotion state, but S03 cannot skip the logical stage/verify barrier without explicit proof.

### APPLY-13 — Staged state must satisfy mandatory pre-promotion verification
Before reaching the commit barrier, all plan verification obligations classified as staged/pre-promotion checks must pass.

Examples include:
- staged content fingerprint;
- schema/contract validation;
- deterministic changed-target manifest;
- owning-module invariant;
- size/type/content-policy checks;
- M06 physical-safety readiness.

Validator availability is not equivalent to validator PASS.

### APPLY-14 — Commit Barrier is explicit and fail-closed
`COMMIT_BARRIER` is the final logical gate immediately before target-visible managed effects begin.

At the barrier S03 must prove, as applicable:
- plan/digest remains the admitted plan;
- target identity remains bound;
- relevant pre-state still satisfies required predicates or an owning concurrency primitive proves equivalent protection;
- authorization is still valid for the exact action/target;
- recovery material required before promotion is captured and valid;
- staged state passed all required pre-promotion checks;
- mutation surface has not expanded;
- cancellation/deadline policy permits crossing the barrier;
- no newly observed blocker requires replanning.

Failure at the barrier aborts before target-visible managed mutation.

### APPLY-15 — Final revalidation occurs as late as safely practical
Because target state can change between early preflight and promotion, S03 performs the strongest applicable final state check at or immediately before the commit barrier.

When M06/owning primitives provide compare-and-swap, lock, exclusive-open, version-token or equivalent race-resistant semantics, S03 consumes them rather than pretending a read-then-write sequence is race-free.

If safe concurrency control cannot be proven for a required target, the operation blocks or reports the gap rather than assuming no concurrent change occurred.

### APPLY-16 — Promotion follows deterministic dependency order
Target-visible managed intents are promoted according to S01's deterministic dependency graph/order.

Independent intents may be promoted concurrently only when:
- their target/recovery surfaces are proven independent;
- M06 safety semantics permit it;
- failure of one cannot make another's recovery ambiguous;
- post-state verification remains attributable;
- concurrency preserves the same semantic result as the deterministic plan.

Otherwise promotion is serialized.

### APPLY-17 — Every promoted effect is journaled before advancing
After each target-visible effect becomes observable, S03 records enough transaction progress to distinguish:
- not attempted;
- promoted/applied;
- verification pending;
- verified;
- failed after promotion.

A crash/interruption must not force later recovery code to guess whether an effect happened when the platform permits truthful effect detection.

The exact durable-write mechanism belongs to the operational storage/filesystem owner.

### APPLY-18 — Post-state verification is mandatory before success
After promotion, S03 evaluates all mandatory post-state verification obligations for the applied surface.

Mechanical `APPLIED` / M01 `SUCCEEDED` is forbidden until required post-state checks pass and the receipt can bind the observed result.

A mutation that happened but failed required post-state verification is not success. It routes to `FAILED_POST_STATE_VERIFICATION` and recovery/repair handling according to S04/M36 and effect class.

### APPLY-19 — Target-visible failure triggers truthful recovery handoff
If a managed target-visible effect occurred and the transaction cannot complete/verify, S03 does not erase history or rewrite the original attempt as “never happened”.

It records:
- which effects were observed/promoted;
- which verifications passed/failed;
- available recovery references;
- current observed state where safe;
- recovery-required reason.

S04/M36 then owns restoration/resume policy. The original M01 terminal record remains immutable.

### APPLY-20 — Never-promoted staging may be cleaned without pretending rollback
If failure/cancellation occurs after private staging/recovery preparation but before any target-visible managed effect, S03 may safely discard transaction-private staged material when the owning retention policy permits and the target is proven unchanged.

This is cleanup/abort, not rollback of target state.

Recovery material required to explain an interrupted/uncertain transaction is retained according to Security/M36 policy rather than eagerly deleted.

### APPLY-21 — Cancellation and timeout are phase-aware
Before private operational effects: terminate as ordinary M01 `CANCELLED`/`TIMED_OUT` with no recovery.

After staging/recovery capture but before target promotion: stop before the barrier where possible, preserve sufficient journal truth, clean transaction-private state only when safe.

After any target-visible or external effect: cancellation/timeout cannot pretend atomic abort. The result routes to recovery/partial-effect semantics and preserves evidence of what occurred.

Crossing a non-interruptible atomic primitive may defer cooperative cancellation until the primitive returns; the receipt must remain truthful.

### APPLY-22 — No-op does not open a mutation transaction
A valid no-op plan/result performs no staging, recovery capture, transaction target mutation or external effect.

S03 may emit a compact no-op execution receipt after revalidating the dependencies required to prove no change is still needed.

If no-op preconditions became stale, S03 blocks/replans instead of converting the old no-op plan into a mutation plan.

### APPLY-23 — Brownfield application touches only admitted surfaces
In EXISTING_PROJECT/BROWNFIELD mode, Apply mutates only the S01 admitted surfaces and preserves unrelated files, architecture, Git history, conventions and ungoverned legacy areas.

S03 never performs opportunistic repository cleanup, formatting, dependency upgrade or naming normalization outside the plan merely because it is already writing files.

### APPLY-24 — External effects remain sagas outside local atomic commit
Hosted-provider, adapter and Git side effects are not folded into the local filesystem atomicity claim.

If an orchestration includes external effects, each effect remains owned by its provider/Git adapter with explicit forward action, verification and compensation availability. S03 coordinates the declared ordering boundary but does not claim that local rollback can undo an external effect atomically.

If external effect succeeds and later work fails, M01 truthfully reports `PARTIAL_EXTERNAL_EFFECT` or equivalent mapped terminal state.

### APPLY-25 — Managed filesystem transaction and external saga ordering must be explicit
A plan/orchestrator that combines local and external effects must declare whether external effects occur before or after local managed promotion and why that order is safe.

S03 cannot improvise order at runtime. If no safe admitted ordering exists, Apply blocks rather than choosing one opportunistically.

S4/irreversible external effects require their own explicit authorization/disclosure regardless of local transaction state.

### APPLY-26 — Apply receipt is compact, exact-state-bound and immutable
On terminalization, S03 emits a machine-readable Apply receipt containing, as applicable:

```text
schemaVersion
applyContractVersion
runId
transactionId?
planDigest
targetBinding
securityClass
preStateBindings
appliedIntentResults[]
changedTargets[]
verificationResults[]
recoveryRefs[]
postStateBindings[]
externalEffectRefs[]
terminalOutcome
receiptDigest
```

The receipt excludes plaintext secrets, unnecessary full file contents, raw provider payloads and large recovery bodies.

Published terminal receipts are immutable. Corrections/recovery create linked records rather than editing history.

### APPLY-27 — Receipt digest excludes incidental execution noise
Receipt identity binds semantic execution truth and exact observed state but excludes incidental fields that should not change equivalence, such as human display prose or volatile telemetry counters.

Run/transaction identity remains recorded for provenance even where it is not part of semantic plan identity.

Owning schema/integrity modules may later refine canonical receipt hashing without weakening this requirement.

### APPLY-28 — Success requires cleanup policy disposition
After successful post-state verification and receipt materialization, transaction-private staging/recovery material is handled according to retention policy.

Disposable staging may be removed. Recovery material required until checkpoint/evidence promotion is retained until its owning policy permits garbage collection.

Cleanup failure after verified target success is reported truthfully as an operational gap/warning or recovery-state issue according to impact; it must not silently delete the success receipt or falsely report that target mutation failed if the target is verified correct.

### APPLY-29 — Apply does not auto-retry mutation failures
S03 performs one admitted execution attempt. It does not blindly rerun failed intents or the entire transaction.

Retry/replay is prohibited unless S05 later declares and proves the exact idempotency/effect-detection contract. A failure after uncertain effect state routes to recovery/effect detection first, never blind retry.

### APPLY-30 — Apply is bounded and smallest-sufficient
S03 reads/writes only the facts/surfaces required by the plan and transaction mechanics.

It does not rescan the whole repository, invoke unrelated providers, rerun all tool discovery or recalculate unrelated fingerprints by default.

Shared prerequisite checks execute once and are reused while valid. Independent preparation/verification may run concurrently only after dependencies are established and within resource bounds.

## Commit-barrier invariants
No target-visible managed effect may begin unless all applicable conditions hold:
1. supported immutable plan and valid `planDigest`;
2. exact target binding valid;
3. relevant pre-state predicates current or protected by an equivalent owning concurrency primitive;
4. mutation surface remains admitted and unchanged;
5. execution security class is not below any effect;
6. required authorization is valid for the exact action/target;
7. required recovery material for the next effect is captured/validated;
8. staged content/state satisfies required pre-promotion verification;
9. M06-owned physical safety requirements needed for promotion pass;
10. cancellation/deadline policy permits crossing the barrier;
11. external-effect ordering, if any, is explicit and admitted;
12. no unresolved blocker/staleness/conflict remains.

Any failed mandatory barrier invariant blocks target-visible promotion.

## Apply terminal truth
Baseline domain outcomes map into M01 terminal truth as follows:
- `APPLIED` → M01 `SUCCEEDED` only after post-state verification + receipt;
- `NOOP_APPLIED` → M01 `SUCCEEDED` with zero changed targets;
- `BLOCKED_BEFORE_EFFECT` → M01 `BLOCKED`;
- cancellation/timeout before target-visible effect → M01 `CANCELLED` / `TIMED_OUT` with target unchanged when proven;
- staged/private-only abort → appropriate M01 non-success terminal with no target effect and cleanup/recovery metadata;
- managed target effect with incomplete/failed restoration requirement → M01 `RECOVERY_REQUIRED`;
- external effect followed by incomplete workflow → M01 `PARTIAL_EXTERNAL_EFFECT`;
- unexpected internal failure → M01 `FAILED` unless effect state requires the stronger recovery/partial-effect terminal.

A weaker terminal label MUST NOT hide a known stronger recovery/partial-effect condition.

## Security and reliability invariants
- no mutation from plan/dry-run existence alone;
- immutable plan semantics throughout one attempt;
- exact target/pre-state/surface gates;
- authorization distinct from capability;
- transaction-private state is bounded and non-canonical;
- recovery material before the effect it must reverse;
- staged verification before promotion;
- explicit commit barrier;
- late revalidation / race-resistant primitive where required;
- post-state verification before success;
- no blind retry;
- no false local atomicity for provider/Git effects;
- secret-safe journal/receipt/recovery references;
- target-visible failure preserves immutable historical truth;
- brownfield unrelated surfaces remain untouched.

## Token/time economy invariants
- prior valid S02 observations may be reused only while exact dependencies remain current;
- cheap blockers and digest checks occur before expensive staging;
- one shared pre-state observation feeds all dependent intents where valid;
- staging/verification follows the dependency DAG instead of rediscovering order;
- independent safe preparation work may run concurrently;
- no-op bypasses transaction setup after required revalidation;
- compact fingerprints/manifests replace unnecessary content copies in receipts;
- post-failure recovery resumes from journaled effect boundaries rather than replaying whole reasoning;
- broader assurance is allowed to expand checks, but optimization never suppresses a required gate.

## Required future proof
Implementation must eventually prove:
1. Apply performs no side effect when plan validation fails;
2. dry-run `READY` cannot bypass execution-time revalidation/authorization;
3. plan semantic fields cannot be mutated in-place during Apply;
4. transaction/run/plan identities remain distinct and linked;
5. relevant pre-state mismatch blocks before first target-visible effect;
6. authorization failure blocks before mutation and S4 requires exact explicit authorization;
7. transaction journal semantics identify the exact plan/target/run before private mutation state needs recovery;
8. required managed recovery material is captured before the corresponding destructive promotion;
9. staging does not alter target-visible governed state;
10. staged verification failure prevents commit barrier crossing;
11. commit barrier rechecks all mandatory gates;
12. concurrency/race case cannot silently overwrite a changed target where owning compare-and-swap/lock semantics are required;
13. deterministic ordering produces the planned final state;
14. unsafe parallel promotion is rejected/serialized;
15. target-visible effect progress is detectable/journaled sufficiently for recovery handoff;
16. mandatory post-state verification failure cannot yield success;
17. post-promotion failure yields recovery-required truth with affected effects identified;
18. private-only staged abort can clean safely without claiming target rollback;
19. cancellation before effects differs from cancellation after target/external effects;
20. no-op opens no mutation transaction and changes no target;
21. brownfield Apply changes only admitted surfaces;
22. external/provider/Git effects remain non-atomic sagas and partial-effect truth is preserved;
23. combined local/external ordering is explicit and cannot be improvised at runtime;
24. Apply receipts bind exact plan/pre/post/change/verification state and exclude secrets/raw large payloads;
25. terminal receipts remain immutable after publication;
26. cleanup/retention policy cannot erase required recovery evidence prematurely;
27. failed mutation is not blindly retried before S05 idempotency/effect-detection policy;
28. Apply reads/writes only bounded plan-required facts/surfaces by default;
29. interruption fixtures cover each phase before/after the commit barrier;
30. Windows/Linux/macOS filesystem differences are delegated to M06 and cannot be assumed by S03 logical semantics;
31. M02 migration and M03 identity-transition delegated intents preserve their own apply invariants inside the M05 envelope;
32. exact post-state evidence is sufficient for later M24/M25 review without requiring full repository reread by default.

## Resolved freeze decisions
1. First side effect boundary: **private transaction operational state may begin only after minimum execution gates; target-visible state changes only after the explicit commit barrier**.
2. Final state protection: **revalidate as late as safely practical and consume race-resistant owning primitives where available; otherwise fail closed**.
3. Recovery capture: **must precede the exact managed effect it must reverse; whole-repository backup is not the default**.
4. Staging: **logical stage + staged verification is mandatory for managed writes unless an owning atomic primitive proves an equivalent pre-promotion state**.
5. Success: **requires post-state verification and receipt; mutation alone is never success**.
6. Failure after promotion: **immutable original attempt + recovery-required handoff; never rewrite history as if no effect happened**.
7. Private-only abort: **cleanup is not rollback when target state never changed**.
8. Cancellation: **phase-aware; after target/external effects it cannot manufacture atomic abort**.
9. External effects: **sagas outside local atomicity with explicit ordering and partial-effect truth**.
10. Retry: **S03 performs one attempt; blind retry is prohibited until S05 proves idempotency/effect detection**.
11. M06 boundary: **M05 owns logical transaction gates/state; M06 owns physical filesystem safety and atomic primitives**.
12. Brownfield: **only admitted targets are changed; no opportunistic normalization**.

## Session completion rule
This candidate becomes `FROZEN` only after exact-head semantic review and merge. Planning earns `0/20` M05 production weight. After checkpoint promotion, the next legal planning session is `GBS-M05-S04 — Rollback`. No M05 implementation Work Order may be compiled or admitted until S01-S05 and the M05 module gate are complete.

STOP CONDITION: `M05_S03_READY_FOR_EXACT_HEAD_REVIEW`.
