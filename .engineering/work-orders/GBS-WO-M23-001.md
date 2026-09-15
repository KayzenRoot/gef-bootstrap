# GBS-WO-M23-001 - Implement Project Status Engine

Status: `ADMITTED_READY_FOR_IMPLEMENTATION`
Risk: `MEDIUM`
Assurance intensity: `STANDARD_PLUS`
Module: `GBS-M23 - Project Status Engine`
Canonical package: `packages/project-status-engine`
Canonical weight: `13`
Planning gate: `.engineering/gates/M23-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#229`
Planning reviewed head: `1ad4c4075621fec2e008b73384b1b9efd693a867`
Planning reviewed tree: `81ce2dc42e7594cb21da743739cfd4a8d8a7c67d`
Planning semantic audit: `5211392448`
Planning freeze merge: `c609d1b89aa320b75bf049752d6b8d8865f39cd1`
Admission PR: `#230`
Admission reviewed head: `c4a55d7a00ccabbb46be452b1460296af97682dc`
Admission reviewed tree: `91bc79120abc784ce97b61d3138691467af366ad`
Admission semantic audit: `5211413037`
Admission merge / sole legal execution base: `14db2ce8f5c7753978b5e7d8a40bcfbcb36f8d89`

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
8. Completion outcome owner is exactly `EXTERNAL_CANONICAL | M27_ASSURANCE`; explicit external status-condition owner is exactly `EXTERNAL_CANONICAL | M27_ASSURANCE`. Until M27 exists, only `EXTERNAL_CANONICAL` is executable. Generic inputs claiming native M17/M18/M21/M22 identity must be rejected.
9. Completion owner spoofing, stale acceptance, unsupported future-owner use and cross-lineage completion facts fail closed.
10. Blocker omission is not resolution; resolution requires current authoritative supersession.
11. Stale last-known active blockers remain conservatively constraining until resolved.
12. M17 next legal action is read-only. M23 cannot invent or substitute another action.
13. Same-checkpoint M18 action/resume drift can constrain readiness but cannot rewrite M17.
14. Current lifecycle `COMPLETE` yields continuation readiness `NOT_APPLICABLE` unless a higher-priority reopen/recovery/blocker/conflict condition applies.
15. Schedule health uses M22 deadline deltas exactly as supplied: conservative bound on/before deadline => ON_TRACK; optimistic bound after deadline => LATE; otherwise AT_RISK.
16. Missing/unavailable forecast when schedule health is requested => UNKNOWN, not BLOCKED.
17. Deadline/schedule state cannot change progress, lifecycle blocker truth or completion authority.
18. Status snapshots and history are immutable.
19. `COMPLETE -> non-COMPLETE` requires explicit SRW23 reopen/invalidation authority.
20. Transition/reopen replay is idempotent; divergent same-predecessor histories expose split-brain/conflict.
21. Bounded history truncation is explicit and never masquerades as complete history.
22. Snapshot reuse fails closed on mandatory-source staleness/mismatch and applicable optional-source material conflict.
23. M20 handoff is owner-bound and cannot be upgraded by presentation code.
24. Semantic logic is startup-pure and cannot access filesystem/network/Git/provider/process/system clock directly.
25. SHA-256 is injected and invalid/failing digest capability fails closed.
26. Scalable/history operations are bounded and cancellable.

## ARCHITECTURE RULES
- TypeScript/Node, library-first, thin/public API boundary.
- No provider/CLI/UI logic in semantic core.
- Reuse existing M17/M18/M21/M22 public contract types where dependency direction remains legal; otherwise define narrow read-only adapter types without duplicating upstream authority.
- Canonical identities are digest-bound and deterministic under semantically equivalent input permutation.
- Human wording is never part of canonical status authority.
- Forward-compatible owner labels do not grant runtime authority before their owner module exists.

## CONSTRAINTS
- Do not alter the frozen M23 Source Pack during implementation unless a separate reviewed planning correction is required.
- Do not modify upstream M17/M18/M21/M22 semantics merely to make M23 easier to implement.
- Do not create evidence/assurance behavior belonging to M24/M25/M27.
- Do not use ambient Date/time in semantic decisions.
- Do not give M23 provider mutation capability.
- Do not accept generic injected facts that impersonate native upstream owner labels.

## ACCEPTANCE CRITERIA
- all 30 mechanisms implemented and publicly reachable as appropriate;
- canonical lifecycle/schedule/readiness states match frozen precedence and independence rules;
- no false completion at 100% progress;
- exact injected-owner allowlists enforced, including unsupported future-owner behavior;
- completed-project readiness resolves to `NOT_APPLICABLE` when appropriate;
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
- generic native-owner impersonation and unsupported `M27_ASSURANCE` pre-owner behavior;
- mandatory/optional source availability and freshness;
- exact lifecycle precedence and progress boundary fixtures;
- 100%-without-acceptance, rejected/stale acceptance and forged completion owner;
- blocker omission, replay, stale resolution, warning/blocking/recovery/conflict precedence;
- next action mismatch, resume drift and readiness precedence;
- completed-project `NOT_APPLICABLE` readiness;
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

## Admission binding
PR #230 passed exact-head semantic review and merged as `14db2ce8f5c7753978b5e7d8a40bcfbcb36f8d89`. This Work Order is admitted. Implementation branches must descend from that merge or a reviewed `main` descendant preserving the admitted contract. No production credit is earned by admission.

STOP CONDITION: `GBS_WO_M23_001_ADMITTED_READY_FOR_IMPLEMENTATION`.
