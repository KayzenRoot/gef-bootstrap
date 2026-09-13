# GBS-M07-S04 — Rendering

Status: `FROZEN`

## Purpose
Freeze deterministic, side-effect-free byte rendering for M07. S04 consumes frozen S01 format, the immutable S02 variable snapshot and frozen S03 selected structures, then produces exact logical targets, exact rendered bytes/content identities and a compact render snapshot for S05.

S04 does not validate cross-entry target conflicts, authorize paths or write files.

## Ownership
S04 OWNS variable insertion, `literal-open`, TEXT_TEMPLATE byte materialization, line-ending transformation, BINARY_COPY passthrough, targetPattern substitution, rendered content/target identities, bounded output production and compact render evidence.

S04 DOES NOT OWN template syntax (S01), variable resolution (S02), branch selection (S03), complete rendered-template validation (S05), filesystem/transaction effects (M05/M06), process execution, profile selection or Git/provider mutation.

## Frozen contract

### RND-01 — Rendering is a pure deterministic transformation
For identical compatible S01/S02/S03 inputs and the same rendering-contract version, S04 must produce identical logical targets, byte sequences and digests independent of OS locale, cwd, clock, random state, scheduling or machine path.

### RND-02 — Input compatibility is exact
S04 accepts only mutually compatible inputs bound to the same template semantic identity. A stale/mismatched S02 value snapshot or S03 conditional snapshot blocks rather than being silently re-resolved or re-evaluated.

### RND-03 — Rendering is single-pass
TEXT_TEMPLATE rendering consumes the S03 selected token/span structure once, left-to-right. Variable output is inserted as data and is never re-lexed as M07 marker syntax.

A value containing marker-looking text remains literal output data.

### RND-04 — Selected variable markers use S02 canonical projections
A selected `var` marker is replaced by the exact S02 canonical textual projection:
- STRING: admitted text;
- BOOLEAN: `true` or `false`;
- INTEGER: canonical base-10 projection;
- ENUM: exact selected member.

A selected variable that is undeclared, context-invalid or `UNBOUND_OPTIONAL` blocks rendering. A variable marker inside an S03-inactive span requires no runtime value for that render.

### RND-05 — `literal-open` has one exact output
The S01 `literal-open` control marker renders exactly the reserved introducer text `{{gef:`.

The produced bytes are not re-tokenized. Therefore source text that intentionally constructs marker-looking output through `literal-open` remains literal output.

### RND-06 — Condition control markers never render
S03 `if`/`else`/`end` control markers are selection metadata and emit no bytes. S04 performs no whitespace trimming, indentation normalization or newline chomping around their locations.

### RND-07 — TEXT_TEMPLATE rendering order is fixed
The canonical logical order is:

`S03 selected structure → literal spans + variable/literal-open substitution → logical Unicode text → line-ending policy → UTF-8 bytes → content digest`.

No additional text transform is implied.

### RND-08 — Line-ending policy applies to the complete logical text
For TEXT_TEMPLATE:
- `PRESERVE_SOURCE`: preserves admitted newline sequences in both source literals and inserted variable projections;
- `LF`: canonicalizes CRLF, lone CR and lone LF logical line breaks to LF;
- `CRLF`: canonicalizes CRLF, lone CR and lone LF logical line breaks to CRLF.

The policy applies after substitution, so inserted STRING line breaks follow the explicit entry policy. Unicode line-separator characters other than CR/LF are ordinary text and are not rewritten by this contract.

There is no host-native/default line-ending mode.

### RND-09 — UTF-8 output is deterministic and no BOM is synthesized
TEXT_TEMPLATE output is encoded as UTF-8. S04 never inserts a BOM automatically and performs no Unicode normalization, locale transformation or hidden encoding conversion.

### RND-10 — BINARY_COPY is byte-exact
BINARY_COPY output bytes equal the admitted S01 source bytes exactly. No marker scan, interpolation, line-ending transformation, Unicode decoding or content rewrite occurs.

Its targetPattern may still require S02 target-variable substitution under RND-11.

### RND-11 — targetPattern rendering is logical substitution only
S04 replaces only admitted S02 variable markers in `targetPattern` with their already validated canonical path-segment projections.

S04 does not sanitize, URL-encode, case-fold, normalize separators, resolve absolute paths, join with cwd/root, infer extensions or grant write authority.

The rendered result remains a logical target string for S05. M06 later owns physical path authority.

### RND-12 — Rendering does not resolve target conflicts
S04 may produce two artifacts whose rendered logical targets collide. It must preserve them as distinct render products and allow S05 to detect/block cross-entry conflicts.

S04 does not use last-write-wins or entry order to resolve collisions.

### RND-13 — Every entry still yields a render product
Because S03 never suppresses TemplateEntry existence, each admitted entry produces one render product unless S04 blocks.

A TEXT_TEMPLATE whose selected content is empty renders a zero-length content payload, not an omitted artifact.

### RND-14 — Output identities are exact and separated from provenance
Each rendered artifact has at least:
- `renderedTargetDigest` over the exact logical target representation under the rendering contract;
- `renderedContentDigest` over exact final output bytes;
- exact rendered byte length.

S04 also produces a deterministic `renderSnapshotDigest` binding template semantic identity, S02 value identity, S03 decision identity, rendering-contract version and canonical artifact target/content identities.

A separate evidence identity may include sanitized provenance such as the S02 resolution identity. Output identity must not change merely because the same values came from different admitted provenance.

### RND-15 — Evidence and render product are distinct
The operational render product may contain or expose bounded rendered bytes/content handles needed by S05/M05 planning. Normal evidence/receipts should contain target refs, lengths, digests and bounded summaries rather than copying file bodies or binary payloads.

Rendered content is not automatically safe to log simply because it is template output.

### RND-16 — Rendering is S0 read-only
S04 does not create target files/directories, staging/recovery data, temp files, Git/provider mutations or process executions. It does not call M06 write primitives.

All filesystem effects remain behind later S05/M05/M06 gates.

### RND-17 — Output production is bounded and cancellable
Finite budgets cover per-entry and aggregate rendered bytes, artifact count, substitution count and evidence size. S04 must account for possible line-ending expansion before/while allocating output and fail closed when the admitted budget would be exceeded.

Cancellation/deadline yields no valid partial render snapshot and no target effect.

### RND-18 — Rendering success is not validation or apply authorization
A successful S04 result proves deterministic bytes/targets for the frozen inputs. It does not prove target uniqueness, complete logical path validity, filesystem safety, authorization or transaction success.

S05/M05/M06 remain mandatory.

## Logical result

```text
RenderSnapshot {
  renderContractVersion
  templateSemanticDigest
  variableValueDigest
  conditionalDecisionDigest
  artifacts[] {
    entryId
    kind
    logicalTarget
    renderedTargetDigest
    renderedContentDigest
    byteLength
    content
  }
  renderSnapshotDigest
  evidenceDigest?
  gaps[]
}
```

`content` is a bounded implementation-level render product or equivalent immutable content handle. It is not evidence and not a filesystem path.

## Deterministic lifecycle

`BIND S01/S02/S03 → RENDER TARGET PATTERNS → WALK SELECTED TEXT/BINARY INPUTS → SUBSTITUTE VALUES/LITERAL-OPEN → APPLY TEXT LINE POLICY → ENCODE UTF-8 OR COPY BINARY → DIGEST ARTIFACTS → CANONICALIZE ARTIFACT ORDER → EMIT SNAPSHOT`

Artifact array order is non-semantic and canonicalized by stable entry identity for snapshot hashing/evidence.

## Frozen decisions
1. rendering is pure and single-pass;
2. selected values use S02 canonical projections;
3. variable-produced marker text is never re-evaluated;
4. `literal-open` emits exact `{{gef:`;
5. condition markers emit no bytes and cause no whitespace magic;
6. line-ending policy runs after substitution across complete logical text;
7. no host-native line endings;
8. TEXT output is UTF-8 with no synthesized BOM;
9. BINARY_COPY is byte-exact;
10. target rendering is logical substitution only;
11. S04 never resolves cross-entry collisions;
12. empty selected text still yields a zero-length artifact;
13. output identity is separated from provenance identity;
14. evidence is body-minimized;
15. S04 is S0 read-only, bounded and cancellable;
16. S04 cannot bypass S05/M05/M06.

## Proof contract
The minimum future implementation proof families are frozen in companion `S04-PROOF.md`.

## Handoff
Next legal planning session after exact-head approval/checkpoint promotion: `GBS-M07-S05 — Validation`. S05 must validate the complete rendered artifact set, including final logical targets, cross-entry collisions, output constraints and readiness for governed M05/M06 planning, without performing effects itself.

No M07 implementation or production credit is admitted.

STOP CONDITION: `M07_S04_RENDERING_FROZEN`.
