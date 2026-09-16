# M60 S02 — Internals

Status: `FROZEN`
Mechanism: `IRM60 — Internals Responsibility Map`

Document internal packages/engines by responsibility, inputs/outputs, invariants, side effects, cancellation/idempotency behavior, error taxonomy and owning module. Explain canonical digest rules, state transitions, evidence boundaries and recovery semantics.

Internals docs are for maintainers, not an excuse to expose secrets or unstable implementation trivia as public API. Private implementation details are clearly non-contractual.

Acceptance: exported surfaces map to owners/tests, critical invariants link to executable tests, no undocumented cross-authority mutation path, and source links are machine-checkable.

STOP CONDITION: `M60_S02_FROZEN`.