# M59 S04 — Commands

Status: `FROZEN`
Mechanism: `CRV59 — Command Reference Validator`

Maintain user command/reference documentation from the same versioned command/capability metadata used by M48 Help System. Each command documents purpose, syntax, options, side effects, required capability/authority, outputs, exit/error classes and examples.

No hand-maintained reference may contradict runtime help. Destructive/mutating commands visibly declare preview/confirmation/governance behavior. Unsupported capability is documented as such rather than hidden.

Acceptance: reference/help schema parity is CI-tested, ordering deterministic, examples fixture-tested, aliases/deprecations explicit, and stale commands fail documentation validation.

STOP CONDITION: `M59_S04_FROZEN`.