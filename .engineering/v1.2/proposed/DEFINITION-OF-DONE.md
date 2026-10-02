# Proposed V1.2 Definition of Done Delta

**State:** `PROPOSED / NOT_CANONICAL`

V1.2 is production-accepted only when all conditions below are true.

## Core
- WO-001 through WO-006 are separately admitted, exact-head audited and completed.
- C01-C12 acceptance contracts are satisfied.
- No parallel canonical planning/proof/status/release authority was introduced without an approved ADR.
- existing V1.1.2 accepted behavior remains green unless explicitly superseded by approved V1.2 decisions.

## Reference profile
- WEB_APP_API completes the full governed journey on a reproducible controlled target.
- visual/browser/API proof is produced where applicable.
- profile selection/install behavior is reproducible and reversible.
- release/recovery evidence exists.

## Quality
- required repository status checks green;
- applicable regression/focused/cross-platform checks green;
- CRITICAL = 0;
- HIGH = 0;
- no skipped/disabled gate used to manufacture acceptance;
- selective validation/proof reuse has no known false production credit;
- flake handling does not convert unknown/failure into PASS without evidence.

## Performance truth
- V1.1.2 baseline remains preserved;
- V1.2 claims use matched populations;
- unavailable metrics remain UNAVAILABLE;
- brownfield percentage claims require an admitted repeatable brownfield cohort;
- accepted-functionality/quality is not traded away for speed.

## Security
- current fail-closed/security posture preserved or strengthened;
- required security/provider checks green;
- no secret/private-key leakage in evidence;
- specialist gate satisfied wherever the approved high-risk trigger applies.

## Release
- immutable release identity bound to exact accepted head;
- artifact/provenance/integrity/signature evidence complete;
- clean consumer smoke passes;
- recovery/upgrade path validated;
- operator docs identify supported core/reference profile and explicitly distinguish conditional packs.

## Scope truth
- conditional packs not proven in the release are not advertised as production-ready;
- Web3 EVM priority does not imply core-release completion;
- experiments/future tracks receive no release credit.

## Terminal state

Proposed terminal release state:
`GBS_V12_1_2_0_PRODUCTION_ACCEPTED`

Exact naming may be normalized during canonical promotion, but the semantic terminal state must remain unambiguous.

