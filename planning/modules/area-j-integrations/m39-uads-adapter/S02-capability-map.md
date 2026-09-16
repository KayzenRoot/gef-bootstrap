# M39 S02 — UADS Capability Map
Status: FROZEN
Class: OPTIONAL_ADAPTER

## Mechanisms
- **UCM39 UADS Capability Mapper** maps native features to M38 stable capabilities.
- **UGR39 UADS Gap Report** records missing/partial capabilities.
- **UCB39 UADS Contract Binder** binds adapter protocol, capability receipt and candidate.
- **UVD39 UADS Version Drift Gate** invalidates mappings after protocol drift.

Mapping cannot fabricate capabilities. Unknown UADS features remain unknown until explicitly mapped and tested.