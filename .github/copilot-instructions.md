# GEF GitHub Agent Instructions

Use `AGENTS.md` as the executor-neutral root contract. GitHub/Copilot-specific behavior must remain compatible with it.

Before implementation, locate the current checkpoint, admitted Work Order, exact base/head requirements and only the canonical sources required by the task. Do not infer authority from recency or from this instruction file.

Prefer execution packs that already contain decisions, file targets, dependency order, acceptance checks and stop conditions. Spend model tokens on implementation and diagnosis rather than rediscovering settled project intent.

Use progressive validation and evidence reuse. Preserve green independent nodes. If a check fails, identify the causal delta and rerun the smallest invalidated proof before broad regression. Full regression remains mandatory at the governed boundary defined by the Work Order/DoD.

Never weaken tests, TypeScript strictness, security controls, exact-state bindings or fail-closed behavior to make CI green. Never claim completion from model confidence.