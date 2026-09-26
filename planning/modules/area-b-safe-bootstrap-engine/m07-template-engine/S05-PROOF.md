# GBS-M07-S05 — Validation Proof Contract

Status: `NORMATIVE_PROOF_CONTRACT`

This companion is part of frozen M07-S05 planning and defines the minimum future implementation evidence. It does not authorize implementation.

## Required future proof families
1. complete valid RenderSnapshot becomes VALIDATED_FOR_EFFECT_PLANNING;
2. partial snapshot blocks;
3. stale/mismatched render snapshot blocks;
4. missing render artifact for an S01 entry blocks;
5. duplicate render artifact entryId blocks;
6. unknown/extra render artifact blocks;
7. entry kind mismatch blocks;
8. valid simple relative logical target passes;
9. empty target blocks;
10. leading slash/absolute target blocks;
11. drive/UNC/device/URI target blocks;
12. backslash target blocks;
13. empty path component blocks;
14. `.` component blocks;
15. `..` component blocks;
16. NUL/control character blocks;
17. non-NFC component blocks;
18. `< > " : | ? *` component characters block;
19. leading/trailing whitespace blocks;
20. trailing dot/space blocks;
21. reserved Windows device stem blocks including case/extension variants;
22. trailing slash blocks;
23. target/component byte budgets block deterministically;
24. exact duplicate targets block even with identical content;
25. ASCII-case-only target aliases block;
26. exact same content on distinct targets is valid;
27. file ancestor/descendant pair blocks (`a` vs `a/b`);
28. sibling targets do not trigger prefix false positive (`a/b` vs `a/c`);
29. collision outcome is independent of artifact array order;
30. host filesystem case behavior does not affect logical collision result;
31. S05 performs no realpath/directory enumeration for logical validation;
32. target validity never grants physical path authority;
33. immutable in-process S04 content can reuse integrity proof without body copy;
34. untrusted/deserialized content with digest mismatch blocks;
35. byte-length mismatch blocks;
36. content representation cannot change after admission under the frozen S04 snapshot-safe contract;
37. digest equality is never treated as authorship/trust/authorization;
38. script-like text remains data and creates no execution capability;
39. binary executable-looking bytes remain data and create no execution capability;
40. files absent from template do not become delete candidates;
41. S05 never scans brownfield project for obsolete files;
42. existing-file ownership is not inferred from template target;
43. overwrite/create/update/no-op classification is not fabricated by S05;
44. valid handoff contains desired artifact identities/content refs only;
45. VALIDATED_FOR_EFFECT_PLANNING is never presented as ready-to-apply;
46. downstream occupancy/ownership facts do not incorrectly make S05 INDETERMINATE;
47. truly missing mandatory S05 fact yields INDETERMINATE rather than guessed success;
48. identical validated inputs/policies produce identical templateValidationDigest;
49. timestamps/run IDs/local absolute paths do not change validation digest;
50. normal evidence excludes rendered bodies and binary payloads;
51. artifact/collision/evidence budgets fail closed;
52. cancellation/deadline yields no valid partial validation snapshot;
53. import/validator construction has no filesystem/network/process effect;
54. Windows/Linux/macOS portable fixture yields same logical validation result under the same policy;
55. M07 validation success cannot bypass M05 transaction planning;
56. M07 validation success cannot bypass M06 physical safety.

## Required fixtures
Future tests must include at least:
- one TEXT artifact and one BINARY artifact;
- zero-byte text artifact;
- exact duplicate target with same content;
- exact duplicate target with different content;
- ASCII case-alias pair;
- ancestor/descendant target pair;
- all invalid logical target classes from VAL-03;
- non-ASCII NFC-valid path;
- non-NFC equivalent path;
- immutable trusted render product;
- deserialized product with tampered content/digest/length;
- brownfield fixture with unrelated files absent from the template;
- existing target whose ownership/overwrite state is deliberately unknown to S05;
- maximum admitted artifact/target/evidence budgets and one-over-limit cases.

## Evidence requirements
Future exact-head evidence must bind:
- renderSnapshotDigest;
- validation contract version;
- logical target/collision policy versions;
- canonical entry/target collision keys;
- per-artifact target/content digests and byte lengths;
- validation outcome/gaps;
- templateValidationDigest;
- exact-head test/CI results.

Evidence must remain body-minimized and must not imply physical safety or authorization.

## Performance shape
Validation should operate over compact artifact metadata plus immutable content identities, build collision indexes once, avoid re-reading/rendering bodies when S04 integrity can be safely reused, sort/canonicalize once, and avoid repository/filesystem scans entirely.

M63 owns measured thresholds.

STOP CONDITION: `M07_S05_PROOF_CONTRACT_BOUND_TO_FREEZE`.
