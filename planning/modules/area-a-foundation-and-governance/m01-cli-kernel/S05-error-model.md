# GBS-M01-S05 — Error Model

Status: `FROZEN`

## Objective
Freeze the shared typed error/result model for the Deterministic Work Plane Kernel so routing, lifecycle, CLI, evidence, recovery, CI and future modules can exchange compact machine-readable failures without prose guessing, while preserving cause, remediation and safety truth.

## Binding decisions
- M01-S01 runtime contract is FROZEN.
- M01-S02 command router contract is FROZEN.
- M01-S03 lifecycle contract is FROZEN.
- M01-S04 exit-code contract is FROZEN.
- Exit integers are coarse compatibility signals; typed results/errors are authoritative.
- Security requires redaction and fail-closed handling of sensitive diagnostics.

## Frozen typed envelope
Every non-success result is representable by a stable versioned machine envelope containing, where applicable:
- schema version;
- error/result ID;
- category;
- globally namespaced stable reason code;
- mandatory runtime severity;
- human-safe summary;
- lifecycle phase and terminal classification;
- retryability classification;
- recoverability classification;
- mutation/effect status;
- command/run/target references;
- bounded sanitized cause references;
- evidence/receipt references;
- stable remediation action IDs with structured parameters;
- sanitized diagnostic metadata.

## Frozen top-level categories
The shared model keeps the following 13 categories separate:
```text
INPUT
PRECONDITION
POLICY
AUTHORIZATION
CAPABILITY
DEPENDENCY
EXECUTION
VERIFICATION
INTEGRITY
RECOVERY
CANCELLED
TIMEOUT
INTERNAL
```

POLICY and AUTHORIZATION remain distinct because policy denial and missing/required authorization have different ownership and remediation semantics. CAPABILITY and DEPENDENCY remain distinct because an unavailable external dependency is not equivalent to a missing runtime capability. S04 may coarsen these categories into shared process exit-code families, but the typed model preserves the distinction.

## Reason-code registry
Public machine reason codes use a global semantic namespace:
```text
gef.<category>.<reason>
```

Examples:
```text
gef.input.invalid_request
gef.precondition.stale_target
gef.policy.blocked
gef.authorization.required
gef.capability.missing
gef.dependency.provider_unavailable
gef.execution.handler_failed
gef.verification.post_state_failed
gef.integrity.fingerprint_mismatch
gef.recovery.required
gef.cancelled.operator
gef.timeout.operation
gef.internal.unexpected
```

Reason-code meaning is stable within a compatible contract line. Ownership metadata identifies the responsible domain/module without putting module IDs into normal public semantic identity unless a future compatibility requirement proves that necessary.

## Expected and unexpected failure
Expected operational failures return typed results and never depend on uncaught exceptions crossing application boundaries.

Unexpected programming/runtime faults may originate internally as exceptions, but application/operator boundaries catch and convert them to `INTERNAL` typed results while preserving a sanitized diagnostic causal reference. Conversion never erases the original causal relationship.

## Cause chain contract
Cause chains are bounded, acyclic, deduplicated and redacted before normal persistence/output. Low-level provider/process failures may remain attached as causes while the governed top-level category stays semantically useful.

Raw stack traces and platform-specific exception strings are **not part of normal machine output** and are never contract identity. Where policy permits, they may be stored only in a separately governed diagnostic/evidence channel and referenced by ID.

## Retryability
Retryability is mandatory machine metadata for non-success results where retry semantics are applicable and uses the governed classes:
```text
NEVER
SAFE_IMMEDIATE
SAFE_WITH_BACKOFF
REQUIRES_EFFECT_CHECK
REQUIRES_NEW_AUTHORIZATION
MANUAL_ONLY
```

Retryability never grants permission to retry. Mutation retries still require M01-S03 idempotency/effect-detection rules and policy authorization.

## Recoverability
Recoverability is independent from retryability and uses:
```text
NONE_REQUIRED
AUTO_COMPENSATION_AVAILABLE
RECOVERY_REQUIRED
MANUAL_REPAIR_REQUIRED
IRREVERSIBLE_EFFECT_RECORDED
```

This keeps transient failure, restored state and irreversible effect truth separate.

## Severity
Every non-success result carries one runtime/operator severity:
```text
INFO
WARNING
ERROR
CRITICAL
```

Severity represents operational attention only. It is not interchangeable with Security HIGH/CRITICAL findings, release-blocking status, assurance class or product-completion truth. Those remain governed by their owning systems.

## Structured remediation
Deterministic remediation is represented by stable **action IDs plus structured parameters**, for example a refresh/preflight action, authorization request, capability enablement, governed retry, recovery invocation, evidence inspection or semantic-review escalation.

The error envelope does not embed authoritative shell commands by default. Operator-facing command text may be rendered later by a trusted presentation layer from action metadata. Remediation never self-authorizes, broadens scope or bypasses policy.

## Aggregation
Orchestrators may aggregate child failures but must preserve the governing top-level category/reason, child run/result references, recovery/partial-effect truth, cancellation/budget propagation and deterministic stable ordering. Aggregation cannot hide a child recovery-required or integrity-critical state.

## Serialization
Errors/results serialize through versioned machine contracts. Semantic identity includes category, stable reason code, lifecycle/effect/recovery metadata and references. Stack traces, host exception wording and platform-specific text remain diagnostics only.

## Exit-code projection
M01-S04 remains the sole process projection. Typed categories/reasons map deterministically to the frozen process families, while the reverse mapping is intentionally lossy. Consumers needing precise semantics must read the typed result/receipt rather than infer meaning from an integer.

## Token/time economy
The model is designed to eliminate repeated diagnosis:
- stable reason codes replace prose classification;
- mandatory severity/retry/recovery metadata removes follow-up inference;
- bounded cause chains prevent context explosions;
- remediation action IDs compile narrow correction paths;
- evidence references avoid rereading full logs;
- deterministic serialization lets scripts/CI react without an LLM.

## Frozen decisions
1. Typed machine results/errors are authoritative over prose and process exit codes.
2. The 13 top-level categories remain separate.
3. Detailed reasons use globally namespaced `gef.<category>.<reason>` codes with ownership metadata.
4. Every non-success result carries the four-level runtime severity field; runtime severity never substitutes for governance/security risk.
5. Expected failures are typed results; unexpected exceptions are converted to `INTERNAL` at application/operator boundaries.
6. Cause chains are bounded, acyclic, deduplicated and redacted.
7. Raw stack traces are excluded from normal machine/operator output and are referenced only through governed diagnostic channels when allowed.
8. Retryability is explicit metadata and never self-authorizes retry.
9. Recoverability is separate from retryability and preserves partial/irreversible-effect truth.
10. Remediation uses stable action IDs + structured parameters; authoritative shell snippets are not embedded in the error contract.
11. Orchestrator aggregation preserves child recovery/integrity truth and deterministic ordering.
12. Serialization preserves semantic identity while host/platform diagnostic text remains non-authoritative.
13. Exit-code mapping is deterministic but intentionally lossy.
14. Error contracts remain compact enough for token-efficient evidence and correction workflows.

## Resolved freeze questions
1. Keep all 13 top-level categories separate: **RESOLVED YES**.
2. Runtime severity mandatory for every non-success result: **RESOLVED YES**.
3. Stack traces excluded from normal machine output: **RESOLVED YES**.
4. Public reason codes globally registered as `gef.<category>.<reason>` with ownership metadata: **RESOLVED YES**.
5. Remediation uses structured action IDs/parameters, not self-authorizing executable command strings: **RESOLVED YES**.

## Module handoff
S01-S05 are frozen. M01 has complete planning contracts for runtime, command routing, lifecycle, exit-code projection and shared error semantics. This does **not** satisfy `GBS-M01 MODULE_DONE`; implementation, tests, evidence and the module DoD are still required.

## Freeze record
Final exact-head review passed on PR `#45`, reviewed head `8ac761cc0a98f7aacee711feaea1db97cd9dd1e5`, then merged to main at `02b8ffe98dc7e5fafa2a7b0e30dd5e0a6fae21ee` before the module-level implementation gate.

STOP CONDITION: `M01_S05_FROZEN`.
