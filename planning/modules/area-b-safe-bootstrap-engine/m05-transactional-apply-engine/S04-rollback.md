# GBS-M05-S04 — Rollback

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze the provider-neutral rollback/restoration contract for `GBS-M05 — Transactional Apply Engine`. S04 defines how a failed/interrupted S03 Apply may restore **GEF-managed target-visible state** from verified recovery material without overwriting unrelated/concurrent work, rewriting immutable execution history, or pretending external provider/Git effects are locally atomic.

Rollback is a new mutation activity. It is not a time machine, not a retry of Apply, and not evidence that the original Apply succeeded.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M05_S04`;
- `GBS-M05-S01 — Transaction Plan` FROZEN;
- `GBS-M05-S02 — Dry Run` FROZEN;
- `GBS-M05-S03 — Apply` FROZEN;
- frozen Requirements, Architecture A5/A6, Security, Definition of Done and Test & Benchmark Plan;
- M01 lifecycle rule: immediate in-transaction compensation may remain under the original run, while later/manual recovery uses a linked new run and never rewrites the original terminal record;
- M06 ownership of physical filesystem path/containment/symlink/replace primitives;
- M36 ownership of broader durable recovery/resume/orphan-transaction workflows;
- M29 ownership of Git mutation and M30+ ownership of hosted-provider mutation/compensation.

## Ownership boundary
M05-S04 OWNS:
- bounded restoration semantics for S03-managed target-visible effects;
- rollback eligibility and current-state ownership checks;
- restoration ordering derived from actually applied effects;
- recovery-material integrity/fitness requirements;
- exact pre-state restoration targets;
- same-run immediate compensation versus linked later recovery handoff semantics;
- managed-effect rollback outcomes and partial-rollback truth;
- post-rollback verification and rollback receipt semantics;
- conflict handling when current state has diverged since Apply;
- safe cleanup/retention handoff after verified restoration;
- separation of managed rollback from external saga compensation.

M05-S04 DOES NOT OWN:
- generating a new desired-state plan or retrying the original Apply (S01/S03/S05);
- idempotency/replay/retry policy (M05-S05);
- physical path/symlink/case/permission/atomic-replace implementation (M06);
- durable crash recovery discovery/resume across abandoned processes beyond the bounded transaction contract (M36);
- Git reset/revert/branch/history mechanics (M29);
- hosted-provider compensation execution (M30+);
- semantic risk acceptance/authorization policy itself (Security/M16);
- proof graph, durable audit ledger or telemetry storage (M24/M25/M44/M43).

## Frozen Rollback contract

### RB-01 — Rollback is a separate mutation operation
Rollback changes managed state and therefore inherits the highest applicable Security class of the restoration effects.

A rollback may be initiated automatically only when the original admitted policy/authorization explicitly covered the bounded recovery action and current safety predicates still pass. Otherwise a new authorization is required according to Security.

S4 recovery remains action-and-target-specific; broad automation preference cannot authorize it implicitly.

### RB-02 — Original Apply truth is immutable
Rollback never edits the original S03 Apply receipt/journal to claim the failed attempt ended differently.

The original attempt remains, for example, `RECOVERY_REQUIRED`, `FAILED_POST_STATE_VERIFICATION` or `PARTIAL_EXTERNAL_EFFECT` as observed.

Rollback/compensation creates linked recovery state/receipt proving what happened afterward.

### RB-03 — Immediate compensation and later recovery have distinct invocation identity
If S03 detects failure and performs immediate bounded managed compensation as part of the same still-live transaction, the compensation may remain under the original M01 `runId` and transaction identity with explicit recovery phases.

A later, manual, resumed or independently scheduled rollback uses a new M01 `runId` linked to:
- original `runId`;
- transaction identity;
- `planDigest`;
- failed Apply receipt/terminal record.

A new recovery run does not create a new semantic desired-state plan merely to restore the captured pre-state.

### RB-04 — Rollback consumes actual effect truth, not planned intent alone
Rollback scope is derived from S03 journal/effect evidence showing which managed target-visible effects were actually observed/applied.

Planned-but-never-promoted intents MUST NOT be “rolled back”.

If effect state is uncertain, S04 must perform bounded effect detection or hand off to M36 rather than guessing that an intent happened.

### RB-05 — Recovery material must be verified before use
A restoration action may consume only recovery material that is:
- bound to the exact original transaction/plan/target/effect;
- structurally valid under its versioned contract;
- integrity-checked/fingerprint-bound where applicable;
- complete enough for the claimed restoration;
- still available under retention policy;
- safe to use without exposing secrets or unrelated repository content.

Missing, corrupt, mismatched or ambiguous recovery material blocks automatic restoration of the affected effect.

### RB-06 — Rollback restores the bound pre-state, not a recomputed approximation
For each reversible managed effect, the restoration target is the exact pre-state captured/bound before that effect, subject to the owning recovery representation.

Rollback MUST NOT regenerate “what the old file probably looked like” from templates, current defaults, model inference or newer source files when exact recovery material was required.

If exact restoration is impossible, the outcome is a truthful recovery gap/conflict, not fabricated success.

### RB-07 — Current-state ownership check prevents clobbering later work
Before reversing any target-visible effect, S04 verifies that the current target state is still safely attributable to the original transaction or is already at the exact intended pre-state.

Baseline rule:
- current state equals the transaction's verified post-effect state → restoration may proceed;
- current state already equals the captured pre-state → effect is already restored/no-op for that target;
- current state differs from both pre-state and transaction post-state → `ROLLBACK_CONFLICT`; do not overwrite automatically.

An owning concurrency/version primitive may provide an equivalent stronger proof.

This rule prevents rollback from destroying user/tool changes made after the failed Apply.

### RB-08 — Created-target rollback is guarded delete
For an effect that created a previously absent managed target, rollback may remove it only when current state proves it is still the exact transaction-created state (or an owning equivalent identity).

If the created target was modified/replaced afterward, rollback blocks for that target rather than deleting later work.

Physical safe-delete/path semantics belong to M06.

### RB-09 — Updated/replaced-target rollback is guarded restoration
For an effect that replaced or updated an existing managed target, rollback may restore the captured pre-image only when current state still matches the exact transaction post-state or another owning version guard proves safe replacement.

If current state diverged afterward, automatic restoration blocks.

### RB-10 — Deleted-target rollback is guarded recreation
For an effect that deleted a managed target, rollback may recreate the captured pre-state only when the target is still absent and the recovery material is valid.

If another actor recreated/occupied the target, rollback blocks rather than overwriting it.

### RB-11 — Move/rename rollback validates both endpoints
For a managed move/rename, rollback may reverse the move only when source/destination state matches the transaction's expected post-effect configuration and restoration will not overwrite independently created content.

Ambiguous occupancy, case-collision or path-resolution safety is delegated to M06 and blocks automatic rollback when unresolved.

### RB-12 — Rollback order is reverse effect dependency order by default
Actually applied managed effects are restored in reverse of their committed dependency/order sequence unless an owning contract proves a different order is required for safety.

This preserves dependent preconditions such as restoring children/resources before their parent container or reversing a sequence of related transformations.

Independent restorations may execute concurrently only when their target/recovery surfaces are proven independent and failure cannot make remaining restoration ambiguous.

### RB-13 — Rollback has its own commit barrier per restoration effect/batch
Before each restoration effect or proven-safe atomic batch, S04 revalidates:
- original transaction/effect identity;
- current-state ownership predicate;
- recovery-material integrity/fitness;
- target binding and admitted recovery surface;
- applicable authorization/security class;
- M06 physical-safety prerequisites;
- cancellation/deadline state;
- no new conflict.

A failed rollback barrier blocks before that restoration mutation.

### RB-14 — Recovery surface is bounded to effects of the failed transaction
Automatic rollback may mutate only surfaces proven to have been affected by the original managed transaction and required to restore them.

It cannot opportunistically repair unrelated project drift, normalize brownfield files, clean Git state, upgrade dependencies or modify neighboring artifacts.

### RB-15 — Rollback of one effect does not imply whole-transaction recovery
Each restoration result is journaled separately. A transaction can end with:
- every required managed effect restored;
- only some effects restored;
- no effect safely restorable;
- managed state restored but external effects outstanding.

S04 must preserve these distinctions rather than collapsing all non-perfect cases into a generic success/failure flag.

### RB-16 — Baseline managed rollback outcomes are explicit
Representative domain outcomes:
- `RESTORED` — all required managed target-visible effects restored and verified;
- `ALREADY_RESTORED` — current state already equals required pre-state for all relevant managed effects;
- `PARTIALLY_RESTORED` — some effects restored, at least one remains unresolved/conflicted;
- `ROLLBACK_CONFLICT` — later/divergent state prevents safe automatic overwrite;
- `RECOVERY_MATERIAL_INVALID` — required recovery data unavailable/corrupt/mismatched;
- `ROLLBACK_FAILED` — attempted restoration failed;
- `EXTERNAL_COMPENSATION_REQUIRED` — managed restoration is complete/known but external saga effects remain;
- `RECOVERY_ESCALATION_REQUIRED` — bounded S04 cannot establish a safe terminal state and M36/manual recovery is required.

These project into M01 recovery terminal truth; they do not replace the frozen M01 lifecycle families.

### RB-17 — Managed rollback cannot promise external compensation
Provider, adapter and Git effects remain external/specialized domains.

S04 may coordinate or reference a declared compensation step, but it MUST NOT claim that restoring local files reverses:
- a pushed commit;
- opened/updated PR/issue/release;
- provider settings/rulesets;
- external API state;
- adapter-side irreversible work.

External compensation execution/verification remains owned by M29/M30+/adapter owners and may itself fail or be impossible.

### RB-18 — External compensation is a saga with truthful residual effects
When an external effect has a compensating action, recovery records:
- original external effect identity;
- compensation capability/authorization;
- attempted compensation;
- observed compensation result;
- residual/irreversible effect if any.

A successful compensating action is not described as proof that the external world is bit-for-bit identical to its original state unless the provider contract proves that claim.

### RB-19 — Rollback does not retry the failed Apply
After restoration, S04 stops at the recovery terminal state. It does not automatically re-run the original plan.

A future retry requires S05 idempotency/effect-detection rules plus fresh preflight/authorization and any required replanning.

Restoration success is therefore a recovery result, not a hidden Apply retry.

### RB-20 — Post-rollback verification is mandatory
A managed effect is `RESTORED` only after S04 verifies the restored target against the captured/bound pre-state predicate.

Writing recovery material without verifying the resulting state is not successful rollback.

If verification fails after a restoration mutation, the transaction remains recovery-required and evidence must state the observed mismatch.

### RB-21 — Already-restored detection is read-only and safe
If current state already satisfies the exact pre-state binding, S04 records that effect as already restored and performs no target mutation.

This observation is not general S05 replay/idempotency policy; it is the minimum effect-detection needed to avoid corrupting an already recovered target.

### RB-22 — Rollback journals progress before advancing
After each restoration effect becomes observable, S04 records enough progress to identify:
- effect selected for rollback;
- pre-rollback observed state binding;
- recovery reference used;
- restoration attempted/not attempted;
- post-restoration verification result;
- remaining unresolved effects.

A crash during rollback must not force a later recovery flow to guess which restoration actions occurred when effect detection can prove them.

### RB-23 — Cancellation and timeout remain phase-aware during rollback
Before any rollback mutation, cancellation/timeout may terminate the recovery attempt while preserving the original recovery-required state.

After one or more restoration effects, cancellation/timeout yields truthful partial-recovery state. It cannot revert the recovery record to “not started”.

If stopping would leave an unsafe intermediate state, an owning non-interruptible primitive may finish its atomic restoration unit before honoring cancellation.

### RB-24 — Rollback failure cannot erase successful restoration progress
If a later restoration effect fails, earlier verified restorations remain recorded as restored.

S04 does not reapply them blindly or roll them forward again merely to make the transaction uniform. Remaining work is narrowed to unresolved effects.

### RB-25 — Recovery material remains private and minimally retained
Recovery/pre-image material is private operational state and is never promoted into canonical project truth merely because rollback used it.

Receipts carry bounded references/fingerprints, not full sensitive file contents where avoidable.

After verified restoration and evidence/checkpoint requirements are satisfied, retention/garbage collection follows Security/M36 policy. Unresolved/failed recovery material is retained until disposition rather than silently deleted.

### RB-26 — Secret-sensitive recovery does not leak through diagnostics
Rollback errors, receipts and logs MUST NOT echo plaintext credentials or sensitive content captured in recovery material.

When sensitive state is involved, diagnostics identify target/effect/category/fingerprint as sufficient for safe troubleshooting without reproducing secret bytes.

### RB-27 — Rollback receipts are append-only and exact-state-bound
A recovery attempt emits a machine-readable receipt such as:

```text
schemaVersion
rollbackContractVersion
recoveryRunId
originalRunId
transactionId
planDigest
targetBinding
securityClass
rollbackEffectResults[]
recoveryRefs[]
preRollbackStateBindings[]
postRollbackStateBindings[]
externalCompensationRefs[]
terminalOutcome
receiptDigest
```

The original Apply receipt remains immutable. Each later recovery attempt creates a new linked receipt.

### RB-28 — Recovery evidence distinguishes restored target from repaired workflow
`RESTORED` means the bounded managed surface satisfies the captured pre-state after verification.

It does not mean:
- the original Apply succeeded;
- external effects were undone;
- the entire project/repository is globally healthy;
- the failed task is now semantically complete;
- the same plan is safe to retry.

Those conclusions require their owning evidence/policy.

### RB-29 — Brownfield rollback preserves unrelated concurrent/legacy state
In EXISTING_PROJECT/BROWNFIELD mode, rollback is especially conservative: only exact transaction-owned changed targets may be restored.

Unrelated legacy drift is not a rollback defect. Later changes to the same target are conflicts unless safe ownership/version proof shows they are still the transaction state.

### RB-30 — Recovery escalation is explicit when bounded rollback is insufficient
S04 escalates to M36/manual recovery when, for example:
- effect state cannot be determined safely;
- recovery material is missing/corrupt;
- current target diverged after Apply;
- physical restoration safety is unavailable;
- external effects require broader coordination;
- process restart/orphan journal semantics exceed the bounded transaction contract;
- repeated rollback attempts need durable orchestration;
- restoration cannot produce a proven safe state.

Escalation is a truthful terminal outcome, not failure to “try harder”.

### RB-31 — Rollback is bounded and smallest-sufficient
Recovery observes only affected targets, exact recovery dependencies and required external effect references.

It does not full-scan the repository by default. Effect detection, hashing and verification remain bounded to the transaction's affected surface unless uncertainty explicitly requires expansion.

Independent read-only recovery checks may run concurrently; mutation concurrency obeys RB-12 safety rules.

### RB-32 — Rollback cannot weaken immutable security/evidence rules
Recovery urgency does not authorize:
- path/symlink bypass;
- force/reset/history rewrite by default;
- secret leakage;
- surface expansion;
- authorization downgrade;
- fabricated effect detection;
- deletion of required evidence;
- treating unknown as restored.

Emergency stop/deny may occur, but unsafe mutation is not justified merely because the transaction is already broken.

## Rollback eligibility invariants
An automatic managed restoration effect may proceed only when all applicable conditions hold:
1. original Apply/transaction/effect identity is known;
2. effect was actually observed/promoted or current state proves restoration is already complete;
3. recovery material is exact, available and integrity-valid;
4. current-state ownership predicate proves no later unrelated change will be overwritten;
5. restoration target is within the bounded transaction recovery surface;
6. security class/authorization permits the recovery action;
7. M06 physical-safety requirements pass;
8. restoration order/dependencies are satisfied;
9. cancellation/deadline permits the atomic recovery unit;
10. no unresolved conflict requires escalation.

Failure of a mandatory invariant blocks that restoration effect and is recorded truthfully.

## Security and reliability invariants
- original failed Apply history is immutable;
- rollback mutates only transaction-owned affected surfaces;
- current-state ownership check prevents clobbering later work;
- exact recovery material, never inferred approximation;
- reverse dependency order by default;
- per-effect rollback barrier;
- mandatory post-rollback verification;
- partial recovery is explicit;
- external compensation is non-atomic and separately verified;
- no automatic Apply retry;
- sensitive recovery content remains private;
- unresolved recovery evidence is retained;
- brownfield unrelated state remains untouched.

## Token/time economy invariants
- journal/effect map identifies the smallest recovery surface without rediscovery;
- already-restored detection avoids unnecessary writes;
- exact pre/post fingerprints avoid rereading full content where sufficient;
- reverse dependency ordering comes from recorded Apply truth, not model reconstruction;
- verified restored effects are carried forward and not reprocessed;
- conflict short-circuits unsafe restoration early;
- independent read-only checks may run concurrently;
- broader M36 escalation happens only when bounded S04 evidence cannot establish safety.

## Required future proof
Implementation must eventually prove:
1. rollback never rewrites the original Apply terminal receipt;
2. immediate compensation versus later linked recovery uses the correct run identity semantics;
3. planned-but-not-applied intents are never rolled back;
4. uncertain effect state triggers detection/escalation rather than guessed restoration;
5. corrupt/mismatched recovery material blocks restoration;
6. exact captured pre-state is restored rather than recomputed approximation;
7. current state equal to transaction post-state permits restoration;
8. current state already equal to pre-state yields no-op/already-restored;
9. current state diverged from both pre/post blocks automatic overwrite;
10. created-target rollback cannot delete later-modified/replaced content;
11. updated-target rollback cannot overwrite later edits;
12. deleted-target rollback cannot overwrite a newly recreated target;
13. move rollback validates both endpoints and collision safety;
14. default restoration order reverses actual committed effect dependency order;
15. unsafe parallel rollback is rejected/serialized;
16. per-effect rollback barrier revalidates target/recovery/authorization/safety;
17. rollback surface cannot expand outside transaction-owned affected targets;
18. partial rollback remains distinguishable from complete restoration;
19. local managed restoration cannot claim external/provider/Git compensation success;
20. external compensation records residual effects truthfully;
21. rollback never automatically retries original Apply;
22. post-rollback verification is required before `RESTORED`;
23. verified already-restored effects are not rewritten;
24. rollback interruption preserves already completed restoration progress;
25. later rollback failure does not erase earlier verified restoration evidence;
26. recovery material/diagnostics do not leak plaintext secrets;
27. rollback receipts bind original run/transaction/plan plus exact restored state;
28. `RESTORED` does not imply task/Apply/global-project success;
29. brownfield rollback never normalizes unrelated legacy state;
30. M36 escalation occurs when durable/orphan/ambiguous recovery exceeds S04 bounds;
31. bounded recovery does not full-scan unrelated repository state;
32. Windows/Linux/macOS physical restoration differences are delegated to M06 rather than assumed by S04 logical semantics;
33. interruption fixtures cover rollback before first effect, mid-restoration and after managed restoration with external effects outstanding;
34. security-class/authorization cannot be downgraded because operation is labeled recovery.

## Resolved freeze decisions
1. Rollback authority: **new mutation activity; automatic only when original admitted policy explicitly covers bounded recovery and current safety predicates pass**.
2. Historical truth: **original Apply receipt/terminal state is immutable; rollback creates linked recovery evidence**.
3. Restoration source: **exact captured/bound pre-state, never recomputed approximation**.
4. Anti-clobber rule: **restore only when current state is the transaction post-state or already the exact pre-state; divergent later state conflicts**.
5. Ordering: **reverse actual committed dependency order by default; concurrency only for proven-independent recovery surfaces**.
6. Verification: **post-rollback exact-state verification required before `RESTORED`**.
7. Partial recovery: **first-class truthful outcome; verified restored work is preserved**.
8. External effects: **separate compensation sagas; local rollback cannot promise atomic external reversal**.
9. Retry boundary: **rollback stops after recovery result; original Apply is never silently retried**.
10. M36 boundary: **S04 owns bounded transaction restoration; M36 owns broader durable/orphan/resume recovery orchestration**.
11. Brownfield: **later edits and unrelated legacy state are protected from rollback overwrite**.
12. Security: **recovery urgency never lowers S0-S4, path, secret, evidence or authorization controls**.

## Session completion rule
This candidate becomes `FROZEN` only after exact-head semantic review and merge. Planning earns `0/20` M05 production weight. After checkpoint promotion, the next legal planning session is `GBS-M05-S05 — Idempotency`. No M05 implementation Work Order may be compiled or admitted until S01-S05 and the M05 module gate are complete.

STOP CONDITION: `M05_S04_READY_FOR_EXACT_HEAD_REVIEW`.
