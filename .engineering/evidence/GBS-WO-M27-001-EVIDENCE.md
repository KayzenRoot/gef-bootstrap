# GBS-WO-M27-001 — Evidence Bundle

Status: `IMPLEMENTATION_APPROVED_PENDING_MODULE_DONE_PROMOTION`
Module: `GBS-M27 — Assurance Pipeline`
Work Order: `GBS-WO-M27-001`
Risk: `HIGH`
Assurance intensity: `MAX_ASSURANCE`
Frozen weight: `20`
Required mechanisms: `40`

## Exact implementation identity
- implementation PR: `#254`
- reviewed head: `71f18700de1b99f39a6febc7f358a6b98f224ad6`
- reviewed tree: `5c54c3270d7f57be7cadbd3ddc1fad4da2e556c3`
- exact-head semantic/integrity audit: `5224201157`
- implementation merge: `4c3fd74673ea803fb18d0d173772779d4e88698b`
- admitted execution base: `ccad870e757c4c30e7580768584038098d8466af`

GitHub does not permit the PR author account to submit a formal `APPROVE` review to its own PR. Review `5224201157` therefore records the exact-head audit as an anchored `COMMENT` with technical verdict `APPROVED`; the evidence and merge remained SHA-bound and no protection criterion was relaxed.

## Scope evidence
The implementation stayed within the admitted M27 surface:
- `packages/assurance-pipeline/**`;
- `tests/m27-assurance-pipeline.test.mjs`;
- `tests/m27-hardening.test.mjs`;
- `tests/m27-startup-purity.test.mjs`;
- `.github/workflows/m27-platform.yml`;
- workspace `package.json` / `package-lock.json` registration and build/typecheck metadata.

No M28 test-selection authority, M29 Git authority, M32 CI-orchestration authority, checkpoint/progress/status authority, security-owner authority or release authority was added.

## Mechanism evidence
Registry: `40 / 40` frozen mechanisms represented exactly once.

S01:
`AIC27 AAB27 ACF27 ARP27 HSF27 ABG27 FCE27 ACG27`

S02:
`ARM27 APM27 OBG27 PCG27 DAB27 PHG27 HHG27 RCS27`

S03:
`EAG27 PSG27 HSG27 ECG27 UAG27 BSG27 CAG27 AER27`

S04:
`AEP27 LFG27 EHF27 RPG27 SAG27 CFG27 BMG27 VAG27`

S05:
`AVC27 AIR27 ASD27 ATR27 ARG27 ASW27 ARW27 DAH27`

## Trust and authority evidence
Verified implementation properties include:
- assurance class is monotonic; caller may raise but cannot lower the risk-derived floor;
- a CRITICAL minority signal forces the required stronger assurance class and cannot be masked by lower-risk majority signals;
- missing/unknown risk truth fails closed;
- budget pressure cannot weaken assurance;
- risk profiles require injected trusted risk-profile digests;
- upstream context and validation require externally trusted bindings;
- M24 DPC24, M25 DPH25 and M26 DHH26 handoffs are checked for integrity/current identity;
- a valid handoff spliced from another context is blocked by binding identity;
- validation ladder and exact-candidate requirements are enforced;
- validation-category evidence is backed by accepted M24 evidence rather than caller-declared booleans;
- stale proof truth remains `INDETERMINATE` rather than being converted into false success/correction;
- open HIGH finding blocks assurance and the finding set participates in binding identity;
- verdict tamper, replay duplicate, split brain and silent ASSURED regression/reopen are detected;
- DAH27 grants no M28/Git/CI/checkpoint/release authority;
- SHA-256 is injected/domain-separated and malformed digest capability fails closed;
- traversals are bounded/cancellable;
- public import is startup-pure.

## Correction closure
During exact-head validation, typecheck exposed that `s05-verdict.ts` still accepted ordinary `OperationOptions` after the trust-boundary hardening made `evaluateAssurance` require `TrustedAssuranceOperationOptions`.

Correction commits on the same implementation PR:
- `a1f9518cc5944538e1b37bcf6aa517978e72f532` — propagate trusted assurance options through S05 verdict/downstream boundaries;
- `71f18700de1b99f39a6febc7f358a6b98f224ad6` — align M27 fixtures with trusted validation/upstream bindings.

The correction did not weaken the trust model; it propagated the stronger contract to the callers and updated tests to prove the external bindings.

## Test and CI evidence
M27 workflow run: `35110132477`.

Focused matrix:
- Ubuntu: `27 / 27 PASS` + typecheck PASS + npm audit PASS;
- Windows: `27 / 27 PASS` + typecheck PASS + npm audit PASS;
- macOS: `27 / 27 PASS` + typecheck PASS + npm audit PASS.

Full repository regression on the exact PR merge candidate:
- tests: `1061`;
- pass: `1061`;
- fail: `0`;
- cancelled: `0`;
- skipped: `0`;
- todo: `0`.

Dependency/security:
- `npm audit --audit-level=low`: `0 vulnerabilities`;
- Security CodeQL run `35110132555`: `SUCCESS`.

## Audit verdict
Exact-head audit `5224201157` found:
- unresolved CRITICAL findings: `0`;
- unresolved HIGH findings: `0`;
- known scope violations: `0`;
- known authority-boundary violations: `0`;
- regression failures: `0`.

Technical verdict: `APPROVED` for implementation merge.

## Promotion rule
This Evidence Bundle proves implementation acceptance only. It does not self-promote checkpoint truth. M27 earns `20 / 20` only after a separate exact-head-audited MODULE_DONE promotion PR merges. Until that merge, production remains `471 / 1088 = 43.29%`.

Proposed Checkpoint Delta after promotion merge:
- M27: `MODULE_DONE`, `20 / 20`;
- completed-through: `GBS-M27_ASSURANCE_PIPELINE`;
- earned production weight: `491`;
- remaining production weight: `597`;
- overall completion: `45.13%`;
- remaining completion: `54.87%`;
- next active module: `GBS-M28 — Test Impact Engine`;
- next active status: `PLANNING_REQUIRED`;
- next legal stage: `PLAN_GBS_M28`.

STOP CONDITION: `GBS_WO_M27_001_IMPLEMENTATION_APPROVED_PENDING_MODULE_DONE_PROMOTION`.