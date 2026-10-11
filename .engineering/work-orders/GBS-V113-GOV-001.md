# GBS-V113-GOV-001 — Post-merge canonical checkpoint promotion planning

**State:** PLANNING_ONLY / PROPOSED_NOT_ADMITTED / POST_MERGE_CI_NOT_VERIFIED
**Risk:** ELEVATED (PROJECT_STATE + one-time ADR-0011 exception)
**Issue:** #434; predecessor implementation Issue #432 / PR #433
**Exact planning base:** `main@bf9f9bc74f16a02fd4119b6b1e063c3cb51589f1`
**Planning branch:** `docs/v113-gov001-postmerge-plan`
**Target promotion branch:** not assigned until fresh Context Lock and exact post-merge evidence are approved
**Executor:** ChatGPT governance planning / owner audit; Codex retains code/test/CI authorship under ADR-0008 for future Work Orders.

## OBJECTIVE
Create the bounded, auditable plan to promote only the proven result of GBS-V113-PARALLEL-001 after the PR #433 squash merge to main, while keeping current public `@gef-bootstrap/cli@1.1.2` immutable and preserving V1.2 implementation credit at 3/10.

## CONTEXT AND SOURCE AUTHORITY
- Implementation PR: https://github.com/KayzenRoot/gef-bootstrap/pull/433
- Final audited implementation head: `785b15e9088f16872c59c142f3c86217e4e2d851`
- Owner exact-head review: https://github.com/KayzenRoot/gef-bootstrap/pull/433#issuecomment-6104747003; APPROVED / NOT_INDEPENDENT.
- Implementation squash merge: `bf9f9bc74f16a02fd4119b6b1e063c3cb51589f1`; GitHub merge success confirmed.
- Exact PR-head assurance: 17/17 workflow runs SUCCESS, CodeRabbit 8/8 resolved, 33/33 targeted tests, 1692/1692 validate in normal clone; these are **pre-merge PR** proofs, not post-merge proofs.
- `main` checkpoint as fetched at planning base: `.engineering/CHECKPOINT.md` blob `ea31e6cab8964aca4b0f74296b2953e6da51d6d7`; `.engineering/CHECKPOINT.json` blob `468dec80ad5a48c044e4282d87481a8267f44866`; v1.1.2 PRODUCTION_ACCEPTED and V1.2 3/10.
- `AGENTS.md`, SOURCE-HIERARCHY, CHECKPOINT md/json, Decisions Ledger, ADR-0008, ADR-0011 (proposed), original WO/Context Lock/Evidence, Scope, Requirements, Architecture, Security, Test & Benchmark Plan, DoD, Deployment and GITHUB-FIRST-CODEX-WORKFLOW are required before admission.
- GitHub connector returns pull-request-triggered runs for commit checks and **cannot certify main push check-runs** for the squash commit. Initial combined legacy statuses returned empty. Therefore post-merge outcome remains **UNKNOWN / NOT_VERIFIED**, not PASS.

## SCOPE
Phase A, allowed now (this draft PR): the present planning Work Order, planning Context Lock, proposed checkpoint delta and preflight evidence note. No product or canonical checkpoint edits.
Phase B, **not admitted until post-merge evidence**: a separate branch/PR to record ADR-0011 one-off effective supersession (strictly Issue #432/PR #433) and promote the implementation's exact proven state into CHECKPOINT md/json, with a fresh checksum-bound lock, proven post-merge CI and owner's exact-head audit.

## OUT OF SCOPE / FORBIDDEN
No CLI/library/runtime/tests/fixtures/CI/workflow/dependency/metadata changes in this plan; no main direct writes, tags, package publication, GitHub Release, consumer rollout, general scheduler #397, automatic agent dispatch or V1.2 denominator change. No unsupported acceptance claim. Do not grant ChatGPT general code authorship beyond the one-off candidate specified in ADR-0011.

## FILES / INTENT
Plan-only allowed writes (all new):
- `.engineering/work-orders/GBS-V113-GOV-001.md`
- `.engineering/context-locks/GBS-V113-GOV-001.json`
- `.engineering/checkpoint-deltas/GBS-V113-GOV-001-PROPOSED.md`
- `.engineering/evidence/GBS-V113-GOV-001-PREFLIGHT.md`

Future promotion PR, only after gate/admission and **separate exact-base Context Lock**:
- `.engineering/CHECKPOINT.md`
- `.engineering/CHECKPOINT.json`
- `.engineering/evidence/GBS-V113-GOV-001-PROMOTION-EVIDENCE.md`
- bounded decision register/ADR-0011 changes if authority chain requires

## ARCHITECTURE RULES / CONSTRAINTS
- Preserve domain-specific authority and descriptive-vs-normative separation.
- `gef parallel plan/issues/prompt` is opt-in planner; no agent runtime, merge automation or generic promotion engine.
- The proof of PROMOTED currently only recognizes exact canonical U12-01/GBS-V12-WO-001 in GEF itself; unrecognized promotions fail closed.
- `origin` local Git config does not prove remote custody; security residual documented.
- Sonar S8786 MAJOR and S6582 MINOR remain tracked, neither silently accepted nor mislabeled HIGH/CRITICAL.
- ADR-0011 remains PROPOSED until the corresponding governed decision reaches approval/effectivity. No unauthorized changes to older ADR history.

## ACCEPTANCE / TEST GATES
A1. Rebind actual main and SHA `bf9f9bc74f16a02fd4119b6b1e063c3cb51589f1`; if changed, halt/rebuild lock from fresh authority.
A2. Prove all required **post-merge main commit** check-runs for that exact SHA using authenticated GitHub `gh api repos/KayzenRoot/gef-bootstrap/commits/bf9f9bc74f16a02fd4119b6b1e063c3cb51589f1/check-runs` or equivalent verified native provider results. Capture exact IDs, conclusions and timestamp; empty unsupported connector result is not success.
A3. Compare audited PR head and squash merge file blobs/diff (13 changed paths); recognize only approved content.
A4. Admit actual promotion Work Order after A1–A3; establish distinct Context Lock and allowed write list.
A5. Apply strictly monotonic, coherent PROJECT_STATE delta; preserve 1.1.2 accepted and V1.2 U12-01/02/04 IMPLEMENTED_PASS, 3/10; record 1.1.3 implementation MERGED_NOT_RELEASED. JSON parse/parity + relevant checkpoint/assertion checks.
A6. Exact-head checks on the promotion PR must pass, including security/source integrity; CRITICAL/HIGH unresolved 0; owner audit APPROVED / NOT_INDEPENDENT, then only governed squash merge.
A7. After promotion, admit release issue #435 on new canonical main with fresh version/packaging/Trusted Publishing tests. No tag/npm/GitHub Release before separately audited release gate.

## VALIDATION / EVIDENCE
Plan: inspect diff of precisely these four documents, JSON parse/context-lock cross references; review of plan only. Future promotion: record base/head, check-run IDs, source fingerprints, decision effectivity, markdown/JSON parity, zero new V1.2 credit, complete rollback/correction protocol. No test run is claimed on this plan branch.

## DELIVERABLES
Issue #434, draft planning PR, this Work Order, plan Context Lock, preflight evidence and proposed Checkpoint Delta. Future independently governed promotion PR and release issue #435.

## REVIEW FORMAT
Português brasileiro; APPROVED / CORRECTION REQUIRED / BLOCKED, audit NOT_INDEPENDENT, exact SHA, actual check IDs/results, scope, unresolved risks and one next legal step.

## STOP CONDITION
`GBS_V113_GOV_001_POST_MERGE_EVIDENCE_REQUIRED_BEFORE_CHECKPOINT_PROMOTION`
