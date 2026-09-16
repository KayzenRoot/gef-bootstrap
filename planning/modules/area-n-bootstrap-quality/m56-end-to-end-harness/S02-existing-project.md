# M56 S02 — Existing Project

Status: `FROZEN`
Mechanism: `BEP56 — Brownfield End-to-End Path`

Validate adoption into an existing repository containing user files, history, configuration, CI and intentional local conventions. The harness snapshots the initial semantic state, executes discovery/plan/preview/bootstrap, and verifies preservation boundaries.

Required fixtures include dirty worktree, pre-existing `.github`, package scripts, nested docs, non-GEF branches and conflicting candidate filenames. GEF must classify collisions before mutation and preserve unrelated bytes/history.

Acceptance: no overwrite without governed policy, deterministic collision report, reversible changes where promised, original user artifacts unchanged outside admitted paths, and second-run idempotency.

STOP CONDITION: `M56_S02_FROZEN`.