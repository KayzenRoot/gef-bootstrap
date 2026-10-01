# M39 S03 — Optional Routing
Status: RESERVED
Class: OPTIONAL_ADAPTER

## Rules
The generic/core path remains authoritative. A future adapter may be selected only when its identity and required capabilities are verified and policy-authorized.

## Mechanisms
- **RRP39 Reserved Routing Policy** selects an admitted adapter only when compatible.
- **RFB39 Fallback Bridge** returns to the generic/core path without obligation loss.
- **RHR39 Handoff Receipt** binds request, capabilities and selected path.
- **RCB39 Circuit-Break Contract** prevents repeated failing optional calls.
