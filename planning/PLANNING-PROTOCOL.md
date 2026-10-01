# Planning Protocol

Status: `FROZEN_FOR_PRODUCTION_CONSTRUCTION`

## Unit of work
Planning and construction proceed through stable IDs such as `GBS-Mxx-Syy` and `GBS-WO-Mxx-Syy-###`.

## Planning lifecycle
`PLANNED -> IN_DISCUSSION -> DECIDED -> DOCUMENTED -> FROZEN`

## Construction lifecycle
`SOURCE_MATCH -> IMPLEMENTING -> EVIDENCE_PENDING -> OWNER_AUDIT -> OWNER_APPROVED/CORRECTION_REQUIRED/BLOCKED -> CHECKPOINT_PROMOTION -> MERGE`

## Rules
1. Do not pre-fill session conclusions.
2. A session may update canonical Source Pack documents only after the decision is reviewed.
3. Frozen decisions are not silently reopened.
4. Construction waits for applicable frozen planning/architecture/security/DoD contracts.
5. Every construction increment must be admitted in the frozen backlog and bounded by a Work Order or equivalent governed execution contract.
6. Checkpoint is updated after every approved material planning or construction increment and at chat-transition points.
7. New ideas are classified through the complete-product scope model: CORE_REQUIRED, PRODUCT_INCLUDED, EXPERIMENTAL_GATED, OPTIONAL_ADAPTER or OUT_OF_SCOPE as applicable. Historical NECESSARY/IMPORTANT/FUTURE terminology remains historical only unless mapped by current Scope.
8. Source authority is domain-specific and follows `.engineering/SOURCE-HIERARCHY.md`; simple newest-wins precedence is prohibited.
9. Historical decisions are interpreted through `.engineering/DECISIONS-SUPERSESSION-MAP.md` when later governance supersedes legacy mechanics.
10. GEF Bootstrap itself is implemented through ChatGPT + connected project tools. Codex is prohibited as an implementation executor for this repository.
11. Every material continuation reports official audited completion %, earned weight, remaining weight and denominator changes if any.
12. Product weight is earned only through admitted evidence-backed completion. Planning/checkpoint documents do not automatically manufacture product progress.
13. A HIGH/CRITICAL blocker prevents progression of the affected claim.
14. Construction starts only after Checkpoint explicitly reaches `READY_FOR_PRODUCTION_CONSTRUCTION`.
15. Under D-0062/ADR-0006, the project owner account is the required semantic auditor and merger; collaborator review is optional and never a completion gate. Bind the owner audit to the exact PR head and record its disposition.
16. Required CI, security and evidence gates remain mandatory. Do not merge with a failing, pending, stale or mismatched check, or with unresolved CRITICAL/HIGH findings. Do not claim an owner audit is independent.

## First construction rule
After Source Pack closure promotion, start with `GBS-M01 — Deterministic Work Plane Kernel` unless dependency analysis proves a narrower prerequisite slice in M02/M03/M04 must precede it. Any such movement must remain inside admitted Scope/Backlog and be checkpointed.
