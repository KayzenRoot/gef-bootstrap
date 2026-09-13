# GBS-M06-S04 — Atomic Writes

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze the physical staging, final-effect, atomicity and durability contract for `GBS-M06 — Filesystem Safety`. S04 consumes the frozen S01 path-authority, S02 overwrite-policy and S03 traversal-safety contracts and defines the exact physical capability that M05 may consume at its commit barrier.

## Ownership
S04 owns private staging placement, same-filesystem requirements, final filesystem primitives, atomic visibility, crash-durability capability, phase-aware cleanup and the composed physical-safety capsule.

S04 does not own M05 transaction ordering/recovery/idempotency, M36 restart/orphan recovery, M37 global integrity policy, M51 platform support policy or M63 quantitative performance targets.

## Frozen decisions
1. **Composed safety only.** `FILESYSTEM_MUTATION_SAFE` requires current passing S01 + S02 + S03 + S04 evidence for one exact operation and target. No single path API or write primitive is sufficient.
2. **Atomic visibility is not crash durability.** A rename/replace may be visibility-atomic while persistence after crash remains unproven. Receipts must distinguish these guarantees.
3. **No false multi-file atomicity.** Per-target primitives may be atomic; an M05 transaction touching several targets is not presented as one physical atomic filesystem transaction.
4. **Private staging is bounded and non-canonical.** Staged/recovery material is transaction/intent-bound, excluded from project truth, and cannot be mistaken for completed target state.
5. **Staging is also governed.** Staging/recovery roots must pass the applicable S01-S03 rules. Repository content cannot redirect them to arbitrary locations.
6. **Same-filesystem proof is mandatory when the selected final primitive depends on it.** Cross-device/volume conditions block that guarantee. Silent copy-and-delete fallback is forbidden.
7. **Stage before promotion.** Content and required staged verification complete before any target-visible promotion.
8. **Late revalidation.** Immediately before the physical effect, root/path authority, overwrite decision, ancestry and target identity are revalidated or kept bound by a stronger race-resistant primitive.
9. **CREATE is no-clobber when absence is required.** Check-then-write is insufficient; the adapter must provide an exclusive/race-resistant create primitive or block.
10. **UPDATE/REPLACE uses staged replacement when partial-write, recovery or alias safety requires it.** Truncate-and-rewrite is not an equivalent fallback.
11. **DELETE preserves recovery semantics.** When M05 requires reversibility, the physical plan must preserve exact recovery material before logical removal. Irreversible removal is not substituted silently.
12. **MOVE is atomic only under a proven same-filesystem move/rename contract.** Cross-filesystem move is a higher-level multi-effect workflow, not one atomic move.
13. **Platform semantics are explicit.** Windows/Linux/macOS replacement, open-handle, directory and flush behavior may differ. Unsupported required guarantees become typed capability gaps.
14. **Durability ordering is explicit.** When crash durability is required, staged data/metadata and containing-directory state are synchronized in the order required by the platform contract. Ordinary close/rename alone does not manufacture durability.
15. **Post-effect durability failure is effectful truth.** If the target-visible effect occurred and a later required flush/verification fails, M05 receives recovery-required/partial-effect truth rather than `NO_EFFECT`.
16. **Metadata cannot broaden authority.** Required permissions/metadata are applied only as declared by owner policy. S04 never weakens permissions merely to make an operation succeed.
17. **Cancellation/timeout are phase-aware.** Before effect, private work may stop safely. During a non-interruptible primitive, cancellation may wait. After possible effect, cancellation/timeout cannot pretend atomic abort.
18. **Cleanup cannot erase recovery evidence.** Never-promoted disposable staging may be removed when safe; material needed to restore or explain an effect remains until owning retention policy permits deletion.
19. **No startup auto-recovery.** Import/startup performs no staging scan, orphan cleanup, pending promotion or automatic resume. M36 owns durable recovery/resume orchestration.
20. **Errors preserve effect certainty.** Failures distinguish pre-effect block, private-only failure, final-barrier stale state, applied effect, uncertain effect, post-effect durability/verification failure and cleanup-only failure.
21. **Post-state verifies the actual destination.** Pre-promotion staged verification does not replace final observation of the target state.
22. **Final capability is exact-operation-bound.** The physical-safety capsule binds root/target identity, operation, expected state, traversal/object dependencies, selected primitive, guarantee class and invalidation inputs. It cannot be reused for another target or stale state.
23. **M05 remains transaction authority.** M06 supplies truthful physical guarantees; M05 owns semantic commit order, authorization, journal truth, recovery, retry and terminal outcome.
24. **Platform adapters prove only what they can mechanically support.** Missing guarantees produce truthful degraded/blocking states rather than unsafe emulation.

## Required implementation proof families
Future M06 implementation must mechanically prove at least:
- S01 denial, S02 conflict or stale S03 proof prevents final effect;
- staging root safety and same-filesystem dependency;
- staged verification failure leaves target unchanged;
- race-resistant no-clobber create;
- staged replace without partial in-place mutation when required;
- reversible delete recovery binding;
- same-filesystem move and cross-filesystem non-atomic classification;
- parent/target identity race invalidation;
- alias-safe replacement behavior;
- atomic visibility vs durability classification;
- required data/directory synchronization or explicit gap;
- effectful handling of post-effect flush failure;
- phase-aware cancellation/timeout;
- cleanup retention correctness;
- no startup mutation/resume;
- exact effect-certainty errors;
- actual target post-state verification;
- secret/path-minimized evidence;
- bounded staging/flush/handle/cleanup work;
- exact-operation capability non-reuse;
- M05 integration without governance bypass;
- deterministic Windows/Linux/macOS fixtures plus later real-platform proof for every claimed production guarantee.

## Freeze audit
- S01 path authority preserved: PASS
- S02 overwrite/no-clobber preserved: PASS
- S03 traversal/alias proof preserved: PASS
- M05 transaction ownership preserved: PASS
- visibility atomicity vs crash durability separated: PASS
- false multi-file atomicity prohibited: PASS
- same-filesystem dependency explicit: PASS
- create/update/delete/move distinctions explicit: PASS
- post-effect failure truth preserved: PASS
- M36 recovery ownership preserved: PASS
- platform differences explicit: PASS
- no implementation introduced: PASS
- open S04 design decisions: 0

## Progress truth
M06 planning earns no production credit.
- earned remains `107 / 1088 = 9.83%`;
- remaining remains `981 / 1088 = 90.17%`;
- M06 earned: `0 / 18`;
- potential after approved M06 MODULE_DONE: `125 / 1088 = 11.49%`;
- denominator changed: `NO`.

STOP CONDITION: `M06_S04_FROZEN_CANDIDATE_READY_FOR_EXACT_HEAD_REVIEW`.
