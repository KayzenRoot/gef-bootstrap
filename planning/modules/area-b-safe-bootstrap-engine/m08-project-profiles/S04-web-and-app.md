# GBS-M08-S04 — Web and App

Status: `FROZEN`

## Purpose
Freeze deterministic application-shape semantics for browser-facing, server-rendered, API-backed and application-oriented projects without making a framework, bundler, deployment-provider or package-manager guess. S04 builds on frozen S01 Generic Profile, S02 TypeScript/Node, and S03 Python while preserving their central separation between profile intent and runtime/tool availability evidence.

S04 is declarative only. It does not execute package managers, frameworks, dev servers, browsers, build tools, deployment CLIs or application code; it does not fetch templates or mutate repositories.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M08_S04`;
- frozen M08-S01/S02/S03 contracts;
- completed M00-M07 public contracts;
- M04 bounded discovery/explicit-input rules;
- M07 typed profile bindings and exact rendering/validation boundary;
- M05/M06 mutation/path authority;
- frozen Architecture/Security/Requirements/Scope/DoD/Test Plan;
- M09 template/source resolution;
- M13 new-project/brownfield adoption;
- M32 CI bootstrap;
- M34/M35 security policy;
- M38 capability detection;
- M51 compatibility policy;
- M63 performance budgets.

## Ownership boundary
M08-S04 OWNS:
- product-owned `web-app` profile identity;
- explicit application-shape vocabulary;
- browser/server/API/static-render intent;
- deterministic frontend/backend boundary semantics;
- framework/bundler/deployment neutrality unless explicitly selected by governed input/template;
- specialized semantic-digest fields and proof obligations.

M08-S04 DOES NOT OWN:
- generic selection/default semantics (S01);
- language/runtime profiles (S02/S03);
- inheritance/composition (S05);
- framework selection/versioning;
- package-manager/build-tool execution;
- browser automation/E2E execution;
- hosting/provider selection;
- API contract design, database architecture or deployment implementation;
- M07 template semantics or M05/M06 effect/path authority.

## Specialized semantic extension

```text
WebAppProfileSemantics {
  applicationFamily: WEB_APP
  renderingModel: UNSPECIFIED | CLIENT | SERVER | HYBRID | STATIC
  apiModel: UNSPECIFIED | NONE | INTERNAL | EXTERNAL | MIXED
  clientLanguageProfile?: exact profileId
  serverLanguageProfile?: exact profileId
  frameworkPolicy: EXPLICIT_OR_TEMPLATE_OWNED
  bundlerPolicy: EXPLICIT_OR_TEMPLATE_OWNED
  deploymentPolicy: UNSPECIFIED
}
```

## Frozen Web/App contract

### WAP-01 — Canonical identity
The product-owned specialized profile ID is exactly `web-app`; `profileKind` is exactly `WEB_APP`. Repository content cannot shadow it.

### WAP-02 — Application shape is explicit
Selecting `web-app` expresses application-family intent only. It does not infer React, Next.js, Vue, Angular, Svelte, Astro, Remix, Nuxt, Django, Flask, FastAPI, Rails-like architecture or another framework from repository files or installed tooling.

### WAP-03 — Rendering model is explicit data
Rendering model is one of `UNSPECIFIED`, `CLIENT`, `SERVER`, `HYBRID`, or `STATIC`. No mode is inferred from filenames, routes, dependencies or build output.

### WAP-04 — API model is explicit data
API model is one of `UNSPECIFIED`, `NONE`, `INTERNAL`, `EXTERNAL`, or `MIXED`. The profile does not invent endpoint contracts, authentication, persistence or provider integrations.

### WAP-05 — Language/runtime profiles are exact references
When client/server language profiles are present they reference exact admitted product profile IDs, such as `typescript-node` or `python`. S04 does not merge or reinterpret their runtime/tool semantics.

### WAP-06 — Web/App does not become an inheritance loophole
S04 may reference cooperating specialized profile identities but does not itself define inheritance or overlay precedence. Composition remains S05-owned.

### WAP-07 — Framework remains explicit/template-owned
Framework selection is never derived from dependency files, lockfiles, directory names or popularity. Exact framework/version choices belong to governed templates/release integration and compatibility/security evidence.

### WAP-08 — Bundler/build system remains explicit/template-owned
Vite, webpack, Rollup, esbuild, Turbopack, Parcel or another bundler/build path is not selected merely by choosing `web-app`.

### WAP-09 — Deployment provider is unspecified
Vercel, Netlify, Cloudflare, AWS, Azure, GCP, Fly.io, Render, Railway, self-hosted infrastructure or another target is not implied. Deployment ownership stays with later deployment/provider modules and explicit project scope.

### WAP-10 — Browser target policy is not ambient
User-agent data, locally installed browsers or host OS do not change profile semantics. Browser compatibility belongs to explicit compatibility/project requirements.

### WAP-11 — Dev server execution is forbidden during profile processing
Selecting/projecting the profile never starts a local server, opens a port, launches a browser, runs hot reload, executes framework CLIs or invokes project scripts.

### WAP-12 — Browser automation is outside M08
Playwright, Cypress, Selenium or other browser-driving tools may later be selected by testing modules/templates, but profile processing never launches them.

### WAP-13 — Existing app architecture is preserved in brownfield mode
M13 may use this profile to classify an existing app, but S04 itself cannot reorganize routes, components, API folders, workspaces, server/client boundaries, rendering model or framework conventions.

### WAP-14 — New-project defaults do not mandate brownfield normalization
Recommended new-project templates are not evidence that an existing web app should be rewritten to match them.

### WAP-15 — No implicit monorepo/workspace topology
The profile does not assume `apps/`, `packages/`, frontend/backend sibling folders or a single application root.

### WAP-16 — No implicit state-management choice
Redux, Zustand, Pinia, MobX, Context, signals, server-state libraries or other client state tools are not profile defaults.

### WAP-17 — No implicit CSS/UI stack
Tailwind, CSS Modules, styled-components, Sass, component libraries or design systems are not inferred or selected by the profile.

### WAP-18 — No implicit API transport
REST, GraphQL, tRPC, RPC, WebSocket, SSE or queue-based integration is not inferred. API model classifies scope only, not protocol.

### WAP-19 — No implicit authentication model
Sessions, JWTs, OAuth/OIDC, passkeys, provider-specific auth and authorization policy remain security/application concerns outside S04.

### WAP-20 — No implicit persistence/database choice
Relational, document, key-value, local storage, indexed DB or external SaaS persistence is not selected by `web-app`.

### WAP-21 — Template references remain exact
Any S04 template binding follows S01 exact template ID/version/digest rules. No `latest`, ranges, moving branches, registry scans or repository auto-discovery.

### WAP-22 — M07 remains authoritative for bindings
S04 specialized values are typed `PROFILE_BINDING` candidates only. They cannot declare template variables, alter `valueClass`, widen contexts/sources, coerce types or outrank explicit input.

### WAP-23 — Semantic identity is deterministic
Rendering/API/application semantics and exact referenced language-profile identities enter `profileSemanticDigest`; observed tools, installed browsers, dev-server ports, local URLs and host state do not.

### WAP-24 — Tool availability remains operational evidence
Presence/version/path of Node/Python, package managers, browsers, framework CLIs or bundlers is capability evidence owned by preflight/capability/compatibility modules, not profile content.

### WAP-25 — Network access is outside profile evaluation
Profile processing does not access package registries, CDNs, deployment APIs, remote schemas, live endpoints or browser URLs.

### WAP-26 — Secrets are forbidden profile content
Deployment tokens, OAuth secrets, API keys, database credentials and session secrets are not admitted. Non-secret references remain subject to M07 declaration policy.

### WAP-27 — Profile intent grants no port/network authority
A rendering/API model does not authorize opening listeners, binding ports, making outbound requests or exposing services.

### WAP-28 — Profile intent grants no deployment/provider authority
S04 cannot create hosting projects, domains, DNS records, cloud resources, secrets, deployments or provider configuration by itself.

### WAP-29 — S0/read-only and startup purity
Parsing/selecting/hashing/projecting S04 data performs no repository scans by implication, writes, builds, installs, server launches, browser launches, network/provider calls or process execution.

### WAP-30 — Bounded/cancellable behavior
S01 resource limits apply; application semantic fields, profile references and diagnostics are bounded. Cancellation/budget exhaustion cannot produce partial acceptance.

### WAP-31 — Typed errors
Future implementation should distinguish at least:
- `WEB_APP_PROFILE_SEMANTICS_INVALID`;
- `WEB_APP_RENDERING_MODEL_INVALID`;
- `WEB_APP_API_MODEL_INVALID`;
- `WEB_APP_LANGUAGE_PROFILE_UNKNOWN`;
- `WEB_APP_TEMPLATE_BINDING_INVALID`;
- `WEB_APP_BINDING_INVALID`;
- `WEB_APP_BUDGET_EXCEEDED`;
- `WEB_APP_CANCELLED`.

## Canonical built-in intent

```text
profileId = web-app
profileKind = WEB_APP
applicationFamily = WEB_APP
renderingModel = UNSPECIFIED
apiModel = UNSPECIFIED
frameworkPolicy = EXPLICIT_OR_TEMPLATE_OWNED
bundlerPolicy = EXPLICIT_OR_TEMPLATE_OWNED
deploymentPolicy = UNSPECIFIED
```

## Proof obligations
The M08 implementation Work Order must prove at minimum:
1. `web-app` cannot be repository-shadowed.
2. Framework/bundler/provider choices are never inferred from ambient state.
3. Rendering/API model validation is closed and deterministic.
4. Language-profile references are exact and cannot mutate referenced profile semantics.
5. No dev server/browser/build/deploy/network action occurs during profile processing.
6. Brownfield app topology is not rewritten by profile selection.
7. M07 binding authority and M05/M06 effect authority remain intact.
8. Secrets are rejected/redacted safely.
9. Semantic identity excludes host/tool/browser observations.
10. Import/startup is effect-free and work is bounded/cancellable.

## Review checklist
- [x] S01-S03 invariants preserved.
- [x] Framework/build/provider inference prohibited.
- [x] Application shape is explicit and closed.
- [x] Brownfield preservation is explicit.
- [x] No network/process/provider/mutation authority introduced.
- [x] M07/M05/M06 boundaries preserved.

## Session completion rule
S04 may be promoted to `FROZEN` only after exact-head semantic review finds no unresolved HIGH/CRITICAL defect.

Planning earns no production credit. After checkpoint promotion, the only next legal stage is:

`GBS-M08-S05 — Profile Inheritance`

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.
