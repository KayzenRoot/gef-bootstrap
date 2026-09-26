# GBS-M03-S03 — Repository Identity

Status: `FROZEN`

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

## Frozen contract

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

Provider-specific stable repository IDs may strengthen identity when available, but the generic core cannot require GitHub.

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

### RI-08 — Local-only repositories are first-class and use explicit persisted binding
A Git repository with no remote may still be governed. Its repository identity state is `RESOLVED_LOCAL_ONLY`, but durable repository-bound identity requires an explicit persisted `repositoryBindingId` in governed project metadata.

That identifier:
- is generated only during explicit adoption/binding;
- is opaque and non-semantic;
- does not depend on absolute path, machine identity, clock time, branch, HEAD or Git object history;
- is preserved across normal clone/backup of the same governed lineage;
- changes only through an explicit rebinding/rekey-class operation.

Git structural facts alone are insufficient as durable local-only identity because histories may legitimately rewrite or collide across independently created repositories.

### RI-09 — Multiple remotes require policy, not guessing
If multiple remotes normalize to different repository candidates, GEF must not assume `origin` is canonical merely because of its name. Selection requires an explicit governed binding or a single unambiguous candidate under frozen policy.

### RI-10 — Formal adoption persists the selected repository binding
Even when exactly one safe remote candidate exists, formal adoption records the selected repository binding explicitly in governed project metadata. Automatic single-candidate discovery may propose the binding, but canonicalization requires explicit materialization under the adoption transaction.

This avoids future reinterpretation if additional remotes appear or aliases change.

### RI-11 — Stable provider ID has precedence for equality when trusted
When both a normalized locator and a trusted stable provider repository ID are available, the provider-stable ID is the stronger equality anchor for the remote-bound repository identity. The normalized locator remains descriptive/audit metadata and supports provider-neutral fallback.

A locator rename/transfer therefore does not imply a repository-identity change when the same trusted stable provider ID proves continuity. If the stable ID is absent or cannot be trusted, locator change is reported as `REPOSITORY_BINDING_CHANGED` rather than guessed equivalent.

### RI-12 — Path case remains opaque in the provider-neutral core
The generic core does not globally lowercase or otherwise normalize repository-path case. Case equivalence is delegated to provider/profile-specific rules where semantics are known and testable.

This prevents cross-provider collisions and silent identity corruption on case-sensitive hosts.

### RI-13 — Repository projection is structured and minimal
The S02 projection conceptually carries:
```text
RepositoryIdentityProjection
  schemaVersion
  state
  bindingKind            # REMOTE | LOCAL
  normalizedLocator?     # credential-free, transport-normalized
  stableProviderId?      # optional provider-neutral slot
  localBindingId?        # explicit persisted local-only governed binding
  normalizationVersion
```

Remote names, absolute paths, branch, HEAD SHA, dirty status and timestamps are excluded. Those belong to operational/exact-state binding, not repository identity.

### RI-14 — Token economy
Once repository identity is resolved, downstream contexts carry the compact normalized projection/fingerprint rather than every configured remote. Raw remote data is expanded only for mismatch, ambiguity or audit.

## Security and privacy invariants
- credential material is never persisted in normalized identity;
- spoofed/untrusted remote text is validated before use;
- host/path normalization is deterministic and versioned;
- case normalization is provider/filesystem-policy aware, never guessed globally;
- stable provider IDs are trusted only through the owning provider contract;
- identity equality grants no authorization;
- ambiguous remotes fail closed for `REPOSITORY_BOUND`.

## Required future proof
Implementation must eventually prove:
1. SSH/HTTPS forms of a provably equivalent remote normalize equally;
2. credentials/query/fragment never enter projection;
3. changing remote alias only does not change identity;
4. changing local checkout path only does not change identity;
5. no-remote repositories require and can use an explicit persisted local binding ID;
6. multiple conflicting candidates fail closed;
7. trusted provider-stable ID preserves identity across locator rename where available;
8. adoption persists the selected binding even for a single remote candidate;
9. provider-neutral core preserves path case and delegates equivalence correctly;
10. branch/HEAD/dirty state do not contaminate repository identity;
11. unresolved/conflicted state cannot satisfy `REPOSITORY_BOUND`;
12. normalized projection is compact and versioned.

## Resolved freeze decisions
1. `RESOLVED_LOCAL_ONLY` requires explicit persisted `repositoryBindingId`: **RESOLVED YES**.
2. Trusted stable provider repository ID takes precedence for equality over normalized host/path when both exist: **RESOLVED YES**.
3. Formal adoption persists the selected repository binding even when one safe remote candidate exists: **RESOLVED YES**.
4. Repository path case is opaque in the generic core and delegated to provider/profile-specific semantics: **RESOLVED YES**.

## Session completion rule
Planning content is frozen. Exact-head semantic review must confirm no ownership conflict with M04/M29/M30 and S04, then checkpoint advances to `GBS-M03-S04`.

STOP CONDITION: `M03_S03_EXACT_HEAD_REVIEW_REQUIRED`.
