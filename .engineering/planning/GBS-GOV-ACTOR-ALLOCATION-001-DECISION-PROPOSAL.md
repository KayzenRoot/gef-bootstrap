# GBS-GOV-ACTOR-ALLOCATION-001 — PROPOSED actor allocation and authority impact map

Status: **PROPOSAL ONLY / NOT A GOVERNED ADR / NOT EFFECTIVE**.
Related: Issue [#452](https://github.com/KayzenRoot/gef-bootstrap/issues/452), parent [#437](https://github.com/KayzenRoot/gef-bootstrap/issues/437), Work Order `GBS-GOV-ACTOR-ALLOCATION-001`.
Frozen planning base: `main@e0356f1de5dae2351d8701a76c736a22832929c2`; planning WO blob `2054aae91c8ae2cf5097a172aa36a48fdff48e0f`.
**Status precedence:** effective ADR-0008-D1/D6, AGENTS and frozen Source Pack retain full force. This document neither overrides any decision nor allows implementation, merge or release. No ADR number is reserved.

## Problem and desired improvement

The Owner wants maximum GitHub-based progress from the chat, to use Codex Desktop for genuinely complex or hardware-dependent work. Current ADR-0008 correctly prohibits ChatGPT code, fixtures, tests, CI and migrations by default. A future tightly scoped change can reduce unnecessary handoffs for LOW/STANDARD reversible, testable work **without treating this speed preference as security, authorization or correctness evidence**.

## Proposed normative rule, for later admission only

**ACTOR-1: Fail-closed selector.** Each independently approved Work Order states: `actor: CHATGPT_GITHUB | CODEX_LOCAL`, `risk`, `sourceBaseSHA`, `workOrderFingerprint`, `contextLockFingerprint`, `writeAllowlist`, `writeForbidden`, `requiredChecks`, `validationEnvironments`, `rollback`, `ownerAuthorizationReceipt` and `mergeAuthorityReceipt` (if any). Unknown or missing required field = BLOCKED. Selector cannot infer eligibility from GitHub access, past source, tool capability or chat permission.

**ACTOR-2: CHATGPT_GITHUB eligibility.** ONLY if a separately effective decision grants this capability, per-WO explicit Owner admission names the actor and exact paths, risk is LOW/STANDARD, implementation is additive/bounded/reversible, accepted semantics are stable, all tests can run in hosted checks without local-only state, complete Source Check and exact locks pass, GitHub account is KayzenRoot and required reviewer/security/ruleset gate is met. Sample categories *to evaluate*, not pre-approved: self-contained deterministic pure helper functions, minor non-security bug fixes with existing contract, narrow focused unit tests. “Easy for an AI” is not evidence.

**ACTOR-3: CODEX_LOCAL fallback.** Complex multi-module code, substantial refactor, native/Windows ACL/hardware-dependent validation, significant architecture change and locally reproducible-only behavior go to Codex after separate WO/lock admission; not to ChatGPT by default. If security/risk Source Pack says BLOCKED, Codex alone does not cure that block.

**ACTOR-4: Excluded from direct ChatGPT implementation regardless of superficial simplicity.** Security policy, auth/authz, secrets, keys, protected GitHub rulesets, all-ref scanner, CI/publish gates/workflow edits, version/lock/supply-chain upgrades, deployment/release/npm/tag, migrations or deletion, data corruption and privileged provider write, HIGH_ASSURANCE, ELEVATED/UNKNOWN risk without separate valid authority, change affecting accepted V1.2 denominator and changed frozen canonical sources. Existing SEC-02 S4 target-specific explicit Owner authorization remains mandatory. ELEVATED does not quietly become STANDARD.

**ACTOR-5: Strict separation.** Source authority belongs to the same frozen product/decision/security documents. GitHub Actions verifies artifacts but is not a semantic approver. ChatGPT author may not claim independent semantic/security review of its own patch; actual independent reviewer gate remains mandatory where policy requires. Review by Owner using same ChatGPT is `NOT_INDEPENDENT`. A green check is not a merge grant; PR merge/promotion/release require their own action-specific gates.

**ACTOR-6: Exactness and invalidation.** Change in current main, Work Order body/fingerprint, lock, source authority, allowed paths, test scope, risk, external profile or dependency graph invalidates selection at minimum affected-node granularity. No silent rebases, no stale pre-merge checks reused as post-merge evidence. A detached planning draft cannot become implementation authority by label change.

**ACTOR-7: Safe rollback.** A prospective approved per-WO ChatGPT actor may be revoked prior to merge; STOP and use Codex-only default for a new admitted WO. Preserve history/evidence; do not delete branches or bypass failing checks. Measure speed/token advantages from comparable results only; zero guarantee of savings.

## Decision table (future rule, not active)

| Scenario | Proposed actor eligibility | Preconditions / outcome |
| --- | --- | --- |
| Planning, issue triage, docs Work Order, audit | ChatGPT as existing governance actor | Must preserve current Source Pack and provider permission |
| Pure deterministic helper in LOW/STANDARD governed WO | CHATGPT_GITHUB **conditional** | Separately approved ADR, fresh WO/lock, exact paths, hosted regression |
| Straightforward tests paired with same bounded helper | CHATGPT_GITHUB **conditional** | Same WO/lock, no coverage/policy weakening, cross-OS as required |
| Multi-package/multi-runtime algorithm, complex local debugging | CODEX_LOCAL | Fresh admitted WO, platform evidence, original security/CI gates |
| Native package, Windows rights, local GPU or toolchain | CODEX_LOCAL | Hardware/platform test authority; hosted CI alone insufficient |
| Dependency major upgrade or npm lock/supply-chain change | BLOCKED pending distinct risk governance; generally Codex | No automatic Dependabot merge or test adjustment |
| Gitleaks all-ref safety, auth, privileged action, release CI | BLOCKED pending Security/S4 or specialized authority | ChatGPT never gains general scanner/CI write license |
| HIGH_ASSURANCE, ELEVATED or UNKNOWN risk | BLOCKED for CHATGPT_GITHUB | High assurance independently reviewed; explicit SEC-02 for S4 |
| No approved WO/lock or conflicted CHECKPOINT MD/JSON | BLOCKED | Current situation, including Issue #452 |
| Context path SHA/actor/required check drift | BLOCKED until new exact pack | Do not infer “same enough” |

## Authority impact map, to be revised by a separate guarded governance Work Order

| Canonical source | Existing relevant rule | Planned treatment |
| --- | --- | --- |
| `.engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md` | D1/D6 Codex-only code/test/CI | Prospective **limited** explicit supersession only for per-WO allowlisted low-risk source/test, if Owner S4 authorizes and integration promoted; all other D clauses continue |
| `.engineering/DECISIONS-LEDGER.md` | historical Codex-era decisions | Append decision with exact date/scope/source and approval, never erase historical decisions |
| `.engineering/DECISIONS-SUPERSESSION-MAP.md` | contains contradictory legacy ChatGPT-only line and later Codex-era entries | Audit all entries to identify current decision authority; explicitly reconcile actor statements and cross-links |
| `AGENTS.md` | Codex sole code author, ChatGPT planning | In later admitted delta, route to active per-WO actor contract; default still Codex, no self-selection |
| `.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md` | GitHub planning, Codex execution | In later governed delta, name eligible GitHub implementation path **plus** unchanged semantic review/merge/promotion separation |
| `.engineering/SCOPE.md` / `.engineering/ARCHITECTURE.md` / `.engineering/REQUIREMENTS.md` | frozen hybrid and actor-related assertions | Change only verified conflicting actor sentence(s) under separately approved override, no capability/spec edits |
| `.engineering/SECURITY.md` | S0–S4, secrets, independent review | **UNMODIFIED** in this proposal and any narrow actor amendment; if actor allocation would require weakening Security, STOP for a distinct higher-risk project decision |
| `.engineering/CHECKPOINT.md` + `.json` | current project state | **UNMODIFIED HERE**; parity correction #451 needs own separately authorized merge before promotion; future actor amendment has own proposed checkpoint delta |
| ADR-0011 historical proposed exception | narrowly #432/#433 | Preserve its historical proposed status/scope; never infer cross-project effectiveness |

## Explicit gates and order

G0. Existing `STATE_CONFLICT` of checkpoint pair stays BLOCKED. PR #451 may be audited but must not be merged without its own specific Owner S4 approval. PR #450 remains `doNotExecute`.
G1. Complete the Issue #452/this planning PR exact HEAD review and hosted validation, **PREPARATION ONLY**.
G2. Once canonical parity actually corrected via approved PR #451, rebuild every SHA and Work Order/lock fingerprint. Decide whether governance supersession is still necessary and verify security classification.
G3. Separate, explicit Owner S4 permission naming the exact privileged governance amendment/PR and acceptable source/target. Absent this, no governance promotion.
G4. Create a separate formally admitted governance delta, update exactly allowed decision-domain sources with an affirmative/negative test matrix, run CI, obtain exact-head and required specialist review; no authority until approved protected integration and project-state promotion.
G5. Open an independently admitted LOW/STANDARD pilot Work Order on the new authority, with exact `CHATGPT_GITHUB` actor and automated hosted tests. Fail closed if any gate unknown.

No pilot implementation is preauthorized. No amount of passing planning CI proves effective law.

## Adversarial test matrix for a future implementer

`DENY`: actor absent; risk=ELEVATED but labeled simple; wrong owner account; missing required checks; secret/security/CI workflow in allowlist; mixed allowed+forbidden files; unreconciled MD/JSON; stale fingerprint or missing WO blob SHA; forbidden transitive write; branch head update mid-run; fetched review missing independent qualification; 0 passing platforms reported as success; CodeRabbit disabled claimed as approval; historic all-ref Gitleaks fail hidden by green PR push.
`ALLOW` only after effectiveness: low-risk exact-bound helper changes in approved path, unchanged required tests PASS at exact HEAD, authentic owner semantic audit with independent gate satisfied if required, separate explicit integration and postmerge verification.
`ROLLBACK`: candidate fails or scope expands -> no merge; remand same approved WO/PR only when within authority or re-admit new WO; never downgrade tests.

## Evaluation / evidence format

Capture before/after representative accepted WOs: source snapshot, affected code/tests, equivalent required checks, elapsed wall clock (tool log timestamps only), model/tool token usage where actually measured, review/correction counts, cost if accurately available, regressions, rejected scope. No invented ROI.

**STOP:** `GBS_GOV_ACTOR_ALLOCATION_001_DECISION_PROPOSAL_PREPARED_NOT_EFFECTIVE`.
