# M39 S04 — Safe Absence
Status: RESERVED
Class: OPTIONAL_ADAPTER

## Invariant
The absence of an external adapter is a normal deterministic state and never a core startup dependency.

## Mechanisms
- **RSA39 Safe Absence State** makes UNAVAILABLE a normal deterministic result.
- **RNF39 No-Fallback-Loss Gate** proves the core path preserves required obligations.
- **RDC39 Degraded Capability Contract** distinguishes optional optimization loss from functional loss.
- **RAS39 Absence Startup Purity Test** ensures startup does not require an external adapter.
