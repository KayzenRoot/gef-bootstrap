# GBS-M15-S02 — Work Graph & Critical Path Compilation
Status: `FROZEN_CANDIDATE`

## Objective
Turn approved work into an explicit dependency-aware execution graph.

## Technologies
- **Executable Work DAG (EWD)**: NECESSARY nodes carry preconditions, mutations, validations, rollback hooks and evidence outputs.
- **Semantic Critical Path (SCP)**: new NECESSARY technology identifies serial semantic dependencies, not merely file order.
- **Safe Parallelism Matrix (SPM)**: new NECESSARY technology allows concurrency only when mutation/evidence domains do not conflict.
- **Reasoning Branch Suppressor (RBS)**: new NECESSARY technology pre-resolves alternatives already decided canonically, reducing executor branching.
- **Atomic Increment Boundary (AIB)**: new NECESSARY technology partitions graph into independently verifiable/rollback-capable increments.

Cycles, unknown dependencies or overlapping exclusive mutation domains block compilation. Quantitative speed thresholds remain M63-owned.

STOP CONDITION: `M15_S02_FROZEN_CANDIDATE`.