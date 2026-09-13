# GBS-M07-S02 — Variables Freeze Corrections

Status: `NORMATIVE_FREEZE_CORRECTIONS`

This companion is part of the frozen `GBS-M07-S02 — Variables` planning contract. It records review corrections discovered after the initial semantic body was written but before exact-head approval. Where this file conflicts with `S02-variables.md`, **this file prevails**. All non-conflicting S02 clauses remain unchanged.

## Correction C1 — INTEGER is semantic numeric identity, not pre-parse lexical spelling
Supersedes the `42.0` example in VAR-04 and refines VAR-07.

S02 INTEGER accepts a typed numeric value only when it is finite and `Number.isSafeInteger`-equivalent within the inclusive range `-(2^53-1)` through `2^53-1`.

The textual spelling used by an upstream JSON source is not independently semantic once that owning source parser has produced the typed numeric value. Therefore JSON spellings such as `42` and `42.0` may converge to the same typed INTEGER value and S02 MUST NOT require access to raw lexical tokens merely to distinguish them.

Fractions, NaN, Infinity and out-of-range numbers remain invalid. Negative zero canonicalizes to integer zero. Canonical S04 projection remains base-10 with no leading plus and no unnecessary leading zeroes.

This keeps S02 mechanically implementable through typed APIs and avoids hidden dependence on raw JSON token preservation.

## Correction C2 — Portable target-path segment predicate includes cross-platform invalid characters and Windows device stems
Refines VAR-19.

In addition to the existing VAR-19 requirements, a value used in `TARGET_PATH_SEGMENT` MUST:
- contain none of `<`, `>`, `"`, `|`, `?`, `*`;
- contain no ASCII control character including DEL;
- continue to contain no `/`, `\\`, colon or NUL;
- not equal `.` or `..`;
- not begin/end with whitespace;
- not end in dot or space;
- reject Windows reserved device stems case-insensitively even when followed by an extension or additional dot suffix. The reserved stem set is `CON`, `PRN`, `AUX`, `NUL`, `COM1`-`COM9`, `LPT1`-`LPT9`.

Examples that therefore fail at S02 path-context validation include `CON`, `con.txt`, `LPT1.log`, `bad:name`, `a/b`, `a\\b`, `x?y` and `name.`.

S02 still does not claim complete final-path safety. S05 validates the fully substituted logical path and M06 remains physical path authority.

## Correction C3 — `valueClass` vocabulary and SENSITIVE_REFERENCE type compatibility are closed
Refines VAR-21.

The frozen `valueClass` vocabulary is exactly:
- `PLAIN`;
- `SENSITIVE_REFERENCE`.

`PLAIN` is the default.

`SENSITIVE_REFERENCE` is valid only for variables whose declared type is `STRING` or `ENUM`. BOOLEAN and INTEGER declarations cannot use `SENSITIVE_REFERENCE` because their canonical values are not reference identifiers.

A `SENSITIVE_REFERENCE` value remains a non-secret opaque reference identifier. It is never dereferenced by M07, never valid in `TARGET_PATH_SEGMENT`, and never equivalent to secret material or authorization. Actual secret material remains prohibited by VAR-22.

## Proof delta
Future M07 implementation proof must additionally demonstrate:
1. INTEGER resolution depends on typed safe-integer semantics rather than JSON lexical token spelling;
2. negative zero canonicalizes to zero;
3. target-path values reject `< > " | ? *` and DEL/control characters;
4. Windows reserved device stems are rejected with extensions/suffixes and case variation;
5. SENSITIVE_REFERENCE is rejected for BOOLEAN/INTEGER declarations;
6. unknown `valueClass` fails closed.

## Freeze verdict
These corrections remove three implementation ambiguities without reopening S01 or expanding S02 scope. They do not alter production credit, do not authorize implementation, and preserve the next legal session as `GBS-M07-S03 — Conditional Templates` after exact-head approval and checkpoint promotion.

STOP CONDITION: `M07_S02_FREEZE_CORRECTIONS_BOUND_TO_EXACT_HEAD`.
