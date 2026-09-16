# M46 S04 — Naming & Versioning
Status: FROZEN

**ANV46 Artifact Name/Version Scheme**: stable artifact kind + project/work-order scope + semantic artifact version; timestamps are metadata, not identity. Filenames are portable across Windows/macOS/Linux and reject traversal/reserved-name hazards.

**ALM46 Artifact Lineage Manifest** binds logical id, version, source digest, renderer/toolchain, supersedes relation and content digest. Overwrite requires explicit replacement policy; otherwise publication is append-versioned.

Acceptance: portable names, traversal denial, deterministic logical ids, lineage verification, overwrite protection.