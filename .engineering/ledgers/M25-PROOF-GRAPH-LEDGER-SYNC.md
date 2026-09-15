# M25 Proof Graph — Ledger Sync
Status: `FROZEN`
Module: `GBS-M25 — Proof Graph`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Source synchronization
M25 planning is reconciled with the current checkpoint, Scope, DoD, Architecture, M12 DoD ownership, M24 Evidence Engine handoff/validity contracts, M21 progress ownership and future M26/M27 boundaries.

No denominator change is introduced. Planning grants no production credit.

## Frozen mechanisms
- S01: PIC25, PAB25, CCI25, PNI25, PEI25, POD25, PNS25, PIM25.
- S02: PDG25, DAG25, SER25, ESG25, CSG25, PRC25, ADC25, DCW25.
- S03: EVF25, OBF25, DCF25, PSF25, VCG25, PFW25, FCW25, FIR25.
- S04: PCG25, PCK25, CFC25, CFD25, CFW25, PCS25, SAR25, CFR25.
- S05: CIG25, PIV25, TIS25, UDW25, RCP25, PSC25, PIR25, PRG25, PSW25, DPH25.

Total: `42` mechanisms.

## Ownership synchronization
- M12 keeps criterion meaning/status.
- M17 keeps checkpoint and next-action authority.
- M21 keeps progress/denominator authority.
- M23 keeps project-status authority.
- M24 keeps evidence validity/acceptance authority.
- M25 owns proof graph, proof sufficiency, validity fingerprints, carry-forward and proof invalidation projections.
- M26 keeps HEDS delta-review authority.
- M27 keeps assurance authority.

## Technology disposition
- `TECH-0025 — Proof Carry-Forward Graph` is adopted into the frozen M25 Source Pack through PCG25 plus S03 validity fingerprints. Its global ledger lifecycle is not promoted merely by planning; implementation/evidence must prove it.
- `TECH-0042 — Completion Invalidation Graph` is adopted into the frozen M25 Source Pack through CIG25. M25 owns dependency impact and reopen-candidate projection, not the final completion-state transition.
- No external database, graph server or persistence engine is required by M25 core. The semantic graph remains library/API-first and in-memory/provider-neutral; durable audit persistence remains M44-owned.

## Engineering rules
Canonical set ordering, explicit semantic domains, injected SHA-256, bounded/cancellable traversal, no ambient I/O/clock in semantic logic, explicit incomplete/truncated states, targeted invalidation when knowledge is complete, conservative widening when incomplete, and no authority transfer through a handoff.

## Production accounting
- denominator: `1088` unchanged;
- earned before M25: `432`;
- M25 planning credit: `0 / 20`;
- production remains `432 / 1088 = 39.71%` until evidence-bound MODULE_DONE promotion.

STOP CONDITION: `M25_LEDGER_SYNC_FROZEN`.
