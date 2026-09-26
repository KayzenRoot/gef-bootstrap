---
applyTo: "**/*.ts"
---
# TypeScript execution rules

Preserve strict compiler settings. Prefer explicit deterministic contracts, readonly data where practical, bounded/cancellable graph work, stable ordering and fail-closed states. Avoid hidden I/O in library layers. Do not add runtime dependencies unless the admitted task requires them and supply-chain impact is reviewed. Semantic digests must canonicalize semantic input before hashing. Tests must cover adversarial boundary states, not only happy paths.