# GEF Executor Contract

This repository is governed by GEF Bootstrap. This file is an executor-facing acceleration layer, not a replacement for canonical project authority.

## Authority
1. Resolve facts through `.engineering/SOURCE-HIERARCHY.md`.
2. Read `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json` for current promoted state.
3. For implementation, obey the admitted Work Order and its exact execution-base/head bindings.
4. Frozen Scope, Requirements, Architecture, Security, Test Plan and DoD outrank convenience, model confidence and this file.
5. If authority is missing, stale or conflicted, fail closed. Never invent a requirement to keep moving.

## Productive long-run execution
Optimize for useful project advancement, not short responses or tiny increments.
- Compile the minimum sufficient authoritative context before coding.
- Build a dependency-ordered work DAG and identify the semantic critical path.
- Batch independent reads and safe non-overlapping work.
- Reuse passing evidence when its exact dependencies remain valid. Do not rerun unrelated validated work merely because another node failed.
- Validate progressively: cheap/static checks first, focused tests for changed surfaces second, broader regression at governed integration boundaries.
- On failure, repair the smallest invalidated node and its dependents. Do not restart the whole plan unless dependency invalidation proves that necessary.
- Keep a negative-search ledger so failed searches are not repeated without a changed reason/input.
- Prefer read-once indexes, receipts, fingerprints and exact references over repeatedly rereading large documents.
- Long execution is acceptable when it advances many admitted nodes safely. Runtime length is not a reason to shrink scope artificially.

## Executor cognition budget
The executor should execute, not rediscover product intent.
- Treat the Work Order/Execution Pack as the task contract.
- Do not redesign architecture or broaden scope unless the contract explicitly delegates that decision.
- Escalate genuine ambiguity instead of spending large token budgets exploring speculative alternatives.
- Preserve successful intermediate outputs and evidence.
- Never loop blindly on the same failing command. Diagnose first, change the causal input, then rerun the narrowest proof.

## Mutation and safety
- No force push, history rewrite or destructive cleanup without the specific governed S4 authorization path.
- Do not expose secrets in code, logs, fixtures, prompts or receipts.
- Keep GitHub/provider automation as an acceleration and evidence layer. Runtime product correctness must not depend on GitHub unless the product scope explicitly requires it.
- The completed product must remain operable when the repository is private and GitHub automation is disabled, except for repository hosting/version-control functions explicitly chosen by the operator.

## Completion
A green test is evidence, not completion. A merged PR is not MODULE_DONE by itself. Follow the project DoD, exact-head semantic audit, evidence bundle and checkpoint promotion rules.

## HIVE v1.0.3 context-first work and prompt contract

The current HIVE executor-context baseline is the published **v1.0.3** read-only MCP surface. This is a context and prompt-preparation baseline; it does **not** change this repository's product dependency, runtime, compatibility pin, or HIVE V1/V2 integration contract. Keep those project-specific pins unchanged unless their own authorized Work Order validates and admits an upgrade. This repository's Git state, approved checkpoint, source hierarchy, decisions, scope, and active Work Order remain authoritative over HIVE-derived memory/context.

### Preflight

1. Confirm the exact repository, branch, HEAD/base SHA, and active Work Order or issue before building context. Read this repository's checkpoint/source hierarchy and the Work Order's scope, allowed files, acceptance criteria, and stop condition.
2. When HIVE MCP is available in this execution surface, verify the handshake and the reported v1.0.3 context baseline. Resolve this repository by its actual registered identity; use only an existing, canonical task ID. Never guess a project or task ID.
3. Use only read-only tools actually exposed by the handshake. The v1.0.3 reference surface includes `project.list`, `project.status`, `context.build`, `context.search`, `memory.search`, `memory.get`, and `checkpoint.read`. Build task context only for a valid task ID. Retrieve the minimum context needed for this Work Order; do not load unrelated history or the whole corpus.
4. Record the exact Git basis and only HIVE version, project/task identity, source references, or context fingerprint actually returned. A HIVE summary is derived context, not canonical approval or evidence that an unobserved check passed.
5. If HIVE is absent, stale, mismatched, or not exposed here, label it accurately and continue from canonical repository sources whenever the Work Order permits. Finish independent authorized work and do not stop for routine confirmation. Mark BLOCKED only when an explicit gate requires unavailable HIVE evidence. Never claim local HIVE access from a hosted execution surface, or vice versa.
6. Do not synchronize/reindex a corpus, create tasks, write a database, call a provider, or mutate remote/runtime state unless the active Work Order explicitly authorizes that operation.

### Compact HIVE-grounded executor prompt

When preparing a Codex/Cursor or other executor prompt, include only the task-relevant context and these fields:

- **Identity:** repository/path, Work Order/issue, branch, exact base and current HEAD.
- **Authority:** canonical checkpoint and source paths; the active Work Order and Context Lock, if present.
- **HIVE context:** v1.0.3 handshake status, verified project/task IDs, and returned source references/fingerprint — or the truthful status `UNAVAILABLE`, `STALE`, or `NOT_REQUIRED`.
- **Work:** objective, exact allowed change surface, acceptance criteria, required focused checks, evidence to return, exclusions, and stop condition.
- **Execution direction:** complete every authorized step, fix review findings within scope, perform the required review, and report which checks actually ran. Do not ask for routine confirmation; do not widen scope or claim unperformed work.

Prefer canonical file paths and short HIVE context references over copying full documents or chat history. Keep stable policy, Work Order-specific requirements, and volatile runtime evidence in separate, compact sections.

GEF Bootstrap must remain independently installable and usable without HIVE. HIVE is optional for executor context and must not become a bootstrap, runtime, validation, or release dependency.
