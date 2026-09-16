# M52 S01 — Environment
Status: FROZEN

**EDP52 Environment Diagnostic Probe** performs read-only bounded checks for runtime, OS/arch, disk/temp/path, permissions and required tool capabilities. Every observation has source/freshness; sensitive environment values are redacted. Probe failures become UNKNOWN, not healthy.

Acceptance: read-only probes, bounded execution, redaction, unknown-safe results, cross-platform fixtures.