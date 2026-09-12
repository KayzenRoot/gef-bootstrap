# GBS-M01-S01 — Deterministic Work Plane Runtime

Status: `IN_DISCUSSION`

## Session identity
- Module: `GBS-M01 — Deterministic Work Plane Kernel`
- Session: `GBS-M01-S01`
- Legacy folder name: `m01-cli-kernel` (stable historical path only; product identity is not CLI-first)
- Product phase: `PRODUCTION_CONSTRUCTION`
- Current implementation state: `AUTHORIZED_NOT_STARTED`

## Binding sources
This session is constrained by:
- `GBS-CONSTITUTION-v1.1`;
- frozen Scope;
- frozen Architecture;
- frozen Security;
- frozen Test & Benchmark Plan;
- frozen Definition of Done;
- frozen Backlog Baseline;
- frozen Deployment & Distribution;
- frozen Source Hierarchy;
- frozen Decisions Supersession Map;
- Source Pack Closure Audit `PASSED`;
- current Checkpoint `READY_FOR_PRODUCTION_CONSTRUCTION`.

## Objective
Freeze the runtime/foundation contract for the deterministic work plane so later kernel, routing, lifecycle, error, Git/filesystem, evidence and operator modules can share one stable execution substrate without granting deterministic code semantic authority.

## Runtime decision
The deterministic work plane uses **TypeScript on a supported Node.js LTS line** as the canonical production runtime.

Why:
- first-class TypeScript/JSON/schema ecosystem;
- strong cross-platform filesystem/process support for Windows, Linux and macOS;
- package-first distribution matches frozen Deployment;
- one-language core reduces maintenance and recurring model context;
- adequate performance for repository/governance workloads without polyglot complexity;
- library + thin CLI packaging is natural;
- GitHub/provider integrations remain straightforward;
- native extensions remain unnecessary until measured evidence proves otherwise.

A second implementation language is prohibited by default. Introducing Rust/Go/native components requires a governed Architecture change supported by measured performance/security/packaging ROI.

## Runtime identity
Every deterministic invocation must be able to expose a compact runtime identity sufficient for evidence and compatibility decisions:
- GEF product/package version;
- machine-contract/schema version(s) where applicable;
- Node runtime version;
- operating system/platform and architecture;
- package/build identity;
- repository/project identity when a target is bound;
- capability/profile set;
- execution mode;
- relevant tool versions only when they affect semantics/proof.

Runtime identity is evidence metadata, not semantic authority.

## Kernel boundary
The M01 runtime owns deterministic orchestration primitives only. It MAY:
- load validated machine configuration;
- resolve registered deterministic commands/use-cases;
- establish execution context;
- invoke bounded filesystem/process/Git/provider abstractions;
- enforce lifecycle/abort/timeout/resource policies delegated by frozen contracts;
- emit typed results/errors/receipts;
- collect deterministic telemetry hooks;
- expose library entry points consumed by CLI or future operator surfaces.

It MUST NOT:
- invent requirements, scope or architecture;
- accept risk on behalf of the Product Owner;
- reinterpret semantic source authority;
- fabricate evidence;
- silently broaden context/scope;
- execute S4 actions without the frozen authorization path;
- make GitHub semantics part of core domain contracts.

## Library-first contract
The runtime is **library-first**. The official CLI is a thin adapter over application/domain APIs.

Required layering:
```text
operator surface / CLI
        ↓
application orchestration
        ↓
domain contracts + policy ports
        ↓
deterministic primitives / adapters
```

No core use-case may require parsing CLI text to function. Programmatic use and tests must be able to invoke the same typed application API directly.

## Process model
Default execution is single-process and request-scoped.

Rationale:
- avoids daemon/service complexity where no product requirement exists;
- simplifies deterministic state, recovery and testing;
- lowers installation and idle-resource cost;
- keeps local-first behavior transparent.

Long-lived service/daemon mode is OUT_OF_SCOPE unless a later admitted requirement demonstrates material recurring value that cannot be achieved safely with request-scoped execution.

## Concurrency model
Concurrency is opt-in and bounded.

Rules:
- deterministic independent reads/checks may run concurrently when ordering does not affect semantics;
- mutations sharing a target/recovery surface require serialization or an explicit coordination contract;
- concurrency limits are configuration/policy driven, never unbounded;
- cancellation/abort propagates through owned async work;
- final receipts preserve deterministic logical ordering even if independent checks executed in parallel;
- optimization never bypasses assurance ordering constraints.

## Async/cancellation contract
All potentially blocking external operations should support an abort/cancellation signal where the underlying API permits it.

The runtime must distinguish:
- operator cancellation;
- timeout/budget expiry;
- dependency/provider failure;
- policy block;
- integrity/state conflict;
- unexpected internal fault.

S05 owns the complete error taxonomy; S01 freezes only the runtime requirement that these outcomes remain distinguishable.

## Resource budgets
Runtime supports bounded resource policies for:
- wall-clock operation timeout;
- child-process timeout;
- maximum concurrent work units;
- maximum output capture before truncation/spooling policy;
- bounded repository discovery/search operations;
- memory-sensitive large-file behavior;
- optional network-operation budget when provider interaction is admitted.

Budgets must fail truthfully. A budget limit may yield `BLOCKED_BUDGET`/equivalent typed outcome but may not convert incomplete work into success.

## Filesystem/process portability
Runtime contracts must normalize platform differences without pretending they do not exist.

Requirements:
- use path APIs, not hard-coded separators;
- preserve case-sensitivity uncertainty where platform/filesystem behavior differs;
- surface symlink/reparse-point semantics to filesystem safety layers;
- invoke child processes without shell interpolation by default;
- represent environment variables as explicit input maps;
- normalize text encoding to UTF-8 for governed text artifacts while detecting unsupported/binary input;
- preserve executable-bit/line-ending semantics where relevant to Git/release behavior.

## Child-process rule
Default process invocation is argument-vector based (`executable + argv`) with shell execution disabled.

Shell mode requires an explicit owning use-case and security classification. Untrusted repository/configuration values must never be concatenated into shell command strings.

## Environment contract
The runtime reads environment state through an abstraction that permits:
- allowlisting relevant variables;
- secret redaction;
- deterministic test substitution;
- explicit inheritance policy for child processes;
- evidence of which non-secret environment dimensions affected behavior.

Environment is operational input, not hidden canonical truth.

## Network contract
Core deterministic runtime is network-optional.

Local repository operations must remain usable without network when their required dependencies are local. Provider/package/update operations may use network only through explicit capability/adapters and policy.

Network unavailability must produce a truthful degraded/block state, not corrupt local state.

## State model
S01 adopts the frozen Architecture distinction:
- `CANONICAL_STATE` — governed source truth;
- `DERIVED_STATE` — rebuildable indexes/cache/fingerprints;
- `OPERATIONAL_STATE` — current invocation/transaction/receipt state.

The runtime may manage derived/operational state but cannot silently promote it into canonical state.

## Derived-state persistence
The runtime foundation must support a persistence port rather than binding core logic directly to SQLite or ad-hoc files.

Initial supported implementation direction:
- ordinary governed canonical artifacts: repository files;
- compact immutable receipts: JSON/JSONL where appropriate;
- derived indexes/cache: filesystem-backed implementation first;
- SQLite remains an allowed interchangeable derived-state backend only behind the persistence contract and only when stability/ROI evidence justifies its use.

No unique project truth may exist only in a cache/database.

## Determinism contract
“Deterministic” means same authoritative inputs, applicable configuration, compatible toolchain and controlled external responses produce the same logical operation plan/result classification, subject to explicitly recorded nondeterministic external facts.

It does NOT promise byte-identical timestamps, provider request IDs or OS scheduling.

Sources of nondeterminism must be either:
- injected behind ports for tests;
- captured in receipts;
- excluded from semantic equality;
- or classified as external evidence.

Clock, random ID generation and external provider calls therefore require injectable interfaces where they affect test/proof semantics.

## Clock and identity primitives
Core application logic must not call ambient wall-clock/random UUID facilities directly when those values affect persisted state or evidence.

Provide ports for:
- clock/time source;
- ID generation;
- environment;
- filesystem;
- process execution;
- Git;
- provider/network capabilities;
- derived-state persistence.

This keeps tests deterministic and minimizes hidden inputs.

## Startup/preflight principle
Kernel startup performs only cheap deterministic initialization. Expensive repository/provider discovery belongs to explicit use-cases/preflight stages and should not happen merely because the library is imported or CLI starts.

No network request, repository mutation or broad repository scan occurs as import-time side effect.

## Configuration precedence
Detailed schema/config mechanics belong to M02, but M01 requires runtime configuration to arrive as a validated typed object. Kernel business logic must not repeatedly parse raw JSON/YAML/environment input.

Unknown or invalid configuration fails before mutation.

## Logging/telemetry hook
The runtime exposes structured event hooks, not hard-coded console logging as the domain mechanism.

Events must support:
- correlation/run ID;
- operation/use-case ID;
- phase;
- duration where measurable;
- sanitized metadata;
- result/error classification;
- budget/cancellation information.

M43 owns telemetry schema and storage. M01 only guarantees the hook boundary.

## Error boundary
Unexpected exceptions must be caught at application/operator boundaries and converted into the governed error model without losing the original diagnostic chain for secure debug evidence.

Secrets and sensitive paths/content must be redacted according to Security policy before operator-facing output or persistent telemetry.

## Runtime package boundaries
S01 does not freeze exact npm package names, but requires logical boundaries compatible with Architecture:
- contracts/types;
- core/domain;
- application/kernel;
- infrastructure adapters;
- operator/CLI;
- testkit.

Package count should remain small and justified. One package per GBS module is prohibited unless later evidence proves a real boundary need.

## Testability obligations
Runtime foundation must be testable without GitHub or real network access.

S01 acceptance requires future implementation tests for at least:
- library import has no mutation/network side effects;
- typed invocation works without CLI parsing;
- cancellation/timeout classification;
- bounded concurrency;
- child-process argv safety;
- environment injection/redaction boundary;
- deterministic clock/ID substitution;
- local/offline operation path;
- unsupported Node/runtime fail-fast integration with compatibility policy;
- Windows/Linux/macOS path/process contract fixtures.

## Security obligations
- shell disabled by default;
- no ambient secret logging;
- no implicit privilege escalation;
- runtime identity cannot include secret values;
- S4 operations cannot bypass authorization because they originate inside the kernel;
- untrusted adapter/provider data remains untrusted until validated;
- cancellation/failure cannot leave mutation work falsely reported as complete.

## Token/time economy obligations
Runtime architecture must reduce recurring model/executor cost by making mechanical facts deterministic and compact:
- typed machine results instead of prose parsing;
- stable command/use-case contracts;
- deterministic receipts;
- cheap startup;
- bounded discovery;
- reusable validated config/state;
- structured failure classification that prevents repeated diagnostic exploration.

## Decisions frozen by this session candidate
1. TypeScript + supported Node LTS is the canonical runtime.
2. Library-first application API; CLI is a thin adapter.
3. Request-scoped single-process runtime by default; no daemon requirement.
4. Bounded opt-in concurrency with mutation serialization/coordination.
5. Abort/cancellation propagation is a runtime requirement.
6. Shell-free child-process invocation is the default.
7. Core runtime is network-optional; provider/network operations are explicit capabilities.
8. Canonical/derived/operational state separation is enforced at runtime boundaries.
9. Persistence is behind a port; no cache/database may become unique canonical truth.
10. Clock/ID/environment/filesystem/process/Git/provider persistence effects use injectable ports where they affect deterministic behavior/testing.
11. Import/startup has no mutation, network or broad-scan side effects.
12. Runtime emits structured hooks; telemetry ownership remains M43.
13. Runtime cannot make semantic governance decisions.
14. No polyglot/native core component without governed measured ROI.

## Dependencies delegated
- M02: config/schema representation and validation;
- M03: project identity details;
- M04: repository/provider preflight/discovery;
- M05/M06: mutation transaction and filesystem safety mechanics;
- M24/M25: evidence/proof contracts;
- M29: Git implementation;
- M34–M37: detailed security/recovery/integrity mechanisms;
- M43: telemetry contract;
- M49–M51: packaging/runtime compatibility matrix;
- M63: performance budgets/benchmarks.

## Open questions before freeze
1. Minimum supported Node LTS line should be fixed by M51/Deployment evidence rather than hard-coded in M01. Current direction: yes.
2. Filesystem-backed derived state should be the mandatory baseline, with SQLite optional behind a port until benchmark evidence. Current direction: yes.
3. Official adapters may run in-process if trusted/capability-constrained; untrusted future plugins require stronger isolation owned by M42. Current direction: yes.
4. Worker threads should not be part of the baseline runtime unless benchmark evidence shows CPU-bound need. Current direction: yes.
5. Runtime logical-result canonicalization format for hashing/signing is delegated to M37/contract schemas. Current direction: yes.

## Session completion gate
This session may become `FROZEN` only when:
- the five open questions are resolved/routed;
- no conflict exists with frozen Architecture/Security/Deployment;
- exact-head review passes;
- Checkpoint advances to `GBS-M01-S02`;
- no functional code is introduced by the planning session itself.

STOP CONDITION: `M01_S01_REVIEW_REQUIRED`.
