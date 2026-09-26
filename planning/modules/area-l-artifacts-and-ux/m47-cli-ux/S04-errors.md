# M47 S04 — Errors
Status: FROZEN

**EUX47 Error Experience Envelope** presents stable error code, plain-language summary, affected operation, recoverability, safe next actions and evidence/correlation id. Internal stack traces/secrets are hidden by default but may be available in protected diagnostics.

Errors distinguish user-correctable input, policy denial, environment/dependency failure, integrity failure and internal defect. Retry is offered only when semantics say it is safe.

Acceptance: secret-safe rendering, stable codes, actionable recovery, safe-retry rules, correlation to audit/telemetry.