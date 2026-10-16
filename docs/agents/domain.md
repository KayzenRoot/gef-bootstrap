# Optional agent skills — GEF domain documentation

Status: **ADVISORY / NON-AUTHORITATIVE**. This repo is a governed single product whose actual canonical source paths take precedence over a generic template. This document does **not** create a new glossary, decision, Work Order or execution authority.

## Actual GEF paths (verify at current HEAD)

- **Authority routing:** `.engineering/SOURCE-HIERARCHY.md`.
- **Decisions and ADRs:** `.engineering/DECISIONS-LEDGER.md`, `.engineering/DECISIONS-SUPERSESSION-MAP.md`, `.engineering/decisions/ADR-*.md`.
- **Current project-state pair:** `.engineering/CHECKPOINT.md` + `.engineering/CHECKPOINT.json`; a shared-field disagreement is **STATE_CONFLICT**, not permission to trust the later file.
- **Product model:** `.engineering/SCOPE.md`, `.engineering/ARCHITECTURE.md`, `.engineering/REQUIREMENTS.md`.
- **Security/completion:** `.engineering/SECURITY.md`, `.engineering/DEFINITION-OF-DONE.md`, `.engineering/TEST-BENCHMARK-PLAN.md`.
- **Implementation permission:** only an owner-admitted Work Order and an exact-bound effective Context Lock, consistent with ADR-0008 actor restrictions and the current checkpoint.

A generic skill may suggest `docs/adr/`, `src/<context>/docs/adr/`, `GLOSSARY.md` or `GLOSSARY-MAP.md`. These are **not automatically canonical GEF locations**. On the observed current main, `GLOSSARY.md` and `GLOSSARY-MAP.md` do not exist; absence of an optional glossary alone must not invent a missing product requirement. Never silently ignore a **required** canonical source, even if a template recommends doing so.

## Before changing a domain term or contract

1. Verify repository `KayzenRoot/gef-bootstrap`, exact branch and commit, then read only the relevant authoritative sources according to Source Hierarchy.
2. Locate the actual concept/contract in frozen Scope, Requirements and Architecture and the relevant ADR supersession chain. Use these established names and definitions; derived snapshots may help find them but cannot substitute them.
3. If an optional glossary is present, use it for vocabulary only when consistent with the governing sources. When absent, rely on the frozen source; do **not** auto-create a new canonical glossary/ADR path from the skill template.
4. If the desired change contradicts an ADR or would revise a frozen contract, record `SOURCE_CONFLICT` or `DRIFT`, reference exact affected source/IDs and prepare a distinct governance proposal; do not “proceed silently” or change the decision via implementation.
5. Consult the admitted Work Order/Context Lock, DoD, required evidence/CI and Security before any write. Codex remains the implementation/test/CI author under effective ADR-0008; optional model skills are advisory only.
6. Treat architecture/domain examples from third-party skills as illustrative, not as an admitted GEF database, bounded context or storage architecture.

## Example review notation

`Domain contract discrepancy: observed source .engineering/ARCHITECTURE.md at <sha> differs from approved ADR-XXXX; proposed delta NOT_EFFECTIVE, Work Order NOT_ADMITTED, source authority review required.`

This notation is descriptive; no example itself grants approval.

**STOP:** `GEF_DOMAIN_ADVISORY_ROUTED_TO_CANONICAL_SOURCES`.
