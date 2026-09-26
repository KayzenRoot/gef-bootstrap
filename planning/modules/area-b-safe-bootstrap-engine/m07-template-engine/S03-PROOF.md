# GBS-M07-S03 — Conditional Templates Proof Contract

Status: `NORMATIVE_PROOF_CONTRACT`

This companion is part of frozen M07-S03 planning. It defines the minimum future proof families and does not authorize implementation.

## Required future proof families
Any admitted M07 implementation Work Order must prove at least:
1. BOOLEAN true selects PRIMARY;
2. BOOLEAN false with else selects ALTERNATE;
3. BOOLEAN false without else selects EMPTY;
4. empty PRIMARY branch is valid;
5. empty ALTERNATE branch is valid;
6. nested true/false combinations are deterministic;
7. reachable conditions evaluate in stable preorder;
8. inactive subtree runtime values are short-circuited;
9. reached UNBOUND_OPTIONAL blocks;
10. unreachable UNBOUND_OPTIONAL is NOT_EVALUATED;
11. missing required value remains an S02 failure;
12. STRING condition is rejected;
13. INTEGER condition is rejected;
14. ENUM condition is rejected;
15. missing CONDITION_REFERENCE permission is rejected;
16. undeclared condition is rejected even inside an inactive branch;
17. duplicate else is rejected;
18. unmatched else is rejected;
19. unmatched end is rejected;
20. unclosed if is rejected;
21. nearest-open stack pairing is deterministic;
22. condition cannot cross TemplateEntry/source boundary;
23. condition directives remain invalid in targetPattern;
24. BINARY_COPY marker-looking bytes remain opaque;
25. marker-looking bytes from variable values remain literal data;
26. no automatic whitespace/newline trimming occurs;
27. selected empty content does not suppress TemplateEntry existence;
28. staticConditionRefs include inactive condition references;
29. evaluatedConditionRefs exclude unreachable conditions;
30. NOT_EVALUATED is never reported as FALSE;
31. identical template/value snapshot yields identical conditionalDecisionDigest;
32. changed reached BOOLEAN value changes the relevant selection/decision identity;
33. random IDs, timestamps, local paths and scheduling do not affect decision identity;
34. mismatched S02/template semantic binding blocks;
35. marker/node/nesting/evidence budgets fail closed;
36. cancellation/deadline leaves no target effect;
37. evidence remains compact and excludes source bodies by default;
38. unrelated brownfield files are not scanned or modified;
39. package import/evaluator construction has no filesystem/network/process side effect;
40. equivalent portable fixtures behave identically on supported Windows/Linux/macOS environments;
41. S03 success cannot bypass S04 rendering;
42. S03 success cannot bypass S05 complete validation;
43. S03 success cannot grant M05 transaction authorization;
44. S03 success cannot grant M06 physical path/write authority.

## Required structural fixtures
The future test corpus must include at least:
- no condition markers;
- one if/end;
- one if/else/end;
- multiple sibling condition blocks;
- nesting at minimum, normal and maximum admitted depth;
- malformed stack structures;
- inactive nested subtree with missing optional value;
- reached optional condition with missing value;
- variable value containing complete marker-looking syntax;
- condition marker adjacent to spaces/newlines to prove no chomp behavior;
- text whose selected branch is empty;
- condition-looking bytes in BINARY_COPY;
- targetPattern containing a forbidden condition directive;
- stale/mismatched S02 resolution snapshot.

## Evidence requirements
Future implementation evidence must bind:
- template semantic identity;
- S02 value snapshot identity;
- S03 contract version;
- stable condition tree/node identities;
- exact evaluated outcomes and selected branches;
- static vs evaluated dependency sets;
- cancellation/budget configuration identity where outcome-relevant;
- exact-head test/CI evidence.

Evidence must not rely on raw source-body dumps, ambient environment state or machine-local absolute paths.

## Performance shape
Future implementation should reuse S01 lexical marker coordinates and S02 indexed variables, build each condition tree once, evaluate only reachable nodes, represent selections as compact source spans/tokens and compute decision identity from canonical compact structures.

M63 owns measured thresholds; this proof contract freezes only the structural efficiency requirement.

STOP CONDITION: `M07_S03_PROOF_CONTRACT_BOUND_TO_FREEZE`.
