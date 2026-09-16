# M54 S04 — Bootstrap Cycle
Status: FROZEN

**BCH54 Bootstrap Cycle Harness** runs isolated preflight → plan → install/bootstrap → validate → doctor → upgrade-preview/recovery cycles against temporary projects. It asserts idempotency on a second run and preserves evidence for every phase. External GitHub/network actions are simulated or explicitly gated.

Acceptance: clean/brownfield cycles, second-run no-op equivalence, failure recovery, evidence correlation, cross-platform execution.