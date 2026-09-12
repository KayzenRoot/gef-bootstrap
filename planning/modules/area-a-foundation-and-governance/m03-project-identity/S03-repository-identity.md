# GBS-M03-S03 — Repository Identity

Status: `IN_DISCUSSION`

## Purpose
Define the normalized provider-neutral repository identity projection consumed by `REPOSITORY_BOUND` project fingerprints without treating mutable local paths, remote aliases or credential-bearing URLs as canonical identity.

## Binding sources
- `GBS-M03-S01 — Project ID` FROZEN
- `GBS-M03-S02 — Project Fingerprint` FROZEN
- completed M01/M02 contracts
- frozen Architecture, Security, Source Hierarchy and DoD

## Ownership boundary
S03 OWNS:
- repository identity projection semantics;
- normalization of repository/remotes into identity facts;
- resolved/unresolved/conflicted repository identity states;
- provider-neutral binding shape consumed by S02;
- local-only repository identity fallback semantics.

S03 DOES NOT OWN:
- Git command implementation (M29);
- broad repository discovery (M04);
- GitHub provider API semantics (M30+);
- project ID generation/rekey (S01/S04);
- content integrity hashes (M37).

## Candidate contract

### RI-01 — Repository identity is distinct from project identity
A governed project may have zero, one or multiple repository bindings over its lifetime. Repository identity describes the repository substrate/binding; it does not replace `projectId`.

### RI-02 — Raw local path is never canonical repository identity
Checkout path, drive letter, mount point, username and filesystem spelling are excluded from canonical repository identity. Moving a clone cannot change repository identity by itself.

### RI-03 — Remote aliases are observations, not identity
Names such as `origin`, `upstream` or custom remote aliases are local configuration labels. They are not canonical identity fields.

### RI-04 — Credential-bearing URL material is stripped before normalization
Userinfo, embedded credentials, access tokens, query parameters and fragments must never enter repository identity or fingerprint inputs.

### RI-05 — Provider-neutral normalized remote locator
When a trustworthy repository remote exists, normalize it into a provider-neutral locator conceptually containing:
```text
RepositoryRemoteIdentity
  transportIndependentHost
  normalizedRepositoryPath
  providerHint?            # descriptive only
```

Equivalent SSH/HTTPS locators for the same host/path should normalize to the same logical locator when equivalence can be proven deterministically.

Examples of transport differences that must not create distinct identity by themselves:
- `git@github.com:owner/repo.git`
- `https://github.com/owner/repo.git`

Provider-specific numeric IDs may later strengthen identity when available, but the generic core cannot require GitHub.

### RI-06 — Repository root fact is local evidence, not global identity
The fact that an invocation is inside one Git work tree/root is required to bind operations safely, but the absolute root path remains operational evidence rather than canonical repository identity.

### RI-07 — Repository identity states are explicit
Repository resolution yields one of:
- `RESOLVED_REMOTE_BOUND`
- `RESOLVED_LOCAL_ONLY`
- `UNRESOLVED_NO_REPOSITORY`
- `CONFLICT_MULTIPLE_CANONICAL_CANDIDATES`
- `INVALID_OR_UNSAFE_REMOTE`

Consumers may not silently collapse conflict/invalid states into a resolved binding.

### RI-08 — Local-only repositories are first-class
A Git repository with no remote may still be governed. Its repository identity state is `RESOLVED_LOCAL_ONLY` and uses a local repository lineage descriptor that does not depend on absolute path, machine identity or clock time.

Candidate local lineage source is an explicit GEF repository-binding identifier stored as governed project metadata when repository-bound assurance is required. S03 does not silently derive a durable cross-machine identity from Git object history because unrelated repositories can share roots/history and history can be rewritten legitimately.

### RI-09 — Multiple remotes require policy, not guessing
If multiple remotes normalize to different repository candidates, GEF must not assume `origin` is canonical merely because of its name. Selection requires an explicit governed binding or a single unambiguous candidate under frozen policy.

### RI-10 — Repository rename/move may preserve or change binding depending on proof
Provider repository renames/transfers can change normalized locator while representing the same hosted repository. A provider-stable repository identifier, when available and trusted, may preserve repository identity across locator rename. Without such evidence, locator change is reported as `REPOSITORY_BINDING_CHANGED` rather than guessed equivalent.

### RI-11 — Repository projection is structured and minimal
The S02 projection conceptually carries:
```text
RepositoryIdentityProjection
  schemaVersion
  state
  bindingKind            # REMOTE | LOCAL
  normalizedLocator?     # credential-free, transport-normalized
  stableProviderId?      # optional provider-neutral slot
  localBindingId?        # only for explicit local-only governed binding
  normalizationVersion
```

Remote names, absolute paths, branch, HEAD SHA, dirty status and timestamps are excluded. Those belong to operational/exact-state binding, not repository identity.

### RI-12 — Token economy
Once repository identity is resolved, downstream contexts carry the compact normalized projection/fingerprint rather than every configured remote. Raw remote data is expanded only for mismatch, ambiguity or audit.

## Security and privacy invariants
- credential material is never persisted in normalized identity;
- spoofed/untrusted remote text is validated before use;
- host/path normalization is deterministic and versioned;
- case normalization is provider/filesystem-policy aware, never guessed globally;
- identity equality grants no authorization;
- ambiguous remotes fail closed for `REPOSITORY_BOUND`.

## Required future proof
Implementation must eventually prove:
1. SSH/HTTPS forms of a provably equivalent remote normalize equally;
2. credentials/query/fragment never enter projection;
3. changing remote alias only does not change identity;
4. changing local checkout path only does not change identity;
5. no-remote repositories can enter an explicit local-only governed binding;
6. multiple conflicting candidates fail closed;
7. provider-stable ID can preserve identity across rename where available;
8. branch/HEAD/dirty state do not contaminate repository identity;
9. unresolved/conflicted state cannot satisfy `REPOSITORY_BOUND`;
10. normalized projection is compact and versioned.

## Open decisions before freeze
1. Should `RESOLVED_LOCAL_ONLY` require an explicit persisted `repositoryBindingId`, or can Git repository structural facts safely supply local-only identity without persistence?
2. For remote-bound identity, should a stable provider repository ID take precedence over normalized host/path when both exist?
3. When exactly one remote candidate exists, may it become canonical without explicit user binding, or should formal adoption always persist the selected binding?
4. Should normalization treat repository path case as opaque by default and delegate case-equivalence to provider-specific profiles?

## Session completion rule
S03 becomes `FROZEN` after these four decisions are resolved and exact-head semantic review confirms ownership boundaries with M04/M29/M30 and S04.

STOP CONDITION: `REPOSITORY_IDENTITY_DECISIONS_REQUIRED`.
