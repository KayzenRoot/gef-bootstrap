# M40 S01 — Hive Detection
Status: FROZEN
Class: OPTIONAL_ADAPTER

## Mechanisms
- **HDD40 Hive Discovery Descriptor** explicit local/remote capability evidence.
- **HIG40 Hive Identity Gate** validates protocol/schema identity.
- **HAR40 Hive Availability Receipt** AVAILABLE/UNAVAILABLE/INCOMPATIBLE/UNKNOWN.
- **HSG40 Hive Spoof Guard** rejects unverified name/path claims.

Hive is optional. Detection is injected and side-effect free in the core. Absence cannot block GEF Bootstrap.