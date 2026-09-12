# GBS-M01-S04 — Exit Codes

Status: `FROZEN_CANDIDATE`

## Objective
Freeze the process-level exit-code contract for the Deterministic Work Plane Kernel so CLI/automation callers receive a compact, stable and script-safe summary while rich error/lifecycle detail remains in typed machine results and receipts.

## Binding decisions
- M01-S01 runtime contract is FROZEN.
- M01-S02 command router contract is FROZEN.
- M01-S03 lifecycle contract is FROZEN.
- Library API is primary; CLI/process exit codes are a thin operator/automation projection.
- Lifecycle terminal state and shared error taxonomy carry more information than a process integer.

## Core principle
Exit codes are coarse compatibility signals, not the canonical error model. A process exit code never attempts to encode every reason, module, policy or recovery detail. Rich typed results/receipts remain authoritative for precise diagnosis and automation.

## Frozen code families
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

These decade families are the public process-contract baseline. Additional precision belongs in typed reason codes, not additional exit integers unless a governed contract revision proves a need.

## Mapping rules
- `SUCCEEDED` -> `0` only.
- malformed request, invalid CLI syntax or malformed version syntax -> `10`.
- stale target, incompatible state, unsupported runtime/profile or semantically incompatible command contract version -> `20`.
- policy denial, authorization required/denied or S4 block -> `30`.
- missing capability, unavailable provider, required tool/dependency unavailable -> `40`.
- handler/use-case execution failure after valid preflight -> `50`, unless a more specific verification/integrity or recovery state applies.
- failed verification, evidence mismatch or integrity failure -> `60`.
- partial external effect or any state requiring recovery/repair -> `70`.
- operator cancellation or timeout -> `80`, differentiated by typed reason code.
- uncaught/unexpected kernel/operator-boundary fault -> `90`.

## Precedence rule
When multiple coarse conditions are present, the outermost process code reflects the condition that most directly determines safe operator response. In particular, `RECOVERY_REQUIRED_OR_PARTIAL_EFFECT` outranks generic execution failure because it signals that prior effects may exist and follow-up action is required. The detailed typed result preserves every contributing cause.

This precedence is not a generic severity-ranking engine. S05 owns error taxonomy and orchestrators own aggregate semantics.

## Stability contract
Published numeric meanings remain backward compatible within a compatible major CLI/process-contract line. A code never silently changes semantic family. Contract-breaking numeric changes require governed major compatibility treatment.

## Library/API behavior
Library callers consume typed result/error structures directly and never need to infer semantics from process exit integers. The thin CLI performs the projection at the outermost operator boundary.

## Machine output behavior
When structured output is requested, process exit code and typed machine result must agree. The integer is the coarse summary; structured output supplies exact category, reason code, lifecycle terminal state, run ID, evidence references and recovery references.

Contradiction between structured result and emitted process exit code is an integrity defect, not an acceptable presentation difference.

## Portability
All product-defined codes are non-negative and portable across supported Windows/Linux/macOS Node.js execution. Platform signal/host termination is observed separately and never fabricated into an application-produced GEF classification when no application terminal result was emitted.

## Orchestrator rule
For a multi-step command, the top-level orchestrator owns the final process exit code. Child results remain available through linked receipts and aggregate typed output. Partial child success cannot downgrade a top-level block, failure, verification problem or recovery-required outcome.

## Frozen decisions
1. Exit codes are coarse process compatibility signals, not the canonical error taxonomy.
2. Library callers consume typed results and do not parse exit codes for detailed semantics.
3. CLI maps one top-level typed terminal result to one process exit family.
4. `0` is reserved exclusively for successful deterministic completion.
5. Stable decade families `10..90` are adopted for readability and reserved expansion while remaining portable.
6. Timeout and operator cancellation share process family `80`; typed reasons distinguish them.
7. Policy block and authorization-required/denied share process family `30`; typed reasons distinguish them.
8. `RECOVERY_REQUIRED_OR_PARTIAL_EFFECT` (`70`) outranks generic execution failure when recovery/partial-effect truth exists.
9. Incompatible command contract versions map to `20 PRECONDITION_OR_STATE_BLOCK`; malformed version syntax maps to `10 USAGE_OR_INPUT_ERROR`.
10. Detailed reason expansion occurs in typed result/error schemas rather than proliferating process integers.
11. Published meanings are stable within a compatible major process-contract line.
12. Structured output and process exit code cannot contradict each other.
13. Top-level orchestrator owns final process exit code; child detail remains in linked receipts.
14. Host/signal termination is not falsified into an application-generated GEF code.

## Token/time economy
A small stable family lets CI, scripts and wrappers branch immediately without parsing prose or invoking an LLM. Detailed typed reason codes retain enough precision for delta-oriented correction while avoiding a brittle numerical taxonomy.

## Delegated ownership
- M01-S05: canonical shared error categories/reason schema and cause chains
- M02: validation and contract-version representation
- M03/M04: target/runtime/profile preconditions and capability discovery
- M16/M34/M35: policy/security authorization reasons
- M24/M25/M37: evidence and integrity classifications
- M36: recovery semantics
- M47/M48: operator/help presentation
- M50/M51: upgrade and compatibility/version support

## Resolved freeze questions
1. Decade-range numeric families exactly as proposed: **RESOLVED YES**.
2. Timeout and cancellation share one coarse process family with separate typed reasons: **RESOLVED YES**.
3. Policy block and authorization state share one coarse process family with separate typed reasons: **RESOLVED YES**.
4. Recovery-required/partial-effect outranks generic execution failure: **RESOLVED YES**.
5. Incompatible versions map to state/precondition; malformed syntax maps to usage/input: **RESOLVED YES**.

## Session completion gate
Planning content is frozen-candidate. Final `FROZEN` requires exact-head review, merge and checkpoint advancement to `GBS-M01-S05`. No functional implementation is introduced by this planning session.

STOP CONDITION: `M01_S04_EXACT_HEAD_REVIEW_REQUIRED`.
