# M39 S01 — UADS Detection
Status: FROZEN
Class: OPTIONAL_ADAPTER

## Mechanisms
- **UDD39 UADS Discovery Descriptor** explicit endpoint/manifest evidence.
- **UIG39 UADS Identity Gate** validates protocol/version identity.
- **UAR39 UADS Availability Receipt** AVAILABLE/UNAVAILABLE/INCOMPATIBLE/UNKNOWN.
- **USG39 UADS Spoof Guard** rejects name-only discovery.

UADS is optional. No network call occurs in pure detection logic; observations are injected. Absence never blocks core GEF Bootstrap.