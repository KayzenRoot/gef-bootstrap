# GBS-M04-S01 — Environment Discovery

Status: `FROZEN`

## Purpose
Freeze the minimal provider-neutral environment discovery contract consumed by deterministic preflight. S01 establishes observable host/runtime facts and their safety/validity semantics without turning local machine state into canonical project identity, hard-coding compatibility policy or performing broad repository/tool/provider discovery.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M04_PLANNING` after M03 `MODULE_DONE`;
- frozen Requirements, Scope, Architecture, Security, DoD and Deployment;
- `GBS-M01-S01 — Deterministic Work Plane Runtime` FROZEN;
- `GBS-M01-S03 — Deterministic Lifecycle` FROZEN;
- `GBS-M02 — Configuration & Schema` completed contracts;
- `GBS-M03 — Project Identity` completed contracts and Evidence Bundle;
- Master Module Index: M04 has five ordered sessions: Environment, Git, GitHub, Toolchain, Project State.

## Ownership boundary
M04-S01 OWNS:
- primitive invocation-environment observation used by M04 preflight;
- normalized platform/architecture/runtime fact shape;
- safe working-directory observation as operational input to later project-state discovery;
- explicit environment-observation availability/gap semantics;
- bounded allowlisted environment-variable access contract;
- environment snapshot freshness/reuse semantics within a governed invocation;
- fail-closed handling for malformed/unsupported observation values before mutation-capable execution.

M04-S01 DOES NOT OWN:
- runtime support/compatibility policy or version matrix (M51);
- generic reusable capability registry/negotiation (M38);
- Git repository discovery/status/remotes (M04-S02/M29);
- GitHub/provider discovery/permissions/network state (M04-S03/M30+);
- executable/tool presence and versions (M04-S04);
- project/root/adoption/identity state aggregation (M04-S05, consuming M03 identity);
- filesystem traversal/symlink containment/write safety (M06);
- configuration path semantics (M02);
- telemetry schema/storage (M43);
- environment-performance budgets/benchmark policy (M63).

## Frozen environment contract

### ENV-01 — Environment discovery is explicit, read-only preflight work
Environment discovery is an `S0_READ_ONLY` operation. Importing/starting the library performs no environment scan beyond ordinary runtime initialization. A caller explicitly requests the facts needed for the admitted preflight/use-case.

Discovery itself performs no repository mutation, provider side effect, package installation, update or arbitrary code execution.

### ENV-02 — Primitive facts come from an injected environment port
Facts that can affect deterministic behavior, persisted evidence or tests are read through an injectable environment abstraction rather than hidden ambient reads inside domain logic.

The production adapter may obtain primitive values from Node/process/platform APIs. Tests inject exact fixtures. Domain logic must not require shelling out merely to ask Node which OS, architecture, runtime version or working directory is active.

### ENV-03 — Minimal normalized observation
The baseline normalized observation contains only facts broadly required before deeper discovery:

```text
EnvironmentObservation
  schemaVersion
  platform              # win32 | linux | darwin | explicit other/unknown observation
  architecture          # normalized observed runtime architecture
  runtime
    family               # node for baseline implementation
    version              # observed semantic/version text, untrusted until parsed
  workingDirectory       # operational-only normalized observation
  requestedEnvironment   # only explicitly allowlisted keys, if requested
  observationStatus
  gaps[]
```

PID, username, hostname, machine identifier, home directory, locale, timezone, CI vendor and complete process environment are not baseline identity fields and are not gathered by default.

### ENV-04 — Observation and compatibility judgment are separate
S01 reports what is observed. It does not silently decide that a Node/OS/architecture combination is supported simply because it is present.

Compatibility judgment consumes an explicit policy/matrix owned by M51 when such a judgment is required. Preflight may then project a truthful supported/unsupported/gap result, but the support rule is not invented or duplicated inside M04.

Architecture's current Node LTS baseline may constrain construction, but it is not a substitute for the versioned M51 compatibility contract.

### ENV-05 — Platform vocabulary is explicit and forward-safe
Known baseline platforms are `win32`, `linux` and `darwin`. An unrecognized platform is preserved as an observed unsupported/unknown value rather than coerced into a known platform.

Unknown architecture/runtime values likewise remain explicit observations. Consumers that require a known compatible value fail closed or return a typed gap according to their operation contract.

### ENV-06 — Working directory is operational evidence, never project identity
The invocation working directory is a starting observation used by later discovery. It must not enter `projectId`, repository identity or semantic equality merely because the invocation started there.

Rules:
- obtain it through the injected port;
- normalize it with the platform/filesystem abstraction appropriate to observation;
- do not infer repository root or project identity from string similarity;
- do not treat path spelling/case equivalence as globally known when filesystem semantics are uncertain;
- raw absolute path is not included in compact reusable receipts by default; later evidence may carry a bounded local reference/fingerprint under its owning contract when needed.

M06 owns authoritative containment/symlink/reparse-point safety for mutation.

### ENV-07 — Environment variables are request-scoped and allowlisted
GEF never captures or serializes the complete process environment for convenience.

An environment consumer declares the exact keys it needs. The environment port returns only those requested keys subject to policy. Secret-like values are operational capabilities and must not be copied into receipts, telemetry, fingerprints or canonical project data.

Examples such as `HOME`, `USERPROFILE`, `APPDATA` or `XDG_CONFIG_HOME` may be requested by M02 platform-path logic when applicable, but S01 does not redefine M02's path rules.

### ENV-08 — Missing versus inaccessible versus malformed are distinct
Discovery preserves distinctions needed for truthful preflight:
- `OBSERVED`: requested primitive was observed and structurally valid;
- `NOT_PRESENT`: an optional requested fact/key is absent;
- `UNAVAILABLE`: the environment adapter cannot observe the fact;
- `MALFORMED`: an observed value violates its structural contract;
- `POLICY_REDACTED`: a requested value exists but cannot be exposed to that consumer;
- `UNKNOWN`: value is structurally observable but outside known vocabulary.

Consumers decide whether a gap is tolerable. S01 does not convert missing evidence into success.

### ENV-09 — Environment snapshot is derived operational state
An environment observation is not canonical source truth. It is a bounded snapshot of the current invocation context.

Within one invocation, the same validated snapshot may be reused across preflight checks when no relevant environment dependency changed. This avoids repeated ambient reads and model/tool calls.

Cross-invocation reuse requires an owning validity contract that binds the relevant dependencies. S01 does not invent a durable cache authority.

### ENV-10 — Discovery is bounded and lazy
Baseline S01 has O(1)-style primitive observation work relative to repository size. It does not recursively walk files, enumerate installed software, probe network endpoints, inspect every environment variable or spawn processes.

More expensive discovery is delegated to the exact later session/module that owns it and is executed only when the admitted operation requires it.

### ENV-11 — Environment facts are machine-compact
Downstream contexts carry the smallest validated environment projection needed for that operation, not raw process dumps or repeated prose.

A consumer asking only for platform/runtime compatibility should not receive cwd/environment-variable material. A consumer asking only for a config-root variable should not trigger Git/provider/tool discovery.

### ENV-12 — Preflight result integrates with M01 lifecycle truthfully
Environment discovery occurs in or before the logical `PREFLIGHTING` phase. An environment requirement that is mandatory for the admitted command may terminate before side effects with a typed `BLOCKED`/precondition/capability result.

Read-only/zero-cost checks may physically collapse for speed as allowed by M01-S03, but evidence must still prove the applicable environment gate was satisfied.

### ENV-13 — No ambient authorization from environment
Presence of a variable, executable path, CI marker, provider credential or broad process permission never grants operation authorization. Environment observation reports capability inputs; Security/policy layers decide authorization.

### ENV-14 — Sanitized evidence surface
Environment evidence may include platform, architecture, runtime family/version, observation status/gap codes and other explicitly admitted non-secret facts.

It excludes by default:
- complete environment maps;
- environment values not needed for proof;
- credentials/secrets;
- user/host identifiers;
- raw home/local paths when a bounded reference suffices;
- arbitrary stdout/stderr because S01 baseline does not spawn tools.

## Security and reliability invariants
- environment input is untrusted until structurally validated;
- no full environment dump;
- no implicit secret persistence;
- no shell invocation for primitive host/runtime discovery;
- no environment-derived authorization;
- no project/repository identity inference from cwd/path alone;
- unknown mandatory platform/runtime facts fail closed rather than guessed;
- observation does not mutate canonical, Git or provider state;
- repository-size-independent baseline work prevents discovery amplification/resource abuse.

## Token/time economy invariants
- primitive facts are collected once per valid invocation snapshot and reused;
- requested-fact projection avoids carrying unrelated facts downstream;
- no repository/network/tool scan is bundled into S01;
- structured gap/status codes replace repeated explanatory probing;
- environment expansion is lazy and operation-driven;
- assurance may require additional evidence, but optimization never hides a required gap.

## Required future proof
Implementation must eventually prove:
1. primitive platform/architecture/runtime/cwd observation is injectable and deterministic in tests;
2. library import does not trigger environment/repository/network discovery side effects;
3. baseline environment discovery spawns no shell/process;
4. only requested allowlisted environment keys are exposed;
5. complete environment maps cannot leak through the normal S01 result/receipt path;
6. secret-like requested values can be withheld/redacted without echoing them;
7. unknown platform/architecture/runtime observations remain explicit and are never coerced to supported values;
8. compatibility classification uses injected/owned compatibility policy rather than hard-coded M04 guesses;
9. cwd is not treated as project/repository identity;
10. raw absolute cwd is absent from compact reusable evidence unless an owning operation explicitly admits it;
11. missing, unavailable, malformed, redacted and unknown observations remain distinguishable;
12. repeated consumers in one invocation can reuse a validated environment snapshot without rereading unrelated facts;
13. S01 work remains bounded independently of repository size;
14. environment presence cannot bypass policy/authorization;
15. Windows/Linux/macOS fixtures cover path/runtime observation semantics without globally assuming case/symlink behavior.

## Resolved freeze decisions
1. Environment discovery scope: **minimal primitive host/runtime/cwd facts plus exact allowlisted environment keys; no full environment/tool/repository/provider scan**.
2. Compatibility ownership: **M04 observes; M51 owns support policy/matrix; M04 may apply an injected compatibility decision when preflight requires it**.
3. Working directory: **operational discovery input only, never canonical project/repository identity**.
4. Environment access: **request-scoped allowlist, never ambient full-map capture**.
5. Process use: **no subprocess/shell for primitive S01 facts available from the runtime/environment port**.
6. Reuse: **validated per-invocation snapshot is reusable; durable cross-run cache authority is delegated**.
7. Evidence: **compact/sanitized facts and typed gaps; raw sensitive/local material excluded by default**.
8. M38 boundary: **M38 owns general capability detection/registry; S01 owns only primitive environment observations required to begin M04 preflight**.

## Freeze record
Exact-head semantic review passed on PR `#72`, reviewed head `60d89f5a6969d9579db22eb9e7a6462f2affb7b6`, and the planning contract was merged as `4890124c7258c05f7df7dd12934e0800e3564d1d` before checkpoint promotion.

## Session completion rule
M04-S01 is frozen. Reopening requires governed change control or invalidated evidence. The next legal planning session is `GBS-M04-S02 — Git`.

STOP CONDITION: `M04_S01_FROZEN`.
