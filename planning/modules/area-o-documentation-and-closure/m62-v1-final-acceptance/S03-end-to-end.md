# M62 S03 — End-to-End Acceptance
Status: `FROZEN`

## Objective
Require representative product journeys to pass through the real governed contracts before release.

## EAG62 — End-to-End Acceptance Graph
Required journeys include new-project bootstrap, brownfield adoption, repeat/idempotent run, doctor/read-only diagnosis, upgrade preview/recovery boundary, Git/GitHub governed path, evidence/audit/checkpoint continuity and offline/degraded capability behavior.

## Rules
- Every phase receipt is bound to scenario and exact candidate.
- Unsupported platform/capability is explicit, never silently skipped.
- Failure preserves evidence and cannot award progress.
- Cross-platform required paths cover Ubuntu, Windows and macOS where applicable.

## Acceptance
All mandatory E2E journeys PASS with deterministic receipts and no release-blocking unexplained skip.