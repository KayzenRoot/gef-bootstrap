# Direct Execution Brief — GBS-V11-WO-012

## Authority and exact base

Execute only `.engineering/work-orders/GBS-V11-WO-012.md` under `.engineering/context-locks/GBS-V11-WO-012.json`.

- Repository: `KayzenRoot/gef-bootstrap`
- Issue: `#361`
- Branch: `hotfix/v1.1.2-release-state-preflight`
- Main admission base: `5a32a607ccf2055fab722f3d5d452791c6aae3e6`
- Work Order admission commit: `a83cacd7e5fe4ab1507a21b3a55dab61e78af773`
- Context Lock commit: `63860253ecfbfb55c6e6f34e3240b66918e59532`
- Executor: Codex, per ADR-0008 / D-0063 and `AGENTS.md`.

## CONTEXT LOCK CHECK

Before changing product code:
1. fetch `origin/main` and this branch;
2. verify main still equals the captured base or stop `STALE`;
3. verify every canonical fingerprint in the Context Lock against the admission base;
4. inspect current branch diff and confirm only WO-012 governance artifacts exist;
5. inspect the actual V1.1.1 release/recovery workflow and relevant adoption/init/preflight code before designing the implementation delta.

If any authority or fingerprint changed, do not guess. Stop with the exact stale source/ref.

## PREFLIGHT / DIAGNOSIS

Reproduce each claimed bug before fixing it:
- stale checkpoint/release-state assertions for the now-published V1.1.1;
- the post-publish artifact-download regression case, proving the repository-bound command is required;
- Fairview-class consumer failure: planned GEF-owned state is rejected by an existing deterministic fail-closed impact/governance contract;
- verify IRIS, HIVE and Neryn blockers are not falsely classed as GEF product bugs unless repository evidence proves otherwise.

Locate the smallest existing abstraction that can host consumer-safe adoption preflight. Do not invent GitHub-specific core semantics and do not broadly scan arbitrary scripts unless an existing contract makes that deterministic and bounded.

## TDD

For each product behavior change:
1. write a focused failing regression test;
2. run it and capture the expected failure;
3. implement the smallest causal fix;
4. rerun focused tests to GREEN;
5. run impacted integration suites;
6. run the full governed validation set.

A test that passes before the implementation change is not accepted as regression proof.

## IMPLEMENTATION RULES

- Keep CLI thin; prefer existing application/adoption/preflight boundaries.
- Preflight may block only from deterministic evidence already owned by the consumer repository.
- A block must be typed, explain the exact incompatible contract/path/rule, and occur before filesystem mutation.
- Compatible consumers remain unaffected.
- Unknown/ambiguous consumer policy must remain truthful. Never map uncertainty to an optimistic ALLOW.
- Preserve v1.1.1 immutable release artifacts.
- Version every necessary 1.1.2 surface consistently.
- Extend release workflows without reducing provenance/signature/SRI/security checks.
- No consumer repository writes in this Work Order.
- No unrelated cleanup/refactor.

## REQUIRED VERIFICATION

At minimum:
- focused WO-012 tests;
- relevant existing V1.1 release/adoption/init/doctor/status/upgrade tests;
- `npm run build`;
- `npm run typecheck`;
- `npm run validate`;
- `npm audit --audit-level=high`;
- `git diff --check`;
- JSON/schema parsing for changed machine contracts;
- exact candidate tarball pack/install smoke;
- required GitHub/security/cross-platform checks on exact PR head.

Correct every failure introduced by WO-012. Do not suppress existing gates.

## DELIVERABLE / GIT

Commit and push only to `hotfix/v1.1.2-release-state-preflight`. Update the single WO-012 PR. Produce:
- `.engineering/evidence/GBS-V11-WO-012-EVIDENCE.md`;
- `.engineering/evidence/GBS-V11-WO-012-RELEASE-MANIFEST.json`;
- `.engineering/checkpoint-deltas/GBS-V11-WO-012-PROPOSED.md`.

Evidence must include exact base/head, changed files, RED→GREEN proof, complete verification results, package identity, security/provider evidence, corrected defects, remaining HIVE/Neryn/other consumer-owned blockers and risks.

Do not merge, tag or publish. Final execution stop:
`GBS_V11_WO_012_EXACT_HEAD_READY_FOR_OWNER_AUDIT`.

Final executor summary/review notes must be in Brazilian Portuguese.
