# Architecture

Status: `FROZEN`

## Binding
This Architecture derives from `GBS-CONSTITUTION-v1.1`, frozen Project Overview, frozen Requirements, frozen complete-production Scope, and `ADR-0001-COMPLETE-PRODUCTION-TARGET.md`.

No functional implementation begins until the remaining ordered Source Pack stages permit construction.

## Architectural objective
GEF Bootstrap is a local-first, contract-driven modular hybrid product with strict separation between semantic reasoning and deterministic mechanics.

### Planes
1. **Semantic Plane** — governed repository state consumed by ChatGPT/compatible planning agents for product reasoning, requirement interpretation, scope/architecture intent, assurance policy and semantic review.
2. **Deterministic Work Plane** — product code for bounded repeatable operations such as repository inspection, mutation planning/application, validation, fingerprints, state comparison, deterministic manifests/diffs, conformance and receipts.
3. **Platform/Profile Plane** — provider/profile adapters such as GitHub plus optional UADS/Hive/UGAS adapters, isolated from core semantics.
4. **Evidence & Assurance Plane** — exact-state evidence, proof validity/invalidation, impacted validation, HEDS delta review, assurance gates and recovery proof.
5. **Continuity & Knowledge Plane** — checkpoint/resume, project registry, governed engineering memory, fact/dependency maps and progressive brownfield knowledge.
6. **Observability & Optimization Plane** — token/time/search/test/retry/review telemetry, baseline/benchmark and engineering ROI.

## Frozen architectural invariants
- Canonical truth lives in governed repository sources, not chat memory.
- ChatGPT/planning remains semantic reasoning authority under canonical sources.
- Deterministic tooling cannot silently decide scope, requirements, architecture intent, risk acceptance or semantic verdicts.
- Local checked-out Git repository/filesystem is the universal deterministic substrate.
- GitHub is the reference hosted profile, not a core semantic dependency.
- NEW_PROJECT and EXISTING_PROJECT/BROWNFIELD are both first-class.
- Assurance overrides token/time/search/test budgets.
- Exact-state evidence and targeted invalidation are required where applicable.
- One complete production target is built, not an MVP-first product line.
- GEF Bootstrap itself is implemented through ChatGPT + connected tools, not Codex.

# Frozen implementation architecture

## A1 — Language/runtime
The deterministic product implementation uses **TypeScript** on the **Node.js LTS line**.

Initial production baseline targets Node.js 24 LTS or later compatible LTS selected by the compatibility matrix at implementation time. TypeScript uses strict mode and ESM-oriented modern Node semantics. Runtime/version support is declared explicitly rather than inferred.

Reasons:
- excellent filesystem/process/Git/tooling ecosystem;
- strong machine-contract ergonomics and JSON/schema integration;
- straightforward cross-platform Windows/Linux/macOS support;
- suitable CLI + library distribution model;
- strong test ecosystem;
- low friction for ChatGPT-based implementation and review;
- mature package/workspace tooling;
- broad compatibility with target software repositories.

A newer Node Current release is never required merely because it exists. LTS compatibility is the default production policy.

## A2 — Repository/package structure
Use a **single monorepo with modular workspaces/packages**.

Canonical package boundaries:

```text
packages/
  contracts/        # schemas, versioned machine contracts, canonical model types
  core/             # provider-neutral domain policies and orchestration contracts
  kernel/           # deterministic work-plane primitives and transaction engine
  git/              # local Git repository adapter
  github/           # GitHub reference hosted profile
  assurance/        # evidence, proof validity, test impact, HEDS mechanics
  continuity/       # checkpoint/current/resume/registry/knowledge mechanics
  observability/    # telemetry, audit, benchmark and ROI measurements
  profiles/         # built-in generic/project profiles
  adapters-sdk/     # public adapter protocol/SDK
  cli/              # thin operator CLI over public application/library API
  distribution/     # packaging/update/release helpers
adapters/
  uads/
  hive/
  ugas/
schemas/
fixtures/
tests/
docs/
```

Exact folder names may be refined before implementation, but the dependency boundaries are frozen. Packages are not separate products; the monorepo provides one coordinated release with independently testable surfaces.

## A3 — Public operator surface
Architecture is **library/application-API first, thin CLI second**.

The deterministic application API is the primary programmatic contract. CLI commands translate arguments/input into the same application operations and render machine/human output. Business logic must not live in CLI handlers.

This permits:
- ChatGPT/connected tools to invoke stable mechanics programmatically;
- CLI use by humans and automation;
- future GUIs/IDE integrations without duplicating product logic;
- deterministic testing without shell coupling.

## A4 — State/storage model
Use a **layered repository-local state model**:

### Canonical state
Version-controlled human/auditable files remain authoritative.

### Derived state
Small portable derived state uses JSON/JSONL where inspection/diffability matters. Larger indexes, graph/cache/telemetry/query-heavy derived state may use repository-local SQLite.

### Operational state
Transactions/runs use bounded machine files and/or SQLite as appropriate, but operational databases are never normative source truth.

Default repository-local product state lives under a reserved GEF directory determined later by Configuration/Schema planning. Derived databases/caches must be rebuildable from canonical/repository inputs or explicitly declare non-rebuildable evidence ownership.

SQLite is an implementation detail behind storage interfaces, not a contract leaked into semantic sources. Because Node's built-in SQLite remains pre-stable/release-candidate in current supported Node lines, Architecture does **not** require `node:sqlite`; implementation must select a production-suitable SQLite binding or defer SQLite-backed capabilities until the compatibility matrix accepts the runtime implementation. JSON/file storage remains the safe baseline fallback.

## A5 — Transaction and recovery architecture
All GEF-managed filesystem mutation uses a **plan → stage → verify → commit/promote** transaction envelope.

```text
1. IDENTIFY TARGET
2. BIND EXPECTED PRE-STATE
3. BUILD MUTATION PLAN
4. VALIDATE ALLOWED SURFACE
5. CAPTURE RECOVERY MATERIAL
6. STAGE WRITES IN SAME-FILESYSTEM TEMP AREA
7. VERIFY STAGED CONTENT/SCHEMAS/FINGERPRINTS
8. APPLY WITH ATOMIC RENAME/REPLACE WHERE PLATFORM SUPPORTS IT
9. VERIFY POST-STATE
10. EMIT RECEIPT
11. CLEANUP
```

If any step before successful post-state verification fails, the transaction enters `RECOVERY_REQUIRED` or automatically restores the affected managed surface when safe and provable.

Transaction journals contain operation IDs, target identity, pre/post fingerprints, changed paths, recovery material references and terminal state. Large file contents are not duplicated into receipts when a bounded backup/reference suffices.

External provider side effects are **sagas**, not falsely atomic filesystem transactions. Each provider operation records forward action, verification and compensating/recovery action when available. Irreversible external effects are declared before execution.

## A6 — Filesystem, Git and hosted-provider separation
Three boundaries are mandatory:

### Filesystem layer
Path normalization, read/write/stage/atomic replace, permissions/symlink policy and safe traversal. No GitHub semantics.

### Local Git layer
Repository identity, HEAD/index/status/diff/branch/commit metadata and local Git operations. It depends on filesystem/process abstractions but not GitHub APIs.

### Hosted provider layer
GitHub PR/check/Actions/issues/rulesets/releases/permission-gap operations. It depends on provider-neutral repository/change contracts and local Git identity where useful, but core never imports GitHub-specific models.

Core code communicates with hosted providers through neutral ports/interfaces. Provider receipts preserve provider-specific fields in namespaced extension sections without contaminating the common contract.

## A7 — Optional adapter isolation
UADS/Hive/UGAS adapters use the **Generic Adapter API/SDK** and are separately activatable packages.

For trust and stability:
- core never imports adapter implementation packages;
- adapters declare capabilities, contract version, permissions and side-effect classes;
- adapter discovery is explicit, not arbitrary auto-loading of repository code;
- adapter calls cross a serialized request/response boundary;
- optional ecosystem adapters default to an **out-of-process worker boundary** for execution that can touch external systems or bring large/conflicting dependency trees;
- bounded built-in profile adapters may run in-process only when they meet the same contract and risk policy;
- crash/timeout/incompatible adapter cannot corrupt canonical core state;
- every adapter operation returns a governed receipt/error terminal state.

Initial transport may use stdin/stdout JSON messages or another local IPC transport selected during implementation, but the protocol is versioned independently from transport.

## A8 — Machine contracts and schema versioning
**JSON Schema 2020-12** is the canonical language-neutral machine-contract format for persisted/interchange JSON documents and receipts.

TypeScript types/interfaces are generated from or mechanically checked against canonical schemas where practical; handwritten types cannot silently drift from schema truth.

Every externally persisted/interchanged contract carries an explicit `schemaVersion` or contract-version equivalent. Compatibility rules are:
- additive backward-compatible evolution where validated;
- explicit migrations for incompatible changes;
- unknown required major version fails closed;
- readers do not silently discard unknown security/assurance-critical fields;
- schemas are bundled, versioned and test-fixtured.

Internal ephemeral TypeScript types need not become JSON Schema unless they cross a persistence/process/provider/public API boundary.

## A9 — Distribution and updates
The complete product supports Windows, Linux and macOS through a layered distribution model:

1. **Package/library distribution** for programmatic use and development environments.
2. **CLI package** using the same application API.
3. **Release artifacts** with checksums/signatures and platform-specific launch/install convenience where reliable.

The primary universal install path may require an accepted Node LTS runtime. A self-contained executable is an optional distribution optimization, not a semantic architecture requirement, and is promoted only when packaging tests prove equivalent behavior across supported OS/architectures.

Updates follow preview → compatibility check → migration plan → apply → verify → recovery/rollback where possible. Silent self-update is not the default.

Production builds pin dependency lockfiles and produce reproducible/verifiable metadata sufficient for release evidence.

## A10 — Independently testable boundaries
The 64-module program shares infrastructure but preserves proof ownership through these architectural test boundaries:

1. `contracts` — schema fixtures, backward/forward compatibility and migration tests.
2. `core` — pure policy/domain unit tests without filesystem/network.
3. `kernel` — filesystem transaction, safety, recovery, fingerprint and conformance tests using temporary repositories.
4. `git` — local Git integration tests against disposable real repositories.
5. `provider` — GitHub contract tests with simulation plus governed live integration evidence where available.
6. `adapters` — adapter protocol/capability/timeout/crash/isolation tests independently from core.
7. `assurance` — evidence/proof/invalidation/test-impact/HEDS tests.
8. `continuity` — checkpoint/current/resume/invalidation consistency tests.
9. `observability` — deterministic metric accounting and benchmark-fixture tests.
10. `application/CLI` — command/API contract integration tests.
11. `E2E` — new-project, brownfield, recovery and complete hosted-profile scenarios.
12. `security/performance` — cross-cutting suites with their own release gates.

A module may own requirements in multiple test boundaries, but test code must map proof back to stable REQ/module identifiers rather than equating package coverage with completion.

# Component model

```text
                         PROJECT OWNER
                              │
                              ▼
                 ┌────────────────────────┐
                 │ SEMANTIC PLANE         │
                 │ ChatGPT / Planner      │
                 └───────────┬────────────┘
                             │ governed intent
                             ▼
                 ┌────────────────────────┐
                 │ CONTRACT / COMPILERS   │
                 │ source/task/execution  │
                 │ review/context packs   │
                 └───────┬────────┬───────┘
                         │        │
                         ▼        ▼
                ┌─────────────┐ ┌──────────────┐
                │ APPLICATION │ │ ASSURANCE    │
                │ API / CORE  │ │ / EVIDENCE   │
                └──────┬──────┘ └──────┬───────┘
                       │               │
                       ▼               │
                ┌─────────────┐        │
                │ KERNEL      │◄───────┘
                │ transaction │
                │ validation  │
                └──┬─────┬────┘
                   │     │
             ┌─────┘     └─────────┐
             ▼                     ▼
       LOCAL FS / GIT        PROVIDER PORTS
                                  │
                           ┌──────┴──────┐
                           ▼             ▼
                        GitHub       Adapter SDK
                                         │
                                 UADS/Hive/UGAS

        continuity + observability span all governed operations
```

# Dependency rules
Preferred dependency direction:

```text
interfaces/adapters/operator
          ↓
application orchestration
          ↓
domain contracts + policies
          ↓
deterministic primitives + canonical models
```

Forbidden dependency examples:
- `core -> github`;
- `core -> cli`;
- `kernel -> ChatGPT/model vendor`;
- canonical schema -> adapter implementation;
- assurance verdict logic -> UI renderer;
- semantic decisions reconstructed from operational SQLite/cache state.

# State model

```text
CANONICAL_STATE
   │
   ├── compile/index/fingerprint ──► DERIVED_STATE
   │                                   │
   │                                   └── invalidated/rebuilt by binding
   │
   └── governed operation ─────────► OPERATIONAL_STATE
                                         │
                                         └── receipt / checkpoint promotion
```

Derived and operational state are accelerators/evidence carriers, never silent replacements for canonical truth.

# Architecture and token economy
The architecture actively reduces recurring LLM work:
- rich canonical sources are compiled into small task/context capsules;
- schemas and machine receipts remove repeated prose interpretation;
- deterministic inspection answers mechanical questions without model tokens;
- source/proof/test dependency maps target invalidation;
- delta review avoids rereading accepted material;
- provider/profile variation is isolated behind contracts;
- failure fingerprints and negative capability memory prevent repeated dead ends;
- telemetry measures whether optimizations actually reduce total safe engineering cost.

# Cross-platform policy
Windows, Linux and macOS are supported targets for the local deterministic plane. OS-specific behavior lives behind filesystem/process/distribution abstractions and is exercised in CI/release matrices. Path/case/symlink/permission/line-ending assumptions must be explicit and tested.

# Security architecture baseline
- default-deny mutation surface;
- canonical target identity before write;
- path traversal/symlink escape protection;
- no arbitrary adapter auto-execution;
- secrets redaction/no intentional persistence;
- external command argument separation, no untrusted shell concatenation;
- bounded subprocess execution/timeouts;
- checksums/fingerprints for governed artifacts;
- least-privilege provider capabilities;
- fail-closed incompatible schema/state;
- recovery material protected from accidental publication where sensitive.

Detailed threat models/policies belong to Security planning, but Architecture may not weaken these boundaries.

# Architecture decision summary
| ID | Decision |
|---|---|
| `ARCH-01` | TypeScript + supported Node.js LTS |
| `ARCH-02` | modular monorepo/workspaces |
| `ARCH-03` | application/library API first + thin CLI |
| `ARCH-04` | canonical files + JSON/JSONL + optional SQLite-derived/operational layer |
| `ARCH-05` | staged transactional filesystem envelope + saga provider effects |
| `ARCH-06` | strict filesystem / local Git / hosted-provider separation |
| `ARCH-07` | versioned adapter SDK; optional ecosystem adapters isolated, out-of-process by default for risky/external work |
| `ARCH-08` | JSON Schema 2020-12 canonical interchange contracts + explicit version/migrations |
| `ARCH-09` | cross-platform package/CLI distribution; self-contained binary is validated optimization, not requirement |
| `ARCH-10` | independently testable contract/core/kernel/git/provider/adapter/assurance/continuity/observability/app/E2E/security/performance boundaries |

# Freeze audit
- Requirements coverage at architecture level: PASS
- complete-product Scope compatibility: PASS
- hybrid semantic/deterministic separation: PASS
- token-economy architecture: PASS
- filesystem-first portability: PASS
- GitHub isolation from core: PASS
- adapter isolation: PASS
- recoverable mutation architecture: PASS
- schema/version compatibility: PASS
- cross-platform distribution strategy: PASS
- independently testable boundaries: PASS
- no functional code implemented: PASS
- no Codex implementation path introduced: PASS
- open Architecture questions: 0

STOP CONDITION: `READY_FOR_ARCHITECTURE_EXACT_DELTA_REVIEW_AND_CHECKPOINT`.
