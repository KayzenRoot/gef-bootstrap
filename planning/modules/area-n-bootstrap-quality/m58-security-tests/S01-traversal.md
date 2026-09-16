# M58 S01 — Traversal

Status: `FROZEN`
Mechanism: `PTA58 — Path Traversal Adversary`

Adversarially test path normalization/containment with `..`, mixed separators, absolute paths, drive/UNC forms where applicable, encoded separators, dot segments, prefix collisions and deep nesting. Inputs are generated from bounded tables and property seeds.

The invariant is semantic containment after canonical resolution, not string-prefix matching. Rejected input must cause zero mutation and stable security finding codes.

Acceptance: platform-specific cases on Ubuntu/Windows/macOS, sandbox escape impossible in test fixtures, property failures replayable by seed, and UNKNOWN resolution fails closed.

STOP CONDITION: `M58_S01_FROZEN`.