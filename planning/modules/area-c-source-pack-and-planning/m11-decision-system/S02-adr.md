# GBS-M11-S02 — ADR

Status: `FROZEN`
Module: `GBS-M11 Decision System`
Classification: `CORE_REQUIRED`
Authority domain: `DECISION`

## Objective
Define Architecture Decision Record representation and its exact relationship to decision authority without making document format, chronology or file location an authority shortcut.

## ADR record
Required fields:
- stable `adrId`;
- `title`;
- `status`: `PROPOSED | ACCEPTED | SUPERSEDED | REJECTED | STALE`;
- `context`;
- explicit `decision`;
- `consequences`;
- ordered stable `decisionIds` represented by the ADR;
- `sourceRefs` / fingerprints;
- explicit `supersedesAdrIds` / `supersededByAdrIds` where applicable;
- optional alternatives and proof notes.

An ADR is documentary evidence of a decision. Effective decision resolution is performed against explicit decision records and supersession relations. An ADR cannot become current merely because its filename/number/date is newer.

## ADR Integrity Envelope
The **ADR Integrity Envelope (AIE)** is a deterministic projection tying ADR identity, represented decision IDs, status, context/decision/consequences and canonical source fingerprints. It permits staleness/integrity checks without promoting M11 into M37 Integrity Engine.

## Decision-to-ADR Bidirectional Link
A **Decision-to-ADR Link (DAL)** requires both sides to agree when a frozen decision claims an ADR and the ADR claims that decision. One-sided links produce a typed integrity diagnostic rather than silent repair.

## ADR Delta Lens
An **ADR Delta Lens (ADL)** is a pure derived projection comparing two ADR semantic snapshots: decision text changed, consequences changed, represented decisions changed, supersession changed, or source binding changed. It helps audits but is not HEDS/M26 authority.

## Format boundary
Markdown remains a human-friendly canonical carrier, but M11’s baseline engine operates on validated structured ADR records. A Markdown AST importer/exporter is an adapter concern and may be added only if needed by later repository integration. M11 does not execute Markdown, templates, embedded HTML or repository code.

## Technology classification
- AIE: `NECESSARY`.
- DAL consistency validation: `NECESSARY`.
- ADR Delta Lens: `IMPORTANT`, pure implementation is allowed because it directly supports conflict/staleness review without changing authority.
- CommonMark/Markdown AST adapter: `IMPORTANT`, deferred until an integration requirement exists.
- JSON Schema 2020-12 persisted/interchange schema: `IMPORTANT`, architecture-compatible; typed TS baseline remains necessary now.
- cryptographic signatures/Sigstore: `FUTURE`, belongs with stronger release/integrity governance.

## Proof obligations
Status validation; stable IDs; bidirectional link diagnostics; deterministic AIE/ADL; explicit supersession only; no newest-wins resolution; no executable content; no mutation of Architecture/Scope/DoD.

Open questions: `0`.

STOP CONDITION: `GBS_M11_S02_FROZEN`.