# M30 GitHub Bootstrap — Frozen Plan
Status: FROZEN
Assurance: HIGH_ASSURANCE
Weight: 17

Repository bootstrap is declarative and idempotent. A desired-state manifest covers repository metadata, issue conventions, pull-request defaults, labels, milestones and templates. Planning never assumes admin capability and emits capability gaps instead of silently weakening policy.

Issues use stable type/severity/area labels and acceptance fields. Pull requests bind source/base refs, Work Order, evidence and exact head. Labels and milestones are normalized, deduplicated and reconciled without deleting unknown user metadata. Templates are versioned and generated deterministically.

All mutations support dry-run plans and receipts. Reconciliation is repeatable, least-privilege, bounded and fails closed on ambiguous repository identity or permission uncertainty.

Acceptance: deterministic desired-state diff; idempotency; duplicate prevention; unknown-label preservation; PR/issue template validation; dry-run and mutation receipts; tests. STOP: M30 implementation and evidence accepted.