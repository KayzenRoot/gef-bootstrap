# Deployment & Distribution

Status: `IN_DISCUSSION`

## Binding
Deployment & Distribution derives from frozen Constitution v1.1, Project Overview, Requirements, complete-production Scope, Architecture, Security, Test & Benchmark Plan, Definition of Done and weighted Backlog Baseline.

No functional implementation begins from this document until Deployment is reviewed/frozen and remaining Source Pack closure permits construction.

## Objective
Define how GEF Bootstrap is installed, distributed, upgraded, verified, recovered and released across Windows, Linux and macOS without weakening security, reproducibility, compatibility or the project's token/time-efficiency goals.

The product must remain local-first and usable from a checked-out Git repository/filesystem. Distribution mechanics may simplify operator access but may not become semantic authority.

## Distribution surfaces
Candidate supported surfaces:
1. **npm package / package-manager install** — primary distribution for the TypeScript/Node LTS implementation and official thin CLI;
2. **direct library consumption** — versioned package exports for programmatic use;
3. **repository checkout / development install** — supported contributor and recovery path;
4. **portable standalone executable** — secondary distribution track only after platform/release evidence proves it sufficiently stable;
5. **GitHub Releases** — release notes, checksums/manifests and optional platform artifacts;
6. optional adapters as separately activatable packages/profiles.

## Primary packaging direction
The canonical production implementation remains TypeScript on a supported Node.js LTS line. The initial production distribution contract should therefore be package-first rather than binary-first:

```text
source monorepo
  -> reproducible build
  -> package artifacts
  -> package validation
  -> provenance/checksum evidence
  -> registry/release publication
  -> install verification
```

A standalone executable is useful for low-friction installation, but must not become a release blocker while Node's native SEA path remains an actively developing surface. When promoted, it receives its own Windows/Linux/macOS signing, packaging and regression obligations.

## Package topology
Candidate public package split follows architectural package boundaries rather than one package per product module:
- core/contracts;
- deterministic kernel/application API;
- official CLI/operator surface;
- Git/GitHub provider packages where separation is justified;
- generic adapter SDK;
- optional ecosystem adapters;
- testkit only where intended for external extension/conformance use.

Internal workspaces remain private unless external consumption provides clear engineering value. Public package count should stay intentionally small to reduce versioning, publishing and support overhead.

## Versioning
Production packages use Semantic Versioning at the product/public-contract boundary.

Rules:
- patch: compatible fixes with no intentional public contract break;
- minor: backward-compatible capability additions;
- major: incompatible public API/schema/behavior changes requiring governed migration;
- machine contracts retain explicit schema versions independent of npm package version where required;
- optional adapter compatibility declares supported core/protocol ranges;
- pre-release identifiers are allowed for governed release candidates but cannot be called `PRODUCTION_RELEASE_DONE`.

No version bump can hide an incompatible migration requirement.

## Supported runtime policy
- production support is expressed as an explicit Node.js LTS compatibility range, not "latest Node";
- the Compatibility Matrix owns exact supported lines;
- unsupported runtime produces a clear fail-fast diagnostic before mutation;
- runtime support changes require compatibility evidence and governed release notes;
- release builds pin the toolchain sufficiently for reproducibility.

## Installation behavior
Install/setup must be non-destructive by default.

Expected properties:
- no silent global configuration mutation;
- no repository mutation merely from installing the package;
- setup/bootstrap operation is explicit and separately invoked;
- target project identity/preflight runs before governed writes;
- permissions/gaps are reported truthfully;
- no automatic adapter activation;
- uninstalling the tool does not silently remove target-project governance/history.

## Publication security
Preferred registry publication uses short-lived OIDC/trusted publishing where supported instead of long-lived publish tokens.

Release security requires:
- pinned lockfile and reproducible dependency installation;
- isolated release workflow;
- least-privilege publication identity;
- no long-lived publish secret when OIDC is available;
- package contents inspection before publish;
- checksums/manifests for release artifacts;
- provenance/attestation when supported by the publication surface;
- exact source/tag/commit binding;
- no publication from an unreviewed local working tree.

## GitHub release model
A production release should bind:
- product version;
- exact accepted source commit/tag;
- package version(s);
- compatibility matrix version;
- release manifest;
- checksums for downloadable artifacts;
- provenance/attestation references where available;
- migration/upgrade notes;
- known accepted non-blocking limitations, if any;
- exact production acceptance evidence receipt.

Release objects and tags are release-governance mechanics; exact-head evidence remains the semantic completion authority.

## Upgrade model
Upgrade follows a governed detect/plan/apply/verify/receipt flow:

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

Rules:
- no destructive migration is automatic merely because a newer version exists;
- major-version migration is explicit and previewable;
- target governed files use schema/ownership-aware migration rather than blind replacement;
- partial migration failure must leave a recoverable state or truthful blocked state;
- downgrade is supported only where an explicit reversible migration contract exists;
- unsupported downgrade must fail clearly rather than simulate rollback.

## Update discovery
The product may report that a newer compatible version exists, but:
- update checks must be disableable;
- no silent self-update;
- network calls are explicit/bounded under policy;
- update metadata is untrusted until validated;
- security-critical notices may be surfaced prominently without bypassing operator policy.

## Compatibility model
Compatibility is multi-dimensional:
- product/core version;
- machine-contract/schema version;
- Node.js LTS line;
- operating system;
- Git version/behavior where relevant;
- GitHub/provider API capability;
- adapter protocol/version;
- target-repository profile/toolchain assumptions.

Compatibility Matrix is the canonical derived/product contract for supported combinations and is verified by T7 release evidence.

## Rollback and recovery
Rollback terminology is precise:
- local filesystem transaction: recover/restore using transaction journal and recovery material;
- Git history: use governed non-destructive restoration where possible;
- published package/release: cannot be "unpublished history" conceptually; respond with deprecation, replacement or corrective release according to registry/provider rules;
- hosted side effects: use compensation where supported, never claim atomic rollback falsely;
- migration rollback exists only when explicitly modeled/tested.

## Release channels
Candidate channels:
- `dev/internal` — non-user-facing engineering builds;
- `rc` — release candidate with complete candidate evidence but not final acceptance;
- `stable` — only after `PRODUCTION_RELEASE_DONE` acceptance for the claimed release.

Additional channels are prohibited unless they have clear support semantics.

## Standalone executable policy
Portable single-file executable distribution is valuable but secondary.

Promotion requirements:
- Node SEA/build mechanism stable enough for our supported runtime policy;
- deterministic/reproducible build procedure documented;
- Windows/Linux/macOS artifact build and verification;
- signing/notarization strategy where applicable;
- native dependency/addon behavior tested if ever introduced;
- install/startup/update behavior benchmarked against package distribution;
- no weaker provenance/security than the package channel.

Until those gates pass, npm/package distribution remains the production baseline.

## Cross-platform distribution
Production release evidence must verify at least:
- Windows install/use/remove/upgrade path;
- Linux install/use/remove/upgrade path;
- macOS install/use/remove/upgrade path;
- path/permission/symlink/reparse-point behavior;
- shell-independent command invocation semantics;
- line ending and executable-bit behavior where relevant;
- package cache/offline failure behavior;
- recovery after interrupted install/upgrade scenarios where the product owns the mutation.

## Reproducible release principle
Release inputs must be explicit enough that the same source/toolchain configuration can regenerate materially equivalent artifacts.

The project does not claim bit-for-bit reproducibility unless measured and proven. It does require:
- frozen source commit;
- lockfile/dependency graph;
- supported build runtime/toolchain;
- build command/configuration;
- generated artifact inventory;
- checksums of distributed artifacts;
- recorded workflow/run environment sufficient for audit.

## Release failure policy
Publication/release failure does not mutate product completion into success.

Failures are classified:
- build failure;
- verification failure;
- signing/attestation failure;
- registry publication failure;
- provider release failure;
- post-publication verification failure.

A partially published release is a governed incident state requiring explicit recovery/compensation and truthful operator communication.

## Token/time efficiency implications
Distribution must minimize recurring engineering cost by:
- one canonical build graph;
- deterministic package inventory generation;
- reusable compatibility metadata;
- machine-readable release manifest;
- automatic checksum/receipt generation;
- no duplicate hand-written release evidence;
- delta-aware upgrade checks;
- fast preflight before expensive release matrix work;
- parallelizable signing/testing/publication where assurance permits.

## Production release evidence
Deployment/Distribution completion requires evidence for:
1. clean reproducible package build from accepted source;
2. package contents allowlist/inspection;
3. install and invocation on supported OS/Node matrix;
4. direct library/API consumption where claimed;
5. upgrade from every supported predecessor compatibility class;
6. migration failure/recovery paths;
7. unsupported runtime/version fail-fast behavior;
8. OIDC/least-privilege registry publication or explicitly justified fallback;
9. artifact checksum/provenance binding;
10. GitHub Release/tag/version consistency;
11. fresh-install NEW_PROJECT flow;
12. fresh-install brownfield adoption flow;
13. optional adapter install/compatibility only for separately claimed adapter releases;
14. post-publication verification of retrievable/installable published artifact.

## Decisions to close
1. Freeze npm/package-first distribution as primary production channel.
2. Decide whether a standalone SEA executable is required for initial `PRODUCTION_RELEASE_DONE` or remains separately promotable.
3. Freeze public package/workspace split and package naming rules.
4. Freeze supported Node LTS declaration and runtime fail-fast policy.
5. Freeze registry publication authentication/provenance requirements.
6. Freeze SemVer/machine-schema version interaction and migration triggers.
7. Freeze install/setup/uninstall side-effect boundaries.
8. Freeze upgrade/downgrade/recovery semantics.
9. Freeze release-channel/tag/GitHub Release rules.
10. Freeze exact Deployment evidence required before Source Pack closure and production construction readiness.

## Current direction
GEF Bootstrap should ship package-first with a small public package surface, thin CLI plus library API, explicit Node LTS compatibility, OIDC-based secure publication where supported, exact-source release manifests, non-destructive installation, governed upgrades and truthful recovery semantics. Standalone binaries are valuable but should not become a core release dependency until their platform/toolchain path is proven stable enough.

STOP CONDITION: `DEPLOYMENT_DECISIONS_REQUIRED`.
