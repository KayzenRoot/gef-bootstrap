# GEF V1.2 — Operations, Release and Reproducible App Delivery Research

**Status:** FUTURE PROPOSAL ONLY. Owner requested more differentiated capabilities on 2026-09-29. Builds on the 11-file v1.2 dossier in draft PR #344; no coding, activation, SaaS subscription, release approval or scope admission. Preserve V1.1 gates and exact-head source hierarchy.

## Scope and existing-engine reuse
Extend current M23 project status, M24–M28 assurance/proof/test impact, M29–M33 Git/GitHub/release, M34–M37 security/recovery/integrity, M38 capability detection, M43–M45 telemetry/benchmark and M63 performance. Do NOT rebuild their already-supported behavior. The proposed modules are new app-delivery profile adapters or bounded extensions whose admission depends on a released V1.1 inventory and proof of unique ROI.

## OPS01 — Production Radar (NECESSARY candidate for suitable app profiles)
Goal: close the feedback loop from production incident to exact release source/contract/test evidence. For applications whose operations are within declared project Scope/DoD, generate minimal traces, metrics and error taxonomies, correlate deployment SHA and incident timing, and propose bounded follow-up Work Orders with anonymized reproduction. OpenTelemetry JS traces/metrics are stable; logs and browser JS instrumentation require maturity checks. The application owns its runtime instrumentation; GEF is a dev/review orchestration substrate, not a runtime cloud dependency. OpenTelemetry: https://opentelemetry.io/docs/languages/js/ .
Security: default no PII, credentials, auth tokens, sensitive payloads or raw financial data in telemetry; local/dev exporters and sampling first; owner-configured retention and opt-in remote sinks. Alert dedup never collapses independent incidents; a telemetry alert is evidence to investigate, not proof of root cause.
Proof: a seeded operational failure produces privacy-safe trace/error linked to deployed SHA, triage classification and a regression candidate. Outage of telemetry provider must not break application core.

## OPS02 — Data Guardian (NECESSARY candidate if app has persistence/migrations)
Goal: prevent catastrophic data errors by disposable schema/data compatibility and recovery rehearsals. Detect database presence/approved stack; start pinned ephemeral Postgres (or corresponding DB) only if applicable. Test forward-only migration and an authorized rollback/roll-forward, constraints, uniqueness, relationship integrity, request retries, idempotency, concurrent writes and restoration against anonymized or synthetic fixtures. Testcontainers Node PostgreSQL: https://node.testcontainers.org/modules/postgresql/ .
Never run destructive migration or clone live user data without explicit authorization. Prefer synthetic fixtures and encrypted disposable CI data; avoid unaudited sample production data. Migration approval requires elevated assurance and exact-head proof. Cost gate: reuse a single trusted disposable DB across appropriate compatible integration tests, teardown strictly per test boundary; no global DB dependency for UI-only apps.
Proof: known broken migration/recovery fixtures fail, valid path passes, restore proof is repeatable, and tested version matrix matches actual deployed DB profile.

## OPS03 — Release Guardian (NECESSARY candidate where deployment is admitted)
Goal: release readiness and operational validation beyond unit/CI green. Compile deployment contracts: real install and configuration doctor, secrets availability without disclosure, health readiness/liveness, dependency/version compatibility, signed or attested artifact identity, smoke journey, rollback/roll-forward policy, deployment platform permission limits and post-release observation period. For supported apps, ship feature flags/canary/kill switch as optional profile controls rather than a universal runtime requirement. OpenFeature is vendor neutral API only; actual flag storage/evaluation backend must be selected and proved: https://openfeature.dev/docs/reference/intro/ .
Automatic rollback is permissible only for proven reversible actions and explicit owner-approved policy; migration rollback with user data is HIGH_ASSURANCE and may require manual decision. Avoid holding new features behind permanently untested flags; test enabled AND disabled variants.
Proof: deployment of disposable sample app detects bad health/contract and exercises proven reversal with exact artifact/commit receipt; no unwarranted claims about supported platform uptime.

## OPS04 — Build and Supply Provenance (IMPORTANT; candidate release requirement for distributed app)
Goal: verify software distributed to customers is the tested artifact built from the reviewed source tree and immutable dependencies. Generate dependency inventory/SBOM and build attestations for supported package/image outputs; verify digest and provenance at deployment. GitHub artifact attestations docs: https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations . On GitHub Free/Pro/Team, attestation support is public-repository-only; private/internal requires Enterprise Cloud (confirm live entitlement). npm trusted publishing can generate provenance for suitable public repo/public package paths: https://docs.npmjs.com/trusted-publishers/ . Requires appropriately scoped OIDC permissions, immutable pinned Actions and protected release environments; no production publishing in planning.
Proof: tampered artifact or wrong source SHA refuses provenance verification; unsupported plan surfaces explicit NOT_AVAILABLE, not PASS.

## OPS05 — Reproducible Development Environment (IMPORTANT)
Goal: make developer laptop, Codex checkout and CI consistent. Use minimal pinned runtime/toolchain, lockfile integrity and env manifest first. Offer devcontainer/Docker profile only when containerization adds value; ensure working Windows/Linux/macOS installation variants where declared. Inject clocks/seeds locally for reproducible tests, redact secrets, verify CPU/architecture constraints. Generate diagnostic differences when local and CI disagree rather than silently changing package versions. No always-on cloud workspace.
Proof: fresh clone + supported environment bootstraps and runs a representative app smoke without undocumented developer machine setup. Intentionally drifted runtime and corrupt cache fail doctor.

## OPS06 — Post-Release Regression Ledger (IMPORTANT; bounded feedback)
Goal: every confirmed important escaped defect becomes a minimal version-bound reproducible fixture/test, security or contract proof and correction record. Integrate existing Bug Hunter/Causal Repair/Proof Graph; avoid second duplicate bug database. Privacy-preserving incident replay is opt-in and synthetic by default. Require semantic de-duplication + owner triage for change admission.
Proof: replay original failure then verify fixed exact candidate; no raw user payload is persisted in the regression archive.

## Risk/rollout and exclusions
- Public repo eligibility does not imply free private repo attestations, free app hosting or unlimited third-party telemetry retention.
- No destructive live database or privileged deployment without explicit authorization, tested recoverability and high-assurance review.
- Production Radar is a profile-generated application capability; it does not mean GEF itself must become a hosted permanent observability service.
- Direct next WO admission requires real released V1.1 baseline, updated ADR/Scope/DoD, measurable pilot and owner confirmation. New feature variants do not auto-extend v1.2 frozen denominator.
