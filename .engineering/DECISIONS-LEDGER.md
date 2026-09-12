# Decisions Ledger

Status: `ACTIVE`

## D-0001 — Session-by-session planning
- Decision: Plan GEF Bootstrap module by module and session by session before implementation.
- Status: APPROVED

## D-0002 — Independent product boundary
- Decision: New GEF Bootstrap improvements remain in this project and are not automatically pushed into UADS, Hive, or UGAS. Those systems may later be optional integrations.
- Status: APPROVED

## D-0003 — GEF V1 default
- Decision: Projects initialized by this bootstrap target the GEF V1 prompt/review engineering model by default.
- Status: APPROVED

## D-0004 — Instruction-first, no product runtime
- Decision: GEF Bootstrap is a versioned instruction/governance repository, not a standalone application or CLI product. Its primary artifacts are protocols, templates, schemas, review/prompt contracts, planning structures and reusable bootstrap instructions consumed by ChatGPT, Codex and future executors.
- Status: APPROVED

## D-0005 — Optimization objective
- Decision: The primary optimization target is total safe engineering cost per change: Codex token consumption, active execution time, repository exploration, local test volume/duration, correction rounds and review effort, while preserving correctness, security and required assurance.
- Status: APPROVED

## D-0006 — Reasoning/execution split
- Decision: ChatGPT should resolve architecture, root cause and implementation strategy as far as safely possible, then compile a bounded GEF execution instruction so Codex executes rather than rediscovers frozen engineering decisions.
- Status: APPROVED

## D-0007 — Selective validation with assurance protection
- Decision: Implementation-time testing should begin with the smallest safe impacted set and expand according to dependency impact, risk and uncertainty. Aggressive test skipping/proof reuse requires shadow assurance before becoming authoritative.
- Status: APPROVED

## D-0008 — Bootstrap materializes governance into the target repository
- Decision: Although GEF Bootstrap has no standalone runtime/CLI, invoking its canonical project-start instruction against a target repository must create or update the governed files, directories, templates, checkpoint state, prompt/review contracts and other approved bootstrap artifacts required for that target project to follow GEF recommendations. The Bootstrap repository is the instruction source; the target repository receives the materialized project-specific artifacts.
- Status: APPROVED
