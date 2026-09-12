# GBS-M01-S02 — Deterministic Command Router

Status: `IN_DISCUSSION`

## Objective
Freeze the command/use-case routing contract for the Deterministic Work Plane Kernel so a bounded request resolves to exactly one registered use-case with the minimum necessary validation, capability checks and context, without semantic rediscovery or open-ended repository exploration.

## Binding decisions
- M01-S01 runtime contract is FROZEN.
- Library-first typed API; CLI is a thin adapter.
- Deterministic runtime has no semantic authority.
- Source authority, scope, risk and policy decisions arrive from governed contracts rather than being invented by the router.
- Token/time economy favors exact routing over discovery loops.

## Candidate routing pipeline
```text
Typed Request
  -> Envelope Validation
  -> Command ID Resolution
  -> Contract Version Resolution
  -> Capability/Policy Precheck
  -> Target/State Binding
  -> Handler Resolution
  -> Execution Context Assembly
  -> Invoke Exactly One Use-Case
  -> Typed Result / Typed Failure
```

## Command identity
Every routable operation has a stable command/use-case ID. Human aliases and CLI names may map to a stable ID, but aliases are never canonical identifiers.

A command registration declares at minimum:
- stable command ID;
- input contract/schema version;
- output/result contract version;
- owning module/domain;
- required capabilities;
- security/action class where applicable;
- mutation/read-only classification;
- target binding requirements;
- timeout/resource policy reference;
- handler factory/reference;
- compatibility/deprecation metadata when relevant.

## Registry model
The router uses an explicit registry built at application composition time. It must not scan the repository, load arbitrary modules dynamically, use filename guessing or infer handlers from free-form user text.

Duplicate command IDs fail startup/composition deterministically. Unknown command IDs return a typed `COMMAND_NOT_FOUND` equivalent and do not trigger exploratory search.

## Semantic boundary
The router does not interpret product intent. A semantic planning layer may compile a governed request into a stable command ID + validated input. Once inside M01, the router executes that contract only.

The router MUST NOT:
- choose between competing product strategies;
- invent missing requirements;
- broaden scope;
- select risk acceptance;
- rewrite source authority;
- guess a command when identity is ambiguous;
- silently fall back to a different command.

## Capability precheck
Before handler invocation, the router checks declared capability requirements against the active runtime capability set. Missing capability yields a typed block before side effects.

Examples include filesystem write, Git, GitHub/provider network, package registry network, secret access, destructive authorization or optional adapter capability.

Capability checks are additive to Security/Policy. Possessing a capability does not itself authorize an operation.

## Policy/security precheck
The router consumes a pre-resolved policy decision or invokes a deterministic policy port where the owning policy can be evaluated mechanically. S4/elevated-destructive operations require the frozen explicit authorization path and may never be auto-promoted by routing logic.

## Target/state binding
Commands that depend on a repository/project/transaction must receive or derive a validated target binding before mutation. Expected state/fingerprint mismatches fail before handler execution where detectable.

The router records the resolved target identity in execution context but does not decide canonical project identity rules, which remain owned by M03.

## Input validation
Input is validated against the command's versioned contract before the handler runs. Unknown fields, incompatible schema versions or invalid values fail closed according to M02 policy. Handlers do not repeatedly parse raw CLI/environment/prose input.

## Execution context
The router passes a compact typed context containing only the cross-cutting mechanics needed by the handler, such as:
- run/correlation ID;
- command ID/version;
- validated target binding;
- validated runtime configuration reference;
- capability set;
- cancellation/timeout signal;
- ports/adapters required by the use-case;
- sanitized telemetry sink;
- policy/authorization receipt references where applicable.

Large semantic documents, chat history and unrelated repository state are not ambient execution-context fields.

## Handler isolation
Each command maps to one primary handler/use-case. A handler may invoke domain services or sub-operations through explicit dependencies, but recursive router dispatch is prohibited by default because it obscures ownership, budgets and evidence. Composition through a governed application orchestrator is preferred.

If nested dispatch is later needed, it must carry parent/child correlation, explicit budget inheritance and cycle detection.

## Alias and deprecation policy
CLI aliases, legacy command names and compatibility shims live outside canonical IDs. Deprecated aliases may resolve to the same canonical command while emitting structured deprecation metadata. Alias chains are prohibited; alias -> canonical ID is one hop.

## Failure model requirements
Routing outcomes remain typed and distinguish at minimum:
- malformed request;
- unknown command;
- incompatible contract version;
- duplicate/invalid registration;
- missing capability;
- policy/authorization block;
- target/state conflict;
- timeout/cancellation before invocation;
- handler failure after invocation;
- unexpected router/internal fault.

S05 owns the final shared error taxonomy.

## Deterministic ordering
Registry enumeration, help/introspection output and receipts use stable ordering independent of object insertion order or filesystem discovery. Canonical sorting rules belong to machine-contract/integrity ownership where hashes are involved.

## Introspection
A read-only introspection surface may expose registered command metadata for help, diagnostics, capability planning and tests. It must not expose secrets, hidden provider credentials or executable internals that create a security boundary problem.

## Token/time economy
The router is a major token-economy boundary:
- stable command IDs prevent executor rediscovery;
- explicit registry prevents repository scanning;
- predeclared capabilities prevent failed exploratory attempts;
- versioned contracts prevent prose parsing;
- no fuzzy command guessing;
- compact typed context prevents unrelated source injection;
- typed failures make correction prompts delta-oriented.

## Candidate frozen decisions
1. Explicit stable command IDs are canonical; CLI/user aliases are non-canonical adapters.
2. Registry is explicit at composition time; no filesystem/module scanning or dynamic guess-based discovery.
3. Unknown/ambiguous command identity fails closed; router never guesses or silently falls back.
4. Input contract validation occurs before handler invocation.
5. Required capabilities are declared in registration and checked before side effects.
6. Capability possession never substitutes for security/policy authorization.
7. Target/state binding occurs before mutation-capable handlers where applicable.
8. One canonical command maps to one primary handler/use-case.
9. Recursive router dispatch is prohibited by default; explicit orchestration is preferred.
10. Execution context is compact and mechanical, not a carrier for broad semantic context/chat history.
11. Aliases resolve one hop to canonical IDs; deprecation is explicit and observable.
12. Registry/introspection ordering is stable and deterministic.
13. Router returns typed routing failures suitable for compact evidence and correction flows.
14. Router cannot make semantic governance decisions.

## Open questions before freeze
1. Should command IDs use a namespaced format such as `gef.<domain>.<verb>` or opaque stable IDs? Current direction: namespaced human-readable stable IDs.
2. Should registration be static TypeScript composition or permit signed/validated manifests for official adapters? Current direction: core static composition; adapter registrations through validated capability manifests owned by M42.
3. Should nested dispatch be forbidden outright in V1 or allowed under an explicit orchestration primitive? Current direction: forbid direct recursive router calls; allow application orchestrators to call multiple use-cases explicitly.
4. Should introspection expose contract schema references directly? Current direction: yes, non-secret schema IDs/versions only.
5. Should unsupported command contract versions permit deterministic migration/adaptation? Current direction: only explicit version adapters registered by M02/M50, never implicit coercion.

## Session completion gate
S02 may become FROZEN only when the five open questions are resolved, exact-head review passes, no conflict exists with M01-S01/Security/Architecture, checkpoint advances to GBS-M01-S03, and no functional implementation is introduced by this planning session.

STOP CONDITION: `M01_S02_REVIEW_REQUIRED`.
