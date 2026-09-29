# GEF V1.2 — API Adversarial Testing, Performance and Decision Intelligence

**Status:** RESEARCH, NOT ADMITTED. Proposed additions after the first 11 v1.2 research files. Classifications are suggested only, subject to formal V1.2 Source Pack delta and approved Work Orders. Do not duplicate Contract Change Sentinel, Bug Hunter, Data Guardian, Test Impact Engine or existing telemetry.

## INN01 — API Adversarial Lab (NECESSARY candidate for API projects)
Generate adversarial requests from owner-approved OpenAPI/GraphQL schema and route them only into disposable authorized API targets, verify unexpected server errors and schema/contract invariants. Pilot Schemathesis's property-based and stateful operation testing, with limited CI budgets (few targeted operations in ordinary PR, broader runs on changed contract or release). Schemathesis supports reproducible failures and chained operations: https://schemathesis.readthedocs.io/en/stable/quick-start/ and https://github.com/schemathesis/schemathesis/blob/master/docs/guides/stateful-testing.md .
Bind schema digest, auth fixture, test seed, isolated server state, input budget and request rate. Never target external third-party APIs or production without authorization. No blanket tens-of-thousands-of-cases loop for routine PRs.
Proof: seeded malformed input, incorrect return schema, incorrect authorization, create→read→delete state bug and backward compatibility break produce evidence, with controlled false positives.

## INN02 — Operational Performance Budget (IMPORTANT candidate by app profile)
Define measurable targets from approved user journeys or SLOs, not synthetic universal scores: p95 response latency, throughput under an approved simulated load, memory/bundle budget and critical browser page behavior. Use local open-source k6 with bounded smoke PR runs and larger reproducible release benchmarks only if API traffic warrants it; k6 thresholds produce nonzero status on violations: https://grafana.com/docs/k6/latest/using-k6/thresholds/ . For web apps Lighthouse CI supports configurable per-page assertions, budgets and advisory/error levels: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md .
Compare equivalent environment/hardware and input fixtures; account for warmup variability and noisy-host p95. A single raw Lighthouse score is not proof of user experience. Schedule expensive load tests selectively and never target live third-party hosts.

## INN03 — Decision Impact Simulator (IMPORTANT for planning; existing M11/M15/M22 integration)
For owner change requests, show a deterministic affected-areas graph before new Work Order admission: changed Scope/ADRs/UX tokens/contracts, impacted tests/proofs, likely invalidated seed/checkpoint, estimated effort as scenario only IF valid M22 baseline. Separate known mechanical impact from unverified semantic consequences; ChatGPT makes design/priority recommendation only within owner approval and source hierarchy. Present concise pt-BR “what changes / risk / cost / timeline uncertainty” instead of huge replanning essay.
Proof: changing approved UI color affects design snapshots but not unrelated backend tests; changing privileged auth or schema expands security/consumer and recovery gates; missing historical samples shows no fabricated ETA.

## INN04 — App Launch Qualification Profile (IMPORTANT)
Define a minimal proof checklist per selected app profile: developer install and preview, user journeys, auth/permissions when needed, data recovery if persisted, accessibility for UI, security scan, release artifact and operations handoff. An accepted UI screenshot doesn't equal deployed app. Compile qualified gates from owner Scope/DoD and always report current verified status. Delivery is only COMPLETE when all owner-approved DoD release obligations are proven.
Proof: missing live integration blocks acceptance even if all unit tests pass; UI-free backend isn't forced into browser screenshot tests.

## INN05 — Reusable Verified Starter Recipes (IMPORTANT, not blanket templating)
A small set of versioned owner-approved product archetypes with validated vertical slice (e.g. web dashboard with auth, API + database, static website) may reduce start-up overhead. Each includes requirements questions, security threat model, token/UX starter when relevant, contracts, fixture generators, fast and release test matrix, CI and installation/recovery recipe. Extension of M07/M08, M09–M15 and the proposed default Startup Profile, not another scaffolding engine. Do NOT distribute outdated packages or impose a framework on projects with an approved stack.
Proof: greenfield fixture builds/deploys and brownfield adoption leaves healthy code untouched; benchmark accepted functionality/hour against same V1.1 baseline with real maintenance burden.

## INN06 — Developer Cost Guard (IMPORTANT)
Track per-Work Order Codex invocations, observable tokens only when available, elapsed work, CI CPU minutes, artifact storage, external SaaS quotas, unnecessary reruns, telemetry storage and cache invalidation. Estimate expected savings with confidence and record “unknown” where a service hides billing. Advise about public/private repo differences, self-hosted security and app deployment spend. No automatic purchase, service installation or quality gate waiver to meet budget.
Proof: missing billing API data cannot produce an invented cash saving; fail-closed check when actual planned paid action exceeds owner approved quota.

## INN07 — AI Output Quality Harness (IMPORTANT for AI-native target apps only)
If a target app contains AI functions, require versioned prompt and tool contracts, small representative labeled evaluation corpus, adversarial input tests, deterministic mock coverage, privacy/redaction and bounded live model tests with cost budget and pinned model configuration when supported. Evaluate regression of actual user tasks before deploying changes. A non-AI app never gets LLM-related dependencies just because GEF is AI-assisted. No automatic LLM-only audit approval.
Proof: changed prompts that weaken mandatory refusal/privacy/function-call constraints fail the target app's applicable tests, with sampling/uncertainty declared.

## INN08 — Rollout Experiment Governor (FUTURE until representative evidence)
Where product owner has approved feature flags and privacy/legal requirements, support staged release cohorts and real application metrics to assess opt-in experiments. Validate kill-switch, cohort consistency, logging consent, exclusion of protected sensitive decisioning, rollback behavior and post-experiment cleanup. Avoid generic algorithmic deployment authority or interpreting small-noisy A/B samples as sure gains.

## Priorities and stop conditions
Only duplicate-free NECESSARY features with measured ROI and confirmed DoD enter admitted v1.2 automatically. Experimental features and runner swaps remain SHADOW. High-assurance security, finance, authentication and destructive data operations retain existing independent proof obligations. If tool costs, product complexity or maintenance overhead exceed actual project benefit, keep adapter optional or defer it. `RESEARCH_RECORDED_NOT_IMPLEMENTATION_AUTHORIZED`.
