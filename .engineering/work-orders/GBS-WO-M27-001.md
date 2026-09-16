# GBS-WO-M27-001 — Implement Assurance Pipeline

Status: `MODULE_DONE`
Risk: `HIGH`
Assurance intensity: `MAX_ASSURANCE`
Module: `GBS-M27 — Assurance Pipeline`
Canonical package: `packages/assurance-pipeline`
Canonical weight: `20`
Planning gate: `.engineering/gates/M27-PLANNING-GATE.md` (`PASSED`)
Ledger sync: `.engineering/ledgers/M27-ASSURANCE-PIPELINE-LEDGER-SYNC.md` (`FROZEN`)
Planning freeze PR: `#250`
Planning reviewed head: `e1b5972d8888a47da1f4ffecaeb940650945bdae`
Planning reviewed tree: `269792e3656b268d54d2ebd841fbe26dede7ba6d`
Planning review: `5223019733`
Planning merge / legal planning base: `80c1374198ed60769b71c8bc69364066edb90e17`
Work Order compilation PR/review/merge: `#251` / `5223065797` / `aa2be84aa0e3d64a8112c68baaa3a8e491dc6770`
Admission PR: `#252`
Admission reviewed head: `c43e88b673dcc844f56ff130bf871bfbaf551924`
Admission reviewed tree: `77ddb16f4741e387dbe021ae98b68aff9235063b`
Admission review: `5223088320`
Admission merge / execution base: `ccad870e757c4c30e7580768584038098d8466af`
Implementation PR: `#254`
Implementation reviewed head: `71f18700de1b99f39a6febc7f358a6b98f224ad6`
Implementation reviewed tree: `5c54c3270d7f57be7cadbd3ddc1fad4da2e556c3`
Implementation semantic/integrity audit: `5224201157`
Implementation merge: `4c3fd74673ea803fb18d0d173772779d4e88698b`
Evidence: `.engineering/evidence/GBS-WO-M27-001-EVIDENCE.md`

## OBJECTIVE
Implement the deterministic provider-neutral assurance pipeline frozen in M27 S01-S05. M27 derives a monotonic assurance floor from canonical risk facts, compiles exact assurance obligations, admits current M24/M25/M26 truth read-only, enforces required validation/security/platform/exact-candidate gates, and emits an independently recomputable assurance verdict/history plus read-only downstream handoff.

## REQUIRED IMPLEMENTATION
All `40` frozen mechanisms:
- S01: AIC27, AAB27, ACF27, ARP27, HSF27, ABG27, FCE27, ACG27;
- S02: ARM27, APM27, OBG27, PCG27, DAB27, PHG27, HHG27, RCS27;
- S03: EAG27, PSG27, HSG27, ECG27, UAG27, BSG27, CAG27, AER27;
- S04: AEP27, LFG27, EHF27, RPG27, SAG27, CFG27, BMG27, VAG27;
- S05: AVC27, AIR27, ASD27, ATR27, ARG27, ASW27, ARW27, DAH27.

## CORE CONTRACTS
The assurance taxonomy is `STANDARD < STANDARD_PLUS < ELEVATED < HIGH_ASSURANCE < MAX_ASSURANCE`. Caller request may raise but never lower the risk-derived floor. Missing/conflicting mandatory risk truth cannot default weaker. Token/search/file/test/latency budgets never override assurance obligations. High-risk minority signals cannot be masked by low-risk majority.

M24 remains evidence authority; M25 proof authority; M26 semantic-review authority. M27 consumes only current owner-authorized facts and never self-accepts evidence, recomputes upstream proof authority, edits HEDS findings, selects concrete tests, operates Git/CI, promotes checkpoints or calculates progress/status. M28 owns concrete test impact/selection/reuse; M29 Git; M32 CI orchestration; M34/M35/M58 security controls/tests; M33/M62 release/final production acceptance.

M27 owns the required validation-category/ladder floor. EHF27 requires final exact-candidate assurance when the profile demands it. Before M29, candidate identity remains provider-neutral and binds canonical candidate/config/runtime/toolchain identities; future M29 Git head/tree is additive owner-authorized context, not an ambient core dependency.

Final states are `ASSURED | CORRECTION_REQUIRED | BLOCKED | INDETERMINATE | TRUNCATED`. `ASSURED` requires current class/profile/policy/candidate, every mandatory assurance obligation closed by current accepted truth, required validation floor, exact-candidate sweep where required, no unresolved authority/context conflict, no silent truncation, and unresolved/indeterminate CRITICAL/HIGH findings equal to zero. Zero CRITICAL/HIGH is necessary but not sufficient.

## IMPLEMENTATION SEED TREE
Bounded file topology frozen by planning:
- `packages/assurance-pipeline/package.json`
- `packages/assurance-pipeline/tsconfig.json`
- `packages/assurance-pipeline/src/types.ts`
- `packages/assurance-pipeline/src/utils.ts`
- `packages/assurance-pipeline/src/registry.ts`
- `packages/assurance-pipeline/src/s01-classification.ts`
- `packages/assurance-pipeline/src/s02-requirements.ts`
- `packages/assurance-pipeline/src/s03-admission.ts`
- `packages/assurance-pipeline/src/s04-gates.ts`
- `packages/assurance-pipeline/src/s05-verdict.ts`
- `packages/assurance-pipeline/src/public.ts`
- `tests/m27-assurance-pipeline.test.mjs`
- `tests/m27-hardening.test.mjs`
- `tests/m27-startup-purity.test.mjs`
- `.github/workflows/m27-platform.yml`
- workspace package/build/typecheck metadata only as needed for package registration.

Executor navigation: read M24/M25/M26 public contracts and M27 frozen Source Pack; do not repository-wide-search unless a declared dependency/signature is missing, stale or contradictory. Do not reopen frozen taxonomy/ownership without an objective contradiction.

## REQUIRED EVIDENCE
MAX_ASSURANCE acceptance requires registry `40/40`; assurance-class monotonicity/property tests; caller downgrade/upgrade attacks; high-signal masking and budget-pressure attacks; current M24/M25/M26 handoff/authority verification; stale/mix-and-match evidence/proof/review attacks; obligation ownership/policy conflicts; uncertainty widening; severity integrity; validation-ladder floor enforcement; exact-candidate full-sweep invalidation; config/runtime/platform/security drift and TOCTOU freshness; verdict/integrity recomputation; replay/split-brain/regression/reopen/truncation; downstream authority-denial; bounded/cancellable traversal; injected domain-separated SHA-256; startup purity; focused Ubuntu/Windows/macOS CI; full repository regression; `npm audit --audit-level=low`; Security CodeQL when triggered; exact-head MAX_ASSURANCE semantic/integrity review with unresolved CRITICAL `0`, HIGH `0`; and separate MODULE_DONE promotion.

## OUT OF SCOPE
Concrete test selection/reuse is M28; Git/head operations M29; CI orchestration M32; evidence acceptance M24; proof decisions M25; semantic findings/review M26; security control ownership M34/M35/M58; checkpoint/progress/status M17/M21/M23; release/final acceptance M33/M62; durable audit storage M44.

## EXECUTION BASE
The admitted implementation base is `ccad870e757c4c30e7580768584038098d8466af`. Implementation branches must descend from this merge or a reviewed main descendant preserving the admitted contract.

## ACCEPTED EVIDENCE
- mechanisms: `40 / 40`;
- focused tests: `27 / 27 PASS` on Ubuntu, Windows and macOS;
- full regression: `1061 / 1061 PASS`;
- typecheck: `PASS` on all three focused runners;
- dependency audit: `0 vulnerabilities`;
- CodeQL TypeScript: `PASS`;
- unresolved CRITICAL: `0`;
- unresolved HIGH: `0`;
- implementation verdict: `APPROVED` on exact head `71f18700de1b99f39a6febc7f358a6b98f224ad6`;
- implementation merge: `4c3fd74673ea803fb18d0d173772779d4e88698b`.

## CREDIT RULE
The implementation evidence is accepted. M27 receives `20 / 20` only when the separate MODULE_DONE promotion PR containing this Work Order transition, Evidence Bundle and canonical Checkpoint Delta is exact-head audited and merged. After that merge production becomes `491 / 1088 = 45.13%` and M28 becomes the next planning-only module.

STOP CONDITION: `GBS_WO_M27_001_MODULE_DONE`.