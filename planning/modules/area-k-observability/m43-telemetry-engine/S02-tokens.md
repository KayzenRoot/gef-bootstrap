# M43 S02 — Tokens
Status: FROZEN

**TTA43 Token Accounting** records provider/model class, input/output/cache token counts when supplied by the executor, confidence/source and work-order correlation. Missing counts remain UNKNOWN, never zero.

**TBE43 Token Budget Envelope** compares observed consumption to explicit budgets and produces advisory `WITHIN | NEAR | EXCEEDED | UNKNOWN` states. It cannot weaken an execution requirement to save tokens.

Optimization analytics separate reusable context, repeated retrieval and correction churn so later modules can reduce cost without falsifying work.

Privacy: prompts/responses are not telemetry payloads by default.

Acceptance: unknown-safe accounting, no fabricated counts, budget state determinism, correlation and prompt-content exclusion.