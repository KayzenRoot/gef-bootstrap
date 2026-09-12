# Deployment & Distribution

Status: `FROZEN`

## Binding
Deployment & Distribution derives from frozen Constitution v1.1, Project Overview, Requirements, complete-production Scope, Architecture, Security, Test & Benchmark Plan, Definition of Done and weighted Backlog Baseline.

No functional implementation begins from this document until the remaining Source Pack closure permits construction.

## Objective
Define how GEF Bootstrap is installed, distributed, upgraded, verified, recovered and released across Windows, Linux and macOS without weakening security, reproducibility, compatibility or the project's token/time-efficiency goals.

The product remains local-first and usable from a checked-out Git repository/filesystem. Distribution mechanics simplify operator access but never become semantic authority.

## Frozen distribution model
1. **npm/package-first is the primary production channel.**
2. **Direct library consumption** is an official supported surface.
3. **Thin CLI/operator surface** is an official package surface over library/application contracts.
4. **Repository checkout/development install** remains a supported contributor/recovery path.
5. **GitHub Releases** publish release notes, exact-source manifest, checksums and optional downloadable artifacts.
6. **Standalone executable** is separately promotable and is not required for initial independent `PRODUCTION_RELEASE_DONE` unless its own promotion gates later pass and Scope is explicitly amended.
7. Optional UADS/Hive/UGAS adapters remain separately activatable packages/profiles and do not block independent production completion.

## Primary build/distribution flow
```text
accepted source head
  -> reproducible build inputs
  -> package artifacts
  -> package-content inspection
  -> T0–T7 applicable verification
  -> provenance/checksum manifest
  -> registry publication
  -> GitHub Release binding
  -> post-publication install/retrieval verification
  -> release receipt
```

## Public package topology
Public package count stays intentionally small. Package boundaries follow externally useful architectural contracts, not one package per module.

Frozen public surfaces:
- core/application library package;
- official CLI package or CLI entrypoint from the primary package, selected during M49 implementation based on measured packaging/support cost;
- generic adapter SDK/API package where independent external extension requires it;
- official optional adapter packages only when individually supported and released.

Provider-specific/internal workspaces stay private unless an explicit public integration contract requires otherwise. Testkit is public only if external adapter/profile conformance genuinely requires it.

Package names and scopes must be collision-checked at implementation/release time and cannot be frozen here before registry availability is verified.

## Versioning
Production public packages use Semantic Versioning.

- patch: backward-compatible fixes;
- minor: backward-compatible capability additions;
- major: incompatible public API/schema/behavior changes requiring governed migration;
- prerelease identifiers are allowed for `rc` but cannot represent `PRODUCTION_RELEASE_DONE`;
- machine contracts carry explicit `schemaVersion` independent of package SemVer where required;
- schema compatibility rules determine whether a package change is patch/minor/major, never the reverse;
- optional adapters declare supported core/protocol version ranges;
- incompatible schema migration requires an explicit migration contract, evidence and release notes.

No version bump may conceal an incompatible migration.

## Supported runtime policy
- support is declared as explicit Node.js LTS compatibility range(s), never `latest`;
- M51 Compatibility Matrix owns exact supported lines;
- unsupported runtime fails before governed mutation with actionable diagnostics;
- runtime support changes require compatibility evidence and release notes;
- release builds pin toolchain/build inputs sufficiently for reproducibility/audit;
- no release claim may exceed the exact T7 matrix actually proven.

## Installation/setup/uninstall boundaries
Installation is non-destructive by default.

Installing the package MUST NOT:
- mutate a target repository;
- silently modify global Git/configuration;
- activate adapters;
- perform provider mutations;
- create semantic project decisions.

Setup/bootstrap is a separate explicit operation that runs identity/preflight before writes and follows S0–S4 security policy.

Uninstalling the tool removes only tool-owned installation artifacts. It MUST NOT silently delete target-project governance, checkpoints, receipts, history or user project data.

## Publication security
Preferred registry publication uses short-lived OIDC/trusted publishing where the registry/workflow supports it.

Production publication requires:
- frozen lockfile/dependency graph;
- isolated release workflow;
- least-privilege identity;
- no long-lived publish secret when a supported OIDC path exists;
- package contents allowlist/inspection;
- exact source/tag/version binding;
- checksums for distributed artifacts;
- provenance/attestation where supported;
- secret scanning/publication gate;
- no publish from unreviewed local working-tree state.

If OIDC is unavailable, a fallback credential mechanism is allowed only when Security explicitly permits it, credentials are short-lived/minimally scoped where possible, and the release receipt records the deviation.

## GitHub release model
Every stable release binds:
- product version;
- exact accepted source commit;
- immutable tag;
- published package version(s);
- compatibility-matrix version;
- release manifest;
- artifact inventory/checksums;
- provenance/attestation references where available;
- migration/upgrade notes;
- explicit accepted non-blocking limitations, if any;
- production-acceptance evidence receipt;
- post-publication verification result.

Tag/Release objects are release-governance mechanics. Exact-state evidence remains semantic completion authority.

## Upgrade model
```text
DETECT CURRENT VERSION/STATE
  -> CHECK COMPATIBILITY
  -> PLAN MIGRATION
  -> PREVIEW IMPACT
  -> CREATE RECOVERY MATERIAL
  -> APPLY
  -> VERIFY
  -> EMIT UPGRADE RECEIPT
  -> CLEAN RETAINED RECOVERY BY POLICY
```

Frozen rules:
- no silent self-update;
- no destructive migration merely because a new version exists;
- major migration is explicit and previewable;
- governed files use ownership/schema-aware migration, never blind replacement;
- partial failure leaves recoverable state or truthful blocked state;
- downgrade is supported only where an explicit reversible migration contract exists and is tested;
- unsupported downgrade fails clearly;
- update checks are disableable, bounded and policy-controlled;
- update metadata is untrusted until validated.

## Rollback/recovery semantics
- local transaction: recover/restore from journal/recovery material;
- Git: prefer governed non-destructive restoration;
- published package/release: use deprecation, replacement or corrective release, never pretend publication history was atomically rolled back;
- hosted provider side effects: compensating actions where supported;
- migration rollback: only where explicitly modeled and proven.

A partially published release is a governed incident state, never success.

## Release channels
Only these channels are canonical unless later governed expansion is justified:
- `dev/internal` — engineering builds, no production claim;
- `rc` — complete release candidate evidence, not final production acceptance;
- `stable` — only after `PRODUCTION_RELEASE_DONE` for the claimed release state.

Stable publication before production acceptance is prohibited.

## Standalone executable policy
Standalone/single-file executable distribution is useful but secondary.

It may be promoted only after evidence proves:
- build mechanism stability adequate for the supported runtime policy;
- reproducible/deterministic-enough build procedure;
- Windows/Linux/macOS artifacts;
- signing/notarization strategy where applicable;
- native dependency/addon behavior, if any;
- install/startup/update benchmark versus package distribution;
- equivalent or stronger provenance/security;
- maintenance/Engineering ROI justification.

Until promotion, package distribution is the canonical production path and absence of a standalone binary does not block independent `PRODUCTION_RELEASE_DONE`.

## Cross-platform distribution
Production evidence covers the exact claimed support set for:
- Windows install/use/remove/upgrade;
- Linux install/use/remove/upgrade;
- macOS install/use/remove/upgrade;
- path/permissions/symlink/reparse-point behavior;
- shell-independent process invocation;
- line-ending/executable-bit differences;
- package cache/offline failure;
- interrupted install/upgrade recovery where GEF owns mutation.

## Reproducible release principle
GEF requires reproducible *release inputs and provenance*, but does not claim bit-for-bit reproducibility unless measured and proven.

Required recorded inputs:
- frozen source commit;
- lockfile/dependency graph;
- supported build runtime/toolchain;
- build commands/configuration;
- artifact inventory;
- distributed-artifact checksums;
- workflow/run environment sufficient for audit.

## Release failure policy
Failures are classified at least as:
- build failure;
- verification failure;
- signing/attestation failure;
- registry publication failure;
- provider release failure;
- post-publication verification failure.

Failure cannot be converted to PASS by retry alone. Partial publication enters explicit incident/recovery state.

## Token/time efficiency requirements
Distribution minimizes recurring engineering cost through:
- one canonical build graph;
- deterministic package inventory generation;
- reusable compatibility metadata;
- machine-readable release manifest;
- automatic checksum/receipt generation;
- no duplicate handwritten evidence;
- delta-aware upgrade checks;
- cheap preflight before expensive matrix work;
- parallel validation/signing/publication where assurance permits.

## Production Deployment evidence
Before the Deployment surface can support `PRODUCTION_RELEASE_DONE`, current evidence must prove:
1. clean package build from accepted exact source;
2. package-content allowlist/inspection;
3. install/invocation on supported OS/Node matrix;
4. direct library/API consumption where claimed;
5. upgrade from every supported predecessor compatibility class;
6. migration failure/recovery behavior;
7. unsupported runtime/version fail-fast behavior;
8. OIDC/least-privilege publication, or governed documented fallback;
9. artifact checksum/provenance binding;
10. GitHub tag/release/package-version consistency;
11. fresh-install `NEW_PROJECT` workflow;
12. fresh-install `EXISTING_PROJECT/BROWNFIELD` workflow;
13. optional-adapter install/compatibility only for adapters explicitly claimed;
14. post-publication retrieval/install verification;
15. stable channel is not published before exact-head production acceptance.

## Frozen Deployment decisions
1. npm/package-first is the primary production channel.
2. Standalone executable is separately promotable, not an initial core-release blocker.
3. Public package surface stays small and contract-driven; exact registry names are implementation-time availability decisions.
4. Node support uses explicit LTS ranges owned by Compatibility Matrix and fail-fast before mutation.
5. OIDC/trusted publishing is preferred; fallback requires Security-governed exception evidence.
6. SemVer and machine-schema versions remain distinct but compatibility-coupled through migration rules.
7. Install/setup/uninstall side effects are strictly separated and non-destructive by default.
8. Upgrade/downgrade/recovery follows previewable, journaled, compatibility-aware semantics with no fake rollback.
9. Canonical channels are dev/internal, rc and stable; stable requires `PRODUCTION_RELEASE_DONE`.
10. The 15 Deployment evidence conditions above are required for the claimed release surface.

## Progress accounting
Freezing this Source Pack document does not by itself award production earned weight. Credit changes only when admitted backlog items/modules satisfy the frozen DoD with valid evidence. Current audited baseline remains `16 / 1088 = 1.47%` until a later audited delta earns additional weight.

STOP CONDITION: `READY_FOR_DEPLOYMENT_REVIEW_AND_CHECKPOINT`.
