# GBS-M07-S04 — Rendering Freeze Hardening

Status: `NORMATIVE_FREEZE_CORRECTIONS`

This companion is part of frozen M07-S04 planning. Where it refines `S04-rendering.md`, this file prevails.

## H1 — Render content representation is snapshot-safe
The `content` field/handle in the conceptual RenderSnapshot must represent the exact bytes whose `renderedContentDigest` and `byteLength` were computed.

An implementation may use an immutable bounded byte container or a streaming/content representation, but it MUST NOT defer hidden filesystem, network, provider, environment or mutable-template reads until later S05/M05 consumption.

If streaming is used, the stream must be bound to the exact admitted S01/S02/S03 inputs and must preserve exact bytes deterministically. A later consumer cannot receive different bytes while retaining the original digest/length identity.

This prevents a time-of-check/time-of-use gap inside the render product itself.

## H2 — Digest equality is not trust or authorization
`renderedTargetDigest`, `renderedContentDigest`, `renderSnapshotDigest` and any evidence digest prove equality/correlation only under the selected versioned digest contract.

They do not prove authorship, trust, safety, filesystem authority, authorization or successful apply. Global digest/integrity policy remains M37-owned; S05/M05/M06 remain required downstream gates.

## H3 — No implicit syntax escaping
RND-04 inserts the S02 canonical textual projection as data. S04 does not infer JSON, YAML, TOML, shell, SQL, HTML, JavaScript or other language escaping from file extension, target name or surrounding text.

The only post-substitution text transformation owned by S04 is the explicitly selected line-ending policy in RND-08.

## Proof delta
Future implementation proof must additionally show:
1. a render content representation cannot change bytes after its digest/length are fixed;
2. lazy/streaming implementations do not re-read mutable source state after snapshot creation;
3. digest equality is never treated as trust or write authorization;
4. file extension/content shape does not trigger implicit language-specific escaping.

No implementation or production credit is admitted.

STOP CONDITION: `M07_S04_FREEZE_HARDENING_BOUND_TO_EXACT_HEAD`.
