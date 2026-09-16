# M53 S02 — Schemas
Status: FROZEN

**STF53 Schema Test Fixtures** generate valid boundary cases and curated invalid cases for versioned contracts. Round-trip/canonicalization and unknown-field policies are first-class. Fuzz/property cases are seeded and bounded so failures replay exactly.

Acceptance: positive/negative/boundary cases, deterministic seed replay, canonical round-trip, version migration fixtures.