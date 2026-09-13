# GBS-M06 — Filesystem Safety Module Gate

Status: `PLANNED_READY_FOR_IMPLEMENTATION`

## Planning evidence
- S01 Allowed Paths: `FROZEN` — PR `#105` — merge `c58db5541c7b1d636118992603ee61ce47a12946`
- S02 Overwrite Policy: `FROZEN` — PR `#107` — reviewed head `b83b042fc22cdba110241237a144a5d4058628c2` — merge `096cec4c9816e755188433275e475f3cf1248f0e`
- S03 Symlink Safety: `FROZEN` — PR `#109` — semantic blob `62f940f59bf8d52de79f66565a1660b266797f0a` — merge `d995aba58eb7b0009cf17140a86a61b06128e298`
- S04 Atomic Writes: `FROZEN` — PR `#111` — reviewed head `81d0ea7ab89220576764a55104369db005520e1d` — merge `048abd44fa42c33f8434410c3f0a1882a62d3d50`

## Gate synthesis
M06 planning is complete and internally coherent. The four sessions form one physical filesystem contract:
1. S01 grants exact root/path authority.
2. S02 decides occupancy/overwrite/no-clobber policy.
3. S03 proves current traversal/alias safety without treating ordinary path resolution as authority.
4. S04 selects the strongest truthful physical primitive/atomicity/durability capability and composes the result for M05.

## Architecture compatibility
`PASS`.

M06 remains the physical filesystem layer under the existing kernel/application architecture. M05 remains the logical transaction authority. Git and hosted-provider mutation remain separate owners. No session introduces a competing lifecycle, transaction engine or provider model.

## Security compatibility
`PASS`.

The frozen contract preserves default-deny path authority, exact target/state binding, no-clobber semantics, link/reparse ambiguity blocking, race/staleness invalidation, recovery preservation, secret/path-minimized evidence and truthful effect certainty. It also forbids broad brownfield cleanup and unsupported guarantee claims.

## Ownership boundaries
`PASS`.

- M05 owns semantic plan/apply/rollback/idempotency and terminal transaction truth.
- M06 owns physical path, overwrite, traversal and final-effect guarantees.
- M29 owns Git mutation.
- M36 owns restart/orphan recovery orchestration.
- M37 owns global integrity policy.
- M51 owns supported platform/runtime compatibility policy.
- M54/M56/M58 own later integration/E2E/security harnesses.
- M63 owns quantitative performance thresholds.

## Implementation placement
`PASS`.

Prefer the existing kernel boundary rather than a new top-level package:

```text
packages/kernel/src/
  filesystem-types.ts
  filesystem-paths.ts
  filesystem-overwrite.ts
  filesystem-traversal.ts
  filesystem-atomic.ts
  filesystem-ports.ts
  filesystem-effect-adapter.ts
```

Exact filenames may be refined after dependency inspection. A new top-level production package requires a governed gate amendment. Public/persisted machine contracts belong in `packages/contracts` only when they cross package/process/public boundaries.

## M05 integration rule
M06 implementation must conform to the existing M05 physical-effect port boundary rather than bypass it. Missing physical capability returns a typed blocked/gap result. S01-S04 evidence must be exact-operation-bound and revalidated at the final effect boundary.

## Required implementation proof
The Work Order must require:
- strict TypeScript build/typecheck and locked dependency audit;
- full current deterministic repository validation;
- focused S01-S04 unit tests;
- deterministic Windows/Linux/macOS path-semantics fixtures;
- real temporary-filesystem integration tests on Ubuntu, Windows and macOS CI runners for every production capability claimed on that platform;
- path traversal/root containment/no-clobber tests;
- symlink/junction/reparse and stale-identity tests where the platform supports them;
- create/update/remove/move final-effect tests;
- same-filesystem versus cross-device behavior;
- staged replacement and post-state verification;
- atomic-visibility versus crash-durability classification tests;
- cancellation/timeout/effect-certainty tests;
- M05 integration tests proving no governance bypass or double effect;
- brownfield unrelated-file preservation;
- exact-head CI evidence and semantic review;
- no unresolved HIGH/CRITICAL security/integrity finding.

Unsupported platform/filesystem guarantees must be reported as explicit capability gaps. The implementation must not emulate a stronger guarantee with a weaker sequence merely to make a test pass.

## Gate verdict
- Planning completeness: `PASS`
- Architecture compatibility: `PASS`
- Security compatibility: `PASS`
- Neighbor ownership: `PASS`
- Implementation placement: `PASS`
- Required proof specification: `PASS`
- Known planning HIGH/CRITICAL findings: `NONE`
- Implementation completeness: `NOT_STARTED`
- Production evidence: `NOT_STARTED`
- M06 production weight earned: `0 / 18`
- Gate verdict: `PLANNED_READY_FOR_IMPLEMENTATION`

## Progress truth
- Production denominator: `1088`
- Earned: `107`
- Remaining: `981`
- Official completion: `9.83%`
- Official remaining: `90.17%`
- M06 weight: `18`
- M06 earned: `0`
- Potential after approved M06 MODULE_DONE: `125 / 1088 = 11.49%`
- Denominator changed: `NO`

## Next-stage rule
After exact-head approval and merge, compile exactly one bounded M06 implementation Work Order. Gate approval alone does not authorize implementation before that Work Order is separately admitted.

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.

STOP CONDITION: `M06_MODULE_GATE_PLANNED_READY_FOR_IMPLEMENTATION_PENDING_EXACT_HEAD_REVIEW`.
