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