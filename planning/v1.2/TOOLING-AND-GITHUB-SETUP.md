# V1.2 tool catalog and GitHub setup runbook

Status: PLANNING CANDIDATE. No new app, GitHub setting, dependency, CI job or subscription was installed by this planning change. All versions/pins, service plan allowances and security permissions must be freshly verified at implementation/admission. Codex performs any code, manifest, CI and script changes after Work Order approval; ChatGPT coordinates issue, governance docs and objective audit.

## Audited baseline (main at f6738292c038eb6f0d08d1d32b3752c5c7dc417a)
Existing files/workflows include:
- TypeScript strict/Node workspaces, native node --test; V1 scripts build/typecheck/test/validate. V1.1 exact scripts must be read again at admission.
- .github/workflows/repository-validation.yml, security-codeql.yml, free-security-pilot.yml (Trivy and Gitleaks), pipeline-integrity.yml, coverage-codecov.yml, dependency-review.yml, scorecard.yml, module-specific M01–M63 and integrated cross-platform checks.
- .github/dependabot.yml, .github/CODEOWNERS, .github/agents, .github/instructions, .github/prompts, AGENTS.md.
- CodeRabbit, SonarQube Cloud, Codecov, Greptile have been discussed/trialed historically; their CURRENT GitHub app installation, paid/free eligibility and exact-head working check status must be independently verified, NOT inferred from repo YAML or an old dashboard. Codecov pilot documents warn green native coverage != successful SaaS upload.
- Dependency Review earlier encountered a disabled Dependency Graph. Its current workflow exists, but require proof that API feature is enabled and check works before a mandatory ruleset change.
- Avoid automatically replacing Dependabot with Renovate or installing redundant scanning apps.

## New or expanded free/open-source tool candidates
PRIORITY A — local/CI static controls:
1. actionlint (MIT, https://github.com/rhysd/actionlint): validate GitHub Actions syntax, expressions, jobs, inputs, dependencies and common injection cases. Install verified release binary with SHA-256 through pinned CI setup; command: actionlint. Not a GitHub marketplace subscription.
2. zizmor (open-source, https://github.com/zizmorcore/zizmor): semantic CI security scanning, permissive token/injection risk, confidence/severity filtering. Prefer verified pinned binary or immutable pinned official action, output machine-readable report. Never replace existing immutable-action scanner.
3. ast-grep (MIT, https://github.com/ast-grep/ast-grep): structural search, lint and approved narrow codemod rules. Candidate npm dev install: npm install -D @ast-grep/cli. New local architectural rules require approved design invariant, negative fixtures and conformance tests.
4. fast-check (MIT, https://fast-check.dev/): JS/TS property-based regression, reproducible shrink and random seeds. Candidate npm dev install: npm install -D fast-check. New pure-module/adversarial tests authored by Codex only.
5. Knip (ISC, https://knip.dev/): report unused files, exports, dependencies; candidate npm install -D knip. Initially advisory, human-reviewed VERIFIED_DEAD only, never automatic broad deletion.

PRIORITY B — selective pilots after representative benchmark:
6. StrykerJS (Apache-2.0, https://stryker-mutator.io/docs/stryker-js/incremental/): incremental targeted mutation. Choose actual runner plugin only after checking whether existing native Node tests can be integrated economically. Candidate install pattern: npm install -D @stryker-mutator/core plus compatible runner plugin(s). GEF must fingerprint env/dependencies because Stryker incremental does not catch all external changes; avoid all-repository mutation by default.
7. Semgrep Community Edition (open source community engine, https://semgrep.dev/products/community-edition/): local static rule packs for project-specific auth/secret/I/O patterns. Installation options depend on environment, e.g. python3 -m pip install semgrep; candidate semgrep scan --config=auto. Do not assume CE and paid SaaS have identical capabilities; integrate only rules with nonredundant measured findings.
8. Playwright (Apache-2.0, https://playwright.dev/): when a WEB profile applies, candidate npm install -D @playwright/test followed by npx playwright install --with-deps on supported CI; controlled first-retry/retain-on-failure traces, browser installs cached only with exact versions and safe trust boundaries.
9. Vitest (MIT, https://vitest.dev/): PILOT only for compatible JS/TS project profiles where measured benefit exceeds migration cost. Candidate npm install -D vitest; use file-path filtering and optional related tests; do not migrate GEF's proven native node --test suite just to gain a shiny runner.
10. Biome or Oxlint (open-source, https://biomejs.dev/ and https://oxc.rs/docs/guide/usage/linter.html): compare one appropriate formatter/linter stack in a shadow benchmark; don't stack redundant formatters or replace typecheck. Type-aware performance and rule compatibility must be profiled on our repository before adoption.
11. OSV-Scanner (open-source, https://github.com/google/osv-scanner): optional differential dependency audit if it finds meaningful issues missed by existing npm audit, Trivy and GitHub dependency security. Do not add duplicate always-on jobs without evidence.
12. API/DB projects ONLY: OpenAPI breaking change detector or consumer contracts (e.g. Pact) and disposable Testcontainers instances, selected by the exact approved runtime and platform requirements. These are per-project adapters, NOT unconditional GEF dependencies.

## GitHub cost and entitlement policy
- Standard GitHub-hosted Actions runners are free on public repos, while private repos have plan-bound included minutes/storage and possible excess charges: https://docs.github.com/en/billing/concepts/product-billing/github-actions .
- Larger hosted runners can be billable even for public repositories. Cache/artifact quota and external service plan limits are separate. Self-hosted runners do not consume GitHub-hosted minutes but incur owner electricity/hardware/security/maintenance and must NEVER execute untrusted PR code with privileged host credentials.
- Code scanning with CodeQL is available on public GitHub repos: https://docs.github.com/en/code-security/concepts/code-scanning/code-scanning . Private eligibility is plan/feature-dependent.
- CODEOWNERS and approval enforcement are separate; documented owners are not proof rulesets require their approval: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners .
- No paid subscription, unlimited free use, current CodeRabbit/Greptile/SonarQube/Codecov plan or accepted OIDC upload claim without live verified dashboard + successful matched PR check.

## Activation plan: what the owner actually does
BEFORE V1.1 acceptance: nothing to install for this proposal; keep existing V1.1 CI and issue/PR clean-up. Do not enable a new globally required check against an unproven PR workflow.
AFTER V1.1 acceptance and owner admission:
1. In GitHub repository Settings -> Actions -> General, verify workflows allowed, default GITHUB_TOKEN minimal read permissions, and branch rules are still appropriate. Do not grant write-all. Read required check names and currently observed successful statuses.
2. In Settings -> Code security and analysis, verify Dependency Graph, Dependabot, secret-scanning/code scanning entitlements and CodeQL results. Enable a supported feature only after verifying public/private entitlement, repo policies and existing config; do not duplicate automated CodeQL setup.
3. In Settings -> Rules -> Rulesets or branch protection, require exact always-emitted successful baseline validation, pipeline integrity and verified security scan check names. Start additional tools as advisory, then make any promoted checks always-on before adding to mandatory rules. Retain bypass rules only for approved exceptional recovery with full log.
4. If explicitly selecting an external GitHub App, open its official marketplace installation screen, install only on selected repository with minimum permissions, confirm pricing/plan for that repository, and verify it actually posts a current-head PR check. Otherwise prefer tools run in existing Actions without installing GitHub Apps.
5. ChatGPT admits precise issue-backed WOs and Context Lock. Codex pins binary checksums and third-party action FULL immutable commit SHAs, alters workflows/dev manifests ONLY in its implementation PR, locally runs actionlint/zizmor + repository validation and reviews current fork-PR trust boundaries.
6. First run new scanners in advisory/SHADOW on a dedicated harmless PR; collect false positives, runtime cost, permission inspection and exact check names. Audit before promotion to any mandatory gate.
7. For app builds, install only profile-specific dependencies in that app repo, lock versions, build/test locally, and execute matching CI. Global OS tools are optional; prefer reproducible project scripts to undocumented machine dependencies.

## Profile-based install recipes (commands are CANDIDATES, never pre-executed)
GEF CORE: preserve existing native Node test runner, TypeScript and locked npm. Consider fast-check, ast-grep, actionlint and zizmor first. StrykerJS and Knip only after scoped pilot.
WEB/REACT: add Playwright + browser binaries only if UI flows in accepted DoD; optionally Vitest if chosen by stack baseline; run production build and accessibility/visual checks as appropriate.
NODE API: property/model/contract tests, auth failure suite, disposable data boundary; add DB containers/test adapters only when architecture actually requires persistence.
DATABASE/MIGRATION: disposable database version matrix, forward/rollback/recovery, idempotency and data integrity proof; no blind migration on shared data.
PYTHON/OTHER: separate language-specific adapter with explicit project Scope/DoD and measured CI cost; do not install TypeScript tools into unrelated apps.

## CI architecture target
1. Always-on small trusted baseline: immutable workflow integrity, package/lock preflight, static/type and security status with stable check names.
2. Impacted jobs based on changed code/risk for expensive non-globally-required tests. Matrix of OS/runtime only as required by change and final assurance. Build/test caches version- and trust-scoped.
3. Nightly/scheduled independent deep mutation/fuzz and optional full exploratory scanning; incidents always create issues and become release blockers when material. A scheduled PASS does not replace a newer required exact-head release sweep.
4. Release exact-head: all applicable security, full regression, cross-platform install/recovery, ABI/contract and benchmark proof on pinned release candidate. Record results/artifact URLs in Evidence Bundle.
5. Least privilege: untrusted fork workflows never gain secrets/OIDC write tokens, avoid pull_request_target for untrusted checkouts, SHA-pin actions, use persist-credentials false when safe, eliminate writable caches shared with privileged jobs.
6. Cancel obsolete PR-only nonrequired jobs on superseded heads; do not cancel push-range secrets scanning or release full-sweep evidence for time convenience.

## References verified at dossier creation (recheck at implementation)
https://github.com/rhysd/actionlint
https://github.com/zizmorcore/zizmor
https://github.com/ast-grep/ast-grep
https://fast-check.dev/docs/introduction/
https://stryker-mutator.io/docs/stryker-js/incremental/
https://playwright.dev/docs/trace-viewer
https://vitest.dev/guide/filtering
https://github.com/webpro-nl/knip
https://semgrep.dev/products/community-edition/
https://github.com/google/osv-scanner/blob/main/docs/usage.md
https://docs.github.com/en/billing/concepts/product-billing/github-actions
https://docs.github.com/en/code-security/concepts/code-scanning/code-scanning

## Future conditional Web3 and game tool installation (not executed)
**EVM on accepted chain:** pin Solidity solc + Foundry CLI (forge/anvil/cast); add version-matched OpenZeppelin Contracts and upgrades validation only if upgradeable; run Slither on matching Solidity/Vyper project, stateful Foundry invariant tests and optional bounded Echidna on approved critical properties. For a TypeScript EVM frontend optionally install pinned viem and wagmi into the app only when the selected UI requires wallet connection; validate EIP-712/network/signature behavior. Actual commands and versions in future Context Lock after source/chain decision, not GEF core package. See https://getfoundry.sh/forge/invariant-testing , https://github.com/crytic/slither , https://github.com/crytic/echidna , https://docs.openzeppelin.com/upgrades-plugins/api-core , https://viem.sh/docs/getting-started and https://wagmi.sh/react/guides/connect-wallet .

**Solana on accepted chain:** approved current Rust toolchain + Anchor when project selects it, LiteSVM and/or Mollusk dev dependencies for deterministic account/instruction tests. Use actual Solana/Anchor version matrix and account security rules. No Foundry or Slither substitute for Rust. Sources: https://www.anchor-lang.com/docs/testing and https://solana.com/docs/programs/testing/mollusk .

**Browser 2D game:** pinned Phaser/TypeScript and only required visual browser asset tests. **3D game:** Babylon.js or Three.js as owner-approved renderer, explicit physics/ECS only where needed. **Godot:** appropriate engine version/export templates; verify Godot 4 C# web limitation and threaded export requirements. **Multiplayer:** compare a reproducible Colyseus server with Nakama for the actual gameplay/social requirements; don't automatically include both. Test server authority and synthetic client load in disposable CI. Sources: https://phaser.io/tutorials/getting-started-phaser3 , https://docs.colyseus.io/ , https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/ , https://docs.godotengine.org/en/4.5/tutorials/export/exporting_for_web.html .

**Web3 game:** never install a wallet or blockchain SDK on a non-Web3 game. Compose the exact selected chain and game toolchains only after explicit owner chain/asset decision; use inexpensive local simulated chain and server integration first, then owner-approved testnet. Mainnet activity is a separately qualified action with independent high-risk gate. No raw mnemonic/private key or paid RPC credentials in GitHub issues, prompts or build artifacts.

**Current service sunset caution:** do not select the former OpenZeppelin Defender HOSTED platform as a new live prerequisite. Official sunset notice states July 1, 2026 hosted retirement: https://www.openzeppelin.com/news/defender-sunset-faq . Evaluate self-hosted OSS relayer/monitor only if a specific project needs them and current maintenance/permissions can be verified. Other vendors' free plans must be checked at adoption.

**Profile installation protocol:** compile per-project tool list from approved domain manifest; output exact version, license, operating systems, resource cost, checksum/commit SHA, ownership, test and uninstall instructions. Run on disposable pilot branch first, verify with existing Source Pack and Codex-only actor contract, keep unsupported profiles RESEARCH rather than claiming turnkey installation. No global package installation or web service signup in this research PR.
