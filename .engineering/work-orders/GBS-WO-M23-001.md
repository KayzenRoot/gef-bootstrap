# GBS-WO-M23-001 - Implement Project Status Engine

Status: `COMPILED_NOT_ADMITTED`
Risk: `MEDIUM`
Assurance intensity: `STANDARD_PLUS`
Module: `GBS-M23 - Project Status Engine`
Canonical package: `packages/project-status-engine`
Canonical weight: `13`
Planning gate: `.engineering/gates/M23-PLANNING-GATE.md` (`PASSED`)

## OBJECTIVE
Implement a deterministic, authority-bounded Project Status Engine that derives lifecycle status, schedule health and continuation readiness from verified read-only M17/M18/M21/M22 facts plus explicit canonical completion/condition inputs, without recalculating upstream truth or fabricating completion/blockers/actions.

## CONTEXT
M22 is MODULE_DONE and production is `399 / 1088 = 36.67%`. M20 reserves `project_status` metric ownership for M23. M21 and M22 already emit M23-specific read-only handoffs. M17/M18 remain the canonical continuity/re-entry owners.

## SCOPE
Implement all 30 frozen M23 mechanisms:
- SIC23, SAB23, CAG23, RAG23, PHG23, EHG23;
- CPW23, COG23, RSP23, LSR23, CRF23;
- SCI23, BAV23, SCW23, RDG23, BRT23;
- CRR23, NAB23, NAC23, DIC23, SHR23, SIF23;
- PSS23, PSI23, PSD23, STR23, SRW23, SHG23, DPH23, SFG23.

## OUT OF SCOPE
Checkpoint promotion/mutation, resume/re-entry calculation, progress calculation, ETA/forecast calculation, evidence/proof/assurance acceptance, telemetry collection, benchmark generation, executor-performance modeling, Git/provider mutation, UI/response rendering and creation of new backlog/work items.

## FILES/SOURCES TO READ
1. `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json`.
2. `.engineering/DECISIONS-LEDGER.md` plus applicable ADRs/supersession map.
3. `.engineering/SCOPE.md`.
4. `.engineering/DEFINITION-OF-DONE.md`.
5. `.engineering/ARCHITECTURE.md`.
6. `.engineering/REQUIREMENTS.md` when present/current.
7. `.engineering/ASSURANCE-INTENSITY.md`.
8. `.engineering/gates/M23-PLANNING-GATE.md`.
9. `.engineering/ledgers/M23-PROJECT-STATUS-ENGINE-LEDGER-SYNC.md`.
10. all five frozen M23 planning sessions.
11. public contracts/types from M17, M18, M20, M21 and M22 required by the frozen handoffs.

## REQUIREMENTS
1. Lifecycle, schedule health and continuation readiness are independent canonical dimensions.
2. M17 and M21 are mandatory for ordinary canonical lifecycle/readiness status.
3. M18 is optional unless same-checkpoint resume/re-entry facts are applicable.
4. M22 is optional for lifecycle and required only when schedule health from deadline comparison is requested/applicable.
5. M23 must verify upstream ownership/binding and never recalculate M21/M22 truth.
6. `100%` progress without current accepted completion authority resolves to `AWAITING_ACCEPTANCE`, not `COMPLETE`.
7. `COMPLETE` is impossible while blocker/recovery/conflict dominates.
8. Completion owner spoofing, stale acceptance and cross-lineage completion facts fail closed.
9. Blocker omission is not resolution; resolution requires current authoritative supersession.
10. Stale last-known active blockers remain conservatively constraining until resolved.
11. M17 next legal action is read-only. M23 cannot invent or substitute another action.
12. Same-checkpoint M18 action/resume drift can constrain readiness but cannot rewrite M17.
13. Schedule health uses M22 deadline deltas exactly as supplied: conservative bound on/before deadline => ON_TRACK; optimistic bound after deadline => LATE; otherwise AT_RISK.
14. Missing/unavailable forecast when schedule health is requested => UNKNOWN, not BLOCKED.
15. Deadline/schedule state cannot change progress, lifecycle blocker truth or completion authority.
16. Status snapshots and history are immutable.
17. `COMPLETE -> non-COMPLETE` requires explicit SRW23 reopen/invalidation authority.
18. Transition/reopen replay is idempotent; divergent same-predecessor histories expose split-brain/conflict.
19. Bounded history truncation is explicit and never masquerades as complete history.
20. Snapshot reuse fails closed on mandatory-source staleness/mismatch and applicable optional-source material conflict.
21. M20 handoff is owner-bound and cannot be upgraded by presentation code.
22. Semantic logic is startup-pure and cannot access filesystem/network/Git/provider/process/system clock directly.
23. SHA-256 is injected and invalid/failing digest capability fails closed.
24. Scalable/history operations are bounded and cancellable.

## ARCHITECTURE RULES
- TypeScript/Node, library-first, thin/public API boundary.
- No provider/CLI/UI logic in semantic core.
- Reuse existing M17/M18/M21/M22 public contract types where dependency direction remains legal; otherwise define narrow read-only adapter types without duplicating upstream authority.
- Canonical identities are digest-bound and deterministic under semantically equivalent input permutation.
- Human wording is never part of canonical status authority.

## CONSTRAINTS
- Do not alter the frozen M23 Source Pack during implementation unless a separate reviewed planning correction is required.
- Do not modify upstream M17/M18/M21/M22 semantics merely to make M23 easier to implement.
- Do not create evidence/assurance behavior belonging to M24/M25/M27.
- Do not use ambient Date/time in semantic decisions.
- Do not give M23 provider mutation capability.

## ACCEPTANCE CRITERIA
- all 30 mechanisms implemented and publicly reachable as appropriate;
- canonical lifecycle/schedule/readiness states match frozen precedence and independence rules;
- no false completion at 100% progress;
- blocker/recovery/conflict resolution semantics proven;
- M17/M18 next-action consistency proven;
- exact M22 deadline-boundary interpretation proven;
- completion reopen and immutable history proven;
- snapshot/receipt/handoff independent verification proven;
- zero unresolved CRITICAL/HIGH findings;
- no ownership leakage into upstream/future modules;
- implementation merged only after exact-head review.

## TESTS
STANDARD_PLUS proof families:
- authority/source owner spoofing and cross-lineage mix-and-match;
- mandatory/optional source availability and freshness;
- exact lifecycle precedence and progress boundary fixtures;
- 100%-without-acceptance, rejected/stale acceptance and forged completion owner;
- blocker omission, replay, stale resolution, warning/blocking/recovery/conflict precedence;
- next action mismatch, resume drift and readiness precedence;
- deadline delta exact zero/straddle/late/on-track fixtures;
- schedule/lifecycle/readiness independence metamorphic tests;
- COMPLETE reopen witness and forbidden silent reopen tests;
- transition replay/split-brain/truncated-history tests;
- independent snapshot/integrity/handoff recomputation and tamper attacks;
- cancellation/budget/digest failure/startup purity;
- focused Ubuntu/Windows/macOS matrix;
- full repository regression;
- strict typecheck and dependency audit;
- Security CodeQL when triggered;
- exact-head semantic review.

## DELIVERABLES
- `packages/project-status-engine/package.json`;
- `packages/project-status-engine/tsconfig.json`;
- `packages/project-status-engine/src/types.ts`;
- bounded S01-S05 implementation units plus `src/public.ts`;
- focused tests and startup-purity tests;
- CI workflow/matrix for M23 if not already generically covered;
- exact-head Evidence Bundle after implementation merge;
- Checkpoint Delta proposal for separate MODULE_DONE promotion.

## REVIEW FORMAT
Review in Brazilian Portuguese. Report exact base/head/tree, changed files, mechanism coverage, focused tests by OS, full regression, typecheck/audit/CodeQL, ownership findings, CRITICAL/HIGH counts, known risks and proposed Checkpoint Delta. `Completed` text without evidence is not proof.

## STOP CONDITION
This Work Order grants no implementation authority until a separate exact-head admission audit/merge binds the frozen Source Pack and a post-merge execution-base binding promotes it to `ADMITTED_READY_FOR_IMPLEMENTATION`.

STOP CONDITION: `GBS_WO_M23_001_COMPILED_NOT_ADMITTED`.
