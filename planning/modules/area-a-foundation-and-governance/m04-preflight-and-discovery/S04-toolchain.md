# GBS-M04-S04 — Toolchain Discovery

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze the bounded toolchain-observation contract used by deterministic preflight. S04 answers only the tool facts required by the admitted operation, with safe process probing and explicit gaps, without scanning the machine, installing/updating tools or duplicating capability/compatibility ownership.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M04_S04`;
- frozen Requirements, Scope, Architecture, Security, DoD and Deployment;
- `GBS-M04-S01 — Environment Discovery` FROZEN;
- `GBS-M04-S02 — Git Discovery` FROZEN;
- `GBS-M04-S03 — GitHub Discovery` FROZEN;
- M01 runtime/process safety contract;
- M38 Capability Detection ownership for general executor/tool/capability catalog and negotiation;
- M51 Compatibility Matrix ownership for supported runtime/Git/GitHub CLI/toolchain versions;
- M63 Executor Performance Engine ownership for quantitative latency budgets and optimization evidence.

## Ownership boundary
M04-S04 OWNS:
- request-scoped observation of tools required by the current preflight;
- safe executable-resolution/probe input and result contract;
- normalized presence/version/identity/gap observations;
- separation of tool presence from compatibility and authorization;
- bounded process-probe requirements;
- per-invocation reuse and targeted invalidation of observed tool facts;
- truthful preflight readiness when required tools are absent or unobservable.

M04-S04 DOES NOT OWN:
- global tool/executor capability registry, selection or negotiation (M38);
- supported-version policy/matrix (M51);
- package installation/update/removal (M49/M50 or owning distribution flow);
- Git command semantics (M29);
- GitHub hosted discovery (S03) or GitHub mutation (M30+);
- project-specific build/test command selection (later profiles/context/test-impact ownership);
- arbitrary repository script execution;
- environment-wide software inventory;
- semantic choice of which technology a project should adopt.

## Frozen toolchain discovery contract

### TOOL-01 — Tool discovery is explicit and request-scoped
Toolchain discovery is `S0_READ_ONLY`. The admitted use-case requests exact logical tool IDs/fact families. S04 does not enumerate all installed programs, shells, SDKs, package managers or project scripts.

No tool probe runs during library import/startup merely to populate a cache.

### TOOL-02 — Logical tool IDs precede executable names
Downstream domain logic requests a stable logical tool ID such as `git`, `node`, `npm` or an admitted profile-defined tool ID. It does not construct arbitrary executable paths or command lines from repository text.

Resolution/probe descriptors come from a validated built-in/profile/capability contract owned by the applicable later module. Repository content cannot silently register arbitrary executable code as trusted tooling.

### TOOL-03 — Observation uses an injected tool/process port
Tool discovery crosses an injectable typed port. A baseline request contains only bounded information such as:

```text
ToolObservationRequest
  toolId
  requiredFacts[]          # presence, version, executable identity/capability marker
  resolutionPolicyRef
  probeContractRef?
  timeoutBudget?
```

The result is normalized independently from raw process output.

### TOOL-04 — Minimal normalized observation
A tool observation may contain:

```text
ToolObservation
  schemaVersion
  toolId
  presenceStatus
  executableIdentity?      # bounded opaque/local identity, not raw machine inventory
  observedVersion?
  versionParseStatus?
  probeStatus
  gaps[]
```

Absolute executable paths are operational details and are excluded from reusable compact evidence by default unless an owning security/evidence contract explicitly needs a bounded local reference.

### TOOL-05 — Presence, version and compatibility are distinct
S04 may prove that a declared tool was found and may observe a version using an admitted read-only probe. It does not decide that the observed version is supported.

Compatibility is evaluated against an injected/versioned policy owned by M51. Therefore:
- `FOUND` does not imply `COMPATIBLE`;
- a parsable version does not imply support;
- an unparseable version is a gap, not a guessed version;
- support ranges are never duplicated inside S04.

### TOOL-06 — Safe resolution only
Executable resolution must obey Security SEC-05:
- only approved logical tools or explicitly admitted trusted paths may be resolved;
- repository-controlled arbitrary paths are not executed without owning policy validation;
- no untrusted shell interpolation;
- no implicit privilege escalation;
- no write-capable probe selected merely because it is convenient.

A candidate executable that cannot be established under the declared resolution policy remains unavailable/ambiguous rather than guessed.

### TOOL-07 — No broad PATH/software scan
S04 does not walk filesystem trees or enumerate every PATH directory to build a global inventory.

Resolution may use the platform/process abstraction for one requested approved tool under a bounded policy. The implementation may cache the result within the invocation. A request for one tool must not trigger discovery of unrelated tools.

### TOOL-08 — Version probes are declarative and side-effect-free
If version observation requires process execution, the probe contract is predefined/validated for that logical tool/profile. The baseline probe:
- launches the executable directly with an argument array;
- uses shell-disabled process execution;
- is expected to be read-only;
- has bounded timeout/output;
- uses a minimal environment;
- cannot receive arbitrary extra arguments from repository content.

If a safe version probe is unknown, S04 reports version `UNOBSERVABLE` rather than improvising a command.

### TOOL-09 — Process output is parsed narrowly
Raw stdout/stderr from tool probes is untrusted operational input. Parsers consume only the bounded material needed for the declared fact, such as a version token.

Full probe output is not propagated into canonical state or ordinary compact receipts. Unexpected large/binary/malformed output terminates the probe truthfully under its bounds.

### TOOL-10 — Tool presence never grants operation authority
Finding Git, GitHub CLI, package managers, compilers, deployment CLIs or other tools does not authorize their use for a mutation or external side effect.

S04 proves mechanical availability only. Policy/security/Work Order/provider gates remain independent.

### TOOL-11 — Tool and transport alternatives remain explicit
An admitted operation may declare alternatives, for example a GitHub provider adapter that can use a connected API transport without `gh`.

The preflight contract evaluates the exact requirement expression supplied by the owning use-case/profile. S04 does not mark the whole operation blocked merely because one optional transport tool is absent when an admitted equivalent capability is already available.

### TOOL-12 — Readiness is requirement-relative
For an exact tool requirement, S04 may classify:
- `READY` — required presence/facts are observed and downstream compatibility requirements pass when applicable;
- `READY_WITH_GAPS` — missing optional facts/tools do not block the admitted path;
- `BLOCKED_TOOL_MISSING` — required tool is absent;
- `BLOCKED_TOOL_AMBIGUOUS` — required tool cannot be safely resolved;
- `BLOCKED_TOOL_INCOMPATIBLE` — injected M51 policy classifies observed version unsupported;
- `BLOCKED_PROBE` — required tool fact cannot be safely observed;
- `NOT_REQUIRED` — no tool observation is needed for the selected path.

Compatibility judgment itself remains M51-owned even when the result is projected into M04 readiness.

### TOOL-13 — Snapshot reuse and targeted invalidation
A validated tool observation may be reused inside the governed invocation.

Each tool observation is independently invalidatable. Re-observe only when a relevant dependency changes, for example:
- resolution policy changes;
- process environment/PATH input relevant to resolution changes;
- explicit tool path/config changes;
- compatibility policy needs a fact that was not previously observed.

A Git HEAD change alone does not invalidate a stable tool version observation. Provider availability alone does not invalidate local tool presence.

### TOOL-14 — Cross-run persistence is subordinate
S04 does not make durable tool caches authoritative. Cross-run reuse requires an owning validity contract that binds the relevant environment/tool-resolution inputs.

When current proof is required and cache validity is uncertain, the fact is re-observed rather than assumed.

### TOOL-15 — Missing tools do not trigger automatic installation
Discovery never installs, upgrades, downgrades, repairs or removes tools. It may emit a structured remediation reference owned by distribution/help/compatibility systems.

A missing or incompatible dependency remains a truthful preflight gap/block until a separately admitted operation changes the environment and a new observation proves the result.

### TOOL-16 — Project-local executables are not automatically trusted
Files under `node_modules/.bin`, virtual environments, repository scripts or other project-local tool surfaces may later be supported by an explicit profile/security contract, but their mere presence inside the target repository does not make them trusted executable sources.

S04 baseline must not auto-execute repository-supplied code during discovery.

### TOOL-17 — Tool discovery is cancellable and bounded
Every process-backed probe receives cancellation, timeout and output limits. Probe failures are isolated and classified per tool; optional unrelated probes may proceed only when orchestration declares independence.

No hidden retry loop is allowed. Automatic retry, when safe and useful, remains bounded by the invocation budget and never retries deterministic incompatibility/policy failures.

### TOOL-18 — Compact evidence surface
Evidence carries only requested tool IDs and normalized status/version/compatibility/gap classifications needed by the admitted operation.

It excludes complete PATH contents, global software inventories, raw environment maps, arbitrary process output and unnecessary absolute local paths.

## Security and reliability invariants
- approved logical tool before resolution/execution;
- no arbitrary repository-selected executable;
- shell disabled for baseline probes;
- argv separation and minimal environment;
- bounded timeout/output/cancellation;
- raw probe output treated as untrusted;
- tool existence never equals authorization;
- no install/update/repair in discovery;
- no broad PATH/filesystem inventory;
- project-local code is not auto-trusted or auto-executed.

## Token/time economy invariants
- observe only tools/facts requested by the selected path;
- reuse validated per-invocation observations;
- do not re-probe stable tool facts because unrelated repository/provider state changed;
- resolve transport alternatives before probing unnecessary tools;
- compact statuses/version tokens replace raw command output;
- no machine-wide software inventory;
- safe primitive observation avoids model reasoning whenever a deterministic probe suffices.

## Required future proof
Implementation must eventually prove:
1. requesting one tool does not enumerate unrelated tools;
2. import/startup performs no tool probe;
3. arbitrary repository executable paths cannot enter the approved tool probe path;
4. safe probes use executable + argv with shell disabled;
5. probes honor timeout/output/cancellation bounds;
6. complete PATH and raw process environment are absent from normal observations/evidence;
7. raw version output is bounded and narrowly parsed;
8. absent and ambiguously resolved tools remain distinct;
9. unparseable version does not become a guessed compatible version;
10. compatibility comes from injected M51 policy;
11. optional tool absence can yield `READY_WITH_GAPS` when an admitted alternative exists;
12. required missing/incompatible/unsafe-to-probe tool blocks truthfully;
13. discovery performs no installation/update/removal;
14. project-local executable presence is not automatically trusted;
15. independent tool observations support targeted reuse/invalidation;
16. Git/HEAD/provider-state changes do not force unrelated tool re-probes;
17. compact evidence excludes unnecessary raw paths/output;
18. deterministic fixture injection can test Windows/Linux/macOS resolution semantics without machine-dependent tests.

## Resolved freeze decisions
1. Discovery granularity: **exact logical tools and requested fact families only; no software inventory**.
2. Resolution authority: **approved tool/profile descriptors, never arbitrary repository-selected executable paths**.
3. Compatibility: **S04 observes; M51 owns supported-version policy**.
4. Generic capability catalog: **M38 owns registry/negotiation; S04 consumes only exact preflight requirements**.
5. Probe safety: **direct executable + argv, shell disabled, bounded output/time/cancellation, minimal environment**.
6. Installation: **never part of discovery; separate admitted distribution/upgrade operation required**.
7. Project-local tooling: **not auto-trusted or auto-executed by baseline S04**.
8. Performance: **lazy per-tool observation, transport alternatives first, targeted snapshot reuse**.

## Session completion rule
Planning content is frozen-candidate. Exact-head semantic review must confirm alignment with Security process policy, M01 runtime, S01-S03 lazy preflight, M38 capability ownership, M51 compatibility ownership and M63 performance goals. After approval/merge, checkpoint advances only to `GBS-M04-S05 — Project State`.

STOP CONDITION: `M04_S04_EXACT_HEAD_REVIEW_REQUIRED`.
