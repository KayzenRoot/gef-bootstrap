# GBS-M07-S05 — Validation Freeze Hardening

Status: `NORMATIVE_FREEZE_CORRECTIONS`

This companion is part of frozen M07-S05 planning. Where it refines `S05-validation.md`, this file prevails.

## H1 — Prefix collisions use both exact and portable alias keys
VAL-07 ancestor/descendant collision checks apply to both:
- the exact validated logical target key; and
- the portable ASCII-case-folded alias key from VAL-06.

Therefore `Config` and `config/app.json` conflict, not only `config` and `config/app.json`.

This is still a portable baseline. Additional platform-specific Unicode/case aliases remain M06/M51-owned and may block later.

## H2 — Mandatory unresolved render gaps cannot validate as READY
S05 may produce `VALIDATED_FOR_EFFECT_PLANNING` only when every artifact has a complete exact target/content identity and there is no unresolved mandatory S04 gap that could change bytes, target, artifact presence, integrity or downstream safety classification.

A mandatory fact that cannot be established becomes `BLOCKED` when definitively invalid or `INDETERMINATE` when genuinely unknowable at S05. S05 must not convert a partial/unknown RenderSnapshot into a successful desired-artifact handoff.

Facts intentionally owned downstream, such as current filesystem occupancy or existing-file ownership, remain downstream requirements and do not by themselves create S05 indeterminacy.

## H3 — Snapshot integrity covers aggregate identity too
S05 integrity checks include compatibility of the aggregate `renderSnapshotDigest` with the artifact identities supplied to validation, not only individual content/target digest fields.

If the snapshot aggregate identity, target digest, content digest or byte length is inconsistent with the immutable render product, validation blocks.

## Proof delta
Future implementation proof must additionally show:
1. case-folded ancestor/descendant collisions block;
2. unresolved mandatory S04 gaps cannot produce VALIDATED_FOR_EFFECT_PLANNING;
3. downstream-only occupancy/ownership unknowns do not incorrectly produce S05 indeterminacy;
4. aggregate renderSnapshotDigest tampering is detected.

No implementation or production credit is admitted.

STOP CONDITION: `M07_S05_FREEZE_HARDENING_BOUND_TO_EXACT_HEAD`.
