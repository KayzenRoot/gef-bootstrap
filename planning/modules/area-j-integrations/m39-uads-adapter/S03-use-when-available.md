# M39 S03 — Use When Available
Status: FROZEN
Class: OPTIONAL_ADAPTER

## Mechanisms
- **URP39 UADS Routing Policy** chooses UADS only when compatible and policy-authorized.
- **UFB39 UADS Fallback Bridge** returns to generic/core path without obligation loss.
- **UHR39 UADS Handoff Receipt** binds request, capabilities and selected path.
- **UCB39 Circuit-break Contract** prevents repeated failing optional calls.

UADS may optimize execution but cannot become a hidden hard dependency. Core semantics and acceptance criteria remain identical with or without it.