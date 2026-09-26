# M43 S04 — Searches & Files
Status: FROZEN

**SFT43 Search/File Trace** records counts and stable classifications for source reads, cache hits, changed-file reads, search queries, generated artifacts and write attempts. Paths are normalized/project-relative and can be hashed by privacy policy.

The engine distinguishes `NECESSARY | REUSED | DUPLICATE | UNKNOWN` retrievals without deciding correctness. Duplicate-read metrics support executor optimization; they never suppress a required source read by themselves.

Acceptance: normalized path handling, privacy mode, duplicate detection, cache attribution, no content capture by default.