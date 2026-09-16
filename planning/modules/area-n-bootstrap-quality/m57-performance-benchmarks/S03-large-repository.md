# M57 S03 — Large Repository

Status: `FROZEN`
Mechanism: `LRP57 — Large Repository Profile`

Use generated deterministic repositories with tiered file counts, directory depth, Git history and change density. The generator records seed and manifest digest so scale tests are reproducible without committing giant fixtures.

Measure discovery, source mapping, change classification, test-impact selection and checkpoint/artifact operations. Include ignored/vendor-like trees to verify bounded traversal policies and exclusion behavior.

Acceptance: memory/latency samples are bounded and tagged by tier, cancellation works under load, no O(N²) surprise is accepted without explicit evidence, and regressions compare identical fixture tiers/runtime populations.

STOP CONDITION: `M57_S03_FROZEN`.