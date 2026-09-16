# M61 S04 — GitHub Gap

Status: `FROZEN`
Mechanism: `GGR61 — GitHub Gap Runbook`

Handle absent CLI, unauthenticated connector, insufficient permission, missing Actions capability, ruleset restrictions, rate limit, API outage and unsupported endpoint as distinct states. Start with read-only capability detection and preserve exact error class.

The runbook favors least-privilege remediation and supported alternate capability paths. It never tells operators to disable branch protection/rulesets merely to make automation pass, and never treats permission denial as resource absence.

Acceptance: each M51/M52/M55 GitHub gap maps to diagnosis/remediation/verification, credential material stays redacted, offline/degraded operation is documented where supported, and unresolved capability remains `CAPABILITY_GAP` rather than false success.

STOP CONDITION: `M61_S04_FROZEN`.