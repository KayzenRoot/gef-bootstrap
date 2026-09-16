# M40 S02 — Hive Context
Status: FROZEN
Class: OPTIONAL_ADAPTER

## Mechanisms
- **HCE40 Hive Context Envelope** bounded, schema-versioned project context request/response.
- **HCB40 Hive Context Binding** binds context digest to project/candidate/source hierarchy.
- **HBR40 Context Budget Reducer** requests minimum sufficient context to reduce executor tokens.
- **HSG40 Staleness Guard** rejects stale or mismatched context receipts.
- **HPR40 Provenance Resolver** preserves canonical source identities through retrieval.

Hive context is advisory until validated against canonical authority. Retrieval cannot override checkpoint/ADR/scope hierarchy. Context budgeting targets speed and token reduction without dropping required constraints.