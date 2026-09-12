# GBS-M03-S02 — Project Fingerprint

Status: `IN_DISCUSSION`

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

## Candidate contract

### PF-01 — Fingerprint is derived, never canonical truth
The project fingerprint is reproducible derived state. It may be cached and carried in receipts, prompts, plans and proof bindings, but it never supersedes canonical project files or repository truth.

### PF-02 — Fingerprint has a versioned input manifest
The fingerprint is computed from a canonical ordered manifest of explicitly admitted identity-relevant inputs. The manifest version is part of the fingerprint contract so future input-set changes do not silently reinterpret old fingerprints.

Candidate logical form:
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

Until S03 is available, repository projection is `UNRESOLVED` and any artifact requiring repository-bound identity assurance must fail closed rather than fabricate a stable fingerprint.

### PF-06 — Canonical deterministic serialization
Inputs are serialized through a versioned deterministic canonical form before hashing. Object key order, platform path separators, locale and incidental formatting cannot alter the logical fingerprint.

Hash algorithm ownership is delegated to M37 Integrity. S02 defines the semantic input manifest and requires the algorithm identifier/version to be carried with the fingerprint.

Conceptual representation:
```text
gefpf:v1:<algorithm-id>:<digest>
```

The exact digest algorithm is not frozen in S02.

### PF-07 — Fingerprint receipts expose why they changed
A recomputation should be able to produce a compact delta classification such as:
- `PROJECT_ID_CHANGED`
- `PROJECT_IDENTITY_CONFIG_CHANGED`
- `REPOSITORY_BINDING_CHANGED`
- `IDENTITY_POLICY_VERSION_CHANGED`
- `FINGERPRINT_ALGORITHM_CHANGED`

This enables targeted invalidation and delta review without rereading all canonical sources.

### PF-08 — Binding strength is explicit
Artifacts may declare one of these binding requirements:
- `PROJECT_ONLY`: projectId validation only;
- `IDENTITY_STATE`: project fingerprint required;
- `REPOSITORY_BOUND`: project fingerprint including resolved repository projection required.

A weaker binding may not satisfy a stronger consumer silently.

### PF-09 — Fingerprint invalidation is targeted
A fingerprint change invalidates only artifacts whose validity contract depends on that fingerprint or changed projection. It does not automatically invalidate every test, proof or cache in the project.

Proof-specific dependency/invalidation is owned by M25/M28/M37.

### PF-10 — Missing identity blocks fingerprinting
States `UNADOPTED`, `IDENTITY_BOOTSTRAP_REQUIRED`, malformed project ID or identity conflict cannot produce a valid production project fingerprint. Diagnostic/preview tooling may emit a clearly non-authoritative provisional descriptor, but never a production-equivalent fingerprint.

### PF-11 — No secrets or unstable host facts
Secrets, credential values, absolute local checkout path, username, hostname, process ID, clock time and random run IDs are excluded from the project fingerprint.

### PF-12 — Token economy
Once a validated fingerprint exists, prompts and machine contracts may carry the compact `projectId + projectFingerprint + projection version` instead of repeatedly embedding identity configuration and repository metadata. Consumers expand only on mismatch or missing proof.

## Security and assurance properties
- hash equality is evidence of equal normalized admitted inputs, not authorization;
- collision resistance requirements are owned by M37 and assurance policy;
- weak/provisional hashes cannot satisfy production assurance;
- algorithm/version is explicit so migration is governed;
- repository/provider credentials can never affect the digest;
- raw unnormalized remote/path strings are not accepted as canonical fingerprint inputs.

## Required future proof
Implementation must eventually prove:
1. same logical admitted inputs produce the same fingerprint across key ordering/platform formatting;
2. changing `projectId` changes fingerprint;
3. unrelated project config changes do not change fingerprint;
4. admitted identity config changes do change fingerprint;
5. unresolved S03 repository identity cannot satisfy `REPOSITORY_BOUND`;
6. repository projection changes are independently diagnosable;
7. secret/host/runtime facts never enter the manifest;
8. algorithm and manifest versions are carried explicitly;
9. compact delta classification identifies the changed projection;
10. cache/proof consumers can request binding strength without rereading full identity sources.

## Open decisions before freeze
1. Should the canonical fingerprint wrapper be `gefpf:v1:<algorithm>:<digest>` or a structured object only, avoiding a custom string grammar?
2. Should the `PROJECT_ONLY` binding carry a separate tiny fingerprint of `projectId`, or simply carry validated `projectId` directly?
3. Should unresolved repository identity block generation of the base identity-state fingerprint, or only block `REPOSITORY_BOUND` consumers?
4. Should fingerprint delta classification be mandatory output on every recomputation or generated only when a previous manifest is supplied?

## Session completion rule
S02 becomes `FROZEN` after these four decisions are resolved and exact-head review confirms correct ownership boundaries with S01, S03, M25/M28 and M37.

STOP CONDITION: `PROJECT_FINGERPRINT_DECISIONS_REQUIRED`.
