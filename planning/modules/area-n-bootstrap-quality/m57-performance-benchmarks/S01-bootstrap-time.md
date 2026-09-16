# M57 S01 — Bootstrap Time

Status: `FROZEN`
Mechanism: `BTP57 — Bootstrap Timing Protocol`

Measure bootstrap latency by named phases using monotonic clocks: discovery, source-check, planning load, filesystem plan, local Git, validation and artifact/checkpoint publication. Warm-up and measured iterations are separate; network work is excluded or reported as a separate population.

Every sample records OS, arch, runtime, Git version, repository fixture, cold/warm class and workload digest. Report median, p90/p95 where sample size supports it, dispersion and sample count rather than a single flattering number.

Acceptance: same-population comparisons only, deterministic workload, no production claim from simulated/network-mismatched data, baseline provenance bound to M45, and regression policy uses statistical/noise guardrails.

STOP CONDITION: `M57_S01_FROZEN`.