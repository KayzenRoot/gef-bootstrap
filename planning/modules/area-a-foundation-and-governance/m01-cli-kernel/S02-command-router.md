# GBS-M01-S02 — Deterministic Command Router

Status: `FROZEN_CANDIDATE`

## Objective
Freeze the command/use-case routing contract for the Deterministic Work Plane Kernel so a bounded request resolves to exactly one registered use-case with the minimum necessary validation, capability checks and context, without semantic rediscovery or open-ended repository exploration.

## Binding decisions
- M01-S01 runtime contract is FROZEN.
- Library-first typed API; CLI is a thin adapter.
- Deterministic runtime has no semantic authority.
- Source authority, scope, risk and policy arrive through governed contracts.
- Token/time economy favors exact routing over discovery loops.

## Frozen routing pipeline
```text
Typed Request
  -> Envelope Validation
  -> Canonical Command ID Resolution
  -> Contract Version Resolution
  -> Capability/Policy Precheck
  -> Target/State Binding
  -> Handler Resolution
  -> Minimum Mechanical Context Assembly
  -> Invoke Exactly One Use-Case
  -> Typed Result / Typed Failure
```

## Canonical command identity
Canonical IDs use stable human-readable namespaces of the form `gef.<domain>.<action>`, with lower-case machine-stable tokens governed by the command-contract schema. They are identity, not display labels.

Rules:
- canonical IDs are immutable within a compatible major contract line;
- CLI/user aliases are non-canonical adapters;
- aliases are one hop only: alias -> canonical ID;
- aliases never shadow another canonical ID;
- renaming a canonical operation requires governed compatibility/deprecation treatment, not silent replacement;
- fuzzy matching and free-text command guessing are prohibited.

A command registration declares at minimum stable command ID, input/output contract versions, owner module/domain, required capabilities, security/action class where applicable, mutation/read-only class, target binding requirements, timeout/resource policy reference, primary handler and compatibility/deprecation metadata where relevant.

## Registry model
Core registration is explicit static TypeScript composition. The router does not scan the repository, infer modules from filenames, import arbitrary packages dynamically or discover handlers from prose.

Official adapters may contribute registrations only through validated capability manifests and the adapter contract owned by M42. Manifest loading does not grant semantic authority and cannot bypass capability/security/policy validation.

Duplicate canonical IDs, invalid registrations or conflicting adapter contributions fail deterministically before command execution. Unknown IDs return typed failure without exploratory search.

## Semantic boundary
The router executes a precompiled governed request. It cannot choose product strategy, invent missing requirements, broaden scope, accept risk, rewrite source authority, guess an ambiguous operation or silently fall back to another command.

## Validation and authorization order
Before invoking a mutation-capable handler, the router must establish, as applicable:
1. structurally valid request envelope;
2. known canonical command ID;
3. compatible input/output contract versions;
4. valid typed input;
5. declared required capabilities present;
6. applicable deterministic policy/authorization satisfied;
7. valid target/project binding;
8. expected state/fingerprint compatibility where detectable;
9. timeout/cancellation/resource budget still valid.

Capability possession never equals authorization. S4/elevated destructive actions always retain their frozen explicit authorization path.

## Version compatibility
Unsupported contract versions fail closed by default. Deterministic migration/adaptation is allowed only through an explicitly registered version adapter owned by M02/M50 or the relevant contract owner.

Version adapters must:
- identify source and target contract versions;
- be deterministic for equivalent inputs;
- validate output against the target contract;
- preserve or explicitly surface semantic loss;
- emit adaptation metadata suitable for evidence;
- never perform implicit best-effort coercion.

## Execution context
The handler receives only compact mechanical context required by the use-case, including run/correlation ID, canonical command ID/version, validated target binding, validated runtime config reference, capability set, cancellation/timeout signal, explicitly required ports/adapters, sanitized telemetry sink and policy/authorization receipt references where relevant.

Chat history, broad semantic documents and unrelated repository state are never ambient context fields.

## Handler and orchestration boundary
Each canonical command resolves to exactly one primary handler/use-case.

Direct recursive router dispatch from a handler is prohibited. Multi-step workflows use explicit application orchestrators that invoke typed use-cases through declared dependencies. Orchestrators own sequencing, parent/child correlation, budget propagation, compensation/recovery linkage and evidence aggregation.

This avoids hidden call graphs, routing cycles, duplicated policy checks and token-expensive rediscovery.

## Introspection
A read-only deterministic introspection surface may expose:
- canonical command IDs;
- owner/domain;
- input/output schema IDs and versions;
- required capability names;
- mutation/read-only classification;
- public deprecation/compatibility metadata.

It must not expose secrets, credentials, private environment values, provider tokens, sensitive target data or executable internals beyond the governed diagnostic contract. Output ordering is stable.

## Failure requirements
Routing remains typed and distinguishable for malformed request, unknown command, incompatible version, invalid/duplicate registration, missing capability, policy/authorization block, target/state conflict, pre-invocation timeout/cancellation, version-adapter failure, handler failure and unexpected internal router fault. M01-S05 owns the shared final taxonomy.

## Deterministic ordering
Registry enumeration, introspection, help metadata and receipts use stable ordering independent of insertion order, module load order or filesystem discovery. Hash/signature canonicalization remains owned by machine-contract/integrity mechanisms.

## Token/time economy
The router is an explicit efficiency boundary:
- canonical IDs remove handler rediscovery;
- static core composition removes scans/import guessing;
- adapter manifests prevent broad plugin exploration;
- versioned typed contracts remove prose parsing;
- predeclared capabilities prevent doomed attempts;
- minimum mechanical context avoids semantic-context bloat;
- typed failures enable delta correction instead of complete reruns;
- explicit orchestrators make execution paths predictable and benchmarkable.

## Frozen decisions
1. Canonical command IDs are namespaced human-readable stable IDs: `gef.<domain>.<action>`.
2. Core registry uses explicit static TypeScript composition.
3. Official adapter registrations enter only through validated M42 capability manifests/contracts.
4. Unknown or ambiguous identity fails closed; no fuzzy guess or silent fallback.
5. Input contract validation occurs before handler invocation.
6. Required capabilities are declared and prechecked before side effects.
7. Capability possession never substitutes for policy/security authorization.
8. Target/state binding occurs before mutation-capable handlers where applicable.
9. One canonical command maps to one primary handler/use-case.
10. Direct recursive router dispatch is prohibited; explicit application orchestrators compose multiple use-cases.
11. Execution context is compact/mechanical and excludes broad chat/semantic context.
12. Aliases are one hop and non-canonical; deprecation is explicit/observable.
13. Introspection may expose non-secret command/schema/capability metadata only.
14. Unsupported contract versions require explicit deterministic version adapters; implicit coercion is prohibited.
15. Registry/introspection ordering is deterministic.
16. Router emits typed routing failures suitable for compact evidence/correction.
17. Router never makes semantic governance decisions.

## Delegated ownership
- M02: contract/schema validation and registered version adapters
- M03: canonical target/project identity
- M04: capability/preflight discovery
- M16/M34/M35: policy/security evaluation
- M42: adapter manifests and isolation contracts
- M43: telemetry schema
- M50: upgrade/migration compatibility adapters
- M01-S03: lifecycle/orchestration boundaries
- M01-S05: shared error taxonomy

## Resolved freeze questions
1. Namespaced command IDs `gef.<domain>.<action>`: **RESOLVED YES**.
2. Static core composition + validated adapter manifests: **RESOLVED YES**.
3. No direct recursive router calls; explicit orchestrators only: **RESOLVED YES**.
4. Introspection exposes non-secret schema IDs/versions: **RESOLVED YES**.
5. Incompatible versions use explicit registered adapters only: **RESOLVED YES**.

## Session completion gate
Planning content is frozen-candidate. Final `FROZEN` requires exact-head review, merge and checkpoint advancement to `GBS-M01-S03`. No functional implementation is introduced by this planning session.

STOP CONDITION: `M01_S02_EXACT_HEAD_REVIEW_REQUIRED`.
