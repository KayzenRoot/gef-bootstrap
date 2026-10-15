# Fast resume: stale local Git references

Before reporting PINNED_REF_MISMATCH for a read-only task:
1. Check worktree cleanliness and the current main SHA from the authorized GitHub handoff.
2. If the local cache is old, safely fetch origin/main with existing credentials; do not force-reset, push, discard work or change canonical lock files.
3. Read from a detached worktree pinned to the authorized SHA; leave the existing task branch intact.
4. If the real current main differs from the authorized SHA, stop only the dependent action for rebinding. If network access is denied, report the specific denied host and do not claim success.
5. Reuse passed check evidence. Do not declare full project completion from a fetched log.

Owner instructions to accelerate routine work do not waive branch protection, required CI, security, approved scope or final checkpoint authorization.

WO-002: main SHA 44a56ea4e58f22de97399792b3e58138c84c07a6; run 38664756806, attempt 1, job 116194000652. A1–A8 real GitHub tests have been observed as passing. The native positive collector remains unverified.
