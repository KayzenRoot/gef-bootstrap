# GBS-M08-S02 — TypeScript and Node

Status: `FROZEN`

## Purpose
Freeze the deterministic specialized-profile contract for TypeScript projects that run on a supported Node.js LTS line. S02 refines the frozen S01 Generic Profile with explicit TypeScript/Node technology semantics while preserving S01 selection, identity, non-execution, snapshot and authority boundaries.

S02 defines what it means for the built-in profile `typescript-node` to express TypeScript + Node intent. It deliberately does **not** pick a package manager, framework, web stack, deployment platform, repository topology, test framework or exact Node version. Those choices either belong to later modules/sessions or must arrive as explicit governed input.

S02 performs no package installation, script execution, dependency resolution, repository mutation, runtime download or template fetching.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M08_S02`;
- frozen `GBS-M08-S01 — Generic Profile`;
- completed M00-M07 public contracts;
- Architecture A1: deterministic implementation model uses TypeScript on an explicitly supported Node.js LTS line, strict TypeScript and modern ESM-oriented Node semantics;
- Deployment runtime policy: supported Node LTS ranges are explicit and owned by M51, never `latest`;
- M04 bounded discovery and explicit-input rules;
- M07 typed variable/profile-binding contract and precedence `TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT`;
- M05/M06 transaction and filesystem authority boundaries;
- frozen Security rules for process execution, dependency/tool invocation, repository content and secrets;
- frozen Requirements, Scope, Definition of Done and Test & Benchmark Plan;
- M09 ownership of exact template source resolution/distribution;
- M13 ownership of new-project/brownfield adoption policy;
- M32 ownership of CI bootstrap;
- M34/M35 ownership of security bootstrap/policy safety;
- M51 ownership of exact runtime/platform compatibility;
- M53-M58 ownership of test/security/performance harnesses;
- M63 ownership of quantitative executor-performance thresholds.

## Ownership boundary
M08-S02 OWNS:
- the product-owned `typescript-node` specialized profile identity;
- TypeScript + Node LTS technology intent;
- strict TypeScript and modern ESM-oriented baseline semantics;
- deterministic distinction between profile semantics and runtime/tool availability evidence;
- package-manager neutrality unless an exact manager is provided by an owning explicit contract;
- typed profile-binding candidates associated with exact M07 templates when those templates are admitted;
- TypeScript/Node-specific profile semantic digest inputs;
- specialized proof obligations and typed profile errors.

M08-S02 DOES NOT OWN:
- profile selection/default behavior or generic baseline rules (S01);
- Python profile semantics (S03);
- Web/App framework/application semantics (S04);
- profile inheritance/composition (S05);
- template language/rendering/variable authority (M07);
- exact template catalog/source resolution (M09);
- brownfield discovery/adoption strategy (M13);
- process/package-manager execution (M01/Security and later owning modules);
- exact Node compatibility ranges (M51);
- CI workflows (M32), dependency vulnerability policy (M34/M35), release policy (M33), or test framework selection (later owning modules);
- filesystem/Git/provider mutation authority.

## Specialized semantic extension
S02 extends the S01 logical profile with one output-relevant semantic block:

```text
TypeScriptNodeProfileSemantics {
  language: TYPESCRIPT
  runtimeFamily: NODE
  runtimeChannel: SUPPORTED_LTS
  moduleSemantics: MODERN_ESM
  typecheckMode: STRICT
  packageManagerPolicy: EXPLICIT_OR_ADOPTION_OWNED
  frameworkPolicy: UNSPECIFIED
  applicationShape: UNSPECIFIED
}
```

For `profileKind = TYPESCRIPT_NODE`, this block is mandatory and exact under the active S02 contract. It is semantic data only; it does not execute or discover tools.

## Frozen TypeScript/Node contract

### TSN-01 — Canonical profile identity is `typescript-node`
The product-owned specialized profile ID is exactly `typescript-node` and its `profileKind` is exactly `TYPESCRIPT_NODE`.

It is selected only through S01's exact `EXPLICIT_PROFILE` mechanism unless a later separately governed selection contract explicitly introduces another path. Repository content cannot shadow this product-owned ID.

### TSN-02 — TypeScript is explicit, not inferred from JavaScript
The profile declares `language = TYPESCRIPT`.

S02 does not silently reinterpret plain JavaScript, JSX, CoffeeScript, Deno, Bun-only or another language/runtime profile as TypeScript/Node because filenames or dependencies look similar. Supporting those combinations requires their own admitted profile/contract or explicit later extension.

### TSN-03 — Runtime family is Node, exact line remains M51-owned
The profile declares `runtimeFamily = NODE` and `runtimeChannel = SUPPORTED_LTS`.

It MUST NOT hard-code `latest`, a moving alias, or an exact Node major/minor as permanent profile semantics. The exact supported Node.js LTS line/range is resolved from the release's M51 Compatibility Matrix and verified by the owning preflight/compatibility path.

Changing M51 support does not require redefining the meaning of `typescript-node`, provided the profile's semantic runtime channel remains `SUPPORTED_LTS`.

### TSN-04 — Runtime intent is not runtime availability evidence
Selecting `typescript-node` states desired/supported technology semantics only. It does not prove that Node exists on the host, that the version is supported, or that a package manager is installed.

Host capability evidence must come from explicit M04/M38/M51-owned observation. Missing/unsupported runtime capability blocks the owning operation before governed mutation; S02 never downloads or installs Node to make the profile “work”.

### TSN-05 — Strict TypeScript is the baseline
The profile declares `typecheckMode = STRICT`.

A release/admitted TypeScript template associated with this profile must not deliberately disable strictness through broad weakening such as a profile-owned `strict=false` default. Narrow compiler exceptions may exist only when explicitly owned, documented and reviewable in the target template/project contract.

S02 does not itself author `tsconfig.json`; M07/M09-owned exact templates materialize artifacts later.

### TSN-06 — Modern ESM is the semantic baseline
The profile declares `moduleSemantics = MODERN_ESM`, consistent with the frozen architecture's ESM-oriented modern Node model.

This means profile-provided template intent should prefer explicit modern Node ESM-compatible semantics rather than hidden CommonJS defaults or runtime-dependent guessing.

S02 does not execute module resolution and does not claim every downstream dependency is ESM-only.

### TSN-07 — CommonJS compatibility cannot be inferred or silently forced
A brownfield repository using CommonJS is not rewritten merely because `typescript-node` is selected.

Compatibility/migration from CommonJS is a governed adoption/migration concern owned by M13/M51 and the applicable Work Order. The profile itself cannot silently flip package/module semantics or rewrite imports.

### TSN-08 — Package manager is intentionally not auto-selected
`packageManagerPolicy = EXPLICIT_OR_ADOPTION_OWNED`.

S02 does not automatically choose npm, pnpm, Yarn or another manager based on:
- which executable happens to be on PATH;
- presence order of lockfiles;
- package-manager popularity;
- host/global configuration;
- a moving product preference.

For a new project, an owning later contract may provide an explicit deterministic package-manager choice. For brownfield adoption, M13 may preserve/validate an already-governed repository choice. S02 itself only carries the resulting exact value when an admitted M07 template declaration requires it.

### TSN-09 — Multiple lockfiles are a conflict signal, not precedence
If later bounded discovery observes conflicting manager indicators/lockfiles, S02 supplies no “winner”. The owning discovery/adoption contract must classify the state, require explicit resolution or prove a deterministic repository-owned choice.

Serialized/list order and filesystem enumeration order are never package-manager precedence.

### TSN-10 — Package manager identity does not authorize package execution
Even when an exact manager choice exists, it is data. It does not authorize install, update, audit, build, test, postinstall/preinstall lifecycle execution or arbitrary package scripts.

Those operations require the owning execution/security contract and explicit capability/authorization gates.

### TSN-11 — Lifecycle scripts are never executed during profile processing
Profile parsing/selection/projection MUST NOT run `preinstall`, `install`, `postinstall`, `prepare`, `prepublish`, custom package scripts or any package-manager hook.

A future package installation operation must separately own lifecycle-script policy and security evidence.

### TSN-12 — Dependency versions are not invented by S02
S02 does not choose `latest`, query registries, resolve semver ranges or synthesize package versions.

Exact dependency/version choices belong to exact admitted templates/Source Pack/release integration and their security/compatibility evidence. Profile semantics may select between already-admitted exact template variants only through deterministic governed fields.

### TSN-13 — Framework is unspecified
`frameworkPolicy = UNSPECIFIED`.

The core TypeScript/Node profile does not imply Express, Fastify, NestJS, Hono, Next.js, React, Angular, Vue, Electron or any other framework. Web/App specialization belongs to S04 or another explicit profile contract.

### TSN-14 — Application shape is unspecified
`applicationShape = UNSPECIFIED`.

S02 does not decide whether the target is a library, CLI, backend service, worker, monorepo package, full application or another shape. Exact shape is provided by a later profile/application contract or explicit governed input.

### TSN-15 — No repository topology assumption
The profile does not assume `src/`, `packages/`, `apps/`, workspace layout, single-package root or monorepo structure.

Any exact path/layout comes from admitted templates and project/adoption context, remains subject to M07 target validation and M05/M06 authority.

### TSN-16 — No test framework is implied
The profile does not choose Vitest, Jest, Node test runner, Playwright or another testing stack merely because the project is TypeScript/Node.

Test framework/tooling belongs to exact project templates and later testing modules, with explicit compatibility/security evidence.

### TSN-17 — No formatter/linter is implied
S02 does not automatically choose ESLint, Biome, Prettier or another formatter/linter. Such choices are explicit template/project/toolchain semantics, not ambient profile inference.

### TSN-18 — No build tool or bundler is implied
S02 does not automatically choose `tsc` emit, tsx, ts-node, esbuild, Rollup, Vite, SWC, webpack or another build/runtime tool.

Strict TypeScript/modern ESM semantics constrain compatible choices but do not select one.

### TSN-19 — `package.json` is data, not executable authority
A future exact template may materialize `package.json`, but profile processing treats package metadata declaratively. Script fields, package-manager fields, exports/imports and lifecycle hooks do not execute during M08 processing.

Existing brownfield `package.json` content is repository input and remains untrusted until the owning discovery/adoption/security contracts validate its use.

### TSN-20 — `tsconfig` semantics remain exact-template/project data
A future TypeScript template may materialize one or more tsconfig files. S02 freezes only the strict-TypeScript intent and modern Node/ESM baseline.

It does not inject arbitrary compiler flags into an existing project, merge tsconfig graphs by last-write-wins, follow executable config, or auto-rewrite path aliases.

### TSN-21 — Toolchain configuration is never ambient
Global npm config, user `.npmrc`, home-directory Yarn/pnpm config, shell aliases, global TypeScript installs and PATH ordering are not profile semantics.

If a later operation must use any such external configuration, it must observe and admit it through the owning explicit port/policy with provenance.

### TSN-22 — Registry/network access is outside profile evaluation
Selecting/projecting `typescript-node` MUST NOT contact npm or another registry, query package metadata, check for updates, resolve tags, fetch tarballs or perform vulnerability lookups.

Those are separately governed network/security operations.

### TSN-23 — Credentials and registry tokens are forbidden profile content
npm tokens, registry credentials, GitHub tokens, private registry passwords/certificates and equivalent secret material are not admitted in S02 profile content or ordinary M07 profile bindings.

Non-secret references may be passed only when the target M07 declaration independently classifies them as `SENSITIVE_REFERENCE`; S02 never reclassifies/dereferences them.

### TSN-24 — Exact template references retain S01 rules
Any TypeScript/Node `templateBindings` admitted into the release use exact template ID/version and optional exact semantic digest as frozen by S01.

S02 cannot use floating tags/ranges/branches and cannot fetch or auto-discover the referenced template.

### TSN-25 — TypeScript/Node bindings remain subordinate to M07 declarations
Technology-specific profile bindings are only typed M07 `PROFILE_BINDING` candidates. They cannot create variables, change `valueClass`, broaden allowed contexts/sources, coerce types or outrank explicit input.

### TSN-26 — Specialized semantic block enters profile identity
The S02 semantic block participates in `profileSemanticDigest`, including `language`, `runtimeFamily`, `runtimeChannel`, `moduleSemantics`, `typecheckMode`, `packageManagerPolicy`, `frameworkPolicy` and `applicationShape`.

Changing those semantics requires a new specialized profile semantic identity/version as governed by S01.

### TSN-27 — Tool availability/probe evidence stays out of semantic identity
Observed Node executable paths, installed Node version, package-manager path/version, global packages and host PATH order are operational evidence, not profile semantic content.

Identical profile content has identical semantic identity across hosts even when tool availability differs.

### TSN-28 — Brownfield preservation is explicit, not accidental
When M13 applies this profile to an existing project, repository-local runtime/module/package-manager conventions are not overwritten merely because they differ from the preferred new-project baseline.

M13 must classify compatibility, produce a migration/normalization decision when needed, and preserve approved repository truth until a governed mutation is authorized.

### TSN-29 — New-project defaults and brownfield compatibility are separate decisions
A release may later define recommended new-project template defaults compatible with S02. Those defaults do not become evidence that an existing project should be rewritten to match them.

The profile is reusable across both adoption modes because identity/technology intent is separated from mutation/migration authority.

### TSN-30 — Runtime/platform checks fail before effects
When an operation requires Node execution, unsupported/missing runtime evidence must block before M05/M06 effects begin. S02 cannot downgrade an unsupported runtime to warning or fabricate compatibility.

Exact compatibility interpretation remains M51-owned.

### TSN-31 — Portability remains Windows/Linux/macOS aware
Profile semantics use no host-specific paths, shell syntax or path separators. TypeScript/Node profile planning must remain portable across supported Windows, Linux and macOS hosts.

Host-specific process invocation details, executable suffixes and filesystem behavior belong to execution/M06/M51 contracts.

### TSN-32 — Profile processing is S0 read-only and startup-pure
Parsing, validating, selecting, hashing and projecting S02 data MUST NOT:
- write files;
- mutate Git/provider state;
- install/download Node or packages;
- invoke package managers, TypeScript compiler or scripts;
- read global/home config by implication;
- scan the repository;
- perform network access.

Importing the future package remains effect-free.

### TSN-33 — Work is bounded and cancellable
S01 resource/cancellation limits continue to apply. S02 adds finite limits for technology-specific semantic fields and diagnostics. There is no unbounded probing or registry/package traversal in profile processing.

### TSN-34 — Typed specialized errors are explicit
Future implementation should distinguish at least:
- `TYPESCRIPT_NODE_PROFILE_SEMANTICS_INVALID`;
- `TYPESCRIPT_NODE_RUNTIME_UNSUPPORTED`;
- `TYPESCRIPT_NODE_RUNTIME_EVIDENCE_MISSING`;
- `TYPESCRIPT_NODE_PACKAGE_MANAGER_UNSPECIFIED` when an owning downstream template requires it;
- `TYPESCRIPT_NODE_PACKAGE_MANAGER_CONFLICT` when admitted upstream evidence is contradictory;
- `TYPESCRIPT_NODE_TEMPLATE_BINDING_INVALID`;
- `TYPESCRIPT_NODE_BINDING_INVALID`;
- `TYPESCRIPT_NODE_BUDGET_EXCEEDED`;
- `TYPESCRIPT_NODE_CANCELLED`.

S02 itself does not fabricate runtime/tool observations solely to emit these states.

## Canonical built-in profile semantics
The built-in specialized profile has this exact technology intent:

```text
profileId = typescript-node
profileKind = TYPESCRIPT_NODE
language = TYPESCRIPT
runtimeFamily = NODE
runtimeChannel = SUPPORTED_LTS
moduleSemantics = MODERN_ESM
typecheckMode = STRICT
packageManagerPolicy = EXPLICIT_OR_ADOPTION_OWNED
frameworkPolicy = UNSPECIFIED
applicationShape = UNSPECIFIED
```

Its release-shipped `templateBindings` MAY be empty at the S02 contract level. Exact useful template bindings are admitted only when M07/M09 release integration provides exact template identities and evidence; S02 does not invent placeholder template IDs.

## Deterministic specialization algorithm
1. S01 selects exact `profileId = typescript-node` through `EXPLICIT_PROFILE`.
2. Validate S01 base envelope and S02 specialized semantic block exactly.
3. Confirm the specialized semantic block equals the active S02 contract for the built-in profile.
4. Compute profile semantic identity including S02 semantic fields.
5. Enforce any S01 profile version/digest expectations.
6. Do not inspect host/repository/tool state during profile selection.
7. If an owning downstream operation supplies exact runtime/tool evidence, keep that evidence separate from semantic identity and let M51/other owner validate it.
8. If exact M07 template snapshots are supplied for profile template bindings, project only typed candidates under M07 rules.
9. Emit compact bounded profile/evidence status without executing tools or effects.

## Proof obligations for future implementation
The M08 Work Order must prove at minimum:
1. Only exact `typescript-node` selects the built-in profile; near/fuzzy names fail.
2. Repository-local content cannot shadow the built-in profile.
3. Profile selection performs no package/repository/tool/network discovery.
4. `SUPPORTED_LTS` does not mean `latest` and does not hard-code an exact Node line owned by M51.
5. Runtime availability/version evidence is separate from profile semantic identity.
6. Strict TypeScript and modern ESM semantics are stable canonical profile fields.
7. Package manager is not chosen from PATH or lockfile enumeration order.
8. Conflicting package-manager evidence is not silently resolved by S02.
9. Selecting/projecting the profile executes zero lifecycle/package scripts.
10. No registry/network lookup occurs during profile processing.
11. No dependency version is resolved from floating tags/ranges by S02.
12. No framework/test/lint/build tool is implicitly selected.
13. Profile values remain typed M07 candidates and cannot alter M07 `valueClass`/precedence.
14. Secret registry credentials are rejected/redacted safely.
15. Existing CommonJS/brownfield projects are not auto-rewritten by profile selection.
16. Profile semantics are identical across supported Windows/Linux/macOS hosts for identical admitted inputs.
17. Startup/import is effect-free.
18. Finite budgets and cancellation are enforced.
19. S02 APIs cannot bypass M05/M06 mutation/path authority.
20. Exact template references obey S01 and do not fetch/resolve themselves.

## Review checklist
- [x] Checkpoint authorizes only M08-S02.
- [x] Frozen S01 selection/identity/authority rules are preserved.
- [x] TypeScript + Node LTS intent is explicit and deterministic.
- [x] Exact Node compatibility remains M51-owned.
- [x] Package manager/framework/app shape are not ambiently guessed.
- [x] Strict TypeScript and modern ESM baseline match frozen Architecture.
- [x] Brownfield compatibility does not imply destructive normalization.
- [x] Package scripts/install/registry access are outside profile processing.
- [x] M07 variable/type/`valueClass`/precedence authority remains intact.
- [x] M05/M06 effect/path authority remains intact.
- [x] Secret material is not admitted.
- [x] S0 read-only, startup purity, portability, bounded work and cancellation are explicit.
- [x] Future proof obligations are testable.

## Session completion rule
S02 may be promoted to `FROZEN` only after exact-head semantic review finds no unresolved HIGH/CRITICAL architecture, security, determinism, portability or ownership-boundary defect.

S02 earns **no M08 production credit**. After a separate checkpoint promotion, the only next legal planning stage is:

`GBS-M08-S03 — Python`

No M08 Work Order may be compiled until S01-S05 are frozen and the separate M08 Module Gate returns implementation-ready.

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.
