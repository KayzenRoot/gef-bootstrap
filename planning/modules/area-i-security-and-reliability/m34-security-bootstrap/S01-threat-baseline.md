# M34 S01 — Threat Baseline
Status: FROZEN
Assurance: MAX_ASSURANCE

## Objective
Establish a deterministic threat model for bootstrap execution across local, CI and connected-tool boundaries.

## Mechanisms
- **TBR34 Threat Boundary Registry**: canonical trust boundaries and assets.
- **ATG34 Attack Tree Graph**: bounded threat paths with stable IDs.
- **TSC34 Threat Surface Classifier**: filesystem, process, network, SCM, CI, secret and supply-chain surfaces.
- **FRM34 Fail-closed Risk Matrix**: UNKNOWN/CONFLICT never downgrades risk.
- **PBD34 Privilege Boundary Digest**: binds actor, capability and target scope.
- **TDR34 Threat Delta Receipt**: detects threat-model drift between candidates.

## Rules
Threat evaluation is deterministic, startup-pure and deny-by-default. Untrusted repository content cannot grant authority. Risk widening is monotonic. Security decisions must be evidence-bound and domain-separated by module/candidate digest.

## Acceptance
Tests cover malformed input, unknown surfaces, privilege escalation attempts, deterministic ordering and threat-delta invalidation.