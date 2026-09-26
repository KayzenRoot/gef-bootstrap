# M53 S03 — Policies
Status: FROZEN

**PTM53 Policy Truth Matrix** tests allow/deny/unknown/conflict/exception-expiry with deny-overrides and least-authority invariants. Mutation testing targets dangerous inversions such as fail-open UNKNOWN and expired exceptions.

Acceptance: decision-table coverage, deny monotonicity, conflict/unknown fail-closed, expiry boundaries, deterministic receipts.