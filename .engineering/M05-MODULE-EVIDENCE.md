# GBS-M05 — Transactional Apply Engine Evidence Bundle

Status: `MODULE_DONE_APPROVED`

## Governed increment
- Module: `GBS-M05 — Transactional Apply Engine`
- Work Order: `GBS-WO-M05-001`
- Implementation PR: `#103`
- Admitted implementation base: `6ce457d0cdd3c9dadc310570442460208c61141e`
- Exact reviewed/merged head: `0eea9b410755410cb8ae2e34042e6ccb87fae4c6`
- Exact implementation tree: `d740f3ef4f6ed3ea4a322b8969d8eaf5f5befa65`
- Squash merge: `3c93e4da5c12bd2ce5ed4ebfb8b809a256815c93`
- Exact-head GitHub Actions run: `34735379266`
- Exact-head CI job: `103665762102`
- Exact-head semantic review: `5189369291`
- Verdict: `APPROVED`

The squash merge incorporates the exact reviewed tree `d740f3ef4f6ed3ea4a322b8969d8eaf5f5befa65`.

## Delivered capability
M05 now implements the provider-neutral logical transaction engine inside the existing kernel boundary:
- versioned deterministic transaction plans and canonical `planDigest`;
- runtime-safe plan validation, mutation-surface checks, dependency DAG/conflict validation and security-floor anti-downgrade;
- explicit S4/irreversible authorization requirements;
- zero-effect Dry Run with READY/NOOP/BLOCKED/STALE/CONFLICT/INDETERMINATE truth;
- Apply orchestration through injected ports with execution-time authorization, recovery capture/verification, staging, staged verification, commit barrier, deterministic promotion, per-effect journal truth and mandatory post-state verification;
- fail-closed M06 physical-safety capability boundary with no physical filesystem implementation pulled forward;
- compact secret-safe Apply receipts;
- rollback from actual applied-effect truth using exact integrity-bound recovery material, recovery journal progress, current target-bound authorization and anti-clobber state ownership checks;
- guarded create/update/delete rollback plus versioned logical composite source/destination state for MOVE rollback;
- external Git/provider effects kept as separately owned sagas rather than false local atomicity;
- idempotency/effect-state decision semantics, duplicate suppression, prior-result/no-op decisions and blind-retry denial for unknown/partial effects;
- immutable retry-attempt linkage with exact predecessor effect-state binding, new run/transaction identity and `IN_FLIGHT` initial state.

## Ownership boundaries preserved
M05 does not implement M06 path containment/symlink/case/fsync/atomic replace primitives, M29 Git mutation, M30+ hosted-provider mutation, M36 durable cross-process recovery/orphan scheduling, M37 global integrity policy, M43/M44 telemetry/audit storage or M63 quantitative executor thresholds.

## Exact-head validation
Run `34735379266`, job `103665762102`, is bound to exact head `0eea9b410755410cb8ae2e34042e6ccb87fae4c6` and completed successfully.

Evidence:
- `npm ci --ignore-scripts`: PASS;
- dependency audit emitted by locked install: `0 vulnerabilities`;
- strict TypeScript build/typecheck work: PASS;
- complete repository deterministic tests: `180 PASS / 0 FAIL / 0 CANCELLED / 0 SKIP / 0 TODO`;
- workflow conclusion: `SUCCESS`.

Root scripts define `build` and `typecheck` as the same strict `tsc -b` command and `test` as that build plus the same `node --test tests/*.test.mjs` suite. The hosted `validate` run therefore mechanically performs the build/typecheck command and complete test suite without adding permanently redundant CI steps.

## Transaction / recovery proof
Mechanical coverage proves at least:
- invalid/tampered/malformed plans fail closed before effects;
- security floor cannot be caller-downgraded;
- S4/irreversible work requires explicit authorization declaration and action/target-bound authorization;
- Dry Run has zero journal/stage/recovery/target effects;
- relevant stale state and commit-barrier denial block before target mutation;
- missing physical-safety or recovery-verifier capability blocks fail-closed;
- recovery material is captured and verified before protected promotion;
- failure after target promotion is journaled as recovery-required before any next effect;
- cancellation/timeout distinguish pre-effect from post-effect truth;
- post-state verification failure cannot return success;
- brownfield unrelated state remains untouched;
- rollback validates Apply receipt truth and uses its own recovery journal;
- rollback verifies recovery material and current authorization at the effect boundary;
- update rollback refuses later edits;
- create rollback refuses deletion of replaced content;
- delete rollback refuses overwrite of independently recreated content;
- MOVE rollback consumes a versioned exact composite source/destination binding and blocks divergent endpoints;
- rollback cancellation/timeout preserves partial/unresolved truth;
- unknown/partial/external effect states block blind replay;
- in-flight duplicates are suppressed;
- verified prior success can return prior-result semantics;
- new retry/fresh attempts require exact scope/plan/predecessor state, new execution identity and begin `IN_FLIGHT`;
- normal receipt/journal/error projections do not copy test payload secret material.

## Corrected findings before approval
The implementation PR absorbed and retested all material findings discovered during review, including:
- strict TypeScript contract issues;
- superseded duplicate Apply/Rollback implementations;
- missing journal check immediately after visible promotion;
- rollback cancellation that could otherwise lose unresolved effects;
- insufficient runtime validation of JavaScript plan input;
- missing explicit compatibility policy for `COMPATIBLE` state;
- S4/irreversible plan admission without mandatory authorization declaration;
- recovery material capture without explicit verification;
- missing rollback-specific journal/effect-bound authorization proof;
- incomplete create/delete/MOVE anti-clobber proof;
- unversioned MOVE composite endpoint state;
- retry attempt linkage not sufficiently bound to predecessor effect state.

No unresolved HIGH or CRITICAL finding remains.

## Residual non-blocking ownership
- Physical OS/path/atomicity proof remains M06-owned and is represented by required fail-closed ports.
- Durable process-restart/orphan recovery remains M36-owned.
- Quantitative resource/latency/token thresholds remain M63-owned.
- A terminal journal-finalization failure after already verified target post-state is retained as an explicit operational evidence gap in the receipt rather than hidden or reclassifying a verified target mutation as nonexistent.

## Acceptance mapping
The implementation satisfies the frozen S01-S05 contracts, M05 Module Gate and the 40 Work Order acceptance criteria for the M05-owned logical transaction surface. M06 and later owners remain required before the complete product can claim physical mutation safety and full production acceptance.

## Production credit
Frozen M05 weight: `20`.

Promotion after approved implementation merge:
- previous earned: `87 / 1088 = 8.00%`;
- M05 earned: `20 / 20`;
- new earned: `107 / 1088 = 9.83%`;
- remaining: `981 / 1088 = 90.17%`;
- denominator changed: `NO`.

## Next-stage rule
After this Evidence Bundle, Module Gate, Work Order, Backlog and human/machine checkpoints are promoted and exact-head reviewed/merged, the next legal stage is `GBS-M06` planning only. M06 implementation is not admitted by M05 completion. Codex remains prohibited for Bootstrap construction absent a separately governed benchmark exception/ADR.

STOP CONDITION: `M05_MODULE_DONE_APPROVED`.
