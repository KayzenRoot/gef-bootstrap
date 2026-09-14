# Package Executor Guidance

Applies beneath `packages/` in addition to root `AGENTS.md`.

Keep package APIs deterministic and side-effect boundaries explicit. Do not let compiler/domain packages silently perform filesystem, network, Git or provider mutation. Preserve strict TypeScript contracts, stable ordering, bounded graph operations and fail-closed states. Prefer small public surfaces and reusable semantic receipts over executor-specific behavior. Changes must include focused proof for the package and must not weaken repository-wide acceptance requirements.