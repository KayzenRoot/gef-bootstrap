# GBS-M02-S05 — Versioning & Migration

Status: `IN_DISCUSSION`

## Purpose
Freeze how GEF configuration contracts evolve across product versions without silently changing project intent, corrupting brownfield repositories or forcing perpetual backward compatibility.

Versioning must make compatibility mechanically decidable where possible. Migration must be explicit, previewable, bounded, evidence-producing and recoverable.

## Binding sources
- M02-S01 Global Configuration
- M02-S02 Project Configuration
- M02-S03 Schemas
- M02-S04 Defaults
- frozen Architecture, Security, DoD and Deployment
- M05/M06 future transaction/recovery ownership

## Ownership boundary
M02-S05 OWNS:
- configuration contract version semantics;
- supported reader/writer compatibility policy;
- migration graph and step identity;
- migration preview/apply contract;
- idempotency and evidence requirements;
- compatibility diagnostics;
- treatment of default changes during migration.

M02-S05 DOES NOT OWN:
- generic product/package SemVer release policy (M33/M49/M50);
- filesystem transaction implementation (M05/M06);
- project identity evolution (M03);
- provider migrations;
- semantic project decisions such as Scope/Architecture/DoD.

## Candidate versioning contract

### VM-01 — Document contract version is explicit
Every persisted M02 configuration document carries an explicit machine-readable contract version. Schema identity and document contract version are related but not conflated.

The reader never infers version solely from filename, product package version or missing/unknown fields.

### VM-02 — Compatibility is a declared relation
For a given reader, each input document version is classified deterministically as one of:
- `NATIVE` — directly supported with no migration;
- `MIGRATABLE` — supported through a known migration path;
- `READ_ONLY_COMPATIBLE` — may be inspected safely but not rewritten by this reader;
- `TOO_NEW` — produced by a newer incompatible contract;
- `TOO_OLD_UNSUPPORTED` — no admitted migration path;
- `INVALID_OR_AMBIGUOUS` — version identity cannot be trusted.

Unknown/incompatible versions never fall back to best-effort parsing that could reinterpret security-relevant fields.

### VM-03 — Migrations form an explicit directed graph
Migration steps have stable IDs and declared `fromVersion -> toVersion` edges. The migration planner computes a deterministic path from the current version to a supported target.

Rules:
- no hidden multi-version jump unless it is itself a registered tested migration edge;
- duplicate/ambiguous edges fail closed;
- cycles in admitted migration graph fail build/registry validation;
- path choice must be deterministic;
- every step names its owning module and affected field families.

### VM-04 — Preview before apply
Migration is two-phase at the application level:

`INSPECT -> PLAN/PREVIEW -> AUTHORIZE_IF_REQUIRED -> APPLY_TRANSACTIONALLY -> VALIDATE_TARGET -> RECEIPT`

Preview exposes at least:
- source/target contract versions;
- selected migration step IDs;
- files/fields affected;
- semantic/default-related behavior changes;
- risk/security classification;
- whether explicit user/project decisions are required;
- recovery limitations.

Preview never mutates the repository.

### VM-05 — Migration preserves explicit intent
A migration must distinguish explicit persisted values from inherited defaults/provenance.

It MUST NOT replace an explicit value with a new product default merely because the old value matched the old default.

When a field is renamed/transformed, provenance and explicitness are carried forward whenever semantics remain equivalent.

### VM-06 — Default changes are not silently materialized
When product defaults change between catalogue versions, migration does not automatically write the new defaults into project/global config.

For omitted fields, the upgraded product may resolve to the new default according to S04 compatibility policy. Behavior-changing default deltas must be surfaced in migration/upgrade diagnostics and release evidence.

For explicit fields, the explicit value remains authoritative if valid under the new policy.

### VM-07 — Migrations are idempotent by target state
Re-running a completed migration against the already-migrated exact target must not duplicate changes or drift state.

Each migration step declares an idempotency contract and pre/post predicates. If source state no longer matches the expected fingerprint/predicate, execution blocks for replanning rather than guessing.

### VM-08 — Exact-state binding and transactional safety
Migration apply binds to the exact source document/repository fingerprints used by preview. If relevant inputs drift, preview becomes stale.

Filesystem mutation and rollback/recovery are delegated to M05/M06. S05 requires that migration application cannot claim success until target schema/policy validation passes and a receipt exists.

### VM-09 — No destructive downgrade by default
Backward migration/downgrade is not assumed to be safe or universally supported.

A reverse edge exists only when explicitly designed and tested. Where lossless downgrade is impossible, the system reports `DOWNGRADE_UNSUPPORTED` or requires an explicit lossy/export path owned by a future contract.

### VM-10 — Unknown future fields are not invented away
A reader facing a newer incompatible document cannot migrate it backward by dropping unknown fields unless a specifically admitted downgrade/export contract proves this is safe.

Preserved inert extension payloads follow S01-S03 capability rules and remain preserved when the migration contract guarantees round-trip safety.

### VM-11 — Security corrections may force migration/block
A security/assurance correction may make an older config version unacceptable for mutation even if it is syntactically readable. The compatibility classification may require migration or block execution until the safer contract is adopted.

No compatibility promise can override frozen security floors.

### VM-12 — Migration receipts are machine-addressable
A successful migration emits a compact immutable receipt containing at least:
- migration plan/step IDs;
- source/target versions;
- pre/post fingerprints;
- changed paths summary;
- validation results/evidence refs;
- default catalogue before/after fingerprints where relevant;
- warnings/accepted gaps if policy permits;
- recovery reference/limitations.

Receipts must be sufficient for later checkpoint/review invalidation without rereading the whole migration history.

### VM-13 — Version adapters are explicit
When a runtime/API consumes multiple supported contract versions, any coercion between them is implemented as an explicit version adapter with tests. Automatic loose coercion is prohibited.

### VM-14 — Token/latency economy
Versioning reduces recurring model cost through:
- compact compatibility classification;
- deterministic migration path selection;
- source/target/default-catalog fingerprints;
- migration deltas instead of whole-document rereads;
- explicit stale-plan detection;
- reusable migration receipts;
- no LLM reasoning for mechanical version-path discovery.

## Candidate compatibility metadata
Conceptual only:

```text
ContractCompatibility
  artifactId
  readerContractVersion
  supportedNativeVersions[]
  migratableVersions[]
  readOnlyVersions[]
  migrationGraphFingerprint

MigrationStep
  id
  ownerModule
  fromVersion
  toVersion
  affectedPaths[]
  riskClass
  idempotencyContract
  defaultCatalogImpact?
```

## Security/reliability invariants
1. Too-new or ambiguous contracts fail closed for mutation.
2. Migration plans bind to exact source state.
3. Explicit intent is never replaced by a changed default accidentally.
4. Successful migration requires target validation.
5. Downgrade is opt-in per explicit reverse edge, never presumed.
6. Migration cannot waive security/assurance floors.
7. Unknown future data is not silently deleted.
8. Recovery limitations are declared before risky apply.

## Future implementation proof
Eventually prove:
- native/migratable/too-new/too-old classification;
- deterministic migration graph/path;
- cycle/ambiguity rejection;
- preview is mutation-free;
- stale source fingerprint blocks apply;
- explicit old-default value preservation;
- omitted-field default evolution behavior;
- migration idempotency;
- target schema/policy validation;
- extension preservation where promised;
- downgrade unsupported behavior;
- compact migration receipt/fingerprint validity.

## Open decisions before freeze
1. Use simple monotonically increasing integer contract versions per artifact, SemVer-like versions, or MAJOR.MINOR contract versions?
2. How much historical compatibility must production guarantee: all prior released config majors, current + previous major, or policy-owned support window?
3. May safe metadata-only migrations auto-apply, or must every persisted-config migration require an explicit apply action after preview?
4. Should migration graph/compatibility metadata have its own deterministic fingerprint independent from product/default/schema fingerprints?
5. When an omitted field's product default changes behavior across an upgrade, should the upgrade require explicit acknowledgement for ELEVATED/HIGH_ASSURANCE impacts even though no config bytes change?

## Session completion rule
S05 may freeze only after these five decisions are resolved and exact-head review confirms consistency with S01-S04, Security and M05/M06 transaction ownership.

STOP CONDITION: `VERSIONING_MIGRATION_DECISIONS_REQUIRED`.
