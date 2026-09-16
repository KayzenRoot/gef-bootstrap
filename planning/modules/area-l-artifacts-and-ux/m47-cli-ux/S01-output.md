# M47 S01 — Output
Status: FROZEN | Canonical name: Interaction & Operator UX

M47 is interface-agnostic; CLI is one renderer. **OOM47 Operator Output Model** separates machine payload, human summary, evidence references and next-action affordances. Renderers consume the same semantic state so web/desktop/CLI cannot disagree about status.

Default output is progressive: concise status first, drill-down evidence on demand. Stable identifiers permit copy/paste and automation.

Acceptance: renderer-independent semantics, machine/human separation, stable ids, concise progressive disclosure, deterministic snapshot tests.