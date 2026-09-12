# GBS-M01-S01 — Deterministic Work Plane Runtime

Status: `FROZEN_CANDIDATE`

## Session identity
- Module: `GBS-M01 — Deterministic Work Plane Kernel`
- Session: `GBS-M01-S01`
- Legacy folder name: `m01-cli-kernel` (stable historical path only; product identity is not CLI-first)
- Product phase: `PRODUCTION_CONSTRUCTION`
- Current implementation state: `AUTHORIZED_NOT_STARTED`

## Binding sources
This session is constrained by `GBS-CONSTITUTION-v1.1`, frozen Scope, Architecture, Security, Test & Benchmark Plan, Definition of Done, Backlog Baseline, Deployment & Distribution, Source Hierarchy, Decisions Supersession Map, passed Source Pack Closure Audit and checkpoint `READY_FOR_PRODUCTION_CONSTRUCTION`.

## Objective
Freeze the runtime/foundation contract for the deterministic work plane so later kernel, routing, lifecycle, error, Git/filesystem, evidence and operator modules share one stable execution substrate without granting deterministic code semantic authority.

## Frozen runtime contract
1. **Runtime:** TypeScript on a supported Node.js LTS line. The exact supported Node line is owned by M51 Compatibility Matrix and release evidence, not hard-coded in M01.
2. **Surface:** library-first typed application API; the official CLI is a thin adapter and core use-cases never depend on CLI text parsing.
3. **Process model:** request-scoped single-process execution by default. A daemon/service is not baseline architecture.
4. **Concurrency:** opt-in and bounded. Independent reads/checks may run concurrently; mutations sharing a target/recovery surface are serialized or governed by an explicit coordination contract.
5. **Cancellation:** abort, operator cancellation and timeout propagate through owned asynchronous work and remain distinguishable from dependency, policy, integrity and internal failures.
6. **Process safety:** child processes use `executable + argv` with shell disabled by default. Shell execution requires explicit use-case ownership and security classification.
7. **Network:** core deterministic repository operations are network-optional. Provider/package/update access is an explicit capability and failure degrades or blocks truthfully without corrupting local state.
8. **State:** `CANONICAL_STATE`, `DERIVED_STATE` and `OPERATIONAL_STATE` remain separate. Derived/operational state can never silently become canonical truth.
9. **Persistence:** persistence is behind a port. Filesystem-backed derived state is the mandatory baseline. SQLite is an interchangeable optional backend only when benchmark/stability/ROI evidence justifies it. No unique project truth may exist only in cache/database.
10. **Deterministic inputs:** clock, ID generation, environment, filesystem, process execution, Git, provider/network and derived persistence are injectable where they affect persisted behavior, evidence or tests.
11. **Startup:** importing/starting the library performs no repository mutation, network access or broad repository scan. Expensive discovery is an explicit use-case/preflight concern.
12. **Configuration:** kernel receives validated typed configuration. Raw JSON/YAML/environment parsing belongs outside kernel business logic; invalid/unknown configuration fails before mutation.
13. **Telemetry:** runtime emits structured sanitized event hooks with correlation/run identity, operation, phase, duration, result/error and budget/cancellation metadata. M43 owns telemetry schema/storage.
14. **Semantic boundary:** deterministic runtime cannot invent requirements/scope/architecture, accept product risk, reinterpret source authority, fabricate evidence or broaden scope silently.
15. **Language boundary:** no Rust/Go/native/polyglot core component without governed architecture change and measured performance/security/packaging ROI.
16. **Worker threads:** not baseline runtime. They may be introduced only when M63 benchmark evidence demonstrates a CPU-bound benefit that outweighs determinism, complexity and maintenance cost.
17. **Adapter isolation:** official trusted adapters may execute in-process only through validated capability-constrained contracts. Untrusted/future third-party plugin isolation is owned by M42 and requires a stronger boundary.
18. **Canonicalization:** logical-result canonicalization used for hashing/signing is delegated to M37 and versioned machine-contract schemas; M01 does not invent a competing format.

## Runtime identity
Every invocation must be able to expose compact evidence metadata: product/package version, applicable schema versions, Node version, OS/platform/architecture, build identity, bound project identity, enabled capability/profile set, execution mode and only tool versions that affect semantics/proof. Runtime identity is evidence metadata, never semantic authority.

## Layering
```text
operator surface / CLI
        ↓
application orchestration
        ↓
domain contracts + policy ports
        ↓
deterministic primitives / adapters
```
Provider-specific semantics, including GitHub semantics, cannot leak into core domain contracts.

## Resource and portability obligations
Runtime supports governed bounds for wall-clock duration, child-process duration, concurrency, captured output, discovery/search work, large-file behavior and admitted network operations. Budget exhaustion fails truthfully and never converts incomplete work into success.

Cross-platform behavior must use platform path APIs, preserve case-sensitivity uncertainty, expose symlink/reparse semantics to safety layers, use explicit environment maps, normalize governed text to UTF-8 while detecting unsupported/binary inputs, and preserve Git-relevant executable-bit/line-ending behavior where applicable.

## Determinism definition
Same authoritative inputs, validated configuration, compatible toolchain and controlled external responses must produce the same logical operation plan/result classification, excluding explicitly recorded nondeterministic external facts. Byte-identical timestamps, provider IDs and scheduler ordering are not promised. Nondeterministic facts are injected, captured in receipts, excluded from semantic equality or classified as external evidence.

## Testability obligations for future implementation
At minimum prove:
- library import has no mutation/network side effects;
- typed invocation requires no CLI parsing;
- cancellation and timeout classification;
- bounded concurrency and mutation coordination;
- child-process argv safety;
- environment injection/redaction;
- deterministic clock/ID substitution;
- local/offline operation;
- unsupported runtime fail-fast through compatibility policy;
- Windows/Linux/macOS path/process contract fixtures;
- optional SQLite backend cannot become unique canonical truth;
- trusted adapter capability boundary cannot bypass kernel policy.

## Security obligations
Shell is disabled by default; secrets are never ambiently logged; privilege escalation is never implicit; runtime identity contains no secret values; S4 operations cannot bypass authorization from inside the kernel; untrusted adapter/provider data remains untrusted until validated; cancellation/failure cannot leave mutation work falsely reported complete.

## Token/time economy obligations
Mechanical facts use typed machine results rather than prose parsing. Stable use-case contracts, deterministic receipts, cheap startup, bounded discovery, reusable validated configuration/state and structured failure classification must reduce repeated model exploration. Optimizations never weaken assurance or source truth.

## Delegated ownership
- M02 config/schema representation and validation
- M03 project identity
- M04 repository/provider preflight/discovery
- M05/M06 mutation transaction and filesystem safety
- M24/M25 evidence/proof contracts
- M29 Git implementation
- M34–M37 detailed security/recovery/integrity and canonicalization
- M42 generic adapter/plugin isolation
- M43 telemetry schema/storage
- M49–M51 packaging/runtime compatibility
- M63 performance budgets/benchmarks and worker-thread promotion evidence

## Resolved freeze questions
1. Exact Node LTS support belongs to M51: **RESOLVED YES**.
2. Filesystem-backed derived state is mandatory baseline; SQLite optional behind a port: **RESOLVED YES**.
3. Trusted official adapters may be in-process under capability constraints; untrusted plugins require stronger M42 isolation: **RESOLVED YES**.
4. Worker Threads require measured M63 CPU-bound ROI and are not baseline: **RESOLVED YES**.
5. Hash/signature canonicalization belongs to M37/versioned contracts: **RESOLVED YES**.

## Session completion gate
Planning content is frozen-candidate. Final `FROZEN` requires exact-head review, merge and checkpoint advancement to `GBS-M01-S02`. No functional code is introduced by this planning session.

STOP CONDITION: `M01_S01_EXACT_HEAD_REVIEW_REQUIRED`.
