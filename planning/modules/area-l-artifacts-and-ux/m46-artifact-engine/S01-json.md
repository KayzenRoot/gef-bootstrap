# M46 S01 — JSON
Status: FROZEN | Class: PRODUCT_INCLUDED

**JAC46 JSON Artifact Contract** uses versioned schemas, canonical key ordering, UTF-8, explicit null/unknown semantics and content digest. Machine artifacts include provenance envelope and schema id; human-only decoration is excluded.

Writes are staged then atomically committed where the host supports it. Validation occurs before publication. Unknown fields follow schema policy rather than silent stripping.

Acceptance: canonical serialization, schema validation, digest stability, atomic publication, unknown-field policy.