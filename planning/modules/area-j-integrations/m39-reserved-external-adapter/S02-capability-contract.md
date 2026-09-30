# M39 S02 — Reserved Capability Contract
Status: RESERVED
Class: OPTIONAL_ADAPTER

## Rules
A future adapter may expose only explicitly verified capabilities through the Generic Adapter API.

## Mechanisms
- **RCM39 Reserved Capability Mapper** maps verified external capabilities to stable generic capabilities.
- **RGR39 Reserved Gap Report** records missing or partial capabilities.
- **RCB39 Reserved Contract Binder** binds protocol version, capability receipt and candidate identity.
- **RVD39 Version Drift Gate** invalidates mappings when the future adapter contract changes.
