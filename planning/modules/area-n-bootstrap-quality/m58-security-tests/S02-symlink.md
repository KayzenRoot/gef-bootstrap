# M58 S02 — Symlink

Status: `FROZEN`
Mechanism: `SEA58 — Symlink Escape Adversary`

Test links/junction-like behavior where the platform permits it: in-root link to in-root target, in-root link to out-of-root target, chained links, broken links, link replacement between check/write and directory-link escapes.

Security-sensitive writes must validate the effective target at the mutation boundary and use safe primitives where available. Unsupported platform capabilities are explicit skips with reason, never silent PASS.

Acceptance: no write follows an untrusted escape, TOCTOU fixtures produce safe failure, cleanup cannot traverse outside sandbox, and receipts distinguish unsupported from protected behavior.

STOP CONDITION: `M58_S02_FROZEN`.