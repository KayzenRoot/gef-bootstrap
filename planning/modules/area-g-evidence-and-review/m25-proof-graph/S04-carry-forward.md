# GBS-M25-S04 — Proof Carry-Forward

Status: `FROZEN`
Module: `GBS-M25 — Proof Graph`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze safe reuse of prior proof work. Carry-forward reduces repeated validation cost only when the prior proof and every relevant validity dependency remain compatible.

## Frozen mechanisms
1. **PCG25 — Proof Carry-Forward Graph**: materializes `TECH-0025` as the dependency-aware map of reusable prior proof nodes.
2. **PCK25 — Proof Compatibility Key**: binds claim, obligation, proof-policy, namespace and proof semantic fingerprint used for reuse comparison.
3. **CFC25 — Carry-Forward Candidate**: normalized prior proof candidate with predecessor identity and current comparison inputs.
4. **CFD25 — Carry-Forward Decision**: returns `REUSE_FULL | REUSE_PARTIAL | RECOMPUTE | BLOCKED | INDETERMINATE` with explicit reasons.
5. **CFW25 — Carry-Forward Witness**: binds prior/current fingerprints and exact dimensions proven compatible or changed.
6. **PCS25 — Partial Carry-Forward Selector**: preserves only still-current child proof nodes while forcing affected ancestors to be recomputed.
7. **SAR25 — Shadow Assurance Requirement**: emits whether the owning policy requires future M27 shadow assurance before an aggressive reuse optimization may be promoted; M25 never decides that assurance result.
8. **CFR25 — Carry-Forward Receipt**: immutable, independently recomputable record of reused, recomputed and rejected prior proof nodes.

## Reuse gate
A prior proof can be fully reused only when:
- project and lineage namespace match;
- canonical claim identity is unchanged;
- obligation declaration remains exact or owner-authorized compatible;
- proof-policy identity permits reuse;
- prior proof state was `PROVEN`;
- selected support identities remain current;
- M24 evidence inputs used by the proof remain current and accepted;
- dependency closure is complete enough to establish non-impact;
- no current invalidation affects the selected closure;
- no current identity/fingerprint conflict affects the proof.

If only a subset of child proofs remains valid, M25 may select those children for partial carry-forward but must recompute affected ancestors and root sufficiency.

## Reuse invariants
- prior `PROVEN` is never eternal;
- copied receipt/history entries do not add independent support;
- wall-clock age alone does not invalidate a proof unless the owning validity policy explicitly makes time a dependency;
- unused branches of an ANY/threshold proof need not be recomputed merely because unrelated state changed;
- incomplete dependency knowledge cannot justify full reuse;
- carry-forward never changes M12 criterion semantics, M21 progress or M27 assurance;
- presentation wording is irrelevant to reuse identity.

## Brownfield / shadow rule
`REQ-BROWN-003` requires aggressive proof/test reuse to use shadow assurance before production promotion. M25 therefore emits `SAR25=REQUIRED` when the governing adoption/policy context calls for it. M27 remains the only module that can decide whether assurance passed.

## Required proof families
Full reuse, partial reuse, no-reuse after relevant change, irrelevant change, nested proof reuse, stale M24 support, changed obligation, incomplete dependency knowledge, duplicate predecessor, conflicting predecessor, cross-lineage candidate, replay visibility, bounded history and deterministic candidate ordering.

STOP CONDITION: `M25_S04_FROZEN`.
