# GBS-M13-S05 — Adoption Receipt and Promotion

Status: `FROZEN_CANDIDATE`
Module: `GBS-M13 — GEF Adoption Engine`
Risk: `ELEVATED`

## Purpose
Define the deterministic receipt proving what adoption state was established, what remains legacy or unresolved, and which governance domains may be safely consumed by later GEF modules.

The receipt is not a final assurance verdict and does not itself mutate checkpoints. It is an input to later evidence/assurance/checkpoint owners.

## Adoption Receipt
An `AdoptionReceipt` must bind:
- receipt schema/policy version;
- exact project identity;
- Adoption Intent Capsule identity;
- adoption mode;
- Source Pack semantic identity;
- selected M08 profile identity/digest;
- Governance Maturity Vector;
- Normalization Frontier;
- admitted Compatibility Bridge Contracts;
- active Legacy Compatibility Membranes;
- drift summary by domain/class/severity;
- Legacy Debt Quarantine summary;
- normalization/migration increments completed;
- unresolved blockers;
- safety-envelope identity;
- source fingerprints/invalidation inputs;
- semantic receipt digest.

Display timestamps may exist but are excluded from semantic identity.

## Receipt validity
Receipt states:
- `VALID`
- `STALE`
- `PARTIAL`
- `BLOCKED`
- `PROJECT_MISMATCH`
- `SOURCE_PACK_MISMATCH`
- `POLICY_VERSION_UNSUPPORTED`
- `INDETERMINATE`

Only `VALID` or explicitly capability-scoped `PARTIAL` receipts may support downstream consumption. `PARTIAL` must state exactly which domains/capabilities are governed.

## New GEF-native technology: Capability Unlock Matrix (CUM)
Maps downstream GEF capabilities to the minimum governance-domain maturity they require.

Example semantics:
- task/context compilation may require project identity + source authority + bounded planning truth;
- execution-pack compilation may additionally require admitted scope/DoD and policy bindings;
- release/assurance capabilities require later evidence/security owners and therefore cannot be unlocked by M13 alone.

CUM prevents a repository from being globally declared “adopted” when only some capabilities are safe.

## New GEF-native technology: Adoption Proof Spine (APS)
A digest-bound set of proof nodes connecting:
- intent capsule;
- source-pack identity;
- domain truth mappings;
- bridges/membranes;
- drift resolutions;
- governance maturity transitions;
- receipt identity.

The spine supports selective invalidation. If one legacy mapping changes, only dependent adoption proof nodes and capability unlocks become stale when dependency knowledge is complete. Unknown dependencies widen invalidation conservatively.

## New GEF-native technology: Governance Delta Receipt (GDR)
Each adoption increment emits a compact delta:
- before GMV;
- after GMV;
- frontier movement;
- bridges added/retired;
- drift opened/closed/reclassified;
- quarantine changes;
- capabilities newly unlocked/invalidated;
- exact evidence bindings.

GDR makes adoption resumable without repeatedly reconstructing full history.

## New GEF-native technology: Adoption Regression Sentinel (ARS)
Compares a current adoption projection against the last valid receipt and detects regressions such as:
- formerly canonical domain becoming ambiguous;
- alias fingerprint drift;
- source-pack identity mismatch;
- reintroduced legacy authority conflict;
- capability prerequisites no longer satisfied;
- governance maturity downgrade without governed explanation.

ARS diagnoses only. It does not auto-repair.

## Promotion semantics
M13 may determine `ADOPTION_READY_FOR_PROMOTION` only when:
- receipt project/source bindings are current;
- requested capability prerequisites are satisfied;
- no unresolved HIGH/CRITICAL drift blocks those capabilities;
- every lossy mapping has explicit approval;
- every destructive migration has required evidence/rollback binding;
- no ambiguous authority is hidden;
- policy/schema versions are supported.

Promotion means “adoption state is fit for downstream consumption”, not “project is complete” and not “release approved”.

## Partial adoption
Partial adoption is an intended normal state.

A partial receipt must expose:
- governed domains;
- ungoverned domains;
- blocked domains;
- capability unlock set;
- capability denial reasons;
- next smallest safe adoption slice.

No UI or downstream module may collapse `PARTIAL` into `VALID_FULL`.

## Receipt privacy/security
Receipts must never contain:
- secret values;
- raw credentials/tokens;
- unnecessary user-private content;
- full environment dumps;
- arbitrary source bodies when digest/reference is sufficient.

## Failure classes
- `ADOPTION_RECEIPT_STALE`
- `ADOPTION_RECEIPT_PROJECT_MISMATCH`
- `ADOPTION_RECEIPT_SOURCE_MISMATCH`
- `CAPABILITY_PREREQUISITE_MISSING`
- `CAPABILITY_UNLOCK_AMBIGUOUS`
- `GOVERNANCE_REGRESSION_DETECTED`
- `PROOF_SPINE_INCOMPLETE`
- `UNRESOLVED_BLOCKING_DRIFT`
- `LOSSY_MAPPING_UNAPPROVED`
- `PROMOTION_NOT_ALLOWED`

## Ownership boundaries
- M13 produces adoption receipts and capability-readiness projection.
- M17 owns canonical checkpoint mutation.
- M21 owns production progress semantics.
- M24/M25/M27 own evidence/proof/assurance at their layers.
- M37 owns broader integrity policy.
- M44 owns audit-ledger mechanics.
- M62 owns production acceptance.

No M13 receipt can replace those authorities.

## Required implementation evidence later
Tests must cover deterministic receipt identity, selective invalidation, partial capability unlock, stale source/profile binding, drift regression, lossy mapping approval, project mismatch, unsupported policy version, no secret payload material, cross-host determinism and immutable snapshots.

## Module closure condition
S01-S05 may freeze together only after:
- decisions/technology ledger synchronization;
- exact-head planning audit;
- no unresolved HIGH/CRITICAL planning defect;
- ownership boundaries remain consistent with M00-M12 and future owner modules.

M13 production weight remains `0 / 20` until implementation and separate `MODULE_DONE` promotion.

STOP CONDITION: `READY_FOR_GBS_M13_LEDGER_SYNC_AND_MODULE_GATE`.