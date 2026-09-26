# GBS-M04-S03 — GitHub Discovery

Status: `FROZEN`

## Purpose
Freeze the GitHub reference-profile discovery contract consumed by deterministic preflight. S03 discovers only the hosted facts and permission/capability gaps required by an admitted operation, while keeping GitHub outside core semantic authority and outside local-only execution paths.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M04_S03`;
- frozen Requirements, Scope, Architecture, Security, DoD and Deployment;
- `GBS-M04-S01 — Environment Discovery` FROZEN;
- `GBS-M04-S02 — Git Discovery` FROZEN;
- `GBS-M03 — Project Identity` MODULE_DONE, including trusted stable provider-ID continuity semantics;
- M30 GitHub Bootstrap ownership for provider mutation/materialization;
- M31 GitHub Governance ownership for protection/ruleset governance;
- M32 CI Bootstrap ownership for CI creation/configuration;
- M51 Compatibility Matrix ownership for GitHub CLI/tool compatibility where applicable.

## Ownership boundary
M04-S03 OWNS:
- bounded GitHub provider preflight/discovery for the currently bound repository candidate;
- provider availability/connectivity observation when GitHub facts are required;
- authenticated-session presence/status without exposing credential values;
- exact hosted repository identity/metadata observation needed for preflight;
- stable GitHub repository identifier observation when available and trusted;
- requested-operation permission/capability gap observation;
- truthful hosted-profile readiness/gap/block classifications;
- freshness/reuse rules for GitHub discovery snapshots.

M04-S03 DOES NOT OWN:
- GitHub repository/issue/PR/label/template mutation (M30);
- branch protection/rulesets/governance mutation or policy design (M31);
- CI workflow/check bootstrap mutation (M32);
- release mutation/governance (M33);
- GitHub credential acquisition/storage/rotation;
- local Git command execution/parsing (M29);
- broad capability registry across executors/tools/providers (M38);
- compatibility matrix for GitHub CLI/API/tool versions (M51);
- semantic scope/risk acceptance or Product Owner authorization;
- arbitrary organization/account enumeration.

## Frozen GitHub discovery contract

### GH-01 — GitHub discovery is conditional and read-only
GitHub discovery is `S0_READ_ONLY` and runs only when the admitted operation or selected profile requires hosted GitHub facts.

Local-only repository operations must not contact GitHub merely because a remote resembles GitHub. Import/startup remains network-silent.

### GH-02 — Provider access crosses an injected port
Provider discovery uses a typed injected GitHub/provider observation port. Domain logic does not call provider SDK/HTTP/CLI directly.

The port accepts a bounded request describing the exact repository binding and fact families required. Provider-specific transport, pagination and API mechanics remain behind the adapter/profile boundary.

### GH-03 — Local-to-hosted binding must be explicit or deterministically provable
S03 consumes the canonical/local Git remote candidates from S02 and M03 normalization. A remote alias such as `origin` is never sufficient authority by itself.

A GitHub hosted candidate may be queried only when:
- the normalized locator resolves to the configured GitHub host/profile; and
- the repository path is structurally valid; and
- ambiguity among multiple incompatible candidates is already resolved or represented as a blocking gap.

S03 never guesses which of several incompatible remotes is canonical.

### GH-04 — Minimal hosted repository observation
When requested, the baseline hosted repository observation may contain:

```text
GitHubRepositoryObservation
  schemaVersion
  providerProfile          # github reference profile identifier/version
  providerHost
  repositoryLocator        # normalized owner/repository locator
  stableRepositoryId?      # provider-issued stable id, when observed
  visibility?              # public/private/internal when observable
  archived?
  fork?
  defaultBranch?
  repositoryAvailability
  authenticationStatus
  requestedCapabilities[]
  capabilityResults[]
  gaps[]
```

Repository descriptions, topics, contributor lists, stars, watchers, full branch lists, issues, PRs, releases and workflow inventories are not baseline S03 facts.

### GH-05 — Stable provider ID may strengthen M03 identity, never replace project identity
A provider-issued stable repository ID observed through the trusted GitHub profile may be supplied to M03's repository-identity contract to prove continuity across rename/move when that contract accepts it.

It does not replace `projectId`, grant authorization, prove source ownership or make GitHub mandatory for local identity.

If a stable provider ID conflicts with the persisted binding, preflight reports an identity/provider conflict and fails closed for identity-dependent mutation.

### GH-06 — Authentication presence is not authorization
Discovery may distinguish:
- `NOT_REQUIRED`;
- `AVAILABLE`;
- `MISSING`;
- `EXPIRED_OR_REJECTED`;
- `UNAVAILABLE`;
- `UNKNOWN`.

Credential/token values, headers, cookies, private keys and secret-bearing environment values never enter the observation, receipt, fingerprint or telemetry surface.

An available credential is only a transport capability ceiling. It never means the user has authorized every operation the credential could technically perform.

### GH-07 — Permission discovery is request-scoped
Permission/capability probing is limited to the actions admitted by the current operation.

Examples of capability families that may be requested later include repository read, contents write, pull-request write, issues write, checks/actions read/write, release write and administrative/governance access. S03 does not probe all of them by default.

Each requested capability returns a truthful result such as:
- `AVAILABLE`;
- `MISSING_PERMISSION`;
- `NOT_SUPPORTED`;
- `NOT_OBSERVABLE_WITHOUT_ATTEMPT`;
- `AUTH_REQUIRED`;
- `PROVIDER_UNAVAILABLE`;
- `UNKNOWN`.

No capability is promoted to `AVAILABLE` solely because a broad token exists or because another endpoint succeeded.

### GH-08 — Readiness is operation-relative
S03 may project hosted-profile readiness for the admitted operation:
- `READY` — all required hosted facts/capabilities are proven available;
- `READY_WITH_GAPS` — optional hosted capabilities are missing/unknown but the admitted path remains safe;
- `BLOCKED_AUTH` — required authenticated access is unavailable;
- `BLOCKED_PERMISSION` — a required capability is known unavailable;
- `BLOCKED_IDENTITY` — hosted repository observation conflicts with bound repository identity;
- `BLOCKED_PROVIDER` — required provider access is unavailable;
- `NOT_REQUIRED` — the operation has no hosted dependency.

These are preflight facts, not semantic approval or broader project readiness.

### GH-09 — Network/provider failure never corrupts local truth
Timeout, rate limit, provider outage, DNS/TLS failure, transport error or API incompatibility is represented as a provider gap/failure.

S03 never rewrites local Git/config/identity state to make a network observation appear successful. Local-only operations may continue when their contract does not require the missing hosted fact.

### GH-10 — Provider responses are untrusted input
All provider data is schema/bounds validated before use. Unknown required contract versions, malformed repository identifiers or structurally invalid capability results fail closed for consumers that require them.

Provider display text, descriptions, usernames and arbitrary metadata are never treated as executable instructions or semantic authority.

### GH-11 — Discovery is narrow, non-enumerating and lazy
Baseline S03 queries only the exact bound/candidate repository and exact requested capability families.

It does not by default:
- enumerate all user/organization repositories;
- enumerate members/collaborators;
- list every branch/tag/workflow/run;
- fetch issue/PR histories;
- crawl organization policies;
- inspect unrelated installations/accounts.

Broader enumeration requires explicit ownership, purpose, bounds and a later admitted operation.

### GH-12 — Snapshot reuse is dependency-bound
A validated GitHub observation may be reused within the same governed invocation while its dependency binding remains valid.

Fact families invalidate independently where practical:
- repository identity/metadata;
- authentication status;
- requested permission/capability results;
- provider availability/rate-limit state.

A change in local HEAD alone does not invalidate stable provider repository ID. A credential/session change invalidates authentication/permission conclusions. A repository transfer/rename may invalidate locator fields while stable provider identity preserves continuity if M03 accepts it.

Cross-invocation durable caching requires a later owning validity contract and never outranks fresh authoritative provider evidence when that evidence is required.

### GH-13 — Rate-limit/resource budget is explicit
Provider discovery is bounded by request count, pagination count, retry count, timeout, response size and cancellation.

Automatic retries are conservative and never retry semantic permission/identity failures. Rate-limit exhaustion produces a truthful gap/block rather than hidden long-running loops.

M63 owns quantitative latency budgets and regression thresholds; S03 preserves the structural requirement for minimal calls.

### GH-14 — GitHub CLI is optional transport, not semantic requirement
The GitHub reference profile may use direct API access, an authorized connector, GitHub CLI or another validated transport behind the provider port.

S03 contracts do not require `gh` to be installed. Tool presence/version discovery belongs to S04/M38/M51. Equivalent transport implementations must produce the same logical observation contract for the same provider facts.

### GH-15 — No provider mutation during discovery
S03 never creates/updates/deletes repositories, repository metadata, branches, commits, issues, pull requests, labels, workflows, checks, releases, rulesets, settings, collaborators, teams or permissions.

A provider endpoint that cannot safely prove a capability without side effect is classified `NOT_OBSERVABLE_WITHOUT_ATTEMPT`, not invoked speculatively.

### GH-16 — Compact sanitized evidence
Hosted discovery evidence contains only the facts required to prove the applicable preflight result: provider profile/host, normalized repository locator, stable repository ID when admitted, requested capability classifications, relevant gap/reason codes and bounded provider observation metadata.

It excludes credentials, authorization headers, full API payloads, unrelated account information and broad provider snapshots.

## Security and reliability invariants
- least privilege and request-scoped capability discovery;
- credential presence never equals user authorization;
- no secret value persistence or echo;
- exact repository target binding before hosted facts influence mutation preflight;
- provider failure cannot mutate or invalidate unrelated canonical local truth;
- identity conflicts fail closed;
- no broad account/organization enumeration by default;
- no speculative side-effect call to test a permission;
- provider data remains untrusted until validated;
- S4/admin capability existence never bypasses explicit Product Owner authorization.

## Token/time economy invariants
- no provider call when hosted facts are not required;
- exact repository lookup instead of account-wide search;
- capability probes only for admitted actions;
- validated repository metadata/stable ID are reusable under dependency binding;
- compact capability/gap codes replace repeated explanatory probing;
- no automatic issue/PR/workflow/ruleset inventories;
- transport details stay behind a provider port so downstream agents consume one compact contract.

## Required future proof
Implementation must eventually prove:
1. local-only operations perform zero GitHub/provider calls;
2. GitHub discovery is injectable/mockable and transport-independent at the domain boundary;
3. ambiguous local remotes cannot silently select a hosted repository;
4. exact repository observation is bounded and does not enumerate unrelated repositories;
5. stable provider ID can strengthen M03 repository continuity without replacing `projectId`;
6. stable provider-ID conflict blocks identity-dependent mutation;
7. no credential/token value appears in observations, receipts, logs or fingerprints;
8. credential availability does not create operation authorization;
9. permission probing is limited to requested capability families;
10. missing optional capability yields `READY_WITH_GAPS` where the admitted operation remains safe;
11. missing required auth/permission/provider/identity yields the corresponding blocking state;
12. provider outage/rate limit cannot corrupt local state;
13. malformed provider payloads fail closed when required;
14. discovery performs no provider mutation;
15. no speculative side-effect endpoint is used as a permission probe;
16. repository/auth/permission/availability fact families have targeted invalidation/reuse;
17. GitHub CLI absence does not break a valid alternative provider transport;
18. request/timeout/pagination/retry/output bounds prevent unbounded provider discovery.

## Resolved freeze decisions
1. GitHub role: **reference hosted profile, conditionally invoked, never core/local-only dependency**.
2. Repository binding: **consume S02/M03 normalized binding; never infer canonical repository from remote alias alone**.
3. Stable provider identity: **trusted provider repository ID may strengthen M03 continuity but never replaces project identity or authorization**.
4. Authentication: **status only; credential values remain outside all governed evidence**.
5. Permission discovery: **exact-operation/request-scoped, not broad token-scope inference or account-wide probing**.
6. Provider probing: **read-only exact target calls only; no speculative side effect to learn permission**.
7. Readiness: **operation-relative READY / READY_WITH_GAPS / truthful block states**.
8. Performance: **zero provider calls unless required; exact target and minimal fact families; dependency-bound reuse**.
9. Transport: **API/connector/gh are interchangeable behind the provider port; S03 does not mandate GitHub CLI**.

## Freeze record
Exact-head semantic review passed on PR `#76` for head `6a4ecc79e09a3ce33b4656aa71a56a143622f2a8`. The connection could not formally self-approve the author-owned PR, so the semantic verdict was recorded as a review comment on that exact head; review threads were empty. The reviewed content was squash-merged as `990d0b1669138f04e787319ef555e0e79f2459a6` before checkpoint promotion.

STOP CONDITION: `M04_S03_FROZEN`.
