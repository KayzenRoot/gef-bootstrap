# GBS-M06 — Filesystem Safety Evidence Bundle

Status: `MODULE_DONE_APPROVED`

## Governed increment
- Module: `GBS-M06 — Filesystem Safety`
- Work Order: `GBS-WO-M06-001`
- Work Order compilation PR: `#115`
- Work Order compiled reviewed head: `6e59eea69e9b3bddc51c0647ee0f0ecb919a74d1`
- Work Order compilation merge: `c6c2d7cc7b5a02d8fca2a14dc240870dab3267e7`
- Admission checkpoint PR: `#116`
- Exact admitted implementation base: `533b5d7b2ccec9036268d605bd844a2633df933b`
- Implementation PR: `#117`
- Exact reviewed/merged head: `5ae4404db34447ad4d08eefc22ea0b0ad2ca89c2`
- Exact implementation tree: `e17b23c59f05785ab0cf1ccaebfd2608af3f3a70`
- Squash merge: `7e92051e9a675f05bee27e830fd2486fce4a2bbd`
- Exact-head semantic review: `5190387172`
- Verdict: `APPROVED`

The squash merge incorporates the exact reviewed implementation tree above. Production credit is awarded only by the separate module-done promotion containing this bundle and the synchronized checkpoints.

## Delivered capability
M06 now supplies the provider-neutral physical filesystem safety layer consumed through the existing M05 effect boundary:
- explicit root/path authority with POSIX and Windows component-aware normalization;
- default-deny path traversal, no cwd/home/writability-derived authority and no root mutation by default;
- exact create/update/remove/move occupancy and overwrite semantics;
- destructive ownership plus exact current-state requirements;
- race-resistant CREATE no-clobber requirements;
- independent MOVE source/destination authority and state proofs;
- no-follow ancestry/target proof with opaque identity tokens;
- symlink, junction, reparse, unknown-reparse and mount/volume fail-closed handling;
- hard-link alias-risk classification;
- governed transaction-private staging authority;
- same-filesystem binding for primitives that depend on it;
- explicit atomic-visibility versus crash-durability capability classes;
- staged verification before promotion and actual destination verification after promotion;
- commit-barrier revalidation of target/source identities, policy/path semantics, primitive capability, staging authority and filesystem identities;
- exact recovery-reference retention through cleanup;
- M05-compatible restore semantics for CREATE, UPDATE, REMOVE and MOVE;
- cancellation/deadline propagation to physical observations and effects;
- bounded brownfield behavior and import/startup filesystem purity.

## Exact-head validation
### Repository validation
`m01-validation` run `34750998852`, job `103707405206`, exact head `5ae4404db34447ad4d08eefc22ea0b0ad2ca89c2`: `SUCCESS`.

Evidence:
- `npm ci --ignore-scripts`: PASS;
- dependency audit: `0 vulnerabilities`;
- strict TypeScript typecheck/build path: PASS;
- complete deterministic repository suite: `233 PASS / 0 FAIL / 0 CANCELLED / 0 SKIP / 0 TODO`.

### Real platform matrix
`m06-platform` run `34750998868`: `SUCCESS` on the same exact head.

Jobs:
- Ubuntu/Linux `103707405502`: PASS;
- Windows `103707405516`: PASS;
- macOS `103707405393`: PASS.

All three prove locked install, dependency audit, typecheck/build and focused deterministic plus real temporary-filesystem M06 tests. Ubuntu also executes full `npm test && npm run validate`.

## S01 Allowed Paths proof mapping
Mechanical coverage proves:
- target authority is explicit-root and root-relative;
- absolute targets, parent traversal, Windows drive-relative/UNC/device-like ambiguity and reserved names fail closed;
- operation capability is exact and cannot be inferred from writable state;
- overlapping physical roots remain distinct authority bindings;
- canonical project and private roots remain distinct even when nested;
- root mutation is denied by default;
- path logic is deterministic under injected POSIX/Windows semantics.

## S02 Overwrite Policy proof mapping
Mechanical coverage proves:
- CREATE is no-clobber and divergent pre-existing targets conflict;
- desired-state no-op does not manufacture authorship;
- UPDATE/RESTORE require ownership plus exact current-state evidence;
- REMOVE absence is a no-op only when explicitly admitted;
- MOVE source and destination decisions are independent;
- destination replacement requires separately admitted exact state;
- target link-like objects cannot be converted into ordinary destructive overwrite authority.

## S03 Symlink Safety proof mapping
Mechanical coverage proves:
- ancestry is an ordered component chain with opaque identity binding;
- filesystem/mount identity is observable or the operation blocks;
- mount/volume drift and target filesystem drift fail closed;
- symlink/junction/classified reparse ancestors block managed traversal;
- unknown reparse tags are explicit capability gaps;
- final link-like target is not dereferenced by ordinary mutation;
- hard-link alias risk is surfaced;
- missing targets use nearest-existing-ancestor evidence without fabricated realpath state;
- ancestor replacement by a link between initial proof and commit barrier blocks before promotion;
- import/startup performs no traversal mutation or cwd change;
- brownfield unrelated files remain untouched.

## S04 Atomic Writes proof mapping
Mechanical coverage proves:
- S01-S04 results must bind the same exact operation and target;
- race-resistant primitives are mandatory;
- CREATE requires a real no-clobber primitive;
- UPDATE/RESTORE require exact replacement capability;
- hard-link alias risk cannot silently degrade to unsafe in-place mutation;
- same-filesystem requirements are mechanically bound and cross-filesystem use blocks;
- atomic visibility is not treated as crash durability;
- staged verification failure leaves target unchanged;
- reversible removal preserves recovery material before logical deletion;
- same-filesystem move and cross-filesystem capability are distinct;
- actual post-state is re-observed;
- cleanup is told which recovery references must survive;
- failure after a target-visible promotion becomes `RECOVERY_REQUIRED`, never `NO_EFFECT`;
- CREATE/REMOVE/MOVE and UPDATE all traverse the same M06 adapter boundary and rollback mappings are mechanically covered.

## M05 integration proof
The adapter conforms to the existing `TransactionEffectPort`; M06 does not create a parallel transaction lifecycle.

Proof includes:
- physical capability absence or stale physical state blocks before effect;
- recovery capture/verification precedes protected promotion;
- staged verification precedes commit barrier;
- commit barrier re-runs current physical proof;
- authorization/journal/semantic commit order remain M05-owned;
- no double effect is introduced by M06;
- post-state mismatch cannot produce M05 success;
- CREATE rollback removes only the transaction-created target;
- REMOVE rollback recreates the admitted prior target;
- MOVE rollback reverses independently proven endpoints;
- later user/tool state remains protected by M05 rollback anti-clobber semantics.

## Corrected findings before approval
All material findings discovered during implementation/review were corrected and retested before the exact approved head, including:
- strict `exactOptionalPropertyTypes` integration defects;
- invalid typed-error fixture token;
- unbound staging authority;
- staging/destination filesystem identity not participating in commit-barrier invalidation;
- mount/filesystem boundary evidence gaps;
- unknown Windows reparse classification gap;
- physical-port cancellation/deadline context not propagated;
- cleanup contract lacking explicit recovery-retention refs;
- post-effect failure certainty requiring explicit recovery-required proof;
- ancestor-link race proof gap;
- brownfield/startup purity proof gap;
- incomplete adapter integration proof for CREATE/REMOVE/MOVE;
- Windows file/directory fsync behavior that must remain an explicit durability capability gap rather than being treated as success.

No unresolved HIGH or CRITICAL finding remains.

## Truthful residual capability gaps
M06 does not advertise a stronger guarantee than the active platform adapter can mechanically establish.

Examples retained as explicit gaps where applicable:
- Windows replace-existing atomic visibility when the adapter cannot prove equivalent directory-entry replacement semantics;
- Windows directory crash durability when required synchronization cannot be established;
- link/hard-link creation or inspection capabilities unavailable to a hosted runner;
- any unobservable mount/volume/reparse/race guarantee required by the operation.

These are fail-closed capability limits, not unsafe fallback paths. M51 remains owner of the global supported-platform compatibility matrix.

## Ownership boundaries preserved
M06 owns physical filesystem authority/safety only. It does not absorb:
- M05 semantic transaction planning, authorization, journal, recovery policy or idempotency;
- M29 Git mutation;
- M30+ hosted-provider mutation;
- M36 durable restart/orphan recovery orchestration;
- M37 global integrity policy;
- M51 compatibility-matrix ownership;
- M54/M56/M58 later full integration/E2E/security harness products;
- M63 quantitative executor-performance thresholds.

## Acceptance closure
The implementation and exact-head evidence satisfy the frozen S01-S04 contracts, the M06 Module Gate and all 40 `GBS-WO-M06-001` acceptance criteria for the M06-owned physical filesystem surface. Unsupported platform guarantees remain explicit blockers/gaps and therefore do not invalidate truthful module completion.

## Production credit
Frozen M06 weight: `18`.

Promotion after approved implementation merge:
- previous earned: `107 / 1088 = 9.83%`;
- M06 earned: `18 / 18`;
- new earned: `125 / 1088 = 11.49%`;
- remaining: `963 / 1088 = 88.51%`;
- denominator changed: `NO`.

## Next-stage rule
After this Evidence Bundle, Module Gate, closed Work Order, Backlog and human/machine checkpoints are exact-head reviewed and merged, the next legal stage is `GBS-M07 — Template Engine` planning only, beginning with `S01 Template Format`. M07 implementation is not admitted by M06 completion. Codex remains outside Bootstrap construction absent a separately governed exception/ADR.

STOP CONDITION: `M06_MODULE_DONE_APPROVED`.
