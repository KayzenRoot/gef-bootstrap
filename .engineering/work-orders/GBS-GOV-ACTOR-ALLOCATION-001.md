## 2026-10-14 Current-source authority reconciliation

**Current authoritative source:** `main@e71120266c40235089444c9c0122280c5da4e5bd`. [PR #451](https://github.com/KayzenRoot/gef-bootstrap/pull/451) was subsequently specifically authorized by the Owner, protected squash **MERGED**, and validated at the new main HEAD. The original observations below of old `main@e0356f1de5dae2351d8701a76c736a22832929c2`, checkpoint blobs `866d0fcef2253560a45a8dbca147d9cd451d0960`/`af21419f47fc9f106abb49203b5b52c135a66ee1`, and unmerged PR #451 are **historical**. Current checkpoint blobs are Markdown `686a2e3f7da1b541f9a4ee10a4d9432358105e0a` and JSON `4a653772c31dffee869a9bac17345241cfc6db03`; former WO-002 temporal `STATE_CONFLICT` resolved. Current canonical WO-002 has `implementationAuthorized=false`, implementation not started, effective lock null; PR #450 remains inactive DRAFT.

**Governance proposal NOT effective:** Effective ADR-0008-D1/D6, AGENTS.md, SECURITY, Scope, Source Hierarchy, Decisions Ledger and Supersession Map are unchanged; ChatGPT remains **documentation/governance only**, code/tests/CI author Codex-only. Original proposal concerns a future **narrow reversible LOW/STANDARD per-WO actor exception**, not blanket GitHub writes, Security bypass, release permissions, HIGH_ASSURANCE/ELEVATED downgrade or permission to revise ADR-0008 today. Exact Owner **S4 authorization for a future privileged actor-law amendment** has NOT been granted by the Owner approval of PR #451. Risk remains `ELEVATED_GOVERNANCE`, no product code, tests, CI, framework, checkpoint or active ADR modified. This Work Order is a PLANNING proposal with future separate protected revision/merge and independent assurance where policy requires.

**Preserve:** original A1–A10 acceptance definitions (not executed), allowed planning documents only, immutable history of old source fingerprints, all deny flags. #439 remains 21 historical Gitleaks UNKNOWN and CLI 1.1.3 BLOCKED; CLI stable 1.1.2, V1.2 3/10.

**STOP:** `GBS_GOV_ACTOR_001_POST451_CURRENT_SOURCE_PLANNING_ONLY_ACTOR_ADR_UNCHANGED`.

---

# GBS-GOV-ACTOR-ALLOCATION-001 — GitHub-first actor allocation (planning Work Order)

Status: `PLANNING_ONLY_NOT_ADMITTED`; implementation authority: **NONE**; effective decision change: **NONE**.
GitHub Issue: [#452](https://github.com/KayzenRoot/gef-bootstrap/issues/452); parent [#437](https://github.com/KayzenRoot/gef-bootstrap/issues/437).
Owner directive: 2026-10-13, favor ChatGPT + GitHub for all lawfully bounded work; reserve Codex for complex/local-only tasks.
Observed planning base: `main@e0356f1de5dae2351d8701a76c736a22832929c2`.
Risk classification: **ELEVATED, governance proposal**; prospective privileged decision/authorization changes require separately named **S4 Owner authorization** under SEC-01/02.
Next legal outcome: a documented actor-allocation *proposal*, with no code, test, CI, effective ADR or checkpoint modification.
Stop condition: `GBS_GOV_ACTOR_ALLOCATION_001_PLANNING_PR_AUDITED_NOT_ADMITTED`.

## OBJECTIVE

Design a bounded, deterministic, auditable rule for delegating **specific LOW/STANDARD** GEF code increments to ChatGPT via the connected `KayzenRoot` GitHub account and hosted CI, **only after** an expressly approved and promoted supersession of ADR-0008-D1/D6. Every change without a positive, exact-bound eligibility proof stays Codex-only or BLOCKED. Do not change the semantic authority of the Source Pack, risk law, independent assurance or S4 merge/promotion authority.

## CONTEXT / SOURCE CHECK

- Effective actor law: ADR-0008-D1/D6, main blob `f3246fc074b450da986ad3dcda76f3d005dc8c6a`; matching router `AGENTS.md` blob `492f1d4ae66abe8749a082d68decc81a3b4fd702`.
- `SOURCE-HIERARCHY.md` blob `bedc10c97d28154efe59ff43fc1d175add37f568`: decisions by domain, cannot supersede by prose or recency; shared CHECKPOINT discrepancy means `STATE_CONFLICT`.
- Canonical `CHECKPOINT.md` blob `866d0fcef2253560a45a8dbca147d9cd451d0960` and `CHECKPOINT.json` blob `af21419f47fc9f106abb49203b5b52c135a66ee1` disagree in WO-002 temporal admission language post-merge #449. Parity PR #451 is DRAFT/UNMERGED, HEAD `3e8554ff940f2e9254119cdf8c489ee8946cbbfb`; separate Owner-specific merge authority **not given**. PR #450 is an INACTIVE implementation-lock draft; it must not be activated by this proposal.
- `SECURITY.md` blob `799206278e9f5bc02aec07c8e6d4489c530bb320`, frozen; SEC-02 requires target/action-specific S4 authorization, higher-class safety inherits lower-class controls. Independent HIGH_ASSURANCE reviewer cannot be replaced with Owner+ChatGPT review.
- `DECISIONS-LEDGER.md` blob `569479a700f1956bdb2d97be30a27aaccf592b7e`; `DECISIONS-SUPERSESSION-MAP.md` blob `e1cae94778752c9b3778d3f859998c9e16d7d687`. The supersession map contains legacy top-of-file ChatGPT-only implementation language; determine controlling later entries by domain and **repair inconsistency only in separately admitted decision change**.
- `ADR-0011-PARALLEL-PATCH-EXCEPTION.md` blob `0aa0d0f25bf9dcf54bcd237d07c9e6ebf1c4042d` is PROPOSED for #432/#433 alone; no blanket authorization.
- Frozen `SCOPE.md` blob `5071ed88fd793e0a3bddb5e26b2fbf92513fb048`, `ARCHITECTURE.md` blob `5c2b44db3805dbd5329dc99a8a9b774360c4136a`, DoD blob `b6faba1b969724401e5ce38ee9db5c5aa120056c`, Test Plan blob `88768b891280e9b1e7ad752fec23f158e856c5ea`, Deployment blob `5f4a263fcd51b9cdc2d4f85ad1c2569d041b8754`; all remain untouched.
- Product facts remain V1 accepted 1088/1088; V1.2 implemented 3/10; stable published CLI 1.1.2. Security [#439](https://github.com/KayzenRoot/gef-bootstrap/issues/439) has 21 all-ref Gitleaks UNKNOWN findings and separately blocks npm 1.1.3.

No effective actor policy can be inferred from this Work Order, issue #452, the branch or the prospective ADR document.

## SCOPE / IMPLEMENTATION PLAN (only once separately admitted)

1. Produce a decision-domain supersession for **author of source-code, unit tests and narrowly related fixtures** only, anchored to a specific Work Order and current canonical source IDs. Keep ADR-0008 default if no fully approved exception.
2. Select actor `CHATGPT_GITHUB` only when **ALL** inputs are known: approved low-risk WO, stable actor-specific path allowlist, current exact base/head, code/test content suited to hosted validation, required checks/security gates available, known rollback and acceptable Owner-permission boundary. Any missing field = `BLOCKED`, never ALLOW.
3. Force `CODEX_LOCAL` for complex multi-module design, hardware/local reproduction, platform-only native behavior and advanced refactoring, even if nominal risk appears low; force `BLOCKED` for privilege/security/secret/supply-chain/CI/release/irreversible changes, HIGH_ASSURANCE, ELEVATED or unknown risk unless the original security law and separately granted authority explicitly support it.
4. Keep planning, Work Order, Context Lock, approval, code author, semantic reviewer and protected merge **separate roles**, without claiming that an Owner-run ChatGPT audit is independently reviewed.
5. Bind GitHub author identity (correct owner `KayzenRoot`), branch protection, GEF exact-head proof, SOURCE-HIERARCHY validity, code review, full test/CI and stop/rollback semantics.
6. **Only after approved promotion** reconcile ADR-0008-D1/D6, Decisions Ledger, Supersession Map, `AGENTS.md`, GitHub-first Workflow, and any actually conflicting frozen Scope/Requirements/Architecture statements via precisely authorized downstream changes. Preserve old records and historical #432 exception.
7. Prepare representative first pilot WO restricted to a pure algorithmic or additive deterministic helper with focused tests, not #396/#439 or product safety authority. The first pilot is **not admitted** by this planning PR.

## OUT OF SCOPE / WRITE_FORBIDDEN

- No product/runtime implementation; tests/fixtures/build/CI/migrations; dependency/package/lock files; scanner settings; release/npm/tag; security policy; actions/rulesets; git history; branch deletion; direct `main` write; PR merge; independent-review bypass; checkpoint/ADR promotion; activation of #450; changing #451.
- No reducing V1.2 denominator/credit, unfreezing historical Sources, secret handling, or claiming savings without benchmark.
- No false inference that 1.1.3 is published or the 21 Gitleaks findings are benign.

## FILE INTENT / NAVIGATION MAP

**MUST_READ:** `AGENTS.md`; checkpoint pair; Source Hierarchy; ADR-0008; Security; Decisions Ledger/Map; Issue #452 and parent #437; PR #451 gate and #439 blocker.
**READ_IF_TRIGGERED:** Scope/Requirements/Architecture/DoD/Test Plan/Deployment/Backlog, ADR-0011 for narrow exception comparison, source-specific git objects and CI, current ruleset; full security evidence if choosing a security-affecting actor path.
**WRITE_ALLOWED during planning only:**
- `.engineering/work-orders/GBS-GOV-ACTOR-ALLOCATION-001.md`
- `.engineering/context-locks/GBS-GOV-ACTOR-ALLOCATION-001-PLANNING.json`
- `.engineering/planning/GBS-GOV-ACTOR-ALLOCATION-001-DECISION-PROPOSAL.md`
- GitHub Issue #452 / its own DRAFT planning PR discussion
**WRITE_FORBIDDEN:** all other repo files and GitHub governance/promotion actions in this plan. Any planned future scope change requires a new authorized WO/lock with fresh exact bindings.

## REQUIREMENTS / ARCHITECTURE RULES

- Actor choices are a governed input to the deterministic work plane; no agent grants itself access by detecting a tool.
- No reinterpretation of risk floor or S4 Owner authorization; Security and DoD are non-negotiable.
- A proposal does not create effectiveness. Any Source Pack project-state conflict invalidates dependent admission or promotion.
- Each approved future WO is single-source actor-bound; its manifest enumerates allowed paths, tests, CI, explicit stop, rollback and **separate** merge gate.
- No silent reuse of old passing checks after relevant source changes; no false cross-branch green status.

## ACCEPTANCE CRITERIA

A1. Proposal states explicitly `NOT_EFFECTIVE`, existing ADR-0008 remains law.
A2. Deterministic positive eligibility only with all allowlist/base/risk/actor/CI evidence supplied.
A3. Unknown/missing/conflicted source, wrong repo/account, absent lock or disallowed path results in BLOCKED.
A4. Security, privileged governance, migration, CI/release, secrets and HIGH_ASSURANCE remain outside ChatGPT eligibility.
A5. ELEVATED work requires its ordinary explicit separate risk authority and is never silently downgraded.
A6. Reviewer and author roles remain distinct in evidence; Owner/ChatGPT NOT_INDEPENDENT.
A7. ADR-0011's local exception remains local and does not become precedent by recency.
A8. All affected canonical source assertions are mapped, including stale Decisions Map opening statements.
A9. Source SHA drift/WO revision drift invalidates planning lock; no CI success from prior head is reused.
A10. Main/checkpoint not touched; 1088/1088, 3/10, stable 1.1.2 and #439 blocker preserved.

## TESTS / PROOF / EVIDENCE

**Planning checks:** compare exactly three allowlisted changed paths; validate lock JSON syntax and `doNotExecute`; exact SHA of the Work Order referenced by lock; source blob pin list; no edits to canonical CHECKPOINT, active ADR, AGENTS, Security, code/CI/workflows; inspect documentation/paths for false authority or credential exposure; run hosted Repository Validation/Pipeline Integrity/Free Security Pilot and applicable exact HEAD checks; record all failures and exact counts, not guessed PASSES. `git diff --check` where a runner is available. Owner audit `NOT_INDEPENDENT`.
**Future governed implementation tests (NOT AUTHORIZED HERE):** negative matrix for stale lock/base, wrong actor, unsupported platform, unknown risk, colliding writable globs, wrong owner, security class mislabeling, CI bypass, trusted reviewer spoofing, merged-but-unpromoted state and all-ref security mismatch; positive low-risk deterministic helper integration with cross-OS hosted CI and cost/elapsed-time instrumentation.

## DELIVERABLES / REVIEW FORMAT

- This planning Work Order + companion exact-fingerprint planning-only lock + proposed, explicitly nonbinding decision text.
- One DRAFT PR linked to #452 and #437, with exact source SHA and scope audit, all hosted check conclusions.
- Review: repository/base/head; changed paths; actor authority; tests and platform matrix; 0 unknowns **only if proved**; risks and security findings; `APPROVED_PREPARATION_ONLY`, `CORRECTION_REQUIRED`, or `BLOCKED`; Owner audit `NOT_INDEPENDENT`.
- A **separate** Owner decision on the exact privileged governance operation and later checkpoint promotion is required. No implicit merge.

STOP CONDITION: `GBS_GOV_ACTOR_ALLOCATION_001_PLANNING_PR_AUDITED_NOT_ADMITTED`.
