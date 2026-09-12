# GBS-M03-S04 — Collision Prevention

Status: `IN_DISCUSSION`

## Purpose
Define how GEF detects, classifies and safely resolves project/repository identity collisions without silent ID regeneration, implicit fork creation or destructive repair.

## Binding sources
- `GBS-M03-S01 — Project ID` FROZEN
- `GBS-M03-S02 — Project Fingerprint` FROZEN
- `GBS-M03-S03 — Repository Identity` FROZEN
- frozen Architecture, Security, DoD and Recovery principles

## Ownership boundary
S04 OWNS:
- identity-collision classes;
- duplicate-lineage detection semantics;
- rekey/rebind eligibility and safety contract;
- explicit fork-adoption semantics;
- collision receipts and invalidation consequences.

S04 DOES NOT OWN:
- generic project discovery (M04);
- filesystem transaction implementation (M05/M06);
- project registry storage/indexing (M19);
- provider API implementation (M30+);
- broad proof invalidation implementation (M25/M37).

## Candidate contract

### CP-01 — Collision is a first-class blocked state
GEF never repairs identity ambiguity by silently generating a new `projectId` or `repositoryBindingId`. A collision blocks governed mutation until classified and resolved through an explicit operation.

### CP-02 — Collision classes are distinct
At minimum classify:
- `PROJECT_ID_REPOSITORY_MISMATCH`: same project ID presented with incompatible repository binding;
- `DUPLICATE_PROJECT_LINEAGE`: same project ID intentionally/accidentally appears in multiple independent lineages;
- `REPOSITORY_BOUND_TO_DIFFERENT_PROJECT`: same repository identity is already governed by a different project ID under authoritative evidence;
- `LOCAL_BINDING_COLLISION`: duplicate local `repositoryBindingId` appears where independent repository lineage is claimed;
- `PROVIDER_BINDING_CONFLICT`: trusted provider-stable ID conflicts with persisted locator/binding;
- `STALE_IDENTITY_ARTIFACT`: carried fingerprint/receipt refers to an older legitimate binding state;
- `AMBIGUOUS_COPY_OR_FORK`: copy cannot yet be classified as same-lineage clone or independent project.

These classes drive remediation. They are not interchangeable generic “ID errors”.

### CP-03 — Same-lineage clone is not a collision
Multiple ordinary clones/checkouts sharing the same `projectId` and compatible repository identity are valid representations of one governed project. Local path/machine differences do not create collision.

### CP-04 — Independent fork requires explicit fork-adoption
When a copied repository becomes a new independent project, the operator must explicitly declare fork-adoption. The operation creates a new `projectId` and, when applicable, a new local repository binding or new persisted remote binding relationship.

The old identity is preserved in the fork-adoption receipt as lineage provenance but is not retained as the new project's canonical identity.

### CP-05 — Rekey and rebind are separate operations
- `REKEY_PROJECT`: changes `projectId` because governed project lineage is intentionally split/re-established.
- `REBIND_REPOSITORY`: changes the canonical repository binding while preserving `projectId` when project lineage remains the same.

They may be orchestrated together for fork-adoption, but neither may be smuggled into config migration, repair, upgrade or bootstrap replay.

### CP-06 — Rekey/rebind requires expected-state binding
Any identity-changing operation must bind to the exact currently validated project ID, repository projection/fingerprint and target config fingerprint. If those inputs drift before apply, the plan becomes stale and must be recomputed.

### CP-07 — Preview before mutation
Identity-changing operations produce a deterministic preview containing:
- collision class/reason;
- current identity/binding;
- proposed new identity/binding;
- affected governed files;
- artifacts/proofs expected to invalidate;
- recovery material requirements;
- whether external provider actions are required;
- irreversible/partially reversible implications.

Preview never mutates.

### CP-08 — Explicit acknowledgement for lineage split
Creating a new independent project from a copy/fork is semantically significant. Apply requires explicit acknowledgement that:
- a new project lineage is being created;
- previous project-bound evidence/checkpoints do not automatically carry to the new lineage;
- repository/provider history may remain shared while governance identity diverges.

No default “yes” is allowed.

### CP-09 — Historical provenance is retained, not used as authority
Rekey/fork receipts may carry `previousProjectId`, previous repository projection fingerprint and reason code. This provenance supports audit but cannot authorize the new project or satisfy current binding by itself.

### CP-10 — Collision resolution invalidates narrowly but safely
A `REKEY_PROJECT` invalidates every artifact whose validity depends on the prior project identity. A pure `REBIND_REPOSITORY` invalidates repository-bound artifacts but need not invalidate project-only artifacts.

More specific proof invalidation is delegated to M25/M37, but S04 defines the minimum semantic invalidation boundary.

### CP-11 — Provider conflicts fail closed
If a trusted provider-stable repository ID contradicts persisted canonical binding, GEF does not prefer the local file or remote observation silently. State becomes `PROVIDER_BINDING_CONFLICT` until explicit resolution establishes which source is current under source-authority rules.

### CP-12 — Registry observations are evidence, not sole authority
Future M19 registry data may reveal duplicate IDs across known projects, but registry absence does not prove uniqueness and registry presence cannot automatically rekey a repository. Registry findings participate in collision diagnosis under source authority.

### CP-13 — Collision checks are bounded
Routine identity validation checks only already-known identity/binding inputs and configured registry/index evidence. It does not scan the filesystem, organization or internet looking for globally duplicated UUIDs.

This preserves local-first behavior, latency and token economy.

### CP-14 — Receipts are compact and link old/new state
Successful rekey/rebind/fork-adoption emits a structured receipt containing at least:
```text
IdentityTransitionReceipt
  operation
  reason
  oldProjectId
  newProjectId?
  oldRepositoryProjectionFingerprint?
  newRepositoryProjectionFingerprint?
  oldIdentityFingerprint
  newIdentityFingerprint
  invalidationClasses
  recoveryReference?
  externalEffects?
```

Secrets, raw credentials and broad source snapshots are excluded.

## Security and reliability invariants
- no silent identity regeneration;
- no identity change from ordinary migration/normalization;
- no collision resolution from path/name similarity alone;
- external provider actions are separately authorized and receipted;
- stale transition plans fail before mutation;
- destructive reset/history rewrite is never implied by identity repair;
- previous identifiers remain audit provenance only;
- ambiguous collision remains blocked rather than guessed.

## Required future proof
Implementation must eventually prove:
1. same-lineage clones do not false-positive as collisions;
2. incompatible project/repository pairing is detected;
3. independent fork requires explicit fork-adoption acknowledgement;
4. rekey cannot occur through ordinary config migration;
5. rebind can preserve project ID while changing repository-bound fingerprint;
6. stale transition preview cannot apply;
7. project rekey invalidates project-bound artifacts;
8. repository-only rebind preserves eligible project-only artifacts;
9. provider binding conflict fails closed;
10. no broad filesystem/network scan is used for ordinary collision checks;
11. transition receipt links old/new state without leaking secrets;
12. registry observations never trigger automatic rekey.

## Open decisions before freeze
1. Should `REKEY_PROJECT` always require a brand-new UUIDv4 generated at apply time, or may an externally supplied validated project ID be accepted for controlled import/recovery?
2. Should fork-adoption preserve a machine-readable `parentProjectId` field in canonical project config, or keep lineage provenance only in transition receipts/ledger?
3. Should a pure `REBIND_REPOSITORY` at `STANDARD` assurance require interactive/operator acknowledgement, or can a fully specified Work Order authorize it without another prompt?
4. When duplicate `projectId` is detected only through M19 registry evidence but repository bindings differ, should the state immediately block all governed mutation or only operations requiring cross-project uniqueness claims?

## Session completion rule
S04 becomes `FROZEN` after these four decisions are resolved and exact-head review confirms alignment with Security, Recovery, M19 and M25/M37. After S04, execute the M03 module gate before implementation.

STOP CONDITION: `COLLISION_PREVENTION_DECISIONS_REQUIRED`.
