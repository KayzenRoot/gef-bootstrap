---
applyTo: "tests/**/*.mjs"
---
# Test execution rules

Design tests as reusable proof nodes. Separate focused contract tests from repository-wide regression. A failure invalidates only the proof nodes that depend on the changed or failed subject unless the dependency graph proves broader invalidation. Never delete or weaken a valid test to obtain green CI. Prefer deterministic fixtures and explicit edge cases. Run cheap/static checks before expensive suites, focused changed-surface tests before broad regression, and full required regression at integration/promotion boundaries.