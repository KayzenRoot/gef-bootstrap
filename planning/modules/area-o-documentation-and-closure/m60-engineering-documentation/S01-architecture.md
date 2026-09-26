# M60 S01 — Architecture

Status: `FROZEN`
Mechanism: `ARC60 — Architecture Reference Compiler`

Engineering architecture documentation must trace canonical modules, authority hierarchy, state/evidence flows, trust boundaries and integration seams to source files/ADRs/decisions. Diagrams are text-source-controlled and validated for referenced component IDs.

The reference distinguishes logical architecture from deployment/runtime topology and labels optional adapters separately from release-blocking core. Historical/superseded decisions remain linked but cannot masquerade as current authority.

Acceptance: every active architecture component has owner/module/source links, dependency direction is explicit, diagrams and prose agree, and drift against canonical architecture/decision ledgers fails validation.

STOP CONDITION: `M60_S01_FROZEN`.