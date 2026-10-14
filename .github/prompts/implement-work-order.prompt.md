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

## Immediate one-pass delivery profile (Issue #437; operational guidance only)

Applies **only to Work Orders already admitted with a current effective Context Lock, authorized executor and permitted paths**. This profile does not admit a new WO, change source hierarchy or approvals, or override any required CI/security/review/DoD gate.

- **Maximize completion per handoff:** implement the entire coherent, already-admitted vertical slice (schema, API, UI, tests and integration when they are actually inside the same WO). Execute dependent internal tasks sequentially and safely independent internal tasks in isolation where the authorized environment supports it. Do not invent successor WOs or expand `WRITE_ALLOWED`.
- **Validate during development, assure at acceptance:** after each internal wave run cheap syntax/static/targeted tests to catch defects close to their cause. Run the complete integration/regression/security/platform checks **whenever** the WO, risk policy or current gate requires them, including the final exact-head acceptance boundary. "Final-only full suite" never means "no tests until the end".
- **Avoid CI churn:** prefer local/test-runner feedback for intermediate edits; batch local fixes and commits, and avoid intermediate remote pushes whose only purpose is to replay the same broad CI. A hosted-only required proof, branch policy, collaboration dependency or stale binding may require an earlier push. Never disable, hide or skip a required check merely to save time.
- **Repair in the same run:** diagnose failures, fix introduced defects within the allowed files and criteria, rerun only invalidated focused proofs, and then satisfy all final required proofs. If a correction needs a new architecture decision, new paths, policy amendment or unrelated scope, stop the affected work and request a governed Correction Delta.
- **Deliver once per coherent WO boundary:** produce or update the authorized implementation PR after completing the admitted scope; identify exact base/HEAD, changed paths, final required checks, focused tests, known risks, remaining blockers and a **proposed-only** Checkpoint Delta. The executor does not review/approve its own PR, merge, release or promote canonical state.
- **Do not create administrative loops:** avoid stop-and-ask cycles for routine local bugs, repeated repository-wide reads, or redundant manual review requests. Preserve the actual STOP CONDITION and report `BLOCKED` immediately for missing authority, stale locks, elevated/security gaps or unresolvable checks.

This is an executor-efficiency convention, **not** a relaxed proof profile and **not** an authorization to edit GitHub Actions, rulesets or frozen sources.

Final report must identify exact head, completed DAG nodes, reused evidence, newly executed evidence, failed/blocking nodes, remaining admitted work and next legal action. Do not claim MODULE_DONE before governed promotion.