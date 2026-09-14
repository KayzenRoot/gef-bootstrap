# Exact-head semantic review

Review the exact PR head against the admitted Work Order, frozen planning/contracts, Source Hierarchy, Security, Test Plan and DoD. CI success is necessary evidence but not semantic approval.

Check: authorized lineage; intended-vs-actual delta; every required mechanism materialized as behavior rather than comments; exact bindings; deterministic/fail-closed behavior; graph bounds/cancellation; mutation/security boundaries; adversarial tests; regression/security evidence; unauthorized scope expansion; stale or conflicting evidence.

Classify findings CRITICAL/HIGH/MEDIUM/LOW with concrete file/contract evidence. CRITICAL or HIGH blocks merge. Same-author review must use COMMENT with an explicit objective verdict rather than pretending independent approval.