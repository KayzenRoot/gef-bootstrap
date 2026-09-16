# GEF Bootstrap V1 — Maintenance Boundary

Effective after final promotion merge.

## Frozen V1 boundary
M00-M63 and the 1088-point release-blocking accounting become accepted V1 history. Evidence, audit and checkpoint lineage must remain inspectable.

## Allowed maintenance
Security fixes, correctness fixes, compatibility maintenance, dependency/runtime maintenance, documentation corrections, performance improvements that preserve contracts, release packaging and operational hardening.

## Requires new authorized scope
New release-blocking modules, denominator changes, semantic contract expansion, breaking interfaces, new mandatory providers/adapters, or changes that reinterpret historical MODULE_DONE evidence.

Maintenance never silently rewrites production-acceptance receipts. Material changes require a new Work Order, exact-head evidence and appropriate assurance.