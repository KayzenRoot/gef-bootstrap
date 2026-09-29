# GBS-MAINT-HIVE-REMOVAL-001 — Retire Hive from GEF Bootstrap

Status: OWNER-REQUESTED / ADMITTED FOR MAINTENANCE; implementation and promotion require exact-head evidence.

## OBJECTIVE
Remove every active Hive dependency, optional adapter, execution instruction, module advertisement, test, workflow binding and active planning/documentation requirement from GEF Bootstrap. Bootstrap development must be fully independent of any Hive installation, service, MCP, API, context store or runtime. Preserve verified functionality of the core and unrelated adapters.

## CONTEXT
Owner explicitly retired Hive on 2026-09-28. Base: `27aa76f75d6a914aa80bdc2a9c73843084189552` on `main`; historical V1 production acceptance remains immutable. An open Hive-first proposal (#297) conflicts with owner direction and must not be merged.

## SCOPE
- Audit active code, manifests, lockfiles, CI, templates, GitHub instructions, scripts, tests, runtime, setup and canonical Source Pack.
- Delete the Hive-specific M40 integration and its three planning sessions; remove its production exports and two adapter tests; retain generic adapter API and UADS/UGAS.
- Retire M40 from prospective modules, active source hierarchy, requirements, scope, architecture, deployment, backlog, DoD, module index and outward-facing docs. Do not renumber stable historical module IDs.
- Supersede historical decisions prospectively via ADR and Decisions Ledger, retaining audit-grade historical evidence, accepted receipts and release tags.
- Include a regression test that fails if the retired integration is accidentally re-exported or reintroduced in active runtime packages.
- Review open PRs for Hive reintroduction; close or mark conflicting Hive-first work without rewriting approved history.

## OUT OF SCOPE
Deleting Git history, past releases, immutable accepted evidence/gates, changing unrelated adapters/core semantics, uninstalling software on the owner's machine or broad unrelated refactors.

## FILES/SOURCES TO READ
Priority: `.engineering/CHECKPOINT.{md,json}`, `.engineering/DECISIONS-LEDGER.md`, `.engineering/SCOPE.md`, `.engineering/DEFINITION-OF-DONE.md`, `.engineering/ARCHITECTURE.md`, `.engineering/REQUIREMENTS.md`; then code, tests, workflows, manifests, planning and pending PRs.

## REQUIREMENTS
R1 No first-party Hive code or Hive dependency in main's active build/runtime/config/CI or operator instructions.
R2 No Hive module advertised or required by prospective architecture, Scope, Requirements, DoD, Backlog, Deployment or current user documentation.
R3 Generic adapter API, UADS/UGAS and deterministic local context continue to work without external service.
R4 No active Hive-first PR can be merged unwittingly.
R5 Historical accepted evidence, decisions, receipts and release lineage remain traceable, with supersession indicated.

## ARCHITECTURE RULES
Maintain deterministic core, injected observations and no ambient service probing; no opportunistic substitute dependency; original production acceptance history is not rewritten.

## CONSTRAINTS
Stable ID throughout branch/PR/evidence/correction/checkpoint. No force-push; base/head and critical-source digests in Context Lock. Stop on HIGH/CRITICAL. Do not promote proposed checkpoint before exact-head CI and independent audit.

## ACCEPTANCE CRITERIA
A1 `rg -ni '(\\bhive\\b|hiveadapter)' packages tests .github README.md docs package.json package-lock.json` finds no active references except an intentionally escaped self-contained negative regression/audit fixture.
A2 No Hive-specific production export, package, import, path, CI command, environment variable, MCP dependency, startup service or operational instruction.
A3 Full `npm ci --ignore-scripts`, `npm run validate`, focused three-platform CI, repository validation and dependency audit PASS at exact PR head (or explicit factual blocker).
A4 Non-Hive generic adapter and security/reliability tests pass.
A5 Pending #297 is closed/superseded; other active PRs reviewed for reintroduction.
A6 New decision/ADR is added, historical authority preserved, and checkpoint promoted only after acceptance.

## TESTS
Static no-Hive scan of active surfaces, new anti-regression contract, focused integration suite (Linux/Windows/macOS in GitHub CI), all tests/build/typecheck, npm audit, PR review and exact-head workflow/status audit.

## DELIVERABLES
Removal diff, superseding ADR, adjusted canonical docs, Work Order, Context Lock, Evidence Bundle with base/head SHAs and test evidence, PR and approved checkpoint delta.

## REVIEW FORMAT
PT-BR; describe SHA/changed files/validation outcomes, security/regression findings and APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
`GBS-MAINT-HIVE-REMOVAL-001_APPROVED_AND_MERGED` only when owner-directed removal is audited, exact-head checks pass, source pack/checkpoint are correctly promoted and merge completes.
