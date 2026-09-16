# M62 S02 — Security Audit
Status: `FROZEN`

## Objective
Aggregate security posture from M34/M35/M37/M44/M58 and dependency/CI evidence without inventing guarantees.

## SAG62 — Security Acceptance Gate
Inputs include unresolved finding severity, dependency audit, security-test receipts, policy fail-closed behavior, integrity/audit continuity and secret-redaction checks.

## Rules
- Any unresolved CRITICAL or HIGH blocks production acceptance.
- UNKNOWN security evidence is not equivalent to PASS.
- Integrity hashes are not described as signatures/authentication unless cryptographically proven.
- Security exceptions require explicit owner/policy evidence and expiry semantics.

## Acceptance
CRITICAL=0, HIGH=0, required security suites green, dependency audit green, no unbounded secret exposure or fail-open acceptance path.