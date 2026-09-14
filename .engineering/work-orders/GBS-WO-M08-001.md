# GBS-WO-M08-001 — Implement Project Profiles

Status: `ADMITTED`
Risk: `STANDARD`

## ADMISSION EVIDENCE
- Compilation PR: `#158`
- Compiled reviewed head: `d813e58960ce442b1d35de38b2fdb6c5d8b9bc73`
- Compilation review: `5193051986`
- Compilation merge: `274facd3e03d02f4ddb65afd3b5a419348ca8d66`
- Exact implementation base: the merge SHA of the separate admission checkpoint that activates this Work Order.

## OBJECTIVE
Implement M08 Project Profiles as a pure deterministic package at `packages/project-profiles` from frozen S01-S05 and the approved M08 Module Gate.

## CONTEXT
Compilation base: `418fa8e85e3fe7ff5f7b92db5b983f5dc83e9df8`.
Fingerprints: S01 `29fa3f6e7ad7cc27fd88673b43b557f237150fad`; S02 `207b3fbf8724f4a1720120dddbb5007a578d532a`; S03 `c070a3c39b355254be878b29f8932bfece6cfd92`; S04 `834db4181823b5131f0f91327272952495baea4e`; S05 `d3bc75a7d3b3d5fd8117503663b320b61793b0c0`; gate `f95c9e2b0acccb2e3284e4a13ea6a01aa5049f9f`.

## SCOPE
Strict/versioned profiles; built-ins `generic`, `typescript-node`, `python`, `web-app`; exact selection; deterministic digests/immutable snapshots; exact template refs; typed scalar bindings; specialized semantics; single-parent composition; cycle/depth/conflict/dedup; M07 profile-binding projection; bounded/cancellable startup-pure APIs; tests/evidence.

## OUT OF SCOPE
Ambient discovery; template fetching; tool/runtime probing or installation; process/network/provider/filesystem/Git mutation; brownfield migration; multiple inheritance; M09+ work; changes to M07/M05/M06 authority.

## FILES/SOURCES TO READ
Checkpoint, Source Hierarchy, Scope, Architecture, Security, Requirements, DoD, Test Plan, Decisions Ledger, M08 Module Gate, all M08 S01-S05 files, relevant M07 public types/tests, root build/test config, and `packages/template-engine` conventions.

## REQUIREMENTS
Explicit deterministic inputs only; anti-shadow built-ins; no scalar coercion; M08 cannot set M07 `valueClass`; canonical order-independent set hashing; immutable snapshots; exact supplied parent snapshots; finite depth/budgets; no last-write-wins; safe malformed-input failure; effect-free import.

## ARCHITECTURE RULES
Library-first; no CLI/kernel dependency; avoid circular template-engine dependency via narrow structural adapter; no host path/time/random/locale in semantic identity; no dynamic code execution.

## CONSTRAINTS
No unnecessary runtime dependency or broad cleanup. No history rewrite. Implementation must start from exact admission merge SHA. Production credit remains 0/14 until separate MODULE_DONE promotion.

## ACCEPTANCE CRITERIA
AC01 strict validation and unknown-core rejection. AC02 built-in anti-shadowing. AC03 exact generic/explicit selection without fallback. AC04 version/digest expectations. AC05 exact template refs. AC06 typed scalar preservation/no coercion. AC07 no profile-owned valueClass. AC08 deterministic digests/order invariance. AC09 immutable snapshots. AC10-12 S02/S03/S04 built-in semantics with no ambient inference. AC13 exact parent resolution. AC14 cycle/depth rejection. AC15 no multiple parents. AC16 binding conflict/no last-write-wins. AC17 same-template conflict across different IDs. AC18 identical duplicate deterministic dedup. AC19 native/composed digest rules. AC20 unchanged M07 precedence and typed projection only. AC21 no filesystem/network/process/provider effects. AC22 cancellation/budget typed failure. AC23 bounded value-safe diagnostics. AC24 cross-host deterministic identity. AC25 strict build/typecheck. AC26 focused unit/adversarial tests. AC27 full repository regression. AC28 dependency audit clean. AC29 Ubuntu/Windows/macOS focused matrix. AC30 relevant M07/M05/M06 regression green. AC31 evidence bundle binds admitted base, exact head/tree, files, checks/findings and proposed checkpoint delta.

## TESTS
Unit/adversarial validation, selection, digest/order, typed bindings, inheritance cycle/depth/conflict/dedup, cancellation/budgets, startup purity, M07 integration, strict build/typecheck, full tests, dependency audit, focused 3-OS matrix.

## DELIVERABLES
`packages/project-profiles/**`, minimal workspace integration, focused M08 workflow if needed, and proposed M08 evidence bundle.

## REVIEW FORMAT
Português brasileiro with admitted base, exact head/tree, changed files, AC mapping, checks, severity findings, corrections, residual ownership, verdict and Checkpoint Delta.

## STOP CONDITION
After the separate admission checkpoint merge: `READY_FOR_GBS_WO_M08_001`. Before that merge, implementation remains blocked. MODULE_DONE remains blocked until exact-head implementation audit and merge.
