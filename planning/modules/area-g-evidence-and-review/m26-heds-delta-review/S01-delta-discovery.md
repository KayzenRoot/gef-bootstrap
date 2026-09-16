# GBS-M26-S01 — Delta Discovery

Status: `FROZEN`
Module: `GBS-M26 — HEDS Delta Review`
Frozen weight: `19`
Assurance intensity: `HIGH_ASSURANCE`

## Objective
Freeze HEDS as the deterministic semantic-delta review owner. M26 compares exact canonical semantic projections from an accepted baseline and a candidate/current state so review effort follows changed meaning and invalidated proof rather than textual churn or wholesale rereading.

## Ownership boundary
M26 owns semantic delta discovery, review-scope projection, semantic findings, review gates and the HEDS verdict. It does **not** own raw Git diff extraction (M29), evidence validity/acceptance (M24), proof sufficiency/carry-forward (M25), assurance decisions (M27), test selection/impact (M28), checkpoint promotion (M17), progress (M21) or project status (M23).

## Frozen mechanisms
1. **HIC26 — HEDS Intent Capsule**: binds project, lineage, baseline identity, candidate identity, requested review subjects, review policy and explicit review purpose.
2. **HAB26 — HEDS Authority Boundary**: grants only semantic delta-review authority and explicitly denies mutation of producer truth, evidence, proof, assurance, tests, progress, status and checkpoint state.
3. **BSI26 — Baseline Semantic Identity**: immutable identity of the accepted predecessor semantic state being reviewed against.
4. **CSI26 — Candidate Semantic Identity**: immutable identity of the candidate/current semantic state under review.
5. **RSP26 — Review Source Projection**: owner-labeled provider-neutral projection carrying source ID, owner ID, semantic digest, validity binding and declared dependency digests without requiring raw-file access.
6. **SDL26 — Semantic Delta Lens**: compares normalized baseline/candidate projections and classifies semantic `ADDED | REMOVED | MODIFIED | UNCHANGED`; presentation-only differences are excluded from semantic change.
7. **DCI26 — Delta Change Inventory**: canonical, deterministic, order-independent inventory of changed review subjects with before/after identities and reason codes.
8. **XLG26 — Cross-Lineage Guard**: rejects project/lineage mix-and-match, baseline/candidate reversal and unrelated predecessor chains before review scope can be trusted.

## Discovery rules
- M26 consumes semantic projections supplied by declared owners; it never fabricates canonical meaning from arbitrary file text.
- Baseline and candidate must belong to the same project/lineage unless an explicit upstream lineage-transition witness authorizes comparison.
- A stable ID with changed semantic digest is `MODIFIED`; a new canonical ID is `ADDED`; a missing prior canonical ID is `REMOVED` only when the source coverage manifest proves the comparison set complete.
- Reordering, formatting, display metadata or provider-specific transport fields do not become semantic change unless an owning source declares them semantic.
- Same semantic content from a different owner/source identity remains visible as an authority/binding delta even if the payload digest is otherwise equivalent.
- No-change is a proved result, never the fallback for missing inputs.

## HIGH_ASSURANCE proof families
Deterministic permutation, baseline/candidate swap, owner spoofing, cross-lineage splice, stable-ID semantic mutation, authority-only mutation, add/remove with complete vs incomplete source coverage, presentation-only noise, missing baseline, missing candidate, cancellation/budget boundaries and injected digest failure.

STOP CONDITION: `M26_S01_FROZEN`.
