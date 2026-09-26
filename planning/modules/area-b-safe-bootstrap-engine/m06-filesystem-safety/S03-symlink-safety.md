# GBS-M06-S03 — Symlink Safety

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze the physical traversal and alias-safety contract for `GBS-M06 — Filesystem Safety`. S03 proves that a target admitted lexically by S01 and permitted by S02 cannot gain mutation authority by traversing an unexpected symlink, junction, reparse point, mount/volume boundary or other aliasing construct.

S03 does not claim a path is atomically writable. It produces a bounded traversal proof/capability for S04 to consume immediately before physical mutation.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M06_S03`;
- `GBS-M06-S01 — Allowed Paths` FROZEN;
- `GBS-M06-S02 — Overwrite Policy` FROZEN;
- M05 MODULE_DONE transaction/recovery/commit-barrier semantics;
- M03/M04 identity and local repository binding;
- frozen Architecture A5/A6/A10;
- frozen Security T1/T2/T9/T11, SEC-01/02/09/10 and Filesystem rules;
- frozen Requirements, Scope, Definition of Done and Test & Benchmark Plan;
- M51 ownership of platform/runtime compatibility policy;
- M54/M56/M58 ownership of later integration/E2E/security harnesses;
- M63 ownership of quantitative performance thresholds.

## Ownership boundary
M06-S03 OWNS:
- no-follow ancestry/target traversal proof;
- symlink/junction/reparse-point classification and default-deny behavior;
- mount/volume/alias boundary detection required for safe containment;
- hard-link alias risk classification where target identity can be shared;
- traversal-loop/depth/resource bounds;
- component-identity/version binding and stale/race invalidation;
- missing-descendant nearest-existing-ancestor proof;
- link-object versus link-referent operation distinction;
- compact traversal evidence for S04/M05.

M06-S03 DOES NOT OWN:
- lexical root/path admission (S01);
- create/update/remove/move overwrite/occupancy policy (S02);
- staging placement, same-filesystem atomicity, rename/replace/fsync/durability mechanics (S04);
- M05 logical transaction sequencing/recovery/idempotency;
- Git/provider mutation;
- global filesystem compatibility matrix (M51);
- quantitative latency/resource budgets (M63).

## Frozen Symlink Safety contract

### LINK-01 — Lexical containment is not physical containment
A target that is lexically under an admitted root is not physically safe merely because normalized path components appear contained.

S03 must establish the actual traversal topology of the root-to-target path using no-follow observations/handles where available. Any unresolved alias/redirect state remains a blocker or explicit gap.

### LINK-02 — `realpath` is informational, never sole authority
An ordinary `realpath`-style operation may be useful as diagnostic comparison, but it follows links and can race with subsequent mutation. It therefore cannot by itself authorize a write/remove/move.

A result that says “resolved path is inside root” is insufficient if the traversal route included an unexpected link-like component or can change before effect.

### LINK-03 — Root object itself must be trusted/bound before descendants
The admitted root's current physical identity is part of the traversal proof. If the root path itself has been replaced, redirected, rebound, or is unexpectedly link/reparse mediated relative to the admitted root contract, descendant authority is stale/blocked.

A product-install or workspace contract may explicitly admit a link-mediated root only through a versioned owner policy that proves the intended root identity; this is never inferred from convenience.

### LINK-04 — Every existing ancestor is observed without following to obtain authority
For each existing component from the admitted root to the nearest existing target/parent, S03 obtains no-follow metadata or an equivalent handle-relative identity token.

A component classified as a link/redirect/unknown reparse object cannot be silently traversed to continue authorization.

### LINK-05 — Unexpected symbolic links block managed traversal by default
If any ancestor needed to reach a managed target is a symbolic link not explicitly owned by a specialized operation contract, the normal managed write path returns a link-present blocker.

This remains true even if the link currently resolves to another location inside the same root. The referent's present containment does not turn the symlink into stable write authority.

### LINK-06 — A target symlink is the link object, not its referent
When the final directory entry is a symlink, an ordinary create/update/remove target cannot silently dereference it.

An explicitly typed operation may inspect/replace/remove the link object itself if S01/S02 authority and recovery rules cover that exact link entry. Such an operation does not gain authority over the referent.

### LINK-07 — Windows junctions/reparse points are not assumed equivalent to POSIX symlinks
Windows reparse-point metadata is classified by the owning adapter. Unknown or unsupported reparse tags fail closed.

Junctions, mount-point reparses, symbolic links and other redirecting/special reparses may have distinct semantics. S03 never treats `isReparsePoint=true` as enough information to claim safety.

### LINK-08 — Windows namespace/device redirects cannot be introduced through traversal
A lexically ordinary project target cannot acquire access to device namespaces, another drive/share or a privileged namespace through junction/reparse traversal.

If component metadata reveals an unsupported namespace/volume redirect, S03 returns a typed block/gap rather than following it.

### LINK-09 — POSIX mount/bind boundaries are explicit dependencies
Crossing a mount point, bind mount or filesystem boundary can change containment and later atomicity/durability semantics.

S03 detects or represents the boundary when the adapter can observe it. Whether an explicitly admitted boundary may be crossed is owner policy; same-filesystem requirements for staging/rename remain S04-owned.

An unobservable boundary required for a safety claim is a gap, not assumed safe.

### LINK-10 — Hard links are alias risk even without path traversal
A regular file can have multiple directory entries referring to the same underlying object. When update/remove/replace semantics could unexpectedly affect or preserve another alias, S03 records the alias-risk state available from the platform adapter.

Link count alone is not universal proof of alias identity or safety. If the operation requires knowing whether another name shares the object and that cannot be established safely, the result is `HARDLINK_ALIAS_GAP` or equivalent.

### LINK-11 — Managed replacement prefers directory-entry replacement over in-place mutation when alias risk matters
Where an in-place write could mutate content observed through another hard link, the physical write contract must not silently choose that behavior.

S03 exposes the alias risk; S04 decides the safe replacement primitive. This clause does not itself select rename/copy/write mechanics.

### LINK-12 — Traversal proof is handle/identity-bound where the platform permits
Race-resistant implementations prefer directory/handle-relative primitives and no-follow opens/metadata over reconstructing authority from path strings after observation.

Examples such as POSIX `openat`/`openat2`/`O_NOFOLLOW` or Windows reparse-aware handles describe the security property, not a mandatory Node API. The production adapter must use supported primitives that provide equivalent proof or report a capability gap.

### LINK-13 — Unsupported race-resistant traversal does not downgrade silently
If the runtime/OS adapter cannot prove the ancestry/target invariants needed by the operation, S03 returns an explicit `UNSUPPORTED_RACE_GUARANTEE`/gap according to risk policy.

It does not substitute `realpath + later path write` and label that equivalent.

A later owner may admit a narrower operation under a separately reviewed platform contract; the core S03 evidence must remain truthful about the weaker guarantee.

### LINK-14 — Component identity tokens are opaque and versioned
S03 may bind traversal proof to device/file IDs, volume serial/file IDs, handles, generation/version tokens or another adapter-specific identity representation.

Core does not assume inode numbers, file indexes or link counts are globally unique, durable forever or semantically identical across platforms. Tokens are opaque, versioned and meaningful only under the adapter contract that produced them.

### LINK-15 — Ancestor replacement invalidates traversal proof
If any observed ancestor component is renamed/replaced/reparsed or its identity token changes before mutation, the traversal proof becomes stale.

S04 or the final physical primitive must consume/revalidate the proof as close to target effect as possible. A stale ancestor proof cannot be reused merely because the textual path is unchanged.

### LINK-16 — Target replacement invalidates link/alias proof
Target no-follow kind/identity is dependency-bound. A regular file becoming a symlink, a symlink being replaced by a file, or an absent target appearing after observation invalidates affected S02/S03 decisions.

Final commit logic must detect or atomically exclude such target races before the visible effect.

### LINK-17 — Missing descendants use nearest-existing-ancestor proof
For CREATE paths whose target or intermediate managed parents do not yet exist, S03 verifies the nearest existing admitted ancestor and records which descendants are expected absent/to-be-created.

It does not `realpath` nonexistent entries or assume they can never be replaced by a link before creation. Parent creation and final target creation must consume/revalidate the ancestor proof.

### LINK-18 — Parent creation cannot walk through a newly introduced link
When creating a chain of admitted managed parents, each creation step or proven-safe atomic batch must preserve no-follow ancestry. If another actor introduces a symlink/junction/reparse entry in a parent slot, subsequent creation blocks rather than traverses it.

### LINK-19 — Traversal loops are bounded failures
Symlink/reparse loops, pathological ancestry graphs or adapter loops have explicit maximum traversal/observation bounds and terminate as typed loop/depth/resource outcomes.

S03 never recursively follows links until resolution as a discovery strategy for managed write authorization.

### LINK-20 — Link depth allowance is not link authority
Even if a platform/runtime supports following a finite number of links, that capability does not mean the GEF managed-write policy permits those links.

Default managed mutation remains no-unexpected-link; specialized link-aware contracts must declare each permitted semantic instead of relying on OS follow limits.

### LINK-21 — Link target text does not prove referent authority
Reading a symlink's target string is evidence about the link object, not proof that the referent exists, is stable, remains inside the root or is authorized.

Relative/absolute link target text is never directly fed back into S01 as if it were operator-granted root authority.

### LINK-22 — Link-object mutation requires exact S01/S02 authority and recovery
Creating, changing or deleting a symbolic-link-like object is a distinct typed filesystem operation. It requires the exact link entry to be path-authorized, overwrite-admitted and recoverable under M05.

Ordinary managed file intents do not implicitly create links. Future specialized link creation also requires platform-specific security review.

### LINK-23 — Mount/reparse/link discoveries cannot expand the admitted root set
Discovering that a component points to another directory, volume, share or device never registers that destination as a new authorized root.

Additional roots are admitted only by the S01 owner policy, not by filesystem topology.

### LINK-24 — MOVE validates both traversal chains
MOVE source and destination require independent S03 proofs, including their parent ancestry and final-entry state.

A safe source chain does not imply a safe destination chain. If the source/destination traverse different volumes/filesystems, S03 records that fact/gap for S04 atomicity policy.

### LINK-25 — Recovery/rollback paths require the same traversal safety
M05 rollback does not bypass S03 because the path was previously mutated by GEF. Before a physical restore/remove/recreate action, the current ancestry and target identity are revalidated.

Later user changes to a parent path or insertion of a link can therefore turn automatic rollback into a conflict/recovery escalation rather than a destructive traversal.

### LINK-26 — Brownfield link safety is local to the affected path
Existing repositories may legitimately contain many symlinks/junctions. S03 does not scan or normalize the whole repository merely because such objects exist.

It observes only the root-to-target chains and minimum related alias/collision facts required by the admitted operation. Unrelated links remain untouched.

### LINK-27 — Read-only inspection may have a weaker traversal policy than mutation
An S0 read operation may, under an explicit read contract, inspect a link referent with bounded semantics. That read policy does not produce a mutation-capable S03 proof and cannot be reused as write authority.

Evidence distinguishes read-follow observations from no-follow mutation traversal proof.

### LINK-28 — Access denial is not evidence of absence or safety
Permission/access failures while observing an ancestor, target, reparse tag, mount identity or alias state yield an explicit access/capability gap.

S03 never treats “could not inspect” as “not a link” or “safe”.

### LINK-29 — Component path/name data in evidence is minimized
Reusable traversal evidence contains rootRef, normalized logical target, component count, adapter/path-semantics identity, bounded opaque component identity tokens/fingerprints and typed findings.

Full absolute home/temp paths, raw link targets or unrelated directory listings are excluded by default. Diagnostics disclose only sanitized context required to resolve the blocker.

### LINK-30 — Traversal observations are bounded and cancellable
Ancestor count, link/reparse metadata reads, hard-link/alias probes, mount/volume checks, retries and output are finite and honor cancellation/deadline contracts.

No whole-filesystem search for aliases or mount topology is permitted for a normal target. Exact quantitative budgets remain M63-owned.

### LINK-31 — S03 produces a non-final traversal capsule
A successful S03 result proves that the currently observed path traversal did not introduce an unresolved alias/escape under the declared adapter contract.

It remains pending S04 final race/staging/atomicity/durability proof. Representative success wording is `TRAVERSAL_SAFE_PENDING_ATOMIC_COMMIT`, never `FILESYSTEM_MUTATION_SAFE`.

### LINK-32 — S04 must consume/revalidate traversal proof at the effect boundary
S03 proof carries root/path capsule identity plus ancestor/target dependency tokens. S04 must either:
- use physical primitives that keep those identities bound through the effect; or
- revalidate the relevant S03 proof immediately before effect under a documented race model.

If neither is possible for the required security class, final mutation blocks/degrades explicitly rather than claiming a nonexistent guarantee.

### LINK-33 — Import/startup has no traversal side effects
Importing S03 code must not walk repository ancestors, resolve symlinks, open handles, enumerate mount tables, change cwd or mutate filesystem state.

Traversal occurs only within an admitted invocation and smallest-sufficient target scope.

### LINK-34 — Typed outcomes remain non-authorizing outside composition
Representative results include equivalents of:
- `TRAVERSAL_SAFE_PENDING_ATOMIC_COMMIT`;
- `SYMLINK_ANCESTOR_BLOCKED`;
- `TARGET_LINK_REQUIRES_TYPED_OPERATION`;
- `JUNCTION_OR_REPARSE_BLOCKED`;
- `UNKNOWN_REPARSE_TAG`;
- `MOUNT_OR_VOLUME_BOUNDARY_GAP`;
- `HARDLINK_ALIAS_GAP`;
- `ANCESTOR_IDENTITY_CHANGED`;
- `TARGET_IDENTITY_CHANGED`;
- `TRAVERSAL_LOOP_OR_DEPTH_LIMIT`;
- `ACCESS_OR_METADATA_GAP`;
- `UNSUPPORTED_RACE_GUARANTEE`;
- `STALE_TRAVERSAL_PROOF`.

None of these success/deferred results bypass S01/S02/S04 or M05.

## Required implementation proof families for future M06 Work Order
1. S01 outside/denied path cannot gain S03 authority;
2. S02 conflict cannot be bypassed by traversal result;
3. ordinary `realpath` alone never returns mutation-ready proof;
4. admitted root identity replacement invalidates traversal;
5. symlink ancestor blocks even when current referent is inside root;
6. symlink ancestor pointing outside blocks;
7. target symlink is not dereferenced for ordinary managed write;
8. explicit link-object operation never grants referent authority;
9. Windows junction classified separately;
10. unknown Windows reparse tag fails closed;
11. namespace/drive/share redirect does not expand roots;
12. POSIX mount/bind boundary is observed or explicit gap;
13. hard-link alias risk cannot be silently in-place mutated;
14. opaque component identity tokens are adapter/version bound;
15. ancestor rename/replacement invalidates proof;
16. target file↔link race invalidates proof;
17. missing target uses nearest-existing-ancestor proof;
18. newly introduced link during managed-parent creation blocks;
19. traversal loop/depth limit bounded;
20. link target text cannot become root authority;
21. MOVE source and destination have independent traversal proofs;
22. cross-volume fact handed to S04 rather than guessed atomic;
23. rollback/recovery re-runs traversal safety;
24. brownfield unrelated links are not scanned/modified;
25. read-follow evidence cannot be reused as mutation proof;
26. access denial does not mean safe/absent;
27. reusable evidence excludes raw link targets/unneeded absolute paths;
28. cancellation/deadline/resource bounds work;
29. no import/startup traversal or mutation;
30. S03 success cannot satisfy full physical safety without S04;
31. deterministic Windows/Linux/macOS fixtures;
32. later real-platform harness proves adapter semantics/race guarantees where claimed.

## Freeze audit
- S01 lexical authority preserved: PASS
- S02 overwrite policy preserved: PASS
- M05 recovery/commit-barrier handoff preserved: PASS
- Security T2 path/link escape represented: PASS
- realpath-only authority prohibited: PASS
- Windows junction/reparse distinctions explicit: PASS
- POSIX mount/bind boundary explicit: PASS
- hard-link alias risk explicit: PASS
- TOCTOU/race limitations explicit: PASS
- brownfield smallest-scope rule explicit: PASS
- S04 atomicity ownership preserved: PASS
- no implementation introduced: PASS
- open S03 design decisions: 0

## Progress truth
M06 planning earns no production credit.
- total earned remains `107 / 1088 = 9.83%`;
- remaining remains `981 / 1088 = 90.17%`;
- M06 weight: `18`;
- M06 earned: `0 / 18`;
- denominator changed: `NO`.

STOP CONDITION: `M06_S03_FROZEN_CANDIDATE_READY_FOR_EXACT_HEAD_REVIEW`.
