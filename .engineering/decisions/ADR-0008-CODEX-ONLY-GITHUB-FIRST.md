# ADR-0008 — Codex-Only Implementation and GitHub-First Planning

Status: APPROVED by governance PR #332; effective on main only after the separately reviewed checkpoint-promotion PR merges
Trigger: EXPLICIT_USER_PRODUCT_DECISION, 2026-09-29
Work Order: GBS-GOV-CODEX-ISSUES-001
Tracking issue: #331
Scope: GEF Bootstrap self-construction, future GEF-governed projects, and explicit adoption by ongoing projects.

## Supersession and authority
The owner explicitly reopens the previous self-construction exception under D-0042. **Prospectively upon approval/promotion**, this ADR supersedes only the implementation-actor restriction in Constitution Amendment 0001 (self-construction policy/D-0054 therein), CONSTITUTION-LOCK, historical ADR-0001 consequence, and ADR-0002-D8. It also supersedes any matching construction-only restriction in Project Overview, Requirements, Scope, Architecture and Executor Acceleration. It does not repeal their product, assurance, module, historical-acceptance or safety decisions. ADR-0003's V1.1 external executor allowance is compatible, but its existing branch/admission restrictions still apply until independently amended. Source-state conflict before promotion is a BLOCKED state; a proposed ADR is not operational authority.

## Decisions

### ADR-0008-D1 — Single implementation actor
Codex is the **sole human-directed AI code author/executor** for GEF Bootstrap and new GEF-governed software projects: product code, tests, fixtures, build/CI scripts, migrations and implementation corrections. ChatGPT performs architecture, planning, approved governance-document edits, Work Order/Context Lock compilation, GitHub issue and PR orchestration, read-only code/security/test review, bug triage, objective exact-head audit, truthful progress reporting and checkpoint-delta preparation. GitHub Actions/test runners execute mechanical checks but are not alternative code authors. The project owner retains operational authorization, with no silent exception.

### ADR-0008-D2 — GitHub is the task handoff
At module planning approval, ChatGPT prepares stable, complete GitHub issues and repository-local Work Orders for all **approved** module increments. Each Work Order includes OBJECTIVE; CONTEXT; SCOPE; OUT OF SCOPE; FILES/SOURCES TO READ; REQUIREMENTS; ARCHITECTURE RULES; CONSTRAINTS; ACCEPTANCE CRITERIA; TESTS; DELIVERABLES; REVIEW FORMAT; STOP CONDITION. It also gives a predicted file/symbol map, dependency ordering, exact source refs or fingerprints when available, approved APIs/schemas/algorithms, error/security contracts, test matrix and explicit uncertainty.

Create an isolated planning-only draft PR as early as safely possible **only when it has a meaningful plan/document diff**; mark it NOT_ADMITTED and link its issue/Work Order. A speculative/empty implementation PR is forbidden. Codex creates/updates the actual code PR only after the relevant Work Order admission, Context Lock and legal execution-base binding. Future dependent PRs may be prepared as planning PRs, never approved or merged before their prerequisites. Do not preclaim an executor branch as authorized.

### ADR-0008-D3 — Compact Codex invocation
Default handoff is a short, copyable text pointer naming repository, issue, stable Work Order, applicable PR/branch and gate. No routine PDF generation, download or upload. The substantive contract lives in versioned GitHub materials and is not compressed away for prompt brevity. If sources or base changed, Codex must mark the pack STALE and stop for a refreshed bounded plan.

### ADR-0008-D4 — No rediscovery without evidence
ChatGPT resolves approved architecture/file topology/interfaces/invariants and writes an Executor Navigation Map (MUST_READ, READ_IF_TRIGGERED, WRITE_ALLOWED, WRITE_FORBIDDEN), Decision Closure Capsule, targeted test set and known uncertainties. Codex inspects the actual repository and exact base before mutation, verifies provided bindings, then implements only the admitted delta. Narrow evidence-triggered discovery is allowed for contradictions, missing symbols, stale maps and assurance expansion. Efficiency does not weaken tests or authorize speculative guesses.

### ADR-0008-D5 — Mandatory progress surface in every construction response
Every ChatGPT development response includes an evidence-based compact progress panel: branch/observed SHA/time, release/module/Work Order state, completed vs total approved increments, implementation/approval status, open/merged PRs and issues where known, exact-head CI and tested platforms where known, current blocker severity, next legal action and explicit unknowns. Report a completion percentage only against a frozen, current approved denominator with objective credit. Distinguish historical V1 acceptance from V1.1 release progress; 9/10 Work Orders is a **milestone count**, never an overall production-completion claim. No fabricated ETA, savings or test result.

### ADR-0008-D6 — Reviews, promotion and branch safety
ChatGPT may propose docs, PR metadata, scoped corrective deltas and reviews but does not produce implementation/test/CI patches. Codex implements corrections in the same Work Order/PR where safe. Require exact-head checks, risk-appropriate regression, evidence bundle, reviewer verdict and canonical checkpoint promotion. Never merge a HIGH/CRITICAL blocker, bypass checks, force push or rewrite historical releases without explicit separately governed authorization. Owner audit is NOT_INDEPENDENT; do not call it independent.

### ADR-0008-D7 — Adoption and release compatibility
This is a prospective process change, not a V1.0 product revision or automatic V1.1 promotion. Preserve V1 accepted 1088/1088, all 64 stable IDs and 282 planning sessions, release/1.1's currently admitted maintenance and WO-010 gate. New projects adopt this as default; ongoing projects adopt through their own canonical owner decision without silently reopening unrelated active Work Orders. The release/1.1 source-line forward-port is a separate audited change after main promotion.

## Implementation contract
Companion: `.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md`.
Checkpoint change: proposed in `.engineering/checkpoint-deltas/GBS-GOV-CODEX-ISSUES-001-PROPOSED.md`.
No source-code, test, CI or runtime changes are admitted by this ADR.

## Governance decision evidence
- Approved proposal PR #332, audited head `7ff0118fcbb29dfd42434e18e68eed0b0c27de2e`, tree `5bdbf42dca1ce081453e4e6ae61ba750a8c551ee`, owner audit comment `5894096435` (`NOT_INDEPENDENT`).
- 28/28 exact-head GitHub checks SUCCESS; merged on main as `419b9cd713d4817c05582287ec10793fc7fdc130`.
- Canonical promotion evidence is separately recorded in `.engineering/CHECKPOINT.md`/`.json` and the GBS-GOV-CODEX-ISSUES-001 Evidence Bundle; adoption by release/1.1 requires an independently gated forward-port/reconciliation.

## Acceptance
Governance docs consistent; exact source supersession traceable; all required doc/repository/branch checks successful on reviewed head; objective owner audit without unresolved HIGH/CRITICAL; separately promoted checkpoint. Governance PR #332 has met its gates. Effectiveness is conditional on the separate exact-head checkpoint-promotion merge; other branches require their own adoption.

STOP CONDITION: GBS-GOV-CODEX-ISSUES-001_GOVERNANCE_PR_READY_FOR_EXACT_HEAD_AUDIT
