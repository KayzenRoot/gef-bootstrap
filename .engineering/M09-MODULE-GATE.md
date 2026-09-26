# GBS-M09 — Source Pack Engine Module Gate

Status: `PLANNED_READY_FOR_IMPLEMENTATION`
Risk: `ELEVATED`

## Gate basis
This gate evaluates implementation readiness only. It does not admit implementation or award production credit.

Frozen planning:
- S01 Source Pack Structure: `FROZEN`
- S02 Required Documents: `FROZEN`
- S03 Conditional Documents: `FROZEN`
- S04 Source Hierarchy: `FROZEN`
- S05 Integrity: `FROZEN`
- planning PR: `#162`
- planning reviewed head: `f5278012877b377c432116cf06363c71b54f90f6`
- planning audit: `5193171400`
- planning merge: `fb5a5bb1a6b67e5c62bb8bac17a0a98961c041d3`
- ledger/freeze PR: `#164`
- ledger/freeze reviewed head: `b45265b66f5f38bb06bb6b58ff2b22b20cfaaaae`
- ledger/freeze audit: `5193207286`
- ledger/freeze merge: `47713886001f5b4f89d448ea32de583dafff4429`
- production-accounting correction PR: `#165`
- correction reviewed head: `82705ceb34852361c628364eca7e285c7de89b36`
- correction audit: `5193214616`
- correction merge: `fd1dcc832bec1c17d773692f17d01a29d3c67621`

Canonical ledger continuation:
`.engineering/ledgers/M09-SOURCE-PACK-LEDGER-SYNC.md`

## Readiness verdict
All M09 planning prerequisites are present, mutually compatible and implementation-testable. No unresolved HIGH/CRITICAL planning defect is known.

Verdict: `PLANNED_READY_FOR_IMPLEMENTATION`.

## Implementation placement
The implementation should use one dedicated pure package:

`packages/source-pack`

It may depend only on stable lower-level public contracts needed for project identity, template identity, project-profile snapshots, deterministic result types and injected digest/cancellation capabilities. It MUST NOT import CLI orchestration, provider/network clients, adoption implementation, context compiler, future assurance engines or alternate filesystem mutation paths.

## Required implementation surface
A single bounded M09 Work Order must implement and test at minimum:
1. strict/versioned Source Pack model and schema validation;
2. stable project binding and semantic source-entry identity;
3. document → section → fact → dependency-set topology representation;
4. Source Topology Mesh relation validation, cycle diagnostics and bounded traversal;
5. Authority Vector Envelope representation without total-rank authority;
6. Canonical Requirement Matrix evaluation;
7. required-class states `RESOLVED_ACTIVE`, `RESOLVED_NOT_APPLICABLE`, `MISSING_REQUIRED`, `AMBIGUOUS`, `CONFLICT`, `INVALID_BINDING`;
8. Source Alias Bridge representation only for already-admitted aliases;
9. Applicability Lattice normalization and evaluation;
10. Condition Witness binding and invalidation dependencies;
11. Dormant Source Pointer non-authority behavior;
12. domain-specific source resolution preserving D-0021 authority semantics;
13. Authority Resolution Proof generation;
14. Conflict Shadow Graph preservation without normal-context promotion;
15. Authority Neighborhood Cache as disposable derived state only;
16. exact M07 template-source resolution from exact ID/version/required digest with no fallback;
17. explicit descriptive-vs-normative `DRIFT_RELATION` representation;
18. four-layer integrity evaluation: structural/source/authority/applicability;
19. Semantic Integrity Spine using injected digest capability rather than a hard-coded weak hash;
20. Drift Shockwave Map selective invalidation and conservative widening;
21. Integrity Epoch semantic identity independent of time;
22. deterministic constitution fingerprint from exact active constitutional sources;
23. Conformance Receipt Seed construction without claiming final assurance verdict;
24. immutable/read-only result snapshots, bounded/cancellable operations and startup purity;
25. typed diagnostics for malformed, stale, missing, ambiguous, conflicting, project-mismatch and unsupported-version states.

## Frozen authority boundaries
- M03 remains project-identity authority.
- M05 remains semantic transaction/mutation authority.
- M06 remains filesystem/path/write authority.
- M07 remains template declaration/variable/valueClass/precedence authority.
- M08 remains project-profile selection/snapshot/binding authority.
- M09 may resolve exact source identities but may not choose floating/latest/closest templates.
- M10 owns planning workspace behavior.
- M11 owns project decision semantics.
- M12 owns Scope and DoD semantics.
- M13 owns brownfield alias admission and adoption/migration policy.
- M14 owns Minimum Sufficient Context and executor context selection.
- M24+ own final evidence/assurance proof and verdict mechanics.
- M37 owns broader trust/authorship/integrity policy beyond M09 Source Pack integrity.
- M51 owns exact runtime/platform compatibility.
- M63 owns quantitative executor-performance thresholds.

## Security and side-effect requirements
Source Pack construction/resolution is read-only and startup-pure. Import or ordinary API use MUST NOT by implication:
- mutate canonical sources, files, Git or providers;
- execute repository modules/configuration/hooks;
- run package managers/build tools/interpreters;
- scan outside an explicitly supplied governed source set;
- read home/global configuration or harvest ambient environment;
- access network/provider APIs;
- dereference secrets;
- infer authority from timestamps, lexical path order, filesystem order or chat history;
- convert UNKNOWN/CONTRADICTORY/INDETERMINATE into success.

Any durable Source Pack publication later required by an admitted operation must route through M05/M06 rather than introducing a write path inside M09.

## Determinism requirements
- equivalent canonical inputs + governed conditions => equivalent Source Pack semantic identity across Windows/Linux/macOS;
- canonical collection ordering before semantic digest input;
- host paths, locale, wall-clock and enumeration order excluded from semantic identity;
- duplicate IDs/semantic keys fail closed unless an explicitly frozen dedup rule applies;
- graph traversal finite and bounded;
- exact dependency bindings drive selective invalidation;
- unknown dependency coverage widens invalidation conservatively;
- condition predicates normalize deterministically;
- exact-template mismatch states remain typed and non-fallback;
- cached authority neighborhoods cannot become canonical truth.

## Required test/evidence families
At minimum:
- strict schema/version/project binding validation;
- duplicate/prototype-hostile input rejection where raw structured input is admitted;
- topology order invariance and bounded traversal;
- graph cycle diagnostics;
- authority-vector/domain preservation;
- required-class matrix evaluation and explicit NOT_APPLICABLE provenance;
- no filename/presence/timestamp-based authority inference;
- missing/ambiguous/conflict states;
- admitted alias representation and unadmitted-alias rejection;
- applicability ACTIVE/INACTIVE/UNKNOWN/CONTRADICTORY;
- witness-bound invalidation;
- dormant pointer cannot exercise active authority;
- domain-correct authority resolution and no newest-wins behavior;
- ARP reproducibility;
- conflict shadow retention;
- exact M07 template match/not-found/identity/version/digest/ambiguity cases;
- descriptive-vs-normative drift preservation;
- integrity-layer independent failures;
- selective invalidation plus conservative widening;
- Integrity Epoch equivalence under ordering/metadata changes;
- constitution fingerprint determinism;
- project mismatch/stale/unsupported-version handling;
- conformance receipt seed reproducibility;
- cancellation/resource budgets;
- startup/import purity;
- Ubuntu/Windows/macOS focused matrix;
- M07/M08 regression proof and appropriate full-repository regression checks;
- dependency/security audit.

## Innovation implementation rule
TECH-0045..TECH-0058 are frozen semantic mechanisms, not permission for speculative subsystems. The Work Order must implement the smallest deterministic surfaces that satisfy their frozen contracts. TECH-0051 and TECH-0054 remain `IMPORTANT`; they do not silently expand release-blocking scope beyond their admitted supporting role.

## Accounting gate
Frozen Backlog assigns M09 weight `19`. Planning earns `0 / 19`.

Current production before M09 implementation:
- earned: `156`;
- denominator: `1088`;
- completion: `14.34%`;
- remaining: `932` (`85.66%`).

No production credit is awarded by this Module Gate.

## Next-stage rule
After this Module Gate PR is exact-head audited and merged, the only legal next action is compilation of:

`GBS-WO-M09-001 — Implement Source Pack Engine`

Compilation does not authorize implementation. A separate admission checkpoint/PR must bind the exact implementation base before code changes begin.

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.

STOP CONDITION: `M09_PLANNED_READY_FOR_IMPLEMENTATION`.