# Work Order — GBS-WO-M12-001

Status: `AUTHORIZED_FOR_EXECUTION`
Module: `GBS-M12 Scope & DoD Engine`
Risk: `STANDARD`
Admitted base: `83133d1e2b49b6bf1f2456b98b0b038acde561c7`
Canonical weight: `18 / 1088`

## OBJECTIVE
Implement the frozen M12 contracts for work classification, admission posture, Definition-of-Done evaluation and scope/criterion drift detection as a deterministic, side-effect-free TypeScript package with focused cross-platform CI and repository regression coverage.

## CONTEXT
M00-M11 are promoted `MODULE_DONE`. The current checkpoint authorizes only M12 planning/implementation. Canonical Scope and DoD are already frozen. M12 must consume those semantics without becoming a competing authority or changing the frozen production denominator.

## SCOPE
1. Create `@gef-bootstrap/scope-dod-engine` package.
2. Implement strict versioned types and runtime validation where external input is accepted.
3. Implement evidence-bound work classification with fail-closed unresolved state.
4. Implement classification -> admission posture firewall and reclassification delta.
5. Implement DoD criterion validation/evaluation with explicit evidence/applicability rules and evaluation-only authority notice.
6. Implement DoD criterion-set drift comparison.
7. Implement deterministic scope snapshot validation/projection and Scope Drift Sentinel.
8. Add focused tests and Linux/Windows/macOS + regression workflow.
9. Integrate package into root build/typecheck workspace scripts and lockfile.
10. Produce exact-head Evidence Bundle after CI.

## OUT OF SCOPE
- changing canonical Source Hierarchy, Scope, Requirements, Architecture, DoD or decisions;
- changing 61-module / 1088 production denominator or module weights;
- generic policy execution (M16);
- checkpoint promotion (M17), progress calculations (M21), Evidence/Proof Graph/Assurance (M24+), Integrity (M37), Audit Ledger (M44), Production Acceptance (M62);
- external policy engines, databases, network services or LLM calls;
- Codex as Bootstrap executor;
- implementing technology candidates classified IMPORTANT/FUTURE unless separately admitted.

## FILES / SOURCES TO READ
Priority follows canonical Source Hierarchy. Minimum locked sources:
- `.engineering/CHECKPOINT.md` / `CHECKPOINT.json`;
- `.engineering/DECISIONS-LEDGER.md` and accepted ADRs affecting construction;
- `.engineering/SCOPE.md`;
- `.engineering/DEFINITION-OF-DONE.md`;
- `.engineering/ARCHITECTURE.md`;
- `.engineering/REQUIREMENTS.md`;
- `.engineering/BACKLOG.md`;
- `planning/MASTER-MODULE-INDEX.md`;
- M09/M10/M11 public contracts and module gates for ownership compatibility;
- M12 S01-S04 frozen sessions and M12 Module Gate.

## REQUIREMENTS
- deterministic results for equivalent semantic input;
- no time/recency/LLM-confidence authority;
- immutable returned snapshots/envelopes;
- source-bound `NECESSARY`; ambiguous/conflicted evidence fails closed;
- only `NECESSARY` may return auto-admission eligibility;
- DoD satisfaction of required/applicable criteria requires evidence binding;
- invalid applicability/N/A combinations fail closed;
- no silent criterion removal/denominator erosion;
- unauthorized scope expansion/erosion is blocking and machine-readable;
- authorized changes remain visible in findings;
- no M12 API may award weight, promote checkpoint/module status or mutate canonical sources;
- package imports perform no filesystem/network/process mutation.

## ARCHITECTURE RULES
- pure library-first implementation;
- zero new runtime dependencies;
- Node/TypeScript package style consistent with M09-M11;
- stable IDs reject prototype-hostile reserved names;
- bounded data operations; no unbounded graph traversal is introduced;
- exact optional typing and no unchecked index assumptions under repository strict TypeScript config.

## CONSTRAINTS
- preserve all existing public contracts and tests;
- no force push/history rewrite/destructive repository action;
- no changes outside admitted files except necessary workspace integration;
- denominator remains `1088`, M12 weight remains `18`;
- any HIGH/CRITICAL finding blocks merge/promotion.

## ACCEPTANCE CRITERIA
AC1 strict schema/version/identity validation passes.
AC2 required current obligation -> source-bound `NECESSARY`; conflict/insufficient authority -> `UNRESOLVED`.
AC3 only `NECESSARY` is auto-admit eligible.
AC4 classification delta exposes scope expansion and necessary-work erosion.
AC5 required/applicable DoD criterion is complete only with `SATISFIED` + evidence.
AC6 invalid N/A/applicability/duplicate criteria fail closed.
AC7 DoD criterion-set drift exposes added/removed/reclassified obligations.
AC8 Scope Drift Sentinel blocks unauthorized expansion, required removal/downclassification, unauthorized upclassification and OUT_OF_SCOPE presence.
AC9 authorized changes remain visible/non-blocking rather than disappearing.
AC10 outputs are deterministic/immutable and authority notices deny promotion power.
AC11 focused tests pass on Linux/Windows/macOS.
AC12 full repository build/typecheck/tests pass on exact PR head.
AC13 semantic audit finds no HIGH/CRITICAL defect and confirms Scope/DoD/ownership compliance.

## TESTS
- package build/typecheck;
- focused `tests/m12-scope-dod-engine.test.mjs`;
- full `npm test` regression;
- cross-platform focused workflow (Ubuntu/Windows/macOS);
- exact-head status/workflow verification before merge.

## DELIVERABLES
- M12 frozen planning docs + Module Gate;
- package source/package metadata/tsconfig;
- focused tests;
- M12 workflow;
- root workspace build/lock integration;
- `.engineering/evidence/GBS-WO-M12-001-EVIDENCE.md` bound to audited head;
- PR, audit verdict and merge evidence;
- checkpoint delta only after APPROVED merge.

## REVIEW FORMAT
Return `APPROVED`, `CORRECTION REQUIRED` or `BLOCKED`; enumerate findings by severity; bind review to exact head SHA and CI runs; confirm acceptance criteria, regression, ownership boundaries and denominator invariants.

## STOP CONDITION
Stop implementation at `GBS_WO_M12_001_READY_FOR_EXACT_HEAD_AUDIT`. Do not promote `MODULE_DONE` until independent exact-head audit is APPROVED and checkpoint delta is merged.
