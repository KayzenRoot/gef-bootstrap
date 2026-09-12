# GBS-M03-S04 — Collision Prevention

Status: `FROZEN_CANDIDATE`

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

## Frozen contract

### CP-01 — Collision is a first-class blocked state
GEF never repairs identity ambiguity by silently generating a new `projectId` or `repositoryBindingId`. An authoritative collision blocks governed mutation until classified and resolved through an explicit operation.

A registry-only suspicion that has not reached authoritative collision status is handled by CP-17 rather than silently promoted to a collision.

### CP-02 — Collision classes are distinct
At minimum classify:
- `PROJECT_ID_REPOSITORY_MISMATCH`: same project ID presented with incompatible repository binding;
- `DUPLICATE_PROJECT_LINEAGE`: same project ID intentionally/accidentally appears in multiple independent lineages;
- `REPOSITORY_BOUND_TO_DIFFERENT_PROJECT`: same repository identity is already governed by a different project ID under authoritative evidence;
- `LOCAL_BINDING_COLLISION`: duplicate local `repositoryBindingId` appears where independent repository lineage is claimed;
- `PROVIDER_BINDING_CONFLICT`: trusted provider-stable ID conflicts with persisted locator/binding;
- `STALE_IDENTITY_ARTIFACT`: carried fingerprint/receipt refers to an older legitimate binding state;
- `AMBIGUOUS_COPY_OR_FORK`: copy cannot yet be classified as same-lineage clone or independent project;
- `REGISTRY_DUPLICATE_SUSPECTED`: M19 reports a duplicate project ID with incompatible repository observations, but authoritative lineage conflict has not yet been corroborated.

These classes drive remediation. They are not interchangeable generic “ID errors”.

### CP-03 — Same-lineage clone is not a collision
Multiple ordinary clones/checkouts sharing the same `projectId` and compatible repository identity are valid representations of one governed project. Local path/machine differences do not create collision.

### CP-04 — Independent fork requires explicit fork-adoption
When a copied repository becomes a new independent project, the operator must explicitly declare fork-adoption. The operation creates a new `projectId` and, when applicable, a new local repository binding or new persisted remote binding relationship.

The old identity is preserved as lineage provenance in the transition receipt/ledger but is not retained as the new project's canonical identity.

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
Rekey/fork receipts and the governed decisions/evidence ledger may carry `previousProjectId`, previous repository projection fingerprint, reason code and lineage relation. This provenance supports audit but cannot authorize the new project or satisfy current binding by itself.

Canonical `.gef/project.json` remains focused on current project identity/binding state and does not gain a mandatory `parentProjectId` lineage field.

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

### CP-15 — New project IDs are preview-bound UUIDv4 values
Normal `REKEY_PROJECT` and fork-adoption use a brand-new cryptographically secure UUIDv4 generated by GEF while constructing the immutable transition preview, not silently during apply. The candidate ID is included in the preview fingerprint and apply must use exactly that bound value; regenerating a different ID at apply time makes the plan invalid.

A caller-supplied target `projectId` is prohibited in normal rekey/fork flows. It may be accepted only by an explicit controlled `IMPORT_RECOVERY` mode that:
- declares the external source and authority basis;
- validates canonical UUIDv4 syntax;
- proves it differs from the current project ID when a rekey is intended;
- performs bounded collision checks against available authoritative evidence;
- binds the supplied ID into the same exact-state preview/receipt path;
- requires the assurance/acknowledgement level applicable to the recovery operation.

This preserves deterministic preview, local-first secure generation and controlled disaster-recovery/import capability without making arbitrary ID injection a normal operation.

### CP-16 — STANDARD repository rebind can be non-interactive when already governed
A pure `REBIND_REPOSITORY` at `STANDARD` assurance does not require a second interactive prompt when an admitted, exact-scope Work Order explicitly authorizes the rebind and its transition preview is exact-state-bound. The Work Order plus preview/apply receipt are the authorization evidence.

`ELEVATED` and `HIGH_ASSURANCE` rebinds require explicit acknowledgement before apply. Any external provider mutation remains separately authorized and receipted regardless of assurance level.

This avoids redundant human round trips in normal automation while preserving stronger gates where risk warrants them.

### CP-17 — Registry-only duplicate evidence creates suspicion before authoritative collision
When M19 alone reports the same `projectId` against incompatible repository observations, GEF enters `REGISTRY_DUPLICATE_SUSPECTED` rather than immediately asserting `DUPLICATE_PROJECT_LINEAGE`.

While suspicion is unresolved:
- read-only diagnosis remains allowed;
- identity transition, promotion and operations that require cross-project uniqueness are blocked;
- ordinary local governed mutation may proceed only when current project/repository binding is authoritative, the operation does not rely on cross-project uniqueness, and policy does not escalate the suspicion;
- registry data cannot auto-rekey, auto-rebind or rewrite canonical project state.

Corroborating authoritative repository/project evidence promotes the state to the appropriate collision class, at which point CP-01 blocks governed mutation until explicit resolution. Stale/incorrect registry evidence may instead be repaired by M19-owned mechanisms without changing canonical project identity.

### CP-18 — Lineage provenance is ledger/receipt data, not canonical identity input
Fork/rekey lineage relationships may be recorded in transition receipts and the governed decisions/evidence ledger for traceability. They are excluded from current project identity equality, repository identity equality and the minimal canonical project configuration unless a later versioned contract explicitly introduces a separate non-authoritative metadata field.

This prevents ancestry history from bloating every identity context or accidentally becoming an authorization signal.

## Security and reliability invariants
- no silent identity regeneration;
- no identity change from ordinary migration/normalization;
- no collision resolution from path/name similarity alone;
- external provider actions are separately authorized and receipted;
- stale transition plans fail before mutation;
- destructive reset/history rewrite is never implied by identity repair;
- previous identifiers remain audit provenance only;
- ambiguous authoritative collision remains blocked rather than guessed;
- normal rekey IDs are secure UUIDv4 values bound into preview before mutation;
- arbitrary externally supplied IDs are isolated to explicit controlled import/recovery;
- registry-only evidence cannot silently override canonical local identity;
- STANDARD automation may consume explicit Work Order authorization without adding a redundant prompt.

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
12. registry observations never trigger automatic rekey;
13. normal rekey/fork generates a secure UUIDv4 before apply and binds it into the immutable preview;
14. externally supplied project IDs are rejected outside controlled import/recovery and validated inside it;
15. a STANDARD pure rebind can execute from admitted Work Order authorization without an extra prompt while ELEVATED/HIGH_ASSURANCE still require acknowledgement;
16. registry-only duplicate evidence cannot become an authoritative collision without corroboration and cannot silently rewrite canonical identity;
17. fork lineage provenance remains outside current identity equality and canonical identity authority.

## Resolved freeze decisions
1. `REKEY_PROJECT` target: **GEF generates a brand-new secure UUIDv4 during transition preview and binds it into the immutable plan; externally supplied IDs are allowed only in explicit controlled `IMPORT_RECOVERY` with validation and authority evidence**.
2. Fork lineage storage: **no mandatory `parentProjectId` in canonical project config; lineage provenance lives in transition receipts/ledger and remains non-authoritative**.
3. Pure `REBIND_REPOSITORY` at `STANDARD`: **an admitted exact-scope Work Order may authorize apply without another interactive prompt; ELEVATED/HIGH_ASSURANCE and external provider effects retain stronger acknowledgement/authorization gates**.
4. M19-only duplicate observation: **enter `REGISTRY_DUPLICATE_SUSPECTED`; block uniqueness-dependent/identity-transition promotion paths, allow only policy-safe local operations, and promote to authoritative collision only after corroboration**.

## Session completion rule
Planning content is frozen-candidate. Exact-head semantic review must confirm alignment with Security, Recovery, M19 and M25/M37. After approval/merge, update checkpoint and execute the M03 module gate before implementation.

STOP CONDITION: `M03_S04_EXACT_HEAD_REVIEW_REQUIRED`.
