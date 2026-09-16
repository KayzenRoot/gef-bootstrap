# M58 S04 — Malicious Configuration

Status: `FROZEN`
Mechanism: `MCA58 — Malicious Configuration Adversary`

Test untrusted configuration containing traversal targets, command-like strings, prototype-pollution keys, oversized/deep structures, duplicate/conflicting authority fields, unsafe URLs, malformed encodings and attempts to weaken policy/security gates.

Configuration is data, never executable code. Parsing is bounded; schema validation precedes use; unknown security-sensitive fields fail closed; lower-authority config cannot override constitution/policy/Work Order authority.

Acceptance: no command execution from config, bounded depth/size, prototype integrity preserved, dangerous overrides rejected with stable codes, and fuzz/property cases replay by seed.

STOP CONDITION: `M58_S04_FROZEN`.