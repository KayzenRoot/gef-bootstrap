# GBS-M03-S01 — Project ID

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze the canonical project identity primitive used across GEF Bootstrap. Project identity must remain stable across path changes, repository renames, remotes, machines, operating systems and ordinary clones, while remaining distinct from repository identity, project fingerprint and human-facing project name.

## Binding sources
- `GBS-CONSTITUTION-v1.1`
- frozen Project Overview, Requirements, Scope, Architecture, Security, DoD and Deployment
- completed `GBS-M01` kernel contracts
- completed `GBS-M02` configuration/schema contracts
- Master Module Index and current checkpoint

## Ownership boundary
S01 OWNS:
- semantic meaning of `projectId`;
- generation requirements;
- immutability contract;
- persisted representation/binding;
- equality semantics;
- clone/copy preservation rule;
- explicit rekey boundary.

S01 DOES NOT OWN:
- mutable project fingerprint composition (S02);
- Git/repository identity and remotes (S03);
- collision/rekey workflow and duplicate detection (S04);
- project discovery (M04);
- project registry/index (M19);
- source authority beyond identity semantics.

## Frozen project ID contract

### PID-01 — Project ID is opaque and non-semantic
`projectId` identifies the governed project lineage. It MUST NOT encode project name, owner, repository URL, filesystem path, GitHub organization, machine, branch, technology stack, security class or business meaning. No policy decision may be inferred from the ID itself.

### PID-02 — Canonical syntax is bare lowercase UUIDv4
The canonical textual form is an RFC 9562-compatible UUID version 4 rendered in lowercase canonical hexadecimal-with-hyphens form, with no GEF-specific prefix.

Example shape only:
`550e8400-e29b-41d4-a716-446655440000`

The `projectId` field already provides type context, so adding `gefproj_` would duplicate information in every prompt, receipt and machine contract. UUIDv4 supplies local-first high-entropy uniqueness without network coordination or embedded creation time.

### PID-03 — ID is generated once at formal adoption
A new governed project receives one ID during explicit GEF adoption/bootstrap. Production generation requires an injected cryptographically secure random source implementing UUIDv4 semantics. Deterministic tests inject a controlled generator rather than weakening production randomness.

### PID-04 — Canonical storage is project configuration
The canonical project ID is persisted as an M03-owned mandatory field inside tracked `.gef/project.json`, using M02 schema/versioning mechanics. M02 owns structural config mechanics; M03 owns meaning and lifecycle.

Conceptual fragment:
```json
{
  "schemaVersion": "1.0",
  "configVersion": "1.0",
  "adopted": true,
  "projectId": "550e8400-e29b-41d4-a716-446655440000"
}
```

No duplicate canonical ID file is created.

### PID-05 — Mandatory for every formally adopted project
Every project considered fully GEF-adopted MUST have a valid `projectId`. This includes new projects and brownfield projects after their adoption transaction completes.

A pre-M03 or legacy project that already carries adoption markers but lacks `projectId` is not silently declared corrupt and is not silently assigned an ID. It enters the explicit transitional state `IDENTITY_BOOTSTRAP_REQUIRED`. A governed one-time identity-bootstrap operation must generate, preview and persist the ID before further identity-dependent governed mutation.

Once this transition is completed, a missing `projectId` is an integrity/precondition failure.

### PID-06 — Stable across location/provider changes
Changing local directory, drive, operating system, Git remote URL, GitHub owner/repository name, default branch, visibility, workstation, backup/restore or ordinary checkout/clone MUST NOT change `projectId`. Those facts belong to repository identity/fingerprint layers.

### PID-07 — Immutable under normal operation
Once persisted, `projectId` is immutable in normal configuration editing, migration, upgrade, bootstrap replay and repair. Any requested change is a dedicated `REKEY` semantic operation owned by S04 and can never occur as an incidental migration/normalization effect.

### PID-08 — Copy versus fork semantics
A byte-for-byte repository copy, backup or ordinary clone preserves `projectId`, because it initially represents the same governed project lineage. If a copy is intentionally turned into an independent project, it MUST undergo explicit rekey/fork-adoption before independent governed state is promoted. Silent regeneration is prohibited.

### PID-09 — Missing/invalid identity fails closed
After identity bootstrap, missing, malformed, non-v4, noncanonical, duplicated or semantically conflicting identity blocks identity-dependent governed mutation. GEF MUST NOT infer identity from path, repository remote, project name or provider metadata.

A genuinely unadopted repository remains distinguishable from an adopted project with invalid identity.

### PID-10 — Equality is canonical exact equality
Two project identities are equal only when both are valid canonical UUIDv4 values and their canonical lowercase strings are exactly equal. Name, path, remote, fingerprint and repository ID are evidence/context, never substitutes for project identity equality.

### PID-11 — No registry/network dependency
Generation and validation require no GitHub, central registry, DNS, network call or global service. Registries may later index `projectId`, but cannot become its semantic authority.

### PID-12 — Minimum identity context
Once validated, downstream machine contracts and prompts should carry the compact `projectId` plus only the specific mutable identity facts required for that operation. They should not repeatedly restate path, remote, name and provider identity merely to identify the project.

Identity validation may be reused through fingerprint-bound receipts until relevant inputs change.

## Security and privacy properties
- `projectId` contains no secret or personal data by design.
- production generation uses cryptographically secure UUIDv4 randomness.
- test determinism is provided by dependency injection.
- project ID alone grants no authorization or trust.
- externally supplied IDs are untrusted until syntax and project-state binding are validated.
- malformed or legacy transitional identity cannot silently downgrade to a guessed identity.

## Required future proof
Implementation must eventually prove:
1. generated IDs conform to RFC-compatible UUIDv4 canonical lowercase syntax;
2. independent secure generations do not deterministically collide;
3. generation is injectable in tests;
4. ID survives path/remote/platform changes;
5. normal config merge/migration cannot rewrite it;
6. new formal adoption requires project ID;
7. legacy adopted state without ID becomes `IDENTITY_BOOTSTRAP_REQUIRED` and is not guessed;
8. post-bootstrap missing/invalid identity fails closed;
9. clone/copy preserves identity by default;
10. rekey requires an explicit separate operation;
11. no GitHub/network dependency establishes identity;
12. downstream identity receipts are invalidated when the canonical project config identity field changes.

## Resolved freeze decisions
1. Canonical syntax: **bare lowercase RFC-compatible UUIDv4**.
2. `projectId` mandatory after formal adoption: **YES**.
3. Legacy adopted project missing ID: **explicit one-time `IDENTITY_BOOTSTRAP_REQUIRED` transition, never guess/silent generation**.
4. Generation semantics: **explicit UUIDv4 contract, not implementation-defined opaque randomness**.

## Session completion rule
Planning content is frozen-candidate. Final `FROZEN` requires exact-head review, merge and checkpoint advancement to `GBS-M03-S02`.

STOP CONDITION: `M03_S01_EXACT_HEAD_REVIEW_REQUIRED`.
