# GEF GitHub Acceleration Profile

Status: `CANDIDATE_FOR_ADOPTION`
Scope: cross-cutting development acceleration with no production credit.

## Objective
Use repository-hosted development automation as an optional construction and assurance layer. Applications produced with GEF must remain operationally independent from GitHub unless GitHub is explicitly part of their admitted runtime scope.

## Throughput objective
Optimize safe admitted work completed per executor-hour, not prompt brevity. Long executor runs are encouraged when they complete large dependency-ordered slices and preserve successful intermediate results.

## Progressive Proof Ladder
`P0 bindings -> P1 config/lock -> P2 type/static -> P3 focused changed-surface -> P4 integration -> P5 governed regression -> P6 semantic/security review -> P7 promotion evidence`

A failed proof invalidates that proof and proven dependents. Independent proofs remain reusable while their exact inputs and dependency fingerprints are unchanged. Acceptance still executes every proof level required by the Work Order and Definition of Done.

## Causal retry rule
Do not repeat the same failing command without a changed causal hypothesis or input. Diagnose first, repair the smallest causal surface, then rerun the narrowest affected proof. Expand validation only through real dependency edges until the required acceptance boundary is reached.

## Context and token efficiency
Execution packs should include the decisions, file targets, dependency order, acceptance checks and stop conditions needed for execution. Use read-once indexes, minimum sufficient context, negative-search ledgers and validity-bound receipts so executors spend tokens implementing rather than rediscovering settled intent.

## GitHub accelerators
- `AGENTS.md` and scoped `.github/instructions` provide executor-local guidance.
- `.github/prompts` provides reusable implementation, repair and review recipes.
- CodeQL provides public-repository static analysis.
- Dependency Review checks dependency-changing pull requests.
- Dependabot groups routine npm and GitHub Actions maintenance.
- Existing Actions remain evidence providers rather than application runtime dependencies.

## M14-M18 integration
M14 supplies validity-bound minimum sufficient context. M15 compiles work DAG, critical path, cognition budget, read-once index, negative-search ledger, progressive proof plan and reusable proof bindings. M16 governs automation and reuse. M17 checkpoints successful atomic increments. M18 resumes from minimum valid state without restarting accepted work.

## Portability invariant
Turning off GitHub automation or making the finished repository private must not disable the produced application's core runtime. GitHub-specific accelerators are development and evidence adapters unless product scope explicitly says otherwise.

STOP CONDITION: `GITHUB_ACCELERATION_PROFILE_READY_FOR_EXACT_HEAD_REVIEW`.
