# GBS-M12-S03 — Definition of Done

Status: `FROZEN`
Module: `GBS-M12 Scope and DoD Engine`
Classification: `CORE_REQUIRED`
Authority domain: `COMPLETION`

## Objective
Represent Definition of Done obligations, applicability and evidence references deterministically while preserving the distinction between M12 completion-rule evaluation and M24+ evidence/assurance authority.

## DoD obligation record
Each obligation contains:
- stable `obligationId`;
- title and normative statement;
- applicability predicate expressed as explicit structured conditions/references, never arbitrary executable code;
- severity/risk class where relevant;
- required evidence families;
- source/requirement/scope references;
- optional dependency obligation IDs;
- status metadata that cannot itself prove satisfaction.

## DoD Applicability Graph
The **DoD Applicability Graph (DAG-DOD)** maps included scope items and project characteristics to applicable obligations using explicit declarative references. Unknown applicability returns `UNKNOWN_APPLICABILITY`, not “not applicable.”

## Completion Matrix
The **Completion Matrix (CM)** is a derived deterministic table of obligation × applicability × evidence-reference presence × candidate result. Results:
- `SATISFIED_CANDIDATE` only when applicable and required evidence references are present and externally reported valid;
- `UNSATISFIED` when an applicable obligation lacks required evidence or carries a known failing verdict;
- `NOT_APPLICABLE` only with explicit applicability proof;
- `UNKNOWN` when applicability/evidence validity is incomplete.

M12 does not independently validate cryptographic/test evidence; it consumes evidence verdicts/references from their owners.

## DoD Witness Set
A **DoD Witness Set (DWS)** is the minimum stable set of evidence references supporting one candidate completion result. It is a provenance projection, not a replacement for Evidence Engine artifacts.

## Completion Monotonicity Guard
The **Completion Monotonicity Guard (CMG)** prevents `UNKNOWN` or `UNSATISFIED` obligations from being collapsed into complete. Any newly applicable obligation invalidates an earlier aggregate completion candidate until satisfied.

## Aggregate completion candidate
A target/version may yield `DOD_SATISFIED_CANDIDATE` only if every required applicable obligation is `SATISFIED_CANDIDATE`, there are zero UNKNOWN required obligations, and no known HIGH/CRITICAL defect invalidates completion. Actual module/version promotion remains with the governed checkpoint/review flow.

## Technology classification
| Mechanism | Work class | Disposition |
|---|---|---|
| DoD Applicability Graph | `NECESSARY` | Implement declarative applicability checks. |
| Completion Matrix | `NECESSARY` | Implement fail-closed candidate evaluation. |
| DoD Witness Set | `NECESSARY` | Implement evidence-reference provenance projection. |
| Completion Monotonicity Guard | `NECESSARY` | Prevent false completeness. |
| CEL/JsonLogic declarative predicates | `IMPORTANT/FUTURE` | Candidate adapter; baseline uses typed structured predicates, no interpreter dependency. |
| Rego/Cedar completion policies | `IMPORTANT/FUTURE` | External policy adapter possible later. |
| formal proof-carrying completion | `FUTURE` | Valuable for high assurance, belongs with M24+ proof systems. |
| LLM completion verdict | `OUT_OF_SCOPE` as authority | Semantic assistance cannot override deterministic obligations/evidence. |

## Proof obligations
Unknown applicability fails closed; all required applicable obligations must be satisfied; evidence references alone are not assumed valid; dependency obligations are explicit; deterministic matrices/witness sets; no checkpoint/progress mutation; no M24+ assurance absorption.

Open questions: `0`.

STOP CONDITION: `GBS_M12_S03_FROZEN`.