# M31 GitHub Governance — Frozen Plan
Status: FROZEN
Assurance: MAX_ASSURANCE
Weight: 18

Governance compiles policy into a desired ruleset model covering protected refs, required checks, review requirements and merge policy. Unsupported administrative capabilities are surfaced as BLOCKED/CAPABILITY_GAP, never treated as applied.

Rulesets and branch protection are represented without provider-side side effects in core logic. Review policy requires evidence-bound exact-head assessment and distinguishes technical audit comments from formal GitHub approvals. Merge authorization requires current head, satisfied required checks, no unresolved HIGH/CRITICAL findings and permitted merge method.

Policy reconciliation is monotonic: a caller may strengthen but not silently weaken frozen requirements. Exceptions are explicit, scoped, expiring and auditable.

Acceptance: ruleset compilation; protection drift detection; exact-head review binding; merge authorization denial on stale/failed evidence; exception expiry; tests. STOP: M31 implementation and evidence accepted.