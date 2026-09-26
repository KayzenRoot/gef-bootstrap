# M54 S03 — Filesystem
Status: FROZEN

**FSH54 Filesystem Harness** models files, symlinks where supported, permissions, locked/read-only paths, traversal attempts, atomic replace and partial-write failures within sandbox boundaries. Platform capability differences are explicit skips only when policy permits.

Acceptance: traversal containment, atomicity/failure injection, path portability, cleanup, no outside-root writes.