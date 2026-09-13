# GBS-M04 — Preflight & Discovery Module Gate

Status: `READY_FOR_IMPLEMENTATION_WORK_ORDER`

## Planning evidence
- S01 Environment Discovery: `FROZEN` — PR `#72`
- S02 Git Discovery: `FROZEN` — PR `#74`
- S03 GitHub Discovery: `FROZEN` — PR `#76`
- S04 Toolchain Discovery: `FROZEN` — PR `#78`
- S05 Project State Discovery: `FROZEN` — PR `#80`
- Canonical checkpoint after S05: `READY_FOR_GBS_M04_MODULE_GATE`

## Gate audit basis
Reviewed against frozen Requirements, Scope, Architecture, Security, Test/Benchmark Plan, Definition of Done, Deployment, Backlog, M01 lifecycle/runtime, M02 configuration/schema and M03 project identity.

## Coverage result
### Environment
PASS. S01 defines explicit S0 read-only primitive environment observation, request-scoped allowlisted variables, no startup scan, no subprocess for primitive facts, compact evidence and per-invocation reuse.

### Local Git
PASS. S02 defines exact request-driven repository/HEAD/status/remotes observation, summary-first status, no alias authority, no silent repair and targeted freshness while preserving M29 execution ownership.

### GitHub reference profile
PASS. S03 defines conditional exact-target provider discovery, zero provider calls for local-only paths, stable provider-ID handoff to M03, request-scoped capability checks, truthful gap/block states and no provider mutation.

### Toolchain
PASS. S04 defines exact logical-tool observation, safe bounded direct probes, presence/version/compatibility separation, no broad software inventory, no auto-install/repair and targeted reuse while preserving M38/M51 ownership.

### Project state composition
PASS. S05 defines an ephemeral operation-relative preflight snapshot, requirement-driven composition, cheap-blocker short-circuit, bounded independent-read concurrency, compact expected-state bindings and no hidden repair.

## Cross-cutting gate results
- M01 lifecycle/preflight compatibility: `PASS`
- M02 config ownership preserved: `PASS`
- M03 identity/repository binding ownership preserved: `PASS`
- NEW_PROJECT / EXISTING_PROJECT preservation: `PASS`
- brownfield non-destructive behavior: `PASS`
- GitHub remains profile-conditional: `PASS`
- provider/local-tool security boundaries: `PASS`
- least-necessary discovery: `PASS`
- exact-state/staleness handoff to execution: `PASS`
- no M05/M06/M29/M30+ mutation implementation absorbed: `PASS`
- no M17-M19/M21/M23 persistent continuity/status ownership absorbed: `PASS`
- no broad repository/provider/software scan baseline: `PASS`
- token/time objective represented structurally: `PASS`
- implementation proof obligations identified: `PASS`
- planning-only credit remains zero: `PASS`

## Gate verdict
Planning completeness: `PASS`.
Implementation completeness: `NOT_STARTED`.
Evidence completeness: `NOT_APPLICABLE_YET_FOR_IMPLEMENTATION`.
Module state: `PLANNED_READY_FOR_IMPLEMENTATION`.

M04 frozen production weight is `17`. Planning earns `0/17`. Production credit requires implementation, tests, exact-head evidence and semantic audit.

## Required implementation proof families
The M04 Work Order must prove at minimum:
1. environment observation is explicit/injectable and startup remains scan/network/process silent;
2. environment variables are exact allowlist only and sensitive values cannot enter compact evidence;
3. local Git fact families are request-driven and independently observable/reusable;
4. repository absence, invalid repo, detached/unborn HEAD, status and remote gaps are truthful;
5. remote aliases never become canonical authority and M03 normalization/collision rules are reused;
6. local-only paths execute with zero provider calls;
7. GitHub provider lookup is exact-target and bounded;
8. stable provider repository ID strengthens M03 continuity only through the admitted identity contract;
9. provider capability checks are exact-operation scoped and do not imply authorization;
10. provider unavailable/permission/identity gaps remain distinct and non-mutating;
11. tool observation is exact logical-tool scoped and performs no broad inventory;
12. arbitrary repository executables cannot enter trusted probe execution;
13. safe tool probes use executable+argv, shell disabled, bounded time/output/cancellation;
14. version presence and M51 compatibility decision remain distinct;
15. no tool installation/update/repair occurs during preflight;
16. S05 requests only required fact families;
17. cheap blockers prevent unnecessary provider/tool calls;
18. independent reads may run concurrently only after prerequisite bindings are established;
19. optional gaps do not block mandatory-ready paths;
20. missing mandatory evidence never returns READY;
21. configuration and identity remain distinct facts;
22. NEW_PROJECT/BROWNFIELD mode is not guessed from arbitrary heuristics;
23. project/repository identity cannot be reconstructed from cwd/HEAD/remote alias;
24. compact expected-state bindings can be carried to later mutation revalidation;
25. changed relevant state causes targeted stale/block classification;
26. weaker reused observations cannot satisfy stronger requirements;
27. preflight performs no hidden repair/mutation across config/Git/provider/tool surfaces;
28. baseline project-state preflight does not require recursive repository scan;
29. compact snapshot/receipts exclude unnecessary raw paths, environment maps, provider payloads and tool output;
30. deterministic fixtures prove Windows/Linux/macOS observation semantics where applicable;
31. strict typecheck/build and focused tests pass with no skipped critical path;
32. hosted exact-head CI evidence exists and no blocking semantic finding remains.

## Implementation architecture constraint
Prefer one provider-neutral M04 package/surface with injected environment, Git, provider and tool ports plus a project-preflight composer. Do not introduce actual Git mutation, provider mutation, broad capability registry, compatibility matrix, persistent registry or transaction engine ownership.

## Performance contract
Implementation must make the common path faster than naive all-facts discovery by construction:
- no discovery at import/startup;
- requirements compile to the smallest fact graph;
- cheap blockers before expensive calls;
- zero hosted calls for local-only operations;
- exact tool probes only when selected path requires them;
- bounded parallel independent reads;
- per-invocation memoization/reuse keyed by relevant dependencies;
- compact normalized results instead of raw output propagation.

Quantitative regression thresholds remain M63-owned, but M04 must expose enough deterministic counters/hooks to permit later measurement without adding broad telemetry ownership.

## Ownership result
M04 owns read-only deterministic preflight/discovery contracts and their implementation only. M05/M06 retain transactional mutation/filesystem safety; M13 adoption; M17-M19 continuity/registry; M21/M23 progress/status; M29 Git execution; M30-M33 hosted mutations/governance/CI/release; M38 capability registry; M51 compatibility policy; M63 performance benchmarks.

## Progress truth
- Production denominator: `1088`
- Earned before M04 implementation: `70`
- Remaining: `1018`
- Official completion: `6.43%`
- M04 weight: `17`
- M04 earned: `0`
- Potential after approved M04 MODULE_DONE: `87 / 1088 = 8.00%`
- Potential remaining after M04 MODULE_DONE: `1001 / 1088 = 92.00%`
- Denominator changed: `NO`

## Next-stage rule
The only legal next production increment is compilation/admission of `GBS-WO-M04-001 — Implement Preflight & Discovery Foundation`. Do not begin M05. Do not award M04 credit before exact-head implementation evidence and semantic audit.

STOP CONDITION: `GBS_WO_M04_001_REQUIRED`.
