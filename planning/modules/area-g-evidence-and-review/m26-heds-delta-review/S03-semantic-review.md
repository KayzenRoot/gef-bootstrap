# GBS-M26-S03 — Semantic Review

Status: `FROZEN`
Module: `GBS-M26 — HEDS Delta Review`
Frozen weight: `19`
Assurance intensity: `HIGH_ASSURANCE`

## Objective
Freeze the semantic-review engine that converts trusted deltas into the minimum sufficient set of review items, findings and trace receipts. Unchanged accepted semantics are reusable only when their relevant source/proof validity remains current.

## Frozen mechanisms
1. **SDM26 — Semantic Delta Matrix**: canonical matrix of changed subjects, change class, affected semantic dimensions, authority changes and proof-impact references.
2. **IFP26 — Impact Frontier Projection**: computes the owner/dependency closure that requires semantic review, widening conservatively when dependency knowledge is incomplete; it does not select tests.
3. **ORF26 — Ownership Review Filter**: routes each impacted semantic dimension to its declared owner/reviewer domain and prevents M26 from judging facts outside delta-review authority.
4. **RCI26 — Review Candidate Index**: deterministic ordered set of review items derived from the impact frontier, with exact source/proof dependencies and no duplicate semantic item.
5. **RCF26 — Review Carry-Forward**: reuses a prior accepted HEDS review result only when subject identity, semantic digest, source authority, relevant proof fingerprint and review policy are all compatible.
6. **SFC26 — Semantic Finding Capsule**: immutable finding with finding ID, subject, severity, rule/invariant, evidence/proof refs, before/after semantic identities, status and finding digest.
7. **SFS26 — Severity & Finding State Schema**: freezes severities `CRITICAL | HIGH | MEDIUM | LOW | INFO` and states `OPEN | RESOLVED | SUPERSEDED | INDETERMINATE`; severity is not inferred from file size or text churn.
8. **DTR26 — Delta Trace Receipt**: independently recomputable mapping from baseline/candidate identities through delta inventory, impact frontier and review candidates to findings.

## Review rules
- Review scope follows semantic impact, not changed-file count, diff line count or provider ordering.
- A known unchanged subject may reuse prior review only with exact current validity; equality of text alone is insufficient.
- A changed dependency invalidates review carry-forward only for the dependent review closure when knowledge is complete; incomplete knowledge widens the closure.
- `CRITICAL` and `HIGH` findings are blocking for HEDS approval while open or indeterminate.
- `MEDIUM`, `LOW` and `INFO` remain visible and policy-addressable but M26 does not invent acceptance policy for them.
- M26 records whether a finding is resolved but does not mutate the underlying source, proof, assurance, test plan or checkpoint to resolve it.
- A finding cannot be made `RESOLVED` merely because it disappears from the next candidate set; exact supersession/resolution evidence is required.
- Review candidate order and input enumeration order cannot change semantic results.

## Review-efficiency contract
The intended HEDS optimization is: review changed semantics + invalidated review/proof closure, preserve still-current accepted review results, and surface uncertainty explicitly. Full reread is the conservative fallback only when coverage/dependency knowledge is insufficient.

## HIGH_ASSURANCE proof families
Nested dependency impact, diamond impact de-duplication, unrelated delta isolation, authority-only delta, proof-fingerprint invalidation, exact review carry-forward, stale carry-forward rejection, hidden finding disappearance, duplicate finding IDs, divergent finding payloads, severity tamper, permutation/property tests, incomplete-knowledge widening, cancellation and traversal-budget exhaustion.

STOP CONDITION: `M26_S03_FROZEN`.
