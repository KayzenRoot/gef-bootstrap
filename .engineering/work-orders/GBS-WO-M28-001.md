# GBS-WO-M28-001 — Implement Test Impact Engine

Status: `COMPILED_PENDING_AUDIT`
Risk: `HIGH`
Assurance intensity: `MAX_ASSURANCE`
Module: `GBS-M28 — Test Impact Engine`
Canonical package: `packages/test-impact-engine`
Canonical weight: `20`
Planning gate: `.engineering/gates/M28-PLANNING-GATE.md` (`PASSED`)
Ledger sync: `.engineering/ledgers/M28-TEST-IMPACT-ENGINE-LEDGER-SYNC.md` (`FROZEN`)
Planning freeze PR/review/merge: `#256` / `5225188302` / `1e66fb1c83cf0733d6200da994bee4361ed198dd`
Planning reviewed head/tree: `5eaa56c23832694df9af965624a0a512006eaae5` / `aa400146f2be94ae60ce3ccd5f9fc31269eb1fe2`

## OBJECTIVE
Implement the deterministic provider-neutral Test Impact Engine frozen in M28 S01-S04. M28 maps source/contracts to tests, computes concrete impacted validation, reuses prior green test proof only under exact compatible bindings, derives a monotonic regression radius, widens under uncertainty and emits exact-candidate/read-only downstream handoffs without absorbing evidence, proof, HEDS, assurance, Git, CI, checkpoint or release authority.

## CONTEXT
Canonical production before M28 implementation is `491 / 1088 = 45.13%`. M28 is `0 / 20` until separate MODULE_DONE promotion.

M27 supplies assurance requirements/read-only DAH27 truth. M24 remains evidence acceptance authority, M25 proof authority, M26 HEDS authority, M27 assurance verdict authority. M29 owns Git, M32 CI execution/orchestration, M63 scheduling/concurrency/critical-path optimization, M17/M21/M23 checkpoint/progress/status and M33/M62 release/final acceptance.

## SCOPE
Implement all `32` frozen mechanisms:
- S01: TIC28, SFP28, TFP28, STM28, TDM28, PRC28, DKC28, TMG28;
- S02: AHG28, ICD28, TSP28, TPR28, TRV28, RUG28, FFI28, TSR28;
- S03: PVL28, RRE28, FSR28, BIP28, RWE28, VCE28, CTG28, VPR28;
- S04: UCL28, UEW28, DTS28, XCG28, EH28, VWS28, TIR28, TIH28.

## OUT OF SCOPE
- accepting/rejecting raw evidence: M24;
- proof sufficiency/carry-forward mutation: M25;
- semantic review/findings: M26;
- assurance classification/final assurance verdict: M27;
- Git identity/mutations: M29;
- CI execution/workflow orchestration authority: M32;
- test framework/harness/security-test implementation ownership: M53-M58;
- validation scheduling/critical-path optimization: M63;
- checkpoint/progress/status: M17/M21/M23;
- release/final production acceptance: M33/M62.

## FILES / SOURCES TO READ
Mandatory progressive-disclosure read set:
1. `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json`;
2. `.engineering/SOURCE-HIERARCHY.md`;
3. `.engineering/gates/M28-PLANNING-GATE.md`;
4. `.engineering/ledgers/M28-TEST-IMPACT-ENGINE-LEDGER-SYNC.md`;
5. M28 `S01..S04` frozen planning files;
6. `.engineering/decisions/ADR-0002-PLANNING-TO-EXECUTION-ACCELERATION.md`;
7. `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md`;
8. `packages/assurance-pipeline/src/public.ts` and only the M27 types/functions needed for DAH27/current assurance binding;
9. M24/M25/M26 public contracts only when a declared signature/identity is required.

Repository-wide search is escalation-only when a declared dependency/signature is missing, stale or contradictory.

## IMPLEMENTATION SEED TREE
Create only the bounded planned topology unless objective compilation evidence requires a small workspace-registration delta:
- `packages/test-impact-engine/package.json`
- `packages/test-impact-engine/tsconfig.json`
- `packages/test-impact-engine/src/types.ts`
- `packages/test-impact-engine/src/utils.ts`
- `packages/test-impact-engine/src/registry.ts`
- `packages/test-impact-engine/src/s01-source-test-map.ts`
- `packages/test-impact-engine/src/s02-selection-reuse.ts`
- `packages/test-impact-engine/src/s03-regression-radius.ts`
- `packages/test-impact-engine/src/s04-uncertainty-handoff.ts`
- `packages/test-impact-engine/src/public.ts`
- `tests/m28-test-impact-engine.test.mjs`
- `tests/m28-hardening.test.mjs`
- `tests/m28-startup-purity.test.mjs`
- `.github/workflows/m28-platform.yml`
- workspace `package.json` / `package-lock.json` / build/typecheck metadata only as required to register the package.

## REQUIREMENTS
1. Stable test identity MUST not depend on display name, runner order or transient invocation IDs.
2. Source/contract fingerprints MUST be owner-authorized projections; M28 cannot manufacture source truth.
3. Test fingerprints MUST bind body plus relevant fixture/config/toolchain/platform requirements.
4. Source/test and dependency graphs MUST be deterministic, provenance-bearing and permutation invariant.
5. Missing/partial/conflicting/truncated dependency knowledge MUST NOT reduce selection.
6. Concrete test selection MUST include direct, transitive, boundary, platform, risk and assurance-mandated obligations.
7. TPR28 reuse MUST bind test/source/dependency/config/fixture/toolchain/runtime/platform/policy/candidate/evidence identities.
8. Only `REUSABLE` may suppress a repeated intermediate invocation; every other reuse state fails closed.
9. Current failure MUST dominate older green proof.
10. M24 remains authority for whether referenced PASS evidence is accepted/current; M28 only evaluates compatibility for current reuse.
11. PVL28 MUST implement L0-L5 monotonic validation semantics.
12. RRE28 radius MUST be the maximum of impact, dependency, boundary, assurance floor, risk, uncertainty, failure and platform requirements.
13. Failure-scoped retest MUST rerun failed/impacted/boundary work first without suppressing broader mandatory L4/L5 obligations.
14. M28 MAY describe parallel-safe validation waves but MUST NOT execute/schedule CI or delete obligations for performance.
15. Unknown/conflict/systemic uncertainty MUST widen according to frozen S04 rules.
16. Dynamic/unmodeled test surfaces MUST be visible and conservative.
17. EH28 exact-candidate handoff MUST bind candidate, policy/profile, map, selected set, config/runtime/toolchain/platform and unresolved uncertainty.
18. A changed exact-candidate binding MUST invalidate the affected handoff/reuse truth.
19. TIH28 MUST be read-only and deny adjacent authority escalation.
20. Semantic core MUST be startup-pure, provider-neutral, deterministic, bounded/cancellable and use injected domain-separated SHA-256.

## ARCHITECTURE RULES
- pure semantic functions first; adapters at boundaries;
- no ambient filesystem/network/Git/clock in semantic core;
- no newest-pass-wins;
- no filename-only impact heuristics as proof of completeness;
- no cache entry overrides current failure;
- no unknown platform assumed portable;
- no caller test budget can weaken radius;
- no intermediate reuse manufactures L5 evidence;
- no scheduler/CI adapter can silently shrink TSP28/TIR28 obligations;
- canonical ordering and independently recomputable receipts/results;
- explicit cancellation/truncation states;
- bounded graph traversal and cycle safety.

## CONSTRAINTS
- preserve existing M00-M27 behavior and tests;
- no destructive repository cleanup;
- no force-push/history rewrite;
- no denominator/checkpoint/progress mutation in implementation PR;
- no M29/M32/M63 implementation smuggling;
- brownfield discovery must preserve healthy existing tests/conventions;
- workspace changes must be minimal and directly required by package registration.

## ACCEPTANCE CRITERIA
- registry proves `32 / 32` frozen mechanisms exactly once;
- all public outputs are deterministic for semantically equivalent permutations;
- graph conflicts/unknown/truncation widen or block, never shrink;
- compatible accepted TPRR can be reused and stale/forged/cross-context TPRR cannot;
- current failure invalidates conflicting prior green reuse;
- PVL L0-L5 and regression-radius monotonicity are proven;
- exact-candidate mutation invalidates affected final handoff;
- dynamic test surface uncertainty is visible;
- VWS28 cannot lose obligations;
- downstream authority escalation is denied;
- cancellation/oversized graph behavior is bounded and explicit;
- digest failure fails closed;
- startup purity passes;
- focused M28 CI passes on Ubuntu, Windows and macOS;
- full repository regression passes;
- dependency/security audit passes and CodeQL passes when triggered;
- exact-head MAX_ASSURANCE semantic/integrity audit finds unresolved CRITICAL `0`, HIGH `0`;
- separate MODULE_DONE promotion is required before M28 earns weight.

## TESTS
Required focused families include:
- registry/identity/map determinism and permutation properties;
- duplicate/conflicting stable IDs;
- changed test body, fixture, config, toolchain, runtime and platform;
- missing/partial/conflicting graph and hidden dependency;
- graph cycle, oversized graph, cancellation/truncation;
- accepted reusable TPRR and every stale/indeterminate reuse state;
- forged evidence ID and rejected M24 evidence;
- cross-project/lineage/policy/candidate receipt splice;
- old green + current failure;
- direct/closure/boundary/risk/assurance/platform radius;
- L0-L5 monotonic ladder;
- failure-scoped correction loop;
- dynamic/generated/runtime-discovered test surface;
- exact-candidate one-byte/semantic identity change;
- wave omission/shared-state concurrency constraint;
- TIR28/TIH28 tamper and consumer mismatch;
- startup import purity.

Also run repository typecheck/build/lint where canonical, full regression, `npm audit --audit-level=low`, and CodeQL when the workflow triggers it.

## DELIVERABLES
- bounded M28 package and tests/workflow;
- no unrelated production files;
- Evidence Bundle after successful exact-head validation;
- PR description naming base/head, mechanisms, tests and known risks;
- proposed Checkpoint Delta only after implementation acceptance, never self-promoted by executor.

## REVIEW FORMAT
Final executor report in Brazilian Portuguese:
- Work Order ID and exact base/head SHA;
- files changed;
- 32/32 registry evidence;
- tests/typecheck/build/lint/security results;
- failures encountered and corrections made;
- authority-boundary proof;
- remaining risks/findings;
- Evidence Bundle location;
- proposed Checkpoint Delta;
- STOP CONDITION.

## STOP CONDITION
Stop after implementation PR is open/updated and all required evidence available for independent exact-head audit. Do not merge the implementation PR and do not promote MODULE_DONE yourself.

STOP CONDITION: `GBS_WO_M28_001_COMPILED_PENDING_AUDIT`.