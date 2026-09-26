# M35 S04 — Least Privilege
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **CPM35 Capability Permission Model** models read/write/execute/network/scm/ci scopes.
- **LPR35 Least Privilege Reducer** computes minimum sufficient capability set.
- **PED35 Privilege Escalation Detector** rejects unapproved widening.
- **TTL35 Time/Task Lease** scopes temporary capability grants.
- **APR35 Authority Provenance Receipt** binds authority source and scope.
- **PCH35 Policy Safety Handoff** read-only contract to downstream executors.

Default is no capability. Wildcards require explicit policy. Derived permissions can narrow but never widen owner authority.