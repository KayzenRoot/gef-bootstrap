# ADR-0002 — Planning-to-Execution Acceleration

Status: `APPROVED`

## Trigger
`EXPLICIT_USER_PRODUCT_DECISION`

The Project Owner requires GEF Bootstrap to make target-project construction materially faster by resolving more engineering work during ChatGPT-led planning and handing executors such as Codex a pre-resolved, repository-local execution surface. Long executor sessions are acceptable when they produce material forward progress. Prompt brevity is not an objective by itself.

## Scope effect
This ADR refines existing execution-efficiency obligations. It does **not** create a new module, change the 64-module inventory, change the frozen production denominator `1088`, or reopen completed M10/M14/M15 semantics. M28 and M63 are the primary future owners. M63 may consume and project M10/M14/M15 outputs through new downstream acceleration artifacts without mutating those completed owners.

The current M26 HEDS Delta Review execution contract is unaffected by this owner directive.

## Decisions

### ADR-0002-D1 — Planning produces implementation seeds
For target repositories, governed planning MUST be able to produce an **Implementation Seed Tree** in addition to prose documentation. Planning may create safe directory/file structure and lightweight source/test skeletons when the planned architecture is sufficiently resolved.

A seed may include:
- file/module purpose and ownership;
- exact imports/exports, public types, interfaces, schemas and function signatures already decided;
- immutable constants and configuration shapes already decided;
- dependency declarations and source-of-truth references;
- invariants, preconditions, postconditions and failure semantics;
- algorithm/control-flow outline or pseudocode;
- TODO blocks that state the heavy implementation still required;
- expected tests and acceptance cases;
- explicit forbidden changes and out-of-scope regions.

The seed MUST NOT fabricate unresolved product/architecture decisions or silently implement speculative behavior.

### ADR-0002-D2 — New-project and brownfield modes differ
`NEW_PROJECT` may materialize planned directories and compile-safe seed files directly when safe.

`EXISTING_PROJECT/BROWNFIELD` MUST preserve healthy existing source. New files may be seeded normally; changes to existing files are represented by exact **Brownfield Patch Intent Capsules** unless a governed mutation phase explicitly authorizes the edit. Planning must not overwrite existing source merely to save executor time.

### ADR-0002-D3 — Executor discovery is exception-driven
Execution packs MUST prefer an exact **Executor Navigation Map** containing read-set, write-set, dependency set, test set, decisions not to reopen, and known unresolved questions. Repository-wide search is not the default task.

The executor may expand/search when an explicit contradiction, missing symbol, stale binding, unknown dependency or assurance requirement invalidates the supplied map. Expansion is bounded and recorded.

### ADR-0002-D4 — Prompt size is subordinate to progress density
There is no product requirement that executor prompts be short. A long prompt is preferred when it reduces rediscovery, ambiguity, retries, tool calls, context reload and branch re-reasoning while preserving correctness.

GEF optimizes **Prompt Progress Density**: useful governed implementation progress per executor invocation, not minimum page count.

### ADR-0002-D5 — Compatible work may be fused into long-horizon execution waves
M15/M63 may combine multiple compatible increments or modules into a **Marathon Execution Pack** when dependency ordering, ownership, mutation domains and assurance allow it.

Fusion does not erase atomic checkpoints. Each increment retains its own acceptance evidence and STOP/continue condition. A correction in an earlier dependency blocks dependent work but does not require discarding independent completed increments.

### ADR-0002-D6 — Test work is progressive and proof-preserving
M28 MUST optimize repeated validation without lowering quality.

Intermediate executor iterations should prefer:
1. static/type/build checks relevant to the changed surface;
2. directly impacted unit tests;
3. dependency-closure tests;
4. boundary/integration tests affected by the change;
5. broader regression only when risk/uncertainty requires it;
6. final exact-head full assurance sweeps required by the Work Order/assurance level.

A previously green test may be reused only through a validity-bound **Test Proof Reuse Receipt** proving that relevant source/test/config/toolchain/runtime inputs and the applicable impact closure remain compatible. A cached `PASS` string is never proof.

After a failure, the next iteration should run the failed test plus the impacted closure first. Re-running the entire suite after every local correction is prohibited unless the impact model is incomplete, the failure indicates systemic risk, or assurance policy requires it.

### ADR-0002-D7 — Final assurance remains uncompromised
Optimization cannot remove mandatory exact-head CI, security, cross-platform, integration, E2E or full-regression obligations required by assurance policy. Reuse saves repeated intermediate work; it does not manufacture final evidence.

### ADR-0002-D8 — Bootstrap construction boundary remains unchanged
GEF Bootstrap itself continues to be implemented through ChatGPT and connected project tools only. Codex/external executors may be used in target repositories governed by GEF, not to build this repository.

## Ownership
- M10 Planning Workspace: planned topology and planning artifacts.
- M11 Decision System: closed decisions and reopen authority.
- M13 Adoption Engine: new-project versus brownfield mutation posture.
- M14 Task & Context Compiler: minimum sufficient context, exact navigation/read surface and safe expansion.
- M15 Execution Pack Compiler: executable work DAG, no-discovery boundary, prompt completeness and long-horizon pack composition.
- M26 HEDS: detects semantic drift that can invalidate seeds/review reuse; no test-selection authority.
- M28 Test Impact Engine: test mapping, impact closure, proof reuse, progressive validation and uncertainty widening.
- M63 Executor Performance Engine: planning-to-implementation seed compilation, executor navigation optimization, work fusion, validation critical path and quantitative performance policy.
- M43/M45/M57: telemetry, baselines and performance benchmarks used to prove optimization value.

## Consequences
- GEF target-project planning becomes a construction activity, not documentation-only work.
- Codex should spend proportionally more time implementing and less time discovering/reasoning over already-resolved decisions.
- Prompts may legitimately be 10–20+ pages when that increases progress density.
- Test invocations become impact-driven during iteration, while final assurance remains exact and complete.
- Module batching becomes permitted but governed by dependency/ownership/assurance boundaries.
- No denominator change is required because M28 (`20`) and M63 (`19`) already carry the frozen burden for these responsibilities.

## Canonical companion
`.engineering/EXECUTOR-ACCELERATION-CONTRACT.md` defines the operational contract produced from this ADR.
