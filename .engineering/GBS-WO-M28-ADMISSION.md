# GBS-WO-M28-001 — Admission Record

Status: `ADMITTED_PENDING_AUDIT`
Module: `GBS-M28 — Test Impact Engine`
Work Order: `.engineering/work-orders/GBS-WO-M28-001.md`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`
Frozen mechanisms: `32`
Planning gate: `.engineering/gates/M28-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR/review/merge: `#256` / `5225188302` / `1e66fb1c83cf0733d6200da994bee4361ed198dd`
Planning reviewed head/tree: `5eaa56c23832694df9af965624a0a512006eaae5` / `aa400146f2be94ae60ce3ccd5f9fc31269eb1fe2`
Work Order compilation PR/review/merge: `#257` / `5225201812` / `4e8b4f604cdecdb89d2755c0f598d064ba495d7c`
Legal execution base: `4e8b4f604cdecdb89d2755c0f598d064ba495d7c`

## Admitted scope
Only the bounded implementation of the 32 mechanisms frozen in M28 S01-S04, plus explicitly planned workspace registration/build/typecheck metadata required to register `packages/test-impact-engine`, is admitted.

## Context Lock
Execution context is locked to:
- exact legal base `4e8b4f604cdecdb89d2755c0f598d064ba495d7c` or a reviewed main descendant that preserves this admission without conflicting canonical changes;
- M28 Planning Gate and Ledger Sync frozen by PR #256;
- `GBS-WO-M28-001` compiled by PR #257;
- current M27 public DAH27/assurance contract;
- current owner-authorized M24/M25/M26 public contracts only where the Work Order requires their identities.

If Checkpoint, Scope, Architecture, M28 frozen planning, M27 assurance boundary or any relevant authority decision changes incompatibly, execution is `STALE` and must stop for recompile/rebase.

## Admitted implementation surface
- `packages/test-impact-engine/**` according to the frozen seed tree;
- `tests/m28-test-impact-engine.test.mjs`;
- `tests/m28-hardening.test.mjs`;
- `tests/m28-startup-purity.test.mjs`;
- `.github/workflows/m28-platform.yml`;
- minimal workspace package/build/typecheck metadata required for package registration.

No other production surface is admitted without an objective compilation dependency and a Correction Delta/audit where required.

## Preserved ownership
M24 evidence, M25 proof, M26 HEDS, M27 assurance, M29 Git, M32 CI execution/orchestration, M53-M58 framework/harness/security-test implementations, M63 scheduling/critical-path optimization, M17/M21/M23 checkpoint/progress/status and M33/M62 release/final acceptance remain external authorities.

M28 owns only test identity/map, concrete impact/selection, compatible reuse receipts, regression radius, uncertainty widening, exact-candidate test-impact facts and read-only downstream test-impact handoff.

## Preflight obligations
Executor MUST before mutation:
1. verify current branch descends from the legal execution base or reviewed compatible descendant;
2. read the Work Order and mandatory progressive-disclosure source set;
3. verify no conflicting canonical change makes the Context Lock stale;
4. inspect current workspace/package conventions and M27 public contracts only as needed;
5. record the exact base SHA in the implementation PR/evidence;
6. stop rather than guess if an authority/signature contradiction is found.

## Execution requirements
- implement exactly 32 frozen mechanisms;
- keep semantic core deterministic/provider-neutral/startup-pure;
- use injected domain-separated SHA-256;
- bound/cancel graph traversals;
- preserve fail-closed reuse and monotonic validation widening;
- do not implement Git/CI/scheduler/checkpoint/release authority;
- test/correct failures introduced by the Work Order;
- commit/push/open or update one implementation PR;
- produce exact-head evidence for independent audit;
- do not merge or self-promote MODULE_DONE.

## Required acceptance evidence
As frozen in `GBS-WO-M28-001`: registry 32/32; focused/adversarial/property tests; Ubuntu/Windows/macOS focused CI; full repository regression; canonical typecheck/build/lint; npm audit; CodeQL when triggered; startup purity; authority-denial; exact-candidate invalidation; TPRR fail-closed reuse; bounded/cancellable behavior; exact-head MAX_ASSURANCE semantic/integrity audit with unresolved CRITICAL/HIGH zero; separate MODULE_DONE promotion.

## Production accounting
Admission earns no weight. M28 remains `0 / 20`; production remains `491 / 1088 = 45.13%` until accepted implementation evidence is separately promoted.

STOP CONDITION: `GBS_WO_M28_001_ADMITTED_PENDING_AUDIT`.