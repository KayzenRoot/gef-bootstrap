# M56 S01 — Clean Project

Status: `FROZEN`
Mechanism: `CEP56 — Clean End-to-End Path`

Exercise the complete supported lifecycle on an isolated empty repository: detect capabilities → preflight → plan → bootstrap → validate → checkpoint → doctor → second-run idempotency. Every phase emits a receipt linked by scenario ID and candidate digest.

The harness uses real local filesystem/Git behavior and simulated external GitHub unless an explicitly gated live test is selected. No production credentials are required.

Acceptance requires deterministic resulting tree, zero unexpected writes outside sandbox, second run with no semantic drift, evidence lineage across phases, clean teardown and equivalent semantic result on Ubuntu/Windows/macOS.

STOP CONDITION: `M56_S01_FROZEN`.