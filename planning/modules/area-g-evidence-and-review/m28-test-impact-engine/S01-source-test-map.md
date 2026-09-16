# GBS-M28-S01 — Source/Test Map

Status: `FROZEN`
Module: `GBS-M28 — Test Impact Engine`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`
Source directive: `ADR-0002`

## Objective
Freeze the provider-neutral source/test knowledge model used by M28 to determine what validation may be impacted. M28 owns test identity, source-to-test mapping, dependency closure inputs and mapping completeness. It does not own source truth, evidence truth, proof truth, semantic-review truth, assurance verdicts, Git operations or CI execution.

The map is an optimization authority only when its knowledge is current and sufficiently complete. Missing, conflicting or stale knowledge widens validation and can never justify a smaller test radius.

## Frozen mechanisms
1. **TIC28 — Test Identity Capsule**: stable test identity independent of display name, runner ordering and transient invocation IDs; binds owner, logical contract, runner/provider class and identity version.
2. **SFP28 — Source/Contract Fingerprint Projection**: receives owner-authorized semantic identities for source, schema, API, configuration or governed contract subjects without making M28 the source authority.
3. **TFP28 — Test Fingerprint Projection**: binds test identity to current test body, fixtures/data, configuration, runner/toolchain requirements and declared platform relevance.
4. **STM28 — Source/Test Map**: deterministic bipartite mapping from current source/contract subjects to tests/validation surfaces with explicit edge reason and owner provenance.
5. **TDM28 — Test Dependency Map**: deterministic test-to-test, source-to-boundary and integration dependency graph used only for impact expansion.
6. **PRC28 — Platform Relevance Classifier**: classifies test relevance as `PORTABLE | PLATFORM_SCOPED | MULTI_PLATFORM | UNKNOWN`; UNKNOWN is never assumed portable.
7. **DKC28 — Dependency Knowledge Completeness**: emits `COMPLETE | PARTIAL | CONFLICT | UNKNOWN | TRUNCATED` for the relevant graph slice and identifies unresolved subjects/edges.
8. **TMG28 — Test Map Integrity Gate**: independently verifies identities, edge provenance, source/test fingerprints, dependency completeness and deterministic graph digest before S02 may select or reuse tests.

## Canonical identities and bindings
Every impact calculation is bound to, at minimum:
- project/lineage/work-order or governed operation identity where applicable;
- candidate semantic identity;
- source/contract semantic fingerprints from their owning authority;
- stable test IDs and current test-content fingerprints;
- relevant config/fixture/data identity;
- runtime/toolchain compatibility identity;
- platform identity/relevance when behavior can differ;
- mapping/dependency graph digest;
- mapping completeness state;
- applicable assurance-policy identity.

Git head/tree is not an ambient dependency before M29. A future M29 adapter may add owner-authorized Git identity without changing M28 semantic ownership.

## Determinism rules
- canonical sort order is independent from input order;
- duplicate logically identical edges collapse deterministically;
- duplicate IDs with divergent semantics are `CONFLICT`, never newest-wins;
- graph cycles are represented explicitly and traversed with bounded visited-state rules;
- graph digest is permutation invariant for semantically identical input;
- malformed or unavailable digest capability fails closed;
- traversal is bounded and cancellable, with truncation visible.

## Brownfield and new-project behavior
`NEW_PROJECT` may begin with planned source/test edges from the governed seed tree, but planned edges remain claims until current repository/test identities are materialized.

`EXISTING_PROJECT/BROWNFIELD` inventories existing tests and conventions without renaming or rewriting them merely to normalize the graph. Unknown ownership, generated/vendor tests and dynamic discovery are represented explicitly. Partial discovery widens validation.

## Ownership boundary
- source owners keep descriptive/normative source truth;
- M24 keeps evidence acceptance;
- M25 keeps proof sufficiency/carry-forward;
- M26 keeps semantic delta review/findings;
- M27 keeps assurance class/requirements/verdict and supplies a read-only DAH27 assurance handoff;
- M28 owns source/test mapping and concrete test-impact semantics;
- M29 keeps Git identity/operations;
- M32 keeps CI execution/orchestration;
- M53-M58 keep framework/harness/security-test implementations;
- M63 may optimize scheduling/critical path but may not shrink M28-selected obligations.

## Required attacks and proofs
Renamed test with same semantics; same stable test ID with divergent body; changed fixture; changed config; changed toolchain; platform mismatch; source-owner drift; missing mapping; partial graph; conflicting graph; graph cycle; duplicate/conflicting IDs; one-edge-hidden dependency; ordering permutation; forged source/test fingerprint; cancellation; truncation; oversized graph; brownfield unknown dynamic test discovery.

Planning result: S01 supplies a current, deterministic and fail-closed map. It does not by itself authorize a test to be skipped.

STOP CONDITION: `M28_S01_FROZEN`.