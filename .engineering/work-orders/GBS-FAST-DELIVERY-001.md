# GBS-FAST-DELIVERY-001 — Fast Delivery Mission Coordination Work Order

**Status:** PLANNING_CANDIDATE / NOT_ADMITTED_FOR_IMPLEMENTATION  
**Owner directive:** 2026-10-12, urgent delivery modernization  
**Issue:** [#437](https://github.com/KayzenRoot/gef-bootstrap/issues/437)  
**Existing agent-native program:** [#393](https://github.com/KayzenRoot/gef-bootstrap/issues/393)  
**Planning base:** `main@bf9f9bc74f16a02fd4119b6b1e063c3cb51589f1`  
**Release predecessor:** `@gef-bootstrap/cli@1.1.2` PRODUCTION_ACCEPTED  
**V1.2 baseline:** 3/10 implemented (U12-01, U12-02, U12-04), 7/10 remain  
**Risk:** ELEVATED (planning/orchestration); child work retains its own risk  
**Implementation actor:** Codex only, per effective ADR-0008; Owner approval for merges and releases

## OBJECTIVE
Coordinate the shortest safe critical path to ship the already merged v1.1.3 parallel planner; accelerate current GEF V1.2 delivery without fabricating completion; and adopt an optional GEF Fast Delivery operational profile with functional vertical slices, resumable local Codex execution, bounded multi-agent worktree scheduling, risk-proportional assurance and objective token/throughput measurement. This mission is *coordination/planning*, not implementation authority for child WOs.

## CONTEXT
- Git and canonical Source Pack/checkpoint/ADRs determine truth; issue labels are not authorizations.
- PR #433 merged the `gef parallel` opt-in planning CLI at `bf9f9bc74f16a02fd4119b6b1e063c3cb51589f1`, but npm stable remains 1.1.2.
- [#434](https://github.com/KayzenRoot/gef-bootstrap/issues/434) and draft PR #436 contain promotion gates. Post-merge exact-SHA push CI was NOT_VERIFIED in their existing evidence and must be checked by local `gh api` before promotion.
- [#435](https://github.com/KayzenRoot/gef-bootstrap/issues/435) is the separately gated v1.1.3 release. No publish until #434's governance is promoted.
- [#394](https://github.com/KayzenRoot/gef-bootstrap/issues/394) / implementation PR #407 is the GEF Gate foundation. No dependent #396/#397/#398 implementation while its correction/audit/promotion is unresolved.
- [#393](https://github.com/KayzenRoot/gef-bootstrap/issues/393) is the **existing** program. Reuse its stable child IDs, avoiding new substitute WOs.
- Do not mistake v1.1.3's six-slot batch *planner* for a running Codex scheduler. Dispatch, execution, retries and merge authority remain separate.

## SCOPE / NECESSARY
### Lane R: release current tested opt-in patch
1. Complete #434 preflight: verify post-merge CI on the exact merge SHA, ancestry/diff parity, audited checks, failures/security, code-review threads and promotion eligibility.
2. Only after approval, complete its governance PR/checkpoint promotion with exact-head checks.
3. Then admit #435, Codex builds versioned release candidate and tests the actual tarball (Node22 / Windows, Linux, macOS), trusted publishing via OIDC, same-tarball installation, CLI help + plan dry-run, release workflow whitelist, checksums, provenance, immutable tag and npm registry readback.
4. Preserve v1.1.2 and frozen V1.0 lineage. **v1.1.3 is narrow patch**; do not inject the full new scheduler. v1.1.4 requires a distinct future patch claim if needed.

### Lane F: agent-native Fast Delivery
1. **F1, gate prerequisite:** finish existing #394 / PR #407: deterministic machine WO schema, compact AGENTS router, source/impact risk classifier, context compiler, stable GEF Gate and adversarial suite. Narrow CI only after proofs and ruleset compatibility.
2. **F2, independent successors if nonoverlapping:** #396 machine-read Evidence Bundle/audit packet and #398 structural architecture/doc-drift checks. Freeze required contracts before dispatch.
3. **F3:** #397 orchestrator/scheduler with dependency DAG and READ/WRITE sets, per-agent worktrees/branches/Context Locks/leases, deterministic integration steward, crash/replay protection. Start conservative 2–3 agents; permit up to 6 only if quota, environment, write-set independence and tests justify it. Unknown conflicts serialize.
4. **F4:** #402 reproducible workspace factory; #400 long-running WO runner and durable progress; #401 automated bounded diagnosis/fix/test loop in the same WO/PR. Independent work can overlap after explicit dependency closure, not simply based on labels.
5. **F5:** #405 multi-WO Mission Train and #399 issue-driven pilot after foundations are promoted. Orchestrator MAY select only admitted WOs; it must never create its own authority to approve, merge, publish or promote.
6. **F6, important improvements when triggered:** #409 token economy/context delta reuse, #410 telemetry, #411 specialized progressive skills, #412 deterministic hooks/impact CI, #413 content-addressed evidence/proof reuse, #404 throughput metrics, #406 optional zero-config profile. Avoid replacing already sufficient engines or duplicating existing Source Pack.
7. Adopt vertical-slice *work-order sizing*: a single semantically cohesive WO may comprise schema/API/UI/integration/tests and a single implementation PR. Internal tests/checkpoints are recorded as run receipts, not unnecessary independent manual-review stops. HIGH_ASSURANCE and incompatible migrations retain separate scoped gates.

### Lane V: V1.2 obligations
Continue the existing canonical V1.2 work-order dependency sequence for U12-03 and U12-05..U12-10. Its own Scope/Requirements/DoD define completion; do not combine unrelated claims or automatically change denominator. Reconcile F/V write sets and worktree bases before allowing concurrency. No claim of V1.2 10/10 until all ten are objectively accepted and promoted.

## CLASSIFICATION
- NECESSARY for *first measured fast-delivery pilot*: F1-F4 + a small bounded F5 pilot where predecessor gates pass. This is a planning priority, **not** blanket admission.
- IMPORTANT: F6 capabilities according to actual proven deficits and dependency ordering, never indiscriminately installed.
- FUTURE: wholesale Symphony/GSD/Gas Town import, complex cross-platform convergence and omnipresent background services.
- OUT OF SCOPE: unbounded swarms, self-approved merge/checkpoint, bypassing rulesets, disabling checks, any unnecessary paid/cloud service, speculative V1.2 credit, publication without OIDC/artifact verification.

## FILES / SOURCES TO READ
MUST_READ: `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, `.engineering/CHECKPOINT.md`, `.engineering/CHECKPOINT.json`, `.engineering/DECISIONS-LEDGER.md`, ADR-0008 and proposed ADR-0011, current frozen Scope/Requirements/Architecture/Security/Test-Benchmark/Deployment/DoD, issue #393 and relevant child WO records, #434/#435, PRs #407/#433/#436, `docs/PARALLEL-MODULES.md`.
READ_IF_TRIGGERED: affected packages, API contracts, rulesets, workflows, npm manifest, JEV skill docs and relevant historical evidence. Child agents use only their own canonical Navigation Maps and the minimal valid context capsule.
WRITE_ALLOWED for THIS WO planning PR: `.engineering/work-orders/GBS-FAST-DELIVERY-001.md`, `.engineering/context-locks/GBS-FAST-DELIVERY-001-PLANNING.json`, optional isolated planning evidence.
WRITE_FORBIDDEN here: product code, tests, workflows, package manifests, releases/tags, canonical checkpoint, Security/Scope/DoD/Decisions edits and child-issue admission state.

## ARCHITECTURE RULES / CONSTRAINTS
Preserve domain-specific source hierarchy and frozen AD(R)s. No second scheduler/context/checkpoint engine if existing engines can be extended. Use one exclusive Integration Steward lease for shared integration state; branch/worktree per executor; avoid conflicting lockfile, generated output, schema and CI configuration edits. Inspect real Git ancestry and effective rulesets, not only issue text. Owner audit is NOT_INDEPENDENT. Codex alone authors child code/tests/CI/migrations. Refuse any runtime modification when Context Lock is stale or no admitted child Work Order exists. No force push or bypass. HIGH_ASSURANCE review remains independent where DoD requires it. Prefer Git/AST/tests/cache to extra LLM calls. JEV tools optional and bounded to typed decisions.

## WAVES / AGENT POLICY
- W0: triage #407, exact post-merge #433 evidence for #434, inventory/graph of remaining V1.2. Same time only read-only/authorized planning tasks can proceed.
- W1: Lane R #434 → #435 and Lane F #394 completion run side by side *only if* implementation write/authority are independent.
- W2: after #394 promotion, evaluate #396/#398 against conflict classifier, assign bounded agents; prepare, but do not prematurely execute, #397.
- W3: when #397 is promoted and fixtures pass, schedule #400/#401/#402 by exact dependency/write graph; reassess resource cap.
- W4: pilot issue-to-PR-to-audit-to-promotion workflow (#399/#405); benchmark; only then activate profile #406 and plan appropriate versioned release.
- V1.2 runs under its own admitted WOs when independent; blocked/correction predecessors only block dependents.
- Max parallelism is a resource/concurrency cap, **not a target**. Optimize completed audited user functionality per week *and* quotas, not number of agents.

## ACCEPTANCE CRITERIA
A1: Release lane ships verified `@gef-bootstrap/cli@1.1.3` only after its own gates; V1.2 stats truthful.
A2: A coherent vertical WO delivers working integrated acceptance test and one audit-ready PR without serial manual micro-WO churn.
A3: 3 independent fixture WOs run safely isolated; hidden path overlaps, manifest/workflow conflicts, unknowns and stale parents block/serialize.
A4: Durable exact-state resume, crash/retry idempotency and Integration Steward prevent double integration.
A5: Bounded repair loops pass focused/regression tests; no outside-scope changes or false PASS; escalation preserves STOP.
A6: Impact/risk gate receipts match canonical security/DoD; security/data/release cases never narrow required validation.
A7: CI-derived Evidence Bundle has exact SHA, changed paths, security/tests/status, risks, review threads, checkpoint delta *proposed*.
A8: Fast Delivery opt-in documented, smoke-tested in clean greenfield and backed-up brownfield fixtures with rollback/recovery and Windows/Linux/macOS compatibility.
A9: Before/after metrics (wall time, check-runs, manual gates, tokens when available, defects, reruns) are comparable, with zero invented percentages.
A10: No autonomous merge/owner review/publish/DoD promotion. Every child WO has its own ACCEPTANCE, evidence, audit, promotion and failure-gate.

## TESTS
Per child risk: fast static + focused + integration; Node22 `npm run build`, `npm run typecheck`, `npm run validate`, `npm audit --audit-level=high`, `git diff --check`; adversarial DAG/path/alias/case/rename/unknown tests; session crash and restart/lease recovery; realistic E2E fixture; exact-HEAD required workflows/security; release-specific full T7 same-tarball matrix and registry/provenance verification. Do not claim test execution in this planning-only WO.

## DELIVERABLES
This issue and versioned WO + planning Context Lock + draft PR; per-child branch, stable issue, code/tests, verified Evidence Bundle and audited checkpoint promotions; v1.1.3 release receipt; optional Fast Delivery profile release only when separately approved; measurable before/after dossier; final V1.2 completion separately evidenced.

## REVIEW FORMAT
Português brasileiro; base/head SHA, file list, source/fingerprint status, issue/PR mapping, exact-head checks, test results, risks and blockers, `APPROVED` / `CORRECTION REQUIRED` / `BLOCKED` only. Mark Owner/ChatGPT review `NOT_INDEPENDENT`.

## STOP CONDITION
`GBS_FAST_DELIVERY_001_PLANNING_READY_FOR_OWNER_AUDIT`.
This planning PR neither approves child implementation nor promotes the checkpoint. Existing #393/#394/#397/#434/#435 precedence always wins over incidental mission scheduling.