# GBS-M01-S04 — Exit Codes

Status: `IN_DISCUSSION`

## Objective
Freeze the process-level exit-code contract for the Deterministic Work Plane Kernel so CLI/automation callers receive a compact, stable and script-safe summary while rich error/lifecycle detail remains in typed machine results and receipts.

## Binding decisions
- M01-S01 runtime contract is FROZEN.
- M01-S02 command router contract is FROZEN.
- M01-S03 lifecycle contract is FROZEN.
- Library API is primary; CLI/process exit codes are a thin operator/automation projection.
- Lifecycle terminal state and shared error taxonomy carry more information than a process integer.

## Core principle
Exit codes are **coarse compatibility signals**, not the canonical error model.

A process exit code MUST NOT attempt to encode every reason, module, policy or recovery detail. Rich typed results/receipts remain authoritative for diagnosis and automation that needs precision.

## Candidate code families
```text
0   SUCCESS
10  USAGE_OR_INPUT_ERROR
20  PRECONDITION_OR_STATE_BLOCK
30  POLICY_OR_AUTHORIZATION_BLOCK
40  DEPENDENCY_OR_CAPABILITY_FAILURE
50  EXECUTION_FAILURE
60  VERIFICATION_OR_INTEGRITY_FAILURE
70  RECOVERY_REQUIRED_OR_PARTIAL_EFFECT
80  CANCELLED_OR_TIMED_OUT
90  INTERNAL_UNEXPECTED_FAILURE
```

Specific numeric assignments are reserved and versioned as part of the public CLI/process contract once frozen.

## Mapping rules
- `SUCCEEDED` -> `0`.
- malformed request / invalid CLI input -> usage/input family.
- stale target, incompatible state, unsupported runtime/profile or failed precondition -> precondition/state family.
- policy denial, explicit authorization required/denied, S4 block -> policy/authorization family.
- missing capability, provider unavailable, required tool/dependency unavailable -> dependency/capability family.
- handler/use-case execution fault after valid preflight -> execution family unless verification/integrity or recovery state is more specific.
- failed verification, evidence/integrity mismatch -> verification/integrity family.
- partial external effect or recovery required -> recovery/partial-effect family.
- operator cancellation or timeout -> cancellation/timeout family.
- uncaught/unexpected kernel/operator boundary fault -> internal unexpected family.

## Stability contract
Published exit-code meanings are backward compatible within a compatible major CLI/process-contract line. A code must not silently change semantic family.

New detailed reason codes should normally be added to typed results rather than consuming new process exit integers.

## Library/API behavior
The library API never requires callers to infer semantics from process exit codes. It returns typed result/error structures directly.

The thin CLI maps typed terminal results into process exit codes at the outermost operator boundary.

## Machine output behavior
When structured output is requested, process exit code and typed result must agree. The exit integer is the coarse summary; machine JSON/receipt supplies the precise classification, reason code, run ID and evidence/recovery references.

## Shell/platform considerations
Use only portable non-negative process exit values suitable for Node.js and common Windows/Linux/macOS automation. Do not rely on platform-specific signal encodings as stable product semantics.

OS/process termination by signal or host/runtime failure may be observed separately and must not be falsely normalized into a GEF success/failure classification when the application did not produce one.

## Composition/orchestrator rule
For multi-step orchestrated commands, the top-level command owns the final process exit code. Child failures remain represented in child receipts and the orchestrator's typed aggregate result.

The CLI must not choose a lower-severity exit merely because some child work succeeded if the top-level terminal contract indicates block/failure/recovery-required.

## Token/time economy
A small stable exit-code family enables fast CI/scripts to branch without parsing prose. Detailed reason codes stay in structured machine results, avoiding an exploding integer taxonomy and reducing repeated diagnosis prompts.

## Candidate frozen decisions
1. Exit codes are coarse process-level compatibility signals, not the canonical error taxonomy.
2. Library callers consume typed results and never depend on exit-code parsing.
3. CLI maps terminal typed results to one stable exit-code family at the outermost boundary.
4. Exit code `0` is reserved for successful deterministic completion only.
5. Non-zero families distinguish input, state/precondition, policy/auth, dependency/capability, execution, verification/integrity, recovery/partial-effect, cancellation/timeout and unexpected-internal failure.
6. Detailed reason expansion happens in typed error/result schemas, not by proliferating exit integers.
7. Published numeric meanings are stable within a compatible major contract line.
8. Structured machine output and process exit code must never contradict each other.
9. Top-level orchestrator owns final process exit code; child details remain in linked receipts.
10. Host/signal termination is not fabricated into an application-produced GEF classification.

## Open questions before freeze
1. Should the numeric families use decade ranges exactly as proposed or a smaller POSIX-style compact set? Current direction: decade ranges for readability/reserved expansion while staying portable.
2. Should timeout and operator cancellation share one process code or be separate? Current direction: shared coarse family, distinct typed reason codes.
3. Should policy block and authorization-required use the same process family? Current direction: yes, distinct typed reasons under one coarse family.
4. Should `RECOVERY_REQUIRED` outrank generic execution failure when both are true? Current direction: yes, because operator response and safety implications are more specific.
5. Should deprecated/unsupported command versions map to usage/input or state/precondition? Current direction: contract incompatibility maps to precondition/state; malformed version syntax maps to usage/input.

## Session completion gate
S04 may become `FROZEN` only when the five open questions are resolved, exact-head review passes, no conflict exists with S01-S03/Security/Architecture, checkpoint advances to `GBS-M01-S05`, and no functional implementation is introduced by this planning session.

STOP CONDITION: `M01_S04_REVIEW_REQUIRED`.
