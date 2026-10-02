# GBS-V12-WO-000 - Codex read-only V1.1.2 baseline execution brief

**Parent:** Issue #367 / GBS-V12-WO-000  
**Purpose:** capture a reproducible V1.1.2 baseline before any V1.2 implementation admission.  
**Product mutation:** `FORBIDDEN`  
**Implementation authority:** `NONE`  
**Pinned source base:** `203dc6a86de035b8502453100ea6e2a4788cae57`  
**Expected source tree:** `6b66139b7df03c0041a0c785057afb29d9a47428`  
**Expected package version:** `1.1.2`

## 1. Freshness gate

Before running benchmarks:

1. fetch current provider refs/tags;
2. confirm `origin/main == 203dc6a86de035b8502453100ea6e2a4788cae57`;
3. confirm the pinned commit tree is `6b66139b7df03c0041a0c785057afb29d9a47428`;
4. confirm `package.json.version == 1.1.2`;
5. confirm no existing worktree/repository mutation is needed.

If current `origin/main` moved, stop. Do not silently rebase the baseline.

Stop: `GBS_V12_WO_000_BASE_STALE_REFRESH_REQUIRED`.

## 2. Isolation

Run all measurements from a temporary detached worktree/check-out at the exact pinned base.

Do not benchmark from the WO-000 planning branch because its documentation commits are not the released V1.1.2 baseline population.

Use the repository's current CI-compatible dependency installation procedure. Record the exact Node, npm, TypeScript, OS release and architecture.

Temporary `node_modules`, build output and operating-system temp fixtures are permitted. Tracked product source mutation is not.

## 3. Quality gate before optimization evidence

At the pinned base run and record:

- `npm run build -- --force`
- `npm run typecheck`
- `npm run validate`
- `npm audit --audit-level=high`
- `git diff --check`

After these commands, record `git status --porcelain`.

Any tracked source change makes the baseline invalid.

CRITICAL/HIGH dependency/security finding or failed validation makes the baseline quality gate `FAIL` and blocks optimization claims. Do not repair product code inside WO-000.

## 4. Focused capability baseline

Run the existing tests, without editing them:

```
node --test \
  tests/v11-wo-002-cli-e2e.test.mjs \
  tests/v11-wo-005-execution-capsule.test.mjs \
  tests/v11-wo-006-incremental-validation.test.mjs \
  tests/v11-wo-007-proof-reuse.test.mjs \
  tests/v11-wo-008-performance-telemetry.test.mjs \
  tests/v11-wo-012-adoption-preflight.test.mjs
```

These provide released evidence for:
- greenfield/adoption CLI behavior;
- execution capsule/pack binding;
- incremental validation;
- proof reuse;
- performance telemetry truth semantics;
- safe adoption preflight.

Record pass/fail/test count and wall-clock when the executor exposes it. If exact timing is not available, use `UNAVAILABLE`; do not estimate.

## 5. Existing matched CLI ROI benchmark

Reuse the released benchmark exactly.

After the quality gate is proven on the same pinned commit:

```
GEF_BENCHMARK_QUALITY_GATE_STATUS=PASS \
node .engineering/benchmarks/v1.1/cli-roi.mjs
```

Capture the JSON output without changing the benchmark script.

Required interpretation:
- compare only exact P1-P8 matched populations;
- preserve all seven repeated samples;
- token metrics remain `UNAVAILABLE` when not exposed;
- do not convert latency delta into a V1.2 speedup claim;
- this is a V1.1.2 baseline capture only.

## 6. Baseline dimensions for WO-000

Record, using existing evidence/tests only:

### B1 - Greenfield bootstrap
Evidence source: CLI E2E + matched `GREENFIELD_INIT_PLAN` benchmark.

### B2 - Brownfield adoption
Evidence source: CLI E2E + adoption preflight tests.

If no existing repeatable timing harness exists for brownfield adoption, record timing as `NOT_YET_BASELINED`. Do not create a new timing harness in this execution.

### B3 - Execution-pack / Marathon precursor
Evidence source: WO-005 execution capsule plus released M14/M15/M63 public surfaces.

Record capability presence, not a V1.2 completion percentage.

### B4 - Incremental validation / proof reuse
Evidence source: WO-006 and WO-007 tests plus M25-M28 public surfaces.

Record current behavior and any explicit `UNKNOWN`/fail-closed state.

### B5 - Performance telemetry
Evidence source: WO-008 tests and existing immutable telemetry/baseline primitives.

Record whether baseline population identity, quality-gate invalidation and incomparable-population behavior pass.

### B6 - Adoption compatibility safety
Evidence source: WO-012 adoption-preflight tests.

Record pass/fail and any current known unsupported/unknown classification. Do not mutate consumer repositories.

## 7. Evidence outputs

Return to branch `planning/v1.2-wo-000-admission` only to write exactly:

- `.engineering/evidence/GBS-V12-WO-000-BASELINE.md`
- `.engineering/evidence/GBS-V12-WO-000-BASELINE.json`

The JSON must contain only deterministic/allowlisted evidence:

```json
{
  "schemaVersion": 1,
  "kind": "GBS_V12_WO000_V11_BASELINE",
  "sourceCommit": "203dc6a86de035b8502453100ea6e2a4788cae57",
  "sourceTree": "6b66139b7df03c0041a0c785057afb29d9a47428",
  "packageVersion": "1.1.2",
  "environment": {},
  "qualityGate": {},
  "focusedBaseline": {},
  "cliRoi": {},
  "comparability": {},
  "limitations": [],
  "trackedSourceMutation": false
}
```

Do not include secrets, user paths, environment dumps, raw prompts, tokens/credentials or unrelated machine information.

The Markdown receipt explains the same evidence in human-readable form and explicitly labels unavailable/incomparable measurements.

## 8. Commit and PR boundary

Only the two baseline evidence files may be added by this execution.

Do not edit:
- product/runtime code;
- tests;
- workflows;
- package manifests/lockfile;
- checkpoint;
- Scope/Requirements/Architecture/Security/Test/Deployment/DoD;
- WO-000/Context Lock/Source Map;
- archived V1.2 research files.

Commit/push the two receipts to the existing branch and PR #368.

## 9. No optimization conclusion yet

This run establishes the released V1.1.2 baseline. It does not compare against V1.2 because V1.2 implementation does not exist.

Allowed outcome:
`BASELINE_CAPTURED_NO_V12_COMPARISON`.

Do not report percentage improvement, implementation progress or delivery ETA.

## STOP CONDITION

`GBS_V12_WO_000_BASELINE_CAPTURED_READY_FOR_SOURCE_AUDIT_OWNER_DECISIONS`
