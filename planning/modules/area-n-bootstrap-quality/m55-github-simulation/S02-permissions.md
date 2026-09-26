# M55 S02 — Permissions

Status: `FROZEN`
Mechanism: `PAM55 — Permission & Authority Matrix`

## Contract
Model GitHub authorization separately from resource existence. Permission state is evaluated per actor, repository, resource and operation with levels `NONE | READ | TRIAGE | WRITE | MAINTAIN | ADMIN | UNKNOWN` and explicit capability overrides.

The simulator distinguishes `NOT_FOUND`, `FORBIDDEN`, `AUTH_REQUIRED`, `CAPABILITY_GAP` and `UNKNOWN`, preventing tests from assuming that inaccessible resources do not exist. Least authority is the default.

## Scenarios
Cover read-only tokens, pull-request write without administration, Actions read/write differences, protected branch/ruleset denial, reviewer restrictions, merge permission, fork-like boundaries and expired/revoked credentials. Synthetic credentials never leave the harness.

## Acceptance
Permission checks precede mutations; denial leaves state/digest unchanged; UNKNOWN never grants access; tests can prove no privilege escalation through retries, alternate endpoints or stale capabilities.

STOP CONDITION: `M55_S02_FROZEN`.