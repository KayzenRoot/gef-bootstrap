# GBS-M04 — Preflight & Discovery Evidence Bundle

Status: `MODULE_DONE_APPROVED`

## Governed increment
- Module: `GBS-M04 — Preflight & Discovery`
- Work Order: `GBS-WO-M04-001`
- Implementation PR: `#86`
- Admitted base SHA: `04e711c7208476728187609c14ef9119530633ef`
- Exact reviewed/merged head SHA: `bc26829fa8f3043056b6d9b614c618767f02e6c7`
- Exact implementation tree: `46c80e056dde05ef108e9599485c33de844cec5a`
- Squash merge SHA: `67b4377a6df7a34874f751c13d1659b942eed859`
- Exact-head GitHub Actions run: `34730911026`
- Exact-head CI job: `103653404874`
- Semantic review record: `5188934256`
- Evidence-correction comment: `5650008716`
- Exact-head semantic verdict: `APPROVED`

## Delivered capability
M04 now provides the bounded production foundation for deterministic read-only preflight/discovery:
- explicit injectable environment observation with exact variable allowlists;
- request-driven local Git repository, HEAD, status and remote observation;
- truthful repository states including worktree, bare, absent, access-blocked, unavailable and invalid/ambiguous;
- distinct attached, detached, unborn, unavailable and invalid HEAD states;
- M03-backed remote normalization with raw remote text discarded from reusable snapshots;
- conditional exact-target hosted-provider observation with zero hosted calls on local-only paths;
- request-scoped hosted capability observation without conflating capability with authorization;
- bounded logical-tool resolution/probing without shell execution, auto-install or repair;
- explicit parser/policy identity for version and M51 compatibility conclusions;
- operation-relative project-state composition using the smallest sufficient fact graph;
- cheap blocker and stale-state short-circuit before unnecessary provider/tool work;
- bounded concurrency for independent reads only after prerequisites are established;
- per-invocation reuse, stronger-requirement expansion and targeted invalidation;
- compact expected-state bindings for later mutation revalidation;
- brownfield read-only preflight without forcing adoption/config mutation;
- compact reusable snapshots excluding config documents, cwd/env values, Git roots/raw URLs and tool executable identity.

## Changed surface
The implementation PR contains 16 changed files, bounded to:
- workspace/package wiring;
- new provider-neutral `packages/preflight` package;
- M04 focused tests;
- immutable M04 Context Lock.

No M05/M06 transaction/filesystem mutation, M13 adoption mutation, M17-M19 registry/continuity engine, M21-M25 proof/status ownership, M29 Git mutation, M30-M33 hosted mutation/governance, M38 global capability registry, M51 compatibility matrix engine or M63 benchmark-threshold engine was pulled forward.

## Exact-head verification
GitHub Actions run `34730911026` is bound directly to head `bc26829fa8f3043056b6d9b614c618767f02e6c7` and completed `SUCCESS`. Job `103653404874` confirms the locked install and repository validation step completed successfully. The exact head tree is `46c80e056dde05ef108e9599485c33de844cec5a`; squash merge `67b4377a6df7a34874f751c13d1659b942eed859` incorporates that same tree.

The validated implementation tree records:
- `npm ci --ignore-scripts`: `PASS`;
- dependency audit: `0 vulnerabilities`;
- strict TypeScript build/typecheck: `PASS`;
- tests: `118 PASS / 0 FAIL / 0 SKIP / 0 TODO`;
- exact-head workflow conclusion: `SUCCESS`.

The original PR body/review cited an immediately preceding green run. PR comment `5650008716` records the correction and binds canonical evidence to exact-head run `34730911026`.

## Performance-structure proof
Mechanical tests prove that M04 does not implement a naive all-facts scan:
- `requireRepository` alone does not read remotes;
- local-only paths perform zero hosted-provider calls;
- cheap config/identity blockers stop later work;
- stale HEAD stops hosted/tool discovery;
- provider and independent tool discovery may begin concurrently only after target prerequisites;
- per-invocation caches avoid duplicate stable observations;
- stronger requirements expand discovery rather than silently reusing weaker evidence;
- targeted invalidation re-observes only the invalidated fact where narrower invalidation is provable;
- compact snapshots exclude unnecessary machine-local or provider/process material.

## Correction history
The same Work Order/PR absorbed discovered corrections before approval, including:
- strict `exactOptionalPropertyTypes` failures;
- unnecessary remote discovery for repository-presence-only requests;
- `IDENTITY_STATE` handling when no repository exists;
- short-circuit counter semantics;
- runtime validation/canonicalization of hosted provider identity;
- M51 compatibility-policy identity in requirement fingerprints;
- early expected-state stale checks;
- alignment with frozen S02 Git repository/HEAD state distinctions;
- raw remote URL disposal and rejection of locally forged stable-provider authority;
- compact S05 snapshots excluding config/cwd/env/Git-root material;
- exclusion of tool executable identity from reusable project snapshots.

No known HIGH or CRITICAL finding remains.

## Acceptance mapping
The exact implementation and tests satisfy the 32 implementation proof families frozen by the M04 Module Gate across environment, Git, hosted profile, toolchain, project-state composition, least-necessary discovery, brownfield preservation, stale-state binding, compact evidence and ownership boundaries.

## Production credit
Frozen M04 weight: `17`.

Promotion after approved merge:
- previous earned: `70 / 1088 = 6.43%`;
- M04 earned: `17 / 17`;
- new earned: `87 / 1088 = 8.00%`;
- remaining: `1001 / 1088 = 92.00%`;
- denominator changed: `NO`.

## Residual boundaries
M05/M06 retain transactional mutation/filesystem safety and recovery. Later modules retain adoption, persistent continuity/registry, proof/status engines, Git mutation, hosted-provider mutation/governance, global capability registry, compatibility policy and quantitative executor-performance thresholds. M04 exposes read-only preflight facts and exact-state bindings only.

## Next-stage rule
After the canonical human/machine checkpoint promotion is merged, M05 may enter planning. M05 implementation is not admitted by M04 completion. The optional Codex benchmark remains separately governed and must not be treated as Bootstrap construction authority without its own explicit exception/ADR.

STOP CONDITION: `M04_MODULE_DONE_APPROVED`.
