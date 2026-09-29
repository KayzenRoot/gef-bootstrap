# GEF V1.2 experiment register and open decisions

Status: RESEARCH ONLY, no outcomes claimed. All statements below are hypotheses or intended tests unless explicitly grounded by existing approved GEF receipts. Owner vision date: 2026-09-29.

## Research experiments and independent proof gates
E01 MARATHON EFFECT: Compare bounded multi-wave pack versus existing V1.1 legal workflow on same small and medium representative apps, identical Codex tier/conditions and comparable scoped tasks. Measure accepted functional units, elapsed/active time, rereads/searches, rework, failure severity and reviewer events. Reject improvement when quality or traceability deteriorates.
E02 CONTRACT BUG CORPUS: Codex or independent fixture designer seeds blinded representative faulty implementations (validation, race, auth, partial write, rollback, public API compatibility). Compare baseline V1.1 detection against Bug Hunter, preserve known-negative cases and false-positive counts. Any missed blocker/HIGH/CRITICAL forbids promotion.
E03 FASTCHECK VALUE: On 3–5 real pure/stateful contract surfaces, measure reproducible new defect discovery, seed replay, runtime and flake rate. Store minimized counterexamples and compare versus conventional example tests.
E04 STRYKER ECONOMICS: Run focused/incremental mutation on small critical package and reference forced rerun. Measure mutants detected, newly effective tests, CPU minutes. Include lockfile/fixture/config/environment drift to test GEF invalidation. Do not deploy project-wide mutation by default.
E05 TEST IMPACT SHADOW: For a representative risk-stratified change set, run selective P0–P5 and applicable full reference, compare missed findings. Deliberately test implicit dynamic dependencies, changed tests, generated code, threat boundaries, Windows path and code/test/toolchain drift. Promotion requires zero missed blocker/HIGH/CRITICAL in defined corpus, maintained broad release path and replayable receipts.
E06 FLAKE AND REPAIR: Trigger known intermittent and deterministic failure cases in disposable tests; verify Causal Repair does not restart all tests, mask an intermittent true defect or discard failure seed. Measure redundant command suppression, time to root cause and false quarantine.
E07 AST RULE ROI: trial ast-grep custom architectural rules with preapproved invariants and intentionally compliant/noncompliant fixtures. Check rule drift and false positives. Knip is advisory until actual reachability confirms VERIFIED_DEAD.
E08 CI SECURITY: trial actionlint and zizmor in advisory mode against current workflow set plus synthetic unsafe YAML samples; compare uncovered actionable findings with pipeline-integrity/CodeQL. Evaluate number of jobs, CPU minutes, false alarms and no leaked privileged context.
E09 E2E TRACE ECONOMICS: on a WEB pilot compare trace on first retry/retain-on-failure against always-on tracing while reproducing seeded UI breakage. Require enough artifacts to explain failures at lower storage/time cost.
E10 APP FACTORY END-TO-END: construct two governed sample apps (a small UI/API project and a representative brownfield or persistence-bearing project) with accepted UI, functional scope, security class, documented preview, installation, migration/recovery as needed. Compare V1.1 and V1.2 under equivalent app acceptance criteria, without changing the acceptance goal midway.
E11 OPTIONAL LINTER: compare current lint/typecheck with Biome OR Oxlint shadow on same source/rules. Require zero missed currently-reported mandatory diagnostics and meaningful measured speed benefit; typecheck is never removed because lint passes.
E12 RUNNER/CACHE: verify node --test baseline vs any candidate runner and optional affected/build cache on CI PR and final release. Measure total wall/cpu, cache invalidations, correctness, runner migration/maintenance complexity. No new runner compulsory without benefit.
E13 SUPPLY CHAIN: verify commit-SHA pinning, dependency review entitlements, dependency drift and reproducibility; compare optional OSV-Scanner/Semgrep CE findings to current scans; retain only nonredundant actionable evidence.
E14 INTELLIGENCE BIAS: verify metrics distinguish completed implementation from accepted released evidence, measured vs inferred token/time, comparable workloads and missing telemetry. Check optimization suggestion never changes risk floors or silent DoD.

## Required sample and measurement protocol
For each experiment record: owner, registered hypothesis, frozen input fixtures/seed IDs, base/head and toolchain digests, comparison group, runtime, test selection explanation, ALL defects including false positives, accepted DoD work units, CI/CPU/storage dollars or local hardware cost, review time and explicit UNKNOWN/MISSING. Re-run failed or invalid comparisons after genuine cause changes. Results cannot be cherry-picked to declare blanket “X% faster.”
An experiment with a false-negative HIGH/CRITICAL/mandatory proof fails even if it saves hours.
First baseline is the actual released V1.1, not an old V1 main screenshot, old open PR or assumed plan.

## Decisions reserved for formal V1.2 admission
Q01 What exact V1.1 release/head/merged governance lineage is the safe parent? Await objective release acceptance and full source reconciliation; PR #278 historical closed-unmerged state is not a success receipt.
Q02 Which of the 14 proposed mechanisms add behavior versus configuration of M14/M15/M25/M26/M28/M43/M45/M63? Source/AST audit before Scope admission.
Q03 Which new tools demonstrably catch distinct material defects on this repository? Avoid overlapping lint/security checks.
Q04 What maximum safe wave size/contract boundary is reviewable for each risk class? Measured E01, not an arbitrary token count.
Q05 What share of CI/test budget can be reused as proofs, with which exact fingerprint? Establish by E05, fail closed on uncertain graph.
Q06 Do any external GitHub apps require owner-paid plan or excess permissions? Verify in live connected GitHub UI and vendor billing; favor no-subscription CLI alternatives.
Q07 Which final release CI jobs are mandatory, globally emitted, and protected by rulesets? Verify exact names on current branch and liveness, not copied legacy assumptions.
Q08 How are high-risk/auth/trading/irreversible app changes escalated to independently verified HIGH_ASSURANCE? Existing policy floor carries through; decide further obligations separately.
Q09 Do application profiles need language-specific tool adapters or a plugin SDK extension? No new global dependencies without targeted DoD/ROI.
Q10 What rollout can be safely shadowed rather than adopted early? New optimizers, test skipping, mutation policy, runner swap, risk predictor start SHADOW.

## Explicitly rejected shortcuts
- Rebranding existing M28/M63 capability as new delivered V1.2 progress.
- Enabling all tools on all apps and multiplying full regression on each micro-fix.
- Marking CodeRabbit/Greptile/Sonar/Codecov “installed, free, verified” based on old pilot only.
- Automatic checkpoint promotion from a Codex execution report, or treating a ChatGPT owner-account review as an independent external auditor.
- Silent removal of tests/filters or generating fake fixtures to green-light a PR.
- Approving a future release because historical main is 1088/1088.
- A blanket guarantee of “no bugs” or an unsupported speed-up percentage.
- Work on source/CI/main/release/1.1 or destructive GitHub settings as a side effect of this future research PR.

## Candidate evidence handoff
At V1.1 accepted release, open GBS-V12-WO-000 with exact canonical context and this dossier as non-authoritative input. OWNER admission selects NECESSARY features, formal ADR/Source Pack deltas and scoped baseline thresholds. Only after APPROVED + Context Lock can Codex start WO-001. Proposal remains versioned and editable as research until adoption.

## Additional financial and confidential-data pilots, not yet approved
E15 Subscription sandbox: replay reordered and duplicated payment webhooks under plan upgrade/cancel/refund with tenant access and correct non-duplicated billing; measure accepted workflows/time, defects and CI cost.
E16 Usage-based AI SaaS: compare OpenMeter/Lago/approved existing provider for idempotent late events, plan entitlements and hard budget cutoffs on synthetic usage; measure per-tenant contribution margin and compute overhead without logging prompt payloads.
E17 Ledger and reconciliation: only on money-moving sample; atomic balanced postings, no negative/duplicate credit, partial refund/chargeback, provider settlement fees and reversible audit corrections. Compare simpler DB-first pattern before adopting Formance.
E18 Tenant leak corpus: IDOR/BOLA cross-tenant API, RLS owner-bypass, cache, report exports, event queues, billing webhooks and vector retrieval. Any cross-tenant sensitive exposure is a hard failure.
E19 Web3 confidential-data corpus: synthetic offchain private record with envelope encryption, revoked role, key-rotation recovery, forbidden PII onchain/metadata correlation, malicious wallet signature and incorrect chain/finality reconciliation. Never test with real customer data or real signing assets.
E20 Advanced confidential compute OPTIONAL: benchmark one narrowly scoped ZK or FHEVM scenario against simple encrypted offchain storage on privacy threat, proof/circuit soundness, trusted infrastructure, gas, latency, hardware and operational maintenance. Do not presume ZK or FHE mandatory.
E21 Compliance/operational handoff: demonstrate payment-provider scope documentation, owner-reviewed jurisdiction/regulatory flags, verified backup restoration, redacted incident evidence and independent qualified review at the actual financial/custody risk level. No claim of an outside certification merely because checks passed.
All comparisons require identical admitted product Scope/DoD, pinned toolchain and representative source cohort. Unknown billing/CI costs are UNKNOWN, never 0. New research does not add earned M21 progress or establish an M22 ETA.
