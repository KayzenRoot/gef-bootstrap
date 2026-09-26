# GBS-M08 — Project Profiles Module Gate

Status: `PLANNED_READY_FOR_IMPLEMENTATION`
Risk: `STANDARD`

## Gate basis
The gate evaluates implementation readiness only. It does not admit implementation or award production credit.

Frozen planning:
- S01 Generic Profile: `FROZEN` — PR `#135` — merge `826fbf53d3f57823f00e912196c0da7e7aba11db`
- S02 TypeScript and Node: `FROZEN` — PR `#137` — merge `14654ea3417b1deaf18442a60d846617def3c9c7`
- S03 Python: `FROZEN` — PR `#150` — merge `1ea059f26ab8e9b06798c82d427f0ae1520a313a`
- S04 Web and App: `FROZEN` — PR `#152` — merge `de993e0c336fc41e0df9031528913297ba028759`
- S05 Profile Inheritance: `FROZEN` — PR `#154` — merge `2e59d0e8c8463596bcb1ca40b62a7453e77c8257`

Canonical progression base: `17a3f774d691db4998ec96a01fc29f13858ecb78`.

## Implementation placement
M08 is implementable as a dedicated pure package:

`packages/project-profiles`

The package may depend on stable lower-level contracts/utilities needed for deterministic hashing/result types, and may expose an explicit adapter boundary for M07 `PROFILE_BINDING` candidates. It MUST NOT depend on CLI/kernel orchestration, filesystem mutation, package-manager execution, network/provider clients or future M09+ modules.

## Required implementation surface
The single M08 Work Order must implement and test:
1. strict/versioned profile model and validation;
2. product-owned built-ins `generic`, `typescript-node`, `python`, `web-app`;
3. exact `EXPLICIT_PROFILE` and `DEFAULT_GENERIC` selection;
4. immutable selected-profile snapshots and deterministic native semantic digests;
5. exact template-binding references and typed variable-binding candidates;
6. S02 TypeScript/Node semantic validation;
7. S03 Python semantic validation;
8. S04 Web/App semantic validation;
9. S05 exact single-parent composition with native/composed digests;
10. cycle/depth/conflict/dedup handling;
11. projection into the existing M07 `PROFILE_BINDING` layer without weakening M07 authority;
12. bounded/cancellable/startup-pure operation;
13. value-safe typed diagnostics;
14. focused cross-platform portability proof.

## Frozen architectural boundaries
- profile intent is never runtime/tool availability evidence;
- no ambient repository/environment/tool inference participates in profile identity/selection;
- package managers, frameworks, build backends, bundlers and providers are not auto-selected;
- M07 remains sole authority for template variable declarations, type/valueClass/context/source validation and precedence;
- M05 remains semantic mutation authority;
- M06 remains physical path/write authority;
- M09 remains source/template distribution authority;
- M13 remains adoption/migration owner for brownfield normalization;
- M37 remains global trust/authorship/integrity owner;
- M51 remains exact compatibility-matrix owner;
- M63 remains quantitative performance-budget owner.

## Security/read-only requirements
M08 profile processing is S0/read-only. Import and API use MUST NOT by implication:
- scan repository trees;
- read home/global configuration;
- harvest process environment;
- execute runtimes/package managers/build tools/scripts;
- install/download dependencies or runtimes;
- access package registries/network/provider APIs;
- acquire/dereference secret material;
- mutate files, Git or providers.

## Determinism requirements
- strict duplicate-key/prototype-safe structured input handling when raw JSON is admitted;
- stable profile/binding identifier grammars;
- canonical order-independent semantic hashing;
- exact version/digest expectation checks;
- no floating profile/template references;
- explicit immutable snapshot identities;
- single-parent inheritance only;
- direct/transitive cycle failure;
- finite depth/aggregate budgets;
- duplicate binding IDs fail unless semantically identical;
- same-template/different-binding conflict fails even under different binding IDs;
- no last-write-wins composition.

## Required test/evidence families
At minimum:
- built-in registry exactness and anti-shadowing;
- generic default versus explicit selection/fallback refusal;
- malformed schema/version/kind/ID rejection;
- deterministic digest/order invariance;
- exact profile expectation mismatch;
- exact template reference validation;
- typed scalar binding preservation and no coercion;
- no profile-owned M07 valueClass authority;
- explicit-input precedence preserved at M07 integration boundary;
- TypeScript/Node runtime/tool/package-manager neutrality;
- Python runtime/environment/manager/backend neutrality;
- Web/App framework/bundler/provider neutrality;
- inheritance parent mismatch/cycle/depth/conflict/dedup;
- native vs composed digest behavior;
- brownfield pin/stale snapshot behavior;
- cancellation/resource budgets;
- startup/import purity;
- Ubuntu/Windows/macOS focused matrix;
- full repository regression checks appropriate to STANDARD risk;
- dependency/security audit.

## Gate verdict
Planning is sufficiently frozen and testable for one governed implementation Work Order.

Verdict: `PLANNED_READY_FOR_IMPLEMENTATION`.

No unresolved planning-level HIGH/CRITICAL finding is known.

## Next-stage rule
After this gate PR is exact-head reviewed and merged, the only legal next action is compilation of:

`GBS-WO-M08-001 — Implement Project Profiles`

Compilation does not authorize implementation. A separate admission PR must bind the exact implementation base before code changes begin.

Production remains `139 / 1088 = 12.78%`; M08 remains `0 / 14` until implementation evidence is merged and a separate MODULE_DONE promotion passes.

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.

STOP CONDITION: `M08_PLANNED_READY_FOR_IMPLEMENTATION`.
