# M32 CI Bootstrap — Frozen Plan
Status: FROZEN
Assurance: MAX_ASSURANCE
Weight: 17

CI bootstrap discovers repository capabilities and compiles validation obligations into deterministic workflow specifications. M28 selects impacted tests; M32 owns execution specification. Required checks cannot be dropped by caller budget or platform convenience.

Workflows use pinned major actions, least permissions, dependency install, type/static checks, focused tests, regression/security checks and artifact/evidence receipts. Matrix planning explicitly models Ubuntu/Windows/macOS where platform relevance requires it. Unknown platform widens rather than narrows.

Exact-head is mandatory: evidence belongs to a commit SHA and becomes stale when head changes. Required-check aggregation distinguishes success, failure, cancelled, skipped, pending, missing and stale. Missing required evidence fails closed.

Acceptance: discovery; deterministic workflow plan; matrix expansion; required-check aggregation; exact-head invalidation; cancellation/truncation semantics; tests. STOP: M32 implementation and evidence accepted.