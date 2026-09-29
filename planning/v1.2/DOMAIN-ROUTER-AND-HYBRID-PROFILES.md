# GEF V1.2 — Domain Router, Profile Composition and Game + Web3 Hybrid

Status: RESEARCH / PROPOSED DEFAULT ADAPTIVE PROFILE behavior, not a supported installed GEF feature. Depends on current approved V1.1 release, audited GEF M09/M10/M11/M14/M15/M20–M23/M24–M28/M38/M43–M45/M63 and future formally admitted V1.2 Source Pack. This document coordinates WEB3-FACTORY-PROFILE.md and GAME-FACTORY-PROFILE.md; it does not replace them.

## Problem
One globally preinstalled mega-toolchain slows projects, increases security exposure and induces irrelevant interview questions. Build the fastest safe path to an accepted result using composable domain profiles: BASE_STARTUP, WEB2_UI, API_DATA, WEB3_EVM, WEB3_SOLANA, GAME_2D_WEB, GAME_3D_WEB, GAME_NATIVE, GAME_MULTIPLAYER, GAME_MMO and combined GAME_WEB3. A given project may carry more than one tag with formally resolved compatibility and risk requirements; existing brownfield ADRs win until the owner approves a change.

## Detection and owner confirmation algorithm (proposed)
1. Read actual current repo snapshot and applicable canonical Source Pack/checkpoint and owner current description, never infer from stale saved memory.
2. Treat OWNER_EXPLICIT and previously APPROVED_DECISION as high-authority evidence. Distinguish parsed file signal and LLM hypothesis from authorized choices.
3. Signals for EVM: Solidity or Vyper modules + Foundry/Hardhat manifest, approved chain/network; Solana: Anchor.toml plus Rust dependencies and documented program account constraints; game: Godot project, Phaser/renderer packages, approved GDD/Art Bible, multiplayer service manifests; hybrid: actual owner-approved need to connect in-game valuable assets or economy to chain, not just presence of a wallet dependency.
4. Compute candidate profile tags and confidence/cause. Contradictory mixed EVM/Solana/Unity/Godot signals ask a targeted batch instead of silently installing everything. Platform/chain ambiguity is BLOCKING for implementation and high-assurance proof.
5. Run 5–7 high-impact new-project questions or gap-only brownfield interview. Owner chooses desired stack and approves a profile composition record; generated proposal is NONCANONICAL until approved.
6. Compile profile-specific Source Pack additions: domain risk, architecture/contract/gameplay flow, threat model, UI/world design, dependency pinning, artifact/install/deploy, DoD proof gates and first vertical slice. Preserve all general GEF Source Pack rules and current actor separation.
7. Emit only required target-project tool installation plan and context-bound Marathon WOs. Codex writes any code/test/CI/build/script installation; ChatGPT can create issue, documentation and exact-head audit. A profile upgrade that changes scope/checkpoint triggers approved change control and dependent proof invalidation.
8. Detect wrong/no profile after actual source changes and ask permission to reclassify; never auto-enable mainnet, paid infrastructure or gameplay engine switch.

## Composition examples
- NEW EVM DAPP: BASE_STARTUP + WEB2_UI if a frontend exists + WEB3_EVM + API_DATA if persistent offchain backend; Foundry/Slither/Fuzz and viem/wagmi only if stack applies. Browser UX and wallet signing proofs plus contract roles/safe deployment.
- SOLANA PROGRAM: BASE_STARTUP + WEB3_SOLANA, optionally WEB2_UI; Anchor + LiteSVM/Mollusk, no Solidity scanners or Anvil pretending coverage.
- BROWSER 2D SINGLE-PLAYER: BASE_STARTUP + GAME_2D_WEB + WEB2_UI appropriate to menus; Phaser, asset/scene checks, browser smoke. No blockchain/wallet/server.
- BROWSER MMORPG: BASE_STARTUP + GAME_2D_WEB or GAME_3D_WEB + GAME_MULTIPLAYER + GAME_MMO; actual engine and either Colyseus OR Nakama according to design, server authority, replay/load/economy and persistence proof. No blanket double server engine dependency.
- ONCHAIN GAME: BASE_STARTUP + GAME_* + selected WEB3 chain adapter, GAME_WEB3 bridge. Owner decides which assets are onchain/offchain, custody, settlement and chain confirmation.
- BROWNFIELD REPO: inspect and preserve current stack and approved decisions. New profile initially observational SHADOW; owner approves safe adoption and any changed dependencies.

## Profile manifest concept (NOT functional code)
```yaml
schema: v1.2-research-only
project_id: owner-supplied
repo_snapshot: exact_head_sha_required
candidate_tags:
  - BASE_STARTUP
  - GAME_2D_WEB
  - GAME_MULTIPLAYER
  - WEB3_EVM
candidate_state: UNRESOLVED # later OWNER_APPROVED
signals:
  owner_brief: user_supplied
  manifests: unverified_until_exact_checkout
  approved_adrs: checked_before_promoting
boundaries:
  runtime_engine: undecided
  multiplayer_server: undecided
  blockchain_network: undecided
  asset_trust_model: undecided
tool_adapters: [] # assigned only after approved profile
risk:
  app_security: ELEVATED_OR_BETTER
  onchain_value: UNKNOWN
  high_assurance_independent_proof: REQUIRED_IF_POLICY_TRIGGERED
consent:
  cloud_install: false
  paid_subscription: false
  production_deployment: false
  mainnet_wallet_or_secret_access: false
```

## Hybrid GAME_WEB3 safety: chain state is not the game clock
- **Server-authoritative game:** combat, movement, player rewards, inventory claims and anti-cheat must be validated by the approved authoritative server. Onchain operations are for expressly approved ownership, transfer, mint/burn/settlement/governance; financial owner authority does not grant game-server administrator power.
- **Two-ledger model:** clearly distinguish pending virtual game state, reserved items, chain transaction submitted, mined, finalized and failed/reorged, compensated/reconciled. Every external event carries chain/network, contract, tx/log index, block hash, version and idempotency key; don't double mint/credit on replay.
- **Transactional boundaries:** contract invocations are async and may fail. Never lock gameplay tick to chain confirmation. UI exposes cost, wallet decision, network, gas, approvals and finality state, including cancelled/expired/insufficient funds and safe retries. No wallet prompt for normal movement or routine skill use.
- **Fraud and game economy:** investigate client forging reward proofs, replayed withdrawals, marketplace/bridge failures, price/oracle manipulation, bot/RMT abuse and rollback where legally/product-appropriate. Distinguish test/economic assumptions and independent high-assurance threat review.
- **Cross-chain:** only after separate owner-approved bridge/finality/security model. No generic bridge-as-a-feature adapter and no unsupported chain claims.
- **Reproducibility:** simulate deterministic server actions with fork-at-pinned-block chain state; a complete cross-boundary vertical integration test starts game session -> earns approved offchain event -> requests owner-signature -> testnet/local chain contract action -> finality/indexer reconciliation -> UI + inventory consistency. Add reorg/failure/duplicate event and session reconnect negative cases.

## Domain-specific reporting (extends M20/M21/M22/M23)
Use the consistent project/release accepted weighted progress dashboard, never lines of code as percent. Additional status panels by actual profile:
- EVM: contracts written vs AUDITED/APPROVED; unit/fuzz/property coverage scope, HIGH/CRITICAL open security issues, storage upgrade compatibility, chain test environment, deploy manifest readiness, locked signer gate and gas benchmark. “Audited by scanner” and “external audit” are different status categories.
- Solana: account/PDA constraints, LiteSVM/Mollusk tests, program compute budget, upgrade authority and validator/testnet proof.
- Game: playable vertical journeys accepted/total, scene/asset validation, performance target and hardware cohort, gameplay regressions, multiplayer simulated load and economy/anti-cheat failures, world-bible change sync.
- Game + Web3: separate gameplay proof, onchain proof and cross-boundary settlement proof. No double count of a shared test, no percentage calculation before valid denominators and release acceptance.
- ETA only using comparable M22 cohort samples; a V1.1 Web2 workflow cannot be silently treated as Web3 contract or MMORPG production speed. Label insufficient domain samples NOT_YET_BASELINED even when a generic GEF timeline exists.

## Cross-profile regression fixtures
T01 one-line “2D browser game” -> proposes game interview, no mandatory chain questions/tool installs.
T02 “blockchain wallet SaaS” without chain -> ask EVM/Solana decision, no unsafe default mainnet deploy.
T03 Godot 4 C# browser project -> compatibility conflict, owner decision required before false runnable claims.
T04 existing approved Godot game with Phaser in transitive docs -> preserves engine, no automatic rewrite.
T05 EVM+Solana in same repo -> admit distinct isolated build/proof toolchains and an explicit bridge only if authorized; no conflated bytecode proof.
T06 owner-approved GAME_WEB3 -> game full tick remains offchain, no duplicate onchain credit under reorg/retries.
T07 owner asks FAST interview on live token protocol -> still asks custody, financial risk and audited deployment gate.
T08 offline UI-only game -> no paid game server or wallet package installed.
T09 current branch changes from backend to game after owner decision -> invalidate only affected source/proofs; preserve accepted unrelated history and show new denominator epoch.
T10 missing owner runtime/stack decision -> mark UNRESOLVED and propose bounded tech spike, no paid install.

## Proposed Work Order division
During future V1.2 WO-000 owner approval define conditional profiles and evidence floors, technical compatibility audit of current M38 detection and M14/M15 compilation, benchmark game and Web3 representative fixtures. Since future 7 provisional WOs are research placeholders, admit conditional domain-specific WO-007 WEB3 PILOT and WO-008 GAME PILOT ONLY IF the canonical owner-approved Scope deems them needed in V1.2 rather than an extension pack after core v1.2; a profile contract alone is not a new compulsory engine or guaranteed development duration. If approved, each requires exact Context Lock, Codex execution, objective audit, cross-platform/local install and opt-out.

STOP CONDITION: DOMAIN_PROFILE_RESEARCH_CAPTURED_NOT_ACTIVATED.
