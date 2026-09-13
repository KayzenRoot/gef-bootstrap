# GBS-M07-S05 — Validation

Status: `FROZEN`

## Purpose
Freeze complete, side-effect-free validation of the M07 RenderSnapshot before any artifact can become input to M05 transaction planning. S05 validates final logical targets, artifact completeness, cross-entry conflicts, render integrity and bounded readiness while preserving M05/M06 as the only owners of current-state mutation and physical path authority.

## Ownership
S05 OWNS RenderSnapshot consistency, final portable logical-target validation, complete artifact-set accounting, target/case/prefix collision detection, render-product integrity checks, compact validation evidence and the desired-artifact handoff to M05 planning.

S05 DOES NOT OWN parsing (S01), variable resolution (S02), conditions (S03), rendering (S04), existing-project occupancy/ownership, overwrite decisions, physical paths, filesystem effects, transaction apply, process execution or provider/Git mutation.

## Frozen contract

### VAL-01 — Validation consumes one complete compatible RenderSnapshot
S05 validates a complete S04 snapshot bound to the same S01/S02/S03 semantics. Partial, stale, mixed-version or incompatible snapshots block.

S05 never repairs/re-renders inputs silently.

### VAL-02 — Artifact accounting is exact
Every admitted S01 TemplateEntry must correspond to exactly one S04 render artifact with the same stable `entryId` and compatible kind.

Missing, duplicate, unknown or extra render artifacts fail closed. Artifact array order is non-semantic.

### VAL-03 — Final logical targets are validated after all substitutions
Each rendered `logicalTarget` must be a non-empty portable relative file target using `/` separators.

The final target must reject:
- absolute paths;
- drive, UNC, device or URI namespaces;
- backslashes;
- NUL/control characters;
- empty, `.` or `..` components;
- components not in Unicode NFC;
- `<`, `>`, `"`, `:`, `|`, `?`, `*`;
- leading/trailing component whitespace;
- components ending in dot or space;
- Windows reserved device stems (`CON`, `PRN`, `AUX`, `NUL`, `COM1`-`COM9`, `LPT1`-`LPT9`) case-insensitively, including extension/suffix forms;
- trailing `/`.

Finite component/total-byte budgets apply. S05 never sanitizes an invalid target into acceptance.

### VAL-04 — Logical validation is not physical path authorization
A S05-valid target is only a portable logical target. S05 does not join it to cwd/repository root, resolve symlinks, inspect filesystem occupancy or grant M06 authority.

M06 must still authorize the actual physical target during governed planning/apply.

### VAL-05 — Exact duplicate targets always conflict
Two different TemplateEntries rendering the same final logical target are a validation conflict even when their content bytes/digests are identical.

S05 never deduplicates, merges or chooses a winner by entry order.

### VAL-06 — Portable case-alias conflicts fail closed
S05 rejects target pairs that differ only by ASCII case after NFC component validation, such as `Readme.md` vs `README.md`.

This is a portable baseline, not a claim that every platform-specific Unicode/case alias is modeled. M06/M51 remain responsible for actual platform alias/case semantics and may block additional collisions.

### VAL-07 — File ancestor/descendant collisions fail closed
Because M07 entries represent file artifacts, two rendered targets conflict when one complete file target is a path-component ancestor of another, such as `config` and `config/app.json`.

Implicit directory creation for a descendant cannot convert another declared file artifact into a directory.

### VAL-08 — Collision checks use canonical target keys, not host filesystem behavior
S05 computes deterministic logical collision keys from validated target components. It does not call host `realpath`, case APIs or directory enumeration.

Validation outcomes therefore do not depend on the machine running S05.

### VAL-09 — Render integrity must remain bound
S05 requires each artifact target/content digest and byte length to remain consistent with the immutable S04 render product.

An in-process immutable render product may reuse S04's exact digest/length proof without rereading the full body. A deserialized/untrusted render product must re-establish integrity before being admitted. S05 must never accept bytes that can differ from the digest/length it forwards.

### VAL-10 — Digest equality is not trust
Render/validation digests prove equality/correlation under the versioned digest contract only. They do not prove authorship, trust, safety, authorization or write permission.

Global integrity policy remains M37-owned.

### VAL-11 — Content type does not create execution semantics
TEXT_TEMPLATE and BINARY_COPY outputs remain data. S05 does not infer executable authority, hooks, scripts, MIME behavior or permission mutations from filenames or bytes.

A generated script-like file may still be a data artifact; any later execution requires its own governed capability.

### VAL-12 — Template absence never means delete
S05 emits desired artifacts only for entries present in the validated template result.

Files absent from the template are not deletion candidates. S05 never scans the repository for “obsolete” files and never generates remove/move intents by omission.

A future deletion feature requires a separate explicit versioned contract.

### VAL-13 — Template target does not imply ownership or overwrite permission
A valid desired target does not establish that an existing project file is GEF-managed or safe to replace.

S05 may carry origin metadata such as template/entry identity, but M05/M06 must independently determine current state, ownership, no-op/create/update/conflict, recovery and authorization.

### VAL-14 — S05 handoff is desired-state input, not a mutation plan
A successful S05 result provides a canonical desired-artifact set containing logical target, exact content identity/length and immutable content reference.

M05 separately compiles transaction intents against actual project state. S05 never emits target writes directly and never marks an artifact `CREATE`/`UPDATE` merely from template intent.

### VAL-15 — Readiness vocabulary is explicit
S05 result state is one of:
- `VALIDATED_FOR_EFFECT_PLANNING`;
- `BLOCKED`;
- `INDETERMINATE`.

`VALIDATED_FOR_EFFECT_PLANNING` means only that the M07 artifact set is internally valid and may be submitted to downstream M05/M06 planning. It never means ready-to-apply.

`INDETERMINATE` is used only when a mandatory validation fact cannot be established without falsely guessing. Facts deliberately owned by M05/M06, such as current filesystem occupancy, are downstream requirements rather than S05 indeterminacy.

### VAL-16 — Validation identity is deterministic
S05 produces a `templateValidationDigest` binding at least:
- renderSnapshotDigest;
- validation-contract version;
- versioned logical-target/collision policy refs;
- canonical artifact target/content identities;
- validation outcome and outcome-relevant gaps.

It excludes timestamps, random/run IDs, local absolute paths and telemetry.

### VAL-17 — Evidence is compact and body-minimized
Normal validation evidence may contain entry IDs, logical targets/keys, content digests, lengths, collision/gap categories and downstream requirements.

It does not copy rendered bodies/binary payloads merely to prove validation. Sensitive/local material remains governed by the frozen evidence/security contracts.

### VAL-18 — S05 is S0 read-only, bounded and cancellable
S05 performs no repository scan, target read/write, directory creation, staging/recovery, Git/provider mutation, process execution or network fetch.

Finite budgets cover artifact count, logical-target bytes/components, collision-index size, integrity metadata and evidence. Cancellation/deadline yields no valid partial validation snapshot and no target effect.

### VAL-19 — Brownfield preservation is structural
Validation is limited to the exact rendered artifact set. Unrelated existing files are not inspected, normalized or considered obsolete.

This preserves existing projects and prevents greenfield-template shape from becoming cleanup authority.

### VAL-20 — S05 success cannot bypass downstream gates
`VALIDATED_FOR_EFFECT_PLANNING` proves internal M07 coherence only. M05 must still build/revalidate a transaction plan and M06 must still prove physical path/overwrite/link/atomic safety before any effect.

## Logical result

```text
TemplateValidationSnapshot {
  validationContractVersion
  renderSnapshotDigest
  outcome
  artifacts[] {
    entryId
    kind
    logicalTarget
    targetCollisionKey
    renderedTargetDigest
    renderedContentDigest
    byteLength
    contentRef
  }
  downstreamRequirements[]
  templateValidationDigest
  gaps[]
}
```

`contentRef` references the immutable snapshot-safe S04 render content; it is not a filesystem target path or authorization token.

## Deterministic lifecycle

`BIND RENDER SNAPSHOT → VERIFY SNAPSHOT/ARTIFACT ACCOUNTING → VALIDATE FINAL LOGICAL TARGETS → BUILD COLLISION INDEX → CHECK EXACT/CASE/PREFIX COLLISIONS → VERIFY RENDER INTEGRITY BINDING → CANONICALIZE DESIRED ARTIFACTS → COMPUTE VALIDATION DIGEST → EMIT SNAPSHOT`

## Frozen decisions
1. S05 validates the complete RenderSnapshot, not partial outputs;
2. one exact render product per S01 entry;
3. final logical paths are validated after substitution;
4. invalid targets are never sanitized;
5. logical validity is not M06 physical authority;
6. duplicate targets conflict even with identical content;
7. ASCII case aliases conflict as a portable baseline;
8. file ancestor/descendant targets conflict;
9. render content must remain bound to digest/length;
10. digest equality is not trust;
11. output bytes/filenames do not create execution authority;
12. absence from template never means deletion;
13. target declaration never proves ownership/overwrite permission;
14. S05 emits desired state, not M05 mutation intents;
15. success means validated-for-planning, never ready-to-apply;
16. S05 is read-only, bounded, cancellable and brownfield-preserving;
17. M05/M06 remain mandatory effect gates.

## Proof contract
Minimum future implementation proof families are frozen in companion `S05-PROOF.md`.

## Handoff
S05 completes M07 planning. After exact-head approval and checkpoint promotion, the next legal stage is the **M07 Module Gate**. No M07 Work Order or implementation is admitted until that gate separately approves planning readiness and the Work Order is compiled/reviewed/admitted.

No production credit is earned by S05 planning.

STOP CONDITION: `M07_S05_VALIDATION_FROZEN`.
