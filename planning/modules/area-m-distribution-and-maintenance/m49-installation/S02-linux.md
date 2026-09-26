# M49 S02 — Linux
Status: FROZEN

**LIP49 Linux Install Plan** is distro-agnostic at core: detect supported runtime/architecture, prefer user-scoped XDG-compatible locations, preserve permissions, avoid sudo unless explicitly selected, and publish through verified staging. Shell profile changes are opt-in and idempotent.

Acceptance: clean/reinstall, permission preservation, no implicit root, shell/path portability, rollback and Linux CI smoke.