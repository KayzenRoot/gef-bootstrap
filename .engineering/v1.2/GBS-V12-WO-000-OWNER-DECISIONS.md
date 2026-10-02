# GBS-V12-WO-000 Owner Decisions

**Issue:** #367  
**State:** `APPROVED`  
**Decision gate:** `GBS_V12_WO_000_SOURCE_AUDIT_READY_FOR_OWNER_DECISIONS`  
**Decision result:** `OWNER_DECISIONS_CAPTURED_SOURCE_PACK_PROPOSAL_AUTHORIZED`

These decisions were explicitly approved by the owner after the WO-000 source audit and V1.1.2 baseline review.

## V12-D001 — First reference pilot

**Decision:** `WEB_APP_API`

The first end-to-end V1.2 reference pilot is a conventional Web App/API profile.

Purpose:
- exercise guided discovery;
- canonical project planning;
- UI-bearing visual experience where applicable;
- Marathon execution;
- Bug Hunter/assurance;
- reporting/status;
- profile routing/install planning;
- release/reproducibility;
- operations-feedback contract;

without making blockchain custody, real-asset movement, regulated finance or MMO-scale infrastructure prerequisites for core V1.2 acceptance.

## V12-D002 — Packaging boundary

**Decision:** `CORE_1_2_PLUS_ONE_PROVEN_REFERENCE_PROFILE`

V1.2 production acceptance requires:
- the admitted universal V1.2 core denominator; and
- one production-proven reference profile: `WEB_APP_API`.

Other domain packs do not block the core V1.2 release by default. They remain conditional and may earn their own production-ready status only after profile-specific acceptance evidence.

## V12-D003 — Second priority domain

**Decision:** `WEB3_EVM`

After the Web App/API reference path, the next domain priority is a Web3 EVM profile.

This decision sets priority only. It does not place the EVM pack inside the core V1.2 release denominator and does not authorize mainnet/real-asset deployment.

## V12-D004 — Validation/tooling budget

**Decision:** `LOCAL_FREE_FIRST`

Default:
- local-first;
- free/open-source where practical;
- existing GitHub/provider allowance before paid expansion.

Any paid validation tool, additional hosted CI spend, commercial scanner, specialist audit or cloud service requires explicit owner approval with a concrete need and expected evidence value.

No recurring paid dependency is silently admitted by V1.2.

## V12-D005 — Specialist review trigger

**Decision:** `MANDATORY_HIGH_RISK_EXTERNAL_REVIEW`

Qualified specialist review is mandatory before a domain/profile can claim production readiness when the admitted target includes any of:

- mainnet deployment involving real assets;
- smart contracts that custody, transfer or materially control value;
- private-key/custody/signing-critical architecture;
- financial value movement or a critical ledger;
- privileged upgrade/admin operations with material blast radius;
- irreversible high-impact production operations.

The GEF/Codex flow may still automate preparation, testing, evidence collection and review packets. The specialist gate is additional assurance, not a replacement for repository checks or owner audit.

## Consequences

- C01-C12 remain the candidate universal core set subject to Source Pack admission.
- D01 `WEB_APP_API` becomes the selected reference profile for core V1.2 proof.
- D06 `WEB3_EVM` becomes the second-priority conditional profile.
- D02-D05 and D07-D12 remain conditional/non-release-blocking unless separately admitted.
- R01-R05 remain experimental/future by default.
- V1.2 must not acquire an automatic paid-tools requirement.
- high-risk domain readiness cannot be self-certified solely by the same implementation/review loop.

These decisions authorize Phase D Source Pack proposal work only.

They do **not** authorize V1.2 product/runtime implementation.

**Next stop:** `GBS_V12_WO_000_CANONICAL_SOURCE_PACK_READY_FOR_OWNER_AUDIT`
