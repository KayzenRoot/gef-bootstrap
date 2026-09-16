# M27 Assurance Pipeline — Ledger Sync

Status: `FROZEN`
Module: `GBS-M27 — Assurance Pipeline`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Source synchronization
M27 planning is reconciled with the current checkpoint, Scope, Architecture, Master Module Index, D-0024 assurance-overrides-budgets decision, M24 evidence ownership, M25 proof ownership, M26 HEDS ownership, future M28 test-impact ownership, future M29 Git ownership, security/reliability modules, release governance and the approved executor-acceleration directive.

No denominator change is introduced. Planning grants no production credit.

## Technology synchronization
- `TECH-0030 — Full-Context Safety Gate` is adopted through FCE27/LFG27 as an assurance-owned escalation rule; M14 remains context-compilation owner.
- `TECH-0058 — Exact-Head Full Sweep Gate` from the executor-acceleration overlay is adopted through EHF27. M27 owns whether the assurance profile requires the final sweep; M28 owns concrete test selection; M32 owns CI orchestration; M29 may later supply Git head/tree identity.
- Progressive validation/TPRR candidates remain future M28/M63 ownership and are not prematurely implemented by M27.
- M27 creates no external service, database, Git provider, filesystem crawler or ambient runtime dependency in its semantic core.

## Frozen mechanisms
- S01: AIC27, AAB27, ACF27, ARP27, HSF27, ABG27, FCE27, ACG27.
- S02: ARM27, APM27, OBG27, PCG27, DAB27, PHG27, HHG27, RCS27.
- S03: EAG27, PSG27, HSG27, ECG27, UAG27, BSG27, CAG27, AER27.
- S04: AEP27, LFG27, EHF27, RPG27, SAG27, CFG27, BMG27, VAG27.
- S05: AVC27, AIR27, ASD27, ATR27, ARG27, ASW27, ARW27, DAH27.

Total: `40` mechanisms.

## Ownership synchronization
- source owners keep source truth and risk-signal authority;
- M24 keeps evidence validation/acceptance;
- M25 keeps proof graph/sufficiency/carry-forward/invalidation;
- M26 keeps semantic delta review/findings/HEDS verdict;
- M27 owns assurance taxonomy, minimum floor, requirement profile, assurance gates/verdict/history and read-only downstream assurance handoff;
- M28 keeps test-impact/test identity/selection/reuse receipts;
- M29 keeps Git semantics;
- M32 keeps CI bootstrap/orchestration;
- M34/M35/M58 keep security control/test ownership;
- M17/M21/M23 keep checkpoint/progress/project-status authority;
- M33/M62 keep release/final production acceptance authority.

## Frozen taxonomy
`STANDARD < STANDARD_PLUS < ELEVATED < HIGH_ASSURANCE < MAX_ASSURANCE`.

Caller-requested strength may raise but never lower the derived floor. Missing/conflicting mandatory risk truth cannot default to a weaker class. Optimization budgets never override the floor.

## Implementation seed map
Planned canonical package: `packages/assurance-pipeline`.
Planned files: package/tsconfig; `src/types.ts`; `src/utils.ts`; `src/registry.ts`; `src/s01-classification.ts`; `src/s02-requirements.ts`; `src/s03-admission.ts`; `src/s04-gates.ts`; `src/s05-verdict.ts`; `src/public.ts`; tests `m27-assurance-pipeline.test.mjs`, `m27-hardening.test.mjs`, `m27-startup-purity.test.mjs`; workflow `.github/workflows/m27-platform.yml`.

This is a planning seed only. No source file is created before implementation admission.

## Engineering rules
Canonical ordering; monotonic assurance floor; no majority masking of high-risk signals; exact project/lineage/candidate/policy binding; current M24/M25/M26 facts only; uncertainty widens requirements; no test selection inside M27; final exact-candidate sweep when required; explicit platform/runtime/security obligations; injected domain-separated SHA-256; bounded/cancellable traversal; startup-pure semantic core; no ambient filesystem/network/Git/clock; replay/split-brain/regression/truncation visible; read-only downstream handoffs.

## Production accounting
- denominator: `1088` unchanged;
- earned before M27: `471`;
- M27 planning credit: `0 / 20`;
- production remains `471 / 1088 = 43.29%` until evidence-bound MODULE_DONE promotion.

STOP CONDITION: `M27_LEDGER_SYNC_FROZEN`.
