# M38 S04 — Compatibility
Status: FROZEN
Assurance: HIGH_ASSURANCE

## Mechanisms
- **REQ38 Requirement Capability Contract** normalized required/optional capabilities.
- **CMP38 Compatibility Evaluator** COMPATIBLE/DEGRADED/INCOMPATIBLE/UNKNOWN/CONFLICT.
- **FBP38 Fallback Plan** selects only explicitly allowed alternatives.
- **WID38 Compatibility Widening** unknown/conflict cannot be treated as compatible.
- **CHH38 Capability Handoff** immutable environment capability envelope for adapters.

Compatibility is versioned and explainable. Fallbacks preserve safety and acceptance obligations rather than silently reducing them.