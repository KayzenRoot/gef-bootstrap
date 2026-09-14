# GBS-M12-S04 — Scope Drift

Status: `FROZEN`
Module: `GBS-M12 Scope and DoD Engine`
Classification: `CORE_REQUIRED`
Authority domains: `SCOPE`, `COMPLETION`

## Objective
Detect semantic drift between a frozen Scope/DoD baseline and a candidate state so product-target expansion, contraction, DoD weakening and production-denominator impact cannot occur silently.

## Drift classes
Scope drift is classified deterministically as:
- `ITEM_ADDED`;
- `ITEM_REMOVED`;
- `PRODUCT_CLASSIFICATION_CHANGED`;
- `SUBJECT_CHANGED`;
- `RATIONALE_OR_OWNER_CHANGED`;
- `SOURCE_BINDING_CHANGED`;
- `DEPENDENCY_CHANGED`;
- `UNKNOWN_BASELINE`.

DoD drift is classified as:
- `DOD_OBLIGATION_ADDED`;
- `DOD_OBLIGATION_REMOVED`;
- `DOD_STATEMENT_CHANGED`;
- `DOD_APPLICABILITY_CHANGED`;
- `DOD_EVIDENCE_REQUIREMENT_CHANGED`;
- `DOD_DEPENDENCY_CHANGED`;
- `DOD_SOURCE_BINDING_CHANGED`.

Ordering noise, formatting, timestamps and host paths are excluded from semantic drift.

## Scope Drift Vector
The **Scope Drift Vector (SDV)** is a stable-ID keyed semantic diff between baseline and candidate scope registries. Every entry carries item ID, drift class and deterministic before/after projections. It never proposes an approval or winner.

## DoD Drift Vector
The **DoD Drift Vector (DDV)** performs the same function for DoD obligations and applicability/evidence requirements. A removal or weakening of a completion obligation is never interpreted as harmless merely because it makes completion easier.

## Baseline Binding Seal Input
A **Baseline Binding Seal Input (BBSI)** is digest-ready canonical material for frozen Scope + DoD semantic projections. It is useful for stale detection and Context Lock integration. Hashing/signing remains externally owned.

## Expansion Firewall
A candidate state returns `SCOPE_REVIEW_REQUIRED` when it adds an included product capability, promotes a classification into the current product target, removes an included obligation-bearing item, or introduces an unproven automatic admission. M12 does not authorize the expansion itself.

## Completion Weakening Guard
A **Completion Weakening Guard (CWG)** returns `DOD_REVIEW_REQUIRED` when an applicable obligation is removed, applicability is narrowed, required evidence is weakened, or a stronger obligation is replaced without explicit governed authority. This prevents completing the product by deleting the finish line.

## Denominator Impact Diagnostic
A **Denominator Impact Diagnostic (DID)** reports:
- `NO_TARGET_IMPACT` when semantic drift does not change admitted product target;
- `DENOMINATOR_REVIEW_REQUIRED` when included target membership/classification changes could alter the frozen production denominator;
- `UNKNOWN` when the baseline or authority is insufficient.

M12 never computes or mutates the canonical denominator. The Backlog/progress governance owners must explicitly review and promote any accounting change. Existing code, dependency count, file count or planning weight cannot alter production accounting implicitly.

## Drift Isolation
Unrelated semantic drift may be isolated by exact stable IDs and explicit dependency coverage. Unknown dependency coverage widens conservatively instead of declaring unaffected areas safe.

## Technology classification
| Mechanism | Work class | Disposition |
|---|---|---|
| Scope Drift Vector | `NECESSARY` | Implement deterministic semantic diff. |
| DoD Drift Vector | `NECESSARY` | Implement deterministic completion-rule diff. |
| Baseline Binding Seal Input | `NECESSARY` | Implement digest-ready frozen projection. |
| Expansion Firewall | `NECESSARY` | Implement fail-closed review trigger. |
| Completion Weakening Guard | `NECESSARY` | Implement fail-closed DoD weakening trigger. |
| Denominator Impact Diagnostic | `NECESSARY` | Report review need; never rewrite accounting. |
| RFC 6902 JSON Patch export | `IMPORTANT` | Optional future adapter for human/tool review; semantic diff stays authoritative inside M12. |
| AST/semantic Markdown diff | `IMPORTANT/FUTURE` | Useful repository adapter once canonical Markdown parsing is explicitly admitted. |
| learned semantic drift detector | `EXPERIMENTAL_GATED` | Hint-only; cannot create/clear authoritative drift. |
| SMT/SAT policy equivalence proofs | `FUTURE` | Candidate for richer formal policy languages later. |

## Proof obligations
Stable deterministic SDV/DDV; formatting/order noise ignored; target-changing drift triggers review; DoD weakening triggers review; denominator is never mutated; missing baseline returns UNKNOWN; dependency uncertainty widens conservatively; no checkpoint/progress/evidence authority absorbed.

## M12 implementation freeze summary
All four sessions are now `FROZEN`. M12 implementation is admitted only as a pure deterministic library for Scope classification/admission, DoD candidate evaluation and drift diagnostics. It may not write canonical documents, change production accounting, promote checkpoint state, validate final evidence cryptographically, or expand the current product target autonomously.

Open questions: `0`.

STOP CONDITION: `GBS_M12_S04_FROZEN`.