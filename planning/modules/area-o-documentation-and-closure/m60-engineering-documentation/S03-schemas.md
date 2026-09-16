# M60 S03 — Schemas

Status: `FROZEN`
Mechanism: `SDC60 — Schema Documentation Compiler`

Generate/validate schema reference from versioned schema definitions: field meaning, type, requiredness, defaults, bounds, enums, unknown-field policy, compatibility/version rules and security sensitivity. Examples are generated from validated fixtures.

Schema docs distinguish absent, null, UNKNOWN and empty values where semantics differ. Deprecated fields include migration path and removal policy.

Acceptance: every public persisted/interchange schema is indexed, examples validate, undocumented required fields fail CI, sensitive fields are labeled, and documentation version is bound to schema digest.

STOP CONDITION: `M60_S03_FROZEN`.