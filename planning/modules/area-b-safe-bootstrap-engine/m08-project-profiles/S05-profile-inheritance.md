# GBS-M08-S05 — Profile Inheritance

Status: `FROZEN`

## Purpose
Freeze deterministic, bounded and fail-closed profile inheritance for M08. S05 defines how one profile may extend one exact parent profile without introducing ambiguous merge precedence, hidden authority, cyclic graphs, moving parent references or last-write-wins behavior.

S05 deliberately chooses **single-parent inheritance** for the initial production contract. Multiple inheritance, mixins and arbitrary overlays are not admitted. This keeps profile composition auditable and makes semantic identity/provenance tractable.

S05 is declarative and S0 read-only. It performs no repository mutation, template fetching, process execution, package installation, network/provider access or secret acquisition.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M08_S05`;
- frozen M08-S01 Generic Profile;
- frozen M08-S02 TypeScript/Node profile;
- frozen M08-S03 Python profile;
- frozen M08-S04 Web/App profile;
- completed M00-M07 public contracts;
- M02 strict schema/versioning/provenance rules;
- M03 identity separation;
- M04 bounded discovery/explicit-input rules;
- M07 template/profile-binding authority;
- M05/M06 effect/path authority;
- frozen Architecture/Security/Requirements/Scope/DoD/Test Plan;
- M09 source/template resolution;
- M37 integrity/trust policy;
- M51 compatibility policy;
- M63 performance budgets.

## Ownership boundary
M08-S05 OWNS:
- the versioned parent-reference field for project profiles;
- exact parent identity/version/digest binding;
- single-parent graph rules and cycle/depth detection;
- deterministic inherited semantic/template-binding composition;
- conflict and duplicate behavior;
- composed profile semantic identity/provenance;
- bounded/cancellable composition and typed errors.

M08-S05 DOES NOT OWN:
- S01 selection/default semantics;
- technology semantics owned by S02-S04;
- template variable/type/valueClass rules (M07);
- arbitrary custom-profile discovery or repository scanning;
- trust/signature policy (M37);
- source fetching/catalog resolution (M09);
- effect/path authority (M05/M06);
- process/network/provider authority.

## Manifest extension
S05 adds one optional semantic field:

```text
ProjectProfile {
  ...S01-S04 fields...
  parentProfile? {
    profileId
    profileVersion
    profileSemanticDigest
  }
}
```

A parent reference is exact and immutable for the child semantic revision.

## Frozen inheritance contract

### INH-01 — Initial contract is single-parent only
A profile may have zero or one parent. Arrays of parents, mixins, traits, multiple inheritance, overlay stacks and implicit fallback chains are not admitted.

### INH-02 — Parent reference is exact
A parent reference MUST bind exact `profileId`, exact canonical `profileVersion` and exact `profileSemanticDigest`.

Ranges, wildcards, `latest`, moving tags, branch names and “nearest compatible” resolution are forbidden.

### INH-03 — Parent source resolution is external to composition
S05 consumes an already admitted exact parent snapshot from an explicit source/registry port. It does not search repositories, catalogs, networks or package registries for a parent.

### INH-04 — Missing or mismatched parent fails closed
Absent parent snapshot, ID mismatch, version mismatch or digest mismatch blocks composition. There is no silent fallback to generic or another parent.

### INH-05 — Graphs must be acyclic
A profile may not directly or transitively extend itself. Cycle detection uses canonical exact profile identities/digests, not display names or source paths.

### INH-06 — Inheritance depth is bounded
Future implementation MUST enforce a finite maximum parent-chain depth. The implementation Work Order must select/test a concrete bound; exceeding it returns `PROFILE_INHERITANCE_DEPTH_EXCEEDED`, never partial composition.

### INH-07 — Generic may be a parent, never an ambient hidden parent
A specialized profile may explicitly extend the exact product-owned `generic` profile. Generic is not automatically inserted as a hidden parent if no parent is declared.

### INH-08 — Parent semantics remain immutable
Composition never mutates a parent snapshot. Child and parent snapshots remain independently identifiable and auditable.

### INH-09 — Child identity remains distinct
A child profile never becomes the parent identity. Its `profileId`, `profileVersion`, `profileKind` and semantic digest remain child-owned.

### INH-10 — Core identity fields never inherit by overwrite
`schemaVersion`, `profileContractVersion`, `profileId`, `profileVersion` and `profileKind` are validated on the child itself. A child cannot omit them and “borrow” identity from a parent.

### INH-11 — Specialized semantic blocks are namespace-owned
Technology/application semantic blocks remain owned by their defining profile contracts. A child may carry a block only when its profile kind/contract admits that block.

Inheritance cannot reinterpret a parent TypeScript/Python/Web semantic field under a different meaning.

### INH-12 — Parent template bindings are inherited additively
The parent's admitted `templateBindings` become part of the composed profile unless a conflict is detected. Child bindings are then added by stable `bindingId`.

### INH-13 — Duplicate binding IDs are conflicts, not overrides
If parent and child contain the same `bindingId`, composition fails unless the two binding records are semantically byte/canonical-equivalent under the active contract. There is no child-wins or parent-wins rule.

### INH-14 — Conflicting references to the same template identity fail
If parent and child use different binding IDs that point to the same exact template identity but supply different variable bindings or semantic expectations, composition fails. A different ID cannot be used to smuggle an override.

### INH-15 — Exact duplicate binding content may deduplicate
Semantically identical parent/child binding records may collapse to one canonical binding in the composed view. The composed evidence records both provenance edges without duplicating output semantics.

### INH-16 — Variable binding conflicts are not merged
S05 does not merge variable maps by last-write-wins. Profile variable semantics stay inside each exact template binding; conflicting duplicate bindings fail under INH-13/14.

### INH-17 — M07 precedence is unchanged
Inheritance does not add a new M07 precedence layer. After composition, effective profile candidates still occupy the single existing `PROFILE_BINDING` layer beneath `EXPLICIT_INPUT` and above template defaults.

### INH-18 — Inheritance cannot alter M07 declarations
A parent or child cannot use composition to create template variables, change types, change `valueClass`, broaden contexts, broaden binding sources or bypass unknown-binding failure.

### INH-19 — Inheritance cannot widen authority
No parent field can grant filesystem, overwrite, delete/move, process, network, provider, secret, package-install or deployment authority to a child.

### INH-20 — Inert extensions stay inert through composition
Unknown namespaced extensions remain inert. Composition cannot turn an inert extension into output-relevant or authority-granting behavior.

### INH-21 — Display metadata has no merge authority
Parent display metadata does not affect child selection, semantic identity or execution. Future UI may choose presentation fallback rules separately; they are not S05 semantic composition.

### INH-22 — Composition order is canonical
The effective chain is logically root-parent to child, but no serialized file/list/object order becomes precedence. Canonical processing uses exact parent edges and stable binding IDs.

### INH-23 — Composed semantic digest binds the full chain
The child composed semantic identity binds at least:
- child native semantic digest;
- exact parent profile ID/version/digest;
- transitively composed parent semantic digest;
- canonical effective template-binding set;
- active inheritance-contract version.

Changing any parent semantic revision changes the child's composed identity.

### INH-24 — Native and composed identity are distinct
Future implementation SHOULD retain both:
- `nativeProfileSemanticDigest` for the child's own fields;
- `composedProfileSemanticDigest` for the effective inherited result.

This prevents a parent update from masquerading as a native child edit.

### INH-25 — Composition provenance is explicit
Evidence records the exact parent chain, native/composed digests and deduplicated binding provenance without copying secret material or large template bodies.

### INH-26 — Stale parent snapshots are detectable
If a continuation/checkpoint pins a composed digest, a later different parent snapshot cannot silently substitute. Mismatch yields a stale/expectation failure and requires explicit re-resolution.

### INH-27 — Brownfield profile truth is not silently recomposed
An existing project's pinned profile chain is not replaced merely because a newer product profile/version becomes available. Adoption/upgrade policy must explicitly authorize re-resolution/migration.

### INH-28 — No implicit inheritance from repository files
Files named `extends`, `.gef/profile`, package metadata or framework config do not create profile parent edges automatically.

### INH-29 — No inheritance from environment/tool state
PATH, environment variables, installed runtimes, package managers, host OS and current directory cannot alter the parent chain.

### INH-30 — Composition is S0/read-only and startup-pure
Composition performs no writes, process/tool execution, network access, provider mutation, package installation, repository recursion or ambient environment harvesting.

### INH-31 — Resource use is bounded/cancellable
Future implementation must bound chain depth, aggregate profile bytes, aggregate bindings, provenance entries and hashing work. Cancellation/budget exhaustion returns typed non-success and never an incomplete composed profile.

### INH-32 — Typed errors
Future implementation should distinguish at least:
- `PROFILE_PARENT_REFERENCE_INVALID`;
- `PROFILE_PARENT_NOT_FOUND`;
- `PROFILE_PARENT_EXPECTATION_MISMATCH`;
- `PROFILE_INHERITANCE_CYCLE`;
- `PROFILE_INHERITANCE_DEPTH_EXCEEDED`;
- `PROFILE_INHERITANCE_BINDING_CONFLICT`;
- `PROFILE_INHERITANCE_SEMANTIC_CONFLICT`;
- `PROFILE_INHERITANCE_BUDGET_EXCEEDED`;
- `PROFILE_INHERITANCE_CANCELLED`.

## Deterministic composition algorithm
1. Strictly validate the child native profile.
2. If no parent exists, composed identity equals the canonical child-native semantics under the inheritance contract.
3. If a parent exists, require an exact admitted parent snapshot matching ID/version/digest.
4. Traverse only the exact parent edge, recursively, while enforcing cycle and depth bounds.
5. Produce an immutable composed parent snapshot.
6. Add child template bindings by stable ID.
7. Reject duplicate/conflicting bindings under INH-13/14; deduplicate only semantically identical records.
8. Preserve S02-S04 semantic namespaces without reinterpretation.
9. Compute native and composed semantic digests.
10. Emit compact provenance/evidence and hand composed profile bindings to M07 as one `PROFILE_BINDING` layer.

## Proof obligations
The M08 implementation Work Order must prove at minimum:
1. Parent refs reject ranges/latest/moving references.
2. Missing/mismatched parents fail without fallback.
3. Direct and transitive cycles fail.
4. Depth limits are enforced.
5. Multiple parents are rejected.
6. Parent snapshots remain immutable.
7. Duplicate binding IDs never use last-write-wins.
8. Same-template/different-binding conflicts fail even under different binding IDs.
9. Exact duplicate records deduplicate deterministically with provenance preserved.
10. M07 precedence remains unchanged.
11. Inheritance cannot widen M07/M05/M06/security authority.
12. Native/composed digests change under the correct semantic deltas only.
13. Host/environment/repository enumeration cannot alter the chain.
14. Brownfield pinned chains remain stable until explicit adoption/upgrade action.
15. Composition is startup-pure, S0, bounded and cancellable.

## Review checklist
- [x] S01-S04 ownership preserved.
- [x] Single-parent policy removes ambiguous merge precedence.
- [x] Exact parent identity/version/digest required.
- [x] Cycles/depth/conflicts fail closed.
- [x] No last-write-wins semantics.
- [x] M07 precedence and M05/M06 authority unchanged.
- [x] Native/composed identity and provenance separated.
- [x] Brownfield stability preserved.
- [x] S0/startup purity/bounds/cancellation explicit.

## Session completion rule
S05 may be promoted to `FROZEN` only after exact-head semantic review finds no unresolved HIGH/CRITICAL defect.

Planning earns no production credit. After checkpoint promotion, the only next legal stage is the **M08 Module Gate**. No M08 Work Order may be compiled before that gate returns implementation-ready.

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.
