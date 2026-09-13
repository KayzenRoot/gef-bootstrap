# GBS-M06-S01 — Allowed Paths

Status: `FROZEN`

## Purpose
Freeze the provider-neutral path-authority and lexical-containment contract for `GBS-M06 — Filesystem Safety`. S01 defines **which filesystem locations a governed operation is allowed to address** and how a logical target is mapped to a bounded authorized root without granting authority from cwd, string-prefix coincidence, OS permissions or repository content.

S01 is necessary but deliberately insufficient for mutation safety. A path that is lexically inside an authorized root is **not yet physically safe to mutate** until later M06 sessions prove overwrite policy, link/reparse safety and atomic-write requirements.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M06_S01`;
- M02 canonical/project/private path contracts, including `.gef/project.json` and `.gef/private` separation;
- M03 project/repository identity authority;
- M04 repository/preflight target observations;
- M05 MODULE_DONE transaction engine and its fail-closed physical-safety port boundary;
- frozen Architecture A5/A6/A8/A10;
- frozen Security T1/T2, SEC-01/02/03/04/09/10 and cross-cutting Filesystem rules;
- frozen Requirements, Scope, Definition of Done and Test & Benchmark Plan;
- M51 ownership of supported runtime/platform compatibility policy;
- M63 ownership of quantitative latency/resource targets.

## Ownership boundary
M06-S01 OWNS:
- explicit filesystem root authority and root descriptors;
- operation-scoped path authorization;
- platform-aware lexical path parsing/canonicalization;
- component-aware lexical containment under an authorized root;
- rejection of traversal/namespace/path forms that cannot be interpreted safely;
- root/target binding and stale-dependency semantics;
- portable logical path evidence for later M06/M05 use;
- brownfield bounded-path behavior.

M06-S01 DOES NOT OWN:
- overwrite/create/delete/replacement policy for existing targets (M06-S02);
- symlink/junction/reparse/mount escape proof or no-follow traversal (M06-S03);
- staging-root selection, same-filesystem guarantees, fsync/durability or atomic replace/write mechanics (M06-S04);
- semantic transaction ordering/recovery/idempotency (M05);
- project/repository identity (M03);
- broad adoption/normalization (M13);
- Git mutation (M29) or hosted-provider effects (M30+);
- global compatibility matrix policy (M51);
- benchmark thresholds (M63).

## Frozen Allowed Paths contract

### PATH-01 — Filesystem authority starts from an explicit root capability
Every governed filesystem target is evaluated relative to an explicit admitted root descriptor. `cwd`, process launch directory, user home, repository discovery results, OS write permission and arbitrary absolute paths do not independently create write authority.

A root descriptor is operational capability metadata, not canonical project identity.

### PATH-02 — Root descriptors are stable logical references plus observed physical bindings
A root descriptor carries at least:
- stable `rootRef` / root kind;
- owning project/repository/config/policy binding where applicable;
- observed physical root location through an injected filesystem/path port;
- path flavor/platform semantics needed for lexical interpretation;
- admitted operation classes;
- policy/contract version or fingerprint;
- observation dependencies sufficient to invalidate stale decisions.

Reusable receipts/evidence prefer `rootRef + logicalRelativePath`; machine-specific absolute paths are excluded unless operational troubleshooting explicitly requires a sanitized projection.

### PATH-03 — Baseline root kinds are explicit and non-interchangeable
Representative logical root kinds include:
- project/repository managed root bound to M03/M04 identity;
- project private operational root resolved from M02 (currently `.gef/private`);
- canonical project-config location/root owned by M02;
- global configuration location/root owned by M02;
- transaction/recovery/staging roots supplied by their owning contracts;
- explicitly admitted external filesystem root from a versioned owner policy.

No generic “home directory”, “current drive” or filesystem-root capability exists by default.

### PATH-04 — Root authority is operation-scoped
A root may allow only a subset such as read/inspect, create managed target, update/replace, remove, move-source, move-destination, recovery restoration or private staging.

Permission for one operation does not imply another. In particular, authority to create/update a child does not imply authority to delete/replace the root itself.

Security class remains determined by the owning operation; path admission cannot downgrade S1-S4 policy.

### PATH-05 — Root mutation is denied by default
A logical target resolving to the authorized root itself is not an ordinary child mutation. Replacing/removing/moving the root requires a separately declared owner operation and the applicable elevated policy; otherwise it is blocked.

This prevents empty relative paths, `.` or normalization artifacts from turning child authority into root-destructive authority.

### PATH-06 — Logical targets are relative to a named root by default
Portable plans/contracts should address filesystem targets as `rootRef + logicalRelativePath`, not machine-local absolute path strings.

An absolute target may be accepted only when an owning contract explicitly requires that form and S01 can map it unambiguously back to the exact admitted root. An absolute path that merely happens to be writable is not authority.

### PATH-07 — Lexical canonicalization is platform-aware and deterministic
The path layer consumes an injected/versioned path-semantics capability for the target platform rather than applying POSIX rules to Windows or vice versa.

Canonicalization must have deterministic rules for separators, root/volume syntax, `.` and `..`, redundant separators and equivalent supported lexical forms. Canonicalization is idempotent for controlled inputs.

S01 never lowercases or Unicode-normalizes paths merely by assumption.

### PATH-08 — Containment is component-aware, never string-prefix based
`/repo2` is not inside `/repo`; `C:\work-old` is not inside `C:\work`; and mixed separator tricks cannot create authority.

Containment compares parsed path components under the proven path-semantics contract after lexical normalization. A lexical target that escapes above the authorized root is blocked before any write/stage/recovery effect.

### PATH-09 — Parent traversal cannot escape and return
Inputs containing traversal components are normalized/evaluated as a complete path. A sequence such as `sub/../../outside/../repo/file` cannot obtain authority because an intermediate or final lexical escape occurred or because the final string resembles the root.

Implementation may reject traversal syntax outright for managed mutation or admit only a provably contained normalized representation; either policy must be deterministic and fail closed.

### PATH-10 — Path comparison semantics are observed, not guessed
Case sensitivity, case preservation, Unicode equivalence and volume/root identity differ across Windows, macOS, Linux and filesystem configurations.

S01 requires an owning path-semantics observation where these properties can affect identity/containment. If the adapter cannot distinguish a potentially colliding form safely, the result is an explicit ambiguity/gap, not guessed equality or guessed difference.

Detailed existing-target collision/overwrite policy is frozen in S02.

### PATH-11 — Windows ambiguous namespaces fail closed unless explicitly supported
Managed mutation rejects or separately governs path forms whose semantics can bypass ordinary containment, including as applicable:
- drive-relative paths such as `C:relative`;
- device namespaces / device paths;
- unsupported extended-length namespace tricks;
- alternate data streams when not an explicit supported target kind;
- reserved/ambiguous device names and trailing-dot/space aliases where they can change target identity.

UNC/network roots may be used only as explicit admitted roots with a supported contract; they are never inferred from a relative project target.

S01 does not claim all Windows namespace behavior is identical across runtime/filesystem versions; unsupported/ambiguous cases block.

### PATH-12 — POSIX special root forms cannot expand authority
Absolute `/`, unexpected double-slash implementation-defined roots, mount-boundary semantics or other special forms do not create broader authority from a project-relative target.

Cross-mount/link behavior that requires physical traversal proof remains S03/S04-owned.

### PATH-13 — Nested roots never silently inherit the broader authority
When physical roots overlap, the caller/compiled operation supplies the intended `rootRef`. S01 does not choose a broader parent root merely because it would make an otherwise-denied target pass.

If a target maps to multiple differently governed roots without an exact root binding, S01 reports ambiguity rather than privilege escalation.

### PATH-14 — Root identity is bound to project/repository/config truth where applicable
Project-root operations bind to M03 project/repository identity and the M04-observed local repository context. Private/canonical config roots bind to M02 path contracts. External roots bind to their explicit owner policy.

Moving a checkout, switching to another repository, rebinding identity or changing the root contract invalidates affected path decisions.

A physical path string alone is not repository/project identity.

### PATH-15 — OS permission is capability, not authorization
Successful `access`, ACL permission, writable mode bits or administrator privilege may prove that the process *can* touch a path, but never that GEF *may* touch it.

Conversely, an admitted logical target whose filesystem access is unavailable yields a capability/error gap and is not silently redirected elsewhere.

### PATH-16 — Repository content cannot manufacture a privileged root
Files inside the target repository may request logical paths only through a schema/policy that maps to already admitted roots. A manifest, template, config fragment or adapter payload cannot declare `/`, a sibling checkout, user home or another drive/share as writable merely by containing that string.

External-root admission requires an owning trusted policy boundary independent of untrusted repository content.

### PATH-17 — Brownfield authority is target-bounded, not repository-wide cleanup authority
Adopting or operating on an existing repository does not authorize normalization of every file under the root.

S01 admits only the paths/surfaces named by the governed operation. Unrelated legacy files, sibling directories, generated artifacts and unknown user content remain untouched unless separately admitted.

No whole-tree traversal is required merely to decide a single target path.

### PATH-18 — Canonical project config and private operational state remain distinct
M02 currently resolves canonical project config to `.gef/project.json` and private operational state to `.gef/private` beneath the project root.

S01 preserves the distinction in root/operation policy: being allowed to write private recovery/staging data does not authorize editing tracked canonical project config, and vice versa.

### PATH-19 — Parent-directory creation requires explicit admitted scope
Creating a target does not automatically authorize arbitrary recursive parent creation. Every newly created parent must be within the admitted root and covered by the operation/owner contract or by an explicitly bounded managed-parent rule.

S02 will decide target existence/overwrite behavior; S01 establishes only path authority.

### PATH-20 — MOVE binds source and destination independently
A move/rename requires separately admitted source and destination path decisions, even when both are under the same root. A valid source does not automatically authorize the destination, and vice versa.

Cross-root/cross-volume move feasibility and atomicity are S04-owned. Link/reparse traversal is S03-owned.

### PATH-21 — Lexical admission is not final physical-safety approval
An S01 result may state that a target is lexically admitted, but it MUST NOT satisfy M05 `checkPhysicalSafety` by itself.

Final physical mutation safety requires the applicable S01 + S02 + S03 + S04 checks. A public result must distinguish, for example, `PATH_ALLOWED_LEXICALLY` from `FILESYSTEM_MUTATION_SAFE`.

### PATH-22 — Existing ancestors are not followed to gain authority
S01 does not use ordinary link-following resolution as a shortcut to prove containment. If obtaining a “real path” would follow a symlink/junction/reparse point, the physical traversal proof belongs to S03.

S01 may consume safe no-follow/ancestor metadata from an injected port, but unresolved link state remains an explicit dependency/gap.

### PATH-23 — Missing target paths are evaluated without fabricating physical reality
Create operations often target a path that does not yet exist. S01 computes lexical containment against the authorized root and records the existing-ancestor dependencies available to later S03/S04 checks.

It never requires a nonexistent target to be `realpath`-resolved, nor assumes missing descendants are link-free forever.

### PATH-24 — Path decisions are dependency-bound and revalidated before mutation
A reusable path decision binds at least root identity/policy, normalized relative target, operation class and relevant path-semantics identity. Later physical stages revalidate dependencies that can change, especially existing ancestor identity/link state, target occupancy and volume characteristics.

A stale S01 decision cannot grant write authority after root/repository/policy change.

### PATH-25 — Error/gap states are typed and non-authorizing
Baseline distinctions include equivalents of:
- allowed lexically / pending later M06 checks;
- policy/root operation denied;
- malformed/unsupported path;
- path escapes root;
- root unavailable or identity mismatch;
- ambiguous root mapping;
- unsupported namespace/path flavor;
- case/normalization ambiguity;
- stale root/path-semantics observation;
- later link/overwrite/atomicity proof required.

No error fallback converts a denied/unknown path into the current directory or another writable directory.

### PATH-26 — Evidence is compact and portable
Normal evidence contains stable root/target references, normalized logical relative path, operation class, policy/path-semantics fingerprints, outcome and targeted gap/finding codes.

Absolute home/temp/user-specific path material is excluded from reusable evidence by default. Diagnostics expose only the minimum sanitized path context required for repair.

### PATH-27 — Input processing is bounded
Path strings, component counts, root candidates and ambiguity/collision probes are subject to finite implementation limits and cancellation/deadline contracts. S01 never performs an unbounded recursive filesystem scan to authorize one path.

Exact performance thresholds remain M63-owned; platform validity limits and security-safe finite bounds remain M06 implementation obligations.

### PATH-28 — Root/path observations are injectable and testable
Platform/path/filesystem facts that can vary by host are obtained through explicit injected ports/capabilities. Pure policy/canonicalization logic can therefore be tested against deterministic Windows/Linux/macOS fixtures without mutating the host filesystem.

Production adapters later prove real OS behavior through M54/M56/M58 and release acceptance gates.

### PATH-29 — Import/startup has no filesystem mutation side effect
Loading M06 contracts, root policy or path helpers must not create directories, rewrite config, canonicalize files on disk, probe broad trees or change cwd.

Observation and mutation happen only through admitted invocations.

### PATH-30 — S01 produces the minimum contract required by S02-S04 and M05
S01 output gives later stages a stable path authorization capsule: intended root, logical target, operation, lexical canonical form/relative identity, path-semantics identity and invalidation dependencies.

S02 adds overwrite/occupancy policy; S03 adds link/reparse traversal proof; S04 adds staging/atomic-write/durability proof. Only their composed result can satisfy the M05 physical-safety port for a target-visible effect.

## Required implementation proof families for future M06 Work Order
1. project root bound to M03/M04 identity;
2. private vs canonical M02 roots stay distinct;
3. cwd/home/write permission do not grant authority;
4. exact rootRef required for overlapping roots;
5. component-aware containment rejects prefix-confusion;
6. traversal escape blocked;
7. root-self mutation default denied;
8. absolute target cannot bypass root binding;
9. deterministic POSIX path fixtures;
10. deterministic Windows drive/root/separator fixtures;
11. drive-relative Windows path blocked;
12. unsupported device/extended namespace blocked or explicitly classified;
13. ADS/reserved alias cases fail closed when unsupported;
14. UNC accepted only as explicit supported root;
15. case/Unicode ambiguity is not guessed;
16. nonexistent target creation remains lexically decidable without unsafe realpath assumptions;
17. S01 never follows links as a containment shortcut;
18. S01 result alone cannot satisfy full physical-safety approval;
19. MOVE source and destination authorized separately;
20. parent creation is bounded and explicit;
21. repository content cannot create privileged roots;
22. brownfield unrelated files require no scan/mutation;
23. stale root/repository/path-semantics binding invalidates decision;
24. typed malformed/outside/ambiguous/unavailable/unsupported outcomes;
25. compact evidence excludes unnecessary absolute user paths;
26. bounded path/component/root-candidate processing;
27. no import/startup mutation or cwd change;
28. Windows/Linux/macOS deterministic fixtures plus later real-platform integration evidence.

## Freeze audit
- Architecture A5/A6/A8 compatibility: PASS
- Security T1/T2 and filesystem rules represented: PASS
- M02 path separation preserved: PASS
- M03/M04 identity authority preserved: PASS
- M05 physical-safety port handoff preserved: PASS
- S02 overwrite ownership preserved: PASS
- S03 symlink/reparse ownership preserved: PASS
- S04 atomic-write/staging ownership preserved: PASS
- Windows/Linux/macOS differences explicit: PASS
- brownfield bounded-surface rule explicit: PASS
- no implementation introduced: PASS
- open S01 design decisions: 0

## Progress truth
M06 planning earns no production credit.
- total earned remains `107 / 1088 = 9.83%`;
- remaining remains `981 / 1088 = 90.17%`;
- M06 weight: `18`;
- M06 earned: `0 / 18`;
- denominator changed: `NO`.

STOP CONDITION: `M06_S01_FROZEN`.
