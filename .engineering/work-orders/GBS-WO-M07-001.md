# GBS-WO-M07-001 — Implement Template Engine

Status: `ADMITTED`
Risk: `MODERATE`

## Admission evidence
- Compilation PR: `#131`
- Compiled reviewed head: `82928d29609e3879ae16608244d7bfe9919041b5`
- Compilation review: `5190895635`
- Compilation merge: `6ef682f784c6aa9c5465b9e380d36af5e7368e1a`
- Exact implementation base: the merge SHA of the separate admission checkpoint that activates this Work Order.

## Objective
Implement the complete deterministic, non-executable and side-effect-free `GBS-M07 — Template Engine` from frozen S01-S05 and the approved M07 Module Gate. The implementation must load exact template sources, resolve typed variables, select BOOLEAN-only conditional branches, render deterministic bytes/targets and validate the complete desired-artifact set without creating filesystem effects or weakening M05/M06 governance.

## Immutable compilation contract
The complete compiled Work Order is preserved by:
- compilation blob: `7d2e93c866957ace0ba39873efaf60874fdc9a38`
- compilation PR/head/review/merge above;
- compilation base: `0328fe36ac534cdd0849f415af513c01706b2093`.

Binding planning fingerprints remain:
- S01 Template Format: `1e5ea91fd101d95870f986ae5f4b3b8225b19d8f`
- S02 Variables: `645fb78e9ae8d007abc3654ec39e038c0907777c`
- S02 freeze: `45b878ee91dbb9ba69cdd23c9f48551a40ff91b1`
- S03 Conditional Templates: `b1432fedb11b58c652690ed81ef654a1abcd6d34`
- S03 proof: `97dc44d7b22cc5d03b0d27fb25780ad1f724e2c6`
- S04 Rendering: `5aae3086fb5846211d4844394f285e9751e34a42`
- S04 proof: `e80885670ed8eaca3f3808bac0f234d6987d6e2c`
- S04 freeze: `92d975e96e12332ca6b49cff719800396ac6b493`
- S05 Validation: `914eca2a22861c76d543a6b75aec4cf3c258b55a`
- S05 proof: `8ca2c81b2c9650dac04d32349a6a29f8f6dd20c5`
- S05 freeze: `2706157fec8323bc0cffe8b4d8872abf24f18703`
- M07 Module Gate: `097e0f890284b9e79ab3e3078250825c7126e5ba`
- root package topology: `33f1fe6387e5add6274ed7839c9ba4879280b3fb`.

If any bound frozen source, Module Gate, Architecture, Security, Definition of Done, Test/Benchmark Plan, relevant M05/M06 public contract or workspace build topology changes before implementation exact-head review, mark this Work Order `STALE` and reconcile it before continuing.

## Admitted implementation surface
Implement only the compiled M07 surface:
- dedicated `packages/template-engine` package;
- strict duplicate-key/prototype-safe JSON and runtime validation;
- frozen S01 format/source handling;
- frozen S02 variable resolution;
- frozen S03 BOOLEAN-only conditional selection;
- frozen S04 deterministic rendering;
- frozen S05 desired-artifact validation;
- narrow injected source-read, digest, cancellation/deadline and budget capabilities;
- complete frozen proof-family coverage;
- focused Ubuntu/Windows/macOS portability/startup-purity workflow;
- focused M07 → downstream M05 integration proof without authority inference;
- full M00-M06 regression validation.

The exact 56 acceptance criteria, adversarial coverage, validation commands, deliverables and out-of-scope boundaries are immutable in the compiled Work Order blob above and remain mandatory.

## Non-negotiable boundaries
M07 MUST NOT:
- import kernel merely to implement template semantics or create a template-engine → kernel dependency cycle;
- write project/staging/recovery/temp files;
- invoke M06 physical write primitives;
- infer M05 security class, authorization, ownership or overwrite permission;
- create REMOVE/MOVE intent from template omission;
- execute template hooks, arbitrary expressions, loops, macros, functions or remote/dynamic includes;
- acquire/materialize secret values;
- scan or normalize brownfield repositories broadly;
- treat digest equality as trust/authorship/authorization;
- use Codex for Bootstrap construction absent a separately governed exception.

## Admission rule
This Work Order is executable only after the separate admission checkpoint PR is exact-head reviewed and merged. That admission merge SHA becomes the exact implementation base and must be recorded in the implementation Context Lock/evidence.

No production credit is earned by admission. M07 remains `0 / 14` until implementation, evidence, semantic review and a separate `MODULE_DONE` promotion are complete.

## Production accounting
- M07 weight: `14`
- earned at admission: `0 / 14`
- total remains: `125 / 1088 = 11.49%`
- remaining remains: `963 / 1088 = 88.51%`
- denominator change: `NONE`

## Stop condition
After the separate admission checkpoint merge: `READY_FOR_GBS_WO_M07_001`.
Before that merge: implementation remains blocked.
