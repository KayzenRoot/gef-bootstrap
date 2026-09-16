# M45 S01 — Initial Baseline
Status: FROZEN | Class: CORE_REQUIRED

**BSP45 Baseline Snapshot Protocol** captures versioned workload definition, environment class, toolchain/runtime, assurance profile, sample policy and metric schema before comparison. A baseline without these bindings is INVALID.

Metrics include elapsed active time, validation time, token/search/file counts where known, correction loops, test scope and artifact counts. Missing measurements stay UNKNOWN.

Baselines are immutable and digest-addressed; refreshing creates a new generation.

Acceptance: reproducible workload identity, environment binding, unknown-safe metrics, immutable generations, canonical digest.