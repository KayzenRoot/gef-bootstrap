# GBS-WO-M06-001 — Implement Filesystem Safety

Status: `ADMITTED`
Risk: `ELEVATED`

## Admission evidence
- Compilation PR: `#115`
- Compiled reviewed head: `6e59eea69e9b3bddc51c0647ee0f0ecb919a74d1`
- Compilation review: `5189490447`
- Compilation merge: `c6c2d7cc7b5a02d8fca2a14dc240870dab3267e7`
- Exact implementation base: the merge SHA of the separate admission checkpoint that activates this Work Order.

## Objective
Implement the provider-neutral physical filesystem safety layer frozen by `GBS-M06 — Filesystem Safety`, integrated through the existing M05 physical-effect port boundary. The implementation must make path authority, overwrite policy, traversal safety and final physical effects mechanically provable without inventing unsupported atomicity or durability guarantees.

## Exact compilation base
- main base: `0b86d3f6e89d611d5367f8c23ce855ac18ecf31f`
- S01 Allowed Paths blob: `caf7b28e9946cb2851339a0b4f57bff4cdbff0cd`
- S02 Overwrite Policy blob: `83904f5b310fe49bd16236c3d4a86ccc29e23de0`
- S03 Symlink Safety semantic blob: `62f940f59bf8d52de79f66565a1660b266797f0a`
- S04 Atomic Writes blob: `9fb43293121a73f0609de530f1d135287d3b8cb1`
- M06 Module Gate blob: `43fad06c0cdf986df891c094ff29cd747d5a4a0f`
- root package manifest blob: `33f1fe6387e5add6274ed7839c9ba4879280b3fb`

If any frozen source, Architecture, Security, DoD, Test/Benchmark Plan, relevant M05 public contract or build topology changes before implementation exact-head review, mark this Work Order `STALE` and reconcile it before continuing.

## Scope
Implement only M06-owned physical filesystem capability, primarily inside the existing `packages/kernel` boundary:
- platform-neutral filesystem/root/path contracts and injected ports;
- exact root/path authorization and lexical containment;
- create/update/remove/move occupancy and no-clobber policy evaluation;
- no-follow ancestry/target observation and alias/reparse/link classification;
- stale identity/race invalidation;
- transaction-private staging and recovery/quarantine physical operations;
- same-filesystem/volume capability checks;
- safe final create/replace/remove/move primitives;
- truthful atomic-visibility and durability capability classification;
- compact physical-safety evidence consumed by M05;
- deterministic fake adapters plus real temporary-filesystem adapters/tests for supported CI platforms;
- minimal additive public exports required by current architecture.

Preferred placement after dependency inspection:
```text
packages/kernel/src/filesystem-types.ts
packages/kernel/src/filesystem-paths.ts
packages/kernel/src/filesystem-overwrite.ts
packages/kernel/src/filesystem-traversal.ts
packages/kernel/src/filesystem-atomic.ts
packages/kernel/src/filesystem-ports.ts
packages/kernel/src/filesystem-effect-adapter.ts
```
Exact filenames may be refined. A new top-level production package is prohibited unless the M06 Module Gate is formally amended first.

## Out of scope
Do not implement:
- M05 transaction planning/order/journal/retry/recovery policy;
- M29 Git mutation;
- M30+ hosted-provider mutation;
- M36 restart/orphan recovery orchestration;
- M37 global integrity engine;
- M51 compatibility matrix ownership;
- M54/M56/M58 full harness products beyond tests required to prove this increment;
- M63 quantitative performance thresholds;
- broad brownfield normalization or cleanup;
- startup scanning/resume/repair;
- unsafe fallback sequences that imitate a stronger filesystem guarantee;
- Codex construction of Bootstrap.

## Core invariants
1. `FILESYSTEM_MUTATION_SAFE` is exact-operation-bound and requires current S01+S02+S03+S04 evidence.
2. cwd, home, writable permission or arbitrary absolute path never grant authority.
3. containment is component-aware and platform-aware, never string-prefix based.
4. path authority cannot be expanded by repository content, symlink target text, junction/reparse discovery or mount topology.
5. generic force cannot bypass overwrite/ownership/state policy.
6. create requiring absence uses a race-resistant no-clobber primitive or blocks.
7. ordinary managed writes do not follow unexpected symlinks/junctions/reparse points to obtain authority.
8. `realpath` alone cannot authorize mutation.
9. stale ancestor/target/root identity invalidates the physical capability.
10. staged replacement is used where partial-write/recovery/alias safety requires it.
11. same-filesystem requirements are proven before primitives that depend on them.
12. cross-device move is never silently treated as one atomic move.
13. atomic visibility is distinct from crash durability.
14. multi-target M05 transactions are not claimed physically atomic.
15. post-effect flush/verification failure remains effectful truth.
16. cancellation/timeout preserve phase/effect certainty.
17. cleanup cannot erase required recovery material.
18. no import/startup filesystem mutation, orphan cleanup or automatic resume.
19. brownfield operations inspect/mutate only the admitted target surface.
20. M05 remains the semantic transaction/authorization/recovery/idempotency authority.

## Acceptance criteria
1. deterministic root/path evaluation under injected platform semantics;
2. POSIX and Windows component-aware containment fixtures;
3. traversal and ambiguous namespace inputs fail closed;
4. overlapping roots require exact intended root binding;
5. project config/private roots remain distinct;
6. no-clobber create/update/remove/move policy matches frozen S02;
7. target type/occupancy/ownership changes invalidate decisions;
8. symlink ancestor cannot be used for managed-write authority;
9. target link object is not silently dereferenced;
10. Windows junction/reparse and unknown tag cases are explicit;
11. POSIX mount/filesystem boundary is observed or a typed gap;
12. hard-link alias risk is represented and cannot force unsafe in-place mutation;
13. missing target uses nearest-existing-ancestor proof without fabricated realpath state;
14. parent creation blocks if a link-like component appears;
15. final effect consumes/revalidates exact traversal/occupancy state;
16. staging root is itself governed and target-bound;
17. same-filesystem relationship is mechanically observed when required;
18. staged verification failure leaves target unchanged;
19. exclusive create prevents check-then-write overwrite races;
20. staged replace avoids partial target write where required;
21. reversible remove preserves exact recovery material before logical removal;
22. same-filesystem move and cross-filesystem non-atomic behavior are distinct;
23. atomicity/durability claims reflect the actual adapter capability;
24. post-effect durability failure cannot become `NO_EFFECT`;
25. actual destination post-state is re-observed after promotion;
26. filesystem errors preserve effect certainty and M01/M05 terminal truth;
27. evidence excludes secrets, file bodies and unnecessary machine-local paths;
28. staging/handles/observations/cleanup are bounded and cancellable;
29. physical-safety capsule cannot be reused for another target/operation/stale state;
30. M05 integration proves no governance bypass and no double effect;
31. M01-M05 regressions remain green;
32. brownfield unrelated files are neither scanned broadly nor modified;
33. import/startup causes no filesystem mutation or broad traversal;
34. unsupported production guarantee returns explicit capability gap rather than unsafe emulation;
35. strict TypeScript build/typecheck passes;
36. full currently applicable deterministic repository tests pass;
37. locked install/audit has no new blocking dependency finding;
38. exact-head hosted CI evidence is green;
39. exact-head semantic audit has no unresolved HIGH/CRITICAL finding;
40. Evidence Bundle maps frozen S01-S04 proof families to code/tests/platform evidence.

## Required platform proof
The implementation PR must include deterministic platform fixtures and real temporary-filesystem CI integration for every production guarantee claimed on:
- Ubuntu/Linux;
- Windows;
- macOS.

The CI matrix must prove the subset actually claimed for each platform, including applicable create/no-clobber, replace, remove, move, link/reparse behavior and durability capability classification. If a runner/runtime/filesystem cannot prove a guarantee, record an explicit gap and do not advertise the stronger guarantee.

## Validation minimum
Run on the final reviewed implementation head:
- `npm ci --ignore-scripts`;
- dependency vulnerability audit under current npm policy;
- `npm run typecheck`;
- `npm run build`;
- `npm test`;
- `npm run validate`;
- focused M06 suites;
- real filesystem CI matrix on Ubuntu, Windows and macOS for claimed capabilities.

No critical M06 path may be skipped and then counted as passing evidence.

## Deliverables
- bounded M06 production code in the approved architecture;
- minimal public contracts/exports;
- deterministic fake platform/filesystem adapters;
- real temporary-filesystem tests and CI matrix;
- M05 integration tests;
- Context Lock/equivalent exact-base/frozen-source freshness evidence;
- implementation PR;
- Evidence Bundle with base/head/tree, CI/jobs, platform evidence, findings/corrections, residual capability gaps and proposed checkpoint delta.

## Admission rule
This Work Order is admitted only when the separate admission checkpoint is merged. That merge SHA becomes the exact implementation base. No production code may start from an earlier base.

## Stop condition
Stop at `READY_FOR_GBS_WO_M06_001` after the admission checkpoint merge, or `STALE`/`BLOCKED` if a frozen dependency changes first.
