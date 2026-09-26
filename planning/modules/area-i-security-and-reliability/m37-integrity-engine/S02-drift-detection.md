# M37 S02 — Drift Detection
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **DSE37 Drift Snapshot Envelope** canonical before/after state.
- **SDC37 Semantic Drift Classifier** NONE/EXPECTED/UNEXPECTED/CONFLICT/UNKNOWN.
- **DGG37 Drift Graph Generator** maps changed state to owning contracts.
- **EBD37 Expected Baseline Delta** requires explicit authorized change receipt.
- **MDW37 Monotonic Drift Widening** uncertainty can only increase validation.
- **DDR37 Drift Detection Receipt** deterministic and evidence-bound.

Timestamp-only or formatting-only noise is separated from semantic drift. Unknown ownership or unverifiable baseline blocks trust reuse.