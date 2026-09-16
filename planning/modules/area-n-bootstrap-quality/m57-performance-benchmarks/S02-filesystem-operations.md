# M57 S02 — Filesystem Operations

Status: `FROZEN`
Mechanism: `FOP57 — Filesystem Operation Profile`

Benchmark scan, hash, canonical compare, staged write, atomic replace and cleanup against controlled fixture sizes. Separate metadata-heavy many-small-file workloads from large-file throughput and never combine them into one score.

Samples record filesystem-relevant platform metadata and fixture digest. Caches are controlled by warm/cold labels rather than pretending they can be universally flushed. Safety checks and path containment remain enabled during benchmarks.

Acceptance: bounded fixture sizes, no writes outside temp root, median/tail/dispersion reporting, comparable populations, and performance optimization cannot disable integrity/security checks.

STOP CONDITION: `M57_S02_FROZEN`.