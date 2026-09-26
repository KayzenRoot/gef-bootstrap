# M57 S04 — Regression

Status: `FROZEN`
Mechanism: `PRG57 — Performance Regression Gate`

Compare candidate measurements to an evidence-bound M45 baseline only when workload, platform class and runtime population are compatible. Gate input contains baseline digest, candidate digest, sample counts, statistic, threshold and noise allowance.

Verdicts: `PASS | REGRESSION | IMPROVEMENT | INCOMPARABLE | INSUFFICIENT_DATA`. `INCOMPARABLE` and `INSUFFICIENT_DATA` can never be reported as PASS. Absolute budgets and relative regression limits are distinct.

Acceptance: deterministic decision math, no cherry-picked best run, retained raw summaries, explicit threshold rationale, and performance gate cannot override correctness/security failures.

STOP CONDITION: `M57_S04_FROZEN`.