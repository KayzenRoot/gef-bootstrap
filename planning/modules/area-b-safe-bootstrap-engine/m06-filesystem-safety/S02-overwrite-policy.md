# GBS-M06-S02 — Overwrite Policy

Status: `FROZEN`

## Purpose
Freeze the provider-neutral existing-target/occupancy policy for `GBS-M06 — Filesystem Safety`. S02 answers the question that begins **after S01 has already admitted the logical path**: given the current target state, may GEF create, update, replace, remove or move that target without clobbering unrelated/later work?

S02 is a policy/observation contract. It does not perform writes and it does not make a lexical path physically safe by itself.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M06_S02`;
- `GBS-M06-S01 — Allowed Paths` FROZEN;
- M05 MODULE_DONE transaction plan/pre-state/recovery/commit-barrier semantics;
- M02 canonical/private configuration ownership boundaries;
- M03/M04 exact project/repository/expected-state bindings;
- frozen Architecture A5/A6/A10;
- frozen Security T1/T2/T9/T11, SEC-01/02/03/09/10 and Filesystem rules;
- frozen Requirements, Scope, Definition of Done and Test & Benchmark Plan;
- M37 ownership of broader integrity platform semantics;
- M63 ownership of quantitative performance thresholds.

## Ownership boundary
M06-S02 OWNS:
- no-follow target occupancy/type classification required for overwrite decisions;
- create/update/replace/remove/move source+destination policy;
- exact expected-current-state requirements before destructive replacement/removal;
- no-clobber/default conflict semantics;
- idempotent desired-state/no-op classification without fabricated authorship;
- type/collision/protective-attribute conflict projection;
- bounded target/parent/collision observations;
- overwrite-policy evidence and stale-dependency binding.

M06-S02 DOES NOT OWN:
- root/path authority or lexical containment (S01);
- symlink/junction/reparse/hard-link/mount escape proof and traversal mechanics (S03);
- staging, same-filesystem choice, fsync/durability, atomic replace/remove/move primitives or race-resistant final commit mechanics (S04);
- transaction sequencing, recovery orchestration or retry policy (M05);
- global integrity policy/digest governance (M37);
- Git/provider mutation.

## Frozen Overwrite Policy contract

### OVR-01 — Path admission is prerequisite, never overwrite permission
S02 evaluates only targets already carrying an S01 path-authorization capsule. A lexically allowed target can still be denied because it exists unexpectedly, differs from expected state, has an incompatible type, has unproven ownership or is otherwise ambiguous.

S02 cannot expand S01's root/path authority.

### OVR-02 — Existing target state is observed without following link-like objects
The occupancy observation distinguishes at minimum:
- absent;
- regular file;
- directory;
- link/reparse/alias-like object requiring S03;
- unsupported/special object;
- inaccessible/unavailable;
- ambiguous/collision state.

Observation uses no-follow semantics where the platform provides them. If classifying the target would require following a link to another object, S02 defers to S03 instead of borrowing authority from the referent.

### OVR-03 — Occupancy snapshots are evidence, not locks
A successful S02 observation does not freeze the filesystem. Target/parent occupancy and fingerprints can change after observation.

S04/owning physical primitive must revalidate or use an atomic compare/replace/open strategy at the final effect boundary. S02 decisions carry invalidation dependencies rather than pretending a read-then-write sequence is race-free.

### OVR-04 — Ownership is never inferred from location alone
A file being under the project root, inside `.gef`, matching a template name or being writable does not prove GEF owns it.

Existing-target replacement/removal requires ownership/admission evidence from the owning operation contract, normally exact M05 expected-state/intent/recovery bindings or a later specialized owner contract.

Brownfield content with no such evidence remains user/unmanaged state and conflicts with destructive overwrite by default.

### OVR-05 — Generic force-overwrite is not an authority primitive
A boolean such as `force=true`, CLI `--force`, broad automation preference or administrator privilege cannot bypass:
- S01 path authority;
- exact target/pre-state checks;
- S03 link/alias safety;
- recovery requirements;
- S4 authorization where applicable;
- S04 atomic/race safety.

A higher-risk destructive operation must be a separately typed/admitted action with exact target and policy, not a generic override branch.

### OVR-06 — CREATE defaults to no-clobber
Create is admitted when the target is absent and all later S03/S04 prerequisites can be satisfied.

If the target already exists:
- exact desired state may be a truthful `NOOP_ALREADY_DESIRED` only when the owner semantics permit no-op reuse;
- divergent state is a conflict;
- incompatible type is a type conflict;
- link-like/special/ambiguous state is not treated as an ordinary existing file.

An identical pre-existing file is not retroactively claimed as GEF-authored merely because the bytes match.

### OVR-07 — UPDATE/REPLACE requires exact admitted current state
Replacing/updating an existing managed target requires the current observed state to satisfy the operation's expected-state predicate and expected target kind.

A mismatch blocks as stale/conflict before replacement. Size/mtime or pathname alone are insufficient as destructive ownership proof unless an owning versioned contract explicitly proves their adequacy.

Recovery material required by M05 must be available/verified before the corresponding destructive promotion.

### OVR-08 — Type transitions are explicit, never incidental overwrite
File→directory, directory→file, link→file, special→regular or similar target-kind transitions do not occur merely because a write API could replace the directory entry.

Such transitions require an explicit typed owner operation with recovery/security semantics; unsupported transitions block.

### OVR-09 — REMOVE is exact-target and default non-recursive
Remove requires an explicit remove intent and expected target state. A missing target may be a truthful no-op when owner semantics permit it, but must not be reported as a prior successful removal.

Directory recursive deletion is not an ordinary S1 overwrite behavior. Removing non-empty trees, project roots, Git directories, broad generated folders or unknown brownfield trees requires a separately governed destructive contract and applicable S4 policy.

### OVR-10 — Empty directory removal still requires ownership and later link safety
Even when a directory is empty, its removal requires an admitted exact target and expected state. S02 does not assume an empty directory is disposable merely because nothing is currently listed under it.

Whether any path component is link/reparse/mount mediated remains S03-owned.

### OVR-11 — MOVE source and destination policies are independent
For move/rename:
- source must exist in the exact admitted/expected state;
- destination receives a separate S01+S02 decision;
- destination absent is the default non-clobber case;
- occupied destination is not overwritten unless a separately admitted replacement contract binds/recoveries that destination;
- source validity never grants destination authority.

Cross-volume feasibility and atomic move/replace behavior remain S04-owned.

### OVR-12 — MOVE replacement is two-target destructive state
If an owning contract explicitly admits replacing an occupied destination during move, both source and destination expected states and recovery obligations participate in the transaction. A single source fingerprint cannot authorize destruction of the destination.

If either side drifts, the move blocks/replans rather than partially guessing.

### OVR-13 — Idempotent desired-state detection never fabricates authorship
When a regular target already equals the desired exact fingerprint, S02 may return a no-op classification if permitted by the owner contract.

That result means “desired state is already present”, not “this prior file was created by this transaction”. M05 idempotency/receipt logic preserves that distinction and rollback must not delete/restore a no-op target as if GEF changed it.

### OVR-14 — Absent-after-remove may be a no-op, not evidence of who removed it
A requested remove against an already absent target can be a safe no-op when the target identity is unambiguous and the owner semantics allow absence.

It cannot establish that GEF performed an earlier removal, and cannot erase unknown prior-effect truth when M05/M36 require effect detection.

### OVR-15 — Current-state fingerprints are versioned owner contracts
Exact overwrite decisions use a versioned state/fingerprint representation suitable for the target kind. A digest/hash may participate but does not by itself prove ownership or trust.

If the required exact state cannot be observed within the admitted capability/budget, S02 returns a gap/indeterminate result rather than weakening to name/mtime/size heuristics.

Broader integrity-policy ownership remains M37.

### OVR-16 — Large target observation is streaming/bounded
When content hashing or metadata enumeration is required, implementation uses bounded/streaming observation and cancellation/deadline contracts rather than loading arbitrary files/directories into memory.

Numeric performance targets remain M63-owned. Failure to obtain exact evidence within safety/resource limits is not permission to overwrite without it.

### OVR-17 — Case/Unicode/canonical-name collisions block ambiguous overwrite
If S01/path-semantics observations indicate that multiple names may resolve/collide under the target filesystem's case/Unicode rules, S02 does not choose one based on display spelling.

It performs the minimum bounded parent-scope collision observation needed or returns ambiguity. Whole-tree scans are prohibited for a single-target decision.

### OVR-18 — Protective attributes/permissions are not silently cleared
Read-only flags, ACL/ownership restrictions, immutable/system attributes or analogous platform protections are observed as capability/policy gaps where relevant.

S02 does not auto-chmod/chown/clear flags merely to make overwrite succeed. A separately admitted operation must own any permission/protection change, with its own security class and recovery.

### OVR-19 — Unsupported special targets fail closed
Sockets, FIFOs, device nodes, reparse/device namespace objects, mounts or other special target kinds are not automatically coerced into regular files/directories.

If a future owner explicitly supports such a target, it requires a versioned specialized contract and tests. Otherwise S02 returns unsupported/conflict.

### OVR-20 — Link/alias-like target objects are deferred, not dereferenced
If the target directory entry itself is a symlink, junction, reparse point, alias-like or hard-link-sensitive state whose identity can affect safe mutation, S02 records that fact and requires S03 proof.

S02 never follows the target merely to turn a hard case into an ordinary file overwrite decision.

### OVR-21 — Parent state can block creation/replacement
Target policy also binds required parent facts, such as parent existence/kind and the explicit managed-parent rule from S01.

Unexpected missing/replaced parent state, incompatible parent type or unresolved parent alias/collision blocks or defers. S02 does not recursively create/replace parents outside the declared surface.

### OVR-22 — Brownfield conflicts prefer preservation over normalization
When an existing target is unrelated, unrecognized, unexpected or diverged from the admitted pre-state, the default is conflict/preserve.

S02 must not “repair” neighboring files, clean legacy content, rename conflicts, delete generated artifacts or rewrite formatting to make the desired target fit.

### OVR-23 — Private operational paths still require expected-state discipline
GEF-private state can have a stronger product ownership claim than arbitrary brownfield content, but updates/removals still require correct root, target kind and expected-state/recovery rules. “Private” is not a license for unbounded recursive cleanup or ignoring concurrent runs.

M36 owns broader abandoned/orphan recovery semantics.

### OVR-24 — Canonical tracked config is stricter than private state
Tracked canonical files such as `.gef/project.json` remain governed project truth. Replacing them requires their owning M02 schema/version/expected-state and transaction gates; private-state permissions cannot be reused to overwrite canonical config.

### OVR-25 — Overwrite policy outputs typed non-authorizing decisions
Representative decisions include equivalents of:
- `CREATE_ALLOWED_ABSENT`;
- `NOOP_ALREADY_DESIRED`;
- `REPLACE_ALLOWED_EXPECTED_STATE`;
- `REMOVE_ALLOWED_EXPECTED_STATE`;
- `MOVE_SOURCE_ALLOWED` / `MOVE_DESTINATION_ALLOWED_ABSENT`;
- `CONFLICT_UNEXPECTED_EXISTING`;
- `CONFLICT_STALE_STATE`;
- `CONFLICT_MISSING_EXPECTED`;
- `CONFLICT_TYPE_MISMATCH`;
- `OWNERSHIP_UNPROVEN`;
- `LINK_OR_ALIAS_REQUIRES_S03`;
- `CASE_OR_NAME_AMBIGUOUS`;
- `UNSUPPORTED_TARGET_KIND`;
- `ACCESS_OR_OBSERVATION_GAP`;
- `STALE_OBSERVATION`.

An allow decision remains pending S03/S04 physical-safety proof.

### OVR-26 — Decisions bind exact dependencies and expire on drift
An S02 decision binds S01 capsule identity, intended operation, observed occupancy/type, expected-state/fingerprint contract, relevant parent/collision observations, owner policy and observation version.

Target/parent replacement, state drift, policy change, path-semantics change or owner binding change invalidates the decision.

### OVR-27 — S02 never performs destructive recovery itself
S02 may classify whether replacement/removal is policy-eligible and what recovery requirement is needed, but recovery capture/verification is orchestrated by M05 and physical materialization by later filesystem/storage owners.

It never truncates, deletes, moves aside or backs up the target as an observation side effect.

### OVR-28 — No eager mutation during import/discovery
Importing the overwrite-policy module or observing a target must not create parents, temp files, lock files, backups, chmod targets or alter cwd.

S0 observations remain read-only. Mutation happens only after M05 and all M06 gates admit it.

### OVR-29 — Observation scope is smallest sufficient
For one target, normal S02 work is bounded to that target and the minimum parent/collision facts required to decide safely. It does not hash the whole repository, enumerate unrelated directories or discover all managed files.

A directory operation that truly owns a bounded set must carry that explicit set/scope rather than trigger an implicit recursive scan.

### OVR-30 — S02 composes with S01/S03/S04, not around them
The later physical-safety adapter may produce final mutation readiness only when:
- S01 path/root authority is valid;
- S02 occupancy/overwrite decision is valid;
- S03 link/reparse/alias traversal proof is valid;
- S04 staging/atomicity/durability prerequisites are valid;
- M05 target/pre-state/authorization/recovery/commit-barrier semantics remain valid.

No S02 “replace allowed” decision alone can call the write/remove/rename primitive.

## Required implementation proof families for future M06 Work Order
1. S01 denied/outside path cannot reach S02 allow;
2. create absent allowed pending later checks;
3. create existing divergent conflicts;
4. create existing identical may return truthful no-op without ownership claim;
5. update exact expected state allowed pending later checks;
6. update drift blocks;
7. update missing expected target blocks;
8. file/directory type mismatch blocks;
9. implicit file↔directory transition blocks;
10. remove exact target allowed pending later checks;
11. remove already absent no-op does not fabricate authorship;
12. recursive/non-empty directory delete not silently admitted;
13. move source/destination separately authorized;
14. move occupied destination default conflicts;
15. explicit move replacement requires both target states/recovery obligations;
16. current-state fingerprint contract is versioned;
17. no weak mtime/size fallback when exact evidence is required;
18. bounded streaming file-state observation;
19. case/Unicode collision ambiguity blocks;
20. no broad repository scan for one target;
21. protective attributes are not auto-cleared;
22. special target kinds fail closed;
23. link/reparse/alias target defers to S03 without following;
24. parent missing/type/alias state is explicit;
25. brownfield unrelated target preserved;
26. private-state concurrency still checked;
27. canonical config does not inherit private-state overwrite policy;
28. observation causes zero filesystem mutation;
29. stale occupancy/fingerprint decision invalidates before effect;
30. allow decisions cannot bypass S03/S04/M05 gates;
31. cancellation/resource limits remain bounded;
32. Windows/Linux/macOS fixtures cover type/occupancy/collision differences.

## Freeze audit
- S01 authority/containment preserved: PASS
- M05 exact-state/recovery semantics preserved: PASS
- S03 link/alias ownership preserved: PASS
- S04 atomic/race ownership preserved: PASS
- default no-clobber behavior explicit: PASS
- generic force bypass prohibited: PASS
- create/update/remove/move distinctions explicit: PASS
- brownfield preservation explicit: PASS
- tracked config vs private-state distinction explicit: PASS
- cross-platform ambiguity explicit: PASS
- no implementation introduced: PASS
- open S02 design decisions: 0

## Progress truth
M06 planning earns no production credit.
- total earned remains `107 / 1088 = 9.83%`;
- remaining remains `981 / 1088 = 90.17%`;
- M06 weight: `18`;
- M06 earned: `0 / 18`;
- denominator changed: `NO`.

STOP CONDITION: `M06_S02_FROZEN`.
