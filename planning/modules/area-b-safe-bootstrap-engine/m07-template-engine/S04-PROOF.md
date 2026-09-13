# GBS-M07-S04 — Rendering Proof Contract

Status: `NORMATIVE_PROOF_CONTRACT`

This companion is part of frozen M07-S04 planning and defines the minimum future implementation evidence. It does not authorize implementation.

## Required future proof families
1. literal-only TEXT_TEMPLATE renders exact UTF-8 bytes;
2. STRING variable projection is inserted exactly before line policy;
3. BOOLEAN renders lowercase `true`/`false`;
4. INTEGER renders canonical base-10;
5. ENUM renders exact member text;
6. selected UNBOUND_OPTIONAL var blocks;
7. var in inactive S03 span requires no render value;
8. variable value containing complete GEF marker-looking text stays literal;
9. `literal-open` emits exact `{{gef:`;
10. literal-open-produced marker-looking text is not re-tokenized;
11. condition control markers emit no bytes;
12. no whitespace/newline chomp occurs around controls;
13. PRESERVE_SOURCE retains CRLF/LF/lone-CR sequences from complete logical text;
14. LF canonicalizes CRLF/lone CR/LF to LF;
15. CRLF canonicalizes CRLF/lone CR/LF to CRLF without doubling existing CRLF;
16. inserted STRING newlines participate in LF/CRLF policy;
17. U+2028/U+2029 are not silently rewritten as CR/LF;
18. no UTF-8 BOM is synthesized;
19. rendering performs no Unicode normalization;
20. BINARY_COPY bytes are identical to source bytes;
21. BINARY_COPY marker-looking bytes are never parsed;
22. BINARY_COPY receives no line-ending transformation;
23. targetPattern variable substitution uses S02 canonical path projection;
24. targetPattern rendering does not resolve physical paths or cwd/root;
25. unsafe/unbound target variable cannot be sanitized into acceptance;
26. two artifacts may render same target and remain distinct for S05 conflict detection;
27. entry order never becomes last-write-wins;
28. empty selected TEXT content yields a zero-byte artifact;
29. S03 false branch does not suppress artifact existence;
30. exact content change changes renderedContentDigest;
31. exact logical target change changes renderedTargetDigest;
32. identical values from different provenance keep the same output/render snapshot identity as specified;
33. provenance/evidence identity may differ without changing output identity;
34. artifact canonical ordering is stable by entry identity;
35. identical compatible inputs on Windows/Linux/macOS produce equivalent logical targets and exact bytes for the same explicit line policy;
36. mismatched S01/S02/S03 bindings block;
37. stale conditional snapshot blocks;
38. per-entry output budget blocks before uncontrolled allocation;
39. aggregate output budget blocks deterministically;
40. CRLF expansion is accounted for in byte budget;
41. cancellation/deadline yields no valid partial RenderSnapshot;
42. normal evidence omits rendered body/binary payload by default;
43. import/renderer construction causes no filesystem/network/process side effect;
44. rendering performs no project/staging/temp-file write;
45. rendered content that resembles executable source does not grant process execution;
46. S04 success cannot bypass S05 validation;
47. S04 success cannot grant M05 mutation authorization;
48. S04 success cannot grant M06 path/write authority.

## Required fixtures
Future tests must include at least:
- text with no markers;
- text with repeated variable markers;
- nested S03 selection with inactive variable marker;
- literal-open adjacent to marker-like suffix;
- mixed CRLF/LF/lone-CR source and inserted variable text;
- empty text artifact;
- binary containing arbitrary bytes and marker-looking sequences;
- targetPattern with embedded variables in larger components;
- two entries producing the same logical target;
- same effective values from different S02 provenance;
- maximum admitted output and one-byte-over-budget output;
- stale/mismatched S02 and S03 snapshots.

## Evidence requirements
Future exact-head evidence must bind template semantic identity, variable value identity, conditional decision identity, rendering contract version, per-artifact exact target/content digests and lengths, aggregate render snapshot identity, budget configuration where outcome-relevant and CI/test results.

Evidence must not require dumping rendered file bodies or binary payloads.

## Performance shape
Render each selected text stream once; hash bytes as they are produced; avoid a second marker pass; avoid decoding BINARY_COPY; pre-account predictable expansion where possible; canonicalize artifact metadata once; keep bodies out of evidence and avoid duplicate full-output copies where an immutable bounded content representation can be reused.

M63 owns measured thresholds.

STOP CONDITION: `M07_S04_PROOF_CONTRACT_BOUND_TO_FREEZE`.
