# GBS-M03-S02 — Project Fingerprint

Status: `FROZEN_CANDIDATE`

## Purpose
Define the compact mutable fingerprint contract used to bind cached context, evidence, derived state and execution plans to the relevant project-identity state without confusing mutable state with the immutable `projectId` frozen in S01.

## Binding sources
- `GBS-M03-S01 — Project ID` FROZEN
- completed M01 runtime contracts
- completed M02 configuration/schema fingerprints and provenance contracts
- frozen Architecture, Security, DoD and Source Hierarchy

## Core distinction
`projectId` answers: **which governed project lineage is this?**

`projectFingerprint` answers: **is the identity-relevant state this artifact was compiled against still the same?**

A fingerprint change MUST NOT silently create a new project identity.

## Frozen contract

### PF-01 — Fingerprint is derived, never canonical truth
The project fingerprint is reproducible derived state. It may be cached and carried in receipts, prompts, plans and proof bindings, but it never supersedes canonical project files or repository truth.

### PF-02 — Fingerprint has a versioned input manifest
The fingerprint is computed from a canonical ordered manifest of explicitly admitted identity-relevant inputs. The manifest version is part of the fingerprint contract so future input-set changes do not silently reinterpret old fingerprints.

Logical form:
```text
ProjectFingerprintInput/v1
  projectId
  projectConfigIdentityProjection
  repositoryIdentityProjection   # once S03 is available
  identityPolicyVersion
```

S02 does not predefine S03 repository fields; it reserves a typed projection boundary.

### PF-03 — Minimal input principle
Only facts required to detect identity/binding drift belong in the project fingerprint. Full repository content, timestamps, build outputs, caches, arbitrary environment variables and unrelated source files are excluded.

Broad content integrity belongs to M37/proof-specific fingerprints, not M03.

### PF-04 — Project config uses an identity projection
The fingerprint does not hash all of `.gef/project.json`. It hashes only M03-owned identity fields and explicitly admitted identity-affecting bindings. Changing unrelated output preferences or telemetry settings must not invalidate project identity caches.

### PF-05 — Repository identity is compositional
After S03 freezes repository identity, S02 consumes a normalized repository-identity projection rather than raw remote strings. Provider-specific noise, credentials and transient network metadata are excluded.

Until S03 is available, repository projection is `UNRESOLVED`. This does **not** block generation of the base `IDENTITY_STATE` fingerprint, but it does block any `REPOSITORY_BOUND` consumer from claiming satisfied binding.

### PF-06 — Canonical deterministic serialization
Inputs are serialized through a versioned deterministic canonical form before hashing. Object key order, platform path separators, locale and incidental formatting cannot alter the logical fingerprint.

Hash algorithm ownership is delegated to M37 Integrity. S02 defines the semantic input manifest and requires algorithm identifier/version to be carried with the fingerprint.

The canonical machine representation is a **structured object**, not a custom colon-delimited string grammar:
```text
ProjectFingerprint
  schemaVersion
  manifestVersion
  algorithm
  digest
  bindingStrength
  repositoryProjectionState
```

Human/operator surfaces may render a compact display string, but persisted/interchange contracts use the structured object so field evolution does not require parsing a bespoke grammar.

### PF-07 — Fingerprint receipts expose why they changed
When a previous compatible manifest/fingerprint is supplied, recomputation MUST produce a compact delta classification such as:
- `PROJECT_ID_CHANGED`
- `PROJECT_IDENTITY_CONFIG_CHANGED`
- `REPOSITORY_BINDING_CHANGED`
- `IDENTITY_POLICY_VERSION_CHANGED`
- `FINGERPRINT_ALGORITHM_CHANGED`
- `MANIFEST_VERSION_CHANGED`

When no previous compatible manifest is supplied, delta classification is `BASELINE_CREATED` rather than fabricating a comparison.

This enables targeted invalidation and delta review without rereading all canonical sources.

### PF-08 — Binding strength is explicit
Artifacts may declare one of these binding requirements:
- `PROJECT_ONLY`: validated canonical `projectId` directly, with **no redundant secondary project-only fingerprint**;
- `IDENTITY_STATE`: project fingerprint over project identity-state inputs;
- `REPOSITORY_BOUND`: project fingerprint including resolved repository projection.

A weaker binding may not satisfy a stronger consumer silently.

### PF-09 — Fingerprint invalidation is targeted
A fingerprint change invalidates only artifacts whose validity contract depends on that fingerprint or changed projection. It does not automatically invalidate every test, proof or cache in the project.

Proof-specific dependency/invalidation is owned by M25/M28/M37.

### PF-10 — Missing identity blocks fingerprinting
States `UNADOPTED`, `IDENTITY_BOOTSTRAP_REQUIRED`, malformed project ID or identity conflict cannot produce a valid production project fingerprint. Diagnostic/preview tooling may emit a clearly non-authoritative provisional descriptor, but never a production-equivalent fingerprint.

### PF-11 — No secrets or unstable host facts
Secrets, credential values, absolute local checkout path, username, hostname, process ID, clock time and random run IDs are excluded from the project fingerprint.

### PF-12 — Token economy
Once a validated fingerprint exists, prompts and machine contracts may carry the compact `projectId + projectFingerprint + projection version` instead of repeatedly embedding identity configuration and repository metadata. Consumers expand only on mismatch, missing proof or stronger binding requirement.

## Security and assurance properties
- hash equality is evidence of equal normalized admitted inputs, not authorization;
- collision resistance requirements are owned by M37 and assurance policy;
- weak/provisional hashes cannot satisfy production assurance;
- algorithm/version is explicit so migration is governed;
- repository/provider credentials can never affect the digest;
- raw unnormalized remote/path strings are not accepted as canonical fingerprint inputs;
- unresolved repository projection cannot satisfy `REPOSITORY_BOUND`.

## Required future proof
Implementation must eventually prove:
1. same logical admitted inputs produce the same fingerprint across key ordering/platform formatting;
2. changing `projectId` changes fingerprint;
3. unrelated project config changes do not change fingerprint;
4. admitted identity config changes do change fingerprint;
5. unresolved S03 repository identity still permits `IDENTITY_STATE` but cannot satisfy `REPOSITORY_BOUND`;
6. repository projection changes are independently diagnosable;
7. secret/host/runtime facts never enter the manifest;
8. algorithm and manifest versions are carried explicitly;
9. compact delta classification identifies the changed projection when a previous manifest exists;
10. baseline creation is explicitly distinguished from change comparison;
11. `PROJECT_ONLY` uses validated `projectId` without redundant hashing;
12. cache/proof consumers can request binding strength without rereading full identity sources.

## Resolved freeze decisions
1. Canonical representation is a structured machine object: **RESOLVED**.
2. `PROJECT_ONLY` carries validated `projectId` directly, not a redundant tiny fingerprint: **RESOLVED**.
3. Unresolved repository identity does not block base `IDENTITY_STATE`; it blocks only `REPOSITORY_BOUND`: **RESOLVED**.
4. Delta classification is mandatory when a previous compatible manifest is supplied; otherwise output `BASELINE_CREATED`: **RESOLVED**.

## Session completion rule
Planning content is frozen-candidate. Final `FROZEN` requires exact-head review, merge and checkpoint advancement to `GBS-M03-S03`.

STOP CONDITION: `M03_S02_EXACT_HEAD_REVIEW_REQUIRED`.
