# GBS-M09-S01 — Source Pack Structure

Status: `FROZEN_CANDIDATE`

This session defines the deterministic structure of the GEF Source Pack. Canonical repository sources remain authoritative. The Source Pack provides addressable entries, project binding, authority metadata, applicability, dependencies, provenance and integrity metadata.

## Source Topology Mesh
GEF introduces Source Topology Mesh, a typed graph connecting documents, sections and facts through explicit dependency, supersession, constraint and activation relations. Graph order has no semantic meaning, cycles are diagnosed, traversal is bounded and relations cannot elevate source authority.

## Authority Vector Envelope
GEF introduces Authority Vector Envelope. Authority is represented by domain, canonicality, applicability, lifecycle state and exact-state binding instead of a single global numeric rank. Cross-domain disagreements remain explicit.

## Determinism
Equivalent canonical inputs and explicit conditions must produce equivalent semantic identity across supported operating systems. Host paths, timestamps, locale and enumeration order are non-semantic.

## Boundaries
M09 does not own project decisions, mutation authority, template declarations, profile semantics, adoption strategy, context minimization, execution-pack compilation or assurance verdicts.

## Proof obligations
Future implementation must prove stable identity, duplicate rejection, bounded graph traversal, project-binding validation, read-only construction and cross-platform determinism.

No production credit is earned by this planning session.

STOP CONDITION: `READY_FOR_GBS_M09_S02_REQUIRED_DOCUMENTS` after governed promotion.