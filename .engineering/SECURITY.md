# Security

Status: `IN_DISCUSSION`

## Binding
Security derives from `GBS-CONSTITUTION-v1.1`, frozen Project Overview, Requirements, complete-production Scope and frozen Architecture.

No functional implementation begins from this document until Security is reviewed/frozen and remaining ordered Source Pack stages permit construction.

## Security objective
Protect canonical project truth, repository integrity, credentials, operator intent, deterministic mutation safety, provider operations, adapter isolation, evidence integrity and recovery paths without defeating the product's token/time-efficiency goals.

Security is fail-closed where ambiguity could cause destructive mutation, privilege misuse, secret disclosure, invalid evidence or silent corruption.

## Primary protected assets
1. Canonical governance/source documents.
2. Target repository files and Git history.
3. Credentials/tokens/provider authorizations.
4. Machine contracts, receipts, checkpoints and evidence.
5. Recovery material and transaction journals.
6. Derived indexes/caches whose integrity affects execution decisions.
7. Hosted-provider state such as PRs/checks/issues/releases/rulesets.
8. Adapter capability declarations and inter-process messages.
9. Telemetry/benchmark data that could contain repository-sensitive metadata.
10. Operator-approved product intent and scope boundaries.

## Trust boundaries

```text
PROJECT OWNER / PLANNER
        │
        ▼
CANONICAL REPOSITORY STATE
        │
        ▼
APPLICATION / CORE
        │
   ┌────┼───────────────┐
   ▼    ▼               ▼
KERNEL LOCAL GIT   PROVIDER PORTS
   │                    │
   ▼                    ▼
FILESYSTEM           GITHUB/API
                        │
                        ▼
                 OPTIONAL ADAPTERS
                 isolated boundary
```

Anything crossing filesystem, process, provider, adapter or persisted-machine-state boundaries is untrusted until validated against the applicable contract and expected state.

## Threat classes to close

### T1 — Wrong-target mutation
Mutation applies to the wrong repository, path, branch, worktree or project identity.

Candidate controls: canonical project identity, repository-root binding, realpath normalization, expected HEAD/pre-state fingerprints, allowed-surface policy and dry-run/plan preview.

### T2 — Path traversal / symlink escape
Malicious or malformed paths escape the governed repository or redirect writes outside allowed surfaces.

Candidate controls: normalized relative paths, canonical root containment, symlink policy, same-filesystem staging and post-resolution containment checks.

### T3 — Destructive Git/history operations
Force push, reset, history rewrite, branch deletion or destructive cleanup causes irreversible loss.

Candidate controls: deny-by-default destructive command class, explicit elevated authorization, exact target/state binding, recovery plan, protected-branch awareness and provider capability checks.

### T4 — Secret leakage
Credentials enter source, logs, telemetry, receipts, prompts or recovery artifacts.

Candidate controls: no intentional secret persistence, environment/keychain/provider-token indirection, redaction, secret-pattern scanning, minimized command echo, sensitive-field schema annotations and publication gates.

### T5 — Shell/process injection
Untrusted repository content becomes shell syntax or unsafe process arguments.

Candidate controls: spawn/execFile-style argument arrays, no untrusted shell concatenation, strict executable allowlist/path resolution, timeout/resource bounds and environment minimization.

### T6 — Dependency/supply-chain compromise
A dependency, package, release artifact or update path introduces malicious or unexpected code.

Candidate controls: lockfile pinning, dependency review, package provenance/integrity checks, release checksums/signatures, minimal dependency surface, update preview and vulnerability gates.

### T7 — Malicious/untrusted adapter
Optional adapter attempts unauthorized filesystem/provider access or corrupts core state.

Candidate controls: explicit capability manifest, versioned protocol, least privilege, out-of-process default for risky/external adapters, bounded IPC, timeout/crash isolation and no implicit auto-load.

### T8 — Provider privilege misuse
GitHub/provider token has more privilege than needed or an operation exceeds approved intent.

Candidate controls: capability discovery, least-privilege permission mapping, operation-level allowlists, explicit elevated gates, truthful permission-gap states and receipts for side effects.

### T9 — Stale/tampered derived state
Cache, SQLite index, proof graph or receipt is stale/tampered and drives unsafe execution.

Candidate controls: canonical-input fingerprints, schema validation, integrity hashes, targeted invalidation, rebuildability and fail-closed mismatch.

### T10 — Evidence/checkpoint forgery
A success receipt/checkpoint claims completion without corresponding exact-state proof.

Candidate controls: exact-state bindings, immutable evidence identifiers where possible, proof dependencies, signed/checksummed release evidence, audit ledger and promotion rules.

### T11 — Recovery artifact exposure
Backups/journals retain secrets or sensitive deleted content and leak through Git/publication.

Candidate controls: dedicated ignored/private state path, restrictive permissions where supported, bounded retention, secure cleanup and publication scanning.

### T12 — Denial/resource exhaustion
Huge repos, malicious files, adapter loops or unbounded scans consume CPU/memory/disk/time/tokens.

Candidate controls: file/search/size/depth budgets, bounded subprocesses, streaming/size limits, cancellation, progressive discovery and explicit budget escalation.

## Frozen security architecture constraints inherited from Architecture
- default-deny mutation surface;
- target identity before write;
- path traversal/symlink escape protection;
- no arbitrary adapter auto-execution;
- secrets redaction/no intentional persistence;
- external command argument separation;
- bounded subprocess execution/timeouts;
- checksums/fingerprints for governed artifacts;
- least-privilege provider capabilities;
- fail-closed incompatible schema/state;
- recovery material protected from accidental publication.

## Candidate assurance classes
Security planning should map operations to at least these assurance bands:

- `S0_READ_ONLY` — inspection with no governed mutation or external side effect.
- `S1_MANAGED_WRITE` — bounded reversible GEF-managed file mutation.
- `S2_REPOSITORY_CHANGE` — Git branch/commit/index state mutation.
- `S3_PROVIDER_CHANGE` — hosted-provider side effects such as PR/check/issue/release actions.
- `S4_ELEVATED_DESTRUCTIVE` — irreversible/high-impact operations including history rewrite, destructive cleanup, privileged governance changes or secret-sensitive action.

Higher class inherits lower controls and adds explicit authorization/evidence/recovery obligations.

## Candidate secret policy
- secrets are references/capabilities, not canonical project data;
- secret values must not be written to governed Markdown/JSON/receipts/telemetry;
- logs/receipts use redacted identifiers and provider/account metadata only where needed;
- discovered probable secrets create a security finding and may block publication/release;
- recovery material containing sensitive target content stays outside normal version-controlled publication surfaces;
- no secret scanning result is silently treated as proof that a repository is secret-free.

## Candidate mutation authorization model
Every state-changing operation should carry:

```text
operationId
actor/initiator context
project/repository identity
target surface
security class
expected pre-state
requested capability
allowed operation set
recovery/compensation model
approval requirement
```

Normal bounded operations may be pre-authorized by frozen policy. Elevated destructive actions require an explicit separate approval path and cannot be inferred from a broad bootstrap instruction.

## Candidate provider-security model
Provider adapters must separate:
1. capability discovery;
2. authorization/permission interpretation;
3. plan generation;
4. side-effect execution;
5. post-state verification;
6. receipt emission.

Missing administration permission is a truthful gap, not a reason to bypass provider governance or fabricate success.

## Candidate adapter-security model
Optional adapters declare:
- adapter ID/version;
- compatible protocol versions;
- capabilities;
- required permissions;
- external endpoints/processes;
- filesystem/provider side-effect classes;
- timeout/resource needs;
- security class ceiling.

Unknown/incompatible adapter major versions fail closed. Adapters cannot directly mutate core canonical state outside governed application/kernel operations.

## Candidate supply-chain policy
Production should require:
- pinned lockfile;
- dependency/license/security review policy;
- minimal production dependency graph;
- CI vulnerability/static checks appropriate to TypeScript/Node;
- checksum/provenance verification for published release artifacts;
- no silent update execution;
- compatibility/security review before runtime major-version upgrades.

## Candidate security evidence
Security-relevant release proof should cover at minimum:
- threat-control mapping;
- secret scanning/publication checks;
- dependency/supply-chain checks;
- path traversal/symlink tests;
- destructive-operation denial tests;
- transaction recovery tests;
- command-injection tests;
- malformed schema/receipt tests;
- adapter crash/timeout/isolation tests;
- provider permission-gap tests;
- stale/tampered cache/evidence tests;
- Windows/Linux/macOS path/process security cases.

## Security questions to close
1. Freeze the exact security-class model and what operations map to each class.
2. Define which actions require explicit human/user approval versus frozen policy authorization.
3. Define the repository-local private/recovery state placement and retention policy.
4. Freeze secret-detection/redaction/publication behavior and false-positive handling.
5. Define executable/process allowlisting and environment inheritance policy.
6. Freeze dependency/supply-chain acceptance gates for production.
7. Define provider-token permission expectations and degraded/gap behavior.
8. Freeze adapter permission/capability sandbox rules and maximum trust assumptions.
9. Define integrity protection for receipts/checkpoints/derived state without pretending all local files are cryptographically trusted.
10. Define the minimum security test/evidence gates for `PRODUCTION_RELEASE_DONE`.

## Current direction
Security favors least privilege, explicit trust boundaries, exact target/state binding, safe process execution, secret minimization, isolated adapters, recoverable mutation, integrity-bound derived state and truthful gap/failure reporting.

STOP CONDITION: `SECURITY_DECISIONS_REQUIRED`.
