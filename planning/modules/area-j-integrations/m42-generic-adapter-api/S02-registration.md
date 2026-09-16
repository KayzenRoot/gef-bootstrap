# M42 S02 — Registration
Status: FROZEN

**ARX42 Adapter Registry** is immutable-per-snapshot and keyed by stable provider id + contract major. Registration validates unique identity, declared capabilities, schema digests and policy compatibility. Duplicate/conflicting registrations fail closed.

**RCP42 Registry Capability Projection** exposes only approved capabilities and canonical ordering. Registry snapshots carry a digest so M43/M44 can correlate executions without recording sensitive payloads.

Dynamic registration creates a new snapshot; it never mutates an in-flight execution context.

Acceptance: duplicate/conflict rejection, canonical registry digest, immutable snapshots, deterministic lookup, least-authority projection.