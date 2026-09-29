# GitHub-First ChatGPT ↔ Codex Construction Workflow

Status: APPROVED on main by ADR-0008 and PR #332; on release/1.1, this copy becomes effective exactly at the governed merge of this exact-head owner-audited promotion PR; D-0062 / ADR-0006 remains authoritative until then.
Source lineage: main commit f6738292c038eb6f0d08d1d32b3752c5c7dc417a; Git blob d061fff8e13bbb13fab6cdafb8bf001921905a61.
Owner: Project Owner / ChatGPT semantic planning / Codex sole code executor.
Tracking: issue #331, Work Order GBS-GOV-CODEX-ISSUES-001.
This document is the compact operational protocol, not a substitute for any project's own Source Pack or current checkpoint.

## Roles and boundaries

| Actor | Owns | Forbidden |
| --- | --- | --- |
| Project Owner | Scope/version decisions; S4/irreversible authorization | Implicit consent through old chat |
| ChatGPT | Research; Source Check; canonical product plan; architecture; issues/Work Orders; planning-only draft PRs; detailed file maps; bug/review/CI triage; evidence audit; proposed checkpoint deltas | Authoring or fixing implementation, tests, fixtures, CI scripts and migrations |
| Codex | Exact-bound source inspection; code/test/CI/migration implementation; targeted debugging; bounded refactor and corrections; commit, push and implementation PR; Evidence Bundle | Self-approving, promoting canonical checkpoint, revising approved architecture/scope |
| GitHub/CI/apps | Persist plans and exact-state metadata; execute tests/scans; report status/security/review evidence | Treating a green badge as complete or becoming autonomous code author |

## Planning time: issue + Work Order + qualified PR
1. Read CHECKPOINT, Decisions/ADRs, Scope, DoD, Architecture, Requirements and actual Git. Reconcile descriptive state with normative requirements.
2. Finalize the module boundary and approved NECESSARY increments, stable IDs, dependencies and objective gates. Future/important items go into backlog, not execution.
3. **Immediately after that module's plan is approved**, create issue(s) and a versioned Work Order for each approved increment. Build its precise File Intent/Brownfield Patch Intent Capsules, API/symbol contract, test matrix, proof obligations, risk, preflight and legal STOP condition.
4. When an isolated planning-file change exists, open a planning-only draft PR per independent module or coherent, approved dependent batch. Include issue/WO links and mark NOT_ADMITTED. GitHub requires a real diff; do not simulate an implementation PR or create empty placeholder commits solely to obtain a PR number.
5. After each required prior gate and exact-base admission, prepare the Codex execution PR/branch from that legal base. Only that admitted increment may enter implementation. Existing projects keep their current source-authority/process until separately adopted.
6. Update module planning files and issue/PR metadata as the plan is refined; when a critical source/base fingerprint changes, mark dependent packs STALE, recompile and do not silently rebase approved work.

## Work Order content: mandatory, stored in GitHub
- OBJECTIVE; CONTEXT; SCOPE; OUT OF SCOPE; FILES/SOURCES TO READ; REQUIREMENTS; ARCHITECTURE RULES; CONSTRAINTS; ACCEPTANCE CRITERIA; TESTS; DELIVERABLES; REVIEW FORMAT; STOP CONDITION.
- ID and risk class, exact current base SHA and applicable canonical source fingerprints/IDs; named issue, planning PR and authorized implementation PR/branch (when they exist).
- Files/symbols: MUST_READ, READ_IF_TRIGGERED, WRITE_ALLOWED, WRITE_FORBIDDEN; NEW_FILE_SEED, EXISTING_FILE_PATCH_INTENT or STRUCTURE_ONLY; integration graph and relevant tests.
- Approved interfaces, algorithms/control flow and error, security, persistence/recovery behavior. Known resolved decisions are closed; uncertainties have explicit escalation triggers.
- Required evidence: base/head SHA, actual changed paths, test commands/results, lint/typecheck/build, platform/regression/security/migration/performance checks as applicable, defects fixed, risks, proof receipts and proposed Checkpoint Delta. Attach outputs by stable GitHub link, not pasted large logs.

## Copyable Codex launch
The user-facing default is **one short plain-text code block** and no PDF:

    Repositório: owner/repo. Execute somente a Work Order ID do GitHub issue #N, na PR #M e no branch indicado pela própria Work Order. Valide Context Lock e base SHA antes de alterar código. Inspecione arquivos previstos, implemente, teste, corrija, commit/push e atualize a PR com Evidence Bundle. Pare na STOP CONDITION e não faça merge nem promova o checkpoint.

When the work has not yet been admitted, replace the command with a planning/review action; never tell Codex to implement a speculative PR.

## Review to next increment
- ChatGPT reviews exact PR head/diff, source-bound acceptance, code/security/error integrity, tests/CI and regressions through connected apps. Explicitly label owner audit NOT_INDEPENDENT when applicable.
- APPROVED only with satisfied evidence; CORRECTION REQUIRED returns only scoped delta in the **same** Work Order/PR where safe; BLOCKED stops dependent work.
- A merged implementation PR alone is not DONE. Propose and audit Checkpoint Delta, then promote canonical state through a governed, source-consistent change. No next dependent implementation while current is unresolved.
- Maintain no-force-push/no-destructive-change boundaries and no paid/trial-only external review requirement.

## Every ChatGPT construction response: evidence-based status panel
Use a short, stable view with:
1. project/version + observed branch and SHA, inspection time and evidence refs;
2. release progress using only a frozen canonical denominator, with done/total and remaining; mark NOT_BASELINED when absent;
3. module and approved Work Order count: planned / admitted / in implementation / reviewed / merged / promoted; distinguish module completion from PR counts;
4. issues/PRs: relevant open/merged/draft, current active ID and legal order, avoid counting old unrelated tickets as project scope;
5. tests and assurance: required checks passed/total at **exact head**, CI pending/failed, platform, coverage if valid, CRITICAL/HIGH blockers known; unknown means NOT_VERIFIED, not zero;
6. what was actually done in this response, what's left, next **legal** step and block conditions. ETA or token/time efficiency only from comparable recorded evidence, with confidence/limitations.
For a V1.0-accepted product under V1.1 development, display historical V1.0 100% separately from V1.1 increment/quality/release gates. Do not present WO count as quality-adjusted release completion.

## Branch/release separation
Current GEF main V1.0 acceptance remains 1088/1088. Current V1.1 uses release/1.1; WO-009 remains accepted and WO-010 remains NOT_ADMITTED. PR #278 is closed without merge; its checks are historical and do not transfer to a later cumulative integration. This companion's release adoption is effective only at its governed promotion merge; it does not by itself authorize product release.

STOP CONDITION: GITHUB_FIRST_CODEX_WORKFLOW_DOCUMENTED_RELEASE_EFFECT_AT_GOVERNED_PROMOTION_MERGE
