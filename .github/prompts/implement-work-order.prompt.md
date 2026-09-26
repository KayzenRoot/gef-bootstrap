# Implement admitted GEF Work Order

Execute the current admitted Work Order as a high-throughput governed run.

1. Reconstruct current state from the promoted checkpoint and Source Hierarchy.
2. Bind repository/project, exact legal base, Work Order, profile/policy and required upstream contracts.
3. Compile minimum sufficient context. Do not reread unrelated canonical sources after their exact identities are captured.
4. Convert the Work Order into a dependency-ordered work DAG with a semantic critical path, safe parallel groups, atomic mutation boundaries, validation closure and rollback obligations.
5. Implement as many admitted nodes as can be completed safely in this run. Do not artificially split work into tiny prompts.
6. Preserve successful nodes, artifacts and proof receipts. When a node fails, diagnose and repair that node plus proven dependents rather than restarting the entire run.
7. Validation ladder: syntax/config/lock integrity -> type/static checks -> focused changed-surface tests -> integration tests required by the Work Order -> full governed regression/security evidence at the acceptance boundary.
8. Maintain a negative-search ledger and read-once index. Do not repeat searches or large reads unless an input changed or a proof requires revalidation.
9. Never weaken governance, tests or safety to increase throughput.
10. Stop only at the Work Order STOP CONDITION, a genuine authority/policy blocker, or an unrecoverable resource/tool boundary.

Final report must identify exact head, completed DAG nodes, reused evidence, newly executed evidence, failed/blocking nodes, remaining admitted work and next legal action. Do not claim MODULE_DONE before governed promotion.