# GBS-M03-S01 — Project ID

Status: `IN_DISCUSSION`

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

## Candidate frozen contract

### PID-01 — Project ID is opaque and non-semantic
`projectId` identifies the governed project lineage. It MUST NOT encode project name, owner, repository URL, filesystem path, GitHub organization, machine, branch, technology stack, security class or business meaning.

No policy decision may be inferred from the ID itself.

### PID-02 — ID is generated once at formal adoption
A new governed project receives one ID during explicit GEF adoption/bootstrap. Generation is a bounded deterministic operation around an injected cryptographically secure random source.

Candidate format:
`gefproj_<uuid-v4-lowercase>`

Example shape only:
`gefproj_550e8400-e29b-41d4-a716-446655440000`

The prefix provides type recognition; UUID v4 supplies high-entropy uniqueness without requiring network coordination or leaking creation time.

### PID-03 — Canonical storage is project configuration
The canonical project ID is persisted as an M03-owned field inside tracked `.gef/project.json`, using the M02 schema/versioning mechanism. M02 owns structural config mechanics; M03 owns the meaning and lifecycle of the field.

Conceptual fragment:
```json
{
  "schemaVersion": "1.0",
  "configVersion": "1.0",
  "adopted": true,
  "projectId": "gefproj_<uuid-v4>"
}
```

No duplicate canonical ID file is created.

### PID-04 — Stable across location/provider changes
Changing any of the following MUST NOT change `projectId`:
- local checkout directory;
- drive or operating system;
- Git remote URL;
- GitHub owner/repository name;
- default branch;
- repository visibility;
- workstation;
- ordinary backup/restore;
- ordinary clone used as another checkout of the same governed project.

Those facts belong to repository identity/fingerprint layers, not project identity.

### PID-05 — Immutable under normal operation
Once committed as part of formal adoption, `projectId` is immutable in normal configuration editing, migration, upgrade and bootstrap replay.

Any requested change is a dedicated `REKEY` semantic operation owned by S04 and must never occur as a side effect of migration, merge, repair or config normalization.

### PID-06 — Copy versus fork semantics
A byte-for-byte repository copy/backup/clone initially preserves `projectId`, because it represents the same governed project lineage until explicitly declared otherwise.

If a copy is intentionally turned into an independent project, it MUST undergo an explicit rekey/fork-adoption operation before independent governed state is promoted. Silent ID regeneration is prohibited.

### PID-07 — Missing/invalid identity fails before governed mutation
After formal adoption, missing, malformed, duplicated or semantically conflicting project identity is a precondition/integrity block. GEF must not guess identity from path, Git remote or project name.

For a genuinely unadopted repository, absence is descriptive truth and the explicit adoption flow may create a new ID.

### PID-08 — Equality is exact canonical ID equality
Two project identity values are equal only after canonical syntax normalization and exact ID equality. Names, paths, remotes, fingerprints or repository IDs cannot substitute for `projectId` equality.

The canonical textual form is lowercase and round-trippable without locale-sensitive transformation.

### PID-09 — No registry/network dependency for generation
Project ID generation is local-first and requires no GitHub, central registry, DNS, network call or global service. Registries may later index the ID but cannot become its authority.

### PID-10 — Minimal context/token footprint
Once validated, downstream prompts and machine contracts should carry `projectId` as a compact stable identity token rather than repeatedly restating path, remote, project name and other mutable identifiers.

Identity validation may reuse a compact validity/fingerprint receipt until relevant input changes.

## Security and privacy properties
- ID contains no secret and no personal data by construction.
- ID generation uses a cryptographically secure random source when creating a new project.
- deterministic test fixtures inject the generator rather than weakening production randomness.
- project ID alone grants no authorization or trust.
- externally supplied IDs are untrusted until syntax and project-state binding are validated.

## Required future proof
Implementation must eventually prove:
1. generated IDs satisfy canonical syntax;
2. independent secure generations do not deterministically collide;
3. generation can be injected in tests;
4. project ID survives path/remote/platform changes;
5. normal config merge/migration cannot rewrite it;
6. missing/invalid adopted identity fails closed;
7. unadopted repository remains distinguishable from corrupt adopted state;
8. clone/copy preserves identity by default;
9. rekey requires an explicit separate operation;
10. no GitHub/network dependency is used to establish identity.

## Open decisions before freeze
1. Freeze `gefproj_<uuid-v4-lowercase>` as the canonical syntax, or use bare UUID?
2. Should `projectId` become mandatory in `.gef/project.json` immediately for every formally adopted project, including legacy/brownfield adoption?
3. Should an already-adopted legacy project missing `projectId` be treated as corrupt, or as a one-time explicit identity-bootstrap migration state?
4. Should UUID generation remain implementation-agnostic at contract level or explicitly require RFC-compatible v4 semantics?

## Session completion rule
S01 becomes `FROZEN` only after these four decisions are resolved and exact-head semantic review confirms no ownership conflict with M02, S02-S04, M04 or M19.

STOP CONDITION: `PROJECT_ID_DECISIONS_REQUIRED`.
