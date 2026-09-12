# GBS-M01-S05 — Error Model

Status: `IN_DISCUSSION`

## Objective
Freeze the shared typed error/result model for the Deterministic Work Plane Kernel so routing, lifecycle, CLI, evidence, recovery, CI and future modules can exchange compact machine-readable failures without prose guessing, while preserving cause, remediation and safety truth.

## Binding decisions
- M01-S01 runtime contract is FROZEN.
- M01-S02 command router contract is FROZEN.
- M01-S03 lifecycle contract is FROZEN.
- M01-S04 exit-code contract is FROZEN.
- Exit integers are coarse compatibility signals; typed results/errors are authoritative.
- Security requires redaction and fail-closed handling of sensitive diagnostics.

## Candidate typed envelope
Every non-success result should be representable by a stable machine envelope containing, where applicable:
- schema version;
- error/result ID;
- category;
- stable reason code;
- human-safe summary;
- lifecycle phase and terminal classification;
- retryability classification;
- recoverability classification;
- mutation/effect status;
- command/run/target references;
- cause chain references;
- evidence/receipt references;
- remediation/action hints;
- sanitized diagnostic metadata.

## Candidate top-level categories
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

Categories are stable broad semantics. Detailed reason codes are namespaced and extensible without inventing new top-level categories for every module.

## Stable reason-code direction
Reason codes use machine-stable namespaced tokens such as:
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

Messages may improve over time; reason-code semantics cannot silently change within a compatible contract line.

## Expected versus unexpected failure
Expected operational failures are returned as typed results and are not represented as uncaught exceptions across application boundaries.

Unexpected programming/runtime faults may originate as exceptions internally, but the application/operator boundary catches and converts them to an `INTERNAL` typed result while retaining a sanitized diagnostic cause chain for evidence/debugging.

The model must not erase the original causal relationship merely to make output prettier.

## Cause chain
Errors may reference a bounded causal chain. Rules:
- causal order is explicit;
- cycles are prohibited;
- chain depth/output size is bounded;
- secret/sensitive values are redacted before persistence or operator output;
- repeated wrapper errors should not duplicate identical diagnostics;
- low-level provider/process failures can remain attached without becoming the public top-level semantic category when a more useful governed category exists.

## Retryability
Retryability is explicit machine metadata, never inferred from message text.

Candidate classes:
```text
NEVER
SAFE_IMMEDIATE
SAFE_WITH_BACKOFF
REQUIRES_EFFECT_CHECK
REQUIRES_NEW_AUTHORIZATION
MANUAL_ONLY
```

Mutation retries still require the S03 idempotency/effect-detection contract. An error being technically transient does not automatically authorize a retry.

## Recoverability
Recoverability is independent from retryability. Candidate classes:
```text
NONE_REQUIRED
AUTO_COMPENSATION_AVAILABLE
RECOVERY_REQUIRED
MANUAL_REPAIR_REQUIRED
IRREVERSIBLE_EFFECT_RECORDED
```

This prevents "retryable" from being confused with "safe state restored".

## Severity and operator attention
Severity should represent engineering/operator attention, not product-completion truth. Candidate levels:
```text
INFO
WARNING
ERROR
CRITICAL
```

Security/assurance policy may independently classify risk and release-blocking severity. The error model does not downgrade a HIGH/CRITICAL governance finding merely because the runtime error severity is lower.

## Structured remediation
Where deterministic remediation is known, the envelope may include stable action hints such as:
- refresh state/preflight;
- supply authorization;
- install/enable capability;
- retry under allowed policy;
- run recovery command;
- inspect linked receipt/evidence;
- escalate to semantic review.

Hints are advisory machine metadata. They cannot authorize an operation, broaden scope or invent semantic decisions.

## Redaction and diagnostics
Public/operator-safe output and persistent standard telemetry must never include raw secrets. Sensitive diagnostics may be retained only through a separately governed secure debug/evidence channel where policy permits it.

Redaction failure must fail toward less disclosure, not convenience.

## Aggregation
Orchestrators may aggregate multiple child failures but must preserve:
- top-level governing category/reason;
- child run/result references;
- recovery/partial-effect truth;
- cancellation/budget propagation;
- deterministic stable ordering.

Aggregate summaries must not hide a child recovery-required or integrity-critical state.

## Serialization
Typed errors/results must be serializable through versioned machine contracts. Serialization must preserve stable reason code, category, lifecycle/effect/recovery metadata and references. Stack traces and platform-specific exception text are diagnostics, not contract identity.

## Exit-code mapping
S04 remains the sole process projection. Categories/reasons map deterministically to the frozen process families, but the reverse mapping is intentionally lossy. No consumer may reconstruct detailed semantics from the integer alone.

## Token/time economy
This error model is a major efficiency mechanism:
- stable reason codes remove prose classification;
- retry/recovery metadata prevents repeated diagnosis;
- bounded cause chains prevent context explosions;
- remediation hints enable narrow correction prompts;
- linked evidence avoids rereading complete logs;
- deterministic serialization lets CI/scripts react without an LLM.

## Candidate frozen decisions
1. Typed error/result envelopes are authoritative over human prose and process exit integers.
2. Broad stable categories are small and module-neutral; detailed reasons use namespaced stable codes.
3. Expected operational failures are typed results, not uncaught cross-boundary exceptions.
4. Unexpected exceptions are caught at application/operator boundaries and converted to `INTERNAL` while preserving sanitized cause evidence.
5. Cause chains are bounded, acyclic, deduplicated and redacted.
6. Retryability is explicit metadata and does not itself authorize retry.
7. Recoverability is separate from retryability and explicitly records recovery/irreversible-effect truth.
8. Runtime severity is separate from governance/security/release risk classification.
9. Remediation hints are advisory and cannot grant authority or broaden scope.
10. Orchestrator aggregation preserves child recovery/integrity truth and deterministic ordering.
11. Machine serialization preserves semantic identity; stack/platform text is diagnostic only.
12. S04 exit-code mapping is deterministic but intentionally lossy.
13. Error contracts must remain compact enough for token-efficient evidence/correction workflows.

## Open questions before freeze
1. Should top-level categories remain the 13 proposed categories or merge POLICY/AUTHORIZATION and CAPABILITY/DEPENDENCY? Current direction: keep separate typed categories because their remediation and authority semantics differ, while S04 may still coarsen them.
2. Should severity be mandatory on every result? Current direction: yes for non-success results, with a small four-level scale and no claim that it equals security risk.
3. Should stack traces ever be included in normal machine output? Current direction: no; diagnostics only, referenced separately when policy permits.
4. Should reason codes be globally registered or module-prefixed? Current direction: globally namespaced `gef.<category>.<reason>` with ownership metadata, avoiding module IDs in public semantic identity unless unavoidable.
5. Should remediation hints allow executable command suggestions? Current direction: only stable action IDs/structured parameters by default; operator-facing command text is rendered later and never self-authorizing.

## Session completion gate
S05 may become `FROZEN` only when the five open questions are resolved, exact-head review passes, no conflict exists with S01-S04/Security/Architecture, and the M01 module-level completion/review gate is prepared. No functional implementation is introduced by this planning session.

STOP CONDITION: `M01_S05_REVIEW_REQUIRED`.
