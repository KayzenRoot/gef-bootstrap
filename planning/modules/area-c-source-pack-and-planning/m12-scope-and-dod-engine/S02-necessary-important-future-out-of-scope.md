# GBS-M12-S02 — Necessary / Important / Future / Out of Scope

Status: `FROZEN`
Module: `GBS-M12 Scope and DoD Engine`
Classification: `CORE_REQUIRED`
Authority domain: `SCOPE`

## Objective
Define a deterministic admission policy for new capabilities, technologies and implementation work so innovation is encouraged without silently expanding the approved version.

## Admission taxonomy
Every proposed change presented to the current version is classified as exactly one of:
- `NECESSARY`: objective evidence shows the current frozen Scope, Requirements, Architecture, Security obligations or DoD cannot be satisfied without it. It may enter the current version automatically after validation.
- `IMPORTANT`: materially improves quality, maintainability, usability, performance or future readiness but current DoD can be satisfied without it. It requires explicit admission before implementation.
- `FUTURE`: useful candidate whose value is plausible but not required now, or whose dependencies/risks are not mature enough. Preserve as backlog/technology candidate only.
- `OUT_OF_SCOPE`: incompatible with the current product target or explicitly excluded. Do not implement in this version.

## Admission proof
A `NECESSARY` classification must include at least one stable obligation reference and a concise necessity argument. “Better”, “more professional”, “new technology”, “benchmark winner”, implementation convenience or LLM preference is insufficient.

## Scope Admission Envelope
The **Scope Admission Envelope (SAE)** contains proposal ID, requested capability, admission class, obligation references, rationale, affected scope items, dependency/risk notes and source bindings. It is deterministic evidence for admission review, not an approval by itself.

## Necessity Proof Matrix
A **Necessity Proof Matrix (NPM)** maps each `NECESSARY` proposal to the exact requirement/DoD/architecture/security obligation it unblocks. Orphan NECESSARY proposals fail validation. This prevents “scope creep wearing a necessary hat.”

## Expansion Firewall
The **Expansion Firewall (EF)** rejects automatic current-version admission for `IMPORTANT`, `FUTURE` and `OUT_OF_SCOPE`. Only `NECESSARY` with valid proof may return `AUTO_ADMISSION_CANDIDATE`; actual repository mutation still follows the governed Work Order flow.

## Innovation Sandbox Queue
An **Innovation Sandbox Queue (ISQ)** preserves IMPORTANT/FUTURE technologies with utility, risk, dependency, maturity and revisit-trigger metadata. This lets the project explore new technologies aggressively without contaminating the frozen production denominator.

## Reclassification
Reclassification requires new evidence and an explicit transition record. `FUTURE -> NECESSARY` is legal only when a newly applicable current obligation demonstrates necessity. `IMPORTANT -> NECESSARY` cannot happen merely because implementation already started.

## Technology classification
- SAE, NPM and Expansion Firewall: `NECESSARY`.
- Innovation Sandbox Queue projection: `IMPORTANT`; implement pure queue projection because it preserves ideas without widening scope.
- policy-as-code adapters (OPA/Rego/Cedar): `IMPORTANT/FUTURE`; adapter seam only, no runtime dependency.
- multi-criteria decision analysis scores: `IMPORTANT`; explanatory only, never overrides proof.
- LLM technology scout: `EXPERIMENTAL_GATED`; may propose/classify provisionally, deterministic governance owns admission.
- autonomous scope expansion: `OUT_OF_SCOPE`.

## Proof obligations
NECESSARY requires stable obligation linkage; non-necessary classes never auto-admit; reclassification is explicit; unproven necessary fails closed; deterministic SAE/NPM/ISQ; no denominator change from proposal classification; no implementation-existence bias.

Open questions: `0`.

STOP CONDITION: `GBS_M12_S02_FROZEN`.