# GBS-V12-WO-000 — Owner decisions for Phase C

**Work Order:** `GBS-V12-WO-000`  
**Issue:** #367  
**PR:** #369  
**Decision date:** 2026-10-02  
**Phase A+B audited HEAD:** `6c654ae870f12375ed13787d98f1d9d2935491b9`  
**Owner disposition:** `APPROVED`  
**Audit classification:** `NOT_INDEPENDENT`

These decisions resolve the Phase C blocking choices. They authorize preparation of the V1.2 canonical Source Pack proposal only. They do **not** authorize product/runtime implementation, merge, checkpoint promotion, publication, WO-001 execution, paid-tool installation or production launch of a high-assurance profile.

## OD-01 — First end-to-end V1.2 pilot profile

**Decision:** SaaS full-stack multi-tenant is the first end-to-end V1.2 pilot.

The pilot must exercise, as applicable:
- web frontend/API;
- database/data lifecycle;
- authentication and authorization;
- tenant isolation;
- subscription/billing and entitlements;
- security, recovery, observability and release evidence.

The first pilot explicitly excludes real-money movement, custody, escrow, payouts and production crypto value movement. Those remain separately admitted HIGH_ASSURANCE capabilities.

## OD-02 — V1.2 release/profile model

**Decision:** V1.2 uses a universal core plus reference conditional profiles.

Rules:
- the universal core has its own finite release denominator;
- a conditional profile does not silently enter the universal-core denominator;
- each shipped reference profile has its own explicit acceptance contract and profile-level proof;
- failure of an unselected conditional profile cannot block universal-core completion;
- the first release-validation pilot is the SaaS profile from OD-01;
- Web3 and game profiles may be prepared as reference profiles but remain conditional until their own governed acceptance is admitted.

## OD-03 — First Web3 chain

**Decision:** EVM-first.

Initial reference stack:
- Solidity for smart contracts;
- Foundry for compile/test/fuzz/invariant workflows;
- Anvil for deterministic local-chain execution where applicable.

Solana and other chains remain future/conditional profiles. No production key custody, transaction signing with real funds or mainnet deployment is authorized by this decision.

## OD-04 — First game engine/platform

**Decision:** Godot 4 is the first game-engine reference target.

The initial profile should prioritize:
- deterministic/headless validation where available;
- 2D/3D project support;
- desktop targets;
- browser/Web export when applicable and objectively testable.

Other engines, including Unity or Unreal, remain conditional follow-ons and do not block the first V1.2 game-profile proof.

## OD-05 — Paid-tool and CI budget

**Decision:** free/open-source first, with a mandatory initial paid-tool/expanded-CI budget of **US$ 0**.

A paid tool, paid CI expansion or external service may enter later only through a separate owner-approved decision backed by measured benefit or a requirement that cannot be met safely with the approved free/open-source path.

No benchmark may count hypothetical paid-tool gains as realized evidence.

## OD-06 — Independent specialist-review trigger

**Decision:** independent specialist review is mandatory before production for HIGH_ASSURANCE work involving any of the following:
- movement of financial value;
- custody or escrow;
- signing of blockchain transactions;
- smart contracts controlling real value;
- privileged authentication/authorization surfaces;
- irreversible data/schema migration;
- destructive or otherwise irreversible privileged operations.

Codex implementation plus owner-operated ChatGPT semantic audit remain required where applicable, but neither is to be represented as the independent specialist review.

The canonical Source Pack must define the evidence/stop behavior when a required specialist review is unavailable or fails.

## Phase D authorization boundary

The above decisions authorize Codex to prepare the canonical V1.2 Source Pack proposal under the refreshed Context Lock and to stop at:

`GBS_V12_WO_000_CANONICAL_SOURCE_PACK_READY_FOR_OWNER_AUDIT`

No merge and no WO-001 implementation is authorized.
